// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Package C — Indexing and Discovery Contracts.
//
// Deterministic source-level + build-output tests for the bounded
// indexing/discovery helper and the post-build verifier. They exercise route
// normalization, sitemap eligibility, an independently-derived expected sitemap
// set, exact raw page/child URL shape, traversal-safe and ambiguity-fatal
// route-source resolution, Windows dist-path handling, direct-source Git
// lastmod behavior (against isolated temporary repositories — never the real
// repo's Git metadata), a bounded functional-URL inventory, DOI and GitHub
// syntax, forbidden origins, feed-signature detection, and malformed synthetic
// mutation fixtures. No network access. No filesystem mtime reliance. Every
// mutation exercises the SAME production helper or verifier path as the real
// repository.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  PRODUCTION_ORIGIN,
  SITEMAP_EXCLUDED_PATHS,
  NOT_FOUND_PATH,
  DEFAULT_PAGES_DIR,
  hasFileExtension,
  normalizeRoutePath,
  isForbiddenPublicOrigin,
  findForbiddenOriginUrls,
  isSitemapEligible,
  sitemapUrlSetViolations,
  rawSitemapLocViolations,
  rawChildLocViolations,
  childSitemapBasename,
  resolveRouteSource,
  assertSafeRoutePath,
  RouteResolutionError,
  readDirectSourceLastmod,
  isValidDoi,
  isValidGithubSourceUrl,
  isApprovedSourceRepoBaseDeclaration,
  classifyGithubOccurrence,
  classifyGithubInventory,
  validateRepoBaseSuffix,
  APPROVED_SOURCE_REPO_BASE,
  classifyInternalLink,
  extractInternalLinks,
  extractFunctionalUrls,
  markdownHeadingSlugs,
  validateInternalLinks,
  validateInventory,
  collectFunctionalFragments,
  findFeedSignatures
} from "../scripts/lib/indexing-discovery-contract.mjs";

import {
  verifyIndexingDiscoveryBuild,
  buildExpectedRouteSet,
  classifyRobots,
  distRelativeRoute,
  isWithinDir
} from "../scripts/verify-indexing-discovery-build.mjs";

// Normalize a native filesystem path to forward slashes so assertions do not
// depend on the platform separator (POSIX or Windows).
const posix = (p) => String(p).split("\\").join("/");

const repoRoot = new URL("../", import.meta.url);
const rd = (rel) => readFileSync(fileURLToPath(new URL(rel, repoRoot)), "utf8");
const has = (rel) => existsSync(fileURLToPath(new URL(rel, repoRoot)));

const tempDirs = [];
function mkTemp() {
  const dir = mkdtempSync(join(tmpdir(), "mwe-idc-"));
  tempDirs.push(dir);
  return dir;
}
test.after(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
});

// ===========================================================================
// Route normalization
// ===========================================================================

test("route normalization: / stays /", () => {
  assert.equal(normalizeRoutePath("/"), "/");
  assert.equal(normalizeRoutePath(`${PRODUCTION_ORIGIN}/`), "/");
  assert.equal(normalizeRoutePath(PRODUCTION_ORIGIN), "/");
});

test("route normalization: ordinary paths get one trailing slash", () => {
  assert.equal(normalizeRoutePath("/about"), "/about/");
  assert.equal(normalizeRoutePath("/about/"), "/about/");
  assert.equal(normalizeRoutePath("/fiction/reading-paths"), "/fiction/reading-paths/");
});

test("route normalization: duplicate slashes normalize deterministically", () => {
  assert.equal(normalizeRoutePath("//about//"), "/about/");
  assert.equal(normalizeRoutePath("/fiction///reading-paths"), "/fiction/reading-paths/");
});

test("route normalization: query and fragment are not route identities", () => {
  assert.equal(normalizeRoutePath("/about/?utm=x"), "/about/");
  assert.equal(normalizeRoutePath("/about/#section"), "/about/");
  assert.equal(normalizeRoutePath("/about?q=1#h"), "/about/");
});

test("route normalization: endpoint/asset paths keep their extension form", () => {
  assert.equal(normalizeRoutePath("/robots.txt"), "/robots.txt");
  assert.equal(normalizeRoutePath("/sitemap-index.xml"), "/sitemap-index.xml");
  assert.equal(hasFileExtension("/favicon.png"), true);
  assert.equal(hasFileExtension("/about/"), false);
});

test("forbidden origins rejected where production links are required", () => {
  for (const bad of [
    "http://localhost:4321/about/",
    "http://127.0.0.1/about/",
    "https://metawritingecology-site.pages.dev/about/",
    "https://mwe-site.workers.dev/about/",
    "https://feature-x.metawritingecology-site.pages.dev/",
    "https://staging.example.com/",
    "https://deploy-preview-12.example.com/"
  ]) {
    assert.equal(isForbiddenPublicOrigin(bad), true, `should reject ${bad}`);
  }
  assert.equal(isForbiddenPublicOrigin(`${PRODUCTION_ORIGIN}/about/`), false);
});

// ===========================================================================
// Sitemap eligibility + shared set-level validator
// ===========================================================================

test("sitemap eligibility: representative ordinary public HTML routes included", () => {
  for (const route of ["/", "/about/", "/models/", "/fiction/", "/fiction/the-available-edition/", "/zh/", "/zh/boundary/"]) {
    assert.equal(isSitemapEligible(route), true, `should include ${route}`);
    assert.equal(isSitemapEligible(`${PRODUCTION_ORIGIN}${route}`), true, `should include full URL ${route}`);
  }
});

test("sitemap eligibility: prototype, preview, 404, endpoints, assets, feeds excluded", () => {
  for (const route of [
    "/language-pressure-test-lab-prototype/",
    "/public-surface-map/interactive/",
    "/404/",
    "/public-surface-map/data/manifest.json",
    "/robots.txt",
    "/llms.txt",
    "/.well-known/security.txt",
    "/sitemap-index.xml",
    "/favicon.png",
    "/rss.xml",
    "/atom.xml"
  ]) {
    assert.equal(isSitemapEligible(route), false, `should exclude ${route}`);
  }
});

test("sitemap mutation: noindex flag and exact exclusion behavior", () => {
  assert.equal(isSitemapEligible("/models/", { noindex: true }), false);
  // Similarly named routes are NOT excluded by the exact-path exclusion set.
  assert.equal(isSitemapEligible("/language-pressure-test-lab-prototype-2/"), true);
  assert.equal(isSitemapEligible("/public-surface-map/interactive-notes/"), true);
});

test("sitemap set: clean set has zero violations; mutations rejected", () => {
  const good = ["/", "/about/", "/models/", "/zh/boundary/"].map((p) => `${PRODUCTION_ORIGIN}${p}`);
  assert.deepEqual(sitemapUrlSetViolations(good), []);

  const bad = sitemapUrlSetViolations([
    `${PRODUCTION_ORIGIN}/about/`,
    `${PRODUCTION_ORIGIN}/language-pressure-test-lab-prototype/`,
    `${PRODUCTION_ORIGIN}/public-surface-map/interactive/`,
    "http://localhost:4321/about/",
    "https://mwe.workers.dev/about/",
    `${PRODUCTION_ORIGIN}/about/`
  ]);
  const codes = bad.map((f) => f.code);
  assert.ok(codes.includes("SITEMAP_URL_EXCLUDED"));
  assert.ok(codes.includes("SITEMAP_URL_NOT_ELIGIBLE"));
  assert.ok(codes.includes("SITEMAP_FORBIDDEN_ORIGIN"));
  assert.ok(codes.includes("SITEMAP_URL_ORIGIN"));
  assert.ok(codes.includes("SITEMAP_URL_DUPLICATE"));
});

// ===========================================================================
// Exact raw sitemap page-URL shape (checked before normalization)
// ===========================================================================

test("raw sitemap loc: exact production URL passes", () => {
  assert.deepEqual(rawSitemapLocViolations(`${PRODUCTION_ORIGIN}/about/`), []);
  assert.deepEqual(rawSitemapLocViolations(`${PRODUCTION_ORIGIN}/`), []);
});

test("raw sitemap loc mutation: malformed spellings are rejected before normalization", () => {
  const cases = [
    [`${PRODUCTION_ORIGIN}/about/?preview=1`, "LOC_QUERY"],
    [`${PRODUCTION_ORIGIN}/about/#section`, "LOC_FRAGMENT"],
    [`${PRODUCTION_ORIGIN}/about/%2e%2e/`, "LOC_ENCODED_DOT"],
    [`${PRODUCTION_ORIGIN}/about/%2Fhidden/`, "LOC_ENCODED_SEPARATOR"],
    [`${PRODUCTION_ORIGIN}/about/%5Chidden/`, "LOC_ENCODED_SEPARATOR"],
    ["https://user@metawritingecology.org/about/", "LOC_USERINFO"],
    ["https://metawritingecology.org:443/about/", "LOC_PORT"],
    [`${PRODUCTION_ORIGIN}/about\\hidden/`, "LOC_BACKSLASH"],
    [`${PRODUCTION_ORIGIN}/about//dup/`, "LOC_DUP_SLASH"],
    [`${PRODUCTION_ORIGIN}/about/../`, "LOC_DOT_SEGMENT"],
    ["https://example.com/about/", "LOC_ORIGIN"]
  ];
  for (const [loc, code] of cases) {
    const codes = rawSitemapLocViolations(loc).map((f) => f.code);
    assert.ok(codes.includes(code), `expected ${code} for ${loc}, got ${codes.join(",")}`);
  }
});

test("raw sitemap loc: URL.pathname normalization cannot mask a traversal loc", () => {
  // new URL("https://.../about/../").pathname === "/" would look valid; the
  // raw-shape validator must reject it before normalization sees it.
  const loc = `${PRODUCTION_ORIGIN}/about/../`;
  assert.equal(new URL(loc).pathname, "/"); // proves the masking risk
  assert.ok(rawSitemapLocViolations(loc).some((f) => f.code === "LOC_DOT_SEGMENT"));
});

// ===========================================================================
// Exact raw child-sitemap location shape
// ===========================================================================

