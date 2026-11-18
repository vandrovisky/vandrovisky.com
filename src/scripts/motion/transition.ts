export const STORAGE_KEY = 'vv:vt';

export type Origin = { x: number; y: number; t: number };

export function encodeOrigin(x: number, y: number, now: number): string {
  return JSON.stringify({ x: Math.round(x), y: Math.round(y), t: now });
}

/**
 * Must stay self-contained (only globals): it is also serialized with toString()
 * into an inline <head> script so it runs before the new page is first painted.
 */
export function decodeOrigin(raw: string | null, now: number, maxAgeMs = 3000): { x: number; y: number } | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o.x !== 'number' || typeof o.y !== 'number' || typeof o.t !== 'number') return null;
    if (now - o.t > maxAgeMs || now < o.t) return null;
    return { x: o.x, y: o.y };
  } catch {
    return null;
  }
}

/** Self-contained like decodeOrigin; receives it as an argument. Runs inline in <head>. */
export function applyStoredOrigin(decode: typeof decodeOrigin, key: string): void {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* storage blocked: fall back to the centre */
  }
  const o = decode(raw, Date.now());
  document.documentElement.style.setProperty('--vt-at', o ? `${o.x}px ${o.y}px` : '50% 50%');
}

/** Remembers where same-origin navigations were triggered from. */
export function initTransitionOrigin(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target === '_blank' || a.origin !== location.origin || a.hasAttribute('download')) return;
    if (a.pathname === location.pathname && a.hash) return;
    const r = a.getBoundingClientRect();
    const fromKeyboard = e.detail === 0;
    const x = fromKeyboard ? r.left + r.width / 2 : e.clientX;
    const y = fromKeyboard ? r.top + r.height / 2 : e.clientY;
    try {
      sessionStorage.setItem(STORAGE_KEY, encodeOrigin(x, y, Date.now()));
    } catch {
      /* storage blocked: the transition opens from the centre */
    }
  });
}
