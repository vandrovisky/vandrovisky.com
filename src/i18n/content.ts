import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from './ui';

export type Case = CollectionEntry<'work'>;

/** "en/jmv-play" → "jmv-play" */
export const caseSlug = (entry: Case): string => entry.id.split('/').slice(1).join('/');

export async function getCases(lang: Lang): Promise<Case[]> {
  const all = await getCollection('work', (e) => e.data.lang === lang);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Slugs of the same case in every language that has it. */
export async function caseSlugsFor(slug: string): Promise<Partial<Record<Lang, string>>> {
  const all = await getCollection('work');
  const out: Partial<Record<Lang, string>> = {};
  for (const e of all) if (caseSlug(e) === slug) out[e.data.lang] = slug;
  return out;
}
