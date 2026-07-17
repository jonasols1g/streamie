import { describe, expect, it, vi } from "vitest";
import type { MediaProvider } from "../../services/media/MediaProvider";
import { createMovieMedia } from "../fixtures/media.fixtures";
import { createMockMediaProvider } from "./createMockMediaProvider";

describe("createMockMediaProvider", () => {
  it("returns a MediaProvider with harmless defaults", async () => {
    const provider = createMockMediaProvider();

    expect(provider.id).toBe("mock");
    await expect(provider.search("anything")).resolves.toEqual([]);
    const details = await provider.getDetails("mock-movie-1");
    expect(details.mediaType).toBe("movie");
  });

  it("applies overrides per test", async () => {
    const media = createMovieMedia({ id: "custom-id" });
    const getDetails = vi
      .fn<MediaProvider["getDetails"]>()
      .mockResolvedValue(media);

    const provider = createMockMediaProvider({ getDetails });

    await expect(provider.getDetails("custom-id")).resolves.toBe(media);
    expect(getDetails).toHaveBeenCalledWith("custom-id");
  });
});
