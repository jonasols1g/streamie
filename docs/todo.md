# TODO — før fase 1 kan starte

Småting som må på plass før implementasjonen begynner. Når disse er gjort, fortsetter arbeidet i [dev-tasks.md](./dev-tasks.md) fra fase 1. Løste punkter fjernes fra listen — historikken står i [dev-log.md](../dev-log.md).

Status per 2026-07-17. Node (v24.18.0 via nvm) og `gh` er installert, dokumentasjonen er committet og pushet, og subagent-teamet er definert i `.claude/agents/` (`feature-planner`, `dev`, `reviewer`, `verifier`).

## 1. Aktiver GitHub Pages — ⏸ utsatt 2026-07-17 (blokkert av privat repo)

Repoet finnes allerede (`git@github.com:jonasols1g/watchlist.git`, verifisert 2026-07-17 — SSH-auth virker, `main` er pushet). Navnet er `watchlist`, som stemmer med `base: '/watchlist/'`. Produksjons-URL blir <https://jonasols1g.github.io/watchlist/>.

**Funn 2026-07-17:** Forsøk på å aktivere Pages via `gh api` feilet med «Your current plan does not support GitHub Pages for this repository» — repoet er **privat**, og Pages på gratisplanen krever offentlig repo. Beslutning: utsatt til fase 9, da Pages først trengs reelt. Da må ett av disse velges:

- Gjør repoet offentlig (`gh repo edit --visibility public`) — gratis; koden er trygg å publisere (API-nøkler ligger som Actions-secrets, ikke i repoet), men husk risikonotatet i [architecture.md](./architecture.md#kjente-forutsetninger-og-risikoer) om eksponerte nøkler i bundelen når appen deles.
- Oppgrader til GitHub Pro og behold repoet privat (Pages-siden blir uansett offentlig for den som har URL-en).

- [ ] (Fase 9) Velg løsning over, og slå deretter på Pages med **Source: GitHub Actions** (ikke «Deploy from a branch» — workflowen bruker `actions/deploy-pages`): `gh api -X POST repos/jonasols1g/watchlist/pages -f build_type=workflow`

Fase 1–8 er ikke blokkert av dette; deploy-workflowen kan til og med skrives i fase 1, den vil bare feile på deploy-steget til bryteren er på.

---

## Ikke et hinder, men verdt å vite

- **API-nøkler trengs først i fase 10.** OMDb og MOTN kan vente — fase 1–9 kjører på `MockMediaProvider`. Ingen grunn til å skaffe dem nå. Når de skal inn: `gh secret set` (gh er installert og innlogget som `jonasols1g`).
