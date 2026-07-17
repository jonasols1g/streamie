import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

export interface VoiceSearchButtonProps {
  /** Kalles med teksten fra det endelige talegjenkjenningsresultatet. */
  onResult: (transcript: string) => void;
}

const baseButtonClassName =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800";

/**
 * Mikrofonknapp for talesøk (se docs/design.md#søkeflyt-tekst-og-tale).
 * Talesøk og tekstsøk deler nøyaktig samme kodepath: begge ender i
 * `handleSearch(query)` på `HomePage`, som gis inn her som `onResult`.
 *
 * I nettlesere uten `SpeechRecognition`-støtte (typisk Firefox og Safari)
 * vises en deaktivert knapp med forklarende tekst — søkefeltet er upåvirket.
 */
export function VoiceSearchButton({ onResult }: VoiceSearchButtonProps) {
  const { isSupported, isListening, error, start, stop } = useSpeechRecognition(
    { onResult },
  );

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        aria-label="Talegjenkjenning støttes ikke i denne nettleseren"
        title="Talegjenkjenning støttes ikke i denne nettleseren"
        className={`${baseButtonClassName} cursor-not-allowed border border-slate-200 text-slate-400`}
      >
        <MicIcon />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (isListening) {
            stop();
          } else {
            start();
          }
        }}
        aria-label={
          isListening ? "Stopp talegjenkjenning" : "Start talegjenkjenning"
        }
        aria-pressed={isListening}
        className={`${baseButtonClassName} ${
          isListening
            ? "animate-pulse bg-red-600 text-white"
            : "bg-slate-800 text-white hover:bg-slate-900"
        }`}
      >
        <MicIcon />
      </button>
      {error !== null && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
