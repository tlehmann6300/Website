
(() => {
  'use strict';
  const CONSENT_STORAGE_KEY = 'consent_settings';
  const CONSENT_EXPIRY_DAYS = 365;
  const TRANSLATIONS = {
    de: {
      heading: 'Cookie-Zustimmung verwalten',
      description: 'Wir verwenden Cookies und ähnliche Technologien, um Geräteinformationen zu speichern bzw. darauf zuzugreifen. Wenn Sie zustimmen, können Daten wie das Surfverhalten oder eindeutige IDs verarbeitet werden. Ohne Zustimmung können bestimmte Funktionen beeinträchtigt sein.',
      acceptAll: 'Alle akzeptieren',
      saveSettings: 'Einstellungen speichern',
      rejectAll: 'Nur notwendige Cookies',
      cookiePolicy: 'Cookie-Richtlinie',
      privacyPolicy: 'Datenschutzerklärung',
      imprint: 'Impressum',
      categories: {
        necessary: {
          title: 'Funktional (inkl. Schriftarten)',
          description: 'Erforderlich, um die Website korrekt anzuzeigen und grundlegende Funktionen bereitzustellen. Beinhaltet lokale Schriftarten (DSGVO-konform).'
        },
        analytics: {
          title: 'Statistik / Analyse',
          description: 'Hilft uns zu verstehen, wie Besucher mit der Website interagieren, um die Benutzererfahrung zu verbessern.'
        },
        security: {
          title: 'Sicherheit (reCAPTCHA)',
          description: 'Dient dem Schutz vor Spam und Missbrauch durch reCAPTCHA.'
        },
        marketing: {
          title: 'Marketing',
          description: 'Wird verwendet, um Inhalte oder Werbung anzupassen und deren Wirksamkeit zu messen.'
        }
      }
    },
    en: {
      heading: 'Manage Cookie Consent',
      description: 'We use cookies and similar technologies to store or access device information. If you consent, data such as browsing behavior or unique IDs may be processed. Without consent, certain features may be impaired.',
      acceptAll: 'Accept All',
      saveSettings: 'Save Settings',
      rejectAll: 'Only Necessary Cookies',
      cookiePolicy: 'Cookie Policy',
      privacyPolicy: 'Privacy Policy',
      imprint: 'Legal Notice',
      categories: {
        necessary: {
          title: 'Functional (incl. Fonts)',
          description: 'Required to display the website correctly and provide basic features. Includes local fonts (GDPR compliant).'
        },
        analytics: {
          title: 'Statistics / Analytics',
          description: 'Helps us understand how visitors interact with the website to improve the user experience.'
        },
        security: {
          title: 'Security (reCAPTCHA)',
          description: 'Used to protect against spam and abuse through reCAPTCHA.'
        },
        marketing: {
          title: 'Marketing',
          description: 'Used to customize content or advertising and measure its effectiveness.'
        }
      }
    },
    fr: {
      heading: 'Gérer le consentement des cookies',
      description: 'Nous utilisons des cookies et des technologies similaires pour stocker ou accéder aux informations de l\'appareil. Si vous consentez, des données telles que le comportement de navigation ou des identifiants uniques peuvent être traitées. Sans consentement, certaines fonctionnalités peuvent être altérées.',
      acceptAll: 'Tout accepter',
      saveSettings: 'Enregistrer les paramètres',
      rejectAll: 'Cookies nécessaires uniquement',
      cookiePolicy: 'Politique de cookies',
      privacyPolicy: 'Politique de confidentialité',
      imprint: 'Mentions légales',
      categories: {
        necessary: {
          title: 'Fonctionnel (incl. polices)',
          description: 'Nécessaire pour afficher correctement le site web et fournir des fonctionnalités de base. Comprend les polices locales (conforme RGPD).'
        },
        analytics: {
          title: 'Statistiques / Analyse',
          description: 'Nous aide à comprendre comment les visiteurs interagissent avec le site web pour améliorer l\'expérience utilisateur.'
        },
        security: {
          title: 'Sécurité (reCAPTCHA)',
          description: 'Utilisé pour protéger contre le spam et les abus via reCAPTCHA.'
        },
        marketing: {
          title: 'Marketing',
          description: 'Utilisé pour personnaliser le contenu ou la publicité et mesurer son efficacité.'
        }
      }
    }
  };
  const CATEGORIES = {
    necessary: { required: true, preselected: true },
    analytics: { required: false, preselected: false },
    security: { required: true, preselected: true },
    marketing: { required: false, preselected: false }
  };
  class CookieConsent {
    constructor() {
      this.consentSettings = this.loadStoredConsent();
      this.initialized = false;
      this.currentLang = this.detectLanguage();
    }
    detectLanguage() {
      if (window.ibcLanguageSwitcher && window.ibcLanguageSwitcher.currentLang) {
        return window.ibcLanguageSwitcher.currentLang;
      }
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang');
      if (lang === 'en') return 'en';
      if (lang === 'fr') return 'fr';
      return 'de';
    }
    getTranslation(key) {
      const lang = this.detectLanguage();
      const translations = TRANSLATIONS[lang] || TRANSLATIONS.de;
      if (key.includes('.')) {
        const keys = key.split('.');
        let value = translations;
        for (const k of keys) {
          value = value?.[k];
        }
        return value || key;
      }
      return translations[key] || TRANSLATIONS.de[key] || key;
    }
    buildLocalizedUrl(href, lang) {
      const baseHref = href.split('?')[0];
      return baseHref + (lang !== 'de' ? '?lang=' + lang : '');
    }
    init() {
      if (this.initialized) return;
      if (!this.consentSettings) {
        this.renderBanner();
        this.attachEventListeners();
      } else {
        this.checkAndLoadScripts();
      }
      window.addEventListener('languageChanged', () => {
        this.currentLang = this.detectLanguage();
        this.updateBannerTexts();
      });
      this.initialized = true;
    }
    loadStoredConsent() {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    }
    saveConsent(settings) {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(settings));
      this.consentSettings = settings;
      this.checkAndLoadScripts();
      this.notifyConsentChange(settings);
    }
    checkAndLoadScripts() {
      if (!this.consentSettings) return;
      document.querySelectorAll('script[type="text/plain"][data-cookiecategory]').forEach(script => {
        const category = script.dataset.cookiecategory;
        if (this.consentSettings[category]) {
          this.loadScript(script);
        }
      });
    }
    loadScript(script) {
      const newScript = document.createElement('script');
      Array.from(script.attributes).forEach(attr => {
        if (attr.name !== 'type') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      newScript.type = 'text/javascript';
      newScript.text = script.text;
      script.parentNode.replaceChild(newScript, script);
    }
    notifyConsentChange(settings) {
      document.dispatchEvent(new CustomEvent('consentGiven', {
        detail: settings
      }));
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'update', {
        'analytics_storage': settings.analytics ? 'granted' : 'denied',
        'ad_storage': settings.marketing ? 'granted' : 'denied',
        'ad_user_data': settings.marketing ? 'granted' : 'denied',
        'ad_personalization': settings.marketing ? 'granted' : 'denied',
        'functionality_storage': settings.necessary ? 'granted' : 'denied',
        'personalization_storage': settings.marketing ? 'granted' : 'denied',
        'security_storage': 'granted'
      });
      if(settings.analytics) {
          window.dataLayer.push({'event': 'analytics_consent_granted'});
      }
      if(settings.marketing) {
          window.dataLayer.push({'event': 'marketing_consent_granted'});
      }
    }
    renderBanner() {
      const lang = this.detectLanguage();
      const t = TRANSLATIONS[lang] || TRANSLATIONS.de;
      const banner = document.createElement('div');
      banner.className = 'cookie-consent force-white-text';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-labelledby', 'cookie-consent-heading');
      banner.setAttribute('aria-modal', 'true');
      banner.innerHTML = `
        <div class="cookie-consent__content">
          <div class="cookie-consent__header-row">
            <h2 id="cookie-consent-heading" data-cookie-i18n="heading"><i class="fas fa-shield-alt" aria-hidden="true" style="margin-right:0.5rem;opacity:0.8;"></i>${t.heading}</h2>
            <div class="cookie-consent__lang-switcher">
              <button type="button" class="cookie-lang-btn" data-lang="de" aria-label="Deutsch">DE</button>
              <button type="button" class="cookie-lang-btn" data-lang="en" aria-label="English">EN</button>
              <button type="button" class="cookie-lang-btn" data-lang="fr" aria-label="Français">FR</button>
            </div>
          </div>
          <p data-cookie-i18n="description">${t.description}</p>
          <div class="cookie-consent__categories">
            ${Object.entries(CATEGORIES).map(([key, value]) => `
              <div class="cookie-consent__category">
                <label class="cookie-consent__switch">
                  <input type="checkbox"
                         name="cookie_${key}"
                         ${value.required ? 'checked disabled' : (value.preselected ? 'checked' : '')}
                         data-category="${key}"
                         aria-describedby="cookie-desc-${key}">
                  <span class="cookie-consent__slider"></span>
                </label>
                <div class="cookie-consent__category-info">
                  <h3 data-cookie-i18n="categories.${key}.title">${t.categories[key].title}</h3>
                  <p id="cookie-desc-${key}" data-cookie-i18n="categories.${key}.description">${t.categories[key].description}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="cookie-consent__actions">
            <button class="cookie-consent__button cookie-consent__button--accept-all" data-cookie-i18n="acceptAll">
              ${t.acceptAll}
            </button>
            <button class="cookie-consent__button cookie-consent__button--save" data-cookie-i18n="saveSettings">
              ${t.saveSettings}
            </button>
            <button class="cookie-consent__button cookie-consent__button--reject-all" data-cookie-i18n="rejectAll">
              ${t.rejectAll}
            </button>
          </div>
          <div class="cookie-consent__footer">
            <a href="${this.buildLocalizedUrl('cookie-richtlinie-eu.html', lang)}" data-cookie-i18n="cookiePolicy">${t.cookiePolicy}</a> |
            <a href="${this.buildLocalizedUrl('datenschutzerklaerung.html', lang)}" data-cookie-i18n="privacyPolicy">${t.privacyPolicy}</a> |
            <a href="${this.buildLocalizedUrl('impressum.html', lang)}" data-cookie-i18n="imprint">${t.imprint}</a>
          </div>
        </div>
      `;
      document.body.appendChild(banner);
      setTimeout(() => this.showBanner(), 1000);
    }
    updateBannerTexts() {
      const banner = document.querySelector('.cookie-consent');
      if (!banner) return;
      const lang = this.detectLanguage();
      const t = TRANSLATIONS[lang] || TRANSLATIONS.de;
      banner.querySelectorAll('[data-cookie-i18n]').forEach(el => {
        const key = el.getAttribute('data-cookie-i18n');
        if (key.includes('.')) {
          const keys = key.split('.');
          let value = t;
          for (const k of keys) {
            value = value?.[k];
          }
          if (value) {
            el.textContent = value;
          }
        } else if (t[key]) {
          el.textContent = t[key];
        }
      });
      banner.querySelectorAll('.cookie-consent__footer a').forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          link.setAttribute('href', this.buildLocalizedUrl(href, lang));
        }
      });
    }
    attachEventListeners() {
      const banner = document.querySelector('.cookie-consent');
      if (!banner) return;
      banner.querySelector('.cookie-consent__button--accept-all')
        .addEventListener('click', () => this.acceptAll());
      banner.querySelector('.cookie-consent__button--reject-all')
        .addEventListener('click', () => this.rejectAll());
      banner.querySelector('.cookie-consent__button--save')
        .addEventListener('click', () => this.saveCurrentSettings());
      banner.querySelectorAll('.cookie-lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const newLang = e.target.dataset.lang;
          this.currentLang = newLang;
          banner.querySelectorAll('.cookie-lang-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.updateBannerTexts();
          if (window.ibcLanguageSwitcher) {
            window.ibcLanguageSwitcher.switchLanguage(newLang);
          }
        });
        if (btn.dataset.lang === this.currentLang) {
          btn.classList.add('active');
        }
      });
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cookie-settings-trigger')) {
          e.preventDefault();
          this.showBanner();
          setTimeout(() => {
            const banner = document.querySelector('.cookie-consent');
            if (banner) {
              const firstButton = banner.querySelector('.cookie-consent__button--accept-all');
              if (firstButton) {
                firstButton.focus();
              }
            }
          }, 100);
        }
      });
      this.setupFocusTrap(banner);
    }
    setupFocusTrap(banner) {
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      banner.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !banner.classList.contains('cookie-consent--visible')) return;
        const focusables = banner.querySelectorAll(focusableElements);
        const firstFocusable = focusables[0];
        const lastFocusable = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      });
      banner.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && banner.classList.contains('cookie-consent--visible')) {
          if (this.consentSettings) {
            this.hideBanner();
          }
        }
      });
    }
    acceptAll() {
      const settings = Object.keys(CATEGORIES).reduce((acc, category) => {
        acc[category] = true;
        return acc;
      }, {});
      this.saveConsent(settings);
      this.hideBanner();
    }
    rejectAll() {
      const settings = Object.keys(CATEGORIES).reduce((acc, category) => {
        acc[category] = CATEGORIES[category].required;
        return acc;
      }, {});
      this.saveConsent(settings);
      this.hideBanner();
    }
    saveCurrentSettings() {
      const settings = Object.keys(CATEGORIES).reduce((acc, category) => {
        const input = document.querySelector(`input[name="cookie_${category}"]`);
        acc[category] = input ? input.checked : CATEGORIES[category].required;
        return acc;
      }, {});
      this.saveConsent(settings);
      this.hideBanner();
    }
    showBanner() {
      this.previouslyFocusedElement = document.activeElement;
      if (!document.querySelector('.cookie-consent')) {
        this.renderBanner();
        this.attachEventListeners();
      } else {
        this.updateBannerTexts();
      }
      const banner = document.querySelector('.cookie-consent');
      if (banner) {
        banner.classList.add('cookie-consent--visible');
        if (window.innerWidth < 768) {
          const scrollY = window.scrollY;
          document.body.dataset.cookieScrollY = scrollY;
          document.body.style.overflow = 'hidden';
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
          document.body.style.width = '100%';
        }
      }
    }
    hideBanner() {
      const banner = document.querySelector('.cookie-consent');
      if (banner) {
        banner.classList.remove('cookie-consent--visible');
        const hadMobileLock = 'cookieScrollY' in document.body.dataset;
        const scrollY = hadMobileLock ? parseInt(document.body.dataset.cookieScrollY, 10) : 0;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        delete document.body.dataset.cookieScrollY;
        if (hadMobileLock) {
          window.scrollTo(0, scrollY);
        }
        if (this.previouslyFocusedElement) {
          this.previouslyFocusedElement.focus();
        }
      }
    }
  }
  window.cookieConsent = new CookieConsent();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.cookieConsent.init());
  } else {
    window.cookieConsent.init();
  }
})();