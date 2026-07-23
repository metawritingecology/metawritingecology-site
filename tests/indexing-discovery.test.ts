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
  writeFileSync,
  symlinkSync,
  chmodSync
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
  normalizeGitObjectId,
  validateCommitterIsoDate,
  isValidSitemapLastmod,
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

// ---------------------------------------------------------------------------
// Shallow-history regression (genuine depth-limited file:// clones)
// ---------------------------------------------------------------------------

// Build a multi-commit origin repo whose newest commit does NOT touch page.md,
// then create REAL shallow clones of it. In a shallow checkout `git log -1 --
// <path>` reports the shallow-boundary (grafted) commit for a path whose true
// last change lies beyond the truncation — so the boundary commit's timestamp
// (here the newest, PR-head-like date) would be wrongly assigned to an unchanged
// page. The corrected helper must OMIT lastmod for any path whose latest
// reachable commit is a shallow-boundary commit, while preserving the timestamp
// of a path whose latest reachable commit is a real (non-boundary) commit and of
// every path in a full-history clone.
const PAGE_TRUE_DATE = "2026-01-02T03:04:05+00:00"; // page.md's real last change (deep)
const TIP_DATE = "2026-06-30T23:59:59+00:00"; // newest commit; boundary in shallow clones

function makeOriginRepo() {
  const originDir = mkTemp();
  const git = (args, extraEnv = {}) =>
    execFileSync("git", ["-C", originDir, ...args], {
      encoding: "utf8",
      env: { ...process.env, ...extraEnv }
    });
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "Test"]);
  git(["config", "commit.gpgsign", "false"]);
  writeAndCommit(git, originDir, "page.md", "# one\n", PAGE_TRUE_DATE);
  writeAndCommit(git, originDir, "other.md", "# other-a\n", "2026-02-02T03:04:05+00:00");
  // Newest commit: touches other.md only, never page.md.
  writeAndCommit(git, originDir, "other.md", "# other-b\n", TIP_DATE);
  return originDir;
}

function cloneRepo(originDir, depthArgs) {
  const cloneDir = mkTemp();
  // A file:// URL (not a local path) uses a real transport, so --depth produces
  // a genuinely shallow checkout rather than a full local hardlink clone.
  execFileSync(
    "git",
    ["clone", "-q", ...depthArgs, pathToFileURL(originDir).href, cloneDir],
    { encoding: "utf8" }
  );
  return cloneDir;
}

test("lastmod (shallow depth-1): boundary commit for an unchanged page is omitted, not stamped", () => {
  const origin = makeOriginRepo();
  const clone = cloneRepo(origin, ["--depth", "1"]);
  const runGit = runGitIn(clone);
  // Sanity: the clone is genuinely shallow and page.md's reported commit is the
  // shallow boundary carrying the newest (PR-head-like) timestamp.
  assert.equal(runGit(["rev-parse", "--is-shallow-repository"]).trim(), "true");
  const reported = runGit(["log", "-1", "--format=%cI", "--", "page.md"]).trim();
  assert.equal(new Date(reported).getTime(), new Date(TIP_DATE).getTime());
  // The corrected helper must OMIT rather than assign the boundary timestamp.
  assert.equal(readDirectSourceLastmod("page.md", { runGit }), undefined);
});

test("lastmod (shallow depth-2): boundary path omitted, non-boundary tip path preserved", () => {
  const origin = makeOriginRepo();
  const clone = cloneRepo(origin, ["--depth", "2"]);
  const runGit = runGitIn(clone);
  assert.equal(runGit(["rev-parse", "--is-shallow-repository"]).trim(), "true");
  // page.md's latest reachable commit is the shallow boundary -> omitted.
  assert.equal(readDirectSourceLastmod("page.md", { runGit }), undefined);
  // other.md's latest reachable commit is the tip (a real, non-boundary commit)
  // -> its timestamp is preserved.
  const kept = readDirectSourceLastmod("other.md", { runGit });
  assert.ok(kept !== undefined);
  assert.equal(new Date(kept).getTime(), new Date(TIP_DATE).getTime());
});

test("lastmod (full clone): non-shallow history keeps the true deep timestamp", () => {
  const origin = makeOriginRepo();
  const clone = cloneRepo(origin, []);
  const runGit = runGitIn(clone);
  assert.equal(runGit(["rev-parse", "--is-shallow-repository"]).trim(), "false");
  const kept = readDirectSourceLastmod("page.md", { runGit });
  assert.ok(kept !== undefined);
  assert.equal(new Date(kept).getTime(), new Date(PAGE_TRUE_DATE).getTime());
});

test("lastmod (shallow): unreadable shallow metadata fails closed (omits)", () => {
  // A shallow repository whose boundary list cannot be read must omit rather
  // than trust a possibly-truncated candidate — even for a path whose latest
  // reachable commit is NOT a boundary (a depth-2 clone: other.md -> tip).
  const origin = makeOriginRepo();
  const clone = cloneRepo(origin, ["--depth", "2"]);
  const runGit = runGitIn(clone);
  const unreadable = () => undefined; // reader cannot return the shallow list
  assert.equal(
    readDirectSourceLastmod("other.md", { runGit, readShallowFile: unreadable }),
    undefined
  );
  // Control: with a working reader, other.md (tip, non-boundary) is preserved.
  const kept = readDirectSourceLastmod("other.md", { runGit });
  assert.equal(new Date(kept).getTime(), new Date(TIP_DATE).getTime());
});

// ---------------------------------------------------------------------------
// Strict Git object-id / date / shallow-status fault injection
// ---------------------------------------------------------------------------
//
// Fault injection is used ONLY to feed explicit, malformed, or unreadable
// Git-command outputs to the real helper. Real repository behavior is covered
// by the genuine file:// shallow-clone and linked-worktree tests.

const VALID_SHA = "0123456789abcdef0123456789abcdef01234567"; // 40 hex
const VALID_SHA_2 = "89abcdef0123456789abcdef0123456789abcdef";
const VALID_SHA_3 = "fedcba9876543210fedcba9876543210fedcba98";
const VALID_SHA_256 = "a".repeat(64);
const VALID_GIT_DATE = "2026-01-02T03:04:05+00:00";
const NUL = String.fromCharCode(0);
const GIT_THROW = Symbol("git-throw");

