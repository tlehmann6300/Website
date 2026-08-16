/**
 * Scroll-Progress-Story-Modul
 *
 * Bewegt die Hintergrund-Blobs (Blur-Orbs) beim Scrollen und lässt ihre Farbe
 * sanft von IBC-Grün (#6D9744) zu einem tiefen Blau (#20234A) morphen.
 *
 * Folgende Blob-Elemente werden gesteuert:
 *  - .hero-blur-orb-1 / .hero-blur-orb-2           (Hero-Sektion – inkl. Positionsverschiebung)
 *  - .competencies-orb-1 / .competencies-orb-2     (Kompetenzen-Sektion)
 *  - .info-blob-1 / .info-blob-2                   (Info-Cards-Sektion)
 *  - .physics-blob-1 / .physics-blob-2             (Werte-Sektion)
 *
 * Animations-Strategie (performance-first):
 *  - requestAnimationFrame-Schleife – DOM-Schreiben erfolgt ausschließlich im RAF-Callback,
 *    nie direkt im Scroll-Handler. So werden Layout-Thrashing und Jank verhindert.
 *  - Die Schleife läuft NUR, solange sich noch etwas bewegt (dirty-Flag + Settle-Prüfung).
 *    Ist der Viewport ruhig, werden keine weiteren Frames angefordert → CPU-Entlastung
 *    auf Mobilgeräten.
 *  - Hero-Orbs laggen organisch hinter der Scroll-Position durch lineares Interpolieren
 *    (Lerp) ihrer aktuellen Position in Richtung Zielposition. Das erzeugt ein weiches,
 *    trägheitsbasiertes Wandern durch den Viewport.
 *  - Farbe und Positions-Ratio werden ebenfalls geglättet (curRatio → targetRatio),
 *    sodass der Farbwechsel fließend wirkt, nicht sprunghaft.
 *  - Passive Event-Listener für Scroll und Resize.
 *  - Respektiert `prefers-reduced-motion`: bei gesetzter Media-Query wird das Modul
 *    nicht initialisiert (die CSS-Regel blendet die Elemente zusätzlich aus).
 *
 * @module ScrollBlobStory
 */
