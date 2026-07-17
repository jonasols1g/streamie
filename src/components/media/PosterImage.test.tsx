import { fireEvent, render, screen } from "@testing-library/react";
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

  it("faller tilbake til placeholder når bildet feiler å laste (f.eks. CSP-blokkering, 404, DNS-feil)", () => {
    render(
      <PosterImage
        posterUrl="https://images.example.com/posters/the-matrix.jpg"
        title="The Matrix"
      />,
    );

    const img = screen.getByRole("img", { name: "Plakat for The Matrix" });
    fireEvent.error(img);

    expect(
      screen.getByRole("img", {
        name: "Ingen plakat tilgjengelig for The Matrix",
      }),
    ).toBeInTheDocument();
  });

  it("prøver på nytt med et ferskt bilde når posterUrl endrer seg etter en tidligere feilet lasting", () => {
    const { rerender } = render(
      <PosterImage
        posterUrl="https://images.example.com/posters/the-matrix.jpg"
        title="The Matrix"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Plakat for The Matrix" }));
    expect(
      screen.getByRole("img", {
        name: "Ingen plakat tilgjengelig for The Matrix",
      }),
    ).toBeInTheDocument();

    rerender(
      <PosterImage
        posterUrl="https://images.example.com/posters/severance.jpg"
        title="Severance"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Plakat for Severance" }),
    ).toBeInTheDocument();
  });
});
