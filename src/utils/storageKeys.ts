/**
 * Versjonerte localStorage-navnerom (se «Cache-design» i docs/architecture.md).
 *
 * Policyen er ulik for de to navnerommene:
 * - Cache-navnerommet kan bumpes fritt ved datamodell-endring — innholdet er
 *   bare cache og kan alltid hentes på nytt.
 * - Data-navnerommet inneholder brukerdata (watchlisten); å bumpe den versjonen
 *   sletter watchlisten og gjøres kun som en bevisst éngangsbeslutning
 *   (planlagt ved byttet til ekte API i fase 10) — aldri som rutinemessig
 *   invalidering.
 */
export const CACHE_KEY_PREFIX = "watchlist:v1:cache:";
// Bumpet fra v1 til v2 i fase 10 (bytte fra MockMediaProvider til
// CompositeMediaProvider): `mediaId` var `mock-movie-1` e.l. i fase 2–9 og
// matcher ingen IMDb-ID mot ekte data. Dette er en bevisst, engangs
// sletting av watchlisten — det bygges ingen migrasjonslogikk (se
// docs/architecture.md#kjente-forutsetninger-og-risikoer).
export const DATA_KEY_PREFIX = "watchlist:v2:data:";
