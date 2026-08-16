<?php
/**
 * CSRF-Token-Generator
 * 
 * Dieses Skript generiert und liefert CSRF-Tokens (Cross-Site Request Forgery)
 * für sichere Formular-Übermittlungen. CSRF-Tokens schützen vor unbefugten
 * Formular-Übermittlungen von fremden Websites.
 * 
 * Hauptfunktionen:
 * - Generierung von kryptographisch sicheren CSRF-Tokens
 * - Session-basierte Token-Speicherung
 * - Origin/Referer-Validierung für zusätzliche Sicherheit
 * - CORS-Header-Management für legitime Cross-Origin-Requests
 * - Umfangreiche Sicherheits-Checks
 * 
 * Sicherheitsfeatures:
 * - Origin-Validierung
 * - Referer-Prüfung
 * - Domain-Whitelist
 * - Sichere Session-Cookie-Konfiguration
 * - HTTP-Only und SameSite-Cookie-Attribute
 * 
 * @package IBC Website
 * @version 2.0
 */

/**
 * Liste der gültigen Domains für diese Anwendung
 * Nur Requests von diesen Domains werden akzeptiert
 */
const VALID_DOMAINS = ['business-consulting.de', 'www.business-consulting.de'];

/**
 * Liste der erlaubten Origins für CORS-Requests
 * Enthält sowohl Produktions-URLs als auch lokale Entwicklungs-URLs
 */
$validOrigins = [
    'https://business-consulting.de',        // Produktions-Domain
    'https://www.business-consulting.de',    // Produktions-Domain mit www
    'http://localhost',                       // Lokale Entwicklung
    'http://127.0.0.1'                       // Lokale Entwicklung (IP)
];

/**
 * Prüft, ob die Anwendung im Entwicklungsmodus läuft
 * 
 * Erkennt lokale Entwicklungsumgebungen anhand des Hostnamens.
 * Im Entwicklungsmodus werden zusätzliche Origins erlaubt.
 */
$isDevelopment = (
    // Prüfe SERVER_NAME auf localhost oder 127.0.0.1
    (isset($_SERVER['SERVER_NAME']) &&
     (strpos($_SERVER['SERVER_NAME'], 'localhost') !== false ||
      strpos($_SERVER['SERVER_NAME'], '127.0.0.1') !== false)) ||
    // Prüfe HTTP_HOST auf localhost oder 127.0.0.1
    (isset($_SERVER['HTTP_HOST']) &&
     (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
      strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false))
);

/**
 * Füge file:// Protokoll für lokale Entwicklung hinzu
 * Erlaubt das Laden von Dateien direkt aus dem Dateisystem während der Entwicklung
 */
if ($isDevelopment) {
    $validOrigins[] = 'file://';
}

/**
 * Validiert den Server-Hostnamen
 * 
 * Prüft, ob der angegebene Hostname mit den Server-Informationen oder
 * den gültigen Domains übereinstimmt.
 * 
 * @param string $hostname Der zu prüfende Hostname
 * @param string $serverName Der SERVER_NAME aus $_SERVER
 * @param string $httpHostWithoutPort Der HTTP_HOST ohne Port
 * @return bool true wenn der Hostname gültig ist, sonst false
 */
function isValidServerHostname($hostname, $serverName, $httpHostWithoutPort) {
    // Leere Hostnamen sind ungültig
    if (empty($hostname)) {
        return false;
    }
    
    // Prüfe, ob Hostname mit HTTP_HOST, SERVER_NAME oder VALID_DOMAINS übereinstimmt
    return ($hostname === $httpHostWithoutPort ||
            $hostname === $serverName ||
            in_array($hostname, VALID_DOMAINS));
}

/**
 * Validiert eine Origin-URL
 * 
 * Prüft, ob die angegebene Origin-URL in der Liste der erlaubten Origins
 * enthalten ist. Behandelt auch localhost mit verschiedenen Ports.
 * 
 * @param string $origin Die zu prüfende Origin-URL
 * @param array $validOrigins Array mit erlaubten Origin-URLs
 * @return bool true wenn die Origin gültig ist, sonst false
 */
