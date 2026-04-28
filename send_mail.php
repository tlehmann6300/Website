<?php
/**
 * Runtime security headers (CSP, HSTS, X-Frame, Referrer-Policy, etc.).
 * Idempotent — safe to include alongside .htaccess in production.
 */
@require_once __DIR__ . '/private/security_headers.php';

/**
 * E-Mail-Versand-Skript für das Kontaktformular
 * 
 * Dieses PHP-Skript verarbeitet Kontaktformular-Anfragen und versendet E-Mails.
 * Es implementiert umfangreiche Sicherheitsmaßnahmen und Fehlerbehandlung.
 * 
 * Hauptfunktionen:
 * - Empfang und Validierung von Formulardaten
 * - reCAPTCHA-Verifizierung
 * - CSRF-Token-Validierung
 * - Rate Limiting (Anfragebegrenzung)
 * - E-Mail-Versand über SMTP (PHPMailer)
 * - Automatische Bestätigungs-E-Mail an Absender
 * - HubSpot CRM-Integration (optional)
 * - Umfangreiche Fehlerbehandlung und Logging
 * 
 * Sicherheitsfeatures:
 * - Rate Limiting pro IP-Adresse
 * - CSRF-Token-Validierung
 * - reCAPTCHA-Validierung
 * - Input-Sanitization
 * - E-Mail-Format-Validierung
 * 
 * @package IBC Website
 * @version 2.0
 */

// Fehlerausgabe im Browser deaktivieren (Sicherheit)
ini_set('display_errors', 0);
// Fehler-Logging aktivieren für Server-Logs
ini_set('log_errors', 1);
// Alle Fehler-Typen protokollieren
error_reporting(E_ALL);

/**
 * Konstante: Timeout für HubSpot API-Anfragen in Sekunden
 * Verhindert lange Wartezeiten bei HubSpot-Problemen
 */
const CONTACT_FORM_HUBSPOT_API_TIMEOUT = 5;

/**
 * Konstante: Maximale Länge der Nachricht für HubSpot
 * HubSpot hat Längenbeschränkungen für Felder
 */
const CONTACT_FORM_HUBSPOT_MESSAGE_MAX_LENGTH = 65536;

/**
 * Konstante: Standard-Lead-Status für neue Kontakte in HubSpot
 * Muss ein gültiger Wert aus: [NEW, OPEN, IN_PROGRESS, OPEN_DEAL, UNQUALIFIED, ATTEMPTED_TO_CONTACT, CONNECTED, BAD_TIMING] sein
 */
const CONTACT_FORM_HUBSPOT_DEFAULT_LEAD_STATUS = 'NEW';

/**
 * Konstante: Maximale Länge für Error-Log-Ausgaben
 * Verhindert übermäßig große Log-Einträge
 */
const ERROR_LOG_OUTPUT_MAX_LENGTH = 200;

/**
 * Konstante: Pfad zur JSON-Datei mit externen Links
 * Enthält Social-Media-URLs und andere externe Verweise
 */
const EXTERNAL_LINKS_JSON_PATH = __DIR__ . '/assets/data/external_links.json';

// Fallback-URLs für Social Media (falls JSON-Datei nicht geladen werden kann)
const FALLBACK_FACEBOOK_URL = 'https://www.facebook.com/IBC.Furtwangen/';
const FALLBACK_INSTAGRAM_URL = 'https://www.instagram.com/ibc_e.v/';
const FALLBACK_LINKEDIN_URL = 'https://www.linkedin.com/company/institut-f%C3%BCr-business-consulting-e-v/';

/**
 * Shutdown-Function registrieren
 * 
 * Diese Funktion wird am Ende des Skripts aufgerufen und fängt fatale Fehler ab,
 * die sonst nicht behandelt werden könnten. Sie stellt sicher, dass immer eine
 * JSON-Antwort zurückgegeben wird, auch bei schwerwiegenden Fehlern.
 */
register_shutdown_function(function() {
    // Hole den letzten aufgetretenen Fehler
    $error = error_get_last();
    
    // Prüfe, ob es sich um einen fatalen Fehler handelt
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        try {
            // Versuche, den Output-Buffer zu leeren
            if (ob_get_length()) ob_clean();
        } catch (Exception $e) {
            // Ignoriere Fehler beim Buffer-Leeren
        }
        
        // Setze JSON-Header, falls noch nicht gesendet
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code(500);
        }
        
        // Logge den fatalen Fehler für Debugging
        error_log("FATAL ERROR in send_mail.php: " . $error['message'] . " in " . $error['file'] . " on line " . $error['line']);
        
        // Bereite Benutzer-freundliche Fehlermeldung vor
        $message = 'Ein technischer Fehler ist aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.';
        // Versuche, übersetzte Nachricht zu verwenden, falls verfügbar
        if (function_exists('translate')) {
            $message = translate('php-error-technical');
        }
        
        // Sende JSON-Fehlerantwort an den Client
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }
});

// Starte Output-Buffering, um saubere JSON-Antworten zu gewährleisten
ob_start();

// Setze den Content-Type-Header auf JSON mit UTF-8-Encoding
header('Content-Type: application/json; charset=UTF-8');

/**
 * Prüfe, ob Composer-Abhängigkeiten installiert sind
 * 
 * Das Skript benötigt externe Bibliotheken (PHPMailer, Dotenv), die über
 * Composer installiert werden müssen. Ohne diese kann das Skript nicht funktionieren.
 */
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    // Leere den Output-Buffer
    if (ob_get_length()) ob_clean();
    
    // Logge kritischen Fehler
    error_log("CRITICAL ERROR: Composer dependencies not installed. Run 'composer install' in the Website directory.");
    
    // Setze HTTP-Statuscode auf 500 (Internal Server Error)
    http_response_code(500);
    
    // Bereite Benutzer-freundliche Fehlermeldung vor
    $message = 'Server-Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.';
    if (function_exists('translate')) {
        $message = translate('php-error-server-config');
    }
    
    // Sende JSON-Fehlerantwort
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}
// Importiere benötigte Klassen aus den installierten Paketen
use PHPMailer\PHPMailer\PHPMailer;  // Haupt-PHPMailer-Klasse für E-Mail-Versand
use PHPMailer\PHPMailer\Exception;  // Exception-Klasse für PHPMailer-Fehler
use Dotenv\Dotenv;                  // Dotenv für Umgebungsvariablen-Verwaltung

// Lade Composer-Autoloader (lädt alle Abhängigkeiten)
require 'vendor/autoload.php';

// Lade Übersetzungs-Funktionen
require_once 'translate.php';

