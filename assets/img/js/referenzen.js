
document.addEventListener('DOMContentLoaded', () => {
    loadReferences();
    initializeHeadingAnimation();
});
const STAGGER_DELAY_MS = 50;
const DISPLAY_RENDER_DELAY_MS = 10;
const SHOW_ANIMATION_DURATION_MS = 500;
let allReferences = [];
let currentLang = 'de';
let ctaCard = null;
let activeFilters = {
    category: 'all',
    year: 'all'
};
async function loadReferences() {
    const grid = document.getElementById('references-grid');
    if (!grid) return;
    try {
        const response = await fetch('assets/data/references_data.json');
        if (!response.ok) throw new Error('Failed to load references');
        const data = await response.json();
        const urlParams = new URLSearchParams(window.location.search);
        currentLang = urlParams.get('lang') || 'de';
        const references = data.references || [];
        ctaCard = references.find(ref => ref.type === 'cta');
        allReferences = references.filter(ref => ref.type !== 'cta');
        generateCategoryFilters(allReferences);
        generateYearFilters(allReferences);
        renderReferencesWithCTA(allReferences, ctaCard);
        initializeFilters();
        initializeScrollAnimations();
    } catch (error) {
        console.error('Error loading references:', error);
        grid.innerHTML = '<p class="text-center">Referenzen konnten nicht geladen werden.</p>';
    }
}
function handleImageError(imgElement) {
    if (imgElement) {
        imgElement.style.display = 'none';
        imgElement.setAttribute('alt', 'Bild konnte nicht geladen werden');
        const container = imgElement.closest('.project-card-image');
        if (container) {
            container.style.minHeight = '0';
        }
    }
}
function escapeHtml(text) {
    if (text == null) return '';
    const str = String(text);
    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return str.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}
