# TypeScript/Vite-Migration – Leitfaden

## Setup (bereits eingerichtet)

- `vite.config.ts` – Multi-Page-Build: jede HTML-Seite ist ein Entry-Point
- `tsconfig.json` – strikte Typprüfung, nur für `src/**`
- `src/main.ts` – zentraler Einstiegspunkt
- `src/ts/` – migrierte, typisierte Module (Beispiel: `fade-in-animation.ts`)

## Entwicklung

```bash
npm run php   # Terminal 1: PHP-Endpoints (send_mail.php etc.) auf :8788
npm run dev   # Terminal 2: Vite-Dev-Server mit HMR auf :5173
```

Vite proxied alle `*.php`-Requests automatisch an den PHP-Server.

## Ein Modul migrieren (Muster)

1. Datei aus `js/` nach `src/ts/` kopieren, `.ts`-Endung, Typen ergänzen.
   IIFE/`DOMContentLoaded`-Wrapper entfernen – stattdessen eine
   `init…()`-Funktion exportieren.
2. In `src/main.ts` importieren und in `onReady(...)` aufrufen.
3. In **allen** HTML-Seiten den alten `<script src="js/…"></script>`-Tag
   entfernen. Falls noch nicht geschehen, einmalig einbinden:
   `<script type="module" src="/src/main.ts"></script>`
4. `npm run typecheck && npm run build` – muss fehlerfrei sein.
5. Alte Datei in `js/` löschen, sobald keine Seite sie mehr lädt.

Wichtig: Ein Modul niemals doppelt laden (alt in `js/` + neu in `src/`).

## Build & Deployment

```bash
npm run build   # erzeugt dist/
```

`dist/` enthält die HTML-Seiten mit gebündeltem, minifiziertem CSS.

**Achtung – Stand heute ist `dist/` noch NICHT allein deploybar:**

- Klassische `<script src="js/…">`-Tags werden von Vite nicht gebündelt
  und `js/` wird nicht nach `dist/` kopiert. Erst wenn alle Module nach
  `src/ts/` migriert und die alten Tags entfernt sind, ist der Build
  vollständig.
- PHP-Dateien (`send_mail.php`, `get_csrf.php`, `translate.php`,
  `config.php`, `private/`, `vendor/`) sowie `.htaccess` kopiert Vite
  ebenfalls nicht.

Bis zum Ende der Migration wird weiterhin das Repo-Root deployed (wie
bisher) – alle aktuellen Fixes funktionieren ohne Build-Schritt.

## Empfohlene Migrationsreihenfolge

Klein anfangen, pro Schritt bauen und testen:

1. Blattmodule ohne Abhängigkeiten (`fade-in-animation.js` ✓,
   `navbar-scroll.js`, `footer-utils.js`, `gluehweinstand-year.js`)
2. Loader (`content-loader.js`, `references-loader.js`, `netzwerk-loader.js`)
3. Formulare (`contact-form.js` – Achtung: CSRF-Flow mit `get_csrf.php`)
4. Zuletzt `main.js` (größte Datei, viele Teilfunktionen – beim Migrieren
   in mehrere Module aufteilen)
