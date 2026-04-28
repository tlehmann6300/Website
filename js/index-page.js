/**
 * IBC Furtwangen — index-page.js  v4.0
 * Startseiten-Animationen & Interaktionslogik
 *
 * Verantwortlichkeiten (nur index.html):
 *  1. Hero-Stagger-Animation       – gestaffelte Einblendung jedes Hero-Elements
 *  2. Hero-Partikel-Canvas         – subtile schwebende Partikel im Hero-Bereich
 *  3. Kompetenzen-Accordion        – aufklappen / zuklappen mit Ripple-Effekt
 *  4. Stats-Counter                – hochzählen mit Easing + Glow-Abschluss
 *  5. Info-Cards-Animation         – staggertes Einblenden + Cursor-Glow
 *  6. Werte-Karten 3D-Tilt         – perspektivisches Kippen per Maus
 *  7. Mobile Kompetenz-Karussell   – Swipe-Karussell auf kleinen Bildschirmen
 *  8. FAB-Navigation               – Floating-Action-Button-Menü für Mobile
 *  9. Footer-Utilities             – aktuelles Jahr, E-Mail kopieren
 */
(function () {
  'use strict';

  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Hilfsfunktionen ────────────────────────────────────── */
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ══════════════════════════════════════════════════════════════
   * 1. HERO-STAGGER-ANIMATION
   * Jedes Hero-Element blendet mit eigenem Timing ein.
   * Wir übernehmen das Hero-Container-Reveal aus der CSS-Animation
   * und ergänzen eine feingranulare JS-gesteuerte Staffelung.
   * ══════════════════════════════════════════════════════════════ */
  function initHeroStagger() {
    const col = document.querySelector('#hero-section .hero-content-col');
    if (!col) return;

    /* Elemente in Anzeigereihenfolge mit ihren Einblend-Delays */
    const items = [
      { sel: '.hero-eyebrow-badge',  delay:  20, fromY: 20 },
      { sel: 'h1.display-2',         delay:  70, fromY: 28 },
      { sel: '.hero-subtitle-text',  delay: 120, fromY: 22 },
      { sel: '.hero-actions',        delay: 170, fromY: 18 },
      { sel: '.hero-trust-strip',    delay: 220, fromY: 16 },
    ];

    if (PRM) {
      /* Reduced Motion: sofort sichtbar machen */
      items.forEach(({ sel }) => {
        const el = col.querySelector(sel);
        if (el) { el.style.opacity = '1'; el.style.transform = ''; }
      });
      /* Auch bei Reduced Motion die Zahlen direkt auf den Zielwert setzen */
      const strip = col.querySelector('.hero-trust-strip');
      if (strip) {
        strip.querySelectorAll('.hero-trust-num[data-count]').forEach(el => {
          const target = parseInt(el.getAttribute('data-count'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          if (!isNaN(target)) el.textContent = target + suffix;
        });
      }
      return;
    }

    /* Basis-Zustand: Elemente werden von JS kontrolliert */
    items.forEach(({ sel, fromY }) => {
      const el = col.querySelector(sel);
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = `translateY(${fromY}px)`;
      el.style.filter = 'blur(8px)';
      el.style.transition = 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    /* Gestaffeltes Einblenden synchronisiert mit Loader-Exit
     * Loader-CSS-Animation reduziert; Animationen starten nun schneller. */
    const BASE_OFFSET = 250; /* ms – schnellerer Start nach Page Load */
    items.forEach(({ sel, delay }) => {
      const el = col.querySelector(sel);
      if (!el) return;
      /* Hero-Trust-Strip: Werte auf 0 zurücksetzen, damit Zähler von 0 startet */
      if (sel === '.hero-trust-strip') {
        el.querySelectorAll('.hero-trust-num[data-count]').forEach(numEl => {
          const suffix = numEl.getAttribute('data-suffix') || '';
          numEl.textContent = '0' + suffix;
        });
      }
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.style.filter = 'blur(0)';
        /* Hero-Trust-Strip: Zähler sofort nach Einblenden starten */
        if (sel === '.hero-trust-strip') {
          startHeroTrustCounters(el);
        }
      }, BASE_OFFSET + delay);
    });
  }

  /* ── Hero-Trust-Strip Zähler-Animation ──────────────────────── */
  function startHeroTrustCounters(strip) {
    if (!strip) return;
    strip.querySelectorAll('.hero-trust-num[data-count]').forEach(el => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;
      const duration = 350;
      const start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        /* Ease-out cubic */
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(ease * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ══════════════════════════════════════════════════════════════
   * 2. HERO-PARTIKEL-CANVAS
   * Leichtgewichtiger Canvas mit schwebenden Partikeln im
   * Hero-Bereich. Läuft nur wenn der Hero sichtbar ist.
   * ══════════════════════════════════════════════════════════════ */
  function initHeroParticles() {
    if (PRM) return;

    const section = document.getElementById('hero-section');
    if (!section) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0.55;';

    /* Vor dem Ambient-Layer einfügen */
    const ambient = section.querySelector('.hero-ambient-layer');
    if (ambient) {
      section.insertBefore(canvas, ambient);
    } else {
      section.insertBefore(canvas, section.firstChild);
    }

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, particles = [], rafId = null, running = false;

    function resize() {
      W = canvas.width = section.offsetWidth;
      H = canvas.height = section.offsetHeight;
    }

    /* Partikel-Klasse */
    function Particle() {
      this.reset = function () {
        this.x = Math.random() * W;
        this.y = H + Math.random() * 40;
        this.r = Math.random() * 1.8 + 0.4;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(Math.random() * 0.6 + 0.2);
        this.baseOpacity = Math.random() * 0.45 + 0.08;
        this.life = 0;
        this.maxLife = Math.random() * 280 + 160;
        /* Farbe: grün oder blau für Markenidentität */
        this.hue = Math.random() > 0.5 ? 110 : 205;
      };
      this.reset();

      this.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        if (this.y < -10 || this.life > this.maxLife) this.reset();
      };

      this.draw = function () {
        const t = this.life / this.maxLife;
        const alpha = this.baseOpacity *
          (t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, ${alpha})`;
        ctx.fill();
      };
    }

    function initParticles() {
      resize();
      const count = Math.min(70, Math.floor((W * H) / 12000));
      particles = [];
      for (let i = 0; i < count; i++) {
        const p = new Particle();
        /* Zufällige Startpositionen über den gesamten Hero verteilen */
        p.y = Math.random() * H;
        p.life = Math.random() * p.maxLife;
        particles.push(p);
      }
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      initParticles();
      loop();
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.addEventListener('resize', () => {
      resize();
    }, { passive: true });

    /* Partikel nur laufen lassen wenn Hero sichtbar ist */
    const visObs = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0.05 });
    visObs.observe(section);
  }

  /* ══════════════════════════════════════════════════════════════
   * 3. KOMPETENZEN-ACCORDION
   * Aufklappen / Zuklappen mit Ripple + Smooth Transition
   * ══════════════════════════════════════════════════════════════ */
  function initCompetenciesAccordion() {
    const accordionGroup = document.getElementById('competenciesAccordionGroup');
    if (!accordionGroup) return;

    const triggers = accordionGroup.querySelectorAll('.competency-card__trigger');
    const cards    = accordionGroup.querySelectorAll('.competency-card');

    const closeAll = () => {
      cards.forEach(c => {
        if (c.classList.contains('is-active')) {
          c.classList.remove('is-active');
          const btn = c.querySelector('.competency-card__trigger');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    };

    const openCard = (card, trigger) => {
      card.classList.add('is-active');
      trigger.setAttribute('aria-expanded', 'true');

      /* Ripple-Effekt auf dem Bild beim Öffnen */
      if (!PRM) {
        const imgWrap = card.querySelector('.competency-card__image-wrapper');
        if (imgWrap) {
          imgWrap.classList.add('accordion-ripple');
          imgWrap.addEventListener('animationend', () => {
            imgWrap.classList.remove('accordion-ripple');
          }, { once: true });
        }
      }
    };

    const toggleCard = (card, trigger) => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      closeAll();
      if (!isExpanded) openCard(card, trigger);
    };

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => {
        toggleCard(trigger.closest('.competency-card'), trigger);
      });

      trigger.addEventListener('keydown', (e) => {
        const len = triggers.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          triggers[(index + 1) % len].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          triggers[(index - 1 + len) % len].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          triggers[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          triggers[len - 1].focus();
        }
      });
    });

    /* Klick auf das Bild öffnet / schließt ebenfalls */
    cards.forEach(card => {
      const imgWrap = card.querySelector('.competency-card__image-wrapper');
      const trigger = card.querySelector('.competency-card__trigger');
      if (imgWrap && trigger) {
        imgWrap.addEventListener('click', () => toggleCard(card, trigger));
      }
    });

    /* Klick außerhalb schließt alles */
    document.addEventListener('click', e => {
      if (!e.target.closest('.competency-card')) closeAll();
    });
  }

  /* ══════════════════════════════════════════════════════════════
   * 4. INFO-CARDS ANIMATION (Stagger + Cursor-Glow)
   * ══════════════════════════════════════════════════════════════ */
  function initInfoCardsAnimation() {
    if (!PRM) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      document.querySelectorAll('.info-stagger-in').forEach(el => obs.observe(el));
    } else {
      document.querySelectorAll('.info-stagger-in').forEach(el => el.classList.add('is-visible'));
    }

    /* Cursor-Glow auf Desktop */
    if (PRM || window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.info-glass-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
   * 5. STATS-COUNTER MIT GLOW-ABSCHLUSS
   * ══════════════════════════════════════════════════════════════ */
  function initStatsSection() {
    const DURATION_MS   = 500;
    const STAGGER_MS    = 40;

    /* Bootstrap Popovers initialisieren */
    const isMobile = window.innerWidth < 768;
    const popoverEls = document.querySelectorAll('#stats-section [data-bs-toggle="popover"]');
    const popoverInstances = [];

    popoverEls.forEach(el => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
        const pop = new bootstrap.Popover(el, {
          trigger: isMobile ? 'click' : 'hover focus',
          html: true,
          animation: !PRM,
          offset: [0, 12],
        });
        popoverInstances.push({ element: el, popover: pop });
        el.addEventListener('shown.bs.popover',  () => el.setAttribute('aria-expanded', 'true'));
        el.addEventListener('hidden.bs.popover', () => el.setAttribute('aria-expanded', 'false'));
      }
    });

    if (isMobile && popoverInstances.length > 0) {
      window.addEventListener('scroll', () => {
        popoverInstances.forEach(({ popover }) => popover.hide());
      }, { passive: true });
      document.addEventListener('click', e => {
        popoverInstances.forEach(({ element, popover }) => {
          const popoverEl = document.querySelector('.popover');
          if (!element.contains(e.target) && !(popoverEl && popoverEl.contains(e.target))) {
            popover.hide();
          }
        });
      });
    }

    /* Easing – sanft abbremsendes Hochzählen */
    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

    const animateCounter = el => {
      const target = +el.getAttribute('data-target');
      const suffix = el.getAttribute('data-suffix') || '';
      const span   = el.querySelector('.counter-animated');
      if (!span) return;

      if (PRM) {
        span.textContent = target + suffix;
        return;
      }

      let startTime = null;
      const step = ts => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / DURATION_MS, 1);
        span.textContent = Math.round(easeOutQuart(progress) * target) + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          span.textContent = target + suffix;
          /* Kurzes Glow-Aufblitzen wenn Zähler fertig */
          el.classList.add('counter-done');
          setTimeout(() => el.classList.remove('counter-done'), 900);
        }
      };
      requestAnimationFrame(step);
    };

    const statsObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const cols = entry.target.querySelectorAll('.row > [class*="col-"]');
        cols.forEach((col, i) => {
          setTimeout(() => {
            col.querySelector('.fade-in-up')?.classList.add('visible');
            const counter = col.querySelector('.stat-number');
            if (counter && !counter.classList.contains('animated')) {
              counter.classList.add('animated');
              animateCounter(counter);
            }
          }, i * STAGGER_MS);
        });
        statsObs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    const statsSection = document.getElementById('stats-section');
    if (statsSection) statsObs.observe(statsSection);
  }

  /* ══════════════════════════════════════════════════════════════
   * 6. WERTE-KARTEN 3D-TILT
   * Perspektivisches Kippen beim Überfahren mit der Maus.
   * ══════════════════════════════════════════════════════════════ */
  function initValueCardTilt() {
    if (PRM || window.matchMedia('(hover: none)').matches) return;

    const TILT_MAX   = 10; /* Grad */
    const LERP_SPEED = 0.12;

    document.querySelectorAll('.physics-card-wrap').forEach(wrap => {
      const card = wrap.querySelector('.physics-card');
      if (!card) return;

      let tX = 0, tY = 0, cX = 0, cY = 0, rafId = null, hovered = false;

      function tick() {
        cX += (tX - cX) * LERP_SPEED;
        cY += (tY - cY) * LERP_SPEED;
        card.style.transform =
          `perspective(700px) rotateX(${cX.toFixed(2)}deg) rotateY(${cY.toFixed(2)}deg) translateZ(6px)`;

        if (hovered || Math.abs(cX) > 0.05 || Math.abs(cY) > 0.05) {
          rafId = requestAnimationFrame(tick);
        } else {
          card.style.transform = '';
          rafId = null;
        }
      }

      wrap.addEventListener('mouseenter', () => {
        hovered = true;
        if (!rafId) rafId = requestAnimationFrame(tick);
      });

      wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width  - 0.5; /* -0.5 … +0.5 */
        const ny = (e.clientY - r.top)  / r.height - 0.5;
        tY =  nx * TILT_MAX;
        tX = -ny * TILT_MAX;

        /* Spotlight-Effekt */
        card.style.setProperty('--spot-x', ((e.clientX - r.left) / r.width  * 100) + '%');
        card.style.setProperty('--spot-y', ((e.clientY - r.top)  / r.height * 100) + '%');
      });

      wrap.addEventListener('mouseleave', () => {
        hovered = false;
        tX = 0; tY = 0;
        if (!rafId) rafId = requestAnimationFrame(tick);
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
   * 7. FOOTER-UTILITIES
   * ══════════════════════════════════════════════════════════════ */
  function initFooterUtilities() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    const copyBanner = document.getElementById('copy-banner');
    document.querySelectorAll('.copy-email-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const email = link.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email)
            .then(() => {
              if (copyBanner) {
                copyBanner.classList.add('show');
                setTimeout(() => copyBanner.classList.remove('show'), 4000);
              }
            })
            .catch(() => alert(`Bitte manuell kopieren: ${email}`));
        } else {
          alert(`Bitte manuell kopieren: ${email}`);
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
   * 8. MOBILE KOMPETENZ-KARUSSELL
   * Horizontales Wisch-Karussell mit Scroll-Snap + Paginierungspunkte
   * ══════════════════════════════════════════════════════════════ */
  function initCompetencyCarousel() {
    const MOBILE_BP = 1024;
    const grid       = document.getElementById('competenciesAccordionGroup');
    const dotsWrap   = document.getElementById('competencyCarouselDots');
    const hintEl     = document.getElementById('competencyCarouselHint');
    if (!grid) return;

    let isCarousel = false;
    let counterEl  = null;
    let scrollTimer = null;

    /* Pointer-drag state */
    let isDragging   = false;
    let dragStartX   = 0;
    let dragScrollX  = 0;

    const getCards = () => grid.querySelectorAll('.competency-card');

    /* ── Left-padding helper (matches CSS .swipe-carousel padding-left) ─ */
    function getGridPaddingLeft() {
      return parseFloat(getComputedStyle(grid).paddingLeft) || 0;
    }

    /* ── Dots aufbauen ─────────────────────────────────────── */
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      getCards().forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className   = 'competency-carousel-dot' + (i === 0 ? ' is-active' : '');
        btn.type        = 'button';
        btn.setAttribute('aria-label', `Karte ${i + 1}`);
        btn.addEventListener('click', () => scrollToCard(i));
        dotsWrap.appendChild(btn);
      });
    }

    /* ── Zähler aufbauen ───────────────────────────────────── */
    function buildCounter() {
      if (!dotsWrap) return;
      if (!counterEl) {
        counterEl = document.createElement('p');
        counterEl.className = 'competency-carousel-counter';
        dotsWrap.parentNode.insertBefore(counterEl, dotsWrap.nextSibling);
      }
      updateCounter(0);
    }

    function updateCounter(idx) {
      if (!counterEl) return;
      const total = getCards().length;
      counterEl.innerHTML =
        `<span class="current">${idx + 1}</span>&thinsp;/&thinsp;${total}`;
    }

    function scrollToCard(idx) {
      const cards = getCards();
      if (!cards[idx]) return;
      const padLeft = getGridPaddingLeft();
      grid.scrollTo({ left: cards[idx].offsetLeft - padLeft, behavior: 'smooth' });
    }

    function getActiveIndex() {
      const cards = getCards();
      const gridRect = grid.getBoundingClientRect();
      let closest = 0, minDist = Infinity;
      cards.forEach((card, i) => {
        const cardRect = card.getBoundingClientRect();
        const d = Math.abs(cardRect.left - gridRect.left);
        if (d < minDist) { minDist = d; closest = i; }
      });
      return closest;
    }

    function closeOffscreenAccordions(activeIdx) {
      getCards().forEach((card, i) => {
        if (i !== activeIdx && card.classList.contains('is-active')) {
          card.querySelector('.competency-card__trigger')?.click();
        }
      });
    }

    function setActiveCard(idx) {
      getCards().forEach((card, i) =>
        card.classList.toggle('is-carousel-active', i === idx));
    }

    function updateDots() {
      if (!dotsWrap) return;
      const idx = getActiveIndex();
      dotsWrap.querySelectorAll('.competency-carousel-dot')
        .forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
      setActiveCard(idx);
      updateCounter(idx);

      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => closeOffscreenAccordions(idx), 300);
    }

    /* ── Pointer-drag (Maus-Drag für Desktop) ──────────────── */
    function onPointerDown(e) {
      if (e.pointerType === 'touch') return; /* touch handled natively */
      isDragging  = true;
      dragStartX  = e.clientX;
      dragScrollX = grid.scrollLeft;
      grid.classList.add('is-dragging');
      grid.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const dx = dragStartX - e.clientX;
      grid.scrollLeft = dragScrollX + dx;
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      grid.classList.remove('is-dragging');
      /* Snap to closest card */
      const idx = getActiveIndex();
      scrollToCard(idx);
    }

    /* ── Karussell aktivieren ──────────────────────────────── */
    function enableCarousel() {
      if (isCarousel) return;
      isCarousel = true;
      grid.classList.add('swipe-carousel');
      if (dotsWrap) dotsWrap.style.display = '';
      if (hintEl)   hintEl.style.display   = '';
      buildDots();
      buildCounter();
      setActiveCard(0);
      grid.addEventListener('scroll', updateDots, { passive: true });
      grid.addEventListener('pointerdown', onPointerDown);
      grid.addEventListener('pointermove', onPointerMove);
      grid.addEventListener('pointerup', onPointerUp);
      grid.addEventListener('pointercancel', onPointerUp);
    }

    function disableCarousel() {
      if (!isCarousel) return;
      isCarousel = false;
      grid.classList.remove('swipe-carousel');
      if (dotsWrap) { dotsWrap.style.display = 'none'; dotsWrap.innerHTML = ''; }
      if (hintEl)   hintEl.style.display = 'none';
      if (counterEl) { counterEl.remove(); counterEl = null; }
      getCards().forEach(c => c.classList.remove('is-carousel-active'));
      grid.removeEventListener('scroll', updateDots);
      grid.removeEventListener('pointerdown', onPointerDown);
      grid.removeEventListener('pointermove', onPointerMove);
      grid.removeEventListener('pointerup', onPointerUp);
      grid.removeEventListener('pointercancel', onPointerUp);
      if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null; }
    }

    function checkBP() {
      window.innerWidth < MOBILE_BP ? enableCarousel() : disableCarousel();
    }

    /* Initial ausblenden, JS aktiviert bei Bedarf */
    if (dotsWrap) dotsWrap.style.display = 'none';
    if (hintEl)   hintEl.style.display   = 'none';

    checkBP();
    window.addEventListener('resize', checkBP, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════════
   * 9. FAB-NAVIGATION
   * Floating-Action-Button ersetzt Hamburger-Menü beim Scrollen.
   * ══════════════════════════════════════════════════════════════ */
  function initNavFab() {
    const fab     = document.getElementById('nav-fab');
    const overlay = document.getElementById('fab-overlay-menu');
    if (!fab || !overlay) return;

    const MOBILE_BP       = 0; /* FAB deaktiviert – Hamburger bleibt in der Navbar */
    const SCROLL_THRESHOLD = 80;
    let rafPending = false;
    let isOpen     = false;

    const getFocusable = () =>
      overlay.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');

    /* ── Sichtbarkeit ──────────────────────────────────────── */
    function showFab() {
      fab.style.display = 'flex';
      requestAnimationFrame(() => fab.classList.add('is-visible'));
      document.body.classList.add('fab-active');
    }

    function hideFab() {
      fab.classList.remove('is-visible');
      document.body.classList.remove('fab-active');
      setTimeout(() => {
        if (!fab.classList.contains('is-visible')) fab.style.display = 'none';
      }, 320);
    }

    /* ── Menü öffnen / schließen ───────────────────────────── */
    function openMenu() {
      isOpen = true;
      fab.classList.add('menu-open');
      fab.setAttribute('aria-expanded', 'true');
      fab.setAttribute('aria-label', 'Menü schließen');
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      /* Reflow erzwingen bevor Transition startet */
      // eslint-disable-next-line no-unused-expressions
      overlay.offsetHeight;
      overlay.classList.add('is-open');
      document.body.style.overflow    = 'hidden';
      document.body.style.touchAction = 'none';
      const items = getFocusable();
      if (items.length) items[0].focus();
    }

    function closeMenu() {
      isOpen = false;
      fab.classList.remove('menu-open');
      fab.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-label', 'Menü öffnen');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow    = '';
      document.body.style.touchAction = '';
      setTimeout(() => {
        if (!overlay.classList.contains('is-open')) overlay.style.display = 'none';
      }, 360);
    }

    /* ── FAB anzeigen nach Scroll ──────────────────────────── */
    function updateFab() {
      const isMobile = window.innerWidth < MOBILE_BP;
      if (!isMobile) {
        hideFab();
        if (isOpen) closeMenu();
        rafPending = false;
        return;
      }
      window.pageYOffset > SCROLL_THRESHOLD ? showFab() : hideFab();
      if (window.pageYOffset <= SCROLL_THRESHOLD && isOpen) closeMenu();
      rafPending = false;
    }

    /* ── Eventlistener ─────────────────────────────────────── */
    fab.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

    overlay.querySelectorAll('.fab-nav-list a').forEach(link =>
      link.addEventListener('click', () => closeMenu()));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) { closeMenu(); fab.focus(); }
    });

    /* Fokus-Falle im Overlay */
    overlay.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const items = Array.from(getFocusable());
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    const scheduleUpdate = () => {
      if (!rafPending) { rafPending = true; requestAnimationFrame(updateFab); }
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    /* Initialzustand */
    fab.style.display = 'none';
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    updateFab();
  }

  /* ══════════════════════════════════════════════════════════════
   * INIT
   * ══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeroStagger();
    initHeroParticles();
    initCompetenciesAccordion();
    initInfoCardsAnimation();
    initStatsSection();
    initValueCardTilt();
    initFooterUtilities();
    initCompetencyCarousel();
    initNavFab();
  });
})();