// Build a runGit stub from explicit per-command stdout. `log` is `git log`
// stdout, `flag` is `--is-shallow-repository` stdout, `shallowPath` is
// `--git-path shallow` stdout. GIT_THROW makes that command throw.
function fakeGit({
  log = `${VALID_SHA}${NUL}${VALID_GIT_DATE}\n`,
  flag = "false\n",
  shallowPath = "/tmp/does-not-matter/shallow\n"
} = {}) {
  return (args) => {
    if (args[0] === "log") {
      if (log === GIT_THROW) throw new Error("git log failed");
      return log;
    }
    if (args[0] === "rev-parse" && args.includes("--is-shallow-repository")) {
      if (flag === GIT_THROW) throw new Error("rev-parse failed");
      return flag;
    }
    if (args[0] === "rev-parse" && args.includes("shallow")) {
      if (shallowPath === GIT_THROW) throw new Error("git-path failed");
      return shallowPath;
    }
    throw new Error(`unexpected git args: ${args.join(" ")}`);
  };
}
const lm = (opts, readShallowFile) =>
  readDirectSourceLastmod("f.md", { runGit: fakeGit(opts), readShallowFile });

test("lastmod (fault): normalizeGitObjectId accepts 40/64 hex, lowercases, rejects the rest", () => {
  assert.equal(normalizeGitObjectId(VALID_SHA.toUpperCase()), VALID_SHA);
  assert.equal(normalizeGitObjectId(VALID_SHA_256), VALID_SHA_256);
  assert.equal(normalizeGitObjectId("abc1234"), null); // abbreviated
  assert.equal(normalizeGitObjectId(""), null);
  assert.equal(normalizeGitObjectId("z".repeat(40)), null); // non-hex
  assert.equal(normalizeGitObjectId(` ${VALID_SHA}`), null); // surrounding text
});

test("lastmod (fault): validateCommitterIsoDate enforces exact %cI semantics", () => {
  assert.equal(validateCommitterIsoDate("2026-01-02T03:04:05+00:00"), "2026-01-02T03:04:05+00:00");
  assert.equal(validateCommitterIsoDate("2026-07-19T05:00:03.000Z"), "2026-07-19T05:00:03.000Z");
  assert.equal(validateCommitterIsoDate("2026-02-30T00:00:00Z"), null); // impossible day
  assert.equal(validateCommitterIsoDate("2026-13-01T00:00:00Z"), null); // impossible month
  assert.equal(validateCommitterIsoDate("2026-07-23T25:00:00Z"), null); // impossible hour
  assert.equal(validateCommitterIsoDate("2026-07-23T00:00:00+25:00"), null); // impossible zone
  assert.equal(validateCommitterIsoDate(" 2026-01-02T03:04:05Z"), null); // whitespace
  assert.equal(validateCommitterIsoDate("July 23, 2026"), null); // locale
  assert.equal(validateCommitterIsoDate("2025-02-29T00:00:00Z"), null); // non-leap
  assert.equal(validateCommitterIsoDate("2024-02-29T00:00:00Z"), "2024-02-29T00:00:00Z"); // leap
});

test("lastmod (fault): shallow flag 'false' with a valid SHA/date returns the date", () => {
  assert.equal(lm({ flag: "false\n" }), VALID_GIT_DATE);
});

test("lastmod (fault): shallow flag 'true' with a non-boundary SHA returns the date", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n`), VALID_GIT_DATE);
});

test("lastmod (fault): shallow flag 'true' with the candidate as boundary omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA}\n`), undefined);
});

test("lastmod (fault): empty shallow flag omits (no full-history inference)", () => {
  assert.equal(lm({ flag: "\n" }), undefined);
});

test("lastmod (fault): 'unknown' shallow flag omits", () => {
  assert.equal(lm({ flag: "unknown\n" }), undefined);
});

test("lastmod (fault): 'TRUE' (case variant) shallow flag omits", () => {
  assert.equal(lm({ flag: "TRUE\n" }), undefined);
});

test("lastmod (fault): numeric/malformed shallow flag omits", () => {
  assert.equal(lm({ flag: "1\n" }), undefined);
  assert.equal(lm({ flag: "yes\n" }), undefined);
  assert.equal(lm({ flag: "   \n" }), undefined);
});

test("lastmod (fault): shallow-status command failure omits", () => {
  assert.equal(lm({ flag: GIT_THROW }), undefined);
});

test("lastmod (fault): invalid candidate SHA omits", () => {
  assert.equal(lm({ log: `${"z".repeat(40)}${NUL}${VALID_GIT_DATE}\n` }), undefined);
});

test("lastmod (fault): abbreviated candidate SHA omits", () => {
  assert.equal(lm({ log: `abc1234${NUL}${VALID_GIT_DATE}\n` }), undefined);
});

test("lastmod (fault): missing NUL separator omits", () => {
  assert.equal(lm({ log: `${VALID_SHA} ${VALID_GIT_DATE}\n` }), undefined);
});

test("lastmod (fault): extra NUL-separated fields omit", () => {
  assert.equal(lm({ log: `${VALID_SHA}${NUL}${VALID_GIT_DATE}${NUL}extra\n` }), undefined);
});

test("lastmod (fault): empty candidate date omits", () => {
  assert.equal(lm({ log: `${VALID_SHA}${NUL}\n` }), undefined);
});

test("lastmod (fault): malformed %cI date omits", () => {
  assert.equal(lm({ log: `${VALID_SHA}${NUL}not-a-real-date\n` }), undefined);
});

test("lastmod (fault): impossible calendar date omits", () => {
  assert.equal(lm({ log: `${VALID_SHA}${NUL}2026-02-30T00:00:00Z\n` }), undefined);
});

test("lastmod (fault): uppercase boundary SHA matches the lowercase candidate and omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA.toUpperCase()}\n`), undefined);
});

test("lastmod (fault): empty shallow file omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => ""), undefined);
});

test("lastmod (fault): fully malformed shallow file omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => "not-a-sha\nalso-bad\n"), undefined);
});

