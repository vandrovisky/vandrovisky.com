# vandrovisky.com — Portfólio pessoal — Design

Data: 2026-11-14
Autor: Eric Robertson Ribeiro Pires (com Claude)
Status: rascunho para aprovação

## 1. Intenção e porquê

Eric é Desenvolvedor Fullstack (Laravel/Python/DevOps, 4+ anos) buscando vaga Pleno. Hoje o portfólio é `vandrovisky.github.io`: um SPA React + GSAP com HTML vazio (`<div id="root">`), SEO fraco e sem identidade forte. Ele comprou o domínio `vandrovisky.com` e quer:

1. **Um portfólio profissional bilíngue (EN/PT)** que mostre quem ele é, o que já construiu, certificações e hobbies, para recrutadores e líderes técnicos.
2. **Alcançar um nível de animação/interação** que sempre quis atingir como fullstack, na linha de https://sobra.be/: cursor com física de mola, transição de página em "íris", reveals no scroll, detalhes de personalidade.
3. **Aprender fazendo**: as animações são código dele (TS puro), explicáveis em entrevista. O próprio site vira um case público, já que a experiência profissional dele é toda em código fechado.
4. Depois disso, trabalhar bem o **SEO** (próxima fase; a arquitetura precisa favorecer).

### Referência técnica: como o sobra.be funciona (analisado no código)
- Vite multipágina, "zero frameworks", ~37 KB de JS.
- **Cursor/bolinha**: `<div>` posicionada via `transform: translate3d` em loop `requestAnimationFrame`, com mola (`v = (v + (alvo - x) * k) * damping`), squash/stretch pela velocidade, muda de forma (ponto / anel sobre interativos / caret sobre texto), faíscas via Web Animations API. Só liga com `pointer: fine` e sem `prefers-reduced-motion`.
- **Transição entre páginas**: View Transitions **entre documentos** (CSS `@view-transition`), o ponto do clique salvo em `sessionStorage` vira `--vt--at`, e `::view-transition-new(root)` anima um `mask-image: radial-gradient(circle at var(--vt--at) …)`.
- **Reveals**: `IntersectionObserver` + `@keyframes` CSS.
- **Canvas**: só para efeito de matriz de pontos no logo e um mini-jogo escondido.

## 2. Objetivos, não-objetivos, anti-objetivos

**Objetivos**
- Site estático rápido, conteúdo completo no HTML (SEO), EN e PT.
- Animações ricas com JS mínimo, respeitando acessibilidade.
- Deploy automatizado (push → produção, PR → preview, cron semanal).
- Seção de hobbies com cartas TCG holográficas sorteadas.

**Não-objetivos (nesta fase)**
- Blog.
- CMS / painel admin.
- Trabalho de SEO avançado (schema.org detalhado, estratégia de conteúdo) — próxima fase. Nesta fase só a base: meta tags, `hreflang`, sitemap, OG image.
- Mini-jogo/easter eggs elaborados (podem vir depois; deixar espaço).

**Anti-objetivos (seria fracasso mesmo funcionando)**
- **Clone visual do sobra.be.** Pegamos as técnicas, não o layout/cores/marca. Identidade própria.
- Animação que atrapalha leitura ou deixa o site lento/inacessível (recrutador com pressa precisa achar stack, experiência e contato em segundos).
- Site que quebra quando uma API de cartas cai.
- Expor código, dados ou URLs de projetos das empresas.

## 3. Restrições

- Domínio `vandrovisky.com` com DNS na **Cloudflare**; hospedagem na Cloudflare (Pages, ou Workers static assets se for o recomendado no momento — conferir na implementação).
- **Repositório próprio** no GitHub (sugestão: `vandrovisky/vandrovisky.com`), local em `~/works/vandrovisky.com`. A pasta vazia `~/works/curriculo/portifolio` deve ser removida.
- Deploy via **GitHub Actions**.
- Projetos da seção Trabalho: **só prints, sem URL/link** para os sites.
- Card holográfico: técnica inspirada em `simeydotme/pokemon-cards-css` (GPL-3.0) → **reimplementar**, não copiar código.
- Imagens de cartas pertencem às editoras (Nintendo/TPC, Wizards, Bandai): uso como fã, com crédito/aviso no rodapé da seção.

## 4. Abordagens consideradas

| | Abordagem | Prós | Contras |
|---|---|---|---|
| **A ✅ escolhida** | **Astro + animações em TypeScript puro** | HTML estático por rota (SEO), componentes, i18n, content collections em Markdown, JS só onde precisa; mesma técnica do sobra | Física/easing na mão (sem GSAP) |
| B | Astro + ilhas React + GSAP | Reaproveita conhecimento atual | +70–100 KB JS; tentação de animar via estado React; fica perto do site antigo |
| C | Vite multipágina puro (igual sobra) | Controle total | Reimplementar layouts, i18n, sitemap à mão |

