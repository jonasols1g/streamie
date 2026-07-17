import type { MediaSummary } from "./media";

export type WatchlistStatus = "planned" | "watched";

/** Delt norsk visningstekst per status (se docs/design.md#watchlist-ux). */
export const WATCHLIST_STATUS_LABEL: Record<WatchlistStatus, string> = {
  planned: "Planlagt",
  watched: "Sett",
};

export interface WatchlistItem {
  mediaId: string;
  media: MediaSummary; // lett snapshot (poster/tittel/år) - IKKE full Media
  status: WatchlistStatus;
  addedAt: string; // ISO-tidsstempel
  watchedAt?: string; // settes når status settes til 'watched'
}
