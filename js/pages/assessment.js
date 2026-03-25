/* =============================================================================
   assessment.js -- AI Readiness Assessment: 25 questions, D3 radar, scorecard
   Enterprise AI Playbook -- sunilprakash.com/enterprise-ai
   ============================================================================= */

(function () {
  'use strict';

  // --- Constants -------------------------------------------------------------

  var STORAGE_KEY = 'obsidian_engagement';
  var PROGRESS_KEY = 'assessmentProgress';

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function basePath() {
    return (window.__BASE_PATH__ || '').replace(/\/$/, '');
  }

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
  var answers = []; // length 25, values 0 (unanswered) or 1-5
  var currentQ = 0; // 0-based index into flattened questions
  var autoAdvanceTimer = null;

  // --- Storage Helpers -------------------------------------------------------

  function loadEngagement() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }

  function saveEngagement(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function loadProgress() {
    var eng = loadEngagement();
    if (eng[PROGRESS_KEY]) {
      return eng[PROGRESS_KEY];
    }
    return null;
  }

  function saveProgress() {
    var eng = loadEngagement();
    eng[PROGRESS_KEY] = {
      currentQuestion: currentQ,
      answers: answers.slice(),
    };
    saveEngagement(eng);
  }

  function saveResults(dimScores, overall, tierNum) {
    var eng = loadEngagement();
    eng.assessmentCompleted = true;
    eng.assessmentResults = {
      scores: dimScores,
      overall: overall,
      tier: tierNum,
      date: new Date().toISOString(),
    };
    // Keep progress for reference but mark complete
    saveEngagement(eng);
  }

  function clearProgress() {
    var eng = loadEngagement();
    // Archive previous results if they exist
    if (eng.assessmentResults) {
      if (!eng.assessmentHistory) eng.assessmentHistory = [];
      eng.assessmentHistory.push(eng.assessmentResults);
    }
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
      for (var q = 0; q < 5; q++) {
        sum += answers[d * 5 + q] || 0;
      }
      dimScores.push(Math.round((sum / 5) * 10) / 10);
    }
    var overallSum = 0;
    for (var i = 0; i < dimScores.length; i++) {
      overallSum += dimScores[i];
    }
    var overall = Math.round((overallSum / dimScores.length) * 10) / 10;

    var tierNum;
    if (overall <= 2.0) tierNum = 1;
    else if (overall <= 3.0) tierNum = 2;
    else if (overall <= 4.0) tierNum = 3;
    else tierNum = 4;

    return { dimScores: dimScores, overall: overall, tierNum: tierNum };
  }

  // --- URL Encoding / Decoding -----------------------------------------------

  function encodeAnswers() {
    return btoa(answers.join(''));
  }

  function decodeAnswers(encoded) {
    try {
      var decoded = atob(encoded);
      if (decoded.length !== TOTAL_QUESTIONS) return null;
      var arr = [];
      for (var i = 0; i < decoded.length; i++) {
        var val = parseInt(decoded[i], 10);
        if (val < 1 || val > 5) return null;
        arr.push(val);
      }
      return arr;
    } catch (e) {
      return null;
    }
  }

  function getResultsFromHash() {
    var hash = window.location.hash;
    if (hash && hash.indexOf('#results=') === 0) {
      var encoded = hash.substring(9);
      return decodeAnswers(encoded);
    }
    return null;
  }

  function buildShareUrl() {
    var encoded = encodeAnswers();
    return window.location.origin + basePath() + '/assessment/tool/#results=' + encoded;
  }

  // --- DOM Helpers -----------------------------------------------------------

  function el(tag, cls, text) {
    var elem = document.createElement(tag);
    if (cls) elem.className = cls;
    if (text !== undefined) elem.textContent = text;
    return elem;
  }

  function clearApp() {
    if (appEl) appEl.innerHTML = '';
  }

  // --- Question Phase UI -----------------------------------------------------

  function renderQuestion() {
    clearApp();
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }

    var dimIndex = Math.floor(currentQ / 5);
    var qInDim = currentQ % 5;
    var dim = DIMENSIONS[dimIndex];
    var questionText = dim.questions[qInDim];

    // Container
    var container = el('div', 'assessment-stage');

    // Back button
    if (currentQ > 0) {
      var backBtn = el('button', 'results-cta assessment-back', 'Back');
      backBtn.style.cssText = 'position:absolute;top:0;left:0;font-size:10px;padding:6px 14px;opacity:0.6;';
      backBtn.setAttribute('aria-label', 'Go to previous question');
      backBtn.addEventListener('click', function () {
        currentQ--;
        saveProgress();
        renderQuestion();
      });
      container.style.position = 'relative';
      container.appendChild(backBtn);
    }

    // Progress bar
    var progressWrap = el('div', 'score-bar-track');
    progressWrap.style.cssText = 'margin-bottom:32px;height:3px;';
    var progressFill = el('div', 'score-bar-fill');
    var answeredCount = 0;
    for (var a = 0; a < answers.length; a++) {
      if (answers[a] > 0) answeredCount++;
    }
    progressFill.style.width = ((answeredCount / TOTAL_QUESTIONS) * 100) + '%';
    progressWrap.appendChild(progressFill);
    container.appendChild(progressWrap);

    // Dimension label
    var dimLabel = el('span', 'assessment-stage-label', dim.name.toUpperCase());
    container.appendChild(dimLabel);

    // Question number
    var qNum = el('span', 'assessment-stage-label');
    qNum.textContent = (currentQ + 1) + ' of ' + TOTAL_QUESTIONS;
    qNum.style.cssText = 'margin-left:16px;opacity:0.4;';
    container.appendChild(qNum);

    // Question card
    var card = el('div', 'question-card');
    card.style.marginTop = '16px';

    var qText = el('p', 'question-text', questionText);
    qText.style.cssText = 'font-family:var(--font-heading);font-size:20px;color:var(--heading);max-width:600px;margin:0 auto 24px;text-align:center;line-height:1.6;';
    card.appendChild(qText);

    // Rating circles
    var optionsRow = el('div', 'question-options');
    optionsRow.style.cssText = 'flex-direction:row;justify-content:center;gap:16px;align-items:flex-start;';

    var currentAnswer = answers[currentQ] || 0;

    for (var r = 1; r <= 5; r++) {
      (function (rating) {
        var optWrap = el('div', '');
        optWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;';

        var circle = el('div', '');
        var isSelected = currentAnswer > 0 && rating <= currentAnswer;
        var isExactSelected = rating === currentAnswer;

        circle.style.cssText = 'width:36px;height:36px;border-radius:50%;border:2px solid var(--gold);transition:background 0.15s ease,border-color 0.15s ease;';
        if (isExactSelected) {
          circle.style.background = 'var(--gold)';
        } else if (isSelected) {
          circle.style.background = 'rgba(200, 180, 140, 0.3)';
        } else {
          circle.style.background = 'transparent';
        }

        var label = el('span', 'question-option-marker', rating.toString());
        label.style.cssText = 'font-size:9px;text-align:center;';

        var scaleLabel = el('span', 'question-option-marker', SCALE_LABELS[rating]);
        scaleLabel.style.cssText = 'font-size:8px;max-width:60px;text-align:center;line-height:1.2;';

        optWrap.appendChild(circle);
        optWrap.appendChild(label);
        optWrap.appendChild(scaleLabel);

        // Hover
        optWrap.addEventListener('mouseenter', function () {
          if (answers[currentQ] !== rating) {
            circle.style.borderColor = 'var(--gold-light)';
          }
        });
        optWrap.addEventListener('mouseleave', function () {
          circle.style.borderColor = 'var(--gold)';
        });

        // Click
        optWrap.addEventListener('click', function () {
          selectRating(rating);
        });

        optionsRow.appendChild(optWrap);
      })(r);
    }

    card.appendChild(optionsRow);
    container.appendChild(card);
    appEl.appendChild(container);

    // Focus for keyboard accessibility
    appEl.focus();
  }

  function fireEvent(name, params) {
    if (typeof gtag === 'function') {
      gtag('event', name, params || {});
    }
  }

  function selectRating(rating) {
    var wasFirstAnswer = currentQ === 0 && answers[0] === 0;
    answers[currentQ] = rating;
    saveProgress();
    if (wasFirstAnswer) {
      fireEvent('assessment_started');
    }
    renderQuestion(); // Re-render to show fill state

    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(function () {
      if (currentQ < TOTAL_QUESTIONS - 1) {
        currentQ++;
        saveProgress();
        renderQuestion();
      } else {
        // All questions answered
        showResults();
      }
    }, 500);
  }

  // --- Keyboard Navigation ---------------------------------------------------

  function handleKeyboard(e) {
    if (!appEl) return;
    // Only handle keys during question phase
    var isQuestionPhase = appEl.querySelector('.question-card');
    if (!isQuestionPhase) return;

    var key = e.key;

    // Number keys 1-5
    if (key >= '1' && key <= '5') {
      e.preventDefault();
      selectRating(parseInt(key, 10));
      return;
    }

    // Left arrow: previous question
    if (key === 'ArrowLeft' && currentQ > 0) {
      e.preventDefault();
      currentQ--;
      saveProgress();
      renderQuestion();
      return;
    }

    // Right arrow: next question (only if current is answered)
    if (key === 'ArrowRight' && currentQ < TOTAL_QUESTIONS - 1 && answers[currentQ] > 0) {
      e.preventDefault();
      currentQ++;
      saveProgress();
      renderQuestion();
      return;
    }
  }

  // --- Results Phase ---------------------------------------------------------

  function showResults(fromUrl) {
    clearApp();
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }

    var scores = computeScores();
    var dimScores = scores.dimScores;
    var overall = scores.overall;
    var tierNum = scores.tierNum;
    var tier = TIERS[tierNum];

    // Save results to engagement state
    if (!fromUrl) {
      saveResults(dimScores, overall, tierNum);
      fireEvent('assessment_completed', {
        overall_score: overall,
        tier: tier.name,
        tier_number: tierNum
      });
    }

    // Update URL hash for shareability
    if (!fromUrl) {
      var encoded = encodeAnswers();
      try {
        history.replaceState(null, '', '#results=' + encoded);
      } catch (e) { /* ignore */ }
    }

    var resultsContainer = el('div', 'assessment-results');

    // --- Radar Chart ---
    var radarWrap = el('div', 'assessment-radar');
    resultsContainer.appendChild(radarWrap);
    renderRadarChart(radarWrap, dimScores);

    // --- Overall Tier ---
    var tierSection = el('div', '');
    tierSection.style.cssText = 'text-align:center;margin:32px 0 40px;';

    var tierLabel = el('span', 'assessment-stage-label', 'MATURITY TIER');
    tierSection.appendChild(tierLabel);

    var tierHeading = el('h2', 'results-headline');
    tierHeading.textContent = 'Tier ' + tierNum + ': ' + tier.name;
    tierHeading.style.cssText = 'font-family:var(--font-heading);font-size:36px;font-weight:300;color:var(--gold);margin:8px 0;';
    tierSection.appendChild(tierHeading);

    var tierDesc = el('p', '', tier.desc);
    tierDesc.style.cssText = 'font-size:16px;color:var(--text);max-width:500px;margin:0 auto 16px;line-height:1.6;';
    tierSection.appendChild(tierDesc);

    var overallScore = el('span', '', 'Overall: ' + overall.toFixed(1) + ' / 5.0');
    overallScore.style.cssText = 'font-family:var(--font-mono);font-size:14px;color:var(--gold);letter-spacing:1px;';
    tierSection.appendChild(overallScore);

    resultsContainer.appendChild(tierSection);

    // --- Per-dimension breakdown ---
    var barsSection = el('div', 'score-bars');
    var weakestIdx = 0;
    var weakestScore = dimScores[0];

    for (var d = 0; d < DIMENSIONS.length; d++) {
      if (dimScores[d] < weakestScore) {
        weakestScore = dimScores[d];
        weakestIdx = d;
      }

      var row = el('div', 'score-bar-row');

      var label = el('span', 'score-bar-label', DIMENSIONS[d].name);
      row.appendChild(label);

      var track = el('div', 'score-bar-track');
      var fill = el('div', 'score-bar-fill');
      fill.style.width = '0%';
      track.appendChild(fill);
      row.appendChild(track);

      var val = el('span', 'score-bar-value', dimScores[d].toFixed(1));
      row.appendChild(val);

      barsSection.appendChild(row);

      // Animate the bar fill after a brief delay
      (function (fillEl, score) {
        setTimeout(function () {
          fillEl.style.width = ((score / 5) * 100) + '%';
        }, 100);
      })(fill, dimScores[d]);
    }

    resultsContainer.appendChild(barsSection);

    // Focus area badge on weakest dimension
    var barRows = barsSection.querySelectorAll('.score-bar-row');
    if (barRows[weakestIdx]) {
      var badge = el('span', '', 'Focus area');
      badge.style.cssText = 'font-family:var(--font-mono);font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:var(--bg);background:var(--gold);padding:2px 8px;border-radius:2px;margin-left:8px;';
      barRows[weakestIdx].appendChild(badge);
    }

    // --- Recommended Reading ---
    var readingSection = el('div', '');
    readingSection.style.cssText = 'margin-top:40px;';

    var readingLabel = el('span', 'assessment-stage-label', 'RECOMMENDED READING');
    readingSection.appendChild(readingLabel);

    var readingDesc = el('p', '', 'Based on your lowest-scoring dimensions, start with these pages:');
    readingDesc.style.cssText = 'font-size:14px;color:var(--text);margin:8px 0 16px;line-height:1.6;';
    readingSection.appendChild(readingDesc);

    // Find weakest dimensions (could be ties)
    var sortedDims = dimScores
      .map(function (s, i) { return { score: s, idx: i }; })
      .sort(function (a, b) { return a.score - b.score; });

    // Show reading for bottom 2 dimensions (or more if tied)
    var threshold = sortedDims.length >= 2 ? sortedDims[1].score : sortedDims[0].score;
    var weakDims = sortedDims.filter(function (d) { return d.score <= threshold; });

    for (var w = 0; w < weakDims.length; w++) {
      var dimKey = DIMENSIONS[weakDims[w].idx].key;
      var links = READING_PATHS[dimKey];
      if (!links) continue;

      var dimGroup = el('div', '');
      dimGroup.style.cssText = 'margin-bottom:12px;';

      var dimTitle = el('span', 'score-bar-label', DIMENSIONS[weakDims[w].idx].name);
      dimTitle.style.cssText += 'display:block;margin-bottom:6px;color:var(--gold);';
      dimGroup.appendChild(dimTitle);

      for (var li = 0; li < links.length; li++) {
        var link = el('a', 'results-cta', links[li].label);
        link.href = basePath() + '/' + links[li].path + '/';
        link.style.cssText += 'margin-right:8px;margin-bottom:8px;display:inline-block;font-size:10px;padding:6px 14px;';
        dimGroup.appendChild(link);
      }

      readingSection.appendChild(dimGroup);
    }

    resultsContainer.appendChild(readingSection);

    // --- Share Section ---
    var shareSection = el('div', '');
    shareSection.style.cssText = 'margin-top:48px;padding-top:32px;border-top:1px solid rgba(200,180,140,0.1);display:flex;flex-wrap:wrap;gap:12px;align-items:center;';

    var downloadBtn = el('button', 'results-cta', 'Download Scorecard');
    downloadBtn.addEventListener('click', function () {
      fireEvent('scorecard_downloaded', { tier: tier.name });
      generateScorecard(dimScores, overall, tierNum);
    });
    shareSection.appendChild(downloadBtn);

    var copyBtn = el('button', 'results-cta', 'Copy Link');
    copyBtn.addEventListener('click', function () {
      fireEvent('assessment_shared', { method: 'copy_link' });
      var url = buildShareUrl();
      navigator.clipboard.writeText(url).then(function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy Link'; }, 1500);
      }).catch(function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy Link'; }, 1500);
      });
    });
    shareSection.appendChild(copyBtn);

    var liBtn = el('button', 'results-cta', 'Share on LinkedIn');
    liBtn.addEventListener('click', function () {
      fireEvent('assessment_shared', { method: 'linkedin' });
      var url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(buildShareUrl());
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    shareSection.appendChild(liBtn);

    var twBtn = el('button', 'results-cta', 'Share on Twitter');
    twBtn.addEventListener('click', function () {
      fireEvent('assessment_shared', { method: 'twitter' });
      var url = 'https://twitter.com/intent/tweet?url=' +
        encodeURIComponent(buildShareUrl()) +
        '&text=' +
        encodeURIComponent('My AI Readiness Score: ' + overall.toFixed(1) + '/5.0 (Tier ' + tierNum + ': ' + tier.name + ')');
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    shareSection.appendChild(twBtn);

    var retakeBtn = el('button', 'results-cta', 'Retake Assessment');
    retakeBtn.style.cssText += 'opacity:0.6;';
    retakeBtn.addEventListener('click', function () {
      clearProgress();
      answers = [];
      for (var i = 0; i < TOTAL_QUESTIONS; i++) answers.push(0);
      currentQ = 0;
      try { history.replaceState(null, '', window.location.pathname); } catch (e) { /* ignore */ }
      renderQuestion();
    });
    shareSection.appendChild(retakeBtn);

    resultsContainer.appendChild(shareSection);

    appEl.appendChild(resultsContainer);
  }

  // --- D3 Radar Chart --------------------------------------------------------

  function renderRadarChart(container, dimScores) {
    if (typeof d3 === 'undefined') return;

    var size = 400;
    var cx = size / 2;
    var cy = size / 2;
    var maxRadius = size / 2 - 60; // leave room for labels
    var levels = 5;
    var angleSlice = (Math.PI * 2) / DIMENSIONS.length;

    var svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 ' + size + ' ' + size)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'img')
      .attr('aria-label', 'Radar chart showing scores across five assessment dimensions');

    // Grid circles
    for (var lvl = 1; lvl <= levels; lvl++) {
      var r = (maxRadius / levels) * lvl;
      svg.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', r)
        .attr('class', 'radar-grid');
    }

    // Axis lines
    for (var ax = 0; ax < DIMENSIONS.length; ax++) {
      var angle = angleSlice * ax - Math.PI / 2;
      var x2 = cx + maxRadius * Math.cos(angle);
      var y2 = cy + maxRadius * Math.sin(angle);

      svg.append('line')
        .attr('x1', cx)
        .attr('y1', cy)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', 'rgba(200, 180, 140, 0.2)')
        .attr('stroke-width', 1);
    }

    // Axis labels
    for (var lb = 0; lb < DIMENSIONS.length; lb++) {
      var lAngle = angleSlice * lb - Math.PI / 2;
      var labelR = maxRadius + 30;
      var lx = cx + labelR * Math.cos(lAngle);
      var ly = cy + labelR * Math.sin(lAngle);

      var anchor = 'middle';
      if (Math.abs(Math.cos(lAngle)) > 0.3) {
        anchor = Math.cos(lAngle) > 0 ? 'start' : 'end';
      }

      svg.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', anchor)
        .attr('dominant-baseline', 'central')
        .attr('class', 'radar-axis-label')
        .text(DIMENSIONS[lb].name);
    }

    // Compute polygon points
    var points = [];
    for (var p = 0; p < DIMENSIONS.length; p++) {
      var pAngle = angleSlice * p - Math.PI / 2;
      var pR = (dimScores[p] / 5) * maxRadius;
      points.push({
        x: cx + pR * Math.cos(pAngle),
        y: cy + pR * Math.sin(pAngle),
      });
    }

    var pathStr = points.map(function (pt, i) {
      return (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y;
    }).join(' ') + ' Z';

    // Zero path (for animation start)
    var zeroPath = '';
    for (var z = 0; z < DIMENSIONS.length; z++) {
      zeroPath += (z === 0 ? 'M' : 'L') + cx + ',' + cy;
    }
    zeroPath += ' Z';

    // Filled polygon
    var polygon = svg.append('path')
      .attr('class', 'radar-area')
      .attr('d', prefersReducedMotion ? pathStr : zeroPath);

    if (!prefersReducedMotion) {
      polygon.transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('d', pathStr);
    }

    // Data points
    for (var dp = 0; dp < points.length; dp++) {
      var dot = svg.append('circle')
        .attr('class', 'radar-point')
        .attr('r', 3);

      if (prefersReducedMotion) {
        dot.attr('cx', points[dp].x).attr('cy', points[dp].y);
      } else {
        dot.attr('cx', cx).attr('cy', cy);
        (function (dotEl, target) {
          dotEl.transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr('cx', target.x)
            .attr('cy', target.y);
        })(dot, points[dp]);
      }
    }
  }

  // --- Scorecard Image Generation (Canvas API) --------------------------------

  function generateScorecard(dimScores, overall, tierNum) {
    var tier = TIERS[tierNum];
    var W = 1200;
    var H = 630;

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Gold gradient at top
    var grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(200, 180, 140, 0.12)');
    grad.addColorStop(0.5, 'rgba(200, 180, 140, 0.06)');
    grad.addColorStop(1, 'rgba(200, 180, 140, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 4);

    // --- Left side: Simplified radar chart ---
    var radarCx = 280;
    var radarCy = 260;
    var radarR = 120;
    var angleSlice = (Math.PI * 2) / 5;

    // Grid circles
    ctx.strokeStyle = 'rgba(200, 180, 140, 0.1)';
    ctx.lineWidth = 0.5;
    for (var g = 1; g <= 5; g++) {
      ctx.beginPath();
      ctx.arc(radarCx, radarCy, (radarR / 5) * g, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Axis lines
    for (var a = 0; a < 5; a++) {
      var aAngle = angleSlice * a - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(radarCx, radarCy);
      ctx.lineTo(radarCx + radarR * Math.cos(aAngle), radarCy + radarR * Math.sin(aAngle));
      ctx.stroke();
    }

    // Radar polygon
    ctx.fillStyle = 'rgba(200, 180, 140, 0.15)';
    ctx.strokeStyle = '#c8b48c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var p = 0; p < 5; p++) {
      var pAngle = angleSlice * p - Math.PI / 2;
      var pR = (dimScores[p] / 5) * radarR;
      var px = radarCx + pR * Math.cos(pAngle);
      var py = radarCy + pR * Math.sin(pAngle);
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Axis labels on canvas
    ctx.fillStyle = '#6b6560';
    ctx.font = '10px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    for (var lb = 0; lb < 5; lb++) {
      var lAngle = angleSlice * lb - Math.PI / 2;
      var lR = radarR + 24;
      var lx = radarCx + lR * Math.cos(lAngle);
      var ly = radarCy + lR * Math.sin(lAngle);
      ctx.fillText(DIMENSIONS[lb].name, lx, ly + 4);
    }

    // --- Right side: Tier and scores ---
    var rightX = 540;

    // Tier label
    ctx.fillStyle = '#c8b48c';
    ctx.font = '11px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MATURITY TIER', rightX, 120);

    // Tier name
    ctx.fillStyle = '#c8b48c';
    ctx.font = '36px Georgia, serif';
    ctx.fillText('Tier ' + tierNum + ': ' + tier.name, rightX, 168);

    // Overall score
    ctx.fillStyle = '#a09888';
    ctx.font = '14px Helvetica, Arial, sans-serif';
    ctx.fillText('Overall Score: ' + overall.toFixed(1) + ' / 5.0', rightX, 200);

    // Dimension bars
    var barStartY = 240;
    var barHeight = 6;
    var barMaxW = 300;
    var barGap = 36;

    for (var b = 0; b < 5; b++) {
      var by = barStartY + b * barGap;

      // Label
      ctx.fillStyle = '#6b6560';
      ctx.font = '10px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(DIMENSIONS[b].name, rightX, by - 8);

      // Track
      ctx.fillStyle = 'rgba(200, 180, 140, 0.1)';
      ctx.fillRect(rightX, by, barMaxW, barHeight);

      // Fill
      var fillW = (dimScores[b] / 5) * barMaxW;
      var barGrad = ctx.createLinearGradient(rightX, 0, rightX + fillW, 0);
      barGrad.addColorStop(0, '#a09070');
      barGrad.addColorStop(1, '#c8b48c');
      ctx.fillStyle = barGrad;
      ctx.fillRect(rightX, by, fillW, barHeight);

      // Score value
      ctx.fillStyle = '#c8b48c';
      ctx.font = '11px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(dimScores[b].toFixed(1), rightX + barMaxW + 12, by + 6);
    }

    // Tier description
    ctx.fillStyle = '#a09888';
    ctx.font = '13px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';
    var descMaxWidth = W - rightX - 60;
    wrapCanvasText(ctx, tier.desc, rightX, barStartY + 5 * barGap + 20, descMaxWidth, 18);

    // Footer
    ctx.fillStyle = 'rgba(200, 180, 140, 0.08)';
    ctx.fillRect(0, H - 50, W, 50);

    ctx.fillStyle = '#6b6560';
    ctx.font = '10px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI Readiness Assessment  |  Enterprise AI Playbook  |  sunilprakash.com', W / 2, H - 20);

    // Download
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.download = 'ai-readiness-scorecard.png';
      link.href = url;
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }, 'image/png');
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var currentY = y;

    for (var i = 0; i < words.length; i++) {
      var testLine = line + (line ? ' ' : '') + words[i];
      var metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
    }
  }

  // --- Init ------------------------------------------------------------------

  function init() {
    appEl = document.getElementById('assessment-app');
    if (!appEl) {
      // Fallback: try main-content
      appEl = document.getElementById('main-content');
    }
    if (!appEl) return;

    // Make focusable for keyboard events
    appEl.setAttribute('tabindex', '-1');
    appEl.style.outline = 'none';

    // Keyboard listener
    document.addEventListener('keydown', handleKeyboard);

    // Initialize answers array
    answers = [];
    for (var i = 0; i < TOTAL_QUESTIONS; i++) answers.push(0);

    // Check URL hash for shared results
    var hashAnswers = getResultsFromHash();
    if (hashAnswers) {
      answers = hashAnswers;
      showResults(true);
      return;
    }

    // Check localStorage for saved progress
    var saved = loadProgress();
    if (saved && saved.answers && saved.answers.length === TOTAL_QUESTIONS) {
      answers = saved.answers;
      currentQ = saved.currentQuestion || 0;

      // If all answered, show results
      var allAnswered = true;
      for (var j = 0; j < answers.length; j++) {
        if (answers[j] === 0) { allAnswered = false; break; }
      }
      if (allAnswered) {
        showResults();
        return;
      }
    }

    // Start (or resume) the question phase
    renderQuestion();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
