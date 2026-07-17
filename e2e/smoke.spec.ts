import { expect, test } from "@playwright/test";

// Triviell røyktest: verifiserer at produksjonsbygget serveres under
// /watchlist/-understien og at appen faktisk rendrer.
test("appen laster under /watchlist/-understien", async ({ page }) => {
  await page.goto("./");
  // NavBar (fase 11, CineFind-temaet) er en bunn-fanebar uten eget
  // logo-lenkeelement — "Søk"-fanen (lenke til "/") er den nærmeste
  // erstatningen for den gamle wordmark-lenken denne testen sjekket.
  await expect(page.getByRole("link", { name: "Søk" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Søk" })).toBeVisible();
});
