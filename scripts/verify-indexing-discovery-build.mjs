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

import {
  existsSync,
  readFileSync,
  readdirSync,
  lstatSync,
  realpathSync
} from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, relative as pathRelative, isAbsolute as pathIsAbsolute } from "node:path";

// XMLValidator is fast-xml-parser's in-package well-formedness checker. Its
// deprecation note points to a separate `fast-xml-validator` package we
// intentionally do not add (single-dependency constraint); the import is used
// on purpose. Its deprecation surfaces only as a non-fatal editor/check hint.
import { XMLParser, XMLValidator } from "fast-xml-parser";

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
  childSitemapBasename,
  isValidSitemapLastmod
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
    // Never descend into or read through symbolic links (a symlink is not
    // legitimate build output and must not be followed for content reads).
    if (entry.isSymbolicLink()) continue;
    const childUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dirUrl);
    if (entry.isDirectory()) walkFiles(childUrl, acc);
    else acc.push(fileURLToPath(childUrl));
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Strict XML parsing for sitemap documents
// ---------------------------------------------------------------------------
//
// Sitemap-index and child-sitemap structure is validated with a real XML parser
// (fast-xml-parser), never regex tag-scraping. Documents are first checked for
// well-formedness, then parsed into a bounded structural model so per-record
// contracts (single <loc>, at most one <lastmod>, correct root and namespace)
// can be enforced. The parser performs no network access and constructs no DOM
// beyond the parsed plain object.

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

// preserveOrder retains element order, attributes, text nodes, and multiplicity
// so structural purity (unexpected text/elements/attributes, duplicates, scalar
// nodes carrying attributes or child elements) can be validated exactly. Raw
// scalar text is preserved (trimValues:false) so leading/trailing whitespace in
// <loc>/<lastmod> reaches the raw validators. Entity processing is disabled and
// DOCTYPE documents are rejected outright (see xmlWellFormedError).
function makeSitemapParser() {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    ignoreDeclaration: true,
    ignorePiTags: true,
    processEntities: false,
    preserveOrder: true
  });
}

// Reject any document that is not well-formed XML (fail closed), and reject any
// DOCTYPE declaration outright BEFORE structural parsing. A DOCTYPE is the only
// way to declare internal, external, or parameter entities, so refusing it
// blocks entity-expansion vectors while ordinary predefined escapes (&amp;,
// &lt;, …) continue to work through normal parsing. Boolean attributes are
// disallowed so malformed attribute syntax is also rejected.
function xmlWellFormedError(xml) {
  if (typeof xml !== "string") return "not a string";
  if (/<!DOCTYPE/i.test(xml)) return "DOCTYPE declarations are not allowed";
  const res = XMLValidator.validate(xml, { allowBooleanAttributes: false });
  if (res === true) return null;
  return res?.err?.msg ? String(res.err.msg) : "malformed XML";
}

// --- preserveOrder node helpers ------------------------------------------
// A preserveOrder element node is `{ <tag>: [children], ":@": {attrs} }`; a
// text node is `{ "#text": "..." }`. Attributes carry the "@_" prefix.

function isTextNode(node) {
  return node && typeof node === "object" && Object.prototype.hasOwnProperty.call(node, "#text");
}
function tagNameOf(node) {
  if (!node || typeof node !== "object") return null;
  for (const key of Object.keys(node)) {
    if (key === ":@" || key === "#text") continue;
    return key;
  }
  return null;
}
function attrsOf(node) {
  return node && typeof node === "object" && node[":@"] ? node[":@"] : {};
}
function childrenOf(node) {
  const tag = tagNameOf(node);
  return tag ? node[tag] : [];
}

// A scalar element (<loc>/<lastmod>) must have NO attributes and NO child
// elements — only text. Returns { ok, value, reason }. The raw text is NOT
// trimmed; downstream raw validators reject surrounding whitespace.
function scalarNodeValue(node) {
  if (Object.keys(attrsOf(node)).length > 0) return { ok: false, reason: "attribute" };
  const kids = childrenOf(node);
  if (kids.some((k) => tagNameOf(k) !== null)) return { ok: false, reason: "child-element" };
  const value = kids.filter(isTextNode).map((k) => k["#text"]).join("");
  return { ok: true, value };
}