Escolhida **A** pelo Eric. GSAP pode entrar pontualmente numa página no futuro se alguma animação pedir, sem mudar a arquitetura. React só como ilha se surgir algo com muito estado (não previsto).

## 5. Decisões (o "como" decidido)

### 5.1 Stack
- **Astro** (versão estável atual), saída estática (`output: 'static'`), TypeScript.
- Animações em **TS puro** em `<script>` dos componentes Astro (bundle pelo Vite do Astro).
- CSS próprio (custom properties, sem Tailwind obrigatório — decisão do builder se quiser utilitários).
- Sem React/GSAP na v1.

### 5.2 Idiomas e rotas
- **EN na raiz `/`, PT em `/pt/`** (i18n nativo do Astro, `prefixDefaultLocale: false`). *Proposta do Claude — vagas remotas e SEO internacional.*
- Seletor de idioma que leva à página equivalente.
- `hreflang` + sitemap (`@astrojs/sitemap`).

### 5.3 Estrutura de páginas
```
/                 Home: hero animado, resumo curto, destaques (2–3 cases), CTA contato
/about            Sobre: trajetória (Suporte TI → Júnior → Pleno na JMV → Prontomed),
                  stack, idiomas, formação (Eng. Computação UEMG), certificações
/work             Trabalho: grade de cases
/work/[slug]      Página do case
/hobbies          RPG + mesa de cartas holográficas
/contact          (ou seção no rodapé) e-mail, LinkedIn, GitHub, download CV PDF PT/EN
/pt/...           espelho em português (/pt/sobre, /pt/trabalho... — slugs traduzidos é decisão do builder)
```
- Certificações como **seção dentro de Sobre** (proposta do Claude), não página própria, a menos que a lista seja longa.
- Download dos PDFs de currículo existentes (PT e EN) em `public/`.

### 5.4 Cases (seção Trabalho)
Content collection `work` em Markdown, um arquivo por idioma por case. Campos: `title`, `slug`, `summary`, `role`, `stack[]`, `year`, `cover` (imagem), `gallery[]`, `kind: 'visual' | 'technical'`, `order`, `featured`.

**Cases visuais (prints, sem link):**
- **JMV Play** — Eric fez front e back.
- **Color Fantasy** — Eric fez front e back.
- **Ágora (JMV Stream)** — Eric fez front e back.
- Crédito: "desenvolvido na JMV Technology".
- Prints capturados uma vez (Playwright, desktop + mobile) e versionados no repo; imagens otimizadas via `astro:assets`. Opcional: vídeo curto `.webm` em loop no hover (decisão do builder, se peso ok).

**Cases técnicos (sem visual, com diagrama):**
- Migração PHP puro → Laravel com testes (Prontomed / SOL).
- Agentes de IA no WhatsApp via Chatwoot.
- Integrações de pagamento (Stripe, PayPal, Cora/WHMCS).
- Estrutura: contexto → problema → arquitetura (diagrama SVG) → decisões → resultado.

**Case meta:** o próprio portfólio (Astro, animações sem framework, CI/CD com cron, 3 APIs de cartas).

Texto dos cases: Claude redige rascunhos a partir do currículo e de perguntas ao Eric; Eric revisa. Nenhum detalhe sensível de cliente.

### 5.5 Sistema de animação (TS puro)
Todos desligam ou simplificam com `prefers-reduced-motion: reduce`; efeitos de cursor só com `pointer: fine`.

1. **Cursor-personagem**: elemento DOM com física de mola em rAF, squash/stretch, muda de forma sobre links/texto, "estaciona" em âncoras da página quando o mouse sai. **A forma/personagem é própria do Eric** (não a bolinha laranja) — a definir na fase visual (ideia: ligada ao tema RPG/cartas, ex. um d20 ou runa).
2. **Transição de página**: View Transitions entre documentos (CSS `@view-transition { navigation: auto; }`), máscara radial a partir do ponto do clique (`sessionStorage` → `--vt--at`). Fallback: navegação normal em browsers sem suporte. *Alternativa se o cursor precisar persistir entre páginas: `<ClientRouter />` do Astro — decisão do builder.*
3. **Reveals no scroll**: `IntersectionObserver` + `@keyframes`, palavras/linhas entrando em sequência no hero e títulos.
4. **Navbar** que some ao rolar para baixo e volta ao subir.
5. **Card holográfico** (seção hobbies): ver 5.6.
6. Canvas: não obrigatório na v1; espaço para um efeito no hero depois.

