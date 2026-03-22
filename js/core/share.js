/* ═══════════════════════════════════════════════════════════════════════════
   share.js — Share button: Web Share API, clipboard, LinkedIn, Twitter
   Enterprise AI Playbook — sunilprakash.com/enterprise-ai
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────

  var triggerEl = null;
  var dropdownEl = null;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function currentUrl() {
    return window.location.href;
  }

  function currentTitle() {
    return document.title || '';
  }

  // ─── Dropdown Build ─────────────────────────────────────────────────────────

  function buildDropdown() {
    var dropdown = document.createElement('div');
    dropdown.className = 'share-dropdown';

    // "Copy link" option
    var copyBtn = document.createElement('button');
    copyBtn.className = 'share-option';
    copyBtn.textContent = 'Copy link';
    copyBtn.addEventListener('click', onCopyLink);
    dropdown.appendChild(copyBtn);

    // "Share on LinkedIn" option
    var liBtn = document.createElement('button');
    liBtn.className = 'share-option';
    liBtn.textContent = 'Share on LinkedIn';
    liBtn.addEventListener('click', onShareLinkedIn);
    dropdown.appendChild(liBtn);

    // "Share on Twitter" option
    var twBtn = document.createElement('button');
    twBtn.className = 'share-option';
    twBtn.textContent = 'Share on Twitter';
    twBtn.addEventListener('click', onShareTwitter);
    dropdown.appendChild(twBtn);

    return dropdown;
  }

  // ─── Share Actions ───────────────────────────────────────────────────────────

  function onCopyLink() {
    var url = currentUrl();
    navigator.clipboard.writeText(url).then(function () {
      showCopiedConfirmation();
    }).catch(function () {
      // Fallback for environments where clipboard API fails
      showCopiedConfirmation();
    });
  }

  function showCopiedConfirmation() {
    if (!dropdownEl) return;

    // Remove any existing confirmation
    var existing = dropdownEl.querySelector('.share-copied');
    if (existing) existing.parentNode.removeChild(existing);

    var msg = document.createElement('div');
    msg.className = 'share-copied';
    msg.textContent = 'Copied';
    dropdownEl.appendChild(msg);

    // Fade out via CSS animation (1.5s), then remove the element
    setTimeout(function () {
      if (msg.parentNode) {
        msg.parentNode.removeChild(msg);
      }
    }, 1500);
  }

  function onShareLinkedIn() {
    var url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(currentUrl());
    window.open(url, '_blank', 'noopener,noreferrer');
    closeDropdown();
  }

  function onShareTwitter() {
    var url = 'https://twitter.com/intent/tweet?url=' +
      encodeURIComponent(currentUrl()) +
      '&text=' +
      encodeURIComponent(currentTitle());
    window.open(url, '_blank', 'noopener,noreferrer');
    closeDropdown();
  }

  // ─── Dropdown Open / Close ───────────────────────────────────────────────────

  function openDropdown() {
    if (!dropdownEl || !triggerEl) return;

    dropdownEl.classList.add('open');
    positionDropdown();

    // Listen for outside clicks and Escape
    setTimeout(function () {
      document.addEventListener('click', onClickOutside);
      document.addEventListener('keydown', onKeyDown);
    }, 0);
  }

  function closeDropdown() {
    if (!dropdownEl) return;
    dropdownEl.classList.remove('open');
    document.removeEventListener('click', onClickOutside);
    document.removeEventListener('keydown', onKeyDown);
  }

  function toggleDropdown() {
    if (!dropdownEl) return;
    if (dropdownEl.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  // ─── Positioning ────────────────────────────────────────────────────────────

  function positionDropdown() {
    if (!dropdownEl || !triggerEl) return;

    // Default: below the trigger button (top: 100% via CSS)
    // Check if near viewport bottom — if so, flip above
    var triggerRect = triggerEl.getBoundingClientRect();
    var dropdownHeight = 120; // approximate height for 3 options
    var spaceBelow = window.innerHeight - triggerRect.bottom;

    if (spaceBelow < dropdownHeight) {
      // Position above the trigger
      dropdownEl.style.top = 'auto';
      dropdownEl.style.bottom = '100%';
      dropdownEl.style.marginTop = '0';
      dropdownEl.style.marginBottom = '8px';
    } else {
      // Default: below
      dropdownEl.style.top = '100%';
      dropdownEl.style.bottom = 'auto';
      dropdownEl.style.marginTop = '8px';
      dropdownEl.style.marginBottom = '0';
    }
  }

  // ─── Event Handlers ──────────────────────────────────────────────────────────

  function onClickOutside(e) {
    if (!dropdownEl || !triggerEl) return;
    if (!dropdownEl.contains(e.target) && e.target !== triggerEl) {
      closeDropdown();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeDropdown();
      if (triggerEl) triggerEl.focus();
    }
  }

  // ─── Main initShare ──────────────────────────────────────────────────────────

  function initShare() {
    triggerEl = document.querySelector('.share-trigger');
    if (!triggerEl) return;

    // Build and inject the dropdown, scoped to the trigger's parent
    // so `position: relative` on the parent keeps it anchored correctly
    var container = triggerEl.parentElement;
    container.style.position = 'relative';

    dropdownEl = buildDropdown();
    container.appendChild(dropdownEl);

    triggerEl.addEventListener('click', function (e) {
      e.stopPropagation();

      // Mobile: use Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: currentTitle(),
          url: currentUrl(),
        }).catch(function () {
          // User cancelled or share failed — fall through silently
        });
        return;
      }

      // Desktop: toggle dropdown
      toggleDropdown();
    });
  }

  // Expose globally
  window.initShare = initShare;

}());
