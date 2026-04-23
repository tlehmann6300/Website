/**
 * ibc-buttons.js — Shimmer Button Interactions
 * Ripple position tracking, haptic feedback, visibility-based pause
 */
(function () {
  'use strict';

  const SELECTORS = [
    '.btn-shimmer',
    '.ethereal-button',
    '.hero-cta-primary',
    '.fat-footer__cta-btn',
    '.mobile-cta-btn',
    '.students-pretty-btn',
    '.esv3-cta',
    'button.btn-submit',
    '.send-button',
    'a.cta-button',
    '.btn.btn-primary',
    '.btn-ibc',
    '.modal-button.ja',
    '.cookie-consent__button--accept-all',
  ].join(',');

  function init() {
    // IntersectionObserver / MutationObserver to catch late-rendered buttons
    // (e.g. cookie banner injected by JS)
    attachAll();
    observeNewButtons();

    // Pause animations when page is hidden (battery saving)
    document.addEventListener('visibilitychange', function () {
      const btns = document.querySelectorAll(SELECTORS);
      const state = document.hidden ? 'paused' : 'running';
      btns.forEach(function (b) {
        b.style.animationPlayState = state;
      });
    });
  }

  function attachBtn(btn) {
    if (btn._ibcBtnAttached) return;
    btn._ibcBtnAttached = true;

    // Update ripple CSS vars on pointer/touch
    function updatePos(e) {
      const rect = btn.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--ripple-x', x + '%');
      btn.style.setProperty('--ripple-y', y + '%');
    }

    btn.addEventListener('touchstart', updatePos, { passive: true });
    btn.addEventListener('mousedown', updatePos);

    // Haptic on click (mobile only)
    btn.addEventListener('click', function () {
      if (navigator.vibrate) navigator.vibrate(8);
    });
  }

  function attachAll() {
    document.querySelectorAll(SELECTORS).forEach(attachBtn);
  }

  function observeNewButtons() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          // Check the node itself
          if (node.matches && node.matches(SELECTORS)) attachBtn(node);
          // Check children
          node.querySelectorAll && node.querySelectorAll(SELECTORS)
            .forEach(attachBtn);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
