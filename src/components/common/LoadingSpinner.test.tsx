import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("viser en status-rolle med standard-tekst", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toHaveTextContent("Laster …");
  });

  it("viser egendefinert tekst", () => {
    render(<LoadingSpinner label="Søker …" />);
    expect(screen.getByRole("status")).toHaveTextContent("Søker …");
  });
});
