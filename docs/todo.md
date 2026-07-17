# TODO — før fase 1 kan starte

Småting som må på plass før implementasjonen begynner. Når disse er gjort, fortsetter arbeidet i [dev-tasks.md](./dev-tasks.md) fra fase 1.

Status per 2026-07-17.

## 1. Installer Node — ✅ gjort 2026-07-17

Nvm ble installert via `brew install nvm` (0.40.6, ikke curl-scriptet), init-linjene ligger i `~/.zshrc`.

- [x] Installer nvm (`brew install nvm`).
- [x] Gjeldende LTS bekreftet: Node 24 (`v24.18.0`).
- [x] `nvm install --lts && nvm alias default lts/*`
- [x] Verifisert: `node --version` → v24.18.0, `npm --version` → 11.16.0.

**Merk (brew-caveat):** Homebrew-varianten av nvm er offisielt usupportert av nvm-prosjektet. `$NVM_DIR` er satt til `~/.nvm` (ikke Cellar-stien), så Node-installasjoner overlever `brew upgrade nvm`.

**Merk:** Selve pinningen (`.nvmrc` + `"engines"` i `package.json`) er allerede en oppgave i fase 1 i [dev-tasks.md](./dev-tasks.md) — den skal ikke gjøres her. Her handler det bare om å få Node på maskinen, og om å vite *hvilken* versjon som skal pinnes.

## 2. Commit dokumentasjonen

`docs/` er fortsatt untracked, og slettingen av rot-`README.md` er ucommittet. Få planen inn i git før første kodelinje, så du har et fast referansepunkt å diffe mot underveis.

- [x] Gjenopprett rot-`README.md` — gjort 2026-07-17, nå som kort prosjektbeskrivelse pluss peker til `docs/`.
- [x] `git add README.md docs/ && git commit` — gjort 2026-07-17, `dev-log.md` ble også tatt med.
- [x] `git push`

## 3. Aktiver GitHub Pages

Repoet finnes allerede (`git@github.com:jonasols1g/watchlist.git`, verifisert 2026-07-17 — SSH-auth virker, `main` er pushet). Navnet er `watchlist`, som stemmer med `base: '/watchlist/'`. Produksjons-URL blir <https://jonasols1g.github.io/watchlist/>.

- [ ] Slå på Pages i repo-innstillingene med **Source: GitHub Actions** (ikke «Deploy from a branch» — workflowen i fase 1/9 bruker `actions/deploy-pages`).

Selve publiseringen aktiveres først i fase 9; dette er bare bryteren som må stå riktig for at workflowen skal ha lov til å deploye.

---

## Ikke et hinder, men verdt å vite

- **`gh` (GitHub CLI) er ikke installert.** Ikke nødvendig — git over SSH virker allerede. Men `brew install gh` gjør det enklere å sette Actions-secrets fra terminalen når fase 10 kommer og API-nøklene skal inn.
- **API-nøkler trengs først i fase 10.** OMDb og MOTN kan vente — fase 1–9 kjører på `MockMediaProvider`. Ingen grunn til å skaffe dem nå.
