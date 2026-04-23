/**
 * References-Loader
 *
 * Lädt Referenzen aus assets/data/references_data.json und rendert sie
 * in das neue ref-grid Layout (referenzen.html v3-Redesign).
 *
 * Funktionen:
 *  - Dynamische Kategorie-Filter-Chips (.ref-chip)
 *  - Karten mit Jahr-Badge, Kategorie-Badge, Testimonial-Quote
 *  - Ergebnis-Zähler (#ref-result-count)
 *  - Leer-Zustand (#ref-empty)
 *  - Sprach-Support (de / en / fr)
 *  - Scroll-Animationen (IntersectionObserver)
 */
(function () {
    'use strict';

    /* ── Aktuelle Sprache ──────────────────────────────────────────── */
    function getCurrentLang() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam === 'en' || langParam === 'fr' || langParam === 'de') return langParam;
        if (window.ibcLanguageSwitcher && typeof window.ibcLanguageSwitcher.getCurrentLanguage === 'function') {
            return window.ibcLanguageSwitcher.getCurrentLanguage();
        }
        const stored = localStorage.getItem('language') || localStorage.getItem('ibc-language');
        if (stored === 'en' || stored === 'fr') return stored;
        return 'de';
    }

    /* ── HTML escaping ─────────────────────────────────────────────── */
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ── Übersetzungs-Hilfsobjekt ─────────────────────────────────── */
    const UI_STRINGS = {
        de: {
            allProjects: 'Alle Projekte',
            resultSingular: 'Projekt gefunden',
            resultPlural: 'Projekte gefunden',
            noResults: 'Keine Projekte in dieser Kategorie gefunden.',
            noResultsSub: 'Bitte wählen Sie eine andere Kategorie.',
            errorLoad: 'Referenzen konnten nicht geladen werden.',
            learnMore: 'Mehr erfahren',
            testimonialLabel: 'Kundenstimme'
        },
        en: {
            allProjects: 'All Projects',
            resultSingular: 'project found',
            resultPlural: 'projects found',
            noResults: 'No projects found in this category.',
            noResultsSub: 'Please choose a different category.',
            errorLoad: 'References could not be loaded.',
            learnMore: 'Learn more',
            testimonialLabel: 'Client feedback'
        },
        fr: {
            allProjects: 'Tous les projets',
            resultSingular: 'projet trouvé',
            resultPlural: 'projets trouvés',
            noResults: 'Aucun projet trouvé dans cette catégorie.',
            noResultsSub: 'Veuillez choisir une autre catégorie.',
            errorLoad: 'Les références n\'ont pas pu être chargées.',
            learnMore: 'En savoir plus',
            testimonialLabel: 'Témoignage client'
        }
    };

    function t(key) {
        const lang = getCurrentLang();
        const dict = UI_STRINGS[lang] || UI_STRINGS.de;
        return dict[key] || UI_STRINGS.de[key] || key;
    }

    /* ── Scroll-Animationen ────────────────────────────────────────── */
    function observeCards() {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.animationDelay || '0ms';
                    entry.target.style.transitionDelay = delay;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.06 });

        document.querySelectorAll('.ref-card.fade-in-up:not(.is-visible)').forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ── Ergebnis-Zähler aktualisieren ────────────────────────────── */
    function updateResultCount(count) {
        const el = document.getElementById('ref-result-count');
        if (!el) return;
        if (count === 0) {
            el.textContent = '';
        } else {
            const label = count === 1 ? t('resultSingular') : t('resultPlural');
            el.textContent = count + ' ' + label;
        }
    }

    /* ── Leer-Zustand ein/ausblenden ──────────────────────────────── */
    function setEmptyState(visible) {
        const el = document.getElementById('ref-empty');
        if (!el) return;
        if (visible) {
            el.removeAttribute('hidden');
        } else {
            el.setAttribute('hidden', '');
        }
    }

    /* ── Einzelne Referenz-Karte erstellen ────────────────────────── */
    function createReferenceCard(ref, index) {
        const lang = getCurrentLang();
        const title       = (ref.title       && (ref.title[lang]        || ref.title.de))        || '';
        const description = (ref.description && (ref.description[lang]  || ref.description.de))  || '';
        const catLabel    = (ref.category_label && (ref.category_label[lang] || ref.category_label.de)) || ref.category || '';
        const testimonial = (ref.testimonial  && (ref.testimonial[lang]  || ref.testimonial.de))  || '';
        const imgPath     = ref.image_url || ref.image || 'assets/img/placeholder.webp';
        const link        = ref.link || 'kontakt.html';
        const year        = ref.year || '';
        const delay       = (index * 80) + 'ms';

        const card = document.createElement('article');
        card.className  = 'ref-card fade-in-up';
        card.dataset.category = ref.category || '';
        card.dataset.year     = year;
        card.dataset.animationDelay = delay;

        /* ── Image block ── */
        let yearBadge = year
            ? '<span class="ref-card-year" aria-label="Jahr ' + esc(year) + '">' + esc(year) + '</span>'
            : '';

        /* ── Testimonial block ── */
        let quoteBlock = '';
        if (testimonial) {
            quoteBlock = '<blockquote class="ref-card-quote">' + esc(testimonial) + '</blockquote>';
        }

        card.innerHTML =
            '<div class="ref-card-image">' +
            '  <img src="' + esc(imgPath) + '" alt="' + esc(title) + '" loading="lazy">' +
            '  ' + yearBadge +
            '</div>' +
            '<div class="ref-card-content">' +
            '  <span class="ref-category">' + esc(catLabel) + '</span>' +
            '  <h3><a href="' + esc(link) + '">' + esc(title) + '</a></h3>' +
            '  <p>' + esc(description) + '</p>' +
            '  ' + quoteBlock +
            '</div>';

        return card;
    }

    /* ── Filter-Chips rendern ─────────────────────────────────────── */
    function renderFilterChips(categories, lang, allCards) {
        const container = document.getElementById('category-filter-container');
        if (!container) return;

        /* "Alle Projekte"-Chip als erstes, bereits im HTML vorhanden – ersetzen */
        container.innerHTML =
            '<button class="ref-chip ref-chip--active" data-filter="all">' +
            '  <i class="fas fa-th-large" aria-hidden="true"></i>' +
            '  ' + t('allProjects') +
            '</button>';

        const catList = (categories && (categories[lang] || categories.de)) || [];
        catList.forEach(function (cat) {
            const btn = document.createElement('button');
            btn.className = 'ref-chip';
            btn.dataset.filter = cat;
            btn.textContent = cat;
            container.appendChild(btn);
        });

        /* Click-Handler */
        container.addEventListener('click', function (e) {
            const chip = e.target.closest('.ref-chip');
            if (!chip) return;

            /* Aktiven Chip wechseln */
            container.querySelectorAll('.ref-chip').forEach(function (c) {
                c.classList.remove('ref-chip--active');
            });
            chip.classList.add('ref-chip--active');

            const filter = chip.dataset.filter;
            filterCards(filter, allCards);
        });
    }

    /* ── Karten filtern ───────────────────────────────────────────── */
    function filterCards(filter, allCards) {
        let visibleCount = 0;

        allCards.forEach(function (card, i) {
            const match = filter === 'all' || card.dataset.category === filter;
            if (match) {
                card.style.display = '';
                /* Stagger-Delay für sichtbare Karten neu berechnen */
                card.dataset.animationDelay = (visibleCount * 80) + 'ms';
                /* Scroll-Animation zurücksetzen, damit sie erneut feuert */
                card.classList.remove('is-visible');
                card.style.transitionDelay = '0ms';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        updateResultCount(visibleCount);
        setEmptyState(visibleCount === 0);

        /* Animationen für die nun sichtbaren Karten neu beobachten */
        setTimeout(observeCards, 50);
    }

    /* ── Haupt-Ladefunktion ───────────────────────────────────────── */
    async function loadReferences() {
        const container = document.getElementById('references-container');
        if (!container) return;

        try {
            const response = await fetch('assets/data/references_data.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();

            const lang = getCurrentLang();
            const refs = (data.references || []).filter(function (r) { return r.type !== 'cta'; });

            /* Container leeren (Skeleton entfernen) */
            container.innerHTML = '';

            /* Alle Karten erstellen und einfügen */
            const allCards = refs.map(function (ref, i) {
                return createReferenceCard(ref, i);
            });

            allCards.forEach(function (card) {
                container.appendChild(card);
            });

            /* Filter-Chips rendern */
            renderFilterChips(data.filterOptions && data.filterOptions.categories, lang, allCards);

            /* Initial-Zähler */
            updateResultCount(allCards.length);
            setEmptyState(allCards.length === 0);

            /* Scroll-Animationen starten */
            observeCards();

        } catch (err) {
            console.error('[ReferencesLoader] Fehler:', err);
            container.innerHTML =
                '<p class="text-center py-5" style="grid-column:1/-1">' + t('errorLoad') + '</p>';
        }
    }

    /* ── Sprachumschaltung: Karten neu rendern ───────────────────── */
    window.addEventListener('languageChanged', function () {
        loadReferences();
    });

    /* ── Start ────────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadReferences);
    } else {
        loadReferences();
    }
})();
