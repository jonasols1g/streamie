import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RatingsBadge } from "./RatingsBadge";

describe("RatingsBadge", () => {
  it("viser IMDb- og Rotten Tomatoes-score når begge finnes", () => {
    render(
      <RatingsBadge ratings={{ imdbScore: 8.7, rottenTomatoesScore: 83 }} />,
    );

    expect(screen.getByText("8.7/10")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
  });

  it("viser «Ikke tilgjengelig» eksplisitt når Rotten Tomatoes-score mangler", () => {
    render(
      <RatingsBadge ratings={{ imdbScore: 8.0, rottenTomatoesScore: null }} />,
    );

    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("Ikke tilgjengelig")).toBeInTheDocument();
  });

  it("viser «Ikke tilgjengelig» for begge når begge mangler", () => {
    render(
      <RatingsBadge ratings={{ imdbScore: null, rottenTomatoesScore: null }} />,
    );

    expect(screen.getAllByText("Ikke tilgjengelig")).toHaveLength(2);
  });
});
