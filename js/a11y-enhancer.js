/**
 * A11y enhancer — adds accessibility features that should exist on every page:
 *  - Skip-to-content link (first-tab-stop, hidden until focused)
 *  - Ensures <main> has id="main-content" so the skip link works
 *  - Adds aria-label / role hints to icon-only buttons that don't have them
 *  - Reflects current language on <html lang> when language changes
 */
(function () {
  'use strict';

  function detectLang() {
    try {
      var url = new URL(window.location.href);
      var lp = url.searchParams.get('lang');
      if (lp === 'en' || lp === 'fr' || lp === 'de') return lp;
    } catch (e) { /* noop */ }
    try {
      var s = localStorage.getItem('language') || localStorage.getItem('preferred-language');
      if (s === 'en' || s === 'fr' || s === 'de') return s;
    } catch (e) { /* noop */ }
    return (document.documentElement.getAttribute('lang') || 'de').slice(0, 2).toLowerCase();
  }

  var SKIP_LABEL = {
    de: 'Zum Hauptinhalt springen',
    en: 'Skip to main content',
    fr: 'Aller au contenu principal'
  };

  function ensureMainId() {
    var main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    if (!main) {
      // No <main> element — try common containers as fallback
      var candidate = document.querySelector('#content, .main-content, [role="main"]');
      if (candidate && !candidate.id) candidate.id = 'main-content';
    }
    return document.getElementById('main-content') || main;
  }

  function injectSkipLink() {
    if (document.getElementById('skip-to-main')) return;
    var lang = detectLang();
    var label = SKIP_LABEL[lang] || SKIP_LABEL.de;
    var a = document.createElement('a');
    a.id = 'skip-to-main';
    a.className = 'skip-link';
    a.href = '#main-content';
    a.textContent = label;
    document.body.insertBefore(a, document.body.firstChild);
  }

  function updateSkipLinkLanguage() {
    var lang = detectLang();
    var a = document.getElementById('skip-to-main');
    if (a) a.textContent = SKIP_LABEL[lang] || SKIP_LABEL.de;
    document.documentElement.setAttribute('lang', lang);
  }

  function labelIconOnlyButtons() {
    var ARIA_FALLBACK = {
      'theme-toggle': { de: 'Farbschema umschalten', en: 'Toggle color theme', fr: 'Basculer le thème' },
      'lang-btn':     { de: 'Sprache wechseln',      en: 'Change language',    fr: 'Changer la langue' },
      'fab-toggle':   { de: 'Menü öffnen',           en: 'Open menu',          fr: 'Ouvrir le menu' },
      'mobile-menu-toggle': { de: 'Menü öffnen',     en: 'Open menu',          fr: 'Ouvrir le menu' }
    };
    var lang = detectLang();
    Object.keys(ARIA_FALLBACK).forEach(function (cls) {
      var els = document.querySelectorAll('.' + cls);
      els.forEach(function (el) {
        if (!el.getAttribute('aria-label') || el.getAttribute('aria-label').trim() === '') {
          el.setAttribute('aria-label', ARIA_FALLBACK[cls][lang] || ARIA_FALLBACK[cls].de);
        }
        if (!el.getAttribute('type') && el.tagName === 'BUTTON') {
          el.setAttribute('type', 'button');
        }
      });
    });

    // Decorative font-awesome icons should be aria-hidden if they aren't already
    document.querySelectorAll('i.fas, i.far, i.fab, i.fa').forEach(function (i) {
      if (!i.hasAttribute('aria-hidden') && !i.hasAttribute('aria-label')) {
        i.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function init() {
    ensureMainId();
    injectSkipLink();
    labelIconOnlyButtons();

    window.addEventListener('languageChanged', function () {
      updateSkipLinkLanguage();
      labelIconOnlyButtons();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
