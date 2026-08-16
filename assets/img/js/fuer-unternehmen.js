
document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSubpage = document.querySelector('.page-hero-section') !== null;
    const nav = document.querySelector('.navbar');
    const handleNavState = () => {
        if (nav && (isSubpage || window.scrollY > 50)) {
            nav.classList.add('scrolled');
        } else if (nav) {
            nav.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleNavState);
    handleNavState();
    if (!prefersReducedMotion) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.animationDelay || '0ms';
                    entry.target.style.transitionDelay = delay;
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            threshold: 0.1
        });
        document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    } else {
        document.querySelectorAll('.fade-in-up').forEach(el => {
            el.classList.add('is-visible', 'no-animation');
        });
    }
    const timelineContainer = document.getElementById('timelineRef');
    const progressLine = document.getElementById('lineProgress');
    const timelineItemsNew = document.querySelectorAll('.timeline-item-new');
    if (prefersReducedMotion) {
        timelineItemsNew.forEach(item => {
            item.classList.add('visible', 'active');
        });
        if (progressLine) {
            progressLine.style.height = '100%';
        }
    } else {
        let ticking = false;
        function updateTimeline() {
            if (!timelineContainer || !progressLine) return;
            const triggerBottom = window.innerHeight * 0.85;
            const containerRect = timelineContainer.getBoundingClientRect();
            const containerTop = containerRect.top + window.scrollY;
            const containerHeight = timelineContainer.offsetHeight;
            const viewportCenter = window.scrollY + (window.innerHeight / 2);
            let scrollPercent = ((viewportCenter - containerTop) / containerHeight) * 100;
            scrollPercent = Math.max(0, Math.min(100, scrollPercent));
            progressLine.style.height = `${scrollPercent}%`;
            let minDistance = window.innerHeight;
            let closestItem = null;
            timelineItemsNew.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.top + (itemRect.height / 2);
                const screenCenter = window.innerHeight / 2;
                const distance = Math.abs(screenCenter - itemCenter);
                if (itemRect.top < triggerBottom) {
                    item.classList.add('visible');
                }
                if (itemRect.top < (window.innerHeight * 0.45)) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
                if (distance < minDistance && distance < 300) {
                    minDistance = distance;
                    closestItem = item;
                }
            });
            timelineItemsNew.forEach(item => item.classList.remove('active-focus'));
            if (closestItem) {
                closestItem.classList.add('active-focus');
            }
            ticking = false;
        }
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateTimeline();
                });
                ticking = true;
            }
        });
        updateTimeline();
    }
});
