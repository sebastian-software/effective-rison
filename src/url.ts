import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { encode } from "./encode";
import { decode } from "./decode";
import type { RisonValue } from "./parser";

/**
 * Compress a value for safe, compact URL usage: Rison-encode then lz-string compress to URI component.
 */
export function compressToUrl(value: RisonValue): string {
  const rison = encode(value);
  return compressToEncodedURIComponent(rison);
}

/**
 * Reverse of compressToUrl: decompress then Rison-decode the original value.
 */
export function decompressFromUrl(input: string): RisonValue {
  const rison = decompressFromEncodedURIComponent(input);
  if (rison == null) throw new Error("Invalid compressed input: cannot decompress");
  return decode(rison);
}

