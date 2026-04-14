
(function() {
    'use strict';
    const CONFIG = {
        dataPath: 'assets/data/alumnis_data.json',
        defaultDuration: 25000,
        defaultLang: 'de',
        focusableElementsSelector: 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    };
    let testimonialData = null;
    let currentLang = CONFIG.defaultLang;
    let isAutoplayEnabled = true;
    let animationFrameId = null;
    let startTime = 0;
    let elapsedTime = 0;
    let currentSlideIndex = 0;
    let isTransitioning = false;
    let abortController = null;
    function getCurrentLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && ['de', 'en', 'fr'].includes(langParam)) return langParam;
        const storedLang = localStorage.getItem('preferred-language') || localStorage.getItem('language');
        if (storedLang && ['de', 'en', 'fr'].includes(storedLang)) return storedLang;
        return CONFIG.defaultLang;
    }
    async function fetchTestimonialsData() {
        try {
            const response = await fetch(CONFIG.dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading testimonials data:', error);
            return null;
        }
    }
    function createSlideHTML(item, index, isActive, lang, labels) {
        const roleText = item.role[lang] || item.role['de'];
        const quoteText = item.text[lang] || item.text['de'];
        const activeClass = isActive ? 'active' : '';
        const sanitizedName = (item.name || '').trim();
        const initials = sanitizedName.split(' ').filter(n => n).map(n => n[0]).join('');
        const encodedInitials = encodeURIComponent(initials || '?');
        const fallbackImg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23609744' width='400' height='400'/%3E%3Ctext fill='%23ffffff' font-family='Arial,sans-serif' font-size='120' font-weight='bold' text-anchor='middle' x='200' y='240'%3E${encodedInitials}%3C/text%3E%3C/svg%3E`;
        const totalSlides = testimonialData?.slides?.length || 1;
        return `
            <div class="carousel-item ${activeClass}"
                 role="tabpanel"
                 id="testimonial-slide-${index}"
                 aria-labelledby="testimonial-tab-${index}"
                 aria-hidden="${!isActive}">
                <div class="tsv3-card">
                    <div class="tsv3-profile-col tsv3-fade tsv3-d1">
                        <div class="tsv3-avatar-frame">
                            <img src="${item.img}"
                                 alt="${item.name}"
                                 loading="${index === 0 ? 'eager' : 'lazy'}"
                                 onerror="this.onerror=null; this.src='${fallbackImg}';">
                        </div>
                        <div class="tsv3-stars" aria-label="5 von 5 Sternen">
                            <i class="fas fa-star" aria-hidden="true"></i><i class="fas fa-star" aria-hidden="true"></i><i class="fas fa-star" aria-hidden="true"></i><i class="fas fa-star" aria-hidden="true"></i><i class="fas fa-star" aria-hidden="true"></i>
                        </div>
                        <p class="tsv3-name">${item.name}</p>
                        <span class="tsv3-role-badge">${roleText}</span>
                    </div>
                    <div class="tsv3-quote-col">
                        <div class="tsv3-open-quote tsv3-fade tsv3-d1" aria-hidden="true">&ldquo;</div>
                        <blockquote class="tsv3-quote-text tsv3-fade tsv3-d2">
                            ${quoteText}
                        </blockquote>
                        <div class="tsv3-controls tsv3-fade tsv3-d3">
                            <button class="tsv3-ctrl-btn"
                                    data-action="prev"
                                    aria-label="${labels.prevSlide[lang] || labels.prevSlide['de']}">
                                <i class="fas fa-arrow-left" aria-hidden="true"></i>
                            </button>
                            <div class="tsv3-progress"
                                 role="progressbar"
                                 aria-valuenow="0"
                                 aria-valuemin="0"
                                 aria-valuemax="100"
                                 aria-label="Slide Fortschritt">
                                <div class="tsv3-progress-track">
                                    <div class="tsv3-progress-fill" id="testimonial-bar-${index}"></div>
                                </div>
                            </div>
                            <span class="tsv3-slide-counter" aria-hidden="true">${index + 1}&thinsp;/&thinsp;${totalSlides}</span>
                            <button class="tsv3-ctrl-btn"
                                    data-action="next"
                                    aria-label="${labels.nextSlide[lang] || labels.nextSlide['de']}">
                                <i class="fas fa-arrow-right" aria-hidden="true"></i>
                            </button>
                            <button class="tsv3-ctrl-btn tsv3-pause-btn"
                                    data-action="toggle"
                                    aria-label="${labels.playPause[lang] || labels.playPause['de']}"
                                    aria-pressed="${isAutoplayEnabled}">
                                <i class="fas ${isAutoplayEnabled ? 'fa-pause' : 'fa-play'}" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }
    function renderSlides() {
        const container = document.getElementById('ibcTestimonialTarget');
        if (!container || !testimonialData) return;
        const lang = getCurrentLanguage();
        const slides = testimonialData.slides;
        const labels = testimonialData.labels;
        const headingEl = document.getElementById('testimonial-section-heading');
        if (headingEl && labels.heading) {
            headingEl.innerHTML = labels.heading[lang] || labels.heading['de'];
        }
        const storiesLabel = document.getElementById('testimonial-stories-label');
        if (storiesLabel && labels.stories) {
            storiesLabel.textContent = labels.stories[lang] || labels.stories['de'];
        }
        container.innerHTML = '';
        slides.forEach((item, index) => {
            const isActive = index === currentSlideIndex;
            container.insertAdjacentHTML('beforeend', createSlideHTML(item, index, isActive, lang, labels));
        });
        attachControlListeners();
        updateFocusableElements();
    }
    function updateFocusableElements() {
        const slides = document.querySelectorAll('#ibcTestimonialTarget .carousel-item');
        slides.forEach((slide, i) => {
            const focusableElements = slide.querySelectorAll(CONFIG.focusableElementsSelector);
            if (i === currentSlideIndex) {
                focusableElements.forEach(el => {
                    el.removeAttribute('tabindex');
                });
            } else {
                focusableElements.forEach(el => {
                    el.setAttribute('tabindex', '-1');
                });
            }
        });
    }
    function attachControlListeners() {
        const container = document.getElementById('ibcTestimonialTarget');
        if (!container) return;
        container.querySelectorAll('.tsv3-ctrl-btn').forEach(btn => {
            btn.addEventListener('click', handleNavClick);
        });
    }
    function handleNavClick(e) {
        e.preventDefault();
        const action = e.currentTarget.dataset.action;
        if (action === 'toggle') {
            handleToggleClick(e);
            return;
        }
        resetAndStart();
        if (action === 'prev') {
            goToSlide(currentSlideIndex - 1);
        } else if (action === 'next') {
            goToSlide(currentSlideIndex + 1);
        }
    }
    function handleToggleClick(e) {
        e.preventDefault();
        isAutoplayEnabled = !isAutoplayEnabled;
        updateToggleIcons();
        if (isAutoplayEnabled) {
            startAnimation();
        } else {
            stopAnimation();
        }
    }
    function updateToggleIcons() {
        const icon = isAutoplayEnabled ? 'fa-pause' : 'fa-play';
        document.querySelectorAll('.tsv3-pause-btn i').forEach(i => {
            i.className = `fas ${icon}`;
        });
        document.querySelectorAll('.tsv3-pause-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', isAutoplayEnabled);
        });
    }
    function goToSlide(index) {
        if (isTransitioning) return;
        const slides = document.querySelectorAll('#ibcTestimonialTarget .carousel-item');
        if (!slides.length) return;
        isTransitioning = true;
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        // Force-reset the incoming slide's fade elements so the entry animation
        // always starts cleanly from opacity 0, regardless of any prior state.
        const targetSlide = slides[index];
        const fadeEls = targetSlide.querySelectorAll('.tsv3-fade');
        fadeEls.forEach(el => {
            el.style.transition = 'none';
            el.style.opacity = '0';
            el.style.transform = 'translateY(15px)';
        });
        // Reading offsetWidth forces the browser to flush pending style changes
        // and commit the reset state before the inline styles are removed.
        // Without this reflow the browser may batch the reset and the .active
        // addition into a single paint, skipping the transition start from zero.
        void targetSlide.offsetWidth;
        fadeEls.forEach(el => {
            el.style.removeProperty('transition');
            el.style.removeProperty('opacity');
            el.style.removeProperty('transform');
        });
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
            }
        });
        currentSlideIndex = index;
        updateFocusableElements();
        announceSlideChange();
        // 700 ms = carousel opacity transition (800 ms) minus a 100 ms buffer.
        // Prevents a second click from interrupting an in-flight animation.
        setTimeout(() => {
            isTransitioning = false;
        }, 700);
    }
    function announceSlideChange() {
        const liveRegion = document.getElementById('testimonial-live-region');
        if (liveRegion && testimonialData && testimonialData.slides) {
            const lang = getCurrentLanguage();
            if (currentSlideIndex >= 0 && currentSlideIndex < testimonialData.slides.length) {
                const currentSlide = testimonialData.slides[currentSlideIndex];
                if (currentSlide && currentSlide.name && currentSlide.role) {
                    const message = `${currentSlide.name}, ${currentSlide.role[lang] || currentSlide.role['de']}`;
                    liveRegion.textContent = message;
                }
            }
        }
    }
    function resetAndStart() {
        cancelAnimationFrame(animationFrameId);
        document.querySelectorAll('.tsv3-progress-fill').forEach(bar => {
            bar.style.transform = 'scaleX(0)';
            bar.style.width = '100%'; 
        });
        elapsedTime = 0;
        startTime = 0;
        if (isAutoplayEnabled) startAnimation();
    }
    function startAnimation() {
        if (!isAutoplayEnabled) return;
        startTime = performance.now() - elapsedTime;
        animationFrameId = requestAnimationFrame(updateProgress);
    }
    function stopAnimation() {
        cancelAnimationFrame(animationFrameId);
    }
    function updateProgress(timestamp) {
        if (!isAutoplayEnabled) return;
        
        const duration = testimonialData?.config?.duration || CONFIG.defaultDuration;
        elapsedTime = timestamp - startTime;
        
        // Berechnung des Fortschritts (0.0 bis 1.0)
        const progress = Math.min(elapsedTime / duration, 1);
        const percentage = progress * 100;
        
        const bar = document.getElementById(`testimonial-bar-${currentSlideIndex}`);
        if (bar) {
            // PERFORMANCE FIX: Nutze transform statt width
            // Wir müssen sicherstellen, dass die CSS-Regel transform-origin: left hat (siehe CSS Schritt 1)
            bar.style.width = '100%'; // Basisbreite setzen
            bar.style.transform = `scaleX(${progress})`; // Skalieren statt Breite ändern
            
            // Aria Attribute aktualisieren (weniger oft für Performance, z.B. nur ganze Zahlen)
            const roundedPercent = Math.round(percentage);
            if (bar.parentElement.parentElement.getAttribute('aria-valuenow') != roundedPercent) {
               bar.parentElement.parentElement.setAttribute('aria-valuenow', roundedPercent);
            }
        }
        
        if (elapsedTime >= duration) {
            goToSlide(currentSlideIndex + 1);
            resetAndStart();
        } else {
            animationFrameId = requestAnimationFrame(updateProgress);
        }
    }
    async function initTestimonialsSlider() {
        const container = document.getElementById('ibcTestimonialTarget');
        if (!container) return;
        cleanup();
        abortController = new AbortController();
        const signal = abortController.signal;
        testimonialData = await fetchTestimonialsData();
        if (!testimonialData) {
            console.error('Failed to load testimonials data');
            return;
        }
        currentLang = getCurrentLanguage();
        renderSlides();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            resetAndStart();
        } else {
            isAutoplayEnabled = false;
            updateToggleIcons();
        }
        const carousel = document.getElementById('ibcTestimonialsCarousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => {
                if (isAutoplayEnabled) stopAnimation();
            }, { signal });
            carousel.addEventListener('mouseleave', () => {
                if (isAutoplayEnabled) startAnimation();
            }, { signal });
            carousel.addEventListener('focusin', () => {
                if (isAutoplayEnabled) stopAnimation();
            }, { signal });
            carousel.addEventListener('focusout', () => {
                if (isAutoplayEnabled) startAnimation();
            }, { signal });
            carousel.addEventListener('keydown', handleKeydown, { signal });
            const intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (isAutoplayEnabled) startAnimation();
                    } else {
                        stopAnimation();
                    }
                });
            }, { threshold: 0.2 });
            intersectionObserver.observe(carousel);
        }
        document.addEventListener('visibilitychange', handleVisibilityChange, { signal });
        window.addEventListener('languageChanged', handleLanguageChange, { signal });
    }
    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            if (isAutoplayEnabled) startAnimation();
        } else {
            if (isAutoplayEnabled) stopAnimation();
        }
    }
    function handleLanguageChange() {
        currentLang = getCurrentLanguage();
        renderSlides();
        if (isAutoplayEnabled) resetAndStart();
    }
    function cleanup() {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        stopAnimation();
        isTransitioning = false;
    }
    function handleKeydown(e) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                resetAndStart();
                goToSlide(currentSlideIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                resetAndStart();
                goToSlide(currentSlideIndex + 1);
                break;
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                isAutoplayEnabled = !isAutoplayEnabled;
                updateToggleIcons();
                if (isAutoplayEnabled) startAnimation();
                else stopAnimation();
                break;
        }
    }
    window.ibcTestimonialsSlider = {
        init: initTestimonialsSlider,
        goToSlide,
        toggleAutoplay: () => {
            isAutoplayEnabled = !isAutoplayEnabled;
            updateToggleIcons();
            if (isAutoplayEnabled) startAnimation();
            else stopAnimation();
        },
        getData: () => testimonialData,
        cleanup
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTestimonialsSlider);
    } else {
        initTestimonialsSlider();
    }
})();