function isSafeUrl(url) {
    if (!url) return false;
    const urlStr = String(url).trim();
    const MAX_PATH_TRAVERSALS = 2;
    const urlLower = urlStr.toLowerCase();
    if (urlLower.startsWith('javascript:') ||
        urlLower.startsWith('data:') ||
        urlLower.startsWith('vbscript:') ||
        urlLower.startsWith('file:')) {
        return false;
    }
    if (urlStr.startsWith('/') || urlStr.startsWith('./') || urlStr.startsWith('../')) {
        if (urlStr.startsWith('//')) {
            return false;
        }
        if ((urlStr.match(/\.\.\//g) || []).length > MAX_PATH_TRAVERSALS) {
            return false;
        }
        return true;
    }
    if (urlStr.includes('://')) {
        try {
            const parsed = new URL(urlStr);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }
    return true;
}
function generateCategoryFilters(references) {
    const filterContainer = document.getElementById('category-filter-container');
    if (!filterContainer) return;
    const categoryMap = new Map();
    references.forEach(ref => {
        if (ref.category && typeof ref.category === 'string' && ref.category.trim() !== '') {
            const label = ref.category_label?.[currentLang] || ref.category_label?.de || ref.category;
            categoryMap.set(ref.category, label);
        }
    });
    const sortedCategories = [...categoryMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    filterContainer.innerHTML = '';
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn active';
    allButton.setAttribute('data-filter-type', 'category');
    allButton.setAttribute('data-filter-value', 'all');
    allButton.setAttribute('aria-pressed', 'true');
    allButton.setAttribute('aria-label', getTranslation('filter-all-categories'));
    allButton.textContent = getTranslation('filter-all');
    filterContainer.appendChild(allButton);
    sortedCategories.forEach(([key, label]) => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.setAttribute('data-filter-type', 'category');
        button.setAttribute('data-filter-value', key);
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `${getTranslation('filter-by-category')} ${label}`);
        button.textContent = label;
        filterContainer.appendChild(button);
    });
}
function generateYearFilters(references) {
    const filterContainer = document.getElementById('year-filter-container');
    if (!filterContainer) return;
    const years = [...new Set(
        references
            .map(ref => ref.year)
            .filter(year => year && year.toString().trim() !== '')
    )].sort((a, b) => b - a);
    filterContainer.innerHTML = '';
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn active';
    allButton.setAttribute('data-filter-type', 'year');
    allButton.setAttribute('data-filter-value', 'all');
    allButton.setAttribute('aria-pressed', 'true');
    allButton.setAttribute('aria-label', getTranslation('filter-all-years'));
    allButton.textContent = getTranslation('filter-all');
    filterContainer.appendChild(allButton);
    years.forEach(year => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.setAttribute('data-filter-type', 'year');
        button.setAttribute('data-filter-value', year);
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `${getTranslation('filter-by-year')} ${year}`);
        button.textContent = year;
        filterContainer.appendChild(button);
    });
}
function getTranslation(key) {
    const translations = {
        'filter-all': {
            de: 'Alle',
            en: 'All',
            fr: 'Tous'
        },
        'filter-all-categories': {
            de: 'Alle Kategorien anzeigen',
            en: 'Show all categories',
            fr: 'Afficher toutes les catégories'
        },
        'filter-all-years': {
            de: 'Alle Jahre anzeigen',
            en: 'Show all years',
            fr: 'Afficher toutes les années'
        },
        'filter-by-category': {
            de: 'Filtern nach Kategorie:',
            en: 'Filter by category:',
            fr: 'Filtrer par catégorie :'
        },
        'filter-by-year': {
            de: 'Filtern nach Jahr:',
            en: 'Filter by year:',
            fr: 'Filtrer par année :'
        },
        'cta-aria-label': {
            de: 'Kontakt aufnehmen',
            en: 'Contact us',
            fr: 'Contactez-nous'
        }
    };
    return translations[key]?.[currentLang] || translations[key]?.de || key;
}
function renderReferencesWithCTA(references, cta) {
    const grid = document.getElementById('references-grid');
    grid.innerHTML = '';
    const cardsToRender = [...references];
    let ctaPosition = -1;
    if (cta && cardsToRender.length > 2) {
        const maxPosition = Math.min(8, cardsToRender.length);
        const minPosition = 2;
        ctaPosition = Math.floor(Math.random() * (maxPosition - minPosition)) + minPosition;
        cardsToRender.splice(ctaPosition, 0, cta);
    }
    cardsToRender.forEach((ref, index) => {
        let card;
        if (ref.type === 'cta') {
            card = createCTACard(ref);
        } else {
            card = createProjectCard(ref);
        }
        card.classList.add('reveal-fx');
        card.style.setProperty('--animation-delay', `${index * 0.1}s`);
        grid.appendChild(card);
    });
}
function createProjectCard(ref) {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.setAttribute('data-category', ref.category || '');
    card.setAttribute('data-year', ref.year || '');
    const title = ref.title?.[currentLang] || ref.title?.de || 'Untitled Project';
    const description = ref.description?.[currentLang] || ref.description?.de || '';
    const categoryLabel = ref.category_label?.[currentLang] || ref.category_label?.de || ref.category || 'Projekt';
    const clientName = ref.client_name || title;
    let imgPath = ref.image_url || ref.image || 'assets/img/placeholder.webp';
    if (!isSafeUrl(imgPath)) {
        console.warn('Invalid URL in reference data, using fallback');
        imgPath = 'assets/img/placeholder.webp';
    }
    const altText = ref.client_name ? `${clientName} Logo` : `Projekt: ${title}`;
    const escapedImgPath = escapeHtml(imgPath);
    const escapedAltText = escapeHtml(altText);
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description);
    const escapedCategoryLabel = escapeHtml(categoryLabel);
    const escapedYear = ref.year ? escapeHtml(ref.year.toString()) : '';
    const escapedYearLabel = ref.year ? escapeHtml(getTranslation('filter-by-year')) : '';
    card.innerHTML = `
        <div class="project-card-image">
            <img src="${escapedImgPath}" alt="${escapedAltText}" loading="lazy" onerror="handleImageError(this)">
        </div>
        <div class="project-card-content">
            ${ref.year ? `<div class="project-year-badge" aria-label="${escapedYearLabel} ${escapedYear}">${escapedYear}</div>` : ''}
            <span class="project-category">${escapedCategoryLabel}</span>
            <h3>${escapedTitle}</h3>
            <p>${escapedDescription}</p>
        </div>
    `;
    return card;
}
function createCTACard(ref) {
    const card = document.createElement('div');
    card.className = 'cta-card';
    card.setAttribute('data-type', 'cta');
    const title = ref.title?.[currentLang] || ref.title?.de || 'Ihr Projekt hier?';
    const description = ref.description?.[currentLang] || ref.description?.de || '';
    const buttonText = ref.button_text?.[currentLang] || ref.button_text?.de || 'Zur Kontaktseite';
    let link = ref.link || 'kontakt.html';
    if (!isSafeUrl(link)) {
        console.warn('Invalid URL in CTA card, using fallback');
        link = 'kontakt.html';
    }
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description);
    const escapedButtonText = escapeHtml(buttonText);
    const escapedLink = escapeHtml(link);
    card.innerHTML = `
        <div class="cta-icon">
            <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
        </div>
        <h3>${escapedTitle}</h3>
        <p>${escapedDescription}</p>
        <a href="${escapedLink}" class="cta-button" aria-label="${escapedButtonText}">
            ${escapedButtonText}
            <i class="fa-solid fa-arrow-right arrow-icon" aria-hidden="true"></i>
        </a>
    `;
    return card;
}
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.getAttribute('data-filter-type');
            const filterValue = button.getAttribute('data-filter-value');
            const siblingButtons = document.querySelectorAll(`.filter-btn[data-filter-type="${filterType}"]`);
            siblingButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            activeFilters[filterType] = filterValue;
            filterReferences();
        });
    });
}
function filterReferences() {
    const cards = document.querySelectorAll('.project-card, .cta-card');
    cards.forEach(card => {
        if (card.animationTimeout) {
            clearTimeout(card.animationTimeout);
            delete card.animationTimeout;
        }
    });
    cards.forEach((card, index) => {
        const cardCategory = card.getAttribute('data-category');
        const cardYear = card.getAttribute('data-year');
        const isCTA = card.classList.contains('cta-card');
        if (isCTA) {
            showCard(card, index);
            return;
        }
        const categoryMatch = activeFilters.category === 'all' || cardCategory === activeFilters.category;
        const yearMatch = activeFilters.year === 'all' || cardYear === activeFilters.year;
        if (categoryMatch && yearMatch) {
            showCard(card, index);
        } else {
            hideCard(card);
        }
    });
}
function showCard(card, index) {
    card.style.display = '';
    // Cancel any pending clear-inline-styles timeout from a previous show
    if (card._showClearTimeout) {
        clearTimeout(card._showClearTimeout);
        delete card._showClearTimeout;
    }
    setTimeout(() => {
        card.style.transition = `opacity ${SHOW_ANIMATION_DURATION_MS}ms ease, transform ${SHOW_ANIMATION_DURATION_MS}ms ease`;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        card.classList.remove('hidden');
        // After the animation finishes, remove inline styles so CSS
        // hover/active transitions can apply without being blocked.
        card._showClearTimeout = setTimeout(() => {
            card.style.transition = '';
            card.style.opacity = '';
            card.style.transform = '';
            delete card._showClearTimeout;
        }, SHOW_ANIMATION_DURATION_MS + 20);
    }, DISPLAY_RENDER_DELAY_MS);
}
function hideCard(card) {
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-10px) scale(0.95)';
    card.animationTimeout = setTimeout(() => {
        card.classList.add('hidden');
        card.style.display = 'none';
        delete card.animationTimeout;
    }, 300);
}
function initializeScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);
    const cards = document.querySelectorAll('.project-card, .cta-card');
    cards.forEach(card => observer.observe(card));
}
function initializeHeadingAnimation() {
    const heading = document.querySelector('.ibc-heading');
    if (!heading) return;
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    observer.observe(heading);
}
