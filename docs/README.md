# Dokumentasjon — watchlist

`watchlist` er en nettapplikasjon for å slå opp filmer og serier, se informasjon om dem (bilde, beskrivelse, sjanger, IMDb-score, Rotten Tomatoes-score, strømmetjenester) og holde en personlig oversikt over hva man planlegger å se og hva man har sett.

Appen er **100 % klient-side** — det finnes ingen backend. All state (watchlist og cache av søk/oppslag) lagres i nettleserens `localStorage`. Data hentes fra to API-er som begge kalles direkte fra nettleseren: **OMDb** for søk og titteldata, og **Movie of the Night** for strømmetilgjengelighet (se [Datakilder](./architecture.md#datakilder)). Selve integrasjonen er en egen, senere fase — fase 1–9 bygges mot en `MockMediaProvider` (se [dev-tasks.md](./dev-tasks.md)).

## Dokumenter

- **[todo.md](./todo.md)** — Småting som må på plass før fase 1 kan starte. **Start her.**
- **[architecture.md](./architecture.md)** — Teknisk arkitektur: lagdeling, prosjektstruktur, `MediaProvider`-abstraksjonen, caching-design, state management og kjente forutsetninger/risikoer.
- **[data-model.md](./data-model.md)** — TypeScript-datamodell for media, ratings, streaming-tilgjengelighet, watchlist-oppføringer og cache.
- **[design.md](./design.md)** — Sider/ruter, søkeflyt (tekst og tale), visning av oppslagsresultater, watchlist-UX og styling-tilnærming.
- **[dev-tasks.md](./dev-tasks.md)** — Faseinndelt utviklingsrekkefølge for implementasjonen.
- **[dev-log.md](../dev-log.md)** — Daglig logg over hva som er gjort (ligger i prosjektroten).

## Nøkkelbeslutninger (kort)

| Tema | Valg |
|---|---|
| Rammeverk | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Lagring | `localStorage` (både watchlist og cache) |
| Talesøk | Web Speech API (`lang: 'en-US'`), med fallback til tekstsøk |
| Søke-trigger | Eksplisitt submit (Enter/knapp) — ikke søk-mens-du-skriver |
| Datakilde | OMDb (søk, beskrivelse, sjanger, plakat, IMDb-/RT-score) + Movie of the Night (strømmetjenester), abstrahert bak et `MediaProvider`-interface |
| Felles ID | IMDb-ID (`tt0133093`) er `Media.id` og binder de to kildene sammen |
| Testing | Vitest + React Testing Library (enhet/komponent) og Playwright (E2E mot stubbet nettverk, se [Teststrategi](./architecture.md#teststrategi)) |
| Verktøykjede | Node LTS pinnet, npm, Tailwind v4, `strict` TS + `noUncheckedIndexedAccess`, named exports |
| CI/Deploy | GitHub Actions (lint/enhetstester/E2E/`npm audit`) → GitHub Pages (understi + 404-fallback, CSP som meta-tag) |
