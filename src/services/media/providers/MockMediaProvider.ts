import type { Media, MediaSummary } from "../../../types/media";
import {
  MediaProviderError,
  type DetailsOptions,
  type MediaProvider,
  type SearchOptions,
} from "../MediaProvider";

/**
 * Fast mock-katalog for fase 1–9. Bevisste null-tilfeller for å tvinge frem
 * null-håndtering i UI tidlig:
 * - "Solaris" mangler Rotten Tomatoes-score og plakat.
 * - "Oppenheimer" mangler streaming-tilbud (streaming: null).
 */
const CATALOG: readonly Media[] = [
  {
    id: "mock-movie-1",
    mediaType: "movie",
    title: "The Matrix",
    releaseYear: 1999,
    posterUrl: "https://images.example.com/posters/the-matrix.jpg",
    providerId: "mock",
    overview:
      "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    genres: ["Action", "Sci-Fi"],
    ratings: { imdbScore: 8.7, rottenTomatoesScore: 83 },
    streaming: {
      region: "NO",
      offers: [
        {
          providerId: "netflix",
          providerName: "Netflix",
          type: "subscription",
          url: "https://www.netflix.com/title/20557937",
        },
        {
          providerId: "apple-tv",
          providerName: "Apple TV",
          type: "rent",
          url: "https://tv.apple.com/no/movie/the-matrix",
        },
      ],
      lastUpdated: "2026-07-01T00:00:00.000Z",
    },
    runtimeMinutes: 136,
  },
  {
    id: "mock-movie-2",
    mediaType: "movie",
    title: "Solaris",
    releaseYear: 1972,
    posterUrl: null, // tester plakat-placeholder
    providerId: "mock",
    originalTitle: "Солярис",
    overview:
      "A psychologist is sent to a space station orbiting a mysterious ocean planet where the crew has succumbed to strange phenomena.",
    genres: ["Drama", "Mystery", "Sci-Fi"],
    ratings: { imdbScore: 8.0, rottenTomatoesScore: null }, // RT-score mangler
    streaming: {
      region: "NO",
      offers: [
        {
          providerId: "nrk-tv",
          providerName: "NRK TV",
          type: "free",
          url: "https://tv.nrk.no/program/solaris",
        },
      ],
      lastUpdated: "2026-07-01T00:00:00.000Z",
    },
    runtimeMinutes: 167,
  },
  {
    id: "mock-movie-3",
    mediaType: "movie",
    title: "Oppenheimer",
    releaseYear: 2023,
    posterUrl: "https://images.example.com/posters/oppenheimer.jpg",
    providerId: "mock",
    overview:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    genres: ["Biography", "Drama", "History"],
    ratings: { imdbScore: 8.3, rottenTomatoesScore: 93 },
    streaming: null, // ikke tilgjengelig i regionen
    runtimeMinutes: 180,
  },
  {
    id: "mock-series-1",
    mediaType: "series",
    title: "The Wire",
    releaseYear: 2002,
    posterUrl: "https://images.example.com/posters/the-wire.jpg",
    providerId: "mock",
    overview:
      "The Baltimore drug scene, as seen through the eyes of drug dealers and law enforcement.",
    genres: ["Crime", "Drama", "Thriller"],
    ratings: { imdbScore: 9.3, rottenTomatoesScore: 94 },
    streaming: {
      region: "NO",
      offers: [
        {
          providerId: "hbo-max",
          providerName: "HBO Max",
          type: "subscription",
          url: "https://www.hbomax.com/no/series/the-wire",
        },
      ],
      lastUpdated: "2026-07-01T00:00:00.000Z",
    },
    numberOfSeasons: 5,
    status: "ended",
  },
  {
    id: "mock-series-2",
    mediaType: "series",
    title: "Severance",
    releaseYear: 2022,
    posterUrl: "https://images.example.com/posters/severance.jpg",
    providerId: "mock",
    overview:
      "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    genres: ["Drama", "Mystery", "Sci-Fi"],
    ratings: { imdbScore: 8.7, rottenTomatoesScore: 97 },
    streaming: {
      region: "NO",
      offers: [
        {
          providerId: "apple-tv-plus",
          providerName: "Apple TV+",
          type: "subscription",
          url: "https://tv.apple.com/no/show/severance",
        },
      ],
      lastUpdated: "2026-07-01T00:00:00.000Z",
    },
    numberOfSeasons: 2,
    status: "ongoing",
  },
];

function toMediaSummary(media: Media): MediaSummary {
  return {
    id: media.id,
    mediaType: media.mediaType,
    title: media.title,
    releaseYear: media.releaseYear,
    posterUrl: media.posterUrl,
  };
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

export class MockMediaProvider implements MediaProvider {
  readonly id = "mock";

  search(query: string, options?: SearchOptions): Promise<MediaSummary[]> {
    if (options?.signal?.aborted) {
      return Promise.reject(abortError());
    }
    const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized === "") {
      return Promise.resolve([]);
    }
    return Promise.resolve(
      CATALOG.filter((media) =>
        media.title.toLowerCase().includes(normalized),
      ).map(toMediaSummary),
    );
  }

  getDetails(id: string, options?: DetailsOptions): Promise<Media> {
    if (options?.signal?.aborted) {
      return Promise.reject(abortError());
    }
    const media = CATALOG.find((entry) => entry.id === id);
    if (!media) {
      return Promise.reject(
        new MediaProviderError(`No media found with id "${id}"`, "not-found"),
      );
    }
    // Klon slik at callere aldri kan mutere katalogen.
    return Promise.resolve(structuredClone(media));
  }
}
