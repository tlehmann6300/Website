/**
 * Scroll-Fortschrittsanzeige-Modul
 * 
 * Dieses Modul erstellt eine visuelle Fortschrittsanzeige am oberen Bildschirmrand,
 * die zeigt, wie weit der Benutzer durch die Seite gescrollt hat.
 * Die Fortschrittsleiste ist barrierefrei mit ARIA-Attributen implementiert.
 * 
 * Hauptfunktionen:
 * - Dynamische Erstellung der Fortschrittsleiste
 * - Echtzeit-Update beim Scrollen
 * - ARIA-Unterstützung für Screenreader
 * - Responsive Berechnung für verschiedene Bildschirmgrößen
 * - Passive Event-Listener für bessere Performance
 * 
 * @module ScrollProgress
 */
(function() {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    /**
     * Initialisiert die Scroll-Fortschrittsanzeige
     * 
     * Erstellt die Fortschrittsleiste, fügt sie dem DOM hinzu
     * und richtet Event-Listener für Scroll- und Resize-Events ein.
     */
    function initScrollProgress() {
        /**
         * Erstellt das Fortschrittsleisten-Element
         * Dies ist ein div, das als visueller Indikator dient
         */
        const progressBar = document.createElement('div');
        
        // Füge CSS-Klasse für Styling hinzu
        progressBar.className = 'scroll-progress-bar';
        
        /**
         * ARIA-Attribute für Barrierefreiheit
         * Macht die Fortschrittsleiste für Screenreader zugänglich
         */
        progressBar.setAttribute('role', 'progressbar');  // Definiert Element als Fortschrittsanzeige
        progressBar.setAttribute('aria-label', 'Scroll progress');  // Beschreibender Text für Screenreader
        progressBar.setAttribute('aria-valuemin', '0');  // Minimaler Wert (0%)
        progressBar.setAttribute('aria-valuemax', '100');  // Maximaler Wert (100%)
        progressBar.setAttribute('aria-valuenow', '0');  // Aktueller Wert (wird dynamisch aktualisiert)
        
        /**
         * Füge Fortschrittsleiste als erstes Element im Body ein
         * Dies stellt sicher, dass sie über allen anderen Elementen liegt
         */
        document.body.insertBefore(progressBar, document.body.firstChild);
        
        /**
         * Aktualisiert die Fortschrittsleiste basierend auf Scroll-Position
         * 
         * Diese Funktion berechnet den Scroll-Fortschritt als Prozentsatz
         * und aktualisiert die Breite der Fortschrittsleiste entsprechend.
         */
        function updateProgress() {
            // Hole die Höhe des sichtbaren Viewports
            const windowHeight = window.innerHeight;
            
            // Hole die Gesamt-Dokumenthöhe (inkl. nicht sichtbarer Bereiche)
            const documentHeight = document.documentElement.scrollHeight;
            
            // Hole aktuelle Scroll-Position von oben (Cross-Browser-kompatibel)
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            /**
             * Berechne die scrollbare Höhe
             * Dies ist die Dokumenthöhe minus der Viewport-Höhe
             * Repräsentiert die maximale Scroll-Distanz
             */
            const scrollableHeight = documentHeight - windowHeight;
            
            // Initialisiere Scroll-Prozentsatz
            let scrollPercentage = 0;
            
            /**
             * Berechne Scroll-Prozentsatz
             * Nur wenn es scrollbaren Inhalt gibt (verhindert Division durch 0)
             */
            if (scrollableHeight > 0) {
                // Prozentsatz = (aktuelle Position / maximale Position) * 100
                scrollPercentage = (scrollTop / scrollableHeight) * 100;
            }
            
            /**
             * Begrenze den Prozentsatz auf den Bereich 0-100
             * Math.max stellt sicher: Minimum ist 0
             * Math.min stellt sicher: Maximum ist 100
             */
            scrollPercentage = Math.min(Math.max(scrollPercentage, 0), 100);
            
            /**
             * Setze die Breite der Fortschrittsleiste
             * Die CSS-Transition sorgt für sanfte Übergänge
             */
            progressBar.style.width = scrollPercentage + '%';
            
            /**
             * Update ARIA-Attribut für Screenreader
             * Math.round rundet auf ganze Zahlen für bessere Lesbarkeit
             */
            progressBar.setAttribute('aria-valuenow', Math.round(scrollPercentage));
        }
        
        /**
         * Event-Listener für Scroll-Events
         * passive: true verhindert Blocking für bessere Performance
         */
        window.addEventListener('scroll', updateProgress, { passive: true });
        
        /**
         * Event-Listener für Resize-Events
         * Aktualisiert Fortschritt bei Fenstergrößen-Änderung
         * (z.B. beim Drehen eines Mobilgeräts)
         */
        window.addEventListener('resize', updateProgress, { passive: true });
        
        // Initiale Berechnung beim Laden der Seite
        updateProgress();
    }
    
    /**
     * Initialisierung der Scroll-Fortschrittsanzeige
     * Prüft, ob das DOM bereits vollständig geladen ist
     */
    if (document.readyState === 'loading') {
        // DOM lädt noch - warte auf DOMContentLoaded-Event
        document.addEventListener('DOMContentLoaded', initScrollProgress);
    } else {
        // DOM ist bereits geladen - führe sofort aus
        initScrollProgress();
    }
})();