#!/usr/bin/env node
// Package C — post-build indexing/discovery verifier.
//
// Inspects generated build output only, after a successful build. It never
// rewrites generated files, never makes network calls, and asserts only
// deterministic engineering contracts. It is not a semantic or MWE authority;
// it produces engineering validation results.
//
// The verification logic is exposed as a callable function
// (verifyIndexingDiscoveryBuild) so isolated tests can run the REAL verifier
// against temporary source/build fixtures; the CLI at the bottom runs the same
// implementation against the repository defaults and exits non-zero on any
// finding. Importing this module does not run the CLI.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, relative as pathRelative, isAbsolute as pathIsAbsolute } from "node:path";

import {
  PRODUCTION_ORIGIN,
  SITEMAP_EXCLUDED_PATHS,
  NOT_FOUND_PATH,
  normalizeRoutePath,
  resolveRouteSource,
  findForbiddenOriginUrls,
  findFeedSignatures,
  sitemapUrlSetViolations,
  rawSitemapLocViolations,
  rawChildLocViolations,
  childSitemapBasename
} from "./lib/indexing-discovery-contract.mjs";

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function toDirUrl(value) {
  if (value instanceof URL) return value;
  const s = String(value);
  return pathToFileURL(s.endsWith("/") ? s : `${s}/`);
}

// Derive a public route path from a generated HTML file, platform-independent:
// backslash and forward-slash separators are both normalized before the route
// is derived, so Windows-style dist paths yield the same route as POSIX paths.
export function distRelativeRoute(distDirPath, absFile) {
  const norm = (p) => String(p).split("\\").join("/").replace(/\/+$/, "");
  const root = norm(distDirPath);
  const file = norm(absFile);
  let rel;
  if (file.startsWith(`${root}/`)) rel = file.slice(root.length + 1);
  else if (file.startsWith(root)) rel = file.slice(root.length);
  else rel = file;
  rel = rel.replace(/^\/+/, "");
  const route = `/${rel}`.replace(/index\.html$/, "").replace(/\.html$/, "");
  return normalizeRoutePath(route);
}

// Path-aware containment: true only when `file` is strictly beneath `dir`.
// Uses path.relative rather than string-prefix matching, so a sibling directory
// that shares a string prefix (e.g. dist vs dist2) is correctly rejected, and a
// traversal target resolving outside dist is rejected on POSIX and Windows.
export function isWithinDir(dir, file) {
  const rel = pathRelative(dir, file);
  if (rel === "") return false; // the dir itself is not a child file
  if (pathIsAbsolute(rel)) return false; // different root/drive
  return !rel.split(/[\\/]/).includes(".."); // any traversal segment escapes dir
}

function walkFiles(dirUrl, acc = []) {
  for (const entry of readdirSync(dirUrl, { withFileTypes: true })) {
    const childUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dirUrl);
    if (entry.isDirectory()) walkFiles(childUrl, acc);
    else acc.push(fileURLToPath(childUrl));
  }
  return acc;
}

function extractTags(xml, tag) {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1].trim());
  return out;
}

// ---------------------------------------------------------------------------
// Independent expected-sitemap inventory (derived from page sources + robots)
// ---------------------------------------------------------------------------

// Parse a single `<meta ...>` tag into bounded structured evidence, preserving
// EVERY attribute occurrence (not just the first) so duplicates can be detected.
// Attribute names are compared case-insensitively. Each occurrence value is a
// literal string or the marker DYNAMIC (an Astro/JSX `{expr}` value).
//
// Returns { attributes, occurrences, duplicateAttributes } where:
// - occurrences: [{ name, value }] in source order (all occurrences);
// - attributes: name -> first value (convenience only; never used to resolve a
//   duplicated attribute);
// - duplicateAttributes: Set of names appearing more than once in the tag.
const DYNAMIC = Symbol("dynamic");
function parseMetaAttributes(tag) {
  const occurrences = [];
  const attributes = new Map();
  const counts = new Map();
  const duplicateAttributes = new Set();
  const re =
    /([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{[^}]*\})|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(tag)) !== null) {
    const name = m[1].toLowerCase();
    let value;
    if (m[2] !== undefined) value = m[2];
    else if (m[3] !== undefined) value = m[3];
    else if (m[4] !== undefined) value = DYNAMIC; // {expr}
    else value = m[5];
    occurrences.push({ name, value });
    counts.set(name, (counts.get(name) ?? 0) + 1);
    if (counts.get(name) > 1) duplicateAttributes.add(name);
    if (!attributes.has(name)) attributes.set(name, value);
  }
  return { attributes, occurrences, duplicateAttributes };
}

