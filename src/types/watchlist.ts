import type { MediaSummary } from "./media";

export type WatchlistStatus = "planned" | "watched";

export interface WatchlistItem {
  mediaId: string;
  media: MediaSummary; // lett snapshot (poster/tittel/år) - IKKE full Media
  status: WatchlistStatus;
  addedAt: string; // ISO-tidsstempel
  watchedAt?: string; // settes når status settes til 'watched'
}
