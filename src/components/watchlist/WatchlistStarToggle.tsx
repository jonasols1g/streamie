import { useWatchlist } from "../../context/WatchlistContext";
import type { MediaSummary } from "../../types/media";
import { accentHueClasses } from "../../utils/accentHue";

export interface WatchlistStarToggleProps {
  media: MediaSummary;
  className?: string;
}

/**
 * Kompakt stjerne-toggle for watchlist-tilstand — plakat-badgen på
 * `SearchResultCard` og fjern-knappen på `WatchlistItemCard` (se
 * docs/design-spec/screenshots/02-sokeresultater.png og
 * 04-watchlist.png). Fylt hue-bakgrunn når tittelen er i watchlisten,
 * gjennomsiktig mørk når den ikke er det (se
 * docs/design.md#visuelt-tema-cinefind-fase-11).
 *
 * Dette er en enklere variant av `WatchlistToggleButton` (kun legg
 * til/fjern, ingen statusbytte planlagt/sett) — statusbytte gjøres fortsatt
 * via `WatchlistToggleButton` (detaljsiden) og de dedikerte
 * status-knappene på `WatchlistItemCard`. Samme aria-label-tekst som
 * `WatchlistToggleButton` for konsekvent ordbruk i appen.
 */
export function WatchlistStarToggle({
  media,
  className,
}: WatchlistStarToggleProps) {
  const { addToWatchlist, removeFromWatchlist, getStatus } = useWatchlist();
  const inWatchlist = getStatus(media.id) !== null;
  const hue = accentHueClasses(media.id);

  return (
    <button
      type="button"
      aria-label={inWatchlist ? "Fjern fra watchlist" : "Legg til i watchlist"}
      aria-pressed={inWatchlist}
      onClick={() => {
        if (inWatchlist) {
          removeFromWatchlist(media.id);
        } else {
          addToWatchlist(media);
        }
      }}
      className={`flex shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        inWatchlist
          ? `${hue.bg} text-gold border-transparent`
          : "border-surface-border bg-surface/80 text-gold"
      } ${className ?? ""}`}
    >
      <StarIcon filled={inWatchlist} />
    </button>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path d="M12 2.5l2.9 6.06 6.6.77-4.9 4.55 1.27 6.53L12 17.6l-5.87 3.31 1.27-6.53-4.9-4.55 6.6-.77Z" />
    </svg>
  );
}
