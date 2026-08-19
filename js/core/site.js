/* =============================================================================
   site.js -- progress bar, opt-in reveal, mermaid lazy-load, GA4 events
   The Enterprise AI Operating System -- sunilprakash.com/enterprise-ai
   ============================================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ga(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  window.__ga = ga;

  // --- Reading progress ------------------------------------------------------
  function initProgress() {
    var bar = document.querySelector('.progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (window.pageYOffset / max) * 100)) : 0;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', Math.round(pct));
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // --- Reveal (opt-in: only elements that carry .reveal) ---------------------
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // --- Mermaid (lazy, light theme) -------------------------------------------
  function initMermaid() {
    if (document.body.dataset.hasMermaid !== 'true') return;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    s.async = true;
    s.onload = function () {
      /* global mermaid */
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#fbf9f4',
          primaryTextColor: '#16130e',
          primaryBorderColor: '#7a5c1e',
          lineColor: '#7d766a',
          secondaryColor: '#ece6d8',
          tertiaryColor: '#f5f1e8',
          fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
          fontSize: '14px'
        }
      });
      mermaid.run();
    };
    document.head.appendChild(s);
  }

  // --- Analytics events ------------------------------------------------------
  function initEvents() {
    var body = document.body;
    if (body.dataset.layout === 'hub') ga('hub_view', { discipline: body.dataset.discipline || '' });
    document.addEventListener('click', function (e) {
      var role = e.target.closest && e.target.closest('[data-role]');
      if (role) ga('role_path_selected', { role: role.getAttribute('data-role') });
      var nl = e.target.closest && e.target.closest('[data-ga="newsletter_click"]');
      if (nl) ga('newsletter_click', { page: body.dataset.page || '' });
      var pr = e.target.closest && e.target.closest('.print-btn');
      if (pr) { ga('print_brief', { page: body.dataset.page || '' }); window.print(); }
    });
  }

  function init() {
    initProgress();
    initReveal();
    initMermaid();
    initEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
