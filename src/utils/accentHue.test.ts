import { describe, expect, it } from "vitest";
import { accentHueClasses, accentHueFor } from "./accentHue";

const ALL_HUES = ["blue", "violet", "teal", "amber", "coral"] as const;

describe("accentHueFor", () => {
  it("er deterministisk for samme id", () => {
    expect(accentHueFor("tt0133093")).toBe(accentHueFor("tt0133093"));
    expect(accentHueFor("mock-movie-1")).toBe(accentHueFor("mock-movie-1"));
  });

  it("returnerer alltid én av de fem faste huene", () => {
    const ids = [
      "tt0133093",
      "mock-movie-1",
      "mock-series-1",
      "tt9999999",
      "",
      "a",
      "abcdefghijklmnopqrstuvwxyz",
    ];

    for (const id of ids) {
      expect(ALL_HUES).toContain(accentHueFor(id));
    }
  });

  it("gir (typisk) ulik hue for ulike id-er", () => {
    // Ikke et strengt krav (hash kan kollidere), men med fem bøtter og disse
    // konkrete id-ene forventes spredning, som en sanity-sjekk på at
    // hash-funksjonen faktisk varierer med input.
    const hues = new Set(
      ["tt0133093", "mock-movie-1", "mock-series-1", "tt9999999", "tt1"].map(
        accentHueFor,
      ),
    );
    expect(hues.size).toBeGreaterThan(1);
  });
});

describe("accentHueClasses", () => {
  it("gir Tailwind-klassenavn som samsvarer med accentHueFor", () => {
    const id = "tt0133093";
    const hue = accentHueFor(id);
    const classes = accentHueClasses(id);

    expect(classes.text).toBe(`text-hue-${hue}`);
    expect(classes.border).toBe(`border-hue-${hue}`);
    expect(classes.ring).toBe(`ring-hue-${hue}`);
    expect(classes.bg).toBe(`bg-hue-${hue}`);
  });
});
