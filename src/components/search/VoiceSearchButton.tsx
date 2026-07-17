import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

export interface VoiceSearchButtonProps {
  /** Kalles med teksten fra det endelige talegjenkjenningsresultatet. */
  onResult: (transcript: string) => void;
}

// Sirkulær 52px mikrofonknapp iht. skjerm 1 i design-spec-en (se
// docs/design-spec/README.md): samme outline-farge som søkeikonet.
const baseButtonClassName =
  "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
        className={`${baseButtonClassName} border-surface-border/50 text-text-muted/50 cursor-not-allowed`}
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
            ? "border-brand-magenta bg-brand-magenta/20 text-brand-magenta animate-pulse"
            : "border-surface-border bg-surface text-text-muted hover:text-text-primary"
        }`}
      >
        <MicIcon />
      </button>
      {error !== null && (
        <p role="alert" className="text-sm text-red-300">
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
