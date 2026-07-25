// Prerendered immutable runtime-snapshot endpoint for the expanded adjacency
// product.
//
// Route: /public-surface-map/expanded/data/snapshots/<snapshotId>.json
//
// Only the single retained snapshot is enumerated (getStaticPaths), so an
// unknown id has no generated route and resolves to the site 404. No arbitrary
// path parameter is ever used to read a file: the raw bytes are imported at
// build time via Vite `?raw`, so there is no runtime filesystem access and no
// traversal surface. The body is never parsed-and-reserialized, so deployed
// bytes stay byte-identical to the repository source. No Worker-time
// computation, no generated timestamp, no external fetch.

export const prerender = true;

import rawSnapshotText from "../../../../../data/public-surface-adjacency-map/runtime-snapshots/933274af9693d6d1d9fac36819aafdf56f9ab81d-0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7.json?raw";
import rawManifestText from "../../../../../data/public-surface-adjacency-map/runtime-manifest.json?raw";
import {
  toUtf8Bytes,
  sha256Hex,
  gitBlobSha1Hex,
} from "../../../../../lib/public-surface-adjacency-map/byteIdentity.ts";
import { assertAdjacencySnapshot } from "../../../../../lib/public-surface-adjacency-map/contract.ts";
import {
  assertAdjacencyRuntimeManifest,
  assertManifestMatchesSnapshot,
  isRoutableSnapshotId,
  snapshotPathForId,
  RETAINED_SNAPSHOT_IDS,
  SELECTED_SNAPSHOT_ID,
} from "../../../../../lib/public-surface-adjacency-map/runtimeManifestContract.ts";

// --- Build-time validation --------------------------------------------------
// Runs once during the Astro build (prerender). Any failure fails the build.

const manifest = assertAdjacencyRuntimeManifest(JSON.parse(rawManifestText));

if (!RETAINED_SNAPSHOT_IDS.includes(SELECTED_SNAPSHOT_ID)) {
  throw new Error("selected snapshot id is not in the retained snapshot set");
}
if (!isRoutableSnapshotId(SELECTED_SNAPSHOT_ID)) {
  throw new Error("selected snapshot id is not a routable id");
}
if (manifest.selected_snapshot.id !== SELECTED_SNAPSHOT_ID) {
  throw new Error(
    `manifest selected snapshot id ${manifest.selected_snapshot.id} does not match the retained id`,
  );
}
if (manifest.selected_snapshot.path !== snapshotPathForId(SELECTED_SNAPSHOT_ID)) {
  throw new Error("manifest selected snapshot path does not match the approved route path");
}

const snapshotBytes = toUtf8Bytes(rawSnapshotText);
const snapshotSha256 = await sha256Hex(snapshotBytes);
const snapshotGitBlob = await gitBlobSha1Hex(snapshotBytes);

// Cross-check the manifest's declared identity against the actual bytes.
assertManifestMatchesSnapshot(manifest, {
  id: SELECTED_SNAPSHOT_ID,
  byteLength: snapshotBytes.length,
  sha256: snapshotSha256,
  gitBlob: snapshotGitBlob,
});

// Strict semantic validation of the snapshot content.
assertAdjacencySnapshot(JSON.parse(rawSnapshotText));

export function getStaticPaths() {
  return RETAINED_SNAPSHOT_IDS.map((snapshotId) => ({ params: { snapshotId } }));
}

export function GET(): Response {
  return new Response(rawSnapshotText, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
