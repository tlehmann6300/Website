/**
 * Infoabend-Anmelde-Button (global, navbar-injected)
 *
 * Liest assets/data/startup-event-config.json und blendet einen
 * "Anmeldung zum Infoabend"-Button in die Navbar ein.
 *
 * Steuerung über JSON:
 *   - showSignupButton: true|false
 *   - signupLink: URL
 *   - signupLabel_de / _en / _fr
 *
 * Reagiert auf Sprachwechsel via window 'languageChanged' Event.
 */
(function () {
  'use strict';

  var CONFIG_URL = 'assets/data/startup-event-config.json';
  var BUTTON_ID = 'navbar-infoabend-btn';
  var FAB_BUTTON_ID = 'fab-infoabend-btn';

  var state = {
    config: null,
    lang: 'de'
  };

  function detectLanguage() {
    try {
      var url = new URL(window.location.href);
      var lp = url.searchParams.get('lang');
      if (lp === 'en' || lp === 'fr' || lp === 'de') return lp;
    } catch (e) { /* noop */ }
    try {
      var stored = localStorage.getItem('language') || localStorage.getItem('preferred-language');
      if (stored === 'en' || stored === 'fr' || stored === 'de') return stored;
    } catch (e) { /* noop */ }
    var htmlLang = (document.documentElement.getAttribute('lang') || 'de').slice(0, 2).toLowerCase();
    if (htmlLang === 'en' || htmlLang === 'fr') return htmlLang;
    return 'de';
  }

  function pickLabel(cfg, lang) {
    var key = 'signupLabel_' + lang;
    return (cfg && typeof cfg[key] === 'string' && cfg[key].length)
      ? cfg[key]
      : (cfg && cfg.signupLabel_de) || 'Anmeldung zum Infoabend';
  }

  function isValidHttps(link) {
    return typeof link === 'string'
      && /^https:\/\/[^\s<>"']+$/i.test(link);
  }

  function buildButton(cfg, lang) {
    var btn = document.createElement('a');
    btn.id = BUTTON_ID;
    btn.className = 'navbar-infoabend-btn';
    btn.setAttribute('href', cfg.signupLink);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
    btn.setAttribute('data-i18n-skip', 'true');

    var label = pickLabel(cfg, lang);
    btn.setAttribute('aria-label', label);
    btn.title = label;

    var icon = document.createElement('i');
    icon.className = 'fas fa-graduation-cap';
    icon.setAttribute('aria-hidden', 'true');

    var span = document.createElement('span');
    span.className = 'navbar-infoabend-btn__label';
    span.textContent = label;

    btn.appendChild(icon);
    btn.appendChild(span);
    return btn;
  }

  function buildFabButton(cfg, lang) {
    var btn = document.createElement('a');
    btn.id = FAB_BUTTON_ID;
    btn.className = 'mobile-infoabend-fab';
    btn.setAttribute('href', cfg.signupLink);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');

    var label = pickLabel(cfg, lang);
    btn.setAttribute('aria-label', label);
    btn.title = label;

    var icon = document.createElement('i');
    icon.className = 'fas fa-graduation-cap';
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    var srOnly = document.createElement('span');
    srOnly.className = 'sr-only';
    srOnly.textContent = label;
    btn.appendChild(srOnly);

    return btn;
  }

  function removeButtons() {
    var existing = document.getElementById(BUTTON_ID);
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var fab = document.getElementById(FAB_BUTTON_ID);
    if (fab && fab.parentNode) fab.parentNode.removeChild(fab);
  }

  function injectButton() {
    var cfg = state.config;
    if (!cfg || cfg.showSignupButton !== true) {
      removeButtons();
      return;
    }
    if (!isValidHttps(cfg.signupLink)) {
      console.warn('[infoabend-button] signupLink is missing or not a valid https URL.');
      removeButtons();
      return;
    }

    removeButtons();

    var utilities = document.querySelector('.nav-utilities');
    if (utilities) {
      var btn = buildButton(cfg, state.lang);
      utilities.parentNode.insertBefore(btn, utilities);
    }

    if (!document.getElementById(FAB_BUTTON_ID)) {
      var fab = buildFabButton(cfg, state.lang);
      document.body.appendChild(fab);
    }
  }

  function loadConfig() {
    return fetch(CONFIG_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        state.config = data || {};
        return data;
      })
      .catch(function (e) {
        console.error('[infoabend-button] Could not load config:', e);
        state.config = null;
      });
  }

  function init() {
    state.lang = detectLanguage();
    loadConfig().then(injectButton);

    window.addEventListener('languageChanged', function (e) {
      if (e && e.detail && e.detail.language) {
        state.lang = e.detail.language;
      } else {
        state.lang = detectLanguage();
      }
      injectButton();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
