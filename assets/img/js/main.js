/**
 * Hauptmodul für die IBC Website
 * 
 * Dieses Modul enthält alle wichtigen Funktionen und Initialisierungen für die gesamte Website.
 * Es wird als IIFE (Immediately Invoked Function Expression) ausgeführt, um einen eigenen
 * Scope zu erstellen und Variablenkonflikte mit globalem Scope zu vermeiden.
 * 
 * Hauptfunktionen:
 * - Utility-Funktionen (throttle, debounce)
 * - Animation-Initialisierung
 * - Formular-Validierung
 * - Scroll-Effekte
 * - Button-Animationen
 * - Bootstrap-Komponenten-Initialisierung
 */
(() => {
  // Aktiviert den Strict-Modus für saubereren und sichereren Code
  'use strict';
  
  /**
   * Throttle-Funktion
   * 
   * Begrenzt die Ausführungsrate einer Funktion. Nützlich für Events wie scroll oder resize,
   * die sehr häufig gefeuert werden können. Die Funktion wird maximal einmal pro 'wait'
   * Millisekunden ausgeführt.
   * 
   * @param {Function} func - Die zu drosselnde Funktion
   * @param {number} wait - Wartezeit in Millisekunden zwischen Ausführungen
   * @returns {Function} Die gedrosselte Funktion
   */
  function throttle(func, wait) {
    // Flag, um zu verfolgen, ob wir gerade warten
    let waiting = false;
    
    // Gibt eine neue Funktion zurück, die die ursprüngliche Funktion drosselt
    return function(...args) {
      // Wenn wir nicht warten, führe die Funktion aus
      if (!waiting) {
        // Führe die Funktion mit dem aktuellen Kontext und Argumenten aus
        func.apply(this, args);
        // Setze das Warte-Flag auf true
        waiting = true;
        // Nach 'wait' Millisekunden, setze das Flag zurück auf false
        setTimeout(() => {
          waiting = false;
        }, wait);
      }
    };
  }
  /**
   * Debounce-Funktion
   * 
   * Verzögert die Ausführung einer Funktion, bis eine bestimmte Zeit vergangen ist,
   * seit sie zuletzt aufgerufen wurde. Nützlich für Events wie Eingabe-Felder,
   * wo wir warten wollen, bis der Benutzer aufgehört hat zu tippen.
   * 
   * @param {Function} func - Die zu verzögernde Funktion
   * @param {number} wait - Wartezeit in Millisekunden vor der Ausführung
   * @returns {Function} Die verzögerte Funktion
   */
  function debounce(func, wait) {
    // Variable für den Timeout-Handle
    let timeout;
    
    // Gibt eine neue Funktion zurück, die die ursprüngliche Funktion verzögert
    return function(...args) {
      // Lösche den vorherigen Timeout, falls vorhanden
      clearTimeout(timeout);
      // Setze einen neuen Timeout für die Funktionsausführung
      timeout = setTimeout(() => {
        // Führe die Funktion mit dem gespeicherten Kontext und Argumenten aus
        func.apply(this, args);
      }, wait);
    };
  }
  /**
   * Konfigurationsobjekt für die Website
   * 
   * Enthält alle zentralen Konfigurationsparameter für Animationen, Komponenten
   * und UI-Elemente der Website. Diese zentrale Konfiguration erleichtert die
   * Wartung und Anpassung von globalen Einstellungen.
   */
  const config = {
    // Animations-Einstellungen
    animations: {
      enabled: true,              // Aktiviert/deaktiviert Animationen global
      duration: 300,               // Standard-Animationsdauer in Millisekunden
      bubblyDuration: 700          // Dauer für Bubble-Button-Animationen in Millisekunden
    },
    // Button-Stil-Klassen
    buttons: {
      bubblyClass: 'btn-bubbly',   // CSS-Klasse für Bubble-Buttons
      etherealClass: 'btn-ethereal' // CSS-Klasse für ätherische Buttons
    },
    // Intersection Observer Einstellungen
    observer: {
      threshold: 0.12,              // Schwellenwert (12%) für Sichtbarkeit von Elementen
      rootMargin: '-50px 0px'       // Margin-Offset für Observer-Trigger
    },
    // Preloader-Einstellungen
    preloader: {
      delay: 500                    // Verzögerung in ms vor dem Ausblenden des Preloaders
    },
    // Flip-Card-Einstellungen
    flipCards: {
      desktopBreakpoint: 1400       // Breakpoint in Pixeln für Desktop-Ansicht
    }
  };
  
  /**
   * Media Query für Hover-Funktionalität
   * Prüft, ob das Gerät Hover unterstützt (z.B. Desktop mit Maus)
   * Wichtig für Touch-Geräte vs. Desktop-Unterscheidung
   */
  const hoverMediaQuery = window.matchMedia('(hover: hover)');
  
  /**
   * Media Query für große Bildschirme
   * Prüft, ob der Bildschirm mindestens 1200px breit ist
   * Wird für responsive Design-Entscheidungen verwendet
   */
  const largeScreenMediaQuery = window.matchMedia('(min-width: 1200px)');
  // Hilfsfunktion: Scroll explizit freigeben (Sicherheit gegen hängende .no-scroll-Klassen)
  const forceScrollUnlock = () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
  };
  /**
   * Initialisiert den Preloader (Ladeanimation)
   * 
   * Der Preloader wird beim Laden der Seite angezeigt und nach einer kurzen
   * Verzögerung ausgeblendet. Diese Funktion behandelt sowohl normale
   * Ladezeiten als auch Timeout-Szenarien.
   * 
   * Funktionsweise:
   * 1. Findet das Preloader-Element im DOM
   * 2. Wartet auf vollständiges Laden der Seite oder einen Timeout
   * 3. Blendet den Preloader mit Animation aus
   * 4. Entfernt den Preloader nach der Animation aus dem DOM
   */
  const initPreloader = () => {
    // Sucht das Preloader-Element im DOM
    const preloader = document.querySelector('.preloader');
    // Wenn kein Preloader existiert, beende die Funktion vorzeitig
    if (!preloader) return;
    // Hilfsfunktion: Preloader ausblenden und Scroll freigeben
    const doHidePreloader = () => {
        preloader.classList.add('hidden');
        preloader.setAttribute('aria-hidden', 'true');
        forceScrollUnlock();
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000);
    };
    const hidePreloader = () => {
        setTimeout(doHidePreloader, config.preloader.delay);
    };
    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader);
    }
    // Sicherheits-Timeout: Scroll nach maximal 3 Sekunden erzwingen,
    // falls der Preloader hängen bleibt oder das load-Event nicht feuert.
    setTimeout(() => {
        if (!preloader.classList.contains('hidden')) {
            doHidePreloader();
        } else {
            // Preloader bereits ausgeblendet – Scroll trotzdem sicherstellen
            forceScrollUnlock();
        }
    }, 3000);
  };