test("raw child loc: exact production sitemap-<n>.xml passes; mutations rejected", () => {
  assert.deepEqual(rawChildLocViolations(`${PRODUCTION_ORIGIN}/sitemap-0.xml`), []);
  assert.equal(childSitemapBasename(`${PRODUCTION_ORIGIN}/sitemap-0.xml`), "sitemap-0.xml");

  const cases = [
    [`${PRODUCTION_ORIGIN}/sitemap-0.xml?x=1`, "CHILD_QUERY"],
    [`${PRODUCTION_ORIGIN}/sitemap-0.xml#a`, "CHILD_FRAGMENT"],
    ["https://user@metawritingecology.org/sitemap-0.xml", "CHILD_USERINFO"],
    ["https://metawritingecology.org:443/sitemap-0.xml", "CHILD_PORT"],
    [`${PRODUCTION_ORIGIN}/%2e%2e/sitemap-0.xml`, "CHILD_ENCODED_DOT"],
    [`${PRODUCTION_ORIGIN}/nested/evil.xml`, "CHILD_FILENAME_SHAPE"],
    ["https://example.com/sitemap-0.xml", "CHILD_ORIGIN"]
  ];
  for (const [loc, code] of cases) {
    const codes = rawChildLocViolations(loc).map((f) => f.code);
    assert.ok(codes.includes(code), `expected ${code} for ${loc}, got ${codes.join(",")}`);
    assert.equal(childSitemapBasename(loc), null);
  }
});

// ===========================================================================
// Route-source resolution: traversal-safe + ambiguity-fatal
// ===========================================================================

test("route-source: resolves the real page-source forms", () => {
  const cases = [
    ["/", "index.astro"],
    ["/about/", "about.md"],
    ["/fiction/", "fiction.mdx"],
    ["/zh/", "zh/index.md"],
    ["/fiction/the-available-edition/", "fiction/the-available-edition.md"],
    ["/zh/boundary/", "zh/boundary.md"]
  ];
  for (const [route, suffix] of cases) {
    const source = resolveRouteSource(route);
    assert.ok(source, `expected a source for ${route}`);
    assert.ok(source.replace(/\\/g, "/").endsWith(`src/pages/${suffix}`), `${route} -> ${source}`);
  }
});

test("route-source: unknown route and non-HTML endpoint resolve to null", () => {
  assert.equal(resolveRouteSource("/does-not-exist/"), null);
  assert.equal(resolveRouteSource("/public-surface-map/data/manifest.json"), null);
});

test("route-source mutation: unsafe input fails closed with a stable code", () => {
  const cases = [
    ["/../pages/index/", "ROUTE_UNSAFE_TRAVERSAL"],
    ["/./about/", "ROUTE_UNSAFE_TRAVERSAL"],
    ["/about/%2e%2e/", "ROUTE_UNSAFE_ENCODED_DOT"],
    ["/about/%2fhidden/", "ROUTE_UNSAFE_ENCODED_SEPARATOR"],
    ["/about/%5chidden/", "ROUTE_UNSAFE_ENCODED_SEPARATOR"],
    ["/about\\hidden/", "ROUTE_UNSAFE_BACKSLASH"],
    ["/about/?x=1", "ROUTE_UNSAFE_QUERY_FRAGMENT"],
    ["/about/#h", "ROUTE_UNSAFE_QUERY_FRAGMENT"],
    ["about/", "ROUTE_INPUT_NOT_ROOT_RELATIVE"],
    ["/a\u0000b/", "ROUTE_INPUT_NUL"]
  ];
  for (const [route, code] of cases) {
    assert.throws(
      () => resolveRouteSource(route),
      (err) => err instanceof RouteResolutionError && err.code === code,
      `expected ${code} for ${route}`
    );
    // assertSafeRoutePath is the same gate and throws the same code.
    assert.throws(() => assertSafeRoutePath(route), (err) => err.code === code);
  }
});

test("route-source mutation: a candidate escaping pagesDir fails closed", () => {
  // A synthetic pagesDir whose existsFn claims a parent-escaping candidate is
  // impossible to reach because traversal input is rejected first; assert the
  // traversal guard rejects the attempt.
  assert.throws(
    () => resolveRouteSource("/../../etc/passwd/"),
    (err) => err instanceof RouteResolutionError && err.code === "ROUTE_UNSAFE_TRAVERSAL"
  );
});

test("route-source mutation: two simultaneous matching source forms are fatal", () => {
  // existsFn claims BOTH `/dup.astro` and `/dup/index.astro` exist.
  const pagesDir = pathToFileURL(join(mkTemp(), "pages") + "/");
  const existsFn = (url) => {
    const p = posix(fileURLToPath(url));
    return p.endsWith("/dup.astro") || p.endsWith("/dup/index.astro");
  };
  assert.throws(
    () => resolveRouteSource("/dup/", { pagesDir, existsFn }),
    (err) => err instanceof RouteResolutionError && err.code === "ROUTE_AMBIGUOUS_SOURCE"
  );
});

test("route-source: exactly one existing candidate resolves via injected existsFn", () => {
  const pagesDir = pathToFileURL(join(mkTemp(), "pages") + "/");
  const existsFn = (url) => posix(fileURLToPath(url)).endsWith("/solo.md");
  const source = resolveRouteSource("/solo/", { pagesDir, existsFn });
  assert.ok(source && posix(source).endsWith("/solo.md"));
});

// ===========================================================================
// Direct-source Git lastmod (isolated temporary repositories only)
// ===========================================================================

