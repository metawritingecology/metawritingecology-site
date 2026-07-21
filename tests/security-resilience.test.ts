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

// Package 2B source files. security.txt is read raw so byte-level line-ending
// and final-newline contracts can be asserted exactly.
const securityTxtRaw = rd("public/.well-known/security.txt");
const securityMd = rd("SECURITY.md");
const securityObservabilityMd = rd("SECURITY_OBSERVABILITY.md");

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

// Package 2B — /.well-known/security.txt path-specific rule. Exactly two
// ordered directives; it must NOT repeat any Package 2A catch-all security
// header and must NOT carry X-Robots-Tag.
const EXPECTED_SECURITY_TXT_HEADER_BODY = [
  "Content-Type: text/plain; charset=utf-8",
  "Cache-Control: public, max-age=3600, must-revalidate"
];

// Package 2B — approved security.txt document. Exactly three fields, in order.
const APPROVED_SECURITY_CONTACT = "security@metawritingecology.org";
const APPROVED_SECURITY_EXPIRES = "2027-06-30T23:59:59Z";
const APPROVED_SECURITY_CANONICAL =
  "https://metawritingecology.org/.well-known/security.txt";
const EXPECTED_SECURITY_TXT_LINES = [
  `Contact: mailto:${APPROVED_SECURITY_CONTACT}`,
  `Expires: ${APPROVED_SECURITY_EXPIRES}`,
  `Canonical: ${APPROVED_SECURITY_CANONICAL}`
];

// Fields that must never appear in security.txt (beyond the three approved).
const FORBIDDEN_SECURITY_TXT_FIELDS = [
  "Policy",
  "Preferred-Languages",
  "Encryption",
  "Acknowledgments",
  "Acknowledgements",
  "Hiring"
];

