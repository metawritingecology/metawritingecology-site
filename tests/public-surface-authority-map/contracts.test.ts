// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Phase 2A contract + byte-identity mutation tests.
//
// Node 22 built-in test runner + assert only (no test dependency). Exercises the
// ACTUAL production modules. Every failure case asserts a stable rejection code
// parsed from the thrown error message (`... [<code>] ...`), so a coercion or
// silent repair would surface as a wrong/missing code and fail the test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertSnapshot } from "../../src/lib/public-surface-authority-map/contract.ts";
import {
  assertSnapshotFromRawText,
  assertRawIdentity,
  EXPECTED_COUNTS,
  FALLBACK_IDENTITY,
} from "../../src/lib/public-surface-authority-map/fallback.ts";
import {
  assertByteIdentity,
  parseJsonAfterIdentity,
  decodeUtf8Fatal,
  toUtf8Bytes,
  sha256Hex,
  gitBlobSha1Hex,
} from "../../src/lib/public-surface-authority-map/byteIdentity.ts";
import {
  assertRuntimeManifest,
  assertManifestMatchesSnapshot,
} from "../../src/lib/public-surface-authority-map/runtimeManifestContract.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const APPROVED_SNAPSHOT_ID =
  "97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e";

const fallbackRaw = rd("src/data/public-surface-authority-map/last-known-good.json");
const runtimeSnapshotRaw = rd(
  `src/data/public-surface-authority-map/runtime-snapshots/${APPROVED_SNAPSHOT_ID}.json`,
);
const manifestRaw = rd("src/data/public-surface-authority-map/runtime-manifest.json");

const baseSnapshot = JSON.parse(fallbackRaw);
const baseManifest = JSON.parse(manifestRaw);

// Track every distinct rejection code exercised, for the mutation report.
const seenCodes = new Set();

function extractCode(error: any) {
  const m = /\[([^\]]+)\]/.exec(error?.message ?? "");
  return m ? m[1] : null;
}

// Assert `fn` throws (sync or async) with the given rejection code.
async function rejects(fn: () => unknown, code: string) {
  let error;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  assert.ok(error, `expected a rejection with code [${code}], but none was thrown`);
  const got = extractCode(error);
  seenCodes.add(got);
  assert.equal(got, code, `expected code [${code}], got [${got}] (${error.message})`);
}

function cloneSnapshot() {
  return structuredClone(baseSnapshot);
}
function cloneManifest() {
  return structuredClone(baseManifest);
}

// --- Baseline success -------------------------------------------------------

test("baseline: bundled fallback accepted", async () => {
  const snap = await assertSnapshotFromRawText(fallbackRaw);
  assert.equal(snap.nodes.length, EXPECTED_COUNTS.nodes);
  assert.equal(snap.edges.length, EXPECTED_COUNTS.edges);
});

test("baseline: runtime snapshot accepted (raw + semantic)", async () => {
  const snap = await assertSnapshotFromRawText(runtimeSnapshotRaw);
  assert.equal(snap.nodes.length, EXPECTED_COUNTS.nodes);
  assert.doesNotThrow(() => assertSnapshot(JSON.parse(runtimeSnapshotRaw)));
});

test("baseline: runtime snapshot byte-identical to fallback", () => {
  const a = toUtf8Bytes(fallbackRaw);
  const b = toUtf8Bytes(runtimeSnapshotRaw);
  assert.equal(a.length, b.length);
  assert.deepEqual([...a], [...b]);
});

test("baseline: runtime manifest accepted", () => {
  const m = assertRuntimeManifest(baseManifest);
  assert.equal(m.selected_snapshot.id, APPROVED_SNAPSHOT_ID);
});

test("baseline: manifest and snapshot cross-check accepted", async () => {
  const m = assertRuntimeManifest(baseManifest);
  const bytes = toUtf8Bytes(runtimeSnapshotRaw);
  assert.doesNotThrow(() =>
    assertManifestMatchesSnapshot(m, {
      id: APPROVED_SNAPSHOT_ID,
      byteLength: bytes.length,
      sha256: FALLBACK_IDENTITY.sha256,
      gitBlob: FALLBACK_IDENTITY.gitBlob,
    }),
  );
});

test("baseline: raw identity validates", async () => {
  await assert.doesNotReject(() => assertRawIdentity(fallbackRaw));
});

// --- Snapshot semantic failures ---------------------------------------------

test("snapshot: authority elevation (top-level ceiling)", async () => {
  const s = cloneSnapshot();
  s.authority_ceiling = "full_authority";
  await rejects(() => assertSnapshot(s), "top_level_authority_ceiling");
});

test("snapshot: authority elevation (node ceiling)", async () => {
  const s = cloneSnapshot();
  s.nodes[0].authority_ceiling = "internal_authority";
  await rejects(() => assertSnapshot(s), "node_authority_ceiling");
});

