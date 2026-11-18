export const LANGS = ['en', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

/** BCP-47 tags used for <html lang> and hreflang. */
export const LOCALE_TAG: Record<Lang, string> = { en: 'en-US', pt: 'pt-BR' };

const en = {
  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.work': 'Work',
  'nav.hobbies': 'Hobbies',
  'nav.contact': 'Contact',
  'nav.label': 'Main navigation',
  'lang.switch': 'Português',
  'lang.switchLabel': 'Ler em português',
  'footer.credit': 'Designed and built by Eric Robertson.',
  'work.builtAt': 'Built at',
  'cards.disclaimer':
    'Card images © their publishers (The Pokémon Company, Wizards of the Coast, Bandai). Shown as a fan, not affiliated.',
  'cv.download': 'Download résumé (PDF)',
  'skip.content': 'Skip to content',
} as const;

export type UiKey = keyof typeof en;

const pt: Record<UiKey, string> = {
  'nav.home': 'Início',
  'nav.about': 'Sobre',
  'nav.work': 'Trabalho',
  'nav.hobbies': 'Hobbies',
  'nav.contact': 'Contato',
  'nav.label': 'Navegação principal',
  'lang.switch': 'English',
  'lang.switchLabel': 'Read in English',
  'footer.credit': 'Desenhado e construído por Eric Robertson.',
  'work.builtAt': 'Desenvolvido na',
  'cards.disclaimer':
    'Imagens das cartas © de suas editoras (The Pokémon Company, Wizards of the Coast, Bandai). Exibidas como fã, sem afiliação.',
  'cv.download': 'Baixar currículo (PDF)',
  'skip.content': 'Pular para o conteúdo',
};

const dict: Record<Lang, Record<UiKey, string>> = { en, pt };

export function t(lang: Lang, key: UiKey): string {
  return dict[lang][key];
}
