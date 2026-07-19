/**
 * Zentraler TypeScript-Einstiegspunkt (Vite).
 *
 * Migrationsmuster: Module aus js/ werden nach und nach als typisierte
 * Module nach src/ts/ überführt und hier importiert. Sobald ein Modul
 * migriert ist, wird der zugehörige <script src="js/…"> -Tag in den
 * HTML-Seiten entfernt und stattdessen (einmalig pro Seite) eingebunden:
 *
 *   <script type="module" src="/src/main.ts"></script>
 *
 * Details: siehe MIGRATION-TS.md
 */
import { initFadeInAnimation } from './ts/fade-in-animation';

function onReady(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

onReady(() => {
  initFadeInAnimation();
});
