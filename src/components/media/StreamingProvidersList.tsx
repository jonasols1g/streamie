import type { StreamingAvailability, StreamingOffer } from "../../types/media";
import { accentHueClasses } from "../../utils/accentHue";
import { EmptyState } from "../common/EmptyState";

export interface StreamingProvidersListProps {
  streaming: StreamingAvailability | null;
}

const OFFER_TYPE_LABEL: Record<StreamingOffer["type"], string> = {
  subscription: "Abonnement",
  rent: "Leie",
  buy: "Kjøp",
  free: "Gratis",
};

/**
 * Strømmetjenester som tilbyr tittelen (se docs/design.md#detaljvisning og
 * docs/design-spec/screenshots/03-detaljside.png: tekst-only badger med
 * distinkt hue-tonet kant per tjeneste). `streaming` er `null` når tittelen
 * ikke er tilgjengelig i regionen — det er en normaltilstand, ikke en feil
 * (se docs/architecture.md#compositemediaprovider), og behandles likt med en
 * tom `offers`-liste: begge viser samme tom-tilstand.
 *
 * Hue-en per tjeneste kommer fra samme `accentHueFor` som per-tittel-huene
 * (her hasjet på `providerId` i stedet for en tittel-id) — samme
 * deterministiske, rene UI-lags-mekanisme, ingen ny modell-kobling.
 *
 * Lenker åpnes i ny fane med `rel="noopener noreferrer"`. Kun `https:`-URL-er
 * rendres som lenke — resten vises som ren tekst (se
 * docs/architecture.md#robusthet-og-sikkerhet).
 */
export function StreamingProvidersList({
  streaming,
}: StreamingProvidersListProps) {
  const offers = streaming?.offers ?? [];

  if (offers.length === 0) {
    return (
      <EmptyState message="Ingen strømmetjenester funnet for din region" />
    );
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {offers.map((offer) => {
        const hue = accentHueClasses(offer.providerId);
        const isValidLink = offer.url?.startsWith("https:") ?? false;
        const content = (
          <>
            {offer.logoUrl !== undefined && (
              <img
                src={offer.logoUrl}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 rounded object-contain"
              />
            )}
            <span className="text-text-primary font-semibold">
              {offer.providerName}
            </span>
            <span className="text-text-muted text-sm">
              {OFFER_TYPE_LABEL[offer.type]}
            </span>
          </>
        );
        const badgeClassName = `bg-surface flex items-center gap-2 rounded-xl border px-3 py-2 transition ${hue.border}`;

        return (
          <li key={`${offer.providerId}-${offer.type}`}>
            {isValidLink ? (
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${badgeClassName} hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              >
                {content}
              </a>
            ) : (
              <div className={badgeClassName}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
