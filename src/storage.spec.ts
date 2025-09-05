import { describe, it, expect } from "vitest";
import { compressForStorage, decompressFromStorage } from "./storage";

describe("Storage compression", () => {
  it("round-trips objects via compress/decompress (base64)", async () => {
    const value = { any: "json", yes: true, arr: [1, 2, 3] } as const;
    const compressed = await compressForStorage(value as any, { encoding: "base64" });
    expect(typeof compressed).toBe("string");
    const roundTripped = await decompressFromStorage(compressed, { encoding: "base64" });
    expect(roundTripped).toEqual(value);
  });

  it("round-trips objects via compress/decompress (base32768)", async () => {
    const value = { any: "json", yes: true, arr: [1, 2, 3] } as const;
    const compressed = await compressForStorage(value as any, { encoding: "base32768" });
    expect(typeof compressed).toBe("string");
    // Expect wide-chars (non-ASCII) often present with base32768
    const roundTripped = await decompressFromStorage(compressed, { encoding: "base32768" });
    expect(roundTripped).toEqual(value);
  });
});
