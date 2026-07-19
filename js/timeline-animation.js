
document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    const TRIGGER_BOTTOM_RATIO = 0.85;
    const ACTIVE_THRESHOLD_RATIO = 0.45;
    const FOCUS_DISTANCE_THRESHOLD = 300;
    const timelineContainer = document.getElementById('timelineRefNew');
    const progressLine = document.getElementById('lineProgressNew');
    const timelineItemsNew = document.querySelectorAll('.timeline-item-new');
    let ticking = false;
    function updateTimeline() {
        if (!timelineContainer || !progressLine) return;
        const triggerBottom = window.innerHeight * TRIGGER_BOTTOM_RATIO;
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
            if (itemRect.top < (window.innerHeight * ACTIVE_THRESHOLD_RATIO)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            if (distance < minDistance && distance < FOCUS_DISTANCE_THRESHOLD) {
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
});
