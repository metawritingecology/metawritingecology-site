// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Package D — Public Metadata and Structured Representation Contracts.
//
// Deterministic source-level tests for the typed public-metadata contract:
// the shared-layout route registry, the fail-closed resolver, canonical-origin
// safety, language behavior, structured-data type ceiling, HTML/JSON-LD
// description and language parity, genre preservation, forbidden-key exclusion,
// and the absence of any Open Graph / Twitter / hreflang / locale contract.
//
// The expected route inventory is derived INDEPENDENTLY through Package C's
// buildExpectedRouteSet (real page sources + robots contracts) so the registry
// is compared against a separately-produced oracle, never against itself.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ROUTE_METADATA_REGISTRY,
  getRegisteredRoutes,
  getRoutePolicy,
  resolvePublicMetadata,
  resolveMetadataForPolicy,
  buildJsonLd,
  normalizeRoute,
  robotsFromIndexing,
  assertApprovedOrigin,
  APPROVED_PRODUCTION_ORIGIN,
  SUPPORTED_LANGUAGES,
  SUPPORTED_STRUCTURED_TYPE,
  SUPPORTED_JSONLD_TYPES,
  FORBIDDEN_METADATA_KEYS,
  WEBSITE_NODE,
  PublicMetadataError
} from "../src/lib/publicMetadata.ts";

import { PRODUCTION_ORIGIN } from "../scripts/lib/indexing-discovery-contract.mjs";
import { buildExpectedRouteSet } from "../scripts/verify-indexing-discovery-build.mjs";

const PAGES_DIR = new URL("../src/pages/", import.meta.url);
const ORIGIN = APPROVED_PRODUCTION_ORIGIN;
const PREVIEW = "https://mwe-site.pages.dev";
const WORKERS = "https://mwe-site.workers.dev";

const INTERACTIVE = "/public-surface-map/interactive/";

// Every registered route except the single interactive preview is one of the
// 40 indexable routes.
const registeredRoutes = getRegisteredRoutes();
const indexableRegistered = registeredRoutes.filter((r) => r !== INTERACTIVE);

// A minimal valid input for a given route.
function input(route, over = {}) {
  return {
    route,
    title: "Example Title",
    description: "Example description.",
    siteOrigin: ORIGIN,
    ...over
  };
}

// --- Origin is a single source of truth ------------------------------------

test("approved production origin equals Package C PRODUCTION_ORIGIN", () => {
  assert.equal(APPROVED_PRODUCTION_ORIGIN, PRODUCTION_ORIGIN);
});

// --- 1 / 3: registration count and cardinality -----------------------------

test("registry has exactly 40 indexable routes and 1 interactive noindex route", () => {
  assert.equal(indexableRegistered.length, 40);
  const interactive = getRoutePolicy(INTERACTIVE);
  assert.ok(interactive);
  assert.equal(interactive.indexing.kind, "noindex");
  assert.equal(interactive.indexing.follow, false);
  // total registered = 41
  assert.equal(registeredRoutes.length, 41);
});

test("every registered route is registered exactly once (no duplicate keys)", () => {
  // Object keys are unique by construction; assert no accidental normalization
  // collisions and that each key is already in normalized form.
  const seen = new Set();
  for (const route of registeredRoutes) {
    assert.equal(route, normalizeRoute(route), `route not normalized: ${route}`);
    assert.ok(!seen.has(route), `duplicate route: ${route}`);
    seen.add(route);
  }
});

// --- 1 / 2: registry matches the independently-derived indexable oracle ----

test("registry indexable routes exactly equal Package C's independent expected set", () => {
  const { expected, findings } = buildExpectedRouteSet({ pagesDir: PAGES_DIR });
  assert.equal(findings.length, 0, "unexpected robots findings");
  const expectedSorted = [...expected].sort();
  const registeredSorted = [...indexableRegistered].sort();
  assert.deepEqual(registeredSorted, expectedSorted);
  // The interactive preview is NOT in the indexable oracle (it is noindex).
  assert.ok(!expected.has(INTERACTIVE));
});

