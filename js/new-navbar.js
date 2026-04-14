// Elemente
        const navbar = document.getElementById('navbar');
        const scrollProgress = document.getElementById('scrollProgress');
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const mobileHandle = document.getElementById('mobileHandle');
        const themeToggle = document.getElementById('themeToggle');
        const mobileThemeToggle = document.getElementById('mobileThemeToggle');
        const langBtn = document.getElementById('langBtn');
        const langMenu = document.getElementById('langMenu');
        // Aktive Seite markieren
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });
        // Scroll Handler
        let ticking = false;

        function updateScroll() {
            const currentScroll = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            scrollProgress.style.width = (currentScroll / docHeight) * 100 + '%';
            if (currentScroll > 50) {
                navbar.classList.remove('at-top');
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.add('at-top');
                navbar.classList.remove('scrolled');
            }
            ticking = false;
        }
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScroll);
                ticking = true;
            }
        });
        // Theme Toggle mit Kreis-Animation
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            const transition = document.getElementById('themeTransition');
            transition.classList.add('active');
            setTimeout(() => {
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                setTimeout(() => {
                    transition.classList.remove('active');
                }, 100);
            }, 300);
        }
        themeToggle.addEventListener('click', toggleTheme);
        mobileThemeToggle.addEventListener('click', toggleTheme);
        // Init Theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        // Mobile Menu
        function toggleMobileMenu() {
            const isActive = mobileMenu.classList.contains('active');
            if (isActive) {
                mobileMenu.classList.remove('active');
                setTimeout(() => {
                    mobileOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }, 300);
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
        // Swipe to close
        let startY = 0;
        mobileMenu.addEventListener('touchstart', e => startY = e.changedTouches[0].screenY);
        mobileMenu.addEventListener('touchend', e => {
            if (e.changedTouches[0].screenY > startY + 100) toggleMobileMenu();
        });
        // Language Switcher
        langBtn.addEventListener('click', e => {
            e.stopPropagation();
            langMenu.classList.toggle('active');
        });
        document.addEventListener('click', e => {
            if (!langBtn.contains(e.target)) langMenu.classList.remove('active');
        });
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove(
                'active'));
                option.classList.add('active');
                document.getElementById('currentLang').textContent = option.dataset.lang.toUpperCase();
                localStorage.setItem('language', option.dataset.lang);
                langMenu.classList.remove('active');
            });
        });
        // Init Language
        const savedLang = localStorage.getItem('language') || 'de';
        document.getElementById('currentLang').textContent = savedLang.toUpperCase();
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.lang === savedLang) opt.classList.add('active');
        });
        // Escape Key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (mobileMenu.classList.contains('active')) toggleMobileMenu();
                if (langMenu.classList.contains('active')) langMenu.classList.remove('active');
            }
        });
