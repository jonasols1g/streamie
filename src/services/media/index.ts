import { LocalStorageCacheStore } from "../cache/LocalStorageCacheStore";
import { CachingMediaProvider } from "./CachingMediaProvider";
import type { MediaProvider } from "./MediaProvider";
import { CompositeMediaProvider } from "./providers/CompositeMediaProvider";
import { MotnMediaProvider } from "./providers/MotnMediaProvider";
import { OmdbMediaProvider } from "./providers/OmdbMediaProvider";

/**
 * Sammensetningsrot for `MediaProvider` (fase 10): `CompositeMediaProvider`
 * erstatter `MockMediaProvider` — resten av appen ser aldri forskjell, siden
 * alt går gjennom `MediaProvider`-interfacet (se docs/architecture.md).
 *
 * API-nøklene kommer fra `VITE_OMDB_API_KEY`/`VITE_MOTN_API_KEY` (se
 * `.env.example`). Vite krever `VITE_`-prefikset for at variabelen skal nå
 * klientbundelen — nøklene er dermed lesbare for sluttbruker, en akseptert
 * risiko for en ren klient-app uten backend (se
 * docs/architecture.md#kjente-forutsetninger-og-risikoer). Nøklene er ikke
 * satt ennå (venter på at bruker skaffer dem hos OMDb/MOTN) — providerne
 * kalles først når brukeren søker/åpner en detaljside, så en tom nøkkel
 * krasjer ikke appen ved oppstart, kun ved faktisk bruk (401/403 →
 * `MediaProviderError('unknown')`).
 */
const omdbProvider = new OmdbMediaProvider({
  apiKey: import.meta.env.VITE_OMDB_API_KEY,
});
const motnProvider = new MotnMediaProvider({
  apiKey: import.meta.env.VITE_MOTN_API_KEY,
  country: "no",
});

const realProvider: MediaProvider = new CompositeMediaProvider(
  omdbProvider,
  motnProvider,
);

export const mediaProvider: MediaProvider = new CachingMediaProvider(
  realProvider,
  new LocalStorageCacheStore(),
  { searchTtlMs: 48 * 60 * 60 * 1000, detailsTtlMs: 24 * 60 * 60 * 1000 },
);