test("snapshot: confirmed relation", async () => {
  const s = cloneSnapshot();
  s.edges[0].relation_status = "confirmed";
  await rejects(() => assertSnapshot(s), "edge_navigation_only");
});

test("snapshot: malformed canonical URL", async () => {
  const s = cloneSnapshot();
  s.nodes[0].canonical_public_url = "http://evil.example.com/x";
  await rejects(() => assertSnapshot(s), "canonical_url");
});

test("snapshot: duplicate node ID", async () => {
  const s = cloneSnapshot();
  s.nodes[1].id = s.nodes[0].id;
  await rejects(() => assertSnapshot(s), "node_id_unique");
});

test("snapshot: duplicate edge ID", async () => {
  const s = cloneSnapshot();
  s.edges[1].id = s.edges[0].id;
  await rejects(() => assertSnapshot(s), "edge_id_unique");
});

test("snapshot: unknown edge endpoint", async () => {
  const s = cloneSnapshot();
  s.edges[0].target = "this-node-does-not-exist";
  await rejects(() => assertSnapshot(s), "edge_endpoint_exists");
});

test("snapshot: self-edge", async () => {
  const s = cloneSnapshot();
  s.edges[0].target = s.edges[0].source;
  await rejects(() => assertSnapshot(s), "edge_no_self_reference");
});

test("snapshot: invalid relation type", async () => {
  const s = cloneSnapshot();
  s.edges[0].relation_type = "semantic_dependency";
  await rejects(() => assertSnapshot(s), "edge_type_allowed");
});

test("snapshot: invalid transform flag (not boolean)", async () => {
  const s = cloneSnapshot();
  s.transform_notes.node_size_implies_importance = "true";
  await rejects(() => assertSnapshot(s), "transform_notes");
});

test("snapshot: altered required boundary statement", async () => {
  const s = cloneSnapshot();
  s.boundary_statements[0] = "Selected public surface only";
  await rejects(() => assertSnapshot(s), "boundary_statements");
});

test("snapshot: malformed type (title)", async () => {
  const s = cloneSnapshot();
  s.title = 123;
  await rejects(() => assertSnapshot(s), "title");
});

test("snapshot: case-insensitive prohibited field", async () => {
  const s = cloneSnapshot();
  s.nodes[0].Registry_Status = "confirmed";
  await rejects(() => assertSnapshot(s), "prohibited_authority_field");
});

test("snapshot: inherited / prototype-bearing input", async () => {
  const s = cloneSnapshot();
  const tainted = Object.create({ injected: true });
  Object.assign(tainted, s.nodes[0]);
  s.nodes[0] = tainted;
  await rejects(() => assertSnapshot(s), "plain_data");
});

// --- Identity failures ------------------------------------------------------

test("identity: one-byte content change", async () => {
  const bytes = toUtf8Bytes(fallbackRaw);
  const mutated = Uint8Array.from(bytes);
  mutated[100] = mutated[100] ^ 0x01; // flip one bit, length preserved
  await rejects(() => assertByteIdentity(mutated, FALLBACK_IDENTITY, "t"), "sha256");
});

test("identity: wrong byte length", async () => {
  const bytes = toUtf8Bytes(fallbackRaw).slice(0, -1);
  await rejects(() => assertByteIdentity(bytes, FALLBACK_IDENTITY, "t"), "byte_length");
});

test("identity: wrong SHA-256 (expected mismatch)", async () => {
  const bytes = toUtf8Bytes(fallbackRaw);
  const wrong = { ...FALLBACK_IDENTITY, sha256: "0".repeat(64) };
  await rejects(() => assertByteIdentity(bytes, wrong, "t"), "sha256");
});

test("identity: wrong Git blob", async () => {
  const bytes = toUtf8Bytes(fallbackRaw);
  const wrong = { ...FALLBACK_IDENTITY, gitBlob: "0".repeat(40) };
  await rejects(() => assertByteIdentity(bytes, wrong, "t"), "git_blob");
});

test("identity: invalid UTF-8", async () => {
  const bad = new Uint8Array([0xff, 0xfe, 0xfd]);
  await rejects(() => decodeUtf8Fatal(bad), "utf8_decode");
});

test("identity: malformed JSON after identity", async () => {
  const notJson = "{ this is not json";
  const bytes = toUtf8Bytes(notJson);
  const identity = {
    byteLength: bytes.length,
    sha256: await sha256Hex(bytes),
    gitBlob: await gitBlobSha1Hex(bytes),
  };
  await rejects(() => parseJsonAfterIdentity(bytes, identity, "t"), "json_parse");
});

// --- Manifest failures ------------------------------------------------------

test("manifest: extra field", async () => {
  const m = cloneManifest();
  m.unexpected_extra = true;
  await rejects(() => assertRuntimeManifest(m), "unexpected_field");
});

