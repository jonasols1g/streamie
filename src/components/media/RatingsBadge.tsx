import type { AriaAttributes } from "react";
import type { Ratings } from "../../types/media";

export interface RatingsBadgeProps {
  ratings: Ratings;
}

const NOT_AVAILABLE = "Ikke tilgjengelig";

/**
 * IMDb- og Rotten Tomatoes-score side ved side (se
 * docs/design.md#detaljvisning og
 * docs/design-spec/screenshots/03-detaljside.png: gull-tonet IMDb-badge med
 * stjerne, rødtonet Rotten Tomatoes-badge med en sirkulær "R"-markør).
 * RT-score mangler ofte i praksis — når en score er `null` vises "Ikke
 * tilgjengelig" eksplisitt fremfor å skjule feltet eller vise en misvisende
 * verdi som 0 (se docs/architecture.md#mediaprovider-abstraksjonen).
 */
export function RatingsBadge({ ratings }: RatingsBadgeProps) {
  return (
    <dl className="flex flex-wrap gap-3">
      <div className="border-gold/40 bg-gold/10 flex items-center gap-2.5 rounded-2xl border px-4 py-2.5">
        <GoldStarIcon
          aria-hidden="true"
          className="text-gold h-5 w-5 shrink-0"
        />
        <div>
          <dd className="text-text-primary text-base font-bold">
            {ratings.imdbScore !== null
              ? `${ratings.imdbScore}/10`
              : NOT_AVAILABLE}
          </dd>
          <dt className="text-gold text-xs font-semibold">IMDb</dt>
        </div>
      </div>
      <div className="border-accent/40 bg-accent/10 flex items-center gap-2.5 rounded-2xl border px-4 py-2.5">
        <span
          aria-hidden="true"
          className="bg-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
        >
          R
        </span>
        <div>
          <dd className="text-text-primary text-base font-bold">
            {ratings.rottenTomatoesScore !== null
              ? `${ratings.rottenTomatoesScore}%`
              : NOT_AVAILABLE}
          </dd>
          <dt className="text-accent text-xs font-semibold">Rotten Tom.</dt>
        </div>
      </div>
    </dl>
  );
}

function GoldStarIcon(props: {
  className?: string;
  "aria-hidden"?: AriaAttributes["aria-hidden"];
}) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.9 6.06 6.6.77-4.9 4.55 1.27 6.53L12 17.6l-5.87 3.31 1.27-6.53-4.9-4.55 6.6-.77Z" />
    </svg>
  );
}
