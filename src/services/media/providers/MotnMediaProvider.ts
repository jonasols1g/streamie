import type {
  StreamingAvailability,
  StreamingOffer,
} from "../../../types/media";
import { MediaProviderError, type DetailsOptions } from "../MediaProvider";
import {
  isRecord,
  parseJson,
  performFetch,
  throwForStatus,
} from "./httpErrors";
import { sanitizeHttpsUrl } from "./sanitizeUrl";

const DEFAULT_BASE_URL = "https://api.movieofthenight.com/v4";
const DEFAULT_COUNTRY = "no";

export interface MotnMediaProviderConfig {
  apiKey: string;
  /** ISO-landkode, påkrevd parameter hos MOTN. Default `"no"` (se docs/architecture.md). */
  country?: string;
  /** Kun for tester — peker mot en fake stub-server i stedet for det ekte APIet. */
  baseUrl?: string;
}

interface MotnServiceImageSet {
  lightThemeImage?: string;
  darkThemeImage?: string;
}

interface MotnService {
  id: string;
  name: string;
  imageSet?: MotnServiceImageSet;
}

interface MotnStreamingOption {
  service: MotnService;
  type: string;
  link?: string;
}

interface MotnShowResponse {
  streamingOptions?: Record<string, MotnStreamingOption[]>;
}

function isMotnService(value: unknown): value is MotnService {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isMotnStreamingOption(value: unknown): value is MotnStreamingOption {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    isMotnService(value.service)
  );
}

function isMotnShowResponse(value: unknown): value is MotnShowResponse {
  if (!isRecord(value)) {
    return false;
  }
  if (value.streamingOptions === undefined) {
    return true;
  }
  return isRecord(value.streamingOptions);
}

function mapMotnOfferType(type: string): StreamingOffer["type"] {
  switch (type) {
    case "subscription":
    case "rent":
    case "buy":
    case "free":
      return type;
    default:
      // f.eks. MOTNs "addon" (tilleggskanal via en annen tjeneste) — nærmest
      // et abonnement, og domenemodellen har ingen egen kategori for det.
      return "subscription";
  }
}

function mapMotnStreamingOption(option: MotnStreamingOption): StreamingOffer {
  return {
    providerId: option.service.id,
    providerName: option.service.name,
    logoUrl:
      sanitizeHttpsUrl(option.service.imageSet?.lightThemeImage) ?? undefined,
    type: mapMotnOfferType(option.type),
    url: sanitizeHttpsUrl(option.link) ?? undefined,
  };
}

function mapMotnResponseToStreaming(
  data: MotnShowResponse,
  country: string,
): StreamingAvailability {
  const rawOffers = data.streamingOptions?.[country] ?? [];
  return {
    region: country.toUpperCase(),
    offers: rawOffers.filter(isMotnStreamingOption).map(mapMotnStreamingOption),
    // MOTN leverer ikke et eget "sist oppdatert"-tidsstempel for dette
    // endepunktet — vi bruker tidspunktet for selve oppslaget, som er
    // reelt riktig (og er hva feltet uansett brukes til: å vise hvor
    // ferske dataene er).
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Henter strømmetilgjengelighet fra Movie of the Night (se
 * docs/architecture.md#datakilder). Implementerer *ikke* `MediaProvider` —
 * MOTN har kun ett ansvar (streaming), og brukes utelukkende av
 * `CompositeMediaProvider`.
 *
 * **Ikke-funnet (404) er en normaltilstand, ikke en feil:** en tittel som
 * ikke strømmes i regionen finnes ikke i MOTNs katalog — `getStreaming`
 * returnerer da `null` i stedet for å kaste (se docs/dev-tasks.md fase 10).
 */
export class MotnMediaProvider {
  readonly id = "motn";
  private readonly apiKey: string;
  private readonly country: string;
  private readonly baseUrl: string;

  constructor(config: MotnMediaProviderConfig) {
    this.apiKey = config.apiKey;
    this.country = config.country ?? DEFAULT_COUNTRY;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async getStreaming(
    id: string,
    options?: DetailsOptions,
  ): Promise<StreamingAvailability | null> {
    const url = new URL(`${this.baseUrl}/shows/${encodeURIComponent(id)}`);
    url.searchParams.set("country", this.country);

    const response = await performFetch(
      url.toString(),
      { signal: options?.signal, headers: { "X-API-Key": this.apiKey } },
      "Movie of the Night",
    );

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throwForStatus(response, "Movie of the Night");
    }

    const data = await parseJson(response, "Movie of the Night");
    if (!isMotnShowResponse(data)) {
      throw new MediaProviderError(
        "Movie of the Night: uventet svarform",
        "invalid-response",
      );
    }

    return mapMotnResponseToStreaming(data, this.country);
  }
}
