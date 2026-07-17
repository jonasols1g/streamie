import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PosterImage } from "./PosterImage";

describe("PosterImage", () => {
  it("viser bildet når posterUrl er satt", () => {
    render(
      <PosterImage
        posterUrl="https://images.example.com/posters/the-matrix.jpg"
        title="The Matrix"
      />,
    );

    const img = screen.getByRole("img", { name: "Plakat for The Matrix" });
    expect(img).toHaveAttribute(
      "src",
      "https://images.example.com/posters/the-matrix.jpg",
    );
  });

  it("viser en placeholder når posterUrl er null", () => {
    render(<PosterImage posterUrl={null} title="Solaris" />);

    expect(
      screen.getByRole("img", {
        name: "Ingen plakat tilgjengelig for Solaris",
      }),
    ).toBeInTheDocument();
  });
});
