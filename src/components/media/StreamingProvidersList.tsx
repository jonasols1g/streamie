import type { StreamingAvailability, StreamingOffer } from "../../types/media";
import { accentHueClasses } from "../../utils/accentHue";
import { EmptyState } from "../common/EmptyState";

export interface StreamingProvidersListProps {
  streaming: StreamingAvailability | null;
}

function isValidHttpsUrl(url: string | undefined): boolean {
  return url?.startsWith("https:") ?? false;
}

/**
 * Slår sammen `offers` til én representant per `providerId` — flere
 * tilbudstyper (abonnement/leie/kjøp/gratis) for samme tjeneste skal aldri gi
 * flere badger (se docs/design.md#detaljvisning). Representanten er den
 * første oppføringen med en gyldig `https:`-URL for tjenesten, om noen finnes
 * — ellers første oppføring — slik at lenke-oppførselen beholdes uendret.
 */
function dedupeOffersByProvider(offers: StreamingOffer[]): StreamingOffer[] {
  const byProviderId = new Map<string, StreamingOffer>();

  for (const offer of offers) {
    const existing = byProviderId.get(offer.providerId);
    if (existing === undefined) {
      byProviderId.set(offer.providerId, offer);
      continue;
    }
    if (!isValidHttpsUrl(existing.url) && isValidHttpsUrl(offer.url)) {
      byProviderId.set(offer.providerId, offer);
    }
  }

  return Array.from(byProviderId.values());
}

/**
 * Strømmetjenester som tilbyr tittelen (se docs/design.md#detaljvisning og
 * docs/design-spec/screenshots/03-detaljside.png: tekst-only badger med
 * distinkt hue-tonet kant per tjeneste). `streaming` er `null` når tittelen
 * ikke er tilgjengelig i regionen — det er en normaltilstand, ikke en feil
 * (se docs/architecture.md#compositemediaprovider), og behandles likt med en
 * tom `offers`-liste: begge viser samme tom-tilstand.
 *
 * Hver tjeneste (unikt per `providerId`) vises maks én gang, uavhengig av
 * hvor mange tilbudstyper (abonnement/leie/kjøp/gratis) den har for tittelen
 * — se `dedupeOffersByProvider`.
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

  const uniqueOffers = dedupeOffersByProvider(offers);

  return (
    <ul className="flex flex-wrap gap-3">
      {uniqueOffers.map((offer) => {
        const hue = accentHueClasses(offer.providerId);
        const isValidLink = isValidHttpsUrl(offer.url);
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
          </>
        );
        const badgeClassName = `bg-surface flex items-center gap-2 rounded-xl border px-3 py-2 transition ${hue.border}`;

        return (
          <li key={offer.providerId}>
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