function makeRepo() {
  const dir = mkTemp();
  const git = (args, extraEnv = {}) =>
    execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", env: { ...process.env, ...extraEnv } });
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "Test"]);
  git(["config", "commit.gpgsign", "false"]);
  return { dir, git };
}
function writeAndCommit(git, dir, rel, contents, isoDate) {
  const abs = join(dir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  git(["add", rel]);
  git(["commit", "-q", "-m", `edit ${rel}`], { GIT_COMMITTER_DATE: isoDate, GIT_AUTHOR_DATE: isoDate });
  return abs;
}
const runGitIn = (dir) => (args) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

test("lastmod: latest commit affecting the direct source determines the time", () => {
  const { dir, git } = makeRepo();
  const t1 = "2026-01-02T03:04:05+00:00";
  const abs = writeAndCommit(git, dir, "page.md", "# one\n", t1);
  assert.equal(new Date(readDirectSourceLastmod(abs, { runGit: runGitIn(dir) })).getTime(), new Date(t1).getTime());
});

test("lastmod: unrelated and shared-layout commits do not alter the route timestamp", () => {
  const { dir, git } = makeRepo();
  const t1 = "2026-01-02T03:04:05+00:00";
  const abs = writeAndCommit(git, dir, "page.md", "# one\n", t1);
  writeAndCommit(git, dir, "other.md", "# other\n", "2026-05-06T07:08:09+00:00");
  writeAndCommit(git, dir, "layouts/BaseLayout.astro", "<html></html>\n", "2026-06-07T08:09:10+00:00");
  assert.equal(new Date(readDirectSourceLastmod(abs, { runGit: runGitIn(dir) })).getTime(), new Date(t1).getTime());
});

test("lastmod: uncommitted filesystem edits do not replace committed Git time", () => {
  const { dir, git } = makeRepo();
  const t1 = "2026-01-02T03:04:05+00:00";
  const abs = writeAndCommit(git, dir, "page.md", "# one\n", t1);
  writeFileSync(abs, "# edited later\n");
  assert.equal(new Date(readDirectSourceLastmod(abs, { runGit: runGitIn(dir) })).getTime(), new Date(t1).getTime());
});

test("lastmod: missing Git returns undefined (no mtime fallback)", () => {
  const failing = () => {
    throw new Error("git: command not found");
  };
  const anExistingFile = fileURLToPath(new URL("about.md", DEFAULT_PAGES_DIR));
  assert.equal(readDirectSourceLastmod(anExistingFile, { runGit: failing }), undefined);
});

test("lastmod: untracked source returns undefined and never uses mtime", () => {
  const { dir, git } = makeRepo();
  writeAndCommit(git, dir, "tracked.md", "# tracked\n", "2026-01-02T03:04:05+00:00");
  const untracked = join(dir, "untracked.md");
  writeFileSync(untracked, "# untracked\n"); // has a real, recent mtime
  // Fails closed against any reintroduced mtime fallback.
  assert.equal(readDirectSourceLastmod(untracked, { runGit: runGitIn(dir) }), undefined);
});

test("lastmod: unreachable history (empty repo) returns undefined", () => {
  const { dir } = makeRepo();
  const abs = join(dir, "page.md");
  writeFileSync(abs, "# one\n");
  assert.equal(readDirectSourceLastmod(abs, { runGit: runGitIn(dir) }), undefined);
});

test("lastmod: null source returns undefined; present output is ISO 8601", () => {
  assert.equal(readDirectSourceLastmod(null), undefined);
  const { dir, git } = makeRepo();
  const abs = writeAndCommit(git, dir, "page.md", "# one\n", "2026-03-04T05:06:07+00:00");
  const result = readDirectSourceLastmod(abs, { runGit: runGitIn(dir) });
  assert.match(result, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
});

// ===========================================================================
// RSS / Atom decision + feed content/MIME signatures
// ===========================================================================

test("RSS decision: @astrojs/rss absent from package.json and lockfile", () => {
  const pkg = JSON.parse(rd("package.json"));
  assert.ok(!("@astrojs/rss" in (pkg.dependencies ?? {})));
  assert.ok(!("@astrojs/rss" in (pkg.devDependencies ?? {})));
  assert.ok(!/@astrojs\/rss/.test(rd("pnpm-lock.yaml")));
});

test("RSS decision: no feed source signatures in astro.config or src", () => {
  const walk = (relDir) => {
    const dirUrl = new URL(`${relDir}/`, repoRoot);
    let entries;
    try {
      entries = readdirSync(dirUrl, { withFileTypes: true });
    } catch {
      return [];
    }
    const out = [];
    for (const e of entries) {
      const child = `${relDir}/${e.name}`;
      if (e.isDirectory()) out.push(...walk(child));
      else out.push(child);
    }
    return out;
  };
  const files = ["astro.config.mjs", ...walk("src")];
  for (const f of files) {
    if (!/\.(astro|md|mdx|ts|js|mjs)$/.test(f)) continue;
    const feeds = findFeedSignatures(rd(f));
    assert.deepEqual(feeds, [], `unexpected feed signature in ${f}: ${feeds.map((x) => x.code).join(",")}`);
  }
});

test("feed signatures: RSS/Atom documents detected regardless of filename; ordinary XML is not", () => {
  assert.ok(findFeedSignatures('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>').some((f) => f.code === "FEED_RSS_ROOT"));
  assert.ok(findFeedSignatures('<feed xmlns="http://www.w3.org/2005/Atom"></feed>').some((f) => f.code === "FEED_ATOM_NAMESPACE"));
  assert.ok(findFeedSignatures('<link rel="alternate" type="application/rss+xml" href="/x">').some((f) => f.code === "FEED_DISCOVERY_LINK"));
  assert.ok(findFeedSignatures('import rss from "@astrojs/rss";').some((f) => f.code === "FEED_RSS_IMPORT"));
  // Ordinary sitemap XML carries no feed signature.
  assert.deepEqual(findFeedSignatures('<?xml version="1.0"?><urlset><url><loc>https://x/</loc></url></urlset>'), []);
});

// ===========================================================================
// robots.txt + llms.txt
// ===========================================================================

test("robots.txt: sitemap pointer uses the production origin only; no crawler-training policy", () => {
  const robots = rd("public/robots.txt");
  const sitemapLine = robots.split("\n").map((l) => l.trim()).find((l) => /^sitemap:/i.test(l));
  assert.equal(sitemapLine, `Sitemap: ${PRODUCTION_ORIGIN}/sitemap-index.xml`);
  assert.deepEqual(findForbiddenOriginUrls(robots), []);
  assert.ok(!/GPTBot|CCBot|Google-Extended|anthropic/i.test(robots));
});

test("llms.txt: internal production URLs use the approved origin and exist; no forbidden origin", () => {
  const llms = rd("public/llms.txt");
  const urls = llms.match(/https?:\/\/[^\s)]+/g) ?? [];
  const internal = urls.filter((u) => u.startsWith(`${PRODUCTION_ORIGIN}/`));
  assert.ok(internal.length > 0);
  for (const u of internal) {
    const route = normalizeRoutePath(new URL(u).pathname);
    assert.ok(resolveRouteSource(route) !== null, `llms.txt references a non-existent route: ${route}`);
  }
  assert.deepEqual(findForbiddenOriginUrls(llms), []);
});

// ===========================================================================
// Functional URL inventory (extraction + validation) across real source
// ===========================================================================

function knownRouteSet() {
  const routes = new Set();
  const pagesDirPath = fileURLToPath(DEFAULT_PAGES_DIR);
  const walk = (absDir, prefix) => {
    for (const e of readdirSync(absDir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        walk(join(absDir, e.name), `${prefix}${e.name}/`);
        continue;
      }
      const m = e.name.match(/^(.*)\.(astro|md|mdx)$/);
      if (!m) continue;
      const route = m[1] === "index" ? (prefix === "" ? "/" : `/${prefix}`) : `/${prefix}${m[1]}/`;
      routes.add(normalizeRoutePath(route));
    }
  };
  walk(pagesDirPath, "");
  return routes;
}

const repoRootPath = fileURLToPath(repoRoot);
function inventoryFiles() {
  const files = [];
  const walk = (absDir) => {
    for (const e of readdirSync(absDir, { withFileTypes: true })) {
      const abs = join(absDir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (/\.(astro|md|mdx|ts|js|json|txt)$/.test(e.name)) files.push(abs);
    }
  };
  for (const rel of ["src/pages", "src/layouts", "src/components", "src/data"]) {
    walk(fileURLToPath(new URL(rel, repoRoot)));
  }
  for (const rel of ["public/llms.txt", "public/robots.txt"]) {
    const p = fileURLToPath(new URL(rel, repoRoot));
    if (existsSync(p)) files.push(p);
  }
  return files;
}

// Collect functional-URL OCCURRENCES across the real inventory, each tagged with
// its repo-relative file. Occurrences are NOT deduplicated to unique values.
function inventoryOccurrences() {
  const occ = [];
  for (const abs of inventoryFiles()) {
    const rel = posix(abs.slice(repoRootPath.length).replace(/^\/+/, ""));
    for (const o of extractFunctionalUrls(readFileSync(abs, "utf8"))) occ.push({ ...o, file: rel });
  }
  return occ;
}

const GENERATED_DISCOVERY_ASSETS = new Set(["/robots.txt", "/llms.txt", "/sitemap-index.xml", "/sitemap-0.xml"]);
const assetExists = (routePath) =>
  GENERATED_DISCOVERY_ASSETS.has(routePath) || has(`public${routePath}`);

test("functional inventory: internal routes/assets, forbidden origins, and GitHub context validated end-to-end", () => {
  const known = knownRouteSet();
  // Pass OCCURRENCES (with file/kind/identifier), not unique value strings, so
  // context-sensitive validation (bare-base-only-as-declaration) applies.
  const findings = validateInventory(inventoryOccurrences(), { knownRoutes: known, assetExists });
  assert.deepEqual(
    findings.map((f) => `${f.file ?? "?"}: ${f.code} ${f.message}`),
    [],
    findings.map((f) => `${f.file ?? "?"}: ${f.code} ${f.message}`).join("\n")
  );
});

test("functional inventory mutation: forbidden origins rejected end-to-end via validateInventory", () => {
  const known = knownRouteSet();
  const run = (snippet) =>
    validateInventory(extractFunctionalUrls(snippet).map((x) => x.value), {
      knownRoutes: known,
      assetExists
    }).map((f) => f.code);

  // Markdown link to a workers.dev origin.
  assert.ok(run("[panel](https://mwe.workers.dev/panel/)").includes("FORBIDDEN_ORIGIN"));
  // Route-map tuple whose value is a workers.dev URL (extracted as an autolink).
  assert.ok(run('const map = [["https://mwe.workers.dev/x/", "X"]];').includes("FORBIDDEN_ORIGIN"));
  // Literal href to localhost.
  assert.ok(run('<a href="http://localhost:3000/x">x</a>').includes("FORBIDDEN_ORIGIN"));
  // Ordinary explanatory prose mentioning workers.dev WITHOUT a functional URL:
  // it is never extracted, so it is never flagged.
  const prose = "We never deploy to mwe.workers.dev in production; the site is metawritingecology.org.";
  assert.equal(extractFunctionalUrls(prose).some((x) => /workers\.dev/.test(x.value)), false);
  assert.deepEqual(run(prose), []);
});

test("functional inventory: extraction covers markdown, href, src, absolute URL, object route, tuple", () => {
  const sample = [
    "[docs](/about/)",
    "![img](/img/a.png)",
    '<a href="/models/">Models</a>',
    '<img src="/logo.svg" />',
    "See https://metawritingecology.org/publications/ for more.",
    'const nav = { route: "/surfaces/", label: "Entry" };',
    'const map = [["/atlas/", "Atlas"], ["/fiction/", "Fiction"]];'
  ].join("\n");
  const found = extractFunctionalUrls(sample);
  const byKind = (k) => found.filter((f) => f.kind === k).map((f) => f.value);
  assert.ok(byKind("markdown").includes("/about/"));
  assert.ok(byKind("markdown").includes("/img/a.png"));
  assert.ok(byKind("attr").includes("/models/"));
  assert.ok(byKind("attr").includes("/logo.svg"));
  assert.ok(byKind("autolink").includes("https://metawritingecology.org/publications/"));
  assert.ok(byKind("property").includes("/surfaces/"));
  assert.ok(byKind("route-map").includes("/atlas/"));
  assert.ok(byKind("route-map").includes("/fiction/"));
  // Every result carries a line number.
  assert.ok(found.every((f) => Number.isInteger(f.line) && f.line >= 1));
});

test("functional inventory mutation: route-map missing route, missing asset, broken absolute link, forbidden origin", () => {
  const known = knownRouteSet();
  // route-map tuple pointing at a non-existent route
  const rm = extractFunctionalUrls('const map = [["/ghost-route/", "Ghost"]];').map((x) => x.value);
  assert.equal(validateInternalLinks(rm, known)[0]?.code, "INTERNAL_ROUTE_MISSING");
  // missing static asset
  assert.equal(validateInternalLinks(["/missing.png"], new Set(), { assetExists })[0]?.code, "INTERNAL_ASSET_MISSING");
  // broken absolute production link
  assert.equal(
    validateInternalLinks(["https://metawritingecology.org/deleted/"], known)[0]?.code,
    "INTERNAL_ROUTE_MISSING"
  );
  // forbidden preview origin in a navigation/data value
  const vals = extractFunctionalUrls('const nav = { url: "https://mwe.workers.dev/panel/" };').map((x) => x.value);
  assert.ok(vals.some((v) => isForbiddenPublicOrigin(v)));
});

test("functional inventory: fragment validation where stable anchors are available", () => {
  const anchors = markdownHeadingSlugs("# Section One\n\ntext\n\n## Nested Detail\n");
  assert.ok(anchors.has("section-one") && anchors.has("nested-detail"));
  const known = new Set(["/guide/"]);
  const knownFragments = new Map([["/guide/", anchors]]);
  assert.deepEqual(validateInternalLinks(["/guide/#section-one"], known, { knownFragments }), []);
  assert.equal(
    validateInternalLinks(["/guide/#missing"], known, { knownFragments })[0]?.code,
    "INTERNAL_FRAGMENT_MISSING"
  );
});

test("internal links: trailing-slash-less internal links still resolve", () => {
  const known = knownRouteSet();
  assert.deepEqual(validateInternalLinks(["/boundary-preserving-use-conditions"], known), []);
});

// ===========================================================================
// DOI syntax across the complete public inventory
// ===========================================================================

function collectFromInventory(re) {
  const values = new Set();
  for (const file of inventoryFiles()) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(re)) values.add(m[0].replace(/[.,;]+$/, ""));
  }
  return values;
}

