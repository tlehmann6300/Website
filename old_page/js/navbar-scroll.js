/**
 * Aktive Seite in der Navbar markieren.
 *
 * Setzt aria-current="page" auf den Nav-Link, dessen href mit dem
 * aktuellen Dateinamen übereinstimmt. So bleibt die Navbar auf allen
 * Seiten identisch und die Markierung wird dynamisch gesetzt.
 */
(function () {
    'use strict';

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar .nav-link[href]').forEach(function (link) {
        if (link.getAttribute('href') === currentFile) {
            link.setAttribute('aria-current', 'page');
        }
    });
})();

/**
 * Navbar-Scroll-Effekt (Mobile-First)
 *
 * Fügt ab 50 px Scroll-Tiefe die Klasse .scrolled an die Navbar,
 * entfernt sie wieder wenn der Nutzer nach oben scrollt.
 *
 * - { passive: true } erlaubt dem Browser Scroll-Compositing zu optimieren.
 * - requestAnimationFrame drosselt DOM-Writes auf einen pro Frame.
 * - Zustandswächter verhindert unnötige Style-Recalculations.
 *
 * @module NavbarScroll
 */
(function () {
    'use strict';

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const SCROLL_THRESHOLD = 50;
    let rafId = null;
    let lastState = null;

    function updateNavbar() {
        rafId = null;
        const scrolled = (window.pageYOffset || document.documentElement.scrollTop) > SCROLL_THRESHOLD;
        if (scrolled === lastState) return;
        lastState = scrolled;
        navbar.classList.toggle('scrolled', scrolled);
    }

    function onScroll() {
        if (rafId === null) {
            rafId = requestAnimationFrame(updateNavbar);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Initialen Zustand setzen (z. B. bei Hard-Reload mitten auf der Seite)
    updateNavbar();
})();

/**
 * Overflow-Cleanup nach Schließen des mobilen Navigations-Overlays.
 *
 * Entfernt inline overflow/touch-action-Sperren von <body> und <html>,
 * sobald die Klasse 'mobile-nav-open' entfernt wird.
 */
(function () {
    'use strict';

    if (!('MutationObserver' in window)) return;

    const mo = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
            if (mutations[i].attributeName === 'class' &&
                !document.body.classList.contains('mobile-nav-open')) {
                document.body.style.overflow = '';
                document.body.style.overflowY = '';
                document.body.style.overflowX = '';
                document.body.style.touchAction = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.overflowY = '';
                document.documentElement.style.overflowX = '';
                document.documentElement.style.touchAction = '';
                break;
            }
        }
    });

    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

/**
 * Sofortiges Schließen des mobilen Menüs bei Anker-Link-Klicks.
 *
 * Wenn ein Anker-Link (#ziel) angeklickt wird und das mobile Menü
 * geöffnet ist, wird das Menü synchron geschlossen, bevor der Browser
 * den Scroll-Vorgang startet – verhindert Ruckler durch gleichzeitige
 * Overlay-Animation und Scroll-Bewegung.
 */
(function () {
    'use strict';

    document.addEventListener('click', function (e) {
        /* Only act when the mobile overlay is actually open */
        if (!document.body.classList.contains('mobile-nav-open')) return;

        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        /* Only handle in-page anchor links (e.g. href="#section") */
        if (!href.startsWith('#') || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        /* Prevent the default jump so we can close the menu first */
        e.preventDefault();

        /* Synchronously close the mobile overlay: clear the open class and
           any inline overflow/touch-action locks so the page is immediately
           scrollable. The overlay CSS transition (opacity 0.3s) will fade it
           out on its own while the scroll proceeds — no jitter. */
        document.body.classList.remove('mobile-nav-open');
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.body.style.overflowX = '';
        document.body.style.touchAction = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowY = '';
        document.documentElement.style.overflowX = '';
        document.documentElement.style.touchAction = '';

        /* Defer the scroll by one rAF so the browser processes the class
           removal and overflow reset before starting the scroll animation. */
        requestAnimationFrame(function () {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, true /* capture phase – runs before other handlers */);
})();

