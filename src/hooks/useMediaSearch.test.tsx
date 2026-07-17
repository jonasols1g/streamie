import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaProviderProvider } from "../context/MediaProviderContext";
import {
  MediaProviderError,
  type MediaProvider,
} from "../services/media/MediaProvider";
import { createMediaSummary } from "../test/fixtures/media.fixtures";
import { createMockMediaProvider } from "../test/mocks/createMockMediaProvider";
import type { MediaSummary } from "../types/media";
import { useMediaSearch } from "./useMediaSearch";

function renderUseMediaSearch(provider: MediaProvider) {
  return renderHook(() => useMediaSearch(), {
    wrapper: ({ children }) => (
      <MediaProviderProvider provider={provider}>
        {children}
      </MediaProviderProvider>
    ),
  });
}

describe("useMediaSearch", () => {
  it("starter i idle uten resultater", () => {
    const provider = createMockMediaProvider();
    const { result } = renderUseMediaSearch(provider);

    expect(result.current.status).toBe("idle");
    expect(result.current.results).toEqual([]);
    expect(result.current.errorCode).toBeNull();
  });

  it("går via loading til success med resultater", async () => {
    const summary = createMediaSummary({ title: "The Matrix" });
    const provider = createMockMediaProvider({
      search: vi.fn<MediaProvider["search"]>().mockResolvedValue([summary]),
    });
    const { result } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("matrix");
    });

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.results).toEqual([summary]);
  });

  it("går til success med tom liste ved ingen treff", async () => {
    const provider = createMockMediaProvider({
      search: vi.fn<MediaProvider["search"]>().mockResolvedValue([]),
    });
    const { result } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("finnes-ikke");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.results).toEqual([]);
  });

  it("mapper MediaProviderError til feilkoden", async () => {
    const provider = createMockMediaProvider({
      search: vi
        .fn<MediaProvider["search"]>()
        .mockRejectedValue(new MediaProviderError("Bom", "rate-limit")),
    });
    const { result } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("matrix");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorCode).toBe("rate-limit");
    expect(result.current.results).toEqual([]);
  });

  it("mapper en uventet feil til 'unknown' og logger til konsollen", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {
        // stille under testen
      });
    const provider = createMockMediaProvider({
      search: vi
        .fn<MediaProvider["search"]>()
        .mockRejectedValue(new Error("uventet")),
    });
    const { result } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("matrix");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorCode).toBe("unknown");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("avbryter et pågående søk når et nytt submittes, og et sent svar fra det avbrutte kallet overskriver ikke state", async () => {
    let firstSignal: AbortSignal | undefined;
    let resolveFirst: ((value: MediaSummary[]) => void) | undefined;
    const firstResult = createMediaSummary({ id: "first", title: "Første" });
    const secondResult = createMediaSummary({ id: "second", title: "Andre" });

    const search = vi
      .fn<MediaProvider["search"]>()
      .mockImplementation((query, options) => {
        if (query === "first") {
          firstSignal = options?.signal;
          return new Promise<MediaSummary[]>((resolve) => {
            resolveFirst = resolve;
          });
        }
        return Promise.resolve([secondResult]);
      });
    const provider = createMockMediaProvider({ search });
    const { result } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("first");
    });

    act(() => {
      result.current.search("second");
    });

    expect(firstSignal?.aborted).toBe(true);

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.results).toEqual([secondResult]);

    act(() => {
      resolveFirst?.([firstResult]);
    });

    expect(result.current.results).toEqual([secondResult]);
  });

  it("avbryter pågående søk ved unmount", () => {
    let signal: AbortSignal | undefined;
    const search = vi
      .fn<MediaProvider["search"]>()
      .mockImplementation((_query, options) => {
        signal = options?.signal;
        return new Promise<MediaSummary[]>(() => {
          // løses aldri i denne testen
        });
      });
    const provider = createMockMediaProvider({ search });
    const { result, unmount } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("matrix");
    });

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("retry() gjentar det forrige søket", async () => {
    const summary = createMediaSummary({ title: "The Matrix" });
    const search = vi
      .fn<MediaProvider["search"]>()
      .mockResolvedValue([summary]);
    const provider = createMockMediaProvider({ search });
    const { result } = renderUseMediaSearch(provider);

    act(() => {
      result.current.search("matrix");
    });
    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(search).toHaveBeenCalledTimes(2);
    });
    expect(search).toHaveBeenNthCalledWith(2, "matrix", expect.anything());
  });
});
