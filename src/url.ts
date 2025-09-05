import { encode } from "./encode";
import { decode } from "./decode";
import type { RisonValue } from "./parser";

// Base64url helpers
function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function viewToArrayBuffer(view: Uint8Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = view;
  if (byteOffset === 0 && byteLength === buffer.byteLength) return buffer as ArrayBuffer;
  return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
}

/**
 * Compress a value for safe, compact URL usage: Rison-encode then gzip via CompressionStream
 * and encode as base64url (URL-safe, no padding).
 */
export type CompressionMode = 'auto' | 'gzip' | 'deflate' | 'none';

async function compressWith(kind: 'gzip' | 'deflate', rison: string): Promise<string> {
  const input = new TextEncoder().encode(rison);
  const algo = kind === 'gzip' ? 'gzip' : 'deflate';
  const compressed = await new Response(
    new Blob([viewToArrayBuffer(input)]).stream().pipeThrough(new CompressionStream(algo))
  ).arrayBuffer();
  const b64url = toBase64Url(new Uint8Array(compressed));
  // Prefix both gzip and deflate; raw (no prefix) means no compression
  return kind === 'gzip' ? `g:${b64url}` : `d:${b64url}`;
}

export async function compressToUrl(value: RisonValue, options?: { mode?: CompressionMode }): Promise<string> {
  const mode = options?.mode ?? 'auto';
  const r = encode(value);
  if (mode === 'none') return r;
  if (mode === 'gzip') return compressWith('gzip', r);
  if (mode === 'deflate') return compressWith('deflate', r);
  // auto: try both gzip and deflate, and compare with raw Rison; pick shortest
  if (r.length < 100) return r; // early exit for tiny payloads
  const [gz, df] = await Promise.all([compressWith('gzip', r), compressWith('deflate', r)]);
  const candidates = [r, gz, df];
  let best = candidates[0];
  for (const c of candidates) if (c.length < best.length) best = c;
  return best;
}

/**
 * Reverse of compressToUrl: base64url → gunzip via DecompressionStream → decode Rison
 */
export async function decompressFromUrl(token: string): Promise<RisonValue> {
  if (token.startsWith('g:')) {
    const b64 = token.slice(2);
    const bytes = fromBase64Url(b64);
    const buf = await new Response(
      new Blob([viewToArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).arrayBuffer();
    const r = new TextDecoder().decode(new Uint8Array(buf));
    return decode(r);
  }
  if (token.startsWith('d:')) {
    const b64 = token.slice(2);
    const bytes = fromBase64Url(b64);
    const buf = await new Response(
      new Blob([viewToArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream('deflate'))
    ).arrayBuffer();
    const r = new TextDecoder().decode(new Uint8Array(buf));
    return decode(r);
  }
  // No prefix => treat as raw Rison
  return decode(token);
}
