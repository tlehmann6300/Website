
document.addEventListener('DOMContentLoaded', () => {
    loadReferences();
});
async function loadReferences() {
    const container = document.getElementById('references-container');
    if (!container) return;
    try {
        const response = await fetch('assets/data/references_data.json');
        if (!response.ok) throw new Error('Daten konnten nicht geladen werden');
        const data = await response.json();
        const referencesByYear = data.references.reduce((acc, ref) => {
            if (ref.type === 'cta') return acc;
            const year = ref.year || 'Unknown';
            if (!acc[year]) acc[year] = [];
            acc[year].push(ref);
            return acc;
        }, {});
        const sortedYears = Object.keys(referencesByYear).sort((a, b) => b - a);
        container.innerHTML = '';
        sortedYears.forEach(year => {
            const yearSection = document.createElement('div');
            yearSection.className = 'timeline-year-section';
            const yearMarker = document.createElement('div');
            yearMarker.className = 'timeline-year-marker';
            yearMarker.innerHTML = `
                <h2>${year}</h2>
                <div class="timeline-dot"></div>
            `;
            const projectsContainer = document.createElement('div');
            projectsContainer.className = 'timeline-projects';
            referencesByYear[year].forEach((ref, index) => {
                const projectItem = document.createElement('div');
                projectItem.className = 'timeline-project-item';
                const card = createReferenceCard(ref);
                const projectDot = document.createElement('div');
                projectDot.className = 'project-dot';
                const projectEmpty = document.createElement('div');
                projectEmpty.className = 'project-empty';
                projectItem.appendChild(projectEmpty.cloneNode(true));
                projectItem.appendChild(projectDot);
                projectItem.appendChild(card);
                projectsContainer.appendChild(projectItem);
            });
            yearSection.appendChild(yearMarker);
            yearSection.appendChild(projectsContainer);
            container.appendChild(yearSection);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Referenzen:', error);
        container.innerHTML = '<p class="text-center">Referenzen konnten nicht geladen werden.</p>';
    }
}
function createReferenceCard(ref) {
    const card = document.createElement('div');
    card.className = 'ref-card';
    const urlParams = new URLSearchParams(window.location.search);
    const currentLang = urlParams.get('lang') || 'de';
    const title = ref.title[currentLang] || ref.title.de;
    const description = ref.description[currentLang] || ref.description.de;
    const categoryLabel = ref.category_label[currentLang] || ref.category_label.de;
    const imgPath = ref.image_url || (ref.image ? ref.image : 'assets/img/placeholder.webp');
    card.innerHTML = `
        <div class="ref-card-image">
            <img src="${imgPath}" alt="${title}" loading="lazy">
        </div>
        <div class="ref-card-content">
            <span class="ref-category">${categoryLabel || 'Projekt'}</span>
            <h3>${title}</h3>
            <p>${description}</p>
        </div>
    `;
    return card;
}
