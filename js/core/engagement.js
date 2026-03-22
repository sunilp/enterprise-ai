/* ═══════════════════════════════════════════════════════════════════════════
   engagement.js — Reading progress, bookmarks, return recognition, progress ring
   Enterprise AI Playbook — sunilprakash.com/enterprise-ai
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────

  var STORAGE_KEY         = 'obsidian_engagement';
  var SESSION_KEY         = 'obsidian_session_counted';
  var SAVE_INTERVAL_MS    = 5000;
  var SCHEMA_VERSION      = 1;

  // ─── Module State ──────────────────────────────────────────────────────────

  var state = null;          // current engagement object (in-memory mirror of localStorage)
  var saveTimer = null;      // periodic save timer handle

  // ─── Storage Helpers ───────────────────────────────────────────────────────

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        // Migrate / fill gaps if structure is older
        return normalise(parsed);
      }
    } catch (e) {
      // localStorage unavailable or JSON corrupt — fall through to defaults
    }
    return createDefault();
  }

  function createDefault() {
    return {
      version: SCHEMA_VERSION,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      visitCount: 0,              // will be incremented during init
      pagesVisited: [],
      sectionsExplored: [],
      bookmarkedInsights: [],
      assessmentCompleted: false,
      assessmentResults: null,
      focusModePreference: 'auto',
      readingProgress: {},
    };
  }

  function normalise(data) {
    // Ensure every expected key exists (forward-compat)
    if (!data.version)              data.version = SCHEMA_VERSION;
    if (!data.firstVisit)           data.firstVisit = new Date().toISOString();
    if (!data.lastVisit)            data.lastVisit = new Date().toISOString();
    if (typeof data.visitCount !== 'number') data.visitCount = 1;
    if (!Array.isArray(data.pagesVisited))   data.pagesVisited = [];
    if (!Array.isArray(data.sectionsExplored)) data.sectionsExplored = [];
    if (!Array.isArray(data.bookmarkedInsights)) data.bookmarkedInsights = [];
    if (data.assessmentCompleted === undefined) data.assessmentCompleted = false;
    if (data.assessmentResults === undefined)   data.assessmentResults = null;
    if (!data.focusModePreference) data.focusModePreference = 'auto';
    if (!data.readingProgress || typeof data.readingProgress !== 'object') {
      data.readingProgress = {};
    }
    return data;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Quota exceeded or private mode — silently ignore
    }
  }

  function scheduleSave() {
    if (saveTimer !== null) return;
    saveTimer = setTimeout(function () {
      saveTimer = null;
      saveState();
    }, SAVE_INTERVAL_MS);
  }

  // ─── Page / Section Info ──────────────────────────────────────────────────

  function currentSlug() {
    return document.body.dataset.page || '';
  }

  function currentSection() {
    return document.body.dataset.section || '';
  }

  function basePath() {
    return (window.__BASE_PATH__ || '').replace(/\/$/, '');
  }

  // ─── Total Sections Count ─────────────────────────────────────────────────

  function countTotalSections() {
    var navData = window.__NAV_DATA__;
    if (!navData || !Array.isArray(navData)) return 1;
    var count = 0;
    for (var i = 0; i < navData.length; i++) {
      var item = navData[i];
      // Count home entry and any entry with child pages
      if (item.slug === 'homepage' || (Array.isArray(item.pages) && item.pages.length > 0)) {
        count++;
      }
    }
    return count || 1;
  }

  // ─── 1. State Management ──────────────────────────────────────────────────

  function initState() {
    state = loadState();

    // Update last visit timestamp
    state.lastVisit = new Date().toISOString();

    // Increment visit count once per browser session
    var alreadyCounted = false;
    try {
      alreadyCounted = !!sessionStorage.getItem(SESSION_KEY);
    } catch (e) { /* sessionStorage unavailable */ }

    if (!alreadyCounted) {
      state.visitCount = (state.visitCount || 0) + 1;
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (e) { /* ignore */ }
    }

    // Record page visit (store as object matching nav.js recentPages() expectations)
    var slug = currentSlug();
    if (slug) {
      // Check if already present
      var alreadyVisited = false;
      for (var i = 0; i < state.pagesVisited.length; i++) {
        var entry = state.pagesVisited[i];
        var entrySlug = (typeof entry === 'object') ? (entry.slug || entry.path) : entry;
        if (entrySlug === slug) {
          alreadyVisited = true;
          break;
        }
      }
      if (!alreadyVisited) {
        // Build path: homepage -> '', others -> slug (same shape as flatNav pages)
        var pagePath = slug === 'homepage' ? '' : slug;
        // Find title from navData if possible
        var pageTitle = document.title.split(' - ')[0] || slug;
        state.pagesVisited.push({
          slug: slug,
          path: pagePath,
          title: pageTitle,
          section: currentSection(),
        });
      }
    }

    // Record section explored
    var sec = currentSection();
    if (sec && state.sectionsExplored.indexOf(sec) === -1) {
      state.sectionsExplored.push(sec);
    }

    saveState();
  }

  // ─── 2. Reading Progress Tracking ────────────────────────────────────────

  function initReadingProgress() {
    if (!window.IntersectionObserver) return;

    var slug = currentSlug();
    if (!slug) return;

    var article = document.querySelector('article');
    if (!article) return;

    // Collect trackable block elements
    var BLOCK_TAGS = { P: 1, H2: 1, H3: 1, H4: 1, DIV: 1, TABLE: 1, BLOCKQUOTE: 1, PRE: 1, UL: 1, OL: 1 };
    var sections = [];
    var children = article.children;
    for (var i = 0; i < children.length; i++) {
      if (BLOCK_TAGS[children[i].tagName]) {
        sections.push(children[i]);
      }
    }
    if (!sections.length) return;

    var totalSections = sections.length;
    var visibleCount  = 0;
    var seen          = {};    // index -> boolean

    var observer = new IntersectionObserver(function (entries) {
      var changed = false;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = parseInt(entry.target.getAttribute('data-eng-idx'), 10);
        if (!seen[idx]) {
          seen[idx] = true;
          visibleCount++;
          changed = true;
        }
      });
      if (changed) {
        state.readingProgress[slug] = parseFloat(
          Math.min(visibleCount / totalSections, 1).toFixed(3)
        );
        scheduleSave();
      }
    }, { threshold: 0.15 });

    for (var j = 0; j < sections.length; j++) {
      sections[j].setAttribute('data-eng-idx', String(j));
      observer.observe(sections[j]);
    }
  }

  // ─── 3. Ambient Progress Ring ────────────────────────────────────────────

  function initProgressRing() {
    var container = document.querySelector('.progress-ring');
    if (!container) return;

    var totalSections = countTotalSections();
    var explored      = state.sectionsExplored.length;
    var fraction      = totalSections > 0 ? Math.min(explored / totalSections, 1) : 0;

    // SVG dimensions
    var SIZE   = 24;
    var RADIUS = 9;
    var CX     = SIZE / 2;
    var CY     = SIZE / 2;
    var CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    // Build SVG
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg   = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + SIZE + ' ' + SIZE);
    svg.setAttribute('aria-hidden', 'true');

    // Background track
    var bgCircle = document.createElementNS(svgNS, 'circle');
    bgCircle.setAttribute('class', 'progress-ring-bg');
    bgCircle.setAttribute('cx', String(CX));
    bgCircle.setAttribute('cy', String(CY));
    bgCircle.setAttribute('r', String(RADIUS));
    svg.appendChild(bgCircle);

    // Progress arc
    var fgCircle = document.createElementNS(svgNS, 'circle');
    fgCircle.setAttribute('class', 'progress-ring-circle');
    fgCircle.setAttribute('cx', String(CX));
    fgCircle.setAttribute('cy', String(CY));
    fgCircle.setAttribute('r', String(RADIUS));
    // Start arc from top (rotate -90deg via stroke-dashoffset trick)
    fgCircle.style.transformOrigin = CX + 'px ' + CY + 'px';
    fgCircle.style.transform = 'rotate(-90deg)';
    var dashOffset = CIRCUMFERENCE * (1 - fraction);
    fgCircle.setAttribute('stroke-dasharray', String(CIRCUMFERENCE));
    fgCircle.setAttribute('stroke-dashoffset', String(dashOffset.toFixed(3)));
    svg.appendChild(fgCircle);

    // Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'progress-ring-tooltip';
    tooltip.textContent = explored + ' of ' + totalSections + ' sections explored';

    container.appendChild(svg);
    container.appendChild(tooltip);

    // Accessibility
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.setAttribute('aria-label', explored + ' of ' + totalSections + ' sections explored');

    // Click: navigate to reading paths (index / home serves as overview)
    function navigateToOverview() {
      window.location.href = basePath() + '/';
    }

    container.addEventListener('click', navigateToOverview);
    container.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToOverview();
      }
    });
  }

  // ─── 4. Return Recognition ────────────────────────────────────────────────

  function initReturnRecognition() {
    var slug = currentSlug();
    if (slug !== 'homepage') return;
    if (state.visitCount < 2) return;

    // Find anchor element — prefer .showcase-hero, fall back to first h1
    var anchor = document.querySelector('.showcase-hero') || document.querySelector('h1');
    if (!anchor) return;

    var el = document.createElement('div');
    el.className = 'welcome-back';
    el.textContent = 'Welcome back';

    // Inline styles — no extra CSS class needed; matches spec styling
    el.style.cssText = [
      'color:#c8b48c',
      'font-family:var(--font-mono,"IBM Plex Mono",monospace)',
      'font-size:10px',
      'text-transform:uppercase',
      'letter-spacing:2px',
      'opacity:0',
      'transition:opacity 0.5s ease',
      'margin-top:8px',
      'display:block',
    ].join(';');

    // Insert after anchor element
    anchor.insertAdjacentElement('afterend', el);

    // Fade in → hold → fade out → remove
    // Use requestAnimationFrame to ensure element is painted before transition starts
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = '1';

        setTimeout(function () {
          el.style.opacity = '0';
          setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, 500);
        }, 2500);   // 0.5s fade-in + 2s hold = 2.5s before fade-out starts
      });
    });
  }

  // ─── 5. Insight Bookmarks ────────────────────────────────────────────────

  function initInsightBookmarks() {
    var boxes = document.querySelectorAll('.insight-box');
    if (!boxes.length) return;

    var slug = currentSlug();

    // Inject minimal CSS for bookmark buttons once
    injectBookmarkStyles();

    for (var i = 0; i < boxes.length; i++) {
      attachBookmarkButton(boxes[i], i, slug);
    }
  }

  function injectBookmarkStyles() {
    if (document.getElementById('eng-bookmark-styles')) return;
    var style = document.createElement('style');
    style.id = 'eng-bookmark-styles';
    style.textContent = [
      '.insight-bookmark-btn{',
        'position:absolute;',
        'top:8px;',
        'right:8px;',
        'width:20px;',
        'height:20px;',
        'background:transparent;',
        'border:none;',
        'cursor:pointer;',
        'padding:0;',
        'display:flex;',
        'align-items:center;',
        'justify-content:center;',
        'opacity:0;',
        'transition:opacity 0.2s ease;',
        'color:rgba(200,180,140,0.4);',
        'font-size:16px;',
        'line-height:1;',
      '}',
      '.insight-box:hover .insight-bookmark-btn,',
      '.insight-bookmark-btn:focus{opacity:1;}',
      '.insight-bookmark-btn.bookmarked{color:#c8b48c;opacity:1;}',
      '.insight-bookmark-btn:hover{color:#c8b48c;}',
    ].join('');
    document.head.appendChild(style);
  }

  function getInsightText(box) {
    // Grab plain text from the insight box, trimmed to ~120 chars
    var text = (box.textContent || '').trim().replace(/\s+/g, ' ');
    return text.length > 120 ? text.substring(0, 117) + '...' : text;
  }

  function isBookmarked(slug, text) {
    for (var i = 0; i < state.bookmarkedInsights.length; i++) {
      var b = state.bookmarkedInsights[i];
      if (b.page === slug && b.text === text) return true;
    }
    return false;
  }

  function addBookmark(slug, text) {
    state.bookmarkedInsights.push({
      page: slug,
      text: text,
      timestamp: new Date().toISOString(),
    });
    saveState();
  }

  function removeBookmark(slug, text) {
    state.bookmarkedInsights = state.bookmarkedInsights.filter(function (b) {
      return !(b.page === slug && b.text === text);
    });
    saveState();
  }

  function attachBookmarkButton(box, idx, slug) {
    var text   = getInsightText(box);
    var btn    = document.createElement('button');
    var marked = isBookmarked(slug, text);

    btn.className = 'insight-bookmark-btn' + (marked ? ' bookmarked' : '');
    btn.setAttribute('aria-label', marked ? 'Remove bookmark' : 'Bookmark this insight');
    btn.setAttribute('title', marked ? 'Remove bookmark' : 'Bookmark this insight');
    btn.textContent = '\u2691';   // ⑁ solid bookmark flag

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var currentlyBookmarked = btn.classList.contains('bookmarked');
      if (currentlyBookmarked) {
        removeBookmark(slug, text);
        btn.classList.remove('bookmarked');
        btn.setAttribute('aria-label', 'Bookmark this insight');
        btn.setAttribute('title', 'Bookmark this insight');
      } else {
        addBookmark(slug, text);
        btn.classList.add('bookmarked');
        btn.setAttribute('aria-label', 'Remove bookmark');
        btn.setAttribute('title', 'Remove bookmark');
      }
    });

    box.appendChild(btn);
  }

  // ─── 6. Export ────────────────────────────────────────────────────────────

  function getEngagementData() {
    return state ? Object.assign({}, state) : null;
  }

  // ─── Main initEngagement ──────────────────────────────────────────────────

  function initEngagement() {
    initState();
    initReadingProgress();
    initProgressRing();
    initReturnRecognition();
    initInsightBookmarks();
  }

  // ─── Expose globally ─────────────────────────────────────────────────────

  window.initEngagement    = initEngagement;
  window.getEngagementData = getEngagementData;

}());
