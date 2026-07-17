import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSpeechErrorEvent,
  createSpeechResultEvent,
  installFakeSpeechRecognition,
  uninstallFakeSpeechRecognition,
} from "../test/mocks/createFakeSpeechRecognition";
import { useSpeechRecognition } from "./useSpeechRecognition";

afterEach(() => {
  uninstallFakeSpeechRecognition();
});

describe("useSpeechRecognition — nettleser uten støtte", () => {
  it("rapporterer isSupported: false, og start() er en no-op", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isListening).toBe(false);

    act(() => {
      result.current.start();
    });

    expect(result.current.isListening).toBe(false);
    expect(onResult).not.toHaveBeenCalled();
  });
});

describe("useSpeechRecognition — nettleser med støtte", () => {
  it("bruker lang: 'en-US' og setter isListening: true når lytting starter", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    expect(result.current.isSupported).toBe(true);

    act(() => {
      result.current.start();
    });

    expect(result.current.isListening).toBe(true);
    expect(instances).toHaveLength(1);
    expect(instances[0]?.lang).toBe("en-US");
    expect(instances[0]?.start).toHaveBeenCalledOnce();
  });

  it("kaller onResult kun for et isFinal-resultat, ikke for et interim-resultat", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      instance.onresult?.(createSpeechResultEvent("the matrix", false));
    });
    expect(onResult).not.toHaveBeenCalled();

    act(() => {
      instance.onresult?.(createSpeechResultEvent("the matrix", true));
    });
    expect(onResult).toHaveBeenCalledExactlyOnceWith("the matrix");
  });

  it("setter isListening: false når gjenkjenningen avsluttes", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      instance.onend?.();
    });

    expect(result.current.isListening).toBe(false);
  });

  it("stop() kaller stop() på den underliggende instansen", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      result.current.stop();
    });

    expect(instance.stop).toHaveBeenCalledOnce();
  });

  it("viser en brukervennlig feilmelding ved 'not-allowed'", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      instance.onerror?.(createSpeechErrorEvent("not-allowed"));
    });

    expect(result.current.error).toBe("Mikrofontilgang ble avvist");
  });

  it("viser ikke en feilmelding ved 'aborted' (vår egen stop/abort)", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    act(() => {
      instance.onerror?.(createSpeechErrorEvent("aborted"));
    });

    expect(result.current.error).toBeNull();
  });

  it("avbryter en pågående lytting ved unmount", () => {
    const instances = installFakeSpeechRecognition();
    const onResult = vi.fn();
    const { result, unmount } = renderHook(() =>
      useSpeechRecognition({ onResult }),
    );

    act(() => {
      result.current.start();
    });
    const instance = instances[0];
    if (instance === undefined) throw new Error("forventet en instans");

    unmount();

    expect(instance.abort).toHaveBeenCalledOnce();
  });
});
