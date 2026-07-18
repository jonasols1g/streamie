import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaProviderError } from "../MediaProvider";
import { OmdbMediaProvider } from "./OmdbMediaProvider";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("OmdbMediaProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let provider: OmdbMediaProvider;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    provider = new OmdbMediaProvider({ apiKey: "test-key" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("search", () => {
    it("mapper et vellykket søk til MediaSummary[]", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          Response: "True",
          Search: [
            {
              Title: "The Matrix",
              Year: "1999",
              imdbID: "tt0133093",
              Type: "movie",
              Poster: "https://images.example.com/matrix.jpg",
            },
          ],
        }),
      );

      const results = await provider.search("matrix");

      expect(results).toEqual([
        {
          id: "tt0133093",
          mediaType: "movie",
          title: "The Matrix",
          releaseYear: 1999,
          posterUrl: "https://images.example.com/matrix.jpg",
        },
      ]);
    });

    it("mapper Response:'False' (HTTP 200) til tomt resultat, ikke feil", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ Response: "False", Error: "Movie not found!" }),
      );

      await expect(provider.search("finnes-ikke")).resolves.toEqual([]);
    });

    it("mapper et posterfelt som 'N/A' til null, ikke strengen 'N/A'", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          Response: "True",
          Search: [
            {
              Title: "Solaris",
              Year: "1972",
              imdbID: "tt0069293",
              Type: "movie",
              Poster: "N/A",
            },
          ],
        }),
      );

      const [result] = await provider.search("solaris");
      expect(result?.posterUrl).toBeNull();
    });

    it("forkaster ikke-https plakat-URL-er (kun https slippes gjennom)", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          Response: "True",
          Search: [
            {
              Title: "Suspicious",
              Year: "2000",
              imdbID: "tt0000001",
              Type: "movie",
              Poster: "javascript:alert(1)",
            },
          ],
        }),
      );

      const [result] = await provider.search("suspicious");
      expect(result?.posterUrl).toBeNull();
    });

    it("mapper 429 til MediaProviderError('rate-limit')", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 429 }));

      await expect(provider.search("matrix")).rejects.toMatchObject({
        code: "rate-limit",
      });
      await expect(provider.search("matrix")).rejects.toBeInstanceOf(
        MediaProviderError,
      );
    });

    it("mapper 401 til MediaProviderError('unknown') (feilkonfigurert nøkkel)", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

      await expect(provider.search("matrix")).rejects.toMatchObject({
        code: "unknown",
      });
    });

    it("mapper nettverksfeil (fetch kaster) til MediaProviderError('network')", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(provider.search("matrix")).rejects.toMatchObject({
        code: "network",
      });
    });

    it("mapper uventet svarform til MediaProviderError('invalid-response')", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }));

      await expect(provider.search("matrix")).rejects.toMatchObject({
        code: "invalid-response",
      });
    });
  });

  describe("getDetails", () => {
    it("mapper et vellykket oppslag til Media, inkl. RT-score fra Ratings-array", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          Response: "True",
          Title: "The Matrix",
          Year: "1999",
          Type: "movie",
          Poster: "https://images.example.com/matrix.jpg",
          Plot: "A computer hacker learns...",
          Genre: "Action, Sci-Fi",
          Runtime: "136 min",
          imdbRating: "8.7",
          imdbID: "tt0133093",
          Ratings: [
            { Source: "Internet Movie Database", Value: "8.7/10" },
            { Source: "Rotten Tomatoes", Value: "83%" },
          ],
        }),
      );

      const media = await provider.getDetails("tt0133093");

      expect(media).toMatchObject({
        id: "tt0133093",
        mediaType: "movie",
        title: "The Matrix",
        releaseYear: 1999,
        posterUrl: "https://images.example.com/matrix.jpg",
        overview: "A computer hacker learns...",
        genres: ["Action", "Sci-Fi"],
        ratings: { imdbScore: 8.7, rottenTomatoesScore: 83 },
        runtimeMinutes: 136,
      });
    });

    it("mapper Response:'False' (HTTP 200) til MediaProviderError('not-found')", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ Response: "False", Error: "Movie not found!" }),
      );

      await expect(provider.getDetails("tt9999999")).rejects.toMatchObject({
        code: "not-found",
      });
    });

    it("mapper manglende RT-score til rottenTomatoesScore: null", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          Response: "True",
          Title: "Solaris",
          Year: "1972",
          Type: "movie",
          Poster: "N/A",
          Plot: "N/A",
          Genre: "N/A",
          Runtime: "N/A",
          imdbRating: "N/A",
          imdbID: "tt0069293",
          Ratings: [{ Source: "Internet Movie Database", Value: "8.0/10" }],
        }),
      );

      const media = await provider.getDetails("tt0069293");

      expect(media.ratings.rottenTomatoesScore).toBeNull();
      expect(media.ratings.imdbScore).toBeNull();
      expect(media.posterUrl).toBeNull();
      expect(media.overview).toBe("");
      expect(media.genres).toEqual([]);
      expect(media.mediaType).toBe("movie");
      if (media.mediaType === "movie") {
        expect(media.runtimeMinutes).toBeNull();
      }
    });

    it("mapper en serie med avsluttet periode og sesongantall", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          Response: "True",
          Title: "The Wire",
          Year: "2002–2008",
          Type: "series",
          Poster: "https://images.example.com/wire.jpg",
          Plot: "Baltimore drug scene.",
          Genre: "Crime, Drama",
          totalSeasons: "5",
          imdbRating: "9.3",
          imdbID: "tt0306414",
          Ratings: [],
        }),
      );

      const media = await provider.getDetails("tt0306414");

      expect(media.mediaType).toBe("series");
      if (media.mediaType === "series") {
        expect(media.numberOfSeasons).toBe(5);
        expect(media.status).toBe("ended");
      }
    });

    it("mapper 429 til MediaProviderError('rate-limit')", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 429 }));

      await expect(provider.getDetails("tt0133093")).rejects.toMatchObject({
        code: "rate-limit",
      });
    });

    it("mapper nettverksfeil til MediaProviderError('network')", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(provider.getDetails("tt0133093")).rejects.toMatchObject({
        code: "network",
      });
    });

    it("propagerer AbortError uendret (avbrytes ikke internt)", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      fetchMock.mockRejectedValue(abortError);

      await expect(provider.getDetails("tt0133093")).rejects.toBe(abortError);
    });
  });
});