test("no unregistered BaseLayout indexable route exists (no fallback needed)", () => {
  const { expected } = buildExpectedRouteSet({ pagesDir: PAGES_DIR });
  for (const route of expected) {
    assert.ok(
      ROUTE_METADATA_REGISTRY[route],
      `indexable route missing from registry: ${route}`
    );
  }
});

// --- 4 / 5 / 6: language behavior ------------------------------------------

test("/zh/ and /zh/boundary/ resolve to zh; all other indexable routes resolve to en", () => {
  for (const route of indexableRegistered) {
    const resolved = resolvePublicMetadata(input(route));
    if (route === "/zh/" || route === "/zh/boundary/") {
      assert.equal(resolved.language, "zh", route);
      assert.equal(resolved.structuredData.inLanguage, "zh", route);
    } else {
      assert.equal(resolved.language, "en", route);
      assert.equal(resolved.structuredData.inLanguage, "en", route);
    }
  }
});

test("interactive preview resolves to en", () => {
  const resolved = resolvePublicMetadata(input(INTERACTIVE));
  assert.equal(resolved.language, "en");
  assert.equal(resolved.structuredData.inLanguage, "en");
});

// --- 7 / 8: canonical-origin safety ----------------------------------------

test("canonical self accepts only the configured production origin", () => {
  const resolved = resolvePublicMetadata(input("/about/", { siteOrigin: ORIGIN }));
  assert.equal(resolved.canonicalUrl, `${ORIGIN}/about/`);
  // trailing-slash origin form still resolves to the same approved origin
  const resolved2 = resolvePublicMetadata(
    input("/about/", { siteOrigin: `${ORIGIN}/` })
  );
  assert.equal(resolved2.canonicalUrl, `${ORIGIN}/about/`);
});

test("preview and workers.dev origins cannot enter canonical output", () => {
  for (const bad of [PREVIEW, WORKERS, "https://example.com", "http://localhost:4321"]) {
    assert.throws(
      () => resolvePublicMetadata(input("/about/", { siteOrigin: bad })),
      (err) => err instanceof PublicMetadataError && err.code === "ORIGIN_FORBIDDEN",
      `expected ORIGIN_FORBIDDEN for ${bad}`
    );
  }
  assert.throws(
    () => assertApprovedOrigin("not a url"),
    (err) => err instanceof PublicMetadataError && err.code === "ORIGIN_INVALID"
  );
});

// --- 9 / 10: JSON-LD type ceiling ------------------------------------------

test("WebPage is the only permitted page structured-data type", () => {
  assert.equal(SUPPORTED_STRUCTURED_TYPE, "WebPage");
  for (const route of registeredRoutes) {
    const policy = ROUTE_METADATA_REGISTRY[route];
    if (policy.structuredData.enabled) {
      assert.equal(policy.structuredData.type, "WebPage", route);
    }
  }
  // A policy declaring any other page type fails closed.
  const badPolicy = {
    language: "en",
    canonical: { kind: "self" },
    indexing: { kind: "indexable" },
    structuredData: { enabled: true, type: "Article" }
  };
  assert.throws(
    () => resolveMetadataForPolicy(badPolicy, input("/about/")),
    (err) => err instanceof PublicMetadataError && err.code === "UNSUPPORTED_JSONLD_TYPE"
  );
});

test("WebSite and WebPage are the only emitted JSON-LD types", () => {
  assert.deepEqual([...SUPPORTED_JSONLD_TYPES].sort(), ["WebPage", "WebSite"]);
  for (const route of registeredRoutes) {
    const resolved = resolvePublicMetadata(input(route));
    const graph = buildJsonLd(resolved, ORIGIN);
    assert.ok(graph);
    const types = graph["@graph"].map((n) => n["@type"]);
    assert.deepEqual(types, ["WebSite", "WebPage"], route);
    assert.equal(graph["@context"], "https://schema.org");
  }
});

