import { Parser } from "./parser";
import { encode } from "./encode"; // ensures Parser.parse error message stays consistent

export function decode(r: string): any {
  const errcb = (e: string) => {
    throw Error("rison decoder error: " + e);
  };
  const p = new Parser(errcb);
  return p.parse(r);
}

export function decode_object(r: string): any {
  return decode("(" + r + ")");
}

export function decode_array(r: string): any {
  return decode("!(" + r + ")");
}

