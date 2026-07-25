// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — runtime-manifest contract tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  assertAdjacencyRuntimeManifest,
  assertManifestMatchesSnapshot,
  AdjacencyRuntimeManifestError,
  MANIFEST_MAP_ID,
  MANIFEST_ROUTE_PATH,
  MANIFEST_SCHEMA_VERSION,
  RETAINED_SNAPSHOT_IDS,
  SELECTED_BYTE_LENGTH,
  SELECTED_GIT_BLOB,
  SELECTED_SHA256,
  SELECTED_SNAPSHOT_ID,
  SELECTED_SOURCE_COMMIT,
  SNAPSHOT_ROUTE_PREFIX,
  isContainedSnapshotPath,
  isRoutableSnapshotId,
  snapshotPathForId,
} from "../../src/lib/public-surface-adjacency-map/runtimeManifestContract.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const rawManifest = rd("src/data/public-surface-adjacency-map/runtime-manifest.json");
const clone = () => JSON.parse(rawManifest);

const rejects = (value, code) => {
  assert.throws(
    () => assertAdjacencyRuntimeManifest(value),
    (error) => {
      assert.ok(error instanceof AdjacencyRuntimeManifestError, `expected manifest error, got ${error}`);
      assert.equal(error.code, code, `expected code "${code}", got "${error.code}"`);
      return true;
    },
  );
};

// ---------------------------------------------------------------------------

test("the tracked runtime manifest is accepted", () => {
  const parsed = JSON.parse(rawManifest);
  const validated = assertAdjacencyRuntimeManifest(parsed);
  assert.equal(validated, parsed);
  assert.equal(validated.map_id, "public-surface-adjacency-map");
  assert.equal(validated.currentness_claim, "none");
  assert.equal(validated.selected_snapshot.byte_length, 206617);
  assert.equal(validated.selected_snapshot.sha256, SELECTED_SHA256);
  assert.equal(validated.selected_snapshot.git_blob, SELECTED_GIT_BLOB);
});

test("fixed identities are the adopted dataset's", () => {
  assert.equal(MANIFEST_SCHEMA_VERSION, "1.0");
  assert.equal(MANIFEST_MAP_ID, "public-surface-adjacency-map");
  assert.equal(SELECTED_SOURCE_COMMIT, "933274af9693d6d1d9fac36819aafdf56f9ab81d");
  assert.equal(SELECTED_BYTE_LENGTH, 206617);
  assert.equal(SELECTED_SHA256, "0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7");
  assert.equal(SELECTED_GIT_BLOB, "3077568edeeb0d6a769899a1a3cf79c3f9152f83");
  assert.equal(SELECTED_SNAPSHOT_ID, `${SELECTED_SOURCE_COMMIT}-${SELECTED_SHA256}`);
  assert.deepEqual([...RETAINED_SNAPSHOT_IDS], [SELECTED_SNAPSHOT_ID]);
});

test("routes stay inside the expanded namespace and are distinct from the 30-record product", () => {
  assert.equal(MANIFEST_ROUTE_PATH, "/public-surface-map/expanded/data/manifest.json");
  assert.equal(SNAPSHOT_ROUTE_PREFIX, "/public-surface-map/expanded/data/snapshots/");
  assert.notEqual(MANIFEST_ROUTE_PATH, "/public-surface-map/data/manifest.json");
  assert.ok(!SNAPSHOT_ROUTE_PREFIX.startsWith("/public-surface-map/data/"));
  assert.equal(
    snapshotPathForId(SELECTED_SNAPSHOT_ID),
    `${SNAPSHOT_ROUTE_PREFIX}${SELECTED_SNAPSHOT_ID}.json`,
  );
});

test("wrong map id is rejected", () => {
  const data = clone();
  data.map_id = "public-surface-authority-map";
  rejects(data, "map_id");
});

test("wrong source commit is rejected", () => {
  const data = clone();
  data.selected_snapshot.source_commit = "0".repeat(40);
  rejects(data, "selected_snapshot_source_commit");
});

test("wrong snapshot path is rejected", () => {
  const data = clone();
  data.selected_snapshot.path = `/public-surface-map/data/snapshots/${SELECTED_SNAPSHOT_ID}.json`;
  rejects(data, "selected_snapshot_path_escape");
});

test("path traversal is rejected", () => {
  for (const escape of [
    "/public-surface-map/expanded/data/snapshots/../../../secret.json",
    "/public-surface-map/expanded/data/snapshots/%2e%2e/secret.json",
    "/public-surface-map/expanded/data/snapshots//evil.json",
    "https://github.com/evil.json",
    "/public-surface-map/expanded/data/snapshots/x.json?y=1",
    "/public-surface-map/expanded/data/snapshots/x.json#z",
  ]) {
    const data = clone();
    data.selected_snapshot.path = escape;
    rejects(data, "selected_snapshot_path_escape");
    assert.equal(isContainedSnapshotPath(escape), false, escape);
  }
  assert.equal(isContainedSnapshotPath(snapshotPathForId(SELECTED_SNAPSHOT_ID)), true);
});

