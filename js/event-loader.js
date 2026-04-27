
(function() {
    'use strict';
    class EventLoader {
        constructor() {
            this.eventConfig = null;
            this.currentLang = 'de';
            this.init();
        }
        async init() {
            try {
                this.eventConfig = await this.loadEventConfig();
                this.detectLanguage();
                this.updateEventSection();
                this.setupLanguageListener();
            } catch (error) {
                console.error('Failed to initialize event loader:', error);
                this.hideEventSection();
            }
        }
        async loadEventConfig() {
            try {
                const response = await fetch('assets/data/startup-event-config.json', { cache: 'no-cache' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Failed to load event configuration:', error);
                throw error;
            }
        }
        detectLanguage() {
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang');
            if (langParam === 'en' || langParam === 'fr' || langParam === 'de') {
                this.currentLang = langParam;
                return;
            }
            try {
                const stored = localStorage.getItem('language') || localStorage.getItem('preferred-language');
                if (stored === 'en' || stored === 'fr' || stored === 'de') {
                    this.currentLang = stored;
                    return;
                }
            } catch (e) { /* localStorage unavailable */ }
            const htmlLang = (document.documentElement.getAttribute('lang') || 'de').slice(0, 2).toLowerCase();
            this.currentLang = (htmlLang === 'en' || htmlLang === 'fr') ? htmlLang : 'de';
        }
        pickLocalized(key) {
            const cfg = this.eventConfig || {};
            const tryKey = key + '_' + this.currentLang;
            return (typeof cfg[tryKey] === 'string' && cfg[tryKey].length)
                ? cfg[tryKey]
                : (cfg[key + '_de'] || '');
        }
        updateEventSection() {
            if (!this.eventConfig) {
                this.hideEventSection();
                return;
            }
            if (!this.eventConfig.isActive) {
                this.hideEventSection();
                return;
            }
            this.showEventSection();
            this.updateEventDate();
            this.updateEventLocation();
            this.updateEventLink();
        }
        updateEventDate() {
            const dateElement = document.getElementById('dynamic-event-date');
            if (!dateElement) return;
            dateElement.textContent = this.pickLocalized('date');
        }
        updateEventLocation() {
            const locationElement = document.getElementById('dynamic-event-location');
            if (!locationElement) return;
            locationElement.textContent = this.pickLocalized('location');
        }
        updateEventLink() {
            const linkElement = document.getElementById('dynamic-event-link');
            if (!linkElement) return;

            const cfg = this.eventConfig || {};
            const candidate = (typeof cfg.signupLink === 'string' && cfg.signupLink.length)
                ? cfg.signupLink
                : cfg.registrationLink;

            const isValidHttps = typeof candidate === 'string'
                && /^https:\/\/[^\s<>"']+$/i.test(candidate);

            // Two flags: explicit per-button toggle (showSignupButton) AND link sanity
            const showButton = cfg.showSignupButton === true && isValidHttps;

            if (showButton) {
                linkElement.setAttribute('href', candidate);
                linkElement.removeAttribute('hidden');
                linkElement.setAttribute('aria-hidden', 'false');
                // Localized aria-label: "Zur Anmeldung — opens in new tab"
                const label = (linkElement.querySelector('.infoabend-cta__label') || {}).textContent || 'Zur Anmeldung';
                linkElement.setAttribute('aria-label', label);
            } else {
                linkElement.setAttribute('hidden', '');
                linkElement.setAttribute('aria-hidden', 'true');
                linkElement.setAttribute('href', '#');
                linkElement.removeAttribute('aria-label');
            }
        }
        hideEventSection() {
            const section = document.getElementById('infoabend-section');
            if (section) {
                section.style.display = 'none';
            }
        }
        showEventSection() {
            const section = document.getElementById('infoabend-section');
            if (section) {
                section.style.display = '';
            }
        }
        setupLanguageListener() {
            window.addEventListener('languageChanged', (event) => {
                if (event.detail && event.detail.language) {
                    this.currentLang = event.detail.language;
                } else {
                    this.detectLanguage();
                }
                this.updateEventSection();
            });
        }
    }
    function initEventLoader() {
        if (document.getElementById('infoabend-section')) {
            window.ibcEventLoader = new EventLoader();
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventLoader);
    } else {
        initEventLoader();
    }
})();