test("lastmod (fault): partially malformed shallow file omits (even for a non-boundary candidate)", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\ngarbage-line\n`), undefined);
});

test("lastmod (fault): multiple valid boundary SHAs are supported", () => {
  const boundary = () => `${VALID_SHA_2}\n${VALID_SHA_3}\n`;
  // candidate equals the second boundary entry -> omit
  assert.equal(
    readDirectSourceLastmod("f.md", {
      runGit: fakeGit({ log: `${VALID_SHA_3}${NUL}${VALID_GIT_DATE}\n`, flag: "true\n" }),
      readShallowFile: boundary
    }),
    undefined
  );
  // candidate not among the boundary entries -> keep
  assert.equal(
    readDirectSourceLastmod("f.md", {
      runGit: fakeGit({ log: `${VALID_SHA}${NUL}${VALID_GIT_DATE}\n`, flag: "true\n" }),
      readShallowFile: boundary
    }),
    VALID_GIT_DATE
  );
});

test("lastmod (fault): unreadable shallow file omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => undefined), undefined);
});

test("lastmod (fault): shallow-path command failure omits", () => {
  assert.equal(lm({ flag: "true\n", shallowPath: GIT_THROW }, () => `${VALID_SHA_2}\n`), undefined);
});

test("lastmod (linked worktree): resolves the shared shallow path and omits a boundary page", () => {
  // A genuine linked worktree of a real depth-one shallow clone. The default
  // shallow-file reader must resolve the shared shallow path through Git
  // (worktree-aware) and omit the boundary page's timestamp.
  const origin = makeOriginRepo();
  const clone = cloneRepo(origin, ["--depth", "1"]);
  const worktree = mkTemp();
  execFileSync("git", ["-C", clone, "worktree", "add", "-q", worktree, "HEAD"], { encoding: "utf8" });
  const runGit = runGitIn(worktree);
  assert.equal(runGit(["rev-parse", "--is-shallow-repository"]).trim(), "true");
  // Uses the DEFAULT readShallowFile, exercising real worktree path resolution.
  assert.equal(readDirectSourceLastmod("page.md", { runGit }), undefined);
});

// ---------------------------------------------------------------------------
// Round-3: EXACT Git command-output interpretation (no .trim())
// ---------------------------------------------------------------------------

// --- Shallow-status flag: only exact "false"/"true" (one terminator stripped) ---
test("lastmod (exact flag): 'false\\n' succeeds for a valid full-history candidate", () => {
  assert.equal(lm({ flag: "false\n" }), VALID_GIT_DATE);
});
test("lastmod (exact flag): 'true\\n' enters boundary handling", () => {
  // Non-boundary reader -> the date is kept, proving boundary handling ran.
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n`), VALID_GIT_DATE);
  // Boundary reader -> omit, confirming the same path evaluated the boundary set.
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA}\n`), undefined);
});
test("lastmod (exact flag): leading/trailing whitespace variants omit", () => {
  assert.equal(lm({ flag: " false\n" }), undefined);
  assert.equal(lm({ flag: "false \n" }), undefined);
  assert.equal(lm({ flag: "\tfalse\n" }), undefined);
  assert.equal(lm({ flag: " true\n" }, () => `${VALID_SHA_2}\n`), undefined);
  assert.equal(lm({ flag: "true \n" }, () => `${VALID_SHA_2}\n`), undefined);
});
test("lastmod (exact flag): multiple trailing newlines omit", () => {
  assert.equal(lm({ flag: "false\n\n" }), undefined);
  assert.equal(lm({ flag: "true\n\n" }, () => `${VALID_SHA_2}\n`), undefined);
});
test("lastmod (exact flag): CRLF terminator is stripped for exact values", () => {
  assert.equal(lm({ flag: "false\r\n" }), VALID_GIT_DATE);
});
test("lastmod (exact flag): empty and whitespace-only flag omit", () => {
  assert.equal(lm({ flag: "" }), undefined);
  assert.equal(lm({ flag: "\n" }), undefined);
  assert.equal(lm({ flag: "   \n" }), undefined);
});
test("lastmod (exact flag): trailing text after the value omits", () => {
  assert.equal(lm({ flag: "false is the answer\n" }), undefined);
  assert.equal(lm({ flag: "true\nextra\n" }, () => `${VALID_SHA_2}\n`), undefined);
});

// --- Shallow-path output: only one terminator stripped; exact discipline ---
const lmPath = (shallowPath, reader) =>
  readDirectSourceLastmod("f.md", {
    runGit: fakeGit({ flag: "true\n", shallowPath }),
    readShallowFile: reader
  });
// A reader that yields a non-boundary boundary-set ONLY for the exact path.
const readerFor = (expectedPath) => (p) => (p === expectedPath ? `${VALID_SHA_2}\n` : undefined);

test("lastmod (exact path): one terminal LF is removed", () => {
  assert.equal(lmPath("/x/shallow\n", readerFor("/x/shallow")), VALID_GIT_DATE);
});
test("lastmod (exact path): one terminal CRLF is removed", () => {
  assert.equal(lmPath("/x/shallow\r\n", readerFor("/x/shallow")), VALID_GIT_DATE);
});
test("lastmod (exact path): leading/trailing path spaces are NOT trimmed", () => {
  assert.equal(lmPath("  /x/ sp ace /shallow \n", readerFor("  /x/ sp ace /shallow ")), VALID_GIT_DATE);
});
test("lastmod (exact path): an extra output line omits", () => {
  assert.equal(lmPath("/x/shallow\nextra\n", () => `${VALID_SHA_2}\n`), undefined);
});
test("lastmod (exact path): embedded NUL omits", () => {
  assert.equal(lmPath(`/x/sh${NUL}allow\n`, () => `${VALID_SHA_2}\n`), undefined);
});
test("lastmod (exact path): empty path output omits", () => {
  assert.equal(lmPath("\n", () => `${VALID_SHA_2}\n`), undefined);
  assert.equal(lmPath("", () => `${VALID_SHA_2}\n`), undefined);
});

// --- Shallow-boundary metadata: strict blank-line rejection ---
test("lastmod (boundary): one valid line without a final newline is accepted", () => {
  assert.equal(lm({ flag: "true\n" }, () => VALID_SHA_2), VALID_GIT_DATE);
});
test("lastmod (boundary): one valid line with exactly one LF is accepted", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n`), VALID_GIT_DATE);
});
test("lastmod (boundary): one valid line with exactly one CRLF is accepted", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\r\n`), VALID_GIT_DATE);
});
test("lastmod (boundary): multiple valid SHAs are accepted", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n${VALID_SHA_3}\n`), VALID_GIT_DATE);
});
test("lastmod (boundary): a leading blank line omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => `\n${VALID_SHA_2}\n`), undefined);
});
test("lastmod (boundary): an interior blank line omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n\n${VALID_SHA_3}\n`), undefined);
});
test("lastmod (boundary): two trailing newlines omit", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n\n`), undefined);
});
test("lastmod (boundary): a whitespace-only line omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\n   \n`), undefined);
});
test("lastmod (boundary): a SHA with surrounding spaces omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => ` ${VALID_SHA_2} \n`), undefined);
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
// `mutate({ root, distDir })` runs after files are written and before the
// verifier runs, so a test can introduce symlinks, directories, or other
// non-regular entries into the dist tree.
function runVerifierFixture({ pages, childLocs, pageEntries, robots, extraDist, mutate, makeReadDir, makeWalkFilesReadDir }) {
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
  if (mutate) mutate({ root, distDir });
  // Optional internal test seams: inject a directory reader (e.g. one that throws
  // for one exact directory) for the sitemap inventory and/or the walkFiles
  // feed/content scan, built from the concrete { root, distDir } paths.
  const hooks = {};
  if (makeReadDir) hooks.readDir = makeReadDir({ root, distDir });
  if (makeWalkFilesReadDir) hooks.walkFilesReadDir = makeWalkFilesReadDir({ root, distDir });
  const testHooks = Object.keys(hooks).length > 0 ? hooks : undefined;
  return verifyIndexingDiscoveryBuild({
    repoRoot: pathToFileURL(root + "/"),
    pagesDir: pathToFileURL(pagesDir + "/"),
    distDir: pathToFileURL(distDir + "/"),
    testHooks
  });
}

// A directory reader (for the sitemap-inventory seam, which receives a path) that
// throws (simulated EACCES) for exactly `targetAbs` and delegates every other
// directory to the real readdirSync. Trailing path separators are normalized on
// both sides so the dist root (passed with a trailing slash) matches a slash-free
// target.
function readDirFailingFor(targetAbs) {
  const norm = (p) => String(p).replace(/[/\\]+$/, "");
  const target = norm(targetAbs);
  return (dir, opts) => {
    if (norm(dir) === target) {
      const err = new Error("injected directory-read failure");
      err.code = "EACCES";
      throw err;
    }
    return readdirSync(dir, opts);
  };
}

// A directory reader for the walkFiles seam, which receives a file:// URL. Throws
// (simulated EACCES) for exactly `targetAbs` and delegates otherwise.
function walkFilesFailingFor(targetAbs) {
  const norm = (p) => String(p).replace(/[/\\]+$/, "");
  const target = norm(targetAbs);
  return (dirUrl, opts) => {
    if (norm(fileURLToPath(dirUrl)) === target) {
      const err = new Error("injected file-scan directory-read failure");
      err.code = "EACCES";
      throw err;
    }
    return readdirSync(dirUrl, opts);
  };
}

// Detect whether unreadable-directory permission semantics are actually
// enforced for this process (root/elevated execution ignores 0o000 read bits).
const PERMISSION_ENFORCEABLE = (() => {
  try {
    const d = mkTemp();
    const sub = join(d, "noread");
    mkdirSync(sub);
    writeFileSync(join(sub, "x"), "1");
    chmodSync(sub, 0o000);
    let denied = false;
    try {
      readdirSync(sub);
    } catch {
      denied = true;
    }
    chmodSync(sub, 0o755);
    return denied;
  } catch {
    return false;
  }
})();

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
// The REAL verifier: strict XML structural mutation fixtures
// ===========================================================================
//
// These write raw sitemap documents into an isolated dist and run the REAL
// verifier, exercising the strict XML parser (not regex tag-scraping). Each
// asserts that a specific malformed structure produces the expected finding.

const SITEMAP0 = `${PRODUCTION_ORIGIN}/sitemap-0.xml`;
const SITEMAP1 = `${PRODUCTION_ORIGIN}/sitemap-1.xml`;
const FORBIDDEN_URL = "https://mwe-preview.pages.dev/x/";

test("verifier XML: malformed (not well-formed) sitemap-index is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    // Unclosed <sitemapindex> — not well-formed.
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}><sitemap><loc>${SITEMAP0}</loc></sitemap>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_MALFORMED_XML"));
});

