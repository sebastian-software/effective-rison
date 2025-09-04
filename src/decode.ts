import { Parser } from "./parser";
import { encode } from "./encode"; // Ensures error messages match encode's formatting

/**
 * Parse a Rison string into a JavaScript value.
 */
export function decode(input: string): any {
  const errcb = (message: string) => {
    throw Error("rison decoder error: " + message);
  };
  const parser = new Parser(errcb);
  return parser.parse(input);
}

/**
 * Parse an o-rison string by wrapping it in parentheses before decoding.
 */
export function decodeObject(input: string): any {
  return decode("(" + input + ")");
}

/**
 * Parse an a-rison string by prefixing with !() before decoding.
 */
export function decodeArray(input: string): any {
  return decode("!(" + input + ")");
}
