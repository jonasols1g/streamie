export type AccentHue = "blue" | "violet" | "teal" | "amber" | "coral";

export interface AccentHueClasses {
  /** Tailwind-tekstfarge for meta-linjer i tittelens hue. */
  text: string;
  /** Tailwind-kantfarge for hue-tonet ring/border rundt plakat. */
  border: string;
  /** Tailwind ring-farge (fokus/utheving) i tittelens hue. */
  ring: string;
  /** Tailwind bakgrunnsfarge (fylt) for stjerne-badge i tittelens hue. */
  bg: string;
}

// De fem faste per-tittel-huene fra design-spec-en (se
// docs/design-spec/README.md#design-tokens og
// docs/design.md#visuelt-tema-cinefind-fase-11), definert som
// `--color-hue-*`-tokens i src/index.css.
const HUES: readonly AccentHue[] = ["blue", "violet", "teal", "amber", "coral"];

// Klassenavnene skrives ut literalt (ikke sammensatt av en streng-mal) slik
// at Tailwinds klasseskanner finner dem statisk i kildekoden, selv om selve
// *valget* av hue for en gitt tittel skjer dynamisk her.
const HUE_CLASSES: Record<AccentHue, AccentHueClasses> = {
  blue: {
    text: "text-hue-blue",
    border: "border-hue-blue",
    ring: "ring-hue-blue",
    bg: "bg-hue-blue",
  },
  violet: {
    text: "text-hue-violet",
    border: "border-hue-violet",
    ring: "ring-hue-violet",
    bg: "bg-hue-violet",
  },
  teal: {
    text: "text-hue-teal",
    border: "border-hue-teal",
    ring: "ring-hue-teal",
    bg: "bg-hue-teal",
  },
  amber: {
    text: "text-hue-amber",
    border: "border-hue-amber",
    ring: "ring-hue-amber",
    bg: "bg-hue-amber",
  },
  coral: {
    text: "text-hue-coral",
    border: "border-hue-coral",
    ring: "ring-hue-coral",
    bg: "bg-hue-coral",
  },
};

/**
 * Deterministisk (hash-basert) mapping fra en tittels `id` (IMDb-ID, se
 * docs/data-model.md) til én av de fem faste per-tittel-hue-verdiene.
 *
 * Dette er et rent UI-lags-anliggende — *ikke* et nytt felt på
 * `Media`/`MediaSummary` — nettopp for å holde `MediaProvider`-kontrakten
 * uendret foran fase 10 (verken OMDb- eller MOTN-mapping trenger å levere en
 * hue), se docs/design.md#visuelt-tema-cinefind-fase-11.
 */
export function accentHueFor(id: string): AccentHue {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  const hueIndex = Math.abs(hash) % HUES.length;
  // `hueIndex` er alltid innenfor [0, HUES.length): trygg med
  // `noUncheckedIndexedAccess`, men vi faller likevel tilbake til "blue" for
  // å holde returtypen `AccentHue` uten en ikke-null-assertion.
  return HUES[hueIndex] ?? "blue";
}

/** Ferdige Tailwind-klassenavn for hue-en en gitt `id` hasher til. */
export function accentHueClasses(id: string): AccentHueClasses {
  return HUE_CLASSES[accentHueFor(id)];
}
