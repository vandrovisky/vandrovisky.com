# vandrovisky.com — Fundação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação funcional do portfólio: Astro bilíngue com todas as rotas, sistema de animação em TS puro, mesa de cartas holográficas alimentada por 3 APIs, e CI/CD publicando previews na Cloudflare.

**Architecture:** Astro estático (`output: 'static'`) com i18n nativo (EN em `/`, PT em `/pt/`). Animações são módulos TS puros em `src/scripts/motion/`, com a matemática separada (funções puras testadas com Vitest) da aplicação no DOM (testada com Playwright). As cartas são buscadas num passo de pré-build (`scripts/cards/`) que gera `src/data/cards.json` + imagens, caindo para um pool semente versionado se uma API falhar.

**Tech Stack:** Astro (última estável; 7.x em 2026-11-14), TypeScript strict, Vitest, @playwright/test, @astrojs/sitemap, sharp, Node 24, GitHub Actions, Cloudflare (wrangler).

**Spec:** `docs/superpowers/specs/2026-11-14-portfolio-design.md`

**Fora deste plano (Plano 2 — Identidade, conteúdo e lançamento):** paleta/tipografia/forma final do cursor (sessão de mockups), textos reais dos cases/RPG/certificações, prints dos 3 sites, ligar `vandrovisky.com`, redirect do `vandrovisky.github.io`. Este plano usa tokens visuais provisórios e textos placeholder marcados `TODO(conteúdo)`.

## Global Constraints

- EN na raiz `/`, PT em `/pt/` (`prefixDefaultLocale: false`).
- Sem React, sem GSAP, sem Tailwind obrigatório na v1. Animações em TS puro.
- Todo efeito respeita `prefers-reduced-motion: reduce`; cursor custom só com `(pointer: fine)`.
- Todo conteúdo legível **sem JS**. Nada fica escondido por CSS a menos que `<html>` tenha a classe `js` (adicionada por script inline no `<head>`).
- Cases visuais: **só prints, sem URL/link** para os sites. Crédito "desenvolvido na JMV Technology" / "built at JMV Technology".
- Cartas: Scryfall (Magic, headers `User-Agent: vandrovisky.com/1.0` e `Accept: application/json`), TCGdex (Pokémon), optcgapi.com (One Piece). **Nunca** pokemontcg.io como principal.
- Build **nunca falha** por causa das APIs de cartas; CI **não faz commit**.
- Efeito holográfico é reimplementação própria (não copiar `pokemon-cards-css`, GPL-3.0).
- Domínio **não** é ligado neste plano: deploys apenas para endereços de preview da Cloudflare.
- Lighthouse mobile alvo ≥ 95 em Performance, Accessibility, SEO.
- Acesso a `localStorage`/`sessionStorage` sempre em `try/catch`.

## Review Focus

1. **Visitante sem JS ou com JS bloqueado** → todo texto, cases e ao menos 6 cartas visíveis (teste: Task 6 e Task 9, Playwright com `javaScriptEnabled: false`).
2. **API de cartas fora do ar, lenta ou devolvendo JSON inesperado** (campo de imagem ausente) → carta descartada / jogo cai no semente, build passa (teste: Task 8).
3. **Dispositivo de toque** → sem cursor custom, cursor nativo intacto, card holográfico funciona por toque e não "trava" inclinado (teste: Task 5 e Task 9, contexto Playwright `hasTouch`, `isMobile`).
4. **Troca de idioma numa página sem equivalente** (case existe só em um idioma) → leva para a lista de cases do outro idioma, nunca 404 (teste: Task 2 e Task 3).
5. **`sessionStorage` indisponível** (aba privada / bloqueado) → transição de página ainda navega, só sem a origem do clique (teste: Task 7).

---

## Mapa de arquivos

