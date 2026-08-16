/**
 * design-effects.js
 *
 * Implements four innovative design features:
 *   1. Magnetic button effect  – buttons follow the cursor slightly when nearby
 *   2. Icon pulse animations   – icons pop-in when they enter the viewport,
 *                                then pulse gently
 *   3. Image parallax          – images shift slightly as the page is scrolled
 *
 * (Wave / slope section dividers are pure HTML + CSS; no JS needed.)
 *
 * All effects respect `prefers-reduced-motion`.
 */
(function () {
    'use strict';

    const prefersReducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Utility ──────────────────────────────────────────────────────────── */

    /** Linear interpolation */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /* ═══════════════════════════════════════════════════════════════════════
     * 1. MAGNETIC BUTTON EFFECT
     * ═══════════════════════════════════════════════════════════════════════
     *
     * When the cursor enters the activation radius of a `.magnetic-element`,
     * the element is nudged towards the cursor.  The strength is intentionally
     * small (max 12 px) so it reads as a subtle tactile affordance, not a bug.
     */
    function initMagneticEffect() {
        if (prefersReducedMotion) return;

        const ACTIVATION_RADIUS = 80;  // px – cursor must be within this box
        const MAX_SHIFT = 20;          // px – maximum translation in any direction
        const LERP_FACTOR = 0.25;      // easing speed for following
        const RESET_LERP = 0.12;       // easing speed for returning to origin

        const magnets = Array.from(document.querySelectorAll('.magnetic-element'));
        if (magnets.length === 0) return;

        // State per element
        const state = new WeakMap();
        magnets.forEach(el => {
            state.set(el, {
                active: false,
                currentX: 0,
                currentY: 0,
                targetX: 0,
                targetY: 0,
                rafId: null,
            });
        });

        function animateElement(el) {
            const s = state.get(el);
            if (!s) return;

            s.currentX = lerp(s.currentX, s.targetX, s.active ? LERP_FACTOR : RESET_LERP);
            s.currentY = lerp(s.currentY, s.targetY, s.active ? LERP_FACTOR : RESET_LERP);

            el.style.transform = `translate(${s.currentX.toFixed(2)}px, ${s.currentY.toFixed(2)}px)`;

            const stillMoving =
                Math.abs(s.currentX - s.targetX) > 0.05 ||
                Math.abs(s.currentY - s.targetY) > 0.05;

            if (stillMoving || s.active) {
                s.rafId = requestAnimationFrame(() => animateElement(el));
            } else {
                // Snap to exact rest position
                s.currentX = 0;
                s.currentY = 0;
                el.style.transform = '';
                el.classList.remove('is-magnetic-active');
                s.rafId = null;
            }
        }

        function startLoop(el) {
            const s = state.get(el);
            if (!s.rafId) {
                s.rafId = requestAnimationFrame(() => animateElement(el));
            }
        }

        document.addEventListener('mousemove', (e) => {
            magnets.forEach(el => {
                const s = state.get(el);
                if (!s) return;

                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < ACTIVATION_RADIUS + rect.width / 2) {
                    const intensity = Math.max(0, 1 - dist / (ACTIVATION_RADIUS + rect.width / 2));
                    s.targetX = (dx / (rect.width / 2 + ACTIVATION_RADIUS)) * MAX_SHIFT * intensity;
                    s.targetY = (dy / (rect.height / 2 + ACTIVATION_RADIUS)) * MAX_SHIFT * intensity;
                    s.active = true;
                    el.classList.add('is-magnetic-active');
                } else if (s.active) {
                    s.targetX = 0;
                    s.targetY = 0;
                    s.active = false;
                }

                startLoop(el);
            });
        }, { passive: true });

        // Ensure clean reset when the cursor leaves the window
        document.addEventListener('mouseleave', () => {
            magnets.forEach(el => {
                const s = state.get(el);
                if (!s) return;
                s.active = false;
                s.targetX = 0;
                s.targetY = 0;
                startLoop(el);
            });
        });
    }

    /* ═══════════════════════════════════════════════════════════════════════
     * 2. ICON PULSE ANIMATIONS
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Watches `.physics-icon-box`, `.info-icon-box`, and icon wrapper elements.
     * When they enter the viewport, the "entry pop" animation fires once.
     * After it completes the element gets the subtle continuous idle pulse.
     *
     * For inline SVG icons (converted from img.svg-icon by icon-loader.js),
     * a CSS-driven fade-in + soft pulse is applied via the `svg-icon-animated`
     * class added here after a MutationObserver detects the conversion.
     */
    function initIconAnimations() {
        const ICON_BOX_SELECTORS = [
            '.physics-icon-box',
            '.info-icon-box',
        ].join(', ');

        if (prefersReducedMotion) return;

        // --- Box icon entry + idle pulse ---
        const iconBoxes = Array.from(document.querySelectorAll(ICON_BOX_SELECTORS));
        if (iconBoxes.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    observer.unobserve(el);

                    // Stagger based on position within its parent row
                    const parent = el.closest('[class*="col-"]');
                    const siblings = parent
                        ? Array.from(parent.parentElement.querySelectorAll(ICON_BOX_SELECTORS))
                        : [el];
                    const idx = Math.max(0, siblings.indexOf(el));
                    const delay = idx * 100; // ms per icon

                    setTimeout(() => {
                        el.classList.add('icon-animate-entry');
                        el.addEventListener('animationend', () => {
                            el.classList.remove('icon-animate-entry');
                            el.classList.add('icon-animate-idle');
                        }, { once: true });
                    }, delay);
                });
            }, {
                threshold: 0.25,
                rootMargin: '0px 0px -40px 0px',
            });

            iconBoxes.forEach(el => observer.observe(el));
        }

        // --- Inline SVG icons (.svg-icon) – animate once icon-loader finishes ---
        const SVG_STAGGER_DELAY_MS = 80; // ms between each icon's fade-in

        function animateSvgIcons() {
            document.querySelectorAll('svg.svg-icon:not(.svg-icon-animated)').forEach((svg, i) => {
                svg.classList.add('svg-icon-animated');
                svg.style.animationDelay = `${i * SVG_STAGGER_DELAY_MS}ms`;
            });
        }

        // Run once immediately (for already-loaded SVGs)
        animateSvgIcons();

        // Also watch for new SVGs inserted by icon-loader.js
        const svgObserver = new MutationObserver(() => animateSvgIcons());
        svgObserver.observe(document.body, { childList: true, subtree: true });

        // Stop watching after 3 seconds (icon-loader is fast)
        setTimeout(() => svgObserver.disconnect(), 3000);
    }

    /* ═══════════════════════════════════════════════════════════════════════
     * 3. IMAGE PARALLAX
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Adds a subtle (up to ±20 px) vertical parallax to card images and the
     * hero video.  The shift is proportional to how far the image's centre is
     * from the viewport centre.
     */
    function initParallax() {
        if (prefersReducedMotion) return;

        const PARALLAX_STRENGTH = 0.07; // fraction of offset from viewport centre

        // Select image containers inside competency / value cards
        const imageWrappers = Array.from(
            document.querySelectorAll('.competency-card__image-wrapper, .value-card__image-wrapper')
        );

        // Mark wrappers and images for CSS
        imageWrappers.forEach(wrapper => {
            wrapper.classList.add('parallax-container');
            const img = wrapper.querySelector('img');
            if (img) img.classList.add('parallax-img');
        });

        // Collect all parallax images (including any added above)
        function getParallaxImgs() {
            return Array.from(document.querySelectorAll('.parallax-img'));
        }

        let rafPending = false;

        function updateParallax() {
            const imgs = getParallaxImgs();
            const vpMid = window.innerHeight / 2;

            imgs.forEach(img => {
                const rect = img.closest('.parallax-container')
                    ? img.closest('.parallax-container').getBoundingClientRect()
                    : img.getBoundingClientRect();

                // Only update if anywhere near the viewport
                if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;

                const elMid = rect.top + rect.height / 2;
                const offset = ((elMid - vpMid) * PARALLAX_STRENGTH).toFixed(2);

                img.style.setProperty('--parallax-offset', `${offset}px`);
            });

            rafPending = false;
        }

        window.addEventListener('scroll', () => {
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(updateParallax);
            }
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(updateParallax);
            }
        }, { passive: true });

        // Initial paint
        updateParallax();
    }

    /* ── Bootstrap ────────────────────────────────────────────────────────── */

    function init() {
        initMagneticEffect();
        initIconAnimations();
        initParallax();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
