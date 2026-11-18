import { GAMES, type Card, type Game } from './types';

export type Fetcher = () => Promise<Card[]>;
export type Source = 'live' | 'seed';

const MIN_LIVE = 6;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function dedupe(cards: Card[]): Card[] {
  const seen = new Set<string>();
  return cards.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

/** Per game: live cards when the API answers in time with enough cards, otherwise that game's seed. Never rejects. */
export async function buildPool(
  fetchers: Record<Game, Fetcher>,
  seed: Card[],
  perGame = 30,
  timeoutMs = 10_000,
): Promise<{ cards: Card[]; sources: Record<Game, Source> }> {
  const results = await Promise.all(
    GAMES.map(async (game): Promise<[Game, Card[], Source]> => {
      try {
        const live = dedupe((await withTimeout(fetchers[game](), timeoutMs)).filter((c) => c.game === game));
        if (live.length >= MIN_LIVE) return [game, live.slice(0, perGame), 'live'];
      } catch {
        /* fall through to seed */
      }
      return [game, seed.filter((c) => c.game === game), 'seed'];
    }),
  );
  return {
    cards: results.flatMap(([, cards]) => cards),
    sources: Object.fromEntries(results.map(([game, , source]) => [game, source])) as Record<Game, Source>,
  };
}

/**
 * After image downloads: a game keeps its downloaded cards only if at least MIN_LIVE survived,
 * otherwise it falls back to that game's seed.
 */
export function mergeWithSeed(downloaded: Card[], seed: Card[]): { cards: Card[]; sources: Record<Game, Source> } {
  const sources = {} as Record<Game, Source>;
  const cards = GAMES.flatMap((game) => {
    const live = downloaded.filter((c) => c.game === game);
    sources[game] = live.length >= MIN_LIVE ? 'live' : 'seed';
    return sources[game] === 'live' ? live : seed.filter((c) => c.game === game);
  });
  return { cards, sources };
}
