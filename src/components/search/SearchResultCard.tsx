import { Link } from "react-router-dom";
import { useWatchlist } from "../../context/WatchlistContext";
import { WatchlistStarToggle } from "../watchlist/WatchlistStarToggle";
import { PosterImage } from "../media/PosterImage";
import type { MediaSummary } from "../../types/media";
import { WATCHLIST_STATUS_LABEL } from "../../types/watchlist";
import { accentHueClasses } from "../../utils/accentHue";

export interface SearchResultCardProps {
  media: MediaSummary;
}

const MEDIA_TYPE_LABEL: Record<MediaSummary["mediaType"], string> = {
  movie: "Film",
  series: "Serie",
};

/**
 * Ett treff i søkeresultat-grid (se docs/design.md#visning-av-søkeresultater
 * og docs/design-spec/screenshots/02-sokeresultater.png): plakat med
 * hue-tonet ring, tittel, meta-linje i tittelens hue, og en stjerne-badge
 * over plakaten som viser/bytter watchlist-tilstand. Klikk på
 * plakat/tittel navigerer til `/title/:id`. Strømmetilgjengelighet vises
 * bevisst ikke her — den hentes først på detaljsiden.
 *
 * `WatchlistStarToggle` ligger bevisst utenfor `<Link>`-en (som en
 * absolutt posisjonert søsken-node over plakaten): nøstede interaktive
 * elementer (knapp inne i lenke) er ugyldig HTML og ville gjort at klikk på
 * knappen også trigget navigasjon.
 */
export function SearchResultCard({ media }: SearchResultCardProps) {
  const { getStatus } = useWatchlist();
  const status = getStatus(media.id);
  const hue = accentHueClasses(media.id);

  return (
    <article className="relative flex flex-col gap-2">
      <Link
        to={`/title/${media.id}`}
        className="flex flex-col gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <PosterImage
          posterUrl={media.posterUrl}
          title={media.title}
          className={`aspect-2/3 w-full rounded-[14px] object-cover ring-1 ${hue.ring}`}
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-heading text-[13.5px] font-semibold">
            {media.title}
          </span>
          <span className={`text-[11.5px] font-semibold ${hue.text}`}>
            {media.releaseYear ?? "Ukjent år"} ·{" "}
            {MEDIA_TYPE_LABEL[media.mediaType]}
          </span>
          {status !== null && (
            <p className="text-text-muted text-[11px]">
              I watchlisten – {WATCHLIST_STATUS_LABEL[status]}
            </p>
          )}
        </div>
      </Link>
      <WatchlistStarToggle
        media={media}
        className="absolute top-2 right-2 h-8 w-8"
      />
    </article>
  );
}
