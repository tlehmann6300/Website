<?php
use Dotenv\Dotenv;
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    error_log("CRITICAL: Composer dependencies not installed. Run 'composer install' in the Website directory.");
    http_response_code(500);
    die('Server configuration error');
}
require __DIR__ . '/vendor/autoload.php';
try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/private/config');
    $dotenv->safeLoad();
} catch (\Exception $e) {
    error_log("UPTIME MONITOR ERROR: Cannot load .env file: " . $e->getMessage());
    http_response_code(500);
    die('Configuration error');
}
$requiredToken = $_ENV['UPTIME_CHECK_TOKEN'] ?? getenv('UPTIME_CHECK_TOKEN');
$providedToken = $_GET['token'] ?? '';
if (!$requiredToken) {
    error_log("CRITICAL: Uptime check token not configured");
    http_response_code(500);
    die('Configuration error');
}
if (empty($providedToken) || !hash_equals($requiredToken, $providedToken)) {
    http_response_code(403);
    die('Access denied');
}
function getEnvVar($key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}
$urlToCheck = getEnvVar('UPTIME_URL_TO_CHECK');
$alertEmail = getEnvVar('UPTIME_ALERT_EMAIL');
$smtpHost   = getEnvVar('SMTP_HOST');
$smtpUser   = getEnvVar('SMTP_USER') ?: getEnvVar('SMTP_USERNAME');
$smtpPass   = getEnvVar('SMTP_PASS') ?: getEnvVar('SMTP_PASSWORD');
$smtpPort   = getEnvVar('SMTP_PORT', 587);
$smtpFromEmail = getEnvVar('SMTP_FROM_EMAIL', 'monitor@business-consulting.de');
$smtpFromName = getEnvVar('SMTP_FROM_NAME', 'IBC Uptime Monitor');
$smtpSecureEnv = strtoupper(getEnvVar('SMTP_SECURE', 'tls'));
if ($smtpSecureEnv === 'SSL') {
    $smtpSecure = PHPMailer::ENCRYPTION_SMTPS;
} elseif ($smtpSecureEnv === 'TLS' || $smtpSecureEnv === 'STARTTLS') {
    $smtpSecure = PHPMailer::ENCRYPTION_STARTTLS;
} else {
    $smtpSecure = '';
}
$requiredVars = [
    'UPTIME_URL_TO_CHECK' => $urlToCheck,
    'UPTIME_ALERT_EMAIL' => $alertEmail,
    'SMTP_HOST' => $smtpHost,
    'SMTP_USER' => $smtpUser,
    'SMTP_PASS' => $smtpPass
];
foreach ($requiredVars as $varName => $value) {
    if (empty($value)) {
        die("ERROR: Required environment variable $varName is not set in .env file.\n");
    }
}
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'phpmailer/src/Exception.php';
require 'phpmailer/src/PHPMailer.php';
require 'phpmailer/src/SMTP.php';
function checkWebsite($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);
    if ($httpCode >= 200 && $httpCode < 400) {
        return ['status' => true, 'code' => $httpCode];
    } else {
        return ['status' => false, 'code' => $httpCode, 'error' => $error];
    }
}
$check = checkWebsite($urlToCheck);
if ($check['status'] === false) {
    sendAlertMail($check['code'], $check['error']);
}
function sendAlertMail($code, $curlError) {
    global $alertEmail, $urlToCheck, $smtpHost, $smtpUser, $smtpPass, $smtpPort, $smtpFromEmail, $smtpFromName, $smtpSecure;
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $smtpHost;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtpUser;
        $mail->Password   = $smtpPass;
        $mail->SMTPSecure = $smtpSecure;
        $mail->Port       = $smtpPort;
        $mail->Timeout    = 30;
        $mail->setFrom($smtpFromEmail, $smtpFromName);
        $mail->addAddress($alertEmail);
        $mail->isHTML(true);
        $mail->Subject = '⚠️ ALARM: Website nicht erreichbar (Code ' . $code . ')';
        $mail->Body    = "
            <h1>Website Down Alert</h1>
            <p>Die Website <strong>$urlToCheck</strong> ist nicht erreichbar.</p>
            <ul>
                <li><strong>HTTP Status Code:</strong> $code</li>
                <li><strong>Fehler Details:</strong> $curlError</li>
                <li><strong>Zeitpunkt:</strong> " . date('Y-m-d H:i:s') . "</li>
            </ul>
            <p>Bitte sofort prüfen!</p>
        ";
        $mail->AltBody = "ALARM: Website $urlToCheck ist down. Code: $code. Fehler: $curlError";
        $mail->send();
        echo 'Alarm-Email wurde gesendet.';
    } catch (Exception $e) {
        echo "Nachricht konnte nicht gesendet werden. Mailer Error: {$mail->ErrorInfo}";
    }
}
?>