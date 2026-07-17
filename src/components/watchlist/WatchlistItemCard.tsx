import { Link } from "react-router-dom";
import { useWatchlist } from "../../context/WatchlistContext";
import type { WatchlistItem, WatchlistStatus } from "../../types/watchlist";
import { accentHueClasses } from "../../utils/accentHue";
import { PosterImage } from "../media/PosterImage";

export interface WatchlistItemCardProps {
  item: WatchlistItem;
}

const OTHER_STATUS_LABEL: Record<WatchlistStatus, string> = {
  planned: "Merk som sett",
  watched: "Merk som planlagt",
};

/**
 * Én oppføring i watchlisten (se docs/design.md#watchlist-ux og
 * docs/design-spec/screenshots/04-watchlist.png): plakat-thumb med
 * hue-ring, tittel, meta i tittelens hue, en sirkulær stjerne-knapp som
 * fjerner tittelen (matcher skjermbildet), og en mindre statusbytte-knapp.
 * `docs/design-spec/README.md` viser kun stjernen — statusbytte
 * (planlagt ↔ sett) er eksisterende funksjonalitet fra fase 7 som må
 * bevares (se docs/dev-tasks.md fase 11: "bevar all eksisterende
 * funksjonalitet uendret"), og vises derfor som en mindre, sekundær knapp
 * ved siden av stjernen.
 *
 * Klikk på plakat/tittel navigerer til `/title/:id`; handlingsknappene
 * ligger bevisst utenfor `<Link>`-en for å unngå nøstede interaktive
 * elementer.
 */
export function WatchlistItemCard({ item }: WatchlistItemCardProps) {
  const { setStatus, removeFromWatchlist } = useWatchlist();
  const otherStatus: WatchlistStatus =
    item.status === "planned" ? "watched" : "planned";
  const hue = accentHueClasses(item.mediaId);

  return (
    <article className="border-surface-border/40 bg-surface flex items-center gap-4 rounded-2xl border p-3">
      <Link
        to={`/title/${item.mediaId}`}
        className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <PosterImage
          posterUrl={item.media.posterUrl}
          title={item.media.title}
          className={`h-[90px] w-[60px] shrink-0 rounded-[10px] object-cover ring-1 ${hue.ring}`}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-heading truncate text-[14.5px] font-bold">
            {item.media.title}
          </span>
          <span className={`text-xs font-semibold ${hue.text}`}>
            {item.media.releaseYear ?? "Ukjent år"}
          </span>
        </div>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          aria-label="Fjern"
          onClick={() => {
            removeFromWatchlist(item.mediaId);
          }}
          className={`${hue.bg} text-gold flex h-[34px] w-[34px] items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
        >
          <FilledStarIcon />
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus(item.mediaId, otherStatus);
          }}
          className="text-text-muted hover:text-text-primary text-[11px] font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {OTHER_STATUS_LABEL[item.status]}
        </button>
      </div>
    </article>
  );
}

function FilledStarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M12 2.5l2.9 6.06 6.6.77-4.9 4.55 1.27 6.53L12 17.6l-5.87 3.31 1.27-6.53-4.9-4.55 6.6-.77Z" />
    </svg>
  );
}
