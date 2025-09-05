// Base32768-like codec: packs bytes into 15-bit chunks mapped to safe UTF-16 code units
// using the continuous range 0x1000..0x8FFF (no ASCII/control chars, no surrogates).

function valToSafeCodePoint(v: number): number {
  // v in [0, 32767]; map to [0x1000..0x8FFF] (exactly 32768 code points)
  return 0x1000 + v;
}

function safeCodePointToVal(cp: number): number {
  if (cp < 0x1000 || cp > 0x8fff) {
    throw new Error("Invalid code point in base32768 string");
  }
  return cp - 0x1000;
}

export function base32768Encode(bytes: Uint8Array): string {
  let b = 0;
  let n = 0;
  let out = "";

  for (let i = 0; i < bytes.length; i++) {
    b |= bytes[i] << n;
    n += 8;

    while (n >= 15) {
      const v = b & 0x7fff; // 15 bits
      b >>= 15;
      n -= 15;
      out += String.fromCharCode(valToSafeCodePoint(v));
    }
  }

  if (n > 0) {
    const v = b & 0x7fff; // remaining < 15 bits, zero-padded implicitly
    out += String.fromCharCode(valToSafeCodePoint(v));
  }

  return out;
}

export function base32768Decode(s: string): Uint8Array {
  let b = 0;
  let n = 0;
  const out: number[] = [];

  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i);
    const v = safeCodePointToVal(cp);
    b |= v << n;
    n += 15;

    while (n >= 8) {
      out.push(b & 0xff);
      b >>= 8;
      n -= 8;
    }
  }
  // leftover bits (< 8) are padding; discard
  return new Uint8Array(out);
}
