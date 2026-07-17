import { useState } from "react";

export interface PosterImageProps {
  posterUrl: string | null;
  title: string;
  className?: string;
}

/**
 * Delt plakatvisning for søkeresultat-kort og detaljside (se
 * docs/design.md#visning-av-søkeresultater og #detaljvisning): viser en
 * generisk placeholder når `posterUrl` er `null` fremfor et ødelagt bilde.
 *
 * Samme placeholder vises også når en ikke-null `posterUrl` faktisk feiler å
 * laste (nettverksfeil, 404, CSP-blokkering av et domene som ikke er
 * hvitelistet i `img-src`, o.l., se docs/architecture.md#robusthet-og-sikkerhet)
 * — et ødelagt bilde-ikon er nettopp den typen ubehandlede tilstand
 * docs/dev-tasks.md fase 9 sier ikke skal forekomme.
 */
export function PosterImage({ posterUrl, title, className }: PosterImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Prop endrer seg (ny tittel) → en tidligere feilet URL skal ikke lenger
  // gjelde. Justeres synkront under rendering, ikke i en effekt — se
  // React sin anbefalte teknikk i src/hooks/useMediaDetails.ts.
  const [seenUrl, setSeenUrl] = useState(posterUrl);
  if (posterUrl !== seenUrl) {
    setSeenUrl(posterUrl);
    setFailedUrl(null);
  }

  if (posterUrl === null || posterUrl === failedUrl) {
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
      onError={() => {
        setFailedUrl(posterUrl);
      }}
    />
  );
}
