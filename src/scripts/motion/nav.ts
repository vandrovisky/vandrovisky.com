export function shouldHideNav(prevY: number, y: number, threshold = 120): boolean {
  return y > prevY && y > threshold;
}

export function initNavHide(nav: HTMLElement): void {
  let prevY = scrollY;
  let queued = false;

  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        const hide = shouldHideNav(prevY, y) && !nav.contains(document.activeElement);
        nav.toggleAttribute('data-hidden', hide);
        prevY = y;
        queued = false;
      });
    },
    { passive: true },
  );
  nav.addEventListener('focusin', () => nav.removeAttribute('data-hidden'));
}
