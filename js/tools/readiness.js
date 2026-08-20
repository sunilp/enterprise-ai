/* =============================================================================
   readiness.js -- Readiness Diagnostic: 25 questions, D3 radar, board scorecard
   The Enterprise AI Operating System -- sunilprakash.com/enterprise-ai
   Built on js/core/tool.js (window.Tool). Hash format #results=<base64> kept
   so shared links from the previous version still resolve.
   ============================================================================= */

(function () {
  'use strict';

  var T = window.Tool;
  var el = T.el;
  var STORAGE_KEY = 'obsidian_engagement';
  var PROGRESS_KEY = 'assessmentProgress';
  var HASH_KEY = 'results';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Dimension & Question Data ---------------------------------------------

  var DIMENSIONS = [
    {
      name: 'Data Readiness',
      key: 'data',
      questions: [
        'Our data quality is systematically measured and managed across AI-relevant datasets',
        'Data is accessible to AI workloads through well-documented APIs and catalogs',
        'Data governance policies cover AI-specific concerns including training data, model inputs, and outputs',
        'Data lineage is tracked from source through transformation to AI model consumption',
        'We have a deliberate program to make data AI-ready, beyond general data management',
      ],
    },
    {
      name: 'Process Readiness',
      key: 'process',
      questions: [
        'Business workflows are documented with enough detail to identify AI augmentation opportunities',
        'Key processes are standardized across business units and geographies',
        'Exception handling paths are defined and measured in processes targeted for AI',
        'Measurement baselines exist for processes before AI deployment begins',
        'The organization has demonstrated capacity to absorb process changes at scale',
      ],
    },
    {
      name: 'Talent Readiness',
      key: 'talent',
      questions: [
        'Senior leadership can articulate what AI can and cannot do for the business',
        'AI specialists are available at the scale needed, through hiring or partnerships',
        'Structured reskilling programs exist for roles that will change due to AI',
        'Cross-functional teams can form and execute AI initiatives without structural barriers',
        'Middle management is equipped to supervise AI-augmented workflows',
      ],
    },
    {
      name: 'Governance Readiness',
      key: 'governance',
      questions: [
        'An AI governance policy framework exists with specific, enforceable rules',
        'AI systems are classified by risk level with differentiated governance requirements',
        'Approval workflows for AI deployment are tiered by risk and operate within days, not weeks',
        'An incident response playbook exists specifically for AI system failures',
        'Regulatory obligations across all operating jurisdictions are mapped and tracked',
      ],
    },
    {
      name: 'Organizational Maturity',
      key: 'org',
      questions: [
        'A senior leader with explicit authority over AI strategy and governance is in place',
        'Decision rights for AI investment, deployment, and shutdown are documented and followed',
        'Cross-functional coordination on AI happens through standing mechanisms, not ad-hoc meetings',
        'The AI portfolio is managed with the same rigor as capital investment',
        'Executive sponsorship for AI transformation is active, not ceremonial',
      ],
    },
  ];

  var SCALE_LABELS = [
    '', // index 0 unused
    'Not started',
    'Early / Ad-hoc',
    'Developing',
    'Established',
    'Optimized',
  ];

  var TIERS = [
    null, // index 0 unused
    { name: 'Foundational', desc: 'Your organization needs to build the basics before AI can deliver' },
    { name: 'Developing', desc: 'The foundation is emerging but gaps will block scaling' },
    { name: 'Established', desc: 'Your organization is ready to scale with targeted improvements' },
    { name: 'Optimized', desc: 'Your organization has the operating system for enterprise AI' },
  ];

  // Recommended reading per dimension (keyed by dimension key)
  var READING_PATHS = {
    data: [
      { label: 'Data Readiness', path: 'assessment/data-readiness' },
      { label: 'Capability Stack', path: 'architecture/capability-stack' },
    ],
    process: [
      { label: 'Pilot to Production', path: 'portfolio/pilot-to-production' },
      { label: '12-Month Roadmap', path: 'transformation/roadmap' },
    ],
    talent: [
      { label: 'Role Evolution', path: 'workforce/role-evolution' },
      { label: 'Knowledge Architecture', path: 'workforce/knowledge-architecture' },
    ],
    governance: [
      { label: 'Governance Architecture', path: 'governance/architecture' },
      { label: 'Regulatory Readiness', path: 'governance/regulatory-readiness' },
    ],
    org: [
      { label: 'CAIO Mandate', path: 'operating-model/caio-mandate' },
      { label: 'Decision Rights', path: 'operating-model/decision-rights' },
      { label: 'Operating Architecture', path: 'architecture/operating-architecture' },
    ],
  };

  var TOTAL_QUESTIONS = 25;

  // --- State -----------------------------------------------------------------

  var appEl = null;
  var keepFocus = false;
  var answers = [];
  var currentQ = 0;
  var advanceTimer = null;

  // --- Storage ---------------------------------------------------------------

  function loadEngagement() { try { var raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (e) {} return {}; }
  function saveEngagement(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) {} }
  function loadProgress() { var eng = loadEngagement(); return eng[PROGRESS_KEY] || null; }
  function saveProgress() { var eng = loadEngagement(); eng[PROGRESS_KEY] = { currentQuestion: currentQ, answers: answers.slice() }; saveEngagement(eng); }
  function saveResults(dimScores, overall, tierNum) {
    var eng = loadEngagement();
    eng.assessmentCompleted = true;
    eng.assessmentResults = { scores: dimScores, overall: overall, tier: tierNum, date: new Date().toISOString() };
    saveEngagement(eng);
  }
  function clearProgress() {
    var eng = loadEngagement();
    if (eng.assessmentResults) { if (!eng.assessmentHistory) eng.assessmentHistory = []; eng.assessmentHistory.push(eng.assessmentResults); }
    delete eng[PROGRESS_KEY];
    eng.assessmentCompleted = false;
    eng.assessmentResults = null;
    saveEngagement(eng);
  }

  // --- Scoring ---------------------------------------------------------------

  function computeScores() {
    var dimScores = [];
    for (var d = 0; d < DIMENSIONS.length; d++) {
      var sum = 0;
      for (var q = 0; q < 5; q++) sum += answers[d * 5 + q] || 0;
      dimScores.push(Math.round((sum / 5) * 10) / 10);
    }
    var overallSum = 0;
    for (var i = 0; i < dimScores.length; i++) overallSum += dimScores[i];
    var overall = Math.round((overallSum / dimScores.length) * 10) / 10;
    var tierNum = overall <= 2.0 ? 1 : overall <= 3.0 ? 2 : overall <= 4.0 ? 3 : 4;
    return { dimScores: dimScores, overall: overall, tierNum: tierNum };
  }

  function shareUrl() {
    return window.location.origin + T.basePath() + '/assessment/tool/#' + HASH_KEY + '=' + T.encode(answers);
  }

  function clearApp() { if (appEl) appEl.innerHTML = ''; }

  // --- Question phase --------------------------------------------------------

  function renderQuestion() {
    clearApp();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    var dimIndex = Math.floor(currentQ / 5);
    var dim = DIMENSIONS[dimIndex];
    var text = dim.questions[currentQ % 5];
    var answered = answers.filter(function (a) { return a > 0; }).length;

    var prog = el('div', 'q-progress');
    prog.appendChild(el('span', '', 'Question ' + (currentQ + 1) + ' of ' + TOTAL_QUESTIONS));
    prog.appendChild(el('span', '', answered + ' answered'));
    appEl.appendChild(prog);
    var bar = el('div', 'q-bar'); var fill = el('span'); fill.style.width = ((answered / TOTAL_QUESTIONS) * 100) + '%'; bar.appendChild(fill); appEl.appendChild(bar);

    var card = el('div', 'q-card');
    card.appendChild(el('div', 'q-dim', dim.name));
    card.appendChild(el('div', 'q-num', 'Dimension ' + (dimIndex + 1) + ' of ' + DIMENSIONS.length));
    card.appendChild(el('p', 'q-text', text));

    var scale = el('div', 'q-scale');
    scale.setAttribute('role', 'radiogroup');
    scale.setAttribute('aria-label', 'How true is this statement for your organization');
    for (var r = 1; r <= 5; r++) {
      (function (rating) {
        var b = el('button', '');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        var checked = answers[currentQ] === rating;
        b.setAttribute('aria-checked', checked ? 'true' : 'false');
        // Roving tabindex: the group is one tab stop, arrows move within it.
        b.setAttribute('tabindex', (checked || (!answers[currentQ] && rating === 1)) ? '0' : '-1');
        b.addEventListener('keydown', function (e) {
          var move = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
          if (!move) return;
          e.preventDefault();
          e.stopPropagation();
          var next = Math.min(5, Math.max(1, rating + move));
          var target = scale.children[next - 1];
          if (target) { target.focus(); selectRating(next); }
        });
        b.appendChild(el('span', 'k', String(rating)));
        b.appendChild(document.createTextNode(SCALE_LABELS[rating]));
        b.addEventListener('click', function () { selectRating(rating); });
        scale.appendChild(b);
      })(r);
    }
    card.appendChild(scale);
    appEl.appendChild(card);

    var nav = el('div', 'q-nav');
    if (currentQ > 0) {
      var back = el('button', '', 'Back'); back.type = 'button';
      back.addEventListener('click', function () { currentQ--; saveProgress(); renderQuestion(); });
      nav.appendChild(back);
    }
    if (answers[currentQ] > 0 && currentQ < TOTAL_QUESTIONS - 1) {
      var next = el('button', '', 'Next'); next.type = 'button';
      next.addEventListener('click', function () { currentQ++; saveProgress(); renderQuestion(); });
      nav.appendChild(next);
    }
    appEl.appendChild(nav);
    appEl.appendChild(el('p', 'q-hint', 'Keys 1 to 5 answer. Arrow keys move between ratings. Progress is saved in this browser.'));
    if (keepFocus) {
      var active = scale.querySelector('[tabindex="0"]');
      if (active) active.focus();
    }
    keepFocus = false;
  }

  function selectRating(rating) {
    keepFocus = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('role') === 'radio';
    var first = currentQ === 0 && answers[0] === 0;
    answers[currentQ] = rating;
    saveProgress();
    if (first) T.fireEvent('assessment_started');
    renderQuestion();
    if (advanceTimer) clearTimeout(advanceTimer);
    advanceTimer = setTimeout(function () {
      if (currentQ < TOTAL_QUESTIONS - 1) { currentQ++; saveProgress(); renderQuestion(); }
      else showResults(false);
    }, 450);
  }

  function handleKeyboard(e) {
    if (!appEl || !appEl.querySelector('.q-card')) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;   // Cmd/Ctrl+1..5 switches browser tabs
    var k = e.key;
    if (k >= '1' && k <= '5') { e.preventDefault(); selectRating(parseInt(k, 10)); return; }
    // Arrow keys move between ratings when focus is inside the group; page
    // navigation is on the Back and Next buttons and on Page Up/Down.
    if (e.target && e.target.getAttribute && e.target.getAttribute('role') === 'radio') return;
    if (k === 'PageUp' && currentQ > 0) { e.preventDefault(); currentQ--; saveProgress(); renderQuestion(); return; }
    if (k === 'PageDown' && currentQ < TOTAL_QUESTIONS - 1 && answers[currentQ] > 0) { e.preventDefault(); currentQ++; saveProgress(); renderQuestion(); }
  }

  // --- Results phase ---------------------------------------------------------

  function showResults(fromUrl) {
    clearApp();
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    var s = computeScores();
    var dimScores = s.dimScores, overall = s.overall, tierNum = s.tierNum, tier = TIERS[tierNum];

    if (!fromUrl) {
      saveResults(dimScores, overall, tierNum);
      T.fireEvent('assessment_completed', { overall_score: overall, tier: tier.name, tier_number: tierNum });
      T.setHashState(HASH_KEY, T.encode(answers));
    }

    var wrap = el('div', 'result');

    // Board panel: radar + tier + actions
    var board = el('div', 'scorecard');
    board.appendChild(el('span', 'label', 'Readiness scorecard'));
    var radar = el('div', 'radar'); board.appendChild(radar); renderRadar(radar, dimScores);
    board.appendChild(el('div', 'tier', 'Tier ' + tierNum + ': ' + tier.name));
    board.appendChild(el('p', '', tier.desc));
    board.appendChild(el('div', 'overall', 'Overall ' + overall.toFixed(1) + ' / 5.0'));
    var actions = el('div', 'actions');
    var dl = el('button', '', 'Download scorecard'); dl.type = 'button';
    dl.addEventListener('click', function () { T.fireEvent('scorecard_downloaded', { tier: tier.name }); T.download(buildCard(dimScores, overall, tierNum), 'readiness-scorecard.png'); });
    var cp = el('button', 'ghost', 'Copy link'); cp.type = 'button';
    cp.addEventListener('click', function () {
      T.fireEvent('assessment_shared', { method: 'copy_link' });
      var done = function () { cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = 'Copy link'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shareUrl()).then(done, done); else done();
    });
    var li = el('button', 'ghost', 'Share on LinkedIn'); li.type = 'button';
    li.addEventListener('click', function () { T.fireEvent('assessment_shared', { method: 'linkedin' }); window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareUrl()), '_blank', 'noopener,noreferrer'); });
    var rt = el('button', 'ghost', 'Retake'); rt.type = 'button';
    rt.addEventListener('click', function () {
      clearProgress();
      try {
        var check = loadProgress();
        if (check && check.answers && check.answers.some(function (a) { return a > 0; })) localStorage.removeItem(STORAGE_KEY);
      } catch (e) { /* storage unavailable; in-memory reset below still applies */ }
      answers = []; for (var i = 0; i < TOTAL_QUESTIONS; i++) answers.push(0); currentQ = 0;
      T.setHashState(HASH_KEY, null); renderQuestion();
    });
    actions.appendChild(dl); actions.appendChild(cp); actions.appendChild(li); actions.appendChild(rt);
    board.appendChild(actions);
    wrap.appendChild(board);

    // Interpretation: dimension bars + what to read next
    var interp = el('div', 'interp');
    interp.appendChild(el('h2', '', 'Where the gaps are'));
    var dims = el('ul', 'dims');
    var weakest = dimScores.indexOf(Math.min.apply(null, dimScores));
    for (var d = 0; d < DIMENSIONS.length; d++) {
      var row = el('li');
      row.appendChild(el('span', '', DIMENSIONS[d].name + (d === weakest ? ' (focus area)' : '')));
      var bar = el('div', 'bar'); var f = el('span'); f.style.width = ((dimScores[d] / 5) * 100) + '%'; bar.appendChild(f); row.appendChild(bar);
      row.appendChild(el('span', 'val', dimScores[d].toFixed(1)));
      dims.appendChild(row);
    }
    interp.appendChild(dims);

    var sorted = dimScores.map(function (v, i) { return { v: v, i: i }; }).sort(function (a, b) { return a.v - b.v; });
    var threshold = sorted.length >= 2 ? sorted[1].v : sorted[0].v;
    var weak = sorted.filter(function (x) { return x.v <= threshold; });
    var next = el('div', 'next-reads');
    next.appendChild(el('span', 'label', 'What to read next'));
    var ul = el('ul');
    weak.forEach(function (w) {
      var links = READING_PATHS[DIMENSIONS[w.i].key] || [];
      links.forEach(function (l) {
        var item = el('li'); var a = el('a', '', l.label); a.href = T.basePath() + '/' + l.path + '/'; item.appendChild(a);
        item.appendChild(document.createTextNode(' (' + DIMENSIONS[w.i].name + ')')); ul.appendChild(item);
      });
    });
    next.appendChild(ul);
    interp.appendChild(next);
    wrap.appendChild(interp);
    appEl.appendChild(wrap);
  }

  // --- D3 radar (board colours) ---------------------------------------------

  function renderRadar(container, dimScores) {
    if (typeof d3 === 'undefined') return;
    var W = 560, H = 420, cx = 280, cy = 206, R = 130, n = DIMENSIONS.length;
    var ang = function (i) { return (Math.PI * 2 / n) * i - Math.PI / 2; };
    var svg = d3.select(container).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).style('overflow', 'visible')
      .attr('role', 'img').attr('aria-label', 'Radar chart of the five readiness dimensions');
    for (var lvl = 1; lvl <= 5; lvl++) svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R * lvl / 5).attr('fill', 'none').attr('stroke', 'rgba(200,180,140,' + (lvl === 5 ? 0.45 : 0.15) + ')');
    for (var a = 0; a < n; a++) {
      svg.append('line').attr('x1', cx).attr('y1', cy).attr('x2', cx + R * Math.cos(ang(a))).attr('y2', cy + R * Math.sin(ang(a))).attr('stroke', 'rgba(200,180,140,0.25)');
      var lx = cx + (R + 22) * Math.cos(ang(a)), ly = cy + (R + 22) * Math.sin(ang(a));
      var anchor = Math.abs(Math.cos(ang(a))) > 0.3 ? (Math.cos(ang(a)) > 0 ? 'start' : 'end') : 'middle';
      svg.append('text').attr('x', lx).attr('y', ly).attr('text-anchor', anchor).attr('dominant-baseline', 'central')
        .attr('fill', '#c8b48c').attr('font-family', 'IBM Plex Mono, monospace').attr('font-size', 11).text(DIMENSIONS[a].name);
    }
    var pts = dimScores.map(function (v, i) { var r = R * v / 5; return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) }; });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x + ',' + p.y; }).join(' ') + ' Z';
    var zero = pts.map(function (p, i) { return (i ? 'L' : 'M') + cx + ',' + cy; }).join(' ') + ' Z';
    var poly = svg.append('path').attr('d', reduced ? path : zero).attr('fill', 'rgba(200,180,140,0.18)').attr('stroke', '#c8b48c').attr('stroke-width', 2);
    if (!reduced) poly.transition().duration(800).ease(d3.easeCubicOut).attr('d', path);
    pts.forEach(function (p) { svg.append('circle').attr('cx', p.x).attr('cy', p.y).attr('r', 3.5).attr('fill', '#c8b48c'); });
  }

  // --- Board card (canvas) ---------------------------------------------------

  function buildCard(dimScores, overall, tierNum) {
    var tier = TIERS[tierNum];
    var c = T.card({ label: 'Readiness scorecard', title: 'Tier ' + tierNum + ': ' + tier.name, subtitle: 'Overall ' + overall.toFixed(1) + ' / 5.0' });
    var ctx = c.ctx, gold = c.colors.gold;
    // radar left
    var rcx = 280, rcy = 400, rr = 130, n = 5;
    var ang = function (i) { return (Math.PI * 2 / n) * i - Math.PI / 2; };
    ctx.lineWidth = 1;
    for (var g = 1; g <= 5; g++) { ctx.strokeStyle = 'rgba(200,180,140,' + (g === 5 ? 0.45 : 0.15) + ')'; ctx.beginPath(); ctx.arc(rcx, rcy, rr * g / 5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,180,140,0.25)';
    for (var a = 0; a < n; a++) { ctx.beginPath(); ctx.moveTo(rcx, rcy); ctx.lineTo(rcx + rr * Math.cos(ang(a)), rcy + rr * Math.sin(ang(a))); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,180,140,0.18)'; ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.beginPath();
    for (var p = 0; p < n; p++) { var r = rr * dimScores[p] / 5, x = rcx + r * Math.cos(ang(p)), y = rcy + r * Math.sin(ang(p)); if (p) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gold; ctx.font = '11px "IBM Plex Mono", Menlo, monospace'; ctx.textAlign = 'center';
    for (var l = 0; l < n; l++) { ctx.fillText(DIMENSIONS[l].name, rcx + (rr + 26) * Math.cos(ang(l)), rcy + (rr + 26) * Math.sin(ang(l)) + 4); }
    // bars right
    var x0 = 600, y0 = 220, bw = 420, gap = 52;
    for (var b = 0; b < n; b++) {
      var by = y0 + b * gap;
      ctx.fillStyle = c.colors.ink; ctx.font = '13px "IBM Plex Sans", Helvetica, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(DIMENSIONS[b].name, x0, by);
      ctx.fillStyle = 'rgba(200,180,140,0.15)'; ctx.fillRect(x0, by + 10, bw, 6);
      ctx.fillStyle = gold; ctx.fillRect(x0, by + 10, bw * dimScores[b] / 5, 6);
      ctx.fillStyle = gold; ctx.font = '12px "IBM Plex Mono", Menlo, monospace'; ctx.fillText(dimScores[b].toFixed(1), x0 + bw + 14, by + 16);
    }
    ctx.fillStyle = c.colors.muted; ctx.font = '14px "IBM Plex Sans", Helvetica, sans-serif'; ctx.textAlign = 'left';
    T.wrapText(ctx, tier.desc, x0, y0 + n * gap + 10, 480, 20);
    return c.canvas;
  }

  // --- Init ------------------------------------------------------------------

  function init() {
    appEl = document.getElementById('tool-app') || document.getElementById('main-content');
    if (!appEl) return;
    appEl.setAttribute('tabindex', '-1');
    appEl.style.outline = 'none';
    document.addEventListener('keydown', handleKeyboard);
    answers = []; for (var i = 0; i < TOTAL_QUESTIONS; i++) answers.push(0);

    var shared = T.hashState(HASH_KEY);
    var fromHash = shared ? T.decode(shared, TOTAL_QUESTIONS) : null;
    if (fromHash) { answers = fromHash; showResults(true); return; }

    var saved = loadProgress();
    var validSaved = saved && Array.isArray(saved.answers) && saved.answers.length === TOTAL_QUESTIONS &&
      saved.answers.every(function (a) { return a === 0 || (a >= 1 && a <= 5); });
    if (validSaved) {
      answers = saved.answers.slice();
      currentQ = Math.min(TOTAL_QUESTIONS - 1, Math.max(0, parseInt(saved.currentQuestion, 10) || 0));
      if (answers.every(function (a) { return a > 0; })) { showResults(true); return; }   // restored, not newly completed
    }
    renderQuestion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
