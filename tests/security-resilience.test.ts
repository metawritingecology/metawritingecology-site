// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Package 2A — Custom 404 and response-header architecture.
//
// These are deterministic source-contract tests. They read the actual source
// files (404 route, SSR middleware, static _headers, astro.config.mjs) and
// assert the fixed Package 2A decisions by parsing the ACTUAL structures — not
// by unrelated substring searches and not by comparing a constant to itself.
// They exercise no browser and no runtime, so Report-Only CSP violations from
// known inline scripts cannot make them fail — that behavioural evidence
// belongs to a later preview stage. They also do not depend on build output:
// every read targets a repository source file, and the duplicate/CRLF cases
// run against in-memory fixtures without mutating public/_headers or
// dist/_headers.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const path = (rel) => fileURLToPath(new URL(rel, root));
const rd = (rel) => readFileSync(path(rel), "utf8");

const notFound = rd("src/pages/404.astro");
const middleware = rd("src/middleware.ts");
const headers = rd("public/_headers");
const astroConfig = rd("astro.config.mjs");

// ---------------------------------------------------------------------------
// Approved Package 2A policy — the single expected source of truth.
// ---------------------------------------------------------------------------

// Insertion order matches both the middleware ENFORCED_HEADERS object and the
// /* block in public/_headers, so directive-order comparisons stay exact.
const EXPECTED_ENFORCED = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Content-Security-Policy": "frame-ancestors 'self';"
};
const EXPECTED_REPORT_ONLY_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self' https://66a032cb-79af-46cb-82f1-2576f76bae9d.search.ai.cloudflare.com; form-action 'self'; upgrade-insecure-requests;";

const EXPECTED_CATCH_ALL_BODY = [
  ...Object.entries(EXPECTED_ENFORCED).map(([name, value]) => `${name}: ${value}`),
  `Content-Security-Policy-Report-Only: ${EXPECTED_REPORT_ONLY_CSP}`
];
const EXPECTED_MANIFEST_BODY = [
  "Content-Type: application/json; charset=utf-8",
  "Cache-Control: no-cache, must-revalidate",
  "X-Robots-Tag: noindex, nofollow, nosnippet"
];
const EXPECTED_SNAPSHOT_BODY = [
  "Content-Type: application/json; charset=utf-8",
  "Cache-Control: public, max-age=31536000, immutable",
  "X-Robots-Tag: noindex, nofollow, nosnippet"
];

const APPROVED_404_ROUTES = ["/", "/about/", "/surfaces/", "/entry-points/"];
const FORBIDDEN_404_TERMS = [
  "private",
  "hidden",
  "unpublished",
  "suppress",
  "archive",
  "registry",
  "internal"
];

// ---------------------------------------------------------------------------
// Shared bounded parsers. These enforce the same observable contract the build
// verifier (scripts/verify-public-surface-map-build.mjs, check 13) enforces:
// CRLF/LF normalization, exact path equality, all-occurrence discovery, a
// one-and-only-one uniqueness requirement, and exact ordered directive bodies.
// ---------------------------------------------------------------------------

// Parse EVERY rule block out of a _headers text. Each non-indented, non-empty
// line is a path rule; the indented, non-empty lines that follow are its
// ordered directives. Blank lines are tolerated as separators; a block ends at
// the next path rule or end of file (final block included). Handles LF and CRLF
// identically.
const parseHeaderBlocks = (text) => {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let current = null;
  for (const raw of lines) {
    if (raw.trim() === "") continue;
    if (/^\s/.test(raw)) {
      if (current) current.body.push(raw.trim());
      continue;
    }
    current = { path: raw.trim(), body: [] };
    blocks.push(current);
  }
  return blocks;
};

const requireUnique = (blocks, pathLine) => {
  const matches = blocks.filter((block) => block.path === pathLine);
  assert.equal(
    matches.length,
    1,
    `expected exactly one "${pathLine}" rule, found ${matches.length}`
  );
  return matches[0];
};

