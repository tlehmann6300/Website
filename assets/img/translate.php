<?php
function getUserLanguage() {
    if (isset($_GET['lang']) && in_array($_GET['lang'], ['de', 'en', 'fr'])) {
        return $_GET['lang'];
    }
    if (isset($_COOKIE['language']) && in_array($_COOKIE['language'], ['de', 'en', 'fr'])) {
        return $_COOKIE['language'];
    }
    if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
        $acceptLang = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
        $languages = [];
        if (preg_match_all('/([a-z]{2})(?:-[A-Z]{2})?(?:;q=([0-9]+(?:\.[0-9]+)?))?/i', $acceptLang, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $lang = strtolower($match[1]);
                $quality = isset($match[2]) ? floatval($match[2]) : 1.0;
                if (in_array($lang, ['de', 'en', 'fr'])) {
                    $languages[$lang] = $quality;
                }
            }
            arsort($languages);
            if (!empty($languages)) {
                return key($languages);
            }
        }
    }
    return 'de';
}
function loadTranslations() {
    static $translations = null;
    static $lastModified = 0;
    $translationsFile = __DIR__ . '/assets/data/translations/translations.json';
    if (!file_exists($translationsFile)) {
        error_log("Translation file not found: " . $translationsFile);
        return [];
    }
    $currentModified = filemtime($translationsFile);
    if ($translations !== null && $currentModified === $lastModified) {
        return $translations;
    }
    $jsonContent = file_get_contents($translationsFile);
    if ($jsonContent === false) {
        error_log("Failed to read translation file: " . $translationsFile);
        return [];
    }
    $translations = json_decode($jsonContent, true);
    if ($translations === null) {
        error_log("Failed to parse translation file: " . $translationsFile);
        return [];
    }
    $lastModified = $currentModified;
    return $translations;
}
function translate($key, $params = [], $lang = null) {
    if ($lang === null) {
        $lang = getUserLanguage();
    }
    $translations = loadTranslations();
    if (!isset($translations[$key])) {
        error_log("Translation key not found: " . $key);
        return $key;
    }
    if (!isset($translations[$key][$lang])) {
        error_log("Translation not found for key '$key' in language '$lang'");
        if (isset($translations[$key]['de'])) {
            $message = $translations[$key]['de'];
        } else {
            return $key;
        }
    } else {
        $message = $translations[$key][$lang];
    }
    if (!empty($params)) {
        foreach ($params as $placeholder => $value) {
            $safeValue = htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
            $message = str_replace('{' . $placeholder . '}', $safeValue, $message);
        }
    }
    return $message;
}
function t($key, $params = [], $lang = null) {
    return translate($key, $params, $lang);
}
function getTranslationsForLanguage($lang = 'de') {
    $translations = loadTranslations();
    $result = [];
    foreach ($translations as $key => $values) {
        if (isset($values[$lang])) {
            $result[$key] = $values[$lang];
        }
    }
    return $result;
}