// --- 11 / 12: HTML/JSON-LD description and language parity ------------------

test("HTML meta description and WebPage description share one resolved value", () => {
  for (const route of registeredRoutes) {
    const description = `Description for ${route}`;
    const resolved = resolvePublicMetadata(input(route, { description }));
    const graph = buildJsonLd(resolved, ORIGIN);
    const webpage = graph["@graph"].find((n) => n["@type"] === "WebPage");
    assert.equal(resolved.description, description, route);
    assert.equal(webpage.description, description, route);
    assert.equal(webpage.description, resolved.description, route);
  }
});

test("HTML language and WebPage inLanguage share one resolved value", () => {
  for (const route of registeredRoutes) {
    const resolved = resolvePublicMetadata(input(route));
    const graph = buildJsonLd(resolved, ORIGIN);
    const webpage = graph["@graph"].find((n) => n["@type"] === "WebPage");
    assert.equal(webpage.inLanguage, resolved.language, route);
  }
});

test("WebPage name/url match resolved title/canonical; WebSite semantics preserved", () => {
  const resolved = resolvePublicMetadata(
    input("/about/", { title: "About the System | Meta-Writing Ecology" })
  );
  const graph = buildJsonLd(resolved, ORIGIN);
  const website = graph["@graph"].find((n) => n["@type"] === "WebSite");
  const webpage = graph["@graph"].find((n) => n["@type"] === "WebPage");
  assert.equal(webpage.name, "About the System | Meta-Writing Ecology");
  assert.equal(webpage.url, resolved.canonicalUrl);
  assert.equal(webpage.url, `${ORIGIN}/about/`);
  assert.equal(webpage["@id"], `${ORIGIN}/about/#webpage`);
  assert.equal(webpage.isPartOf["@id"], `${ORIGIN}/#website`);
  // WebSite node text is preserved exactly.
  assert.equal(website.name, WEBSITE_NODE.name);
  assert.equal(website.description, WEBSITE_NODE.description);
  assert.equal(website.url, `${ORIGIN}/`);
  assert.equal(website["@id"], `${ORIGIN}/#website`);
});

// --- 13: JSON-LD-enabled routes require a canonical URL --------------------

test("structured data enabled without a canonical URL fails closed", () => {
  const badPolicy = {
    language: "en",
    canonical: { kind: "none" },
    indexing: { kind: "indexable" },
    structuredData: { enabled: true, type: "WebPage", genre: "Public orientation surface" }
  };
  assert.throws(
    () => resolveMetadataForPolicy(badPolicy, input("/about/")),
    (err) => err instanceof PublicMetadataError && err.code === "STRUCTURED_WITHOUT_CANONICAL"
  );
  // Every JSON-LD-enabled registered route does produce a canonical URL.
  for (const route of registeredRoutes) {
    const policy = ROUTE_METADATA_REGISTRY[route];
    if (policy.structuredData.enabled) {
      const resolved = resolvePublicMetadata(input(route));
      assert.ok(resolved.canonicalUrl, route);
      assert.equal(resolved.canonicalUrl, resolved.structuredData.url, route);
    }
  }
});

// --- 14: interactive preview policy ----------------------------------------

test("interactive preview remains noindex/nofollow with structured data enabled", () => {
  const resolved = resolvePublicMetadata(input(INTERACTIVE));
  assert.equal(resolved.robots, "noindex, nofollow");
  assert.equal(resolved.language, "en");
  assert.ok(resolved.canonicalUrl, "self canonical retained");
  assert.equal(resolved.canonicalUrl, `${ORIGIN}${INTERACTIVE}`);
  assert.equal(resolved.structuredData.enabled, true);
  const graph = buildJsonLd(resolved, ORIGIN);
  const types = graph["@graph"].map((n) => n["@type"]);
  assert.deepEqual(types, ["WebSite", "WebPage"]);
});

