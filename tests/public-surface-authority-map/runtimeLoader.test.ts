// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Phase 2B runtime-loader tests.
//
// Node 22 built-in test runner + assert only (no test dependency). Exercises the
// ACTUAL production loader against deterministic mocked fetch responses and a
// controlled shared budget. Every failure case asserts a stable (stage, code)
// pair; identity/contract failures also assert the underlying detail code, so a
// coercion or silent repair would surface as a wrong/missing code and fail.
//
// The loader operates on decoded response-body bytes, so compressed transport is
// irrelevant to loader identity: these tests supply already-decoded bytes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  loadVerifiedRuntimeSnapshot,
  bootRuntimeLoader,
  __resetRuntimeLoaderBootForTests,
  assertSchemaVersionsAgree,
  MANIFEST_PATH,
  SNAPSHOT_PREFIX,
  MANIFEST_MAX_BYTES,
  SNAPSHOT_MAX_BYTES,
  TOTAL_BUDGET_MS,
} from "../../src/lib/public-surface-authority-map/runtimeLoader.ts";
import {
  toUtf8Bytes,
  sha256Hex,
  gitBlobSha1Hex,
} from "../../src/lib/public-surface-authority-map/byteIdentity.ts";
import { snapshotPathForId } from "../../src/lib/public-surface-authority-map/runtimeManifestContract.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const ORIGIN = "https://map.test";
const COMMIT = "18491105f0bc0451e0bf99eaa78c39f69c7cb57c";

const APPROVED_SNAPSHOT_ID =
  "18491105f0bc0451e0bf99eaa78c39f69c7cb57c-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e";

const baseSnapshotObj = JSON.parse(
  rd(`src/data/public-surface-authority-map/runtime-snapshots/${APPROVED_SNAPSHOT_ID}.json`),
);

// Track (stage:code) and detail codes exercised, for the delivery report.
const seen = new Set();

// --- Byte / identity helpers -------------------------------------------------

async function identityOf(bytes) {
  return {
    byteLength: bytes.length,
    sha256: await sha256Hex(bytes),
    gitBlob: await gitBlobSha1Hex(bytes),
  };
}

function manifestObj({ sourceCommit = COMMIT, sha256, gitBlob, byteLength }) {
  const id = `${sourceCommit}-${sha256}`;
  return {
    schema_version: "1.0",
    map_id: "public-surface-authority-map",
    selected_snapshot: {
      id,
      source_commit: sourceCommit,
      snapshot_schema_version: "1.0",
      path: snapshotPathForId(id),
      byte_length: byteLength,
      sha256,
      git_blob: gitBlob,
    },
    currentness_claim: "none",
  };
}

async function validManifestFor(snapBytes) {
  const idn = await identityOf(snapBytes);
  return manifestObj({ sha256: idn.sha256, gitBlob: idn.gitBlob, byteLength: idn.byteLength });
}

// --- Mock transport ----------------------------------------------------------

function streamBody(bytes) {
  return {
    getReader() {
      let done = false;
      return {
        async read() {
          if (done) return { done: true, value: undefined };
          done = true;
          return { done: false, value: bytes };
        },
        async cancel() {},
      };
    },
  };
}

// A body that emits many small chunks so a bounded reader can reject partway
// without buffering the whole oversize payload.
function chunkedBody(totalBytes, chunkSize = 4096) {
  return {
    getReader() {
      let sent = 0;
      return {
        async read() {
          if (sent >= totalBytes) return { done: true, value: undefined };
          const n = Math.min(chunkSize, totalBytes - sent);
          sent += n;
          return { done: false, value: new Uint8Array(n) };
        },
        async cancel() {},
      };
    },
  };
}

function makeResp(
  bytes,
  { url, ok = true, redirected = false, contentType = "application/json; charset=utf-8", hasBody = true, body },
) {
  return {
    ok,
    url,
    redirected,
    headers: { get: (n) => (n.toLowerCase() === "content-type" ? contentType : null) },
    body: hasBody ? (body ?? streamBody(bytes)) : null,
  };
}

function makeFetch(routes) {
  const calls = [];
  const fn = async (input, init) => {
    const u = new URL(input);
    calls.push(u.pathname);
    const handler = routes[u.pathname];
    if (!handler) throw new Error(`no mock route for ${u.pathname}`);
    return handler(input, init);
  };
  fn.calls = calls;
  return fn;
}

