// Prerendered immutable runtime-snapshot endpoint.
//
// Route: /public-surface-map/data/snapshots/<snapshotId>.json
//
// Only the single approved runtime snapshot is enumerated (getStaticPaths). At
// build time the id, filename, source bytes, and manifest reference are all
// validated; the exact raw source bytes (imported via Vite `?raw`) are served
// unchanged. The body is never parsed-and-reserialized, so deployed bytes stay
// byte-identical to the repository source. No arbitrary path parameter is
// accepted, no runtime filesystem access, no Worker-time computation, no GitHub
// fetch.

export const prerender = true;

import rawSnapshotText from "../../../../data/public-surface-authority-map/runtime-snapshots/97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json?raw";
import rawManifestText from "../../../../data/public-surface-authority-map/runtime-manifest.json?raw";
import {
  toUtf8Bytes,
  sha256Hex,
  gitBlobSha1Hex,
} from "../../../../lib/public-surface-authority-map/byteIdentity.ts";
import { assertSnapshot } from "../../../../lib/public-surface-authority-map/contract.ts";
import {
  assertRuntimeManifest,
  assertManifestMatchesSnapshot,
  snapshotPathForId,
} from "../../../../lib/public-surface-authority-map/runtimeManifestContract.ts";

// The one approved snapshot id (also the filename stem).
const APPROVED_SNAPSHOT_ID =
  "97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e";

// --- Build-time validation --------------------------------------------------
// Runs once during the Astro build (prerender). Any failure fails the build.
const manifest = assertRuntimeManifest(JSON.parse(rawManifestText));

if (manifest.selected_snapshot.id !== APPROVED_SNAPSHOT_ID) {
  throw new Error(
    `manifest selected snapshot id ${manifest.selected_snapshot.id} does not match approved id ${APPROVED_SNAPSHOT_ID}`,
  );
}
if (manifest.selected_snapshot.path !== snapshotPathForId(APPROVED_SNAPSHOT_ID)) {
  throw new Error("manifest selected snapshot path does not match the approved route path");
}

const snapshotBytes = toUtf8Bytes(rawSnapshotText);
const snapshotSha256 = await sha256Hex(snapshotBytes);
const snapshotGitBlob = await gitBlobSha1Hex(snapshotBytes);

// Cross-check the manifest's declared identity against the actual bytes.
assertManifestMatchesSnapshot(manifest, {
  id: APPROVED_SNAPSHOT_ID,
  byteLength: snapshotBytes.length,
  sha256: snapshotSha256,
  gitBlob: snapshotGitBlob,
});

// Strict semantic validation of the snapshot content (shared contract).
assertSnapshot(JSON.parse(rawSnapshotText));

export function getStaticPaths() {
  return [{ params: { snapshotId: APPROVED_SNAPSHOT_ID } }];
}

export function GET(): Response {
  return new Response(rawSnapshotText, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