test("verifier XML: sitemap-index with the wrong root element is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><sitemap><loc>${SITEMAP0}</loc></sitemap></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_ROOT"));
});

test("verifier XML: sitemap-index with the wrong namespace is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://example.com/wrong"><sitemap><loc>${SITEMAP0}</loc></sitemap></sitemapindex>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_NAMESPACE"));
});

test("verifier XML: sitemap-index record with two <loc> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}><sitemap><loc>${SITEMAP0}</loc><loc>${SITEMAP1}</loc></sitemap></sitemapindex>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_RECORD_ONE_LOC"));
});

test("verifier XML: sitemap-index record with two <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}><sitemap><loc>${SITEMAP0}</loc><lastmod>2026-01-01T00:00:00Z</lastmod><lastmod>2026-02-02T00:00:00Z</lastmod></sitemap></sitemapindex>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_RECORD_LASTMOD_COUNT"));
});

test("verifier XML: malformed (not well-formed) child sitemap is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    // Unclosed <urlset> — not well-formed.
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_MALFORMED_XML"));
});

test("verifier XML: child sitemap with the wrong root element is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url></sitemapindex>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_ROOT"));
});

test("verifier XML: child sitemap with the wrong namespace is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://example.com/wrong"><url><loc>${PRODUCTION_ORIGIN}/</loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_NAMESPACE"));
});

test("verifier XML: child <url> record with two <loc> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc><loc>${PRODUCTION_ORIGIN}/about/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_ONE_LOC"));
});

test("verifier XML: child <url> record with two <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc><lastmod>2026-01-01T00:00:00Z</lastmod><lastmod>2026-02-02T00:00:00Z</lastmod></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_LASTMOD_COUNT"));
});

test("verifier XML: child <lastmod> with invalid syntax is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [
      { loc: `${PRODUCTION_ORIGIN}/`, lastmod: "not-a-real-date" },
      { loc: `${PRODUCTION_ORIGIN}/about/` }
    ]
  });
  assert.ok(failCodes(r).includes("SITEMAP_LASTMOD_ISO"));
});

test("verifier XML: duplicate raw <loc> across url records is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url><url><loc>${PRODUCTION_ORIGIN}/</loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_NO_DUPLICATE_LOC"));
});

test("verifier XML: forbidden origin inside a child sitemap is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [
      { loc: `${PRODUCTION_ORIGIN}/` },
      { loc: `${PRODUCTION_ORIGIN}/about/` },
      { loc: FORBIDDEN_URL }
    ]
  });
  assert.ok(failCodes(r).includes("FORBIDDEN_ORIGIN"));
});

