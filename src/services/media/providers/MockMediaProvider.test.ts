import { describe, expect, it } from "vitest";
import { MediaProviderError } from "../MediaProvider";
import { MockMediaProvider } from "./MockMediaProvider";

describe("MockMediaProvider", () => {
  const provider = new MockMediaProvider();

  it("has provider id 'mock'", () => {
    expect(provider.id).toBe("mock");
  });

  describe("search", () => {
    it("returns lightweight summaries (MediaSummary) for matching titles", async () => {
      const results = await provider.search("matrix");

      expect(results).toEqual([
        {
          id: "mock-movie-1",
          mediaType: "movie",
          title: "The Matrix",
          releaseYear: 1999,
          posterUrl: "https://images.example.com/posters/the-matrix.jpg",
        },
      ]);
    });

    it("matches case-insensitively and normalizes whitespace in the query", async () => {
      const results = await provider.search("  THE   Matrix ");

      expect(results.map((r) => r.id)).toEqual(["mock-movie-1"]);
    });

    it("returns both movies and series when both match", async () => {
      const results = await provider.search("the");

      expect(results.map((r) => r.mediaType)).toContain("movie");
      expect(results.map((r) => r.mediaType)).toContain("series");
    });

    it("returns an empty array when nothing matches", async () => {
      await expect(provider.search("finnes ikke")).resolves.toEqual([]);
    });

    it("returns an empty array for a blank query", async () => {
      await expect(provider.search("   ")).resolves.toEqual([]);
    });

    it("rejects with AbortError when the signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const promise = provider.search("matrix", {
        signal: controller.signal,
      });

      await expect(promise).rejects.toBeInstanceOf(DOMException);
      await expect(promise).rejects.toHaveProperty("name", "AbortError");
    });
  });

  describe("getDetails", () => {
    it("returns full media details for a known movie id", async () => {
      const media = await provider.getDetails("mock-movie-1");

      expect(media).toMatchObject({
        id: "mock-movie-1",
        mediaType: "movie",
        title: "The Matrix",
        releaseYear: 1999,
        providerId: "mock",
        genres: ["Action", "Sci-Fi"],
        ratings: { imdbScore: 8.7, rottenTomatoesScore: 83 },
      });
      expect(media.streaming).not.toBeNull();
      expect(media.streaming?.region).toBe("NO");
      expect(media.streaming?.offers.length).toBeGreaterThan(0);
    });

    it("returns series-specific fields for a known series id", async () => {
      const media = await provider.getDetails("mock-series-1");

      expect(media.mediaType).toBe("series");
      if (media.mediaType !== "series") throw new Error("unreachable");
      expect(media.numberOfSeasons).toBe(5);
      expect(media.status).toBe("ended");
    });

    it("returns rottenTomatoesScore: null for a title without RT score", async () => {
      const media = await provider.getDetails("mock-movie-2");

      expect(media.ratings.rottenTomatoesScore).toBeNull();
      expect(media.ratings.imdbScore).not.toBeNull();
    });

    it("returns posterUrl: null for a title without poster", async () => {
      const media = await provider.getDetails("mock-movie-2");

      expect(media.posterUrl).toBeNull();
    });

    it("returns streaming: null for a title without streaming offers", async () => {
      const media = await provider.getDetails("mock-movie-3");

      expect(media.streaming).toBeNull();
    });

    it("rejects with MediaProviderError('not-found') for an unknown id", async () => {
      const promise = provider.getDetails("mock-finnes-ikke");

      await expect(promise).rejects.toBeInstanceOf(MediaProviderError);
      await expect(promise).rejects.toHaveProperty("code", "not-found");
    });

    it("rejects with AbortError when the signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const promise = provider.getDetails("mock-movie-1", {
        signal: controller.signal,
      });

      await expect(promise).rejects.toBeInstanceOf(DOMException);
      await expect(promise).rejects.toHaveProperty("name", "AbortError");
    });

    it("returns a defensive copy so callers cannot mutate the catalog", async () => {
      const first = await provider.getDetails("mock-movie-1");
      first.title = "Mutert";
      first.genres.push("Mutert");

      const second = await provider.getDetails("mock-movie-1");

      expect(second.title).toBe("The Matrix");
      expect(second.genres).not.toContain("Mutert");
    });
  });
});
