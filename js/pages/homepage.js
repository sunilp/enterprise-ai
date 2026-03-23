/* =============================================================================
   homepage.js -- Hero animation, stat counters, D3 decision flow, welcome back
   Enterprise AI Playbook -- sunilprakash.com/enterprise-ai
   ============================================================================= */

(function () {
  'use strict';

  // --- Reduced Motion Detection -------------------------------------------

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Helpers -------------------------------------------------------------

  function basePath() {
    return (window.__BASE_PATH__ || '').replace(/\/$/, '');
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  // --- 1. Hero Animation Sequence ------------------------------------------

  function initHeroAnimation() {
    var hero = document.querySelector('.showcase-hero');
    if (!hero) return;

    // Hero internal elements
    var heroTargets = [
      { sel: '.gold-line',      delay: 0 },
      { sel: '.section-label',  delay: 200 },
      { sel: 'h1',              delay: 400 },
      { sel: '.hero-thesis',    delay: 600 },
    ];

    var heroElements = heroTargets.map(function (t) {
      return hero.querySelector(t.sel);
    }).filter(Boolean);

    // Metric strip items (outside hero, below it)
    var metricItems = document.querySelectorAll('.metric-strip .metric');

    // Path cards (outside hero, below metric strip)
    var pathCards = document.querySelectorAll('.path-cards .path-card');

    // Collect all elements to hide initially
    var allElements = heroElements.slice();
    for (var mi = 0; mi < metricItems.length; mi++) {
      allElements.push(metricItems[mi]);
    }
    for (var pi = 0; pi < pathCards.length; pi++) {
      allElements.push(pathCards[pi]);
    }

    // Apply hidden state
    for (var h = 0; h < allElements.length; h++) {
      allElements[h].classList.add('hero-hidden');
    }

    if (prefersReducedMotion) {
      // Show everything immediately without animation
      for (var r = 0; r < allElements.length; r++) {
        allElements[r].classList.remove('hero-hidden');
      }
      return;
    }

    // Stagger reveal: hero elements
    for (var ti = 0; ti < heroTargets.length; ti++) {
      (function (el, delay) {
        if (!el) return;
        setTimeout(function () {
          el.classList.remove('hero-hidden');
        }, delay);
      })(hero.querySelector(heroTargets[ti].sel), heroTargets[ti].delay);
    }

    // Metric items: base 800ms + 150ms stagger each
    for (var mj = 0; mj < metricItems.length; mj++) {
      (function (el, delay) {
        setTimeout(function () {
          el.classList.remove('hero-hidden');
        }, delay);
      })(metricItems[mj], 800 + mj * 150);
    }

    // Path cards: base 1300ms + 100ms stagger each
    for (var pj = 0; pj < pathCards.length; pj++) {
      (function (el, delay) {
        setTimeout(function () {
          el.classList.remove('hero-hidden');
        }, delay);
      })(pathCards[pj], 1300 + pj * 100);
    }
  }

  // --- 2. Stat Counters ----------------------------------------------------

  function initStatCounters() {
    var elements = document.querySelectorAll('[data-count-to]');
    if (!elements.length) return;
    if (!window.IntersectionObserver) {
      // Fallback: show final values immediately
      for (var f = 0; f < elements.length; f++) {
        showFinalValue(elements[f]);
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          animateCounter(entries[i].target);
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.2 });

    for (var j = 0; j < elements.length; j++) {
      observer.observe(elements[j]);
    }
  }

  function showFinalValue(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    el.textContent = prefix + target + suffix;
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';

    if (prefersReducedMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }

    var duration = 2000; // 2 seconds
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var t = Math.min(elapsed / duration, 1);
      var easedT = easeOutExpo(t);
      var current = Math.round(easedT * target);
      el.textContent = prefix + current + suffix;
      if (t < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // --- 3. Decision Sequence Diagram ----------------------------------------

  var DECISION_NODES = [
    { id: 'position',         label: 'Position',         section: 'Position' },
    { id: 'operating-model',  label: 'Operating Model',  section: 'Operating Model' },
    { id: 'assessment',       label: 'Assessment',       section: 'Assessment' },
    { id: 'portfolio',        label: 'Portfolio',        section: 'Portfolio' },
    { id: 'governance',       label: 'Governance',       section: 'Governance' },
    { id: 'architecture',     label: 'Architecture',     section: 'Architecture' },
    { id: 'agentic-strategy', label: 'Agentic Strategy', section: 'Agentic Strategy' },
    { id: 'workforce',        label: 'Workforce',        section: 'Workforce' },
    { id: 'measurement',      label: 'Measurement',      section: 'Measurement' },
    { id: 'transformation',   label: 'Transformation',   section: 'Transformation' },
    { id: 'proof',            label: 'Proof',            section: 'Proof' },
  ];

  function findFirstPageForSection(sectionName) {
    var navData = window.__NAV_DATA__;
    if (!navData || !Array.isArray(navData)) return null;

    for (var i = 0; i < navData.length; i++) {
      var item = navData[i];
      if (item.title === sectionName && item.pages && item.pages.length > 0) {
        var firstPage = item.pages[0];
        var pagePath = firstPage.path || '';
        if (pagePath === '') return basePath() + '/';
        return basePath() + '/' + pagePath + '/';
      }
    }
    return null;
  }

  function initDecisionFlow() {
    var mount = document.getElementById('decision-flow');
    if (!mount) return;
    if (typeof d3 === 'undefined') return;

    // Observe mount visibility to trigger edge animation
    var hasAnimated = false;

    function render() {
      mount.innerHTML = '';

      var containerWidth = mount.clientWidth || 700;
      var isMobile = containerWidth < 600;

      // Dimensions
      var nodeW = isMobile ? Math.min(containerWidth - 40, 200) : 105;
      var nodeH = 34;
      var nodeCount = DECISION_NODES.length;

      var svgWidth, svgHeight, nodePositions;

      if (isMobile) {
        // Vertical stack
        var vertGap = 20;
        var vertPadX = 20;
        var vertPadTop = 20;
        svgWidth = containerWidth;
        svgHeight = vertPadTop + nodeCount * (nodeH + vertGap);
        nodePositions = DECISION_NODES.map(function (_, i) {
          return {
            x: (svgWidth - nodeW) / 2,
            y: vertPadTop + i * (nodeH + vertGap),
          };
        });
      } else {
        // Two-row staggered layout: row 1 has 6 nodes, row 2 has 5
        var row1Count = 6;
        var row2Count = nodeCount - row1Count;
        var padX = 10;
        var padY = 20;
        var rowGap = 24;
        var row1Gap = (containerWidth - 2 * padX - nodeW) / Math.max(row1Count - 1, 1);
        var row2Gap = (containerWidth - 2 * padX - nodeW) / Math.max(row2Count - 1, 1);
        svgWidth = containerWidth;
        svgHeight = padY * 2 + nodeH * 2 + rowGap;

        nodePositions = DECISION_NODES.map(function (_, i) {
          if (i < row1Count) {
            return {
              x: padX + i * row1Gap,
              y: padY,
            };
          } else {
            var j = i - row1Count;
            // Offset row 2 to center it under row 1
            var row2Offset = (containerWidth - (row2Count - 1) * row2Gap - nodeW) / 2;
            return {
              x: row2Offset + j * row2Gap,
              y: padY + nodeH + rowGap,
            };
          }
        });
      }

      var svg = d3.select(mount)
        .append('svg')
        .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', 'auto')
        .attr('role', 'img')
        .attr('aria-label', 'Decision sequence: 11 phases from Position to Proof');

      // Draw edges first (below nodes)
      var edgeGroup = svg.append('g').attr('class', 'decision-edges');

      var edges = [];
      for (var ei = 0; ei < nodeCount - 1; ei++) {
        var from = nodePositions[ei];
        var to = nodePositions[ei + 1];

        var x1, y1, x2, y2;
        if (isMobile) {
          x1 = from.x + nodeW / 2;
          y1 = from.y + nodeH;
          x2 = to.x + nodeW / 2;
          y2 = to.y;
        } else {
          x1 = from.x + nodeW;
          y1 = from.y + nodeH / 2;
          x2 = to.x;
          y2 = to.y + nodeH / 2;
        }

        var edgePath = edgeGroup.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', 'rgba(200, 180, 140, 0.3)')
          .attr('stroke-width', 1);

        edges.push(edgePath);
      }

      // Draw nodes
      var nodeGroup = svg.append('g').attr('class', 'decision-nodes');

      DECISION_NODES.forEach(function (node, idx) {
        var pos = nodePositions[idx];
        var g = nodeGroup.append('g')
          .attr('class', 'decision-node')
          .attr('transform', 'translate(' + pos.x + ',' + pos.y + ')')
          .style('cursor', 'pointer');

        // Rectangle
        g.append('rect')
          .attr('width', nodeW)
          .attr('height', nodeH)
          .attr('rx', 2)
          .attr('ry', 2)
          .attr('fill', 'rgba(10, 10, 10, 0.9)')
          .attr('stroke', 'rgba(200, 180, 140, 0.25)')
          .attr('stroke-width', 1)
          .attr('class', 'decision-node-rect');

        // Label
        var fontSize = isMobile ? 11 : 9;
        g.append('text')
          .attr('x', nodeW / 2)
          .attr('y', nodeH / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'rgba(200, 180, 140, 0.8)')
          .attr('font-family', 'var(--font-mono, "IBM Plex Mono", monospace)')
          .attr('font-size', fontSize + 'px')
          .attr('letter-spacing', '0.5px')
          .text(node.label);

        // Tooltip
        var title = g.append('title');
        title.text(node.label + ' -- Click to explore');

        // Hover effect
        g.on('mouseover', function () {
          d3.select(this).select('.decision-node-rect')
            .attr('stroke', 'rgba(200, 180, 140, 0.7)')
            .attr('filter', 'drop-shadow(0 0 6px rgba(200, 180, 140, 0.2))');
          d3.select(this).select('text')
            .attr('fill', 'rgba(200, 180, 140, 1)');
        });

        g.on('mouseout', function () {
          d3.select(this).select('.decision-node-rect')
            .attr('stroke', 'rgba(200, 180, 140, 0.25)')
            .attr('filter', null);
          d3.select(this).select('text')
            .attr('fill', 'rgba(200, 180, 140, 0.8)');
        });

        // Click: navigate to first page of the section
        g.on('click', function () {
          var url = findFirstPageForSection(node.section);
          if (url) window.location.href = url;
        });
      });

      // Edge stroke animation on first view
      if (!hasAnimated && !prefersReducedMotion) {
        edges.forEach(function (edge, i) {
          var lineEl = edge.node();
          var dx = parseFloat(edge.attr('x2')) - parseFloat(edge.attr('x1'));
          var dy = parseFloat(edge.attr('y2')) - parseFloat(edge.attr('y1'));
          var length = Math.sqrt(dx * dx + dy * dy);
          edge
            .attr('stroke-dasharray', length)
            .attr('stroke-dashoffset', length);

          edge.transition()
            .delay(i * 100)
            .duration(400)
            .ease(d3.easeCubicOut)
            .attr('stroke-dashoffset', 0);
        });
        hasAnimated = true;
      }
    }

    render();

    // Responsive: re-render on resize (debounced)
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        hasAnimated = true; // don't re-animate edges on resize
        render();
      }, 250);
    });

    // If not yet visible, use IntersectionObserver to trigger edge animation
    if (window.IntersectionObserver && !prefersReducedMotion) {
      var flowObserver = new IntersectionObserver(function (entries) {
        for (var oi = 0; oi < entries.length; oi++) {
          if (entries[oi].isIntersecting && !hasAnimated) {
            hasAnimated = false; // reset so render() animates
            render();
            flowObserver.disconnect();
          }
        }
      }, { threshold: 0.2 });
      flowObserver.observe(mount);
    }
  }

  // --- 4. Welcome Back -----------------------------------------------------

  function initWelcomeBack() {
    // Engagement system handles welcome-back via initReturnRecognition().
    // This is a fallback in case engagement.js hasn't run yet or for the
    // showcase-specific placement logic.
    // The engagement system already checks for visitCount >= 2 and inserts
    // after .showcase-hero, so we don't duplicate here.
    // Intentionally left as no-op to avoid double "Welcome back" messages.
  }

  // --- 5. Hero Hidden CSS Injection ----------------------------------------

  function injectHeroHiddenCss() {
    if (document.getElementById('homepage-hero-styles')) return;
    var style = document.createElement('style');
    style.id = 'homepage-hero-styles';

    if (prefersReducedMotion) {
      // No transitions for reduced motion
      style.textContent = '.hero-hidden{opacity:1;}';
    } else {
      style.textContent = [
        '.hero-hidden{',
          'opacity:0;',
          'transform:translateY(12px);',
          'transition:opacity 0.6s ease,transform 0.6s ease;',
        '}',
      ].join('');
    }

    document.head.appendChild(style);
  }

  // --- Init ----------------------------------------------------------------

  function initHomepage() {
    injectHeroHiddenCss();
    initHeroAnimation();
    initStatCounters();
    initDecisionFlow();
    initWelcomeBack();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepage);
  } else {
    initHomepage();
  }

}());
