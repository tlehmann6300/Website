(() => {
    /* ── Elemente ─────────────────────────────────────────────── */
    const navbar           = document.getElementById('navbar');
    const scrollProgress   = document.getElementById('scrollProgress');
    const mobileToggle     = document.getElementById('mobileToggle');
    const mobileMenu       = document.getElementById('mobileMenu');
    const mobileOverlay    = document.getElementById('mobileOverlay');
    const mobileHandle     = document.getElementById('mobileHandle');
    const themeToggle      = document.getElementById('themeToggle');
    const mobileThemeToggle= document.getElementById('mobileThemeToggle');
    const langBtn          = document.getElementById('langBtn');
    const langMenu         = document.getElementById('langMenu');
    const currentLangEl    = document.getElementById('currentLang');

    /* ══════════════════════════════════════════════════════════
       §1  LANGUAGE DROPDOWN — läuft unabhängig vom Rest
           (Kein gemeinsamer früher return mit dem Navbar-Block)
    ══════════════════════════════════════════════════════════ */
    if (langBtn && langMenu && currentLangEl) {

        /* Dropdown öffnen / schließen */
        langBtn.addEventListener('click', e => {
            e.stopPropagation();
            langMenu.classList.toggle('active');
        });

        /* Klick außerhalb schließt Dropdown */
        document.addEventListener('click', e => {
            if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
                langMenu.classList.remove('active');
            }
        });

        /* Sprache wählen */
        langMenu.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', e => {
                e.stopPropagation();
                const newLang = option.dataset.lang;
                if (!newLang) return;

                /* Aktiven Chip aktualisieren */
                langMenu.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentLangEl.textContent = newLang.toUpperCase();

                /* Dropdown schließen */
                langMenu.classList.remove('active');

                /* Sprachumschalter aufrufen (language-switcher.js) */
                if (window.ibcLanguageSwitcher &&
                    typeof window.ibcLanguageSwitcher.switchLanguage === 'function') {
                    window.ibcLanguageSwitcher.switchLanguage(newLang);
                } else {
                    /* Fallback: localStorage + Reload */
                    localStorage.setItem('language', newLang);
                    const url = new URL(window.location.href);
                    if (newLang === 'de') {
                        url.searchParams.delete('lang');
                    } else {
                        url.searchParams.set('lang', newLang);
                    }
                    window.location.href = url.toString();
                }
            });
        });

        /* Initial-Anzeige synchronisieren */
        const validLanguages = new Set(['de', 'en', 'fr']);
        const urlLang        = new URLSearchParams(window.location.search).get('lang');
        const storedLang     = localStorage.getItem('language');
        const switcherLang   = window.ibcLanguageSwitcher && window.ibcLanguageSwitcher.currentLang;
        const savedLang      = (validLanguages.has(switcherLang) ? switcherLang : null)
                            || (validLanguages.has(urlLang)    ? urlLang     : null)
                            || (validLanguages.has(storedLang) ? storedLang  : null)
                            || 'de';

        currentLangEl.textContent = savedLang.toUpperCase();
        langMenu.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === savedLang);
        });

        /* Escape schließt Dropdown */
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && langMenu.classList.contains('active')) {
                langMenu.classList.remove('active');
                langBtn.focus();
            }
        });
    }

    /* ══════════════════════════════════════════════════════════
       §2  NAVBAR / SCROLL / THEME / MOBILE — benötigt alle Elemente
    ══════════════════════════════════════════════════════════ */
    if (!navbar || !scrollProgress || !mobileToggle || !mobileMenu ||
        !mobileOverlay || !mobileHandle || !themeToggle || !mobileThemeToggle) return;

    /* Aktive Seite markieren */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        if (link.getAttribute('data-page') === currentPage) link.classList.add('active');
    });

    /* Scroll-Fortschrittsanzeige */
    let ticking = false;
    function updateScroll() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress.style.width = (window.pageYOffset / docHeight) * 100 + '%';
        if (window.pageYOffset > 50) {
            navbar.classList.remove('at-top');
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.add('at-top');
            navbar.classList.remove('scrolled');
        }
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { window.requestAnimationFrame(updateScroll); ticking = true; }
    });

    /* Theme-Toggle */
    function updateThemeToggleState(theme) {
        const isDark = theme === 'dark';
        const label  = isDark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren';
        [themeToggle, mobileThemeToggle].forEach(t => {
            t.setAttribute('aria-label', label);
            t.setAttribute('title', label);
            t.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        });
    }
    function applyTheme(theme) {
        if (window.IBCApp && window.IBCApp.Theme && typeof window.IBCApp.Theme.apply === 'function') {
            window.IBCApp.Theme.apply(theme);
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            localStorage.setItem('ibc-theme', theme);
        }
        updateThemeToggleState(theme);
    }
    function toggleTheme() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        const transition = document.getElementById('themeTransition');
        if (transition) transition.classList.add('active');
        setTimeout(() => {
            applyTheme(newTheme);
            setTimeout(() => { if (transition) transition.classList.remove('active'); }, 100);
        }, 300);
    }
    themeToggle.addEventListener('click', toggleTheme);
    mobileThemeToggle.addEventListener('click', toggleTheme);

    let prefersDark = false;
    try { prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch {}
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('ibc-theme') || (prefersDark ? 'dark' : 'light');
    applyTheme(savedTheme);

    /* Mobile Menu */
    function toggleMobileMenu() {
        const isActive = mobileMenu.classList.contains('active');
        if (isActive) {
            mobileMenu.classList.remove('active');
            setTimeout(() => { mobileOverlay.classList.remove('active'); document.body.style.overflow = ''; }, 300);
        } else {
            mobileOverlay.classList.add('active');
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        mobileToggle.classList.toggle('active');
    }
    mobileToggle.addEventListener('click', toggleMobileMenu);
    mobileOverlay.addEventListener('click', toggleMobileMenu);
    mobileHandle.addEventListener('click', toggleMobileMenu);
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => setTimeout(toggleMobileMenu, 300));
    });

    /* Swipe-to-close */
    let startY = 0;
    mobileMenu.addEventListener('touchstart', e => { startY = e.changedTouches[0].screenY; });
    mobileMenu.addEventListener('touchend',   e => {
        if (e.changedTouches[0].screenY > startY + 100) toggleMobileMenu();
    });

    /* Escape-Key für Mobile Menu */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) toggleMobileMenu();
    });
})();
