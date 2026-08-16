
(function() {
    'use strict';
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    let displayYear = currentYear - 1;
    if (currentMonth === 11 && currentDay >= 10) {
        displayYear = currentYear;
    }
    function updateGluehweinstandButton() {
        const textSpan = document.getElementById('gluehweinstand-text');
        if (textSpan) {
            const currentLang = localStorage.getItem('language') || 'de';
            const text = currentLang === 'en'
                ? `Mulled Wine Stand ${displayYear}`
                : `Glühweinstand ${displayYear}`;
            textSpan.textContent = text;
        }
    }
    updateGluehweinstandButton();
    window.addEventListener('languageChanged', updateGluehweinstandButton);
})();
