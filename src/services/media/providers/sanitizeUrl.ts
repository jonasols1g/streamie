/**
 * Validerer URL-er fra eksterne API-er (OMDb-plakater, MOTN-logoer/lenker):
 * kun `https:`-URL-er slippes gjennom, alt annet (inkl. `"N/A"`, tomme
 * strenger og f.eks. `javascript:`-URL-er) mappes til `null`. Se
 * docs/architecture.md#robusthet-og-sikkerhet.
 */
export function sanitizeHttpsUrl(
  value: string | null | undefined,
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "N/A"
  ) {
    return null;
  }
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}
