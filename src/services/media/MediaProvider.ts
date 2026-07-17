import type { Media, MediaSummary } from "../../types/media";

export interface SearchOptions {
  signal?: AbortSignal;
}

export interface DetailsOptions {
  signal?: AbortSignal;
}

export type MediaProviderErrorCode =
  "network" | "not-found" | "rate-limit" | "invalid-response" | "unknown";

// Merk: docs/architecture.md skisserer denne klassen med parameter properties
// (`public code`, `public cause`), men det er ikke "erasable syntax" og er
// derfor forbudt av `erasableSyntaxOnly` i tsconfig. Feltene deklareres
// eksplisitt i stedet — den offentlige flaten (message/code/cause) er identisk.
export class MediaProviderError extends Error {
  readonly code: MediaProviderErrorCode;

  constructor(message: string, code: MediaProviderErrorCode, cause?: unknown) {
    super(message, { cause });
    this.name = "MediaProviderError";
    this.code = code;
  }
}

export interface MediaProvider {
  readonly id: string; // 'mock' | 'composite' | ...
  search(query: string, options?: SearchOptions): Promise<MediaSummary[]>;
  getDetails(id: string, options?: DetailsOptions): Promise<Media>;
}