```
astro.config.mjs                 i18n, sitemap, site URL
package.json                     scripts: dev, build, prebuild(cards), test, test:e2e, cards:seed, capture
tsconfig.json                    strict
vitest.config.ts
playwright.config.ts             webServer = astro preview
src/
  i18n/ui.ts                     dicionário EN/PT de strings de UI
  i18n/paths.ts                  mapeamento de rotas entre idiomas
  styles/tokens.css              tokens visuais PROVISÓRIOS (cores, fontes, espaços, easings)
  styles/global.css              reset, tipografia base, classes .reveal, view-transition CSS
  layouts/Base.astro             <head> (SEO, hreflang, OG), nav, footer, scripts globais
  components/Seo.astro
  components/Nav.astro
  components/LangSwitch.astro
  components/Footer.astro
  components/Cursor.astro
  components/CaseCard.astro
  components/HoloCard.astro
  components/CardTable.astro
  content.config.ts              collection `work`
  content/work/en/*.md, content/work/pt/*.md
  pages/index.astro, about.astro, work/index.astro, work/[slug].astro, hobbies.astro, contact.astro
  pages/pt/... (mesmos arquivos com slugs PT: sobre, trabalho, hobbies, contato)
  pages/404.astro
  scripts/motion/env.ts          prefersReducedMotion(), hasFinePointer()
  scripts/motion/spring.ts       stepSpring() puro
  scripts/motion/cursor.ts       initCursor()
  scripts/motion/reveal.ts       initReveal()
  scripts/motion/nav.ts          initNavHide(), shouldHideNav() puro
  scripts/motion/transition.ts   encodeOrigin()/decodeOrigin() puros + initTransitionOrigin()
  scripts/holo.ts                pointerToVars() puro + initHolo()
  scripts/sample.ts              sampleCards() puro
  data/cards.json                GERADO no build (gitignored)
scripts/cards/
  types.ts                       Card
  normalize.ts                   normalizeScryfall/Tcgdex/Optcg
  fetchers.ts                    fetchMagic/fetchPokemon/fetchOnePiece
  pool.ts                        buildPool()
  images.ts                      downloadAndOptimize()
  build.ts                       entrypoint do prebuild
  seed.ts                        entrypoint de `cards:seed`
cards-seed/cards.json + cards-seed/img/*.webp   POOL SEMENTE versionado
public/cv/eric-robertson-cv-pt.pdf, eric-robertson-cv-en.pdf
tests/unit/*.test.ts
tests/e2e/*.spec.ts
tests/fixtures/{scryfall,tcgdex,optcg}.json
.github/workflows/deploy.yml
```

---

### Task 1: Scaffold Astro + ferramentas de teste

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.nvmrc` (`24`), `src/styles/tokens.css`, `src/styles/global.css`, `src/pages/index.astro` (placeholder), `tests/e2e/smoke.spec.ts`, `tests/unit/sanity.test.ts`

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `preview`, `check` (`astro check`), `test` (`vitest run`), `test:e2e` (`playwright test`). Playwright `baseURL` = `http://localhost:4321`, `webServer.command` = `npm run build && npm run preview`.
- Produces: tokens CSS `--color-bg`, `--color-ink`, `--color-muted`, `--color-accent`, `--font-display`, `--font-body`, `--ease-out` (`cubic-bezier(.2,0,0,1)`), `--space-1..8`. Valores provisórios; o Plano 2 troca.

- [ ] **Step 1:** Em `~/works/vandrovisky.com`, `npm create astro@latest . -- --template minimal --typescript strict --no-git --install`; adicionar `vitest`, `@playwright/test`, `@astrojs/sitemap`, `sharp`, `tsx` como devDependencies; `npx playwright install chromium`.
- [ ] **Step 2:** Escrever `tests/e2e/smoke.spec.ts`: `test('home responde e tem <h1>', …)` → `page.goto('/')`, `expect(page.locator('h1')).toHaveCount(1)`. E `tests/unit/sanity.test.ts` com `expect(1+1).toBe(2)` só para validar o runner.
- [ ] **Step 3:** Rodar `npm test && npm run test:e2e`. Esperado: unit PASS; e2e FAIL (sem `<h1>` no template minimal).
- [ ] **Step 4:** `index.astro` com `<h1>Eric Robertson</h1>` importando `global.css` (que importa `tokens.css`). `.gitignore` inclui `node_modules`, `dist`, `.astro`, `src/data/cards.json`, `public/cards/`, `test-results`, `playwright-report`.
- [ ] **Step 5:** `npm run check && npm test && npm run test:e2e`. Esperado: tudo PASS.
- [ ] **Step 6:** Remover a pasta vazia `~/works/curriculo/portifolio` (`rmdir`, falha se não estiver vazia — nesse caso parar e avisar).
- [ ] **Step 7:** Commit `chore: scaffold astro, vitest e playwright`.

---

### Task 2: i18n, layout base e SEO base

