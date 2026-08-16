<?php
/**
 * Konfigurationsskript für JavaScript-Variablen
 * 
 * Dieses PHP-Skript generiert dynamisch ein JavaScript-Objekt mit
 * Konfigurationswerten aus Umgebungsvariablen. Es ermöglicht die sichere
 * Übergabe von Server-seitigen Konfigurationen an Client-seitigen Code.
 * 
 * Hauptfunktionen:
 * - Laden von Umgebungsvariablen aus .env-Datei
 * - Generierung eines JavaScript-Konfigurationsobjekts
 * - Bereitstellung von Google Analytics ID
 * - Bereitstellung von reCAPTCHA Site Key
 * 
 * Sicherheitshinweis:
 * Dieses Skript stellt nur öffentliche/client-sichere Werte bereit.
 * Geheime Keys (wie reCAPTCHA Secret Key) werden NICHT ausgegeben.
 * 
 * @package IBC Website
 * @version 2.0
 */

// Lade Composer-Autoloader für Abhängigkeiten
require_once __DIR__ . '/vendor/autoload.php';

// Importiere Dotenv-Klasse für Umgebungsvariablen-Verwaltung
use Dotenv\Dotenv;

/**
 * Lade Umgebungsvariablen aus .env-Datei
 * 
 * Die .env-Datei im private/config-Verzeichnis enthält sensible
 * Konfigurationsdaten, die nicht im Git-Repository gespeichert werden.
 */
try {
    // Erstelle Dotenv-Instanz für das private/config-Verzeichnis
    $dotenv = Dotenv::createImmutable(__DIR__ . '/private/config');
    // Lade Umgebungsvariablen (safeLoad wirft keine Exception bei fehlender Datei)
    $dotenv->safeLoad();
} catch (\Exception $e) {
    // Logge Fehler beim Laden der .env-Datei für Debugging
    error_log("Fehler beim Laden der .env-Datei: " . $e->getMessage());
}

/**
 * Setze Content-Type auf JavaScript
 * Teilt dem Browser mit, dass die Antwort JavaScript-Code enthält
 */
header('Content-Type: application/javascript');

/**
 * Hole Google Analytics ID aus Umgebungsvariablen
 * 
 * Versucht zuerst $_ENV, dann getenv() als Fallback.
 * Format: G-XXXXXXXXXX (für Google Analytics 4)
 */
$googleAnalyticsId = $_ENV['GOOGLE_ANALYTICS_ID'] ?? getenv('GOOGLE_ANALYTICS_ID');

/**
 * Hole reCAPTCHA Site Key aus Umgebungsvariablen
 * 
 * Dies ist der öffentliche Key für reCAPTCHA, der auf Client-Seite verwendet wird.
 * Der geheime Key wird niemals an den Client gesendet.
 */
$recaptchaSiteKey = $_ENV['RECAPTCHA_SITE_KEY'] ?? getenv('RECAPTCHA_SITE_KEY');

/**
 * Validierung und Fehlerbehandlung für Google Analytics ID
 * 
 * Wenn keine ID gesetzt ist, wird eine Warnung geloggt und ein leerer String verwendet.
 * Dies verhindert JavaScript-Fehler und ermöglicht das Funktionieren der Seite
 * auch ohne Analytics.
 */
if (empty($googleAnalyticsId)) {
    error_log("WARNING: GOOGLE_ANALYTICS_ID not set in environment");
    $googleAnalyticsId = '';
}

/**
 * Validierung und Fehlerbehandlung für reCAPTCHA Site Key
 * 
 * Wenn kein Key gesetzt ist, wird eine Warnung geloggt und ein leerer String verwendet.
 * Das Kontaktformular wird dann deaktiviert oder zeigt eine entsprechende Meldung an.
 */
if (empty($recaptchaSiteKey)) {
    error_log("WARNING: RECAPTCHA_SITE_KEY not set in environment");
    $recaptchaSiteKey = '';
}
?>
/**
 * Globales IBC-Konfigurationsobjekt
 * 
 * Dieses Objekt ist im globalen Window-Scope verfügbar und kann von
 * allen JavaScript-Dateien der Website verwendet werden.
 * 
 * @global
 * @type {Object}
 * @property {string} googleAnalyticsId - Google Analytics Tracking-ID (GA4)
 * @property {string} recaptchaSiteKey - Öffentlicher reCAPTCHA Site Key
 */
window.IBC_CONFIG = {
    // Google Analytics ID (JSON-kodiert für sichere String-Ausgabe)
    googleAnalyticsId: <?php echo json_encode($googleAnalyticsId); ?>,
    // reCAPTCHA Site Key (JSON-kodiert für sichere String-Ausgabe)
    recaptchaSiteKey: <?php echo json_encode($recaptchaSiteKey); ?>,
};
