import type { MediaSummary } from "../../types/media";
import { SearchResultCard } from "./SearchResultCard";

export interface SearchResultsGridProps {
  results: MediaSummary[];
}

/**
 * Responsivt rutenett av søkeresultater (se docs/design.md#styling):
 * 2 kolonner iht. skjerm 2 i design-spec-en på mobil, flere kolonner på
 * bredere skjermer.
 */
export function SearchResultsGrid({ results }: SearchResultsGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {results.map((media) => (
        <li key={media.id}>
          <SearchResultCard media={media} />
        </li>
      ))}
    </ul>
  );
}
