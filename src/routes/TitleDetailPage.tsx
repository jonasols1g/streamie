import type { AriaAttributes } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { GenreTags } from "../components/media/GenreTags";
import { PosterImage } from "../components/media/PosterImage";
import { RatingsBadge } from "../components/media/RatingsBadge";
import { StreamingProvidersList } from "../components/media/StreamingProvidersList";
import { WatchlistToggleButton } from "../components/watchlist/WatchlistToggleButton";
import { useMediaDetails } from "../hooks/useMediaDetails";
import type { Media, MediaType, SeriesMedia } from "../types/media";

const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  movie: "Film",
  series: "Serie",
};

const SERIES_STATUS_LABEL: Record<
  NonNullable<SeriesMedia["status"]>,
  string
> = {
  ongoing: "Pågår",
  ended: "Avsluttet",
  canceled: "Kansellert",
  unknown: "Ukjent status",
};

function buildMetaLine(media: Media): string {
  const parts: string[] = [MEDIA_TYPE_LABEL[media.mediaType]];

  if (media.releaseYear !== null) {
    parts.push(String(media.releaseYear));
  }

  if (media.mediaType === "movie") {
    if (media.runtimeMinutes !== null && media.runtimeMinutes !== undefined) {
      parts.push(`${media.runtimeMinutes} min`);
    }
  } else {
    if (media.numberOfSeasons !== null && media.numberOfSeasons !== undefined) {
      const label = media.numberOfSeasons === 1 ? "sesong" : "sesonger";
      parts.push(`${media.numberOfSeasons} ${label}`);
    }
    if (media.status !== undefined) {
      parts.push(SERIES_STATUS_LABEL[media.status]);
    }
  }

  return parts.join(" · ");
}

/**
 * Detaljside for én tittel (se docs/design.md#detaljvisning og
 * docs/design-spec/screenshots/03-detaljside.png). Rekkefølgen på feltene
 * følger dokumentasjonen: plakat/tittel, beskrivelse, sjangre, rating,
 * strømmetjenester, watchlist-toggle.
 *
 * Hero-bildet gjenbruker `posterUrl` (samme felt som søkeresultat-kortet) —
 * domenemodellen har ikke noe eget "backdrop"-felt (se
 * docs/data-model.md), så plakaten strekkes/beskjæres (`object-cover`) til
 * en full-bleed hero fremfor å legge til et nytt felt på `Media`.
 *
 * Meta-linjen (`buildMetaLine`) og statustekstene er uendret fra fase 6 —
 * `TitleDetailPage.test.tsx` treffer eksakt på disse strengene
 * (`/Film · 1972 · 167 min/` osv.), så kun styling er endret her, ikke
 * tekstformatet.
 */
export function TitleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status, media, errorCode, retry } = useMediaDetails(id);
  const navigate = useNavigate();

  if (id === undefined) {
    return <ErrorMessage code="not-found" />;
  }

  return (
    <section>
      {status === "loading" && <LoadingSpinner label="Laster tittel …" />}

      {status === "error" && errorCode !== null && (
        <ErrorMessage code={errorCode} onRetry={retry} />
      )}

      {status === "success" && media && (
        <article className="flex flex-col gap-6 pb-28">
          {/*
            Full-bleed hero: `-mx-4 -mt-4` kansellerer `p-4`-paddingen fra
            <main> i App.tsx (16px), slik at heroen fyller hele
            innholdsbredden edge-to-edge, iht. skjermbildet.
          */}
          <div className="relative -mx-4 -mt-4 h-[420px] w-[calc(100%+2rem)] overflow-hidden">
            <PosterImage
              posterUrl={media.posterUrl}
              title={media.title}
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
            />
            <button
              type="button"
              onClick={() => {
                void navigate(-1);
              }}
              aria-label="Tilbake"
              className="bg-surface/80 text-text-primary absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <BackArrowIcon aria-hidden="true" />
            </button>
            <h1 className="font-heading absolute bottom-4 left-4 text-3xl font-bold text-white">
              {media.title}
            </h1>
          </div>

          <div className="flex flex-col gap-6">
            {media.originalTitle !== undefined &&
              media.originalTitle !== media.title && (
                <p className="text-text-muted -mt-4 italic">
                  {media.originalTitle}
                </p>
              )}
            <p className="text-text-muted text-[13.5px]">
              {buildMetaLine(media)}
            </p>

            <RatingsBadge ratings={media.ratings} />

            <p className="text-text-primary text-[14.5px] leading-[1.55]">
              {media.overview}
            </p>

            <GenreTags genres={media.genres} />

            <div className="flex flex-col gap-3">
              <h2 className="font-heading font-bold">Tilgjengelig på</h2>
              <StreamingProvidersList streaming={media.streaming} />
            </div>
          </div>

          {/*
            CTA-en er fast plassert over bunn-fanebaren (78px, se
            components/layout/NavBar.tsx), med et nedtonende gradient bak
            for å skille den fra innholdet som scroller under (iht.
            skjermbildet).
          */}
          <div className="fixed inset-x-0 bottom-[78px] z-10 bg-gradient-to-t from-[oklch(0.13_0.03_60)] from-60% to-transparent pt-6">
            <div className="mx-auto max-w-5xl px-4 pb-4">
              <WatchlistToggleButton media={media} className="w-full" />
            </div>
          </div>
        </article>
      )}
    </section>
  );
}

function BackArrowIcon(props: {
  "aria-hidden"?: AriaAttributes["aria-hidden"];
}) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
