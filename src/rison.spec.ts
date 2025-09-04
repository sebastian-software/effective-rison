import { describe, it, expect } from "vitest";
import { encode, decode, encodeObject, decodeObject, encodeArray, decodeArray } from "./rison";

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

describe("O-Rison", function () {
  it("Should do what the README says it does", function () {
    var encoded = encodeObject({ supportsObjects: true, ints: 435 });

    expect(encoded).toBe(`ints:435,supportsObjects:!t`);

    var decoded = `ints:435,supportsObjects:!t`;

    var decodedValue = decodeObject(decoded);

    expect(decodedValue).toEqual({ supportsObjects: true, ints: 435 });
  });
});

describe("A-Rison", function () {
  it("Should do what the README says it does", function () {
    var encoded = encodeArray(["A", "B", { supportsObjects: true }]);

    expect(encoded).toBe(`A,B,(supportsObjects:!t)`);

    var decoded = `A,B,(supportsObjects:!t)`;

    var decodedValue = decodeArray(decoded);

    expect(decodedValue).toEqual(["A", "B", { supportsObjects: true }]);
  });
});