// Classify a page source's robots contract from its literal declaration forms.
// Returns { status: "indexable" | "noindex" | "ambiguous", findings }.
//
// Robots meta tags are parsed as bounded attribute SETS, so attribute order and
// harmless intervening attributes do not matter. name=robots is matched
// case-insensitively and literal content is identified independently. Ambiguous,
// dynamic, or malformed literal robots declarations fail closed with a finding
// rather than silently defaulting to indexable. Frontmatter is recognized with
// both LF and CRLF line endings. Unrelated meta tags never contribute content.
export function classifyRobots(text, file) {
  const findings = [];
  const values = [];
  let dynamic = false;
  let malformed = false;

  // 1. Every <meta ...> tag, parsed as structured occurrence evidence.
  for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
    const { occurrences, duplicateAttributes } = parseMetaAttributes(m[0]);
    const nameOccurrences = occurrences.filter((o) => o.name === "name").map((o) => o.value);
    const contentOccurrences = occurrences.filter((o) => o.name === "content").map((o) => o.value);
    const hasDynamicName = nameOccurrences.includes(DYNAMIC);
    const literalNames = nameOccurrences
      .filter((v) => typeof v === "string")
      .map((v) => v.trim().toLowerCase());

    // A tag is robots-relevant if any of its name occurrences is "robots", or if
    // it carries a dynamic name (which could be robots and cannot be evaluated).
    const isRobotsRelevant = literalNames.includes("robots") || hasDynamicName;
    if (!isRobotsRelevant) continue;

    if (hasDynamicName) {
      dynamic = true; // dynamic name — fail closed
      continue;
    }
    // A duplicate name or content attribute on a robots-relevant tag is
    // malformed/ambiguous — never reduced to a first (or last) value, even when
    // the duplicated values are identical.
    if (duplicateAttributes.has("name") || duplicateAttributes.has("content")) {
      malformed = true;
      continue;
    }
    if (contentOccurrences.length === 0) {
      malformed = true; // name=robots with no content attribute
      continue;
    }
    const content = contentOccurrences[0];
    if (content === DYNAMIC) dynamic = true; // dynamic content — fail closed
    else values.push(String(content).trim());
  }

  // 2. BaseLayout `robots="…"` prop form (literal) and `robots={…}` (dynamic).
  for (const m of text.matchAll(/(?:^|\s)robots\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    values.push((m[1] ?? m[2]).trim());
  }
  if (/(?:^|\s)robots\s*=\s*\{/.test(text)) dynamic = true;

  // 3. Markdown/MDX frontmatter robots field (LF or CRLF line endings).
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter) {
    const fmRobots = frontmatter[1].match(
      /^\s*robots\s*:\s*["']?([^"'\r\n]+?)["']?\s*$/im
    );
    if (fmRobots) values.push(fmRobots[1].trim());
  }

  if (dynamic) {
    findings.push({
      code: "ROBOTS_DYNAMIC",
      file,
      message: `dynamic (non-literal) robots declaration cannot be evaluated safely: ${file}`
    });
    return { status: "ambiguous", findings };
  }
  if (malformed) {
    findings.push({
      code: "ROBOTS_MALFORMED",
      file,
      message: `malformed robots meta (duplicate name/content attribute, or name=robots with no literal content): ${file}`
    });
    return { status: "ambiguous", findings };
  }

  const distinct = [...new Set(values.map((v) => v.toLowerCase()))];
  if (distinct.length === 0) return { status: "indexable", findings };
  if (distinct.length > 1) {
    findings.push({
      code: "ROBOTS_AMBIGUOUS",
      file,
      message: `conflicting robots declarations in ${file}: ${distinct.join(" | ")}`
    });
    return { status: "ambiguous", findings };
  }
  return {
    status: distinct[0].includes("noindex") ? "noindex" : "indexable",
    findings
  };
}

