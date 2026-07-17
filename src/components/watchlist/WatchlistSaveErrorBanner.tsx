import { useWatchlist } from "../../context/WatchlistContext";

/**
 * Synlig feilmelding når en watchlist-endring ikke kunne lagres (full
 * `localStorage` selv etter cache-opprydding, se
 * docs/architecture.md#cache-design punkt 6). Watchlist-skriving skal aldri
 * feile stille, så banneret vises app-bredt uansett hvilken side endringen
 * ble gjort fra (søkeresultat, detaljside eller watchlist-siden selv).
 */
export function WatchlistSaveErrorBanner() {
  const { saveError, dismissSaveError } = useWatchlist();

  if (!saveError) {
    return null;
  }

  return (
    <div
      role="alert"
      className="border-accent/40 bg-accent/10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-red-200"
    >
      <p>
        Endringen i watchlisten ble ikke lagret — enhetens lagringsplass er
        full.
      </p>
      <button
        type="button"
        onClick={dismissSaveError}
        className="bg-accent shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Lukk
      </button>
    </div>
  );
}
