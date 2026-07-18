import type { Media, MediaSummary } from "../../../types/media";
import type {
  DetailsOptions,
  MediaProvider,
  SearchOptions,
} from "../MediaProvider";
import type { MotnMediaProvider } from "./MotnMediaProvider";
import type { OmdbMediaProvider } from "./OmdbMediaProvider";

/**
 * Slår sammen OMDb (katalog/titteldata) og MOTN (strømmetilgjengelighet) til
 * én `MediaProvider` — se docs/architecture.md#compositemediaprovider.
 *
 * - `search` går kun til OMDb (MOTN har ingen søkefunksjon, og et søk skal
 *   aldri koste et kall mot MOTNs strengere kvote på 100/døgn).
 * - `getDetails` kaller begge parallelt (`Promise.all`): en MOTN-feil
 *   (inkl. "ikke funnet i regionen") degraderes til `streaming: null` og
 *   velter aldri hele oppslaget — kun en OMDb-feil kan avvise `getDetails`.
 *
 * Merk: feltene deklareres eksplisitt (ikke parameter properties) —
 * tsconfig har `erasableSyntaxOnly: true`, som forbyr TS-syntaks med
 * runtime-semantikk (se samme merknad i `CachingMediaProvider.ts`).
 */
export class CompositeMediaProvider implements MediaProvider {
  readonly id = "composite";
  private readonly catalog: OmdbMediaProvider;
  private readonly streaming: MotnMediaProvider;

  constructor(catalog: OmdbMediaProvider, streaming: MotnMediaProvider) {
    this.catalog = catalog;
    this.streaming = streaming;
  }

  search(query: string, options?: SearchOptions): Promise<MediaSummary[]> {
    return this.catalog.search(query, options);
  }

  async getDetails(id: string, options?: DetailsOptions): Promise<Media> {
    const [media, streaming] = await Promise.all([
      this.catalog.getDetails(id, options),
      this.streaming.getStreaming(id, options).catch((error: unknown) => {
        // MOTN-bom er en normaltilstand, ikke en feil (se
        // docs/architecture.md#compositemediaprovider) — logges til
        // konsollen for feilsøking, men velter aldri hele oppslaget.
        console.warn(
          "[composite] MOTN-oppslag feilet; degraderer til streaming: null",
          error,
        );
        return null;
      }),
    ]);
    return { ...media, streaming };
  }
}
