/**
 * IBC Furtwangen — premium-animations.js
 * Fortschrittliche Scroll-Animationen & Microinteractions
 * Kein Framework nötig – reines Vanilla JS
 */

(function() {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. SCROLL REVEAL — IntersectionObserver mit Stagger
     ────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    const elements = document.querySelectorAll(
      '.fade-in-up, .reveal-fx, .info-stagger-in, ' +
      '[data-animation-delay]'
    );

    if (!elements.length) return;

    // Animationsverzögerungen aus data-animation-delay auslesen
    elements.forEach(el => {
      const delay = el.getAttribute('data-animation-delay');
      if (delay) {
        el.style.transitionDelay = delay;
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // Klasse je nach Typ setzen
          if (el.classList.contains('fade-in-up')) {
            el.classList.add('is-visible', 'in-view', 'visible');
          } else if (el.classList.contains('reveal-fx')) {
            el.classList.add('is-visible');
          } else if (el.classList.contains('info-stagger-in')) {
            el.classList.add('is-visible', 'in-view');
          } else {
            el.classList.add('is-visible', 'in-view', 'visible');
          }
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }


  /* ──────────────────────────────────────────────────────────
     2. GRID-STAGGER für Cards
     ────────────────────────────────────────────────────────── */
  function initCardStagger() {
    const grids = document.querySelectorAll(
      '.angebot-grid, .beratungsfeld-grid, ' +
      '.row.g-4, .row.g-3'
    );

    grids.forEach(grid => {
      const cards = grid.querySelectorAll(
        '.angebot-card-v2, .beratungsfeld-card-v2, ' +
        '.highlight-stat-card, .fade-in-up, .col-lg-3, .col-lg-4'
      );
      cards.forEach((card, i) => {
        if (!card.style.transitionDelay) {
          card.style.transitionDelay = (i * 80) + 'ms';
        }
      });
    });
  }


  /* ──────────────────────────────────────────────────────────
     3. ZAHL-COUNTER ANIMATION
     ────────────────────────────────────────────────────────── */
  function initCounters() {
    const counters = document.querySelectorAll('.stat-number, .counter-animated, .highlight-stat-card__num');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const text = el.textContent.trim();
        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
        const suffix = text.replace(/[0-9.]/g, '').trim();

        if (isNaN(num) || num === 0) return;

        const duration = 1600;
        const start = performance.now();
        const fromAttr = el.getAttribute('data-count-from');
        const startVal = fromAttr !== null ? parseFloat(fromAttr) : 0;

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Easing: ease-out-quint
          const eased = 1 - Math.pow(1 - progress, 5);
          const current = Math.round(startVal + (num - startVal) * eased);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }


  /* ──────────────────────────────────────────────────────────
     4. PARALLAX für Hero Orbs
     ────────────────────────────────────────────────────────── */
  function initParallax() {
    const orbs = document.querySelectorAll(
      '.page-hero__mesh-orb, .competencies-orb, .info-ambient-blob, ' +
      '.service-section__ambient-orb'
    );
    if (!orbs.length) return;

    // Nur auf Desktop und wenn keine reduzierte Bewegung bevorzugt
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          orbs.forEach((orb, i) => {
            const speed = (i % 2 === 0) ? 0.15 : -0.1;
            const rect = orb.closest('section')?.getBoundingClientRect();
            if (!rect) return;
            if (rect.top > window.innerHeight || rect.bottom < 0) return;
            const offset = scrollY * speed;
            orb.style.transform = `translate3d(0, ${offset}px, 0)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ──────────────────────────────────────────────────────────
     5. MAGNETISCHE BUTTONS
     ────────────────────────────────────────────────────────── */
  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    const buttons = document.querySelectorAll('.ethereal-button');
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.22;
        const dy = (e.clientY - cy) * 0.22;
        btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-3px) scale(1.02)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }


  /* ──────────────────────────────────────────────────────────
     6. CARD TILT EFFEKT (sanft)
     ────────────────────────────────────────────────────────── */
  function initCardTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;
    if (window.innerWidth < 992) return;

    const cards = document.querySelectorAll(
      '.angebot-card-v2, .beratungsfeld-card-v2, .highlight-stat-card'
    );

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotY = x * 6;
        const rotX = -y * 4;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-10px) scale(1.012)`;
        card.style.transition = 'transform 0.08s linear, box-shadow 0.08s';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s, border-color 0.25s';
      });
    });
  }


  /* ──────────────────────────────────────────────────────────
     7. SMOOTH PROGRESS BAR
     ────────────────────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          bar.style.width = progress + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ──────────────────────────────────────────────────────────
     8. HOVER-HIGHLIGHT für Nav Links (aktive Seite)
     ────────────────────────────────────────────────────────── */
  function initActiveNavHighlight() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes(currentPath) && currentPath !== 'index.html') {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     9. SECTION ENTRANCE TIMING
     ────────────────────────────────────────────────────────── */
  function initSectionEntrance() {
    const sections = document.querySelectorAll('section:not(.page-hero-section)');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-entered');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    sections.forEach(s => observer.observe(s));
  }


  /* ──────────────────────────────────────────────────────────
     10. GLOWING BORDER für Focus-State
     ────────────────────────────────────────────────────────── */
  function initFormEnhancements() {
    const inputs = document.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.closest('.mb-3, .form-group')?.classList.add('input-focused');
      });
      input.addEventListener('blur', () => {
        input.closest('.mb-3, .form-group')?.classList.remove('input-focused');
      });
    });
  }


  /* ──────────────────────────────────────────────────────────
     11. NAVBAR SCROLL BEHAVIOUR (falls nicht schon vorhanden)
     ────────────────────────────────────────────────────────── */
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    const THRESHOLD = 10;

    function update() {
      const currentScroll = window.scrollY;
      if (currentScroll > 60) {
        navbar.classList.add('is-scrolled', 'scrolled');
      } else {
        navbar.classList.remove('is-scrolled', 'scrolled');
      }
      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }


  /* ──────────────────────────────────────────────────────────
     12. SMOOTH LINK HOVER UNDERLINE (für interne Links)
     ────────────────────────────────────────────────────────── */
  function initLinkEffects() {
    const bodyLinks = document.querySelectorAll(
      'main a:not(.btn):not(.nav-link):not(.ethereal-button):not(.hero-btn-ghost):not([class*="card"]):not(.fat-footer__nav-list a)'
    );
    bodyLinks.forEach(link => {
      if (!link.closest('.fat-footer') && !link.closest('.navbar')) {
        link.style.textUnderlineOffset = '3px';
        link.style.textDecorationThickness = '1.5px';
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     13. AMBIENT GLOW CURSOR TRAIL (sehr subtil, Desktop only)
     ────────────────────────────────────────────────────────── */
  function initCursorGlow() {
    if ('ontouchstart' in window) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 1024) return;

    const hero = document.querySelector('.page-hero-section, #hero-section');
    if (!hero) return;

    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(109,151,68,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      transition: opacity 0.4s;
      opacity: 0;
    `;
    document.body.appendChild(glow);

    let visible = false;
    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      if (!visible) {
        glow.style.opacity = '1';
        visible = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
      visible = false;
    });
  }


  /* ──────────────────────────────────────────────────────────
     INITIALISIERUNG
     ────────────────────────────────────────────────────────── */
  function init() {
    initScrollReveal();
    initCardStagger();
    initCounters();
    initParallax();
    initMagneticButtons();
    initCardTilt();
    initScrollProgress();
    initActiveNavHighlight();
    initSectionEntrance();
    initFormEnhancements();
    initNavbarScroll();
    initLinkEffects();
    initCursorGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Bei Resize neu initialisieren (Debounce)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initCardTilt();
    }, 300);
  }, { passive: true });

})();
