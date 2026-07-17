import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API sitt `SpeechRecognition` (og det prefiksede
 * `webkitSpeechRecognition` i Chrome/Edge) er ikke en del av TypeScripts
 * DOM-lib — kun de tilhørende event-/resultat-typene er det (se
 * `lib.dom.d.ts`). Vi deklarerer derfor selve konstruktøren og
 * `Window`-utvidelsen lokalt.
 */
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Engelske titler («the lord of the rings») treffer riktig, og
 * OMDb-katalogen er uansett engelskspråklig — se
 * docs/design.md#søkeflyt-tekst-og-tale. Norske søkefraser støttes ikke via
 * tale; da brukes tekstsøk.
 */
const RECOGNITION_LANG = "en-US";

const ERROR_MESSAGES: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  "not-allowed": "Mikrofontilgang ble avvist",
  "no-speech": "Ingen tale oppdaget",
  "audio-capture": "Fant ingen mikrofon",
  network: "Nettverksfeil under talegjenkjenning",
};

const DEFAULT_ERROR_MESSAGE = "Talegjenkjenning feilet — prøv igjen";

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionOptions {
  /** Kalles med teksten fra kun det endelige (`isFinal`) resultatet. */
  onResult: (transcript: string) => void;
}

export interface UseSpeechRecognitionResult {
  /** `false` når verken `SpeechRecognition` eller `webkitSpeechRecognition` finnes. */
  isSupported: boolean;
  isListening: boolean;
  /** Brukervennlig, ikke-blokkerende feilmelding — `null` når det ikke er noen feil. */
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Tale-til-tekst via Web Speech API. Feature-detekterer
 * `SpeechRecognition`/`webkitSpeechRecognition` (Chrome/Edge); i nettlesere
 * uten støtte (typisk Firefox og Safari) er `isSupported` `false` og
 * `start`/`stop` er no-op. Kun `isFinal`-resultatet sendes videre til
 * `onResult` — se docs/design.md#søkeflyt-tekst-og-tale.
 */
export function useSpeechRecognition({
  onResult,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
  const isSupported = SpeechRecognitionCtor !== null;

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // `onResult` holdes i en ref slik at `start` ikke må gjenskapes (og dermed
  // referanselikheten til den returnerte funksjonen brytes) hver gang
  // den kallende komponenten rendres på nytt med en ny inline-funksjon.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const start = useCallback(() => {
    if (SpeechRecognitionCtor === null) return;
    if (recognitionRef.current !== null) return; // lytter allerede

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = RECOGNITION_LANG;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result === undefined || !result.isFinal) return;
      const transcript = result[0]?.transcript.trim();
      if (transcript !== undefined && transcript !== "") {
        onResultRef.current(transcript);
      }
    };

    recognition.onerror = (event) => {
      // "aborted" skjer når vi selv kaller stop()/abort() — ikke en feil
      // brukeren trenger å se.
      if (event.error === "aborted") return;
      setError(ERROR_MESSAGES[event.error] ?? DEFAULT_ERROR_MESSAGE);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    recognition.start();
  }, [SpeechRecognitionCtor]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Avbryt en pågående lytting ved unmount, slik at den ikke fortsetter i
  // bakgrunnen (og potensielt kaller onResult) etter at komponenten er borte.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening, error, start, stop };
}
