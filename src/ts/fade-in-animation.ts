/**
 * Fade-In-Animation (TypeScript-Migration von js/fade-in-animation.js)
 *
 * Beobachtet Elemente mit der Klasse `fade-in-up` und blendet sie ein,
 * sobald sie in den Viewport scrollen. Respektiert prefers-reduced-motion.
 */

const REVEAL_CLASS = 'is-visible';
const TARGET_SELECTOR = '.fade-in-up';

export function initFadeInAnimation(): void {
  const targets = document.querySelectorAll<HTMLElement>(TARGET_SELECTOR);
  if (targets.length === 0) return;

  // Reduzierte Bewegung: alles sofort sichtbar, kein Observer nötig
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add(REVEAL_CLASS));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.transitionDelay = el.dataset['animationDelay'] ?? '0ms';
        el.classList.add(REVEAL_CLASS);
        observer.unobserve(el);
      }
    },
    { threshold: 0.05 }
  );

  targets.forEach((el) => observer.observe(el));
}
