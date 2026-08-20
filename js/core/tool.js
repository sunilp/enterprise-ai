/* =============================================================================
   tool.js -- shared runtime for interactive diagnostics
   The Enterprise AI Operating System -- sunilprakash.com/enterprise-ai
   Exposes window.Tool: el, basePath, encode/decode, hash state, events,
   board-card canvas scaffold, download.
   ============================================================================= */

(function (root) {
  'use strict';

  var BOARD = '#0b0a08', BOARD_INK = '#f0ece4', GOLD = '#c8b48c';
  var MUTED = 'rgba(240,236,228,0.6)', FAINT = 'rgba(200,180,140,0.18)';

  function basePath() { return (root.__BASE_PATH__ || '').replace(/\/$/, ''); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // base64 of the concatenated digit string (legacy format; old shared links keep working)
  function b64e(s) { return typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64'); }
  function b64d(s) { return typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary'); }

  function encode(answers) { return b64e(answers.join('')); }

  function decode(encoded, expectedLength) {
    try {
      var decoded = b64d(encoded);
      if (expectedLength && decoded.length !== expectedLength) return null;
      if (!/^[1-5]+$/.test(decoded)) return null;
      var arr = [];
      for (var i = 0; i < decoded.length; i++) arr.push(parseInt(decoded[i], 10));
      return arr;
    } catch (e) { return null; }
  }

  function hashState(key) {
    var h = (root.location && root.location.hash) || '';
    var prefix = '#' + key + '=';
    return h.indexOf(prefix) === 0 ? h.substring(prefix.length) : null;
  }
  function setHashState(key, value) {
    try { root.history.replaceState(null, '', value ? '#' + key + '=' + value : root.location.pathname + root.location.search); } catch (e) { /* ignore */ }
  }

  function fireEvent(name, params) {
    if (typeof root.gtag === 'function') root.gtag('event', name, params || {});
  }

  // Board-panel canvas scaffold (1200x630 by default)
  function card(opts) {
    opts = opts || {};
    var W = opts.width || 1200, H = opts.height || 630;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = BOARD; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, 3);
    ctx.textBaseline = 'alphabetic';
    if (opts.label) {
      ctx.fillStyle = GOLD; ctx.font = '500 12px "IBM Plex Mono", Menlo, monospace'; ctx.textAlign = 'left';
      ctx.fillText(String(opts.label).toUpperCase().split('').join(' '), 60, 68);
    }
    if (opts.title) {
      ctx.fillStyle = BOARD_INK; ctx.font = '300 40px Fraunces, Georgia, serif'; ctx.textAlign = 'left';
      ctx.fillText(opts.title, 60, 112);
    }
    if (opts.subtitle) {
      ctx.fillStyle = MUTED; ctx.font = '14px "IBM Plex Mono", Menlo, monospace';
      ctx.fillText(opts.subtitle, 60, 140);
    }
    var footerY = H - 36;
    ctx.fillStyle = FAINT; ctx.fillRect(60, H - 64, W - 120, 1);
    ctx.fillStyle = MUTED; ctx.font = '12px "IBM Plex Mono", Menlo, monospace'; ctx.textAlign = 'left';
    ctx.fillText('The Enterprise AI Operating System  ·  sunilprakash.com/enterprise-ai', 60, footerY);
    return { canvas: canvas, ctx: ctx, footerY: footerY, W: W, H: H, colors: { board: BOARD, ink: BOARD_INK, gold: GOLD, muted: MUTED, faint: FAINT } };
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = String(text).split(' '), line = '', cy = y;
    for (var i = 0; i < words.length; i++) {
      var t = line + (line ? ' ' : '') + words[i];
      if (ctx.measureText(t).width > maxWidth && line) { ctx.fillText(line, x, cy); line = words[i]; cy += lineHeight; }
      else line = t;
    }
    if (line) ctx.fillText(line, x, cy);
    return cy;
  }

  function download(canvas, filename) {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.download = filename || 'scorecard.png';
      a.href = url;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }, 'image/png');
  }

  root.Tool = { el: el, basePath: basePath, encode: encode, decode: decode, hashState: hashState, setHashState: setHashState, fireEvent: fireEvent, card: card, wrapText: wrapText, download: download };
})(typeof window !== 'undefined' ? window : this);
