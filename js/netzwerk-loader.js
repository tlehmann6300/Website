/**
 * Netzwerk-Loader-Modul
 *
 * Lädt die Inhalte der drei Netzwerk-Sektionen jeweils aus einer
 * eigenen JSON-Datei und rendert sie dynamisch in unser-netzwerk.html:
 *
 *  - assets/data/foerderkreis_data.json       → Förderkreismitglieder
 *  - assets/data/kuratorium_data.json         → Kuratorium
 *  - assets/data/kooperationspartner_data.json → Kooperationspartner
 *
 * Dadurch können neue Einträge hinzugefügt werden, ohne den HTML-Code
 * der Seite unser-netzwerk.html zu bearbeiten.
 *
 * Abhängigkeiten:
 *  - assets/data/translations/translations.json  (via language-switcher.js)
 *  - js/language-switcher.js          (Übersetzungen & ibcLanguageSwitcher-API)
 *  - js/content-loader.js             (optional – wird NICHT vorausgesetzt)
 *
 * @module NetzwerkLoader
 */
(function () {
    'use strict';

    /* ── Hilfsfunktion: JSON laden ─────────────────────────────────── */
    async function fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return await response.json();
        } catch (err) {
            console.error('[NetzwerkLoader] Fehler beim Laden von ' + url + ':', err);
            return null;
        }
    }

    /* ── Hilfsfunktion: Übersetzung holen ──────────────────────────── */
    function getTranslation(key, lang) {
        if (
            window.ibcLanguageSwitcher &&
            typeof window.ibcLanguageSwitcher.getTranslation === 'function'
        ) {
            const t = window.ibcLanguageSwitcher.getTranslation(key);
            if (t && !t.startsWith('[')) return t;
        }
        return '';
    }

    /* ── HTML-Escaping (Sicherheit) ────────────────────────────────── */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeIconClass(iconClass) {
        const value = String(iconClass || '').trim();
        if (/^[a-z0-9\- ]+$/i.test(value)) return value;
        return 'fa-solid fa-circle';
    }

    /* ══════════════════════════════════════════════════════════════════
       §1  FÖRDERKREISMITGLIEDER – Flip-Cards
       Hinweis: Bildpfade werden direkt aus foerderkreis_data.json gelesen
       und per src-Attribut gesetzt. Das ist bewusst so gewählt, weil
       content-loader.js's updateGenericMediaElements() Punkt-Pfade
       benötigt (z.B. "partners.mlp") und Bindestriche nicht auflösen
       kann. Die JSON-Datei ist dadurch vollständig eigenständig und
       benötigt keine Abhängigkeit auf media_config.json.
    ══════════════════════════════════════════════════════════════════ */
    function renderFoerderkreis(members) {
        const container = document.getElementById('foerderkreis-list');
        if (!container || !Array.isArray(members) || members.length === 0) return;

        container.innerHTML = members.map(function (member, index) {
            var delay = (index + 1) * 100;
            var safeAlt  = escapeHtml(member.altText  || '');
            var safeImg  = escapeHtml(member.image    || '');

            return (
                '<li class="col-lg-6 col-md-6 fade-in-up"' +
                '    data-animation-delay="' + delay + 'ms">' +
                '  <div class="fk-card">' +
                '    <div class="fk-card__logo-area">' +
                '      <img loading="lazy" src="' + safeImg + '"' +
                '           alt="' + safeAlt + '" class="fk-card__logo">' +
                '    </div>' +
                '    <div class="fk-card__body">' +
                '      <h3 class="fk-card__name"' +
                '          data-i18n="' + escapeHtml(member.nameI18nKey) + '"></h3>' +
                '      <p class="fk-card__desc"' +
                '         data-i18n="' + escapeHtml(member.descI18nKey) + '"></p>' +
                '    </div>' +
                '  </div>' +
                '</li>'
            );
        }).join('');
    }

    /* ══════════════════════════════════════════════════════════════════
       §2  KURATORIUM – Horizontale Einzelkarten (übereinander gestapelt)
       Hinweis: Bildpfade werden direkt aus kuratorium_data.json gelesen
       (gleicher Grund wie bei §1 oben).
    ══════════════════════════════════════════════════════════════════ */
    function renderKuratorium(members) {
        const container = document.getElementById('kuratorium-grid');
        if (!container || !Array.isArray(members) || members.length === 0) return;

        const cards = members.map(function (member, index) {
            const delay = index * 120;
            const safeAlt = escapeHtml(member.altText || '');
            const safeImg = escapeHtml(member.image || '');

            return (
                '<div class="col-md-6 col-lg-4 fade-in-up" data-animation-delay="' + delay + 'ms">' +
                '  <article class="kurat-card">' +
                '    <div class="kurat-card__img-wrap">' +
                '      <img loading="lazy" src="' + safeImg + '"' +
                '           alt="' + safeAlt + '" class="kurat-card__img">' +
                '      <span class="kurat-card__role-badge">' +
                '        <i class="fas fa-graduation-cap" aria-hidden="true"></i>' +
                '        <span data-i18n="network-curators-role-label">Kuratorium</span>' +
                '      </span>' +
                '    </div>' +
                '    <div class="kurat-card__body">' +
                '      <h3 class="kurat-card__name" data-i18n="' + escapeHtml(member.nameI18nKey) + '"></h3>' +
                '      <blockquote class="kurat-card__quote"' +
                '          data-i18n="' + escapeHtml(member.quoteI18nKey) + '"></blockquote>' +
                '      <p class="kurat-card__subjects">' +
                '        <i class="fas fa-book-open" aria-hidden="true"></i>' +
                '        <span data-i18n="' + escapeHtml(member.subjectsI18nKey) + '"></span>' +
                '      </p>' +
                '    </div>' +
                '  </article>' +
                '</div>'
            );
        }).join('');

        container.innerHTML = '<div class="row g-4">' + cards + '</div>';
    }

    function renderKooperationspartner(partnersData) {
        const introElement = document.getElementById('kooperationspartner-intro');
        const listElement = document.getElementById('kooperationspartner-list');
        const cards = partnersData && Array.isArray(partnersData.cards) ? partnersData.cards : [];

        if (!introElement || !listElement || cards.length === 0) return;

        if (partnersData.introI18nKey) {
            introElement.setAttribute('data-i18n', escapeHtml(partnersData.introI18nKey));
        }

        listElement.innerHTML = cards.map(function (partner, index) {
            const delay = (index + 1) * 100;
            const iconClass = sanitizeIconClass(partner.iconClass);

            return (
                '<div class="col-sm-6 col-lg-4 fade-in-up" data-animation-delay="' + delay + 'ms">' +
                '  <div class="coop-card">' +
                '    <div class="coop-card__icon">' +
                '      <i class="' + iconClass + '" aria-hidden="true"></i>' +
                '    </div>' +
                '    <h3 class="coop-card__title" data-i18n="' + escapeHtml(partner.titleI18nKey) + '"></h3>' +
                '    <p class="coop-card__text" data-i18n="' + escapeHtml(partner.descI18nKey) + '"></p>' +
                '  </div>' +
                '</div>'
            );
        }).join('');
    }

    /* ── Scroll-Animationen für neu gerenderte Elemente ────────────── */
    function observeFadeInElements() {
        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        const delay = entry.target.dataset.animationDelay || '0ms';
                        entry.target.style.transitionDelay = delay;
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08 }
        );

        document.querySelectorAll('.fade-in-up:not(.is-visible)').forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ── Übersetzungen nach dem Rendern anwenden ────────────────────── */
    function applyTranslations() {
        if (
            window.ibcLanguageSwitcher &&
            typeof window.ibcLanguageSwitcher.applyTranslations === 'function'
        ) {
            window.ibcLanguageSwitcher.applyTranslations();
        }
    }

    /* ── Haupt-Initialisierung ──────────────────────────────────────── */
    async function init() {
        const [foerderkreisData, kuratoriumData, kooperationspartnerData] =
            await Promise.all([
                fetchJSON('assets/data/foerderkreis_data.json'),
                fetchJSON('assets/data/kuratorium_data.json'),
                fetchJSON('assets/data/kooperationspartner_data.json')
            ]);

        renderFoerderkreis(foerderkreisData && foerderkreisData.members);
        renderKuratorium(kuratoriumData && kuratoriumData.members);
        renderKooperationspartner(kooperationspartnerData);

        /* Übersetzungen auf die neu erstellten data-i18n-Elemente anwenden */
        applyTranslations();

        /* Scroll-Animationen registrieren */
        observeFadeInElements();
    }

    /* Warten bis DOM bereit ist */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* Bei Sprachwechsel Übersetzungen erneut anwenden */
    window.addEventListener('languageChanged', applyTranslations);
})();
