/**
 * Board-Loader-Modul (Vorstands-Mitglieder-Loader)
 * 
 * Dieses Modul lädt dynamisch die Namen der Vorstands-Mitglieder aus einer
 * JSON-Datei und fügt sie in die entsprechenden Container auf der Website ein.
 * Es unterstützt mehrere Sprachen und reagiert auf Sprachwechsel-Events.
 * 
 * Hauptfunktionen:
 * - Asynchrones Laden von Team-Daten aus JSON-Datei
 * - Dynamische Formatierung von Vorstands-Mitgliedern
 * - Mehrsprachige Positionsbezeichnungen
 * - Automatische Aktualisierung bei Sprachwechsel
 * - Fehlerbehandlung und Logging
 * 
 * @module BoardLoader
 */
(function() {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    /**
     * Lädt Vorstands-Mitglieder aus JSON und zeigt sie an
     * 
     * Diese asynchrone Funktion holt die Team-Daten vom Server,
     * extrahiert die Vorstands-Mitglieder und fügt sie formatiert
     * in alle Container mit dem data-board-members Attribut ein.
     * 
     * @async
     * @returns {Promise<void>}
     */
    async function loadBoardMembers() {
        /**
         * Finde alle Container, die Vorstands-Mitglieder anzeigen sollen
         * Diese sind durch das data-board-members Attribut markiert
         */
        const boardContainers = document.querySelectorAll('[data-board-members]');
        const chairmanContainers = document.querySelectorAll('[data-board-chairman]');
        const datenschutzContainers = document.querySelectorAll('[data-datenschutzbeauftragter]');
        
        // Wenn keine Container existieren, beende die Funktion vorzeitig
        if (boardContainers.length === 0 && chairmanContainers.length === 0 && datenschutzContainers.length === 0) {
            return;
        }
        
        try {
            /**
             * Lade Team-Daten von der JSON-Datei
             * Diese Datei enthält alle Team-Mitglieder inkl. Vorstand
             */
            const response = await fetch('assets/data/team_data.json');
            
            // Prüfe, ob der Request erfolgreich war
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parse die JSON-Daten
            const data = await response.json();
            
            /**
             * Extrahiere Vorstands-Array aus den Daten
             * Fallback auf leeres Array, falls 'vorstand' nicht existiert
             */
            const vorstand = data.vorstand || [];
            
            // Wenn keine Vorstands-Mitglieder gefunden wurden, logge Warnung
            if (vorstand.length === 0) {
                console.warn('No board members found in team_data.json');
                return;
            }
            
            /**
             * Ermittle aktuelle Sprache aus URL-Parameter
             * Standard ist Deutsch ('de'), wenn kein Parameter vorhanden
             */
            const urlParams = new URLSearchParams(window.location.search);
            const currentLang = urlParams.get('lang') || 'de';
            
            // Configuration for chairman position detection (multi-language support)
            const CHAIRMAN_POSITION_PATTERNS = {
                de: ['vorsitzender', 'vorstand', 'chairman'],
                en: ['chairman', 'president', 'chief'],
                fr: ['président', 'directeur']
            };
            
            // Load chairman name (first board member) into chairman containers
            // Assumption: The first member in the vorstand array is always the chairman (Vorstandsvorsitzender)
            // This is guaranteed by the structure of team_data.json where vorstand[0] is defined as chairman
            // 
            // Future improvement: Consider adding an explicit 'isChairman' field to the JSON structure
            // to make this more self-documenting and less dependent on array ordering.
            // Example: { "name": "...", "isChairman": true, ... }
            // 
            // Validation: Check if the first member's position indicates chairman role
            if (chairmanContainers.length > 0 && vorstand.length > 0) {
                const firstMember = vorstand[0];
                
                // Validate chairman role by checking position titles
                let isChairman = false;
                for (const [lang, patterns] of Object.entries(CHAIRMAN_POSITION_PATTERNS)) {
                    const position = firstMember.position?.[lang]?.toLowerCase() || '';
                    if (patterns.some(pattern => position.includes(pattern))) {
                        isChairman = true;
                        break;
                    }
                }
                
                if (!isChairman) {
                    console.warn('First board member may not be chairman. Position:', firstMember.position);
                }
                
                chairmanContainers.forEach(container => {
                    container.textContent = firstMember.name;
                });
            }
            
            /**
             * Fülle Datenschutzbeauftragter-Name aus eigenem JSON-Eintrag
             * Dieser ist unabhängig vom Vorstand und kann separat gepflegt werden
             */
            if (datenschutzContainers.length > 0) {
                const datenschutz = data.datenschutzbeauftragter;
                if (datenschutz && datenschutz.name) {
                    datenschutzContainers.forEach(container => {
                        container.textContent = datenschutz.name;
                    });
                } else {
                    console.warn('No datenschutzbeauftragter entry found in team_data.json');
                }
            }
            
            /**
             * Formatiere Vorstands-Mitglieder als HTML-Text
             * Die Funktion generiert eine sprachspezifische Darstellung
             */
            const boardText = formatBoardMembers(vorstand, currentLang);
            
            /**
             * Füge formatierten Text in alle Container ein
             * Verwendet innerHTML für HTML-Formatierung (z.B. <br> Tags)
             */
            boardContainers.forEach(container => {
                container.innerHTML = boardText;
            });
            
        } catch (error) {
            /**
             * Fehlerbehandlung
             * Logge Fehler in Konsole für Debugging
             * Die Seite funktioniert weiter, auch wenn Laden fehlschlägt
             */
            console.error('Failed to load board members:', error);
        }
    }
    
    /**
     * Formatiert Vorstands-Mitglieder als HTML-String
     * 
     * Generiert eine sprachspezifische Darstellung der Vorstands-Mitglieder
     * mit ihren Positionen und Namen.
     * 
     * @param {Array} vorstand - Array mit Vorstands-Mitgliedern
     * @param {string} lang - Sprachcode ('de', 'en', oder 'fr')
     * @returns {string} Formatierter HTML-String mit <br> Tags
     */
    function formatBoardMembers(vorstand, lang) {
        /**
         * Erwartete Anzahl von Vorstands-Mitgliedern
         * Wird für Validierung und Warnung verwendet
         */
        const EXPECTED_BOARD_MEMBERS = 3;
        
        /**
         * Validierung: Warne, wenn weniger Mitglieder als erwartet
         * Dies hilft beim Debugging von Daten-Problemen
         */
        if (vorstand.length < EXPECTED_BOARD_MEMBERS) {
            console.warn(`Expected ${EXPECTED_BOARD_MEMBERS} board members, found:`, vorstand.length);
        }
        
        /**
         * Positions-Bezeichnungen in allen Sprachen
         * 
         * Definiert die offiziellen Titel für die drei Vorstands-Positionen:
         * 1. Vorstand (Vorsitzende/r)
         * 2. Vorstand (Stellvertretende/r)
         * 3. Vorstand für Finanzen & Recht
         */
        const positions = {
            de: ['1. Vorstand', '2. Vorstand', 'Vorstand für Finanzen & Recht'],
            en: ['1st Board Member', '2nd Board Member', 'Board Member for Finance & Legal'],
            fr: ['1er membre du conseil', '2ème membre du conseil', 'Membre du conseil pour les finances et le juridique']
        };
        
        /**
         * Hole Positions-Labels für aktuelle Sprache
         * Fallback auf Deutsch, falls Sprache nicht unterstützt
         */
        const positionLabels = positions[lang] || positions.de;
        
        /**
         * Array für formatierte Zeilen
         * Jede Zeile enthält Position und Name eines Mitglieds
         */
        const lines = [];
        
        /**
         * Iteriere über Vorstands-Mitglieder
         * Beschränke auf die erwartete Anzahl (3)
         */
        vorstand.forEach((member, index) => {
            if (index < EXPECTED_BOARD_MEMBERS) {
                /**
                 * Ermittle Positions-Bezeichnung für dieses Mitglied
                 * Priorität:
                 * 1. Vordefiniertes Label aus positionLabels
                 * 2. Position aus member.position[lang]
                 * 3. Fallback auf Deutsche Position
                 */
                const positionLabel = positionLabels[index] || member.position[lang] || member.position.de;
                
                /**
                 * Füge formatierte Zeile hinzu
                 * Format: "Position: Name"
                 * Beispiel: "1. Vorstand: Max Mustermann"
                 */
                lines.push(`${positionLabel}: ${member.name}`);
            }
        });
        
        /**
         * Verbinde alle Zeilen mit <br> Tags für HTML-Zeilenumbrüche
         * Beispiel-Ausgabe:
         * "1. Vorstand: Max Mustermann<br>2. Vorstand: Anna Schmidt<br>..."
         */
        return lines.join('<br>');
    }
    
    /**
     * Initialisiert das Board-Loader-Modul
     * 
     * Richtet Event-Listener ein und führt das initiale Laden durch
     */
    function init() {
        /**
         * Initiales Laden beim Seiten-Start
         * Prüft, ob DOM bereits geladen ist
         */
        if (document.readyState === 'loading') {
            // DOM lädt noch - warte auf DOMContentLoaded-Event
            document.addEventListener('DOMContentLoaded', loadBoardMembers);
        } else {
            // DOM ist bereits geladen - führe sofort aus
            loadBoardMembers();
        }
        
        /**
         * Event-Listener für Sprachwechsel
         * 
         * Wenn die Sprache gewechselt wird (ausgelöst von language-switcher.js),
         * laden wir die Vorstands-Mitglieder erneut, um die Positionen
         * in der neuen Sprache anzuzeigen
         */
        window.addEventListener('languageChanged', (event) => {
            loadBoardMembers();
        });
    }
    
    // Starte Initialisierung
    init();
})();
