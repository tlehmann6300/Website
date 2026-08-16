/**
 * Footer-Utilities-Modul
 * 
 * Dieses Modul stellt nützliche Funktionen für den Footer-Bereich bereit,
 * einschließlich automatischer Jahr-Aktualisierung für das Copyright und
 * Copy-to-Clipboard-Funktionalität für E-Mail-Adressen.
 * 
 * Hauptfunktionen:
 * - Automatische Aktualisierung des Copyright-Jahres
 * - Copy-to-Clipboard für E-Mail-Links
 * - Visuelles Feedback nach dem Kopieren
 * - Fallback für Browser ohne Clipboard-API
 * 
 * @module FooterUtils
 */

// Warte auf vollständiges Laden des DOM
document.addEventListener('DOMContentLoaded', function() {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    // Configuration constants
    const CONFIG = {
        FALLBACK_EMAIL: 'vorstand@business-consulting.de',
        BANNER_DISPLAY_TIME: 4000 // 4 seconds
    };
    
    /**
     * Automatische Copyright-Jahr-Aktualisierung
     * 
     * Findet das Element mit der ID 'current-year' und setzt den Textinhalt
     * auf das aktuelle Jahr. Dies stellt sicher, dass das Copyright-Jahr
     * immer aktuell ist, ohne manuelle Änderungen vornehmen zu müssen.
     */
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        // Hole das aktuelle Jahr und setze es als Textinhalt
        yearSpan.textContent = new Date().getFullYear();
    }
    
    /**
     * Copy-to-Clipboard-Funktionalität für E-Mail-Adressen
     * 
     * Diese Funktionalität ermöglicht es Benutzern, E-Mail-Adressen durch
     * Klicken zu kopieren, anstatt sie manuell auszuwählen. Ein Banner
     * zeigt visuelles Feedback nach erfolgreichem Kopieren.
     */
    
    // Hole das Banner-Element, das nach dem Kopieren angezeigt wird
    const copyBanner = document.getElementById('copy-banner');
    
    /**
     * Finde alle Links mit der Klasse 'copy-email-link'
     * Diese Links sollen nicht navigieren, sondern die E-Mail kopieren
     */
    const emailLinks = document.querySelectorAll('.copy-email-link');
    
    /**
     * Füge jedem E-Mail-Link einen Klick-Event-Listener hinzu
     */
    emailLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            /**
             * Verhindere Standard-Link-Verhalten
             * Der Link soll nicht zu einem mailto:-Link navigieren
             */
            event.preventDefault();
            
            /**
             * Extrahiere E-Mail-Adresse aus dem Linktext
             * trim() entfernt Leerzeichen am Anfang und Ende
             */
            const email = this.textContent.trim();
            
            /**
             * Prüfe, ob die moderne Clipboard API verfügbar ist
             * Diese API ist in modernen Browsern standardmäßig verfügbar
             */
            if (navigator.clipboard && navigator.clipboard.writeText) {
                /**
                 * Verwende Clipboard API zum Kopieren
                 * writeText() gibt ein Promise zurück
                 */
                navigator.clipboard.writeText(email).then(() => {
                    /**
                     * Erfolgsfall: E-Mail wurde kopiert
                     * Zeige visuelles Feedback durch Banner
                     */
                    if (copyBanner) {
                        // Füge 'show' Klasse hinzu, um Banner sichtbar zu machen
                        copyBanner.classList.add('show');
                        
                        /**
                         * Verstecke Banner nach configured time
                         * Gibt dem Benutzer genug Zeit, das Feedback zu sehen
                         */
                        setTimeout(() => {
                            copyBanner.classList.remove('show');
                        }, CONFIG.BANNER_DISPLAY_TIME);
                    }
                }).catch(err => {
                    /**
                     * Fehlerfall: Kopieren fehlgeschlagen
                     * Versuche Fallback-Methode für Firefox und andere Browser
                     */
                    console.error('Fehler beim Kopieren:', err);
                    fallbackCopyToClipboard(email, copyBanner);
                });
            } else {
                /**
                 * Fallback für ältere Browser ohne Clipboard API
                 * Versuche alternative Kopiermethode
                 */
                fallbackCopyToClipboard(email, copyBanner);
            }
        });
    });
    
    /**
     * Fallback-Funktion zum Kopieren in die Zwischenablage
     * Funktioniert in allen modernen Browsern einschließlich Firefox
     * 
     * @param {string} text - Der zu kopierende Text
     * @param {HTMLElement} banner - Das Banner-Element für visuelles Feedback
     */
    function fallbackCopyToClipboard(text, banner) {
        // Erstelle ein temporäres Textfeld
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Verstecke das Textfeld visuell, aber mache es für die Zwischenablage zugänglich
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.setAttribute('readonly', '');
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        
        // Fokussiere und wähle den Text aus
        textArea.focus();
        textArea.select();
        
        // Helper function to clean up textarea
        const cleanup = () => {
            if (textArea.parentNode) {
                textArea.parentNode.removeChild(textArea);
            }
        };
        
        // Versuche den Text zu kopieren
        try {
            textArea.setSelectionRange(0, text.length);
            
            // Versuche direkt über Clipboard API (funktioniert auch nach Select)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    if (banner) {
                        banner.classList.add('show');
                        setTimeout(() => banner.classList.remove('show'), 4000);
                    }
                    cleanup();
                }).catch(() => {
                    // Letzte Option: Nutzer informieren
                    alert('Kopieren nicht unterstützt. Bitte manuell kopieren: ' + text);
                    cleanup();
                });
            } else {
                // Für ältere Browser: Zeige Anweisung zum manuellen Kopieren
                alert('Bitte kopieren Sie manuell: ' + text);
                cleanup();
            }
        } catch (err) {
            console.error('Fallback-Kopieren fehlgeschlagen:', err);
            alert('Kopieren fehlgeschlagen. Bitte manuell kopieren: ' + text);
            cleanup();
        }
    }
});