function abortError() {
  const e = new Error("aborted");
  e.name = "AbortError";
  return e;
}

function hang() {
  return (input, init) =>
    new Promise((_resolve, reject) => {
      const signal = init.signal;
      if (signal.aborted) return reject(abortError());
      signal.addEventListener("abort", () => reject(abortError()), { once: true });
    });
}

async function run(routes, { budgetMs = TOTAL_BUDGET_MS } = {}) {
  const fetchMock = makeFetch(routes);
  const result = await loadVerifiedRuntimeSnapshot({ fetch: fetchMock, origin: ORIGIN, budgetMs });
  return { result, calls: fetchMock.calls };
}

// Assert a bounded failure with the given stage/code (+ optional detail).
function expectFailure(result, stage, code, detail) {
  assert.equal(result.ok, false, `expected failure, got ${JSON.stringify(result).slice(0, 120)}`);
  seen.add(`${result.stage}:${result.code}`);
  if (result.detail) seen.add(`detail:${result.detail}`);
  assert.equal(result.stage, stage, `stage: got ${result.stage} (${result.code}/${result.detail})`);
  assert.equal(result.code, code, `code: got ${result.code} (detail ${result.detail})`);
  if (detail !== undefined) assert.equal(result.detail, detail, `detail: got ${result.detail}`);
}

// Build a manifest-only failure scenario and assert: 1 manifest request, no
// snapshot request, bounded failure, no retry.
async function manifestFailure({ routesOverride, manifestBytes, manifestResp } = {}) {
  const routes =
    routesOverride ??
    {
      [MANIFEST_PATH]: () =>
        manifestResp ?? makeResp(manifestBytes, { url: ORIGIN + MANIFEST_PATH }),
    };
  const { result, calls } = await run(routes);
  assert.equal(calls.length, 1, `expected exactly 1 request, got ${calls.length}`);
  assert.equal(calls[0], MANIFEST_PATH);
  return result;
}

// --- Success -----------------------------------------------------------------

test("success: manifest + snapshot valid — 2 requests, correct order, verified snapshot", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;

  const { result, calls } = await run({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(snapBytes, { url: ORIGIN + spath }),
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 2, "exactly two requests");
  assert.equal(calls[0], MANIFEST_PATH, "manifest first");
  assert.equal(calls[1], spath, "snapshot second");
  assert.ok(spath.startsWith(SNAPSHOT_PREFIX), "snapshot path under approved prefix");
  assert.equal(result.snapshot.nodes.length, baseSnapshotObj.nodes.length);
  assert.equal(result.manifest.selected_snapshot.id, manifest.selected_snapshot.id);
});

test("success: decoded-byte identity is transport-agnostic (compression irrelevant)", async () => {
  // The loader validates decoded bytes; supplying the same decoded bytes via a
  // multi-chunk body (as a decompressor would) still verifies identical.
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const multiChunk = {
    getReader() {
      const parts = [snapBytes.slice(0, 10), snapBytes.slice(10)];
      let i = 0;
      return {
        async read() {
          if (i >= parts.length) return { done: true, value: undefined };
          return { done: false, value: parts[i++] };
        },
        async cancel() {},
      };
    },
  };
  const { result, calls } = await run({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(null, { url: ORIGIN + spath, body: multiChunk }),
  });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
});

test("success: manifest-selected snapshot with agreeing id/path/schema/identity", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const { result } = await run({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(snapBytes, { url: ORIGIN + spath }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.schema_version, manifest.selected_snapshot.snapshot_schema_version);
});

test("success: internally-consistent counts different from Phase 1 fixed counts", async () => {
  // Keep the first 6 nodes; drop edges with a removed endpoint; recompute counts.
  const keep = new Set(baseSnapshotObj.nodes.slice(0, 6).map((n) => n.id));
  const nodes = baseSnapshotObj.nodes.filter((n) => keep.has(n.id));
  const edges = baseSnapshotObj.edges.filter((e) => keep.has(e.source) && keep.has(e.target));
  let br = 0;
  let su = 0;
  for (const e of edges) {
    if (e.relation_type === "boundary_reference") br += 1;
    else su += 1;
  }
  const subset = {
    ...baseSnapshotObj,
    nodes,
    edges,
    generated_record_count: nodes.length,
    edge_counts: { boundary_reference: br, source_use_reference: su },
  };
  assert.notEqual(nodes.length, baseSnapshotObj.nodes.length, "counts differ from Phase 1");

  const snapBytes = toUtf8Bytes(JSON.stringify(subset));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const { result } = await run({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(snapBytes, { url: ORIGIN + spath }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.nodes.length, 6);
});

// --- Manifest transport failures --------------------------------------------

test("manifest: 404 / non-OK", async () => {
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () => makeResp(new Uint8Array(0), { url: ORIGIN + MANIFEST_PATH, ok: false }),
    },
  });
  expectFailure(r, "manifest", "http");
});