test("verifier XML: an unreferenced generated sitemap-*.xml file is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    // sitemap-1.xml exists in dist but the index references only sitemap-0.xml.
    extraDist: { "sitemap-1.xml": urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/about/` }]) }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_UNREFERENCED_CHILD_FILE"));
  assert.ok(codes.includes("SITEMAP_CHILD_FILES_EXACT_MATCH"));
});

test("verifier XML: an index-referenced child sitemap file that is absent is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    childLocs: [SITEMAP0, SITEMAP1], // sitemap-1.xml is never written to dist
    pageEntries: GOOD_ENTRIES
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("CHILD_FILE_MISSING"));
  assert.ok(codes.includes("SITEMAP_REFERENCED_CHILD_ABSENT"));
});

test("verifier XML: an unreferenced stray child with a forbidden origin is still scanned", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-2.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><url><loc>${FORBIDDEN_URL}</loc></url></urlset>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("FORBIDDEN_ORIGIN"));
  assert.ok(codes.includes("SITEMAP_UNREFERENCED_CHILD_FILE"));
});

test("verifier XML: two referenced child sitemaps both present pass exact-match", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    childLocs: [SITEMAP0, SITEMAP1],
    pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/` }], // sitemap-0.xml
    extraDist: { "sitemap-1.xml": urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/about/` }]) }
  });
  assert.equal(r.failed, false, `unexpected failures: ${failCodes(r).join(", ")}`);
});

// ===========================================================================
// The REAL verifier: strict structural-model, raw-scalar, entity, and
// symlink/regular-file mutation fixtures (round-2 hardening)
// ===========================================================================

const rawChild = (inner) => `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}>${inner}</urlset>`;
const rawIndex = (inner) => `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}>${inner}</sitemapindex>`;
const childOverride = (inner) => ({ "sitemap-0.xml": rawChild(inner) });

// Probe whether this platform can create symbolic links; symlink-specific tests
// skip when it cannot (e.g. unprivileged Windows), but the regular-file /
// directory containment tests always run.
const SYMLINKS_SUPPORTED = (() => {
  try {
    const d = mkTemp();
    symlinkSync(join(d, "target"), join(d, "link"));
    return true;
  } catch {
    return false;
  }
})();

test("verifier XML: shared strict lastmod validator (date-only, ms-Z, and rejections)", () => {
  assert.equal(isValidSitemapLastmod("2026-07-23"), true);
  assert.equal(isValidSitemapLastmod("2026-07-19T05:00:03.000Z"), true);
  assert.equal(isValidSitemapLastmod("2026-07-05T17:49:25+08:00"), true);
  assert.equal(isValidSitemapLastmod("07/23/2026"), false); // locale
  assert.equal(isValidSitemapLastmod("2026-02-30"), false); // impossible day
  assert.equal(isValidSitemapLastmod("2026-13-01"), false); // impossible month
  assert.equal(isValidSitemapLastmod("2026-07-23T25:00:00Z"), false); // invalid time
  assert.equal(isValidSitemapLastmod("2026-07-23T00:00:00+25:00"), false); // invalid zone
  assert.equal(isValidSitemapLastmod(" 2026-07-23"), false); // whitespace
});

test("verifier XML: leading whitespace in a <loc> scalar is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc> ${PRODUCTION_ORIGIN}/</loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_LOC_SHAPE"));
});

test("verifier XML: trailing whitespace in a <loc> scalar is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc>${PRODUCTION_ORIGIN}/ </loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_LOC_SHAPE"));
});

test("verifier XML: <loc> with an attribute is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc foo="1">${PRODUCTION_ORIGIN}/</loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_LOC_ATTR"));
});

test("verifier XML: <loc> with an unexpected child element is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc><b>${PRODUCTION_ORIGIN}/</b></loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_LOC_CHILD"));
});

test("verifier XML: <lastmod> with an attribute is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc>${PRODUCTION_ORIGIN}/</loc><lastmod foo="1">2026-07-23</lastmod></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_LASTMOD_ATTR"));
});

test("verifier XML: <lastmod> with an unexpected child element is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc>${PRODUCTION_ORIGIN}/</loc><lastmod><b>2026-07-23</b></lastmod></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_LASTMOD_CHILD"));
});

test("verifier XML: unexpected child-sitemap root attribute is rejected (xmlns:* is allowed)", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS} extra="x"><url><loc>${PRODUCTION_ORIGIN}/</loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_ROOT_ATTR"));
});

test("verifier XML: standard xmlns:* namespace declarations on <urlset> are accepted", () => {
  const ns =
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"';
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${ns}><url><loc>${PRODUCTION_ORIGIN}/</loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url></urlset>`
    }
  });
  assert.ok(!failCodes(r).includes("SITEMAP_CHILD_ROOT_ATTR"));
  assert.ok(!failCodes(r).includes("SITEMAP_CHILD_NAMESPACE"));
});

test("verifier XML: unexpected record attribute is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url foo="1"><loc>${PRODUCTION_ORIGIN}/</loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_RECORD_ATTR"));
});

test("verifier XML: unexpected root child element is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc>${PRODUCTION_ORIGIN}/</loc></url><foo>x</foo>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_ROOT_CHILD"));
});

test("verifier XML: unexpected record child element is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc>${PRODUCTION_ORIGIN}/</loc><bar>x</bar></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_RECORD_CHILD"));
});

test("verifier XML: non-whitespace text directly inside the root is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`junk<url><loc>${PRODUCTION_ORIGIN}/</loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_ROOT_TEXT"));
});

test("verifier XML: non-whitespace text directly inside a record is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url>junk<loc>${PRODUCTION_ORIGIN}/</loc></url>`)
  });
  assert.ok(failCodes(r).includes("SITEMAP_URL_RECORD_TEXT"));
});

test("verifier XML: a malformed record is EXCLUDED from downstream URL entries", () => {
  // A malformed extra <url> (unexpected child) carries a /ghost/ loc that has no
  // page source. If it were included it would trigger SITEMAP_UNEXPECTED_ROUTE.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(
      `<url><loc>${PRODUCTION_ORIGIN}/</loc></url>` +
        `<url><loc>${PRODUCTION_ORIGIN}/about/</loc></url>` +
        `<url><loc>${PRODUCTION_ORIGIN}/ghost/</loc><bar>x</bar></url>`
    )
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_URL_RECORD_CHILD")); // the record is flagged
  assert.ok(!codes.includes("SITEMAP_UNEXPECTED_ROUTE")); // ghost never entered the set
  assert.ok(!codes.includes("SITEMAP_SET_EXACT_MATCH")); // /,/about/ still match exactly
});

test("verifier XML: invalid sitemap-index <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-index.xml": rawIndex(`<sitemap><loc>${SITEMAP0}</loc><lastmod>not-a-date</lastmod></sitemap>`)
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_LASTMOD_SYNTAX"));
});

test("verifier XML: locale-style child <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/`, lastmod: "07/23/2026" }, { loc: `${PRODUCTION_ORIGIN}/about/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_LASTMOD_ISO"));
});

test("verifier XML: impossible-calendar child <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/`, lastmod: "2026-02-30" }, { loc: `${PRODUCTION_ORIGIN}/about/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_LASTMOD_ISO"));
});

test("verifier XML: invalid-time child <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/`, lastmod: "2026-07-23T25:00:00Z" }, { loc: `${PRODUCTION_ORIGIN}/about/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_LASTMOD_ISO"));
});

test("verifier XML: invalid-timezone child <lastmod> is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: [{ loc: `${PRODUCTION_ORIGIN}/`, lastmod: "2026-07-23T00:00:00+25:00" }, { loc: `${PRODUCTION_ORIGIN}/about/` }]
  });
  assert.ok(failCodes(r).includes("SITEMAP_LASTMOD_ISO"));
});

test("verifier XML: a DOCTYPE declaration is rejected before parsing", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0"?><!DOCTYPE urlset><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_MALFORMED_XML"));
});

test("verifier XML: an internal entity declaration (DOCTYPE) is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0"?><!DOCTYPE urlset [ <!ENTITY x "y"> ]><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_MALFORMED_XML"));
});

