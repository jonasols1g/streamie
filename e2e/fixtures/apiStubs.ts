import type { Page, Route } from "@playwright/test";

/**
 * OMDb-/MOTN-formede stub-responser for E2E (fase 10, se
 * docs/architecture.md#teststrategi og docs/dev-tasks.md). `page.route()`
 * avskjærer alle kall til de to APIene — ingen ekte nettverkskall gjøres
 * noensinne fra E2E-suiten (MOTNs kvote på 100/døgn ville ellers vært tømt
 * av CI alene, se docs/architecture.md#teststrategi).
 *
 * IDene under gjenbruker de gamle mock-IDene (`"mock-movie-1"` osv.) som
 * verdier i `imdbID`-feltet i stub-JSON-en — feltet er bare en streng vi
 * kontrollerer selv, så de eksisterende spec-ene fra fase 5/7/9
 * (`search.spec.ts`, `watchlist.spec.ts`, `deep-links.spec.ts`), som
 * asserter på nøyaktig disse ID-ene/titlene, fortsetter å stemme uendret
 * selv om appen nå kjører mot `CompositeMediaProvider` i stedet for
 * `MockMediaProvider`. Det er nettopp poenget: det beviser at
 * `MediaProvider`-abstraksjonen holder på tvers av datakilde.
 */

export const THE_MATRIX_ID = "mock-movie-1";
export const NO_RT_SCORE_ID = "mock-movie-2";

const omdbSearchSuccess = {
  Response: "True",
  Search: [
    {
      Title: "The Matrix",
      Year: "1999",
      imdbID: THE_MATRIX_ID,
      Type: "movie",
      Poster: "https://images.example.com/posters/the-matrix.jpg",
    },
  ],
};

const omdbSearchNoHits = {
  Response: "False",
  Error: "Movie not found!",
};

const omdbDetailsTheMatrix = {
  Response: "True",
  Title: "The Matrix",
  Year: "1999",
  Type: "movie",
  Poster: "https://images.example.com/posters/the-matrix.jpg",
  Plot: "A computer hacker learns from mysterious rebels about the true nature of his reality.",
  Genre: "Action, Sci-Fi",
  Runtime: "136 min",
  imdbRating: "8.7",
  imdbID: THE_MATRIX_ID,
  Ratings: [
    { Source: "Internet Movie Database", Value: "8.7/10" },
    { Source: "Rotten Tomatoes", Value: "83%" },
  ],
};

// Bevisst uten Rotten Tomatoes-oppføring i `Ratings` — dekker
// docs/dev-tasks.md fase 10s E2E-krav om at manglende RT-score viser
// «Ikke tilgjengelig».
const omdbDetailsWithoutRottenTomatoesScore = {
  Response: "True",
  Title: "Solaris",
  Year: "1972",
  Type: "movie",
  Poster: "N/A",
  Plot: "A psychologist is sent to a space station orbiting a mysterious ocean planet.",
  Genre: "Drama, Mystery, Sci-Fi",
  Runtime: "167 min",
  imdbRating: "8.0",
  imdbID: NO_RT_SCORE_ID,
  Ratings: [{ Source: "Internet Movie Database", Value: "8.0/10" }],
};

const omdbDetailsNotFound = {
  Response: "False",
  Error: "Incorrect IMDb ID.",
};

async function fulfillOmdbRoute(route: Route): Promise<void> {
  const params = new URL(route.request().url()).searchParams;

  if (params.has("s")) {
    const query = (params.get("s") ?? "").toLowerCase();
    await route.fulfill({
      json: query.includes("matrix") ? omdbSearchSuccess : omdbSearchNoHits,
    });
    return;
  }

  if (params.has("i")) {
    const id = params.get("i");
    if (id === THE_MATRIX_ID) {
      await route.fulfill({ json: omdbDetailsTheMatrix });
    } else if (id === NO_RT_SCORE_ID) {
      await route.fulfill({ json: omdbDetailsWithoutRottenTomatoesScore });
    } else {
      await route.fulfill({ json: omdbDetailsNotFound });
    }
    return;
  }

  await route.fulfill({ json: omdbSearchNoHits });
}

/**
 * Standard-stubbing: OMDb svarer iht. `fulfillOmdbRoute` over, MOTN svarer
 * 404 for alle titler (en normaltilstand — se
 * docs/architecture.md#compositemediaprovider — som degraderes til
 * `streaming: null`/tom-tilstand, ikke en feil).
 */
export async function registerApiStubs(page: Page): Promise<void> {
  await page.route("**/www.omdbapi.com/**", fulfillOmdbRoute);
  await page.route("**/api.movieofthenight.com/**", async (route) => {
    await route.fulfill({ status: 404 });
  });
}

/** Overstyrer OMDb-ruten til å svare 429 på alle kall (søk og detaljer). */
export async function registerOmdbRateLimitStub(page: Page): Promise<void> {
  await page.route("**/www.omdbapi.com/**", async (route) => {
    await route.fulfill({ status: 429 });
  });
}
