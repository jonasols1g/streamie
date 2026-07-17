import { expect, test } from "@playwright/test";

// Søk kjører mot MockMediaProvider (ingen nettverkskall å stubbe i fase 1–9,
// se docs/dev-tasks.md fase 5).
test.describe("Søk", () => {
  test("søk gir resultater, og klikk på et kort navigerer til detaljsiden", async ({
    page,
  }) => {
    await page.goto("./");

    await page.getByLabel("Søk etter film eller serie").fill("matrix");
    await page.getByRole("button", { name: "Søk" }).click();

    const card = page.getByRole("link", { name: /The Matrix/ });
    await expect(card).toBeVisible();

    await card.click();

    await expect(page).toHaveURL(/\/title\/mock-movie-1$/);
  });

  test("søk uten treff viser tom-tilstand", async ({ page }) => {
    await page.goto("./");

    await page
      .getByLabel("Søk etter film eller serie")
      .fill("finnes-ikke-i-katalogen");
    await page.getByRole("button", { name: "Søk" }).click();

    await expect(
      page.getByText("Ingen treff. Prøv et annet søk."),
    ).toBeVisible();
  });
});