const directiveMap = (body) => {
  const map = {};
  for (const line of body) {
    const idx = line.indexOf(":");
    assert.ok(idx > 0, `malformed directive line: ${line}`);
    map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return map;
};

// Full _headers contract used by both the real-file test and the synthetic
// fixtures. Throws (AssertionError) on any violation; returns the three parsed
// target blocks on success.
const validateHeadersContract = (text) => {
  const blocks = parseHeaderBlocks(text);
  const catchAll = requireUnique(blocks, "/*");
  const manifest = requireUnique(blocks, "/public-surface-map/data/manifest.json");
  const snapshot = requireUnique(blocks, "/public-surface-map/data/snapshots/*");

  assert.deepEqual(catchAll.body, EXPECTED_CATCH_ALL_BODY);
  assert.deepEqual(manifest.body, EXPECTED_MANIFEST_BODY);
  assert.deepEqual(snapshot.body, EXPECTED_SNAPSHOT_BODY);

  // X-Content-Type-Options, the enforced CSP, and the Report-Only CSP must live
  // only in the catch-all block, never in a path-specific block.
  for (const block of [manifest, snapshot]) {
    assert.equal(block.body.some((l) => /^X-Content-Type-Options:/i.test(l)), false);
    assert.equal(block.body.some((l) => /^Content-Security-Policy:/i.test(l)), false);
    assert.equal(block.body.some((l) => /^Content-Security-Policy-Report-Only:/i.test(l)), false);
  }

  assert.ok(
    blocks.indexOf(manifest) < blocks.indexOf(snapshot),
    "manifest rule must precede snapshot rule"
  );
  assert.equal(text.includes("security.txt"), false, "no security.txt rule in Package 2A");

  return { blocks, catchAll, manifest, snapshot };
};

// Parse the ACTUAL middleware ENFORCED_HEADERS object into a key→value mapping
// so the test relates each header key to its assigned value, not to a value
// that merely appears somewhere in the file.
const parseMiddlewareEnforced = (src) => {
  const objectMatch = src.match(/ENFORCED_HEADERS[^=]*=\s*\{([\s\S]*?)\}/);
  assert.ok(objectMatch, "ENFORCED_HEADERS object literal not found in middleware");
  const body = objectMatch[1];
  const map = {};
  const pair = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = pair.exec(body)) !== null) map[m[1]] = m[2];
  return map;
};

const parseMiddlewareReportOnly = (src) => {
  const m = src.match(/REPORT_ONLY_CSP\s*=\s*"((?:[^"\\]|\\.)*)"/);
  assert.ok(m, "REPORT_ONLY_CSP assignment not found in middleware");
  return m[1];
};

// ---------------------------------------------------------------------------
// 404 source contract
// ---------------------------------------------------------------------------

test("404: source file exists", () => {
  assert.ok(existsSync(path("src/pages/404.astro")), "src/pages/404.astro must exist");
});