// Validate a single <sitemap>/<url> record. Returns { findings, loc, lastmod }.
// Per the no-malformed-record rule, loc/lastmod are returned ONLY when the
// record has zero findings; any structural or value problem invalidates the
// ENTIRE record so it contributes nothing downstream.
function validateSitemapRecord(recordNode, codes) {
  const findings = [];
  if (Object.keys(attrsOf(recordNode)).length > 0) {
    findings.push({ code: codes.recordAttr });
  }
  const locNodes = [];
  const lastmodNodes = [];
  for (const kid of childrenOf(recordNode)) {
    if (isTextNode(kid)) {
      if (kid["#text"].trim() !== "") findings.push({ code: codes.recordText });
      continue;
    }
    const t = tagNameOf(kid);
    if (t === "loc") locNodes.push(kid);
    else if (t === "lastmod") lastmodNodes.push(kid);
    else findings.push({ code: codes.recordChild, detail: t });
  }

  if (locNodes.length !== 1) findings.push({ code: codes.oneLoc, detail: `locCount=${locNodes.length}` });
  if (lastmodNodes.length > 1) findings.push({ code: codes.lastmodCount, detail: `lastmodCount=${lastmodNodes.length}` });

  let locValue;
  if (locNodes.length >= 1) {
    const s = scalarNodeValue(locNodes[0]);
    if (!s.ok) findings.push({ code: s.reason === "attribute" ? codes.locAttr : codes.locChild });
    else locValue = s.value;
  }
  let lastmodValue;
  if (lastmodNodes.length >= 1) {
    const s = scalarNodeValue(lastmodNodes[0]);
    if (!s.ok) findings.push({ code: s.reason === "attribute" ? codes.lastmodAttr : codes.lastmodChild });
    else lastmodValue = s.value;
  }
  if (lastmodValue !== undefined && !isValidSitemapLastmod(lastmodValue)) {
    findings.push({ code: codes.lastmodSyntax, detail: lastmodValue });
  }

  if (findings.length > 0) return { findings, loc: undefined, lastmod: undefined };
  return { findings, loc: locValue, lastmod: lastmodValue };
}

// Structural code sets for the two document kinds.
const INDEX_CODES = {
  malformed: "SITEMAP_INDEX_MALFORMED_XML",
  root: "SITEMAP_INDEX_ROOT",
  namespace: "SITEMAP_INDEX_NAMESPACE",
  rootAttr: "SITEMAP_INDEX_ROOT_ATTR",
  rootText: "SITEMAP_INDEX_ROOT_TEXT",
  rootChild: "SITEMAP_INDEX_ROOT_CHILD",
  recordAttr: "SITEMAP_INDEX_RECORD_ATTR",
  recordText: "SITEMAP_INDEX_RECORD_TEXT",
  recordChild: "SITEMAP_INDEX_RECORD_CHILD",
  oneLoc: "SITEMAP_INDEX_RECORD_ONE_LOC",
  lastmodCount: "SITEMAP_INDEX_RECORD_LASTMOD_COUNT",
  locAttr: "SITEMAP_INDEX_LOC_ATTR",
  locChild: "SITEMAP_INDEX_LOC_CHILD",
  lastmodAttr: "SITEMAP_INDEX_LASTMOD_ATTR",
  lastmodChild: "SITEMAP_INDEX_LASTMOD_CHILD",
  lastmodSyntax: "SITEMAP_INDEX_LASTMOD_SYNTAX"
};
const CHILD_CODES = {
  malformed: "SITEMAP_CHILD_MALFORMED_XML",
  root: "SITEMAP_CHILD_ROOT",
  namespace: "SITEMAP_CHILD_NAMESPACE",
  rootAttr: "SITEMAP_CHILD_ROOT_ATTR",
  rootText: "SITEMAP_CHILD_ROOT_TEXT",
  rootChild: "SITEMAP_CHILD_ROOT_CHILD",
  recordAttr: "SITEMAP_URL_RECORD_ATTR",
  recordText: "SITEMAP_URL_RECORD_TEXT",
  recordChild: "SITEMAP_URL_RECORD_CHILD",
  oneLoc: "SITEMAP_URL_ONE_LOC",
  lastmodCount: "SITEMAP_URL_LASTMOD_COUNT",
  locAttr: "SITEMAP_URL_LOC_ATTR",
  locChild: "SITEMAP_URL_LOC_CHILD",
  lastmodAttr: "SITEMAP_URL_LASTMOD_ATTR",
  lastmodChild: "SITEMAP_URL_LASTMOD_CHILD",
  lastmodSyntax: "SITEMAP_LASTMOD_ISO"
};

