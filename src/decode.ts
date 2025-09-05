import { parse } from "./parser";
import { encode } from "./encode"; // For consistency in error messaging

/**
 * Parse a Rison string into a JavaScript value.
 */
export function decode(input: string): any {
  try {
    return parse(input);
  } catch (e: any) {
    throw Error("rison decoder error: " + e.message);
  }
}

/**
 * Parse an o-rison string by wrapping it in parentheses before decoding.
 */
// Legacy O-/A-Rison helpers removed to keep API focused on standard Rison.