// --- 15 / 16 / 17 / 18: fail-closed conditions -----------------------------

test("unknown routes fail closed", () => {
  assert.throws(
    () => resolvePublicMetadata(input("/not-a-registered-route/")),
    (err) => err instanceof PublicMetadataError && err.code === "UNKNOWN_ROUTE"
  );
});

test("missing or empty title fails", () => {
  for (const bad of ["", "   ", undefined, null, 123]) {
    assert.throws(
      () => resolvePublicMetadata(input("/about/", { title: bad })),
      (err) => err instanceof PublicMetadataError && err.code === "TITLE_EMPTY",
      `title=${JSON.stringify(bad)}`
    );
  }
});

test("missing required description fails", () => {
  for (const bad of ["", "   ", undefined, null]) {
    assert.throws(
      () => resolvePublicMetadata(input("/about/", { description: bad })),
      (err) => err instanceof PublicMetadataError && err.code === "DESCRIPTION_REQUIRED",
      `description=${JSON.stringify(bad)}`
    );
  }
});

test("unsupported language fails", () => {
  for (const badLang of ["fr", "zh-TW", "", "EN"]) {
    const badPolicy = {
      language: badLang,
      canonical: { kind: "self" },
      indexing: { kind: "indexable" },
      structuredData: { enabled: false }
    };
    assert.throws(
      () => resolveMetadataForPolicy(badPolicy, input("/about/")),
      (err) => err instanceof PublicMetadataError && err.code === "UNSUPPORTED_LANGUAGE",
      `lang=${badLang}`
    );
  }
  assert.deepEqual([...SUPPORTED_LANGUAGES], ["en", "zh"]);
});

// --- 19: generic frontmatter authority fields are not consumed -------------

test("registry carries no page title/description or authority fields", () => {
  for (const route of registeredRoutes) {
    const policy = ROUTE_METADATA_REGISTRY[route];
    const keys = Object.keys(policy);
    assert.deepEqual(
      keys.sort(),
      ["canonical", "indexing", "language", "structuredData"],
      route
    );
    // No title/description leaked into the policy.
    assert.equal(policy.title, undefined);
    assert.equal(policy.description, undefined);
    for (const forbidden of FORBIDDEN_METADATA_KEYS) {
      assert.equal(policy[forbidden], undefined, `${route} carries ${forbidden}`);
    }
  }
});