function isValidOrigin($origin, $validOrigins) {
    // Leere Origins sind ungültig
    if (empty($origin)) {
        return false;
    }
    
    // Direkte Übereinstimmung mit erlaubten Origins
    if (in_array($origin, $validOrigins)) {
        return true;
    }
    
    // Parse die Origin-URL in ihre Bestandteile
    $parsedOrigin = parse_url($origin);
    
    // Ungültige URL-Struktur
    if (!$parsedOrigin || !isset($parsedOrigin['host'])) {
        return false;
    }
    
    $originHost = $parsedOrigin['host'];
    
    /**
     * Spezialbehandlung für localhost
     * Erlaube Entwicklungs-Ports zwischen 3000 und 9000
     * (z.B. React Dev Server auf Port 3000, webpack-dev-server, etc.)
     */
    if (in_array($originHost, ['localhost', '127.0.0.1'])) {
        // Hole Port oder nutze Standard-Port 80
        $originPort = $parsedOrigin['port'] ?? 80;
        // Erlaube Standard-Port oder Entwicklungs-Ports
        return ($originPort === 80 || ($originPort >= 3000 && $originPort <= 9000));
    }
    
    /**
     * Prüfe, ob der Host mit einem der gültigen Origins übereinstimmt
     * und ob der Port 80 (HTTP) oder 443 (HTTPS) ist
     */
    foreach ($validOrigins as $validOrigin) {
        $parsedValid = parse_url($validOrigin);
        if ($parsedValid && isset($parsedValid['host']) && $originHost === $parsedValid['host']) {
            // Hole Port oder nutze Standard-Port basierend auf Protokoll
            $originPort = $parsedOrigin['port'] ?? ($parsedOrigin['scheme'] === 'https' ? 443 : 80);
            // Nur Standard-HTTP/HTTPS-Ports sind erlaubt
            return ($originPort === 80 || $originPort === 443);
        }
    }
    
    // Keine Übereinstimmung gefunden
    return false;
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (isValidOrigin($origin, $validOrigins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }
    http_response_code(204);
    exit;
}
if (PHP_VERSION_ID >= 70300) {
    $isSecure = (
        (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
        (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
        (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
    );
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}
session_start();
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$serverName = $_SERVER['SERVER_NAME'] ?? '';
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$httpHostWithoutPort = $httpHost;
if (strpos($httpHost, ':') !== false) {
    $parts = explode(':', $httpHost, 2);
    $httpHostWithoutPort = !empty($parts[0]) ? $parts[0] : $httpHost;
}
$isValidOriginHeader = false;
if (!empty($origin)) {
    $isValidOriginHeader = isValidOrigin($origin, $validOrigins);
    if (!$isValidOriginHeader) {
        $parsedOrigin = parse_url($origin);
        if (is_array($parsedOrigin) && isset($parsedOrigin['host'])) {
            $isValidOriginHeader = isValidServerHostname($parsedOrigin['host'], $serverName, $httpHostWithoutPort);
        }
    }
}
elseif (!empty($referer)) {
    $isValidOriginHeader = isValidOrigin($referer, $validOrigins);
    if (!$isValidOriginHeader) {
        $parsedReferer = parse_url($referer);
        if (is_array($parsedReferer) && isset($parsedReferer['host'])) {
            $isValidOriginHeader = isValidServerHostname($parsedReferer['host'], $serverName, $httpHostWithoutPort);
        }
    }
}
else {
    $isValidOriginHeader = $isDevelopment ||
                    in_array($serverName, VALID_DOMAINS) ||
                    in_array($httpHost, VALID_DOMAINS) ||
                    in_array($httpHostWithoutPort, VALID_DOMAINS);
}
if (!$isValidOriginHeader) {
    $sanitizedOrigin = preg_replace('/[\r\n]/', '', $origin);
    $sanitizedReferer = preg_replace('/[\r\n]/', '', $referer);
    $sanitizedHost = preg_replace('/[\r\n]/', '', $httpHost);
    error_log("SECURITY: CSRF token request from invalid origin: " . $sanitizedOrigin . " / " . $sanitizedReferer . " (Server: " . $sanitizedHost . ")");
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid origin']);
    exit;
}
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
if (!empty($origin) && isValidOrigin($origin, $validOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
echo json_encode(['token' => $_SESSION['csrf_token']]);
