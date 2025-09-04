import { describe, it, expect } from "vitest";
import { decode } from "./rison";

describe("Rison error handling", () => {
  it("fails on invalid number", () => {
    expect(() => decode("-")).toThrow(/invalid number/i);
  });

  it("fails on unknown bang literal", () => {
    expect(() => decode("!x")).toThrow(/unknown literal/i);
  });

  it("fails on unmatched quote", () => {
    expect(() => decode("'abc")).toThrow(/unmatched/i);
  });

  it("fails on missing colon in object", () => {
    expect(() => decode("(a 1)")).toThrow(/missing ':'/);
  });

  it("fails on extra leading comma", () => {
    expect(() => decode("(,a:1)")).toThrow(/extra ','/);
  });
});