test("BaseLayout only reads title/description/mainClass from page inputs (no authority frontmatter)", () => {
  const base = readFileSync(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8");
  // The resolver drives language from the registry; BaseLayout must not read a
  // generic `frontmatter.language` (or other authority fields) into metadata.
  for (const forbidden of [...FORBIDDEN_METADATA_KEYS, "language"]) {
    assert.ok(
      !new RegExp(`frontmatter\\.${forbidden}\\b`).test(base),
      `BaseLayout consumes frontmatter.${forbidden}`
    );
  }
});

// --- 20: no forbidden metadata keys are emitted ----------------------------

test("no forbidden metadata keys appear anywhere in the JSON-LD graph", () => {
  for (const route of registeredRoutes) {
    const resolved = resolvePublicMetadata(input(route));
    const graph = buildJsonLd(resolved, ORIGIN);
    const serialized = JSON.stringify(graph);
    for (const forbidden of FORBIDDEN_METADATA_KEYS) {
      assert.ok(
        !new RegExp(`"${forbidden}"\\s*:`, "i").test(serialized),
        `${route} emits forbidden key ${forbidden}`
      );
    }
    // Also assert no other schema.org authorship/publication keys crept in.
    for (const banned of [
      "author",
      "publisher",
      "sameAs",
      "citation",
      "doi",
      "datePublished",
      "dateModified",
      "mainEntityOfPage"
    ]) {
      assert.ok(
        !new RegExp(`"${banned}"\\s*:`, "i").test(serialized),
        `${route} emits banned key ${banned}`
      );
    }
  }
});

// --- 21: existing genres preserved exactly; no new genre added -------------

test("structured genres are exactly the existing emitted set; none added", () => {
  const APPROVED_GENRES = new Set([
    "Public orientation surface",
    "AI-readable boundary page",
    "Public boundary page",
    "Classification-aware conceptual navigation",
    "Publication and citation record",
    "Thematic reading orientation",
    "Public-record summary"
  ]);
  const EXPECTED_GENRE = {
    "/ai-readable-knowledge-architecture/": "AI-readable boundary page",
    "/application-boundary/": "Public boundary page",
    "/interpretation-boundaries/": "Public boundary page",
    "/llms-boundary/": "AI-readable boundary page",
    "/models/": "Classification-aware conceptual navigation",
    "/publications/": "Publication and citation record",
    "/entry-points/": "Thematic reading orientation",
    "/public-records/": "Public-record summary"
  };
  for (const route of registeredRoutes) {
    const policy = ROUTE_METADATA_REGISTRY[route];
    assert.ok(policy.structuredData.enabled, route);
    const genre = policy.structuredData.genre;
    assert.ok(APPROVED_GENRES.has(genre), `${route} genre not approved: ${genre}`);
    const expected = EXPECTED_GENRE[route] ?? "Public orientation surface";
    assert.equal(genre, expected, `${route} genre drift`);
    // Genre round-trips unchanged into the WebPage node.
    const resolved = resolvePublicMetadata(input(route));
    const graph = buildJsonLd(resolved, ORIGIN);
    const webpage = graph["@graph"].find((n) => n["@type"] === "WebPage");
    assert.equal(webpage.genre, expected, route);
  }
});

// --- 22: no OG/Twitter/hreflang/alternate/locale contract ------------------

test("no Open Graph, Twitter, hreflang, alternate-language, or locale contract is introduced", () => {
  // Strip `//` line comments so doc comments that merely NAME the excluded
  // contracts (to document their exclusion) are not mistaken for emission.
  const stripComments = (src) =>
    src
      .split("\n")
      .filter((line) => !/^\s*\/\//.test(line))
      .join("\n");
  const module = stripComments(
    readFileSync(new URL("../src/lib/publicMetadata.ts", import.meta.url), "utf8")
  );
  const base = stripComments(
    readFileSync(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8")
  );
  // Emission-shaped patterns: an actual OG/Twitter meta tag, an hreflang or
  // alternate-language link, or an og:locale declaration.
  const banned = [
    /property\s*=\s*["']og:/i,
    /name\s*=\s*["']twitter:/i,
    /\bhreflang\b/i,
    /rel\s*=\s*["']alternate["']/i,
    /["']og:locale["']/i
  ];
  for (const src of [module, base]) {
    for (const re of banned) {
      assert.ok(!re.test(src), `banned metadata contract present: ${re}`);
    }
  }
  // No JSON-LD graph carries an inLanguage-alternate or og field.
  for (const route of registeredRoutes) {
    const resolved = resolvePublicMetadata(input(route));
    const serialized = JSON.stringify(buildJsonLd(resolved, ORIGIN));
    assert.ok(!/og:|twitter:|hreflang|"alternate"/i.test(serialized), route);
  }
});

// --- robots derivation -----------------------------------------------------

test("robots values derive only from the typed indexing policy", () => {
  assert.equal(robotsFromIndexing({ kind: "indexable" }), undefined);
  assert.equal(robotsFromIndexing({ kind: "noindex", follow: true }), "noindex, follow");
  assert.equal(robotsFromIndexing({ kind: "noindex", follow: false }), "noindex, nofollow");
  // Indexable registered routes emit no robots; interactive emits noindex,nofollow.
  for (const route of indexableRegistered) {
    const resolved = resolvePublicMetadata(input(route));
    assert.equal(resolved.robots, undefined, route);
  }
  assert.equal(resolvePublicMetadata(input(INTERACTIVE)).robots, "noindex, nofollow");
});
