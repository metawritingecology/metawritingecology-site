// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — browser runtime-loader tests.
//
// The loader is driven through its injectable fetch seam, so every transport,
// identity, and contract failure path is exercised without a browser. Each case
// asserts BOTH the stable failure code AND that no snapshot was produced, which
// is what "the bundled fallback is preserved" means at this layer: the caller
// only ever activates on `ok: true`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  loadVerifiedRuntimeSnapshot,
  bootRuntimeLoader,
  __resetAdjacencyLoaderBootForTests,
  assertSchemaVersionsAgree,
  computeIdentity,
  LOADER_ERROR_CODES,
  MANIFEST_PATH,
  SNAPSHOT_PREFIX,
  SNAPSHOT_MAX_BYTES,
} from "../../src/lib/public-surface-adjacency-map/runtimeLoader.ts";
import {
  SELECTED_SNAPSHOT_ID,
  SELECTED_BYTE_LENGTH,
  SELECTED_SHA256,
  SELECTED_GIT_BLOB,
  snapshotPathForId,
} from "../../src/lib/public-surface-adjacency-map/runtimeManifestContract.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const ORIGIN = "https://metawritingecology.org";
const SNAPSHOT_PATH = snapshotPathForId(SELECTED_SNAPSHOT_ID);

const rawManifest = rd("src/data/public-surface-adjacency-map/runtime-manifest.json");
const rawSnapshot = rd("src/data/public-surface-adjacency-map/last-known-good.json");

const encoder = new TextEncoder();

// --- Fake transport ---------------------------------------------------------

/** One fake response. `bytes` may be a Uint8Array or a string. */
const response = (bytes, { ok = true, contentType = "application/json; charset=utf-8", url, redirected = false } = {}) => {
  const body = typeof bytes === "string" ? encoder.encode(bytes) : bytes;
  return {
    ok,
    url,
    redirected,
    headers: { get: (name) => (name.toLowerCase() === "content-type" ? contentType : null) },
    body:
      body === null
        ? null
        : {
            getReader() {
              let sent = false;
              return {
                async read() {
                  if (sent) return { done: true };
                  sent = true;
                  return { done: false, value: body };
                },
                cancel() {},
              };
            },
          },
  };
};

/**
 * Build a fetch seam that records every requested URL. `plan` maps a pathname to
 * a response factory; an unplanned pathname resolves to a 404.
 */
const transport = (plan) => {
  const requests = [];
  const fetchImpl = async (input) => {
    requests.push(input);
    const pathname = new URL(input).pathname;
    const make = plan[pathname];
    if (!make) return response("not found", { ok: false, url: input });
    return make(input);
  };
  return { fetchImpl, requests };
};

const okManifest = (url) => response(rawManifest, { url });
const okSnapshot = (url) => response(rawSnapshot, { url });

const run = (plan, extra = {}) => {
  const { fetchImpl, requests } = transport(plan);
  return loadVerifiedRuntimeSnapshot({ fetch: fetchImpl, origin: ORIGIN, ...extra }).then(
    (result) => ({ result, requests }),
  );
};

/** Every failure result must be complete-refusal shaped: no partial payload. */
const assertNoPartialActivation = (result) => {
  assert.equal(result.ok, false);
  assert.equal(result.snapshot, undefined, "a failed load must expose no snapshot");
  assert.equal(result.manifest, undefined, "a failed load must expose no manifest");
  assert.ok(LOADER_ERROR_CODES.includes(result.code), `unstable code: ${result.code}`);
};

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------

test("successful same-origin activation returns a complete verified snapshot", async () => {
  const { result, requests } = await run({
    [MANIFEST_PATH]: okManifest,
    [SNAPSHOT_PATH]: okSnapshot,
  });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.nodes.length, 59);
  assert.equal(result.snapshot.edges.length, 383);
  assert.equal(result.manifest.map_id, "public-surface-adjacency-map");
  assert.equal(result.manifest.currentness_claim, "none");
  assert.deepEqual(requests, [`${ORIGIN}${MANIFEST_PATH}`, `${ORIGIN}${SNAPSHOT_PATH}`]);
});

test("exactly one manifest request and at most one snapshot request", async () => {
  const success = await run({ [MANIFEST_PATH]: okManifest, [SNAPSHOT_PATH]: okSnapshot });
  assert.equal(success.requests.filter((u) => u.endsWith("manifest.json")).length, 1);
  assert.equal(success.requests.filter((u) => u.includes("/snapshots/")).length, 1);
  assert.equal(success.requests.length, 2);

  const manifestFailure = await run({});
  assert.equal(manifestFailure.requests.length, 1, "a manifest failure must not request a snapshot");
});

