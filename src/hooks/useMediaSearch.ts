import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaProvider } from "../context/MediaProviderContext";
import {
  MediaProviderError,
  type MediaProviderErrorCode,
} from "../services/media/MediaProvider";
import type { MediaSummary } from "../types/media";

export type MediaSearchStatus = "idle" | "loading" | "success" | "error";

export interface UseMediaSearchResult {
  status: MediaSearchStatus;
  results: MediaSummary[];
  errorCode: MediaProviderErrorCode | null;
  /** Utfører et nytt søk. Avbryter et eventuelt pågående søk først. */
  search: (query: string) => void;
  /** Gjentar det forrige søket (brukes av «prøv igjen»-handlingen). */
  retry: () => void;
}

/**
 * Søk trigges kun eksplisitt (se docs/design.md#søkeflyt-tekst-og-tale) — denne
 * hooken eier ikke inputfeltet, kun selve søket. Et nytt `search()`-kall
 * avbryter et pågående kall via `AbortSignal`, slik at et utdatert svar aldri
 * kan overskrive et nyere. Samme opprydding skjer ved unmount.
 */
export function useMediaSearch(): UseMediaSearchResult {
  const provider = useMediaProvider();
  const [status, setStatus] = useState<MediaSearchStatus>("idle");
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [errorCode, setErrorCode] = useState<MediaProviderErrorCode | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");

  const search = useCallback(
    (query: string) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      lastQueryRef.current = query;

      setStatus("loading");
      setErrorCode(null);

      provider
        .search(query, { signal: controller.signal })
        .then((found) => {
          if (controller.signal.aborted) return;
          setResults(found);
          setStatus("success");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setStatus("error");
          if (error instanceof MediaProviderError) {
            setErrorCode(error.code);
          } else {
            console.error("Uventet feil under søk", error);
            setErrorCode("unknown");
          }
        });
    },
    [provider],
  );

  const retry = useCallback(() => {
    search(lastQueryRef.current);
  }, [search]);

  // Avbryt et eventuelt pågående kall ved unmount, slik at et svar som
  // kommer etter at komponenten er borte aldri kan sette state på et
  // umontert tre.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { status, results, errorCode, search, retry };
}
