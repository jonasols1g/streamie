import { useWatchlist } from "../../context/WatchlistContext";
import type { MediaSummary } from "../../types/media";
import {
  WATCHLIST_STATUS_LABEL,
  type WatchlistStatus,
} from "../../types/watchlist";

export interface WatchlistToggleButtonProps {
  media: MediaSummary;
  className?: string;
}

const buttonClassName =
  "border-surface-border bg-surface text-text-primary hover:bg-surface/70 self-start rounded-xl border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const primaryButtonClassName =
  "bg-brand-gradient self-start rounded-2xl px-4 py-3.5 text-[15px] font-bold text-slate-900 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Legg til/fjern/bytt status for én tittel i watchlisten (se
 * docs/design.md#detaljvisning punkt 6 og
 * docs/design-spec/screenshots/03-detaljside.png for CTA-en i
 * "ikke lagt til"-tilstanden). Brukes på `TitleDetailPage` som den faste
 * gradient-CTA-en nederst. Må ikke rendres inne i et navigerende element
 * (`<Link>`/`<a>`) uten at klikk stoppes fra å boble.
 *
 * Tekst/knappenavn ("Legg til i watchlist", "Merk som …", "Fjern fra
 * watchlist") er uendret fra fase 7 — dette er en ren restyling, og disse
 * strengene treffes eksplisitt av `WatchlistToggleButton.test.tsx`,
 * `SearchResultCard.test.tsx`, `TitleDetailPage.test.tsx` og det beskyttede
 * e2e/watchlist.spec.ts. "＋"-glyfen i CTA-en er markert `aria-hidden` slik
 * at den ikke endrer det tilgjengelige navnet.
 */
export function WatchlistToggleButton({
  media,
  className,
}: WatchlistToggleButtonProps) {
  const { addToWatchlist, removeFromWatchlist, setStatus, getStatus } =
    useWatchlist();
  const status = getStatus(media.id);

  if (status === null) {
    return (
      <button
        type="button"
        onClick={() => {
          addToWatchlist(media);
        }}
        className={`${primaryButtonClassName} ${className ?? ""}`}
      >
        <span aria-hidden="true">＋ </span>
        Legg til i watchlist
      </button>
    );
  }

  const otherStatus: WatchlistStatus =
    status === "planned" ? "watched" : "planned";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <span className="text-text-muted text-sm">
        I watchlisten – {WATCHLIST_STATUS_LABEL[status]}
      </span>
      <button
        type="button"
        onClick={() => {
          setStatus(media.id, otherStatus);
        }}
        className={buttonClassName}
      >
        Merk som {WATCHLIST_STATUS_LABEL[otherStatus].toLowerCase()}
      </button>
      <button
        type="button"
        onClick={() => {
          removeFromWatchlist(media.id);
        }}
        className={buttonClassName}
      >
        Fjern fra watchlist
      </button>
    </div>
  );
}
