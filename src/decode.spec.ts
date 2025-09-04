import { describe, it, expect } from "vitest";
import { decode } from "./rison";

describe("decode", () => {
  it("decodes bang literals !t,!f,!n", () => {
    expect(decode("!t")).toBe(true);
    expect(decode("!f")).toBe(false);
    expect(decode("!n")).toBe(null);
  });

  it("decodes exponent numbers", () => {
    expect(decode("1e20")).toBe(1e20);
  });

  it("requires object keys to be identifiers or strings", () => {
    expect(() => decode("(1:a)")).toThrow();
  });

  it("rejects whitespace outside strings by default", () => {
    expect(() => decode("(a:1 ,b:2)")).toThrow();
  });
});

