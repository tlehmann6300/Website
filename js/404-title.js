
(function () {
  'use strict';
  const titleTranslations = {
    '404-title': {
      de: '404 – Seite nicht gefunden | Institut für Business Consulting e.V.',
      en: '404 – Page Not Found | Institute for Business Consulting'
    }
  };
  function updateTitle() {
    const lang = new URLSearchParams(window.location.search).get('lang') || 'de';
    document.title = titleTranslations['404-title'][lang];
  }
  document.addEventListener('DOMContentLoaded', updateTitle);
})();