test("DOI syntax: all public DOI references across the inventory are structurally valid", () => {
  const dois = collectFromInventory(/\b10\.\d{4,9}\/[^\s)\]"'<>]+/g);
  assert.ok(dois.size > 0, "expected DOI references in public source");
  for (const doi of dois) {
    assert.equal(isValidDoi(doi), true, `expected valid DOI structure: ${doi}`);
  }
});

test("DOI syntax mutation: malformed structure, query, fragment, userinfo, port rejected", () => {
  for (const bad of [
    "10./missing-registrant",
    "11.1234/wrong-prefix",
    "10.12/too-short",
    "notadoi",
    "10.1234/",
    "https://doi.org/10.1234/abc?x=1",
    "https://doi.org/10.1234/abc#frag",
    "https://user@doi.org/10.1234/abc",
    "https://doi.org:8080/10.1234/abc",
    "https://example.com/10.1234/abc"
  ]) {
    assert.equal(isValidDoi(bad), false, `should reject ${bad}`);
  }
  assert.equal(isValidDoi("10.17605/OSF.IO/28HNK"), true);
  assert.equal(isValidDoi("https://doi.org/10.17605/OSF.IO/28HNK"), true);
});

// ===========================================================================
// GitHub URL syntax across the complete public inventory
// ===========================================================================

test("GitHub inventory: separate accounting categories via the production binding", () => {
  // classifyGithubInventory uses the SAME same-file approved-declaration binding
  // as validateInventory, so compositions bind to the real declaration.
  const occ = inventoryOccurrences();
  const cats = classifyGithubInventory(occ);

  // No invalid/unrecognized GitHub occurrence in the real inventory.
  assert.deepEqual(
    cats.invalid.map((o) => `${o.file}:${o.line} [${o.kind}] ${o.value}`),
    []
  );

  // Exactly one base-declaration occurrence, the sourceRepoBase declaration.
  assert.equal(cats.baseDeclaration.length, 1);
  const decl = cats.baseDeclaration[0];
  assert.equal(decl.file, "src/data/diagnosticEntries.ts");
  assert.equal(decl.identifier, "sourceRepoBase");
  assert.equal(decl.value, APPROVED_SOURCE_REPO_BASE);
  assert.ok(isApprovedSourceRepoBaseDeclaration(decl));

  // Bounded template compositions: exactly 15 occurrences, 9 distinct suffixes.
  assert.equal(cats.composition.length, 15);
  const distinctSuffixes = new Set(cats.composition.map((o) => o.suffix));
  assert.equal(distinctSuffixes.size, 9);
  for (const o of cats.composition) assert.equal(o.kind, "github-template-composition");

  // DISTINCT accounting: literal source occurrences vs unique source values vs
  // base declaration vs compositions are all separate categories.
  const uniqueSourceValues = new Set(cats.source.map((o) => o.value));
  assert.ok(cats.source.length >= uniqueSourceValues.size);
  assert.ok(uniqueSourceValues.size >= 1);
  // A composition is not counted as a literal source occurrence.
  assert.equal(cats.source.some((o) => o.kind === "github-template-composition"), false);
  // The base declaration is not counted as a literal source occurrence.
  assert.equal(cats.source.some((o) => o.kind === "github-base-declaration-evidence"), false);
});

test("GitHub syntax: immutable commit SHA accepted; feature branch and malformed rejected", () => {
  const repo = "metawritingecology/meta-writing-ecology";
  const sha = "0123456789abcdef0123456789abcdef01234567";
  // Immutable 40-hex commit SHA in a blob/tree source URL is ACCEPTED.
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/${sha}/README.md`), true);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/tree/${sha}/model-atlas`), true);
  // main and roots remain valid.
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/README.md`), true);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}`), true);
  assert.equal(isValidGithubSourceUrl("https://github.com/metawritingecology"), true);
  // Rejections.
  assert.equal(isValidGithubSourceUrl(`http://github.com/${repo}/blob/main/README.md`), false); // not https
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/feature-x/README.md`), false); // feature branch
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/../secrets`), false); // traversal
  assert.equal(isValidGithubSourceUrl("https://github.com/someone-else/other/blob/main/x.md"), false); // off allowlist
  assert.equal(isValidGithubSourceUrl(`https://user@github.com/${repo}`), false); // userinfo
});

test("GitHub syntax: empty blob path rejected as a source URL", () => {
  const repo = "metawritingecology/meta-writing-ecology";
  const sha = "0123456789abcdef0123456789abcdef01234567";
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/${sha}`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/%2e%2e/x`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/a%2fb`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/README.md?x=1`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/README.md#L1`), false);
  assert.equal(isValidGithubSourceUrl(`https://github.com/${repo}/blob/main/README.md`), true);
});

const BARE_BASE = APPROVED_SOURCE_REPO_BASE; // https://github.com/…/blob/main
const DECL_FILE = "src/data/diagnosticEntries.ts";

// The approved sourceRepoBase declaration EVIDENCE shape (const + approved
// literal). Only this exact shape is approved.
const approvedDecl = (overrides = {}) => ({
  value: BARE_BASE,
  kind: "github-base-declaration-evidence",
  keyword: "const",
  initializerKind: "approved-literal",
  identifier: "sourceRepoBase",
  file: DECL_FILE,
  ...overrides
});

test("GitHub context: the bare base is accepted ONLY as its exact const-literal declaration", () => {
  const decl = approvedDecl();
  assert.ok(isApprovedSourceRepoBaseDeclaration(decl));
  assert.equal(classifyGithubOccurrence(decl), "base-declaration");

  // Wrong file, identifier, value, KEYWORD, initializer kind, or occurrence kind
  // all fail — the declaration keyword and initializer kind are load-bearing.
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ file: "src/data/other.ts" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ identifier: "otherBase" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ value: `${BARE_BASE}/extra` })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ keyword: "let" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ keyword: "var" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ initializerKind: "missing" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ initializerKind: "template" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ initializerKind: "dynamic" })), false);
  assert.equal(isApprovedSourceRepoBaseDeclaration(approvedDecl({ kind: "attr" })), false);
});

test("GitHub context mutation: the bare base FAILS in every destination context", () => {
  // The same bare-base URL, extracted from each destination context, must be
  // classified invalid — never accepted merely because the string matches.
  const contexts = {
    markdown: `[repo](${BARE_BASE})`,
    autolink: `See ${BARE_BASE} for the repo.`,
    href: `<a href="${BARE_BASE}">repo</a>`,
    src: `<img src="${BARE_BASE}" />`,
    "nav-url": `const nav = { url: "${BARE_BASE}" };`,
    "nav-href": `const nav = { href: "${BARE_BASE}" };`,
    "route-map": `const map = [["${BARE_BASE}", "Repo"]];`
  };
  for (const [label, snippet] of Object.entries(contexts)) {
    const occ = extractFunctionalUrls(snippet)
      .filter((o) => o.value === BARE_BASE)
      .map((o) => ({ ...o, file: "src/pages/example.md" }));
    assert.ok(occ.length >= 1, `expected an extracted occurrence for ${label}`);
    for (const o of occ) {
      assert.equal(classifyGithubOccurrence(o), "invalid", `${label} must be invalid`);
    }
  }

  // The declaration used DIRECTLY as a destination (an href, not a declaration)
  // is invalid even in the approved file.
  const asDestination = { value: BARE_BASE, kind: "attr", file: DECL_FILE };
  assert.equal(classifyGithubOccurrence(asDestination), "invalid");
});

test("GitHub context: the real sourceRepoBase declaration and its 15 compositions are extracted and valid", () => {
  const text = rd("src/data/diagnosticEntries.ts");
  const extracted = extractFunctionalUrls(text).map((o) => ({ ...o, file: DECL_FILE }));

  const decls = extracted.filter(
    (o) => o.kind === "github-base-declaration-evidence" && o.value === BARE_BASE
  );
  assert.equal(decls.length, 1, "expected exactly one sourceRepoBase declaration");
  assert.equal(decls[0].identifier, "sourceRepoBase");
  assert.equal(decls[0].keyword, "const");
  assert.equal(decls[0].initializerKind, "approved-literal");
  assert.equal(classifyGithubOccurrence(decls[0]), "base-declaration");

  // The 15 bounded template compositions are now EXTRACTED (not ignored) and
  // validated through the same inventory path (declaration is in this file).
  const comps = extracted.filter((o) => o.kind === "github-template-composition");
  assert.equal(comps.length, 15, "expected 15 template compositions");
  const suffixes = new Set(comps.map((o) => o.suffix));
  assert.equal(suffixes.size, 9, "expected 9 distinct suffixes");
  assert.deepEqual(
    [...suffixes].sort(),
    [
      "/benefit-burden-allocation-regimes.md",
      "/boundary-role-segmentation-model.md",
      "/cost-visibility-redistribution.md",
      "/false-legibility.md",
      "/premature-circulation-diagnostics.md",
      "/premature-circulation-model.md",
      "/reality-consistency.md",
      "/responsibility-alignment-diagnostics.md",
      "/semantic-pressure.md"
    ].sort()
  );
  // Run the real inventory validation over exactly this file's occurrences:
  // the declaration binds the compositions, all 15 resolve, zero findings.
  const findings = validateInventory(extracted, { knownRoutes: new Set(), assetExists: () => true });
  assert.deepEqual(findings.filter((f) => /GITHUB|COMPOSITION/.test(f.code)), []);
});

test("GitHub context: a sourceRepoBase declaration in another file or with another identifier is not accepted", () => {
  assert.equal(classifyGithubOccurrence(approvedDecl({ file: "src/data/other.ts" })), "invalid");
  assert.equal(classifyGithubOccurrence(approvedDecl({ identifier: "repoBase" })), "invalid");
});

// ===========================================================================
// Bounded ${sourceRepoBase} template-composition extraction + validation
// ===========================================================================

// Run the REAL extraction + validateInventory path over a temporary miniature
// source inventory: a declaration file (optional) plus a file containing the
// composition under test. Returns the composition findings' codes/reasons.
function runCompositionInventory(compositionSource, {
  compositionFile = DECL_FILE,
  declaration = { file: DECL_FILE, value: BARE_BASE }
} = {}) {
  const occ = [];
  if (declaration) {
    const declText = `const sourceRepoBase = "${declaration.value}";`;
    for (const o of extractFunctionalUrls(declText)) occ.push({ ...o, file: declaration.file });
  }
  for (const o of extractFunctionalUrls(compositionSource)) occ.push({ ...o, file: compositionFile });
  const findings = validateInventory(occ, { knownRoutes: new Set(), assetExists: () => true });
  return {
    occurrences: occ,
    findings,
    codes: findings.map((f) => f.code),
    reasons: findings.filter((f) => f.code === "GITHUB_INVALID_COMPOSITION").map((f) => f.reason)
  };
}

