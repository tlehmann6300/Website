
(function() {
    'use strict';
    const CONFIG = {
        basePath: 'assets/data/',
        files: {
            externalLinks: 'external_links.json',
            mediaConfig: 'media_config.json',
            teamData: 'team_data.json'
        },
        MAX_ANIMATION_DELAY_MS: 10000
    };
    const dataCache = {
        externalLinks: null,
        mediaConfig: null,
        teamData: null
    };
    async function fetchJSON(filename) {
        try {
            const response = await fetch(CONFIG.basePath + filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Fehler beim Laden von ${filename}:`, error);
            return null;
        }
    }
    function isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const trimmedUrl = url.trim();
        if (!/^(https?:\/\/|mailto:)/i.test(trimmedUrl)) {
            return false;
        }
        try {
            if (trimmedUrl.toLowerCase().startsWith('mailto:')) {
                const mailtoPrefix = 'mailto:';
                const email = trimmedUrl.substring(mailtoPrefix.length);
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            }
            new URL(trimmedUrl);
            return true;
        } catch (e) {
            return false;
        }
    }
    function safeSetHref(element, url) {
        if (element && url && isValidUrl(url)) {
            element.setAttribute('href', url);
            return true;
        }
        if (element && url && !isValidUrl(url)) {
            console.warn('SECURITY: Blocked invalid URL:', url);
        }
        return false;
    }
    function getCurrentLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam) return langParam;
        const storedLang = localStorage.getItem('preferred-language') || localStorage.getItem('language');
        if (storedLang) return storedLang;
        const htmlLang = document.documentElement.getAttribute('lang');
        if (htmlLang) return htmlLang;
        return 'de';
    }
    async function loadExternalLinks() {
        if (!dataCache.externalLinks) {
            dataCache.externalLinks = await fetchJSON(CONFIG.files.externalLinks);
        }
        const data = dataCache.externalLinks;
        if (!data) return;
        const socialMappings = {
            'link-facebook': data.socialMedia?.facebook,
            'link-instagram': data.socialMedia?.instagram,
            'link-linkedin': data.socialMedia?.linkedin
        };
        for (const [id, url] of Object.entries(socialMappings)) {
            const elements = document.querySelectorAll(`[id="${id}"], [data-link-id="${id}"]`);
            elements.forEach(el => {
                safeSetHref(el, url);
            });
        }
        const formMappings = {
            'link-event-registration': data.forms?.eventRegistration
        };
        for (const [id, url] of Object.entries(formMappings)) {
            const el = document.getElementById(id);
            safeSetHref(el, url);
        }
        /**
         * External page mappings - supports both id and data-link-id attributes
         * 
         * Note: Using querySelectorAll with both [id] and [data-link-id] selectors allows:
         * - id: For unique elements (backward compatibility)
         * - data-link-id: For multiple elements with same link (e.g., footer in multiple pages)
         * 
         * Prefer data-link-id for new implementations as it's more flexible
         */
        const externalMappings = {
            'link-sharepoint': data.externalPages?.sharepoint,
            'link-gluehweinstand': data.externalPages?.gluehweinstandPost,
            'gluehweinstand-btn': data.externalPages?.gluehweinstandPost,
            'link-instagram-cta': data.externalPages?.instagramCtaPost,
            'link-maps': data.externalPages?.mapsLocation
        };
        
        /**
         * Polyfill for CSS.escape if not available (older browsers)
         * This ensures safe escaping of CSS selector strings
         * 
         * Note: This is a simplified polyfill for the expected use cases (alphanumeric IDs with hyphens).
         * For production use with arbitrary user input, consider a more complete polyfill like:
         * https://github.com/mathiasbynens/CSS.escape
         * 
         * Current usage is safe as all ID values are controlled and follow naming conventions:
         * - link-sharepoint, link-maps, etc.
         */
        const cssEscape = CSS.escape || function(value) {
            // Basic escaping for CSS identifiers
            // Replace special characters that have meaning in CSS selectors
            return value.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
        };
        
        for (const [id, url] of Object.entries(externalMappings)) {
            // Escape the id to safely use in CSS selectors
            const escapedId = cssEscape(id);
            const elements = document.querySelectorAll(`[id="${escapedId}"], [data-link-id="${escapedId}"]`);
            elements.forEach(el => {
                safeSetHref(el, url);
            });
        }
        const partnerMappings = {
            'link-vdu': data.partnerWebsites?.vduFurtwangen,
            'link-gvo': data.partnerWebsites?.gvo,
            'link-easyverein': data.partnerWebsites?.easyVerein
        };
        for (const [id, url] of Object.entries(partnerMappings)) {
            const el = document.getElementById(id);
            safeSetHref(el, url);
        }
        updateIframes(data);
    }
    function updateIframes(data) {
        const idToKeyMap = {
            'google_maps_embed': 'googleMaps'
        };
        const iframeElements = document.querySelectorAll('[data-iframe-id]');
        iframeElements.forEach(iframe => {
            const iframeId = iframe.getAttribute('data-iframe-id');
            if (iframeId && data.iframes) {
                const jsonKey = idToKeyMap[iframeId] || iframeId;
                if (data.iframes[jsonKey] && isValidUrl(data.iframes[jsonKey])) {
                    iframe.setAttribute('src', data.iframes[jsonKey]);
                }
            }
        });
        const mapsIframe = document.getElementById('iframe-google-maps');
        if (mapsIframe && data.iframes?.googleMaps && isValidUrl(data.iframes.googleMaps)) {
            mapsIframe.setAttribute('src', data.iframes.googleMaps);
        }
        const instagramIframes = document.querySelectorAll('[data-instagram-embed]');
        if (instagramIframes.length > 0 && data.iframes?.instagramEmbeds) {
            instagramIframes.forEach((iframe, index) => {
                if (data.iframes.instagramEmbeds[index] && isValidUrl(data.iframes.instagramEmbeds[index])) {
                    // DSGVO 2-click: store URL as data attribute; let consent overlay handle loading
                    const wrap = iframe.closest('.instagram-frame-wrap');
                    const hasOverlay = wrap && wrap.querySelector('.ig-consent-overlay');
                    if (hasOverlay) {
                        iframe.setAttribute('data-src', data.iframes.instagramEmbeds[index]);
                    } else {
                        iframe.setAttribute('src', data.iframes.instagramEmbeds[index]);
                    }
                }
            });
        }
    }
    async function loadMediaConfig() {
        if (!dataCache.mediaConfig) {
            dataCache.mediaConfig = await fetchJSON(CONFIG.files.mediaConfig);
        }
        const data = dataCache.mediaConfig;
        if (!data) return;
        updateFavicons(data);
        const headerLogos = document.querySelectorAll('[data-media-id="header-logo"]');
        headerLogos.forEach(img => {
            if (data.header?.logo) img.setAttribute('src', data.header.logo);
        });
        const footerLogos = document.querySelectorAll('[data-media-id="footer-logo"]');
        footerLogos.forEach(img => {
            if (data.footer?.logo) img.setAttribute('src', data.footer.logo);
        });
        updateVideoElements(data);
        updateParallaxBackgrounds(data);
        updatePartnerLogos(data);
        updateTestimonialImages(data);
        updateStudentImages(data);
        updateGenericMediaElements(data);
        updateIcons(data);
        injectBackgroundStyles(data);
    }
    const FONT_AWESOME_PREFIXES = ['fas', 'fab', 'far', 'fal', 'fad', 'fa-solid', 'fa-brands', 'fa-regular', 'fa-light', 'fa-duotone'];
    const DEFAULT_PLACEHOLDER_ICON = 'fas fa-question-circle';
    function updateIcons(data) {
        const iconElements = document.querySelectorAll('[data-icon-id]');
        if (iconElements.length === 0) return;
        requestAnimationFrame(() => {
            iconElements.forEach(element => {
                const iconId = element.getAttribute('data-icon-id');
                if (!iconId) return;
                let iconValue = data?.icons?.[iconId];
                if (!iconValue || iconValue.trim() === '') {
                    const existingClasses = Array.from(element.classList);
                    const hasExistingIcon = existingClasses.some(cls =>
                        cls.startsWith('fa-') || FONT_AWESOME_PREFIXES.includes(cls)
                    );
                    if (!hasExistingIcon) {
                        iconValue = DEFAULT_PLACEHOLDER_ICON;
                    } else {
                        return;
                    }
                }
                if (iconValue.includes('.')) {
                    if (element.tagName === 'I') {
                        const img = document.createElement('img');
                        img.src = iconValue;
                        img.alt = iconId;
                        img.className = element.className;
                        element.parentNode.replaceChild(img, element);
                    } else if (element.tagName === 'IMG') {
                        element.setAttribute('src', iconValue);
                        element.setAttribute('alt', iconId);
                    }
                } else {
                    if (element.tagName === 'IMG') {
                        const iconEl = document.createElement('i');
                        iconEl.className = element.className;
                        element.parentNode.replaceChild(iconEl, element);
                        element = iconEl;
                    }
                    const classes = iconValue.split(' ').filter(Boolean);
                    const existingClasses = Array.from(element.classList);
                    existingClasses.forEach(cls => {
                        if (cls.startsWith('fa-') || FONT_AWESOME_PREFIXES.includes(cls)) {
                            element.classList.remove(cls);
                        }
                    });
                    classes.forEach(cls => element.classList.add(cls));
                }
            });
        });
    }
    function updateFavicons(data) {
        if (!data.favicon) return;
        const icon32 = document.querySelector('[data-favicon-id="icon32"]');
        if (icon32 && data.favicon.icon32) {
            icon32.setAttribute('href', data.favicon.icon32);
        }
        const icon192 = document.querySelector('[data-favicon-id="icon192"]');
        if (icon192 && data.favicon.icon192) {
            icon192.setAttribute('href', data.favicon.icon192);
        }
        const appleTouchIcon = document.querySelector('[data-favicon-id="apple-touch-icon"]');
        if (appleTouchIcon && data.favicon.appleTouchIcon) {
            appleTouchIcon.setAttribute('href', data.favicon.appleTouchIcon);
        }
        const msIcon = document.querySelector('[data-favicon-id="ms-icon"]');
        if (msIcon && data.favicon.msIcon) {
            msIcon.setAttribute('content', data.favicon.msIcon);
        }
    }
    function updateVideoElements(data) {
        if (!data.videos) return;
        const videoElements = document.querySelectorAll('video[data-video-id]');
        videoElements.forEach(video => {
            const videoId = video.getAttribute('data-video-id');
            if (!videoId || !data.videos[videoId]) return;
            const videoUrl = data.videos[videoId];
            const source = video.querySelector('source');
            if (source) {
                source.setAttribute('src', videoUrl);
            } else {
                video.setAttribute('src', videoUrl);
            }
            video.load();
        });
    }
    function updateParallaxBackgrounds(data) {
        if (!data.parallax) return;
        const parallaxMappings = {
            'parallax-teamgeist': data.parallax.teamgeist,
            'parallax-leistung': data.parallax.leistung,
            'parallax-entfaltung': data.parallax.entfaltung,
            'parallax-fuer-unternehmen': data.parallax.fuerUnternehmen
        };
        for (const [id, url] of Object.entries(parallaxMappings)) {
            const element = document.querySelector(`[data-parallax-id="${id}"]`);
            if (element && url) {
                element.style.backgroundImage = `url('${url}')`;
            }
        }
    }
    function updatePartnerLogos(data) {
        if (!data.partners) return;
        const partnerMappings = {
            'partner-mlp': data.partners.mlp,
            'partner-accenture': data.partners.accenture,
            'partner-atos': data.partners.atos,
            'partner-plw': data.partners.plw,
            'partner-vdu': data.partners.vdu,
            'partner-gvo': data.partners.gvo,
            'partner-easyverein': data.partners.easyverein
        };
        for (const [id, url] of Object.entries(partnerMappings)) {
            const element = document.querySelector(`[data-media-id="${id}"]`);
            if (element && url) {
                element.setAttribute('src', url);
            }
        }
    }
    function updateTestimonialImages(data) {
        if (!data.testimonials) return;
        const testimonialMappings = {
            'testimonial-schanbacher': data.testimonials.schanbacher,
            'testimonial-eisenbiegler': data.testimonials.eisenbiegler,
            'testimonial-siestrup': data.testimonials.siestrup,
            'testimonial-haug': data.testimonials.haug
        };
        for (const [id, url] of Object.entries(testimonialMappings)) {
            const element = document.querySelector(`[data-media-id="${id}"]`);
            if (element && url) {
                element.setAttribute('src', url);
            }
        }
    }
    function updateStudentImages(data) {
        if (!data.students) return;
        const studentMappings = {
            'student-event1': data.students.event1,
            'student-event2': data.students.event2,
            'student-event3': data.students.event3,
            'student-event4': data.students.event4
        };
        for (const [id, url] of Object.entries(studentMappings)) {
            const element = document.querySelector(`[data-media-id="${id}"]`);
            if (element && url) {
                element.setAttribute('src', url);
            }
        }
    }
    function updateGenericMediaElements(data) {
        const mediaElements = document.querySelectorAll('[data-media-id]');
        mediaElements.forEach(element => {
            const mediaId = element.getAttribute('data-media-id');
            if (!mediaId) return;
            const url = getNestedValue(data, mediaId);
            if (url) {
                if (element.tagName === 'IMG') {
                    element.setAttribute('src', url);
                } else if (element.tagName === 'VIDEO') {
                    element.setAttribute('poster', url);
                } else if (element.tagName === 'SOURCE') {
                    element.setAttribute('src', url);
                }
            }
        });
    }
    function getNestedValue(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }
        return current;
    }
    function injectBackgroundStyles(data) {
        let styleEl = document.getElementById('ibc-dynamic-bg-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'ibc-dynamic-bg-styles';
            document.head.appendChild(styleEl);
        }
        let css = '';
        if (data.parallax?.teamgeist) {
            css += `
                .cta-section-students,
                .cta-section {
                    background-image: linear-gradient(rgba(26, 40, 48, 0.88), rgba(26, 40, 48, 0.88)), url('${data.parallax.teamgeist}') !important;
                }
                @media (min-width: 768px) {
                    .cta-section-students {
                        background-image: linear-gradient(135deg, rgba(29, 45, 53, 0.95), rgba(40, 60, 75, 0.92)), url('${data.parallax.teamgeist}') !important;
                    }
                }
            `;
        }
        if (data.parallax?.fuerUnternehmen) {
            css += `
                .cta-section-companies {
                    background-image: linear-gradient(rgba(26, 40, 48, 0.88), rgba(26, 40, 48, 0.88)), url('${data.parallax.fuerUnternehmen}') !important;
                }
                @media (min-width: 768px) {
                    .cta-section-companies {
                        background-image: linear-gradient(135deg, rgba(29, 45, 53, 0.95), rgba(40, 60, 75, 0.92)), url('${data.parallax.fuerUnternehmen}') !important;
                    }
                }
            `;
        }
        if (data.parallax?.teamgeist) {
            css += `
                .network-cta {
                    background-image: linear-gradient(rgba(29, 45, 53, 0.9), rgba(29, 45, 53, 0.9)), url('${data.parallax.teamgeist}') !important;
                }
                @media (min-width: 768px) {
                    .network-cta {
                        background-image: linear-gradient(135deg, rgba(29, 45, 53, 0.95), rgba(40, 60, 75, 0.92)), url('${data.parallax.teamgeist}') !important;
                    }
                }
            `;
        }
        if (data.backgrounds?.['404']) {
            css += `
                .four_zero_four_bg {
                    background-image: url('${data.backgrounds['404']}') !important;
                }
            `;
        }
        if (data.parallax?.teamgeist) {
            css += `
                .alumni-section {
                    background-image: linear-gradient(135deg, rgba(29, 45, 53, 0.95), rgba(40, 60, 75, 0.92)), url('${data.parallax.teamgeist}') !important;
                }
            `;
        }
        styleEl.textContent = css;
    }
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function sanitizeDelay(delay) {
        const delayMs = parseInt(delay, 10) || 0;
        return Math.min(Math.max(delayMs, 0), CONFIG.MAX_ANIMATION_DELAY_MS);
    }
    function createTeamCardElement(member, lang, delay) {
        const position = member.position?.[lang] || member.position?.de || '';
        const imageSrc = member.image || 'assets/img/placeholder-avatar.png';
        const memberName = member.name || 'Unbekannt';
        let altText;
        if (imageSrc && imageSrc.includes('Maskottchen')) {
            altText = 'IBC Maskottchen Platzhalter';
        } else if (position) {
            altText = `Porträt von ${memberName}, ${position}`;
        } else {
            altText = `Porträt von ${memberName}`;
        }
        const sanitizedDelay = sanitizeDelay(delay);
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 fade-in-up';
        colDiv.setAttribute('data-animation-delay', `${sanitizedDelay}ms`);
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'team-card-img-wrapper';
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = altText;
        img.loading = 'lazy';
        imgWrapper.appendChild(img);
        const cardBody = document.createElement('div');
        cardBody.className = 'team-card-body';
        const h3 = document.createElement('h3');
        h3.textContent = memberName;
        const h4 = document.createElement('h4');
        h4.textContent = position;
        const tasksList = document.createElement('ul');
        tasksList.className = 'team-card-tasks';
        const socialDiv = document.createElement('div');
        socialDiv.className = 'team-card-social';
        if (member.email) {
            const emailUrl = `mailto:${member.email}`;
            if (isValidUrl(emailUrl)) {
                const emailLink = document.createElement('a');
                emailLink.href = emailUrl;
                emailLink.className = 'copy-email-link';
                emailLink.setAttribute('aria-label', `E-Mail-Adresse von ${memberName} kopieren`);
                const emailIcon = document.createElement('i');
                emailIcon.className = 'fas fa-envelope';
                emailLink.appendChild(emailIcon);
                socialDiv.appendChild(emailLink);
            } else {
                console.warn('SECURITY: Blocked invalid email URL:', emailUrl);
            }
        }
        if (member.linkedin) {
            if (isValidUrl(member.linkedin)) {
                const linkedinLink = document.createElement('a');
                linkedinLink.href = member.linkedin;
                linkedinLink.target = '_blank';
                linkedinLink.rel = 'noopener noreferrer';
                linkedinLink.setAttribute('aria-label', `LinkedIn Profil von ${memberName}`);
                const linkedinIcon = document.createElement('i');
                linkedinIcon.className = 'fab fa-linkedin-in';
                linkedinLink.appendChild(linkedinIcon);
                socialDiv.appendChild(linkedinLink);
            } else {
                console.warn('SECURITY: Blocked invalid LinkedIn URL:', member.linkedin);
            }
        }
        cardBody.appendChild(h3);
        cardBody.appendChild(h4);
        cardBody.appendChild(tasksList);
        cardBody.appendChild(socialDiv);
        teamCard.appendChild(imgWrapper);
        teamCard.appendChild(cardBody);
        colDiv.appendChild(teamCard);
        return colDiv;
    }
    async function loadTeamData() {
        const teamContainer = document.getElementById('team-container');
        const ressortContainer = document.getElementById('ressort-container');
        const plattformContainer = document.getElementById('plattform-container');
        if (!teamContainer && !ressortContainer && !plattformContainer) return;
        if (!dataCache.teamData) {
            dataCache.teamData = await fetchJSON(CONFIG.files.teamData);
        }
        const data = dataCache.teamData;
        if (!data) return;
        const lang = getCurrentLanguage();
        if (teamContainer && data.vorstand) {
            teamContainer.innerHTML = '';
            data.vorstand.forEach((member, index) => {
                const cardElement = createTeamCardElement(member, lang, (index + 1) * 100);
                teamContainer.appendChild(cardElement);
            });
            initializeTeamCardObservers(teamContainer);
            initializeEmailCopyHandlers(teamContainer);
        }
        if (ressortContainer && data.ressorts) {
            ressortContainer.innerHTML = '';
            data.ressorts.forEach((member, index) => {
                const cardElement = createTeamCardElement(member, lang, (index + 1) * 100);
                ressortContainer.appendChild(cardElement);
            });
            initializeTeamCardObservers(ressortContainer);
            initializeEmailCopyHandlers(ressortContainer);
        }
        if (plattformContainer && data.plattform) {
            plattformContainer.innerHTML = '';
            data.plattform.forEach((member, index) => {
                const cardElement = createTeamCardElement(member, lang, (index + 1) * 100);
                plattformContainer.appendChild(cardElement);
            });
            initializeTeamCardObservers(plattformContainer);
            initializeEmailCopyHandlers(plattformContainer);
        }
    }
    function initializeTeamCardObservers(container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.animationDelay || '0ms';
                    entry.target.style.transitionDelay = delay;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        container.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    }
    function initializeEmailCopyHandlers(container) {
        const copyBanner = document.getElementById('copy-banner');
        const emailLinks = container.querySelectorAll('.copy-email-link');
        emailLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const email = this.getAttribute('href').replace('mailto:', '');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(email).then(() => {
                        if (copyBanner) {
                            copyBanner.classList.add('show');
                            setTimeout(() => {
                                copyBanner.classList.remove('show');
                            }, 4000);
                        }
                    }).catch(err => {
                        console.error('Error copying email: ', err);
                        fallbackCopyToClipboard(email, copyBanner);
                    });
                } else {
                    fallbackCopyToClipboard(email, copyBanner);
                }
            });
        });
    }
    function fallbackCopyToClipboard(text, copyBanner) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.setAttribute('readonly', '');
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Helper function to clean up textarea
        const cleanup = () => {
            if (textArea.parentNode) {
                textArea.parentNode.removeChild(textArea);
            }
        };
        
        try {
            textArea.setSelectionRange(0, text.length);
            
            // Versuche erneut mit Clipboard API nach Selection
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    if (copyBanner) {
                        copyBanner.classList.add('show');
                        setTimeout(() => {
                            copyBanner.classList.remove('show');
                        }, 4000);
                    }
                    cleanup();
                }).catch(err => {
                    console.error('Fallback copy failed:', err);
                    const lang = getCurrentLanguage();
                    const message = lang === 'en'
                        ? "Copy not supported. Please copy manually: "
                        : "Kopieren nicht unterstützt. Bitte manuell kopieren: ";
                    alert(message + text);
                    cleanup();
                });
            } else {
                // Für sehr alte Browser
                const lang = getCurrentLanguage();
                const message = lang === 'en'
                    ? "Please copy manually: "
                    : "Bitte manuell kopieren: ";
                alert(message + text);
                cleanup();
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            const lang = getCurrentLanguage();
            const message = lang === 'en'
                ? "Copy not supported. Please copy manually: "
                : "Kopieren nicht unterstützt. Bitte manuell kopieren: ";
            alert(message + text);
            cleanup();
        }
    }
    async function loadImpressumBoardMembers() {
        const boardMembersElement = document.querySelector('[data-i18n="imprint-p-1"]');
        const responsiblePersonElement = document.querySelector('[data-i18n="imprint-p-3"]');
        if (!boardMembersElement && !responsiblePersonElement) return;
        if (!dataCache.teamData) {
            dataCache.teamData = await fetchJSON(CONFIG.files.teamData);
        }
        const data = dataCache.teamData;
        if (!data || !data.vorstand) return;
        const lang = getCurrentLanguage();
        if (boardMembersElement && data.vorstand.length > 0) {
            let boardMembersText = '';
            data.vorstand.forEach((member, index) => {
                const position = member.position?.[lang] || member.position?.de || '';
                const name = member.name || '';
                if (index > 0) {
                    boardMembersText += '<br>';
                }
                boardMembersText += `${escapeHtml(name)} (${escapeHtml(position)})`;
            });
            boardMembersElement.innerHTML = boardMembersText;
        }
        if (responsiblePersonElement && data.vorstand.length > 0) {
            const responsiblePerson = data.vorstand[0];
            const addressTranslations = {
                'de': '(Anschrift wie oben)',
                'en': '(address as above)',
                'fr': '(adresse ci-dessus)'
            };
            const responsibleText = addressTranslations[lang] || addressTranslations['de'];
            responsiblePersonElement.innerHTML = `${escapeHtml(responsiblePerson.name)}<br><em>${responsibleText}</em>`;
        }
    }
    async function initContentLoader() {
        try {
            await Promise.all([
                loadExternalLinks(),
                loadMediaConfig(),
                loadTeamData(),
                loadImpressumBoardMembers()
            ]);
            window.addEventListener('languageChanged', async () => {
                await loadTeamData();
                await loadImpressumBoardMembers();
            });
        } catch (error) {
            console.error('Content loader initialization failed:', error);
        }
    }
    window.ibcContentLoader = {
        init: initContentLoader,
        loadExternalLinks,
        loadMediaConfig,
        loadTeamData,
        loadImpressumBoardMembers,
        getCurrentLanguage,
        getCache: () => dataCache
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContentLoader);
    } else {
        initContentLoader();
    }
})();