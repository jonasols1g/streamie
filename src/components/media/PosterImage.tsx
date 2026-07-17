export interface PosterImageProps {
  posterUrl: string | null;
  title: string;
  className?: string;
}

/**
 * Delt plakatvisning for søkeresultat-kort og detaljside (se
 * docs/design.md#visning-av-søkeresultater og #detaljvisning): viser en
 * generisk placeholder når `posterUrl` er `null` fremfor et ødelagt bilde.
 */
export function PosterImage({ posterUrl, title, className }: PosterImageProps) {
  if (posterUrl === null) {
    return (
      <div
        role="img"
        aria-label={`Ingen plakat tilgjengelig for ${title}`}
        className={`flex items-center justify-center bg-slate-200 text-center text-sm text-slate-500 ${className ?? ""}`}
      >
        Ingen plakat
      </div>
    );
  }

  return (
    <img
      src={posterUrl}
      alt={`Plakat for ${title}`}
      className={className}
      loading="lazy"
    />
  );
}
