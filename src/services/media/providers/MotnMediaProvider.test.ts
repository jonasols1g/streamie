import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotnMediaProvider } from "./MotnMediaProvider";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("MotnMediaProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let provider: MotnMediaProvider;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    provider = new MotnMediaProvider({ apiKey: "test-key" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sender X-API-Key-header og country=no mot /shows/{id}", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ streamingOptions: {} }));

    await provider.getStreaming("tt0133093");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/shows/tt0133093");
    expect(url).toContain("country=no");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe(
      "test-key",
    );
  });

  it("mapper streamingOptions for landet til StreamingAvailability", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        streamingOptions: {
          no: [
            {
              service: {
                id: "netflix",
                name: "Netflix",
                imageSet: {
                  lightThemeImage: "https://images.example.com/netflix.png",
                },
              },
              type: "subscription",
              link: "https://www.netflix.com/title/20557937",
            },
          ],
        },
      }),
    );

    const streaming = await provider.getStreaming("tt0133093");

    expect(streaming?.region).toBe("NO");
    expect(streaming?.offers).toEqual([
      {
        providerId: "netflix",
        providerName: "Netflix",
        logoUrl: "https://images.example.com/netflix.png",
        type: "subscription",
        url: "https://www.netflix.com/title/20557937",
      },
    ]);
    expect(typeof streaming?.lastUpdated).toBe("string");
  });

  it("returnerer tom offers-liste (ikke null) når landet mangler i streamingOptions", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ streamingOptions: { us: [] } }));

    const streaming = await provider.getStreaming("tt0133093");

    expect(streaming).not.toBeNull();
    expect(streaming?.offers).toEqual([]);
  });

  it("returnerer null (kaster ikke) ved 404", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(provider.getStreaming("tt9999999")).resolves.toBeNull();
  });

  it("forkaster ikke-https lenker/logoer", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        streamingOptions: {
          no: [
            {
              service: {
                id: "netflix",
                name: "Netflix",
                imageSet: { lightThemeImage: "javascript:alert(1)" },
              },
              type: "subscription",
              link: "javascript:alert(1)",
            },
          ],
        },
      }),
    );

    const streaming = await provider.getStreaming("tt0133093");

    expect(streaming?.offers[0]?.logoUrl).toBeUndefined();
    expect(streaming?.offers[0]?.url).toBeUndefined();
  });

  it("mapper 429 til MediaProviderError('rate-limit')", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));

    await expect(provider.getStreaming("tt0133093")).rejects.toMatchObject({
      code: "rate-limit",
    });
  });

  it("mapper 401 til MediaProviderError('unknown')", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(provider.getStreaming("tt0133093")).rejects.toMatchObject({
      code: "unknown",
    });
  });

  it("mapper nettverksfeil til MediaProviderError('network')", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(provider.getStreaming("tt0133093")).rejects.toMatchObject({
      code: "network",
    });
  });

  it("mapper uventet svarform til MediaProviderError('invalid-response')", async () => {
    fetchMock.mockResolvedValue(jsonResponse("dette er ikke et objekt"));

    await expect(provider.getStreaming("tt0133093")).rejects.toMatchObject({
      code: "invalid-response",
    });
  });

  it("bruker konfigurert land i stedet for default 'no'", async () => {
    const seProvider = new MotnMediaProvider({
      apiKey: "test-key",
      country: "se",
    });
    fetchMock.mockResolvedValue(jsonResponse({ streamingOptions: { se: [] } }));

    const streaming = await seProvider.getStreaming("tt0133093");

    expect(streaming?.region).toBe("SE");
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("country=se");
  });
});