// Independently derive the set of route paths that MUST appear in the sitemap,
// from actual page sources and their actual robots contracts. Deliberately does
// NOT consult isSitemapEligible, SITEMAP_EXCLUDED_PATHS, or the generated
// sitemap — it is an independent oracle. Returns { expected: Set, findings }.
export function buildExpectedRouteSet({ pagesDir }) {
  const pagesUrl = toDirUrl(pagesDir);
  const pagesRoot = fileURLToPath(pagesUrl);
  const findings = [];
  const expected = new Set();

  const sources = [];
  const walk = (absDir, prefix) => {
    for (const e of readdirSync(absDir, { withFileTypes: true })) {
      const abs = join(absDir, e.name);
      if (e.isDirectory()) {
        walk(abs, `${prefix}${e.name}/`);
        continue;
      }
      // Only real page-source forms; JSON/data endpoint TypeScript modules
      // (e.g. manifest.json.ts) are not page sources.
      const m = e.name.match(/^(.*)\.(astro|md|mdx)$/);
      if (!m) continue;
      sources.push({ abs, prefix, base: m[1] });
    }
  };
  walk(pagesRoot, "");

  for (const { abs, prefix, base } of sources) {
    let route;
    if (base === "index") route = prefix === "" ? "/" : `/${prefix}`;
    else route = `/${prefix}${base}/`;
    route = normalizeRoutePath(route);

    if (route === NOT_FOUND_PATH) continue; // 404 excluded

    const text = readFileSync(abs, "utf8");
    const robots = classifyRobots(text, abs);
    for (const f of robots.findings) findings.push(f);

    if (robots.status === "indexable") expected.add(route);
    // noindex -> excluded; ambiguous -> fail-closed finding, not added.
  }

  return { expected, findings };
}

// ---------------------------------------------------------------------------
// The verifier
// ---------------------------------------------------------------------------

