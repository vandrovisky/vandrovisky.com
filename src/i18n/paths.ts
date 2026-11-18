import type { Lang } from './ui';

export type RouteId = 'home' | 'work';

/** The single page per language, and the base path of case pages. */
export const ROUTES: Record<RouteId, Record<Lang, string>> = {
  home: { en: '/', pt: '/pt/' },
  work: { en: '/work/', pt: '/pt/trabalho/' },
};

export type SectionId = 'about' | 'cases' | 'hobbies' | 'contact';

/** Section anchors on the single page. */
export const SECTIONS: Record<SectionId, Record<Lang, string>> = {
  about: { en: 'about', pt: 'sobre' },
  cases: { en: 'cases', pt: 'cases' },
  hobbies: { en: 'hobbies', pt: 'hobbies' },
  contact: { en: 'contact', pt: 'contato' },
};

export const sectionHref = (id: SectionId, lang: Lang): string => `${ROUTES.home[lang]}#${SECTIONS[id][lang]}`;

const withSlash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

export function langFromPath(pathname: string): Lang {
  return pathname === '/pt' || pathname.startsWith('/pt/') ? 'pt' : 'en';
}

/**
 * Path of the same page in `target`. Case pages map through `caseSlugs`;
 * a case with no counterpart lands on the target cases section, anything else on the target home.
 */
export function alternatePath(
  pathname: string,
  target: Lang,
  caseSlugs: Partial<Record<Lang, string>> = {},
): string {
  const path = withSlash(pathname);
  const from = langFromPath(path);
  const workBase = ROUTES.work[from];
  if (path.startsWith(workBase) && path.length > workBase.length) {
    const slug = caseSlugs[target];
    return slug ? `${ROUTES.work[target]}${slug}/` : sectionHref('cases', target);
  }
  return ROUTES.home[target];
}
