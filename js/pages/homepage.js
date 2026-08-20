/* =============================================================================
   homepage.js -- metric counters, the Spine (seven disciplines), cover radar
   The Enterprise AI Operating System -- sunilprakash.com/enterprise-ai
   ============================================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAV = window.__NAV_DATA__ || { disciplines: [] };
  var BASE = (window.__BASE_PATH__ || '').replace(/\/$/, '');

  function pad2(n) { return String(n).padStart(2, '0'); }
  function easeOut(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  // --- 1. Metric counters ----------------------------------------------------
  function initCounters() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length || reduced) return;
    var done = false;
    function run() {
      if (done) return; done = true;
      els.forEach(function (el) {
        var to = parseFloat(el.getAttribute('data-count-to'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var decimals = (el.getAttribute('data-count-to').split('.')[1] || '').length;
        var start = null;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / 1200);
          var v = to * easeOut(p);
          el.textContent = prefix + (decimals ? v.toFixed(decimals) : Math.round(v)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { run(); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(els[0]);
    } else run();
  }

  // --- 2. The Spine ----------------------------------------------------------
  function wrapText(text, max) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (t.length > max && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 5);
  }

  function renderSpineList(host) {
    var ol = document.createElement('ol');
    ol.className = 'spine-list';
    NAV.disciplines.forEach(function (d) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="' + BASE + '/' + d.path + '/"><span class="label">' + pad2(d.number) + '</span><strong style="display:block;font:300 22px var(--font-display);margin:4px 0 6px">' + d.name + '</strong><span style="font-size:14px;color:var(--ink-2)">' + d.question + '</span></a>';
      ol.appendChild(li);
    });
    host.appendChild(ol);
  }

  function initSpine() {
    var host = document.getElementById('spine');
    if (!host || !NAV.disciplines.length) return;
    var narrow = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    if (narrow || typeof d3 === 'undefined') { renderSpineList(host); return; }
    var W = 960, H = 250, n = NAV.disciplines.length;
    var gap = 10, segW = (W - gap * (n - 1)) / n, top = 36, segH = 184;
    var svg = d3.select(host).append('svg')
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('role', 'list')
      .attr('aria-label', 'Seven disciplines');

    // connecting line behind the segments
    svg.append('line').attr('class', 'link')
      .attr('x1', 0).attr('x2', W).attr('y1', top + segH / 2).attr('y2', top + segH / 2);

    var seg = svg.selectAll('a.seg').data(NAV.disciplines).enter()
      .append('a').attr('class', 'seg').attr('role', 'listitem')
      .attr('href', function (d) { return BASE + '/' + d.path + '/'; })
      .attr('aria-label', function (d) { return pad2(d.number) + ' ' + d.name + ': ' + d.question; })
      .attr('tabindex', 0)
      .attr('transform', function (d, i) { return 'translate(' + (i * (segW + gap)) + ',' + top + ')'; })
      .style('opacity', reduced ? 1 : 0);

    seg.append('rect').attr('width', segW).attr('height', segH).attr('rx', 2);
    seg.append('text').attr('class', 'num').attr('x', 14).attr('y', 26).text(function (d) { return pad2(d.number); });
    seg.append('text').attr('class', 'name').attr('x', 14).attr('y', 60).text(function (d) { return d.name; });
    seg.each(function (d) {
      var lines = wrapText(d.question, 19);
      var t = d3.select(this).append('text').attr('class', 'q').attr('x', 14).attr('y', 88);
      lines.forEach(function (l, i) {
        t.append('tspan').attr('x', 14).attr('dy', i === 0 ? 0 : 15).text(l);
      });
    });
    // small caption under the strip
    svg.append('text').attr('class', 'q').attr('x', 0).attr('y', top + segH + 26)
      .text('Read left to right, or start where the program is stuck.');

    if (!reduced) {
      seg.transition().delay(function (d, i) { return 120 + i * 90; }).duration(500).style('opacity', 1);
    }
  }

  // --- 3. Decorative radar on the diagnostic object --------------------------
  function initRadar() {
    var host = document.getElementById('cover-radar');
    if (!host || typeof d3 === 'undefined') return;
    var W = 300, H = 260, cx = 150, cy = 132, R = 92;
    var axes = ['Data', 'Process', 'Talent', 'Governance', 'Organization'];
    var vals = [3.2, 2.6, 2.9, 2.1, 2.4];
    var svg = d3.select(host).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).attr('aria-hidden', 'true');
    var ang = function (i) { return (Math.PI * 2 * i / axes.length) - Math.PI / 2; };
    [1, 2, 3, 4, 5].forEach(function (lvl) {
      var r = R * lvl / 5;
      svg.append('polygon')
        .attr('points', axes.map(function (_, i) { return (cx + r * Math.cos(ang(i))) + ',' + (cy + r * Math.sin(ang(i))); }).join(' '))
        .attr('fill', 'none').attr('stroke', 'rgba(200,180,140,' + (lvl === 5 ? 0.5 : 0.18) + ')').attr('stroke-width', 1);
    });
    axes.forEach(function (a, i) {
      svg.append('line').attr('x1', cx).attr('y1', cy).attr('x2', cx + R * Math.cos(ang(i))).attr('y2', cy + R * Math.sin(ang(i))).attr('stroke', 'rgba(200,180,140,.25)');
      svg.append('text').attr('x', cx + (R + 16) * Math.cos(ang(i))).attr('y', cy + (R + 16) * Math.sin(ang(i)) + 4)
        .attr('text-anchor', 'middle').attr('fill', '#c8b48c').attr('font-family', 'IBM Plex Mono, monospace').attr('font-size', 10).text(a);
    });
    var pts = vals.map(function (v, i) { var r = R * v / 5; return (cx + r * Math.cos(ang(i))) + ',' + (cy + r * Math.sin(ang(i))); }).join(' ');
    var poly = svg.append('polygon').attr('points', pts).attr('fill', 'rgba(200,180,140,.18)').attr('stroke', '#c8b48c').attr('stroke-width', 1.5);
    if (!reduced) { poly.style('opacity', 0).transition().delay(300).duration(700).style('opacity', 1); }
  }

  function init() { initCounters(); initSpine(); initRadar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
