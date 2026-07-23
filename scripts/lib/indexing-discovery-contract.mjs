// Package C — Indexing and Discovery Contracts.
//
// Bounded website route-engineering helper. This module encodes only
// deterministic indexing/discovery mechanics: the production origin, route
// path normalization, exact sitemap exclusions, route-to-source resolution,
// direct-source Git lastmod lookup, forbidden-origin detection, and syntactic
// DOI / GitHub / internal-link validation.
//
// It contains NO conceptual metadata, authority status, Registry status,
// publication status, relation status, or semantic classification. Every
// export is a mechanical engineering check. Nothing here is an MWE authority:
// the functions generate engineering validation results only and never assert
// naming, classification, public/private judgment, or relation validity.
//
// The same functions are imported by astro.config.mjs (sitemap contract),
// scripts/verify-indexing-discovery-build.mjs (post-build verifier), and
// tests/indexing-discovery.test.ts (source-level + mutation tests) so that
// real repository source, generated output, and synthetic mutation fixtures
// all run through one shared implementation.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sep as pathSep } from "node:path";

// ---------------------------------------------------------------------------
// Production origin
// ---------------------------------------------------------------------------

// The single approved production origin. Package C does not introduce any
// other public origin, preview origin, or deployment host.
export const PRODUCTION_ORIGIN = "https://metawritingecology.org";

// Default source-page directory, resolved relative to this file
// (scripts/lib/ -> ../../src/pages/). Callers may override for tests.
export const DEFAULT_PAGES_DIR = new URL("../../src/pages/", import.meta.url);

// ---------------------------------------------------------------------------
// Exact sitemap exclusions
// ---------------------------------------------------------------------------

// Exact normalized route paths that must never enter the sitemap because their
// approved robots contract is noindex. Matching is exact-path only so a
// future, similarly named route is never excluded by accident.
export const SITEMAP_EXCLUDED_PATHS = new Set([
  // noindex,nofollow application-stage prototype (no canonical, not in feed)
  "/language-pressure-test-lab-prototype/",
  // noindex,nofollow bounded public preview (self-canonical, not in feed)
  "/public-surface-map/interactive/"
]);

// Normalized path of the custom 404 / unmatched-route representation. Excluded
// from the sitemap independently of the noindex exclusion set.
export const NOT_FOUND_PATH = "/404/";

// ---------------------------------------------------------------------------
// Route path normalization
// ---------------------------------------------------------------------------

// A route path segment carries a file extension when its final non-empty
// segment contains a dot (e.g. `.json`, `.xml`, `.txt`, image/asset suffixes,
// or `security.txt` under `.well-known`). Extension-bearing paths are endpoint
// / asset routes, never trailing-slash WebPage routes.
export function hasFileExtension(routePath) {
  const last = routePath.replace(/\/+$/, "").split("/").pop() ?? "";
  return last.includes(".");
}

// Normalize an internal route reference to one canonical trailing-slash form.
//
// - `/` stays `/`;
// - a full/origin URL is reduced to its pathname;
// - query strings and fragments are dropped (they are not route identities);
// - duplicate slashes collapse to one;
// - extension-bearing endpoint/asset paths keep their exact form (no trailing
//   slash is added);
// - every other path gets exactly one trailing slash.
export function normalizeRoutePath(input) {
  if (typeof input !== "string" || input.length === 0) {
    throw new TypeError("normalizeRoutePath requires a non-empty string");
  }

  let path;
  try {
    // Absolute URL: take the pathname (URL already drops query/hash here).
    path = new URL(input).pathname;
  } catch {
    // Relative reference: strip fragment then query manually.
    path = input.split("#")[0].split("?")[0];
  }

  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");

  if (path === "/") return "/";

  const endpoint = hasFileExtension(path);
  path = path.replace(/\/+$/, "");
  if (path === "") return "/";

  return endpoint ? path : `${path}/`;
}

// ---------------------------------------------------------------------------
// Forbidden public origins
// ---------------------------------------------------------------------------

// Hosts that must never appear where a production link, canonical, sitemap
// entry, robots sitemap pointer, or machine-readable public URL is required.
const FORBIDDEN_HOST_PATTERNS = [
  /^localhost$/i,
  /(^|\.)localhost$/i,
  /^127\.0\.0\.1$/,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
  /\.workers\.dev$/i, // Cloudflare Workers preview origins
  /\.pages\.dev$/i, // Cloudflare Pages branch/commit preview origins
  /(^|[.-])preview([.-]|$)/i,
  /(^|[.-])staging([.-]|$)/i,
  /(^|[.-])deploy-preview([.-]|$)/i
];

// True when `value` is a URL (or bare host) whose host is a localhost,
// preview, feature-branch, temporary, or workers.dev origin. Context-aware:
// callers pass functional URLs, not arbitrary prose, so a page that merely
// mentions a platform name is never flagged.
export function isForbiddenPublicOrigin(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  let host;
  try {
    host = new URL(value).hostname;
  } catch {
    try {
      host = new URL(`https://${value}`).hostname;
    } catch {
      return false;
    }
  }
  return FORBIDDEN_HOST_PATTERNS.some((re) => re.test(host));
}

