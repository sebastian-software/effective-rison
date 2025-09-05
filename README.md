# rison

<p>
  <a href="https://www.npmjs.com/package/@effective/rison"><img alt="npm" src="https://img.shields.io/npm/v/%40effective%2Frison?logo=npm&color=cb3837"></a>
  <a href="https://github.com/sebastian-software/effective-rison/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/sebastian-software/effective-rison/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript">
  <img alt="Types Included" src="https://img.shields.io/badge/Types-Included-3178c6?logo=typescript">
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

Modern, TypeScript-first, ESM-only Rison: compact, URI-friendly encoding for JSON-like structures.

Rison is a slight variation of JSON that looks vastly superior after URI encoding — great for
storing compact state in URLs while expressing the same data structures as JSON.

Original project: https://github.com/Nanonid/rison

## Quick Start

ESM usage (Node 22+ or a bundler):

```js
import { encode, decode, encodeObject, encodeArray } from "@effective/rison";

encode({ any: "json", yes: true });
// -> (any:json,yes:!t)

decode("(any:json,yes:!t)");
// -> { any: 'json', yes: true }

encodeObject({ supportsObjects: true, ints: 435 });
// -> ints:435,supportsObjects:!t

encodeArray(["A", "B", { supportsObjects: true }]);
// -> A,B,(supportsObjects:!t)
```

Optional URL compression helpers (native gzip via CompressionStream in modern browsers):

```js
import { compressToUrl, decompressFromUrl } from "@effective/rison";

const compact = await compressToUrl({ page: 1, filters: { active: true } });
// -> safe, compact string for query params/fragments

const value = await decompressFromUrl(compact);
// -> original value
```

## Installation

```
pnpm add @effective/rison
# or
npm i @effective/rison
```

## Requirements

- Node.js 22+ (ESM-only package)
- pnpm or npm (pnpm recommended)

## API

- `encode(value)` → string
- `decode(string)` → any
- `encodeObject(object)` → string (without surrounding parentheses)
- `encodeArray(array)` → string (without surrounding `!()`)
- `encodeUri(value)` → string (Rison-encode + relaxed URI escaping)
- `compressToUrl(value)` → string (Rison-encode + lz-string compress to URI component)
- `decompressFromUrl(string)` → any (reverse of `compressToUrl`)

Types are published via `dist/rison.d.ts`.

## Demos & Examples

- Live demo: GitHub Pages (3-pane source → converted → restored) — enabled via Actions.

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

Compressed variant (smaller URLs) using `lz-string`:

```tsx
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { encode, decode } from "@effective/rison";

const risonCompressed = {
  parse: (value: string) => decode(decompressFromEncodedURIComponent(value) ?? ""),
  serialize: (value: unknown) => compressToEncodedURIComponent(encode(value))
};
```

For smaller URLs, use the compressed variant above.

## Breaking changes in v1

- ESM-only package (`"type": "module"`), Node 22+ recommended.
- Removed default export; use named imports.
- Removed snake_case API; use camelCase (`encodeObject`, `encodeArray`, `encodeUri`, `decodeObject`, `decodeArray`).

## Why another data serialization format?

Rison is intended to meet the following goals, in roughly this order:

