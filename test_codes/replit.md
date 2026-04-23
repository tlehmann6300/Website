# IBC Website - Institut für Business Consulting e.V.

## Overview
This is the official website for the Institut für Business Consulting e.V. (IBC), a student-run consulting firm at Furtwangen University, Germany. The site provides information about their services and allows students and companies to connect with IBC.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3
- **Backend**: PHP 8.2 (serves pages and handles contact form submissions via PHPMailer)
- **Data/i18n**: JSON files for content management and multilingual support (German, English, French)
- **Dependencies**: Composer (PHP), NPM (frontend assets)

## Project Structure
- `index.html` - Main landing page
- `*.html` - Additional pages (kontakt, ueber-uns, referenzen, etc.)
- `send_mail.php` - Contact form handler (uses PHPMailer)
- `config.php` - Outputs JS config from environment variables
- `get_csrf.php` - CSRF token generation
- `private/config/` - Directory for `.env` file with secrets
- `vendor/` - Composer PHP dependencies (phpmailer, phpdotenv)
- `assets/` - Images, icons, JSON data, vendor CSS/JS
- `css/` - Modular stylesheets
- `js/` - Modular JavaScript files
- `fonts/` - Web fonts (Inter)

## Environment Variables
Store in `private/config/.env`:
- `GOOGLE_ANALYTICS_ID` - GA4 tracking ID (e.g., G-XXXXXXXXXX)
- `RECAPTCHA_SITE_KEY` - reCAPTCHA v3 public site key
- `RECAPTCHA_SECRET_KEY` - reCAPTCHA v3 secret key (used server-side only)
- `SMTP_*` - Mail server credentials for PHPMailer

## Running the App
The app runs via PHP's built-in development server:
```
php -S 0.0.0.0:5000
```

## Deployment
- Target: autoscale
- Run command: `php -S 0.0.0.0:5000`
- Port: 5000
