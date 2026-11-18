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

export function initReveal(root: Document = document): void {
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
    { threshold: 0.15 },
  );
  els.forEach((el) => io.observe(el));
}
