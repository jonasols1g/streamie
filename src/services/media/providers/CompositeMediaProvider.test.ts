import { describe, expect, it, vi, type Mock } from "vitest";
import {
  createMediaSummary,
  createMovieMedia,
} from "../../../test/fixtures/media.fixtures";
import { MediaProviderError } from "../MediaProvider";
import { CompositeMediaProvider } from "./CompositeMediaProvider";
import type { MotnMediaProvider } from "./MotnMediaProvider";
import type { OmdbMediaProvider } from "./OmdbMediaProvider";

function createFakeCatalog(
  searchMock: Mock,
  getDetailsMock: Mock,
): OmdbMediaProvider {
  return {
    id: "omdb",
    search: searchMock,
    getDetails: getDetailsMock,
  } as unknown as OmdbMediaProvider;
}

function createFakeStreaming(getStreamingMock: Mock): MotnMediaProvider {
  return {
    id: "motn",
    getStreaming: getStreamingMock,
  } as unknown as MotnMediaProvider;
}

describe("CompositeMediaProvider", () => {
  it("har id 'composite'", () => {
    const provider = new CompositeMediaProvider(
      createFakeCatalog(vi.fn(), vi.fn()),
      createFakeStreaming(vi.fn()),
    );
    expect(provider.id).toBe("composite");
  });

  describe("search", () => {
    it("går kun til katalog-provideren (OMDb), rører ikke streaming-provideren", async () => {
      const searchMock = vi.fn().mockResolvedValue([createMediaSummary()]);
      const getStreamingMock = vi.fn();
      const provider = new CompositeMediaProvider(
        createFakeCatalog(searchMock, vi.fn()),
        createFakeStreaming(getStreamingMock),
      );

      const results = await provider.search("matrix");

      expect(results).toEqual([createMediaSummary()]);
      expect(searchMock).toHaveBeenCalledWith("matrix", undefined);
      expect(getStreamingMock).not.toHaveBeenCalled();
    });
  });

  describe("getDetails", () => {
    it("kaller katalog og streaming parallelt og setter streaming-feltet fra MOTN", async () => {
      const media = createMovieMedia({ streaming: null });
      const streamingAvailability = {
        region: "NO",
        offers: [],
        lastUpdated: "2026-07-01T00:00:00.000Z",
      };
      const getDetailsMock = vi.fn().mockResolvedValue(media);
      const getStreamingMock = vi.fn().mockResolvedValue(streamingAvailability);
      const provider = new CompositeMediaProvider(
        createFakeCatalog(vi.fn(), getDetailsMock),
        createFakeStreaming(getStreamingMock),
      );

      const result = await provider.getDetails("tt0133093");

      expect(result).toEqual({ ...media, streaming: streamingAvailability });
      expect(getDetailsMock).toHaveBeenCalledWith("tt0133093", undefined);
      expect(getStreamingMock).toHaveBeenCalledWith("tt0133093", undefined);
    });

    it("degraderer en MOTN-feil til streaming: null i stedet for å kaste", async () => {
      const media = createMovieMedia({ streaming: null });
      const getDetailsMock = vi.fn().mockResolvedValue(media);
      const getStreamingMock = vi
        .fn()
        .mockRejectedValue(new MediaProviderError("MOTN feilet", "unknown"));
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {
          // stille under testen
        });
      const provider = new CompositeMediaProvider(
        createFakeCatalog(vi.fn(), getDetailsMock),
        createFakeStreaming(getStreamingMock),
      );

      const result = await provider.getDetails("tt0133093");

      expect(result.streaming).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("degraderer en MOTN 404 (streaming: null fra provideren) uendret", async () => {
      const media = createMovieMedia({ streaming: null });
      const getDetailsMock = vi.fn().mockResolvedValue(media);
      const getStreamingMock = vi.fn().mockResolvedValue(null);
      const provider = new CompositeMediaProvider(
        createFakeCatalog(vi.fn(), getDetailsMock),
        createFakeStreaming(getStreamingMock),
      );

      const result = await provider.getDetails("tt0133093");

      expect(result.streaming).toBeNull();
    });

    it("lar en katalog-feil (OMDb) avvise hele oppslaget", async () => {
      const getDetailsMock = vi
        .fn()
        .mockRejectedValue(new MediaProviderError("Fant ikke", "not-found"));
      const provider = new CompositeMediaProvider(
        createFakeCatalog(vi.fn(), getDetailsMock),
        createFakeStreaming(vi.fn().mockResolvedValue(null)),
      );

      await expect(provider.getDetails("tt9999999")).rejects.toMatchObject({
        code: "not-found",
      });
    });

    it("videresender options (bl.a. AbortSignal) til begge providerne", async () => {
      const getDetailsMock = vi.fn().mockResolvedValue(createMovieMedia());
      const getStreamingMock = vi.fn().mockResolvedValue(null);
      const provider = new CompositeMediaProvider(
        createFakeCatalog(vi.fn(), getDetailsMock),
        createFakeStreaming(getStreamingMock),
      );
      const controller = new AbortController();

      await provider.getDetails("tt0133093", { signal: controller.signal });

      expect(getDetailsMock).toHaveBeenCalledWith("tt0133093", {
        signal: controller.signal,
      });
      expect(getStreamingMock).toHaveBeenCalledWith("tt0133093", {
        signal: controller.signal,
      });
    });
  });
});
