import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStreamingAvailability } from "../../test/fixtures/media.fixtures";
import { StreamingProvidersList } from "./StreamingProvidersList";

describe("StreamingProvidersList", () => {
  it("viser tom-tilstand når streaming er null", () => {
    render(<StreamingProvidersList streaming={null} />);

    expect(
      screen.getByText("Ingen strømmetjenester funnet for din region"),
    ).toBeInTheDocument();
  });

  it("viser tom-tilstand når offers er en tom liste", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({ offers: [] })}
      />,
    );

    expect(
      screen.getByText("Ingen strømmetjenester funnet for din region"),
    ).toBeInTheDocument();
  });

  it("viser hvert tilbud som en ekstern lenke for https-URL-er", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "subscription",
              url: "https://www.netflix.com/title/20557937",
            },
          ],
        })}
      />,
    );

    const link = screen.getByRole("link", { name: /Netflix/ });
    expect(link).toHaveAttribute(
      "href",
      "https://www.netflix.com/title/20557937",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Abonnement")).toBeInTheDocument();
  });

  it("viser tilbud uten (eller med ugyldig) URL som ren tekst, ikke som lenke", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "nrk-tv",
              providerName: "NRK TV",
              type: "free",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("NRK TV")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