**Files:**
- Create: `src/i18n/ui.ts`, `src/i18n/paths.ts`, `src/layouts/Base.astro`, `src/components/{Seo,Nav,LangSwitch,Footer}.astro`, `public/robots.txt`, `tests/unit/paths.test.ts`, `tests/e2e/i18n.spec.ts`
- Modify: `astro.config.mjs` (i18n `{ defaultLocale: 'en', locales: ['en','pt'], routing: { prefixDefaultLocale: false } }`, `site: 'https://vandrovisky.com'`, integração sitemap com `i18n: { defaultLocale: 'en', locales: { en: 'en-US', pt: 'pt-BR' } }`)

**Interfaces:**
- Produces `type Lang = 'en' | 'pt'`.
- Produces `t(lang: Lang, key: UiKey): string` em `ui.ts` (chaves: `nav.home`, `nav.about`, `nav.work`, `nav.hobbies`, `nav.contact`, `lang.switch`, `footer.credit`, `work.builtAt`, `cards.disclaimer`, `cv.download`).
- Produces em `paths.ts`:
  - `const ROUTES: Record<RouteId, Record<Lang, string>>` com `home: {en:'/', pt:'/pt/'}`, `about: {en:'/about/', pt:'/pt/sobre/'}`, `work: {en:'/work/', pt:'/pt/trabalho/'}`, `hobbies: {en:'/hobbies/', pt:'/pt/hobbies/'}`, `contact: {en:'/contact/', pt:'/pt/contato/'}`.
  - `langFromPath(pathname: string): Lang`
  - `alternatePath(pathname: string, target: Lang, caseSlugs?: Partial<Record<Lang, string>>): string` — rota fixa → equivalente; `/work/<slug>/` → `/pt/trabalho/<slugPt>/` se existir em `caseSlugs`, senão a lista de cases do idioma alvo; desconhecido → home do idioma alvo.
- Produces `Base.astro` props: `{ lang: Lang; title: string; description: string; alternates?: Partial<Record<Lang,string>>; ogImage?: string }`. Script inline no `<head>`: `document.documentElement.classList.add('js')`.

- [ ] **Step 1: testes unitários de `paths.ts`**
```ts
expect(langFromPath('/pt/sobre/')).toBe('pt')
expect(langFromPath('/about/')).toBe('en')
expect(alternatePath('/about/', 'pt')).toBe('/pt/sobre/')
expect(alternatePath('/pt/contato/', 'en')).toBe('/contact/')
expect(alternatePath('/work/jmv-play/', 'pt', { pt: 'jmv-play' })).toBe('/pt/trabalho/jmv-play/')
expect(alternatePath('/work/so-en/', 'pt', {})).toBe('/pt/trabalho/')   // Review Focus 4
expect(alternatePath('/qualquer/', 'pt')).toBe('/pt/')
```
- [ ] **Step 2:** `npm test -- paths` → FAIL.
- [ ] **Step 3:** Implementar `ui.ts`, `paths.ts`; `npm test -- paths` → PASS.
- [ ] **Step 4: e2e `i18n.spec.ts`:** em `/about/`, `<html lang="en">`, existe `link[rel=alternate][hreflang=pt-BR][href$="/pt/sobre/"]` e `hreflang=x-default`, `link[rel=canonical]`, `meta[property="og:title"]`; clicar no LangSwitch leva a `/pt/sobre/` com `<html lang="pt-BR">`. `/sitemap-index.xml` responde 200.
- [ ] **Step 5:** Implementar `Base.astro` + componentes; criar páginas mínimas `about.astro` e `pt/sobre.astro` usando `Base`; `index.astro` e `pt/index.astro` passam a usar `Base`. Nav com links de `ROUTES`, `aria-current="page"` na atual. Footer com `footer.credit`.
- [ ] **Step 6:** `npm run check && npm test && npm run test:e2e` → PASS.
- [ ] **Step 7:** Commit `feat: i18n en/pt, layout base e seo base`.

---

### Task 3: Rotas, collection de cases e conteúdo placeholder

**Files:**
- Create: `src/content.config.ts`, `src/content/work/{en,pt}/{jmv-play,color-fantasy,agora,laravel-migration,whatsapp-ai-agents,payments,this-portfolio}.md`, `src/components/CaseCard.astro`, páginas `work/index.astro`, `work/[slug].astro`, `hobbies.astro`, `contact.astro`, `pt/trabalho/index.astro`, `pt/trabalho/[slug].astro`, `pt/hobbies.astro`, `pt/contato.astro`, `404.astro`, `public/cv/*.pdf`, `tests/e2e/routes.spec.ts`
- Modify: `about.astro`, `pt/sobre.astro` (seções: trajetória, stack, idiomas, formação, certificações)

