import { describe, expect, test } from 'vitest';
import { alternatePath, langFromPath, ROUTES, SECTIONS, sectionHref } from '../../src/i18n/paths';

describe('langFromPath', () => {
  test('pt prefix is pt', () => expect(langFromPath('/pt/trabalho/x/')).toBe('pt'));
  test('bare /pt is pt', () => expect(langFromPath('/pt')).toBe('pt'));
  test('root routes are en', () => expect(langFromPath('/work/x/')).toBe('en'));
  test('a path that merely starts with "pt" is en', () => expect(langFromPath('/ptolemy/')).toBe('en'));
});

describe('sections', () => {
  test('anchors per language', () => {
    expect(sectionHref('about', 'en')).toBe('/#about');
    expect(sectionHref('about', 'pt')).toBe('/pt/#sobre');
    expect(sectionHref('contact', 'pt')).toBe('/pt/#contato');
    expect(sectionHref('cases', 'pt')).toBe('/pt/#cases');
  });
  test('every section has an id in both languages', () => {
    for (const s of Object.values(SECTIONS)) {
      expect(s.en).toMatch(/^[a-z]+$/);
      expect(s.pt).toMatch(/^[a-z]+$/);
    }
  });
});

describe('alternatePath', () => {
  test('home both ways', () => {
    expect(alternatePath('/', 'pt')).toBe('/pt/');
    expect(alternatePath('/pt/', 'en')).toBe('/');
  });
  test('case with counterpart', () =>
    expect(alternatePath('/work/payments/', 'pt', { pt: 'payments' })).toBe('/pt/trabalho/payments/'));
  test('case pt → en with counterpart', () =>
    expect(alternatePath('/pt/trabalho/payments/', 'en', { en: 'payments' })).toBe('/work/payments/'));
  test('case without counterpart falls back to the cases section', () =>
    expect(alternatePath('/work/so-en/', 'pt', {})).toBe('/pt/#cases'));
  test('removed pages fall back to target home', () => {
    expect(alternatePath('/about/', 'pt')).toBe('/pt/');
    expect(alternatePath('/pt/contato/', 'en')).toBe('/');
  });
  test('missing trailing slash still maps', () => expect(alternatePath('/pt', 'en')).toBe('/'));
});

test('routes keep only home and the case base', () => {
  expect(Object.keys(ROUTES).sort()).toEqual(['home', 'work']);
});
