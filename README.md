# vandrovisky.com

Portfólio pessoal de Eric Robertson. Astro estático, EN em `/` e PT em `/pt/`, animações em TypeScript puro (sem framework), cartas TCG holográficas e deploy na Cloudflare via GitHub Actions.

- Design: `docs/superpowers/specs/2026-11-14-portfolio-design.md`
- Plano da fundação: `docs/superpowers/plans/2026-11-14-portfolio-foundation.md`

## Rodando

```bash
nvm use            # Node 24
npm ci
npm run dev        # http://localhost:4321
```

| Script | O que faz |
|---|---|
| `npm run build` | `prebuild` (busca cartas) + `astro build` → `dist/` |
| `npm run check` | type-check do Astro (precisa de `src/data/cards.json`: rode `npm run prebuild` antes) |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | testes no navegador (Playwright) contra o build, usando o pool semente de cartas |
| `npm run cards:seed` | atualiza o pool semente versionado em `cards-seed/` (10 cartas por jogo) |
| `npm run capture -- <slug> <url>` | gera prints de um site em `src/assets/work/` |

`CARDS_OFFLINE=1` faz o prebuild pular as APIs e usar só o pool semente.

## Cartas

Pokémon (TCGdex), Magic (Scryfall) e One Piece (optcgapi.com) são buscadas no build. Se uma API falhar ou demorar mais de 10 s, aquele jogo usa o pool semente de `cards-seed/`. O build nunca falha por causa das APIs e o CI nunca faz commit.

## Deploy

Cloudflare **Workers com static assets** (recomendação atual da Cloudflare para projetos novos; Pages continua suportado). Configuração em `wrangler.jsonc`.

`.github/workflows/deploy.yml`:
- `push` na `main` → testes + deploy em produção (`vandrovisky.<conta>.workers.dev`);
- `pull_request` → testes + versão de preview `pr-<n>` com a URL comentada no PR;
- toda segunda 06:00 UTC → rebuild com cartas novas;
- `workflow_dispatch` → manual.

### Secrets do repositório
| Secret | Onde pegar |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → template **Edit Cloudflare Workers** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages → Account ID (barra lateral) |

O domínio `vandrovisky.com` **só é ligado no lançamento** (Plano 2): Workers → `vandrovisky` → Settings → Domains & Routes → Add → Custom domain.