test("404: emits no canonical link", () => {
  assert.equal(/rel=["']canonical["']/.test(notFound), false);
});

test("404: emits no JSON-LD", () => {
  assert.equal(notFound.includes("application/ld+json"), false);
  assert.equal(notFound.includes("SchemaJsonLd"), false);
});

test("404: does not use BaseLayout", () => {
  assert.equal(notFound.includes("BaseLayout"), false);
});

test("404: contains no private/hidden/unpublished/archive implication", () => {
  const lower = notFound.toLowerCase();
  for (const term of FORBIDDEN_404_TERMS) {
    assert.equal(lower.includes(term), false, `404 must not imply "${term}"`);
  }
});

test("404: declares noindex, follow", () => {
  assert.match(notFound, /name=["']robots["']\s+content=["']noindex,\s*follow["']/);
});

test("404: links to exactly the four approved stable routes", () => {
  const anchors = [...notFound.matchAll(/<a\s+href=["']([^"']+)["']/g)].map((m) => m[1]);
  assert.deepEqual(anchors.sort(), [...APPROVED_404_ROUTES].sort());
});

test("404: is not referenced by sitemap configuration", () => {
  assert.equal(astroConfig.includes("404"), false);
});

// ---------------------------------------------------------------------------
// Middleware contract — parsed key→value mapping, not substring searches.
// ---------------------------------------------------------------------------

test("middleware: ENFORCED_HEADERS maps exactly the four approved key→value pairs", () => {
  const actual = parseMiddlewareEnforced(middleware);
  assert.equal(Object.keys(actual).length, 4, "exactly four enforced headers expected");
  // Relates each actual header key to its actual assigned value. Fails on a
  // wrong value, an extra header, a missing header, or a correct value that
  // appears only elsewhere (not under its key).
  assert.deepEqual(actual, EXPECTED_ENFORCED);
});

test("middleware: enforced Content-Security-Policy value is exactly frame-ancestors 'self';", () => {
  const actual = parseMiddlewareEnforced(middleware);
  assert.equal(actual["Content-Security-Policy"], "frame-ancestors 'self';");
});

test("middleware: REPORT_ONLY_CSP holds the exact approved broader policy", () => {
  assert.equal(parseMiddlewareReportOnly(middleware), EXPECTED_REPORT_ONLY_CSP);
});

test("middleware: Report-Only CSP is set under the Content-Security-Policy-Report-Only header", () => {
  // Ties the header NAME to the REPORT_ONLY_CSP variable; fails if the broader
  // policy is emitted under the wrong header name (e.g. enforced CSP).
  assert.match(
    middleware,
    /response\.headers\.set\(\s*"Content-Security-Policy-Report-Only"\s*,\s*REPORT_ONLY_CSP\s*\)/
  );
});

test("middleware: enforced loop sets each parsed key/value from Object.entries(ENFORCED_HEADERS)", () => {
  const loop = middleware.match(
    /for\s*\(\s*const\s*\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*of\s*Object\.entries\(\s*ENFORCED_HEADERS\s*\)\s*\)/
  );
  assert.ok(loop, "expected an Object.entries(ENFORCED_HEADERS) iteration");
  const [, keyVar, valVar] = loop;
  const setter = new RegExp(
    `response\\.headers\\.set\\(\\s*${keyVar}\\s*,\\s*${valVar}\\s*\\)`
  );
  assert.match(middleware, setter);
});

test("middleware: no unsafe-inline or unsafe-eval", () => {
  assert.equal(middleware.includes("unsafe-inline"), false);
  assert.equal(middleware.includes("unsafe-eval"), false);
});

test("middleware: no reporting endpoint", () => {
  assert.equal(/report-uri/i.test(middleware), false);
  assert.equal(/report-to/i.test(middleware), false);
  assert.equal(/reporting-endpoints/i.test(middleware), false);
});

test("middleware: no HSTS, X-Frame-Options, COOP, CORP, or COEP", () => {
  assert.equal(/strict-transport-security/i.test(middleware), false);
  assert.equal(/x-frame-options/i.test(middleware), false);
  assert.equal(/cross-origin-opener-policy/i.test(middleware), false);
  assert.equal(/cross-origin-resource-policy/i.test(middleware), false);
  assert.equal(/cross-origin-embedder-policy/i.test(middleware), false);
});

test("middleware: uses next()", () => {
  assert.match(middleware, /next\(\)/);
});

test("middleware: preserves status and existing headers (no Response rebuild, no forced 200)", () => {
  assert.equal(middleware.includes("new Response"), false);
  assert.equal(/status\s*[:=]\s*200/.test(middleware), false);
});

test("middleware: introduces no URL / query-string / body logging", () => {
  assert.equal(middleware.includes("console."), false);
});

// ---------------------------------------------------------------------------
// _headers contract — real block parsing over public/_headers.
// ---------------------------------------------------------------------------

test("_headers: parses into exactly one catch-all, manifest, and snapshot rule with exact bodies", () => {
  const { catchAll, manifest, snapshot } = validateHeadersContract(headers);
  assert.deepEqual(catchAll.body, EXPECTED_CATCH_ALL_BODY);
  assert.deepEqual(manifest.body, EXPECTED_MANIFEST_BODY);
  assert.deepEqual(snapshot.body, EXPECTED_SNAPSHOT_BODY);
});

test("_headers: X-Content-Type-Options, enforced CSP, and Report-Only CSP exist only in the catch-all", () => {
  const { catchAll, manifest, snapshot } = validateHeadersContract(headers);
  const catchNames = Object.keys(directiveMap(catchAll.body));
  assert.ok(catchNames.includes("X-Content-Type-Options"));
  assert.ok(catchNames.includes("Content-Security-Policy"));
  assert.ok(catchNames.includes("Content-Security-Policy-Report-Only"));
  for (const block of [manifest, snapshot]) {
    const names = Object.keys(directiveMap(block.body));
    assert.equal(names.includes("X-Content-Type-Options"), false);
    assert.equal(names.includes("Content-Security-Policy"), false);
    assert.equal(names.includes("Content-Security-Policy-Report-Only"), false);
  }
});

test("_headers: manifest and snapshot retain exact MIME, cache, and robots contracts", () => {
  const { manifest, snapshot } = validateHeadersContract(headers);
  const m = directiveMap(manifest.body);
  assert.equal(m["Content-Type"], "application/json; charset=utf-8");
  assert.equal(m["Cache-Control"], "no-cache, must-revalidate");
  assert.equal(m["X-Robots-Tag"], "noindex, nofollow, nosnippet");
  const s = directiveMap(snapshot.body);
  assert.equal(s["Content-Type"], "application/json; charset=utf-8");
  assert.equal(s["Cache-Control"], "public, max-age=31536000, immutable");
  assert.equal(s["X-Robots-Tag"], "noindex, nofollow, nosnippet");
});

test("_headers: no security.txt rule exists yet", () => {
  assert.equal(headers.includes("security.txt"), false);
});

// ---------------------------------------------------------------------------
// Synthetic fixtures — prove uniqueness rejection and CRLF acceptance without
// touching the real public/_headers or dist/_headers.
// ---------------------------------------------------------------------------

const VALID_CATCH_ALL = ["/*", ...EXPECTED_CATCH_ALL_BODY.map((l) => `  ${l}`)].join("\n");
const VALID_MANIFEST = [
  "/public-surface-map/data/manifest.json",
  ...EXPECTED_MANIFEST_BODY.map((l) => `  ${l}`)
].join("\n");
const VALID_SNAPSHOT = [
  "/public-surface-map/data/snapshots/*",
  ...EXPECTED_SNAPSHOT_BODY.map((l) => `  ${l}`)
].join("\n");

// A minimal, self-consistent valid file assembled from the approved bodies.
const VALID_FIXTURE = [VALID_CATCH_ALL, VALID_MANIFEST, VALID_SNAPSHOT].join("\n\n") + "\n";

test("_headers fixture: a valid synthetic file passes the contract", () => {
  assert.doesNotThrow(() => validateHeadersContract(VALID_FIXTURE));
});

test("_headers fixture: duplicate /* (second block conflicting) is rejected", () => {
  const conflictingCatchAll = [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: no-referrer" // conflicts with the approved value
  ].join("\n");
  const fixture = [VALID_FIXTURE.trimEnd(), conflictingCatchAll].join("\n\n") + "\n";
  assert.throws(() => validateHeadersContract(fixture), /exactly one "\/\*" rule, found 2/);
});

test("_headers fixture: duplicate manifest rule (second block conflicting) is rejected", () => {
  const conflictingManifest = [
    "/public-surface-map/data/manifest.json",
    "  Content-Type: text/plain; charset=utf-8", // conflicts
    "  Cache-Control: no-cache, must-revalidate",
    "  X-Robots-Tag: noindex, nofollow, nosnippet"
  ].join("\n");
  const fixture = [VALID_FIXTURE.trimEnd(), conflictingManifest].join("\n\n") + "\n";
  assert.throws(
    () => validateHeadersContract(fixture),
    /exactly one "\/public-surface-map\/data\/manifest\.json" rule, found 2/
  );
});

test("_headers fixture: duplicate snapshot rule (second block conflicting) is rejected", () => {
  const conflictingSnapshot = [
    "/public-surface-map/data/snapshots/*",
    "  Content-Type: application/json; charset=utf-8",
    "  Cache-Control: no-store", // conflicts
    "  X-Robots-Tag: noindex, nofollow, nosnippet"
  ].join("\n");
  const fixture = [VALID_FIXTURE.trimEnd(), conflictingSnapshot].join("\n\n") + "\n";
  assert.throws(
    () => validateHeadersContract(fixture),
    /exactly one "\/public-surface-map\/data\/snapshots\/\*" rule, found 2/
  );
});

test("_headers fixture: a CRLF-terminated equivalent file is accepted", () => {
  // The real repository file, re-terminated with CRLF, must validate identically
  // — proving LF/CRLF normalization. Uses the actual public/_headers content.
  const crlf = headers.replace(/\r?\n/g, "\r\n");
  assert.ok(crlf.includes("\r\n"), "fixture must actually use CRLF");
  assert.doesNotThrow(() => validateHeadersContract(crlf));
});

// ---------------------------------------------------------------------------
// Cross-layer consistency — compares the parsed actual middleware mapping with
// the parsed actual catch-all directive mapping, not substring occurrences.
// ---------------------------------------------------------------------------

test("cross-layer: middleware enforced mapping equals the _headers catch-all enforced directives", () => {
  const mwEnforced = parseMiddlewareEnforced(middleware);
  const { catchAll } = validateHeadersContract(headers);
  const catchDirectives = directiveMap(catchAll.body);
  const catchEnforced = {};
  for (const name of Object.keys(mwEnforced)) catchEnforced[name] = catchDirectives[name];
  assert.deepEqual(mwEnforced, catchEnforced);
});

test("cross-layer: middleware and _headers carry the identical Report-Only CSP", () => {
  const mwReportOnly = parseMiddlewareReportOnly(middleware);
  const { catchAll } = validateHeadersContract(headers);
  const catchDirectives = directiveMap(catchAll.body);
  assert.equal(mwReportOnly, catchDirectives["Content-Security-Policy-Report-Only"]);
  assert.equal(mwReportOnly, EXPECTED_REPORT_ONLY_CSP);
});

test("cross-layer: enforced CSP and Report-Only CSP are distinct", () => {
  const mwEnforced = parseMiddlewareEnforced(middleware);
  assert.notEqual(mwEnforced["Content-Security-Policy"], parseMiddlewareReportOnly(middleware));
});
