
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    const loadBtn = document.getElementById('load-map-btn');
    const placeholder = document.getElementById('map-placeholder');
    const container = document.getElementById('map-container');
    const mapSrc = "https://googleusercontent.com/maps.google.com/15";
    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            placeholder.style.display = 'none';
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', mapSrc);
            iframe.setAttribute('width', '100%');
            iframe.setAttribute('height', '450');
            iframe.setAttribute('style', 'border:0;');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy');
            iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
            iframe.setAttribute('title', 'Standort des IBC e.V. auf Google Maps');
            container.appendChild(iframe);
        });
    }
});
