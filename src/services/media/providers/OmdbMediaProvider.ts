import type {
  Media,
  MediaSummary,
  MediaType,
  SeriesMedia,
} from "../../../types/media";
import {
  MediaProviderError,
  type DetailsOptions,
  type MediaProvider,
  type SearchOptions,
} from "../MediaProvider";
import {
  isRecord,
  parseJson,
  performFetch,
  throwForStatus,
} from "./httpErrors";
import { sanitizeHttpsUrl } from "./sanitizeUrl";

const DEFAULT_BASE_URL = "https://www.omdbapi.com/";

export interface OmdbMediaProviderConfig {
  apiKey: string;
  /** Kun for tester — peker mot en fane stub-server i stedet for det ekte APIet. */
  baseUrl?: string;
}

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbSearchResult {
  Title: string;
  Year?: string;
  imdbID: string;
  Type?: string;
  Poster?: string;
}

// `type` (ikke `interface`) er bevisst: kun type-literaler får en implisitt
// indekssignatur som gjør dem strukturelt tilordnbare til
// `Record<string, unknown>` — noe type-predikatet i `isOmdbFailureResponse`
// under krever.
type OmdbFailureResponse = {
  Response: "False";
  Error: string;
};

interface OmdbSearchSuccessResponse {
  Response: "True";
  Search: OmdbSearchResult[];
}

type OmdbSearchResponse = OmdbSearchSuccessResponse | OmdbFailureResponse;

interface OmdbDetailsSuccessResponse {
  Response: "True";
  Title: string;
  Year?: string;
  Type?: string;
  Poster?: string;
  Plot?: string;
  Genre?: string;
  Runtime?: string;
  totalSeasons?: string;
  imdbRating?: string;
  imdbID: string;
  Ratings?: OmdbRating[];
}

type OmdbDetailsResponse = OmdbDetailsSuccessResponse | OmdbFailureResponse;

function isOmdbFailureResponse(
  value: Record<string, unknown>,
): value is OmdbFailureResponse {
  return value.Response === "False" && typeof value.Error === "string";
}

function isOmdbSearchResponse(value: unknown): value is OmdbSearchResponse {
  if (!isRecord(value)) {
    return false;
  }
  if (isOmdbFailureResponse(value)) {
    return true;
  }
  return value.Response === "True" && Array.isArray(value.Search);
}

function isOmdbDetailsResponse(value: unknown): value is OmdbDetailsResponse {
  if (!isRecord(value)) {
    return false;
  }
  if (isOmdbFailureResponse(value)) {
    return true;
  }
  return (
    value.Response === "True" &&
    typeof value.Title === "string" &&
    typeof value.imdbID === "string"
  );
}

/**
 * `"N/A"` er OMDbs måte å si "mangler" på tvers av nesten alle felt (se
 * docs/architecture.md#omdb-mapping--kjente-fallgruver) — mappes alltid til
 * `null`, aldri strengen `"N/A"` eller `NaN`.
 */
function naOrNull(value: string | undefined): string | null {
  if (value === undefined || value === "N/A" || value === "") {
    return null;
  }
  return value;
}