test("verifier XML: an external entity declaration (DOCTYPE) is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0"?><!DOCTYPE urlset [ <!ENTITY ext SYSTEM "file:///etc/passwd"> ]><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_MALFORMED_XML"));
});

test("verifier XML: a parameter entity declaration (DOCTYPE) is rejected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0"?><!DOCTYPE urlset [ <!ENTITY % pe "x"> ]><urlset ${SM_NS}><url><loc>${PRODUCTION_ORIGIN}/</loc></url></urlset>`
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_MALFORMED_XML"));
});

test("verifier XML: a normal &amp; escape is NOT treated as a custom entity / DOCTYPE", () => {
  // The document is well-formed (predefined escape); the &-bearing URL still
  // fails the exact-shape check, but the document must NOT be flagged malformed.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: childOverride(`<url><loc>${PRODUCTION_ORIGIN}/?a&amp;b</loc></url><url><loc>${PRODUCTION_ORIGIN}/about/</loc></url>`)
  });
  const codes = failCodes(r);
  assert.ok(!codes.includes("SITEMAP_CHILD_MALFORMED_XML"));
  assert.ok(codes.includes("SITEMAP_LOC_SHAPE")); // the ?a&b URL fails shape, as expected
});

test("verifier XML: a child path that is a directory is rejected as non-regular", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    childLocs: [SITEMAP0, SITEMAP1],
    pageEntries: GOOD_ENTRIES,
    mutate: ({ distDir }) => {
      mkdirSync(join(distDir, "sitemap-1.xml"), { recursive: true });
    }
  });
  assert.ok(failCodes(r).includes("CHILD_NON_REGULAR"));
});

test("verifier XML: a referenced child that is a symlink outside dist is rejected (not followed)", { skip: !SYMLINKS_SUPPORTED }, () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    childLocs: [SITEMAP0, SITEMAP1],
    pageEntries: GOOD_ENTRIES,
    mutate: ({ root, distDir }) => {
      const outside = join(root, "outside-target.xml");
      writeFileSync(outside, urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/about/` }]));
      symlinkSync(outside, join(distDir, "sitemap-1.xml"));
    }
  });
  assert.ok(failCodes(r).includes("CHILD_SYMLINK"));
});

test("verifier XML: an unreferenced matching sitemap symlink is reported", { skip: !SYMLINKS_SUPPORTED }, () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ root, distDir }) => {
      const outside = join(root, "stray-target.xml");
      writeFileSync(outside, urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/` }]));
      symlinkSync(outside, join(distDir, "sitemap-9.xml"));
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_SYMLINK"));
});

test("verifier XML: a symlinked sitemap-index.xml is rejected", { skip: !SYMLINKS_SUPPORTED }, () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ root, distDir }) => {
      const outside = join(root, "real-index.xml");
      writeFileSync(outside, indexXml([SITEMAP0]));
      rmSync(join(distDir, "sitemap-index.xml"));
      symlinkSync(outside, join(distDir, "sitemap-index.xml"));
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_INDEX_UNSAFE_FILE"));
});

// ===========================================================================
// Round-3: root-level XML findings are FATAL to record extraction
// ===========================================================================

const MISSING_CHILD = `${PRODUCTION_ORIGIN}/sitemap-7.xml`; // referenced but never written
const GHOST = `${PRODUCTION_ORIGIN}/ghost/`; // a route with no page source

// Each invalid sitemap-index ROOT must produce its finding AND extract zero
// child references (so a referenced-but-missing child is never opened).
test("verifier root-fatal: index unexpected root attribute yields zero child references", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS} extra="x"><sitemap><loc>${MISSING_CHILD}</loc></sitemap></sitemapindex>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INDEX_ROOT_ATTR"));
  assert.ok(!codes.includes("CHILD_FILE_MISSING")); // sitemap-7.xml never opened
  assert.ok(!codes.includes("CHILD_LOC_SHAPE"));
  assert.ok(!codes.includes("SITEMAP_REFERENCED_CHILD_ABSENT"));
});

test("verifier root-fatal: index non-whitespace root text yields zero child references", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}>junk<sitemap><loc>${MISSING_CHILD}</loc></sitemap></sitemapindex>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INDEX_ROOT_TEXT"));
  assert.ok(!codes.includes("CHILD_FILE_MISSING"));
});

test("verifier root-fatal: index unexpected root child yields zero child references", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${SM_NS}><foo>x</foo><sitemap><loc>${MISSING_CHILD}</loc></sitemap></sitemapindex>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INDEX_ROOT_CHILD"));
  assert.ok(!codes.includes("CHILD_FILE_MISSING"));
});

test("verifier root-fatal: index wrong namespace yields zero child references", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sitemap-index.xml": `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://example.com/wrong"><sitemap><loc>${MISSING_CHILD}</loc></sitemap></sitemapindex>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INDEX_NAMESPACE"));
  assert.ok(!codes.includes("CHILD_FILE_MISSING"));
});

// Each invalid child urlset ROOT must produce its finding AND extract zero URL
// entries (so the otherwise-valid /ghost/ URL never reaches route / origin /
// duplicate / membership checks).
test("verifier root-fatal: child unexpected root attribute yields zero URL entries", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS} extra="x"><url><loc>${GHOST}</loc></url></urlset>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_ROOT_ATTR"));
  assert.ok(!codes.includes("SITEMAP_UNEXPECTED_ROUTE")); // ghost never entered
});

test("verifier root-fatal: child non-whitespace root text yields zero URL entries", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}>junk<url><loc>${GHOST}</loc></url></urlset>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_ROOT_TEXT"));
  assert.ok(!codes.includes("SITEMAP_UNEXPECTED_ROUTE"));
});

test("verifier root-fatal: child unexpected root child yields zero URL entries", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS}><foo>x</foo><url><loc>${GHOST}</loc></url></urlset>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_ROOT_CHILD"));
  assert.ok(!codes.includes("SITEMAP_UNEXPECTED_ROUTE"));
});

test("verifier root-fatal: child wrong namespace yields zero URL entries", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://example.com/wrong"><url><loc>${GHOST}</loc></url></urlset>`
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_NAMESPACE"));
  assert.ok(!codes.includes("SITEMAP_UNEXPECTED_ROUTE"));
});

// ===========================================================================
// Round-3: recursive sitemap-shaped file inventory and enforcement
// ===========================================================================

test("verifier recursive: a nested lowercase sitemap-9.xml is unexpected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "nested/sitemap-9.xml": urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/` }]) }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_UNEXPECTED"));
  assert.ok(!codes.includes("SITEMAP_UNREFERENCED_CHILD_FILE")); // it never enters the valid set
});

test("verifier recursive: a nested sitemap with a forbidden origin is still scanned", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "nested/sitemap-9.xml": urlsetXml([{ loc: FORBIDDEN_URL }]) }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_UNEXPECTED"));
  assert.ok(codes.includes("FORBIDDEN_ORIGIN")); // closes the nested false-pass
});