test("only a well-formed commit-and-digest id is routable", () => {
  assert.equal(isRoutableSnapshotId(SELECTED_SNAPSHOT_ID), true);
  for (const bad of ["../x", "a/b", "ABC", "", "x".repeat(105), `${SELECTED_SNAPSHOT_ID}.json`]) {
    assert.equal(isRoutableSnapshotId(bad), false, bad);
  }
});

test("wrong byte length is rejected", () => {
  const data = clone();
  data.selected_snapshot.byte_length = 206616;
  rejects(data, "selected_snapshot_byte_length");
});

test("wrong SHA-256 is rejected, and a non-lowercase-hex digest is rejected on format", () => {
  const wrong = clone();
  wrong.selected_snapshot.sha256 = "0".repeat(64);
  rejects(wrong, "selected_snapshot_sha256");

  const upper = clone();
  upper.selected_snapshot.sha256 = SELECTED_SHA256.toUpperCase();
  rejects(upper, "selected_snapshot_sha256_format");

  const short = clone();
  short.selected_snapshot.sha256 = "abc";
  rejects(short, "selected_snapshot_sha256_format");
});

test("wrong Git blob is rejected, and a non-lowercase-hex blob is rejected on format", () => {
  const wrong = clone();
  wrong.selected_snapshot.git_blob = "0".repeat(40);
  rejects(wrong, "selected_snapshot_git_blob");

  const upper = clone();
  upper.selected_snapshot.git_blob = SELECTED_GIT_BLOB.toUpperCase();
  rejects(upper, "selected_snapshot_git_blob_format");
});

test("unsupported schema versions are rejected", () => {
  const manifestVersion = clone();
  manifestVersion.schema_version = "2.0";
  rejects(manifestVersion, "schema_version");

  const snapshotVersion = clone();
  snapshotVersion.selected_snapshot.snapshot_schema_version = "2.0";
  rejects(snapshotVersion, "selected_snapshot_schema_version");
});

test("a currentness claim other than none is rejected", () => {
  for (const claim of ["current", "latest", "authoritative", ""]) {
    const data = clone();
    data.currentness_claim = claim;
    rejects(data, "currentness_claim");
  }
});

test("a snapshot id outside the retained set is rejected", () => {
  const data = clone();
  const other = `${"a".repeat(40)}-${"b".repeat(64)}`;
  data.selected_snapshot.id = other;
  data.selected_snapshot.path = snapshotPathForId(other);
  rejects(data, "selected_snapshot_id");
});

test("unknown properties are rejected at both levels, and missing ones fail closed", () => {
  const extraTop = clone();
  extraTop.generated_at = "2026-01-01";
  rejects(extraTop, "manifest_unknown_field");

  const extraSelected = clone();
  extraSelected.selected_snapshot.is_current = true;
  rejects(extraSelected, "selected_snapshot_unknown_field");

  const missing = clone();
  delete missing.currentness_claim;
  rejects(missing, "manifest_unknown_field");

  const missingSelected = clone();
  delete missingSelected.selected_snapshot.git_blob;
  rejects(missingSelected, "selected_snapshot_unknown_field");
});

test("the manifest carries no timestamp and no automatic-latest field", () => {
  const parsed = JSON.parse(rawManifest);
  const serialized = JSON.stringify(parsed).toLowerCase();
  for (const forbidden of ["generated", "timestamp", "updated", "latest", "current_as_of"]) {
    assert.ok(!serialized.includes(forbidden), `manifest must not mention "${forbidden}"`);
  }
});

test("manifest-to-actual-bytes cross-check fails closed on every identity field", () => {
  const manifest = assertAdjacencyRuntimeManifest(JSON.parse(rawManifest));
  const actual = {
    id: SELECTED_SNAPSHOT_ID,
    byteLength: SELECTED_BYTE_LENGTH,
    sha256: SELECTED_SHA256,
    gitBlob: SELECTED_GIT_BLOB,
  };
  assertManifestMatchesSnapshot(manifest, actual);

  const cases = [
    [{ ...actual, id: `${"c".repeat(40)}-${"d".repeat(64)}` }, "snapshot_id_mismatch"],
    [{ ...actual, byteLength: 1 }, "snapshot_byte_length_mismatch"],
    [{ ...actual, sha256: "0".repeat(64) }, "snapshot_sha256_mismatch"],
    [{ ...actual, gitBlob: "0".repeat(40) }, "snapshot_git_blob_mismatch"],
  ];
  for (const [mutated, code] of cases) {
    assert.throws(
      () => assertManifestMatchesSnapshot(manifest, mutated),
      (error) => error instanceof AdjacencyRuntimeManifestError && error.code === code,
    );
  }
});

test("non-object manifest input fails closed", () => {
  rejects(null, "manifest_shape");
  rejects([], "manifest_shape");
  rejects("{}", "manifest_shape");
});
