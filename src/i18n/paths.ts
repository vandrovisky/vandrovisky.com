import type { Lang } from './ui';

export type RouteId = 'home' | 'about' | 'work' | 'hobbies' | 'contact';

export const ROUTES: Record<RouteId, Record<Lang, string>> = {
  home: { en: '/', pt: '/pt/' },
  about: { en: '/about/', pt: '/pt/sobre/' },
  work: { en: '/work/', pt: '/pt/trabalho/' },
  hobbies: { en: '/hobbies/', pt: '/pt/hobbies/' },
  contact: { en: '/contact/', pt: '/pt/contato/' },
};

const withSlash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

export function langFromPath(pathname: string): Lang {
  return pathname === '/pt' || pathname.startsWith('/pt/') ? 'pt' : 'en';
}

/**
 * Path of the same page in `target`. Case pages map through `caseSlugs`;
 * a case with no counterpart lands on the target work list, anything unknown on the target home.
 */
export function alternatePath(
  pathname: string,
  target: Lang,
  caseSlugs: Partial<Record<Lang, string>> = {},
): string {
  const path = withSlash(pathname);
  const from = langFromPath(path);

  for (const route of Object.values(ROUTES)) {
    if (route[from] === path) return route[target];
  }

  const workBase = ROUTES.work[from];
  if (path.startsWith(workBase) && path.length > workBase.length) {
    const slug = caseSlugs[target];
    return slug ? `${ROUTES.work[target]}${slug}/` : ROUTES.work[target];
  }

  return ROUTES.home[target];
}
