/* ═══════════════════════════════════════════════════════════════════════════
   nav.js — Navigation system: command palette, section pills, mobile overlay
   Enterprise AI Playbook — sunilprakash.com/enterprise-ai
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────

  var fuse = null;
  var searchIndexLoaded = false;
  var selectedIndex = -1;
  var currentResults = [];
  var paletteEl = null;
  var inputEl = null;
  var resultsEl = null;
  var mobileOverlayEl = null;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function basePath() {
    return (window.__BASE_PATH__ || '').replace(/\/$/, '');
  }

  function pageUrl(result) {
    var path = result.path || '';
    if (path === '') {
      return basePath() + '/';
    }
    return basePath() + '/' + path + '/';
  }

  function recentPages() {
    try {
      var raw = localStorage.getItem('obsidian_engagement');
      if (!raw) return [];
      var data = JSON.parse(raw);
      var visited = Array.isArray(data.pagesVisited) ? data.pagesVisited : [];
      // Deduplicate by path, keep last 5
      var seen = {};
      var deduped = [];
      for (var i = visited.length - 1; i >= 0; i--) {
        var p = visited[i];
        var key = p.path || p.slug || p.title || JSON.stringify(p);
        if (!seen[key]) {
          seen[key] = true;
          deduped.unshift(p);
        }
      }
      return deduped.slice(-5);
    } catch (e) {
      return [];
    }
  }

  // ─── Search Index Loading ────────────────────────────────────────────────────

  function loadSearchIndex(cb) {
    if (searchIndexLoaded && fuse) {
      cb();
      return;
    }
    var url = basePath() + '/search-index.json';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          fuse = new Fuse(data, {
            keys: ['title', 'section', 'description'],
            threshold: 0.3,
            includeScore: true,
          });
          searchIndexLoaded = true;
          cb();
        } catch (e) {
          // Fuse init failed — palette will show recent only
          cb();
        }
      } else {
        cb();
      }
    };
    xhr.onerror = function () { cb(); };
    xhr.send();
  }

  // ─── Results Rendering ──────────────────────────────────────────────────────

  function renderResults(items, emptyLabel) {
    if (!resultsEl) return;
    selectedIndex = -1;
    currentResults = items;

    if (items.length === 0) {
      resultsEl.innerHTML = '<div class="cmd-section-header">' + (emptyLabel || 'No results') + '</div>';
      return;
    }

    // Group by section
    var groups = {};
    var groupOrder = [];
    for (var i = 0; i < items.length; i++) {
      var sec = items[i].section || 'Pages';
      if (!groups[sec]) {
        groups[sec] = [];
        groupOrder.push(sec);
      }
      groups[sec].push({ item: items[i], originalIndex: i });
    }

    var html = '';
    for (var gi = 0; gi < groupOrder.length; gi++) {
      var secName = groupOrder[gi];
      html += '<div class="cmd-section-header">' + escHtml(secName) + '</div>';
      var secItems = groups[secName];
      for (var si = 0; si < secItems.length; si++) {
        var entry = secItems[si];
        var idx = entry.originalIndex;
        var item = entry.item;
        html += '<div class="cmd-result" data-index="' + idx + '" role="option" tabindex="-1">';
        html += '<span class="cmd-result-title">' + escHtml(item.title || '') + '</span>';
        html += '<span class="cmd-result-section">' + escHtml(item.section || '') + '</span>';
        html += '</div>';
      }
    }

    resultsEl.innerHTML = html;

    // Attach click handlers
    var resultEls = resultsEl.querySelectorAll('.cmd-result');
    for (var ri = 0; ri < resultEls.length; ri++) {
      resultEls[ri].addEventListener('click', onResultClick);
    }
  }

  function onResultClick(e) {
    var el = e.currentTarget;
    var idx = parseInt(el.getAttribute('data-index'), 10);
    navigateToResult(idx);
  }

  function navigateToResult(idx) {
    if (idx < 0 || idx >= currentResults.length) return;
    var result = currentResults[idx];
    var url = pageUrl(result);
    closePalette();
    window.location.href = url;
  }

  function updateSelection(newIndex) {
    var resultEls = resultsEl ? resultsEl.querySelectorAll('.cmd-result') : [];
    // Remove current selection
    if (selectedIndex >= 0 && selectedIndex < resultEls.length) {
      resultEls[selectedIndex].classList.remove('selected');
    }
    selectedIndex = newIndex;
    if (selectedIndex >= 0 && selectedIndex < resultEls.length) {
      resultEls[selectedIndex].classList.add('selected');
      resultEls[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Palette Open / Close ────────────────────────────────────────────────────

  function openPalette() {
    if (!paletteEl) return;
    paletteEl.classList.add('open');
    paletteEl.setAttribute('role', 'dialog');
    paletteEl.setAttribute('aria-modal', 'true');
    paletteEl.setAttribute('aria-label', 'Command palette');
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
    // Load search index on first open, then show recent pages
    loadSearchIndex(function () {
      showRecentPages();
    });
  }

  function closePalette() {
    if (!paletteEl) return;
    paletteEl.classList.remove('open');
    paletteEl.removeAttribute('role');
    paletteEl.removeAttribute('aria-modal');
    if (resultsEl) resultsEl.innerHTML = '';
    selectedIndex = -1;
    currentResults = [];
  }

  function showRecentPages() {
    var recent = recentPages();
    if (recent.length === 0) {
      if (resultsEl) resultsEl.innerHTML = '<div class="cmd-section-header">Type to search</div>';
      return;
    }
    renderResults(recent, 'Recent');
    // Prepend "Recent" header before the section groups
    if (resultsEl) {
      var firstHeader = resultsEl.querySelector('.cmd-section-header');
      if (firstHeader) firstHeader.textContent = 'Recent';
    }
  }

  // ─── Keyboard Navigation in Palette ─────────────────────────────────────────

  function getFocusableElements() {
    if (!paletteEl) return [];
    return Array.prototype.slice.call(
      paletteEl.querySelectorAll('input, button, [tabindex="0"], [tabindex="-1"].selected, a[href]')
    ).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }

  function onPaletteKeydown(e) {
    var resultEls = resultsEl ? resultsEl.querySelectorAll('.cmd-result') : [];
    var count = resultEls.length;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var next = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
      updateSelection(next);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      var prev = selectedIndex > 0 ? selectedIndex - 1 : count - 1;
      updateSelection(prev);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        navigateToResult(selectedIndex);
      } else if (count > 0) {
        navigateToResult(0);
      }
      return;
    }

    // Focus trap: Tab cycles within palette
    if (e.key === 'Tab') {
      var focusable = getFocusableElements();
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function onInputChange() {
    if (!inputEl) return;
    var query = inputEl.value.trim();
    if (!query) {
      showRecentPages();
      return;
    }
    if (!fuse) {
      if (resultsEl) resultsEl.innerHTML = '<div class="cmd-section-header">Loading search…</div>';
      return;
    }
    var fuseResults = fuse.search(query);
    var items = fuseResults.slice(0, 20).map(function (r) { return r.item; });
    renderResults(items, 'No results for "' + escHtml(query) + '"');
  }

  // ─── Command Palette Init ────────────────────────────────────────────────────

  function initCommandPalette() {
    paletteEl = document.querySelector('.cmd-palette');
    if (!paletteEl) {
      // Create palette structure if missing
      paletteEl = document.createElement('div');
      paletteEl.className = 'cmd-palette';
      paletteEl.innerHTML =
        '<div class="cmd-search-box">' +
        '<input class="cmd-input" type="text" placeholder="Search pages…" autocomplete="off" spellcheck="false" aria-label="Search pages">' +
        '<div class="cmd-results" role="listbox" aria-label="Search results"></div>' +
        '</div>';
      document.body.appendChild(paletteEl);
    }

    inputEl = paletteEl.querySelector('.cmd-input');
    resultsEl = paletteEl.querySelector('.cmd-results');

    // Keyboard shortcut: Cmd+K / Ctrl+K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (paletteEl.classList.contains('open')) {
          closePalette();
        } else {
          openPalette();
        }
      }
    });

    // Click on .cmd-trigger
    var triggers = document.querySelectorAll('.cmd-trigger');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.stopPropagation();
        openPalette();
      });
    }

    // Close on click outside the search box
    paletteEl.addEventListener('click', function (e) {
      if (!e.target.closest('.cmd-search-box')) {
        closePalette();
      }
    });

    // Input events
    if (inputEl) {
      inputEl.addEventListener('input', onInputChange);
      inputEl.addEventListener('keydown', onPaletteKeydown);
    }

    // Keyboard navigation (arrow keys, enter, escape, tab)
    paletteEl.addEventListener('keydown', function (e) {
      if (e.target !== inputEl) {
        onPaletteKeydown(e);
      }
    });
  }

  // ─── Section Pills ───────────────────────────────────────────────────────────

  function initSectionPills() {
    var navData = window.__NAV_DATA__;
    if (!navData || !Array.isArray(navData)) return;

    // Find or create container
    var container = document.querySelector('.section-pills');
    if (!container) {
      container = document.createElement('div');
      container.className = 'section-pills';
      document.body.appendChild(container);
    }

    // Clear existing pills
    container.innerHTML = '';

    var currentSection = document.body.dataset.section || '';

    for (var i = 0; i < navData.length; i++) {
      var item = navData[i];

      // Determine label and href
      var label, href;

      if (item.slug === 'homepage') {
        // Home pill
        label = 'Home';
        href = basePath() + '/';
      } else if (item.pages && item.pages.length > 0) {
        // Section with child pages — link to first page
        label = item.title;
        var firstPage = item.pages[0];
        var firstPath = firstPage.path || '';
        href = firstPath === '' ? basePath() + '/' : basePath() + '/' + firstPath + '/';
      } else {
        continue;
      }

      var pill = document.createElement('a');
      pill.className = 'sec-pill';
      pill.href = href;
      pill.textContent = label;

      // Mark active
      if (item.slug === 'homepage') {
        if (currentSection === 'Home' || document.body.dataset.page === 'homepage') {
          pill.classList.add('active');
        }
      } else if (item.title === currentSection) {
        pill.classList.add('active');
      }

      container.appendChild(pill);
    }
  }

  // ─── Mobile Overlay ──────────────────────────────────────────────────────────

  function buildMobileOverlay() {
    var navData = window.__NAV_DATA__;
    if (!navData || !Array.isArray(navData)) return;

    // Create overlay element
    var overlay = document.createElement('div');
    overlay.className = 'mob-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Navigation menu');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'mob-overlay-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.textContent = '\u00D7'; // ×
    overlay.appendChild(closeBtn);

    var list = document.createElement('div');
    list.className = 'mob-overlay-list';

    for (var i = 0; i < navData.length; i++) {
      var item = navData[i];

      if (item.slug === 'homepage') {
        var homeLink = document.createElement('a');
        homeLink.className = 'mob-section-title mob-home-link';
        homeLink.href = basePath() + '/';
        homeLink.textContent = 'Home';
        list.appendChild(homeLink);
        continue;
      }

      if (!item.pages || item.pages.length === 0) continue;

      var sectionWrap = document.createElement('div');
      sectionWrap.className = 'mob-section';

      var sectionTitle = document.createElement('button');
      sectionTitle.className = 'mob-section-title';
      sectionTitle.setAttribute('aria-expanded', 'false');
      sectionTitle.textContent = item.title;

      var pageList = document.createElement('div');
      pageList.className = 'mob-page-list';
      pageList.setAttribute('aria-hidden', 'true');

      for (var pi = 0; pi < item.pages.length; pi++) {
        var pg = item.pages[pi];
        var pgPath = pg.path || '';
        var pgHref = pgPath === '' ? basePath() + '/' : basePath() + '/' + pgPath + '/';

        var pgLink = document.createElement('a');
        pgLink.className = 'mob-page-link';
        pgLink.href = pgHref;
        pgLink.textContent = pg.title;
        pageList.appendChild(pgLink);
      }

      // Toggle accordion
      (function (btn, pList) {
        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          pList.setAttribute('aria-hidden', String(expanded));
          pList.classList.toggle('mob-page-list--open', !expanded);
        });
      }(sectionTitle, pageList));

      sectionWrap.appendChild(sectionTitle);
      sectionWrap.appendChild(pageList);
      list.appendChild(sectionWrap);
    }

    overlay.appendChild(list);

    // Close on button click
    closeBtn.addEventListener('click', closeMobileOverlay);

    // Close on page link click (navigate)
    overlay.addEventListener('click', function (e) {
      var link = e.target.closest('.mob-page-link, .mob-home-link');
      if (link) {
        closeMobileOverlay();
      }
    });

    document.body.appendChild(overlay);
    mobileOverlayEl = overlay;
  }

  function openMobileOverlay() {
    if (!mobileOverlayEl) buildMobileOverlay();
    if (!mobileOverlayEl) return;
    mobileOverlayEl.classList.add('mob-overlay--open');
    document.body.classList.add('mob-overlay-active');
    // Focus close button
    var closeBtn = mobileOverlayEl.querySelector('.mob-overlay-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeMobileOverlay() {
    if (!mobileOverlayEl) return;
    mobileOverlayEl.classList.remove('mob-overlay--open');
    document.body.classList.remove('mob-overlay-active');
    // Return focus to hamburger
    var ham = document.querySelector('.mob-hamburger');
    if (ham) ham.focus();
  }

  function initMobileNav() {
    var isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;

    // Hide breadcrumb (already done via CSS, but ensure it here too)
    var breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) breadcrumb.style.display = 'none';

    // Create hamburger button if not present
    var ham = document.querySelector('.mob-hamburger');
    if (!ham) {
      ham = document.createElement('button');
      ham.className = 'mob-hamburger';
      ham.setAttribute('aria-label', 'Open navigation menu');
      ham.setAttribute('aria-expanded', 'false');
      ham.innerHTML = '<span></span><span></span><span></span>';

      var navActions = document.querySelector('.nav-actions');
      if (navActions) {
        navActions.insertBefore(ham, navActions.firstChild);
      } else {
        var navInner = document.querySelector('.nav-inner');
        if (navInner) navInner.appendChild(ham);
      }
    }

    ham.addEventListener('click', function () {
      var isOpen = mobileOverlayEl && mobileOverlayEl.classList.contains('mob-overlay--open');
      if (isOpen) {
        closeMobileOverlay();
        ham.setAttribute('aria-expanded', 'false');
      } else {
        openMobileOverlay();
        ham.setAttribute('aria-expanded', 'true');
      }
    });

    // Escape key closes overlay
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileOverlayEl && mobileOverlayEl.classList.contains('mob-overlay--open')) {
        closeMobileOverlay();
        ham.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ─── CSS for Mobile Overlay (injected — no separate file needed) ─────────────

  function injectMobileOverlayCss() {
    var isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;

    var style = document.createElement('style');
    style.id = 'nav-mobile-styles';
    style.textContent = [
      // Hamburger button
      '.mob-hamburger{display:flex;flex-direction:column;justify-content:center;gap:4px;width:32px;height:32px;background:transparent;border:1px solid rgba(200,180,140,0.15);border-radius:4px;padding:6px;cursor:pointer;}',
      '.mob-hamburger span{display:block;height:1px;background:var(--label);transition:background 0.2s;}',
      '.mob-hamburger:hover span{background:var(--gold);}',
      // Overlay backdrop
      '.mob-overlay{position:fixed;inset:0;z-index:300;background:rgba(10,10,10,0.98);overflow-y:auto;display:none;flex-direction:column;padding:24px 0;}',
      '.mob-overlay--open{display:flex;}',
      // Close button
      '.mob-overlay-close{position:absolute;top:16px;right:20px;width:40px;height:40px;background:transparent;border:1px solid rgba(200,180,140,0.15);border-radius:50%;color:var(--label);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
      '.mob-overlay-close:hover{color:var(--gold);border-color:var(--gold);}',
      // List
      '.mob-overlay-list{margin-top:56px;padding:0 24px;}',
      // Section titles
      '.mob-section-title{display:block;width:100%;text-align:left;background:transparent;border:none;border-bottom:1px solid rgba(200,180,140,0.06);padding:16px 0;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--gold);cursor:pointer;}',
      '.mob-home-link{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--gold);text-decoration:none;display:block;padding:16px 0;border-bottom:1px solid rgba(200,180,140,0.06);}',
      // Page links
      '.mob-page-list{overflow:hidden;max-height:0;transition:max-height 0.3s ease;}',
      '.mob-page-list--open{max-height:1000px;}',
      '.mob-page-link{display:block;padding:12px 0 12px 16px;color:var(--text);font-size:14px;text-decoration:none;border-bottom:1px solid rgba(200,180,140,0.03);}',
      '.mob-page-link:hover{color:var(--heading);}',
      // Prevent body scroll when overlay open
      '.mob-overlay-active{overflow:hidden;}',
    ].join('');

    document.head.appendChild(style);
  }

  // ─── Main initNav ────────────────────────────────────────────────────────────

  function initNav() {
    initCommandPalette();
    initSectionPills();
    injectMobileOverlayCss();
    initMobileNav();
  }

  // Expose globally
  window.initNav = initNav;

}());