test("manifest: redirected response", async () => {
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () =>
        makeResp(new Uint8Array(0), { url: ORIGIN + MANIFEST_PATH, redirected: true }),
    },
  });
  expectFailure(r, "manifest", "redirect");
});

test("manifest: wrong final origin", async () => {
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () =>
        makeResp(new Uint8Array(0), { url: "https://evil.test" + MANIFEST_PATH }),
    },
  });
  expectFailure(r, "manifest", "origin");
});

test("manifest: wrong final pathname", async () => {
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () => makeResp(new Uint8Array(0), { url: ORIGIN + "/other.json" }),
    },
  });
  expectFailure(r, "manifest", "pathname");
});

test("manifest: wrong MIME", async () => {
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () =>
        makeResp(toUtf8Bytes("{}"), { url: ORIGIN + MANIFEST_PATH, contentType: "text/html" }),
    },
  });
  expectFailure(r, "manifest", "mime");
});

test("manifest: missing body", async () => {
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () => makeResp(null, { url: ORIGIN + MANIFEST_PATH, hasBody: false }),
    },
  });
  expectFailure(r, "manifest", "body");
});

test("manifest: timeout (shared budget) — 1 request, no snapshot", async () => {
  const fetchMock = makeFetch({ [MANIFEST_PATH]: hang() });
  const result = await loadVerifiedRuntimeSnapshot({ fetch: fetchMock, origin: ORIGIN, budgetMs: 30 });
  expectFailure(result, "manifest", "timeout");
  assert.equal(fetchMock.calls.length, 1);
});

test("manifest: response over 16 KiB", async () => {
  const big = MANIFEST_MAX_BYTES + 1;
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () =>
        makeResp(null, { url: ORIGIN + MANIFEST_PATH, body: chunkedBody(big) }),
    },
  });
  expectFailure(r, "manifest", "oversize");
});

test("manifest: invalid UTF-8", async () => {
  const bad = new Uint8Array([0x7b, 0xff, 0xfe]); // "{" then invalid
  const r = await manifestFailure({ manifestBytes: bad });
  expectFailure(r, "manifest", "utf8");
});

test("manifest: malformed JSON", async () => {
  const r = await manifestFailure({ manifestBytes: toUtf8Bytes("{ not json") });
  expectFailure(r, "manifest", "json");
});

test("manifest: final response URL has a non-empty query", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const r = await manifestFailure({
    routesOverride: {
      // Exact origin + pathname, but the final URL carries a query string.
      [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH + "?x=1" }),
    },
  });
  expectFailure(r, "manifest", "query");
});

test("manifest: final response URL has a non-empty fragment", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const r = await manifestFailure({
    routesOverride: {
      [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH + "#frag" }),
    },
  });
  expectFailure(r, "manifest", "fragment");
});

test("loader: already-aborted signal issues zero requests, no retry, no timer restart", async () => {
  const controller = new AbortController();
  controller.abort();
  const fetchMock = makeFetch({
    [MANIFEST_PATH]: () => {
      throw new Error("fetch must not be called on a pre-aborted signal");
    },
  });
  const result = await loadVerifiedRuntimeSnapshot({
    fetch: fetchMock,
    origin: ORIGIN,
    budgetMs: 10000,
    controller,
  });
  seen.add(`${result.stage}:${result.code}`);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "manifest");
  assert.equal(result.code, "aborted");
  assert.equal(fetchMock.calls.length, 0, "zero network requests on pre-aborted signal");
});

// --- Manifest contract failures (detail = underlying contract code) ----------

async function manifestContractFailure(mutate) {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  mutate(manifest);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const r = await manifestFailure({ manifestBytes: manBytes });
  assert.equal(r.ok, false);
  seen.add(`${r.stage}:${r.code}`);
  if (r.detail) seen.add(`detail:${r.detail}`);
  assert.equal(r.stage, "manifest");
  assert.equal(r.code, "contract");
  return r;
}