### 5.6 Hobbies: RPG + cartas TCG
- Texto curto sobre RPG (detalhes a coletar com Eric).
- **Mesa de cartas**: N cartas (ex. 5–6) sorteadas a cada visita, misturando Pokémon, Magic e One Piece.
- **Fontes de dados** (testadas em 2026-11-14):
  - Magic: Scryfall (`api.scryfall.com`, sem chave; exige `User-Agent` e `Accept`).
  - Pokémon: **TCGdex** (`api.tcgdex.net`, sem chave). pokemontcg.io estava 502 — não usar como principal.
  - One Piece: optcgapi.com (comunitária, sem chave).
- **Busca no build, não no navegador**: script de build gera um pool (ex. ~30 cartas por jogo, preferindo raras/holo) em JSON + baixa/otimiza as imagens para o próprio site. No cliente, um script pequeno sorteia do pool.
- **Pool semente commitado + refresh no build** *(decisão do Claude)*: o repo tem um pool semente pequeno (JSON + imagens WebP otimizadas, poucos MB) versionado. Cada build (incluindo o cron semanal) tenta buscar cartas novas nas APIs; o que falhar cai no pool semente daquele jogo. O build **nunca falha** por causa das APIs e **o CI não faz commit** de volta (sem bot push, sem loop de deploy, repo não cresce). O pool semente é atualizado manualmente com um script `npm run cards:seed` quando o Eric quiser.
- **Efeito holográfico**: reimplementação própria — JS grava posição do ponteiro em variáveis CSS (`--pointer-x/y`, `--rotate-x/y`); CSS faz tilt 3D + camadas de brilho com `mix-blend-mode` e gradientes. Toque/giroscópio no mobile é bônus.
- Aviso de marcas/direitos das cartas no rodapé da seção.

### 5.7 Deploy e CI/CD
- Repo GitHub próprio. Workflow `.github/workflows/deploy.yml`:
  - `push` em `main` → build + deploy produção.
  - `pull_request` → build + deploy de preview.
  - `schedule` semanal (segunda 06:00 UTC) → rebuild renovando o pool de cartas.
  - Passos: checkout → Node LTS (cache npm) → `npm ci` → `astro check` → `astro build` → `cloudflare/wrangler-action` deploy.
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- **Go-live (decisão do Eric):** durante o desenvolvimento, deploys só nos endereços de preview da Cloudflare (`*.pages.dev`). O domínio `vandrovisky.com` (+ `www` redirecionando) só é ligado ao projeto **no lançamento**, quando o site estiver pronto (visual + textos). O redirect do github.io acontece no mesmo momento.
- `vandrovisky.github.io`: no lançamento, substituir o conteúdo do repo antigo por um redirect para `vandrovisky.com` (meta refresh + canonical + `404.html` que também redireciona). *(Decisão do Claude)*: o site antigo é um SPA de página única, então tudo redireciona para a home do novo; sem mapeamento de rotas. Faz parte do escopo, como último passo.

### 5.8 SEO base (v1)
- `<title>`/description por página e idioma, canonical, `hreflang`, Open Graph/Twitter cards, sitemap, `robots.txt`, HTML semântico. SEO aprofundado fica para a próxima fase.

### 5.9 Qualidade
- Lighthouse alvo ≥ 95 em Performance/Acessibilidade/SEO (mobile).
- Navegável por teclado; foco visível; contraste AA; o cursor custom nunca esconde o foco nem o cursor nativo em campos.
- Funciona sem JS (conteúdo todo legível; só perde animações e cartas sorteadas — fallback: primeiras cartas do pool renderizadas estaticamente).

## 6. Deixado para o builder
- Estrutura interna de pastas/componentes do Astro.
- Slugs traduzidos em `/pt/` ou não.
- Tailwind ou CSS puro.
- Pages vs Workers static assets (seguir recomendação atual da Cloudflare).
- Vídeo no hover dos cases visuais (se o peso couber).
- Detalhes de easing/constantes de mola (ajustar no olho).

## 7. Pendências de conteúdo/visual com o Eric (não bloqueiam o início)
- Identidade visual: paleta, tipografia, forma do cursor-personagem (sessão visual com mockups antes de codar o tema).
- Lista de certificações.
- O que é cada site (JMV Play, Color Fantasy, Ágora) e um desafio técnico de cada.
- Prints dos 3 sites: se as telas exigem login, se há dados reais a borrar, e se a JMV está de acordo. Fallback: Eric envia os prints e Claude só limpa/otimiza. (Em 2026-11-14 o colorfantasy.art deu timeout.)
- Texto sobre RPG (mesa? qual sistema?).
- Foto/avatar.