test("template composition: raw suffix validator rejects unsafe suffixes, accepts a real one", () => {
  assert.equal(validateRepoBaseSuffix("/reality-consistency.md").ok, true);
  assert.equal(validateRepoBaseSuffix("").code, "SUFFIX_EMPTY");
  assert.equal(validateRepoBaseSuffix("/").code, "SUFFIX_SLASH_ONLY");
  assert.equal(validateRepoBaseSuffix("file.md").code, "SUFFIX_NO_LEADING_SLASH");
  assert.equal(validateRepoBaseSuffix("/../secret.md").code, "SUFFIX_TRAVERSAL");
  assert.equal(validateRepoBaseSuffix("/a%2fb.md").code, "SUFFIX_ENCODED_SEPARATOR");
  assert.equal(validateRepoBaseSuffix("/a%5cb.md").code, "SUFFIX_ENCODED_SEPARATOR");
  assert.equal(validateRepoBaseSuffix("/a\\b.md").code, "SUFFIX_BACKSLASH");
  assert.equal(validateRepoBaseSuffix("/file.md?x=1").code, "SUFFIX_QUERY");
  assert.equal(validateRepoBaseSuffix("/file.md#s").code, "SUFFIX_FRAGMENT");
  assert.equal(validateRepoBaseSuffix("/a//b.md").code, "SUFFIX_DUP_SLASH");
  assert.equal(validateRepoBaseSuffix("/a%zz.md").code, "SUFFIX_BAD_PERCENT");
  assert.equal(validateRepoBaseSuffix("/${x}.md").code, "SUFFIX_DYNAMIC");
});

test("template composition mutation: unsafe suffixes fail closed through the real inventory path", () => {
  // Composition in the approved file (bound to the declaration) so the suffix
  // reason is exercised — not masked by a missing-declaration result.
  const cases = [
    ["href: `${sourceRepoBase}`", "SUFFIX_EMPTY"],
    ["href: `${sourceRepoBase}/`", "SUFFIX_SLASH_ONLY"],
    ["href: `${sourceRepoBase}/../secret.md`", "SUFFIX_TRAVERSAL"],
    ["href: `${sourceRepoBase}/%2e%2e/secret.md`", "SUFFIX_ENCODED_SEPARATOR"],
    ["href: `${sourceRepoBase}/a%2fb.md`", "SUFFIX_ENCODED_SEPARATOR"],
    ["href: `${sourceRepoBase}/a%5cb.md`", "SUFFIX_ENCODED_SEPARATOR"],
    ["href: `${sourceRepoBase}/file.md?preview=1`", "SUFFIX_QUERY"],
    ["href: `${sourceRepoBase}/file.md#section`", "SUFFIX_FRAGMENT"],
    ["href: `${sourceRepoBase}/${filename}`", "SUFFIX_DYNAMIC"]
  ];
  for (const [source, reason] of cases) {
    const r = runCompositionInventory(`const x = { ${source} };`);
    assert.ok(r.codes.includes("GITHUB_INVALID_COMPOSITION"), `${source} must be flagged`);
    assert.ok(r.reasons.includes(reason), `${source} expected ${reason}, got ${r.reasons.join(",")}`);
  }
});

test("template composition mutation: valid-looking composition without an approved declaration fails", () => {
  // Missing declaration entirely.
  const missing = runCompositionInventory("const x = { href: `${sourceRepoBase}/valid.md` };", { declaration: null });
  assert.ok(missing.reasons.includes("NO_APPROVED_DECLARATION"));

  // Declaration present but in another (unapproved) file, and the composition in
  // that other file — never binds to the approved declaration.
  const otherFile = runCompositionInventory("const x = { href: `${sourceRepoBase}/valid.md` };", {
    compositionFile: "src/pages/other.md",
    declaration: { file: "src/pages/other.md", value: BARE_BASE }
  });
  assert.ok(otherFile.reasons.includes("NO_APPROVED_DECLARATION"));

  // Declaration present in the approved file but with the WRONG value.
  const wrongValue = runCompositionInventory("const x = { href: `${sourceRepoBase}/valid.md` };", {
    declaration: { file: DECL_FILE, value: `${BARE_BASE}/wrong` }
  });
  assert.ok(wrongValue.reasons.includes("NO_APPROVED_DECLARATION"));
});

test("template composition mutation: conflicting duplicate sourceRepoBase declarations break the binding", () => {
  // Two conflicting sourceRepoBase declarations in the approved file -> ambiguous
  // -> composition does not resolve.
  const occ = [];
  const declText =
    `const sourceRepoBase = "${BARE_BASE}";\nconst sourceRepoBase = "${BARE_BASE}/other";`;
  for (const o of extractFunctionalUrls(declText)) occ.push({ ...o, file: DECL_FILE });
  for (const o of extractFunctionalUrls("const x = { href: `${sourceRepoBase}/valid.md` };"))
    occ.push({ ...o, file: DECL_FILE });
  const findings = validateInventory(occ, { knownRoutes: new Set(), assetExists: () => true });
  assert.ok(
    findings.some((f) => f.code === "GITHUB_INVALID_COMPOSITION" && f.reason === "NO_APPROVED_DECLARATION")
  );
});

test("template composition: valid composition in the approved bounded context is accepted", () => {
  const r = runCompositionInventory("const x = { href: `${sourceRepoBase}/valid-file.md` };");
  assert.deepEqual(r.findings.filter((f) => /GITHUB|COMPOSITION/.test(f.code)), []);
  // And the occurrence is classified as a composition.
  const comp = r.occurrences.find((o) => o.kind === "github-template-composition");
  assert.ok(comp);
  assert.equal(comp.suffix, "/valid-file.md");
  assert.equal(comp.property, "href");
});

test("template composition: src and url destination properties are also recognized", () => {
  for (const prop of ["href", "src", "url"]) {
    const r = runCompositionInventory(`const x = { ${prop}: \`\${sourceRepoBase}/ok.md\` };`);
    const comp = r.occurrences.find((o) => o.kind === "github-template-composition");
    assert.ok(comp, `${prop} should be recognized`);
    assert.equal(comp.property, prop);
    assert.deepEqual(r.findings.filter((f) => /GITHUB|COMPOSITION/.test(f.code)), []);
  }
});

test("template composition: the composition is not double-extracted as another kind", () => {
  const occ = extractFunctionalUrls("const x = { href: `${sourceRepoBase}/ok.md` };");
  // Exactly one occurrence, and it is the composition (not autolink/property/etc.).
  assert.equal(occ.length, 1);
  assert.equal(occ[0].kind, "github-template-composition");
});

// ===========================================================================
// sourceRepoBase declaration uniqueness / ambiguity (occurrence-level)
// ===========================================================================

// Build a mini source inventory from a declaration file's text plus a
// composition, run the REAL extraction + validateInventory path, and report the
// composition finding reasons.
function runDeclarationBinding(declText, {
  declFile = DECL_FILE,
  compositionFile = DECL_FILE,
  composition = "const x = { href: `${sourceRepoBase}/valid.md` };"
} = {}) {
  const occ = [];
  for (const o of extractFunctionalUrls(declText)) occ.push({ ...o, file: declFile });
  for (const o of extractFunctionalUrls(composition)) occ.push({ ...o, file: compositionFile });
  const findings = validateInventory(occ, { knownRoutes: new Set(), assetExists: () => true });
  const compFindings = findings.filter((f) => f.code === "GITHUB_INVALID_COMPOSITION");
  return { occ, bound: compFindings.length === 0, reasons: compFindings.map((f) => f.reason) };
}

test("declaration binding: exactly one approved literal declaration binds compositions", () => {
  const r = runDeclarationBinding(`const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";`);
  assert.equal(r.bound, true, `expected binding, reasons: ${r.reasons.join(",")}`);
});

test("declaration binding: TWO IDENTICAL approved declarations are ambiguous and fail closed", () => {
  // The exact duplicate case from the correction brief.
  const declText =
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";\n` +
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";`;
  const r = runDeclarationBinding(declText);
  assert.equal(r.bound, false);
  assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
  // Two literal declaration occurrences are recorded (not collapsed by a Set).
  const decls = r.occ.filter(
    (o) => o.kind === "github-base-declaration-evidence" && o.identifier === "sourceRepoBase"
  );
  assert.equal(decls.length, 2);
});

test("declaration binding: approved + conflicting/different literal declaration fails closed", () => {
  const declText =
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";\n` +
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}/other";`;
  const r = runDeclarationBinding(declText);
  assert.equal(r.bound, false);
  assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
});

test("declaration binding: approved + dynamic / template initializer fails closed", () => {
  const dynamic = runDeclarationBinding(
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";\nconst sourceRepoBase = computeBase();`
  );
  assert.equal(dynamic.bound, false);
  assert.ok(dynamic.reasons.includes("NO_APPROVED_DECLARATION"));
  // The dynamic redeclaration is recorded as ambiguous declaration evidence.
  assert.ok(dynamic.occ.some((o) => o.kind === "github-base-declaration-evidence" && o.initializerKind === "dynamic"));

  const template = runDeclarationBinding(
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";\nconst sourceRepoBase = \`${APPROVED_SOURCE_REPO_BASE}\`;`
  );
  assert.equal(template.bound, false);
  assert.ok(template.reasons.includes("NO_APPROVED_DECLARATION"));
  assert.ok(template.occ.some((o) => o.kind === "github-base-declaration-evidence" && o.initializerKind === "template"));
});

