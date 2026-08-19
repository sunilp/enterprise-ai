/* =============================================================================
   share.js -- share menu: LinkedIn, X, copy link
   The Enterprise AI Operating System -- sunilprakash.com/enterprise-ai
   ============================================================================= */

(function () {
  'use strict';

  function currentUrl() { return window.location.href.split('#')[0]; }
  function currentTitle() {
    var og = document.querySelector('meta[property="og:title"]');
    return og ? og.getAttribute('content') : document.title;
  }
  function ga(name, params) { if (typeof window.__ga === 'function') window.__ga(name, params); }

  function initShare() {
    var wraps = document.querySelectorAll('.share');
    if (!wraps.length) return;
    wraps.forEach(function (wrap) {
      var btn = wrap.querySelector('.share-btn');
      var menu = wrap.querySelector('.share-menu');
      if (!btn || !menu) return;
      menu.innerHTML = '<button type="button" data-act="linkedin">Share on LinkedIn</button><button type="button" data-act="x">Share on X</button><button type="button" data-act="copy">Copy link</button>';
      function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = wrap.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      menu.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var act = b.getAttribute('data-act');
        var url = encodeURIComponent(currentUrl());
        var text = encodeURIComponent(currentTitle());
        if (act === 'linkedin') window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank', 'noopener');
        if (act === 'x') window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + url, '_blank', 'noopener');
        if (act === 'copy') {
          var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; close(); }, 1500); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(currentUrl()).then(done, done);
          else done();
        }
        ga('share', { method: act, page: document.body.dataset.page || '' });
        if (act !== 'copy') close();
      });
      document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    });
  }
  window.initShare = initShare;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initShare);
  else initShare();
})();