/** Alle tallfelter fra OMDb kommer som strenger; parse-feil gir `null`, ikke `NaN`. */
function parseOmdbNumber(value: string | undefined): number | null {
  const raw = naOrNull(value);
  if (raw === null) {
    return null;
  }
  const parsed = Number(raw.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/** `Year` kan være `"1999"`, `"2002–2008"` eller `"2016–"` (serier). */
function parseReleaseYear(value: string | undefined): number | null {
  const raw = naOrNull(value);
  if (raw === null) {
    return null;
  }
  const match = /\d{4}/.exec(raw);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

/** `Runtime` er f.eks. `"136 min"` eller `"N/A"`. */
function parseRuntimeMinutes(value: string | undefined): number | null {
  const raw = naOrNull(value);
  if (raw === null) {
    return null;
  }
  const match = /\d+/.exec(raw);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * RT-scoren ligger i `Ratings`-arrayet, ikke i et eget felt, og mangler ofte
 * helt (se docs/architecture.md#omdb-mapping--kjente-fallgruver).
 */
function findRottenTomatoesScore(
  ratings: OmdbRating[] | undefined,
): number | null {
  const entry = ratings?.find((rating) => rating.Source === "Rotten Tomatoes");
  if (!entry) {
    return null;
  }
  const match = /\d+/.exec(entry.Value);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGenres(value: string | undefined): string[] {
  const raw = naOrNull(value);
  if (raw === null) {
    return [];
  }
  return raw
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0);
}

function toMediaType(rawType: string | undefined): MediaType {
  return rawType === "series" ? "series" : "movie";
}

/**
 * OMDb har intet eget felt for om en serie pågår/er avsluttet — heuristikk
 * basert på `Year`-mønsteret (`"2002–2008"` = avsluttet, `"2016–"` = pågår,
 * uten tankestrek = ukjent). Ikke et dokumentert API-kontrakt, kun best
 * effort, siden domenemodellen (`SeriesMedia.status`) er valgfri nettopp av
 * denne grunnen.
 */
function inferSeriesStatus(
  year: string | undefined,
): NonNullable<SeriesMedia["status"]> {
  const raw = naOrNull(year);
  if (raw === null) {
    return "unknown";
  }
  const match = /^\d{4}[–-](\d{4})?$/.exec(raw.trim());
  if (!match) {
    return "unknown";
  }
  return match[1] !== undefined ? "ended" : "ongoing";
}

function mapOmdbSearchResultToSummary(raw: OmdbSearchResult): MediaSummary {
  return {
    id: raw.imdbID,
    mediaType: toMediaType(raw.Type),
    title: raw.Title,
    releaseYear: parseReleaseYear(raw.Year),
    posterUrl: sanitizeHttpsUrl(raw.Poster),
  };
}

function mapOmdbDetailsToMedia(
  raw: OmdbDetailsSuccessResponse,
  providerId: string,
): Media {
  const mediaType = toMediaType(raw.Type);
  const base = {
    id: raw.imdbID,
    title: raw.Title,
    releaseYear: parseReleaseYear(raw.Year),
    posterUrl: sanitizeHttpsUrl(raw.Poster),
    providerId,
    overview: naOrNull(raw.Plot) ?? "",
    genres: parseGenres(raw.Genre),
    ratings: {
      imdbScore: parseOmdbNumber(raw.imdbRating),
      rottenTomatoesScore: findRottenTomatoesScore(raw.Ratings),
    },
    // Settes av `CompositeMediaProvider` etter et parallelt MOTN-oppslag —
    // se docs/architecture.md#compositemediaprovider.
    streaming: null,
  };

  if (mediaType === "movie") {
    return {
      ...base,
      mediaType: "movie",
      runtimeMinutes: parseRuntimeMinutes(raw.Runtime),
    };
  }

  return {
    ...base,
    mediaType: "series",
    numberOfSeasons: parseOmdbNumber(raw.totalSeasons),
    status: inferSeriesStatus(raw.Year),
  };
}

/**
 * `MediaProvider` mot OMDb (søk og titteldata — se docs/architecture.md#datakilder).
 * Mapping-fallgruvene (HTTP 200 ved bom, `"N/A"`, tallfelter som strenger,
 * RT-score i `Ratings`-array) er dokumentert i
 * docs/architecture.md#omdb-mapping--kjente-fallgruver.
 */
export class OmdbMediaProvider implements MediaProvider {
  readonly id = "omdb";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: OmdbMediaProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<MediaSummary[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("s", query);

    const response = await performFetch(
      url.toString(),
      { signal: options?.signal },
      "OMDb",
    );
    if (!response.ok) {
      throwForStatus(response, "OMDb");
    }
    const data = await parseJson(response, "OMDb");
    if (!isOmdbSearchResponse(data)) {
      throw new MediaProviderError(
        "OMDb: uventet svarform ved søk",
        "invalid-response",
      );
    }
    if (data.Response === "False") {
      // Ingen treff er en normaltilstand (tom-tilstand i UI), ikke en feil —
      // se docs/design.md#visning-av-søkeresultater.
      return [];
    }
    return data.Search.map(mapOmdbSearchResultToSummary);
  }

  async getDetails(id: string, options?: DetailsOptions): Promise<Media> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("i", id);

    const response = await performFetch(
      url.toString(),
      { signal: options?.signal },
      "OMDb",
    );
    if (!response.ok) {
      throwForStatus(response, "OMDb");
    }
    const data = await parseJson(response, "OMDb");
    if (!isOmdbDetailsResponse(data)) {
      throw new MediaProviderError(
        "OMDb: uventet svarform ved detaljoppslag",
        "invalid-response",
      );
    }
    if (data.Response === "False") {
      throw new MediaProviderError(data.Error, "not-found");
    }
    return mapOmdbDetailsToMedia(data, this.id);
  }
}
