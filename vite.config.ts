import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defaultExclude, defineConfig, type Plugin } from "vitest/config";

// Content-Security-Policy som <meta http-equiv>, injisert kun ved build
// (GitHub Pages støtter ikke egendefinerte HTTP-headere, se
// docs/architecture.md#robusthet-og-sikkerhet). `apply: "build"` sikrer at
// dette ikke kjører i dev-modus, der Vites dev-server injiserer CSS via
// inline <style>-tagger for HMR (live-reload) — noe `style-src 'self'`
// uten `unsafe-inline` ville blokkert. Fase 1-9 gjør ingen ekte
// nettverkskall og laster ingen eksterne ressurser (MockMediaProvider er
// lokal, plakat-URL-ene i mock-dataene er ikke ekte); CSP-en er derfor
// låst til 'self'. Fase 10 utvider connect-src/img-src med OMDb-/
// MOTN-domenene når CompositeMediaProvider tas i bruk.
function cspMetaTagPlugin(): Plugin {
  return {
    name: "csp-meta-tag",
    apply: "build",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content:
              "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'",
          },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/watchlist/",
  plugins: [react(), tailwindcss(), cspMetaTagPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
    // Playwright-spec-ene i e2e/ matcher også `*.spec.ts` — uten denne
    // ekskluderingen forsøker Vitest å kjøre dem og feiler kryptisk.
    exclude: [...defaultExclude, "e2e/**"],
  },
});
