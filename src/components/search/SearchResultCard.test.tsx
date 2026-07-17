import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { createMediaSummary } from "../../test/fixtures/media.fixtures";
import { SearchResultCard } from "./SearchResultCard";

describe("SearchResultCard", () => {
  it("viser tittel, år og type, og lenker til detaljsiden", () => {
    const media = createMediaSummary({
      id: "mock-movie-1",
      title: "The Matrix",
      releaseYear: 1999,
      mediaType: "movie",
    });

    render(
      <MemoryRouter>
        <SearchResultCard media={media} />
      </MemoryRouter>,
    );

    expect(screen.getByText("The Matrix")).toBeInTheDocument();
    expect(screen.getByText("1999 · Film")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/title/mock-movie-1",
    );
  });

  it("viser 'Ukjent år' når releaseYear er null, og 'Serie' for serier", () => {
    const media = createMediaSummary({
      id: "mock-series-1",
      title: "The Wire",
      releaseYear: null,
      mediaType: "series",
    });

    render(
      <MemoryRouter>
        <SearchResultCard media={media} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ukjent år · Serie")).toBeInTheDocument();
  });

  it("viser plakat-placeholder når posterUrl er null", () => {
    const media = createMediaSummary({ title: "Solaris", posterUrl: null });

    render(
      <MemoryRouter>
        <SearchResultCard media={media} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("img", {
        name: "Ingen plakat tilgjengelig for Solaris",
      }),
    ).toBeInTheDocument();
  });
});
