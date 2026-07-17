import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorMessage } from "./ErrorMessage";

describe("ErrorMessage", () => {
  it.each([
    [
      "network",
      "Kunne ikke kontakte tjenesten — sjekk nettverket og prøv igjen",
    ],
    ["rate-limit", "For mange forespørsler — vent litt og prøv igjen"],
    ["not-found", "Fant ikke tittelen"],
    ["invalid-response", "Noe gikk galt — prøv igjen"],
    ["unknown", "Noe gikk galt — prøv igjen"],
  ] as const)("viser riktig tekst for kode %s", (code, expected) => {
    render(<ErrorMessage code={code} />);
    expect(screen.getByRole("alert")).toHaveTextContent(expected);
  });

  it("viser en «prøv igjen»-knapp for gjentakbare feil når onRetry er satt", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorMessage code="network" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Prøv igjen" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("viser ikke «prøv igjen» for not-found selv om onRetry er satt", () => {
    render(<ErrorMessage code="not-found" onRetry={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "Prøv igjen" }),
    ).not.toBeInTheDocument();
  });

  it("viser ikke «prøv igjen» når onRetry ikke er satt", () => {
    render(<ErrorMessage code="network" />);
    expect(
      screen.queryByRole("button", { name: "Prøv igjen" }),
    ).not.toBeInTheDocument();
  });
});
