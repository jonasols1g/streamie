import { MediaProviderError } from "../MediaProvider";

/**
 * Delt fetch-/feilhåndtering for `OmdbMediaProvider` og `MotnMediaProvider`
 * (se docs/architecture.md#omdb-mapping--kjente-fallgruver og
 * docs/dev-tasks.md fase 10): nettverksfeil → `network`, 401/403 →
 * `unknown` (feilkonfigurert nøkkel, logges tydelig), 429 → `rate-limit`,
 * uventet svarform → `invalid-response`. `AbortError` propageres uendret
 * slik at `useMediaSearch`/`useMediaDetails` sin egen
 * `signal.aborted`-sjekk fortsatt fungerer.
 */

export async function performFetch(
  url: string,
  init: RequestInit,
  sourceLabel: string,
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new MediaProviderError(
      `Nettverksfeil ved kall mot ${sourceLabel}`,
      "network",
      error,
    );
  }
}

/** Kaster en `MediaProviderError` for en ikke-ok HTTP-status. Kaller aldri returnerer normalt. */
export function throwForStatus(response: Response, sourceLabel: string): never {
  if (response.status === 401 || response.status === 403) {
    console.error(
      `[${sourceLabel}] Avvist av API-et (status ${String(response.status)}) — sjekk at API-nøkkelen er satt korrekt`,
    );
    throw new MediaProviderError(
      `${sourceLabel}: feilkonfigurert API-nøkkel`,
      "unknown",
    );
  }
  if (response.status === 429) {
    throw new MediaProviderError(
      `${sourceLabel}: for mange forespørsler`,
      "rate-limit",
    );
  }
  throw new MediaProviderError(
    `${sourceLabel}: uventet feil (status ${String(response.status)})`,
    "unknown",
  );
}

export async function parseJson(
  response: Response,
  sourceLabel: string,
): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new MediaProviderError(
      `${sourceLabel}: uventet svarformat`,
      "invalid-response",
      error,
    );
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
