import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { createMediaSummary } from "../../test/fixtures/media.fixtures";
import { SearchResultsGrid } from "./SearchResultsGrid";

describe("SearchResultsGrid", () => {
  it("viser ett kort per treff", () => {
    const results = [
      createMediaSummary({ id: "mock-movie-1", title: "The Matrix" }),
      createMediaSummary({ id: "mock-movie-2", title: "Solaris" }),
    ];

    render(
      <MemoryRouter>
        <SearchResultsGrid results={results} />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("The Matrix")).toBeInTheDocument();
    expect(screen.getByText("Solaris")).toBeInTheDocument();
  });

  it("viser en tom liste uten treff", () => {
    render(
      <MemoryRouter>
        <SearchResultsGrid results={[]} />
      </MemoryRouter>,
    );

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
