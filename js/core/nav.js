/* =============================================================================
   nav.js -- disciplines menu, mobile sheet, command palette (plain-text search)
   The Enterprise AI Operating System -- sunilprakash.com/enterprise-ai
   ============================================================================= */

(function () {
  'use strict';

  var NAV = window.__NAV_DATA__ || { disciplines: [], groups: [], tools: [] };
  var BASE = (window.__BASE_PATH__ || '').replace(/\/$/, '');

  function href(p) { return p === '' ? BASE + '/' : BASE + '/' + p + '/'; }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // --- Disciplines menu ------------------------------------------------------
  function initMenu() {
    var wrap = document.querySelector('.topnav .has-menu');
    var btn = wrap && wrap.querySelector('.menu-btn');
    var menu = wrap && wrap.querySelector('.menu');
    if (!wrap || !btn || !menu) return;
    menu.innerHTML = NAV.disciplines.map(function (d) {
      return '<a role="menuitem" href="' + href(d.path) + '"><span class="n">' + pad2(d.number) + '</span><span>' + esc(d.name) + '<span class="q">' + esc(d.question) + '</span></span></a>';
    }).join('');
    function open() { wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // --- Mobile sheet ----------------------------------------------------------
  function initSheet() {
    var toggle = document.querySelector('.menu-toggle');
    var sheet = document.getElementById('mobile-sheet');
    if (!toggle || !sheet) return;
    var html = '<button type="button" class="close">Close menu</button>';
    html += '<h2 class="foot-h">Disciplines</h2>' + NAV.disciplines.map(function (d) {
      return '<a href="' + href(d.path) + '">' + pad2(d.number) + ' ' + esc(d.name) + '<span class="q">' + esc(d.question) + '</span></a>';
    }).join('');
    html += '<h2 class="foot-h">Start here</h2><a href="' + href('') + '">Cover</a><a href="' + href('framework') + '">The operating system on one page</a><a href="' + href('reading-paths') + '">Start by role</a>';
    if (NAV.tools.length) html += '<h2 class="foot-h">Tools</h2>' + NAV.tools.map(function (t) { return '<a href="' + href(t.path) + '">' + esc(t.title) + '</a>'; }).join('');
    NAV.groups.forEach(function (g) {
      if (g.key === 'start' || !g.pages.length) return;
      html += '<h2 class="foot-h">' + esc(g.name) + '</h2>' + g.pages.map(function (p) { return '<a href="' + href(p.path) + '">' + esc(p.title) + '</a>'; }).join('');
    });
    sheet.innerHTML = html;
    var prevOverflow = null;
    function isOpen() { return sheet.getAttribute('aria-hidden') === 'false'; }
    function open() {
      sheet.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      var first = sheet.querySelector('.close');
      if (first) first.focus();
    }
    function close() {
      if (!isOpen()) return;
      sheet.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = prevOverflow || '';
      prevOverflow = null;
      toggle.focus();
    }
    toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
    sheet.querySelector('.close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    // A viewport that grows past the mobile breakpoint hides the sheet in CSS;
    // release the scroll lock with it.
    window.addEventListener('resize', function () {
      if (isOpen() && window.innerWidth > 900) close();
    }, { passive: true });
  }

  // --- Command palette -------------------------------------------------------
  var INDEX = null;
  function buildIndex() {
    if (INDEX) return INDEX;
    INDEX = [];
    NAV.disciplines.forEach(function (d) {
      INDEX.push({ title: pad2(d.number) + ' ' + d.name, where: d.question, path: d.path, hay: (d.name + ' ' + d.question).toLowerCase() });
      (d.pages || []).forEach(function (p) {
        INDEX.push({ title: p.title, where: pad2(d.number) + ' ' + d.name, path: p.path, hay: (p.title + ' ' + (p.dek || '') + ' ' + d.name).toLowerCase() });
      });
    });
    NAV.groups.forEach(function (g) {
      (g.pages || []).forEach(function (p) {
        INDEX.push({ title: p.title, where: g.name, path: p.path, hay: (p.title + ' ' + (p.dek || '') + ' ' + g.name).toLowerCase() });
      });
    });
    return INDEX;
  }

  function search(q) {
    var idx = buildIndex();
    q = q.trim().toLowerCase();
    if (!q) return idx.slice(0, 12);
    var terms = q.split(/\s+/);
    return idx.filter(function (it) {
      return terms.every(function (t) { return it.hay.indexOf(t) !== -1; });
    }).sort(function (a, b) {
      var at = a.title.toLowerCase().indexOf(q) !== -1 ? 0 : 1;
      var bt = b.title.toLowerCase().indexOf(q) !== -1 ? 0 : 1;
      return at - bt;
    }).slice(0, 20);
  }

  function initPalette() {
    var pal = document.querySelector('.palette');
    if (!pal) return;
    var input = pal.querySelector('input');
    var list = pal.querySelector('ol');
    var sel = -1;
    var items = [];

    function render() {
      if (!items.length) { list.innerHTML = '<li class="empty">No matches. Try a discipline name or a page title.</li>'; return; }
      list.innerHTML = items.map(function (it, i) {
        return '<li class="' + (i === sel ? 'sel' : '') + '"><a href="' + href(it.path) + '">' + esc(it.title) + '<span class="where">' + esc(it.where) + '</span></a></li>';
      }).join('');
      var selected = list.querySelector('li.sel');
      if (selected && selected.scrollIntoView) selected.scrollIntoView({ block: 'nearest' });
    }
    function update() { items = search(input.value); sel = items.length ? 0 : -1; render(); }
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      pal.setAttribute('aria-hidden', 'false');
      input.value = '';
      update();
      setTimeout(function () { input.focus(); }, 0);
    }
    function close() {
      if (!isOpen()) return;
      pal.setAttribute('aria-hidden', 'true');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    }
    function isOpen() { return pal.getAttribute('aria-hidden') === 'false'; }

    document.querySelectorAll('.search-btn').forEach(function (b) { b.addEventListener('click', open); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { sel = (sel + 1) % items.length; render(); } }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) { sel = (sel - 1 + items.length) % items.length; render(); } }
      if (e.key === 'Enter') {
        // A Tab-focused result wins over the highlighted one.
        var focused = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.palette li a') : null;
        if (focused) return;
        if (sel >= 0 && items[sel]) { e.preventDefault(); window.location.href = href(items[sel].path); }
      }
      if (e.key === 'Tab') {
        // Keep Tab inside the dialog while it is open.
        var focusables = [input].concat([].slice.call(list.querySelectorAll('a')));
        var idx = focusables.indexOf(document.activeElement);
        if (e.shiftKey && idx <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!e.shiftKey && idx === focusables.length - 1) { e.preventDefault(); input.focus(); }
      }
    });
    input.addEventListener('input', update);
    pal.addEventListener('click', function (e) { if (e.target === pal) close(); });
  }

  function initNav() { initMenu(); initSheet(); initPalette(); }
  window.initNav = initNav;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNav);
  else initNav();
})();
