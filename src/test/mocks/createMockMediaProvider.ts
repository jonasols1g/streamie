import { vi } from "vitest";
import type { MediaProvider } from "../../services/media/MediaProvider";
import { createMovieMedia } from "../fixtures/media.fixtures";

/**
 * Testdobbel for `MediaProvider` til komponent-/hook-tester: alle metoder er
 * `vi.fn()`-stubber med ufarlige defaults. Overstyr per test etter behov, f.eks.
 * `createMockMediaProvider({ search: vi.fn().mockRejectedValue(...) })`.
 */
export function createMockMediaProvider(
  overrides: Partial<MediaProvider> = {},
): MediaProvider {
  return {
    id: "mock",
    search: vi.fn<MediaProvider["search"]>().mockResolvedValue([]),
    getDetails: vi
      .fn<MediaProvider["getDetails"]>()
      .mockResolvedValue(createMovieMedia()),
    ...overrides,
  };
}
