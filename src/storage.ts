import { encode } from "./encode";
import { decode } from "./decode";
import type { RisonValue } from "./parser";
import { base32768Encode, base32768Decode } from "./base32768";

// Standard Base64 helpers (not URL-safe, includes + / and padding =)
function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64");
}

function fromBase64(s: string): Uint8Array {
  // Accept with or without padding
  const padded = s.endsWith("=") ? s : s + "===".slice((s.length + 3) % 4);
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

export type CompressionMode = 'auto' | 'gzip' | 'deflate' | 'none';
export type StorageEncoding = 'base64' | 'base32768';

async function compressWith(kind: 'gzip' | 'deflate', rison: string, encoding: StorageEncoding): Promise<string> {
  const input = new TextEncoder().encode(rison);
  const algo = kind === 'gzip' ? 'gzip' : 'deflate';
  const compressed = await new Response(
    new Blob([viewToArrayBuffer(input)]).stream().pipeThrough(new CompressionStream(algo))
  ).arrayBuffer();
  const bytes = new Uint8Array(compressed);
  const payload = encoding === 'base32768' ? base32768Encode(bytes) : toBase64(bytes);
  return kind === 'gzip' ? `g:${payload}` : `d:${payload}`;
}

/**
 * Storage-friendly compression: Rison-encode then gzip/deflate and encode as standard base64.
 * Uses prefixes identical to URL helpers: 'g:' for gzip, 'd:' for deflate, no prefix for raw.
 */
export async function compressForStorage(
  value: RisonValue,
  options?: { mode?: CompressionMode; encoding?: StorageEncoding }
): Promise<string> {
  const mode = options?.mode ?? 'auto';
  const encoding: StorageEncoding = options?.encoding ?? 'base32768';
  const r = encode(value);
  if (mode === 'none') return r;
  if (mode === 'gzip') return await compressWith('gzip', r, encoding);
  if (mode === 'deflate') return await compressWith('deflate', r, encoding);
  // auto: skip compression for tiny payloads; otherwise choose shortest of raw/gzip/deflate
  if (r.length < 100) return r;
  const [gz, df] = await Promise.all([
    compressWith('gzip', r, encoding),
    compressWith('deflate', r, encoding)
  ]);
  const candidates = [r, gz, df];
  let best = candidates[0];
  for (const c of candidates) if (c.length < best.length) best = c;
  return best;
}

/**
 * Reverse of compressForStorage: base64 → gunzip/deflate via DecompressionStream → decode Rison.
 */
export async function decompressFromStorage(
  token: string,
  options?: { encoding?: StorageEncoding }
): Promise<RisonValue> {
  const encoding: StorageEncoding = options?.encoding ?? 'base32768';
  if (token.startsWith('g:')) {
    const data = token.slice(2);
    const bytes = encoding === 'base32768' ? base32768Decode(data) : fromBase64(data);
    const buf = await new Response(
      new Blob([viewToArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).arrayBuffer();
    const r = new TextDecoder().decode(new Uint8Array(buf));
    return decode(r);
  }
  if (token.startsWith('d:')) {
    const data = token.slice(2);
    const bytes = encoding === 'base32768' ? base32768Decode(data) : fromBase64(data);
    const buf = await new Response(
      new Blob([viewToArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream('deflate'))
    ).arrayBuffer();
    const r = new TextDecoder().decode(new Uint8Array(buf));
    return decode(r);
  }
  return decode(token);
}

/**
 * Optional convenience wrappers for localStorage. Throws if localStorage is unavailable.
 */
export async function saveToLocalStorage(
  key: string,
  value: RisonValue,
  options?: { mode?: CompressionMode; encoding?: StorageEncoding }
) {
  // eslint-disable-next-line no-undef
  if (typeof localStorage === 'undefined') throw new Error('localStorage is not available in this environment');
  const token = await compressForStorage(value, options);
  // eslint-disable-next-line no-undef
  localStorage.setItem(key, token);
}

export async function loadFromLocalStorage(
  key: string,
  options?: { encoding?: StorageEncoding }
): Promise<RisonValue | null> {
  // eslint-disable-next-line no-undef
  if (typeof localStorage === 'undefined') throw new Error('localStorage is not available in this environment');
  // eslint-disable-next-line no-undef
  const token = localStorage.getItem(key);
  if (token == null) return null;
  return await decompressFromStorage(token, options);
}