test("every requested URL is same origin; no GitHub or external data origin is contacted", async () => {
  const { requests } = await run({ [MANIFEST_PATH]: okManifest, [SNAPSHOT_PATH]: okSnapshot });
  for (const url of requests) {
    assert.equal(new URL(url).origin, ORIGIN);
    assert.ok(new URL(url).pathname.startsWith("/public-surface-map/expanded/data/"));
  }
  const source = rd("src/lib/public-surface-adjacency-map/runtimeLoader.ts");
  for (const forbidden of [
    "github.com",
    "raw.githubusercontent.com",
    "osf.io",
    "cdn.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "serviceWorker",
    "navigator.sendBeacon",
    "setInterval",
    "eval(",
    "import(",
  ]) {
    assert.ok(!source.includes(forbidden), `runtime loader must not reference ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// Failure paths — all preserve the bundled fallback
// ---------------------------------------------------------------------------

test("manifest 404 preserves the fallback", async () => {
  const { result, requests } = await run({});
  assertNoPartialActivation(result);
  assert.equal(result.stage, "manifest");
  assert.equal(result.code, "http");
  assert.equal(requests.length, 1);
});

test("snapshot 404 preserves the fallback", async () => {
  const { result, requests } = await run({ [MANIFEST_PATH]: okManifest });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "snapshot");
  assert.equal(result.code, "http");
  assert.equal(requests.length, 2);
});

test("wrong MIME preserves the fallback at either stage", async () => {
  const manifestMime = await run({
    [MANIFEST_PATH]: (url) => response(rawManifest, { url, contentType: "text/html" }),
  });
  assertNoPartialActivation(manifestMime.result);
  assert.equal(manifestMime.result.stage, "manifest");
  assert.equal(manifestMime.result.code, "mime");

  const snapshotMime = await run({
    [MANIFEST_PATH]: okManifest,
    [SNAPSHOT_PATH]: (url) => response(rawSnapshot, { url, contentType: "text/plain" }),
  });
  assertNoPartialActivation(snapshotMime.result);
  assert.equal(snapshotMime.result.stage, "snapshot");
  assert.equal(snapshotMime.result.code, "mime");
});

test("oversized payload preserves the fallback", async () => {
  const oversize = new Uint8Array(SNAPSHOT_MAX_BYTES + 1).fill(0x20);
  const { result } = await run({
    [MANIFEST_PATH]: okManifest,
    [SNAPSHOT_PATH]: (url) => response(oversize, { url }),
  });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "snapshot");
  assert.equal(result.code, "oversize");
});

test("byte-length mismatch preserves the fallback", async () => {
  const short = encoder.encode(rawSnapshot).slice(0, SELECTED_BYTE_LENGTH - 1);
  const { result } = await run({
    [MANIFEST_PATH]: okManifest,
    [SNAPSHOT_PATH]: (url) => response(short, { url }),
  });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "snapshot");
  assert.equal(result.code, "identity");
  assert.equal(result.detail, "byte_length");
});

test("hash mismatch preserves the fallback", async () => {
  // Same byte length, one byte different — length passes, SHA-256 must fail.
  const tampered = encoder.encode(rawSnapshot).slice();
  tampered[tampered.length - 2] = tampered[tampered.length - 2] === 0x20 ? 0x09 : 0x20;
  assert.equal(tampered.length, SELECTED_BYTE_LENGTH);
  const { result } = await run({
    [MANIFEST_PATH]: okManifest,
    [SNAPSHOT_PATH]: (url) => response(tampered, { url }),
  });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "snapshot");
  assert.equal(result.code, "identity");
  assert.equal(result.detail, "sha256");
});

test("malformed UTF-8 preserves the fallback", async () => {
  const invalid = new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]); // "{" + lone continuation bytes
  const { result } = await run({ [MANIFEST_PATH]: (url) => response(invalid, { url }) });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "manifest");
  assert.equal(result.code, "utf8");
});

test("malformed JSON preserves the fallback", async () => {
  const { result } = await run({ [MANIFEST_PATH]: (url) => response("{ not json", { url }) });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "manifest");
  assert.equal(result.code, "json");
});

test("contract-invalid JSON preserves the fallback", async () => {
  const widened = JSON.parse(rawManifest);
  widened.currentness_claim = "current";
  const { result } = await run({
    [MANIFEST_PATH]: (url) => response(JSON.stringify(widened), { url }),
  });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "manifest");
  assert.equal(result.code, "contract");
  assert.equal(result.detail, "currentness_claim");
});

test("a manifest pointing outside the expanded namespace is refused before any snapshot request", async () => {
  const repointed = JSON.parse(rawManifest);
  repointed.selected_snapshot.path = `/public-surface-map/data/snapshots/${SELECTED_SNAPSHOT_ID}.json`;
  const { result, requests } = await run({
    [MANIFEST_PATH]: (url) => response(JSON.stringify(repointed), { url }),
  });
  assertNoPartialActivation(result);
  assert.equal(result.stage, "manifest");
  assert.equal(result.code, "contract");
  assert.equal(requests.length, 1, "a repointed manifest must not trigger a second request");
});

test("a redirected or cross-origin final URL is refused", async () => {
  const redirected = await run({
    [MANIFEST_PATH]: (url) => response(rawManifest, { url, redirected: true }),
  });
  assertNoPartialActivation(redirected.result);
  assert.equal(redirected.result.code, "redirect");

  const crossOrigin = await run({
    [MANIFEST_PATH]: () =>
      response(rawManifest, { url: `https://raw.githubusercontent.com${MANIFEST_PATH}` }),
  });
  assertNoPartialActivation(crossOrigin.result);
  assert.equal(crossOrigin.result.code, "origin");
});

