import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Multi-Page-Setup: jede HTML-Seite ist ein eigener Einstiegspunkt.
 * PHP-Endpoints (send_mail.php, get_csrf.php, translate.php) werden im
 * Dev-Modus an den lokalen PHP-Server weitergereicht:
 *   Terminal 1: npm run php    (PHP-Endpoints auf :8788)
 *   Terminal 2: npm run dev    (Vite mit HMR auf :5173)
 */
const pages = [
  'index',
  'fuer-studierende',
  'fuer-unternehmen',
  'ueber-uns',
  'unser-netzwerk',
  'referenzen',
  'kontakt',
  'impressum',
  'datenschutzerklaerung',
  'cookie-richtlinie-eu',
  '403',
  '404',
  '500',
  'maintenance',
];

export default defineConfig({
  // Relative Asset-Pfade, damit der Build auf jedem (Sub-)Pfad läuft
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((p) => [p, resolve(__dirname, `${p}.html`)])
      ),
    },
  },
  server: {
    proxy: {
      // alle Top-Level-PHP-Endpoints an php -S weiterreichen
      '^/[^/]+\\.php': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
});
