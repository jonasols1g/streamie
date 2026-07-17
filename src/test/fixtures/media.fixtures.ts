import type {
  MediaSummary,
  MovieMedia,
  Ratings,
  SeriesMedia,
  StreamingAvailability,
} from "../../types/media";

/**
 * Fixture-byggere for domenetypene. Gir komplette, gyldige objekter med
 * fornuftige defaults; enkelttester overstyrer kun feltene de bryr seg om.
 */

export function createRatings(overrides: Partial<Ratings> = {}): Ratings {
  return {
    imdbScore: 8.7,
    rottenTomatoesScore: 83,
    ...overrides,
  };
}

export function createStreamingAvailability(
  overrides: Partial<StreamingAvailability> = {},
): StreamingAvailability {
  return {
    region: "NO",
    offers: [
      {
        providerId: "netflix",
        providerName: "Netflix",
        type: "subscription",
        url: "https://www.netflix.com/title/20557937",
      },
    ],
    lastUpdated: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createMediaSummary(
  overrides: Partial<MediaSummary> = {},
): MediaSummary {
  return {
    id: "mock-movie-1",
    mediaType: "movie",
    title: "The Matrix",
    releaseYear: 1999,
    posterUrl: "https://images.example.com/posters/the-matrix.jpg",
    ...overrides,
  };
}

export function createMovieMedia(
  overrides: Partial<MovieMedia> = {},
): MovieMedia {
  return {
    id: "mock-movie-1",
    mediaType: "movie",
    title: "The Matrix",
    releaseYear: 1999,
    posterUrl: "https://images.example.com/posters/the-matrix.jpg",
    providerId: "mock",
    overview:
      "A computer hacker learns from mysterious rebels about the true nature of his reality.",
    genres: ["Action", "Sci-Fi"],
    ratings: createRatings(),
    streaming: createStreamingAvailability(),
    runtimeMinutes: 136,
    ...overrides,
  };
}

export function createSeriesMedia(
  overrides: Partial<SeriesMedia> = {},
): SeriesMedia {
  return {
    id: "mock-series-1",
    mediaType: "series",
    title: "The Wire",
    releaseYear: 2002,
    posterUrl: "https://images.example.com/posters/the-wire.jpg",
    providerId: "mock",
    overview:
      "The Baltimore drug scene, as seen through the eyes of drug dealers and law enforcement.",
    genres: ["Crime", "Drama", "Thriller"],
    ratings: createRatings({ imdbScore: 9.3, rottenTomatoesScore: 94 }),
    streaming: createStreamingAvailability({
      offers: [
        {
          providerId: "hbo-max",
          providerName: "HBO Max",
          type: "subscription",
          url: "https://www.hbomax.com/no/series/the-wire",
        },
      ],
    }),
    numberOfSeasons: 5,
    status: "ended",
    ...overrides,
  };
}
