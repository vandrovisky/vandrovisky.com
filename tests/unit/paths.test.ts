import { describe, expect, test } from 'vitest';
import { alternatePath, langFromPath, ROUTES } from '../../src/i18n/paths';

describe('langFromPath', () => {
  test('pt prefix is pt', () => expect(langFromPath('/pt/sobre/')).toBe('pt'));
  test('bare /pt is pt', () => expect(langFromPath('/pt')).toBe('pt'));
  test('root routes are en', () => expect(langFromPath('/about/')).toBe('en'));
  test('a path that merely starts with "pt" is en', () => expect(langFromPath('/ptolemy/')).toBe('en'));
});

describe('alternatePath', () => {
  test('fixed route en → pt', () => expect(alternatePath('/about/', 'pt')).toBe('/pt/sobre/'));
  test('fixed route pt → en', () => expect(alternatePath('/pt/contato/', 'en')).toBe('/contact/'));
  test('home both ways', () => {
    expect(alternatePath('/', 'pt')).toBe('/pt/');
    expect(alternatePath('/pt/', 'en')).toBe('/');
  });
  test('missing trailing slash still maps', () => expect(alternatePath('/about', 'pt')).toBe('/pt/sobre/'));
  test('case with counterpart', () =>
    expect(alternatePath('/work/jmv-play/', 'pt', { pt: 'jmv-play' })).toBe('/pt/trabalho/jmv-play/'));
  test('case pt → en with counterpart', () =>
    expect(alternatePath('/pt/trabalho/agora/', 'en', { en: 'agora' })).toBe('/work/agora/'));
  test('case without counterpart falls back to the work list', () =>
    expect(alternatePath('/work/so-en/', 'pt', {})).toBe('/pt/trabalho/'));
  test('unknown path falls back to target home', () => expect(alternatePath('/qualquer/', 'pt')).toBe('/pt/'));
  test('same language returns the canonical form', () => expect(alternatePath('/about', 'en')).toBe('/about/'));
});

test('every route has both languages', () => {
  for (const r of Object.values(ROUTES)) {
    expect(r.en.startsWith('/')).toBe(true);
    expect(r.pt.startsWith('/pt/')).toBe(true);
  }
});