test("declaration binding: approved const + let/var redeclaration fails closed", () => {
  const withLet = runDeclarationBinding(
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";\nlet sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";`
  );
  assert.equal(withLet.bound, false);
  assert.ok(withLet.reasons.includes("NO_APPROVED_DECLARATION"));

  const withVar = runDeclarationBinding(
    `const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";\nvar sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";`
  );
  assert.equal(withVar.bound, false);
  assert.ok(withVar.reasons.includes("NO_APPROVED_DECLARATION"));
});

test("declaration binding: only a dynamic declaration (no approved literal) fails closed", () => {
  const r = runDeclarationBinding("const sourceRepoBase = computeBase();");
  assert.equal(r.bound, false);
  assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
});

test("declaration binding: zero declarations -> no binding", () => {
  const r = runDeclarationBinding(""); // no declaration at all
  assert.equal(r.bound, false);
  assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
});

test("declaration binding: real diagnosticEntries.ts has exactly one approved declaration and 15 valid compositions", () => {
  const text = rd("src/data/diagnosticEntries.ts");
  const occ = extractFunctionalUrls(text).map((o) => ({ ...o, file: DECL_FILE }));
  const cats = classifyGithubInventory(occ);
  // Occurrence-level declaration accounting.
  assert.equal(cats.declarationOccurrences.length, 1, "exactly one sourceRepoBase declaration occurrence");
  assert.equal(cats.ambiguousDeclarationEvidence.length, 0, "no ambiguous declaration evidence");
  assert.deepEqual(cats.approvedBaseFiles, [DECL_FILE]);
  // Compositions all bind and validate.
  assert.equal(cats.composition.length, 15);
  assert.equal(new Set(cats.composition.map((o) => o.suffix)).size, 9);
  assert.equal(cats.invalid.length, 0);
  const findings = validateInventory(occ, { knownRoutes: new Set(), assetExists: () => true });
  assert.deepEqual(findings.filter((f) => /GITHUB|COMPOSITION/.test(f.code)), []);
});

// ===========================================================================
// Occurrence identity by SOURCE OFFSET (same-line distinct occurrences)
// ===========================================================================

test("occurrence identity: two identical approved declarations on the SAME LINE are two occurrences and fail closed", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  const declText = `const sourceRepoBase = "${A}"; const sourceRepoBase = "${A}";`;
  // Two records (not collapsed by a line/value key).
  const decls = extractFunctionalUrls(declText).filter(
    (o) => o.kind === "github-base-declaration-evidence" && o.identifier === "sourceRepoBase"
  );
  assert.equal(decls.length, 2);
  assert.notEqual(decls[0].offset, decls[1].offset);

  // Full production path: extraction -> declaration evidence ->
  // approvedBaseDeclarationFiles -> validateInventory -> NO_APPROVED_DECLARATION.
  const r = runDeclarationBinding(declText);
  assert.equal(r.bound, false);
  assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
  const recorded = r.occ.filter((o) => o.kind === "github-base-declaration-evidence" && o.identifier === "sourceRepoBase");
  assert.equal(recorded.length, 2);
});

test("occurrence identity: same-line approved literal + dynamic/template redeclaration fail closed", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  const dyn = runDeclarationBinding(`const sourceRepoBase = "${A}"; const sourceRepoBase = pick();`);
  assert.equal(dyn.bound, false);
  assert.ok(dyn.reasons.includes("NO_APPROVED_DECLARATION"));
  assert.ok(dyn.occ.some((o) => o.kind === "github-base-declaration-evidence" && o.initializerKind === "dynamic"));

  const tpl = runDeclarationBinding(
    `const sourceRepoBase = "${A}"; const sourceRepoBase = \`${A}\`;`
  );
  assert.equal(tpl.bound, false);
  assert.ok(tpl.reasons.includes("NO_APPROVED_DECLARATION"));
  assert.ok(tpl.occ.some((o) => o.kind === "github-base-declaration-evidence" && o.initializerKind === "template"));
});

test("occurrence identity: two identical declarations on SEPARATE lines are two occurrences and fail closed", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  const r = runDeclarationBinding(`const sourceRepoBase = "${A}";\nconst sourceRepoBase = "${A}";`);
  assert.equal(r.bound, false);
  assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
  assert.equal(
    r.occ.filter((o) => o.kind === "github-base-declaration-evidence" && o.identifier === "sourceRepoBase").length,
    2
  );
});

test("occurrence identity: exactly one approved declaration still binds", () => {
  const r = runDeclarationBinding(`const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";`);
  assert.equal(r.bound, true, `expected binding, reasons: ${r.reasons.join(",")}`);
});

test("occurrence identity: two genuinely separate same-line compositions remain two occurrence records", () => {
  const occ = extractFunctionalUrls(
    "const a = { href: `${sourceRepoBase}/x.md` }; const b = { href: `${sourceRepoBase}/x.md` };"
  );
  const comps = occ.filter((o) => o.kind === "github-template-composition");
  assert.equal(comps.length, 2);
  assert.notEqual(comps[0].offset, comps[1].offset);
  // A single composition is still exactly one record (no double extraction).
  const one = extractFunctionalUrls("const x = { href: `${sourceRepoBase}/ok.md` };").filter(
    (o) => o.kind === "github-template-composition"
  );
  assert.equal(one.length, 1);
});

// ===========================================================================
// Declaration keyword + uninitialized-declaration binding rule
// ===========================================================================

test("declaration keyword: only const binds; let/var literals never bind", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  // 1. lone approved-value let literal.
  assert.equal(runDeclarationBinding(`let sourceRepoBase = "${A}";`).bound, false);
  // 2. lone approved-value var literal.
  assert.equal(runDeclarationBinding(`var sourceRepoBase = "${A}";`).bound, false);
  // Each is recorded as one declaration occurrence with its keyword.
  const letOcc = extractFunctionalUrls(`let sourceRepoBase = "${A}";`).find(
    (o) => o.kind === "github-base-declaration-evidence"
  );
  assert.equal(letOcc.keyword, "let");
  assert.equal(letOcc.initializerKind, "approved-literal");
});

test("declaration keyword: the exact single approved const literal binds", () => {
  const r = runDeclarationBinding(`const sourceRepoBase = "${APPROVED_SOURCE_REPO_BASE}";`);
  assert.equal(r.bound, true, `reasons: ${r.reasons.join(",")}`);
});

test("uninitialized declaration: recorded as evidence (missing) and prevents binding", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  // A lone uninitialized declaration is recorded with initializerKind "missing".
  for (const kw of ["const", "let", "var"]) {
    const occ = extractFunctionalUrls(`${kw} sourceRepoBase;`).find(
      (o) => o.kind === "github-base-declaration-evidence"
    );
    assert.ok(occ, `${kw} uninitialized should be recorded`);
    assert.equal(occ.keyword, kw);
    assert.equal(occ.initializerKind, "missing");
  }
  // 3-5. approved const + uninitialized let/var/const all fail closed.
  for (const kw of ["let", "var", "const"]) {
    const r = runDeclarationBinding(`const sourceRepoBase = "${A}";\n${kw} sourceRepoBase;`);
    assert.equal(r.bound, false, `const + uninitialized ${kw} must not bind`);
    assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
    assert.equal(
      r.occ.filter((o) => o.kind === "github-base-declaration-evidence").length,
      2
    );
  }
});

test("declaration keyword: approved const + dynamic/template let/var fails closed", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  // 6-7. approved const + dynamic let / var.
  assert.equal(runDeclarationBinding(`const sourceRepoBase = "${A}";\nlet sourceRepoBase = pick();`).bound, false);
  assert.equal(runDeclarationBinding(`const sourceRepoBase = "${A}";\nvar sourceRepoBase = fetchBase();`).bound, false);
  // 8. approved const + template let/var.
  assert.equal(runDeclarationBinding(`const sourceRepoBase = "${A}";\nlet sourceRepoBase = \`${A}\`;`).bound, false);
  assert.equal(runDeclarationBinding(`const sourceRepoBase = "${A}";\nvar sourceRepoBase = \`${A}\`;`).bound, false);
});

test("declaration keyword: same-line approved const + uninitialized let/var fails closed with two occurrences", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  // 10-11. same-line approved const + uninitialized let / var.
  for (const kw of ["let", "var"]) {
    const r = runDeclarationBinding(`const sourceRepoBase = "${A}"; ${kw} sourceRepoBase;`);
    assert.equal(r.bound, false);
    assert.ok(r.reasons.includes("NO_APPROVED_DECLARATION"));
    const decls = r.occ.filter((o) => o.kind === "github-base-declaration-evidence");
    assert.equal(decls.length, 2);
    assert.notEqual(decls[0].offset, decls[1].offset);
    assert.ok(decls.some((d) => d.initializerKind === "missing" && d.keyword === kw));
  }
});

test("declaration keyword: required brief mutations", () => {
  const A = APPROVED_SOURCE_REPO_BASE;
  // `let sourceRepoBase = "<approved>"; const x = { href: `${sourceRepoBase}/valid.md` };`
  const letCase = runDeclarationBinding(`let sourceRepoBase = "${A}";`);
  assert.equal(letCase.bound, false);
  assert.ok(letCase.reasons.includes("NO_APPROVED_DECLARATION"));

  // `const sourceRepoBase = "<approved>"; let sourceRepoBase; const x = {...};`
  const constPlusUninit = runDeclarationBinding(`const sourceRepoBase = "${A}";\nlet sourceRepoBase;`);
  assert.equal(constPlusUninit.bound, false);
  assert.ok(constPlusUninit.reasons.includes("NO_APPROVED_DECLARATION"));
  assert.equal(
    constPlusUninit.occ.filter((o) => o.kind === "github-base-declaration-evidence").length,
    2
  );
});

test("declaration accounting: real diagnosticEntries.ts keyword/initializer categories", () => {
  const occ = extractFunctionalUrls(rd("src/data/diagnosticEntries.ts")).map((o) => ({ ...o, file: DECL_FILE }));
  const cats = classifyGithubInventory(occ);
  assert.equal(cats.declarationOccurrences.length, 1);
  assert.equal(cats.approvedConstLiteral.length, 1);
  assert.equal(cats.mutableLiteral.length, 0);
  assert.equal(cats.uninitialized.length, 0);
  assert.equal(cats.dynamicTemplateUnsupported.length, 0);
  assert.equal(cats.ambiguousDeclarationEvidence.length, 0);
  assert.deepEqual(cats.approvedBaseFiles, [DECL_FILE]);
  assert.equal(cats.composition.length, 15);
  assert.equal(new Set(cats.composition.map((o) => o.suffix)).size, 9);
  assert.equal(cats.invalid.length, 0);
});