test("verifier recursive: a nested UPPERCASE SITEMAP-9.XML is unexpected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "nested/SITEMAP-9.XML": urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/` }]) }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_UNEXPECTED"));
});

test("verifier recursive: a root-level UPPERCASE SITEMAP-9.XML is unexpected", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "SITEMAP-9.XML": urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/` }]) }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_UNEXPECTED"));
  assert.ok(!codes.includes("SITEMAP_UNREFERENCED_CHILD_FILE"));
});

test("verifier recursive: a nested directory named sitemap-9.xml is non-regular", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ distDir }) => {
      mkdirSync(join(distDir, "nested", "sitemap-9.xml"), { recursive: true });
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_NON_REGULAR"));
});

test("verifier recursive: a nested sitemap symlink to an outside file is reported, not followed", { skip: !SYMLINKS_SUPPORTED }, () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ root, distDir }) => {
      const outside = join(root, "outside-nested.xml");
      writeFileSync(outside, urlsetXml([{ loc: FORBIDDEN_URL }]));
      mkdirSync(join(distDir, "nested"), { recursive: true });
      symlinkSync(outside, join(distDir, "nested", "sitemap-9.xml"));
    }
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_CHILD_SYMLINK"));
  assert.ok(!codes.includes("FORBIDDEN_ORIGIN")); // symlink target never read
});

test("verifier recursive: a nested sitemap symlink to an in-dist file is reported", { skip: !SYMLINKS_SUPPORTED }, () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ distDir }) => {
      mkdirSync(join(distDir, "nested"), { recursive: true });
      symlinkSync(join(distDir, "sitemap-0.xml"), join(distDir, "nested", "sitemap-9.xml"));
    }
  });
  assert.ok(failCodes(r).includes("SITEMAP_CHILD_SYMLINK"));
});

test("verifier recursive: a directory symlink is NOT followed during traversal", { skip: !SYMLINKS_SUPPORTED }, () => {
  // A non-shaped directory symlink pointing at a tree that contains a sitemap
  // file with a forbidden origin. Traversal must not follow it, so the inner
  // file is never enumerated or scanned.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ root, distDir }) => {
      const realDir = join(root, "outside-tree");
      mkdirSync(realDir, { recursive: true });
      writeFileSync(join(realDir, "sitemap-9.xml"), urlsetXml([{ loc: FORBIDDEN_URL }]));
      symlinkSync(realDir, join(distDir, "linkdir")); // not sitemap-shaped
    }
  });
  const codes = failCodes(r);
  assert.ok(!codes.includes("FORBIDDEN_ORIGIN")); // symlinked dir not followed
  assert.ok(!codes.includes("SITEMAP_CHILD_UNEXPECTED")); // inner file never seen
});

test("verifier recursive: an unrelated nested .xml is NOT treated as a child sitemap", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "nested/data.xml": '<?xml version="1.0"?><records><record>1</record></records>' }
  });
  assert.equal(r.failed, false, `unexpected failures: ${failCodes(r).join(", ")}`);
});

test("verifier recursive: the ordinary valid root-level child still passes", () => {
  const r = runVerifierFixture({ pages: BASE_PAGES, pageEntries: GOOD_ENTRIES });
  assert.equal(r.failed, false, `unexpected failures: ${failCodes(r).join(", ")}`);
});

// ===========================================================================
// Round-4: recursive directory-read failure is FATAL (fail-closed)
// ===========================================================================

const exactMatchCheck = (r) => r.results.find((x) => x.code === "SITEMAP_CHILD_FILES_EXACT_MATCH");

test("verifier traversal: an unreadable inventory ROOT fails closed (injected)", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    makeReadDir: ({ distDir }) => readDirFailingFor(distDir) // fail the dist root itself
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  // Generated/reference agreement cannot be represented as complete.
  const exact = exactMatchCheck(r);
  assert.ok(exact && exact.ok === false);
});

test("verifier traversal: an unreadable NESTED directory fails closed; siblings continue (injected)", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES, // writes root-level sitemap-0.xml (referenced + valid)
    extraDist: { "hidden/sitemap-9.xml": urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/` }]) },
    makeReadDir: ({ distDir }) => readDirFailingFor(join(distDir, "hidden"))
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  // The hidden sitemap was never enumerated -> not claimed inspected.
  assert.ok(!r.results.some((x) => x.code === "SITEMAP_CHILD_UNEXPECTED" && String(x.detail).includes("hidden")));
  // The readable root-level valid child was still processed normally.
  assert.ok(!codes.includes("SITEMAP_REFERENCED_CHILD_ABSENT"));
});

test("verifier traversal: a hidden forbidden-origin sitemap is NOT read through the failure (injected)", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "hidden/sitemap-9.xml": urlsetXml([{ loc: FORBIDDEN_URL }]) },
    makeReadDir: ({ distDir }) => readDirFailingFor(join(distDir, "hidden"))
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  // Fail-closed: the unreadable content is never read, so FORBIDDEN_ORIGIN is
  // NOT derived from it — but verification still fails.
  assert.ok(!codes.includes("FORBIDDEN_ORIGIN"));
});

test("verifier traversal: generated/reference match does not mask a traversal failure (injected)", () => {
  // Root-level inventory is exactly correct (sitemap-0.xml referenced + present),
  // but an empty nested directory cannot be read: overall must still FAIL.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    mutate: ({ distDir }) => mkdirSync(join(distDir, "empty"), { recursive: true }),
    makeReadDir: ({ distDir }) => readDirFailingFor(join(distDir, "empty"))
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  const exact = exactMatchCheck(r);
  assert.ok(exact && exact.ok === false); // equality did not override the failure
});

