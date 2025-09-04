import { nextIdentifierRegex } from "./constants";
import { encode } from "./encode";

/**
 * Stateful Rison parser.
 *
 * Provides error reporting via an optional callback and mirrors the legacy API.
 */
export class Parser {
  /** Whitespace characters accepted by the parser (empty by default). */
  static WHITESPACE = "";
  /** Input being parsed. */
  string!: string;
  /** Current index into the input. */
  index!: number;
  /** Last error message if any. */
  message: string | null = null;
  /** Optional error handler callback. */
  errorHandler?: (msg: string, index?: number) => void;

  constructor(errcb?: (msg: string, index?: number) => void) {
    if (errcb) this.errorHandler = errcb;
    // Initialize digit handlers in the dispatch table
    for (let i = 0; i <= 9; i++) (this.dispatchTable as any)[String(i)] = this.dispatchTable["-"];
  }

  setOptions(options: { errorHandler?: (msg: string, index?: number) => void }) {
    if (options.errorHandler) this.errorHandler = options.errorHandler;
  }

  parse(str: string): any {
    this.string = str;
    this.index = 0;
    this.message = null;
    let value = this.readValue();
    if (!this.message && this.next()) value = this.error(`unable to parse string as rison: '${encode(str)}'`);
    if (this.message && this.errorHandler) this.errorHandler(this.message, this.index);
    return value;
  }

  error(message: string): undefined {
    if (typeof console !== "undefined") console.log("rison parser error: ", message);
    this.message = message;
    return undefined;
  }

  /** Read the next value from the input. */
  readValue(): any {
    const c = this.next();
    const fn = c && (this.dispatchTable as any)[c];
    if (fn) return fn.apply(this);

    const s = this.string;
    const i = this.index - 1;
    nextIdentifierRegex.lastIndex = i;
    const m = nextIdentifierRegex.exec(s);
    if (m && m.length > 0) {
      const id = m[0];
      this.index = i + id.length;
      return id;
    }
    if (c) return this.error("invalid character: '" + c + "'");
    return this.error("empty expression");
  }

  /** Parse an array after encountering a bang+open-paren sequence. */
  static parseArray(parser: Parser) {
    const ar: any[] = [];
    let c: string | undefined;
    while ((c = parser.next()) !== ")") {
      if (!c) return parser.error("unmatched '!('");
      if (ar.length) {
        if (c !== ",") parser.error("missing ','");
      } else if (c === ",") {
        return parser.error("extra ','");
      } else --parser.index;
      const n = parser.readValue();
      if (typeof n === "undefined") return undefined;
      ar.push(n);
    }
    return ar;
  }

  /** Literals introduced by a leading bang. */
  static bangLiterals: Record<string, any> = {
    t: true,
    f: false,
    n: null,
    "(": Parser.parseArray
  };

  /** Character-dispatch table for reading values. */
  dispatchTable: Record<string, Function> = {
    "!": function (this: Parser) {
      const s = this.string;
      const c = s.charAt(this.index++);
      if (!c) return this.error('"!" at end of input');
      const x = Parser.bangLiterals[c as keyof typeof Parser.bangLiterals];
      if (typeof x === "function") {
        return (x as Function).call(null, this);
      } else if (typeof x === "undefined") {
        return this.error("unknown literal: \"!" + c + "\"");
      }
      return x;
    },
    "(": function (this: Parser) {
      const o: Record<string, any> = {};
      let c: string | undefined;
      let count = 0;
      while ((c = this.next()) !== ")") {
        if (count) {
          if (c !== ",") this.error("missing ','");
        } else if (c === ",") {
          return this.error("extra ','");
        } else --this.index;
        const k = this.readValue();
        if (typeof k === "undefined") return undefined;
        if (this.next() !== ":") return this.error("missing ':'");
        const v = this.readValue();
        if (typeof v === "undefined") return undefined;
        o[k] = v;
        count++;
      }
      return o;
    },
    "'": function (this: Parser) {
      const s = this.string;
      let i = this.index;
      let start = i;
      const segments: string[] = [];
      let c: string | undefined;
      while ((c = s.charAt(i++)) !== "'") {
        if (!c) return this.error("unmatched '");
        if (c === "!") {
          if (start < i - 1) segments.push(s.slice(start, i - 1));
          c = s.charAt(i++);
          if ("!'".indexOf(c) >= 0) segments.push(c);
          else return this.error("invalid string escape: \"!" + c + "\"");
          start = i;
        }
      }
      if (start < i - 1) segments.push(s.slice(start, i - 1));
      this.index = i;
      return segments.length === 1 ? segments[0] : segments.join("");
    },
    "-": function (this: Parser) {
      let s = this.string;
      let i = this.index;
      const start = i - 1;
      let state: string | undefined = "int";
      let permittedSigns = "-";
      const transitions: Record<string, string> = {
        "int+.": "frac",
        "int+e": "exp",
        "frac+e": "exp"
      };
      do {
        let c = s.charAt(i++);
        if (!c) break;
        if ("0" <= c && c <= "9") continue;
        if (permittedSigns.indexOf(c) >= 0) {
          permittedSigns = "";
          continue;
        }
        state = transitions[state + "+" + c.toLowerCase()];
        if (state === "exp") permittedSigns = "-";
      } while (state);
      this.index = --i;
      s = s.slice(start, i);
      if (s === "-") return this.error("invalid number");
      return Number(s);
    }
  };

  /** Return the next non-whitespace character, or undefined if at end. */
  next(): string | undefined {
    let c: string | undefined;
    const s = this.string;
    let i = this.index;
    do {
      if (i === s.length) return undefined;
      c = s.charAt(i++);
    } while (Parser.WHITESPACE.indexOf(c) >= 0);
    this.index = i;
    return c;
  }
}
