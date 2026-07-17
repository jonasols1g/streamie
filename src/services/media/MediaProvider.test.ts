import { describe, expect, it } from "vitest";
import { MediaProviderError } from "./MediaProvider";

describe("MediaProviderError", () => {
  it("exposes message, code and cause, and is an Error instance", () => {
    const cause = new Error("underlying failure");
    const error = new MediaProviderError("Search failed", "network", cause);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MediaProviderError);
    expect(error.name).toBe("MediaProviderError");
    expect(error.message).toBe("Search failed");
    expect(error.code).toBe("network");
    expect(error.cause).toBe(cause);
  });

  it("leaves cause undefined when not provided", () => {
    const error = new MediaProviderError("Not found", "not-found");

    expect(error.code).toBe("not-found");
    expect(error.cause).toBeUndefined();
  });
});