test("manifest contract: unknown field", async () => {
  const r = await manifestContractFailure((m) => {
    m.unexpected_extra = true;
  });
  assert.equal(r.detail, "unexpected_field");
});

test("manifest contract: schema_version mismatch", async () => {
  const r = await manifestContractFailure((m) => {
    m.schema_version = "2.0";
  });
  assert.equal(r.detail, "schema_version");
});

test("manifest contract: map_id mismatch", async () => {
  const r = await manifestContractFailure((m) => {
    m.map_id = "other-map";
  });
  assert.equal(r.detail, "map_id");
});

test("manifest contract: non-none currentness claim", async () => {
  const r = await manifestContractFailure((m) => {
    m.currentness_claim = "current";
  });
  assert.equal(r.detail, "currentness_claim");
});

test("manifest contract: malformed id", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.id = "not-a-valid-id";
  });
  assert.equal(r.detail, "id_composition");
});

test("manifest contract: uppercase identity", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.sha256 = m.selected_snapshot.sha256.toUpperCase();
  });
  assert.equal(r.detail, "sha256");
});

test("manifest contract: path mismatch", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.path = SNAPSHOT_PREFIX + "a".repeat(40) + "-" + "b".repeat(64) + ".json";
  });
  assert.equal(r.detail, "path_mismatch");
});

test("manifest contract: traversal path", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.path = SNAPSHOT_PREFIX + "../secret.json";
  });
  assert.equal(r.detail, "path_traversal");
});

test("manifest contract: percent-encoded traversal path", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.path = SNAPSHOT_PREFIX + "%2e%2e/secret.json";
  });
  assert.equal(r.detail, "path_percent_traversal");
});

test("manifest contract: query in path", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.path = m.selected_snapshot.path + "?x=1";
  });
  assert.equal(r.detail, "path_query");
});

test("manifest contract: fragment in path", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.path = m.selected_snapshot.path + "#frag";
  });
  assert.equal(r.detail, "path_fragment");
});

test("manifest contract: backslash in path", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.path = SNAPSHOT_PREFIX + "evil\\x.json";
  });
  assert.equal(r.detail, "path_backslash");
});

test("manifest contract: advertised snapshot oversize", async () => {
  const r = await manifestContractFailure((m) => {
    m.selected_snapshot.byte_length = SNAPSHOT_MAX_BYTES + 1;
  });
  assert.equal(r.detail, "byte_length_max");
});

// --- Snapshot failures (exactly two requests) --------------------------------

// Build a scenario: valid manifest whose declared identity matches the SERVED
// snapshot bytes unless an override changes the identity/body. Returns result +
// calls and asserts exactly two requests with the snapshot second.
async function snapshotScenario({ snapObj = baseSnapshotObj, snapBytesOverride, manifestMutate, snapResp, budgetMs } = {}) {
  const snapBytes = snapBytesOverride ?? toUtf8Bytes(JSON.stringify(snapObj));
  const manifest = await validManifestFor(snapBytes);
  if (manifestMutate) await manifestMutate(manifest, snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const { result, calls } = await run(
    {
      [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
      [spath]: snapResp ?? (() => makeResp(snapBytes, { url: ORIGIN + spath })),
    },
    { budgetMs },
  );
  assert.equal(calls.length, 2, `expected 2 requests, got ${calls.length}`);
  assert.equal(calls[0], MANIFEST_PATH);
  assert.equal(calls[1], spath);
  return { result, spath };
}

test("snapshot: 404 / non-OK", async () => {
  const { result } = await snapshotScenario({
    snapResp: () => makeResp(new Uint8Array(0), { url: ORIGIN + "/x", ok: false }),
  });
  expectFailure(result, "snapshot", "http");
});

test("snapshot: redirected response", async () => {
  const { result, spath } = await snapshotScenario({
    snapResp: () => makeResp(new Uint8Array(0), { url: ORIGIN + snapshotPathForId(`${COMMIT}-${"0".repeat(64)}`), redirected: true }),
  });
  expectFailure(result, "snapshot", "redirect");
});

test("snapshot: wrong final origin", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const spath = manifest.selected_snapshot.path;
  const { result } = await snapshotScenario({
    snapResp: () => makeResp(snapBytes, { url: "https://evil.test" + spath }),
  });
  expectFailure(result, "snapshot", "origin");
});

test("snapshot: wrong final pathname", async () => {
  const { result } = await snapshotScenario({
    snapResp: () => makeResp(new Uint8Array(0), { url: ORIGIN + SNAPSHOT_PREFIX + "different.json" }),
  });
  expectFailure(result, "snapshot", "pathname");
});

test("snapshot: wrong MIME", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const spath = manifest.selected_snapshot.path;
  const { result } = await snapshotScenario({
    snapResp: () => makeResp(snapBytes, { url: ORIGIN + spath, contentType: "text/plain" }),
  });
  expectFailure(result, "snapshot", "mime");
});