// Parse a sitemap document (index or child) into { findings, records }. Each
// record is a clean { loc, lastmod } (records with structural findings are
// EXCLUDED). ROOT validation is completed FIRST and is FATAL: if the root has
// ANY structural finding (malformed XML/DOCTYPE, multiple roots, wrong root
// type, wrong/missing namespace, unexpected non-namespace root attribute,
// non-whitespace text directly inside the root, or an unexpected root child
// element), NO records are extracted (records: []). Record validation begins
// only once the root is structurally clean, so a malformed root can never drive
// child-reference, URL, route, duplicate, lastmod, origin, or membership logic.
function parseSitemapDocument(xml, spec) {
  const findings = [];
  const wfErr = xmlWellFormedError(xml);
  if (wfErr !== null) {
    findings.push({ code: spec.codes.malformed, detail: wfErr });
    return { findings, records: [] };
  }
  let tree;
  try {
    tree = makeSitemapParser().parse(xml);
  } catch (err) {
    findings.push({ code: spec.codes.malformed, detail: String(err?.message ?? err) });
    return { findings, records: [] };
  }

  // Exactly one root element; non-whitespace top-level text is a root finding.
  const topElements = [];
  for (const node of tree) {
    if (isTextNode(node)) {
      if (node["#text"].trim() !== "") {
        findings.push({ code: spec.codes.root, detail: "non-whitespace top-level text" });
      }
      continue;
    }
    topElements.push(node);
  }
  if (topElements.length !== 1 || tagNameOf(topElements[0]) !== spec.rootTag) {
    findings.push({ code: spec.codes.root, detail: topElements.map(tagNameOf).join(",") || "(none)" });
    return { findings, records: [] };
  }
  const rootNode = topElements[0];

  // --- Phase 1: root-level structure (all findings collected, none fatal-early) ---
  const attrs = attrsOf(rootNode);
  const nsOk = attrs["@_xmlns"] === SITEMAP_NS;
  if (!nsOk) findings.push({ code: spec.codes.namespace, detail: String(attrs["@_xmlns"] ?? "(none)") });
  // The default `xmlns` must be the sitemap namespace. Additional `xmlns:<prefix>`
  // namespace DECLARATIONS are permitted (the approved @astrojs/sitemap output
  // declares the standard news/xhtml/image/video namespaces on <urlset>); any
  // attribute that is not a namespace declaration is an unexpected root attribute.
  const extraAttrs = Object.keys(attrs).filter(
    (k) => k !== "@_xmlns" && !k.startsWith("@_xmlns:")
  );
  if (extraAttrs.length > 0) findings.push({ code: spec.codes.rootAttr, detail: extraAttrs.join(",") });

  // Scan root children to detect non-whitespace root text and unexpected child
  // elements, and to COLLECT record nodes — but do not validate records yet.
  const recordNodes = [];
  for (const kid of childrenOf(rootNode)) {
    if (isTextNode(kid)) {
      if (kid["#text"].trim() !== "") findings.push({ code: spec.codes.rootText });
      continue;
    }
    const t = tagNameOf(kid);
    if (t !== spec.recordTag) {
      findings.push({ code: spec.codes.rootChild, detail: t });
      continue;
    }
    recordNodes.push(kid);
  }

  // Any root-level finding is FATAL: extract no records from an invalid root.
  if (findings.length > 0) return { findings, records: [] };

  // --- Phase 2: record validation (root is structurally clean) ---
  const records = [];
  for (const rec of recordNodes) {
    const r = validateSitemapRecord(rec, spec.codes);
    for (const f of r.findings) findings.push(f);
    if (r.findings.length === 0) records.push({ loc: r.loc, lastmod: r.lastmod });
  }
  return { findings, records };
}

