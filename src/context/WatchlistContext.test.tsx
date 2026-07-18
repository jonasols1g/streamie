import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WatchlistStorage } from "../services/storage/WatchlistRemoteStorage";
import { createMediaSummary } from "../test/fixtures/media.fixtures";
import { createWatchlistItem } from "../test/fixtures/watchlist.fixtures";
import { createMockWatchlistStorage } from "../test/mocks/createMockWatchlistStorage";
import { WatchlistProvider, useWatchlist } from "./WatchlistContext";

/**
 * `userId={null}` — Firestore-synk er bevisst utenfor bildet i disse
 * hjelperne (dekkes av «Firestore-hydrering»- og «skriving mot
 * Firestore»-suitene under). `WatchlistContext` hopper over enhver
 * `WatchlistStorage`-bruk når `userId` er `null` (se
 * `WatchlistContext.tsx`), så disse testene isolerer ren
 * `localStorage`-atferd, uendret siden før DB-migreringen.
 */
function wrapper({ children }: { children: ReactNode }) {
  return (
    <WatchlistProvider storage={createMockWatchlistStorage()} userId={null}>
      {children}
    </WatchlistProvider>
  );
}

/** Deferred promise — gir kontroll over nøyaktig når en mock-storage-promise løses, for å teste `isLoading`-overganger. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function wrapperWithStorage(storage: WatchlistStorage, userId: string | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <WatchlistProvider storage={storage} userId={userId}>
        {children}
      </WatchlistProvider>
    );
  };
}

/**
 * `Storage`-stubbe med en total byte-kvote akkurat stor nok for en tom
 * watchlist (`"[]"`), men ikke mer — simulerer en enhet der lagringsplassen
 * er full uten noen cache-entries å rydde. `detectLocalStorage`s
 * probe-skriving (en annen, kortlevd nøkkel) påvirkes ikke, siden den
 * fjernes igjen umiddelbart.
 */
function createNearFullWatchlistStorage(): Storage {
  const entries = new Map<string, string>();
  const maxTotalLength = "[]".length;

  function totalLength(): number {
    let total = 0;
    for (const value of entries.values()) {
      total += value.length;
    }
    return total;
  }

  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      const previousLength = entries.get(key)?.length ?? 0;
      const projectedTotal = totalLength() - previousLength + value.length;
      if (projectedTotal > maxTotalLength) {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => {
      entries.clear();
    },
  };
}

describe("WatchlistContext — lokal skriveputt (userId null)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("starter tom når ingenting er lagret", () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });
    expect(result.current.items).toEqual([]);
  });

  it("kaster en tydelig feil når hooken brukes utenfor en provider", () => {
    expect(() => renderHook(() => useWatchlist())).toThrow(
      "useWatchlist må brukes innenfor en WatchlistProvider",
    );
  });

  it("addToWatchlist legger til tittelen som 'planned'", () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });
    const media = createMediaSummary({ id: "mock-movie-1" });

    act(() => {
      result.current.addToWatchlist(media);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      mediaId: "mock-movie-1",
      media,
      status: "planned",
    });
    expect(result.current.isInWatchlist("mock-movie-1")).toBe(true);
    expect(result.current.getStatus("mock-movie-1")).toBe("planned");
  });

  it("addToWatchlist er idempotent — legger ikke til samme tittel to ganger", () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });
    const media = createMediaSummary({ id: "mock-movie-1" });

    act(() => {
      result.current.addToWatchlist(media);
      result.current.addToWatchlist(media);
    });

    expect(result.current.items).toHaveLength(1);
  });

  it("setStatus bytter status og setter watchedAt kun ved 'watched'", () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });
    const media = createMediaSummary({ id: "mock-movie-1" });

    act(() => {
      result.current.addToWatchlist(media);
    });
    act(() => {
      result.current.setStatus("mock-movie-1", "watched");
    });

    expect(result.current.getStatus("mock-movie-1")).toBe("watched");
    expect(result.current.items[0]?.watchedAt).toBeDefined();

    act(() => {
      result.current.setStatus("mock-movie-1", "planned");
    });

    expect(result.current.getStatus("mock-movie-1")).toBe("planned");
    expect(result.current.items[0]?.watchedAt).toBeUndefined();
  });

  it("removeFromWatchlist fjerner tittelen", () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });
    const media = createMediaSummary({ id: "mock-movie-1" });

    act(() => {
      result.current.addToWatchlist(media);
    });
    act(() => {
      result.current.removeFromWatchlist("mock-movie-1");
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.isInWatchlist("mock-movie-1")).toBe(false);
  });

  it("persisterer endringer til localStorage — en ny provider-instans leser dem tilbake", () => {
    const media = createMediaSummary({ id: "mock-movie-1" });
    const { result, unmount } = renderHook(() => useWatchlist(), { wrapper });

    act(() => {
      result.current.addToWatchlist(media);
    });
    unmount();

    const { result: reloaded } = renderHook(() => useWatchlist(), {
      wrapper,
    });
    expect(reloaded.current.items).toHaveLength(1);
    expect(reloaded.current.items[0]?.mediaId).toBe("mock-movie-1");
  });

  it("kaller aldri WatchlistStorage når userId er null", () => {
    const load = vi.fn().mockResolvedValue([]);
    const upsert = vi.fn().mockResolvedValue(undefined);
    const storage = createMockWatchlistStorage({ load, upsert });
    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, null),
    });

    act(() => {
      result.current.addToWatchlist(createMediaSummary({ id: "mock-movie-1" }));
    });

    expect(load).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("WatchlistContext — lagringsfeil (lokal)", () => {
  // `watchlistStorage` detekterer `localStorage` kun én gang og cacher den
  // (se watchlistStorage.ts) — stubben må derfor være på plass *før*
  // `WatchlistContext` (og dermed `watchlistStorage`) importeres på nytt via
  // `vi.resetModules()`, ellers gjenbrukes en tidligere tests cachede
  // instans.
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    localStorage.clear();
  });

  it("setter saveError når lagring feiler selv etter cache-opprydding, og kan avvises", async () => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createNearFullWatchlistStorage());
    const {
      WatchlistProvider: FreshWatchlistProvider,
      useWatchlist: useFreshWatchlist,
    } = await import("./WatchlistContext");
    const { createMockWatchlistStorage: createFreshMockStorage } =
      await import("../test/mocks/createMockWatchlistStorage");

    function freshWrapper({ children }: { children: ReactNode }) {
      return (
        <FreshWatchlistProvider
          storage={createFreshMockStorage()}
          userId={null}
        >
          {children}
        </FreshWatchlistProvider>
      );
    }

    const { result } = renderHook(() => useFreshWatchlist(), {
      wrapper: freshWrapper,
    });

    expect(result.current.saveError).toBe(false);

    act(() => {
      result.current.addToWatchlist(createMediaSummary({ id: "mock-movie-1" }));
    });

    expect(result.current.saveError).toBe(true);

    act(() => {
      result.current.dismissSaveError();
    });

    expect(result.current.saveError).toBe(false);
  });
});

