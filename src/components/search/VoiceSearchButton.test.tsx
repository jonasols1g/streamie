import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSpeechErrorEvent,
  createSpeechResultEvent,
  installFakeSpeechRecognition,
  uninstallFakeSpeechRecognition,
} from "../../test/mocks/createFakeSpeechRecognition";
import { VoiceSearchButton } from "./VoiceSearchButton";

afterEach(() => {
  uninstallFakeSpeechRecognition();
});

describe("VoiceSearchButton — nettleser uten støtte", () => {
  it("viser en deaktivert knapp med forklarende tekst, og tekstsøk er upåvirket", () => {
    const onResult = vi.fn();
    render(<VoiceSearchButton onResult={onResult} />);

    const button = screen.getByRole("button", {
      name: "Talesøk støttes ikke i denne nettleseren",
    });
    expect(button).toBeDisabled();
  });
});

describe("VoiceSearchButton — nettleser med støtte", () => {
  it("starter lytting ved klikk og viser en pulserende tilstand", async () => {
    installFakeSpeechRecognition();
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<VoiceSearchButton onResult={onResult} />);

    const button = screen.getByRole("button", { name: "Start talesøk" });
    await user.click(button);

    expect(
      screen.getByRole("button", { name: "Stopp talesøk" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("sender det endelige transkripsjonsresultatet til onResult", async () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<VoiceSearchButton onResult={onResult} />);

    await user.click(screen.getByRole("button", { name: "Start talesøk" }));
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      instance.onresult?.(createSpeechResultEvent("the matrix", true));
    });

    expect(onResult).toHaveBeenCalledExactlyOnceWith("the matrix");
  });

  it("viser en ikke-blokkerende feilmelding ved feil fra talegjenkjenningen", async () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<VoiceSearchButton onResult={onResult} />);

    await user.click(screen.getByRole("button", { name: "Start talesøk" }));
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      // I ekte nettlesere følges en feil normalt av at gjenkjenningen
      // avsluttes.
      instance.onerror?.(createSpeechErrorEvent("no-speech"));
      instance.onend?.();
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingen tale oppdaget",
    );
    // Knappen er fortsatt der og brukbar — feilen blokkerer ikke søkefeltet.
    expect(
      screen.getByRole("button", { name: "Start talesøk" }),
    ).toBeInTheDocument();
  });
});
