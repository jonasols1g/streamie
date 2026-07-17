import { vi } from "vitest";

/**
 * Testdobbel for Web Speech API sitt `SpeechRecognition` (se
 * `hooks/useSpeechRecognition.ts`). jsdom implementerer ikke denne
 * eksperimentelle API-en i det hele tatt, så `window.SpeechRecognition`
 * finnes ikke i testmiljøet i utgangspunktet — det er nettopp det som lar
 * oss teste "ikke støttet"-tilstanden uten noe oppsett. For
 * "støttet"-tilstanden installerer testene denne fake-konstruktøren.
 */
export class FakeSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

/**
 * Installerer en fake `window.SpeechRecognition` og returnerer arrayet av
 * instanser som opprettes (i praksis kun én om gangen, siden
 * `useSpeechRecognition` ikke gjenoppretter mens den allerede lytter).
 * Rydd opp med `uninstallFakeSpeechRecognition()` etter testen.
 */
export function installFakeSpeechRecognition(): FakeSpeechRecognition[] {
  const instances: FakeSpeechRecognition[] = [];
  class TrackedFakeSpeechRecognition extends FakeSpeechRecognition {
    constructor() {
      super();
      instances.push(this);
    }
  }
  window.SpeechRecognition =
    TrackedFakeSpeechRecognition as unknown as typeof window.SpeechRecognition;
  return instances;
}

export function uninstallFakeSpeechRecognition() {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
}

/** Bygger et minimalt `SpeechRecognitionEvent`-lignende objekt for ett resultat. */
export function createSpeechResultEvent(
  transcript: string,
  isFinal: boolean,
): SpeechRecognitionEvent {
  const alternative = {
    transcript,
    confidence: 1,
  } as SpeechRecognitionAlternative;
  const result = {
    isFinal,
    length: 1,
    item: () => alternative,
    0: alternative,
  } as unknown as SpeechRecognitionResult;
  const results = {
    length: 1,
    item: () => result,
    0: result,
  } as unknown as SpeechRecognitionResultList;
  return { resultIndex: 0, results } as SpeechRecognitionEvent;
}

/** Bygger et minimalt `SpeechRecognitionErrorEvent`-lignende objekt. */
export function createSpeechErrorEvent(
  error: SpeechRecognitionErrorCode,
): SpeechRecognitionErrorEvent {
  return { error, message: "" } as SpeechRecognitionErrorEvent;
}
