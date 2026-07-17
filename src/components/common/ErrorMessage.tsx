import type { MediaProviderErrorCode } from "../../services/media/MediaProvider";

/**
 * Faste, brukervennlige tekster per `MediaProviderError.code` (se
 * docs/design.md#feilmeldinger). Tekniske detaljer logges til konsollen der
 * feilen oppstår — aldri vist til bruker her.
 */
const ERROR_MESSAGES: Record<MediaProviderErrorCode, string> = {
  network: "Kunne ikke kontakte tjenesten — sjekk nettverket og prøv igjen",
  "rate-limit": "For mange forespørsler — vent litt og prøv igjen",
  "not-found": "Fant ikke tittelen",
  "invalid-response": "Noe gikk galt — prøv igjen",
  unknown: "Noe gikk galt — prøv igjen",
};

// Alle feiltilstander som kan gjentas viser en «prøv igjen»-handling.
// "not-found" er unntaket: å gjenta akkurat det samme oppslaget endrer ikke
// utfallet.
const RETRYABLE_CODES: ReadonlySet<MediaProviderErrorCode> = new Set([
  "network",
  "rate-limit",
  "invalid-response",
  "unknown",
]);

export interface ErrorMessageProps {
  code: MediaProviderErrorCode;
  onRetry?: () => void;
}

export function ErrorMessage({ code, onRetry }: ErrorMessageProps) {
  const showRetry = onRetry !== undefined && RETRYABLE_CODES.has(code);

  return (
    <div
      role="alert"
      className="border-accent/40 bg-accent/10 flex flex-col items-center gap-3 rounded-2xl border px-4 py-6 text-center text-red-200"
    >
      <p>{ERROR_MESSAGES[code]}</p>
      {showRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-accent rounded-xl px-4 py-2 font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Prøv igjen
        </button>
      )}
    </div>
  );
}