function parseSitemapIndexStructure(xml) {
  return parseSitemapDocument(xml, { rootTag: "sitemapindex", recordTag: "sitemap", codes: INDEX_CODES });
}
function parseChildSitemapStructure(xml) {
  return parseSitemapDocument(xml, { rootTag: "urlset", recordTag: "url", codes: CHILD_CODES });
}

// A short human label for a structural finding code (the code and detail carry
// the specifics). Kept generic so new codes need no per-code wiring.
function sitemapFindingLabel(code) {
  if (code.startsWith("SITEMAP_INDEX")) return "sitemap-index structural contract";
  if (
    code.startsWith("SITEMAP_URL") ||
    code.startsWith("SITEMAP_CHILD") ||
    code === "SITEMAP_LASTMOD_ISO"
  ) {
    return "child sitemap structural contract";
  }
  return "sitemap structural contract";
}

// --- Path-safety helpers (symlink / regular-file / realpath containment) --

// Classify a path by lstat (never follows the final symlink): one of
// "missing" | "symlink" | "file" | "directory" | "other".
function classifyPathKind(p) {
  let st;
  try {
    st = lstatSync(p);
  } catch {
    return "missing";
  }
  if (st.isSymbolicLink()) return "symlink";
  if (st.isFile()) return "file";
  if (st.isDirectory()) return "directory";
  return "other";
}

// True only when realpath(p) resolves to a regular file strictly beneath
// realpath(dist). Lexical containment alone is insufficient.
function resolvedWithinDist(p, distRealPath) {
  let real;
  try {
    real = realpathSync(p);
  } catch {
    return false;
  }
  return isWithinDir(distRealPath, real);
}

