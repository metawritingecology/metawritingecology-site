// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — metadata and indexing tests.
//
// These pin the new route's registry entry, canonical URL, robots output, and
// sitemap exclusion, and prove the parent page stays indexable.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  APPROVED_PRODUCTION_ORIGIN,
  ROUTE_METADATA_REGISTRY,
  buildJsonLd,
  getRegisteredRoutes,
  getRoutePolicy,
  normalizeRoute,
  resolvePublicMetadata,
  robotsFromIndexing,
} from "../../src/lib/publicMetadata.ts";
import {
  SITEMAP_EXCLUDED_PATHS,
  hasFileExtension,
  isSitemapEligible,
  normalizeRoutePath,
} from "../../scripts/lib/indexing-discovery-contract.mjs";
import {
  APPROVED_TITLE,
  APPROVED_DESCRIPTION,
  EXPANDED_ROUTE,
  AUTHORITY_ROUTE,
  PARENT_ROUTE,
} from "../../src/lib/public-surface-adjacency-map/publicWording.ts";
import {
  MANIFEST_ROUTE_PATH,
  SELECTED_SNAPSHOT_ID,
  snapshotPathForId,
} from "../../src/lib/public-surface-adjacency-map/runtimeManifestContract.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const input = (route, over = {}) => ({
  route,
  title: APPROVED_TITLE,
  description: APPROVED_DESCRIPTION,
  siteOrigin: APPROVED_PRODUCTION_ORIGIN,
  ...over,
});

// ---------------------------------------------------------------------------

test("the expanded route is registered exactly once and already normalized", () => {
  const routes = getRegisteredRoutes();
  assert.equal(routes.filter((route) => route === EXPANDED_ROUTE).length, 1);
  assert.equal(normalizeRoute(EXPANDED_ROUTE), EXPANDED_ROUTE);
  assert.ok(Object.prototype.hasOwnProperty.call(ROUTE_METADATA_REGISTRY, EXPANDED_ROUTE));
});

test("the registered policy is exactly the approved one", () => {
  const policy = getRoutePolicy(EXPANDED_ROUTE);
  assert.ok(policy);
  assert.equal(policy.language, "en");
  assert.deepEqual(policy.canonical, { kind: "self" });
  assert.deepEqual(policy.indexing, { kind: "noindex", follow: false });
  assert.equal(policy.structuredData.enabled, true);
  assert.equal(policy.structuredData.type, "WebPage");
  assert.equal(policy.structuredData.genre, "Public orientation surface");
  // No title or semantic content lives in the route registry.
  assert.deepEqual(Object.keys(policy).sort(), [
    "canonical",
    "indexing",
    "language",
    "structuredData",
  ]);
});

test("there is no generic route fallback: an unregistered route fails closed", () => {
  assert.throws(
    () => resolvePublicMetadata(input("/public-surface-map/expanded/not-a-route/")),
    (error) => error.code === "UNKNOWN_ROUTE",
  );
  assert.equal(getRoutePolicy("/public-surface-map/expanded/nope/"), undefined);
});

test("robots resolves to exactly noindex, nofollow", () => {
  const resolved = resolvePublicMetadata(input(EXPANDED_ROUTE));
  assert.equal(resolved.robots, "noindex, nofollow");
  assert.equal(robotsFromIndexing({ kind: "noindex", follow: false }), "noindex, nofollow");
});

test("the canonical URL is the exact self URL on the approved origin", () => {
  const resolved = resolvePublicMetadata(input(EXPANDED_ROUTE));
  assert.equal(resolved.canonicalUrl, `${APPROVED_PRODUCTION_ORIGIN}${EXPANDED_ROUTE}`);
  assert.equal(resolved.canonicalUrl, "https://metawritingecology.org/public-surface-map/expanded/");
  assert.equal(resolved.language, "en");

  const graph = buildJsonLd(resolved, APPROVED_PRODUCTION_ORIGIN);
  const webpage = graph["@graph"].find((node) => node["@type"] === "WebPage");
  assert.equal(webpage.url, resolved.canonicalUrl);
  assert.equal(webpage.description, APPROVED_DESCRIPTION);
  assert.equal(webpage.name, APPROVED_TITLE);
  assert.equal(webpage.inLanguage, "en");
  for (const node of graph["@graph"]) {
    assert.ok(["WebSite", "WebPage"].includes(node["@type"]));
  }
});

test("a preview or workers.dev origin can never enter the canonical URL", () => {
  for (const origin of ["https://mwe-site.pages.dev", "https://mwe-site.workers.dev", "http://localhost:4321"]) {
    assert.throws(
      () => resolvePublicMetadata(input(EXPANDED_ROUTE, { siteOrigin: origin })),
      (error) => error.code === "ORIGIN_FORBIDDEN",
      origin,
    );
  }
});

test("the route is excluded from the sitemap and the parent stays indexable", () => {
  assert.ok(SITEMAP_EXCLUDED_PATHS.has(EXPANDED_ROUTE));
  assert.equal(isSitemapEligible(EXPANDED_ROUTE), false);
  assert.equal(normalizeRoutePath("/public-surface-map/expanded"), EXPANDED_ROUTE);

  assert.ok(!SITEMAP_EXCLUDED_PATHS.has(PARENT_ROUTE));
  assert.equal(isSitemapEligible(PARENT_ROUTE), true);

  // The 30-record route's own exclusion is untouched.
  assert.ok(SITEMAP_EXCLUDED_PATHS.has(AUTHORITY_ROUTE));
  assert.equal(isSitemapEligible(AUTHORITY_ROUTE), false);
});

test("the JSON endpoints are extension-bearing and never enter the sitemap", () => {
  for (const endpoint of [MANIFEST_ROUTE_PATH, snapshotPathForId(SELECTED_SNAPSHOT_ID)]) {
    assert.equal(hasFileExtension(endpoint), true, endpoint);
    assert.equal(isSitemapEligible(endpoint), false, endpoint);
    // Extension-bearing endpoint paths keep their exact form (no trailing slash).
    assert.equal(normalizeRoutePath(endpoint), endpoint);
    // They are excluded as endpoints, not by membership in the exclusion set.
    assert.ok(!SITEMAP_EXCLUDED_PATHS.has(endpoint), endpoint);
  }
});

test("route counts were updated mechanically: 42 indexable, 2 noindex previews", () => {
  const routes = getRegisteredRoutes();
  const noindex = routes.filter((route) => getRoutePolicy(route).indexing.kind === "noindex");
  assert.deepEqual(noindex.sort(), [EXPANDED_ROUTE, AUTHORITY_ROUTE].sort());
  assert.equal(routes.length - noindex.length, 42);
  assert.equal(routes.length, 44);
});

test("the source route file and the exclusion list agree", () => {
  const page = rd("src/pages/public-surface-map/expanded/index.astro");
  assert.ok(/robots="noindex, nofollow"/.test(page));
  const contract = rd("scripts/lib/indexing-discovery-contract.mjs");
  assert.ok(contract.includes(`"${EXPANDED_ROUTE}"`));
  // The frozen route's exclusion entry is still present and unmodified.
  assert.ok(contract.includes(`"${AUTHORITY_ROUTE}"`));
});
