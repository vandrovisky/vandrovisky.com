import type { Card } from './types';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const http = (v: unknown): string | undefined => {
  const s = str(v);
  return s && /^https?:\/\//.test(s) ? s : undefined;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Scryfall list object → cards. Double-faced cards use the front face image. */
export function normalizeScryfall(json: unknown): Card[] {
  const data = isObj(json) ? list(json.data) : [];
  return data.flatMap((c): Card[] => {
    if (!isObj(c)) return [];
    const front = list(c.card_faces)[0];
    const uris = isObj(c.image_uris) ? c.image_uris : isObj(front) && isObj(front.image_uris) ? front.image_uris : undefined;
    const imageUrl = http(uris?.large) ?? http(uris?.normal);
    const id = str(c.id);
    const name = str(c.name);
    if (!imageUrl || !id || !name) return [];
    return [{ id, game: 'magic', name, set: str(c.set_name) ?? '', rarity: str(c.rarity), imageUrl }];
  });
}

/** TCGdex brief list → cards. The image field is a base URL; quality/extension are appended. */
export function normalizeTcgdex(json: unknown): Card[] {
  return list(json).flatMap((c): Card[] => {
    if (!isObj(c)) return [];
    const base = http(c.image);
    const id = str(c.id);
    const name = str(c.name);
    if (!base || !id || !name) return [];
    return [{ id, game: 'pokemon', name, set: id.split('-')[0] ?? '', rarity: str(c.rarity), imageUrl: `${base}/high.webp` }];
  });
}

/** optcgapi.com card list → cards. */
export function normalizeOptcg(json: unknown): Card[] {
  return list(json).flatMap((c): Card[] => {
    if (!isObj(c)) return [];
    const imageUrl = http(c.card_image);
    const id = str(c.card_image_id) ?? str(c.card_set_id);
    const name = str(c.card_name);
    if (!imageUrl || !id || !name) return [];
    return [{ id, game: 'onepiece', name, set: str(c.set_name) ?? '', rarity: str(c.rarity), imageUrl }];
  });
}
