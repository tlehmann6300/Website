
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
                const response = await fetch('assets/data/startup-event-config.json');
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
            if (langParam === 'en') {
                this.currentLang = 'en';
            } else {
                const htmlLang = document.documentElement.getAttribute('lang');
                this.currentLang = (htmlLang === 'en') ? 'en' : 'de';
            }
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
            const dateText = this.currentLang === 'en'
                ? this.eventConfig.date_en
                : this.eventConfig.date_de;
            dateElement.textContent = dateText;
        }
        updateEventLocation() {
            const locationElement = document.getElementById('dynamic-event-location');
            if (!locationElement) return;
            const locationText = this.currentLang === 'en'
                ? this.eventConfig.location_en
                : this.eventConfig.location_de;
            locationElement.textContent = locationText;
        }
        updateEventLink() {
            const linkElement = document.getElementById('dynamic-event-link');
            if (!linkElement) return;
            linkElement.setAttribute('href', this.eventConfig.registrationLink);
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