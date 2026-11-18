/** Id of the last section whose top has crossed `line` (px from the viewport top), or null. */
export function activeSection(sections: { id: string; top: number }[], line: number): string | null {
  let current: string | null = null;
  for (const s of sections) if (s.top <= line) current = s.id;
  return current;
}

/** Highlights the visible section in the nav and keeps the language switch pointing at it. */
export function initSectionNav(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-section-link]')];
  if (!links.length) return;
  const sections = [...document.querySelectorAll<HTMLElement>('main section[id]')];
  const langSwitch = document.querySelector<HTMLAnchorElement>('.lang-switch');
  const switchBase = langSwitch?.getAttribute('href')?.split('#')[0] ?? '';
  let queued = false;

  const update = () => {
    queued = false;
    const id = activeSection(
      sections.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top })),
      innerHeight * 0.35,
    );
    for (const a of links) {
      if (a.dataset.sectionLink === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
    if (langSwitch) {
      const alt = sections.find((el) => el.id === id)?.dataset.alt;
      langSwitch.setAttribute('href', alt ? `${switchBase}#${alt}` : switchBase);
    }
  };

  addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  addEventListener('hashchange', update);
  update();
}