test("manifest: prohibited field", async () => {
  const m = cloneManifest();
  m.selected_snapshot.authority = "high";
  await rejects(() => assertRuntimeManifest(m), "prohibited_field");
});

test("manifest: schema_version mismatch", async () => {
  const m = cloneManifest();
  m.schema_version = "2.0";
  await rejects(() => assertRuntimeManifest(m), "schema_version");
});

test("manifest: map_id mismatch", async () => {
  const m = cloneManifest();
  m.map_id = "some-other-map";
  await rejects(() => assertRuntimeManifest(m), "map_id");
});

test("manifest: non-none currentness claim", async () => {
  const m = cloneManifest();
  m.currentness_claim = "current";
  await rejects(() => assertRuntimeManifest(m), "currentness_claim");
});

test("manifest: snapshot_schema_version mismatch", async () => {
  const m = cloneManifest();
  m.selected_snapshot.snapshot_schema_version = "2.0";
  await rejects(() => assertRuntimeManifest(m), "snapshot_schema_version");
});

test("manifest: malformed source commit", async () => {
  const m = cloneManifest();
  m.selected_snapshot.source_commit = "abc123";
  await rejects(() => assertRuntimeManifest(m), "source_commit");
});

test("manifest: uppercase identity", async () => {
  const m = cloneManifest();
  m.selected_snapshot.sha256 = m.selected_snapshot.sha256.toUpperCase();
  await rejects(() => assertRuntimeManifest(m), "sha256");
});

test("manifest: malformed SHA-256", async () => {
  const m = cloneManifest();
  m.selected_snapshot.sha256 = "deadbeef";
  await rejects(() => assertRuntimeManifest(m), "sha256");
});

test("manifest: malformed Git blob", async () => {
  const m = cloneManifest();
  m.selected_snapshot.git_blob = "notahash";
  await rejects(() => assertRuntimeManifest(m), "git_blob");
});

test("manifest: ID mismatch", async () => {
  const m = cloneManifest();
  m.selected_snapshot.id = "0".repeat(40) + "-" + "1".repeat(64);
  await rejects(() => assertRuntimeManifest(m), "id_composition");
});

test("manifest: filename/path mismatch", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path =
    "/public-surface-map/data/snapshots/" + "a".repeat(40) + "-" + "b".repeat(64) + ".json";
  await rejects(() => assertRuntimeManifest(m), "path_mismatch");
});

test("manifest: off-origin / scheme-like path", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path = "https://evil.example.com/x.json";
  await rejects(() => assertRuntimeManifest(m), "path_scheme");
});

test("manifest: traversal path", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path = "/public-surface-map/data/snapshots/../../secret.json";
  await rejects(() => assertRuntimeManifest(m), "path_traversal");
});

test("manifest: percent-encoded traversal path", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path = "/public-surface-map/data/snapshots/%2e%2e/secret.json";
  await rejects(() => assertRuntimeManifest(m), "path_percent_traversal");
});

test("manifest: query in path", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path = m.selected_snapshot.path + "?x=1";
  await rejects(() => assertRuntimeManifest(m), "path_query");
});

test("manifest: fragment in path", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path = m.selected_snapshot.path + "#frag";
  await rejects(() => assertRuntimeManifest(m), "path_fragment");
});

test("manifest: backslash in path", async () => {
  const m = cloneManifest();
  m.selected_snapshot.path = "/public-surface-map/data/snapshots\\evil.json";
  await rejects(() => assertRuntimeManifest(m), "path_backslash");
});

test("manifest: advertised oversize byte_length", async () => {
  const m = cloneManifest();
  m.selected_snapshot.byte_length = 300000;
  await rejects(() => assertRuntimeManifest(m), "byte_length_max");
});

test("manifest: missing selected snapshot", async () => {
  const m = cloneManifest();
  delete m.selected_snapshot;
  await rejects(() => assertRuntimeManifest(m), "missing_field");
});

test("manifest: snapshot identity mismatch (cross-check)", async () => {
  const m = assertRuntimeManifest(baseManifest);
  await rejects(
    () =>
      assertManifestMatchesSnapshot(m, {
        id: APPROVED_SNAPSHOT_ID,
        byteLength: FALLBACK_IDENTITY.byteLength,
        sha256: "0".repeat(64),
        gitBlob: FALLBACK_IDENTITY.gitBlob,
      }),
    "snapshot_sha256_mismatch",
  );
});

// --- Report -----------------------------------------------------------------

test("report: distinct rejection codes exercised", () => {
  const codes = [...seenCodes].sort();
  // Emitted to stdout so the delivery mutation-test report can capture it.
  console.log(`MUTATION_CODES(${codes.length}): ${codes.join(", ")}`);
  assert.ok(codes.length >= 30, `expected >= 30 distinct codes, got ${codes.length}`);
});
