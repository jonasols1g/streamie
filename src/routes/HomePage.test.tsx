import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  MediaProviderError,
  type MediaProvider,
} from "../services/media/MediaProvider";
import { createMediaSummary } from "../test/fixtures/media.fixtures";
import { createMockMediaProvider } from "../test/mocks/createMockMediaProvider";
import { renderWithProviders } from "../test/testUtils";
import { HomePage } from "./HomePage";

async function submitSearch(query: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Søk etter film eller serie"), query);
  await user.click(screen.getByRole("button", { name: "Søk" }));
}

describe("HomePage", () => {
  it("viser resultater etter et vellykket søk", async () => {
    const summary = createMediaSummary({ title: "The Matrix" });
    const provider = createMockMediaProvider({
      search: vi.fn<MediaProvider["search"]>().mockResolvedValue([summary]),
    });
    renderWithProviders(<HomePage />, { provider });

    await submitSearch("matrix");

    expect(await screen.findByText("The Matrix")).toBeInTheDocument();
  });

  it("viser tom-tilstand ved søk uten treff", async () => {
    const provider = createMockMediaProvider({
      search: vi.fn<MediaProvider["search"]>().mockResolvedValue([]),
    });
    renderWithProviders(<HomePage />, { provider });

    await submitSearch("finnes-ikke-i-katalogen");

    expect(
      await screen.findByText("Ingen treff. Prøv et annet søk."),
    ).toBeInTheDocument();
  });

  it("viser feilmelding med «prøv igjen» ved en MediaProviderError, og prøver på nytt", async () => {
    const summary = createMediaSummary({ title: "The Matrix" });
    const search = vi
      .fn<MediaProvider["search"]>()
      .mockRejectedValueOnce(new MediaProviderError("Nede", "network"))
      .mockResolvedValueOnce([summary]);
    const provider = createMockMediaProvider({ search });
    renderWithProviders(<HomePage />, { provider });

    await submitSearch("matrix");

    expect(
      await screen.findByText(
        "Kunne ikke kontakte tjenesten — sjekk nettverket og prøv igjen",
      ),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Prøv igjen" }));

    expect(await screen.findByText("The Matrix")).toBeInTheDocument();
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("viser en lasteindikator mens søket pågår", async () => {
    let resolveSearch:
      ((value: ReturnType<typeof createMediaSummary>[]) => void) | undefined;
    const search = vi.fn<MediaProvider["search"]>().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    const provider = createMockMediaProvider({ search });
    renderWithProviders(<HomePage />, { provider });

    await submitSearch("matrix");

    expect(screen.getByRole("status")).toHaveTextContent("Søker …");

    resolveSearch?.([]);
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
