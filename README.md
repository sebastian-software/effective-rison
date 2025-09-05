# rison

<p>
  <a href="https://www.npmjs.com/package/@effective/rison"><img alt="npm" src="https://img.shields.io/npm/v/%40effective%2Frison?logo=npm&color=cb3837"></a>
  <a href="https://github.com/sebastian-software/effective-rison/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/sebastian-software/effective-rison/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript">
  <img alt="Types Included" src="https://img.shields.io/badge/Types-Included-3178c6?logo=typescript">
  <img alt="Zero Dependencies" src="https://img.shields.io/badge/Dependencies-None-2ea44f">
  <img alt="Module" src="https://img.shields.io/badge/ESM-Only-000">
  <img alt="Node" src="https://img.shields.io/badge/node-22%2B-339933?logo=node.js">
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-10+-F69220?logo=pnpm">
  <img alt="Prettier" src="https://img.shields.io/badge/Code%20Style-Prettier-ff69b4?logo=prettier">
  <img alt="Vitest" src="https://img.shields.io/badge/Tests-Vitest-6E9F18">
  <img alt="Made in Germany" src="https://img.shields.io/badge/Made%20in-Germany-black">
</p>

<p>
  <a href="https://sebastian-software.github.io/effective-rison/" target="_blank" rel="noopener">
    <img alt="Open Demo" src="https://img.shields.io/badge/Demo-Open%20Live-2ea44f?style=for-the-badge">
  </a>
</p>

