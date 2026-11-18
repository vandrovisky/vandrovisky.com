# Página única + só cases descritos — Implementation Plan

> Executado inline (superpowers:executing-plans), em continuação à branch `feat/foundation`.

**Goal:** Transformar o site em uma página contínua por idioma, com cases descritos em páginas próprias.
**Spec:** `docs/superpowers/specs/2026-11-14-portfolio-design.md` §8.

## Global Constraints
- Mesmas do plano da fundação (sem JS → tudo visível, reduced motion, sem URL dos sites da JMV etc.).
- Âncoras EN: `about`, `cases`, `hobbies`, `contact`; PT: `sobre`, `cases`, `hobbies`, `contato`.

## Review Focus
1. Link do menu numa página de case → volta para a home na seção certa.
2. Navbar fixa não cobre o título da seção ao clicar no menu (`scroll-margin-top`).
3. Troca de idioma no meio da página única mantém a seção visível.

### Task 1: Rotas e âncoras
- `src/i18n/paths.ts`: `ROUTES` fica só com `home` e `work` (base dos cases); novo `SECTIONS: Record<SectionId, Record<Lang,string>>` e `sectionHref(id, lang): string` (`/#about`, `/pt/#sobre`). `alternatePath`: case sem equivalente → `${home}#cases` do alvo; desconhecido → home do alvo.
- Testes unitários atualizados primeiro (RED → GREEN).

### Task 2: Página única
- Views viram seções: `AboutSection`, `CasesSection`, `HobbiesSection` (com `CardTable`), `ContactSection`; `Home` monta tudo. Remover páginas `about/contact/hobbies/work index` (EN e PT).
- Nav: links `sectionHref`; script destaca a seção visível (`aria-current="location"`); `scroll-margin-top` nas seções; `scroll-behavior: smooth` sob `no-preference`.
- e2e: home tem as 5 seções com ids corretos; clicar no menu rola até a seção e destaca o link; links do menu em página de case apontam para `/#…`.

### Task 3: Só cases descritos
- Remover conteúdo `jmv-play`, `color-fantasy`, `agora` (EN/PT), `kind: 'visual'` do schema, `scripts/capture.ts`, script `capture`, `src/assets/work/`.
- e2e: seção de cases tem 4 cards; nenhum dos 3 slugs responde 200; "voltar" do case leva a `#cases`.

### Task 4: Ajustar suítes existentes
- cursor/reveal/hobbies/transition/i18n/routes apontam para as novas URLs; transição testada clicando num card de case.
