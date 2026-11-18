import { prefersReducedMotion } from './env';

/** Wraps each word of `el` in a span; the original text stays as the accessible name. */
function splitWords(el: HTMLElement): void {
  const text = el.textContent?.trim() ?? '';
  if (!text || el.dataset.split) return;
  el.dataset.split = '';
  el.setAttribute('aria-label', text);
  el.replaceChildren(
    ...text.split(/\s+/).flatMap((word, i, all) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--i', String(i));
      span.textContent = word;
      return i < all.length - 1 ? [span, document.createTextNode(' ')] : [span];
    }),
  );
}

/** threshold 0 + bottom margin: works for sections taller than the viewport too. */
export const REVEAL_OPTIONS = { threshold: 0, rootMargin: '0px 0px -10% 0px' } as const;

export function initReveal(root: Document = document): void {
  // Tells the CSS fallback the module is alive (see global.css).
  root.documentElement.setAttribute('data-reveal-ready', '');
  const els = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  els.filter((el) => el.dataset.reveal === 'words').forEach(splitWords);

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.setAttribute('data-revealed', ''));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute('data-revealed', '');
        io.unobserve(e.target);
      }
    },
    REVEAL_OPTIONS,
  );
  els.forEach((el) => io.observe(el));
}