/**
 * Lade Umgebungsvariablen aus der .env-Datei
 * 
 * Die .env-Datei enthält sensible Konfigurationsdaten wie API-Keys,
 * SMTP-Zugangsdaten, etc. Diese werden nicht in Git eingecheckt.
 */
try {
    // Erstelle Dotenv-Instanz für das private/config-Verzeichnis
    $dotenv = Dotenv::createImmutable(__DIR__ . '/private/config');
    // Lade Variablen sicher (wirft keine Exception, wenn Datei fehlt)
    $dotenv->safeLoad();
} catch (\Exception $e) {
    // Logge Fehler, falls .env-Datei nicht geladen werden kann
    error_log("Fehler beim Laden der .env-Datei: " . $e->getMessage());
}

/**
 * Starte PHP-Session für CSRF-Token-Verwaltung
 * Sessions werden benötigt, um CSRF-Tokens zwischen Requests zu speichern
 */
session_start();

/**
 * Generiere CSRF-Token, falls noch keines existiert
 * 
 * CSRF (Cross-Site Request Forgery) Tokens schützen vor unbefugten
 * Formular-Übermittlungen von anderen Websites
 */
if (empty($_SESSION['csrf_token'])) {
    // Generiere kryptographisch sicheren Zufallstoken (32 Bytes = 64 Hex-Zeichen)
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

/**
 * Teilt einen vollständigen Namen in Vor- und Nachname auf
 * 
 * Wird für die HubSpot-Integration benötigt, da dort separate Felder
 * für Vor- und Nachname existieren.
 * 
 * @param string $fullName Der vollständige Name (z.B. "Max Mustermann")
 * @return array Assoziatives Array mit 'firstname' und 'lastname'
 */
function splitName($fullName) {
    // Teile den Namen beim ersten Leerzeichen in maximal 2 Teile
    $nameParts = explode(' ', trim($fullName), 2);
    
    return [
        // Erster Teil ist der Vorname (oder leerer String, falls kein Name)
        'firstname' => $nameParts[0] ?? '',
        // Zweiter Teil ist der Nachname (oder leerer String, falls nur ein Wort)
        'lastname' => $nameParts[1] ?? ''
    ];
}

/**
 * Erstellt einen Kontakt in HubSpot CRM
 * 
 * Diese Funktion sendet die Kontaktdaten an die HubSpot API, um einen
 * neuen Kontakt im CRM zu erstellen. Dies ist optional und wird nur
 * ausgeführt, wenn der Benutzer zugestimmt hat.
 * 
 * @param array $contactData Assoziatives Array mit Kontaktdaten
 *                           Erwartet: email, firstname, lastname, phone,
 *                           mobilephone, message
 * @return bool true bei Erfolg, false bei Fehler oder fehlender Konfiguration
 */
function createHubSpotContact($contactData) {
    // Hole HubSpot API-Key aus Umgebungsvariablen
    $hubspotApiKey = $_ENV['HUBSPOT_API_KEY'] ?? getenv('HUBSPOT_API_KEY');
    
    // Wenn kein API-Key konfiguriert ist, überspringe CRM-Integration
    if (empty($hubspotApiKey)) {
        error_log("HubSpot: No API key configured, skipping CRM integration");
        return false;
    }
    
    try {
        // HubSpot API Endpunkt für Kontakte
        $url = 'https://api.hubapi.com/crm/v3/objects/contacts';
        
        // Bereite Daten für HubSpot API vor
        $data = [
            'properties' => [
                'email' => $contactData['email'] ?? '',
                'firstname' => $contactData['firstname'] ?? '',
                'lastname' => $contactData['lastname'] ?? '',
            ]
        ];
        if (!empty($contactData['phone'])) {
            $data['properties']['phone'] = $contactData['phone'];
        }
        if (!empty($contactData['mobilephone'])) {
            $data['properties']['mobilephone'] = $contactData['mobilephone'];
        }
        $data['properties']['hs_lead_status'] = CONTACT_FORM_HUBSPOT_DEFAULT_LEAD_STATUS;
        if (!empty($contactData['message'])) {
            $data['properties']['message'] = substr($contactData['message'], 0, CONTACT_FORM_HUBSPOT_MESSAGE_MAX_LENGTH);
        }
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_TIMEOUT, CONTACT_FORM_HUBSPOT_API_TIMEOUT);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $hubspotApiKey
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode === 200 || $httpCode === 201) {
            return true;
        }
        // 409 Conflict means the contact already exists in HubSpot, which is not an error
        if ($httpCode === 409) {
            error_log("HubSpot: Contact already exists (HTTP 409), treating as success");
            return true;
        }
        error_log("HubSpot API error (HTTP $httpCode): " . substr($response, 0, 500));
        return false;
    } catch (Exception $e) {
        error_log("HubSpot Exception: " . $e->getMessage());
        return false;
    }
}
function getClientIP() {
    $trustProxyHeadersRaw = $_ENV['TRUST_PROXY_HEADERS'] ?? getenv('TRUST_PROXY_HEADERS');
    $trustProxyHeaders = filter_var($trustProxyHeadersRaw, FILTER_VALIDATE_BOOLEAN);
    if ($trustProxyHeaders) {
        $remoteIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $cloudflareIPv4Ranges = [
            '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22',
            '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
            '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22',
            '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
            '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
        ];
        $isCloudflare = false;
        foreach ($cloudflareIPv4Ranges as $range) {
            if (ipInRange($remoteIp, $range)) {
                $isCloudflare = true;
                break;
            }
        }
        if ($isCloudflare) {
            $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP'];
            foreach ($headers as $header) {
                if (!empty($_SERVER[$header])) {
                    $ip = $_SERVER[$header];
                    if (strpos($ip, ',') !== false) {
                        $ip = trim(explode(',', $ip)[0]);
                    }
                    if (filter_var($ip, FILTER_VALIDATE_IP)) {
                        error_log("Rate limit using proxy header IP: " . $ip . " from " . $header);
                        return $ip;
                    }
                }
            }
        } else {
            error_log("SECURITY WARNING: TRUST_PROXY_HEADERS enabled but request not from Cloudflare IP: " . $remoteIp);
        }
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if ($ip !== 'unknown') {
        error_log("Rate limit using direct IP: " . $ip);
    }
    return $ip;
}
function ipInRange($ip, $cidr) {
    list($subnet, $mask) = explode('/', $cidr);
    $ipLong = ip2long($ip);
    $subnetLong = ip2long($subnet);
    $maskLong = -1 << (32 - (int)$mask);
    $subnetLong &= $maskLong;
    return ($ipLong & $maskLong) === $subnetLong;
}
function cleanupOldRateLimitFiles($rateLimitDir) {
    if (random_int(1, 100) !== 1) {
        return;
    }
    $maxAge = 86400;
    $currentTime = time();
    $deletedCount = 0;
    try {
        if (!is_dir($rateLimitDir)) {
            return;
        }
        $files = @scandir($rateLimitDir);
        if ($files === false) {
            return;
        }
        $jsonExtension = '.json';
        $jsonExtensionLength = strlen($jsonExtension);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $filePath = $rateLimitDir . $file;
            if (!is_file($filePath) || substr($file, -$jsonExtensionLength) !== $jsonExtension) {
                continue;
            }
            $fileAge = $currentTime - @filemtime($filePath);
            if ($fileAge > $maxAge) {
                if (@unlink($filePath)) {
                    $deletedCount++;
                }
            }
        }
        if ($deletedCount > 0) {
            error_log("SECURITY: Garbage collection removed $deletedCount old rate limit files");
        }
    } catch (Exception $e) {
        error_log("SECURITY: Garbage collection error: " . $e->getMessage());
    }
}
$clientIP = getClientIP();
$ipHash = hash('sha256', $clientIP . 'ibc_rate_limit_v1');
$rateLimitDir = sys_get_temp_dir() . '/ibc_rate_limit/';
$rateLimitFile = $rateLimitDir . $ipHash . '.json';
$maxRequests = 5;
$timeWindow = 3600;
if (!is_dir($rateLimitDir)) {
    mkdir($rateLimitDir, 0755, true);
}
cleanupOldRateLimitFiles($rateLimitDir);
$rateLimitData = ['requests' => [], 'last_request' => 0];
if (file_exists($rateLimitFile)) {
    $fileData = json_decode(file_get_contents($rateLimitFile), true);
    if ($fileData && isset($fileData['requests'])) {
        $rateLimitData = $fileData;
    }
}
$currentTime = time();
if (!empty($rateLimitData['requests'])) {
    $rateLimitData['requests'] = array_filter($rateLimitData['requests'], function($timestamp) use ($currentTime, $timeWindow) {
        return ($currentTime - $timestamp) < $timeWindow;
    });
    $rateLimitData['requests'] = array_values($rateLimitData['requests']);
}
$minTimeBetweenRequests = 30;
if (isset($rateLimitData['last_request']) && $rateLimitData['last_request'] > 0 &&
    ($currentTime - $rateLimitData['last_request']) < $minTimeBetweenRequests) {
    error_log("SECURITY: Rate limit (min time) exceeded for IP: " . $clientIP);
    header('Content-Type: application/json');
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => translate('php-error-rate-limit-wait')
    ]);
    exit;
}
if (count($rateLimitData['requests']) >= $maxRequests) {
    error_log("SECURITY: Rate limit (max requests) exceeded for IP: " . $clientIP . " - " . count($rateLimitData['requests']) . " requests in last hour");
    header('Content-Type: application/json');
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => translate('php-error-rate-limit-exceeded')
    ]);
    exit;
}
$recaptchaSecretKey = $_ENV['RECAPTCHA_SECRET_KEY'] ?? getenv('RECAPTCHA_SECRET_KEY');
$empfaengerEmail    = $_ENV['EMPFAENGER_EMAIL'] ?? getenv('EMPFAENGER_EMAIL');
$smtpHost           = $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST');
$smtpPort           = (int)($_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT'));
$smtpUsername       = $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME');
$smtpPassword       = $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD');
$absenderEmail      = $_ENV['ABSENDER_EMAIL'] ?? getenv('ABSENDER_EMAIL');
$smtpSecureEnv = strtoupper(($_ENV['SMTP_SECURE'] ?? getenv('SMTP_SECURE')) ?: 'tls');
if ($smtpSecureEnv === 'SSL') {
    $smtpSecure = PHPMailer::ENCRYPTION_SMTPS;
} elseif ($smtpSecureEnv === 'TLS' || $smtpSecureEnv === 'STARTTLS') {
    $smtpSecure = PHPMailer::ENCRYPTION_STARTTLS;
} else {
    $smtpSecure = '';
}
header('Content-Type: application/json');
$response = [
    'success' => false,
    'message' => translate('php-error-generic')
];
if (!$smtpUsername || !$smtpPassword || !$smtpHost || !$recaptchaSecretKey || !$empfaengerEmail || !$absenderEmail) {
     $missingVars = [];
     if (!$smtpUsername) $missingVars[] = 'SMTP_USERNAME';
     if (!$smtpPassword) $missingVars[] = 'SMTP_PASSWORD';
     if (!$smtpHost) $missingVars[] = 'SMTP_HOST';
     if (!$recaptchaSecretKey) $missingVars[] = 'RECAPTCHA_SECRET_KEY';
     if (!$empfaengerEmail) $missingVars[] = 'EMPFAENGER_EMAIL';
     if (!$absenderEmail) $missingVars[] = 'ABSENDER_EMAIL';
     error_log("CRITICAL ERROR: Umgebungsvariablen (.env) fehlen oder sind unvollständig: " . implode(', ', $missingVars));
     http_response_code(500);
     $response['message'] = translate('php-error-env-config');
     echo json_encode($response);
     exit;
}
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $csrfToken = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => translate('php-error-csrf-security')]);
        exit;
    }
    $rateLimitData['requests'][] = $currentTime;
    $rateLimitData['last_request'] = $currentTime;
    $fp = fopen($rateLimitFile, 'c+');
    if ($fp && flock($fp, LOCK_EX)) {
        fseek($fp, 0);
        $fileContent = '';
        while (!feof($fp)) {
            $fileContent .= fread($fp, 8192);
        }
        if ($fileContent && strlen($fileContent) > 0) {
            $lockedData = json_decode($fileContent, true);
            if ($lockedData && isset($lockedData['requests'])) {
                $rateLimitData = $lockedData;
                $rateLimitData['requests'][] = $currentTime;
                $rateLimitData['last_request'] = $currentTime;
            }
        }
        ftruncate($fp, 0);
        fseek($fp, 0);
        fwrite($fp, json_encode($rateLimitData));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    } else {
        file_put_contents($rateLimitFile, json_encode($rateLimitData), LOCK_EX);
        if ($fp) {
            fclose($fp);
        }
    }
    if (!isset($_POST['g-recaptcha-response'])) {
        http_response_code(400);
        $response['message'] = translate('php-error-recaptcha-missing');
        echo json_encode($response);
        exit;
    }
    $recaptchaResponse = $_POST['g-recaptcha-response'];
    $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    $data = [
        'secret'   => $recaptchaSecretKey,
        'response' => $recaptchaResponse,
        'remoteip' => $_SERVER['REMOTE_ADDR']
    ];
    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    $context  = stream_context_create($options);
    $resultJson = @file_get_contents($verifyUrl, false, $context);
    if ($resultJson === FALSE) {
        http_response_code(500);
        $response['message'] = translate('php-error-recaptcha-failed');
        echo json_encode($response);
        exit;
    }
    $result = json_decode($resultJson);
    if ($result && $result->success) {
        $name    = filter_var(trim($_POST['name'] ?? ''), FILTER_SANITIZE_SPECIAL_CHARS);
        $email   = trim($_POST['email'] ?? '');
        $subject = filter_var(trim($_POST['subject'] ?? ''), FILTER_SANITIZE_SPECIAL_CHARS);
        $message = filter_var(trim($_POST['message'] ?? ''), FILTER_SANITIZE_SPECIAL_CHARS);
        $kuerzel = filter_var(trim($_POST['kuerzel'] ?? ''), FILTER_SANITIZE_SPECIAL_CHARS);
        $rating  = filter_var(trim($_POST['rating'] ?? ''), FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $emailIsValid = false;
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            if (preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
                $emailIsValid = true;
            }
        }
        if (
            empty($name) ||
            !$emailIsValid ||
            empty($subject) ||
            strlen($subject) > 200 ||
            empty($message)
        ) {
            if (!$emailIsValid && !empty($email)) {
                $response['message'] = translate('php-error-email-invalid');
            } else {
                $response['message'] = translate('php-error-fields-incomplete');
            }
        } else {
            try {
                $mail = new PHPMailer(true);
                $mail->isSMTP();
                $mail->Host       = $smtpHost;
                $mail->SMTPAuth   = true;
                $mail->Username   = $smtpUsername;
                $mail->Password   = $smtpPassword;
                $mail->SMTPSecure = $smtpSecure;
                $mail->Port       = $smtpPort;
                $mail->CharSet    = 'UTF-8';
                $mail->SMTPDebug = 0;
                $mail->Timeout = 30;
                $mail->SMTPOptions = [
                    'ssl' => [
                        'verify_peer' => true,
                        'verify_peer_name' => true,
                        'allow_self_signed' => false
                    ]
                ];
                $mail->setFrom($absenderEmail, 'Kontaktformular');
                $mail->addAddress($empfaengerEmail);
                $mail->addReplyTo($email, $name);
                $mailSubject = "Neue Kontaktanfrage: $subject";
                // Modern, accessible, mobile-safe HTML email template.
                // - 600px max-width, table-based layout for client compatibility (Outlook, etc.)
                // - Brand-colored hero, semantic <h1>/<table>/<th>/<td>, language attribute
                // - All user input escaped with htmlspecialchars + ENT_QUOTES + UTF-8
                $esc = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); };
                $rowsHtml = '';
                $rowsHtml .= "<tr><th align=\"left\" scope=\"row\" style=\"padding:12px 16px;background:#f5f7fb;color:#3a3f55;font-weight:600;border-bottom:1px solid #e8ebf0;\">Name</th><td style=\"padding:12px 16px;color:#0f1322;border-bottom:1px solid #e8ebf0;\">" . $esc($name) . "</td></tr>";
                $rowsHtml .= "<tr><th align=\"left\" scope=\"row\" style=\"padding:12px 16px;background:#f5f7fb;color:#3a3f55;font-weight:600;border-bottom:1px solid #e8ebf0;\">E-Mail</th><td style=\"padding:12px 16px;color:#0f1322;border-bottom:1px solid #e8ebf0;\"><a href=\"mailto:" . $esc($email) . "\" style=\"color:#6D9744;text-decoration:underline;\">" . $esc($email) . "</a></td></tr>";
                $rowsHtml .= "<tr><th align=\"left\" scope=\"row\" style=\"padding:12px 16px;background:#f5f7fb;color:#3a3f55;font-weight:600;border-bottom:1px solid #e8ebf0;\">Betreff</th><td style=\"padding:12px 16px;color:#0f1322;border-bottom:1px solid #e8ebf0;\">" . $esc($subject) . "</td></tr>";
                if (!empty($kuerzel)) {
                    $rowsHtml .= "<tr><th align=\"left\" scope=\"row\" style=\"padding:12px 16px;background:#f5f7fb;color:#3a3f55;font-weight:600;border-bottom:1px solid #e8ebf0;\">Kürzel</th><td style=\"padding:12px 16px;color:#0f1322;border-bottom:1px solid #e8ebf0;\">" . $esc($kuerzel) . "</td></tr>";
                }
                if (!empty($rating) && is_numeric($rating)) {
                    $fullStars   = floor($rating);
                    $hasHalfStar = ($rating - $fullStars) >= 0.5;
                    $emptyStars  = 5 - $fullStars - ($hasHalfStar ? 1 : 0);
                    $ratingStars = str_repeat('★', (int)$fullStars) . ($hasHalfStar ? '½★' : '') . str_repeat('☆', (int)$emptyStars);
                    $rowsHtml   .= "<tr><th align=\"left\" scope=\"row\" style=\"padding:12px 16px;background:#f5f7fb;color:#3a3f55;font-weight:600;border-bottom:1px solid #e8ebf0;\">Bewertung</th><td style=\"padding:12px 16px;color:#0f1322;border-bottom:1px solid #e8ebf0;font-size:18px;letter-spacing:2px;\"><span aria-label=\"" . $esc(number_format($rating, 1)) . " von 5 Sternen\">" . $ratingStars . "</span> <span style=\"color:#6b7184;font-size:13px;letter-spacing:0;\">(" . number_format($rating, 1) . "/5)</span></td></tr>";
                }
                $messageEscaped = nl2br($esc($message));
                $mailBodyHTML = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Neue Kontaktanfrage</title>
</head>
<body style="margin:0;padding:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,Arial,sans-serif;color:#0f1322;-webkit-font-smoothing:antialiased;">
<div role="article" aria-roledescription="email" aria-label="Neue Kontaktanfrage über das IBC-Kontaktformular" lang="de">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f5;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(15,19,34,0.10);">
      <tr><td style="background:linear-gradient(135deg,#20234A 0%,#355B2C 60%,#6D9744 100%);padding:28px 24px;text-align:center;color:#ffffff;">
        <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;color:#B8D996;">IBC Kontaktformular</p>
        <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">Neue Kontaktanfrage</h1>
      </td></tr>
      <tr><td style="padding:24px 20px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e8ebf0;">
          ' . $rowsHtml . '
        </table>
      </td></tr>
      <tr><td style="padding:8px 20px 24px;">
        <p style="margin:18px 0 8px 0;color:#3a3f55;font-weight:700;font-size:14px;">Nachricht</p>
        <div style="padding:16px 18px;background:#f5f7fb;border-left:4px solid #6D9744;border-radius:8px;color:#0f1322;font-size:15px;line-height:1.6;white-space:pre-wrap;">' . $messageEscaped . '</div>
      </td></tr>
      <tr><td style="background:#f5f7fb;padding:14px 20px;text-align:center;color:#6b7184;font-size:12px;border-top:1px solid #e8ebf0;">
        Gesendet über das <strong style="color:#0f1322;">IBC Kontaktformular</strong> &middot;
        <a href="https://business-consulting.de/referenzen.html" style="color:#6D9744;text-decoration:underline;">Unsere Referenzen</a>
      </td></tr>
    </table>
    <p style="margin:12px 0 0 0;color:#86868b;font-size:11px;">© Institut für Business Consulting e.V.</p>
  </td></tr>
</table>
</div>
</body>
</html>';
                $mailBodyText   = "Du hast eine neue Nachricht über das Kontaktformular erhalten:\n\n";
                $mailBodyText .= "Name: $name\n";
                $mailBodyText .= "E-Mail: $email\n";
                if (!empty($kuerzel)) {
                    $mailBodyText .= "Kürzel: $kuerzel\n";
                }
                if (!empty($rating) && is_numeric($rating)) {
                    $mailBodyText .= "Bewertung: " . number_format($rating, 1) . "/5 Sternen\n";
                }
                $mailBodyText .= "Betreff: $subject\n\n";
                $mailBodyText .= "Nachricht:\n$message\n\n";
                $mailBodyText .= "---------------------------------------------------\n";
                $mailBodyText .= "Unsere Referenzen: https://business-consulting.de/referenzen.html\n";
                $mail->isHTML(true);
                $mail->Subject = $mailSubject;
                $mail->Body    = $mailBodyHTML;
                $mail->AltBody = $mailBodyText;
                $mail->send();
                try {
                    $mail_reply = new PHPMailer(true);
                    $mail_reply->isSMTP();
                    $mail_reply->Host       = $smtpHost;
                    $mail_reply->SMTPAuth   = true;
                    $mail_reply->Username   = $smtpUsername;
                    $mail_reply->Password   = $smtpPassword;
                    $mail_reply->SMTPSecure = $smtpSecure;
                    $mail_reply->Port       = $smtpPort;
                    $mail_reply->CharSet    = 'UTF-8';
                    $mail_reply->setFrom($absenderEmail, translate('email-confirm-contact-org-name'));
                    $mail_reply->addAddress($email, $name);
                    $logoPath = __DIR__ . '/assets/img/ibc_logo_original.webp';
                    $mascotPath = __DIR__ . '/assets/img/team/Maskottchen.webp';
                    if (file_exists($logoPath)) {
                        $mail_reply->addEmbeddedImage($logoPath, 'logo_cid', 'ibc_logo.webp');
                    }
                    if (file_exists($mascotPath)) {
                        $mail_reply->addEmbeddedImage($mascotPath, 'mascot_cid', 'maskottchen.webp');
                    }
                    $isStudentRelated = (stripos($subject, 'student') !== false ||
                                        stripos($subject, 'praktikum') !== false ||
                                        stripos($subject, 'bewerbung') !== false ||
                                        stripos($subject, 'karriere') !== false);
                    $greeting = $isStudentRelated
                        ? translate('email-confirm-greeting-casual', ['name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8')])
                        : translate('email-confirm-greeting-formal', ['name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8')]);
                    $replySubject = translate('email-confirm-subject', ['subject' => htmlspecialchars($subject, ENT_QUOTES, 'UTF-8')]);
                    $currentYear = date('Y');
                    $userLanguage = getUserLanguage();
                    $fbLink = FALLBACK_FACEBOOK_URL;
                    $igLink = FALLBACK_INSTAGRAM_URL;
                    $liLink = FALLBACK_LINKEDIN_URL;
                    try {
                        if (file_exists(EXTERNAL_LINKS_JSON_PATH)) {
                            $linksJson = file_get_contents(EXTERNAL_LINKS_JSON_PATH);
                            if ($linksJson !== false) {
                                $links = json_decode($linksJson, true);
                                if ($links === null) {
                                    error_log("Failed to parse social media links JSON: Invalid JSON format in " . EXTERNAL_LINKS_JSON_PATH . ": " . json_last_error_msg());
                                } elseif (is_array($links) && isset($links['socialMedia'])) {
                                    $fbLink = $links['socialMedia']['facebook'] ?? $fbLink;
                                    $igLink = $links['socialMedia']['instagram'] ?? $igLink;
                                    $liLink = $links['socialMedia']['linkedin'] ?? $liLink;
                                }
                            } else {
                                error_log("Failed to read social media links JSON file: " . EXTERNAL_LINKS_JSON_PATH);
                            }
                        }
                    } catch (Exception $e) {
                        error_log("Exception while loading social media links from JSON: " . $e->getMessage());
                    }
                    $replyBodyHTML = '