test("snapshot: missing body", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const spath = manifest.selected_snapshot.path;
  const { result } = await snapshotScenario({
    snapResp: () => makeResp(null, { url: ORIGIN + spath, hasBody: false }),
  });
  expectFailure(result, "snapshot", "body");
});

test("snapshot: shared timeout budget exceeded — 2 requests", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const fetchMock = makeFetch({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: hang(),
  });
  const result = await loadVerifiedRuntimeSnapshot({ fetch: fetchMock, origin: ORIGIN, budgetMs: 30 });
  expectFailure(result, "snapshot", "timeout");
  assert.equal(fetchMock.calls.length, 2);
});

test("snapshot: response over 256 KiB", async () => {
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const spath = manifest.selected_snapshot.path;
  const { result } = await snapshotScenario({
    snapResp: () => makeResp(null, { url: ORIGIN + spath, body: chunkedBody(SNAPSHOT_MAX_BYTES + 1) }),
  });
  expectFailure(result, "snapshot", "oversize");
});

test("snapshot: wrong byte length", async () => {
  const { result } = await snapshotScenario({
    manifestMutate: (m) => {
      m.selected_snapshot.byte_length = m.selected_snapshot.byte_length + 1;
    },
  });
  expectFailure(result, "snapshot", "identity", "byte_length");
});

test("snapshot: wrong SHA-256", async () => {
  const { result } = await snapshotScenario({
    manifestMutate: (m) => {
      // Change sha256 (and derived id/path) so manifest stays internally valid
      // but no longer matches the served bytes.
      const wrong = "0".repeat(64);
      m.selected_snapshot.sha256 = wrong;
      m.selected_snapshot.id = `${m.selected_snapshot.source_commit}-${wrong}`;
      m.selected_snapshot.path = snapshotPathForId(m.selected_snapshot.id);
    },
  });
  expectFailure(result, "snapshot", "identity", "sha256");
});

test("snapshot: wrong Git blob", async () => {
  const { result } = await snapshotScenario({
    manifestMutate: (m) => {
      m.selected_snapshot.git_blob = "0".repeat(40);
    },
  });
  expectFailure(result, "snapshot", "identity", "git_blob");
});

