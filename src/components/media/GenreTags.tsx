export interface GenreTagsProps {
  genres: string[];
}

/**
 * Sjangre for en tittel (se docs/design.md#detaljvisning), vist som en rekke
 * med tagger. `genres` er aldri `null` i domenemodellen, men kan i praksis
 * være en tom liste — da rendres ingenting.
 */
export function GenreTags({ genres }: GenreTagsProps) {
  if (genres.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Sjangre">
      {genres.map((genre) => (
        <li
          key={genre}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
        >
          {genre}
        </li>
      ))}
    </ul>
  );
}
