(function() {
  'use strict';

  var BASE = window.__BASE_PATH__ || '/enterprise-ai';
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function() {
    initHeroAnimation();
    initStatCounters();
    initPrinciplesDiagram();
    initMaturityDiagram();
  });

  // ─── Hero Animation ──────────────────────────────────────────────────────

  function initHeroAnimation() {
    var hero = document.querySelector('.showcase-hero');
    if (!hero) return;

    var children = hero.children;
    var delays = [0, 200, 400, 600, 800];

    if (prefersReducedMotion) return;

    for (var i = 0; i < children.length; i++) {
      children[i].style.opacity = '0';
      children[i].style.transform = 'translateY(16px)';
      children[i].style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    }

    for (var j = 0; j < children.length; j++) {
      (function(el, delay) {
        setTimeout(function() {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, delay);
      })(children[j], delays[j] || 800);
    }
  }

  // ─── Stat Counters ────────────────────────────────────────────────────────

  function initStatCounters() {
    var stats = document.querySelectorAll('[data-count-to]');
    if (!stats.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    stats.forEach(function(el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var target = parseInt(el.dataset.countTo, 10);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var duration = 2000;
    var start = performance.now();

    if (prefersReducedMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }

    function update(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(2, -10 * progress);
      var current = Math.round(target * eased);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ─── Five Principles Interactive Diagram ──────────────────────────────────

  function initPrinciplesDiagram() {
    var container = document.getElementById('framework-principles');
    if (!container || typeof d3 === 'undefined') return;

    var principles = [
      { num: 1, title: 'Operating Model', subtitle: 'Before Technology', icon: '&#9670;', color: '#c8b48c',
        desc: 'Define how the organization will govern, fund, and scale AI before selecting tools.' },
      { num: 2, title: 'Governance', subtitle: 'As Infrastructure', icon: '&#9670;', color: '#b8a47c',
        desc: 'Build governance that runs at deployment speed, not review-cycle speed.' },
      { num: 3, title: 'Architecture', subtitle: 'Intelligence to Action', icon: '&#9670;', color: '#a89060',
        desc: 'Connect the System of Intelligence to Systems of Engagement and Action.' },
      { num: 4, title: 'Measurement', subtitle: 'To the Balance Sheet', icon: '&#9670;', color: '#988050',
        desc: 'Establish baselines before deployment. Tie AI outcomes to EBIT through a traceable chain.' },
      { num: 5, title: 'Workforce', subtitle: 'Human-Agent Design', icon: '&#9670;', color: '#887040',
        desc: 'Design the new composition of work before deploying the AI that changes it.' }
    ];

    var width = container.clientWidth;
    var isMobile = width < 600;
    var height = isMobile ? principles.length * 100 + 40 : 220;

    var svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('width', '100%')
      .style('overflow', 'visible');

    if (isMobile) {
      // Vertical layout
      var yStep = 90;
      var groups = svg.selectAll('.principle')
        .data(principles)
        .enter().append('g')
        .attr('class', 'principle')
        .attr('transform', function(d, i) { return 'translate(40,' + (i * yStep + 30) + ')'; })
        .style('cursor', 'pointer');

      // Connecting lines
      svg.selectAll('.conn-line')
        .data(principles.slice(0, -1))
        .enter().append('line')
        .attr('x1', 40).attr('x2', 40)
        .attr('y1', function(d, i) { return i * yStep + 50; })
        .attr('y2', function(d, i) { return (i + 1) * yStep + 10; })
        .attr('stroke', 'rgba(200,180,140,0.2)')
        .attr('stroke-width', 1);

      // Number circles
      groups.append('circle')
        .attr('r', 16)
        .attr('fill', 'rgba(200,180,140,0.08)')
        .attr('stroke', function(d) { return d.color; })
        .attr('stroke-width', 1);

      groups.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', function(d) { return d.color; })
        .attr('font-family', 'Fraunces, serif')
        .attr('font-size', '14px')
        .text(function(d) { return d.num; });

      // Title + description
      groups.append('text')
        .attr('x', 30)
        .attr('dy', '-0.2em')
        .attr('fill', '#f0ece4')
        .attr('font-family', 'IBM Plex Sans, sans-serif')
        .attr('font-size', '13px')
        .attr('font-weight', '500')
        .text(function(d) { return d.title + ' — ' + d.subtitle; });

      groups.append('text')
        .attr('x', 30)
        .attr('dy', '1.2em')
        .attr('fill', '#a09888')
        .attr('font-family', 'IBM Plex Sans, sans-serif')
        .attr('font-size', '11px')
        .text(function(d) { return d.desc.substring(0, 70) + '...'; });

    } else {
      // Horizontal layout
      var xStep = (width - 80) / (principles.length - 1);
      var cy = height / 2;

      // Connecting line
      svg.append('line')
        .attr('x1', 40).attr('x2', width - 40)
        .attr('y1', cy).attr('y2', cy)
        .attr('stroke', 'rgba(200,180,140,0.15)')
        .attr('stroke-width', 1);

      var groups = svg.selectAll('.principle')
        .data(principles)
        .enter().append('g')
        .attr('class', 'principle')
        .attr('transform', function(d, i) { return 'translate(' + (40 + i * xStep) + ',' + cy + ')'; })
        .style('cursor', 'pointer');

      // Outer glow on hover
      groups.append('circle')
        .attr('r', 28)
        .attr('fill', 'transparent')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 1)
        .attr('class', 'principle-glow');

      // Main circles
      groups.append('circle')
        .attr('r', 22)
        .attr('fill', 'rgba(10,10,10,0.9)')
        .attr('stroke', function(d) { return d.color; })
        .attr('stroke-width', 1.5);

      // Numbers
      groups.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', function(d) { return d.color; })
        .attr('font-family', 'Fraunces, serif')
        .attr('font-size', '16px')
        .text(function(d) { return d.num; });

      // Title above
      groups.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -38)
        .attr('fill', '#f0ece4')
        .attr('font-family', 'IBM Plex Sans, sans-serif')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(function(d) { return d.title; });

      // Subtitle below
      groups.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 42)
        .attr('fill', '#6b6560')
        .attr('font-family', 'IBM Plex Mono, monospace')
        .attr('font-size', '9px')
        .text(function(d) { return d.subtitle; });

      // Hover effects
      groups.on('mouseover', function(event, d) {
        d3.select(this).select('.principle-glow')
          .attr('stroke', d.color)
          .attr('stroke-opacity', 0.3);
      }).on('mouseout', function() {
        d3.select(this).select('.principle-glow')
          .attr('stroke', 'transparent');
      });

      // Animate entry
      if (!prefersReducedMotion) {
        groups.style('opacity', 0);
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              d3.select(container).selectAll('.principle')
                .transition()
                .delay(function(d, i) { return i * 150; })
                .duration(600)
                .style('opacity', 1);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        observer.observe(container);
      }
    }
  }

  // ─── Maturity Stages Diagram ──────────────────────────────────────────────

  function initMaturityDiagram() {
    var container = document.getElementById('framework-maturity');
    if (!container || typeof d3 === 'undefined') return;

    var stages = [
      { num: 1, name: 'Foundational', range: '1.0–2.0', desc: 'Experimental. No shared infrastructure.',
        color: '#6b6560', focus: 'Appoint CAIO. Assess readiness. Stop starting pilots.' },
      { num: 2, name: 'Developing', range: '2.1–3.0', desc: 'Centralized function emerging.',
        color: '#887040', focus: 'Shared platform. Risk-tiered governance. Baselines.' },
      { num: 3, name: 'Established', range: '3.1–4.0', desc: 'AI at scale with governed infrastructure.',
        color: '#a89060', focus: 'Automate governance. Agentic strategy. Board reporting.' },
      { num: 4, name: 'Optimized', range: '4.1–5.0', desc: 'AI is an operating capability.',
        color: '#c8b48c', focus: 'Continuous optimization. Agentic at scale. Knowledge architecture.' }
    ];

    var width = container.clientWidth;
    var isMobile = width < 600;

    // Build HTML-based maturity path
    var html = '<div class="maturity-path">';

    stages.forEach(function(stage, i) {
      html += '<div class="maturity-stage" style="border-left: 3px solid ' + stage.color + ';">';
      html += '<div class="maturity-header">';
      html += '<span class="maturity-num" style="color:' + stage.color + ';">Stage ' + stage.num + '</span>';
      html += '<span class="maturity-name" style="color:#f0ece4;">' + stage.name + '</span>';
      html += '<span class="maturity-range" style="color:#6b6560;">' + stage.range + '</span>';
      html += '</div>';
      html += '<p class="maturity-desc" style="color:#a09888;font-size:13px;margin:8px 0 4px;">' + stage.desc + '</p>';
      html += '<p class="maturity-focus" style="color:#c8b48c;font-size:12px;font-family:\'IBM Plex Mono\',monospace;margin:0;">' + stage.focus + '</p>';
      html += '</div>';

      if (i < stages.length - 1) {
        html += '<div class="maturity-arrow" style="text-align:center;color:rgba(200,180,140,0.3);font-size:18px;margin:8px 0;">&#8595;</div>';
      }
    });

    html += '</div>';

    // Add styles
    var style = document.createElement('style');
    style.textContent = '.maturity-path{max-width:600px;margin:0 auto;}.maturity-stage{padding:16px 20px;margin:0;background:rgba(200,180,140,0.02);border-radius:0 4px 4px 0;transition:background 0.3s;}.maturity-stage:hover{background:rgba(200,180,140,0.05);}.maturity-header{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;}.maturity-num{font-family:"IBM Plex Mono",monospace;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;}.maturity-name{font-family:"Fraunces",serif;font-size:18px;font-weight:400;}.maturity-range{font-family:"IBM Plex Mono",monospace;font-size:10px;margin-left:auto;}';
    document.head.appendChild(style);

    container.innerHTML = html;

    // Animate entry
    if (!prefersReducedMotion) {
      var stageEls = container.querySelectorAll('.maturity-stage');
      stageEls.forEach(function(el) { el.style.opacity = '0'; el.style.transform = 'translateY(12px)'; el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'; });

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            stageEls.forEach(function(el, i) {
              setTimeout(function() { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, i * 150);
            });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      observer.observe(container);
    }
  }

})();
