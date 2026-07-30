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

  it("viser samme providerId kun én gang selv med flere tilbudstyper", () => {
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
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "buy",
              url: "https://www.netflix.com/title/20557937",
            },
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "rent",
              url: "https://www.netflix.com/title/20557937",
            },
          ],
        })}
      />,
    );

    expect(screen.getAllByText("Netflix")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("dedupliserer på tvers av tjenester og beholder én badge per providerId", () => {
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
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "buy",
              url: "https://www.netflix.com/title/20557937",
            },
            {
              providerId: "hbo-max",
              providerName: "HBO Max",
              type: "subscription",
              url: "https://www.hbomax.com/no/title",
            },
          ],
        })}
      />,
    );

    expect(screen.getAllByText("Netflix")).toHaveLength(1);
    expect(screen.getAllByText("HBO Max")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("lenker ut når minst ett av flere tilbud for samme tjeneste har gyldig https-URL", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "rent",
              url: undefined,
            },
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "buy",
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
  });

  it("viser kun logo (med alt=providerName) når logoUrl finnes, ingen synlig navnetekst", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "netflix",
              providerName: "Netflix",
              logoUrl: "https://images.example.com/netflix.png",
              type: "subscription",
              url: "https://www.netflix.com/title/20557937",
            },
          ],
        })}
      />,
    );

    const image = screen.getByRole("img", { name: "Netflix" });
    expect(image).toHaveAttribute(
      "src",
      "https://images.example.com/netflix.png",
    );
    expect(image).not.toHaveAttribute("aria-hidden");
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
  });

  it("viser fortsatt tjenestenavn som tekst når logoUrl mangler", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "nrk-tv",
              providerName: "NRK TV",
              type: "free",
              url: "https://tv.nrk.no/title",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("NRK TV")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("viser ingen betalingslabel når tittelen kun er tilgjengelig via abonnement", () => {
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

    expect(screen.queryByText("Kjøp")).not.toBeInTheDocument();
    expect(screen.queryByText("Leie")).not.toBeInTheDocument();
    expect(screen.queryByText("Kjøp/leie")).not.toBeInTheDocument();
  });

  it("viser «Kjøp» når tjenesten kun tilbyr kjøp", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "google-play",
              providerName: "Google Play",
              type: "buy",
              url: "https://play.google.com/title",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Kjøp")).toBeInTheDocument();
  });

  it("viser «Leie» når tjenesten kun tilbyr leie", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "google-play",
              providerName: "Google Play",
              type: "rent",
              url: "https://play.google.com/title",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Leie")).toBeInTheDocument();
  });

  it("viser «Kjøp/leie» når tjenesten tilbyr både kjøp og leie, uten abonnement", () => {
    render(
      <StreamingProvidersList
        streaming={createStreamingAvailability({
          offers: [
            {
              providerId: "google-play",
              providerName: "Google Play",
              type: "buy",
              url: "https://play.google.com/title",
            },
            {
              providerId: "google-play",
              providerName: "Google Play",
              type: "rent",
              url: "https://play.google.com/title",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Kjøp/leie")).toBeInTheDocument();
  });

  it("viser ingen betalingslabel når abonnement finnes sammen med kjøp/leie for samme tjeneste", () => {
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
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "buy",
              url: "https://www.netflix.com/title/20557937",
            },
            {
              providerId: "netflix",
              providerName: "Netflix",
              type: "rent",
              url: "https://www.netflix.com/title/20557937",
            },
          ],
        })}
      />,
    );

    expect(screen.queryByText("Kjøp")).not.toBeInTheDocument();
    expect(screen.queryByText("Leie")).not.toBeInTheDocument();
    expect(screen.queryByText("Kjøp/leie")).not.toBeInTheDocument();
  });
});