// ===========================================================================
// Forbidden origins in text (context-aware)
// ===========================================================================

test("forbidden origins: functional URLs flagged, prose platform names are not", () => {
  assert.deepEqual(
    findForbiddenOriginUrls("Deployed at https://mwe.workers.dev/ and http://localhost:4321/x"),
    ["https://mwe.workers.dev/", "http://localhost:4321/x"]
  );
  assert.deepEqual(
    findForbiddenOriginUrls("Runs on Cloudflare Workers but links to https://metawritingecology.org/."),
    []
  );
});

// ===========================================================================
// Canonical parity contract at the source level (SSR routes are not in dist)
// ===========================================================================

test("canonical parity: every sitemap-eligible page renders through BaseLayout", () => {
  const known = knownRouteSet();
  for (const route of known) {
    if (!isSitemapEligible(route)) continue;
    const source = resolveRouteSource(route);
    assert.ok(source, `no source for ${route}`);
    const text = readFileSync(source, "utf8");
    const usesBaseLayout = /layout:\s*[^\n]*BaseLayout\.astro/.test(text) || /import\s+BaseLayout\s+from/.test(text);
    assert.ok(usesBaseLayout, `sitemap route ${route} must render through BaseLayout for its self-canonical`);
  }
});

test("prototype and interactive preview contracts (unchanged, excluded)", () => {
  const proto = rd("src/pages/language-pressure-test-lab-prototype.astro");
  assert.ok(!/BaseLayout/.test(proto) && !/rel="canonical"/.test(proto));
  assert.ok(/name="robots"\s+content="noindex, ?nofollow"/i.test(proto));
  assert.ok(SITEMAP_EXCLUDED_PATHS.has("/language-pressure-test-lab-prototype/"));

  const interactive = rd("src/pages/public-surface-map/interactive.astro");
  assert.ok(/robots="noindex, ?nofollow"/i.test(interactive));
  assert.ok(/import BaseLayout from/.test(interactive));
  assert.ok(SITEMAP_EXCLUDED_PATHS.has("/public-surface-map/interactive/"));
});

// ===========================================================================
// Windows-safe generated dist path handling
// ===========================================================================

test("distRelativeRoute: POSIX and Windows separators derive identical routes", () => {
  assert.equal(distRelativeRoute("/home/x/dist", "/home/x/dist/public-surface-map/interactive/index.html"), "/public-surface-map/interactive/");
  assert.equal(distRelativeRoute("C:\\build\\dist", "C:\\build\\dist\\public-surface-map\\interactive\\index.html"), "/public-surface-map/interactive/");
  assert.equal(distRelativeRoute("C:\\build\\dist", "C:\\build\\dist\\about\\index.html"), "/about/");
  // Prototype and interactive generated-route checks derive the same route on
  // both path forms, so neither is silently skipped on Windows.
  assert.equal(distRelativeRoute("C:\\d", "C:\\d\\language-pressure-test-lab-prototype\\index.html"), "/language-pressure-test-lab-prototype/");
  assert.equal(distRelativeRoute("/d", "/d/index.html"), "/");
});

test("isWithinDir: path-aware containment (POSIX + Windows), sibling-prefix rejected", () => {
  // Valid child beneath dist.
  assert.equal(isWithinDir("/a/dist", "/a/dist/sitemap-0.xml"), true);
  // Sibling directory sharing a string prefix is NOT contained.
  assert.equal(isWithinDir("/a/dist", "/a/dist2/sitemap-0.xml"), false);
  // Traversal target outside dist.
  assert.equal(isWithinDir("/a/dist", "/a/dist/../secret.xml"), false);
  // The directory itself is not a child file.
  assert.equal(isWithinDir("/a/dist", "/a/dist"), false);
  // Windows-shaped containment (only meaningful on win32, but must not crash).
  if (process.platform === "win32") {
    assert.equal(isWithinDir("C:\\a\\dist", "C:\\a\\dist\\sitemap-0.xml"), true);
    assert.equal(isWithinDir("C:\\a\\dist", "C:\\a\\dist2\\sitemap-0.xml"), false);
    assert.equal(isWithinDir("C:\\a\\dist", "D:\\a\\dist\\sitemap-0.xml"), false);
  }
});

// ===========================================================================
// robots classification (independent expected-set oracle)
// ===========================================================================

test("classifyRobots: literal forms classified; dynamic and conflicting fail closed", () => {
  assert.equal(classifyRobots('<meta name="robots" content="noindex, nofollow">', "x").status, "noindex");
  assert.equal(classifyRobots('<BaseLayout robots="noindex, nofollow">', "x").status, "noindex");
  assert.equal(classifyRobots("---\nrobots: noindex, follow\n---\n# t", "x").status, "noindex");
  assert.equal(classifyRobots("# ordinary page with no robots", "x").status, "indexable");
  assert.equal(classifyRobots("<BaseLayout robots={computed}>", "x").status, "ambiguous");
  assert.equal(
    classifyRobots('<meta name="robots" content="noindex, nofollow"><BaseLayout robots="index, follow">', "x").status,
    "ambiguous"
  );
});

test("classifyRobots: attribute order and intervening attributes do not matter", () => {
  // 1. content-before-name
  assert.equal(classifyRobots('<meta content="noindex, nofollow" name="robots">', "x").status, "noindex");
  // 2. class attribute before name
  assert.equal(classifyRobots('<meta class="x" name="robots" content="noindex, nofollow">', "x").status, "noindex");
  // 3. data attribute between name and content
  assert.equal(classifyRobots('<meta name="robots" data-x="1" content="noindex, nofollow">', "x").status, "noindex");
  // 4. single-quoted literal value
  assert.equal(classifyRobots("<meta name='robots' content='noindex, nofollow'>", "x").status, "noindex");
  // 5. CRLF frontmatter
  assert.equal(classifyRobots("---\r\nlayout: x\r\nrobots: noindex, nofollow\r\n---\r\n# t", "x").status, "noindex");
  // 6. conflicting reordered declarations fail closed
  assert.equal(
    classifyRobots('<meta content="index, follow" name="robots"><meta name="robots" content="noindex">', "x").status,
    "ambiguous"
  );
  // 7. dynamic and malformed robots declarations fail closed
  assert.equal(classifyRobots('<meta name="robots" content={r}>', "x").status, "ambiguous");
  assert.equal(classifyRobots('<meta name="robots">', "x").status, "ambiguous"); // name=robots, no content
  assert.equal(classifyRobots('<meta name={n} content="noindex">', "x").status, "ambiguous"); // dynamic name
  // An unrelated meta tag's content is never treated as robots content.
  assert.equal(classifyRobots('<meta name="description" content="noindex sounds scary">', "x").status, "indexable");
  // Duplicate identical declarations across SEPARATE valid meta tags are not a
  // conflict.
  assert.equal(
    classifyRobots('<meta name="robots" content="noindex, nofollow"><meta content="noindex, nofollow" name="robots">', "x").status,
    "noindex"
  );
});

test("classifyRobots: duplicate name/content WITHIN one meta tag fails closed (never first/last value)", () => {
  const status = (t) => classifyRobots(t, "x").status;
  // 1. duplicate content, contradictory values
  assert.equal(status('<meta name="robots" content="index" content="noindex">'), "ambiguous");
  // 2. duplicate content, identical values
  assert.equal(status('<meta name="robots" content="noindex" content="noindex">'), "ambiguous");
  // 3. duplicate name, first value description
  assert.equal(status('<meta name="description" name="robots" content="noindex">'), "ambiguous");
  // 4. duplicate name, first value robots
  assert.equal(status('<meta name="robots" name="description" content="noindex">'), "ambiguous");
  // 5. duplicate attribute names differing only by case
  assert.equal(status('<meta NAME="robots" name="description" content="noindex">'), "ambiguous");
  assert.equal(status('<meta name="robots" CONTENT="index" content="noindex">'), "ambiguous");
  // The malformed finding code is emitted (not silently indexable).
  assert.equal(
    classifyRobots('<meta name="robots" content="index" content="noindex">', "f").findings[0]?.code,
    "ROBOTS_MALFORMED"
  );
});

test("buildExpectedRouteSet: real repo yields 40 routes, includes /about/, excludes prototype/interactive/404", () => {
  const { expected, findings } = buildExpectedRouteSet({ pagesDir: DEFAULT_PAGES_DIR });
  assert.deepEqual(findings, [], `unexpected robots findings: ${findings.map((f) => f.message).join("; ")}`);
  assert.equal(expected.size, 40);
  assert.ok(expected.has("/about/"));
  assert.ok(expected.has("/"));
  assert.ok(!expected.has("/language-pressure-test-lab-prototype/"));
  assert.ok(!expected.has("/public-surface-map/interactive/"));
  assert.ok(!expected.has(NOT_FOUND_PATH));
});

// ===========================================================================
// The REAL verifier against isolated build fixtures (same implementation)
// ===========================================================================

const SM_NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
const indexXml = (children) =>
  `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}>` +
  children.map((l) => `<sitemap><loc>${l}</loc></sitemap>`).join("") +
  `</sitemapindex>`;
