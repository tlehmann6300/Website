/* ============================================================
   SITE-WIDE FIX BUNDLE (loaded after other scripts)
   - Counter animations on stats that are missing the trigger class
   - JSON-driven enable for "Jetzt bewerben" buttons
   - Theme-aware cursor glow on every page / breakpoint
   - Re-process Instagram embeds when phones become visible
   ============================================================ */
(function () {
    'use strict';

    /* ── 1. COUNTER ANIMATION ─────────────────────────────────
       Find numeric stat elements that are not yet wired and
       animate them on first viewport entry. */
    function initFixCounters() {
        var selectors = [
            '.hero-stat__number', '.fu-stat__num', '.kn-stat-number',
            '.stat-card__number', '.uu-hero-stat__num',
            '.page-hero__stat-num', '.nk-stat-number', '.ueber-stat__number',
            '[data-counter]', '.counter-up'
        ];
        var elements = document.querySelectorAll(selectors.join(','));
        if (!elements.length || typeof IntersectionObserver === 'undefined') return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                if (el.dataset.fixCounter === '1') return;
                if (el.dataset.ibcCounterInit === '1') { observer.unobserve(el); return; }
                el.dataset.fixCounter = '1';
                el.dataset.ibcCounterInit = '1';

                /* Choose the text node we'll animate */
                var target = el;
                var inner = el.querySelector('.fu-stat__count, .counter-target');
                if (inner) target = inner;

                var raw = target.textContent.trim();
                var match = raw.match(/^(\d+)(.*)$/);
                if (!match) { observer.unobserve(el); return; }
                var to = parseInt(match[1], 10);
                var suffix = match[2] || '';
                var fromAttr = el.getAttribute('data-count-from');
                var from = fromAttr !== null ? parseInt(fromAttr, 10) : 0;
                if (isNaN(to) || to === from) { observer.unobserve(el); return; }

                var dur = 1600;
                var start = performance.now();
                function step(now) {
                    var t = Math.min((now - start) / dur, 1);
                    var eased = 1 - Math.pow(1 - t, 5);
                    var val = Math.round(from + (to - from) * eased);
                    target.textContent = val + suffix;
                    if (t < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
                observer.unobserve(el);
            });
        }, { threshold: 0.25 });

        elements.forEach(function (el) { observer.observe(el); });
    }

    /* ── 2. JSON-DRIVEN "JETZT BEWERBEN" TOGGLE ───────────────
       Reads assets/data/startup-event-config.json — buttons are
       hidden by default unless `showApplyButton: true`. */
    function initApplyButtonToggle() {
        var buttons = document.querySelectorAll('[data-apply-button], .students-pretty-btn[href*="Bewerbung"], a.ethereal-button[data-i18n="students-apply-now"], a[data-i18n="apply-now"]');
        if (!buttons.length) return;

        /* Default: hide */
        buttons.forEach(function (btn) {
            btn.dataset.applyDefault = btn.dataset.applyDefault || '1';
            btn.setAttribute('hidden', '');
            btn.setAttribute('aria-hidden', 'true');
            btn.style.display = 'none';
        });

        fetch('assets/data/startup-event-config.json', { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (cfg) {
                if (!cfg || cfg.showApplyButton !== true) return;
                buttons.forEach(function (btn) {
                    btn.removeAttribute('hidden');
                    btn.removeAttribute('aria-hidden');
                    btn.style.display = '';
                });
            })
            .catch(function () { /* keep hidden */ });
    }

    /* ── 3. CURSOR GLOW (theme-aware, all breakpoints ≥ 640px) */
    function initCursorGlow() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if ('ontouchstart' in window) return;
        if (window.innerWidth < 640) return;

        if (document.querySelector('.ibc-cursor-glow')) return;
        var glow = document.createElement('div');
        glow.className = 'ibc-cursor-glow';
        document.body.appendChild(glow);

        var glowX = 0, glowY = 0, rafId = null, visible = false;
        document.addEventListener('mousemove', function (e) {
            glowX = e.clientX;
            glowY = e.clientY;
            if (!visible) { glow.style.opacity = '1'; visible = true; }
            if (!rafId) {
                rafId = requestAnimationFrame(function () {
                    glow.style.transform = 'translate(' + glowX + 'px, ' + glowY + 'px)';
                    rafId = null;
                });
            }
        }, { passive: true });
        document.addEventListener('mouseleave', function () {
            glow.style.opacity = '0'; visible = false;
        });
    }

    /* ── 4. INSTAGRAM EMBED REPROCESS ─────────────────────────
       Trigger Instagram's embed processor whenever the script
       has loaded — fixes empty/blank phone "iframes". */
    function initInstagramReprocess() {
        var blocks = document.querySelectorAll('.instagram-media');
        if (!blocks.length) return;
        var attempts = 0;
        var iv = setInterval(function () {
            attempts += 1;
            if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
                try { window.instgrm.Embeds.process(); } catch (e) { /* noop */ }
            }
            if (attempts >= 8) clearInterval(iv);
        }, 800);
    }

    function start() {
        initFixCounters();
        initApplyButtonToggle();
        initCursorGlow();
        initInstagramReprocess();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