// Extract functional http(s) URLs from arbitrary generated text and return the
// distinct subset whose origin is forbidden. Only URL tokens are inspected, so
// explanatory prose that names a platform without linking to it is not flagged.
export function findForbiddenOriginUrls(text) {
  if (typeof text !== "string" || text.length === 0) return [];
  const tokens = text.match(/https?:\/\/[^\s"'<>)\]]+/gi) ?? [];
  const hits = [];
  for (const token of tokens) {
    const url = token.replace(/[.,;]+$/, "");
    if (isForbiddenPublicOrigin(url)) hits.push(url);
  }
  return [...new Set(hits)];
}

// ---------------------------------------------------------------------------
// Sitemap eligibility
// ---------------------------------------------------------------------------

// Decide whether a route belongs in the sitemap. Accepts a full page URL (as
// @astrojs/sitemap passes it) or a bare path. A route is eligible only when it
// is an ordinary HTML route: not noindex, not an extension-bearing endpoint or
// asset, not the 404 representation, and not in the exact exclusion set.
export function isSitemapEligible(
  input,
  { excluded = SITEMAP_EXCLUDED_PATHS, noindex = false } = {}
) {
  const path = normalizeRoutePath(input);
  if (noindex) return false;
  if (hasFileExtension(path)) return false; // JSON / XML / txt / asset endpoints
  if (path === NOT_FOUND_PATH) return false; // unmatched-route representation
  if (excluded.has(path)) return false; // exact noindex exclusions
  return true;
}

// Deterministic set-level sitemap URL contract. Shared by the post-build
// verifier and the mutation tests so real generated output and synthetic
// fixtures run through identical logic. Returns an array of { code, loc }
// findings (empty when the URL set satisfies the contract).
export function sitemapUrlSetViolations(locs) {
  const findings = [];
  const seen = new Set();
  for (const loc of locs) {
    let url;
    try {
      url = new URL(loc);
    } catch {
      findings.push({ code: "SITEMAP_URL_PARSE", loc });
      continue;
    }
    if (isForbiddenPublicOrigin(loc)) {
      findings.push({ code: "SITEMAP_FORBIDDEN_ORIGIN", loc });
    }
    if (url.origin !== PRODUCTION_ORIGIN) {
      findings.push({ code: "SITEMAP_URL_ORIGIN", loc });
    }
    const normalized = normalizeRoutePath(url.pathname);
    if (url.pathname !== normalized) {
      findings.push({ code: "SITEMAP_URL_NOT_NORMALIZED", loc });
    }
    if (!isSitemapEligible(url.pathname)) {
      findings.push({ code: "SITEMAP_URL_NOT_ELIGIBLE", loc });
    }
    if (SITEMAP_EXCLUDED_PATHS.has(normalized) || normalized === NOT_FOUND_PATH) {
      findings.push({ code: "SITEMAP_URL_EXCLUDED", loc });
    }
    if (seen.has(normalized)) {
      findings.push({ code: "SITEMAP_URL_DUPLICATE", loc });
    }
    seen.add(normalized);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Route-to-source resolution
// ---------------------------------------------------------------------------

// Fatal, deterministic route-resolution error carrying a stable code so both
// the build and the tests can distinguish unsafe input and ambiguous source
// resolution from an ordinary unsupported (null) route.
export class RouteResolutionError extends Error {
  constructor(code, message, routePath) {
    super(message);
    this.name = "RouteResolutionError";
    this.code = code;
    this.routePath = routePath;
  }
}

// Reject unsafe route input BEFORE any filesystem resolution. Fails closed on
// traversal, separator, encoding, query/fragment, control, and non-root-relative
// forms so a malicious or malformed route can never reach a filesystem lookup.
export function assertSafeRoutePath(routePath) {
  const fail = (code, message) => {
    throw new RouteResolutionError(code, message, routePath);
  };
  if (typeof routePath !== "string" || routePath.length === 0) {
    fail("ROUTE_INPUT_INVALID", "route path must be a non-empty string");
  }
  if (routePath.includes("\0")) fail("ROUTE_INPUT_NUL", "route path contains a NUL byte");
  if (/[\u0000-\u001f\u007f]/.test(routePath)) {
    fail("ROUTE_INPUT_CONTROL", "route path contains a control character");
  }
  if (/\s/.test(routePath)) fail("ROUTE_INPUT_WHITESPACE", "route path contains whitespace");
  if (!routePath.startsWith("/")) {
    fail("ROUTE_INPUT_NOT_ROOT_RELATIVE", "route path must be root-relative");
  }
  if (routePath.includes("\\")) fail("ROUTE_UNSAFE_BACKSLASH", "route path contains a backslash");
  if (routePath.includes("?") || routePath.includes("#")) {
    fail("ROUTE_UNSAFE_QUERY_FRAGMENT", "route path contains a query string or fragment");
  }
  if (/%2f|%5c/i.test(routePath)) {
    fail("ROUTE_UNSAFE_ENCODED_SEPARATOR", "route path contains an encoded slash or backslash");
  }
  if (/%2e/i.test(routePath)) {
    fail("ROUTE_UNSAFE_ENCODED_DOT", "route path contains an encoded dot");
  }
  if (routePath.split("/").some((s) => s === "." || s === "..")) {
    fail("ROUTE_UNSAFE_TRAVERSAL", "route path contains a . or .. segment");
  }
}

// True when `filePath` resolves at or beneath `rootPath`.
function isBeneath(rootPath, filePath) {
  const root = rootPath.endsWith(pathSep) ? rootPath : rootPath + pathSep;
  return filePath === rootPath || filePath.startsWith(root);
}

// Map a public route path back to its direct source page file. Supports the
// actual page-source forms in the repository: `.astro`, `.md`, `.mdx`, nested
// `index` routes, fiction child routes, and Chinese (`/zh/...`) routes.
//
// Fails closed:
// - unsafe route input throws a RouteResolutionError (ROUTE_UNSAFE_*);
// - a candidate escaping pagesDir throws (ROUTE_ESCAPES_PAGES_DIR);
// - zero existing candidates returns null (ordinary unsupported route);
// - exactly one existing candidate returns its path;
// - more than one existing candidate throws (ROUTE_AMBIGUOUS_SOURCE) rather
//   than silently selecting the first.
export function resolveRouteSource(
  routePath,
  { pagesDir = DEFAULT_PAGES_DIR, existsFn = existsSync } = {}
) {
  assertSafeRoutePath(routePath);
  const normalized = normalizeRoutePath(routePath);
  const segment = normalized.replace(/^\/+|\/+$/g, "");
  const bases = segment === "" ? ["index"] : [segment, `${segment}/index`];
  const extensions = [".astro", ".md", ".mdx"];

  const pagesRoot = fileURLToPath(pagesDir);
  const matches = [];
  for (const base of bases) {
    for (const ext of extensions) {
      const fileUrl = new URL(`${base}${ext}`, pagesDir);
      const filePath = fileURLToPath(fileUrl);
      if (!isBeneath(pagesRoot, filePath)) {
        throw new RouteResolutionError(
          "ROUTE_ESCAPES_PAGES_DIR",
          `resolved candidate escapes pages dir: ${filePath}`,
          routePath
        );
      }
      if (existsFn(fileUrl)) matches.push(filePath);
    }
  }

  const unique = [...new Set(matches)];
  if (unique.length === 0) return null;
  if (unique.length > 1) {
    throw new RouteResolutionError(
      "ROUTE_AMBIGUOUS_SOURCE",
      `multiple source candidates for ${normalized}: ${unique.join(", ")}`,
      routePath
    );
  }
  return unique[0];
}

// ---------------------------------------------------------------------------
// Direct-source Git lastmod
// ---------------------------------------------------------------------------

// Default Git runner. Isolated so tests can inject a runner bound to a
// temporary repository (or a failing runner) without touching real Git state.
function defaultRunGit(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  });
}

// Return the committer date of the latest commit affecting ONLY the given
// direct source file, as an ISO 8601 string, or undefined.
//
// Deterministic omission (never a filesystem-mtime fallback) when:
// - Git is unavailable;
// - the source file is untracked;
// - the direct source has no reachable history;
// - a shallow checkout lacks the required commit data.
//
// This intentionally reflects only the route's own source file. Shared
// layouts, components, styles, data, tests, package files, CI files, and
// unrelated commits never propagate into a route's lastmod.
export function readDirectSourceLastmod(file, { runGit = defaultRunGit } = {}) {
  if (!file) return undefined;

  let out;
  try {
    out = runGit(["log", "-1", "--format=%cI", "--", file]);
  } catch {
    return undefined; // git missing, or command failed
  }

  const trimmed = (out ?? "").trim();
  if (!trimmed) return undefined; // untracked / no reachable history / shallow

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return trimmed;
}

// ---------------------------------------------------------------------------
// DOI syntax (structure only)
// ---------------------------------------------------------------------------

// Validate DOI STRUCTURE only. Accepts a bare DOI or a doi.org URL. Makes no
// network request and asserts nothing about publication validity, authority,
// OSF status, or resolution -- it checks the `10.<registrant>/<suffix>` shape
// and nothing more.
//
// Rejects whitespace/control characters, and -- for the URL form -- userinfo,
// explicit ports, query strings, fragments, and non-doi.org hosts. Rejects a
// malformed registrant prefix and a missing suffix.
export function isValidDoi(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  if (/[\u0000-\u0020\u007f]/.test(value)) return false; // whitespace / control

  let doi = value;
  if (/^https?:\/\//i.test(doi)) {
    let url;
    try {
      url = new URL(doi);
    } catch {
      return false;
    }
    if (url.username || url.password) return false;
    if (url.port) return false;
    if (url.search || url.hash) return false;
    if (!/^(?:dx\.)?doi\.org$/i.test(url.hostname)) return false;
    doi = url.pathname.replace(/^\/+/, "");
  }

  return /^10\.\d{4,9}\/[^\s?#]+$/.test(doi);
}

// ---------------------------------------------------------------------------
// GitHub source-link syntax (bounded allowlist + stable-ref policy)
// ---------------------------------------------------------------------------

// Bounded allowlist derived from current approved public source. This is a
// syntactic link contract, not a statement of repository authority.
export const ALLOWED_GITHUB_REPOS = new Set([
  "metawritingecology/meta-writing-ecology"
]);

// Refs treated as stable public source anchors. A full 40-hex immutable commit
// SHA is also accepted for blob/tree source links (it is an immutable source
// reference, not a mutable preview). Mutable feature-branch refs are rejected.
export const STABLE_GITHUB_REFS = new Set(["main"]);

// Validate a GitHub repository/file reference syntactically:
// - HTTPS only;
// - host github.com; no userinfo, no explicit port;
// - owner (or owner/repo) within the bounded allowlist;
// - blob/tree links must use a stable ref (main) or a full 40-hex immutable
//   commit SHA — never a mutable feature branch;
// - blob/tree source paths must contain no . or .. traversal segment.
// No network request is made and no repository authority is inferred.
export function isValidGithubSourceUrl(
  value,
  { allowedRepos = ALLOWED_GITHUB_REPOS, stableRefs = STABLE_GITHUB_REFS } = {}
) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.hostname !== "github.com") return false;
  if (url.username || url.password) return false;
  if (url.port) return false;

  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (parts.length === 0) return false;

  const owners = new Set(
    [...allowedRepos].map((repo) => repo.split("/")[0])
  );

  if (parts.length === 1) {
    // Organization / owner root.
    return owners.has(parts[0]);
  }

  const repo = `${parts[0]}/${parts[1]}`;
  if (!allowedRepos.has(repo)) return false;
  if (parts.length === 2) return true; // repository root

  const kind = parts[2];
  if (kind !== "blob" && kind !== "tree") return false;

  // A blob/tree SOURCE link forbids query/fragment and any encoded traversal,
  // encoded separator, literal backslash, or duplicate slash in the raw path.
  if (url.search || url.hash) return false;
  if (/%2e|%2f|%5c/i.test(url.pathname)) return false;
  if (url.pathname.includes("\\")) return false;
  if (/\/\//.test(url.pathname)) return false;

  const ref = parts[3];
  if (!ref) return false;
  const isImmutableSha = /^[0-9a-f]{40}$/i.test(ref);
  if (!isImmutableSha && !stableRefs.has(ref)) return false; // mutable feature branch

  // A blob/tree SOURCE link must carry at least one non-empty, safe source-path
  // segment after the ref. A bare `blob/main` or `blob/main/` (no path) is NOT a
  // valid source link in any destination context — it is accepted only as the
  // exact bounded sourceRepoBase declaration (isApprovedSourceRepoBaseDeclaration).
  const sourceSegments = parts.slice(4);
  if (sourceSegments.length === 0) return false;
  if (sourceSegments.some((s) => s === "" || s === "." || s === "..")) return false;
  return true;
}

// The single approved bare repository-at-ref base. It is a concatenation PREFIX
// used to construct actual file URLs, not a standalone public destination.
export const APPROVED_SOURCE_REPO_BASE =
  "https://github.com/metawritingecology/meta-writing-ecology/blob/main";
export const APPROVED_SOURCE_REPO_BASE_FILE = "src/data/diagnosticEntries.ts";
export const APPROVED_SOURCE_REPO_BASE_IDENTIFIER = "sourceRepoBase";

// Classify the RAW initializer text of a sourceRepoBase declaration into one of
// the bounded kinds. `undefined`/empty means the declaration has no initializer
// (missing). No expression is evaluated.
export function classifyRepoBaseInitializer(rawInit) {
  if (rawInit === undefined) return { initializerKind: "missing" };
  const init = String(rawInit).trim();
  if (init === "") return { initializerKind: "missing" };
  if (init.startsWith("`")) return { initializerKind: "template" };
  const literal = init.match(/^["']([^"']*)["']$/);
  if (literal) {
    const value = literal[1];
    if (/^https?:\/\//.test(value)) {
      return {
        initializerKind: value === APPROVED_SOURCE_REPO_BASE ? "approved-literal" : "other-literal",
        value
      };
    }
    return { initializerKind: "other-literal", value };
  }
  if (/["'`]/.test(init)) return { initializerKind: "unsupported" }; // has quotes but not a clean literal
  return { initializerKind: "dynamic" };
}

// Accept the bare repository-at-ref base ONLY as its exact bounded declaration:
// a `github-base-declaration-evidence` occurrence whose keyword is exactly
// `const`, whose initializer is a direct approved literal string, whose
// identifier is `sourceRepoBase`, in exactly src/data/diagnosticEntries.ts, and
// whose value equals the approved base exactly. The declaration keyword and
// initializer kind are load-bearing — a `let`/`var` literal, an uninitialized
// declaration, or a dynamic/template initializer is never approved. Matching the
// URL string alone is never sufficient.
export function isApprovedSourceRepoBaseDeclaration(occurrence) {
  if (!occurrence || typeof occurrence !== "object") return false;
  const file = String(occurrence.file ?? "")
    .split("\\")
    .join("/")
    .replace(/^\.?\/+/, "");
  return (
    occurrence.kind === "github-base-declaration-evidence" &&
    occurrence.keyword === "const" &&
    occurrence.initializerKind === "approved-literal" &&
    occurrence.identifier === APPROVED_SOURCE_REPO_BASE_IDENTIFIER &&
    (file === APPROVED_SOURCE_REPO_BASE_FILE || file.endsWith(`/${APPROVED_SOURCE_REPO_BASE_FILE}`)) &&
    occurrence.value === APPROVED_SOURCE_REPO_BASE
  );
}

// Validate the RAW literal suffix of a `${sourceRepoBase}<suffix>` composition
// BEFORE any URL is constructed, so URL parsing cannot erase unsafe spelling.
// Returns { ok: boolean, code? }.
export function validateRepoBaseSuffix(suffix) {
  if (typeof suffix !== "string") return { ok: false, code: "SUFFIX_INVALID" };
  if (/\$\{/.test(suffix)) return { ok: false, code: "SUFFIX_DYNAMIC" }; // additional interpolation
  if (suffix.length === 0) return { ok: false, code: "SUFFIX_EMPTY" };
  if (/[\u0000-\u001f\u007f]/.test(suffix)) return { ok: false, code: "SUFFIX_CONTROL" };
  if (/\s/.test(suffix)) return { ok: false, code: "SUFFIX_WHITESPACE" };
  if (!suffix.startsWith("/")) return { ok: false, code: "SUFFIX_NO_LEADING_SLASH" };
  if (suffix === "/") return { ok: false, code: "SUFFIX_SLASH_ONLY" };
  if (suffix.includes("\\")) return { ok: false, code: "SUFFIX_BACKSLASH" };
  if (/%2e|%2f|%5c/i.test(suffix)) return { ok: false, code: "SUFFIX_ENCODED_SEPARATOR" };
  if (/%(?![0-9a-fA-F]{2})/.test(suffix)) return { ok: false, code: "SUFFIX_BAD_PERCENT" };
  if (suffix.includes("?")) return { ok: false, code: "SUFFIX_QUERY" };
  if (suffix.includes("#")) return { ok: false, code: "SUFFIX_FRAGMENT" };
  if (suffix.includes("@")) return { ok: false, code: "SUFFIX_USERINFO" };
  if (/\/\//.test(suffix)) return { ok: false, code: "SUFFIX_DUP_SLASH" };
  if (suffix.split("/").some((s) => s === "." || s === "..")) return { ok: false, code: "SUFFIX_TRAVERSAL" };
  return { ok: true };
}

// Classify a GitHub functional-URL OCCURRENCE in context. Returns:
// - "not-github" when the value is neither a github.com URL nor a composition;
// - "base-declaration" only for the exact approved sourceRepoBase declaration;
// - "composition" for a valid bounded `${sourceRepoBase}<suffix>` composition
//   associated with the approved declaration in its own file AND whose raw
//   suffix and resolved URL both pass validation;
// - "source" when it is a valid literal source/root URL (destination-safe);
// - "invalid" otherwise (e.g. a bare blob/main in any destination context, or a
//   composition with an unsafe suffix or no approved declaration binding).
//
// `hasApprovedBaseDeclaration` is the bounded same-file association result
// computed by validateInventory; a composition never resolves without it.
export function classifyGithubOccurrence(occurrence, options = {}) {
  const { hasApprovedBaseDeclaration = false, allowedRepos, stableRefs } = options;
  const ghOpts = {};
  if (allowedRepos) ghOpts.allowedRepos = allowedRepos;
  if (stableRefs) ghOpts.stableRefs = stableRefs;

  if (occurrence?.kind === "github-template-composition") {
    if (!hasApprovedBaseDeclaration) return "invalid"; // no approved declaration binding
    const suffixResult = validateRepoBaseSuffix(occurrence.suffix);
    if (!suffixResult.ok) return "invalid";
    const resolved = `${APPROVED_SOURCE_REPO_BASE}${occurrence.suffix}`;
    return isValidGithubSourceUrl(resolved, ghOpts) ? "composition" : "invalid";
  }

  const value = occurrence?.value;
  if (typeof value !== "string" || !/^https:\/\/github\.com\//.test(value)) return "not-github";
  if (isApprovedSourceRepoBaseDeclaration(occurrence)) return "base-declaration";
  if (isValidGithubSourceUrl(value, ghOpts)) return "source";
  return "invalid";
}

// ---------------------------------------------------------------------------
// Internal link classification and validation
// ---------------------------------------------------------------------------

// Classify a raw href / markdown link target.
// Returns { type, routePath, fragment } where type is one of:
// - "internal" (a same-site absolute path, possibly with a fragment);
// - "internal-fragment" (a bare `#fragment` on the current page);
// - "external" (any other scheme/host, mailto, tel, protocol-relative);
// - "ignored" (empty or non-navigational).
export function classifyInternalLink(href) {
  if (typeof href !== "string" || href.length === 0) {
    return { type: "ignored", routePath: null, fragment: null };
  }

  if (href.startsWith("#")) {
    return { type: "internal-fragment", routePath: null, fragment: href.slice(1) };
  }

  // Absolute production-origin URLs are internal; other absolute URLs,
  // mailto/tel, and protocol-relative URLs are external.
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) {
    try {
      const url = new URL(href);
      if (url.origin === PRODUCTION_ORIGIN) {
        return {
          type: "internal",
          routePath: normalizeRoutePath(url.pathname),
          fragment: url.hash ? url.hash.slice(1) : null
        };
      }
    } catch {
      // fall through to external
    }
    return { type: "external", routePath: null, fragment: null };
  }

  if (!href.startsWith("/")) {
    // Relative in-page or mail-like references are out of scope here.
    return { type: "ignored", routePath: null, fragment: null };
  }

  const [pathPart, fragment = null] = href.split("#");
  return {
    type: "internal",
    routePath: normalizeRoutePath(pathPart),
    fragment: fragment && fragment.length > 0 ? fragment : null
  };
}

// Extract internal link references from a source file's text. Covers Markdown
// link syntax `](/path)` and HTML/JSX `href="/path"` / `href:"/path"` forms.
export function extractInternalLinks(text) {
  if (typeof text !== "string") return [];
  const found = [];

  const markdown = /\]\((\/[^)\s]*)\)/g;
  const attr = /href\s*[=:]\s*["'](\/[^"'\s]*)["']/g;

  for (const re of [markdown, attr]) {
    let match;
    while ((match = re.exec(text)) !== null) {
      found.push(match[1]);
    }
  }
  return found;
}

// GitHub-slugger-compatible heading slug (matches Astro's default rehype slug
// behavior closely enough for deterministic anchor validation): lowercase,
// strip characters outside word/space/hyphen, collapse spaces to hyphens.
export function headingSlug(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

// Collect the stable heading-anchor ids a Markdown source would expose.
export function markdownHeadingSlugs(markdown) {
  if (typeof markdown !== "string") return new Set();
  const slugs = new Set();
  const seen = new Map();
  for (const line of markdown.split("\n")) {
    const m = line.match(/^#{1,6}\s+(.*\S)\s*$/);
    if (!m) continue;
    let slug = headingSlug(m[1]);
    if (!slug) continue;
    // github-slugger disambiguates repeats with a numeric suffix.
    if (seen.has(slug)) {
      const next = seen.get(slug) + 1;
      seen.set(slug, next);
      slug = `${slug}-${next}`;
    } else {
      seen.set(slug, 0);
    }
    slugs.add(slug);
  }
  return slugs;
}

// Validate a set of internal links against a set of known normalized routes.
// Returns an array of deterministic finding objects (empty when all valid).
// `knownFragments` optionally maps a normalized route path to a Set of stable
// anchor ids; fragments are only checked for routes present in that map.
// `assetExists` optionally validates extension-bearing internal references
// (e.g. `/favicon.png`, `/robots.txt`) against static assets rather than the
// route set; when omitted, extension paths are not treated as broken routes.
export function validateInternalLinks(
  links,
  knownRoutes,
  { knownFragments = new Map(), assetExists = null } = {}
) {
  const findings = [];
  for (const raw of links) {
    const { type, routePath, fragment } = classifyInternalLink(raw);
    if (type !== "internal") continue;

    // Asset / endpoint references are not WebPage routes.
    if (hasFileExtension(routePath)) {
      if (assetExists && !assetExists(routePath)) {
        findings.push({
          code: "INTERNAL_ASSET_MISSING",
          href: raw,
          routePath,
          message: `internal asset does not exist: ${routePath}`
        });
      }
      continue;
    }

    if (!knownRoutes.has(routePath)) {
      findings.push({
        code: "INTERNAL_ROUTE_MISSING",
        href: raw,
        routePath,
        message: `internal link target route does not exist: ${routePath}`
      });
      continue;
    }

    if (fragment && knownFragments.has(routePath)) {
      const anchors = knownFragments.get(routePath);
      if (!anchors.has(fragment)) {
        findings.push({
          code: "INTERNAL_FRAGMENT_MISSING",
          href: raw,
          routePath,
          fragment,
          message: `internal fragment #${fragment} not found on ${routePath}`
        });
      }
    }
  }
  return findings;
}

// Validate a complete functional-URL inventory in one pass, applying internal
// route/asset/fragment validation to same-site destinations AND forbidden-origin
// validation to external destinations, and GitHub CONTEXT validation to GitHub
// destinations. This is the single validation path used by both the real
// repository scan and the mutation fixtures. Occurrence context (file, kind,
// identifier) is preserved through validation and is NOT deduplicated to unique
// URL strings before validating — a bare repository-at-ref base is accepted only
// as the exact sourceRepoBase declaration, and fails in every destination
// context. Explanatory prose that merely mentions a platform is never extracted
// as a functional value and therefore never flagged.
//
// Accepts either occurrence objects ({ value, kind, file, identifier, line })
// or bare string values (treated as unknown-kind occurrences).
const normInventoryFile = (file) =>
  String(file ?? "")
    .split("\\")
    .join("/")
    .replace(/^\.?\/+/, "");

// Collect, per file, ALL sourceRepoBase declaration occurrences (the
// authoritative `github-base-declaration-evidence` occurrences — const/let/var,
// initialized or not). Returns Map<file, occ[]>.
function sourceRepoBaseDeclarationsByFile(occurrenceObjects) {
  const byFile = new Map();
  for (const occ of occurrenceObjects) {
    if (occ.kind !== "github-base-declaration-evidence") continue;
    if (occ.identifier !== APPROVED_SOURCE_REPO_BASE_IDENTIFIER) continue;
    const file = normInventoryFile(occ.file);
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(occ);
  }
  return byFile;
}

// Determine, per file, whether a bounded `${sourceRepoBase}` composition may
// resolve. Binding depends on declaration OCCURRENCE COUNT, not distinct value
// count. A file binds ONLY when it is exactly the approved file AND contains
// EXACTLY ONE sourceRepoBase declaration occurrence AND that single occurrence
// is the approved `const` literal declaration (keyword const, initializer kind
// approved-literal, exact value). A `let`/`var` literal, an uninitialized
// declaration, a dynamic/template/wrong-value initializer, or any second/
// duplicate declaration prevents binding. Returns a Set of binding files.
function approvedBaseDeclarationFiles(occurrenceObjects) {
  const byFile = sourceRepoBaseDeclarationsByFile(occurrenceObjects);
  const result = new Set();
  for (const [file, decls] of byFile) {
    if (decls.length !== 1) continue; // zero, or multiple/redeclared -> ambiguous
    if (isApprovedSourceRepoBaseDeclaration(decls[0])) result.add(file);
  }
  return result;
}

export function validateInventory(
  occurrences,
  { knownRoutes = new Set(), assetExists = null, knownFragments = new Map(), githubOptions = {} } = {}
) {
  const findings = [];
  const values = [];
  const objects = occurrences.map((raw) =>
    typeof raw === "string" ? { value: raw, kind: "unknown" } : raw
  );
  const baseFiles = approvedBaseDeclarationFiles(objects);

  for (const occ of objects) {
    // Bounded ${sourceRepoBase} template composition.
    if (occ.kind === "github-template-composition") {
      const hasApprovedBaseDeclaration = baseFiles.has(normInventoryFile(occ.file));
      const status = classifyGithubOccurrence(occ, { ...githubOptions, hasApprovedBaseDeclaration });
      if (status !== "composition") {
        const suffixResult = validateRepoBaseSuffix(occ.suffix);
        findings.push({
          code: "GITHUB_INVALID_COMPOSITION",
          href: occ.value,
          rawValue: occ.rawValue,
          suffix: occ.suffix,
          file: occ.file,
          line: occ.line,
          reason: !hasApprovedBaseDeclaration
            ? "NO_APPROVED_DECLARATION"
            : suffixResult.code ?? "RESOLVED_URL_INVALID",
          message: `invalid ${occ.identifier ?? "sourceRepoBase"} composition: ${occ.rawValue ?? occ.value}`
        });
      }
      continue;
    }

    // sourceRepoBase declaration evidence is declaration metadata, not a
    // rendered destination; it drives binding (above) and is never validated as
    // a GitHub destination even when its literal value is a github.com URL.
    if (occ.kind === "github-base-declaration-evidence") continue;

    values.push(occ.value);

    if (typeof occ.value === "string" && /^https:\/\/github\.com\//.test(occ.value)) {
      const status = classifyGithubOccurrence(occ, githubOptions);
      if (status === "invalid") {
        findings.push({
          code: "GITHUB_INVALID_DESTINATION",
          href: occ.value,
          file: occ.file,
          line: occ.line,
          kind: occ.kind,
          message: `invalid GitHub destination (${occ.kind ?? "unknown"}): ${occ.value}`
        });
      }
      continue; // GitHub handled here; it is neither an internal route nor a forbidden origin
    }

    const { type } = classifyInternalLink(occ.value);
    if (type === "external" && isForbiddenPublicOrigin(occ.value)) {
      findings.push({
        code: "FORBIDDEN_ORIGIN",
        href: occ.value,
        file: occ.file,
        message: `forbidden functional origin: ${occ.value}`
      });
    }
  }
  // Internal route / asset / fragment validation over all non-composition values.
  findings.push(...validateInternalLinks(values, knownRoutes, { assetExists, knownFragments }));
  return findings;
}

// Categorize GitHub-related occurrences using the SAME production binding
// (same-file approved-declaration association) as validateInventory. Returns
// separate, truthful accounting categories. Declaration accounting is
// OCCURRENCE-level and keyword/initializer-aware:
// - declarationOccurrences: every sourceRepoBase declaration occurrence;
// - approvedConstLiteral: keyword const + approved-literal initializer, in the
//   approved file, exact value (the only kind that can bind);
// - mutableLiteral: let/var with a literal initializer;
// - uninitialized: no initializer (initializerKind "missing");
// - dynamicTemplateUnsupported: dynamic/template/unsupported initializer;
// - ambiguousDeclarationEvidence: every non-approved declaration;
// - approvedBaseFiles: files whose single declaration is the approved one.
export function classifyGithubInventory(occurrences, { githubOptions = {} } = {}) {
  const objects = occurrences.map((raw) =>
    typeof raw === "string" ? { value: raw, kind: "unknown" } : raw
  );
  const baseFiles = approvedBaseDeclarationFiles(objects);
  const categories = {
    source: [],
    baseDeclaration: [],
    composition: [],
    invalid: [],
    notGithub: [],
    declarationOccurrences: [],
    approvedConstLiteral: [],
    mutableLiteral: [],
    uninitialized: [],
    dynamicTemplateUnsupported: [],
    ambiguousDeclarationEvidence: [],
    approvedBaseFiles: [...baseFiles]
  };
  for (const occ of objects) {
    if (occ.kind === "github-base-declaration-evidence") {
      categories.declarationOccurrences.push(occ);
      if (isApprovedSourceRepoBaseDeclaration(occ)) {
        categories.approvedConstLiteral.push(occ);
        categories.baseDeclaration.push(occ);
      } else {
        categories.ambiguousDeclarationEvidence.push(occ);
        const literal =
          occ.initializerKind === "approved-literal" || occ.initializerKind === "other-literal";
        if (occ.initializerKind === "missing") categories.uninitialized.push(occ);
        else if (literal && (occ.keyword === "let" || occ.keyword === "var")) {
          categories.mutableLiteral.push(occ);
        } else {
          categories.dynamicTemplateUnsupported.push(occ);
        }
      }
      continue;
    }
    if (occ.kind === "github-template-composition") {
      const hasApprovedBaseDeclaration = baseFiles.has(normInventoryFile(occ.file));
      const status = classifyGithubOccurrence(occ, { ...githubOptions, hasApprovedBaseDeclaration });
      (status === "composition" ? categories.composition : categories.invalid).push(occ);
      continue;
    }
    const status = classifyGithubOccurrence(occ, githubOptions);
    if (status === "not-github") categories.notGithub.push(occ);
    else if (status === "base-declaration") categories.baseDeclaration.push(occ);
    else if (status === "source") categories.source.push(occ);
    else categories.invalid.push(occ);
  }
  return categories;
}

// Collect internal functional fragment references (a same-site link carrying a
// `#fragment`) from extracted functional values or occurrences. Used to record
// how many deterministically checkable fragments actually exist in the repo.
export function collectFunctionalFragments(items) {
  const out = [];
  for (const raw of items) {
    const value = typeof raw === "string" ? raw : raw?.value;
    const { type, routePath, fragment } = classifyInternalLink(value);
    if (type === "internal" && fragment) out.push({ href: value, routePath, fragment });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Raw sitemap-URL shape (checked BEFORE URL normalization)
// ---------------------------------------------------------------------------

// Validate the exact raw spelling of a sitemap page <loc> value, fail-closed,
// before any URL normalization can mask a malformed value. Returns an array of
// { code, loc } findings (empty when the raw value is an exact production URL:
// PRODUCTION_ORIGIN + normalized route path, and nothing else).
export function rawSitemapLocViolations(loc) {
  const findings = [];
  const add = (code) => findings.push({ code, loc });
  if (typeof loc !== "string" || loc.length === 0) {
    add("LOC_EMPTY");
    return findings;
  }
  if (/\s/.test(loc)) add("LOC_WHITESPACE");
  if (loc.includes("\\")) add("LOC_BACKSLASH");
  if (/%2f|%5c/i.test(loc)) add("LOC_ENCODED_SEPARATOR");
  if (/%2e/i.test(loc)) add("LOC_ENCODED_DOT");
  if (loc.includes("?")) add("LOC_QUERY");
  if (loc.includes("#")) add("LOC_FRAGMENT");
  if (/\/\.\.?(?:\/|$)/.test(loc)) add("LOC_DOT_SEGMENT");
  if (/[^:]\/\//.test(loc)) add("LOC_DUP_SLASH"); // duplicate slash, not scheme's ://
  // Explicit port in the authority (URL would silently drop a default :443).
  if (/^https?:\/\/[^/]*:\d+/i.test(loc)) add("LOC_PORT");

  let url;
  try {
    url = new URL(loc);
  } catch {
    add("LOC_UNPARSEABLE");
    return findings;
  }
  if (url.username || url.password) add("LOC_USERINFO");
  if (url.port) add("LOC_PORT");
  if (url.origin !== PRODUCTION_ORIGIN) add("LOC_ORIGIN");

  let normalized;
  try {
    normalized = normalizeRoutePath(url.pathname);
  } catch {
    add("LOC_UNNORMALIZABLE");
    return findings;
  }
  // Exact serialized spelling: origin + normalized route, nothing else.
  if (loc !== `${PRODUCTION_ORIGIN}${normalized}`) add("LOC_NOT_EXACT");
  return findings;
}

// Validate the exact raw spelling of a sitemap-index child <loc> value. Each
// child must be an exact production URL for a `sitemap-<n>.xml` file. Returns an
// array of { code, loc } findings.
export function rawChildLocViolations(loc) {
  const findings = [];
  const add = (code) => findings.push({ code, loc });
  if (typeof loc !== "string" || loc.length === 0) {
    add("CHILD_EMPTY");
    return findings;
  }
  if (/\s/.test(loc)) add("CHILD_WHITESPACE");
  if (loc.includes("\\")) add("CHILD_BACKSLASH");
  if (/%2f|%5c/i.test(loc)) add("CHILD_ENCODED_SEPARATOR");
  if (/%2e/i.test(loc)) add("CHILD_ENCODED_DOT");
  if (loc.includes("?")) add("CHILD_QUERY");
  if (loc.includes("#")) add("CHILD_FRAGMENT");
  if (/\/\.\.?(?:\/|$)/.test(loc)) add("CHILD_DOT_SEGMENT");
  if (/[^:]\/\//.test(loc)) add("CHILD_DUP_SLASH");
  if (/^https?:\/\/[^/]*:\d+/i.test(loc)) add("CHILD_PORT");

  let url;
  try {
    url = new URL(loc);
  } catch {
    add("CHILD_UNPARSEABLE");
    return findings;
  }
  if (url.username || url.password) add("CHILD_USERINFO");
  if (url.port) add("CHILD_PORT");
  if (url.origin !== PRODUCTION_ORIGIN) add("CHILD_ORIGIN");

  const name = url.pathname.replace(/^\/+/, "");
  if (!/^sitemap-\d+\.xml$/.test(name)) add("CHILD_FILENAME_SHAPE");
  if (loc !== `${PRODUCTION_ORIGIN}/${name}`) add("CHILD_NOT_EXACT");
  return findings;
}

// The safe basename of a child sitemap, or null when the child location is not
// an exact production sitemap-<n>.xml URL. Used to resolve the child file
// beneath dist without trusting a raw path.
export function childSitemapBasename(loc) {
  if (rawChildLocViolations(loc).length > 0) return null;
  return new URL(loc).pathname.replace(/^\/+/, "");
}

// ---------------------------------------------------------------------------
// Feed content / MIME signatures (filename-independent)
// ---------------------------------------------------------------------------

// Detect actual RSS / Atom / feed signatures in source or generated text,
// regardless of filename. Ordinary XML (a sitemap urlset/sitemapindex) carries
// none of these signatures and is not flagged. Returns { code } findings.
export function findFeedSignatures(text) {
  const findings = [];
  const add = (code) => findings.push({ code });
  if (typeof text !== "string" || text.length === 0) return findings;
  if (/@astrojs\/rss/.test(text)) add("FEED_RSS_IMPORT");
  if (/application\/rss\+xml/i.test(text)) add("FEED_RSS_MIME");
  if (/application\/atom\+xml/i.test(text)) add("FEED_ATOM_MIME");
  if (/<rss[\s>]/i.test(text)) add("FEED_RSS_ROOT");
  if (/http:\/\/www\.w3\.org\/2005\/Atom/i.test(text)) add("FEED_ATOM_NAMESPACE");
  if (/rel=["']alternate["'][^>]*type=["']application\/(?:rss|atom)\+xml["']/i.test(text)) {
    add("FEED_DISCOVERY_LINK");
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Functional-URL inventory extraction (bounded, static)
// ---------------------------------------------------------------------------

// Extract bounded functional URL forms from a source file's text, PRESERVING
// occurrence context. Supports literal variable declarations
// (`const id = "url"`), Markdown links/images, literal HTML/JSX href/src, literal
// object properties (href/src/url/route/path), structured route-map tuples, and
// plain production/GitHub/DOI autolink URLs. Only literal URL/path values are
// returned (values starting with `/` or `http(s)://`); dynamic/interpolated
// expressions that cannot be resolved statically are ignored.
//
// Returns [{ value, kind, line, identifier? }]. Occurrences are NOT collapsed to
// unique URL strings — a URL is reported once per functional occurrence so that
// context-sensitive validation (e.g. a bare repository-at-ref base accepted only
// as its declaration) can see the kind and identifier. An autolink URL that
// falls inside a structured occurrence (e.g. the URL of a declaration or
// markdown link) is claimed by that structured occurrence and not re-emitted.
export function extractFunctionalUrls(text) {
  if (typeof text !== "string" || text.length === 0) return [];
  const results = [];
  const seen = new Set();
  const claimed = []; // [start, end) text ranges claimed by structured patterns
  const lineOf = (index) => text.slice(0, index).split("\n").length;

  const add = (value, kind, index, identifier) => {
    if (typeof value !== "string") return;
    if (!/^(?:https?:\/\/|\/)/.test(value)) return; // functional URL/path only
    const line = lineOf(index);
    // Identity is the SOURCE OFFSET of the occurrence, not line/value — two
    // distinct source occurrences (even identical text on the same line) are
    // kept as two records; only the exact same offset (one match) dedupes.
    const key = `${kind}@${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    const occ = { value, kind, line, offset: index };
    if (identifier !== undefined) occ.identifier = identifier;
    results.push(occ);
  };

  // Structured patterns. `vg` = value capture group, `ig` = identifier group.
  const structured = [
    // Literal variable declaration: const/let/var id = "url"
    {
      re: /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*["'](https?:\/\/[^"']+)["']/g,
      kind: "declaration",
      vg: 2,
      ig: 1
    },
    // Markdown links and images: [text](URL) / ![alt](URL)
    { re: /!?\[[^\]]*\]\(\s*([^)\s]+?)(?:\s+["'][^"']*["'])?\s*\)/g, kind: "markdown", vg: 1 },
    // Literal HTML/JSX href/src attributes
    { re: /\b(?:href|src)\s*=\s*["']([^"']+)["']/g, kind: "attr", vg: 1 },
    // Literal object properties carrying a URL/path
    { re: /\b(?:href|src|url|route|path)\s*:\s*["']([^"']+)["']/g, kind: "property", vg: 1 },
    // Structured route-map tuple: ["/route/", "label"] or ["https://…/", "label"]
    { re: /\[\s*["']((?:\/|https?:\/\/)[^"']*)["']\s*,\s*["'][^"']*["']\s*\]/g, kind: "route-map", vg: 1 }
  ];

  for (const { re, kind, vg, ig } of structured) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const value = m[vg];
      const identifier = ig !== undefined ? m[ig] : undefined;
      claimed.push([m.index, m.index + m[0].length]);
      // sourceRepoBase declarations are recorded authoritatively below (with
      // their keyword + initializer kind); the generic literal extractor must
      // NOT emit a keyword-less `declaration` occurrence for them.
      if (kind === "declaration" && identifier === APPROVED_SOURCE_REPO_BASE_IDENTIFIER) continue;
      const vStart = text.indexOf(value, m.index);
      add(value, kind, vStart >= 0 ? vStart : m.index, identifier);
    }
  }

  // Bounded `${sourceRepoBase}<suffix>` template composition in a destination
  // property (href/src/url). ONLY the exact single-interpolation identifier form
  // with an empty static prefix is recognized. The raw suffix is preserved
  // verbatim (validated later, BEFORE any URL is constructed); an additional
  // interpolation inside the suffix is kept (not silently dropped) so it fails
  // closed at validation. The occurrence range is claimed so the composition is
  // not re-emitted as any other kind. This does not evaluate any expression.
  const templateRe = /\b(href|src|url)\s*:\s*`\$\{\s*sourceRepoBase\s*\}([^`]*)`/g;
  let tm;
  while ((tm = templateRe.exec(text)) !== null) {
    const property = tm[1];
    const suffix = tm[2];
    claimed.push([tm.index, tm.index + tm[0].length]);
    const line = lineOf(tm.index);
    // Identity is the source offset (tm.index), so two genuinely separate
    // same-line compositions remain two occurrence records.
    const key = `github-template-composition@${tm.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      value: `${APPROVED_SOURCE_REPO_BASE}${suffix}`,
      rawValue: `\${sourceRepoBase}${suffix}`,
      suffix,
      offset: tm.index,
      kind: "github-template-composition",
      property,
      identifier: APPROVED_SOURCE_REPO_BASE_IDENTIFIER,
      line
    });
  }

  // Authoritative bounded scanner for EVERY declaration of the exact identifier
  // `sourceRepoBase` — const/let/var, with or WITHOUT an initializer. It records
  // the keyword, initializer kind (approved-literal / other-literal / template /
  // dynamic / missing / unsupported), and (for a literal) value, so a mutable
  // (let/var), uninitialized, dynamic, template, or wrong-value declaration is
  // VISIBLE and can prevent approved binding. This is the SINGLE authority for
  // sourceRepoBase declarations (the generic declaration extractor skips them),
  // and it evaluates no expression. Identity is the source offset (dm.index), so
  // two same-line declarations are recorded as two distinct occurrences.
  const declRe = /\b(const|let|var)\s+sourceRepoBase\b\s*(?:=\s*([^;\n]*))?/g;
  let dm;
  while ((dm = declRe.exec(text)) !== null) {
    const keyword = dm[1];
    const rawInit = dm[2];
    claimed.push([dm.index, dm.index + dm[0].length]);
    const key = `github-base-declaration-evidence@${dm.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { initializerKind, value } = classifyRepoBaseInitializer(rawInit);
    const occ = {
      kind: "github-base-declaration-evidence",
      identifier: APPROVED_SOURCE_REPO_BASE_IDENTIFIER,
      keyword,
      initializerKind,
      line: lineOf(dm.index),
      offset: dm.index
    };
    if (value !== undefined) occ.value = value;
    results.push(occ);
  }

  // Plain autolink-style URLs NOT already inside a structured occurrence.
  const overlaps = (s, e) => claimed.some(([cs, ce]) => s < ce && cs < e);
  const autolink =
    /https?:\/\/(?:metawritingecology\.org|github\.com|(?:dx\.)?doi\.org)\/[^\s"'<>)\]]+/g;
  let m;
  while ((m = autolink.exec(text)) !== null) {
    const value = m[0].replace(/[.,;]+$/, "");
    const start = m.index;
    if (overlaps(start, start + value.length)) continue;
    add(value, "autolink", start);
  }
  return results;
}
