
(function() {
    'use strict';
    async function loadSVG(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                return null;
            }
            const svgText = await response.text();
            return svgText;
        } catch (error) {
            console.warn('Error loading SVG:', path, error);
            return null;
        }
    }
    const FILLABLE_SVG_ELEMENTS = ['path', 'circle', 'rect', 'polygon', 'ellipse', 'line', 'polyline', 'text'];
    const FILLABLE_SVG_SELECTOR = FILLABLE_SVG_ELEMENTS.join(', ');
    function parseSVGSafely(svgContent, svgPath) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = doc.documentElement;
        const parserError = doc.querySelector('parsererror');
        if (parserError || !svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
            console.warn('Failed to parse SVG:', svgPath);
            return null;
        }
        return svgElement;
    }
    function applyCurrentColorToSVG(svgElement) {
        if (!svgElement.hasAttribute('fill')) {
            svgElement.style.fill = 'currentColor';
        }
        const childElements = svgElement.querySelectorAll(FILLABLE_SVG_SELECTOR);
        childElements.forEach(child => {
            if (!child.hasAttribute('fill')) {
                child.style.fill = 'currentColor';
            }
        });
    }
    async function replaceSvgIconImages() {
        const imgElements = document.querySelectorAll('img.svg-icon');
        for (const img of imgElements) {
            const src = img.getAttribute('src');
            if (src && src.endsWith('.svg')) {
                await loadAndReplaceSVGFromImg(img, src);
            }
        }
    }
    async function loadAndReplaceSVGFromImg(imgElement, svgPath) {
        const svgContent = await loadSVG(svgPath);
        if (!svgContent || !imgElement.parentNode) {
            return;
        }
        const svgElement = parseSVGSafely(svgContent, svgPath);
        if (!svgElement) {
            return;
        }
        const originalClasses = imgElement.className;
        svgElement.setAttribute('class', originalClasses);
        const altText = imgElement.getAttribute('alt');
        if (altText && altText.trim() !== '') {
            svgElement.setAttribute('title', altText);
        } else {
            svgElement.setAttribute('aria-hidden', 'true');
        }
        const ariaHidden = imgElement.getAttribute('aria-hidden');
        if (ariaHidden !== null) {
            svgElement.setAttribute('aria-hidden', ariaHidden);
        }
        applyCurrentColorToSVG(svgElement);
        const importedSvg = document.importNode(svgElement, true);
        imgElement.replaceWith(importedSvg);
    }
    async function initialize() {
        await replaceSvgIconImages();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