<!DOCTYPE html>
<html lang="' . $userLanguage . '">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>' . translate('email-confirm-header-title') . '</title>
    <style type="text/css">
        :root {
            color-scheme: light dark;
        }
        body, table, td, p, h1, h2, h3, div, span, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        @media (prefers-color-scheme: dark) {
            .email-wrapper {
                background-color: #f5f7fa !important;
            }
            .email-container {
                background-color: #ffffff !important;
            }
            .email-header {
                background: linear-gradient(135deg, #20234A 0%, #1a1d3a 50%, #2c3152 100%) !important;
            }
            .email-body {
                background-color: #ffffff !important;
            }
            .email-box {
                background: linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%) !important;
            }
            .email-footer {
                background-color: #f8f9fb !important;
            }
            .email-footer-dark {
                background: linear-gradient(135deg, #20234A 0%, #1a1d3a 50%, #2c3152 100%) !important;
            }
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .email-body, .email-footer, .email-header {
                padding: 30px 20px !important;
            }
            h1 {
                font-size: 24px !important;
            }
            h2 {
                font-size: 18px !important;
            }
            p {
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif; background-color: #f5f7fa !important; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrapper" style="background-color: #f5f7fa !important; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff !important; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(32, 35, 74, 0.08);">
                    <tr>
                        <td class="email-header" style="background: linear-gradient(135deg, #20234A 0%, #1a1d3a 50%, #2c3152 100%) !important; padding: 45px 30px; text-align: center; position: relative;">';
                    if (file_exists($logoPath)) {
                        $replyBodyHTML .= '
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td align="center">
                                        <img src="cid:logo_cid" alt="' . translate('email-confirm-alt-logo') . '" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
                                    </td>
                                </tr>
                            </table>';
                    }
                    $replyBodyHTML .= '
                            <h1 style="color: #ffffff !important; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.2); letter-spacing: -0.5px;">' . translate('email-confirm-header-title') . '</h1>
                            <p style="color: #e8e9ed !important; margin: 15px 0 0 0; font-size: 16px; font-weight: 400; line-height: 1.5;">' . translate('email-confirm-header-subtitle') . '</p>
                            <div style="width: 80px; height: 3px; background: linear-gradient(90deg, #6D9744 0%, #8bc34a 100%) !important; margin: 20px auto 0; border-radius: 2px;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body" style="padding: 50px 40px 40px 40px; background-color: #ffffff !important;">
                            <p style="color: #333333 !important; font-size: 17px; line-height: 1.7; margin: 0 0 18px 0; font-weight: 400;">
                                ' . $greeting . '
                            </p>
                            <p style="color: #444444 !important; font-size: 16px; line-height: 1.7; margin: 0 0 18px 0;">
                                ' . translate('email-confirm-thankyou') . '
                            </p>
                            <p style="color: #444444 !important; font-size: 16px; line-height: 1.7; margin: 0 0 35px 0;">
                                ' . translate('email-confirm-response-time') . '
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 35px;">
                                <tr>
                                    <td class="email-box" style="background: linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%) !important; border: 2px solid #e5e8ef; border-radius: 10px; padding: 32px; box-shadow: 0 3px 10px rgba(32, 35, 74, 0.06);">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                                            <tr>
                                                <td style="width: 5px; background: linear-gradient(180deg, #20234A 0%, #6D9744 100%) !important; border-radius: 3px; vertical-align: top;">&nbsp;</td>
                                                <td style="padding-left: 15px;">
                                                    <h2 style="color: #20234A !important; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.3px;">' . translate('email-confirm-summary-title') . '</h2>
                                                </td>
                                            </tr>
                                        </table>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td style="color: #666666 !important; font-size: 14px; padding: 12px 0; font-weight: 700; width: 130px; vertical-align: top;">' . translate('email-confirm-summary-subject') . '</td>
                                                <td style="color: #333333 !important; font-size: 15px; padding: 12px 0; line-height: 1.6; font-weight: 500;">' . htmlspecialchars($subject, ENT_QUOTES, 'UTF-8') . '</td>
                                            </tr>';
                                            if (!empty($kuerzel)) {
                                                $replyBodyHTML .= '
                                            <tr>
                                                <td style="color: #666666 !important; font-size: 14px; padding: 12px 0; font-weight: 700; vertical-align: top; border-top: 1px solid #f0f0f0;">' . translate('email-confirm-summary-kuerzel') . '</td>
                                                <td style="color: #333333 !important; font-size: 15px; padding: 12px 0; line-height: 1.6; font-weight: 500; border-top: 1px solid #f0f0f0;">' . htmlspecialchars($kuerzel, ENT_QUOTES, 'UTF-8') . '</td>
                                            </tr>';
                                            }
                                            if (!empty($rating) && is_numeric($rating)) {
                                                $fullStars = floor($rating);
                                                $hasHalfStar = ($rating - $fullStars) >= 0.5;
                                                $emptyStars = 5 - $fullStars - ($hasHalfStar ? 1 : 0);
                                                $starDisplay = str_repeat('⭐', $fullStars);
                                                if ($hasHalfStar) {
                                                    $starDisplay .= '✨';
                                                }
                                                $starDisplay .= str_repeat('☆', $emptyStars);
                                                $replyBodyHTML .= '
                                            <tr>
                                                <td style="color: #666666 !important; font-size: 14px; padding: 12px 0; font-weight: 700; vertical-align: top; border-top: 1px solid #f0f0f0;">' . translate('email-confirm-summary-rating') . '</td>
                                                <td style="color: #333333 !important; font-size: 15px; padding: 12px 0; line-height: 1.6; border-top: 1px solid #f0f0f0;">
                                                    <span style="font-size: 18px; letter-spacing: 2px; vertical-align: middle;">' . $starDisplay . '</span>
                                                    <span style="color: #666666 !important; font-size: 14px; font-weight: 500;">(' . number_format($rating, 1) . '/5)</span>
                                                </td>
                                            </tr>';
                                            }
                                            $replyBodyHTML .= '
                                        </table>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <p style="color: #666666 !important; font-size: 14px; margin: 0 0 12px 0; font-weight: 700;">' . translate('email-confirm-summary-message') . '</p>
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="color: #333333 !important; font-size: 15px; line-height: 1.8; background-color: #ffffff; padding: 22px; border-radius: 8px; border: 1px solid #e5e8ef; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                                                                ' . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . '
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f8f9fb 0%, #e8eaf0 100%) !important; border-left: 5px solid #6D9744; padding: 20px 22px; border-radius: 6px; box-shadow: 0 2px 5px rgba(109, 151, 68, 0.1);">
                                        <p style="color: #20234A !important; font-size: 15px; line-height: 1.7; margin: 0;">
                                            <strong style="font-weight: 700;">' . translate('email-confirm-note-title') . '</strong> ' . translate('email-confirm-note-text') . '
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #444444 !important; font-size: 16px; line-height: 1.7; margin: 0 0 10px 0;">
                                ' . translate('email-confirm-closing') . '
                            </p>
                            <p style="color: #20234A !important; font-size: 17px; line-height: 1.7; margin: 0; font-weight: 700;">
                                ' . translate('email-confirm-team') . '
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fb !important; padding: 40px 40px; border-top: 1px solid #e5e8ef;">
                            <h3 style="color: #20234A !important; font-size: 20px; margin: 0 0 24px 0; font-weight: 700; letter-spacing: -0.3px;">' . translate('email-confirm-contact-title') . '</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td style="padding-bottom: 18px;">
                                        <p style="margin: 0; color: #20234A; font-size: 15px; line-height: 1.6; font-weight: 700;">
                                            ' . translate('email-confirm-contact-org-name') . '
                                        </p>
                                        <p style="margin: 6px 0 0 0; color: #666666; font-size: 14px; line-height: 1.7;">
                                            ' . translate('email-confirm-contact-address') . '
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 16px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-right: 8px; vertical-align: middle;">
                                                    <span style="font-size: 18px;">📧</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
                                                        <strong style="color: #20234A !important;">' . translate('email-confirm-contact-email-label') . '</strong>
                                                        <a href="mailto:vorstand@business-consulting.de" style="color: #6D9744 !important; text-decoration: none; font-weight: 600;">vorstand@business-consulting.de</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 22px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-right: 8px; vertical-align: middle;">
                                                    <span style="font-size: 18px;">🌐</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
                                                        <strong style="color: #20234A !important;">' . translate('email-confirm-contact-website-label') . '</strong>
                                                        <a href="https://business-consulting.de" style="color: #6D9744 !important; text-decoration: none; font-weight: 600;">business-consulting.de</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 6px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background: linear-gradient(135deg, #20234A 0%, #2c3152 100%) !important; border-radius: 8px; box-shadow: 0 4px 12px rgba(32, 35, 74, 0.25);">
                                                    <a href="https://googleusercontent.com/maps.google.com/11" target="_blank" style="display: inline-block; padding: 13px 26px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;">
                                                        ' . translate('email-confirm-cta-route') . '
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding: 6px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background: linear-gradient(135deg, #20234A 0%, #2c3152 100%) !important; border-radius: 8px; box-shadow: 0 4px 12px rgba(32, 35, 74, 0.25);">
                                                    <a href="https://business-consulting.de/ueber-uns.html#team" target="_blank" style="display: inline-block; padding: 13px 26px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;">
                                                        ' . translate('email-confirm-cta-team') . '
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 6px;" align="center">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="background: linear-gradient(135deg, #6D9744 0%, #8bc34a 100%) !important; border-radius: 8px; box-shadow: 0 4px 12px rgba(109, 151, 68, 0.3);">
                                                    <a href="https://business-consulting.de/referenzen.html" target="_blank" style="display: inline-block; padding: 13px 28px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;">
                                                        ' . translate('email-confirm-cta-references') . '
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-footer-dark" style="background: linear-gradient(135deg, #20234A 0%, #1a1d3a 50%, #2c3152 100%) !important; padding: 35px 40px; text-align: center;">';
                    if (file_exists($logoPath)) {
                        $replyBodyHTML .= '
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td align="center">
                                        <img src="cid:logo_cid" alt="' . translate('email-confirm-alt-logo') . '" style="max-width: 140px; height: auto; display: block; margin: 0 auto; opacity: 0.95;" />
                                    </td>
                                </tr>
                            </table>';
                    }
                    if (file_exists($mascotPath)) {
                        $replyBodyHTML .= '
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td align="center">
                                        <img src="cid:mascot_cid" alt="' . translate('email-confirm-alt-mascot') . '" style="max-width: 120px; height: auto; display: block; margin: 0 auto; opacity: 0.95;" />
                                    </td>
                                </tr>
                            </table>';
                    }
                    $replyBodyHTML .= '
                            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 25px auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.12) !important; border-radius: 50%; text-align: center; transition: all 0.3s ease;">
                                                    <a href="' . htmlspecialchars($fbLink, ENT_QUOTES, 'UTF-8') . '" target="_blank" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; color: #ffffff; text-decoration: none; font-size: 20px; font-weight: 700; font-family: Arial, sans-serif;" aria-label="Facebook">
                                                        f
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding: 0 10px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.12) !important; border-radius: 50%; text-align: center; transition: all 0.3s ease;">
                                                    <a href="' . htmlspecialchars($igLink, ENT_QUOTES, 'UTF-8') . '" target="_blank" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; color: #ffffff; text-decoration: none; font-size: 20px; font-weight: 700; font-style: italic; font-family: Georgia, serif;" aria-label="Instagram">
                                                        i
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding: 0 10px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.12) !important; border-radius: 50%; text-align: center; transition: all 0.3s ease;">
                                                    <a href="' . htmlspecialchars($liLink, ENT_QUOTES, 'UTF-8') . '" target="_blank" style="display: inline-block; width: 48px; height: 48px; line-height: 48px; color: #ffffff; text-decoration: none; font-size: 20px; font-weight: 700; font-family: Arial, sans-serif;" aria-label="LinkedIn">
                                                        in
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 22px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent 0%, rgba(109, 151, 68, 0.6) 50%, transparent 100%); margin: 0 auto;"></div>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 14px 0; color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.6;">
                                ' . translate('email-confirm-footer-copyright', ['year' => $currentYear]) . '
                            </p>
                            <p style="margin: 0 0 14px 0; color: #b8bac7; font-size: 12px; line-height: 1.6; font-weight: 400;">
                                ' . translate('email-confirm-footer-rights') . '
                            </p>
                            <p style="margin: 0 0 14px 0; color: #b8bac7; font-size: 11px; line-height: 1.6;">
                                <a href="https://business-consulting.de/datenschutz.html" target="_blank" style="color: #8bc34a !important; text-decoration: underline; font-weight: 500;">' . translate('email-confirm-footer-privacy') . '</a>
                            </p>
                            <p style="margin: 0; color: #9799ab; font-size: 11px; line-height: 1.6; font-style: italic; font-weight: 300;">
                                ' . translate('email-confirm-footer-automated') . '
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
                    $greetingText = $isStudentRelated
                        ? strip_tags(translate('email-confirm-greeting-casual', ['name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8')]))
                        : strip_tags(translate('email-confirm-greeting-formal', ['name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8')]));
                    $replyBodyText = $greetingText . "\n\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-thankyou')) . "\n\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-response-time')) . "\n\n";
                    $replyBodyText .= "═══════════════════════════════════════════════════\n";
                    $replyBodyText .= "  " . strtoupper(translate('email-confirm-summary-title')) . "\n";
                    $replyBodyText .= "═══════════════════════════════════════════════════\n\n";
                    $replyBodyText .= translate('email-confirm-summary-subject') . " " . htmlspecialchars($subject, ENT_QUOTES, 'UTF-8') . "\n";
                    if (!empty($kuerzel)) {
                        $replyBodyText .= translate('email-confirm-summary-kuerzel') . " " . htmlspecialchars($kuerzel, ENT_QUOTES, 'UTF-8') . "\n";
                    }
                    if (!empty($rating) && is_numeric($rating)) {
                        $fullStars = floor($rating);
                        $hasHalfStar = ($rating - $fullStars) >= 0.5;
                        $emptyStars = 5 - $fullStars - ($hasHalfStar ? 1 : 0);
                        $ratingStars = str_repeat('★', $fullStars);
                        if ($hasHalfStar) {
                            $ratingStars .= '½';
                        }
                        $ratingStars .= str_repeat('☆', $emptyStars);
                        $replyBodyText .= translate('email-confirm-summary-rating') . " " . $ratingStars . " (" . number_format($rating, 1) . "/5)\n";
                    }
                    $replyBodyText .= "\n" . translate('email-confirm-summary-message') . "\n";
                    $replyBodyText .= "---------------------------------------------------\n";
                    $replyBodyText .= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . "\n";
                    $replyBodyText .= "---------------------------------------------------\n\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-note-title')) . " " . strip_tags(translate('email-confirm-note-text')) . "\n\n";
                    $replyBodyText .= translate('email-confirm-closing') . "\n";
                    $replyBodyText .= translate('email-confirm-team') . "\n\n";
                    $replyBodyText .= "═══════════════════════════════════════════════════\n";
                    $replyBodyText .= "  " . strtoupper(translate('email-confirm-contact-title')) . "\n";
                    $replyBodyText .= "═══════════════════════════════════════════════════\n\n";
                    $replyBodyText .= translate('email-confirm-contact-org-name') . "\n";
                    $replyBodyText .= strip_tags(str_replace('<br>', "\n", translate('email-confirm-contact-address'))) . "\n\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-contact-email-label')) . " vorstand@business-consulting.de\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-contact-website-label')) . " https://business-consulting.de\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-cta-route')) . " https://googleusercontent.com/maps.google.com/11\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-cta-team')) . " https://business-consulting.de/ueber-uns.html#team\n";
                    $replyBodyText .= strip_tags(translate('email-confirm-cta-references')) . " https://business-consulting.de/referenzen.html\n\n";
                    $replyBodyText .= "Social Media:\n";
                    $replyBodyText .= "Facebook: " . $fbLink . "\n";
                    $replyBodyText .= "Instagram: " . $igLink . "\n";
                    $replyBodyText .= "LinkedIn: " . $liLink . "\n\n";
                    $replyBodyText .= "---------------------------------------------------\n";
                    $replyBodyText .= translate('email-confirm-footer-copyright', ['year' => $currentYear]) . "\n";
                    $replyBodyText .= translate('email-confirm-footer-rights') . "\n";
                    $replyBodyText .= translate('email-confirm-footer-privacy') . ": https://business-consulting.de/datenschutz.html\n\n";
                    $replyBodyText .= translate('email-confirm-footer-automated') . "\n";
                    $mail_reply->isHTML(true);
                    $mail_reply->Subject = $replySubject;
                    $mail_reply->Body    = $replyBodyHTML;
                    $mail_reply->AltBody = $replyBodyText;
                    $mail_reply->send();
                } catch (Exception $replyException) {
                    error_log("Bestätigungs-E-Mail konnte nicht gesendet werden (confirmation email failed)");
                }
                $hubspotConsent = isset($_POST['hubspot_consent']) && $_POST['hubspot_consent'] === 'on';
                $hubspotSuccess = true;
                $hubspotErrorMessage = '';
                if ($hubspotConsent) {
                    try {
                        $nameParts = splitName($name);
                        $phone = filter_var(trim($_POST['phone'] ?? ''), FILTER_SANITIZE_SPECIAL_CHARS);
                        $mobilephone = filter_var(trim($_POST['mobilephone'] ?? ''), FILTER_SANITIZE_SPECIAL_CHARS);
                        $hubspotResult = createHubSpotContact([
                            'email' => $email,
                            'firstname' => $nameParts['firstname'],
                            'lastname' => $nameParts['lastname'],
                            'phone' => $phone,
                            'mobilephone' => $mobilephone,
                            'subject' => $subject,
                            'message' => $message
                        ]);
                        if (!$hubspotResult) {
                            $hubspotSuccess = false;
                            $hubspotErrorMessage = "CRM-Integration fehlgeschlagen";
                            error_log("HubSpot: Contact creation failed");
                        } else {
                            error_log("HubSpot: Contact created successfully");
                        }
                    } catch (\Exception $hubspotException) {
                        $hubspotSuccess = false;
                        $hubspotErrorMessage = "CRM-Fehler aufgetreten";
                        error_log("HubSpot: Exception occurred during contact creation");
                    }
                } else {
                    error_log("HubSpot: User did not consent to CRM processing");
                }
                $response['success'] = true;
                $response['message'] = translate('php-success-email-sent');
                if (!$hubspotSuccess) {
                    error_log("NOTICE: Email sent successfully but HubSpot sync failed");
                }
            } catch (Exception $e) {
                $errorDetails = "SMTP Error Details: " . $mail->ErrorInfo;
                error_log("CONTACT FORM SMTP ERROR: " . $errorDetails);
                error_log("SMTP Exception Message: " . $e->getMessage());
                http_response_code(500);
                $errorInfoLower = strtolower($mail->ErrorInfo);
                if (strpos($errorInfoLower, 'could not connect') !== false ||
                    strpos($errorInfoLower, 'connection refused') !== false ||
                    strpos($errorInfoLower, 'connection timed out') !== false ||
                    strpos($errorInfoLower, 'network is unreachable') !== false) {
                    $response['message'] = translate('php-error-smtp-connection');
                    error_log("SMTP CONNECTION ERROR - Host: $smtpHost, Port: $smtpPort, User: $smtpUsername");
                } elseif (strpos($errorInfoLower, 'authentication') !== false ||
                          strpos($errorInfoLower, 'username and password not accepted') !== false ||
                          strpos($errorInfoLower, 'invalid credentials') !== false) {
                    $response['message'] = translate('php-error-smtp-auth');
                    error_log("SMTP AUTHENTICATION ERROR - Check credentials for: $smtpUsername");
                } else {
                    $response['message'] = translate('php-error-email-send');
                }
            }
        }
    } else {
        error_log("SECURITY: reCAPTCHA verification failed for IP: " . $clientIP);
        $response['message'] = translate('php-error-recaptcha-verify-failed');
    }
} else {
    error_log("SECURITY: Invalid request method for send_mail.php from IP: " . $clientIP);
    $response['message'] = translate('php-error-invalid-request');
}
$output = ob_get_clean();
if (!empty($output)) {
    error_log("Unexpected output in send_mail.php: " . substr($output, 0, ERROR_LOG_OUTPUT_MAX_LENGTH));
}
echo json_encode($response);
?>