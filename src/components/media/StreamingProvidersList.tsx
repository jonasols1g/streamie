import type { StreamingAvailability, StreamingOffer } from "../../types/media";
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
 * Strømmetjenester som tilbyr tittelen (se docs/design.md#detaljvisning).
 * `streaming` er `null` når tittelen ikke er tilgjengelig i regionen — det
 * er en normaltilstand, ikke en feil (se
 * docs/architecture.md#compositemediaprovider), og behandles likt med en tom
 * `offers`-liste: begge viser samme tom-tilstand.
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
            <span className="font-medium">{offer.providerName}</span>
            <span className="text-sm text-slate-500">
              {OFFER_TYPE_LABEL[offer.type]}
            </span>
          </>
        );

        return (
          <li key={`${offer.providerId}-${offer.type}`}>
            {isValidLink ? (
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
              >
                {content}
              </a>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
