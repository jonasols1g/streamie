/**
 * Attribusjon vist på alle sider (se docs/design.md#attribusjon). Movie of
 * the Nights vilkår **krever** synlig kreditering — ikke valgfritt pynt,
 * men en betingelse for å bruke APIet (også på gratisplanen). OMDb stiller
 * ikke samme krav, men krediteres her for ryddighets skyld.
 *
 * Rendres innerst i `<main>` (etter `<Routes>`) i `App.tsx` — `<main>`s egen
 * `pb-[94px]` holder både denne og resten av sideinnholdet unna den faste
 * bunn-fanebaren (`NavBar`, 78px), så komponenten trenger ingen egen
 * bunn-padding.
 */
export function Footer() {
  return (
    <footer className="text-text-muted mx-auto max-w-5xl px-4 pt-8 text-center text-xs">
      <p>
        Filmdata fra{" "}
        <a
          href="https://www.omdbapi.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          OMDb API
        </a>
        . Streaming Availability API by{" "}
        <a
          href="https://www.movieofthenight.com/about/api"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Movie of the Night
        </a>
        .
      </p>
    </footer>
  );
}
