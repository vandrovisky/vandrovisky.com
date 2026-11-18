import { hasFinePointer, prefersReducedMotion } from './env';
import { isSettled, stepSpring, stretch, type SpringState, type Vec } from './spring';

type Shape = 'dot' | 'ring' | 'caret';
type Mode = 'dock' | 'cursor';

const INTERACTIVE = 'a, button, [role="button"], summary, label';
const TEXT = 'p, h1, h2, h3, li';
const FIELDS = 'input, textarea, select, [contenteditable]';
const SIZE = { dot: 14, ring: 54 };
/** Faster spring while following the mouse, softer one when gliding to a dock anchor. */
const FOLLOW = { stiffness: 0.42, damping: 0.5 };
const GLIDE = { stiffness: 0.09, damping: 0.74 };

function shapeFor(target: EventTarget | null): { shape: Shape; caret: number } {
  if (!(target instanceof Element)) return { shape: 'dot', caret: 0 };
  if (target.closest(INTERACTIVE)) return { shape: 'ring', caret: 0 };
  const text = target.closest(TEXT);
  if (text && text.textContent?.trim()) {
    const size = parseFloat(getComputedStyle(text).fontSize) * 1.05;
    return { shape: 'caret', caret: Math.min(Math.max(size, 18), 140) };
  }
  return { shape: 'dot', caret: 0 };
}

function center(el: Element): Vec & { visible: boolean } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, visible: r.bottom > 0 && r.top < innerHeight };
}

/** Anchor closest to the vertical middle of the viewport. */
function dockTarget(anchors: Element[]): Vec | null {
  let best: Vec | null = null;
  let bestDist = Infinity;
  for (const a of anchors) {
    const c = center(a);
    if (!c.visible) continue;
    const d = Math.abs(c.y - innerHeight / 2);
    if (d < bestDist) {
      bestDist = d;
      best = { x: Math.max(24, a.getBoundingClientRect().left - 28), y: c.y };
    }
  }
  return best;
}

export function initCursor(root: Document = document): () => void {
  const el = root.querySelector<HTMLElement>('.cursor');
  const body = el?.querySelector<HTMLElement>('.cursor__body');
  if (!el || !body || !hasFinePointer() || prefersReducedMotion()) return () => {};

  const html = root.documentElement;
  const anchors = [...root.querySelectorAll('[data-cursor-anchor]')];
  let mode: Mode = 'dock';
  let pointer: Vec = { x: -100, y: -100 };
  let state: SpringState = { x: -100, y: -100, vx: 0, vy: 0 };
  let size = { w: SIZE.dot, h: SIZE.dot, r: SIZE.dot / 2 };
  let shape: Shape = 'dot';
  let caret = 24;
  let press = 1;
  let frame = 0;

  html.setAttribute('data-cursor', '');

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pointer = { x: e.clientX, y: e.clientY };
    if (mode === 'dock') {
      mode = 'cursor';
      state = { ...state, ...pointer };
    }
  };
  const onOver = (e: PointerEvent) => {
    const next = shapeFor(e.target);
    shape = next.shape;
    if (next.shape === 'caret') caret = next.caret;
    el.dataset.shape = shape;
    el.toggleAttribute('data-over-field', e.target instanceof Element && !!e.target.closest(FIELDS));
  };
  const onLeave = () => { mode = 'dock'; };
  const onDown = () => { press = 0.8; };
  const onUp = () => { press = 1; };

  const tick = () => {
    const target = mode === 'cursor' ? pointer : dockTarget(anchors);
    if (target) {
      const settled = mode === 'dock' && isSettled(state, target);
      if (!settled) state = stepSpring(state, target, mode === 'cursor' ? FOLLOW : GLIDE);
    }
    const goal =
      shape === 'ring' ? { w: SIZE.ring, h: SIZE.ring, r: SIZE.ring / 2 }
      : shape === 'caret' ? { w: 3, h: caret, r: 1.5 }
      : { w: SIZE.dot, h: SIZE.dot, r: SIZE.dot / 2 };
    size = {
      w: size.w + (goal.w - size.w) * 0.24,
      h: size.h + (goal.h - size.h) * 0.24,
      r: size.r + (goal.r - size.r) * 0.24,
    };
    const s = shape === 'caret' ? { angle: 0, scaleX: 1, scaleY: 1 } : stretch(state.vx, state.vy);

    el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    body.style.width = `${size.w}px`;
    body.style.height = `${size.h}px`;
    body.style.borderRadius = `${size.r}px`;
    body.style.transform =
      `translate(-50%, -50%) rotate(${s.angle}rad) scale(${s.scaleX * press}, ${s.scaleY * press}) rotate(${-s.angle}rad)`;
    frame = requestAnimationFrame(tick);
  };

  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerover', onOver, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointerup', onUp, { passive: true });
  html.addEventListener('mouseleave', onLeave);
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerover', onOver);
    removeEventListener('pointerdown', onDown);
    removeEventListener('pointerup', onUp);
    html.removeEventListener('mouseleave', onLeave);
    html.removeAttribute('data-cursor');
  };
}
