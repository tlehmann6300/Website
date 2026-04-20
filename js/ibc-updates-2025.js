/**
 * IBC Updates 2025
 * - Shimmer-Button Ripple-Effekt (Touch + Mouse)
 * - Button-Klick-Verzögerung (visuelles Feedback vor Navigation)
 * - Tastatur-Accessibility
 */

(function () {
  'use strict';

  // ── Button-Selektoren ──────────────────────────────────────
  const BTN_SELECTORS = [
    '.hero-cta-primary',
    '.ethereal-button',
    '.students-pretty-btn',
    '.competency-btn-clean',
    '.fat-footer__cta-btn',
    '.mobile-cta-btn',
    '.esv3-cta',
  ].join(', ');

  // Verzögerung in ms bevor die Seite navigiert
  const CLICK_DELAY = 260;

  // ── Ripple-Position setzen ─────────────────────────────────
  function setRipplePos(btn, clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--ripple-x', x + '%');
    btn.style.setProperty('--ripple-y', y + '%');
  }

  // ── Navigation mit Verzögerung ──────────────────────────────
  function delayedNavigate(btn, originalHref, openNewTab) {
    btn.classList.add('btn-clicking');

    // Haptic Feedback auf mobilen Geräten
    if (navigator.vibrate) navigator.vibrate(8);

    setTimeout(function () {
      btn.classList.remove('btn-clicking');
      if (openNewTab) {
        window.open(originalHref, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = originalHref;
      }
    }, CLICK_DELAY);
  }

  // ── Button-Listeners einrichten ────────────────────────────
  function initButtons() {
    var buttons = document.querySelectorAll(BTN_SELECTORS);

    buttons.forEach(function (btn) {
      // Ripple bei Mouse
      btn.addEventListener('mousedown', function (e) {
        setRipplePos(btn, e.clientX, e.clientY);
      });

      // Ripple bei Touch
      btn.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches[0]) {
          setRipplePos(btn, e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      // Klick-Verzögerung für Links (<a>-Tags)
      if (btn.tagName === 'A') {
        btn.addEventListener('click', function (e) {
          var href = btn.getAttribute('href');

          // Keine Verzögerung für:
          // - Anchor-Links (#)
          // - mailto: / tel: Links
          // - JavaScript-void Links
          // - Links die schon btn-clicking haben (Doppelklick verhinden)
          if (
            !href ||
            href === '#' ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('javascript:') ||
            btn.classList.contains('btn-clicking')
          ) {
            return; // Normal verhalten
          }

          // Prüfen ob neues Tab
          var openNewTab = btn.getAttribute('target') === '_blank';

          e.preventDefault();
          delayedNavigate(btn, href, openNewTab);
        });
      }
    });
  }

  // ── DOM bereit? ────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButtons);
  } else {
    initButtons();
  }

  // Auch nach dynamisch geladenem Inhalt (Testimonials-Slider etc.)
  // MutationObserver für nachträglich eingefügte Buttons
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) {
          // Neu eingefügte Buttons initialisieren
          var newBtns = node.querySelectorAll ? node.querySelectorAll(BTN_SELECTORS) : [];
          newBtns.forEach(function (btn) {
            // Nur wenn noch kein Listener hinzugefügt wurde
            if (!btn.dataset.ibcInit) {
              btn.dataset.ibcInit = '1';
              btn.addEventListener('mousedown', function (e) {
                setRipplePos(btn, e.clientX, e.clientY);
              });
              btn.addEventListener('touchstart', function (e) {
                if (e.touches && e.touches[0]) {
                  setRipplePos(btn, e.touches[0].clientX, e.touches[0].clientY);
                }
              }, { passive: true });
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ── Animation pausieren wenn Tab nicht sichtbar (Akku sparen) ──
  document.addEventListener('visibilitychange', function () {
    var allBtns = document.querySelectorAll(BTN_SELECTORS);
    allBtns.forEach(function (btn) {
      btn.style.animationPlayState = document.hidden ? 'paused' : 'running';
    });
  });

  // ── Counter-Animation (hochzählen) ────────────────────────────
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function runCounter(updateFn, from, to, duration) {
    var startTime = null;
    var range = to - from;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var current = Math.round(from + range * easeOutQuart(progress));
      updateFn(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = [];

    // .counter-animated – text enthält z.B. "25+", "300+", "24h", "100%", "1998"
    document.querySelectorAll('.counter-animated').forEach(function (el) {
      if (el.dataset.ibcCounterInit) return;
      el.dataset.ibcCounterInit = '1';
      var text = el.textContent.trim();
      var match = text.match(/^(\d+)(.*)$/);
      if (!match) return;
      var to = parseInt(match[1], 10);
      var suffix = match[2] || '';
      var from = el.dataset.countFrom ? parseInt(el.dataset.countFrom, 10) : 0;
      counters.push({
        el: el,
        from: from,
        to: to,
        update: function (val) { el.textContent = val + suffix; }
      });
    });

    // .fu-stat__num[data-count] – fuer-unternehmen.html nutzt separaten <span class="fu-stat__count">
    document.querySelectorAll('.fu-stat__num[data-count]').forEach(function (el) {
      if (el.dataset.ibcCounterInit) return;
      el.dataset.ibcCounterInit = '1';
      var to = parseInt(el.dataset.count, 10);
      if (isNaN(to)) return;
      var countEl = el.querySelector('.fu-stat__count');
      if (!countEl) return;
      counters.push({
        el: el,
        from: 0,
        to: to,
        update: function (val) { countEl.textContent = val; }
      });
    });

    if (counters.length === 0 || typeof IntersectionObserver === 'undefined') return;

    var counterMap = new Map();
    counters.forEach(function (c) { counterMap.set(c.el, c); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var c = counterMap.get(entry.target);
        if (!c || c.started) return;
        c.started = true;
        observer.unobserve(entry.target);
        runCounter(c.update, c.from, c.to, 1600);
      });
    }, { threshold: 0.3 });

    counters.forEach(function (c) { observer.observe(c.el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }

})();