const initButtonAnimations = () => {
    const createBubbles = (button, bubblesContainer) => {
      const buttonRect = button.getBoundingClientRect();
      const centerX = buttonRect.left + buttonRect.width / 2;
      const centerY = buttonRect.top + buttonRect.height / 2;
      const maxDistance = 150;
      for (let i = 0; i < 25; i++) {
        const bubble = document.createElement('span');
        bubble.classList.add('bubble');
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * maxDistance + 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        bubble.style.setProperty('--x', `${x}px`);
        bubble.style.setProperty('--y', `${y}px`);
        const size = Math.random() * 20 + 10 + 'px';
        bubble.style.width = size;
        bubble.style.height = size;
        bubble.style.left = `${centerX - buttonRect.left - size.replace('px', '') / 2}px`;
        bubble.style.top = `${centerY - buttonRect.top - size.replace('px', '') / 2}px`;
        bubblesContainer.appendChild(bubble);
        bubble.addEventListener('animationend', () => {
          bubble.remove();
        });
      }
    };
    document.querySelectorAll('.bubble-btn, .bubbly-button').forEach(button => {
      if (button.parentNode.classList.contains('bubbly-wrapper')) return;
      const container = document.createElement('div');
      container.classList.add('bubbly-wrapper');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      const bubblesContainer = document.createElement('div');
      bubblesContainer.classList.add('bubbles');
      button.parentNode.insertBefore(container, button);
      container.appendChild(button);
      container.appendChild(bubblesContainer);
      if (!button.dataset.bubblyAttached) {
        button.addEventListener('click', (e) => {
          createBubbles(button, bubblesContainer);
          if (button.tagName === 'A' && button.href) {
            e.preventDefault();
            const href = button.href;
            const target = button.target;
            setTimeout(() => {
              if (target === '_blank') {
                window.open(href, '_blank');
              } else {
                window.location.href = href;
              }
            }, 1000);
          }
        });
        button.dataset.bubblyAttached = "true";
      }
    });
  };
  const initScrollAnimations = () => {
    const observerOptions = {
      threshold: config.observer.threshold,
      rootMargin: config.observer.rootMargin
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.animationDelay ||
                       entry.target.style.transitionDelay || '0ms';
          entry.target.style.transitionDelay = delay;
          requestAnimationFrame(() => {
            entry.target.classList.add('is-visible');
          });
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    document.querySelectorAll('.fade-in-up, .fade-in, .section-heading, .section-heading-animated, .reveal-fx, .value-card, .stat-card, .info-card, .testimonial-quote, .service-card, .partner-card, .info-stagger-in, .info-glass-card, .fade-in-up-value')
      .forEach(el => observer.observe(el));

    // Fast-scroll safety net: after scrolling stops, force .is-visible on any
    // animated element whose bottom edge has already passed the viewport.
    // Prevents content from remaining invisible when the user scrolls quickly
    // and the IntersectionObserver callback fires too late.
    const revealBufferPx = 80;       // elements within 80 px of viewport bottom are also revealed
    const scrollDebouncedMs = 150;   // wait until scroll has been idle for 150 ms
    const forceRevealPast = () => {
      const vp = window.innerHeight;
      const pending = [];
      document.querySelectorAll(
        '.reveal-fx:not(.is-visible), .fade-in-up:not(.is-visible), .fade-in:not(.is-visible)'
      ).forEach(el => {
        if (el.getBoundingClientRect().bottom <= vp + revealBufferPx) {
          pending.push(el);
        }
      });
      if (pending.length) {
        requestAnimationFrame(() => pending.forEach(el => el.classList.add('is-visible')));
      }
    };
    window.addEventListener('scroll', debounce(forceRevealPast, scrollDebouncedMs), { passive: true });
    // Run once after initial render to reveal elements already in view
    requestAnimationFrame(forceRevealPast);
  };
  const initReadMore = () => {
    document.querySelectorAll('[data-read-more]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(btn.dataset.target);
            if (!target) return;
            target.style.maxHeight = target.style.maxHeight ? null : `${target.scrollHeight}px`;
            btn.textContent = target.style.maxHeight ? 'Weniger' : 'Mehr';
        });
    });
    initReadMorePartners();
  };
  const initReadMorePartners = () => {
    const partnerParagraphs = document.querySelectorAll('.partner-content p');
    const collapsedHeightThreshold = 140;
    let counter = 1;
    partnerParagraphs.forEach(p => {
        if(p.nextElementSibling && p.nextElementSibling.classList.contains('read-more-btn')) return;
        if (p.scrollHeight > collapsedHeightThreshold) {
            p.classList.add('collapsed');
            const pId = 'partner-desc-' + counter++;
            p.id = pId;
            let partnerName = '';
            try {
                const partnerContent = p.closest('.partner-content');
                if (partnerContent) {
                    const partnerNameEl = partnerContent.querySelector('h3');
                    if (partnerNameEl) {
                        partnerName = partnerNameEl.textContent.trim();
                    }
                }
            } catch (error) {
                console.warn('Could not find partner name for read more button:', error);
            }
            const readMoreBtn = document.createElement('button');
            readMoreBtn.classList.add('read-more-btn');
            readMoreBtn.type = 'button';
            readMoreBtn.innerHTML = 'Mehr lesen';
            readMoreBtn.setAttribute('aria-expanded', 'false');
            readMoreBtn.setAttribute('aria-controls', pId);
            if (partnerName) {
                readMoreBtn.setAttribute('aria-label', `Mehr lesen über ${partnerName}`);
            }
            p.parentNode.insertBefore(readMoreBtn, p.nextSibling);
            readMoreBtn.addEventListener('click', function() {
                const isExpanded = p.classList.contains('expanded');
                p.classList.toggle('expanded');
                p.classList.toggle('collapsed');
                if (!isExpanded) {
                    readMoreBtn.innerHTML = 'Weniger anzeigen';
                    readMoreBtn.classList.add('less');
                    readMoreBtn.setAttribute('aria-expanded', 'true');
                    if (partnerName) {
                        readMoreBtn.setAttribute('aria-label', `Weniger anzeigen über ${partnerName}`);
                    }
                } else {
                    readMoreBtn.innerHTML = 'Mehr lesen';
                    readMoreBtn.classList.remove('less');
                    readMoreBtn.setAttribute('aria-expanded', 'false');
                    if (partnerName) {
                        readMoreBtn.setAttribute('aria-label', `Mehr lesen über ${partnerName}`);
                    }
                }
            });
        }
    });
  };
  const initLanguageSwitcher = () => {
    const switcher = document.querySelector('.language-switcher');
    if (!switcher) return;
    switcher.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'de' ? 'en' : 'de';
        document.documentElement.lang = newLang;
        updateLanguageContent(newLang);
        updateLanguageFlag(newLang);
    });
  };
  function updateLanguageContent(lang) {
  }
  function updateLanguageFlag(lang) {
  };
  const FORM_COLORS = {
    DEFAULT: '#E5E7EB',
    VALID: 'var(--ibc-green, #5DA739)',
    INVALID: '#dc3545',
    FOCUS: 'var(--ibc-blue, #4054B2)'
  };
  const initFormValidation = () => {
    document.querySelectorAll('form:not(#contact-form)').forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
          updateAriaInvalidStates(form);
          const firstInvalidInput = form.querySelector('input:invalid, textarea:invalid, select:invalid');
          if (firstInvalidInput) {
            firstInvalidInput.focus({ preventScroll: true });
            const errorId = firstInvalidInput.getAttribute('aria-describedby');
            if (errorId) {
              const errorElement = document.getElementById(errorId);
              if (errorElement) {
                errorElement.style.display = 'block';
              }
            }
          }
        }
        form.classList.add('was-validated');
      });
      const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
      inputs.forEach(input => {
        input.addEventListener('blur', function() {
          const isValid = this.checkValidity();
          this.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
          const errorId = this.getAttribute('aria-describedby');
          if (errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
              if (!isValid) {
                errorElement.style.display = 'block';
              } else {
                errorElement.style.display = 'none';
              }
            }
          }
          if (this.value.trim() === '') {
            this.style.borderColor = isValid ? FORM_COLORS.DEFAULT : FORM_COLORS.INVALID;
          } else {
            this.style.borderColor = isValid ? FORM_COLORS.VALID : FORM_COLORS.INVALID;
          }
        });
        input.addEventListener('focus', function() {
          this.style.borderColor = FORM_COLORS.FOCUS;
        });
        input.addEventListener('input', function() {
          if (form.classList.contains('was-validated')) {
            const isValid = this.checkValidity();
            this.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
            const errorId = this.getAttribute('aria-describedby');
            if (errorId) {
              const errorElement = document.getElementById(errorId);
              if (errorElement) {
                errorElement.style.display = !isValid ? 'block' : 'none';
              }
            }
          }
        });
      });
    });
  };
  function updateAriaInvalidStates(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const isValid = input.checkValidity();
      input.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
    });
  }
  const initCounters = () => {
    const animateCounter = (element) => {
      const target = +element.getAttribute('data-target');
      const suffix = element.getAttribute('data-suffix') || '';
      const duration = 2500;
      let startTime = null;
      const animatedSpan = element.querySelector('.counter-animated') || element;
      const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const current = Math.floor(easedProgress * target);
        animatedSpan.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          animatedSpan.textContent = target + suffix;
        }
      };
      requestAnimationFrame(step);
    };
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const statNumber = entry.target;
          if (!statNumber.classList.contains('animated')) {
            statNumber.classList.add('animated');
            animateCounter(statNumber);
          }
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-number').forEach(statNum => {
      statsObserver.observe(statNum);
    });
  };
  const initTimelineSpotlight = () => {
    const timelines = document.querySelectorAll('.timeline');
    if (timelines.length === 0) return;
    timelines.forEach(timeline => {
      const items = timeline.querySelectorAll('.timeline-item');
      if (items.length === 0) return;
      const updateActiveItem = () => {
        const viewportCenter = window.innerHeight / 2;
        let activeItem = null;
        let minDistance = Infinity;
        items.forEach(item => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.top + (rect.height / 2);
          const distance = Math.abs(itemCenter - viewportCenter);
          if (distance < minDistance && rect.top < window.innerHeight && rect.bottom > 0) {
            minDistance = distance;
            activeItem = item;
          }
        });
        items.forEach(item => item.classList.remove('timeline-active'));
        if (activeItem) {
          activeItem.classList.add('timeline-active');
        }
      };
      const throttledUpdate = throttle(() => {
        requestAnimationFrame(updateActiveItem);
      }, 100);
      window.addEventListener('scroll', throttledUpdate, { passive: true });
      const debouncedUpdate = debounce(() => {
        requestAnimationFrame(updateActiveItem);
      }, 200);
      window.addEventListener('resize', debouncedUpdate);
      updateActiveItem();
    });
  };
  const initTimelineNew = () => {
    const timelineItems = document.querySelectorAll('.timeline-item-new');
    if (timelineItems.length === 0) return;
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    timelineItems.forEach(item => observer.observe(item));
  };
  const initBootstrapComponents = () => {
    if (typeof bootstrap === 'undefined') return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverInstances = popoverTriggerList.map(popoverTriggerEl => {
      return new bootstrap.Popover(popoverTriggerEl, {
        trigger: isTouchDevice ? 'click' : 'hover focus',
        html: true
      });
    });
    if (isTouchDevice && popoverInstances.length > 0) {
      document.addEventListener('click', (e) => {
        popoverTriggerList.forEach((trigger, index) => {
          if (!trigger.contains(e.target)) {
            popoverInstances[index].hide();
          }
        });
      }, { passive: true });
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          popoverInstances.forEach(instance => {
            instance.hide();
          });
        }, 100);
      }, { passive: true });
    }
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
      new bootstrap.Carousel(carousel, {
        interval: false,
        ride: false
      });
    });
  };
  const initScrollProgress = () => {
    const scrollProgress = document.createElement('div');
    scrollProgress.classList.add('scroll-progress');
    document.body.appendChild(scrollProgress);
    const updateProgress = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.pageYOffset / windowHeight) * 100;
      scrollProgress.style.width = scrolled + '%';
    };
    const throttledProgress = throttle(() => {
      requestAnimationFrame(updateProgress);
    }, 100);
    window.addEventListener('scroll', throttledProgress, { passive: true });
  };
  const initInstagramModal = () => {
    const instagramModal = document.getElementById('instagramModal');
    if (instagramModal) {
      instagramModal.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const iframeSrc = button.getAttribute('data-iframe-src');
        const iframe = instagramModal.querySelector('iframe');
        if (iframe && iframeSrc) {
          iframe.src = iframeSrc;
        }
      });
      instagramModal.addEventListener('hide.bs.modal', () => {
        const iframe = instagramModal.querySelector('iframe');
        if (iframe) {
          iframe.src = 'about:blank';
        }
      });
    }
  };
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#main-nav') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    });
  };
  const initContactFormButtons = () => {
    if (!document.getElementById('sendBase')) return;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeInOut(t) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
    function animate(duration, onProgress, easingFn = t => t) {
        return new Promise(resolve => {
            const start = performance.now();
            function loop(now) {
                let t = Math.min((now - start)/duration,1);
                onProgress(easingFn(t));
                if(t<1) requestAnimationFrame(loop);
                else resolve();
            }
            requestAnimationFrame(loop);
        });
    }
    function resamplePath(pathEl, numPoints=100){
        const totalLength = pathEl.getTotalLength();
        if(totalLength===0) return Array(numPoints).fill({x:0,y:0});
        const step = totalLength/(numPoints-1);
        const points=[];
        for(let i=0;i<numPoints;i++){
            const pt = pathEl.getPointAtLength(i*step);
            points.push({x:pt.x, y:pt.y});
        }
        return points;
    }
    async function morphPath(pathEl, startEl, endEl, duration, numPoints=100){
        const startPoints = resamplePath(startEl, numPoints);
        const endPoints = resamplePath(endEl, numPoints);
        await animate(duration, t => {
            const d = startPoints.map((s,i)=>{
                const e = endPoints[i];
                const x = lerp(s.x,e.x,t);
                const y = lerp(s.y,e.y,t);
                return (i===0?'M':'L')+`${x} ${y}`;
            }).join(' ');
            pathEl.setAttribute('d', d+' Z');
        }, easeInOut);
    }
    function animateAttribute(el, attr, from, to, duration){
        return animate(duration, t=> el.setAttribute(attr, lerp(from,to,t)), easeInOut);
    }
    function animateTransform(el, fromX, toX, duration){
        return animate(duration, t=> el.setAttribute('transform', `translate(${lerp(fromX,toX,t)},0)`), easeInOut);
    }
    function scaleTextOut(el, duration){
        const bbox = el.getBBox();
        const cx = bbox.x + bbox.width/2;
        const cy = bbox.y + bbox.height/2;
        return animate(duration, t=>{
            const scale = 1-t;
            el.setAttribute('transform', `translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`);
        }, easeInOut);
    }
    function animatePlaneOnPath(planeEl, routeEl, duration){
        const totalLength = routeEl.getTotalLength();
        const cx = 563.55859375;
        const cy = 527.734375;
        return animate(duration, t=>{
            const pt = routeEl.getPointAtLength(t*totalLength);
            const next = routeEl.getPointAtLength(Math.min(t*totalLength+1,totalLength));
            const angle = Math.atan2(next.y-pt.y,next.x-pt.x)*180/Math.PI;
            planeEl.setAttribute('transform',
                `translate(${pt.x},${pt.y}) ` +
                `rotate(${angle + 90}) ` +
                `translate(${-cx},${-cy})`
            );
        }, easeInOut);
    }
    async function animateDrawSVG(pathEl, duration, fromStart, fromEnd, toStart, toEnd) {
        const length = pathEl.getTotalLength();
        if (length === 0) return;
        await animate(duration, t => {
            const startPercent = lerp(fromStart, toStart, t);
            const endPercent = lerp(fromEnd, toEnd, t);
            const start = (startPercent / 100) * length;
            const end = (endPercent / 100) * length;
            const dashLength = Math.max(0, end - start);
            pathEl.style.strokeDasharray = `${dashLength} ${length}`;
            pathEl.style.strokeDashoffset = `${-start}`;
        }, easeInOut);
    }
    async function animatePlaneToFinalPosition(planeEl, routeEl, xOffset, duration) {
        const totalLength = routeEl.getTotalLength();
        const cx = 563.55859375;
        const cy = 527.734375;
        const ptStart = routeEl.getPointAtLength(totalLength);
        const prevStart = routeEl.getPointAtLength(totalLength - 1);
        const angle = Math.atan2(ptStart.y - prevStart.y, ptStart.x - prevStart.x) * 180 / Math.PI;
        const ptEnd = { x: ptStart.x + xOffset, y: ptStart.y };
        await animate(duration, t => {
            const currentX = lerp(ptStart.x, ptEnd.x, t);
            const currentY = lerp(ptStart.y, ptEnd.y, t);
            planeEl.setAttribute('transform',
                `translate(${currentX},${currentY}) ` +
                `rotate(${angle + 90}) ` +
                `translate(${-cx},${-cy})`
            );
        }, easeInOut);
    }
    const sendBase = document.getElementById('sendBase');
    const btnPath = document.getElementById('btnPath');
    const cBottom = document.getElementById('cBottom');
    const cTop = document.getElementById('cTop');
    const cCenter = document.getElementById('cCenter');
    const cEnd = document.getElementById('cEnd');
    const txtSend = document.getElementById('txtSend');
    const paperPlane = document.getElementById('paperPlane');
    const paperPlanePath = document.getElementById('paperPlanePath');
    const paperPlaneRoute = document.getElementById('paperPlaneRoute');
    const tickMark = document.getElementById('tickMark');
    const rectSentItems = document.getElementById('rectSentItems');
    const mask1 = document.getElementById('mask1');
    if (!sendBase) return;
    const original = {
        btnPathD: btnPath.getAttribute('d'),
        planePathD: paperPlanePath.getAttribute('d'),
        planeTransform: paperPlane.getAttribute('transform'),
        txtSendTransform: txtSend.getAttribute('transform') || '',
        rectSentTransform: rectSentItems.getAttribute('transform'),
        maskX: mask1.getAttribute('x')
    };
    let isAnimating = false;
    sendBase.addEventListener('mousedown', () => {
        if (isAnimating) return;
        sendBase.style.transform = 'scale(0.9)';
    });
    sendBase.addEventListener('mouseup', () => {
        if (isAnimating) return;
        sendBase.style.transform = 'scale(1)';
        const form = document.getElementById('contact-form');
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        const validationResult = form.dispatchEvent(submitEvent);
        if (validationResult && !form.querySelector('.is-invalid')) {
            playSendButtonAnimation();
        }
    });
    sendBase.addEventListener('click', () => {
        if (isAnimating) return;
        const form = document.getElementById('contact-form');
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        const validationResult = form.dispatchEvent(submitEvent);
        if (validationResult && !form.querySelector('.is-invalid')) {
            playSendButtonAnimation();
        }
    });
    sendBase.addEventListener('keypress', (e) => {
        if (isAnimating) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sendBase.style.transform = 'scale(0.9)';
            setTimeout(() => {
                sendBase.style.transform = 'scale(1)';
                const form = document.getElementById('contact-form');
                const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });
                const validationResult = form.dispatchEvent(submitEvent);
                if (validationResult && !form.querySelector('.is-invalid')) {
                    playSendButtonAnimation();
                }
            }, 100);
        }
    });
    sendBase.addEventListener('mouseleave', () => {
        if (isAnimating) return;
        sendBase.style.transform = 'scale(1)';
    });
    function resetSendButton() {
        btnPath.setAttribute('d', original.btnPathD);
        paperPlanePath.setAttribute('d', original.planePathD);
        paperPlane.setAttribute('transform', original.planeTransform);
        txtSend.setAttribute('transform', original.txtSendTransform);
        rectSentItems.setAttribute('transform', original.rectSentTransform);
        mask1.setAttribute('x', original.maskX);
        paperPlanePath.setAttribute('fill', '#4F67EB');
        paperPlaneRoute.style.strokeDasharray = '0, 999999';
        paperPlaneRoute.style.strokeDashoffset = '0';
        isAnimating = false;
    }
    async function playSendButtonAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        const textAnim = scaleTextOut(txtSend, 600);
        const planeAnim = animatePlaneOnPath(paperPlane, paperPlaneRoute, 1000);
        paperPlanePath.setAttribute('fill', 'white');
        const drawAnim1 = (async () => {
            await new Promise(r => setTimeout(r, 300));
            await animateDrawSVG(paperPlaneRoute, 700, 0, 0, 80, 100);
        })();
        const drawAnim2 = (async () => {
            await new Promise(r => setTimeout(r, 1000));
            await animateDrawSVG(paperPlaneRoute, 200, 80, 100, 100, 100);
        })();
        const tickMorph = (async () => {
            await new Promise(r => setTimeout(r,1000));
            paperPlanePath.setAttribute('fill', '#4E67E8');
            await morphPath(paperPlanePath, paperPlanePath, tickMark, 430);
        })();
        const buttonMorph = (async () => {
            await morphPath(btnPath, btnPath, cBottom, 770);
            await morphPath(btnPath, btnPath, cTop, 230);
            await morphPath(btnPath, btnPath, cCenter, 200);
            await Promise.all([
                morphPath(btnPath, btnPath, cEnd, 500),
                animateTransform(rectSentItems, -240, 0, 500),
                animateAttribute(mask1, 'x', 700, 440, 500),
                animatePlaneToFinalPosition(paperPlane, paperPlaneRoute, -205, 500)
            ]);
        })();
        await Promise.all([textAnim, planeAnim, drawAnim1, drawAnim2, tickMorph, buttonMorph]);
        setTimeout(resetSendButton, 1500);
    }
    const resetFlipButton = document.getElementById('resetFlipButton');
    if (resetFlipButton) {
      const resetFrontFace = resetFlipButton.querySelector('.my-front');
      const confirmResetBtn = document.getElementById('confirmReset');
      const cancelResetBtn = document.getElementById('cancelReset');
      if (resetFrontFace && confirmResetBtn && cancelResetBtn) {
        function openResetFlip(event) {
            if (resetFlipButton.classList.contains('is-flipped')) return;
            resetFlipButton.classList.add('is-flipped');
            resetFlipButton.setAttribute('aria-expanded', 'true');
            setTimeout(() => confirmResetBtn.focus(), 700);
        }
        function closeResetFlip() {
            resetFlipButton.classList.remove('is-flipped');
            resetFlipButton.setAttribute('aria-expanded', 'false');
            setTimeout(() => resetFlipButton.focus(), 700);
        }
        resetFrontFace.addEventListener('click', openResetFlip);
        resetFlipButton.addEventListener('click', (event) => {
            if (!resetFlipButton.classList.contains('is-flipped')) {
                openResetFlip(event);
            }
        });
        confirmResetBtn.addEventListener('click', () => {
            const form = document.getElementById('contact-form');
            if (form) {
              form.reset();
              form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
              form.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
              form.querySelectorAll('.invalid-label').forEach(el => el.classList.remove('invalid-label'));
              form.querySelectorAll('.form-group-animated').forEach(el => el.classList.remove('has-error'));
              form.classList.remove('was-validated');
              form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
              form.querySelectorAll('input, textarea, select').forEach(el => {
                el.style.borderColor = '';
              });
              if (typeof grecaptcha !== 'undefined') {
                  grecaptcha.reset();
              }
              const formStatus = document.getElementById('form-status');
              if (formStatus) {
                  formStatus.innerHTML = '';
              }
            }
            closeResetFlip();
        });
        cancelResetBtn.addEventListener('click', () => {
            closeResetFlip();
        });
        resetFlipButton.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openResetFlip();
            } else if (e.key === 'Escape') {
                closeResetFlip();
            }
        });
      }
    }
  };
  const initHeroVideoToggle = () => {
    const toggleBtn = document.getElementById('hero-video-toggle');
    const video = document.getElementById('hero-video');
    if (!toggleBtn || !video) return;
    const labels = {
      de: { pause: 'Video pausieren', play: 'Video abspielen', pauseText: 'Pause', playText: 'Play' },
      en: { pause: 'Pause video', play: 'Play video', pauseText: 'Pause', playText: 'Play' },
      fr: { pause: 'Mettre en pause la vidéo', play: 'Lire la vidéo', pauseText: 'Pause', playText: 'Lire' }
    };
    const getLang = () => {
      if (window.ibcLanguageSwitcher && window.ibcLanguageSwitcher.currentLang) {
        return window.ibcLanguageSwitcher.currentLang;
      }
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('lang') || 'de';
    };
    const updateVideoUIForPausedState = () => {
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
      }
      const lang = getLang();
      const l = labels[lang] || labels.de;
      toggleBtn.setAttribute('aria-label', l.play);
      const srText = toggleBtn.querySelector('.visually-hidden');
      if (srText) srText.textContent = l.playText;
    };
    const updateVideoUIForPlayingState = () => {
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
      }
      const lang = getLang();
      const l = labels[lang] || labels.de;
      toggleBtn.setAttribute('aria-label', l.pause);
      const srText = toggleBtn.querySelector('.visually-hidden');
      if (srText) srText.textContent = l.pauseText;
    };
    // Video should always autoplay on all devices (business requirement)
    // Users can manually pause using the toggle button if desired
    // Note: This intentionally does not respect prefers-reduced-motion
    // as per the requirement that video should autoplay by default
    video.addEventListener('play', updateVideoUIForPlayingState);
    video.addEventListener('pause', updateVideoUIForPausedState);
    const checkInitialState = () => {
      if (video.paused) {
        updateVideoUIForPausedState();
      } else {
        updateVideoUIForPlayingState();
      }
    };
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      checkInitialState();
    } else {
      video.addEventListener('loadeddata', checkInitialState, { once: true });
    }
    toggleBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  };
  const initAngebotCards = () => {
    const angebotCards = document.querySelectorAll('.angebot-card');
    angebotCards.forEach(card => {
      if (card.tagName.toLowerCase() === 'a') {
        card.addEventListener('click', function(e) {
          e.preventDefault();
        });
        card.setAttribute('href', 'javascript:void(0)');
      }
    });
  };
  const initIbcHeadings = () => {
    const headings = document.querySelectorAll('.ibc-heading');
    const revealSections = document.querySelectorAll('.js-reveal');
    if (headings.length === 0) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    headings.forEach(heading => {
      if (heading.dataset.ibcProcessed === 'true') return;
      heading.dataset.ibcProcessed = 'true';
      if (prefersReducedMotion) {
        heading.classList.add('is-in-view');
        heading.style.visibility = 'visible';
        return;
      }
      const hasWordWrappers = heading.querySelector('.word-wrapper') !== null;
      if (hasWordWrappers) {
        heading.style.visibility = 'visible';
        const originalText = heading.textContent.trim();
        if (!heading.getAttribute('aria-label')) {
          heading.setAttribute('aria-label', originalText);
        }
        heading.setAttribute('aria-hidden', 'true');
        return;
      }
      const originalHTML = heading.innerHTML;
      const originalText = heading.textContent.trim();
      if (!heading.getAttribute('aria-label')) {
        heading.setAttribute('aria-label', originalText);
      }
      const wrapper = document.createElement('div');
      wrapper.innerHTML = originalHTML;
      heading.innerHTML = '';
      heading.style.visibility = 'visible';
      heading.setAttribute('aria-hidden', 'true');
      let wordIndex = 0;
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const parts = node.textContent.split(' ');
          parts.forEach((part) => {
            if (part.trim() === '') return;
            const wordWrap = document.createElement('span');
            wordWrap.className = 'word-wrapper';
            const wordInner = document.createElement('span');
            wordInner.className = 'word';
            wordInner.textContent = part;
            wordInner.style.setProperty('--delay', `${wordIndex * 0.08}s`);
            wordWrap.appendChild(wordInner);
            heading.appendChild(wordWrap);
            wordIndex++;
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const parts = node.textContent.split(' ');
          parts.forEach((part) => {
            if (part.trim() === '') return;
            const wordWrap = document.createElement('span');
            wordWrap.className = 'word-wrapper';
            const wordInner = document.createElement('span');
            wordInner.className = 'word';
            if (node.className) {
              wordInner.className += ' ' + node.className;
            }
            if (node.hasAttribute('data-i18n')) {
              wordInner.setAttribute('data-i18n', node.getAttribute('data-i18n'));
            }
            wordInner.textContent = part;
            wordInner.style.setProperty('--delay', `${wordIndex * 0.08}s`);
            wordWrap.appendChild(wordInner);
            heading.appendChild(wordWrap);
            wordIndex++;
          });
        }
      };
      wrapper.childNodes.forEach(processNode);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px'
    });
    headings.forEach(heading => observer.observe(heading));
    revealSections.forEach(section => observer.observe(section));
    document.querySelectorAll('.ibc-lead').forEach(lead => {
      observer.observe(lead.closest('.js-reveal') || lead);
    });
  };
  const initFooterUtilities = () => {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
    const copyBanner = document.getElementById('copy-banner');
    const emailLinks = document.querySelectorAll('.copy-email-link');
    
    /**
     * Fallback-Funktion zum Kopieren in die Zwischenablage
     * Funktioniert in allen modernen Browsern einschließlich Firefox
     */
    const fallbackCopyToClipboard = (text, banner) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
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
      textArea.focus();
      textArea.select();
      
      // Helper function to clean up textarea
      const cleanup = () => {
        if (textArea.parentNode) {
          textArea.parentNode.removeChild(textArea);
        }
      };
      
      try {
        textArea.setSelectionRange(0, text.length);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            if (banner) {
              banner.classList.add('show');
              setTimeout(() => banner.classList.remove('show'), 4000);
            }
            cleanup();
          }).catch(() => {
            alert('Kopieren nicht unterstützt. Bitte manuell kopieren: ' + text);
            cleanup();
          });
        } else {
          alert('Bitte kopieren Sie manuell: ' + text);
          cleanup();
        }
      } catch (err) {
        console.error('Fallback-Kopieren fehlgeschlagen:', err);
        alert('Kopieren fehlgeschlagen. Bitte manuell kopieren: ' + text);
        cleanup();
      }
    };
    
    emailLinks.forEach(link => {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        const email = this.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(() => {
            if(copyBanner) {
              copyBanner.classList.add('show');
              setTimeout(() => {
                copyBanner.classList.remove('show');
              }, 4000);
            }
          }).catch(err => {
            console.error('Fehler beim Kopieren: ', err);
            fallbackCopyToClipboard(email, copyBanner);
          });
        } else {
          fallbackCopyToClipboard(email, copyBanner);
        }
      });
    });
  };
  const initFlipCards = () => {
    const flipCards = document.querySelectorAll('.flip-card');
    if (!flipCards.length) return;
    const desktopMediaQuery = window.matchMedia(`(min-width: ${config.flipCards.desktopBreakpoint}px)`);
    const toggleFlipCardAriaHidden = (card, isActive) => {
      const frontContent = card.querySelector('.flip-card-front');
      const backContent = card.querySelector('.flip-card-back');
      if (frontContent) {
        frontContent.setAttribute('aria-hidden', isActive ? 'true' : 'false');
      }
      if (backContent) {
        backContent.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      }
    };
    flipCards.forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('a')) return;
        this.classList.toggle('active');
        if (!this.classList.contains('active')) {
            const el = this;
            // Use requestAnimationFrame so the class change is rendered before
            // blur() is called — this makes focus removal reliable on iOS/Android
            requestAnimationFrame(function() { el.blur(); });
        }
        const isActive = this.classList.contains('active');
        this.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        toggleFlipCardAriaHidden(this, isActive);
      });
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
    document.addEventListener('click', function(e) {
      if (desktopMediaQuery.matches && !e.target.closest('.flip-card')) {
        const activeCards = document.querySelectorAll('.flip-card.active');
        activeCards.forEach(card => {
          card.classList.remove('active');
          card.setAttribute('aria-pressed', 'false');
          toggleFlipCardAriaHidden(card, false);
        });
      }
    });
  };
  const initCounterAnimation = () => {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    const speed = 200;
    const runCounter = (counter) => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText.replace(/\D/g, '');
        const inc = target / speed;
        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 20);
        } else {
          const suffix = counter.getAttribute('data-suffix') || '';
          counter.innerText = target + suffix;
        }
      };
      updateCount();
    };
    counters.forEach(counter => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounter(counter);
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(counter);
    });
  };
  const initMobileFocusTrap = () => {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('#mainNav');
    if (!navbarToggler || !navbarCollapse) return;
    const getFocusableElements = () => {
      return navbarCollapse.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    };
    const handleFocusTrap = (e) => {
      if (!navbarCollapse.classList.contains('show')) return;
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (e.key === 'Tab' && e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      else if (e.key === 'Tab' && !e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    navbarCollapse.addEventListener('shown.bs.collapse', () => {
      document.addEventListener('keydown', handleFocusTrap);
      const firstFocusable = getFocusableElements()[0];
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    });
    navbarCollapse.addEventListener('hidden.bs.collapse', () => {
      document.removeEventListener('keydown', handleFocusTrap);
      navbarToggler.focus();
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('js-active');
    document.body.classList.add('js-active');
    initPreloader();
    initButtonAnimations();
    initScrollAnimations();
    initReadMore();
    initLanguageSwitcher();
    initFormValidation();
    initCounters();
    initTimelineSpotlight();
    initTimelineNew();
    initBootstrapComponents();
    initScrollProgress();
    initInstagramModal();
    initSmoothScroll();
    initContactFormButtons();
    initHeroVideoToggle();
    initAngebotCards();
    initIbcHeadings();
    initFooterUtilities();
    initCsrfTokens();
    initFlipCards();
    initCounterAnimation();
    initMobileFocusTrap();
    initMobileNavOverlay();
    initMobileStickyCta();
    // Sicherheits-Timeout: Preloader nach 2000ms zwangsweise entfernen,
    // falls window.load in Chrome hängen bleibt.
    setTimeout(() => {
      const preloader = document.querySelector('.preloader');
      if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
        preloader.setAttribute('aria-hidden', 'true');
        setTimeout(() => { preloader.style.display = 'none'; }, 1000);
      }
      forceScrollUnlock();
    }, 2000);
  });
  const initCsrfTokens = () => {
    fetch('get_csrf.php')
      .then(response => {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return null;
        }
        return response.json();
      })
      .then(data => {
        if (data && data.token) {
          document.querySelectorAll('form').forEach(form => {
            if (!form.querySelector('input[name="csrf_token"]')) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'csrf_token';
                input.value = data.token;
                form.appendChild(input);
            }
          });
        }
      })
      .catch(e => {});
  };
  /**
   * Mobile Full-Screen Navigation Overlay
   *
   * On screens narrower than 992 px the standard Bootstrap collapse dropdown
   * is replaced by a full-screen frosted-glass overlay.  The overlay is
   * optimised for one-handed / thumb navigation:
   *   - Nav links are large (≥ 60 px) and centred on screen
   *   - A circular close button is anchored at the bottom of the screen
   *     where the thumb naturally rests
   *
   * The Bootstrap collapse event (show.bs.collapse) is intercepted and
   * prevented on mobile so the panel never appears; instead the custom
   * overlay opens.
   */
  const initMobileNavOverlay = () => {
    const toggler = document.querySelector('.navbar-toggler');
    const mainNav  = document.getElementById('mainNav');
    if (!toggler || !mainNav) return;

    const MOBILE_BP = 1200;
    const isMobile  = () => window.innerWidth < MOBILE_BP;

    /* ── Build overlay element ──────────────────────────────── */
    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Navigation');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.id = 'mobileNavOverlay';

    /* Clone nav list (not the collapse wrapper) */
    const navList = mainNav.querySelector('.navbar-nav');
    if (navList) {
      const navClone = navList.cloneNode(true);
      /* Remove IDs to avoid duplicates */
      navClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      /* Remove Bootstrap data-bs-toggle / data-bs-target so Bootstrap's
         dropdown JS does not try to manage the cloned dropdown inside the
         overlay – this prevents click-event interference on lang-items. */
      navClone.querySelectorAll('[data-bs-toggle], [data-bs-target]').forEach(el => {
        el.removeAttribute('data-bs-toggle');
        el.removeAttribute('data-bs-target');
      });
      navClone.className = 'mobile-nav-list';
      overlay.appendChild(navClone);
    }

    /* Close button anchored at the bottom for thumb reach */
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-nav-close-btn';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Menü schließen');
    closeBtn.innerHTML = '<span aria-hidden="true">&#x2715;</span>';
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    /* ── Open / close helpers ───────────────────────────────── */
    const openOverlay = () => {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      toggler.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-nav-open');
      /* Move focus into the overlay */
      const firstLink = overlay.querySelector('a[href]');
      if (firstLink) setTimeout(() => firstLink.focus(), 150);
    };

    const closeOverlay = () => {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      toggler.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-nav-open');
      /* Clear inline overflow / touch-action locks so the page can always be
         scrolled after the menu closes.  Clear both the shorthand (`overflow`)
         and the individual longhands so that any style set by another component
         (e.g. cookie-consent, FAB menu) via either form is fully removed. */
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.overflowX = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = '';
      document.documentElement.style.overflowX = '';
      document.documentElement.style.touchAction = '';
      toggler.focus();
    };

    /* ── Intercept Bootstrap collapse on mobile ─────────────── */
    /* Bootstrap uses event delegation on `document` for data-bs-toggle="collapse".
     * Calling stopPropagation() on the toggler's bubble-phase click event prevents
     * it from ever reaching Bootstrap's document listener, giving us full control
     * on mobile.  The show.bs.collapse listener below acts as a safety net for any
     * programmatic Bootstrap calls (e.g. via JS API). */

    toggler.addEventListener('click', (e) => {
      if (!isMobile()) return;

      e.stopPropagation(); /* Prevent Bootstrap's document-level handler */

      if (overlay.classList.contains('is-open')) {
        closeOverlay();
      } else {
        openOverlay();
      }
    });

    /* Safety net – prevent Bootstrap showing the panel if triggered via JS */
    mainNav.addEventListener('show.bs.collapse', (e) => {
      if (isMobile()) {
        e.preventDefault();
      }
    });

    mainNav.addEventListener('hide.bs.collapse', (e) => {
      if (isMobile()) {
        e.preventDefault();
      }
    });

    /* ── Additional close triggers ──────────────────────────── */
    closeBtn.addEventListener('click', closeOverlay);

    /* Escape key */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeOverlay();
      }
    });

    /* Clicking the backdrop (outside nav-list / close-btn) closes the overlay.
       This lets mouse and touch users dismiss the menu without needing to find
       the close button, and also unblocks body overflow:hidden scroll lock. */
    overlay.addEventListener('click', (e) => {
      if (!e.target.closest('.mobile-nav-list') &&
          !e.target.closest('.mobile-nav-close-btn')) {
        closeOverlay();
      }
    });

    /* Clicking a nav link navigates away – close first.
       Lang-items are handled separately below so they are excluded here. */
    overlay.querySelectorAll('a[href]:not(.lang-item)').forEach(link => {
      link.addEventListener('click', closeOverlay);
    });

    /* Language switching inside the overlay.
     *
     * The overlay is built by cloning the desktop navbar, which happens at
     * DOMContentLoaded.  The language-switcher module attaches its per-element
     * click listeners only to elements that exist when its async translations
     * fetch resolves – a race condition that can fire before or after the
     * overlay clone is created.
     *
     * Using event delegation here guarantees that language switching always
     * works regardless of script-load or fetch timing:
     *   1. e.preventDefault() stops the <a href="?lang=…"> fallback navigation.
     *   2. window.ibcLanguageSwitcher.switchLanguage() applies the new language
     *      in-place (SPA-style, no page reload).
     *   3. If the switcher is not ready yet, we fall back to URL navigation.
     *   4. The overlay is closed afterwards.
     */
    overlay.addEventListener('click', (e) => {
      const langItem = e.target.closest('.lang-item[data-lang]');
      if (!langItem) return;
      e.preventDefault();
      const targetLang = langItem.getAttribute('data-lang');
      if (targetLang) {
        if (window.ibcLanguageSwitcher) {
          window.ibcLanguageSwitcher.switchLanguage(targetLang);
        } else {
          /* Fallback: hard-navigate to the language URL.
             'de' is the site default so it uses no ?lang= parameter. */
          console.warn('ibcLanguageSwitcher not ready – falling back to URL navigation for lang:', targetLang);
          const url = new URL(window.location.href);
          if (targetLang === 'de') {
            url.searchParams.delete('lang');
          } else {
            url.searchParams.set('lang', targetLang);
          }
          window.location.href = url.toString();
          return; /* page is navigating – skip closeOverlay */
        }
      }
      closeOverlay();
    });

    /* Close when viewport grows beyond mobile breakpoint */
    window.addEventListener('resize', () => {
      if (!isMobile() && overlay.classList.contains('is-open')) {
        closeOverlay();
      }
    }, { passive: true });
  };

  /**
   * Mobile Sticky CTA (Toast Pop-up)
   *
   * Zeigt einen „Projekt anfragen"-Button als dezentes Toast-Pop-up
   * am unteren linken Bildschirmrand, nachdem der Nutzer 15 Sekunden
   * auf der Seite verbracht hat. Enthält einen Schließen-Button und
   * merkt sich die Entscheidung für die Sitzung.
   */
  function initMobileStickyCta() {
    const stickyCta = document.getElementById('mobile-sticky-cta');
    if (!stickyCta) return;

    const SHOW_DELAY = 15000;
    const HIDE_TRANSITION_DURATION = 350;
    const SESSION_KEY = 'ibc-cta-dismissed';

    // Don't show again if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const closeBtn = stickyCta.querySelector('.mobile-cta-close');

    function showCta() {
      // Start from the hidden state so the CSS transition can
      // animate from is-hidden → visible.  The double rAF ensures
      // display:block and is-hidden are both committed to the style
      // before we remove is-hidden, giving the transition a defined
      // starting point.
      stickyCta.classList.add('is-hidden');
      stickyCta.style.display = 'block';
      stickyCta.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          stickyCta.classList.remove('is-hidden');
        });
      });
    }

    function hideCta() {
      stickyCta.classList.add('is-hidden');
      stickyCta.setAttribute('aria-hidden', 'true');
      sessionStorage.setItem(SESSION_KEY, '1');
      setTimeout(() => {
        if (stickyCta.classList.contains('is-hidden')) {
          stickyCta.style.display = 'none';
        }
      }, HIDE_TRANSITION_DURATION);
    }

    setTimeout(showCta, SHOW_DELAY);

    if (closeBtn) {
      closeBtn.addEventListener('click', hideCta);
    }
  }
})();