// For content-shaped failures the manifest identity must match the SERVED bytes,
// so compute identity over the mutated bytes.
async function snapshotContentFailure(bytes, expectedDetail, codeOverride = "contract") {
  const manifest = await validManifestFor(bytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const { result, calls } = await run({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(bytes, { url: ORIGIN + spath }),
  });
  assert.equal(calls.length, 2);
  expectFailure(result, "snapshot", codeOverride, expectedDetail);
  return result;
}

test("snapshot: invalid UTF-8 (identity passes, decode fails)", async () => {
  const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
  await snapshotContentFailure(bytes, "utf8_decode", "utf8");
});

test("snapshot: malformed JSON", async () => {
  const bytes = toUtf8Bytes("{ not json");
  const manifest = await validManifestFor(bytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const { result } = await run({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(bytes, { url: ORIGIN + spath }),
  });
  expectFailure(result, "snapshot", "json");
});

function mutantSnapshotBytes(mutate) {
  const clone = structuredClone(baseSnapshotObj);
  mutate(clone);
  return toUtf8Bytes(JSON.stringify(clone));
}

test("snapshot contract: invalid schema version", async () => {
  await snapshotContentFailure(mutantSnapshotBytes((s) => (s.schema_version = "2.0")), "schema_version");
});

test("snapshot contract: authority-elevating value", async () => {
  await snapshotContentFailure(
    mutantSnapshotBytes((s) => (s.authority_ceiling = "full_authority")),
    "top_level_authority_ceiling",
  );
});

test("snapshot contract: confirmed relation", async () => {
  await snapshotContentFailure(
    mutantSnapshotBytes((s) => (s.edges[0].relation_status = "confirmed")),
    "edge_navigation_only",
  );
});

test("snapshot contract: duplicate node id", async () => {
  await snapshotContentFailure(
    mutantSnapshotBytes((s) => (s.nodes[1].id = s.nodes[0].id)),
    "node_id_unique",
  );
});

test("snapshot contract: duplicate edge id", async () => {
  await snapshotContentFailure(
    mutantSnapshotBytes((s) => (s.edges[1].id = s.edges[0].id)),
    "edge_id_unique",
  );
});

test("snapshot contract: unknown edge endpoint", async () => {
  await snapshotContentFailure(
    mutantSnapshotBytes((s) => (s.edges[0].target = "no-such-node")),
    "edge_endpoint_exists",
  );
});

test("snapshot contract: altered required boundary statement", async () => {
  await snapshotContentFailure(
    mutantSnapshotBytes((s) => (s.boundary_statements[0] = "Selected public surface only")),
    "boundary_statements",
  );
});

test("snapshot: manifest/snapshot schema cross-check (defensive guard)", () => {
  assert.throws(() => assertSchemaVersionsAgree("1.0", "2.0"), /schema_version_mismatch/);
  assert.doesNotThrow(() => assertSchemaVersionsAgree("1.0", "1.0"));
});

// --- Boot behavior -----------------------------------------------------------

test("boot: multiple boot calls do not issue duplicate request pairs", async () => {
  __resetRuntimeLoaderBootForTests();
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const fetchMock = makeFetch({
    [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
    [spath]: () => makeResp(snapBytes, { url: ORIGIN + spath }),
  });
  const p1 = bootRuntimeLoader({ fetch: fetchMock, origin: ORIGIN });
  const p2 = bootRuntimeLoader({ fetch: fetchMock, origin: ORIGIN });
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(r1, r2, "same settled result object (one boot)");
  assert.equal(r1.ok, true);
  assert.equal(fetchMock.calls.length, 2, "exactly one request pair across repeated boots");
  __resetRuntimeLoaderBootForTests();
});

test("boot: no background request after success; no retry after failure", async () => {
  __resetRuntimeLoaderBootForTests();
  // Failure boot: manifest 404. No retry, single request, latch holds.
  const fetchMock = makeFetch({
    [MANIFEST_PATH]: () => makeResp(new Uint8Array(0), { url: ORIGIN + MANIFEST_PATH, ok: false }),
  });
  const r = await bootRuntimeLoader({ fetch: fetchMock, origin: ORIGIN });
  expectFailure(r, "manifest", "http");
  // A second boot returns the same failure without a new request (no retry).
  const r2 = await bootRuntimeLoader({ fetch: fetchMock, origin: ORIGIN });
  assert.equal(r, r2);
  assert.equal(fetchMock.calls.length, 1, "no retry / no background request");
  // Give any (non-existent) scheduled work a tick; still exactly one request.
  await new Promise((res) => setTimeout(res, 20));
  assert.equal(fetchMock.calls.length, 1);
  __resetRuntimeLoaderBootForTests();
});

test("boot: abort timer cleared on success (process does not hang)", async () => {
  __resetRuntimeLoaderBootForTests();
  const snapBytes = toUtf8Bytes(JSON.stringify(baseSnapshotObj));
  const manifest = await validManifestFor(snapBytes);
  const manBytes = toUtf8Bytes(JSON.stringify(manifest));
  const spath = manifest.selected_snapshot.path;
  const result = await loadVerifiedRuntimeSnapshot({
    fetch: makeFetch({
      [MANIFEST_PATH]: () => makeResp(manBytes, { url: ORIGIN + MANIFEST_PATH }),
      [spath]: () => makeResp(snapBytes, { url: ORIGIN + spath }),
    }),
    origin: ORIGIN,
    budgetMs: 10000,
  });
  assert.equal(result.ok, true);
  // If the 10s timer were not cleared, `node --test` would keep the event loop
  // alive well past this test; the suite completing promptly confirms cleanup.
});

// --- Report ------------------------------------------------------------------

test("report: distinct loader result codes exercised", () => {
  const codes = [...seen].sort();
  console.log(`LOADER_RESULT_CODES(${codes.length}): ${codes.join(", ")}`);
  assert.ok(codes.length >= 30, `expected >= 30 distinct codes, got ${codes.length}`);
});
