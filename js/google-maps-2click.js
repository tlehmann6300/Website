
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    const loadBtn = document.getElementById('load-map-btn');
    const placeholder = document.getElementById('map-placeholder');
    const container = document.getElementById('map-container');
    const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10668.213373069295!2d8.197488378228444!3d48.05130778349748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4108f8d06b694f9d%3A0xa040bf1f949b5d69!2sInstitut%20f%C3%BCr%20Business%20Consulting!5e0!3m2!1sde!2sde!4v1777846127127!5m2!1sde!2sde";
    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            placeholder.style.display = 'none';
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', mapSrc);
            iframe.setAttribute('style', 'border:0;width:100%;height:100%;min-height:450px;display:block;');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy');
            iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
            iframe.setAttribute('title', 'Standort des IBC e.V. auf Google Maps');
            container.appendChild(iframe);
            /* Make container itself fill available height */
            if (container.parentElement) {
                container.style.height = '100%';
                container.style.minHeight = '450px';
            }
        });
    }
});
