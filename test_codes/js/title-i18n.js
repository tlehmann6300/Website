/**
 * Title-Internationalisierung-Modul (Title i18n)
 * 
 * Dieses Modul verwaltet die mehrsprachigen Seitentitel (Browser-Tab-Titel)
 * für alle Seiten der Website. Es erkennt die aktuelle Seite und Sprache
 * und setzt den entsprechenden lokalisierten Titel.
 * 
 * Hauptfunktionen:
 * - Seitenerkennung basierend auf URL-Pfad
 * - Spracherkennung aus URL-Parameter oder LocalStorage
 * - Automatische Titel-Aktualisierung beim Laden
 * - Unterstützung für Deutsch, Englisch und Französisch
 * - Globale API für manuelle Titel-Aktualisierung
 * 
 * @module TitleI18n
 */
(function() {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    /**
     * Übersetzungs-Datenbank für Seitentitel
     * 
     * Enthält alle Seitentitel in den drei unterstützten Sprachen.
     * Jeder Schlüssel repräsentiert eine Seite der Website.
     * 
     * @type {Object.<string, Object.<string, string>>}
     */
    const titleTranslations = {
        // Startseite / Homepage
        'page-title-home': {
            de: 'Institut für Business Consulting e.V. | Studentische Unternehmensberatung',
            en: 'Institute for Business Consulting | Student Consulting Firm',
            fr: 'Institut de Business Consulting | Cabinet de Conseil Étudiant'
        },
        // Kontakt-Seite
        'page-title-contact': {
            de: 'Kontakt | Institut für Business Consulting e.V.',
            en: 'Contact | Institute for Business Consulting',
            fr: 'Contact | Institut de Business Consulting'
        },
        // Für Studierende-Seite
        'page-title-students': {
            de: 'Für Studierende | Institut für Business Consulting e.V.',
            en: 'For Students | Institute for Business Consulting',
            fr: 'Pour les Étudiants | Institut de Business Consulting'
        },
        // Für Unternehmen-Seite
        'page-title-companies': {
            de: 'Für Unternehmen | Institut für Business Consulting e.V.',
            en: 'For Companies | Institute for Business Consulting',
            fr: 'Pour Entreprises | Institut de Business Consulting'
        },
        // Über uns-Seite
        'page-title-about': {
            de: 'Über uns | Institut für Business Consulting e.V.',
            en: 'About Us | Institute for Business Consulting',
            fr: 'À propos | Institut de Business Consulting'
        },
        // Netzwerk-Seite
        'page-title-network': {
            de: 'Unser Netzwerk | Institut für Business Consulting e.V.',
            en: 'Our Network | Institute for Business Consulting',
            fr: 'Notre Réseau | Institut de Business Consulting'
        },
        // Wartungs-Seite
        'page-title-maintenance': {
            de: 'Wartungsarbeiten | Institut für Business Consulting e.V.',
            en: 'Under Maintenance | Institute for Business Consulting',
            fr: 'En Maintenance | Institut de Business Consulting'
        }
    };
    
    /**
     * Ermittelt den Übersetzungsschlüssel für die aktuelle Seite
     * 
     * Analysiert den URL-Pfad und gibt den entsprechenden Schlüssel
     * für die titleTranslations-Datenbank zurück.
     * 
     * @returns {string} Der Schlüssel für die aktuelle Seite
     */
    function getCurrentPageKey() {
        // Hole den Pfadnamen der aktuellen URL und konvertiere zu Kleinbuchstaben
        const path = window.location.pathname.toLowerCase();
        
        // Prüfe den Pfad und gebe entsprechenden Schlüssel zurück
        if (path.includes('kontakt')) return 'page-title-contact';
        if (path.includes('studierende')) return 'page-title-students';
        if (path.includes('unternehmen')) return 'page-title-companies';
        if (path.includes('ueber-uns')) return 'page-title-about';
        if (path.includes('netzwerk')) return 'page-title-network';
        if (path.includes('maintenance')) return 'page-title-maintenance';
        
        // Standard: Homepage
        return 'page-title-home';
    }
    
    /**
     * Ermittelt die aktuelle Sprache des Benutzers
     * 
     * Prüft in dieser Reihenfolge:
     * 1. URL-Parameter 'lang'
     * 2. LocalStorage 'preferred-language'
     * 3. Standard: Deutsch
     * 
     * @returns {string} Sprachcode ('de', 'en', oder 'fr')
     */
    function getCurrentLang() {
        // Parse URL-Query-Parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        
        /**
         * Priorität 1: URL-Parameter
         * Wenn 'lang' in der URL vorhanden und gültig ist, verwende diesen
         */
        if (urlLang && ['de', 'en', 'fr'].includes(urlLang)) {
            return urlLang;
        }
        
        /**
         * Priorität 2: LocalStorage
         * Falls der Benutzer zuvor eine Sprache gewählt hat
         */
        const storedLang = localStorage.getItem('preferred-language');
        if (storedLang && ['de', 'en', 'fr'].includes(storedLang)) {
            return storedLang;
        }
        
        /**
         * Priorität 3: Standard
         * Deutsch ist die Standardsprache
         */
        return 'de';
    }
    
    /**
     * Aktualisiert den Seitentitel basierend auf Sprache und Seite
     * 
     * Diese Funktion ermittelt die aktuelle Sprache und Seite,
     * holt die entsprechende Übersetzung und setzt den Seitentitel.
     */
    function updateTitle() {
        // Ermittle aktuelle Sprache
        const lang = getCurrentLang();
        // Ermittle aktuellen Seiten-Schlüssel
        const pageKey = getCurrentPageKey();
        // Hole Übersetzungen für diese Seite
        const translations = titleTranslations[pageKey];
        
        /**
         * Wenn Übersetzungen existieren und für die Sprache verfügbar sind,
         * setze den Seitentitel (wird im Browser-Tab angezeigt)
         */
        if (translations && translations[lang]) {
            document.title = translations[lang];
        }
    }
    
    /**
     * Initialisierung beim Laden der Seite
     * Prüft, ob DOM bereits geladen ist
     */
    if (document.readyState === 'loading') {
        // DOM lädt noch - warte auf DOMContentLoaded-Event
        document.addEventListener('DOMContentLoaded', updateTitle);
    } else {
        // DOM ist bereits geladen - führe sofort aus
        updateTitle();
    }
    
    /**
     * Globale API für Title-i18n
     * 
     * Macht Funktionen und Daten global verfügbar für:
     * - Manuelle Titel-Aktualisierung
     * - Sprachwechsel-Integration
     * - Zugriff auf Übersetzungsdaten
     * 
     * @global
     * @namespace window.ibcTitleI18n
     */
    window.ibcTitleI18n = {
        // Funktion zum manuellen Aktualisieren des Titels
        updateTitle: updateTitle,
        // Funktion zum Abrufen der aktuellen Sprache
        getCurrentLang: getCurrentLang,
        // Zugriff auf alle Titel-Übersetzungen
        translations: titleTranslations
    };
})();
