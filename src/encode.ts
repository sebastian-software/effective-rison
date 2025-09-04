import { identifierRegex } from "./constants";

export function quote(x: string): string {
  if (/^[-A-Za-z0-9~!*()_.',:@$/]*$/.test(x)) return x;
  return encodeURIComponent(x)
    .replace(/%2C/g, ",")
    .replace(/%3A/g, ":")
    .replace(/%40/g, "@")
    .replace(/%24/g, "$")
    .replace(/%2F/g, "/")
    .replace(/%20/g, "+");
}

/**
 * Values encodable by the Rison serializer.
 */
type RisonEncodable = any;

/**
 * Dispatch table of type-name to serializer implementation.
 */
const serializers: Record<string, (x: any) => string | undefined> = {
  array(x: any[]) {
    const a: string[] = ["!("];
    let b = false;
    for (let i = 0; i < x.length; i++) {
      const v = serializeValue((x as any)[i]);
      if (typeof v === "string") {
        if (b) a.push(",");
        a.push(v);
        b = true;
      }
    }
    a.push(")");
    return a.join("");
  },
  boolean(x: boolean) {
    return x ? "!t" : "!f";
  },
  null() {
    return "!n";
  },
  number(x: number) {
    if (!isFinite(x)) return "!n";
    return String(x).replace(/\+/, "");
  },
  object(x: Record<string, any> | null) {
    if (!x) return "!n";
    if (Array.isArray(x)) return serializers.array(x);

    const a: string[] = ["("];
    let b = false;
    const ks: string[] = [];
    for (const i in x) ks.push(i);
    ks.sort();
    for (let ki = 0; ki < ks.length; ki++) {
      const i = ks[ki];
      const v = serializeValue((x as any)[i]);
      if (typeof v === "string") {
        if (b) a.push(",");
        const k = isNaN(parseInt(i as any)) ? serializers.string(i) : serializers.number(parseInt(i as any, 10));
        a.push(k as string, ":", v);
        b = true;
      }
    }
    a.push(")");
    return a.join("");
  },
  string(x: string) {
    if (x === "") return "''";
    if (identifierRegex.test(x)) return x;
    const sq: Record<string, boolean> = { "'": true, "!": true };
    x = x.replace(/(['!])/g, function (a, b) {
      if (sq[b]) return "!" + b;
      return b;
    });
    return "'" + x + "'";
  },
  undefined() {
    return undefined;
  }
};

/**
 * Serialize any supported value into a Rison string fragment.
 */
function serializeValue(v: RisonEncodable): string | undefined {
  if (v && typeof (v as any).toJSON === "function") v = (v as any).toJSON();
  const fn = serializers[typeof v];
  return fn ? (fn as any)(v) : undefined;
}

/**
 * Encode any supported value to a Rison string.
 */
export function encode(v: RisonEncodable): string {
  return serializeValue(v) as string;
}

/**
 * Encode an object without the surrounding parentheses.
 * Throws if provided value is not a plain object.
 */
export function encode_object(v: Record<string, any>): string {
  if (typeof v !== "object" || v === null || Array.isArray(v)) throw new Error("rison.encode_object expects an object argument");
  const rendered = serializers.object(v) as string;
  return rendered.substring(1, rendered.length - 1);
}

/**
 * Encode an array without the surrounding !() markers.
 * Throws if provided value is not an array.
 */
export function encode_array(v: any[]): string {
  if (!Array.isArray(v)) throw new Error("rison.encode_array expects an array argument");
  const rendered = serializers.array(v) as string;
  return rendered.substring(2, rendered.length - 1);
}

/**
 * Encode a value and make it URL-friendly by applying a relaxed escaping.
 */
export function encode_uri(v: RisonEncodable): string {
  return quote((serializers as any)[typeof v](v));
}
