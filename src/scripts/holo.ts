import { prefersReducedMotion } from './motion/env';

type Rect = { left: number; top: number; width: number; height: number };
export type HoloVars = { '--px': string; '--py': string; '--rx': string; '--ry': string; '--hyp': string };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const round = (v: number) => Math.round(v * 100) / 100;

/** Pointer position over the card → CSS variables for tilt and shine. */
export function pointerToVars(px: number, py: number, rect: Rect): HoloVars {
  const x = rect.width > 0 ? clamp(((px - rect.left) / rect.width) * 100, 0, 100) : 50;
  const y = rect.height > 0 ? clamp(((py - rect.top) / rect.height) * 100, 0, 100) : 50;
  const hyp = clamp(Math.hypot(x - 50, y - 50) / 50, 0, 1);
  return {
    '--px': `${round(x)}%`,
    '--py': `${round(y)}%`,
    '--rx': `${round((y - 50) / 3.5) || 0}deg`,
    '--ry': `${round((50 - x) / 3.5) || 0}deg`,
    '--hyp': `${round(hyp)}`,
  };
}

const FLAT: HoloVars = { '--px': '50%', '--py': '50%', '--rx': '0deg', '--ry': '0deg', '--hyp': '0' };
const FOCUSED: HoloVars = { '--px': '35%', '--py': '30%', '--rx': '-4deg', '--ry': '6deg', '--hyp': '0.5' };

function apply(card: HTMLElement, vars: HoloVars) {
  for (const [k, v] of Object.entries(vars)) card.style.setProperty(k, v);
}

export function initHolo(card: HTMLElement): () => void {
  const still = prefersReducedMotion();
  let frame = 0;

  const onMove = (e: PointerEvent) => {
    if (still) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      card.dataset.active = '';
      apply(card, pointerToVars(e.clientX, e.clientY, card.getBoundingClientRect()));
    });
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    delete card.dataset.active;
    apply(card, FLAT);
  };
  // Only keyboard focus gets the pose: taps and clicks also focus the card, after pointerup.
  const onFocus = () => { if (!still && card.matches(':focus-visible')) apply(card, FOCUSED); };

  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerdown', onMove);
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointercancel', reset);
  card.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') reset(); });
  card.addEventListener('focus', onFocus);
  card.addEventListener('blur', reset);

  return () => {
    cancelAnimationFrame(frame);
    card.removeEventListener('pointermove', onMove);
    card.removeEventListener('pointerdown', onMove);
    card.removeEventListener('pointerleave', reset);
    card.removeEventListener('pointercancel', reset);
    card.removeEventListener('focus', onFocus);
    card.removeEventListener('blur', reset);
  };
}
