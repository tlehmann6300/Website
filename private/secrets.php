<?php
require_once __DIR__ . '/../vendor/autoload.php';
use Dotenv\Dotenv;
try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/config');
    $dotenv->safeLoad();
} catch (\Exception $e) {
    error_log("Fehler beim Laden der .env-Datei in private/secrets.php: " . $e->getMessage());
}
$supportEmail = $_ENV['IT_EMAIL'] ?? getenv('IT_EMAIL');
if (!$supportEmail) {
    $supportEmail = $_ENV['EMPFAENGER_EMAIL'] ?? getenv('EMPFAENGER_EMAIL');
}
if (!$supportEmail) {
    $supportEmail = 'support@ihre-firma.de';
}
define('SUPPORT_EMAIL', $supportEmail);
define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: 'smtp.ionos.de');
$smtpPort = $_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: '587';
$smtpPortInt = filter_var($smtpPort, FILTER_VALIDATE_INT);
if ($smtpPortInt === false || $smtpPortInt < 1 || $smtpPortInt > 65535) {
    $smtpPortInt = 587;
    error_log("Warning: Invalid SMTP_PORT value, using default 587");
}
define('SMTP_PORT', $smtpPortInt);
define('SMTP_USER', $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME') ?: 'ihre-email@ihre-domain.de');
define('SMTP_PASS', $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD') ?: 'ihr-smtp-passwort');
define('SMTP_FROM', $_ENV['ABSENDER_EMAIL'] ?? getenv('ABSENDER_EMAIL') ?: 'ihre-email@ihre-domain.de');
define('SMTP_FROM_NAME', 'IBC Support System');
define('SMTP_SECURE', $_ENV['SMTP_SECURE'] ?? getenv('SMTP_SECURE') ?: 'TLS');
