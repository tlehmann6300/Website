/**
 * Sprachumschalter-Modul (Language Switcher)
 * 
 * Dieses Modul implementiert die mehrsprachige Funktionalität der Website.
 * Es unterstützt Deutsch (Standard), Englisch und Französisch und übersetzt
 * alle markierten Elemente auf der Seite dynamisch.
 * 
 * Hauptfunktionen:
 * - Automatische Spracherkennung aus URL-Parametern
 * - Laden von Übersetzungen aus JSON-Datei
 * - Dynamische Übersetzung aller markierten DOM-Elemente
 * - Sprachwechsel-Button-Verwaltung
 * - Speicherung der Sprachpräferenz in LocalStorage und Cookies
 * - Automatische Aktualisierung aller internen Links
 * - Event-System für Sprach-Änderungen
 * 
 * @module LanguageSwitcher
 */
(function() {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    /**
     * Haupt-Klasse für den Sprachumschalter
     * 
     * Diese Klasse verwaltet die gesamte Mehrsprachigkeits-Funktionalität
     * der Website. Sie lädt Übersetzungen, wendet sie an und verwaltet
     * den Sprachwechsel.
     */
    class LanguageSwitcher {
        /**
         * Konstruktor - Initialisiert den Sprachumschalter
         * 
         * Erkennt die aktuelle Sprache, initialisiert Variablen
         * und startet die Initialisierungsroutine
         */
        constructor() {
            // Erkenne die aktuelle Sprache aus URL oder nutze Standard (Deutsch)
            this.currentLang = this.detectLanguage();
            // Speicherplatz für geladene Übersetzungen (wird später befüllt)
            this.translations = null;
            // Starte die asynchrone Initialisierung
            this.init();
        }
        
        /**
         * Erkennt die gewünschte Sprache aus den URL-Parametern
         * 
         * Prüft den 'lang' Query-Parameter in der URL.
         * Unterstützte Werte: 'en' (Englisch), 'fr' (Französisch)
         * Standard: 'de' (Deutsch)
         * 
         * @returns {string} Sprachcode ('de', 'en', oder 'fr')
         */
        detectLanguage() {
            // Parse die URL-Query-Parameter
            const urlParams = new URLSearchParams(window.location.search);
            // Hole den 'lang' Parameter aus der URL
            const lang = urlParams.get('lang');
            
            // Prüfe auf gültige Sprachwerte aus URL
            if (lang === 'en') return 'en';  // Englisch
            if (lang === 'fr') return 'fr';  // Französisch
            if (lang === 'de') return 'de';  // Explizit Deutsch
            
            // Kein URL-Parameter: Gespeicherte Sprachpräferenz aus localStorage prüfen
            try {
                const stored = localStorage.getItem('language');
                if (stored === 'en' || stored === 'fr' || stored === 'de') return stored;
            } catch (e) { /* localStorage nicht verfügbar (z.B. privater Modus) – weiter mit Cookie-Fallback */ }
            
            // Fallback: Cookie prüfen
            const cookieMatch = document.cookie.split(';').find(c => c.trim().startsWith('language='));
            if (cookieMatch) {
                const val = cookieMatch.split('=')[1].trim();
                if (val === 'en' || val === 'fr' || val === 'de') return val;
            }
            
            return 'de'; // Standard: Deutsch
        }
        /**
         * Lädt die Übersetzungsdatei von Server
         * 
         * Diese asynchrone Funktion lädt die JSON-Datei mit allen Übersetzungen.
         * Bei Fehlern wird eine Fehlermeldung angezeigt und ein leeres Objekt
         * zurückgegeben.
         * 
         * @async
         * @returns {Promise<Object>} Promise, das die Übersetzungsdaten enthält
         */
        async loadTranslations() {
            try {
                // Sende HTTP-Request für Übersetzungs-JSON
                const response = await fetch('assets/data/translations/translations.json');
                
                // Prüfe, ob der Request erfolgreich war (HTTP 200)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Parse die JSON-Daten
                const data = await response.json();
                return data;
            } catch (error) {
                // Logge Fehler in Konsole für Debugging
                console.error('Failed to load translations:', error);
                // Zeige Benutzer-freundliche Fehlermeldung an
                this.showErrorMessage();
                // Gebe leeres Objekt zurück, um weitere Fehler zu vermeiden
                return {};
            }
        }
        
        /**
         * Zeigt eine Fehlermeldung an, wenn Übersetzungen nicht geladen werden können
         * 
         * Erstellt ein rotes Banner am oberen Bildschirmrand mit einer
         * sprachspezifischen Fehlermeldung
         */
        showErrorMessage() {
            // Fehlermeldungen in verschiedenen Sprachen
            const errorMessages = {
                de: 'Fehler beim Laden der Sprachdateien. Bitte laden Sie die Seite neu.',
                en: 'Error loading language files. Please reload the page.'
            };
            
            // Wähle Nachricht basierend auf aktueller Sprache
            const message = errorMessages[this.currentLang] || errorMessages.de;
            
            // Erstelle Fehler-Banner-Element
            const banner = document.createElement('div');
            // Setze Inline-Styles für rotes Fehler-Banner am oberen Rand
            banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #f44336; color: white; padding: 15px; text-align: center; z-index: 10000; font-family: Arial, sans-serif;';
            banner.textContent = message;
            
            // Füge Banner als erstes Element im Body ein
            document.body.insertBefore(banner, document.body.firstChild);
        }
        async init() {
            this.translations = await this.loadTranslations();
            if (this.translations && Object.keys(this.translations).length > 0) {
                this.applyTranslations();
                this.setupToggleButton();
                this.updateAllLinks();
                this.updateHtmlLang();
                window.dispatchEvent(new CustomEvent('languageChanged', {
                    detail: { language: this.currentLang }
                }));
            }
        }
        applyTranslations() {
            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (this.translations[key]) {
                    const translation = this.translations[key][this.currentLang];
                    if (translation) {
                        if (translation.includes('<')) {
                            element.innerHTML = translation;
                        } else {
                            element.textContent = translation;
                        }
                    }
                }
            });
            const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
            placeholders.forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                if (this.translations[key] && this.translations[key][this.currentLang]) {
                    element.setAttribute('placeholder', this.translations[key][this.currentLang]);
                }
            });
            const ariaLabels = document.querySelectorAll('[data-i18n-aria]');
            ariaLabels.forEach(element => {
                const key = element.getAttribute('data-i18n-aria');
                if (this.translations[key] && this.translations[key][this.currentLang]) {
                    element.setAttribute('aria-label', this.translations[key][this.currentLang]);
                }
            });
            const alts = document.querySelectorAll('[data-i18n-alt]');
            alts.forEach(element => {
                const key = element.getAttribute('data-i18n-alt');
                if (this.translations[key] && this.translations[key][this.currentLang]) {
                    element.setAttribute('alt', this.translations[key][this.currentLang]);
                }
            });
        }
        getTranslation(key) {
            if (this.translations && this.translations[key] && this.translations[key][this.currentLang]) {
                return this.translations[key][this.currentLang];
            }
            if (this.translations && Object.keys(this.translations).length > 0) {
                console.warn(`Translation missing for key: "${key}"`);
            }
            return `[Translation missing: ${key}]`;
        }
        setupToggleButton() {
            const toggleBtn = document.querySelector('.lang-toggle, .language-selected');
            const options = document.querySelectorAll('.lang-item, .language-option');
            if (toggleBtn) {
                this.updateButtonContent(toggleBtn);
            }
            this.updateActiveLanguageOption(options);
            options.forEach((option) => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetLang = option.getAttribute('data-lang');
                    if (targetLang && targetLang !== this.currentLang) {
                        this.switchLanguage(targetLang);
                    }
                });
            });
        }
        updateActiveLanguageOption(options) {
            options.forEach((option) => {
                const optionLang = option.getAttribute('data-lang');
                if (!optionLang) return;
                if (optionLang === this.currentLang) {
                    option.setAttribute('aria-current', 'true');
                } else {
                    option.removeAttribute('aria-current');
                }
            });
        }
        updateButtonContent(button) {
            const flagImg = button.querySelector('#activeFlag, .flag-img');
            if (!flagImg) {
                console.warn('No flag image found in language toggle button');
                return;
            }
            const flagUrls = {
                'de': 'https://flagcdn.com/w80/de.png',
                'en': 'https://flagcdn.com/w80/gb.png',
                'fr': 'https://flagcdn.com/w80/fr.png'
            };
            const langNames = {
                'de': 'Deutsch',
                'en': 'English',
                'fr': 'Français'
            };
            if (flagUrls[this.currentLang]) {
                flagImg.src = flagUrls[this.currentLang];
            }
            if (langNames[this.currentLang]) {
                const currentLangName = langNames[this.currentLang];
                button.setAttribute('aria-label', `Sprache wählen (Aktuell: ${currentLangName})`);
            }
        }
        switchLanguage(newLang) {
            if (!newLang) {
                newLang = this.currentLang === 'de' ? 'en' : 'de';
            }
            const allowedLanguages = ['de', 'en', 'fr'];
            if (!allowedLanguages.includes(newLang)) {
                newLang = 'de';
            }
            this.currentLang = newLang;
            const options = document.querySelectorAll('.lang-item, .language-option');
            this.updateActiveLanguageOption(options);
            localStorage.setItem('language', newLang);
            document.cookie = `language=${newLang}; path=/; max-age=31536000; SameSite=Strict`;
            const url = new URL(window.location.href);
            if (newLang === 'en' || newLang === 'fr') {
                url.searchParams.set('lang', newLang);
            } else {
                url.searchParams.delete('lang');
            }
            window.history.replaceState({}, '', url.toString());
            this.applyTranslations();
            this.updateAllLinks();
            this.updateHtmlLang();
            const toggleBtn = document.querySelector('.lang-toggle, .language-selected');
            if (toggleBtn) {
                this.updateButtonContent(toggleBtn);
            }
            const event = new CustomEvent('languageChanged', {
                detail: { language: newLang }
            });
            window.dispatchEvent(event);
        }
        updateAllLinks() {
            const links = document.querySelectorAll('a[href]');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href &&
                    !href.startsWith('http') &&
                    !href.startsWith('#') &&
                    !href.startsWith('mailto:') &&
                    !href.startsWith('tel:') &&
                    href.endsWith('.html')) {
                    if (this.currentLang === 'en' || this.currentLang === 'fr') {
                        const separator = href.includes('?') ? '&' : '?';
                        link.setAttribute('href', href + separator + 'lang=' + this.currentLang);
                    }
                }
            });
        }
        updateHtmlLang() {
            document.documentElement.setAttribute('lang', this.currentLang);
        }
    }
    async function initLanguageSwitcher() {
        window.ibcLanguageSwitcher = new LanguageSwitcher();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
    } else {
        initLanguageSwitcher();
    }
})();