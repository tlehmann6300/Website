/**
 * IBC Motion 2026 — scroll-getriebene Animationen für die Startseite
 *
 * Apple-inspirierte Effekte, bewusst schlank gehalten:
 *  · Hero: Wort-für-Wort-Entrance + scroll-getriebenes Ausblenden
 *  · Ambient-Orbs: sanfter Parallax
 *  · Karten & Stats: 3D-Tilt + cursorfolgendes Glanzlicht (nur Maus)
 *  · Magnetischer Footer-CTA
 *
 * Alles respektiert prefers-reduced-motion: ohne Motion wird die Klasse
 * `d26-motion` nie gesetzt und sämtliche CSS-Keyframes bleiben aus.
 * Reveal-Einblendungen übernimmt weiterhin main.js (IntersectionObserver)
 * mit dem Look aus css/design-2026.css.
 */
(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    document.documentElement.classList.add('d26-motion');

    /* ────────────────────────────────────────────────────────
       1 · Hero-Headline in Wörter zerlegen (i18n-sicher)
       ──────────────────────────────────────────────────────── */
    var heroH1 = document.querySelector('#hero-section h1');

    function splitHeadline() {
        if (!heroH1) return;
        /* Bereits zerlegt? Erst zurückbauen (Sprachwechsel ersetzt Text) */
        if (heroH1.querySelector('.d26-word')) return;

        var wordIndex = 0;
        var nodes = Array.prototype.slice.call(heroH1.childNodes);

        nodes.forEach(function (node) {
            var host = null;
            if (node.nodeType === Node.TEXT_NODE) {
                host = node;
            } else if (node.nodeType === Node.ELEMENT_NODE && !node.querySelector('*')) {
                /* z. B. <span class="text-gradient">…</span> */
                host = node.firstChild;
            }
            if (!host || !host.textContent || !host.textContent.trim()) return;

            var frag = document.createDocumentFragment();
            host.textContent.split(/(\s+)/).forEach(function (part) {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                    frag.appendChild(document.createTextNode(part));
                    return;
                }
                var w = document.createElement('span');
                w.className = 'd26-word';
                w.style.setProperty('--wi', String(wordIndex++));
                w.textContent = part;
                frag.appendChild(w);
            });
            host.parentNode.replaceChild(frag, host);
        });
    }

    splitHeadline();

    /* Nach Sprachwechsel ersetzt der content-loader den Text → neu zerlegen */
    window.addEventListener('languageChanged', function () {
        setTimeout(splitHeadline, 80);
    });

    /* Übersetzungen kommen asynchron: ersetzt der Loader den Inhalt,
       ist der Split weg → beobachten und erneut zerlegen (der eigene
       Split triggert den Observer, ist dann aber ein No-op). */
    if (heroH1) {
        new MutationObserver(function () {
            if (!heroH1.querySelector('.d26-word')) {
                setTimeout(splitHeadline, 30);
            }
        }).observe(heroH1, { childList: true });
    }

    /* ────────────────────────────────────────────────────────
       2 · Scroll-Engine (ein rAF-Loop für alle Scroll-Effekte)
       ──────────────────────────────────────────────────────── */
    var heroContent = document.querySelector('#hero-section .container');
    var heroSection = document.getElementById('hero-section');
    var parallaxEls = [
        { el: document.querySelector('.competencies-orb-1'), speed: -0.06 },
        { el: document.querySelector('.competencies-orb-2'), speed: 0.05 },
        { el: document.querySelector('.info-blob-1'), speed: -0.05 },
        { el: document.querySelector('.info-blob-2'), speed: 0.04 }
    ].filter(function (p) { return p.el; });

    var ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    function update() {
        ticking = false;
        var y = window.scrollY;

        /* Hero: bis zum Ende der Hero-Höhe ausblenden + leicht schrumpfen */
        if (heroContent && heroSection) {
            var heroH = heroSection.offsetHeight || 1;
            var p = Math.min(y / (heroH * 0.85), 1);
            heroContent.style.transform =
                'translateY(' + (y * 0.32).toFixed(1) + 'px) scale(' + (1 - p * 0.07).toFixed(4) + ')';
            heroContent.style.opacity = String(Math.max(1 - p * 1.15, 0));
        }

        /* Ambient-Orbs: gegenläufiger Parallax */
        for (var i = 0; i < parallaxEls.length; i++) {
            var item = parallaxEls[i];
            var rect = item.el.parentElement.getBoundingClientRect();
            var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * item.speed;
            item.el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    /* ────────────────────────────────────────────────────────
       3 · Pointer-Effekte (nur echte Maus, kein Touch)
       ──────────────────────────────────────────────────────── */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {

        /* 3a · 3D-Tilt + Glanzlicht */
        var TILT_MAX = 5; /* Grad */
        var tiltTargets = document.querySelectorAll(
            '.info-glass-card, .physics-card, .stat-card, .competency-card:not(.competency-card--featured)'
        );

        tiltTargets.forEach(function (card) {
            var frame = null;

            card.addEventListener('pointermove', function (e) {
                if (frame) return;
                frame = requestAnimationFrame(function () {
                    frame = null;
                    var r = card.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width;   /* 0..1 */
                    var py = (e.clientY - r.top) / r.height;

                    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');

                    var rx = ((0.5 - py) * TILT_MAX * 2).toFixed(2);
                    var ry = ((px - 0.5) * TILT_MAX * 2).toFixed(2);
                    card.style.transform =
                        'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-6px)';
                });
            });

            card.addEventListener('pointerleave', function () {
                if (frame) { cancelAnimationFrame(frame); frame = null; }
                card.style.transform = '';
            });
        });

        /* 3b · Magnetischer Footer-CTA */
        var magnet = document.querySelector('.fat-footer__cta-btn');
        if (magnet) {
            var MAGNET_RANGE = 26; /* px maximale Auslenkung */
            var mFrame = null;

            magnet.addEventListener('pointermove', function (e) {
                if (mFrame) return;
                mFrame = requestAnimationFrame(function () {
                    mFrame = null;
                    var r = magnet.getBoundingClientRect();
                    var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
                    var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
                    magnet.style.transform =
                        'translate(' + (dx * MAGNET_RANGE).toFixed(1) + 'px,' + (dy * MAGNET_RANGE * 0.6).toFixed(1) + 'px)';
                });
            });

            magnet.addEventListener('pointerleave', function () {
                if (mFrame) { cancelAnimationFrame(mFrame); mFrame = null; }
                magnet.style.transform = '';
            });
        }
    }

    /* ────────────────────────────────────────────────────────
       4 · Wird Reduced Motion zur Laufzeit aktiviert: aufräumen
       ──────────────────────────────────────────────────────── */
    reducedMotion.addEventListener('change', function (e) {
        if (!e.matches) return;
        document.documentElement.classList.remove('d26-motion');
        window.removeEventListener('scroll', onScroll);
        if (heroContent) {
            heroContent.style.transform = '';
            heroContent.style.opacity = '';
        }
        parallaxEls.forEach(function (p) { p.el.style.transform = ''; });
    });
})();
