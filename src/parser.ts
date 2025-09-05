import { NOT_IDCHAR, NOT_IDSTART } from "./constants";

export type RisonValue = null | boolean | number | string | RisonValue[] | { [k: string]: RisonValue };

export interface ParseOptions {
  whitespace?: string;
}

interface Context {
  input: string;
  index: number;
  whitespace: string;
}

export class RisonParseError extends Error {
  index: number;
  constructor(message: string, index: number) {
    super(message);
    this.name = "RisonParseError";
    this.index = index;
  }
}

function createContext(input: string, options?: ParseOptions): Context {
  return {
    input,
    index: 0,
    whitespace: options?.whitespace ?? ""
  };
}

function next(ctx: Context): string | undefined {
  let c: string | undefined;
  const s = ctx.input;
  let i = ctx.index;
  do {
    if (i === s.length) return undefined;
    c = s.charAt(i++);
  } while (ctx.whitespace.indexOf(c) >= 0);
  ctx.index = i;
  return c;
}

function error(ctx: Context, message: string): never {
  throw new RisonParseError(message, ctx.index);
}

export function parse(input: string, options?: ParseOptions): RisonValue {
  const ctx = createContext(input, options);
  const value = readValue(ctx);
  // If anything remains, it's an error to have extra input
  if (next(ctx) !== undefined) error(ctx, "unable to parse string as rison");
  return value;
}

function readValue(ctx: Context): RisonValue {
  const c = next(ctx);
  if (!c) return error(ctx, "empty expression");

  switch (c) {
    case "!":
      return readBang(ctx);
    case "(":
      return readObject(ctx);
    case "'":
      return readString(ctx);
    case "-":
      return readNumber(ctx, true);
    default:
      if (c >= "0" && c <= "9") return readNumber(ctx, false, c);
      ctx.index--; // step back one char to include c in identifier
      return readIdentifier(ctx);
  }
}

function readBang(ctx: Context): RisonValue {
  const s = ctx.input;
  const c = s.charAt(ctx.index++);
  if (!c) return error(ctx, '"!" at end of input');
  if (c === "t") return true;
  if (c === "f") return false;
  if (c === "n") return null;
  if (c === "(") return readArray(ctx);
  return error(ctx, `unknown literal: "!${c}"`);
}

function readArray(ctx: Context): RisonValue[] {
  const arr: RisonValue[] = [];
  let c: string | undefined;
  while ((c = next(ctx)) !== ")") {
    if (!c) return error(ctx, "unmatched '!('");
    if (arr.length) {
      if (c !== ",") error(ctx, "missing ','");
    } else if (c === ",") {
      return error(ctx, "extra ','");
    } else ctx.index--;
    const n = readValue(ctx);
    arr.push(n);
  }
  return arr;
}

function readObject(ctx: Context): { [k: string]: RisonValue } {
  const obj: { [k: string]: RisonValue } = {};
  let c: string | undefined;
  let count = 0;
  while ((c = next(ctx)) !== ")") {
    if (count) {
      if (c !== ",") error(ctx, "missing ','");
    } else if (c === ",") {
      return error(ctx, "extra ','");
    } else ctx.index--;
    const k = readValue(ctx);
    if (typeof k !== "string") error(ctx, "object keys must be identifiers or strings");
    if (next(ctx) !== ":") error(ctx, "missing ':'");
    const v = readValue(ctx);
    obj[k] = v;
    count++;
  }
  return obj;
}

function readString(ctx: Context): string {
  const s = ctx.input;
  let i = ctx.index;
  let start = i;
  const segments: string[] = [];
  let c: string | undefined;
  while ((c = s.charAt(i++)) !== "'") {
    if (!c) return error(ctx, "unmatched '");
    if (c === "!") {
      if (start < i - 1) segments.push(s.slice(start, i - 1));
      c = s.charAt(i++);
      if ("!'".indexOf(c) >= 0) segments.push(c);
      else return error(ctx, `invalid string escape: "!${c}"`);
      start = i;
    }
  }
  if (start < i - 1) segments.push(s.slice(start, i - 1));
  ctx.index = i;
  return segments.length === 1 ? segments[0] : segments.join("");
}

function readNumber(ctx: Context, startedWithMinus: boolean, firstDigit?: string): number {
  const s = ctx.input;
  let i = ctx.index;
  // We already consumed '-' or the first digit into c/firstDigit; reconstruct start
  const start = startedWithMinus ? i - 1 : i - 1;
  // We'll scan until a non-number char occurs based on allowed transitions
  let state: "int" | "frac" | "exp" | undefined = startedWithMinus || firstDigit ? "int" : undefined;
  let permittedSigns = "-";
  do {
    const c = s.charAt(i++);
    if (!c) break;
    if (c >= "0" && c <= "9") continue;
    if (permittedSigns.indexOf(c) >= 0) {
      permittedSigns = "";
      continue;
    }
    const key = (state ?? "") + "+" + c.toLowerCase();
    if (key === "int+.") state = "frac";
    else if (key === "int+e" || key === "frac+e") {
      state = "exp";
      permittedSigns = "-";
    } else {
      state = undefined;
    }
  } while (state);
  ctx.index = --i;
  const token = s.slice(start, i);
  if (token === "-") return error(ctx, "invalid number");
  const num = Number(token);
  if (!isFinite(num)) return error(ctx, "invalid number");
  return num;
}

function isNotIdChar(c: string): boolean {
  return NOT_IDCHAR.indexOf(c) >= 0;
}

function isNotIdStart(c: string): boolean {
  return NOT_IDSTART.indexOf(c) >= 0;
}

function readIdentifier(ctx: Context): string {
  const s = ctx.input;
  let i = ctx.index;
  const start = i;
  const first = s.charAt(i++);
  if (!first || isNotIdStart(first) || isNotIdChar(first)) return error(ctx, `invalid character: '${first}'`);
  while (true) {
    const c = s.charAt(i);
    if (!c || isNotIdChar(c)) break;
    i++;
  }
  ctx.index = i;
  return s.slice(start, i);
}
