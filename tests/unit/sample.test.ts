import { expect, test } from 'vitest';
import { sampleCards } from '../../src/scripts/sample';
import type { Card, Game } from '../../scripts/cards/types';

const card = (game: Game, i: number): Card => ({ id: `${game}-${i}`, game, name: `n${i}`, set: 's', imageUrl: 'https://x', image: `/cards/${game}-${i}.webp` });
const pool = [
  ...Array.from({ length: 10 }, (_, i) => card('pokemon', i)),
  ...Array.from({ length: 10 }, (_, i) => card('magic', i)),
  ...Array.from({ length: 2 }, (_, i) => card('onepiece', i)),
];

/** Deterministic LCG so the test is reproducible. */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);

test('n distinct cards with every game represented', () => {
  for (let s = 1; s < 50; s++) {
    const out = sampleCards(pool, 6, rng(s));
    expect(out).toHaveLength(6);
    expect(new Set(out.map((c) => c.id)).size).toBe(6);
    expect(new Set(out.map((c) => c.game))).toEqual(new Set(['pokemon', 'magic', 'onepiece']));
  }
});

test('different seeds give different hands', () => {
  const a = sampleCards(pool, 6, rng(1)).map((c) => c.id).join();
  const b = sampleCards(pool, 6, rng(2)).map((c) => c.id).join();
  expect(a).not.toBe(b);
});

test('n bigger than the pool returns the whole pool', () => {
  expect(sampleCards(pool.slice(0, 4), 6, rng(3))).toHaveLength(4);
});

test('empty pool gives an empty hand', () => {
  expect(sampleCards([], 6)).toEqual([]);
});
