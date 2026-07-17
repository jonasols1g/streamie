import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaProviderProvider } from "../context/MediaProviderContext";
import {
  MediaProviderError,
  type MediaProvider,
} from "../services/media/MediaProvider";
import { createMovieMedia } from "../test/fixtures/media.fixtures";
import { createMockMediaProvider } from "../test/mocks/createMockMediaProvider";
import type { Media } from "../types/media";
import { useMediaDetails } from "./useMediaDetails";

function renderUseMediaDetails(
  provider: MediaProvider,
  id: string | undefined,
) {
  return renderHook(({ id: renderId }) => useMediaDetails(renderId), {
    initialProps: { id },
    wrapper: ({ children }) => (
      <MediaProviderProvider provider={provider}>
        {children}
      </MediaProviderProvider>
    ),
  });
}

describe("useMediaDetails", () => {
  it("henter detaljer automatisk ved mount og går til success", async () => {
    const media = createMovieMedia({ title: "The Matrix" });
    const getDetails = vi
      .fn<MediaProvider["getDetails"]>()
      .mockResolvedValue(media);
    const provider = createMockMediaProvider({ getDetails });

    const { result } = renderUseMediaDetails(provider, "mock-movie-1");

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.media).toEqual(media);
    expect(getDetails).toHaveBeenCalledWith(
      "mock-movie-1",
      expect.anything(),
    );
  });

  it("gjør ingenting når id er undefined", () => {
    const getDetails = vi.fn<MediaProvider["getDetails"]>();
    const provider = createMockMediaProvider({ getDetails });

    const { result } = renderUseMediaDetails(provider, undefined);

    expect(result.current.status).toBe("idle");
    expect(result.current.media).toBeNull();
    expect(getDetails).not.toHaveBeenCalled();
  });

  it("mapper MediaProviderError til feilkoden", async () => {
    const provider = createMockMediaProvider({
      getDetails: vi
        .fn<MediaProvider["getDetails"]>()
        .mockRejectedValue(new MediaProviderError("Fant ikke", "not-found")),
    });

    const { result } = renderUseMediaDetails(provider, "ukjent-id");

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorCode).toBe("not-found");
    expect(result.current.media).toBeNull();
  });

  it("mapper en uventet feil til 'unknown' og logger til konsollen", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {
        // stille under testen
      });
    const provider = createMockMediaProvider({
      getDetails: vi
        .fn<MediaProvider["getDetails"]>()
        .mockRejectedValue(new Error("uventet")),
    });

    const { result } = renderUseMediaDetails(provider, "mock-movie-1");

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorCode).toBe("unknown");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("henter på nytt når id endres", async () => {
    const first = createMovieMedia({ id: "mock-movie-1", title: "The Matrix" });
    const second = createMovieMedia({ id: "mock-movie-2", title: "Solaris" });
    const getDetails = vi
      .fn<MediaProvider["getDetails"]>()
      .mockImplementation((id) =>
        Promise.resolve(id === "mock-movie-1" ? first : second),
      );
    const provider = createMockMediaProvider({ getDetails });

    const { result, rerender } = renderUseMediaDetails(
      provider,
      "mock-movie-1",
    );

    await waitFor(() => {
      expect(result.current.media).toEqual(first);
    });

    rerender({ id: "mock-movie-2" });

    await waitFor(() => {
      expect(result.current.media).toEqual(second);
    });
    expect(getDetails).toHaveBeenCalledTimes(2);
  });

  it("avbryter pågående kall ved unmount", () => {
    let signal: AbortSignal | undefined;
    const getDetails = vi
      .fn<MediaProvider["getDetails"]>()
      .mockImplementation((_id, options) => {
        signal = options?.signal;
        return new Promise<Media>(() => {
          // løses aldri i denne testen
        });
      });
    const provider = createMockMediaProvider({ getDetails });

    const { unmount } = renderUseMediaDetails(provider, "mock-movie-1");

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("retry() gjentar oppslaget for gjeldende id", async () => {
    const media = createMovieMedia();
    const getDetails = vi
      .fn<MediaProvider["getDetails"]>()
      .mockResolvedValue(media);
    const provider = createMockMediaProvider({ getDetails });

    const { result } = renderUseMediaDetails(provider, "mock-movie-1");

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(getDetails).toHaveBeenCalledTimes(2);
    });
    expect(getDetails).toHaveBeenNthCalledWith(
      2,
      "mock-movie-1",
      expect.anything(),
    );
  });
});
