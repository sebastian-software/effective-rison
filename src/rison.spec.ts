import { describe, it, expect } from "vitest";
import { encode, decode } from "./rison";

describe("Rison", function () {
  it("Should do what the README says it does", function () {
    var encoded = encode({ any: "json", yes: true });

    expect(encoded).toBe(`(any:json,yes:!t)`);

    var decoded = `(any:json,yes:!t)`;

    var decodedValue = decode(decoded);

    expect(decodedValue).toEqual({ any: "json", yes: true });
  });

  it("Should handle deeply nested objects", function () {
    var deeplyNested = {
      A: {
        B: {
          C: {
            D: "E",
            F: "G"
          }
        },
        H: {
          I: {
            J: "K",
            L: "M"
          }
        }
      }
    };

    var encoded = encode(deeplyNested);

    expect(encoded).toBe(`(A:(B:(C:(D:E,F:G)),H:(I:(J:K,L:M))))`);

    var serializedDeeplyNested = `(A:(B:(C:(D:E,F:G)),H:(I:(J:K,L:M))))`;

    var deserializedDeeplyNested = decode(serializedDeeplyNested);

    expect(deserializedDeeplyNested).toEqual(deeplyNested);
  });
});

// O-/A-Rison helpers removed; use standard encode/decode only.
