# Watchlist — instruksjoner for hovedsamtalen

100 % klient-side webapp (React + TypeScript + Vite, Tailwind, React Router) for film-/serieoppslag og personlig watchlist. All arkitektur og design er besluttet og dokumentert i `docs/` — les relevant dokument før beslutninger tas. `docs/dev-tasks.md` er faseplanen og fremdriften; dagslogg føres i `dev-log.md` i rota.

## Agent-arbeidsflyt (én fase = én PR = én squash-commit på `main`)

Fasene implementeres av subagent-teamet i `.claude/agents/`. Hovedsamtalen orkestrerer og er den eneste som merger. **Kun én agent berører repoet om gangen**, og mellom agentkjøringer skal arbeidskatalogen stå på `main` — agentene er instruert til å bytte tilbake selv.

1. **Planlegging (kun nye features):** `feature-planner` vurderer idéen mot docs og leverer faseplan. Faser som allerede står i `dev-tasks.md` trenger ikke planlegging.
2. **Implementasjon:** spawn `dev` med fasen/oppgaven. Dev jobber på `feat/fase-N-kortnavn`, åpner PR mot `main` og rapporterer branch + PR-nummer.
3. **Review:** spawn `reviewer` med PR-nummeret. Reviewer sjekker CI-status (`gh pr checks`) og diffen mot DoD og docs, og konkluderer alltid med en PR-kommentar (`**Review: godkjent**` eller `**Review: endringer kreves**`).
4. **Review-runder:** ved funn, send funnene til **samme** dev-agent via SendMessage — ikke ny spawn; konteksten om implementasjonsvalgene skal beholdes. Ny review-runde går tilsvarende via SendMessage til samme reviewer. Er dev og reviewer fortsatt uenige om samme funn etter to runder, avgjør hovedsamtalen saken (eventuelt med brukeren) i stedet for å kjøre flere runder.
5. **Verifisering:** etter godkjent review, spawn `verifier` med PR-nummeret. Verifier bekrefter grønn CI (som beviser lint/enhetstester/E2E/bygg) og driver fasens berørte flyt manuelt mot produksjonsbygget. Feiler noe: tilbake til steg 4.
6. **Merge og etterarbeid:** ved verifisert grønt squash-merger hovedsamtalen med `gh pr merge <nr> --squash --delete-branch`. Deretter oppdaterer hovedsamtalen `docs/dev-tasks.md` (avhuking + fremdriftstabell) og `dev-log.md`, og committer det direkte på `main`.

## Rammer som gjelder alt arbeid

- Dokumentasjonen i `docs/` er fasit; avvik er feil, og utdatert dokumentasjon rapporteres i stedet for at det improviseres rundt den.
- All datatilgang går gjennom `MediaProvider`-interfacet; fase 1–9 bygger mot `MockMediaProvider`.
- Ingen ekte API-kall før fase 10 — MOTN-kvoten er 100 kall/døgn. Playwright E2E kjører alltid mot stubbet nettverk og produksjonsbygg.