Modern, TypeScript-first, ESM-only Rison: compact serialization for JSON-like structures — great for URLs and for compact storage. Based on [Rison (Original)](https://github.com/Nanonid/rison).

Rison is a slight variation of JSON that looks vastly superior after URI encoding — ideal for
compact state in URLs and also useful for storing structured data in `localStorage`/`sessionStorage`.

## Why Rison for URLs

- Encodes nested objects/arrays compactly and URI‑friendly (minimal escaping).
- Ideal for client state in query or fragment (filters, sorting, columns, pagination).
- Practical URL limits are infrastructure‑driven: conservative target ≈ 2 KB total; common defaults ≈ 8 KB. Fragments (`#state=…`) aren’t sent to servers and bypass those limits.
- This package includes native compression helpers (gzip/deflate via CompressionStream) with an `auto` mode that selects the shortest token.

## Quick Start

```js
import { encode, decode } from "@effective/rison";

encode({ any: "json", yes: true });
// -> (any:json,yes:!t)

decode("(any:json,yes:!t)");
// -> { any: 'json', yes: true }
```

Optional URL compression helpers (native CompressionStream in modern browsers):

```js
import { compressToUrl, decompressFromUrl } from "@effective/rison";

// mode: 'auto' | 'gzip' | 'deflate' | 'none' (default: 'auto')
const compact = await compressToUrl({ page: 1, filters: { active: true } }, { mode: 'auto' });
// -> safe, compact string for query params/fragments

const value = await decompressFromUrl(compact);

### Compression formats & prefixes

- `none`: returns raw Rison (no prefix)
- `gzip`: returns a token prefixed with `g:` and base64url‑encoded
- `deflate`: returns a token prefixed with `d:` and base64url‑encoded
- `auto`: compresses with both gzip and deflate and picks the shortest among raw/gzip/deflate
// -> original value
```

## Storage (localStorage) Usage

For storage, URL compatibility isn’t required. This library offers high‑density UTF‑16 packing (Base32768‑like) that maps 15‑bit chunks to non‑surrogate code points, giving better density than base64. Storage helpers default to `base32768` and keep the same compression prefixes.

```js
import { compressForStorage, decompressFromStorage } from "@effective/rison";

// mode: 'auto' | 'gzip' | 'deflate' | 'none' (default: 'auto')
// encoding: 'base32768' | 'base64' (default: 'base32768')
const token = await compressForStorage({ theme: 'dark', tabs: [1, 2, 3] }, { encoding: 'base32768' });
// store in localStorage yourself
localStorage.setItem('app:state', token);

// later…
const restored = await decompressFromStorage(localStorage.getItem('app:state')!, { encoding: 'base32768' });
```

Convenience wrappers are also available if you prefer direct storage calls:

```js
import { saveToLocalStorage, loadFromLocalStorage } from "@effective/rison";

await saveToLocalStorage('app:state', { theme: 'dark' }, { encoding: 'base32768' });
const state = await loadFromLocalStorage('app:state', { encoding: 'base32768' });
```

## Installation

```
pnpm add @effective/rison
# or
npm install @effective/rison
```

## Requirements & Support

- Browsers: modern engines support CompressionStream/DecompressionStream.
- Node.js: 20+ provides CompressionStream in runtime; this repo builds/tests on Node 22+.
- ESM-only package.

## API

- `encode(value)` → string
- `decode(string)` → any
- `encodeUri(value)` → string (Rison-encode + relaxed URI escaping)
- `compressToUrl(value, { mode })` → Promise<string>
- `decompressFromUrl(string)` → Promise<any>
- `compressForStorage(value, { mode, encoding })` → Promise<string>
- `decompressFromStorage(string, { encoding })` → Promise<any>
- `saveToLocalStorage(key, value, { mode, encoding })` → Promise<void>
- `loadFromLocalStorage(key, { encoding })` → Promise<any | null>

Notes:
- Storage encoding defaults to `base32768` for maximum density with simple decoding. You can switch to `base64` for interoperability.
- Compression prefixes remain the same: `g:` (gzip), `d:` (deflate), or none (raw Rison).

Types are published via `dist/rison.d.ts`.

## Demos & Examples

- Live demo: 3‑pane source → converted → restored
  - Radio options for compression: auto, gzip, deflate, none
  - Three presets (Short/Medium/Long) to test compression impact

## Nuqs Integration

Use Rison with [nuqs](https://github.com/47ng/nuqs) to manage URL state in React apps.

```tsx
import { useQueryState } from "nuqs";
import { encode, decode } from "@effective/rison";

// Rison serializer for nuqs
const risonSerializer = {
  parse: (value: string) => decode(value),
  serialize: (value: unknown) => encode(value)
};

export function Example() {
  // e.g. ?state=(filter:(active:!t),page:3)
  const [state, setState] = useQueryState("state", risonSerializer as any);

  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <button onClick={() => setState({ filter: { active: true }, page: 3 })}>Set State</button>
    </div>
  );
}
```

Compression helpers are async and not suitable for nuqs serializers; if you need compression with nuqs, use a custom async layer outside of serializer calls.

For smaller URLs, use the compressed variant above.

## Breaking changes in v1

- ESM-only package, Node 22+ recommended.
- Removed default export; use named imports.
- Removed legacy O-/A-Rison helpers; use `encode`/`decode` only.

## Contributing

- Run tests: `pnpm test`
- Typecheck: `pnpm run typecheck`
- Format: `pnpm run format`

## Releasing

Manual, assisted by release-it. Ensure your npm and GitHub tokens are configured locally.

```
pnpm install
pnpm run release
```

This runs typecheck/tests, builds, bumps the version, publishes to npm (public), tags the release,
and publishes a GitHub Release.

## License

MIT — see [LICENSE.md](./LICENSE.md).

- Copyright © 2007–2009 Metaweb Technologies, Inc.
- Copyright © 2024–present, Sebastian Software GmbH, Germany.

## Acknowledgments

- Originally created and published by Metaweb Technologies, Inc. (Google).
- Encoder inspired by Douglas Crockford's json.js; decoder inspired by Oliver Steele's JSON for OpenLaszlo.
- Thanks to all [contributors](https://github.com/sebastian-software/effective-rison/graphs/contributors) over the years.
