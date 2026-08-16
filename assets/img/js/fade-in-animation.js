/**
 * Fade-In-Animation-Modul
 * 
 * Dieses Modul implementiert sanfte Einblend-Animationen für Elemente,
 * die in den Viewport scrollen. Verwendet die Intersection Observer API
 * für performante Sichtbarkeitserkennung.
 * 
 * Funktionsweise:
 * - Beobachtet alle Elemente mit der Klasse 'fade-in-up'
 * - Fügt die Klasse 'is-visible' hinzu, wenn Element sichtbar wird
 * - Unterstützt individuelle Animations-Verzögerungen
 * 
 * CSS-Anforderungen:
 * - .fade-in-up: Definiert Initial-Zustand (unsichtbar/verschoben)
 * - .fade-in-up.is-visible: Definiert End-Zustand (sichtbar)
 * 
 * @module FadeInAnimation
 */

// Warte auf vollständiges Laden des DOM
document.addEventListener('DOMContentLoaded', function () {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    /**
     * Erstellt einen Intersection Observer
     * 
     * Der Observer überwacht, wann Elemente in den sichtbaren Bereich
     * des Viewports scrollen und löst dann die Animation aus.
     * 
     * @type {IntersectionObserver}
     */
    const observer = new IntersectionObserver((entries) => {
        // Iteriere über alle beobachteten Elemente
        entries.forEach(entry => {
            /**
             * Prüfe, ob Element in den Viewport eintritt
             * isIntersecting ist true, wenn das Element sichtbar wird
             */
            if (entry.isIntersecting) {
                /**
                 * Hole individuelle Animations-Verzögerung aus data-Attribut
                 * Erlaubt gestaffelte Animationen (z.B. '100ms', '200ms', etc.)
                 * Standard ist '0ms' wenn kein Attribut gesetzt ist
                 */
                const delay = entry.target.dataset.animationDelay || '0ms';
                
                // Setze CSS transition-delay für zeitversetzte Animation
                entry.target.style.transitionDelay = delay;
                
                /**
                 * Füge 'is-visible' Klasse hinzu
                 * Dies triggert die CSS-Animation (definiert in fade-in-animation.css)
                 * Die CSS-Transition animiert Opacity und Transform
                 */
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        /**
         * threshold: 0.1 bedeutet, dass der Observer triggert,
         * wenn 10% des Elements sichtbar sind
         * Niedrigerer Wert = Animation startet früher beim Scrollen
         */
        threshold: 0.1
    });
    
    /**
     * Finde alle Elemente mit der Klasse 'fade-in-up' und überwache sie
     * Diese Elemente werden animiert, sobald sie in den Viewport scrollen
     */
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
});
