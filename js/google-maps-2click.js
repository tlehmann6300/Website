/**
 * Google Maps – 2-Click consent loader
 * ------------------------------------------------------------------
 * Lädt die Google-Karte erst nach explizitem Klick des Nutzers
 * (DSGVO-konformes Two-Click-Verfahren).
 *
 * Adresse: Robert-Gerwig-Platz 1, 78120 Furtwangen im Schwarzwald
 * Embed-URL: maps.google.com/maps?q=...&output=embed  (kein API-Key nötig)
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var loadBtn      = document.getElementById('load-map-btn');
    var placeholder  = document.getElementById('map-placeholder');
    var container    = document.getElementById('map-container');

    if (!loadBtn || !placeholder || !container) return;

    // Verifizierte, funktionsfähige Embed-URL ohne API-Key
    var query = encodeURIComponent('Robert-Gerwig-Platz 1, 78120 Furtwangen im Schwarzwald');
    var mapSrc = 'https://maps.google.com/maps?q=' + query + '&t=&z=16&ie=UTF8&iwloc=&output=embed';

    function loadMap() {
        // Doppelklicks verhindern
        if (container.querySelector('iframe')) return;

        var iframe = document.createElement('iframe');
        iframe.setAttribute('src', mapSrc);
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('style', 'border:0; width:100%; height:100%; min-height:450px; display:block;');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.setAttribute('title', 'Standort des IBC e.V. – Robert-Gerwig-Platz 1, 78120 Furtwangen');

        container.appendChild(iframe);

        // Sanftes Ausblenden des Placeholders
        placeholder.style.transition = 'opacity 0.3s ease';
        placeholder.style.opacity = '0';
        window.setTimeout(function () {
            placeholder.style.display = 'none';
        }, 300);

        // Optionale Einwilligung für die Sitzung merken
        try { sessionStorage.setItem('ibc_map_consent', '1'); } catch (e) { /* noop */ }
    }

    loadBtn.addEventListener('click', loadMap);

    // Falls der User in derselben Session bereits zugestimmt hat: direkt laden
    try {
        if (sessionStorage.getItem('ibc_map_consent') === '1') {
            loadMap();
        }
    } catch (e) { /* Storage gesperrt – ignorieren */ }
});