(function () {
    'use strict';

    /** IBC-Markenfarben als RGB-Tripel */
    var GREEN = { r: 109, g: 151, b: 68 };   // #6D9744
    var BLUE  = { r: 32,  g: 35,  b: 74  };  // #20234A

    /**
     * Interpoliert linear zwischen zwei RGB-Farben.
     * @param {{ r:number, g:number, b:number }} from
     * @param {{ r:number, g:number, b:number }} to
     * @param {number} t - Fortschritt 0…1
     * @returns {{ r:number, g:number, b:number }}
     */
    function lerpColor(from, to, t) {
        return {
            r: Math.round(from.r + (to.r - from.r) * t),
            g: Math.round(from.g + (to.g - from.g) * t),
            b: Math.round(from.b + (to.b - from.b) * t),
        };
    }

    /** Lineares Interpolieren zweier Zahlenwerte. */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Konfiguration jeder Sektion.
     * - `id`           Seiten-Anker der Sektion
     * - `blobs`        Liste der Blob-Selektoren mit individuellen Parametern
     *   - `selector`   CSS-Selektor des Blob-Elements
     *   - `startRatio` Anteil Grün am Anfang der Sektion (0 = Blau, 1 = Grün)
     *   - `endRatio`   Anteil Grün am Ende der Sektion
     *   - `alpha`      Deckkraft des Blobs
     *   - `isSecond`   Wenn true, werden Start- und Zielfarbe vertauscht
     *   - `dx`         Horizontale Verschiebung am Ende der Sektion in px (optional)
     *   - `dy`         Vertikale Verschiebung am Ende der Sektion in px (optional)
     */
    var SECTION_CONFIG = [
        {
            id: 'hero-section',
            blobs: [
                { selector: '.hero-blur-orb-1', startRatio: 0.95, endRatio: 0.35, alpha: 0.12, dx: -30, dy: 20 },
                { selector: '.hero-blur-orb-2', startRatio: 0.15, endRatio: 0.70, alpha: 0.10, isSecond: true, dx: 25, dy: -18 },
            ],
        },
        {
            id: 'competencies-section',
            blobs: [
                { selector: '.competencies-orb-1', startRatio: 0.9, endRatio: 0.5, alpha: 0.08 },
                { selector: '.competencies-orb-2', startRatio: 0.1, endRatio: 0.6, alpha: 0.06, isSecond: true },
            ],
        },
        {
            id: 'info-section',
            blobs: [
                { selector: '.info-blob-1', startRatio: 0.5, endRatio: 0.2, alpha: 0.15 },
                { selector: '.info-blob-2', startRatio: 0.4, endRatio: 0.8, alpha: 0.12, isSecond: true },
            ],
        },
        {
            id: 'valuesSection',
            blobs: [
                { selector: '.physics-blob-1', startRatio: 0.3, endRatio: 0.1, alpha: 0.15 },
                { selector: '.physics-blob-2', startRatio: 0.6, endRatio: 0.9, alpha: 0.12, isSecond: true },
            ],
        },
    ];

    /**
     * Wandelt eine RGB-Farbe mit Alpha-Wert in einen CSS-rgba()-String um.
     * @param {{ r:number, g:number, b:number }} color
     * @param {number} alpha
     * @returns {string}
     */
    function toRgba(color, alpha) {
        return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
    }

    /**
     * Berechnet den Scroll-Fortschritt (0…1) für ein DOM-Element relativ zum Viewport.
     * 0 = Element tritt von unten ins Viewport ein,
     * 1 = Element hat das Viewport vollständig nach oben verlassen.
     * @param {Element} el
     * @returns {number}
     */
    function sectionProgress(el) {
        var rect     = el.getBoundingClientRect();
        var vh       = window.innerHeight;
        var progress = 1 - (rect.bottom / (vh + rect.height));
        return Math.min(Math.max(progress, 0), 1);
    }

    /** Gecachte Sektion- und Blob-Referenzen */
    var sections = [];

    /**
     * RAF-Zustand:
     *  rafId       – Handle des laufenden requestAnimationFrame-Aufrufs (null = pausiert)
     *  dirty       – true wenn ein Scroll-/Resize-Event seit dem letzten Frame aufgetreten ist
     */
    var rafId = null;
    var dirty = false;

    /**
     * Organisches Lerp-Tempo:
     * 0.07 entspricht ~7 % des Abstands pro Frame bei 60 fps – das erzeugt ein weiches
     * Nachzieh-Verhalten. Kleinere Werte = träger, größere = direkter.
     */
    var LERP_SPEED = 0.07;

    /** Settle-Schwellenwert in px – darunter gilt ein Blob als "angekommen". */
    var SETTLE_THRESHOLD = 0.15;

    /** Settle-Schwellenwert für den Farb-Ratio – darunter gilt der Farbwechsel als abgeschlossen. */
    var SETTLE_RATIO = 0.002;

    /**
     * Sammelt alle Sektion-Elemente und Blob-Referenzen und initialisiert
     * den animierten Zustand (curRatio, curX, curY).
     */
    function buildCache() {
        sections = SECTION_CONFIG.reduce(function (acc, cfg) {
            var el = document.getElementById(cfg.id);
            if (!el) return acc;
            var blobRefs = cfg.blobs.map(function (b) {
                return {
                    el:         el.querySelector(b.selector),
                    startRatio: b.startRatio,
                    endRatio:   b.endRatio,
                    alpha:      b.alpha,
                    isSecond:   !!b.isSecond,
                    dx:         b.dx !== undefined ? b.dx : null,
                    dy:         b.dy !== undefined ? b.dy : null,
                    /* Animierter Zustand – wird pro Frame weitergeführt */
                    curRatio: b.startRatio,   // aktuell geglätteter Farbanteil
                    curX:     0,              // aktuell geglättete X-Position
                    curY:     0,              // aktuell geglättete Y-Position
                };
            }).filter(function (b) { return b.el !== null; });
            if (blobRefs.length === 0) return acc;
            acc.push({ section: el, blobs: blobRefs });
            return acc;
        }, []);
    }

    /**
     * Ein einzelner RAF-Frame:
     * Berechnet Zielwerte aus der aktuellen Scroll-Position, gleicht die
     * gecachten Ist-Werte schrittweise an (Lerp) und schreibt das Ergebnis
     * per inline-Style in den DOM. Fordert den nächsten Frame an, solange
     * noch Bewegung vorhanden ist.
     */
    function tick() {
        rafId = null;
        var stillMoving = false;

        sections.forEach(function (entry) {
            var t = sectionProgress(entry.section);

            entry.blobs.forEach(function (blob) {
                // --- Farb-Ratio glatt annähern ----------------------------------------
                var targetRatio = blob.startRatio + (blob.endRatio - blob.startRatio) * t;
                blob.curRatio   = lerp(blob.curRatio, targetRatio, LERP_SPEED);

                var primaryColor = lerpColor(GREEN, BLUE, 1 - blob.curRatio);
                var color = blob.isSecond
                    ? lerpColor(BLUE, GREEN, 1 - blob.curRatio)
                    : primaryColor;
                blob.el.style.background = toRgba(color, blob.alpha);

                if (Math.abs(blob.curRatio - targetRatio) > SETTLE_RATIO) {
                    stillMoving = true;
                }

                // --- Positions-Lerp (organisches Wandern) ------------------------------
                if (blob.dx !== null) {
                    var targetX = blob.dx * t;
                    var targetY = blob.dy * t;
                    blob.curX   = lerp(blob.curX, targetX, LERP_SPEED);
                    blob.curY   = lerp(blob.curY, targetY, LERP_SPEED);

                    blob.el.style.transform =
                        'translate(' + blob.curX.toFixed(2) + 'px, ' + blob.curY.toFixed(2) + 'px)';

                    if (
                        Math.abs(blob.curX - targetX) > SETTLE_THRESHOLD ||
                        Math.abs(blob.curY - targetY) > SETTLE_THRESHOLD
                    ) {
                        stillMoving = true;
                    }
                }
            });
        });

        // Weiterlaufen solange noch Interpolation im Gange ist; sonst pausieren.
        if (stillMoving || dirty) {
            dirty  = false;
            rafId  = requestAnimationFrame(tick);
        }
    }

    /**
     * Plant einen RAF-Frame, falls noch keiner aussteht.
     * Wird von Scroll- und Resize-Listenern aufgerufen.
     */
    function scheduleUpdate() {
        dirty = true;
        if (rafId === null) {
            rafId = requestAnimationFrame(tick);
        }
    }

    /**
     * Initialisiert das Modul:
     * - Prüft auf `prefers-reduced-motion`
     * - Baut den Element-Cache auf
     * - Startet den ersten Frame
     * - Registriert passive Event-Listener
     */
    function init() {
        // Kein Blob-Element auf dieser Seite → nichts tun
        var hasBlobElements = SECTION_CONFIG.some(function (cfg) {
            return document.getElementById(cfg.id) !== null;
        });
        if (!hasBlobElements) return;

        // Barrierefreiheit: bei reduzierter Bewegungspräferenz deaktivieren
        var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq && mq.matches) {
            return;
        }

        buildCache();
        scheduleUpdate();

        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
