// HTML response charset declaration.
//
// Astro constructs page responses with a bare `Content-Type: text/html`
// (`astro/dist/runtime/server/render/page.js`) and encodes the body with
// `TextEncoder`, which is always UTF-8. The bytes are therefore correct while
// the declaration is absent, and a client that reads only the HTTP header has
// no encoding to use: RFC-era practice for `text/*` without a charset is
// ISO-8859-1, under which every multi-byte character in the /zh/ routes decodes
// into replacement noise. The document's own `<meta charset="utf-8">` rescues
// browsers, but not a client that never parses the body.
//
// This module resolves the corrected header value. It is a pure function so the
// behaviour can be exercised directly by tests, including inputs that must NOT
// be rewritten. It has no Node/runtime dependencies so it bundles into the SSR
// worker safely.
//
// Parameters are parsed, not pattern-matched. An earlier revision split on
// every `;` and tested each fragment with `startsWith("charset=")`, which was
// wrong in both directions at once: a quoted parameter value containing a
// semicolon (`foo="a;charset=big5"`) produced a fragment that looked like a
// charset declaration and suppressed a needed fix, while a parameter written
// `charset =utf-8` was not recognised and got a second charset appended after
// it. One naive parse, two opposite defects — so the parse is what changed,
// not the two symptoms.

const HTML_MEDIA_TYPE = "text/html";
const CHARSET_PARAMETER = "charset";

// Split a header value on the semicolons that actually separate parameters —
// that is, those outside a quoted-string. RFC 9110 quoted-strings may contain
// `;`, and may escape any character with a backslash.
function splitOnUnquotedSemicolons(value: string): string[] {
  const segments: string[] = [];
  let current = "";
  let inQuotes = false;
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && inQuotes) {
      current += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      inQuotes = !inQuotes;
      current += character;
      continue;
    }
    if (character === ";" && !inQuotes) {
      segments.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  segments.push(current);
  return segments;
}

// The parameter's name is the token before its first `=`. Compared after
// trimming and lowercasing, so `charset=`, `CHARSET=`, and the malformed but
// unmistakable `charset =` are all recognised as a declaration already present.
function isCharsetParameter(parameter: string): boolean {
  const separator = parameter.indexOf("=");
  const name = separator === -1 ? parameter : parameter.slice(0, separator);
  return name.trim().toLowerCase() === CHARSET_PARAMETER;
}

// Return the corrected `Content-Type` value, or null when the header must be
// left exactly as it is.
//
// Rewrites ONLY a `text/html` response that declares no charset at all. An
// explicit charset is never overridden — including one that is not UTF-8 —
// because a deliberate declaration elsewhere is data this module does not have
// the standing to overrule. Every other media type is left untouched.
export function resolveHtmlCharset(contentType: string | null): string | null {
  if (contentType === null) return null;

  const [mediaType, ...parameters] = splitOnUnquotedSemicolons(contentType);
  if (mediaType.trim().toLowerCase() !== HTML_MEDIA_TYPE) return null;
  if (parameters.some(isCharsetParameter)) return null;

  // Preserve any other parameters and their order; append the charset last.
  return [contentType.replace(/;\s*$/, ""), `${CHARSET_PARAMETER}=utf-8`].join("; ");
}