1. Comply with [URI specifications](http://gbiv.com/protocols/uri/rfc/rfc3986.html) and usage
2. Express **nested** data structures
3. Be **human-readable**
4. Be **compact**
   Rison is necessary because the obvious alternatives fail to meet these goals:

- URI-encoded XML and JSON are illegible and inefficient.
- [HTML Form encoding](http://www.w3.org/TR/html4/interact/forms.html#form-content-type) rules the web but can only represent a flat list of string pairs.
- Ian Bicking's [FormEncode](http://formencode.org/) package includes the [variabledecode](http://formencode.org/Validator.html#id16) parser, an interesting convention for form encoding that allows nested lists and dictionaries. However, it becomes inefficient with deeper nesting, and allows no terminal datatypes except strings.

Note that these goals are shaped almost entirely by the constraints of URIs,
though Rison has turned out to be useful in command-line tools as well. In the
_body_ of an HTTP request or response, length is less critical and URI
encoding can be avoided, so JSON would usually be preferred to Rison.

Given that a new syntax is needed, Rison tries to innovate as little as
possible:

- It uses the same data model as, and a very similar syntax to [JSON](http://json.org). The Rison grammar is only a slight alteration of the JSON grammar.
- It introduces very little additional quoting, since we assume that URI encoding will be applied on top of the Rison encoding.

## Differences from JSON syntax

- no whitespace is permitted except inside quoted strings (by default).
- almost all character escaping is left to the uri encoder.
- single-quotes are used for quoting, but quotes can and should be left off strings when the strings are simple identifiers.
- the `e+` exponent format is forbidden, since `+` is not safe in form values and the plain `e` format is equivalent.
- the `E`, `E+`, and `E` exponent formats are removed.
- object keys should be lexically sorted when encoding. the intent is to improve url cacheability.
- uri-safe tokens are used in place of the standard json tokens:

Token mapping (Rison → JSON): `'` → `"` (string quote), `!` → `\\` (escape), `(...)` → `{...}` (object),
`!(...)` → `[...]` (array)

- the JSON literals that look like identifiers (`true`, `false` and `null`) are represented as `!` sequences:

Literals: `!t` (true), `!f` (false), `!n` (null)

The `!` character plays two similar but different roles, as an escape
character within strings, and as a marker for special values. This may be
confusing.

Notice that services can distinguish Rison-encoded strings from JSON-encoded
strings by checking the first character. Rison structures start with `(` or
`!(`. JSON structures start with `[` or `{`. This means that a service which
expects a JSON encoded object or array can accept Rison-encoded objects
without loss of compatibility.

## Interaction with URI %-encoding

Rison syntax is designed to produce strings that be legible after being [form-
encoded](http://www.w3.org/TR/html4/interact/forms.html#form-content-type) for
the [query](http://gbiv.com/protocols/uri/rfc/rfc3986.html#query) section of a
URI. None of the characters in the Rison syntax need to be URI encoded in that
context, though the data itself may require URI encoding. Rison tries to be
orthogonal to the %-encoding process - it just defines a string format that
should survive %-encoding with very little bloat. Rison quoting is only
applied when necessary to quote characters that might otherwise be interpreted
as special syntax.

Note that most URI encoding libraries are very conservative, percent-encoding
many characters that are legal according to [RFC
3986](http://gbiv.com/protocols/uri/rfc/rfc3986.html). For example,
Javascript's builtin `encodeURIComponent()` will still make Rison
strings difficult to read. The rison.js library includes a more tolerant URI
encoder.

Rison uses its own quoting for strings, using the single quote (`**'**`) as a
string delimiter and the exclamation point (`**!**`) as the string escape
character. Both of these characters are legal in uris. Rison quoting is
largely inspired by Unix shell command line parsing.

All Unicode characters other than `**'**` and `**!**` are legal inside quoted
strings. This includes newlines and control characters. Quoting all such
characters is left to the %-encoding process.

### Interaction with IRIs

This still needs to be addressed. Advice from an IRI expert would be very
welcome.

Particular attention should be paid to Unicode characters that may be
interpreted as Rison syntax characters.

The _idchars_ set is hard to define well. The goal is to include foreign
language alphanumeric characters and some punctuation that is common in
identifiers ("`_`", "`-`", "`.`", "`/`", and others). However, whitespace and
most punctuation characters should require quoting.

## Emailing URIs

Most text emailers are conservative about what they turn into a hyperlink, and
they will assume that characters like '(' mean the end of the URI. This
results in broken, truncated links.

This is actually a problem with URI encoding rather than with Rison, but it
comes up a lot in practice. You could use Rison with a more aggressive URI
encoder to generate emailable URIs. You can also wrap your emailed URIs in
angle brackets: `<http://...>` which some mail readers have better luck with.

## Further Rationale

**Passing data in URIs** is necessary in many situations. Many web services rely on the HTTP GET method, which can take advantage of an extensive deployed caching infrastructure. Browsers also have different capabilities for GET, including the crucial ability to make cross-site requests. It is also very convenient to store the state of a small browser application in the URI.

**Human readability** makes everything go faster. Primarily this means avoiding URI encoding whenever possible. This requires careful choice of characters for the syntax, and a tolerant URI encoder that only encodes characters when absolutely necessary.

**Compactness** is important because of implementation limits on URI length. Internet Explorer is once again the weakest link at 2K. One could certainly invent a more compact representation by dropping the human-readable constraint and using a compression algorithm.

## Variations

There are several variations on Rison which are useful or at least thought-
provoking.

#### O-Rison

When you know the parameter being encoded will always be an object, always
wrapping it in a containing `()` is unnecessary and hard to explain. Until
you've dealt with nested structures, the need for parentheses is hard to
explain. In this case you may wish to declare that the argument is encoded in
_O-Rison_, which can be translated to Rison by wrapping it in parentheses.

Here's a URI with a single query argument which is a nested structure:
`http://example.com/service?query=(q:'*',start:10,count:10)`

This is more legible if you specify that the argument is O-Rison instead of
Rison, and leave the containing `()` as implied:
`http://example.com/service?query=q:'*',start:10,count:10`

This seems to be useful in enough situations that it is worth defining the
term _O-Rison_.

#### A-Rison

Similarly, sometimes you know the value will always be an array. Instead of
specifying a Rison argument: `.../?items=!(item1,item2,item3)` you can specify
the far more legible A-Rison argument: `.../?items=item1,item2,item3`

#### Accepting other delimiters

Notice that O-Rison looks almost like a drop-in replacement for [ URL form
encoding](http://www.w3.org/TR/html4/interact/forms.html#form-content-type),
with two substitutions:

- "`:`" for "`=`"
- "`,`" for "`&`"

We could expand the Rison parser to treat all of "`,`", "`&`", and "`;`" as
valid item separators and both "`:`" and "`=`" as key-value separators. In
this case the vast majority of URI queries would form a flat subset of
O-Rison. The exceptions are services that depend on ordering of query
parameters or allow duplicate parameter names.

This extension doesn't change the parsing of standard Rison strings because
"`&`", "`=`", and "`;`" are already illegal in Rison identifiers.

## Examples

See Quick Start above for typical usage. For more complex cases, check the tests in `src/*.spec.ts`.

## Contributing

- Run tests: `pnpm test`
- Typecheck: `pnpm run typecheck`
- Format: `pnpm run format`

## License

MIT — see [LICENSE.md](./LICENSE.md).

Copyright © 2007–2009 Metaweb Technologies, Inc.
Copyright © 2024–present, Sebastian Software GmbH, Germany.

## Releasing

Manual, assisted by release-it. Ensure your npm and GitHub tokens are configured locally.

```
pnpm install
pnpm run release
```

This runs typecheck/tests, builds, bumps the version, publishes to npm (public), tags the release,
and publishes a GitHub Release.

## Acknowledgments

- Originally created and published by Metaweb Technologies, Inc. (Google).
- Encoder inspired by Douglas Crockford's json.js; decoder inspired by Oliver Steele's JSON for OpenLaszlo.
- Thanks to all [contributors](https://github.com/sebastian-software/effective-rison/graphs/contributors) over the years.
