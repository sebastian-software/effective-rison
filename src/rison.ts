// Modern ES module implementation of Rison (no UMD/globals/CommonJS in source)

// Characters that are illegal inside ids.
const NOT_IDCHAR = " '!:(),*@$";
// Characters that are illegal as the start of an id (so ids can't look like numbers).
const NOT_IDSTART = '-0123456789';

const idrx = `[^${NOT_IDSTART}${NOT_IDCHAR}][^${NOT_IDCHAR}]*`;
const id_ok = new RegExp(`^${idrx}$`);
const next_id = new RegExp(idrx, 'g');

export function quote(x: string): string {
  if (/^[-A-Za-z0-9~!*()_.',:@$/]*$/.test(x)) return x;
  return encodeURIComponent(x)
    .replace(/%2C/g, ',')
    .replace(/%3A/g, ':')
    .replace(/%40/g, '@')
    .replace(/%24/g, '$')
    .replace(/%2F/g, '/')
    .replace(/%20/g, '+');
}

type Encodable = any;

// Stringifier based on json.org's json.js, adapted for Rison
const s: Record<string, (x: any) => string | undefined> = {
  array(x: any[]) {
    const a: string[] = ['!('];
    let b = false;
    for (let i = 0; i < x.length; i++) {
      const v = enc((x as any)[i]);
      if (typeof v === 'string') {
        if (b) a.push(',');
        a.push(v);
        b = true;
      }
    }
    a.push(')');
    return a.join('');
  },
  boolean(x: boolean) {
    return x ? '!t' : '!f';
  },
  null() {
    return '!n';
  },
  number(x: number) {
    if (!isFinite(x)) return '!n';
    return String(x).replace(/\+/, ''); // strip '+' out of exponent
  },
  object(x: Record<string, any> | null) {
    if (!x) return '!n';
    if (Array.isArray(x)) return s.array(x);

    const a: string[] = ['('];
    let b = false;
    const ks: string[] = [];
    for (const i in x) ks.push(i);
    ks.sort();
    for (let ki = 0; ki < ks.length; ki++) {
      const i = ks[ki];
      const v = enc((x as any)[i]);
      if (typeof v === 'string') {
        if (b) a.push(',');
        const k = isNaN(parseInt(i as any)) ? s.string(i) : s.number(parseInt(i as any, 10));
        a.push(k as string, ':', v);
        b = true;
      }
    }
    a.push(')');
    return a.join('');
  },
  string(x: string) {
    if (x === '') return "''";
    if (id_ok.test(x)) return x;
    const sq: Record<string, boolean> = { "'": true, '!': true };
    x = x.replace(/(['!])/g, function (a, b) {
      if (sq[b]) return '!' + b;
      return b;
    });
    return "'" + x + "'";
  },
  undefined() {
    // ignore undefined (like JSON)
    return undefined;
  },
};

function enc(v: Encodable): string | undefined {
  if (v && typeof (v as any).toJSON === 'function') v = (v as any).toJSON();
  const fn = s[typeof v];
  return fn ? (fn as any)(v) : undefined;
}

export function encode(v: Encodable): string {
  return enc(v) as string;
}

export function encode_object(v: Record<string, any>): string {
  if (typeof v !== 'object' || v === null || Array.isArray(v))
    throw new Error('rison.encode_object expects an object argument');
  const r = s.object(v) as string;
  return r.substring(1, r.length - 1);
}

export function encode_array(v: any[]): string {
  if (!Array.isArray(v)) throw new Error('rison.encode_array expects an array argument');
  const r = s.array(v) as string;
  return r.substring(2, r.length - 1);
}

export function encode_uri(v: Encodable): string {
  return quote((s as any)[typeof v](v));
}

export class Parser {
  static WHITESPACE = '';
  string!: string;
  index!: number;
  message: string | null = null;
  errorHandler?: (msg: string, index?: number) => void;

  constructor(errcb?: (msg: string, index?: number) => void) {
    if (errcb) this.errorHandler = errcb;
  }

  setOptions(options: { errorHandler?: (msg: string, index?: number) => void }) {
    if (options.errorHandler) this.errorHandler = options.errorHandler;
  }

  parse(str: string): any {
    this.string = str;
    this.index = 0;
    this.message = null;
    let value = this.readValue();
    if (!this.message && this.next())
      value = this.error(`unable to parse string as rison: '${encode(str)}'`);
    if (this.message && this.errorHandler) this.errorHandler(this.message, this.index);
    return value;
  }

  error(message: string): undefined {
    if (typeof console !== 'undefined') console.log('rison parser error: ', message);
    this.message = message;
    return undefined;
  }

  readValue(): any {
    const c = this.next();
    const fn = c && (this.table as any)[c];
    if (fn) return fn.apply(this);

    // fell through table, parse as an id
    const s = this.string;
    const i = this.index - 1;
    next_id.lastIndex = i;
    const m = next_id.exec(s);
    if (m && m.length > 0) {
      const id = m[0];
      this.index = i + id.length;
      return id; // a string
    }
    if (c) return this.error("invalid character: '" + c + "'");
    return this.error('empty expression');
  }

  static parse_array(parser: Parser) {
    const ar: any[] = [];
    let c: string | undefined;
    while ((c = parser.next()) !== ')') {
      if (!c) return parser.error("unmatched '!('");
      if (ar.length) {
        if (c !== ',') parser.error("missing ','");
      } else if (c === ',') {
        return parser.error("extra ','");
      } else --parser.index;
      const n = parser.readValue();
      if (typeof n === 'undefined') return undefined;
      ar.push(n);
    }
    return ar;
  }

  static bangs: Record<string, any> = {
    t: true,
    f: false,
    n: null,
    '(': Parser.parse_array,
  };

  table: Record<string, Function> = {
    '!': function (this: Parser) {
      const s = this.string;
      const c = s.charAt(this.index++);
      if (!c) return this.error('"!" at end of input');
      const x = Parser.bangs[c as keyof typeof Parser.bangs];
      if (typeof x === 'function') {
        return (x as Function).call(null, this);
      } else if (typeof x === 'undefined') {
        return this.error('unknown literal: "!' + c + '"');
      }
      return x;
    },
    '(': function (this: Parser) {
      const o: Record<string, any> = {};
      let c: string | undefined;
      let count = 0;
      while ((c = this.next()) !== ')') {
        if (count) {
          if (c !== ',') this.error("missing ','");
        } else if (c === ',') {
          return this.error("extra ','");
        } else --this.index;
        const k = this.readValue();
        if (typeof k === 'undefined') return undefined;
        if (this.next() !== ':') return this.error("missing ':'");
        const v = this.readValue();
        if (typeof v === 'undefined') return undefined;
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
        if (!c) return this.error('unmatched ' + "'" + '');
        if (c === '!') {
          if (start < i - 1) segments.push(s.slice(start, i - 1));
          c = s.charAt(i++);
          if ("!'".indexOf(c) >= 0) segments.push(c);
          else return this.error('invalid string escape: "!' + c + '"');
          start = i;
        }
      }
      if (start < i - 1) segments.push(s.slice(start, i - 1));
      this.index = i;
      return segments.length === 1 ? segments[0] : segments.join('');
    },
    '-': function (this: Parser) {
      let s = this.string;
      let i = this.index;
      const start = i - 1;
      let state: string | undefined = 'int';
      let permittedSigns = '-';
      const transitions: Record<string, string> = {
        'int+.': 'frac',
        'int+e': 'exp',
        'frac+e': 'exp',
      };
      do {
        let c = s.charAt(i++);
        if (!c) break;
        if ('0' <= c && c <= '9') continue;
        if (permittedSigns.indexOf(c) >= 0) {
          permittedSigns = '';
          continue;
        }
        state = transitions[state + '+' + c.toLowerCase()];
        if (state === 'exp') permittedSigns = '-';
      } while (state);
      this.index = --i;
      s = s.slice(start, i);
      if (s === '-') return this.error('invalid number');
      return Number(s);
    },
  };

  constructor_table_init = (() => {
    for (let i = 0; i <= 9; i++) (this.table as any)[String(i)] = this.table['-'];
    return true;
  })();

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

export function decode(r: string): any {
  const errcb = (e: string) => {
    throw Error('rison decoder error: ' + e);
  };
  const p = new Parser(errcb);
  return p.parse(r);
}

export function decode_object(r: string): any {
  return decode('(' + r + ')');
}

export function decode_array(r: string): any {
  return decode('!(' + r + ')');
}

const rison = {
  encode,
  encode_object,
  encode_array,
  encode_uri,
  decode,
  decode_object,
  decode_array,
  parser: Parser,
  quote,
};

export default rison;
