#!/usr/bin/env node
// Package D — post-build public-metadata verifier.
//
// The site builds in SSR mode (astro.config.mjs `output: "server"`, Cloudflare
// adapter), so ordinary indexable routes are NOT emitted as static HTML in
// `dist/`; they are produced on demand by the built worker. To inspect the
// ACTUAL rendered `<head>` metadata of every route, this verifier boots the
// freshly built worker in the local Cloudflare runtime (`wrangler dev --local`,
// workerd — the same engine as production) against the current `dist/` tree and
// fetches each route. It performs NO deployment and changes NO external setting:
// it starts a local, offline server, reads rendered HTML, then stops it.
//
// It adds no dependency (no fast-xml-parser as an HTML parser; bounded,
// deterministic string extraction only) and asserts only deterministic
// engineering contracts. It never infers Registry, classification, archive,
// ontology, relation, publication, or authority status. The route MEMBERSHIP is
// derived INDEPENDENTLY from Package C's buildExpectedRouteSet (real page
// sources + robots), not from the Package D registry, so route coverage is not
// self-referential.

import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

// Bind an OS-assigned free loopback port, then release it. Using a fresh port
// per run means a stray worker left over from an earlier run can never cause a
// false EADDRINUSE failure or be silently reused instead of the current build.
export function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

import {
  ROUTE_METADATA_REGISTRY,
  SUPPORTED_JSONLD_TYPES,
  FORBIDDEN_METADATA_KEYS,
  WEBSITE_NODE
} from "../src/lib/publicMetadata.ts";

import {
  PRODUCTION_ORIGIN,
  isForbiddenPublicOrigin,
  findForbiddenOriginUrls
} from "./lib/indexing-discovery-contract.mjs";

import { buildExpectedRouteSet } from "./verify-indexing-discovery-build.mjs";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
const PAGES_DIR = new URL("../src/pages/", import.meta.url);

const INTERACTIVE_ROUTE = "/public-surface-map/interactive/";
const PROTOTYPE_ROUTE = "/language-pressure-test-lab-prototype/";
const NOT_FOUND_PROBE = "/package-d-metadata-verifier-404-probe/";
const JSON_ENDPOINTS = [
  "/public-surface-map/data/manifest.json",
  "/public-surface-map/data/snapshots/97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json"
];

// ---------------------------------------------------------------------------
// Bounded request handling
// ---------------------------------------------------------------------------
//
// Every HTTP request the verifier makes is bounded by a finite, explicit,
// deterministic timeout suitable for CI. A single timer per request covers BOTH
// waiting for response headers AND reading the complete response body, and is
// cleared only in `finally` (after the body read finishes), so a route that
// sends headers but never finishes its body cannot block verification. A stalled
// request aborts, surfaces a deterministic timeout error, and lets the
// Wrangler/workerd cleanup path (killTree) run — no request continues
// indefinitely. Timeouts are overridable only by trusted in-process test hooks;
// the production CLI always uses the constants below.

// Per-route render request budget (headers + full body).
const ROUTE_FETCH_TIMEOUT_MS = 10_000;
// Per-attempt local-worker readiness probe budget.
const READINESS_FETCH_TIMEOUT_MS = 2_000;
// Overall readiness deadline and polling interval for the readiness loop.
const READINESS_TOTAL_MS = 60_000;
const READINESS_INTERVAL_MS = 1_000;

// Deterministic, bounded timeout error. Carries a stable code and the phase or
// route that timed out, and never embeds arbitrary external response data.
export class VerifierTimeoutError extends Error {
  constructor(phase, timeoutMs) {
    super(`verifier request timed out after ${timeoutMs}ms during ${phase}`);
    this.name = "VerifierTimeoutError";
    this.code = "VERIFIER_FETCH_TIMEOUT";
    this.phase = phase;
    this.timeoutMs = timeoutMs;
  }
}

