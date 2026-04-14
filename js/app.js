/**
 * IBC Furtwangen — app.js  v3.0
 * Global Application Module
 *
 * Responsibilities:
 *  - Loading screen (page loader)
 *  - Dark / Light mode toggle (localStorage persisted)
 *  - Scroll progress bar
 *  - Scroll reveal (IntersectionObserver)
 *  - Navbar scroll state
 *
 * This module is designed to run BEFORE other scripts and coexist
 * with the existing main.js, navbar-scroll.js and fade-in-animation.js
 * without conflicts.
 */

(function IBCApp() {
  'use strict';

  /* ─── Constants ─────────────────────────────────────────── */
  const THEME_KEY      = 'ibc-theme';
  const DARK           = 'dark';
  const LIGHT          = 'light';
  const SCROLLED_CLASS = 'is-scrolled';
  const LOADER_HIDDEN  = 'loader-hidden';
  const IN_VIEW        = 'in-view';
  const REVEAL_VISIBLE = 'is-visible';
  const NAV_SCROLL_THRESHOLD = 40; // px before navbar "sticks"

  /* ─── Helpers ────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── 1. THEME MANAGEMENT ────────────────────────────────── */
  const Theme = (() => {
    const htmlEl = document.documentElement;

    /** Resolve initial theme: localStorage → system preference */
    function resolveInitial() {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === DARK || stored === LIGHT) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
    }

    function apply(theme) {
      htmlEl.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
      // Update all dark-mode-toggle icons (covers original + clones in overlays)
      $$('.dark-mode-toggle i').forEach(icon => {
        icon.className = theme === DARK ? 'fas fa-sun' : 'fas fa-moon';
      });
      // Update all dark-mode-toggle buttons (covers original + clones in overlays)
      $$('.dark-mode-toggle').forEach(btn => {
        btn.setAttribute(
          'aria-label',
          theme === DARK ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'
        );
        btn.setAttribute('aria-pressed', theme === DARK ? 'true' : 'false');
      });
      // Update FAB overlay dark mode label if present
      $$('.fab-dark-mode-label').forEach(label => {
        label.textContent = theme === DARK ? 'Light Mode' : 'Dark Mode';
      });
    }

    function toggle() {
      const current = htmlEl.getAttribute('data-theme') || LIGHT;
      apply(current === DARK ? LIGHT : DARK);
    }

    function init() {
      // Apply theme immediately (before paint) to prevent flash
      apply(resolveInitial());
    }

    return { init, toggle, apply };
  })();

  /* Apply theme ASAP – called synchronously */
  Theme.init();


  /* ─── 2. LOADING SCREEN ──────────────────────────────────── */
  //
  // The CSS animation on #page-loader handles the visual fade-out
  // entirely on its own (animation-delay: 2s, duration: 0.6s).
  // This JS block only removes the DOM node after the animation
  // finishes so it no longer occupies z-index space.
  // No class toggling. No transitionend. No window.load dependency.
  //
  const Loader = (() => {
    let done = false;
    function cleanup() {
      if (done) return;
      done = true;
      var el = document.getElementById('page-loader');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    // 2 s delay + 0.6 s animation + 0.4 s buffer = 3 s total
    setTimeout(cleanup, 3000);
    setTimeout(cleanup, 9000); // hard safety net
    return { cleanup };
  })();


  /* ─── 3. NAVBAR SCROLL STATE ─────────────────────────────── */
  const Navbar = (() => {
    let ticking = false;
    let navbar = null;

    function update() {
      if (!navbar) return;
      if (window.scrollY > NAV_SCROLL_THRESHOLD) {
        navbar.classList.add(SCROLLED_CLASS);
      } else {
        navbar.classList.remove(SCROLLED_CLASS);
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    function init() {
      navbar = $('nav.navbar');
      if (!navbar) return;
      update(); // set correct state on init
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return { init };
  })();


  /* ─── 4. SCROLL PROGRESS BAR ─────────────────────────────── */
  const Progress = (() => {
    let bar = null;
    let ticking = false;

    function update() {
      if (!bar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }

    function onScroll() {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }

    function init() {
      // Create bar if not in HTML
      bar = $('#scroll-progress');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'scroll-progress';
        bar.setAttribute('aria-hidden', 'true');
        bar.setAttribute('role', 'presentation');
        document.body.prepend(bar);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    }

    return { init };
  })();


  /* ─── 5. SCROLL REVEAL ───────────────────────────────────── */
  const ScrollReveal = (() => {
    const SELECTORS = [
      '.reveal-fx',
      '.fade-in-up',
      '.info-stagger-in',
    ];

    function getObserverOptions(threshold = 0.12) {
      return {
        rootMargin: '0px 0px -60px 0px',
        threshold,
      };
    }

    function makeObserver() {
      return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // Apply data-animation-delay as CSS variable for stagger
          const delay = el.dataset.animationDelay;
          if (delay) el.style.transitionDelay = delay;
          // Add appropriate visibility class
          if (el.classList.contains('reveal-fx')) {
            el.classList.add(REVEAL_VISIBLE);
          } else {
            el.classList.add(IN_VIEW);
          }
          // Unobserve to avoid re-triggering
          revealObserver.unobserve(el);
        });
      }, getObserverOptions());
    }

    let revealObserver;

    function init() {
      if (prefersReducedMotion()) {
        // Skip animation: make everything visible immediately
        $$(SELECTORS.join(','))
          .forEach(el => {
            el.classList.add(REVEAL_VISIBLE);
            el.classList.add(IN_VIEW);
          });
        return;
      }

      revealObserver = makeObserver();

      $$(SELECTORS.join(','))
        .forEach(el => {
          revealObserver.observe(el);
        });
    }

    return { init };
  })();


  /* ─── 6. COUNTER ANIMATION ───────────────────────────────── */
  /* Handled by main.js / index-page.js — removed from app.js to avoid double-init */


  /* ─── 7. HERO PARALLAX ───────────────────────────────────── */
  const HeroParallax = (() => {
    let hero = null;
    let overlay = null;
    let ticking = false;

    function update() {
      if (!overlay) { ticking = false; return; }
      const scrollY = window.scrollY;
      // Subtle parallax: overlay shifts at 30% scroll rate
      overlay.style.transform = `translateY(${scrollY * 0.15}px)`;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }

    function init() {
      hero = $('#hero-section');
      if (!hero) return;
      overlay = hero.querySelector('.overlay');
      if (!overlay || prefersReducedMotion()) return;
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return { init };
  })();


  /* ─── 8. DARK MODE TOGGLE BINDING ───────────────────────── */
  const DarkModeToggle = (() => {
    function init() {
      // Use document-level delegation so the toggle works in the original navbar
      // AND in any cloned overlays (mobile nav overlay, FAB overlay)
      document.addEventListener('click', (e) => {
        if (e.target.closest('.dark-mode-toggle')) {
          Theme.toggle();
        }
      });
    }
    return { init };
  })();


  /* ─── 9. COMPETENCY ACCORDION ────────────────────────────── */
  /* Handled by index-page.js — removed from app.js to avoid double-init */


  /* ─── 10. FLIP CARDS ────────────────────────────────────── */
  const FlipCards = (() => {
    function init() {
      const cards = $$('.flip-card');
      if (!cards.length) return;

      cards.forEach(card => {
        card.addEventListener('click', () => {
          const pressed = card.getAttribute('aria-pressed') === 'true';
          card.setAttribute('aria-pressed', String(!pressed));
          // Update inner aria-hidden on back face
          const back = card.querySelector('.flip-card-back');
          if (back) back.setAttribute('aria-hidden', pressed ? 'true' : 'false');
        });

        // Keyboard support: Space / Enter already trigger click on buttons
        // But ensure focus ring is visible
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            card.setAttribute('aria-pressed', 'false');
            const back = card.querySelector('.flip-card-back');
            if (back) back.setAttribute('aria-hidden', 'true');
          }
        });
      });
    }
    return { init };
  })();


  /* ─── 10. COPY EMAIL ─────────────────────────────────────── */
  const EmailCopy = (() => {
    function createToast(message) {
      let toast = $('#ibc-copy-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ibc-copy-toast';
        toast.className = 'copy-email-banner';
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2500);
    }

    function init() {
      const emailLinks = $$('.copy-email-link');
      emailLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          const email = link.textContent.trim();
          try {
            await navigator.clipboard.writeText(email);
            createToast('✓ E-Mail-Adresse kopiert');
          } catch {
            // Fallback: show email
            createToast(email);
          }
        });
      });
    }

    return { init };
  })();


  /* ─── 12. FOOTER YEAR ────────────────────────────────────── */
  function updateFooterYear() {
    const yearEl = $('#current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }


  /* ─── BOOTSTRAP ─────────────────────────────────────────── */
  // Popovers are initialized exclusively by main.js to avoid double-init.
  // We DO explicitly initialize Dropdowns here because Bootstrap 5 requires it
  // when the dropdown element is not inside a standard .dropdown parent
  // or when event delegation might be delayed.
  function initBootstrapComponents() {
    if (typeof bootstrap === 'undefined') return;
    // Explicit Dropdown init — Bootstrap 5 requires manual init for dropdowns
    // that are inside a <nav> rather than a standard .dropdown wrapper.
    $$('[data-bs-toggle="dropdown"]').forEach(el => {
      if (!bootstrap.Dropdown.getInstance(el)) {
        new bootstrap.Dropdown(el);
      }
    });
  }


  /* ─── INIT SEQUENCE ──────────────────────────────────────── */
  // 1) Theme is already applied synchronously at top of module
  // 2) Loader dismiss timer already started synchronously above (no init() needed)

  // 3) Everything else on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    Navbar.init();
    Progress.init();
    DarkModeToggle.init();
    FlipCards.init();
    EmailCopy.init();
    updateFooterYear();
    initBootstrapComponents();

    requestAnimationFrame(() => {
      ScrollReveal.init();
      HeroParallax.init();
    });
  });

  // Expose to global for debugging / manual override
  window.IBCApp = { Theme };

})();
