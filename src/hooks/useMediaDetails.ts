import { useCallback, useEffect, useState } from "react";
import { useMediaProvider } from "../context/MediaProviderContext";
import {
  MediaProviderError,
  type MediaProviderErrorCode,
} from "../services/media/MediaProvider";
import type { Media } from "../types/media";

export type MediaDetailsStatus = "idle" | "loading" | "success" | "error";

export interface UseMediaDetailsResult {
  status: MediaDetailsStatus;
  media: Media | null;
  errorCode: MediaProviderErrorCode | null;
  /** Gjentar oppslaget for gjeldende `id` (brukes av «prøv igjen»-handlingen). */
  retry: () => void;
}

function initialStatus(id: string | undefined): MediaDetailsStatus {
  return id === undefined ? "idle" : "loading";
}

/**
 * Henter detaljer for `id` automatisk ved mount og hver gang `id` endres
 * (i motsetning til `useMediaSearch`, som kun henter ved eksplisitt
 * `search()`-kall — detaljsiden har allerede ID-en fra URL-en, se
 * docs/architecture.md#routing). Et nytt oppslag avbryter et pågående via
 * `AbortSignal`, slik at et utdatert svar aldri kan overskrive et nyere.
 * Samme opprydding skjer ved unmount.
 */
export function useMediaDetails(
  id: string | undefined,
): UseMediaDetailsResult {
  const provider = useMediaProvider();

  // `attempt` økes av `retry()` for å tvinge frem et nytt oppslag for samme
  // id — effekten under er avhengig av den, i tillegg til `id`.
  const [attempt, setAttempt] = useState(0);

  const [status, setStatus] = useState<MediaDetailsStatus>(() =>
    initialStatus(id),
  );
  const [media, setMedia] = useState<Media | null>(null);
  const [errorCode, setErrorCode] = useState<MediaProviderErrorCode | null>(
    null,
  );

  // Sporer hvilken `id` tilstanden over gjelder for. Endrer `id` seg (ny
  // rute) må status/media/errorCode nullstilles *synkront under selve
  // renderingen* — ikke i en effekt, se React sin anbefalte teknikk for å
  // justere state når en prop endres:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes
  const [seenId, setSeenId] = useState(id);
  if (id !== seenId) {
    setSeenId(id);
    setStatus(initialStatus(id));
    setMedia(null);
    setErrorCode(null);
  }

  useEffect(() => {
    if (id === undefined) {
      return;
    }

    const controller = new AbortController();

    provider
      .getDetails(id, { signal: controller.signal })
      .then((found) => {
        if (controller.signal.aborted) return;
        setMedia(found);
        setStatus("success");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMedia(null);
        setStatus("error");
        if (error instanceof MediaProviderError) {
          setErrorCode(error.code);
        } else {
          console.error("Uventet feil ved henting av detaljer", error);
          setErrorCode("unknown");
        }
      });

    return () => {
      controller.abort();
    };
  }, [provider, id, attempt]);

  const retry = useCallback(() => {
    setStatus(initialStatus(id));
    setMedia(null);
    setErrorCode(null);
    setAttempt((count) => count + 1);
  }, [id]);

  return { status, media, errorCode, retry };
}
