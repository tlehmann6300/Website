/**
 * keyboard-nav.js
 * Detects keyboard navigation and adds a `keyboard-nav` class to <body>.
 * This enables enhanced focus-ring styles defined in wcag-accessibility.css.
 * The class is removed when the user switches back to mouse/touch navigation.
 */
(function () {
  'use strict';

  function enableKeyboardNav() {
    document.body.classList.add('keyboard-nav');
  }

  function disableKeyboardNav() {
    document.body.classList.remove('keyboard-nav');
  }

  // Activate keyboard mode on Tab key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      enableKeyboardNav();
    }
  }, { passive: true });

  // Deactivate on mouse or touch interaction
  document.addEventListener('mousedown', disableKeyboardNav, { passive: true });
  document.addEventListener('touchstart', disableKeyboardNav, { passive: true });
}());
