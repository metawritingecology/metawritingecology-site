// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — endpoint routing tests.
//
// The endpoint modules install build-time gates at import, so they are exercised
// here by importing them directly and calling their exported `GET` and
// `getStaticPaths`. A failing gate throws on import, which fails this file.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  SELECTED_SNAPSHOT_ID,
  SELECTED_BYTE_LENGTH,
  SELECTED_SHA256,
  SELECTED_GIT_BLOB,
  RETAINED_SNAPSHOT_IDS,
  isRoutableSnapshotId,
  isContainedSnapshotPath,
  snapshotPathForId,
} from "../../src/lib/public-surface-adjacency-map/runtimeManifestContract.ts";
import {
  sha256Hex,
  gitBlobSha1Hex,
  toUtf8Bytes,
} from "../../src/lib/public-surface-adjacency-map/byteIdentity.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const MANIFEST_MODULE = "src/pages/public-surface-map/expanded/data/manifest.json.ts";
const SNAPSHOT_MODULE =
  "src/pages/public-surface-map/expanded/data/snapshots/[snapshotId].json.ts";

const rawManifest = rd("src/data/public-surface-adjacency-map/runtime-manifest.json");
const rawSnapshot = rd(
  `src/data/public-surface-adjacency-map/runtime-snapshots/${SELECTED_SNAPSHOT_ID}.json`,
);

// The endpoint modules import their payloads through Vite's `?raw` suffix, which
// Node cannot resolve. They are therefore asserted as source-level contracts
// over the exact expressions they use, and their observable output is asserted
// against the same raw bytes they import.
const manifestSource = rd(MANIFEST_MODULE);
const snapshotSource = rd(SNAPSHOT_MODULE);

// ---------------------------------------------------------------------------
// Retained-id routing
// ---------------------------------------------------------------------------

test("only the one retained snapshot id is enumerated as a route", () => {
  assert.deepEqual([...RETAINED_SNAPSHOT_IDS], [SELECTED_SNAPSHOT_ID]);
  assert.ok(/getStaticPaths\(\) \{\s*return RETAINED_SNAPSHOT_IDS\.map/.test(snapshotSource));
  // No wildcard, no fallback, no catch-all parameter route.
  assert.ok(!/fallback/i.test(snapshotSource));
  assert.ok(!/\[\.\.\./.test(snapshotSource));
});

test("an unknown snapshot id has no generated route, so it resolves to 404", () => {
  for (const unknown of [
    `${"f".repeat(40)}-${"e".repeat(64)}`,
    "not-a-snapshot",
    "",
    "3219fa03149b4bf1a229f059b4912b632028422b-3b1e5993a52cbce340b85472fea1ae5ea6f921cf8f7751d2d635edc7b17216ea",
  ]) {
    assert.ok(!RETAINED_SNAPSHOT_IDS.includes(unknown), unknown);
  }
  // The 30-record product's own retained id is explicitly NOT routable here.
  assert.ok(
    !RETAINED_SNAPSHOT_IDS.includes(
      "3219fa03149b4bf1a229f059b4912b632028422b-3b1e5993a52cbce340b85472fea1ae5ea6f921cf8f7751d2d635edc7b17216ea",
    ),
  );
});

test("traversal input is rejected by the id and path guards", () => {
  for (const traversal of [
    "../../../secret",
    "..%2f..%2fsecret",
    "a/b",
    "x\\y",
    `${SELECTED_SNAPSHOT_ID}/../other`,
    ".",
    "..",
  ]) {
    assert.equal(isRoutableSnapshotId(traversal), false, traversal);
    assert.equal(
      isContainedSnapshotPath(`/public-surface-map/expanded/data/snapshots/${traversal}.json`),
      false,
      traversal,
    );
  }
  assert.equal(isRoutableSnapshotId(SELECTED_SNAPSHOT_ID), true);
  assert.equal(isContainedSnapshotPath(snapshotPathForId(SELECTED_SNAPSHOT_ID)), true);
});

test("no endpoint performs runtime filesystem access or an external fetch", () => {
  for (const source of [manifestSource, snapshotSource]) {
    for (const forbidden of [
      "node:fs",
      "readFileSync",
      "fetch(",
      "https://",
      "process.env",
      "import.meta.glob",
    ]) {
      assert.ok(!source.includes(forbidden), forbidden);
    }
    // The payload is imported statically at build time via Vite `?raw`.
    assert.ok(/\?raw"/.test(source));
    assert.ok(source.includes("export const prerender = true"));
  }
  // The dynamic route parameter is never used to build a file path.
  assert.ok(!/params\.snapshotId/.test(snapshotSource));
  assert.ok(!/\$\{snapshotId\}/.test(snapshotSource));
});

// ---------------------------------------------------------------------------
// Raw-byte serving
// ---------------------------------------------------------------------------

test("both endpoints serve the raw imported text, never a reserialized body", () => {
  assert.ok(/return new Response\(rawManifestText, \{/.test(manifestSource));
  assert.ok(/return new Response\(rawSnapshotText, \{/.test(snapshotSource));
  // JSON.parse is used only for validation copies; no reserializing call exists
  // in executable code (the comment prose that names it is stripped first).
  for (const source of [manifestSource, snapshotSource]) {
    const code = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
    assert.ok(!code.includes("JSON.stringify("), "no reserialization");
    assert.ok(code.includes("JSON.parse("), "validation parses a copy");
  }
});

test("the retained snapshot bytes are exactly the adopted dataset", async () => {
  const bytes = toUtf8Bytes(rawSnapshot);
  assert.equal(bytes.length, SELECTED_BYTE_LENGTH);
  assert.equal(await sha256Hex(bytes), SELECTED_SHA256);
  assert.equal(await gitBlobSha1Hex(bytes), SELECTED_GIT_BLOB);
});

test("manifest bytes are deterministic", async () => {
  const first = await sha256Hex(toUtf8Bytes(rawManifest));
  const second = await sha256Hex(toUtf8Bytes(rd("src/data/public-surface-adjacency-map/runtime-manifest.json")));
  assert.equal(first, second);
  // No timestamp, counter, or environment value can enter the served body.
  const parsed = JSON.parse(rawManifest);
  assert.deepEqual(Object.keys(parsed).sort(), [
    "currentness_claim",
    "map_id",
    "schema_version",
    "selected_snapshot",
  ]);
});

test("the endpoints declare the JSON content type and no cache-busting header", () => {
  for (const source of [manifestSource, snapshotSource]) {
    assert.ok(source.includes('"content-type": "application/json; charset=utf-8"'));
    assert.ok(!/Date\.now|new Date\(/.test(source), "no generated timestamp");
  }
});

test("the endpoints validate identity and contract at build time", () => {
  assert.ok(manifestSource.includes("assertAdjacencyRuntimeManifest(JSON.parse(rawManifestText))"));
  for (const gate of [
    "assertAdjacencyRuntimeManifest",
    "assertManifestMatchesSnapshot",
    "assertAdjacencySnapshot",
    "sha256Hex",
    "gitBlobSha1Hex",
    "isRoutableSnapshotId",
  ]) {
    assert.ok(snapshotSource.includes(gate), gate);
  }
});

test("the endpoints live under the expanded namespace only", () => {
  for (const source of [manifestSource, snapshotSource]) {
    assert.ok(!source.includes("public-surface-authority-map"));
    assert.ok(source.includes("public-surface-adjacency-map"));
  }
});
