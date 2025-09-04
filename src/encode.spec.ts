import { describe, it, expect } from "vitest";
import { encode, encodeObject, encodeArray, encodeUri } from "./rison";

describe("encode", () => {
  it("sorts object keys lexicographically", () => {
    expect(encodeObject({ b: 1, a: 2 })).toBe("a:2,b:1");
    expect(encode({ b: 1, a: 2 })).toBe("(a:2,b:1)");
  });

  it("encodes numbers without plus in exponent", () => {
    // Use a value that formats in exponential form by default
    expect(encode(1e21)).toBe("1e21");
  });

  it("escapes quotes and bangs inside strings using !", () => {
    expect(encode("a'b!c")).toBe("'a!'b!!c'");
  });

  it("leaves identifiers unquoted and quotes numeric-leading strings", () => {
    expect(encode("abc_def")).toBe("abc_def");
    expect(encode("1ab")).toBe("'1ab'");
  });

  it("encodes empty structures compactly", () => {
    expect(encodeArray([])).toBe("");
    // encodeArray returns inner without !() per API; full array is encode([])
    expect(encode([])).toBe("!()");
    expect(encode({})).toBe("()");
  });

  it("encodes non-finite numbers as !n", () => {
    expect(encode(Infinity as any)).toBe("!n");
    expect(encode(NaN as any)).toBe("!n");
  });

  it("encodeUri applies relaxed escaping (space -> +, keeps ,:@/)", () => {
    expect(encodeUri("a b,c:@/")).toBe("'a+b,c:@/'");
  });
});