**Interfaces:**
- Produces collection `work` (loader glob em `src/content/work/**/*.md`), schema zod:
  `{ title: string; summary: string; lang: 'en'|'pt'; slug: string; role: string; stack: string[]; year: number; kind: 'visual'|'technical'|'meta'; order: number; featured: boolean; cover?: image(); gallery?: image()[]; builtAt?: string }`
- Produces helper `getCases(lang: Lang): Promise<CollectionEntry<'work'>[]>` (ordenado por `order`) em `src/i18n/content.ts`.
- Cases `kind: 'visual'` **não têm campo de URL** no schema (constraint global). Sem `cover` → CaseCard mostra bloco tipográfico (placeholder até o Plano 2).
- Conteúdo placeholder: corpo `TODO(conteúdo)`; `title`, `role`, `stack` reais do currículo (ex. JMV Play: role "Full-stack (front + back)", builtAt "JMV Technology").
- PDFs: copiar `~/works/curriculo/Eric Robertson Ribeiro Pires - Curriculo PT.pdf` → `public/cv/eric-robertson-cv-pt.pdf` e `... - Resume EN.pdf` → `public/cv/eric-robertson-cv-en.pdf`.

- [ ] **Step 1: e2e `routes.spec.ts`** — para cada um de `['/', '/about/', '/work/', '/hobbies/', '/contact/', '/pt/', '/pt/sobre/', '/pt/trabalho/', '/pt/hobbies/', '/pt/contato/']`: status 200 e um `<h1>`. `/work/` lista 7 `[data-case]`. `/work/jmv-play/` 200 e **nenhum** `a[href*="jmvplay.com"]`, `a[href*="colorfantasy"]`, `a[href*="jmvstream"]` no site inteiro dos cases visuais. `/cv/eric-robertson-cv-en.pdf` 200. `/nao-existe/` 404 com link para home.
- [ ] **Step 2:** `npm run test:e2e -- routes` → FAIL.
- [ ] **Step 3:** Implementar schema, conteúdo, páginas e `CaseCard`. `[slug].astro` usa `getStaticPaths` filtrando por `lang` e passa `alternates` ao `Base` com o slug do outro idioma quando existir.
- [ ] **Step 4:** `npm run check && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat: rotas, collection de cases e conteúdo placeholder`.

---

### Task 4: Núcleo de movimento (funções puras)

**Files:**
- Create: `src/scripts/motion/env.ts`, `src/scripts/motion/spring.ts`, `tests/unit/spring.test.ts`

**Interfaces:**
- Produces `prefersReducedMotion(): boolean`, `hasFinePointer(): boolean` (via `matchMedia`; retornam `true`/`false` com segurança se `matchMedia` não existir: reduced=false, fine=false).
- Produces:
```ts
type SpringState = { x: number; y: number; vx: number; vy: number }
type SpringConfig = { stiffness: number; damping: number }   // padrão {stiffness: .09, damping: .74}
function stepSpring(s: SpringState, target: {x:number;y:number}, c?: SpringConfig): SpringState
function isSettled(s: SpringState, target: {x:number;y:number}, eps?: number): boolean // eps padrão .6 posição, .3 velocidade
function stretch(vx: number, vy: number): { angle: number; scaleX: number; scaleY: number } // scaleX = 1 + min(|v|/90, .4), scaleY = 1 - (scaleX-1)*.5
```
Fórmula do passo: `vx' = (vx + (tx - x) * stiffness) * damping; x' = x + vx'` (idem y). Função pura, não muta a entrada.

