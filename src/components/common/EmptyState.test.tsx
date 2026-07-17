import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("viser meldingen", () => {
    render(<EmptyState message="Ingen treff. Prøv et annet søk." />);
    expect(
      screen.getByText("Ingen treff. Prøv et annet søk."),
    ).toBeInTheDocument();
  });

  it("viser en valgfri handling", () => {
    render(
      <EmptyState message="Tom liste" action={<button>Gå til søk</button>} />,
    );
    expect(
      screen.getByRole("button", { name: "Gå til søk" }),
    ).toBeInTheDocument();
  });
});
