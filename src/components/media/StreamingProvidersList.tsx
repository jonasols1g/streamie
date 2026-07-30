import type { StreamingAvailability, StreamingOffer } from "../../types/media";
import { accentHueClasses } from "../../utils/accentHue";
import { EmptyState } from "../common/EmptyState";

export interface StreamingProvidersListProps {
  streaming: StreamingAvailability | null;
}

type PaymentLabel = "Kjøp" | "Leie" | "Kjøp/leie";

interface ProviderGroup {
  /** Representant-tilbudet brukt for logo/navn/lenke. */
  offer: StreamingOffer;
  /**
   * `null` når tittelen er inkludert i abonnementet/gratis for tjenesten —
   * ellers hvilken ekstra betaling som kreves.
   */
  paymentLabel: PaymentLabel | null;
}

function isValidHttpsUrl(url: string | undefined): boolean {
  return url?.startsWith("https:") ?? false;
}

function paymentLabelFor(offers: StreamingOffer[]): PaymentLabel | null {
  const isIncludedInSubscription = offers.some(
    (offer) => offer.type === "subscription" || offer.type === "free",
  );
  if (isIncludedInSubscription) {
    return null;
  }

  const hasBuy = offers.some((offer) => offer.type === "buy");
  const hasRent = offers.some((offer) => offer.type === "rent");
  if (hasBuy && hasRent) {
    return "Kjøp/leie";
  }
  if (hasBuy) {
    return "Kjøp";
  }
  if (hasRent) {
    return "Leie";
  }
  return null;
}

/**
 * Grupperer `offers` per `providerId` — flere tilbudstyper
 * (abonnement/leie/kjøp/gratis) for samme tjeneste skal aldri gi flere badger
 * (se docs/design.md#detaljvisning). Representant-tilbudet (brukt for
 * logo/navn/lenke) er den første oppføringen med en gyldig `https:`-URL for
 * tjenesten, om noen finnes — ellers første oppføring — slik at
 * lenke-oppførselen beholdes uendret. `paymentLabel` beregnes fra *alle*
 * tjenestens tilbud, se `paymentLabelFor`.
 */
interface ProviderAccumulator {
  /** Første oppføring for tjenesten — brukt hvis ingen gyldig https-URL finnes. */
  firstOffer: StreamingOffer;
  allOffers: StreamingOffer[];
}

function groupOffersByProvider(offers: StreamingOffer[]): ProviderGroup[] {
  const offersByProviderId = new Map<string, ProviderAccumulator>();

  for (const offer of offers) {
    const existing = offersByProviderId.get(offer.providerId);
    if (existing === undefined) {
      offersByProviderId.set(offer.providerId, {
        firstOffer: offer,
        allOffers: [offer],
      });
    } else {
      existing.allOffers.push(offer);
    }
  }

  return Array.from(offersByProviderId.values()).map(
    ({ firstOffer, allOffers }) => ({
      offer:
        allOffers.find((offer) => isValidHttpsUrl(offer.url)) ?? firstOffer,
      paymentLabel: paymentLabelFor(allOffers),
    }),
  );
}

/**
 * Strømmetjenester som tilbyr tittelen (se docs/design.md#detaljvisning og
 * docs/design-spec/screenshots/03-detaljside.png). `streaming` er `null` når
 * tittelen ikke er tilgjengelig i regionen — det er en normaltilstand, ikke
 * en feil (se docs/architecture.md#compositemediaprovider), og behandles
 * likt med en tom `offers`-liste: begge viser samme tom-tilstand.
 *
 * Hver tjeneste (unikt per `providerId`) vises maks én gang, uavhengig av
 * hvor mange tilbudstyper (abonnement/leie/kjøp/gratis) den har for tittelen
 * — se `groupOffersByProvider`. Når tittelen er inkludert i
 * abonnementet/gratis hos tjenesten vises kun logoen (ingen synlig
 * navnetekst, ingen betalingslabel). Krever tittelen ekstra betaling hos
 * tjenesten, vises i tillegg en liten betalingslabel under logoen: «Kjøp»,
 * «Leie» eller «Kjøp/leie» (kun kjøp/leie tilgjengelig, ingen abonnement).
 * Mangler tjenesten `logoUrl`, vises tjenestenavnet som tekst i stedet for
 * logo (betalingslabel vises fortsatt ved behov).
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

  const providerGroups = groupOffersByProvider(offers);

  return (
    <ul className="flex flex-wrap gap-3">
      {providerGroups.map(({ offer, paymentLabel }) => {
        const hue = accentHueClasses(offer.providerId);
        const isValidLink = isValidHttpsUrl(offer.url);
        const content = (
          <div className="flex flex-col items-center gap-1">
            {offer.logoUrl !== undefined ? (
              <img
                src={offer.logoUrl}
                alt={offer.providerName}
                className="h-8 w-8 rounded object-contain"
              />
            ) : (
              <span className="text-text-primary font-semibold">
                {offer.providerName}
              </span>
            )}
            {paymentLabel !== null && (
              <span className="text-text-secondary text-xs">
                {paymentLabel}
              </span>
            )}
          </div>
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
