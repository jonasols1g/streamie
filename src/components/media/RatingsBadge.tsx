import type { Ratings } from "../../types/media";

export interface RatingsBadgeProps {
  ratings: Ratings;
}

const NOT_AVAILABLE = "Ikke tilgjengelig";

/**
 * IMDb- og Rotten Tomatoes-score side ved side (se
 * docs/design.md#detaljvisning). RT-score mangler ofte i praksis — når en
 * score er `null` vises "Ikke tilgjengelig" eksplisitt fremfor å skjule
 * feltet eller vise en misvisende verdi som 0 (se
 * docs/architecture.md#mediaprovider-abstraksjonen).
 */
export function RatingsBadge({ ratings }: RatingsBadgeProps) {
  return (
    <dl className="flex flex-wrap gap-6">
      <div>
        <dt className="text-sm text-slate-500">IMDb</dt>
        <dd className="text-lg font-semibold">
          {ratings.imdbScore !== null
            ? `${ratings.imdbScore}/10`
            : NOT_AVAILABLE}
        </dd>
      </div>
      <div>
        <dt className="text-sm text-slate-500">Rotten Tomatoes</dt>
        <dd className="text-lg font-semibold">
          {ratings.rottenTomatoesScore !== null
            ? `${ratings.rottenTomatoesScore}%`
            : NOT_AVAILABLE}
        </dd>
      </div>
    </dl>
  );
}