test("verifier traversal: a real unreadable nested directory (chmod)", { skip: !PERMISSION_ENFORCEABLE }, () => {
  const root = mkTemp();
  const pagesDir = join(root, "pages");
  for (const [rel, content] of Object.entries(BASE_PAGES)) {
    const abs = join(pagesDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  const distDir = join(root, "dist");
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, "sitemap-index.xml"), indexXml([SITEMAP0]));
  writeFileSync(join(distDir, "sitemap-0.xml"), urlsetXml(GOOD_ENTRIES));
  writeFileSync(join(distDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_ORIGIN}/sitemap-index.xml\n`);
  const hidden = join(distDir, "hidden");
  mkdirSync(hidden);
  writeFileSync(join(hidden, "sitemap-9.xml"), urlsetXml([{ loc: `${PRODUCTION_ORIGIN}/` }]));
  chmodSync(hidden, 0o000);
  try {
    // Must NOT throw (the CI-exposed EACCES). Both recursive traversals now
    // fail closed with explicit findings.
    const r = verifyIndexingDiscoveryBuild({
      repoRoot: pathToFileURL(root + "/"),
      pagesDir: pathToFileURL(pagesDir + "/"),
      distDir: pathToFileURL(distDir + "/")
    });
    const codes = r.results.filter((x) => !x.ok).map((x) => x.code);
    assert.ok(codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
    assert.ok(codes.includes("DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE")); // the round-5 fix
    assert.equal(r.failed, true);
  } finally {
    chmodSync(hidden, 0o755); // restore so temp cleanup can remove it
  }
});

// ---------------------------------------------------------------------------
// Round-5: walkFiles (feed/content scan) fails closed on unreadable directories
// ---------------------------------------------------------------------------

test("walkFiles: an injected unreadable NESTED directory fails closed; siblings continue", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "hidden/note.txt": "plain readable content",
      "sibling/page.html": "<html><head></head><body>ok</body></html>"
    },
    makeWalkFilesReadDir: ({ distDir }) => walkFilesFailingFor(join(distDir, "hidden"))
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  // The finding records the dist-relative hidden path (not an absolute path):
  // detail is of the form "hidden (EACCES)".
  const f = r.results.find((x) => x.code === "DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE");
  assert.ok(f && /^hidden \([A-Za-z0-9_]+\)$/.test(String(f.detail)));
});

test("walkFiles: an injected unreadable ROOT fails closed without an exception", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    makeWalkFilesReadDir: ({ distDir }) => walkFilesFailingFor(distDir)
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  // A successful sitemap inventory cannot mask the incomplete file scan.
  assert.ok(!codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
});

test("walkFiles: hidden feed-signature content is NOT read through the failure", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      // An RSS-signature document hidden inside the unreadable directory.
      "hidden/updates.xml": '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>'
    },
    makeWalkFilesReadDir: ({ distDir }) => walkFilesFailingFor(join(distDir, "hidden"))
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
  // The unreadable content is never read, so no feed-signature finding is
  // fabricated from it — but verification still fails because the scan is
  // incomplete.
  assert.ok(!codes.includes("FEED_CONTENT_SIGNATURE"));
});

test("walkFiles: a readable sibling is still scanned when another nested dir fails", () => {
  // The readable sibling contains a feed signature; it MUST still be detected,
  // proving sibling traversal continues past the failed directory.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: {
      "sibling/updates.xml": '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>'
    },
    makeWalkFilesReadDir: ({ distDir }) => walkFilesFailingFor(join(distDir, "hidden")),
    mutate: ({ distDir }) => mkdirSync(join(distDir, "hidden"), { recursive: true })
  });
  const codes = failCodes(r);
  assert.ok(codes.includes("DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE")); // empty hidden dir fails
  assert.ok(codes.includes("FEED_CONTENT_SIGNATURE")); // readable sibling still scanned
  assert.equal(r.failed, true);
});

test("walkFiles: sitemap inventory may complete while the file scan independently fails", () => {
  // Otherwise-correct generated/reference agreement (sitemap inventory clean),
  // but the walkFiles scan cannot read the dist root -> still fails. This is the
  // exact CI-exposed second-traversal defect.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    makeWalkFilesReadDir: ({ distDir }) => walkFilesFailingFor(distDir)
  });
  const codes = failCodes(r);
  // sitemap inventory had no traversal finding and matched exactly:
  assert.ok(!codes.includes("SITEMAP_INVENTORY_DIRECTORY_UNREADABLE"));
  const exact = r.results.find((x) => x.code === "SITEMAP_CHILD_FILES_EXACT_MATCH");
  assert.ok(exact && exact.ok === true);
  // but the file scan failed, so overall verification fails:
  assert.ok(codes.includes("DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE"));
  assert.equal(r.failed, true);
});

test("walkFiles: readable output still detects a feed signature (regression intact)", () => {
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    pageEntries: GOOD_ENTRIES,
    extraDist: { "updates.xml": '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>' }
  });
  assert.ok(failCodes(r).includes("FEED_CONTENT_SIGNATURE"));
});

// ===========================================================================
// Round-4: minor Git parsing and root-fatal regression refinements
// ===========================================================================

test("lastmod (exact flag): 'False\\n' (capitalized) omits", () => {
  assert.equal(lm({ flag: "False\n" }), undefined);
});
test("lastmod (exact flag): 'true\\r\\n' enters shallow handling", () => {
  assert.equal(lm({ flag: "true\r\n" }, () => `${VALID_SHA_2}\n`), VALID_GIT_DATE); // non-boundary kept
  assert.equal(lm({ flag: "true\r\n" }, () => `${VALID_SHA}\n`), undefined); // boundary omit
});
test("lastmod (boundary): a SHA with surrounding TABS omits", () => {
  assert.equal(lm({ flag: "true\n" }, () => `\t${VALID_SHA_2}\t\n`), undefined);
});
test("lastmod (boundary): multiple SHAs separated by CRLF are accepted", () => {
  assert.equal(lm({ flag: "true\n" }, () => `${VALID_SHA_2}\r\n${VALID_SHA_3}\r\n`), VALID_GIT_DATE);
});

test("verifier root-fatal: invalid child root extracts ZERO URL entries and no record-derived findings", () => {
  // Invalid urlset root (unexpected attribute) containing a forbidden-origin URL
  // AND an otherwise valid-looking route. No record-derived downstream finding
  // may be produced; only the root-structure finding applies.
  const r = runVerifierFixture({
    pages: BASE_PAGES,
    extraDist: {
      "sitemap-0.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset ${SM_NS} extra="x"><url><loc>${FORBIDDEN_URL}</loc></url><url><loc>${PRODUCTION_ORIGIN}/somewhere/</loc><lastmod>not-a-date</lastmod></url></urlset>`
    }
  });
  const codes = failCodes(r);
  assert.equal(r.urlEntryCount, 0); // zero URL entries extracted from the invalid root
  assert.ok(codes.includes("SITEMAP_CHILD_ROOT_ATTR")); // the root-structure finding applies
  // No record-derived downstream finding is produced from the invalid record:
  assert.ok(!codes.includes("SITEMAP_UNEXPECTED_ROUTE"));
  assert.ok(!codes.includes("SITEMAP_ROUTE_EXISTS"));
  assert.ok(!codes.includes("SITEMAP_NO_DUPLICATE_LOC"));
  assert.ok(!codes.includes("SITEMAP_LOC_SHAPE"));
  assert.ok(!codes.includes("SITEMAP_URL_SET"));
  assert.ok(!codes.includes("SITEMAP_LASTMOD_ISO"));
});

// ===========================================================================
// Constants
// ===========================================================================

test("constants: production origin and 404 path are the approved values", () => {
  assert.equal(PRODUCTION_ORIGIN, "https://metawritingecology.org");
  assert.equal(NOT_FOUND_PATH, "/404/");
});
