/* ═══════════════════════════════════════════════════════════════════════════
   atmosphere.js — Focus mode, scroll-reveal, progress bar, mermaid, pills
   Enterprise AI Playbook — sunilprakash.com/enterprise-ai
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Storage Key ───────────────────────────────────────────────────────────

  var STORAGE_KEY = 'obsidian_engagement';
  var PREF_KEY    = 'focusModePreference'; // values: "atmosphere" | "focus" | "auto"

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function readPreference() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 'auto';
      var data = JSON.parse(raw);
      return data[PREF_KEY] || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function writePreference(value) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      data[PREF_KEY] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage unavailable — silently ignore
    }
  }

  function isShowcasePage() {
    return document.body.classList.contains('showcase');
  }

  // ─── 1. Focus Mode Toggle ──────────────────────────────────────────────────

  function initFocusMode() {
    var body  = document.body;
    var btn   = document.querySelector('.focus-toggle');

    // Determine initial mode
    var pref = readPreference();
    var initialMode;

    if (pref === 'focus') {
      initialMode = 'focus';
    } else if (pref === 'atmosphere') {
      initialMode = 'atmosphere';
    } else {
      // "auto": showcase pages get atmosphere, standard pages get focus
      initialMode = isShowcasePage() ? 'atmosphere' : 'focus';
    }

    // Apply initial mode without transition
    body.classList.remove('atmosphere', 'focus');
    body.classList.add(initialMode);
    updateToggleButton(btn, initialMode);

    if (!btn) return;

    btn.addEventListener('click', function () {
      var currentMode = body.classList.contains('focus') ? 'focus' : 'atmosphere';
      var nextMode    = currentMode === 'focus' ? 'atmosphere' : 'focus';

      // Add transition class, swap mode, remove transition class after 0.6s
      body.classList.add('focus-transition');
      body.classList.remove('atmosphere', 'focus');
      body.classList.add(nextMode);

      setTimeout(function () {
        body.classList.remove('focus-transition');
      }, 600);

      writePreference(nextMode);
      updateToggleButton(btn, nextMode);
    });
  }

  function updateToggleButton(btn, mode) {
    if (!btn) return;
    // In atmosphere mode the toggle offers focus (show sun); in focus mode offer atmosphere (show crescent)
    btn.innerHTML = mode === 'atmosphere' ? '&#9789;' : '&#9728;';
    btn.setAttribute('aria-label', mode === 'atmosphere' ? 'Switch to focus mode' : 'Switch to atmosphere mode');
  }

  // ─── 2. Scroll Reveal ─────────────────────────────────────────────────────

  function initScrollReveal() {
    if (!window.IntersectionObserver) return;

    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;

        // In focus mode skip animation — CSS already sets opacity: 1 / transform: none
        // but we still add .revealed so any JS consumers can detect it
        el.classList.add('revealed');
        observer.unobserve(el);
      });
    }, { threshold: 0.10 });

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ─── 3. Scroll Progress Bar ────────────────────────────────────────────────

  function initScrollProgress() {
    var fill = document.querySelector('.progress-fill');
    if (!fill) return;

    var rafScheduled = false;

    function updateProgress() {
      rafScheduled = false;
      var scrollTop  = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight  = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = pct.toFixed(2) + '%';

      // Keep ARIA attribute in sync for accessibility
      var bar = fill.parentElement;
      if (bar) bar.setAttribute('aria-valuenow', Math.round(pct));
    }

    window.addEventListener('scroll', function () {
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(updateProgress);
      }
    }, { passive: true });

    // Set initial value
    updateProgress();
  }

  // ─── 4. Mermaid Lazy-Load ─────────────────────────────────────────────────

  function initMermaid() {
    if (document.body.dataset.hasMermaid !== 'true') return;

    var script   = document.createElement('script');
    script.src   = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.async = true;

    script.onload = function () {
      /* global mermaid */
      mermaid.initialize({
        theme: 'base',
        themeVariables: {
          primaryColor:       '#1a1816',
          primaryTextColor:   '#f0ece4',
          primaryBorderColor: '#c8b48c',
          lineColor:          '#6b6560',
          secondaryColor:     '#141210',
          tertiaryColor:      '#0a0a0a',
        },
      });
      mermaid.run();
    };

    document.head.appendChild(script);
  }

  // ─── 5. Bottom Pills Auto-Hide ────────────────────────────────────────────

  function initPillsAutoHide() {
    var pills = document.querySelector('.section-pills');
    if (!pills) return;

    var lastScrollY    = window.pageYOffset;
    var scrollDownStart = null;   // timestamp when we first detected downward scroll
    var HIDE_DELAY_MS  = 3000;    // 3 seconds of scrolling down before hiding
    var BOTTOM_ZONE_PX = 60;      // px from bottom edge

    // Mouse bottom-zone tracking
    var mouseInBottomZone   = false;
    var mouseLeaveTimer     = null;

    function showPills() {
      pills.classList.remove('pills-hidden');
    }

    function hidePills() {
      pills.classList.add('pills-hidden');
    }

    // Scroll direction detection (rAF-throttled)
    var scrollRafScheduled = false;

    window.addEventListener('scroll', function () {
      if (scrollRafScheduled) return;
      scrollRafScheduled = true;

      requestAnimationFrame(function () {
        scrollRafScheduled = false;
        var currentY   = window.pageYOffset;
        var scrollingDown = currentY > lastScrollY;
        lastScrollY    = currentY;

        if (scrollingDown) {
          if (scrollDownStart === null) {
            scrollDownStart = Date.now();
          } else if (Date.now() - scrollDownStart >= HIDE_DELAY_MS) {
            if (!mouseInBottomZone) hidePills();
          }
        } else {
          // Scrolled up — reset timer and show pills
          scrollDownStart = null;
          showPills();
        }
      });
    }, { passive: true });

    // Mouse proximity to bottom edge
    window.addEventListener('mousemove', function (e) {
      var fromBottom = window.innerHeight - e.clientY;
      var inZone     = fromBottom <= BOTTOM_ZONE_PX;

      if (inZone && !mouseInBottomZone) {
        // Entered zone
        mouseInBottomZone = true;
        if (mouseLeaveTimer !== null) {
          clearTimeout(mouseLeaveTimer);
          mouseLeaveTimer = null;
        }
        showPills();
      } else if (!inZone && mouseInBottomZone) {
        // Left zone — start 3s timer then hide
        mouseInBottomZone = false;
        mouseLeaveTimer = setTimeout(function () {
          mouseLeaveTimer = null;
          // Only re-hide if user was scrolling down
          if (scrollDownStart !== null) hidePills();
        }, HIDE_DELAY_MS);
      }
    }, { passive: true });
  }

  // ─── 6. Add Scroll-Reveal Classes to Article Children ─────────────────────

  function addRevealClasses() {
    var BLOCK_TAGS = new Set(['P', 'H2', 'H3', 'H4', 'DIV', 'TABLE', 'BLOCKQUOTE', 'PRE', 'UL', 'OL']);
    var articles   = document.querySelectorAll('article');

    articles.forEach(function (article) {
      var children = article.children;
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (BLOCK_TAGS.has(child.tagName)) {
          child.classList.add('reveal');
        }
      }
    });
  }

  // ─── Main init ────────────────────────────────────────────────────────────

  function initAtmosphere() {
    // Focus mode: can run immediately (body already in DOM)
    initFocusMode();

    // Everything else: wait for DOM content
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        addRevealClasses();
        initScrollReveal();
        initScrollProgress();
        initMermaid();
        initPillsAutoHide();
      });
    } else {
      // DOMContentLoaded already fired (e.g. script is deferred)
      addRevealClasses();
      initScrollReveal();
      initScrollProgress();
      initMermaid();
      initPillsAutoHide();
    }
  }

  // Expose globally
  window.initAtmosphere = initAtmosphere;

}());
