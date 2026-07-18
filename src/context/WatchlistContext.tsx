import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WatchlistStorage } from "../services/storage/WatchlistRemoteStorage";
import {
  loadWatchlistFromStorage,
  saveWatchlistToStorage,
} from "../services/storage/watchlistStorage";
import type { MediaSummary } from "../types/media";
import type { WatchlistItem, WatchlistStatus } from "../types/watchlist";

export type WatchlistAction =
  | { type: "ADD"; item: WatchlistItem }
  | { type: "REMOVE"; mediaId: string }
  | { type: "SET_STATUS"; mediaId: string; status: WatchlistStatus };

export function watchlistReducer(
  state: WatchlistItem[],
  action: WatchlistAction,
): WatchlistItem[] {
  switch (action.type) {
    case "ADD":
      // Idempotent: en tittel som allerede er i watchlisten legges ikke til på nytt.
      if (state.some((item) => item.mediaId === action.item.mediaId)) {
        return state;
      }
      return [...state, action.item];

    case "REMOVE":
      return state.filter((item) => item.mediaId !== action.mediaId);

    case "SET_STATUS":
      return state.map((item) =>
        item.mediaId === action.mediaId
          ? {
              ...item,
              status: action.status,
              // watchedAt settes kun når status endres til "watched" (se
              // docs/data-model.md#typeswatchlistts); ved tilbakebytte til
              // "planned" fjernes den igjen fremfor å beholde en stale verdi.
              watchedAt:
                action.status === "watched"
                  ? new Date().toISOString()
                  : undefined,
            }
          : item,
      );

    default:
      return state;
  }
}