// One shared bounded-fetch mechanism. Aborts via AbortController when the timer
// fires; the timer spans header-wait AND body-read and is cleared in `finally`.
// A timeout throws a deterministic VerifierTimeoutError identifying `phase`;
// ordinary network/rendering errors propagate unchanged (fail closed).
async function boundedFetch(url, { fetchImpl = globalThis.fetch, timeoutMs, phase }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      redirect: "manual",
      signal: controller.signal
    });
    // Body reading remains inside the SAME timeout window.
    const body = await response.text();
    return {
      status: response.status,
      body,
      contentType: response.headers.get("content-type")
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new VerifierTimeoutError(phase, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Bounded deterministic <head> extraction (no HTML parser dependency)
// ---------------------------------------------------------------------------

function headSlice(html) {
  if (typeof html !== "string") return null;
  const open = html.search(/<head[\s>]/i);
  if (open === -1) return null;
  const gt = html.indexOf(">", open);
  if (gt === -1) return null;
  const close = html.toLowerCase().indexOf("</head>", gt);
  if (close === -1) return null;
  return html.slice(gt + 1, close);
}

function countMatches(text, re) {
  const m = text.match(re);
  return m ? m.length : 0;
}

function decodeAttr(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// Extract the metadata-contract surface. Returns null-ish fields plus explicit
// counts so the caller can fail closed on missing/duplicate tags.
function extractMetadata(html) {
  const head = headSlice(html);
  const langMatch = /<html\b[^>]*\blang\s*=\s*"([^"]*)"/i.exec(html);
  const out = {
    ok: head !== null,
    htmlLang: langMatch ? langMatch[1] : null,
    titleCount: 0,
    title: null,
    descriptionCount: 0,
    description: null,
    canonicalCount: 0,
    canonical: null,
    robotsCount: 0,
    robots: null,
    jsonLdCount: 0,
    jsonLdRaw: null,
    jsonLd: null,
    jsonLdParseOk: null,
    head: head ?? ""
  };
  if (head === null) return out;

  out.titleCount = countMatches(head, /<title[\s>]/gi);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head);
  if (title) out.title = decodeAttr(title[1]);

  out.descriptionCount = countMatches(head, /<meta\b[^>]*\bname\s*=\s*"description"/gi);
  const desc = /<meta\b[^>]*\bname\s*=\s*"description"[^>]*\bcontent\s*=\s*"([^"]*)"/i.exec(head);
  if (desc) out.description = decodeAttr(desc[1]);

  out.canonicalCount = countMatches(head, /<link\b[^>]*\brel\s*=\s*"canonical"/gi);
  const canon = /<link\b[^>]*\brel\s*=\s*"canonical"[^>]*\bhref\s*=\s*"([^"]*)"/i.exec(head);
  if (canon) out.canonical = decodeAttr(canon[1]);

  out.robotsCount = countMatches(head, /<meta\b[^>]*\bname\s*=\s*"robots"/gi);
  const robots = /<meta\b[^>]*\bname\s*=\s*"robots"[^>]*\bcontent\s*=\s*"([^"]*)"/i.exec(head);
  if (robots) out.robots = decodeAttr(robots[1]);

  const blocks = [
    ...head.matchAll(
      /<script\b[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    )
  ];
  out.jsonLdCount = blocks.length;
  if (blocks.length === 1) {
    out.jsonLdRaw = blocks[0][1];
    try {
      out.jsonLd = JSON.parse(blocks[0][1]);
      out.jsonLdParseOk = true;
    } catch {
      out.jsonLdParseOk = false;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Local worker server lifecycle (offline workerd)
// ---------------------------------------------------------------------------

// Collect every descendant pid of `root` from /proc (Linux). wrangler spawns a
// wrangler-cli node process which spawns workerd; a signal to the immediate
// child alone leaves workerd running (holding the port and keeping Node's event
// loop alive), so the whole subtree must be reaped.
function descendantPids(root) {
  const childrenByParent = new Map();
  let names;
  try {
    names = readdirSync("/proc");
  } catch {
    return []; // non-Linux / no /proc — caller falls back to child.kill
  }
  for (const name of names) {
    if (!/^\d+$/.test(name)) continue;
    let stat;
    try {
      stat = readFileSync(`/proc/${name}/stat`, "utf8");
    } catch {
      continue; // process vanished mid-scan
    }
    // stat: "pid (comm) state ppid ..."; comm may contain spaces/parens, so
    // parse the fields AFTER the final ')'.
    const rparen = stat.lastIndexOf(")");
    if (rparen === -1) continue;
    const fields = stat.slice(rparen + 2).split(" ");
    const ppid = Number(fields[1]); // [0]=state, [1]=ppid
    if (!Number.isInteger(ppid)) continue;
    if (!childrenByParent.has(ppid)) childrenByParent.set(ppid, []);
    childrenByParent.get(ppid).push(Number(name));
  }
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const p = stack.pop();
    for (const c of childrenByParent.get(p) ?? []) {
      out.push(c);
      stack.push(c);
    }
  }
  return out;
}

// SIGKILL the wrangler child and every descendant (workerd included), targeting
// only this subtree so a concurrent wrangler (e.g. `deploy --dry-run`) is never
// touched.
function killTree(child) {
  if (!child || child.pid === undefined) return;
  const pids = descendantPids(child.pid);
  for (const pid of [...pids, child.pid]) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

// Bounded local-worker readiness probe. Each individual attempt is bounded by
// `readinessFetchTimeoutMs`; the overall loop is bounded by `readinessTotalMs`.
// A timeout (or any error) on one attempt is swallowed and the loop continues to
// the next attempt after `readinessIntervalMs`; readiness never blocks
// indefinitely and never leaves a probe body/connection open (boundedFetch reads
// and aborts). Returns true once the worker returns 200, or false when the
// overall deadline is reached (a deterministic non-ready result). Exported so
// the readiness path can be exercised deterministically without booting wrangler.
export async function awaitReady(
  origin,
  {
    fetchImpl = globalThis.fetch,
    readinessFetchTimeoutMs = READINESS_FETCH_TIMEOUT_MS,
    readinessTotalMs = READINESS_TOTAL_MS,
    readinessIntervalMs = READINESS_INTERVAL_MS
  } = {}
) {
  const deadline = Date.now() + readinessTotalMs;
  while (Date.now() < deadline) {
    await delay(readinessIntervalMs);
    try {
      const res = await boundedFetch(`${origin}/about/`, {
        fetchImpl,
        timeoutMs: readinessFetchTimeoutMs,
        phase: "readiness"
      });
      if (res.status === 200) return true;
    } catch {
      /* timeout or not-up-yet: bounded, continue to the next attempt */
    }
  }
  return false;
}

async function withLocalServer(fn, options) {
  const {
    port,
    fetchImpl = globalThis.fetch,
    routeFetchTimeoutMs = ROUTE_FETCH_TIMEOUT_MS,
    readinessFetchTimeoutMs = READINESS_FETCH_TIMEOUT_MS,
    readinessTotalMs = READINESS_TOTAL_MS,
    readinessIntervalMs = READINESS_INTERVAL_MS
  } = options;
  const child = spawn(
    "npx",
    [
      "wrangler",
      "dev",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--log-level",
      "error"
    ],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  const origin = `http://127.0.0.1:${port}`;
  try {
    const ready = await awaitReady(origin, {
      fetchImpl,
      readinessFetchTimeoutMs,
      readinessTotalMs,
      readinessIntervalMs
    });
    if (!ready) throw new Error("local worker did not become ready in time");
    // Hand `fn` a bound, per-route bounded fetcher so every rendered-route read
    // is covered by the route timeout.
    const routeFetch = (route) =>
      fetchRoute(origin, route, { fetchImpl, timeoutMs: routeFetchTimeoutMs });
    return await fn(origin, routeFetch);
  } finally {
    killTree(child);
  }
}

// Bounded per-route fetch (headers + full body within one timeout). Exported so
// lifecycle tests can drive the REAL helper against a controlled loopback server
// or fetch hook. `phase` is the route itself, so a timeout error identifies the
// route without exposing external response data.
export async function fetchRoute(
  origin,
  route,
  { fetchImpl = globalThis.fetch, timeoutMs = ROUTE_FETCH_TIMEOUT_MS } = {}
) {
  return boundedFetch(`${origin}${route}`, { fetchImpl, timeoutMs, phase: route });
}

// ---------------------------------------------------------------------------
// JSON-LD graph inspection
// ---------------------------------------------------------------------------

function graphNodes(jsonLd) {
  if (!jsonLd || typeof jsonLd !== "object") return [];
  return Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [];
}

// Scan any object/string for forbidden metadata keys or non-approved JSON-LD
// types. Returns an array of finding strings.
function forbiddenKeyFindings(jsonLd) {
  const findings = [];
  const serialized = JSON.stringify(jsonLd ?? null);
  for (const key of FORBIDDEN_METADATA_KEYS) {
    if (new RegExp(`"${key}"\\s*:`, "i").test(serialized)) findings.push(`forbidden key: ${key}`);
  }
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
    if (new RegExp(`"${banned}"\\s*:`, "i").test(serialized)) findings.push(`banned key: ${banned}`);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// The verifier
// ---------------------------------------------------------------------------

// Trusted in-process test hooks. Supplied ONLY by lifecycle tests within this
// process; the production CLI never passes them. They may replace the fetch
// implementation and shorten timeouts to keep tests deterministic and fast, but
// cannot alter metadata policy, route membership, filesystem safety, or JSON-LD
// decisions. They are never read from environment variables, CLI arguments,
// repository files, HTTP input, or build output.
export async function verifyMetadataBuild({ port, testHooks } = {}) {
  const {
    fetchImpl = globalThis.fetch,
    routeFetchTimeoutMs = ROUTE_FETCH_TIMEOUT_MS,
    readinessFetchTimeoutMs = READINESS_FETCH_TIMEOUT_MS,
    readinessTotalMs = READINESS_TOTAL_MS,
    readinessIntervalMs = READINESS_INTERVAL_MS
  } = testHooks ?? {};
  const boundPort = port ?? (await getFreePort());
  const results = [];
  let failed = false;
  const check = (ok, code, label, detail = "") => {
    results.push({ ok, code, label, detail });
    if (!ok) failed = true;
  };

  // Independently-derived indexable route membership (Package C oracle).
  const { expected, findings: robotsFindings } = buildExpectedRouteSet({ pagesDir: PAGES_DIR });
  for (const f of robotsFindings) check(false, "ROBOTS_CONTRACT", "page robots contract unambiguous", f.message);
  const indexableRoutes = [...expected].sort();
  check(indexableRoutes.length === 40, "INDEXABLE_COUNT", "exactly 40 indexable routes", `${indexableRoutes.length}`);

  // Every indexable route is registered in the Package D registry.
  for (const route of indexableRoutes) {
    check(
      Boolean(ROUTE_METADATA_REGISTRY[route]),
      "ROUTE_REGISTERED",
      "indexable route is registered in the metadata registry",
      route
    );
  }

  await withLocalServer(async (origin, renderRoute) => {
    // --- 40 indexable routes ---------------------------------------------
    for (const route of indexableRoutes) {
      const policy = ROUTE_METADATA_REGISTRY[route];
      const expectedLang = policy ? policy.language : "en";
      const expectedGenre =
        policy && policy.structuredData.enabled ? policy.structuredData.genre : undefined;
      const canonicalExpected = `${PRODUCTION_ORIGIN}${route}`;

      const { status, body } = await renderRoute(route);
      if (status !== 200) {
        check(false, "ROUTE_RENDERED", "indexable route renders 200", `${route} -> ${status}`);
        continue;
      }
      const m = extractMetadata(body);
      if (!m.ok) {
        check(false, "HEAD_PRESENT", "rendered HTML has a <head>", route);
        continue;
      }
      check(m.titleCount === 1, "ONE_TITLE", "exactly one <title>", `${route} -> ${m.titleCount}`);
      check(Boolean(m.title && m.title.trim()), "TITLE_NONEMPTY", "title is non-empty", route);
      check(m.descriptionCount === 1, "ONE_DESCRIPTION", "exactly one meta description", `${route} -> ${m.descriptionCount}`);
      check(Boolean(m.description && m.description.trim()), "DESCRIPTION_NONEMPTY", "description is non-empty", route);
      check(m.canonicalCount === 1, "ONE_CANONICAL", "exactly one canonical", `${route} -> ${m.canonicalCount}`);
      check(m.canonical === canonicalExpected, "CANONICAL_PRODUCTION", "canonical is the production URL", `${route} -> ${m.canonical}`);
      check(m.robotsCount === 0, "NO_ROBOTS", "indexable route emits no robots meta", `${route} -> ${m.robots ?? "(none)"}`);
      check(!/noindex/i.test(m.robots ?? ""), "NOT_NOINDEX", "indexable route is not noindex", `${route} -> ${m.robots ?? "(none)"}`);
      check(m.htmlLang === expectedLang, "HTML_LANG", "html lang matches route policy", `${route} -> ${m.htmlLang} (expected ${expectedLang})`);
      check(m.jsonLdCount === 1, "ONE_JSONLD", "exactly one JSON-LD block", `${route} -> ${m.jsonLdCount}`);
      check(m.jsonLdParseOk === true, "JSONLD_VALID", "JSON-LD parses", route);

      const nodes = graphNodes(m.jsonLd);
      const websites = nodes.filter((n) => n && n["@type"] === "WebSite");
      const webpages = nodes.filter((n) => n && n["@type"] === "WebPage");
      const types = nodes.map((n) => (n ? n["@type"] : null));
      check(websites.length === 1, "ONE_WEBSITE", "one WebSite node", `${route} -> ${websites.length}`);
      check(webpages.length === 1, "ONE_WEBPAGE", "one WebPage node", `${route} -> ${webpages.length}`);
      check(
        types.every((t) => SUPPORTED_JSONLD_TYPES.includes(t)),
        "JSONLD_TYPE_CEILING",
        "only WebSite/WebPage JSON-LD types",
        `${route} -> ${types.join(",")}`
      );
      const wp = webpages[0] ?? {};
      const ws = websites[0] ?? {};
      check(wp.name === m.title, "WEBPAGE_NAME", "WebPage name equals title", route);
      check(wp.description === m.description, "WEBPAGE_DESC_PARITY", "WebPage description equals meta description", route);
      check(wp.url === m.canonical, "WEBPAGE_URL", "WebPage url equals canonical", `${route} -> ${wp.url}`);
      check(wp.inLanguage === m.htmlLang, "WEBPAGE_INLANGUAGE", "WebPage inLanguage equals html lang", `${route} -> ${wp.inLanguage}`);
      if (expectedGenre !== undefined) {
        check(wp.genre === expectedGenre, "WEBPAGE_GENRE", "WebPage genre preserved exactly", `${route} -> ${wp.genre}`);
      }
      // WebSite semantics preserved exactly.
      check(ws.name === WEBSITE_NODE.name, "WEBSITE_NAME", "WebSite name preserved", route);
      check(ws.description === WEBSITE_NODE.description, "WEBSITE_DESC", "WebSite description preserved", route);
      check(ws.url === `${PRODUCTION_ORIGIN}/`, "WEBSITE_URL", "WebSite url is production origin", route);

      const keyFindings = forbiddenKeyFindings(m.jsonLd);
      check(keyFindings.length === 0, "NO_FORBIDDEN_KEYS", "no forbidden/banned metadata keys", `${route}: ${keyFindings.join(", ")}`);

      const originFindings = findForbiddenOriginUrls(m.head);
      check(originFindings.length === 0, "NO_PREVIEW_ORIGIN", "no workers.dev/preview origin in head", `${route}: ${originFindings.join(", ")}`);
      check(!isForbiddenPublicOrigin(m.canonical ?? ""), "CANONICAL_NOT_PREVIEW", "canonical is not a preview origin", `${route} -> ${m.canonical}`);
    }

    // --- interactive preview ---------------------------------------------
    {
      const route = INTERACTIVE_ROUTE;
      const { status, body } = await renderRoute(route);
      check(status === 200, "INTERACTIVE_RENDERED", "interactive preview renders 200", `${status}`);
      const m = extractMetadata(body);
      check(m.ok, "INTERACTIVE_HEAD", "interactive has <head>", route);
      check(m.titleCount === 1 && Boolean(m.title), "INTERACTIVE_TITLE", "interactive title present", route);
      check(m.descriptionCount === 1 && Boolean(m.description), "INTERACTIVE_DESCRIPTION", "interactive description present", route);
      check(m.htmlLang === "en", "INTERACTIVE_LANG", "interactive lang en", `${m.htmlLang}`);
      check(m.canonicalCount === 1 && m.canonical === `${PRODUCTION_ORIGIN}${route}`, "INTERACTIVE_CANONICAL", "interactive one self canonical", `${m.canonical}`);
      check(m.robots === "noindex, nofollow", "INTERACTIVE_ROBOTS", "interactive robots is exactly noindex, nofollow", `${m.robots}`);
      check(m.jsonLdCount === 1 && m.jsonLdParseOk === true, "INTERACTIVE_JSONLD", "interactive one valid JSON-LD graph", route);
      const nodes = graphNodes(m.jsonLd);
      const wp = nodes.find((n) => n && n["@type"] === "WebPage") ?? {};
      const ws = nodes.find((n) => n && n["@type"] === "WebSite") ?? {};
      const types = nodes.map((n) => (n ? n["@type"] : null));
      check(
        types.length === 2 && types.every((t) => SUPPORTED_JSONLD_TYPES.includes(t)),
        "INTERACTIVE_TYPES",
        "interactive WebSite/WebPage only",
        types.join(",")
      );
      check(wp.url === m.canonical, "INTERACTIVE_URL_PARITY", "interactive WebPage url equals canonical", `${wp.url}`);
      check(wp.inLanguage === m.htmlLang, "INTERACTIVE_LANG_PARITY", "interactive inLanguage equals html lang", `${wp.inLanguage}`);
      check(wp.description === m.description, "INTERACTIVE_DESC_PARITY", "interactive WebPage description equals meta description", route);
      check(ws.name === WEBSITE_NODE.name, "INTERACTIVE_WEBSITE", "interactive WebSite preserved", route);
      check(forbiddenKeyFindings(m.jsonLd).length === 0, "INTERACTIVE_NO_FORBIDDEN", "interactive no forbidden keys", route);
      check(findForbiddenOriginUrls(m.head).length === 0, "INTERACTIVE_NO_PREVIEW", "interactive no preview origin in head", route);
    }

    // --- prototype -------------------------------------------------------
    {
      const route = PROTOTYPE_ROUTE;
      const { status, body } = await renderRoute(route);
      check(status === 200, "PROTOTYPE_RENDERED", "prototype renders 200", `${status}`);
      const m = extractMetadata(body);
      check(m.titleCount === 1 && Boolean(m.title), "PROTOTYPE_TITLE", "prototype title present", route);
      check(m.descriptionCount === 1 && Boolean(m.description), "PROTOTYPE_DESCRIPTION", "prototype description present", route);
      check(m.htmlLang === "en", "PROTOTYPE_LANG", "prototype lang en", `${m.htmlLang}`);
      check(m.robots === "noindex, nofollow", "PROTOTYPE_ROBOTS", "prototype robots noindex, nofollow", `${m.robots}`);
      check(m.canonicalCount === 0, "PROTOTYPE_NO_CANONICAL", "prototype has no canonical", `${m.canonicalCount}`);
      check(m.jsonLdCount === 0, "PROTOTYPE_NO_JSONLD", "prototype has no JSON-LD", `${m.jsonLdCount}`);
    }

    // --- 404 -------------------------------------------------------------
    {
      const { status, body } = await renderRoute(NOT_FOUND_PROBE);
      check(status === 404, "NOTFOUND_STATUS", "unmatched route returns 404", `${status}`);
      const m = extractMetadata(body);
      check(m.titleCount === 1 && Boolean(m.title), "NOTFOUND_TITLE", "404 title present", "");
      check(m.htmlLang === "en", "NOTFOUND_LANG", "404 lang en", `${m.htmlLang}`);
      check(m.robots === "noindex, follow", "NOTFOUND_ROBOTS", "404 robots noindex, follow", `${m.robots}`);
      check(m.canonicalCount === 0, "NOTFOUND_NO_CANONICAL", "404 has no canonical", `${m.canonicalCount}`);
      check(m.jsonLdCount === 0, "NOTFOUND_NO_JSONLD", "404 has no JSON-LD", `${m.jsonLdCount}`);
      // description is optional for 404 — not asserted.
    }

    // --- JSON endpoint classes ------------------------------------------
    for (const route of JSON_ENDPOINTS) {
      const { status, body, contentType } = await renderRoute(route);
      check(status === 200, "JSON_ENDPOINT_STATUS", "json endpoint renders 200", `${route} -> ${status}`);
      check(/application\/json/i.test(contentType ?? ""), "JSON_ENDPOINT_CT", "json endpoint is application/json", `${route} -> ${contentType}`);
      let jsonOk = false;
      try {
        JSON.parse(body);
        jsonOk = true;
      } catch {
        jsonOk = false;
      }
      check(jsonOk, "JSON_ENDPOINT_PARSE", "json endpoint body is valid JSON", route);
      check(headSlice(body) === null, "JSON_ENDPOINT_NO_HTML", "json endpoint is not an HTML metadata route", route);
    }
  }, {
    port: boundPort,
    fetchImpl,
    routeFetchTimeoutMs,
    readinessFetchTimeoutMs,
    readinessTotalMs,
    readinessIntervalMs
  });

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
  process.stdout.write(`\nverify-metadata-build: ${passed}/${results.length} checks passed\n`);
  if (failed) {
    process.stdout.write("\nverify-metadata-build: FAILED\n");
    process.exit(1);
  }
  // Force a clean exit. Even after killTree, a lingering child handle could keep
  // the event loop alive and stall the check chain; the contract is fully
  // evaluated by this point, so exit deterministically on success.
  process.exit(0);
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const portArg = process.argv.find((a) => /^--port=/.test(a));
  // Default: an OS-assigned free port (see getFreePort). An explicit --port is
  // honored for manual runs.
  const port = portArg ? Number(portArg.split("=")[1]) : undefined;
  verifyMetadataBuild({ port }).then(reportAndExit).catch((err) => {
    process.stdout.write(`verify-metadata-build: ERROR ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