const urlsetXml = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}>` +
  entries.map((e) => `<url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`).join("") +
  `</urlset>`;

// Build an isolated { pages, dist } tree and run the REAL verifier over it.
function runVerifierFixture({ pages, childLocs, pageEntries, robots, extraDist }) {
  const root = mkTemp();
  const pagesDir = join(root, "pages");
  for (const [rel, content] of Object.entries(pages)) {
    const abs = join(pagesDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  const distDir = join(root, "dist");
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, "sitemap-index.xml"), indexXml(childLocs ?? [`${PRODUCTION_ORIGIN}/sitemap-0.xml`]));
  writeFileSync(join(distDir, "sitemap-0.xml"), urlsetXml(pageEntries ?? []));
  writeFileSync(
    join(distDir, "robots.txt"),
    robots ?? `User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_ORIGIN}/sitemap-index.xml\n`
  );
  for (const [rel, content] of Object.entries(extraDist ?? {})) {
    const abs = join(distDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return verifyIndexingDiscoveryBuild({
    repoRoot: pathToFileURL(root + "/"),
    pagesDir: pathToFileURL(pagesDir + "/"),
    distDir: pathToFileURL(distDir + "/")
  });
}

const BASE_PAGES = {
  "index.astro": "---\nimport BaseLayout from '../layouts/BaseLayout.astro';\n---\n<BaseLayout title='Home'></BaseLayout>",
  "about.md": "---\nlayout: ../layouts/BaseLayout.astro\ntitle: About\n---\n# About",
  "secret.astro": '<meta name="robots" content="noindex, nofollow"><h1>secret</h1>',
  "404.astro": '<meta name="robots" content="noindex, follow"><h1>not found</h1>'
};
const GOOD_ENTRIES = [{ loc: `${PRODUCTION_ORIGIN}/` }, { loc: `${PRODUCTION_ORIGIN}/about/` }];
const failCodes = (r) => r.results.filter((x) => !x.ok).map((x) => x.code);

test("verifier fixture: a clean expected/generated match passes", () => {
  const r = runVerifierFixture({ pages: BASE_PAGES, pageEntries: GOOD_ENTRIES });
  assert.equal(r.failed, false, `unexpected failures: ${failCodes(r).join(", ")}`);
});

test("verifier fixture mutation: eligible source missing from the sitemap", () => {
  const r = runVerifierFixture({ pages: BASE_PAGES, pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/` }] });
  assert.ok(failCodes(r).includes("SITEMAP_MISSING_EXPECTED"));
  assert.ok(failCodes(r).includes("SITEMAP_SET_EXACT_MATCH"));
});

test("verifier fixture mutation: noindex source still present in the sitemap", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [...GOOD_ENTRIES, { loc: `${PRODUCTION_ORIGIN}/secret/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_UNEXPECTED_ROUTE"));
});

test("verifier fixture mutation: unexpected route with no page source", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [...GOOD_ENTRIES, { loc: `${PRODUCTION_ORIGIN}/ghost/` }]
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_UNEXPECTED_ROUTE"));
  assert.ok(codes.includes("SITEMAP_ROUTE_EXISTS"));
});

test("verifier fixture mutation: duplicate generated route", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [...GOOD_ENTRIES, { loc: `${PRODUCTION_ORIGIN}/about/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_NO_DUPLICATE_ROUTE"));
});

test("verifier fixture mutation: malformed raw page loc (query) surfaces at build", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/` }, { loc: `${PRODUCTION_ORIGIN}/about/?preview=1` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_LOC_SHAPE"));
});

test("verifier fixture mutation: malformed and duplicate child sitemap locations", () => {
  const bad = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    childLocs: [`${PRODUCTION_ORIGIN}/nested/evil.xml`]
  });
  assert.ok(failCodes(bad).includes("CHILD_LOC_SHAPE"));

  const dup = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    childLocs: [`${PRODUCTION_ORIGIN}/sitemap-0.xml`, `${PRODUCTION_ORIGIN}/sitemap-0.xml`]
  });
  assert.ok(failCodes(dup).includes("CHILD_LOC_UNIQUE"));
});

test("verifier fixture mutation: neutral-name RSS document is rejected by content", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "updates.xml": '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>' }
  });
  assert.ok(failCodes(r).includes("FEED_CONTENT_SIGNATURE"));
});

test("verifier fixture: an ordinary non-feed .xml file is not rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "data.xml": '<?xml version="1.0"?><records><record>1</record></records>' }
  });
  assert.equal(r.failed, false, `unexpected failures: ${failCodes(r).join(", ")}`);
});

test("verifier fixture mutation: dynamic robots page source fails closed", () => {
  const r = runVerifierFixture({
    pages: { ...BASE_PAGES, "dyn.astro": "---\nconst robots = pick();\n---\n<BaseLayout robots={robots}></BaseLayout>" },
    pageEntries: GOOD_ENTRIES
  });
  assert.ok(failCodes(r).includes("ROBOTS_DYNAMIC"));
});

test("verifier fixture: reordered/intervening/CRLF noindex sources stay out of the expected set", () => {
  // Each of these noindex pages uses a harmless attribute order or CRLF
  // frontmatter; none may enter the expected sitemap, so a sitemap that omits
  // them (GOOD_ENTRIES) passes with no missing/unexpected findings.
  const pages = {
    ...BASE_PAGES,
    "reordered.astro": '<meta content="noindex, nofollow" name="robots"><h1>x</h1>',
    "classfirst.astro": '<meta class="x" name="robots" content="noindex, nofollow"><h1>x</h1>',
    "databetween.astro": '<meta name="robots" data-x="1" content="noindex, nofollow"><h1>x</h1>',
    "singlequoted.astro": "<meta name='robots' content='noindex, nofollow'><h1>x</h1>",
    "crlf.md": "---\r\nlayout: ../layouts/BaseLayout.astro\r\nrobots: noindex, nofollow\r\n---\r\n# x"
  };
  const r = runVerifierFixture({ pages, pageEntries: GOOD_ENTRIES });
  assert.equal(r.failed, false, `unexpected failures: ${failCodes(r).join(", ")}`);
});

test("verifier fixture mutation: conflicting reordered robots declarations fail closed", () => {
  const r = runVerifierFixture({
    pages: {
      ...BASE_PAGES,
      "conflict.astro": '<meta content="index, follow" name="robots"><meta name="robots" content="noindex"><h1>x</h1>'
    },
    pageEntries: GOOD_ENTRIES
  });
  assert.ok(failCodes(r).includes("ROBOTS_AMBIGUOUS"));
});

test("verifier fixture mutation: malformed robots meta (no content) fails closed", () => {
  const r = runVerifierFixture({
    pages: { ...BASE_PAGES, "bad.astro": '<meta name="robots"><h1>x</h1>' },
    pageEntries: GOOD_ENTRIES
  });
  assert.ok(failCodes(r).includes("ROBOTS_MALFORMED"));
});

test("verifier fixture mutation: reordered noindex still present in sitemap is rejected", () => {
  // A reordered-attribute noindex source that nevertheless appears in the
  // generated sitemap must be flagged (proves order-independent classification
  // drives the expected/generated comparison).
  const r = runVerifierFixture({
    pages: { ...BASE_PAGES, "reordered.astro": '<meta content="noindex, nofollow" name="robots"><h1>x</h1>' },
    pageEntries: [...GOOD_ENTRIES, { loc: `${PRODUCTION_ORIGIN}/reordered/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_UNEXPECTED_ROUTE"));
});

test("verifier fixture mutation: duplicate robots attributes fail closed through the real verifier", () => {
  // source file -> robots classification -> expected set -> verifier finding.
  const dupPages = {
    dupContentContradictory: '<meta name="robots" content="index" content="noindex"><h1>x</h1>',
    dupContentIdentical: '<meta name="robots" content="noindex" content="noindex"><h1>x</h1>',
    dupNameDescFirst: '<meta name="description" name="robots" content="noindex"><h1>x</h1>',
    dupNameRobotsFirst: '<meta name="robots" name="description" content="noindex"><h1>x</h1>',
    dupNameCase: '<meta NAME="robots" name="description" content="noindex"><h1>x</h1>'
  };
  for (const [id, source] of Object.entries(dupPages)) {
    const r = runVerifierFixture({
      pages: { ...BASE_PAGES, [`${id}.astro`]: source },
      pageEntries: GOOD_ENTRIES
    });
    const codes = failCodes(r);
    assert.ok(
      codes.includes("ROBOTS_MALFORMED") || codes.includes("ROBOTS_AMBIGUOUS"),
      `${id} must fail closed, got: ${codes.join(", ")}`
    );
  }
});

test("verifier fixture mutation: a duplicate-attribute noindex source whose URL is in the sitemap is rejected", () => {
  // The page is malformed (duplicate content) so it cannot be safely classified
  // indexable; if its URL appears in the sitemap the verifier must fail closed
  // rather than silently accept it.
  const r = runVerifierFixture({
    pages: { ...BASE_PAGES, "dup.astro": '<meta name="robots" content="noindex" content="noindex"><h1>x</h1>' },
    pageEntries: [...GOOD_ENTRIES, { loc: `${PRODUCTION_ORIGIN}/dup/` }]
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("ROBOTS_MALFORMED"));
  // It is not silently treated as an ordinary indexable route.
  assert.ok(!(codes.length === 0));
});

// ===========================================================================
// Fragment inventory boundary (§ real repository has zero functional fragments)
// ===========================================================================

test("fragment inventory: real functional fragment count is recorded; validator exercised synthetically only", () => {
  // Scan the real inventory for internal functional fragment references.
  const values = [];
  for (const file of inventoryFiles()) {
    for (const { value } of extractFunctionalUrls(readFileSync(file, "utf8"))) values.push(value);
  }
  const fragments = collectFunctionalFragments(values);

  // The current repository contains no functional internal fragment, so
  // repository-INTEGRATED fragment validation is not exercised; the fragment
  // validator is exercised only against synthetic fixtures (below and above).
  assert.equal(fragments.length, 0, `functional fragments present: ${fragments.map((f) => f.href).join(", ")}`);

  // Future guard: if a deterministically checkable fragment is introduced, it
  // must be validatable against the target route's stable heading anchors.
  const anchors = markdownHeadingSlugs("# Alpha\n\n## Beta Section\n");
  const knownFragments = new Map([["/guide/", anchors]]);
  assert.deepEqual(
    validateInternalLinks(["/guide/#beta-section"], new Set(["/guide/"]), { knownFragments }),
    []
  );
  assert.equal(
    validateInternalLinks(["/guide/#nope"], new Set(["/guide/"]), { knownFragments })[0]?.code,
    "INTERNAL_FRAGMENT_MISSING"
  );
});

// ===========================================================================
// Constants
// ===========================================================================

test("constants: production origin and 404 path are the approved values", () => {
  assert.equal(PRODUCTION_ORIGIN, "https://metawritingecology.org");
  assert.equal(NOT_FOUND_PATH, "/404/");
});