export interface WatchlistContextValue {
  items: WatchlistItem[];
  addToWatchlist: (media: MediaSummary) => void;
  removeFromWatchlist: (mediaId: string) => void;
  setStatus: (mediaId: string, status: WatchlistStatus) => void;
  isInWatchlist: (mediaId: string) => boolean;
  getStatus: (mediaId: string) => WatchlistStatus | null;
  /**
   * `true` under den *første* hentingen fra Firestore (se
   * docs/plans/watchlist-database-migrering.md#arkitektur) — ikke satt igjen
   * ved påfølgende bakgrunnsoppfriskninger (f.eks. `online`-gjenoppkobling).
   */
  isLoading: boolean;
  /**
   * `true` når siste lagringsforsøk feilet — enten mot `localStorage` (full
   * lagringsplass selv etter cache-opprydding) eller mot Firestore
   * (nettverksfeil), se docs/design.md#watchlist-ux.
   */
  saveError: boolean;
  dismissSaveError: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export interface WatchlistProviderProps {
  children: ReactNode;
  /**
   * `WatchlistStorage`-instansen som brukes som skriveputt mot en delt
   * database (Firestore i produksjon, en testdobbel i tester) — injisert
   * eksplisitt fremfor konsumert fra en nestet context, samme DI-mønster som
   * `MediaProviderProvider.provider` (se docs/architecture.md#state-
   * management), for å gjøre testdobler trivielle å bruke.
   */
  storage: WatchlistStorage;
  /**
   * IMDb-uavhengig bruker-ID fra `AuthContext` (anonym Firebase-sesjon).
   * `null` inntil den anonyme sesjonen er klar (eller ved en autentiserings-
   * feil) — writes går da kun til den lokale skriveputten (`localStorage`),
   * ingen Firestore-synk skjer før `userId` er satt (se v1-avgrensningen i
   * docs/plans/watchlist-database-migrering.md#arkitektur — ingen full
   * offline-synk-kø bygges).
   */
  userId: string | null;
}

/**
 * Global watchlist-state (se «State management» i docs/architecture.md):
 * React Context + lokal `items`-state, med optimistic update + write-through
 * mot to lag — synkront til `localStorage` (uendret, se
 * `services/storage/watchlistStorage.ts`) og asynkront til
 * `WatchlistStorage` (Firestore i produksjon, DB-migrering issue C).
 *
 * Mønster per handling (`applyAction`):
 * 1. `watchlistReducer` (ren funksjon, uendret siden før DB-migreringen)
 *    beregner neste tilstand og den settes umiddelbart (optimistic update).
 * 2. Neste tilstand skrives synkront til `localStorage`.
 * 3. Den tilsvarende operasjonen sendes asynkront til `storage`
 *    (`WatchlistStorage`). Feiler den, rulles både reducer-tilstanden og
 *    `localStorage` tilbake til forrige verdi, og `saveError` settes.
 *
 * `items` speiles i en ref (`itemsRef`) som oppdateres i samme steg som
 * state settes, slik at flere handlinger i rask rekkefølge alltid bygger
 * videre på det korrekte, akkumulerte resultatet (ikke en stale closure over
 * `items`).
 */
export function WatchlistProvider({
  children,
  storage,
  userId,
}: WatchlistProviderProps) {
  const [items, setItems] = useState<WatchlistItem[]>(loadWatchlistFromStorage);
  const itemsRef = useRef(items);

  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const hasHydratedOnceRef = useRef(false);

  const hydrate = useCallback(() => {
    if (userId === null) {
      return;
    }

    const isInitialHydration = !hasHydratedOnceRef.current;
    if (isInitialHydration) {
      setIsLoading(true);
    }

    storage
      .load(userId)
      .then((remoteItems) => {
        hasHydratedOnceRef.current = true;
        itemsRef.current = remoteItems;
        setItems(remoteItems);
        if (isInitialHydration) {
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error(
          "[watchlist] Kunne ikke hente watchlisten fra Firestore",
          error,
        );
        hasHydratedOnceRef.current = true;
        if (isInitialHydration) {
          setIsLoading(false);
        }
        setSaveError(true);
      });
  }, [storage, userId]);

  // Første henting (eller ny henting dersom userId/storage endres — i
  // praksis kun når den anonyme sesjonen blir klar).
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // v1-avgrensning (se docs/plans/watchlist-database-migrering.md#arkitektur):
  // ingen full offline-synk-kø, men en enkel gjenoppkoblings-retry — når
  // nettleseren melder at den er tilbake online, hentes watchlisten på nytt
  // fra Firestore (harmløst å gjøre selv om forrige henting lyktes).
  useEffect(() => {
    window.addEventListener("online", hydrate);
    return () => {
      window.removeEventListener("online", hydrate);
    };
  }, [hydrate]);

  const applyAction = useCallback(
    (
      action: WatchlistAction,
      syncToRemote: (uid: string, next: WatchlistItem[]) => Promise<void>,
    ) => {
      const previous = itemsRef.current;
      const next = watchlistReducer(previous, action);
      itemsRef.current = next;
      setItems(next);

      const savedLocally = saveWatchlistToStorage(next);
      setSaveError(!savedLocally);

      if (userId === null) {
        // Auth-sesjonen er ikke klar ennå (eller feilet) — se
        // `WatchlistProviderProps.userId`.
        return;
      }

      syncToRemote(userId, next).catch((error: unknown) => {
        console.error(
          "[watchlist] Kunne ikke lagre watchlist-endringen til Firestore — ruller tilbake",
          error,
        );
        itemsRef.current = previous;
        setItems(previous);
        saveWatchlistToStorage(previous);
        setSaveError(true);
      });
    },
    [userId],
  );

  const addToWatchlist = useCallback(
    (media: MediaSummary) => {
      const item: WatchlistItem = {
        mediaId: media.id,
        media,
        status: "planned",
        addedAt: new Date().toISOString(),
      };
      applyAction({ type: "ADD", item }, (uid) => storage.upsert(uid, item));
    },
    [applyAction, storage],
  );

  const removeFromWatchlist = useCallback(
    (mediaId: string) => {
      applyAction({ type: "REMOVE", mediaId }, (uid) =>
        storage.remove(uid, mediaId),
      );
    },
    [applyAction, storage],
  );

  const setStatus = useCallback(
    (mediaId: string, status: WatchlistStatus) => {
      applyAction({ type: "SET_STATUS", mediaId, status }, (uid, next) => {
        const watchedAt = next.find(
          (item) => item.mediaId === mediaId,
        )?.watchedAt;
        return storage.updateStatus(uid, mediaId, status, watchedAt);
      });
    },
    [applyAction, storage],
  );

  const isInWatchlist = useCallback(
    (mediaId: string) => items.some((item) => item.mediaId === mediaId),
    [items],
  );

  const getStatus = useCallback(
    (mediaId: string) =>
      items.find((item) => item.mediaId === mediaId)?.status ?? null,
    [items],
  );

  const dismissSaveError = useCallback(() => {
    setSaveError(false);
  }, []);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      addToWatchlist,
      removeFromWatchlist,
      setStatus,
      isInWatchlist,
      getStatus,
      isLoading,
      saveError,
      dismissSaveError,
    }),
    [
      items,
      addToWatchlist,
      removeFromWatchlist,
      setStatus,
      isInWatchlist,
      getStatus,
      isLoading,
      saveError,
      dismissSaveError,
    ],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (context === null) {
    throw new Error("useWatchlist må brukes innenfor en WatchlistProvider");
  }
  return context;
}