test("a network error is a single bounded failure with no retry", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new Error("offline");
  };
  const result = await loadVerifiedRuntimeSnapshot({ fetch: fetchImpl, origin: ORIGIN });
  assertNoPartialActivation(result);
  assert.equal(result.code, "network");
  assert.equal(calls, 1);
});

// ---------------------------------------------------------------------------
// No retry, no polling, no mixed state
// ---------------------------------------------------------------------------

test("a settled failure schedules no further request", async () => {
  const { fetchImpl, requests } = transport({});
  const result = await loadVerifiedRuntimeSnapshot({ fetch: fetchImpl, origin: ORIGIN });
  assert.equal(result.ok, false);
  const settled = requests.length;
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(requests.length, settled, "no retry, no polling, no background refresh");
});

test("boot is latched: repeated calls issue no additional requests", async () => {
  __resetAdjacencyLoaderBootForTests();
  const { fetchImpl, requests } = transport({
    [MANIFEST_PATH]: okManifest,
    [SNAPSHOT_PATH]: okSnapshot,
  });
  const deps = { fetch: fetchImpl, origin: ORIGIN };
  const first = bootRuntimeLoader(deps);
  const second = bootRuntimeLoader(deps);
  assert.equal(first, second, "the boot latch must return the same promise");
  const result = await first;
  await bootRuntimeLoader(deps);
  assert.equal(result.ok, true);
  assert.equal(requests.length, 2);
  __resetAdjacencyLoaderBootForTests();
});

test("no result ever mixes fallback records with runtime edges", async () => {
  const success = await run({ [MANIFEST_PATH]: okManifest, [SNAPSHOT_PATH]: okSnapshot });
  // Success carries ONE complete snapshot object; there is no per-collection
  // merge surface in the result shape at all.
  assert.deepEqual(Object.keys(success.result).sort(), ["manifest", "ok", "snapshot"]);
  const failure = await run({ [MANIFEST_PATH]: okManifest });
  // A failure carries only the bounded status fields — never records or edges.
  for (const key of Object.keys(failure.result)) {
    assert.ok(["ok", "stage", "code", "detail"].includes(key), `unexpected key ${key}`);
  }
  assert.equal(failure.result.snapshot, undefined);
  assert.equal(failure.result.manifest, undefined);
});

test("an unsupported environment fails closed with no request", async () => {
  const result = await loadVerifiedRuntimeSnapshot({ fetch: undefined, origin: undefined });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "boot");
  assert.equal(result.code, "unsupported");
});

// ---------------------------------------------------------------------------
// Direct unit guards
// ---------------------------------------------------------------------------

test("schema-version cross-check fails closed", () => {
  assertSchemaVersionsAgree("1.0", "1.0");
  assert.throws(() => assertSchemaVersionsAgree("1.0", "2.0"));
  assert.throws(() => assertSchemaVersionsAgree("2.0", "2.0"));
});

test("the loader namespace supports Git-blob identity as well as SHA-256", async () => {
  const identity = await computeIdentity(encoder.encode(rawSnapshot));
  assert.equal(identity.byteLength, SELECTED_BYTE_LENGTH);
  assert.equal(identity.sha256, SELECTED_SHA256);
  assert.equal(identity.gitBlob, SELECTED_GIT_BLOB);
});

test("fixed same-origin routes are the expanded product's own", () => {
  assert.equal(MANIFEST_PATH, "/public-surface-map/expanded/data/manifest.json");
  assert.equal(SNAPSHOT_PREFIX, "/public-surface-map/expanded/data/snapshots/");
  assert.equal(SNAPSHOT_MAX_BYTES, 262144);
});

test("the loader does not import the frozen authority-map product", () => {
  const source = rd("src/lib/public-surface-adjacency-map/runtimeLoader.ts");
  assert.ok(!source.includes("public-surface-authority-map"));
});