// Safely read a sitemap file. Rejects symlinks, directories, and other
// non-regular entries, and any file whose resolved path escapes dist, BEFORE
// any content read. Returns { ok, text?, reason? }; never follows a symlink to
// read. `reason` is one of missing/symlink/non-regular/outside-dist/unreadable.
function readSitemapFileSafely(p, distRealPath) {
  const kind = classifyPathKind(p);
  if (kind === "missing") return { ok: false, reason: "missing" };
  if (kind === "symlink") return { ok: false, reason: "symlink" };
  if (kind !== "file") return { ok: false, reason: "non-regular" };
  if (!resolvedWithinDist(p, distRealPath)) return { ok: false, reason: "outside-dist" };
  try {
    return { ok: true, text: readFileSync(p, "utf8") };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

// Case-insensitive detection of a sitemap-child-shaped basename. The ONLY valid
// generated child form is the exact lowercase spelling checked separately.
const SITEMAP_CHILD_SHAPE = /^sitemap-\d+\.xml$/i;
const SITEMAP_CHILD_EXACT = /^sitemap-\d+\.xml$/; // lowercase, exact

// Recursively enumerate every sitemap-child-SHAPED entry anywhere under dist.
//
// Directory listing uses readdirSync(..., { withFileTypes: true }); the returned
// Dirent values classify each entry (symlink / directory / file / other) from
// the directory entry itself, so a symbolic link is recognized and NEVER
// followed here (no readlink, no realpath, no recursion into it) and traversal
// cannot escape dist or loop. This Dirent classification is only used to decide
// enumeration/recursion and to record `kind`; the authoritative non-following
// safety checks (lstat via classifyPathKind + realpath containment in
// readSitemapFileSafely) are applied separately before any file content is read.
//
// A directory whose listing FAILS is never silently treated as empty: it yields
// an explicit { code: SITEMAP_INVENTORY_DIRECTORY_UNREADABLE } traversal finding
// (with the dist-relative path and, when available, the stable errno code — no
// absolute path, no stack trace). Traversal stops for that one directory but
// continues with its siblings, and the caller fails verification.
//
// `readDir` is an internal seam defaulting to readdirSync so a test can inject a
// failure for one exact directory; it replaces ONLY the listing step and cannot
// bypass the lstat/symlink/realpath/containment checks performed at read time.
//
// Returns { entries, traversalFindings }. Each entry is
// { relPath, absPath, basename, kind, atRoot }; kind is
// "file" | "symlink" | "directory" | "other". `sitemap-index.xml` is never a
// child (it does not match the numeric shape anyway).
function collectSitemapShapedEntries(distDirPath, readDir = readdirSync) {
  const out = [];
  const traversalFindings = [];
  const walk = (absDir, relDir) => {
    let entries;
    try {
      entries = readDir(absDir, { withFileTypes: true });
    } catch (err) {
      // Fail closed: an unreadable directory is a finding, never empty-and-valid.
      traversalFindings.push({
        code: "SITEMAP_INVENTORY_DIRECTORY_UNREADABLE",
        relPath: relDir === "" ? "." : relDir,
        errno: err && typeof err.code === "string" ? err.code : "unknown"
      });
      return; // stop for THIS directory; siblings continue via the parent loop
    }
    for (const entry of entries) {
      const abs = join(absDir, entry.name);
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      const shaped = SITEMAP_CHILD_SHAPE.test(entry.name);
      if (entry.isSymbolicLink()) {
        // Never follow or recurse into a symbolic link; report if shaped.
        if (shaped) out.push({ relPath: rel, absPath: abs, basename: entry.name, kind: "symlink", atRoot: relDir === "" });
        continue;
      }
      if (entry.isDirectory()) {
        if (shaped) out.push({ relPath: rel, absPath: abs, basename: entry.name, kind: "directory", atRoot: relDir === "" });
        walk(abs, rel); // recurse into REAL directories only
        continue;
      }
      if (shaped) {
        out.push({
          relPath: rel,
          absPath: abs,
          basename: entry.name,
          kind: entry.isFile() ? "file" : "other",
          atRoot: relDir === ""
        });
      }
    }
  };
  walk(distDirPath, "");
  out.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));
  return { entries: out, traversalFindings };
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
export function verifyIndexingDiscoveryBuild({ repoRoot, pagesDir, distDir, testHooks } = {}) {
  // `repoRoot` is the base for any directory not explicitly supplied.
  const rootUrl = repoRoot ? toDirUrl(repoRoot) : new URL("../", import.meta.url);
  const pagesUrl = toDirUrl(pagesDir ?? new URL("src/pages/", rootUrl));
  const distUrl = toDirUrl(distDir ?? new URL("dist/", rootUrl));
  const distDirPath = fileURLToPath(distUrl);
  const distPath = (rel) => fileURLToPath(new URL(rel, distUrl));

  // Internal test seam: replaces ONLY the directory-listing step for the
  // recursive inventory (see collectSitemapShapedEntries). Defaults to the real
  // readdirSync in production; never bypasses the lstat/symlink/realpath/
  // containment checks that gate file reads.
  const readDir = testHooks?.readDir ?? readdirSync;

  const results = [];
  let failed = false;
  const check = (ok, code, label, detail = "") => {
    results.push({ ok, code, label, detail });
    if (!ok) failed = true;
  };

  // --- Preconditions -------------------------------------------------------
  if (!existsSync(distUrl)) {
    check(false, "BUILD_MISSING", "dist/ build output present", "run `pnpm run build` first");
    return { results, failed, urlEntryCount: 0 };
  }
  // Resolve the real dist root once for symlink / realpath-containment checks.
  let distRealPath;
  try {
    distRealPath = realpathSync(distDirPath);
  } catch {
    distRealPath = distDirPath;
  }

  const sitemapIndexFile = distPath("sitemap-index.xml");
  // The index file must itself be a regular file resolving beneath dist (no
  // symlink, no directory) before any read.
  const indexRead = readSitemapFileSafely(sitemapIndexFile, distRealPath);
  if (!indexRead.ok) {
    const code =
      indexRead.reason === "missing" ? "SITEMAP_INDEX_MISSING" : "SITEMAP_INDEX_UNSAFE_FILE";
    check(false, code, "sitemap-index.xml is a regular file beneath dist", indexRead.reason);
    return { results, failed, urlEntryCount: 0 };
  }
  const indexXml = indexRead.text;

  // --- Sitemap index structure ---------------------------------------------
  const indexStructure = parseSitemapIndexStructure(indexXml);
  for (const f of indexStructure.findings) {
    check(false, f.code, sitemapFindingLabel(f.code), f.detail ?? "");
  }
  // Only clean records contribute a child location.
  const childLocs = indexStructure.records.map((r) => r.loc);

  check(
    childLocs.length > 0,
    "SITEMAP_INDEX_CHILDREN",
    "sitemap index references at least one child sitemap",
    `${childLocs.length} child sitemap(s)`
  );

  const seenChild = new Set();
  const referencedChildBases = new Set();
  const childFiles = []; // { name, text }
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
    // No two index entries may reference the same child sitemap file.
    check(
      !referencedChildBases.has(base),
      "CHILD_LOC_UNIQUE_FILE",
      "no two index entries reference the same child sitemap file",
      base
    );
    referencedChildBases.add(base);
    // Lexical containment (defense in depth alongside the realpath check).
    const childFile = distPath(base);
    const beneath = isWithinDir(distDirPath, childFile);
    check(beneath, "CHILD_WITHIN_DIST", "child sitemap resolves beneath dist", base);
    if (!beneath) continue;
    // Regular-file + realpath containment before any content read.
    const read = readSitemapFileSafely(childFile, distRealPath);
    if (!read.ok) {
      const code =
        read.reason === "missing"
          ? "CHILD_FILE_MISSING"
          : read.reason === "symlink"
            ? "CHILD_SYMLINK"
            : read.reason === "outside-dist"
              ? "CHILD_OUTSIDE_DIST"
              : "CHILD_NON_REGULAR";
      check(false, code, "child sitemap file is a regular file beneath dist", `${base}: ${read.reason}`);
      continue;
    }
    childFiles.push({ name: base, text: read.text });
  }

  // --- Recursively enumerate sitemap-child-SHAPED files; require exact --------
  // agreement. The ONLY valid generated child is a root-level, exact-lowercase
  // `sitemap-<n>.xml` ordinary regular file whose realpath stays beneath dist.
  // Every other shaped entry anywhere under dist (nested, case-variant, symlink,
  // directory, or other non-regular) is UNEXPECTED: it is reported and never
  // enters the valid generated set. Directory listing uses readdirSync/Dirent
  // and never follows a symbolic link, so traversal cannot escape dist or loop.
  const { entries: shapedEntries, traversalFindings } = collectSitemapShapedEntries(distDirPath, readDir);

  // A failed directory read is FATAL: the inventory is incomplete, so no
  // generated set can be trusted and no forbidden-origin / feed scan can be
  // claimed complete. Each failure is an explicit failing check.
  for (const tf of traversalFindings) {
    check(
      false,
      "SITEMAP_INVENTORY_DIRECTORY_UNREADABLE",
      "dist inventory directory is readable",
      `${tf.relPath} (${tf.errno})`
    );
  }
  const inventoryComplete = traversalFindings.length === 0;

  const validGenerated = new Set();
  for (const e of shapedEntries) {
    const isExactRootChild = e.atRoot && e.kind === "file" && SITEMAP_CHILD_EXACT.test(e.basename);
    if (isExactRootChild && resolvedWithinDist(e.absPath, distRealPath)) {
      validGenerated.add(e.basename);
      continue;
    }
    if (e.kind === "symlink") {
      check(false, "SITEMAP_CHILD_SYMLINK", "sitemap-shaped entry is not a symbolic link", e.relPath);
    } else if (e.kind === "directory" || e.kind === "other") {
      check(false, "SITEMAP_CHILD_NON_REGULAR", "sitemap-shaped entry is a regular file", `${e.relPath}: ${e.kind}`);
    } else {
      // A shaped regular file that is nested and/or not the exact lowercase
      // root-level name is never a valid generated child.
      check(
        false,
        "SITEMAP_CHILD_UNEXPECTED",
        "sitemap-shaped file is not the exact root-level lowercase sitemap-<n>.xml child",
        e.relPath
      );
    }
  }
  const generatedSet = validGenerated;
  const unreferencedChildren = [...generatedSet].filter((n) => !referencedChildBases.has(n)).sort();
  const referencedButAbsent = [...referencedChildBases].filter((n) => !generatedSet.has(n)).sort();
  check(
    unreferencedChildren.length === 0,
    "SITEMAP_UNREFERENCED_CHILD_FILE",
    "every generated sitemap-<n>.xml file is referenced by the index",
    unreferencedChildren.join(", ")
  );
  check(
    referencedButAbsent.length === 0,
    "SITEMAP_REFERENCED_CHILD_ABSENT",
    "every index-referenced child sitemap file exists in dist",
    referencedButAbsent.join(", ")
  );
  check(
    inventoryComplete &&
      generatedSet.size === referencedChildBases.size &&
      unreferencedChildren.length === 0 &&
      referencedButAbsent.length === 0,
    "SITEMAP_CHILD_FILES_EXACT_MATCH",
    "generated child sitemap files exactly match index references (inventory complete)",
    inventoryComplete
      ? `generated ${generatedSet.size}, referenced ${referencedChildBases.size}`
      : "inventory incomplete: a directory could not be read"
  );

  // Scan EVERY safe ordinary in-dist regular sitemap-shaped file (valid root
  // child OR unexpected nested / case-variant) for forbidden origins and feed
  // signatures, using a safe read that never follows a symbolic link. Symlink,
  // directory, and other non-regular entries were reported above and never read.
  for (const e of shapedEntries) {
    if (e.kind !== "file") continue;
    const read = readSitemapFileSafely(e.absPath, distRealPath);
    if (!read.ok) continue;
    const forbidden = findForbiddenOriginUrls(read.text);
    check(forbidden.length === 0, "FORBIDDEN_ORIGIN", `no forbidden origin in ${e.relPath}`, forbidden.join(", "));
    const feeds = findFeedSignatures(read.text);
    check(feeds.length === 0, "FEED_SIGNATURE", `no RSS/Atom feed signature in ${e.relPath}`, feeds.map((f) => f.code).join(", "));
  }

  // --- Collect URL entries via strict child parsing ------------------------
  const urlEntries = [];
  for (const child of childFiles) {
    const childStructure = parseChildSitemapStructure(child.text);
    for (const f of childStructure.findings) {
      check(false, f.code, `${sitemapFindingLabel(f.code)} (${child.name})`, f.detail ?? "");
    }
    // Only clean records (no structural findings) become URL entries, so a
    // malformed record never contributes a valid-looking URL downstream.
    for (const rec of childStructure.records) {
      urlEntries.push({ loc: rec.loc, lastmod: rec.lastmod });
    }
  }
  check(urlEntries.length > 0, "SITEMAP_HAS_URLS", "sitemap contains URL entries", `${urlEntries.length}`);

  // --- No duplicate raw <loc> across all url records/files ------------------
  const rawLocSeen = new Set();
  const rawLocDup = new Set();
  for (const { loc } of urlEntries) {
    if (rawLocSeen.has(loc)) rawLocDup.add(loc);
    rawLocSeen.add(loc);
  }
  check(
    rawLocDup.size === 0,
    "SITEMAP_NO_DUPLICATE_LOC",
    "no duplicate raw <loc> across sitemap url records",
    [...rawLocDup].join(", ")
  );

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
  for (const { loc } of urlEntries) {
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
    // lastmod syntax is validated strictly during record parsing (shared W3C
    // validator), so no permissive Date re-check is performed here.
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
  // Child sitemap forbidden-origin and feed-signature scanning is performed via
  // the safe-read enumeration loop above (which never follows a symlink).
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

  // urlEntryCount exposes how many clean URL records were extracted, so tests
  // can assert directly that an invalid root extracts zero URL entries.
  return { results, failed, urlEntryCount: urlEntries.length };
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
