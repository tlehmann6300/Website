<?php
/**
 * security_headers.php — runtime fallback for sites where .htaccess
 * cannot apply (e.g. PHP built-in dev server, NGINX without rules).
 *
 * Include this from any PHP entry point BEFORE writing output:
 *     require_once __DIR__ . '/private/security_headers.php';
 *
 * Sets the same headers the .htaccess sets in production. Idempotent.
 */

if (defined('IBC_SECURITY_HEADERS_APPLIED')) return;
define('IBC_SECURITY_HEADERS_APPLIED', true);

if (headers_sent()) return;

// Strip the Server / X-Powered-By leak
header_remove('X-Powered-By');
@header_remove('Server');

// Clickjacking
header('X-Frame-Options: SAMEORIGIN');
// MIME sniffing
header('X-Content-Type-Options: nosniff');
// Referrer leak prevention
header('Referrer-Policy: strict-origin-when-cross-origin');
// Lock down browser-features we don't use
header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()');
// Cross-origin
header('Cross-Origin-Opener-Policy: same-origin');
header('Cross-Origin-Resource-Policy: same-origin');

// HSTS — only meaningful over HTTPS, but harmless to set
$isHttps = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    || (!empty($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
);
if ($isHttps) {
    header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
}

// CSP — same policy as .htaccess. Allow the few external services we use:
// Google Analytics, reCAPTCHA, Microsoft Forms (Infoabend), Instagram embeds.
header(
    "Content-Security-Policy: " .
    "default-src 'self'; " .
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com; " .
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
    "img-src 'self' data: blob: https:; " .
    "font-src 'self' data: https://fonts.gstatic.com; " .
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com; " .
    "frame-src 'self' https://www.google.com https://www.instagram.com https://www.youtube.com https://forms.office.com; " .
    "media-src 'self' blob:; " .
    "object-src 'none'; " .
    "base-uri 'self'; " .
    "form-action 'self'; " .
    "frame-ancestors 'self'; " .
    "upgrade-insecure-requests"
);
