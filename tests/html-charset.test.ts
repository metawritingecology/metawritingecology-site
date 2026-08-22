// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// HTML charset declaration.
//
// These are BEHAVIOURAL tests of the resolver, not source-substring checks:
// every case runs the actual function and asserts the actual returned value.
// The rewrite cases fail if the charset is not appended; the preservation cases
// fail if it is appended where it must not be. A resolver that always rewrote,
// or always returned null, fails this file.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveHtmlCharset } from "../src/lib/htmlCharset.ts";

// ---------------------------------------------------------------------------
// Rewritten: text/html with no charset at all.
// ---------------------------------------------------------------------------

test("a bare text/html gains the UTF-8 charset", () => {
  assert.equal(resolveHtmlCharset("text/html"), "text/html; charset=utf-8");
});

test("the exact header Astro emits is the header that gets corrected", () => {
  // astro/dist/runtime/server/render/page.js constructs Headers with
  // ["Content-Type", "text/html"] and encodes the body via TextEncoder (UTF-8).
  // If Astro ever starts emitting a charset itself, the preservation test below
  // is what keeps this middleware from fighting it.
  assert.equal(resolveHtmlCharset("text/html"), "text/html; charset=utf-8");
});

test("media type matching is case-insensitive and tolerates surrounding space", () => {
  assert.equal(resolveHtmlCharset("TEXT/HTML"), "TEXT/HTML; charset=utf-8");
  assert.equal(resolveHtmlCharset(" text/html "), " text/html ; charset=utf-8");
});

test("an unrelated parameter is preserved and the charset is appended after it", () => {
  assert.equal(
    resolveHtmlCharset("text/html; boundary=x"),
    "text/html; boundary=x; charset=utf-8"
  );
});

test("a trailing semicolon does not produce an empty parameter", () => {
  assert.equal(resolveHtmlCharset("text/html;"), "text/html; charset=utf-8");
});

// ---------------------------------------------------------------------------
// Preserved: anything already declaring a charset, and every other media type.
// ---------------------------------------------------------------------------

test("an existing UTF-8 declaration is not duplicated", () => {
  assert.equal(resolveHtmlCharset("text/html; charset=utf-8"), null);
  assert.equal(resolveHtmlCharset("text/html;charset=utf-8"), null);
  assert.equal(resolveHtmlCharset("text/html; CHARSET=UTF-8"), null);
});

test("a deliberate non-UTF-8 declaration is never overridden", () => {
  // This module has no standing to overrule an explicit declaration made
  // elsewhere, even a wrong-looking one. Silently rewriting it would be the
  // 2026-07-28 failure shape: one layer deciding another layer's encoding.
  assert.equal(resolveHtmlCharset("text/html; charset=iso-8859-1"), null);
  assert.equal(resolveHtmlCharset("text/html; charset=big5"), null);
});

test("other media types are left exactly as received", () => {
  for (const contentType of [
    "text/plain",
    "text/plain; charset=utf-8",
    "application/json",
    "application/json; charset=utf-8",
    "application/xml",
    "image/png",
    "text/css",
    "application/javascript"
  ]) {
    assert.equal(resolveHtmlCharset(contentType), null, contentType);
  }
});

// ---------------------------------------------------------------------------
// Parameter parsing. Both cases below come from the first revision of this
// module, which split on every `;` and matched `startsWith("charset=")`. They
// are the two opposite failures that one naive parse produced, and they are
// kept together so a future "simplification" back to string matching fails
// here rather than in production.
// ---------------------------------------------------------------------------

test("a semicolon inside a quoted parameter value does not fake a charset", () => {
  // There is no charset parameter here — `charset=big5` is inside foo's quoted
  // value. Splitting on every `;` makes it look like one and suppresses the fix.
  assert.equal(
    resolveHtmlCharset('text/html; foo="a;charset=big5"'),
    'text/html; foo="a;charset=big5"; charset=utf-8'
  );
  assert.equal(
    resolveHtmlCharset('text/html; foo="x;charset=utf-16"; bar=1'),
    'text/html; foo="x;charset=utf-16"; bar=1; charset=utf-8'
  );
});

test("an escaped quote does not prematurely close a parameter value", () => {
  // foo's value is the three characters  a"b  . The charset that follows is a
  // real parameter, so nothing is appended.
  assert.equal(
    resolveHtmlCharset('text/html; foo="a\\"b"; charset=big5'),
    null
  );
  // Here the same escaped quote keeps `charset=big5` INSIDE foo's value, so
  // there is no charset parameter and the fix must still be applied.
  assert.equal(
    resolveHtmlCharset('text/html; foo="a\\";charset=big5"'),
    'text/html; foo="a\\";charset=big5"; charset=utf-8'
  );
});

test("a charset parameter written with stray space is still a declaration", () => {
  // Malformed per RFC 9110, but unmistakably a declaration. Appending a second
  // charset after it would produce a header with two of them.
  assert.equal(resolveHtmlCharset("text/html;  charset =utf-8"), null);
  assert.equal(resolveHtmlCharset("text/html; charset	=big5"), null);
});

test("a bare charset parameter with no value is treated as declared", () => {
  assert.equal(resolveHtmlCharset("text/html; charset"), null);
  assert.equal(resolveHtmlCharset("text/html; charset="), null);
});

test("a parameter whose NAME merely contains charset is not a declaration", () => {
  assert.equal(
    resolveHtmlCharset("text/html; xcharset=big5"),
    "text/html; xcharset=big5; charset=utf-8"
  );
  assert.equal(
    resolveHtmlCharset("text/html; charsetx=big5"),
    "text/html; charsetx=big5; charset=utf-8"
  );
});

test("a media type that merely starts with text/html is not matched", () => {
  // Guards against a `startsWith` implementation.
  assert.equal(resolveHtmlCharset("text/htmlx"), null);
  assert.equal(resolveHtmlCharset("text/html-fragment"), null);
});

test("a missing Content-Type header is left missing", () => {
  assert.equal(resolveHtmlCharset(null), null);
});

// ---------------------------------------------------------------------------
// The resolver is not vacuous.
// ---------------------------------------------------------------------------

test("the resolver both rewrites and preserves across a mixed set", () => {
  // A resolver stuck at "always null" or "always rewrite" cannot pass this.
  const inputs = [
    "text/html",
    "text/html; charset=utf-8",
    "application/json",
    "text/html; boundary=x"
  ];
  const results = inputs.map((value) => resolveHtmlCharset(value));
  assert.equal(results.filter((value) => value !== null).length, 2);
  assert.equal(results.filter((value) => value === null).length, 2);
});