- [ ] **Step 1: testes**
```ts
// converge: 200 passos de (0,0) a (100,50) → isSettled true e |x-100| < .6
// não muta entrada: objeto original igual após stepSpring
// overshoot existe com padrão: algum passo tem x > 100
// stretch(0,0) → {scaleX:1, scaleY:1}; stretch(1000,0).scaleX === 1.4 (cap)
```
- [ ] **Step 2:** `npm test -- spring` → FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: núcleo de física de mola`.

---

### Task 5: Cursor-personagem

**Files:**
- Create: `src/scripts/motion/cursor.ts`, `src/components/Cursor.astro`, `tests/e2e/cursor.spec.ts`
- Modify: `src/layouts/Base.astro` (inclui `<Cursor />`; âncoras `data-cursor-anchor` em hero e títulos de seção)

**Interfaces:**
- Consumes: `stepSpring`, `isSettled`, `stretch`, `prefersReducedMotion`, `hasFinePointer` (Task 4).
- Produces `initCursor(root?: Document): () => void` (retorna cleanup). Estados: `dock` (sem mouse: estaciona na âncora `[data-cursor-anchor]` visível mais próxima do centro da viewport), `cursor` (segue o ponteiro). Formas via atributo `data-shape` no elemento `.cursor`: `dot` (padrão), `ring` (sobre `a, button, [role=button], summary, label`), `caret` (sobre `p, h1, h2, h3, li` com texto; altura = `fontSize * 1.05`, clamp 18–140px).
- Forma visual provisória: círculo `14px` com `--color-accent`. A forma final (d20/runa) vem no Plano 2 — o elemento só precisa aceitar conteúdo SVG filho.
- Atualiza só `transform`/`width`/`height`/`border-radius` via `style` dentro de `requestAnimationFrame`. Nunca estado em atributos por frame além de `data-shape`.
- Cursor nativo **não** é escondido sobre `input, textarea, select, [contenteditable]`. `.cursor` tem `aria-hidden="true"` e `pointer-events: none`.

- [ ] **Step 1: e2e** (chromium desktop): após `page.mouse.move(200,200)` e 500ms, `.cursor` tem `transform` contendo `translate3d(`; hover num `a` → `data-shape="ring"`. Contexto `reducedMotion: 'reduce'` → `html` **não** tem `data-cursor`, `.cursor` está `display:none`. Contexto `hasTouch: true, isMobile: true` → idem (Review Focus 3). Página com `<input>`: `getComputedStyle(input).cursor` ≠ `none`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + `npm run check`.
- [ ] **Step 5:** Verificação manual: `npm run dev`, mexer o mouse, conferir mola, squash e troca de forma. Ajustar constantes no olho.
- [ ] **Step 6:** Commit `feat: cursor-personagem com física de mola`.

---

### Task 6: Reveals no scroll e navbar que se esconde

**Files:**
- Create: `src/scripts/motion/reveal.ts`, `src/scripts/motion/nav.ts`, `tests/unit/nav.test.ts`, `tests/e2e/reveal.spec.ts`
- Modify: `src/styles/global.css`, `src/layouts/Base.astro`, páginas (marcar elementos com `data-reveal` e, no hero, `data-reveal="words"`)

**Interfaces:**
- Produces `initReveal(root?: Document): void` — `IntersectionObserver` (threshold `.15`) adiciona `data-revealed` uma vez; `data-reveal="words"` é dividido em `<span class="word" style="--i:N">` no init (texto continua o mesmo para leitores de tela: container recebe `aria-label` com o texto original e spans `aria-hidden`).
- CSS: estado escondido **só** sob `html.js [data-reveal]:not([data-revealed])`. Com reduced motion: tudo visível, sem animação.
- Produces `shouldHideNav(prevY: number, y: number, threshold = 120): boolean` (true se `y > prevY && y > threshold`) e `initNavHide(nav: HTMLElement): void` (scroll passivo + rAF, alterna `data-hidden`; foco dentro da nav a mantém visível).

- [ ] **Step 1: unit** `shouldHideNav(0,50)===false`, `shouldHideNav(100,200)===true`, `shouldHideNav(300,200)===false`.
- [ ] **Step 2: e2e:** `javaScriptEnabled:false` → todo `[data-reveal]` tem opacidade 1 e texto visível (Review Focus 1). Com JS: elemento abaixo da dobra sem `data-revealed`; após `scrollIntoViewIfNeeded` ganha `data-revealed`. Rolar 600px para baixo → `nav[data-hidden]`; rolar para cima → sem `data-hidden`.
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS.
- [ ] **Step 6:** Commit `feat: reveals no scroll e navbar auto-hide`.

---

### Task 7: Transição de página em íris

**Files:**
- Create: `src/scripts/motion/transition.ts`, `tests/unit/transition.test.ts`, `tests/e2e/transition.spec.ts`
- Modify: `src/styles/global.css`, `src/layouts/Base.astro`

**Interfaces:**
- Produces:
```ts
type Origin = { x: number; y: number; t: number }
function encodeOrigin(x: number, y: number, now: number): string
function decodeOrigin(raw: string | null, now: number, maxAgeMs = 3000): { x: number; y: number } | null // null se ausente, inválido ou velho
function initTransitionOrigin(): void
```
- `initTransitionOrigin`: no `click` em link same-origin (não `_blank`, não só-hash, não com modificador), salva `encodeOrigin` em `sessionStorage['vv:vt']`; teclado (`event.detail === 0`) usa o centro do link. Na carga, `decodeOrigin` → define `--vt-at: Xpx Ypx` no `<html>`; ausente → `50% 50%`. Todo acesso a storage em `try/catch` (Review Focus 5).
- CSS: `@view-transition { navigation: auto; }`; `::view-transition-new(root)` com `mask-image: radial-gradient(circle at var(--vt-at), #000 var(--vt-r), transparent calc(var(--vt-r) + 1px))`, animando `--vt-r` (registrado via `@property` como `<length>`) de `0` a `150vmax`, `.48s var(--ease-out)`. Desligado em `prefers-reduced-motion`. Browsers sem suporte: navegação normal.

- [ ] **Step 1: unit** round-trip `decodeOrigin(encodeOrigin(10,20,1000),1500)` → `{x:10,y:20}`; `decodeOrigin(encodeOrigin(10,20,0), 5000)` → `null`; `decodeOrigin('lixo', 0)` → `null`; `decodeOrigin(null,0)` → `null`.
- [ ] **Step 2: e2e:** clicar em "About" no nav navega para `/about/` (com e sem `sessionStorage` sobrescrito para lançar via `addInitScript` — ambos navegam e sem erro no console).
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS. **Step 6:** Verificação manual no Chrome: a íris abre do ponto do clique.
- [ ] **Step 7:** Commit `feat: transição de página em íris`.

---

### Task 8: Pipeline de cartas (APIs → pool)

**Files:**
- Create: `scripts/cards/{types,normalize,fetchers,pool,images,build,seed}.ts`, `tests/fixtures/{scryfall,tcgdex,optcg}.json` (respostas reais salvas uma vez com `curl`, cortadas a ~5 itens; incluir um item **sem imagem**), `tests/unit/cards.test.ts`, `cards-seed/cards.json`, `cards-seed/img/*.webp`
- Modify: `package.json` (`"prebuild": "tsx scripts/cards/build.ts"`, `"cards:seed": "tsx scripts/cards/seed.ts"`)

**Interfaces:**
- Produces:
```ts
type Game = 'pokemon' | 'magic' | 'onepiece'
type Card = { id: string; game: Game; name: string; set: string; rarity?: string; imageUrl: string; image?: string } // image = caminho local '/cards/<game>-<id>.webp' após download
function normalizeScryfall(json: unknown): Card[]   // usa image_uris.large ou card_faces[0].image_uris.large
function normalizeTcgdex(json: unknown): Card[]     // imageUrl = `${image}/high.webp`
function normalizeOptcg(json: unknown): Card[]
// Cada normalize descarta itens sem imagem/nome e nunca lança com JSON inesperado (retorna []).
type Fetcher = () => Promise<Card[]>
function buildPool(fetchers: Record<Game, Fetcher>, seed: Card[], perGame = 30, timeoutMs = 10000):
  Promise<{ cards: Card[]; sources: Record<Game, 'live' | 'seed'> }>
// por jogo: live se fetcher resolve dentro do timeout com ≥ 6 cartas; senão as do seed daquele jogo. Nunca rejeita.
function downloadAndOptimize(cards: Card[], outDir: string, width = 480): Promise<Card[]> // sharp → webp; falha de download → descarta a carta
```
- Seleção por API (decisão de implementação, ajustar se a API mudar): Scryfall `GET /cards/search?q=is:foil+rarity:mythic&order=random` (página 1) ; TCGdex `GET /v2/en/cards?rarity=Rare%20Holo` + amostra aleatória; optcgapi endpoint de cartas por set com raridade `SR`/`SEC`. Conferir os endpoints atuais nas docs antes de codar.
- `build.ts`: lê `cards-seed/cards.json`, roda `buildPool`, baixa imagens `live` para `public/cards/`, copia imagens seed de `cards-seed/img/` para `public/cards/`, escreve `src/data/cards.json` e loga `sources`. Exit code 0 sempre que houver ≥ 1 carta.
- `seed.ts`: igual ao build, mas escreve em `cards-seed/` (10 cartas por jogo). Rodado manualmente uma vez nesta task e commitado.

- [ ] **Step 1: unit** com fixtures: cada normalize retorna N-1 cartas (item sem imagem descartado) com `game` certo e `imageUrl` http(s); `normalizeX({})` → `[]`; `normalizeX(null)` → `[]`. `buildPool` com fetcher Pokémon que rejeita e Magic que demora > timeout (fake timers) → `sources.pokemon === 'seed'`, `sources.magic === 'seed'`, `sources.onepiece === 'live'` e não rejeita (Review Focus 2). Fetcher que retorna 2 cartas → `seed`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** `npm run cards:seed` → `cards-seed/` com ~30 webp (cada um < 80 KB). Commit do seed.
- [ ] **Step 6:** `npm run build` com rede → log mostra `live` nos três; desligar rede (`unshare -n npm run build` ou variável `CARDS_OFFLINE=1` que faz os fetchers rejeitarem) → build passa com `seed`.
- [ ] **Step 7:** Commit `feat: pipeline de cartas com fallback para pool semente`.

---

### Task 9: Card holográfico e mesa de cartas

**Files:**
- Create: `src/scripts/holo.ts`, `src/scripts/sample.ts`, `src/components/HoloCard.astro`, `src/components/CardTable.astro`, `tests/unit/holo.test.ts`, `tests/unit/sample.test.ts`, `tests/e2e/hobbies.spec.ts`
- Modify: `src/pages/hobbies.astro`, `src/pages/pt/hobbies.astro`

**Interfaces:**
- Consumes: `src/data/cards.json` (`Card[]`, Task 8).
- Produces:
```ts
function sampleCards(pool: Card[], n: number, rand: () => number = Math.random): Card[]
// n cartas distintas; garante ao menos 1 de cada game presente no pool quando n ≥ nº de games; n > pool.length → pool embaralhado inteiro
function pointerToVars(px: number, py: number, rect: {left:number;top:number;width:number;height:number}):
  { '--px': string; '--py': string; '--rx': string; '--ry': string; '--hyp': string }
// px%/py% em 0–100 (clamp), rx = (py% - 50) / 3.5 deg, ry = (50 - px%) / 3.5 deg, hyp = distância ao centro normalizada 0–1
function initHolo(card: HTMLElement): () => void
```
- `CardTable.astro` renderiza **estaticamente** as 6 primeiras cartas do pool (funciona sem JS, Review Focus 1, com `alt` = `"${name} — ${set}"`) e um `<script>` que, no cliente, troca por `sampleCards(pool, 6)` (pool embutido como JSON só com `id, game, name, set, image`).
- `HoloCard.astro`: camadas `.holo__img`, `.holo__shine` (gradiente arco-íris com `mix-blend-mode: color-dodge`, posição por `--px/--py`), `.holo__glare` (radial em `--px/--py`, `mix-blend-mode: overlay`); `transform: perspective(800px) rotateX(var(--rx)) rotateY(var(--ry))`. `pointerleave`/`pointercancel`/`touchend` → volta suave a 0 (transition `.5s var(--ease-out)`) (Review Focus 3). Reduced motion → sem tilt, só brilho estático. Foco por teclado (`tabindex="0"`) aplica leve inclinação fixa.
- Aviso de marcas com `t(lang, 'cards.disclaimer')` abaixo da mesa.

- [ ] **Step 1: unit** `sampleCards` com `rand` determinístico: 6 distintas, os 3 games presentes; pool de 4 e n=6 → 4. `pointerToVars` no centro → `--rx: 0deg`, `--ry: 0deg`, `--hyp: 0`; fora do rect → clamp 0/100.
- [ ] **Step 2: e2e** `/hobbies/`: 6 `.holo` com `img` carregada (`naturalWidth > 0`); sem JS → 6 cartas visíveis; `page.mouse.move` sobre a carta → `style` contém `--rx`; `hasTouch` + `tap` e depois `tap` fora → `--rx` volta a `0deg`. Recarregar 5 vezes com JS → ao menos 2 conjuntos diferentes de `alt`.
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS.
- [ ] **Step 6:** Verificação manual no Chrome e no celular (`npm run dev -- --host`): o brilho acompanha o dedo/mouse.
- [ ] **Step 7:** Commit `feat: cartas holográficas sorteadas na página de hobbies`.

---

### Task 10: CI/CD com GitHub Actions → Cloudflare (preview)

**Files:**
- Create: `.github/workflows/deploy.yml`, `wrangler.toml` (só se o caminho Workers for o escolhido), `README.md` (como rodar, scripts, secrets necessários)

**Interfaces:**
- Consumes: scripts npm `check`, `test`, `build` (`prebuild` incluso), `test:e2e`.
- Workflow:
  - Gatilhos: `push` em `main`, `pull_request`, `schedule: cron "0 6 * * 1"`, `workflow_dispatch`.
  - Job `test`: checkout → setup-node (`.nvmrc`, cache npm) → `npm ci` → `npm run check` → `npm test` → `npx playwright install --with-deps chromium` → `npm run test:e2e` (que faz o build).
  - Job `deploy` (needs `test`): build → `cloudflare/wrangler-action@v3` com `apiToken: secrets.CLOUDFLARE_API_TOKEN`, `accountId: secrets.CLOUDFLARE_ACCOUNT_ID`; comando `pages deploy dist --project-name=vandrovisky --branch=${{ github.head_ref || github.ref_name }}` (ou o equivalente Workers). PRs comentam a URL de preview.
  - `permissions: contents: read` (+ `pull-requests: write` só para o comentário). **Nenhum** passo de `git push`.
- **Antes de codar:** checar na doc da Cloudflare se Pages ainda é recomendado para sites estáticos novos ou se é Workers static assets; seguir o recomendado e registrar a escolha no README.

- [ ] **Step 1:** Eric cria o repo `vandrovisky/vandrovisky.com` no GitHub (público), o projeto na Cloudflare, o API token (permissão de edição de Pages/Workers) e adiciona os secrets. Claude fornece o passo a passo e **não** liga domínio customizado.
- [ ] **Step 2:** Escrever o workflow e o README; `git remote add origin …`; push numa branch `ci/setup` e abrir PR.
- [ ] **Step 3:** Verificar: job `test` verde, deploy de preview com URL acessível, `/hobbies/` com cartas e log mostrando `live`. Rodar `workflow_dispatch` na `main` após merge → deploy verde.
- [ ] **Step 4:** Lighthouse (Chrome DevTools ou `npx lighthouse <url-preview> --preset=desktop` e mobile) na home e em `/hobbies/`: anotar os números no PR; abaixo de 95 → abrir issue com o item responsável (correção pode ficar para o Plano 2 se depender do tema visual).
- [ ] **Step 5:** Merge do PR.

---

### Task 11: Script de captura dos prints dos cases

**Files:**
- Create: `scripts/capture.ts`, `src/assets/work/.gitkeep`
- Modify: `package.json` (`"capture": "tsx scripts/capture.ts"`)

**Interfaces:**
- Produces `npm run capture -- <slug> <url> [--mobile]` → salva `src/assets/work/<slug>-desktop.png` (1440×900, `deviceScaleFactor: 2`) e/ou `<slug>-mobile.png` (iPhone 15 do Playwright), após `networkidle` + 1s, escondendo banners de cookie por seletor opcional `--hide "<css>"`. A URL é argumento de linha de comando e **não** é gravada em nenhum arquivo do site.
- Os prints em si e a decisão de usá-los (login, dados de clientes, ok da JMV) são do Plano 2.

- [ ] **Step 1:** Implementar; rodar `npm run capture -- teste https://example.com` → arquivo criado, abrir e conferir.
- [ ] **Step 2:** Apagar o arquivo de teste. Commit `chore: script de captura de prints`.

---

## Self-review (feito)

- Cobertura do spec: stack (T1), i18n/rotas/hreflang/sitemap (T2–3), certificações em Sobre (T3), cases visuais sem URL + técnicos + meta (T3), CV PDFs (T3), cursor (T4–5), reveals/nav (T6), íris (T7), cartas + fallback + sem commit no CI (T8, T10), holo reimplementado (T9), CI/CD push/PR/cron (T10), go-live adiado e redirect github.io (Plano 2), prints (T11 + Plano 2), Lighthouse ≥ 95 (T10 step 4), sem JS (T6, T9). Identidade visual, textos e lançamento → Plano 2, declarado no topo.
- Tipos consistentes: `Lang`, `Card`, `Game`, `SpringState`, `Origin` definidos uma vez e reutilizados por nome.