// Run the full post-build contract against a specific tree. Returns
// { results, failed }. Never throws for contract violations (they become
// findings); throws only on unexpected internal errors.
export function verifyIndexingDiscoveryBuild({ repoRoot, pagesDir, distDir } = {}) {
  // `repoRoot` is the base for any directory not explicitly supplied.
  const rootUrl = repoRoot ? toDirUrl(repoRoot) : new URL("../", import.meta.url);
  const pagesUrl = toDirUrl(pagesDir ?? new URL("src/pages/", rootUrl));
  const distUrl = toDirUrl(distDir ?? new URL("dist/", rootUrl));
  const distDirPath = fileURLToPath(distUrl);
  const distPath = (rel) => fileURLToPath(new URL(rel, distUrl));

  const results = [];
  let failed = false;
  const check = (ok, code, label, detail = "") => {
    results.push({ ok, code, label, detail });
    if (!ok) failed = true;
  };

  // --- Preconditions -------------------------------------------------------
  if (!existsSync(distUrl)) {
    check(false, "BUILD_MISSING", "dist/ build output present", "run `pnpm run build` first");
    return { results, failed };
  }
  const sitemapIndexFile = distPath("sitemap-index.xml");
  if (!existsSync(sitemapIndexFile)) {
    check(false, "SITEMAP_INDEX_MISSING", "sitemap-index.xml present", "run `pnpm run build` first");
    return { results, failed };
  }

  // --- Sitemap index + child locations -------------------------------------
  const indexXml = readFileSync(sitemapIndexFile, "utf8");
  const childLocs = extractTags(indexXml, "loc");
  check(
    childLocs.length > 0,
    "SITEMAP_INDEX_CHILDREN",
    "sitemap index references at least one child sitemap",
    `${childLocs.length} child sitemap(s)`
  );

  const seenChild = new Set();
  const childFiles = [];
  for (const loc of childLocs) {
    const childFindings = rawChildLocViolations(loc);
    check(
      childFindings.length === 0,
      "CHILD_LOC_SHAPE",
      "child sitemap loc is an exact production sitemap-<n>.xml URL",
      childFindings.map((f) => f.code).join(", ") || loc
    );
    check(
      !seenChild.has(loc),
      "CHILD_LOC_UNIQUE",
      "child sitemap locations are unique",
      loc
    );
    seenChild.add(loc);

    const base = childSitemapBasename(loc);
    if (base === null) continue; // shape already reported
    // Resolve strictly beneath dist (path-aware, not string-prefix).
    const childFile = distPath(base);
    const beneath = isWithinDir(distDirPath, childFile);
    check(beneath, "CHILD_WITHIN_DIST", "child sitemap resolves beneath dist", base);
    if (!beneath) continue;
    if (!existsSync(childFile)) {
      check(false, "CHILD_FILE_MISSING", "child sitemap file exists", base);
      continue;
    }
    childFiles.push(childFile);
  }

  // --- Collect URL entries -------------------------------------------------
  const urlEntries = [];
  for (const childFile of childFiles) {
    const childXml = readFileSync(childFile, "utf8");
    const blocks = childXml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    for (const block of blocks) {
      urlEntries.push({
        loc: extractTags(block, "loc")[0],
        lastmod: extractTags(block, "lastmod")[0]
      });
    }
  }
  check(urlEntries.length > 0, "SITEMAP_HAS_URLS", "sitemap contains URL entries", `${urlEntries.length}`);

  // --- Raw page-loc shape (before normalization) ---------------------------
  for (const { loc } of urlEntries) {
    const rawFindings = rawSitemapLocViolations(loc);
    check(
      rawFindings.length === 0,
      "SITEMAP_LOC_SHAPE",
      "sitemap page loc is an exact production URL (raw-shape, pre-normalization)",
      rawFindings.map((f) => f.code).join(", ") || loc
    );
  }

  // --- Set-level URL contract (shared validator) ---------------------------
  const locs = urlEntries.map((e) => e.loc);
  const setViolations = sitemapUrlSetViolations(locs);
  check(
    setViolations.length === 0,
    "SITEMAP_URL_SET",
    "sitemap URL set satisfies origin/normalization/eligibility/uniqueness contract",
    setViolations.map((v) => `${v.code}:${v.loc}`).join(", ")
  );

  // --- Generated route set + independent expected comparison ---------------
  const generatedRoutes = new Set();
  const generatedSeen = new Set();
  const duplicateGenerated = new Set();
  for (const loc of locs) {
    let route;
    try {
      route = normalizeRoutePath(new URL(loc).pathname);
    } catch {
      continue; // already reported by raw/set validators
    }
    if (generatedSeen.has(route)) duplicateGenerated.add(route);
    generatedSeen.add(route);
    generatedRoutes.add(route);
  }
  check(
    duplicateGenerated.size === 0,
    "SITEMAP_NO_DUPLICATE_ROUTE",
    "no duplicate generated sitemap route",
    [...duplicateGenerated].join(", ")
  );

  const { expected, findings: robotsFindings } = buildExpectedRouteSet({ pagesDir: pagesUrl });
  for (const f of robotsFindings) {
    check(false, f.code, "page-source robots contract is unambiguous", f.message);
  }
  const missingExpected = [...expected].filter((r) => !generatedRoutes.has(r)).sort();
  const unexpectedGenerated = [...generatedRoutes].filter((r) => !expected.has(r)).sort();
  check(
    missingExpected.length === 0,
    "SITEMAP_MISSING_EXPECTED",
    "every indexable page source appears in the sitemap",
    missingExpected.join(", ")
  );
  check(
    unexpectedGenerated.length === 0,
    "SITEMAP_UNEXPECTED_ROUTE",
    "every sitemap route corresponds to an indexable page source",
    unexpectedGenerated.join(", ")
  );
  check(
    expected.size === generatedRoutes.size && missingExpected.length === 0 && unexpectedGenerated.length === 0,
    "SITEMAP_SET_EXACT_MATCH",
    "independently-derived expected route set equals the generated route set",
    `expected ${expected.size}, generated ${generatedRoutes.size}`
  );

  // --- Route existence + lastmod ISO ---------------------------------------
  for (const { loc, lastmod } of urlEntries) {
    let route;
    try {
      route = normalizeRoutePath(new URL(loc).pathname);
    } catch {
      continue;
    }
    let source = null;
    let resolverError = null;
    try {
      source = resolveRouteSource(new URL(loc).pathname, { pagesDir: pagesUrl });
    } catch (err) {
      resolverError = err;
    }
    check(
      resolverError === null,
      "SITEMAP_ROUTE_RESOLVES",
      "sitemap route resolves without a resolver contract error",
      resolverError ? `${resolverError.code}: ${route}` : route
    );
    if (resolverError === null) {
      check(source !== null, "SITEMAP_ROUTE_EXISTS", "sitemap URL maps to a real page source", route);
    }
    if (lastmod !== undefined) {
      const d = new Date(lastmod);
      check(!Number.isNaN(d.getTime()), "SITEMAP_LASTMOD_ISO", "sitemap lastmod is valid ISO 8601", `${route} -> ${lastmod}`);
    }
  }

  // --- Forbidden origins + feed signatures across discovery outputs --------
  const scan = (relPath, { feed = false } = {}) => {
    const file = distPath(relPath);
    if (!existsSync(file)) return;
    const text = readFileSync(file, "utf8");
    const forbidden = findForbiddenOriginUrls(text);
    check(forbidden.length === 0, "FORBIDDEN_ORIGIN", `no forbidden origin in ${relPath}`, forbidden.join(", "));
    if (feed) {
      const feeds = findFeedSignatures(text);
      check(feeds.length === 0, "FEED_SIGNATURE", `no RSS/Atom feed signature in ${relPath}`, feeds.map((f) => f.code).join(", "));
    }
  };
  scan("sitemap-index.xml", { feed: true });
  for (const base of [...seenChild].map(childSitemapBasename).filter(Boolean)) {
    scan(base, { feed: true });
  }
  scan("robots.txt");
  scan("llms.txt");

  // --- robots.txt sitemap pointer parity -----------------------------------
  const robotsFile = distPath("robots.txt");
  if (existsSync(robotsFile)) {
    const robots = readFileSync(robotsFile, "utf8");
    const sitemapLine = robots
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /^sitemap:/i.test(l));
    check(
      sitemapLine === `Sitemap: ${PRODUCTION_ORIGIN}/sitemap-index.xml`,
      "ROBOTS_SITEMAP_POINTER",
      "robots.txt Sitemap points to the production sitemap index",
      sitemapLine ?? "(no Sitemap line)"
    );
  } else {
    check(false, "ROBOTS_MISSING", "robots.txt present in build output");
  }

  // --- Feed absence: filename + content across all dist text ---------------
  const allDistFiles = walkFiles(distUrl);
  const feedFiles = allDistFiles.filter((f) =>
    /(?:^|[\\/])(?:rss|atom|feed)\.xml$/i.test(f.split("\\").join("/"))
  );
  check(feedFiles.length === 0, "FEED_ABSENT", "no rss.xml / atom.xml / feed.xml output", feedFiles.join(", "));

  const feedScanExts = /\.(?:xml|html|txt)$/i;
  for (const f of allDistFiles) {
    if (!feedScanExts.test(f)) continue;
    const text = readFileSync(f, "utf8");
    const feeds = findFeedSignatures(text);
    const route = f.split("\\").join("/").slice(distDirPath.split("\\").join("/").length);
    check(feeds.length === 0, "FEED_CONTENT_SIGNATURE", `no RSS/Atom document signature in ${route}`, feeds.map((x) => x.code).join(", "));
  }

  // --- Prerendered HTML canonical / robots parity (Windows-safe route) ------
  const htmlFiles = allDistFiles.filter((f) => f.endsWith(".html"));
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const route = distRelativeRoute(distDirPath, file);
    const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)].map((m) => m[1]);
    const robotsMeta = (html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i) ?? [])[1];
    const inSitemap = generatedRoutes.has(route);

    if (SITEMAP_EXCLUDED_PATHS.has(route)) {
      check(!inSitemap, "EXCLUDED_NOT_IN_SITEMAP", "excluded route absent from sitemap", route);
      check(
        /noindex/i.test(robotsMeta ?? "") && /nofollow/i.test(robotsMeta ?? ""),
        "EXCLUDED_NOINDEX",
        "excluded preview route is noindex,nofollow",
        `${route} -> ${robotsMeta ?? "(none)"}`
      );
      if (route === "/public-surface-map/interactive/") {
        check(
          canonicals.length === 1 && canonicals[0] === `${PRODUCTION_ORIGIN}${route}`,
          "INTERACTIVE_SELF_CANONICAL",
          "interactive preview retains a single self-canonical",
          canonicals.join(", ") || "(none)"
        );
      }
      continue;
    }

    if (inSitemap) {
      check(canonicals.length === 1, "CANONICAL_SINGLE", "sitemap HTML route has exactly one canonical", `${route} -> ${canonicals.length}`);
      if (canonicals.length === 1) {
        check(
          canonicals[0] === `${PRODUCTION_ORIGIN}${route}`,
          "CANONICAL_PARITY",
          "canonical equals the production sitemap route",
          `${route} -> ${canonicals[0]}`
        );
      }
      check(!/noindex/i.test(robotsMeta ?? ""), "SITEMAP_NOT_NOINDEX", "sitemap HTML route is not noindex", `${route} -> ${robotsMeta ?? "(none)"}`);
    }
  }

  return { results, failed };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function reportAndExit({ results, failed }) {
  for (const r of results) {
    const status = r.ok ? "PASS" : "FAIL";
    const detail = r.detail ? ` — ${r.detail}` : "";
    process.stdout.write(`${status}  ${r.code}  ${r.label}${detail}\n`);
  }
  const passed = results.filter((r) => r.ok).length;
  process.stdout.write(`\nverify-indexing-discovery-build: ${passed}/${results.length} checks passed\n`);
  if (failed) {
    process.stdout.write("\nverify-indexing-discovery-build: FAILED\n");
    process.exit(1);
  }
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  // Repository defaults: pagesDir and distDir derive from repoRoot.
  reportAndExit(verifyIndexingDiscoveryBuild({ repoRoot: new URL("../", import.meta.url) }));
}
