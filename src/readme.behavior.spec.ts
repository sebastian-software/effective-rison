import { describe, it, expect } from "vitest";
import { encode, encodeObject, encodeArray, encodeUri, decode } from "./rison";

describe("README behavior coverage", () => {
  it("sorts object keys lexicographically on encode", () => {
    expect(encodeObject({ b: 1, a: 2 })).toBe("a:2,b:1");
    expect(encode({ b: 1, a: 2 })).toBe("(a:2,b:1)");
  });

  it("encodes numbers without plus in exponent", () => {
    expect(encode(1e+20)).toBe("1e20");
    expect(decode("1e20")).toBe(1e20);
  });

  it("does not allow whitespace outside strings by default", () => {
    expect(() => decode("(a:1 ,b:2)"))
      .toThrow();
  });

  it("escapes quotes and bangs inside strings using !", () => {
    expect(encode("a'b!c")).toBe("'a!'b!!c'");
  });

  it("leaves simple identifiers unquoted and quotes numeric-leading strings", () => {
    expect(encode("abc_def")).toBe("abc_def");
    expect(encode("1ab")).toBe("'1ab'");
  });

  it("encodes empty structures compactly", () => {
    expect(encode([])).toBe("!()");
    expect(encode({})).toBe("()");
  });

  it("supports bang literals for true/false/null and encodes non-finite as !n", () => {
    expect(decode("!t")).toBe(true);
    expect(decode("!f")).toBe(false);
    expect(decode("!n")).toBe(null);
    expect(encode(Infinity as any)).toBe("!n");
  });

  it("requires object keys to be identifiers or strings", () => {
    expect(() => decode("(1:a)")).toThrow();
  });

  it("encodeUri applies relaxed escaping (space -> +, keeps ,:@/)", () => {
    expect(encodeUri("a b,c:@/")).toBe("'a+b,c:@/'");
  });
});

