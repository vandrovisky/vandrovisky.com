import { afterEach, describe, expect, test, vi } from 'vitest';
import scryfall from '../fixtures/scryfall.json';
import tcgdex from '../fixtures/tcgdex.json';
import optcg from '../fixtures/optcg.json';
import { normalizeOptcg, normalizeScryfall, normalizeTcgdex } from '../../scripts/cards/normalize';
import { buildPool } from '../../scripts/cards/pool';
import type { Card, Game } from '../../scripts/cards/types';

const isHttp = (u: string) => /^https?:\/\//.test(u);

describe('normalizers', () => {
  test('scryfall: drops the card without image, uses the first face of double-faced cards', () => {
    const cards = normalizeScryfall(scryfall);
    expect(cards).toHaveLength(5);
    expect(cards.every((c) => c.game === 'magic' && isHttp(c.imageUrl) && c.name && c.set)).toBe(true);
    expect(cards.find((c) => c.id === 'no-image')).toBeUndefined();
    const dfc = scryfall.data.find((c) => 'card_faces' in c && !('image_uris' in c))!;
    expect(cards.find((c) => c.id === dfc.id)?.imageUrl).toBe((dfc as any).card_faces[0].image_uris.large);
  });

  test('tcgdex: high-res webp url, drops the card without image', () => {
    const cards = normalizeTcgdex(tcgdex);
    expect(cards).toHaveLength(5);
    expect(cards.every((c) => c.game === 'pokemon' && c.imageUrl.endsWith('/high.webp'))).toBe(true);
  });

  test('optcg: drops the card without image', () => {
    const cards = normalizeOptcg(optcg);
    expect(cards).toHaveLength(5);
    expect(cards.every((c) => c.game === 'onepiece' && isHttp(c.imageUrl))).toBe(true);
  });

  test.each([
    ['scryfall', normalizeScryfall],
    ['tcgdex', normalizeTcgdex],
    ['optcg', normalizeOptcg],
  ])('%s never throws on unexpected json', (_name, fn) => {
    for (const bad of [{}, null, undefined, 42, 'x', [null, 1, {}], { data: 'nope' }]) {
      expect(fn(bad)).toEqual([]);
    }
  });
});

describe('buildPool', () => {
  afterEach(() => vi.useRealTimers());

  const card = (game: Game, i: number): Card => ({ id: `${game}-${i}`, game, name: `n${i}`, set: 's', imageUrl: `https://x/${i}` });
  const many = (game: Game, n: number) => Array.from({ length: n }, (_, i) => card(game, i));
  const seed = [...many('pokemon', 10), ...many('magic', 10), ...many('onepiece', 10)].map((c) => ({ ...c, id: `seed-${c.id}` }));

  test('rejecting or slow APIs fall back to the seed of that game only', async () => {
    vi.useFakeTimers();
    const pending = buildPool(
      {
        pokemon: () => Promise.reject(new Error('down')),
        magic: () => new Promise(() => {}), // never resolves
        onepiece: async () => many('onepiece', 40),
      },
      seed,
      30,
      10_000,
    );
    await vi.advanceTimersByTimeAsync(10_001);
    const { cards, sources } = await pending;
    expect(sources).toEqual({ pokemon: 'seed', magic: 'seed', onepiece: 'live' });
    expect(cards.filter((c) => c.game === 'onepiece')).toHaveLength(30);
    expect(cards.filter((c) => c.game === 'pokemon').every((c) => c.id.startsWith('seed-'))).toBe(true);
  });

  test('an API that returns too few cards counts as down', async () => {
    const { sources } = await buildPool(
      { pokemon: async () => many('pokemon', 2), magic: async () => many('magic', 6), onepiece: async () => [] },
      seed,
    );
    expect(sources).toEqual({ pokemon: 'seed', magic: 'live', onepiece: 'seed' });
  });

  test('live results are capped per game and deduplicated', async () => {
    const dup = [...many('magic', 20), ...many('magic', 20)];
    const { cards } = await buildPool(
      { pokemon: async () => many('pokemon', 50), magic: async () => dup, onepiece: async () => many('onepiece', 7) },
      seed,
      30,
    );
    expect(cards.filter((c) => c.game === 'pokemon')).toHaveLength(30);
    expect(cards.filter((c) => c.game === 'magic')).toHaveLength(20);
    expect(cards.filter((c) => c.game === 'onepiece')).toHaveLength(7);
  });
});