describe("WatchlistContext — Firestore-hydrering", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("isLoading er true inntil den første Firestore-hentingen er fullført, og items erstattes med det hentede resultatet", async () => {
    const deferred = createDeferred<ReturnType<typeof createWatchlistItem>[]>();
    // Navngitt lokal variabel (ikke `storage.load`) — asserte på en
    // egen-bundet `vi.fn()`-referanse direkte unngår
    // `@typescript-eslint/unbound-method`, samme mønster som
    // `createMockMediaProvider`-baserte tester (se f.eks.
    // `hooks/useMediaSearch.test.tsx`).
    const load = vi.fn().mockReturnValue(deferred.promise);
    const storage = createMockWatchlistStorage({ load });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });

    expect(result.current.isLoading).toBe(true);
    expect(load).toHaveBeenCalledWith("user-1");

    const remoteItem = createWatchlistItem({ mediaId: "remote-1" });
    await act(async () => {
      deferred.resolve([remoteItem]);
      await deferred.promise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([remoteItem]);
  });

  it("isLoading blir false selv om den første hentingen feiler, og setter saveError", async () => {
    const load = vi.fn().mockRejectedValue(new Error("nettverksfeil"));
    const storage = createMockWatchlistStorage({ load });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.saveError).toBe(true);

    errorSpy.mockRestore();
  });

  it("henter på nytt ved 'online'-hendelsen, uten å sette isLoading tilbake til true", async () => {
    const load = vi.fn().mockResolvedValue([]);
    const storage = createMockWatchlistStorage({ load });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(load).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(result.current.isLoading).toBe(false);
  });
});

describe("WatchlistContext — skriving mot Firestore (userId satt)", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("addToWatchlist kaller storage.upsert med riktig userId/element", async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    const storage = createMockWatchlistStorage({ upsert });
    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const media = createMediaSummary({ id: "mock-movie-1" });
    act(() => {
      result.current.addToWatchlist(media);
    });

    await waitFor(() =>
      expect(upsert).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ mediaId: "mock-movie-1", status: "planned" }),
      ),
    );
  });

  it("removeFromWatchlist kaller storage.remove med riktig userId/mediaId", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const storage = createMockWatchlistStorage({ remove });
    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addToWatchlist(createMediaSummary({ id: "mock-movie-1" }));
    });
    act(() => {
      result.current.removeFromWatchlist("mock-movie-1");
    });

    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith("user-1", "mock-movie-1"),
    );
  });

  it("setStatus kaller storage.updateStatus med watchedAt ved 'watched', og uten ved tilbakebytte til 'planned'", async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const storage = createMockWatchlistStorage({ updateStatus });
    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addToWatchlist(createMediaSummary({ id: "mock-movie-1" }));
    });
    act(() => {
      result.current.setStatus("mock-movie-1", "watched");
    });

    await waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith(
        "user-1",
        "mock-movie-1",
        "watched",
        expect.any(String),
      ),
    );

    act(() => {
      result.current.setStatus("mock-movie-1", "planned");
    });

    await waitFor(() =>
      expect(updateStatus).toHaveBeenLastCalledWith(
        "user-1",
        "mock-movie-1",
        "planned",
        undefined,
      ),
    );
  });

  it("ruller tilbake tilstanden (og localStorage) og setter saveError når Firestore-skrivingen feiler", async () => {
    const upsert = vi.fn().mockRejectedValue(new Error("nettverksfeil"));
    const storage = createMockWatchlistStorage({ upsert });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: wrapperWithStorage(storage, "user-1"),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addToWatchlist(createMediaSummary({ id: "mock-movie-1" }));
    });

    // Optimistisk: elementet er der umiddelbart, før nettverkskallet feiler.
    expect(result.current.items).toHaveLength(1);

    await waitFor(() => expect(result.current.items).toHaveLength(0));
    expect(result.current.saveError).toBe(true);
    expect(result.current.isInWatchlist("mock-movie-1")).toBe(false);

    errorSpy.mockRestore();
  });
});
