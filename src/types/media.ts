export type MediaType = "movie" | "series";

export interface MediaSummary {
  id: string; // IMDb-ID, f.eks. "tt0133093" ("mock-movie-1" i fase 1–9)
  mediaType: MediaType;
  title: string;
  releaseYear: number | null;
  posterUrl: string | null;
}

export interface Ratings {
  imdbScore: number | null; // 0–10, fra OMDb (imdbRating)
  rottenTomatoesScore: number | null; // 0–100 (%), fra OMDbs Ratings-array; mangler ofte
}

export interface StreamingOffer {
  providerId: string; // normalisert slug, f.eks. "netflix"
  providerName: string;
  logoUrl?: string;
  type: "subscription" | "rent" | "buy" | "free";
  url?: string;
}

export interface StreamingAvailability {
  region: string; // ISO-landkode, f.eks. "NO"
  offers: StreamingOffer[];
  lastUpdated: string; // ISO-tidsstempel
}

interface MediaBase extends MediaSummary {
  providerId: string; // hvilken kilde recorden kom fra: 'composite' | 'mock' | ...
  originalTitle?: string;
  overview: string;
  genres: string[];
  ratings: Ratings;
  streaming: StreamingAvailability | null; // null = ikke hentet/ikke tilgjengelig i regionen
}

export interface MovieMedia extends MediaBase {
  mediaType: "movie";
  runtimeMinutes?: number | null;
}

export interface SeriesMedia extends MediaBase {
  mediaType: "series";
  numberOfSeasons?: number | null;
  status?: "ongoing" | "ended" | "canceled" | "unknown";
}

export type Media = MovieMedia | SeriesMedia;
