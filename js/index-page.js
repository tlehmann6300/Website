
(function() {
    'use strict';
    const initCompetenciesAccordion = () => {
        const accordionGroup = document.getElementById('competenciesAccordionGroup');
        if (!accordionGroup) return;
        const triggers = accordionGroup.querySelectorAll('.competency-card__trigger');
        const cards = accordionGroup.querySelectorAll('.competency-card');
        const toggleCard = (card, trigger) => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            cards.forEach(c => {
                if (c !== card) {
                    c.classList.remove('is-active');
                    const btn = c.querySelector('.competency-card__trigger');
                    if (btn) {
                        btn.setAttribute('aria-expanded', 'false');
                    }
                }
            });
            if (isExpanded) {
                card.classList.remove('is-active');
                trigger.setAttribute('aria-expanded', 'false');
            } else {
                card.classList.add('is-active');
                trigger.setAttribute('aria-expanded', 'true');
            }
        };
        triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', () => {
                const card = trigger.closest('.competency-card');
                toggleCard(card, trigger);
            });
            trigger.addEventListener('keydown', (e) => {
                const key = e.key;
                const length = triggers.length;
                let targetIndex = index;
                if (key === 'ArrowDown') {
                    e.preventDefault();
                    targetIndex = (index + 1) % length;
                    triggers[targetIndex].focus();
                } else if (key === 'ArrowUp') {
                    e.preventDefault();
                    targetIndex = (index - 1 + length) % length;
                    triggers[targetIndex].focus();
                } else if (key === 'Home') {
                    e.preventDefault();
                    triggers[0].focus();
                } else if (key === 'End') {
                    e.preventDefault();
                    triggers[length - 1].focus();
                }
            });
        });
        cards.forEach(card => {
            const imageWrapper = card.querySelector('.competency-card__image-wrapper');
            const trigger = card.querySelector('.competency-card__trigger');
            if (imageWrapper && trigger) {
                imageWrapper.addEventListener('click', () => {
                    toggleCard(card, trigger);
                });
            }
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.competency-card')) {
                cards.forEach(c => {
                    c.classList.remove('is-active');
                    const btn = c.querySelector('.competency-card__trigger');
                    if (btn) {
                        btn.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
    };
    const initInfoCardsAnimation = () => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const infoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        infoObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
            document.querySelectorAll('.info-stagger-in').forEach(el => infoObserver.observe(el));
        } else {
            document.querySelectorAll('.info-stagger-in').forEach(el => el.classList.add('is-visible'));
        }
    };
    const initPhysicsCardsTilt = () => {
        return;
    };
    const initFooterUtilities = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
        const copyBanner = document.getElementById('copy-banner');
        const emailLinks = document.querySelectorAll('.copy-email-link');
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
                        alert(`Kopieren fehlgeschlagen. Bitte manuell kopieren: ${email}`);
                    });
                } else {
                    alert(`Kopieren nicht unterstützt. Bitte manuell kopieren: ${email}`);
                }
            });
        });
    };
    const initStatsSection = () => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.innerWidth < 768;
        const COUNTER_DURATION_MS = 500;
        const STAGGER_DELAY_MS = 150;
        const popoverTriggerList = document.querySelectorAll('#stats-section [data-bs-toggle="popover"]');
        const popoverInstances = [];
        popoverTriggerList.forEach(el => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
                const popover = new bootstrap.Popover(el, {
                    trigger: isMobile ? 'click' : 'hover focus',
                    html: true,
                    animation: !prefersReducedMotion,
                    offset: [0, 12]
                });
                popoverInstances.push({ element: el, popover: popover });
                el.addEventListener('shown.bs.popover', () => el.setAttribute('aria-expanded', 'true'));
                el.addEventListener('hidden.bs.popover', () => el.setAttribute('aria-expanded', 'false'));
            }
        });
        if (isMobile && popoverInstances.length > 0) {
            window.addEventListener('scroll', () => {
                popoverInstances.forEach(({ popover }) => {
                    popover.hide();
                });
            }, { passive: true });
            document.addEventListener('click', (e) => {
                popoverInstances.forEach(({ element, popover }) => {
                    const isClickInside = element.contains(e.target);
                    const popoverElement = document.querySelector('.popover');
                    const isClickOnPopover = popoverElement && popoverElement.contains(e.target);
                    if (!isClickInside && !isClickOnPopover) {
                        popover.hide();
                    }
                });
            }, { passive: true });
        }
        const animateCounter = (element) => {
            const target = +element.getAttribute('data-target');
            const suffix = element.getAttribute('data-suffix') || '';
            const animatedSpan = element.querySelector('.counter-animated');
            if (!animatedSpan) return;
            if (prefersReducedMotion) {
                animatedSpan.textContent = target + suffix;
                return;
            }
            let startTime = null;
            const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / COUNTER_DURATION_MS, 1);
                const easedProgress = easeOutExpo(progress);
                const current = Math.round(easedProgress * target);
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
                    const cards = entry.target.querySelectorAll('#stats-section .row > [class*="col-"]');
                    cards.forEach((col, index) => {
                        const delay = index * STAGGER_DELAY_MS;
                        setTimeout(() => {
                            const fadeEl = col.querySelector('.fade-in-up');
                            if (fadeEl) fadeEl.classList.add('visible');
                            const counter = col.querySelector('.stat-number');
                            if (counter && !counter.classList.contains('animated')) {
                                counter.classList.add('animated');
                                animateCounter(counter);
                            }
                        }, delay);
                    });
                    statsObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.25,
            rootMargin: "0px"
        });
        const statsSection = document.getElementById('stats-section');
        if (statsSection) statsObserver.observe(statsSection);
    };
    document.addEventListener('DOMContentLoaded', () => {
        initCompetenciesAccordion();
        initInfoCardsAnimation();
        initPhysicsCardsTilt();
        initFooterUtilities();
        initStatsSection();
        initCompetencyCarousel();
        initNavFab();
    });

    /**
     * Mobile Competency Carousel
     *
     * On screens narrower than 768 px the competency cards grid is
     * transformed into a horizontal swipe carousel with scroll-snap and
     * a visual "peek" effect that reveals the leading edge of the next card.
     * Pagination dots + card counter below the carousel reflect the active slide.
     * Expanded accordion items auto-close when a new card scrolls into view.
     */
    function initCompetencyCarousel() {
        const MOBILE_BREAKPOINT = 768; /* Horizontal swipe carousel on mobile */
        const grid = document.getElementById('competenciesAccordionGroup');
        const dotsContainer = document.getElementById('competencyCarouselDots');
        const hintEl = document.getElementById('competencyCarouselHint');
        if (!grid) return;

        let isCarousel = false;
        let counterEl = null;
        let scrollTimer = null;

        function getCards() {
            return grid.querySelectorAll('.competency-card');
        }

        function buildDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            getCards().forEach((_, i) => {
                const btn = document.createElement('button');
                btn.className = 'competency-carousel-dot' + (i === 0 ? ' is-active' : '');
                btn.setAttribute('aria-label', `Karte ${i + 1}`);
                btn.setAttribute('type', 'button');
                btn.addEventListener('click', () => {
                    scrollToCard(i);
                });
                dotsContainer.appendChild(btn);
            });
        }

        function buildCounter() {
            if (!dotsContainer) return;
            if (!counterEl) {
                counterEl = document.createElement('p');
                counterEl.className = 'competency-carousel-counter';
                dotsContainer.parentNode.insertBefore(counterEl, dotsContainer.nextSibling);
            }
            updateCounter(0);
        }

        function updateCounter(activeIndex) {
            if (!counterEl) return;
            const total = getCards().length;
            counterEl.innerHTML = `<span class="current">${activeIndex + 1}</span>&thinsp;/&thinsp;${total}`;
        }

        function scrollToCard(index) {
            const cards = getCards();
            if (!cards[index]) return;
            const cardLeft = cards[index].offsetLeft;
            grid.scrollTo({ left: cardLeft - 20, behavior: 'smooth' });
        }

        function getActiveIndex() {
            const cards = getCards();
            const scrollLeft = grid.scrollLeft;
            let closest = 0;
            let minDist = Infinity;
            cards.forEach((card, i) => {
                const dist = Math.abs(card.offsetLeft - 20 - scrollLeft);
                if (dist < minDist) {
                    minDist = dist;
                    closest = i;
                }
            });
            return closest;
        }

        /* Close any open accordion panels that are not in the current visible card */
        function closeOffscreenAccordions(activeIndex) {
            const cards = getCards();
            cards.forEach((card, i) => {
                if (i === activeIndex) return;
                if (card.classList.contains('is-active')) {
                    const trigger = card.querySelector('.competency-card__trigger');
                    if (trigger) trigger.click();
                }
            });
        }

        /* Mark the card at activeIndex as visually active (pops forward).
           Uses a dedicated class so the carousel position is decoupled
           from the accordion open/close state (which uses .is-active). */
        function updateActiveCard(activeIndex) {
            getCards().forEach((card, i) => {
                card.classList.toggle('is-carousel-active', i === activeIndex);
            });
        }

        function updateActiveDot() {
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.competency-carousel-dot');
            const activeIndex = getActiveIndex();
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === activeIndex);
            });
            updateActiveCard(activeIndex);
            updateCounter(activeIndex);

            /* Debounce accordion close until scroll settles.
               Capture activeIndex now so the timeout uses the value
               at scroll time rather than recalculating after the delay. */
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                closeOffscreenAccordions(activeIndex);
            }, 300);
        }

        function enableCarousel() {
            if (isCarousel) return;
            isCarousel = true;
            grid.classList.add('swipe-carousel');
            if (dotsContainer) dotsContainer.style.display = '';
            if (hintEl) hintEl.style.display = '';
            buildDots();
            buildCounter();
            updateActiveCard(0);
            grid.addEventListener('scroll', updateActiveDot, { passive: true });
        }

        function disableCarousel() {
            if (!isCarousel) return;
            isCarousel = false;
            grid.classList.remove('swipe-carousel');
            if (dotsContainer) dotsContainer.style.display = 'none';
            if (hintEl) hintEl.style.display = 'none';
            if (dotsContainer) dotsContainer.innerHTML = '';
            if (counterEl) { counterEl.remove(); counterEl = null; }
            getCards().forEach(card => card.classList.remove('is-carousel-active'));
            grid.removeEventListener('scroll', updateActiveDot);
            if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null; }
        }

        function checkBreakpoint() {
            if (window.innerWidth < MOBILE_BREAKPOINT) {
                enableCarousel();
            } else {
                disableCarousel();
            }
        }

        // Hide hint and dots initially (JS will show them when needed)
        if (dotsContainer) dotsContainer.style.display = 'none';
        if (hintEl) hintEl.style.display = 'none';

        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint, { passive: true });
    }

    /**
     * Floating Action Button (FAB) Navigation
     *
     * On mobile, once the user scrolls past the navbar, the hamburger
     * toggler fades out and a circular FAB appears in the bottom-right
     * corner. Tapping the FAB toggles a full-screen overlay menu.
     */
    function initNavFab() {
        const fab = document.getElementById('nav-fab');
        const overlay = document.getElementById('fab-overlay-menu');
        const navbar = document.querySelector('.navbar');
        if (!fab || !overlay) return;

        const MOBILE_BREAKPOINT = 992; // matches navbar-expand-lg
        const SCROLL_THRESHOLD = 80;
        let rafPending = false;
        let isOpen = false;

        // Cache first focusable element inside the overlay for focus management
        function getFocusableItems() {
            return overlay.querySelectorAll(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
        }

        function showFab() {
            fab.style.display = 'flex';
            requestAnimationFrame(() => fab.classList.add('is-visible'));
            document.body.classList.add('fab-active');
        }

        function hideFab() {
            fab.classList.remove('is-visible');
            document.body.classList.remove('fab-active');
            // Wait for CSS transition then hide display
            setTimeout(() => {
                if (!fab.classList.contains('is-visible')) {
                    fab.style.display = 'none';
                }
            }, 300);
        }

        function openMenu() {
            isOpen = true;
            fab.classList.add('menu-open');
            fab.setAttribute('aria-expanded', 'true');
            fab.setAttribute('aria-label', 'Menü schließen');
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-hidden', 'false');
            // Force reflow before adding is-open for CSS transition
            // eslint-disable-next-line no-unused-expressions
            overlay.offsetHeight;
            overlay.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            // Focus first nav link
            const items = getFocusableItems();
            if (items.length) items[0].focus();
        }

        function closeMenu() {
            isOpen = false;
            fab.classList.remove('menu-open');
            fab.setAttribute('aria-expanded', 'false');
            fab.setAttribute('aria-label', 'Menü öffnen');
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            setTimeout(() => {
                if (!overlay.classList.contains('is-open')) {
                    overlay.style.display = 'none';
                }
            }, 350);
        }

        function updateFab() {
            const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
            if (!isMobile) {
                hideFab();
                if (isOpen) closeMenu();
                rafPending = false;
                return;
            }

            const scrollY = window.pageYOffset;
            if (scrollY > SCROLL_THRESHOLD) {
                showFab();
            } else {
                hideFab();
                if (isOpen) closeMenu();
            }
            rafPending = false;
        }

        // FAB click – toggle menu
        fab.addEventListener('click', () => {
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu when a nav link is clicked
        overlay.querySelectorAll('.fab-nav-list a').forEach(link => {
            link.addEventListener('click', () => closeMenu());
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
                fab.focus();
            }
        });

        // Focus trap inside overlay
        overlay.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const items = Array.from(getFocusableItems());
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // Scroll / resize listeners
        window.addEventListener('scroll', () => {
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(updateFab);
            }
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(updateFab);
            }
        }, { passive: true });

        // Initial state
        fab.style.display = 'none';
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        updateFab();
    }})();
