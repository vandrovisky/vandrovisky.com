import { normalizeOptcg, normalizeScryfall, normalizeTcgdex } from './normalize';
import type { Fetcher } from './pool';
import type { Card, Game } from './types';

const HEADERS = { 'User-Agent': 'vandrovisky.com/1.0', Accept: 'application/json' };

async function getJson(url: string): Promise<unknown> {
  if (process.env.CARDS_OFFLINE === '1') throw new Error('CARDS_OFFLINE=1');
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shiny mythic Magic cards, already randomized by Scryfall. */
export const fetchMagic: Fetcher = async () =>
  normalizeScryfall(await getJson('https://api.scryfall.com/cards/search?q=is%3Afoil+rarity%3Amythic&order=random'));

/** Holo rare Pokémon cards (TCGdex). */
export const fetchPokemon: Fetcher = async () =>
  shuffle(normalizeTcgdex(await getJson('https://api.tcgdex.net/v2/en/cards?rarity=Rare%20Holo')));

/** Super rare and secret rare One Piece cards. */
export const fetchOnePiece: Fetcher = async () =>
  shuffle(
    normalizeOptcg(await getJson('https://optcgapi.com/api/allSetCards/')).filter((c: Card) =>
      ['SR', 'SEC'].includes(c.rarity ?? ''),
    ),
  );

export const FETCHERS: Record<Game, Fetcher> = { pokemon: fetchPokemon, magic: fetchMagic, onepiece: fetchOnePiece };
