import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("krediterer OMDb med lenke", () => {
    render(<Footer />);

    const omdbLink = screen.getByRole("link", { name: "OMDb API" });
    expect(omdbLink).toHaveAttribute("href", "https://www.omdbapi.com/");
    expect(omdbLink).toHaveAttribute("target", "_blank");
    expect(omdbLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("krediterer Movie of the Night med lenke, iht. MOTNs vilkår", () => {
    render(<Footer />);

    const motnLink = screen.getByRole("link", { name: "Movie of the Night" });
    expect(motnLink).toHaveAttribute(
      "href",
      "https://www.movieofthenight.com/about/api",
    );
    expect(motnLink).toHaveAttribute("target", "_blank");
    expect(motnLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(
      screen.getByText(/Streaming Availability API by/),
    ).toBeInTheDocument();
  });
});