// Operational commitments that must not appear anywhere in the new Package 2B
// files (case-insensitive substring match).
const FORBIDDEN_COMMITMENT_TERMS = [
  "response time",
  "response-time",
  "resolution time",
  "resolution-time",
  "bug bounty",
  "safe harbor",
  "safe-harbor"
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
  const securityTxt = requireUnique(blocks, "/.well-known/security.txt");
  const manifest = requireUnique(blocks, "/public-surface-map/data/manifest.json");
  const snapshot = requireUnique(blocks, "/public-surface-map/data/snapshots/*");

  assert.deepEqual(catchAll.body, EXPECTED_CATCH_ALL_BODY);
  assert.deepEqual(securityTxt.body, EXPECTED_SECURITY_TXT_HEADER_BODY);
  assert.deepEqual(manifest.body, EXPECTED_MANIFEST_BODY);
  assert.deepEqual(snapshot.body, EXPECTED_SNAPSHOT_BODY);

  // X-Content-Type-Options, the enforced CSP, and the Report-Only CSP must live
  // only in the catch-all block, never in a path-specific block.
  for (const block of [securityTxt, manifest, snapshot]) {
    assert.equal(block.body.some((l) => /^X-Content-Type-Options:/i.test(l)), false);
    assert.equal(block.body.some((l) => /^Content-Security-Policy:/i.test(l)), false);
    assert.equal(block.body.some((l) => /^Content-Security-Policy-Report-Only:/i.test(l)), false);
  }

  // The Package 2B security.txt rule additionally must not repeat Referrer-Policy
  // or Permissions-Policy (also catch-all only) and must not carry X-Robots-Tag.
  const securityTxtNames = Object.keys(directiveMap(securityTxt.body));
  for (const forbidden of [
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Robots-Tag"
  ]) {
    assert.equal(
      securityTxtNames.includes(forbidden),
      false,
      `security.txt rule must not carry ${forbidden}`
    );
  }

  assert.ok(
    blocks.indexOf(manifest) < blocks.indexOf(snapshot),
    "manifest rule must precede snapshot rule"
  );

  return { blocks, catchAll, securityTxt, manifest, snapshot };
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

test("_headers: exactly one /.well-known/security.txt rule with the exact ordered two-directive body", () => {
  const { securityTxt } = validateHeadersContract(headers);
  assert.deepEqual(securityTxt.body, EXPECTED_SECURITY_TXT_HEADER_BODY);
  const map = directiveMap(securityTxt.body);
  assert.equal(map["Content-Type"], "text/plain; charset=utf-8");
  assert.equal(map["Cache-Control"], "public, max-age=3600, must-revalidate");
});

test("_headers: security.txt rule repeats no Package 2A catch-all header and carries no X-Robots-Tag", () => {
  const { securityTxt } = validateHeadersContract(headers);
  const names = Object.keys(directiveMap(securityTxt.body));
  for (const forbidden of [
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
    "Content-Security-Policy-Report-Only",
    "X-Robots-Tag"
  ]) {
    assert.equal(names.includes(forbidden), false, `security.txt must not carry ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// Synthetic fixtures — prove uniqueness rejection and CRLF acceptance without
// touching the real public/_headers or dist/_headers.
// ---------------------------------------------------------------------------

const VALID_CATCH_ALL = ["/*", ...EXPECTED_CATCH_ALL_BODY.map((l) => `  ${l}`)].join("\n");
const VALID_SECURITY_TXT = [
  "/.well-known/security.txt",
  ...EXPECTED_SECURITY_TXT_HEADER_BODY.map((l) => `  ${l}`)
].join("\n");
const VALID_MANIFEST = [
  "/public-surface-map/data/manifest.json",
  ...EXPECTED_MANIFEST_BODY.map((l) => `  ${l}`)
].join("\n");
const VALID_SNAPSHOT = [
  "/public-surface-map/data/snapshots/*",
  ...EXPECTED_SNAPSHOT_BODY.map((l) => `  ${l}`)
].join("\n");

// A minimal, self-consistent valid file assembled from the approved bodies.
const VALID_FIXTURE =
  [VALID_CATCH_ALL, VALID_SECURITY_TXT, VALID_MANIFEST, VALID_SNAPSHOT].join("\n\n") + "\n";

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

// ---------------------------------------------------------------------------
// Package 2B — security.txt source contract.
// ---------------------------------------------------------------------------

// Extract every email address literal from a text. Used to prove that the only
// address present anywhere in the new Package 2B files is the approved public
// contact — i.e. no private forwarding destination leaked. Deliberately does
// NOT hard-code or attempt to discover the private mailbox.
const emailsIn = (text) => [...text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].map((m) => m[0]);

test("security.txt: source file exists", () => {
  assert.ok(existsSync(path("public/.well-known/security.txt")), "public/.well-known/security.txt must exist");
});

test("security.txt: is exactly the three approved fields, in order, LF-terminated with one final newline", () => {
  // Strongest possible contract: exact bytes. Proves field set, order, LF line
  // endings, and a single trailing newline all at once.
  const expected = EXPECTED_SECURITY_TXT_LINES.join("\n") + "\n";
  assert.equal(securityTxtRaw, expected);
});

test("security.txt: contains no CR (LF line endings only)", () => {
  assert.equal(securityTxtRaw.includes("\r"), false, "security.txt must use LF, not CRLF/CR");
});

test("security.txt: ends with exactly one final newline", () => {
  assert.ok(securityTxtRaw.endsWith("\n"), "must end with a newline");
  assert.equal(securityTxtRaw.endsWith("\n\n"), false, "must not end with a blank trailing line");
});

test("security.txt: Contact / Expires / Canonical hold exactly the approved values", () => {
  const lines = securityTxtRaw.replace(/\n$/, "").split("\n");
  assert.deepEqual(lines, EXPECTED_SECURITY_TXT_LINES);
  const fields = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  assert.equal(fields["Contact"], `mailto:${APPROVED_SECURITY_CONTACT}`);
  assert.equal(fields["Expires"], APPROVED_SECURITY_EXPIRES);
  assert.equal(fields["Canonical"], APPROVED_SECURITY_CANONICAL);
});

test("security.txt: has no duplicate fields", () => {
  const names = securityTxtRaw
    .replace(/\n$/, "")
    .split("\n")
    .map((l) => l.slice(0, l.indexOf(":")).trim());
  assert.equal(new Set(names).size, names.length, "no field may repeat");
});

test("security.txt: contains no comment lines", () => {
  const hasComment = securityTxtRaw.split("\n").some((l) => l.trimStart().startsWith("#"));
  assert.equal(hasComment, false, "security.txt must contain no comments");
});

test("security.txt: contains no forbidden or unrelated fields", () => {
  const names = new Set(
    securityTxtRaw
      .replace(/\n$/, "")
      .split("\n")
      .map((l) => l.slice(0, l.indexOf(":")).trim())
  );
  for (const forbidden of FORBIDDEN_SECURITY_TXT_FIELDS) {
    assert.equal(names.has(forbidden), false, `security.txt must not include a ${forbidden} field`);
  }
  // Only the three approved field names may appear.
  assert.deepEqual(
    [...names].sort(),
    ["Canonical", "Contact", "Expires"]
  );
});

test("security.txt: the only email present is the approved public contact (no private forwarding destination)", () => {
  const addresses = new Set(emailsIn(securityTxtRaw));
  assert.deepEqual([...addresses], [APPROVED_SECURITY_CONTACT]);
});

test("security.txt: makes no response-time, bounty, confidentiality, or compensation promise", () => {
  const lower = securityTxtRaw.toLowerCase();
  for (const term of [...FORBIDDEN_COMMITMENT_TERMS, "confidential", "compensation"]) {
    assert.equal(lower.includes(term.toLowerCase()), false, `security.txt must not mention "${term}"`);
  }
});

// ---------------------------------------------------------------------------
// Package 2B — reusable policy-document validators.
//
// These operate on supplied text so both the real repository documents and
// deterministic in-memory mutation fixtures pass through the SAME contract.
// Each validator returns an ARRAY of violation strings (empty === valid), so a
// malformed variant is proven to fail while the real document is proven clean.
// No shared helper file and no new dependency are introduced.
// ---------------------------------------------------------------------------

// Split a Markdown document into ordered heading sections. Each entry is
// { level, title, body }; a synthetic level-0 "__preamble__" captures any text
// before the first heading. LF/CRLF handled identically.
const parseMarkdownSections = (text) => {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const sections = [];
  let current = { level: 0, title: "__preamble__", body: [] };
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (m) {
      sections.push(current);
      current = { level: m[1].length, title: m[2].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);
  return sections.map((s) => ({ level: s.level, title: s.title, body: s.body.join("\n") }));
};

const headingSections = (text) => parseMarkdownSections(text).filter((s) => s.level > 0);

const sectionsMatching = (sections, matcher) =>
  sections.filter((s) => (typeof matcher === "string" ? s.title === matcher : matcher.test(s.title)));

const bodyOf = (sections, matcher) => {
  const found = sectionsMatching(sections, matcher);
  return found.length === 1 ? found[0].body : "";
};

// Collapse internal whitespace so wrapped prose lines read as one string.
const flat = (s) => s.replace(/\s+/g, " ").trim();

// Middle-position contrastive conjunctions / transitions. A negation before one
// of these does NOT govern the proposition after it ("does not ... , but ... is
// guaranteed"), so each side is scored for negation independently.
const MIDDLE_CONTRASTIVE = /\s*[,;]?\s*\b(?:but|however|yet|while|although|nevertheless|except\s+that)\b\s*,?\s*/i;

// Leading subordinate contrastive forms ("Although A, B" / "While A, B" /
// "Except that A, B"): the subordinate proposition A ends at its delimiting
// comma and the main proposition B follows. A negation inside A must NOT govern
// B, so the two are separated at that comma. Both captured groups are preserved.
const LEADING_SUBORDINATE = /^(?:although|while|except\s+that)\b\s+([^,]+?)\s*,\s*(.+)$/i;

// Additional bounded proposition boundaries so that negation stays local to the
// matched affirmative claim even without a contrastive marker: an explicit colon
// or em/en dash separator, and a coordinating "and" that joins two independent
// claims ("does not guarantee uptime, and it operates a SIEM"; "... is not
// promised and every report will be accepted"). A negation in one coordinated
// claim therefore cannot reach across the boundary to suppress a forbidden
// affirmative in the next. Commas alone and "or" enumerations are deliberately
// NOT split — that preserves valid list-wide negation ("does not create a
// response-time, ..., or disclosure commitment").
// Colon (colon + following space), Unicode em/en dash (whether or not it is
// surrounded by whitespace — "A—B" and "A — B" both split), and spaced double
// hyphen. ASCII "-" is deliberately NOT in the dash class, so hyphenated tokens
// (safe-harbor, response-time, public-surface-map, no-cache, max-age), ISO
// timestamps, URLs, and email addresses are never split; and ":" requires a
// following space so URL schemes (https://), "mailto:", and "23:59:59" survive.
const COLON_DASH = /\s*:\s+|\s*[—–]\s*|\s+--\s+/;
const COORDINATING = /,?\s+and\s+/i;

// Split one sentence into independently evaluated proposition fragments. Leading
// subordinate forms are separated first (at the subordinate comma); each result
// is then split on colon/dash boundaries, coordinating "and", and finally any
// middle-position contrastive transition. This keeps negation scope local to the
// proposition that actually carries the promise.
const splitPropositions = (sentence) => {
  const s = sentence.trim();
  if (!s) return [];
  const lead = s.match(LEADING_SUBORDINATE);
  if (lead) return [...splitPropositions(lead[1]), ...splitPropositions(lead[2])];
  return s
    .split(COLON_DASH)
    .flatMap((seg) => seg.split(COORDINATING))
    .flatMap((seg) => seg.split(MIDDLE_CONTRASTIVE))
    .map((p) => p.trim())
    .filter(Boolean);
};

// Break body text into proposition-level fragments so a negation on one
// proposition does not leak onto an affirmative claim on another — WITHOUT
// splitting a single wrapped sentence at its soft line breaks (that would orphan
// "semantic authorities" from its "are not"). Paragraph blanks and Markdown
// list-item starts are hard boundaries; wrapped continuation lines are joined;
// the joined chunk is split on sentence terminators and then into propositions
// (leading-subordinate and middle-position contrastive forms).
const clausesOf = (text) => {
  const normalized = text.replace(/\r\n?/g, "\n");
  const chunks = normalized.split(/\n\s*\n|\n(?=\s*(?:[-*]|\d+\.)\s)/);
  const clauses = [];
  for (const chunk of chunks) {
    const joined = flat(chunk);
    if (!joined) continue;
    for (const sentence of joined.split(/[.;]\s+/)) {
      for (const part of splitPropositions(sentence)) {
        const c = part.replace(/^[-*\d.\s]+/, "").trim();
        if (c) clauses.push(c);
      }
    }
  }
  return clauses;
};

const NEGATION_CUE = /\b(not|no|never|without|cannot|neither|nor|does not|do not)\b/i;

// A proposition is an affirmative-promise violation only when it matches a
// promise pattern AND is NOT itself negated. Because contrastive clauses are
// split first, a negated first proposition ("does not create a ... commitment")
// can no longer shield an affirmative second proposition ("but confidentiality
// is guaranteed"): each side is scored on its own. Approved bounded negation is
// still accepted; mixed contradictory text is rejected.
const affirmativeViolations = (text, patterns) => {
  const out = [];
  for (const clause of clausesOf(text)) {
    if (NEGATION_CUE.test(clause)) continue;
    for (const { name, re } of patterns) {
      if (re.test(clause)) out.push(`affirmative-promise: ${name}`);
    }
  }
  return out;
};

// Affirmative promises forbidden anywhere in SECURITY.md.
const SECURITY_MD_AFFIRMATIVE_PATTERNS = [
  { name: "guaranteed response time", re: /\bresponse\s+within\b|\brespond(s|ing)?\s+within\b|\bwithin\s+\d+\s*(hour|day|business)|\bguarantee\w*[^.;]*\bresponse\b|\bresponse\s+time\s+is\s+guaranteed\b/i },
  { name: "guaranteed resolution time", re: /\bresolv\w*\s+within\b|\bresolution\s+within\b|\bguarantee\w*[^.;]*\bresolut\w*|\bresolut\w*\s+is\s+guaranteed\b/i },
  { name: "guaranteed confidentiality", re: /\bconfidential\w*\s+is\s+guaranteed\b|\bguarantee\w*\s+confidentiality\b|\bkept\s+confidential\b|\bwe\s+will\s+keep[^.;]*\bconfidential/i },
  { name: "compensation or bug bounty", re: /\bbug\s+bounty\b|\bbounty\s+is\s+offered\b|\bwe\s+offer[^.;]*\bbounty\b|\bmonetary\s+compensation\b|\bcompensation\s+is\s+(offered|provided|available)\b|\bwe\s+(pay|reward|compensate)\b/i },
  { name: "coordinated-disclosure commitment", re: /\bcoordinated\s+disclosure\b/i },
  { name: "legal safe harbor", re: /\bsafe[\s-]harbor\b|\blegal\s+safe\s+harbor\b/i },
  { name: "universal report acceptance", re: /\b(every|all|each)\s+report\w*\s+(will\s+be\s+|are\s+|is\s+)?(accepted|acted)\b|\bwe\s+accept\s+(every|all|each)\s+report\b/i }
];

const SECURITY_MD_EXCLUSIONS = [
  ["conceptual disagreement", /conceptual/i],
  ["model naming or classification", /(model naming|classification)/i],
  ["Cross/Log/Protocol/Draft/Registry status", /Protocol,?\s*Draft/i],
  ["relation confirmation", /relation confirmation/i],
  ["OSF priority or registration", /OSF/i],
  ["editorial disagreement", /editorial/i],
  ["publish/hide/rename/reclassify", /(publish, hide, rename, or reclassify|reclassif)/i],
  ["ordinary broken links / copy edits without security impact", /(broken links|copy edits)/i],
  ["full-archive representation disputes", /(represent the full MWE archive|whether public surfaces)/i],
  ["preview-only platform behavior not caused by the repository", /preview-only platform behavior/i],
  ["marketing / scanning offers / commercial services", /(marketing|scanning offers|commercial services)/i]
];

// Validate a SECURITY.md text. Returns an array of violation strings.
const validateSecurityMd = (text) => {
  const v = [];
  const sections = headingSections(text);

  // Exact H1 title, first, singular.
  const h1s = sections.filter((s) => s.level === 1);
  if (h1s.length === 0) v.push("title: no H1 present");
  else if (h1s.length > 1) v.push("title: multiple competing H1 titles");
  if (sections.length > 0 && !(sections[0].level === 1 && sections[0].title === "Security Policy")) {
    v.push('title: first heading must be exactly "# Security Policy"');
  }
  if (h1s.length === 1 && h1s[0].title !== "Security Policy") {
    v.push(`title: expected "Security Policy", got "${h1s[0].title}"`);
  }

  // Scope + boundary, bound to the Scope section body only.
  const scope = bodyOf(sections, "Scope");
  if (!/https:\/\/metawritingecology\.org/.test(scope)) v.push("scope: production URL missing from Scope section");
  if (!/public website repository/i.test(scope)) v.push("scope: 'public website repository' missing from Scope section");
  for (const term of ["MWE archive", "Registry", "working corpus", "authority structure"]) {
    if (!new RegExp(term, "i").test(scope)) v.push(`scope-boundary: "${term}" missing from Scope section`);
  }

  // Public contact: approved present, and NO other email address anywhere.
  const emails = new Set(emailsIn(text));
  if (!emails.has(APPROVED_SECURITY_CONTACT)) v.push("contact: approved public contact missing");
  for (const e of emails) if (e !== APPROVED_SECURITY_CONTACT) v.push(`contact: unexpected email address ${e}`);

  // Required exclusion classes, bound to the Out of scope section body only.
  const oos = bodyOf(sections, "Out of scope");
  for (const [label, re] of SECURITY_MD_EXCLUSIONS) {
    if (!re.test(oos)) v.push(`out-of-scope: missing exclusion — ${label}`);
  }

  // Bounded no-commitment negation, bound to its section body.
  const commit = bodyOf(sections, "No unsupported commitments");
  if (!/does not create/i.test(commit)) v.push("commitments: missing 'does not create' negation");
  for (const term of ["response[- ]time", "resolution[- ]time", "confidentiality", "compensation", "bounty", "disclosure"]) {
    if (!new RegExp(term, "i").test(commit)) v.push(`commitments: missing negated term — ${term}`);
  }
  if (!/not guaranteed/i.test(commit)) v.push("commitments: missing 'acceptance is not guaranteed'");

  // Reject affirmative promises anywhere in the document.
  v.push(...affirmativeViolations(text, SECURITY_MD_AFFIRMATIVE_PATTERNS));

  return v;
};

// ---------------------------------------------------------------------------
// Package 2B — SECURITY.md real-file contract (through the validator).
// ---------------------------------------------------------------------------

test("SECURITY.md: source file exists", () => {
  assert.ok(existsSync(path("SECURITY.md")), "SECURITY.md must exist");
});

test("SECURITY.md: the approved real document passes the validator with zero violations", () => {
  assert.deepEqual(validateSecurityMd(securityMd), []);
});

test("SECURITY.md: presents the approved public contact as a mailto link", () => {
  assert.ok(securityMd.includes(`mailto:${APPROVED_SECURITY_CONTACT}`));
});

// ---------------------------------------------------------------------------
// Package 2B — SECURITY.md deterministic mutation fixtures. Each starts from the
// approved real text and must be REJECTED by the same validator.
// ---------------------------------------------------------------------------

const SECURITY_MD_MUTATIONS = [
  ["guaranteed 24-hour response", `${securityMd}\n\nWe guarantee a response within 24 hours.\n`, /affirmative-promise: guaranteed response time/],
  ["guaranteed resolution time", `${securityMd}\n\nEvery issue is resolved within 30 days, guaranteed.\n`, /affirmative-promise: guaranteed resolution time/],
  ["guaranteed confidentiality", `${securityMd}\n\nAll reports are kept confidential; confidentiality is guaranteed.\n`, /affirmative-promise: guaranteed confidentiality/],
  ["bug bounty / compensation offer", `${securityMd}\n\nWe offer a bug bounty and monetary compensation for valid reports.\n`, /affirmative-promise: compensation or bug bounty/],
  ["coordinated-disclosure commitment", `${securityMd}\n\nWe commit to coordinated disclosure terms with every reporter.\n`, /affirmative-promise: coordinated-disclosure commitment/],
  ["legal safe-harbor promise", `${securityMd}\n\nReporters acting in good faith are granted legal safe harbor.\n`, /affirmative-promise: legal safe harbor/],
  ["acceptance of every report", `${securityMd}\n\nEvery report will be accepted and acted upon.\n`, /affirmative-promise: universal report acceptance/],
  ["incorrect H1 title", securityMd.replace("# Security Policy", "# Security Guidelines"), /title:/],
  ["removed required exclusion", securityMd.replace("- relation confirmation;\n", ""), /out-of-scope: missing exclusion — relation confirmation/],
  ["added second email address", securityMd.replace("- reproducible steps;", "- reproducible steps;\n- or contact secops@example.net;"), /contact: unexpected email address/],
  // Mixed contrastive constructions: a negated first proposition must NOT shield
  // the affirmative, contradictory second proposition.
  ["negated response commitment BUT guaranteed confidentiality", `${securityMd}\n\nReceipt of a report does not create a response-time commitment, but confidentiality is guaranteed.\n`, /affirmative-promise: guaranteed confidentiality/],
  ["negated bounty commitment YET compensation offered", `${securityMd}\n\nNo bounty commitment is created, yet compensation is offered for every valid report.\n`, /affirmative-promise: compensation or bug bounty/],
  ["negated confidentiality HOWEVER coordinated disclosure", `${securityMd}\n\nConfidentiality is not guaranteed, however we commit to coordinated disclosure terms.\n`, /affirmative-promise: coordinated-disclosure commitment/],
  ["negated response time WHILE universal acceptance", `${securityMd}\n\nWe do not guarantee a response time, while every report will be accepted.\n`, /affirmative-promise: universal report acceptance/],
  // Leading subordinate contrastive forms: a negation inside the leading
  // subordinate proposition must NOT suppress the affirmative main proposition.
  ["leading ALTHOUGH — negated response time, main guaranteed response", `${securityMd}\n\nAlthough no response time is guaranteed, every report will receive a response within 24 hours.\n`, /affirmative-promise: guaranteed response time/],
  ["leading WHILE — negated confidentiality, main guaranteed confidentiality", `${securityMd}\n\nWhile confidentiality is not guaranteed, confidentiality is guaranteed for every report.\n`, /affirmative-promise: guaranteed confidentiality/],
  ["leading EXCEPT THAT — negated bounty, main compensation offered", `${securityMd}\n\nExcept that no bounty commitment is created, compensation is offered for every valid report.\n`, /affirmative-promise: compensation or bug bounty/],
  // Coordinated independent claims (comma+and, plain and, colon, em dash,
  // semicolon+transition): a negation in the first proposition must NOT suppress
  // a forbidden affirmative in a later coordinated proposition.
  ["coordinated AND — negated response, guaranteed confidentiality", `${securityMd}\n\nNo response time is guaranteed, and confidentiality is guaranteed.\n`, /affirmative-promise: guaranteed confidentiality/],
  ["coordinated AND — negated bounty, compensation offered", `${securityMd}\n\nNo bounty commitment is created, and compensation is offered.\n`, /affirmative-promise: compensation or bug bounty/],
  ["colon — negated confidentiality, coordinated disclosure required", `${securityMd}\n\nConfidentiality is not guaranteed: coordinated disclosure is required.\n`, /affirmative-promise: coordinated-disclosure commitment/],
  ["em dash — negated safe harbor, legal safe harbor provided", `${securityMd}\n\nNo safe-harbor commitment exists — legal safe harbor is provided.\n`, /affirmative-promise: legal safe harbor/],
  ["plain AND — negated response, universal acceptance", `${securityMd}\n\nA response time is not promised and every report will be accepted.\n`, /affirmative-promise: universal report acceptance/],
  ["semicolon+nevertheless — negated compensation, bug bounty offered", `${securityMd}\n\nNo compensation commitment is created; nevertheless, a bug bounty is offered.\n`, /affirmative-promise: compensation or bug bounty/],
  // Unspaced Unicode em/en dash: the affirmative proposition after the dash must
  // still be evaluated independently even with no surrounding whitespace.
  ["unspaced em dash — negated safe harbor, legal safe harbor provided", `${securityMd}\n\nNo safe-harbor commitment exists—legal safe harbor is provided.\n`, /affirmative-promise: legal safe harbor/],
  ["unspaced en dash — negated confidentiality, guaranteed confidentiality", `${securityMd}\n\nNo confidentiality commitment is created–confidentiality is guaranteed for every report.\n`, /affirmative-promise: guaranteed confidentiality/],
  ["unspaced em dash — negated bounty, compensation offered", `${securityMd}\n\nNo bounty commitment is created—compensation is offered for every valid report.\n`, /affirmative-promise: compensation or bug bounty/]
];

for (const [label, mutated, expected] of SECURITY_MD_MUTATIONS) {
  test(`SECURITY.md mutation rejected: ${label}`, () => {
    const violations = validateSecurityMd(mutated);
    assert.ok(violations.length > 0, `expected the "${label}" mutation to be rejected`);
    assert.ok(
      violations.some((x) => expected.test(x)),
      `expected a ${expected} violation, got: ${JSON.stringify(violations)}`
    );
  });
}

test("SECURITY.md: a valid appended NEGATED commitment sentence is still accepted", () => {
  const stillValid =
    `${securityMd}\n\nReceipt of a report does not create a bug bounty, monetary compensation, ` +
    `coordinated-disclosure, or legal safe-harbor commitment, and confidentiality is not guaranteed.\n`;
  assert.deepEqual(validateSecurityMd(stillValid), []);
});

test("SECURITY.md: valid LEADING-subordinate negation (benign main clause) is still accepted", () => {
  // Leading negation must not create a false positive when the main proposition
  // carries no forbidden commitment.
  for (const benign of [
    "Although no response time is guaranteed, reports may be submitted by email.",
    "While confidentiality is not guaranteed, reporters should avoid unnecessary sensitive data."
  ]) {
    assert.deepEqual(validateSecurityMd(`${securityMd}\n\n${benign}\n`), [], `expected "${benign}" to remain valid`);
  }
});

test("SECURITY.md: valid list-wide and coordinated-negation forms are not over-rejected", () => {
  // Local negation scope must still accept genuine negation, whether list-wide or
  // coordinated with a benign second clause.
  for (const benign of [
    "Receipt of a report does not create a response-time, resolution-time, confidentiality, compensation, bounty, or disclosure commitment.",
    "Confidentiality is not guaranteed, and reporters should avoid unnecessary sensitive data."
  ]) {
    assert.deepEqual(validateSecurityMd(`${securityMd}\n\n${benign}\n`), [], `expected "${benign}" to remain valid`);
  }
});

test("SECURITY.md: valid UNSPACED Unicode-dash negation (benign main clause) is not over-rejected", () => {
  for (const benign of [
    "Confidentiality is not guaranteed—reporters should avoid unnecessary sensitive data.",
    "No response time is guaranteed–reports may still be submitted by email."
  ]) {
    assert.deepEqual(validateSecurityMd(`${securityMd}\n\n${benign}\n`), [], `expected "${benign}" to remain valid`);
  }
});

test("parser: normal hyphenated tokens and structured values are never split", () => {
  // ASCII "-" is not a dash boundary, and ":" only splits before whitespace, so
  // hyphenated terms, emails, ISO timestamps, and URLs survive as single tokens.
  const sample =
    "The safe-harbor, response-time, resolution-time, public-surface-map, security-resilience, " +
    "no-cache, max-age tokens, plus security@metawritingecology.org, 2027-06-30T23:59:59Z, " +
    "https://metawritingecology.org/.well-known/security.txt, and workers.dev-related prose, remain intact.";
  const clauses = clausesOf(sample);
  for (const token of [
    "safe-harbor",
    "response-time",
    "resolution-time",
    "public-surface-map",
    "security-resilience",
    "no-cache",
    "max-age",
    "workers.dev-related",
    "security@metawritingecology.org",
    "2027-06-30T23:59:59Z",
    "https://metawritingecology.org/.well-known/security.txt"
  ]) {
    assert.ok(
      clauses.some((c) => c.includes(token)),
      `token "${token}" must survive intact in one clause; clauses: ${JSON.stringify(clauses)}`
    );
  }
});

// ---------------------------------------------------------------------------
// Package 2B — SECURITY_OBSERVABILITY.md validator (section-aware).
// ---------------------------------------------------------------------------

const OBS_SECTION_MATCHERS = [
  ["A. Repository-enforced controls", /^A\.\s*Repository-enforced controls$/i],
  ["B. Externally observed platform signals", /^B\.\s*Externally observed platform signals$/i],
  ["C. Controls not asserted", /^C\.\s*Controls not asserted$/i],
  ["Review boundary", /^Review boundary$/i]
];

const OBS_SECTION_A_REQUIRED = [
  ["deterministic site CI", /deterministic site CI/i],
  ["build/Astro/TypeScript/contract checks", /Astro,?\s*TypeScript,?\s*and repository contract checks/i],
  ["Wrangler dry-run validation", /Wrangler dry-run/i],
  ["custom HTTP 404 contract", /404 contract/i],
  ["SSR and static response-header architecture", /response-header architecture/i],
  ["enforced same-origin framing", /same-origin framing/i],
  ["broader CSP in Report-Only mode", /Report-Only mode/i],
  ["security-resilience tests", /security-resilience tests/i],
  ["public-surface-map response verification", /public-surface-map response verification/i],
  ["security.txt source and response contract", /security\.txt.{0,4}\s*source and response contract/i]
];

const OBS_SECTION_C_REQUIRED = [
  ["continuous uptime monitoring", /uptime monitoring/i],
  ["incident paging", /incident paging/i],
  ["security operations center", /security operations center/i],
  ["SIEM", /SIEM/],
  ["centralized log ingestion", /centralized log ingestion/i],
  ["log-retention duration", /log-retention duration/i],
  ["complete request-log access", /request-log access/i],
  ["automatic incident response", /automatic incident response/i],
  ["vulnerability-response SLA", /vulnerability-response SLA/i],
  ["guaranteed report confidentiality", /report confidentiality/i],
  ["bug bounty", /bug bounty/i],
  ["Cloudflare-account configuration", /Cloudflare-account configuration/i],
  ["GitHub-organization configuration", /GitHub-organization configuration/i],
  ["Email Routing internals", /Email Routing internals/i],
  ["private mailbox identity", /private mailbox identity/i],
  ["complete MWE archive / Registry / authority map", /complete MWE archive, Registry, or authority map/i]
];

// Affirmative contradictions forbidden anywhere in the observability document.
// Adjacency-based so the non-asserted list bullets (e.g. "guaranteed report
// confidentiality", "a bug bounty") do NOT match, while an affirmative claim
// ("confidentiality is guaranteed", "we offer a bug bounty") does.
const OBS_AFFIRMATIVE_PATTERNS = [
  { name: "semantic authority", re: /\bsemantic authorit(y|ies)\b/i },
  { name: "complete operational proof", re: /\bcomplete operational proof\b|\bproves?\s+(every|all)\s+(external\s+)?(platform\s+)?setting/i },
  { name: "permanent external configuration", re: /\bpermanent\w*\s+(external\s+)?configuration\b|\bpermanently configured\b/i },
  { name: "complete monitoring coverage", re: /\bcomplete monitoring coverage\b/i },
  { name: "guaranteed uptime monitoring", re: /\b(continuous\s+)?(uptime\s+)?monitoring\s+is\s+guaranteed\b|\bguarantee\w*\s+(continuous\s+)?(uptime\s+)?monitoring\b|\bwe\s+(provide|guarantee)[^.;]*\bmonitoring\b/i },
  { name: "incident paging", re: /\bincidents?\s+are\s+(automatically\s+)?paged\b|\bautomatically\s+pages?\s+incidents?\b|\bincident\s+paging\s+is\s+(provided|enabled|guaranteed)\b/i },
  { name: "SOC or SIEM provided", re: /\bprovides?\s+a\s+(SOC|SIEM|security operations center)\b|\boperates?\s+a\s+(SOC|SIEM)\b|\b(SOC|SIEM)\s+is\s+(provided|operated|guaranteed)\b/i },
  { name: "centralized log retention", re: /\blogs?\s+are\s+centrally\s+retained\b|\ball\s+logs?\s+are\s+retained\b|\bcentraliz\w*\s+log\w*\s+retention\s+is\s+(guaranteed|provided)\b/i },
  { name: "vulnerability-response SLA", re: /\b(all\s+|every\s+)?reports?\s+receives?\s+an?\s+[^.;]*\bSLA\b|\bSLA\s+is\s+(guaranteed|provided|offered)\b|\bwe\s+(provide|guarantee|offer)[^.;]*\bSLA\b/i },
  { name: "guaranteed confidentiality", re: /\bconfidential\w*\s+is\s+guaranteed\b|\bwe\s+guarantee\s+confidential\w*\b|\bguarantee\w*\s+confidentiality\b/i },
  { name: "bug bounty offered", re: /\bbounty\s+is\s+offered\b|\bwe\s+offer\s+a?\s*(bug\s+)?bounty\b|\boffer\w*\s+a\s+(bug\s+)?bounty\b/i },
  { name: "account configuration fully represented", re: /\baccount\s+configuration\s+is\s+(fully|completely)\s+represented\b|\b(fully|completely)\s+represent\w*[^.;]*account\s+configuration\b/i },
  { name: "repository determines MWE authority", re: /\b(repository (tests|scripts)|platform signals)\b[^.;]*\b(determine|are the (final )?authority for)\b/i }
];

// Validate a SECURITY_OBSERVABILITY.md text. Returns an array of violations.
const validateSecurityObservabilityMd = (text) => {
  const v = [];
  const sections = headingSections(text);
  const order = [];

  for (const [label, matcher] of OBS_SECTION_MATCHERS) {
    const found = sectionsMatching(sections, matcher);
    if (found.length === 0) v.push(`section: missing "${label}"`);
    else if (found.length > 1) v.push(`section: duplicate "${label}"`);
    else order.push(sections.indexOf(found[0]));
  }
  // Ordered occurrence A < B < C < Review boundary.
  if (order.length === OBS_SECTION_MATCHERS.length) {
    for (let i = 1; i < order.length; i += 1) {
      if (order[i] <= order[i - 1]) v.push("section: A, B, C, Review boundary must appear in that order");
    }
  }

  const A = flat(bodyOf(sections, /^A\.\s*Repository-enforced controls$/i));
  const B = flat(bodyOf(sections, /^B\.\s*Externally observed platform signals$/i));
  const C = flat(bodyOf(sections, /^C\.\s*Controls not asserted$/i));
  const R = flat(bodyOf(sections, /^Review boundary$/i));

  // Section A required statements + engineering-limitation boundary.
  for (const [label, re] of OBS_SECTION_A_REQUIRED) {
    if (!re.test(A)) v.push(`section-A: missing enforced-control statement — ${label}`);
  }
  if (!/engineering checks/i.test(A) || !/not\s+semantic authorities/i.test(A)) {
    v.push("section-A: missing 'engineering checks, not semantic authorities' limitation");
  }
  if (!/every external platform setting/i.test(A)) v.push("section-A: missing 'do not prove every external platform setting'");
  if (!/future runtime condition/i.test(A)) v.push("section-A: missing 'do not prove every future runtime condition'");

  // Section B — each interpretation bound to its signal, inside section B.
  if (!/Network Error Logging[^.]*independently/i.test(B) || !/platform-generated/i.test(B)) {
    v.push("section-B: NEL not bound as platform-generated & independent of repository CSP policy");
  }
  if (!/X-Robots-Tag: noindex/i.test(B) || !/overlay/i.test(B) || !/preview/i.test(B)) {
    v.push("section-B: preview X-Robots-Tag not bound as a preview overlay");
  }
  if (!/(workers\.dev[^.]*CORS|CORS allowlist)/i.test(B) || !/production search/i.test(B)) {
    v.push("section-B: preview search CORS not bound as an external-service/origin limitation");
  }
  if (!/reverified when external platform settings or services change/i.test(B) || !/permanently configured/i.test(B)) {
    v.push("section-B: missing non-permanence boundary (reverify; not permanently configured)");
  }
  // Section B mis-descriptions.
  if (/Network Error Logging[^.]*repository-generated|repository[- ]generated[^.]*(NEL|Network Error Logging|Report-To)/i.test(B)) {
    v.push("section-B: NEL wrongly described as repository-generated");
  }
  if (/X-Robots-Tag[^.]*permanent production|permanent production rule/i.test(B)) {
    v.push("section-B: preview robots wrongly described as a permanent production rule");
  }
  if (/(CORS[^.]*Package 2[AB])|(Package 2[AB][^.]*CORS)/i.test(B)) {
    v.push("section-B: CORS wrongly described as enforced by Package 2A/2B");
  }

  // Section C required non-assertions.
  for (const [label, re] of OBS_SECTION_C_REQUIRED) {
    if (!re.test(C)) v.push(`section-C: missing non-asserted control — ${label}`);
  }

  // Review boundary required statements.
  if (!/repository scripts/i.test(R) || !/(tests|inventories|review evidence)/i.test(R)) {
    v.push("review-boundary: missing 'repository scripts produce tests/inventories/review evidence'");
  }
  if (!/GitHub and Cloudflare records provide external operational evidence/i.test(R)) {
    v.push("review-boundary: missing external-operational-evidence statement");
  }
  if (!/Neither layer replaces user authority/i.test(R)) {
    v.push("review-boundary: missing 'neither layer replaces user authority' statement");
  }
  for (const term of ["publication", "classification", "Registry status", "public/private boundaries", "final release"]) {
    if (!new RegExp(term.replace("/", "\\/"), "i").test(R)) v.push(`review-boundary: missing authority domain — ${term}`);
  }

  // Reject affirmative contradictions anywhere in the document.
  v.push(...affirmativeViolations(text, OBS_AFFIRMATIVE_PATTERNS));

  return v;
};

// ---------------------------------------------------------------------------
// Package 2B — SECURITY_OBSERVABILITY.md real-file contract (through validator).
// ---------------------------------------------------------------------------

test("SECURITY_OBSERVABILITY.md: source file exists", () => {
  assert.ok(existsSync(path("SECURITY_OBSERVABILITY.md")), "SECURITY_OBSERVABILITY.md must exist");
});

test("SECURITY_OBSERVABILITY.md: the approved real document passes the validator with zero violations", () => {
  assert.deepEqual(validateSecurityObservabilityMd(securityObservabilityMd), []);
});

test("SECURITY_OBSERVABILITY.md: exposes no email address (no private mailbox identity)", () => {
  assert.deepEqual(emailsIn(securityObservabilityMd), []);
});

// ---------------------------------------------------------------------------
// Package 2B — SECURITY_OBSERVABILITY.md deterministic mutation fixtures.
// ---------------------------------------------------------------------------

const OBS_NEL_PARA = /1\. Cloudflare may emit a Network Error Logging[\s\S]*?platform-generated signal, not a repository CSP reporting configuration\./;
const OBS_ROBOTS_PARA = /2\. Workers preview responses may apply[\s\S]*?preview-origin overlay behavior, not the repository path rule\./;
const OBS_CORS_PARA = /3\. The production search origin[\s\S]*?repository defect\./;
const OBS_NONPERM = /These observations describe behavior seen at a point in time\.[\s\S]*?platform settings or services change\./;

const OBS_MUTATIONS = [
  [
    "NEL interpretation moved out of section B",
    securityObservabilityMd.replace(OBS_NEL_PARA, "") +
      "\n\n## Appendix\n\nCloudflare may emit a Network Error Logging header independently of repository CSP policy; it is platform-generated.\n",
    /section-B: NEL not bound/
  ],
  [
    "preview robots interpretation moved out of section B",
    securityObservabilityMd.replace(OBS_ROBOTS_PARA, "") +
      "\n\n## Appendix\n\nWorkers preview responses may apply a general X-Robots-Tag: noindex overlay on preview origins.\n",
    /section-B: preview X-Robots-Tag not bound/
  ],
  [
    "search CORS interpretation moved out of section B",
    securityObservabilityMd.replace(OBS_CORS_PARA, "") +
      "\n\n## Appendix\n\nThe production search origin may be accepted while workers.dev preview origins are excluded from the CORS allowlist.\n",
    /section-B: preview search CORS not bound/
  ],
  [
    "non-permanence boundary removed from section B",
    securityObservabilityMd.replace(OBS_NONPERM, ""),
    /section-B: missing non-permanence boundary/
  ],
  [
    "guaranteed uptime-monitoring claim appended",
    `${securityObservabilityMd}\n\n## Operations\n\nContinuous uptime monitoring is guaranteed.\n`,
    /affirmative-promise: guaranteed uptime monitoring/
  ],
  [
    "incident-paging claim appended",
    `${securityObservabilityMd}\n\n## Operations\n\nIncidents are automatically paged to an on-call engineer.\n`,
    /affirmative-promise: incident paging/
  ],
  [
    "SIEM / centralized-log-retention guarantee appended",
    `${securityObservabilityMd}\n\n## Operations\n\nThe repository provides a SIEM and all logs are retained for 90 days.\n`,
    /affirmative-promise: (SOC or SIEM provided|centralized log retention)/
  ],
  [
    "vulnerability-response SLA appended",
    `${securityObservabilityMd}\n\n## Operations\n\nAll reports receive a 30-day resolution SLA.\n`,
    /affirmative-promise: vulnerability-response SLA/
  ],
  [
    "guaranteed confidentiality appended",
    `${securityObservabilityMd}\n\n## Operations\n\nReport confidentiality is guaranteed.\n`,
    /affirmative-promise: guaranteed confidentiality/
  ],
  [
    "repository tests claimed as semantic authority",
    `${securityObservabilityMd}\n\n## Authority\n\nRepository tests are the semantic authority for MWE classification.\n`,
    /affirmative-promise: semantic authority/
  ],
  [
    "required Review boundary section removed",
    securityObservabilityMd.replace(/\n## Review boundary[\s\S]*$/, "\n"),
    /section: missing "Review boundary"/
  ],
  [
    "target section C duplicated",
    `${securityObservabilityMd}\n\n## C. Controls not asserted\n\nThis repository does not, by itself, establish or prove any of the following:\n\n- continuous uptime monitoring;\n`,
    /section: duplicate "C\. Controls not asserted"/
  ],
  // Mixed contrastive constructions: a negated first proposition must NOT shield
  // the affirmative, contradictory second proposition.
  [
    "negated uptime BUT operates a SIEM",
    `${securityObservabilityMd}\n\n## Operations\n\nThis repository does not guarantee uptime, but it operates a SIEM.\n`,
    /affirmative-promise: SOC or SIEM provided/
  ],
  [
    "negated paging HOWEVER automatic paging",
    `${securityObservabilityMd}\n\n## Operations\n\nThe repository does not provide incident paging; however, incidents are automatically paged.\n`,
    /affirmative-promise: incident paging/
  ],
  [
    "negated log-retention BUT fixed retention guarantee",
    `${securityObservabilityMd}\n\n## Operations\n\nThe repository does not centrally retain logs, but all logs are retained for 90 days.\n`,
    /affirmative-promise: centralized log retention/
  ],
  [
    "negated SLA YET affirmative response SLA",
    `${securityObservabilityMd}\n\n## Operations\n\nNo response SLA is promised, yet all reports receive an SLA.\n`,
    /affirmative-promise: vulnerability-response SLA/
  ],
  [
    "negated confidentiality WHILE guaranteed confidentiality",
    `${securityObservabilityMd}\n\n## Operations\n\nReport confidentiality is not guaranteed, while confidentiality is guaranteed for every report.\n`,
    /affirmative-promise: guaranteed confidentiality/
  ],
  // Leading subordinate contrastive forms: the negated leading subordinate must
  // NOT suppress the affirmative main proposition.
  [
    "leading ALTHOUGH — negated uptime, main operates a SIEM",
    `${securityObservabilityMd}\n\n## Operations\n\nAlthough no uptime is guaranteed, this repository operates a SIEM.\n`,
    /affirmative-promise: SOC or SIEM provided/
  ],
  [
    "leading WHILE — negated confidentiality, main guaranteed confidentiality",
    `${securityObservabilityMd}\n\n## Operations\n\nWhile confidentiality is not guaranteed, confidentiality is guaranteed for security reports.\n`,
    /affirmative-promise: guaranteed confidentiality/
  ],
  [
    "leading EXCEPT THAT — negated paging, main automatic paging",
    `${securityObservabilityMd}\n\n## Operations\n\nExcept that no incident paging is asserted, incidents are automatically paged.\n`,
    /affirmative-promise: incident paging/
  ],
  // Coordinated independent claims: a negation in the first proposition must NOT
  // suppress a forbidden affirmative in a later coordinated proposition.
  [
    "coordinated AND — negated uptime, operates a SIEM",
    `${securityObservabilityMd}\n\n## Operations\n\nThis repository does not guarantee uptime, and it operates a SIEM.\n`,
    /affirmative-promise: SOC or SIEM provided/
  ],
  [
    "coordinated AND — negated paging, automatic paging",
    `${securityObservabilityMd}\n\n## Operations\n\nThe repository does not provide incident paging, and incidents are automatically paged.\n`,
    /affirmative-promise: incident paging/
  ],
  [
    "colon — negated log retention, fixed retention",
    `${securityObservabilityMd}\n\n## Operations\n\nNo centralized log retention is asserted: all logs are retained for 90 days.\n`,
    /affirmative-promise: centralized log retention/
  ],
  [
    "em dash — negated SLA, affirmative SLA",
    `${securityObservabilityMd}\n\n## Operations\n\nNo response SLA is asserted — every report receives an SLA.\n`,
    /affirmative-promise: vulnerability-response SLA/
  ],
  [
    "plain AND — negated confidentiality, guaranteed confidentiality",
    `${securityObservabilityMd}\n\n## Operations\n\nConfidentiality is not guaranteed and confidentiality is guaranteed for security reports.\n`,
    /affirmative-promise: guaranteed confidentiality/
  ],
  // Unspaced Unicode em/en dash boundaries.
  [
    "unspaced em dash — negated SLA, affirmative SLA",
    `${securityObservabilityMd}\n\n## Operations\n\nNo response SLA is asserted—every report receives an SLA.\n`,
    /affirmative-promise: vulnerability-response SLA/
  ],
  [
    "unspaced en dash — negated log retention, fixed retention",
    `${securityObservabilityMd}\n\n## Operations\n\nNo centralized log retention is asserted–all logs are retained for 90 days.\n`,
    /affirmative-promise: centralized log retention/
  ],
  [
    "unspaced em dash — negated monitoring, operates a SIEM",
    `${securityObservabilityMd}\n\n## Operations\n\nContinuous monitoring is not guaranteed—the repository operates a SIEM.\n`,
    /affirmative-promise: SOC or SIEM provided/
  ]
];

for (const [label, mutated, expected] of OBS_MUTATIONS) {
  test(`SECURITY_OBSERVABILITY.md mutation rejected: ${label}`, () => {
    const violations = validateSecurityObservabilityMd(mutated);
    assert.ok(violations.length > 0, `expected the "${label}" mutation to be rejected`);
    assert.ok(
      violations.some((x) => expected.test(x)),
      `expected a ${expected} violation, got: ${JSON.stringify(violations)}`
    );
  });
}

test("SECURITY_OBSERVABILITY.md: a valid appended NEGATED non-assertion is still accepted", () => {
  const stillValid =
    `${securityObservabilityMd}\n\n## Operations\n\nThis repository does not guarantee continuous uptime ` +
    `monitoring, does not page incidents automatically, does not operate a SOC or SIEM, and does not ` +
    `guarantee report confidentiality.\n`;
  assert.deepEqual(validateSecurityObservabilityMd(stillValid), []);
});

test("SECURITY_OBSERVABILITY.md: valid LEADING-subordinate negation (benign main clause) is still accepted", () => {
  const benign =
    `${securityObservabilityMd}\n\n## Operations\n\nAlthough continuous monitoring is not asserted, ` +
    `repository checks may provide review evidence.\n`;
  assert.deepEqual(validateSecurityObservabilityMd(benign), []);
});

test("SECURITY_OBSERVABILITY.md: valid coordinated / semicolon direct-negation forms are not over-rejected", () => {
  // A coordinated "and" joining two negated claims, and a semicolon joining a
  // negation to a benign clause, must both stay valid.
  for (const benign of [
    "This repository does not operate a SOC or SIEM and does not provide continuous monitoring.",
    "No log-retention duration is asserted; repository checks may still provide review evidence."
  ]) {
    assert.deepEqual(
      validateSecurityObservabilityMd(`${securityObservabilityMd}\n\n## Operations\n\n${benign}\n`),
      [],
      `expected "${benign}" to remain valid`
    );
  }
});

test("SECURITY_OBSERVABILITY.md: valid UNSPACED Unicode-dash negation (benign main clause) is not over-rejected", () => {
  const benign =
    `${securityObservabilityMd}\n\n## Operations\n\nContinuous monitoring is not asserted—repository ` +
    `checks may provide review evidence.\n`;
  assert.deepEqual(validateSecurityObservabilityMd(benign), []);
});

// ---------------------------------------------------------------------------
// Package 2B — every claimed contrastive transition is DIRECTLY exercised by a
// rejection fixture (not merely present in a regular expression). Each mutation
// pairs a negated subordinate with the same affirmative main proposition
// ("confidentiality is guaranteed"); the affirmative main must be detected
// independently of the leading/middle negation. Covers: but, however, yet,
// while, although, nevertheless, except that — including leading although,
// leading while, leading except that, and middle nevertheless.
// ---------------------------------------------------------------------------

const CONTRASTIVE_TRANSITION_FIXTURES = [
  ["but (middle)", "No confidentiality commitment is created, but confidentiality is guaranteed."],
  ["however (middle)", "No confidentiality commitment is created, however confidentiality is guaranteed."],
  ["yet (middle)", "No confidentiality commitment is created, yet confidentiality is guaranteed."],
  ["nevertheless (middle)", "No confidentiality commitment is created, nevertheless confidentiality is guaranteed."],
  ["while (leading)", "While no confidentiality commitment is created, confidentiality is guaranteed."],
  ["although (leading)", "Although no confidentiality commitment is created, confidentiality is guaranteed."],
  ["except that (leading)", "Except that no confidentiality commitment is created, confidentiality is guaranteed."]
];

for (const [marker, sentence] of CONTRASTIVE_TRANSITION_FIXTURES) {
  test(`contrastive transition exercised — ${marker} — affirmative main is rejected`, () => {
    const mutated = `${securityObservabilityMd}\n\n## Operations\n\n${sentence}\n`;
    const violations = validateSecurityObservabilityMd(mutated);
    assert.ok(
      violations.some((x) => /affirmative-promise: guaranteed confidentiality/.test(x)),
      `expected the "${marker}" contradiction to be rejected, got: ${JSON.stringify(violations)}`
    );
  });
}

// ---------------------------------------------------------------------------
// Package 2B — synthetic fixture: reject a duplicate security.txt rule.
// ---------------------------------------------------------------------------

test("_headers fixture: duplicate /.well-known/security.txt rule (second block conflicting) is rejected", () => {
  const conflictingSecurityTxt = [
    "/.well-known/security.txt",
    "  Content-Type: text/plain; charset=utf-8",
    "  Cache-Control: no-store" // conflicts with the approved value
  ].join("\n");
  const fixture = [VALID_FIXTURE.trimEnd(), conflictingSecurityTxt].join("\n\n") + "\n";
  assert.throws(
    () => validateHeadersContract(fixture),
    /exactly one "\/\.well-known\/security\.txt" rule, found 2/
  );
});

// ---------------------------------------------------------------------------
// Package 2B — cross-file consistency.
// ---------------------------------------------------------------------------

test("cross-file: SECURITY.md and security.txt use the same public contact", () => {
  const txtContact = securityTxtRaw.match(/Contact:\s*mailto:(\S+)/)[1];
  assert.equal(txtContact, APPROVED_SECURITY_CONTACT);
  assert.ok(securityMd.includes(txtContact), "SECURITY.md must reference the same contact as security.txt");
});

test("cross-file: security.txt Canonical matches the production endpoint", () => {
  const canonical = securityTxtRaw.match(/Canonical:\s*(\S+)/)[1];
  assert.equal(canonical, APPROVED_SECURITY_CANONICAL);
  assert.equal(canonical.startsWith("https://metawritingecology.org/"), true);
  assert.equal(/workers\.dev/.test(canonical), false, "Canonical must not point at a preview origin");
});

test("cross-file: security.txt expiry matches the approved value", () => {
  const expires = securityTxtRaw.match(/Expires:\s*(\S+)/)[1];
  assert.equal(expires, APPROVED_SECURITY_EXPIRES);
});

test("cross-file: observability doc does not contradict the enforced / Report-Only split", () => {
  // Enforced framing plus a Report-Only broader CSP — mirrors Package 2A.
  assert.match(securityObservabilityMd, /frame-ancestors 'self'/);
  assert.match(securityObservabilityMd, /Report-Only mode/i);
});

test("cross-file: no private forwarding address or placeholder appears in any new Package 2B file", () => {
  const files = {
    "SECURITY.md": securityMd,
    "SECURITY_OBSERVABILITY.md": securityObservabilityMd,
    "public/.well-known/security.txt": securityTxtRaw
  };
  for (const [name, text] of Object.entries(files)) {
    for (const address of emailsIn(text)) {
      assert.equal(address, APPROVED_SECURITY_CONTACT, `${name} contains a non-approved address: ${address}`);
    }
    for (const placeholder of ["example.com", "example.org", "TODO", "FIXME", "REDACTED", "xxxxx"]) {
      assert.equal(
        text.toLowerCase().includes(placeholder.toLowerCase()),
        false,
        `${name} must not contain placeholder "${placeholder}"`
      );
    }
  }
});
