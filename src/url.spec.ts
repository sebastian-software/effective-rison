import { describe, it, expect } from "vitest";
import { compressToUrl, decompressFromUrl } from "./url";

describe("URL compression", () => {
  it("round-trips objects via compress/decompress", async () => {
    const value = { any: "json", yes: true, arr: [1, 2, 3] } as const;
    const compressed = await compressToUrl(value as any);
    expect(typeof compressed).toBe("string");
    const roundTripped = await decompressFromUrl(compressed);
    expect(roundTripped).toEqual(value);
  });
});
