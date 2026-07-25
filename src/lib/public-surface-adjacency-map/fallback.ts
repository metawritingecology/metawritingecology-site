// Expanded Public Surface Adjacency Map — bundled fallback validation.
//
// Pins the fixed raw byte identity and provenance of the ONE bundled
// last-known-good dataset for this product, and runs the build-time gate:
//
//   raw bundled bytes
//     -> byte length -> SHA-256 -> Git blob id
//     -> fatal UTF-8 decode
//     -> JSON parse
//     -> full expanded-adjacency dataset contract
//     -> render
//
// These constants live here — NOT inside the adopted dataset file, which must
// stay byte-identical to the source. This fallback is bundled for the expanded
// page only. It does not replace, alias, or override the authority-map fallback.

import { assertAdjacencySnapshot, type AdjacencySnapshot } from "./contract.ts";
import {
  assertByteIdentity,
  decodeUtf8Fatal,
  toUtf8Bytes,
  type ExpectedIdentity,
} from "./byteIdentity.ts";

// --- Provenance -------------------------------------------------------------

export const SOURCE_REPOSITORY = "metawritingecology/meta-writing-ecology";
export const SOURCE_REPOSITORY_URL =
  "https://github.com/metawritingecology/meta-writing-ecology";

/** The source repository merge commit the dataset was adopted from. */
export const SOURCE_MERGE_COMMIT = "814997119e543c8d39f312687f2b4b2ffc45da67";
/** The dataset's own embedded source commit. */
export const SNAPSHOT_SOURCE_COMMIT = "933274af9693d6d1d9fac36819aafdf56f9ab81d";
export const SNAPSHOT_SOURCE_PATH =
  "visualizations/public-surface-adjacency-map/data.json";
export const SNAPSHOT_COMMIT_URL = `${SOURCE_REPOSITORY_URL}/commit/${SNAPSHOT_SOURCE_COMMIT}`;

// --- Fixed byte identity ----------------------------------------------------

export const SNAPSHOT_BYTE_LENGTH = 206617;
export const SNAPSHOT_SHA256 =
  "0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7";
export const SNAPSHOT_GIT_BLOB_SHA = "3077568edeeb0d6a769899a1a3cf79c3f9152f83";

export const FALLBACK_IDENTITY: ExpectedIdentity = {
  byteLength: SNAPSHOT_BYTE_LENGTH,
  sha256: SNAPSHOT_SHA256,
  gitBlob: SNAPSHOT_GIT_BLOB_SHA,
};

/**
 * Bounded status wording. The bundled dataset is never described as current,
 * canonical, latest, or authoritative.
 */
export const FALLBACK_STATUS_LABEL = "Bundled snapshot (no currentness claim)";
export const RUNTIME_STATUS_LABEL =
  "Verified same-origin snapshot (no currentness claim)";
export const RUNTIME_UNAVAILABLE_LABEL =
  "Bundled snapshot retained; same-origin verification did not complete";

// --- Build-time gate --------------------------------------------------------

/** Validate the exact raw bytes: byte length, SHA-256, then Git blob id. */
export async function assertRawIdentity(rawText: string): Promise<void> {
  await assertByteIdentity(toUtf8Bytes(rawText), FALLBACK_IDENTITY, "adjacency_fallback_snapshot");
}

/**
 * Full build-time gate: identity-validate the raw bytes, decode fatally, parse,
 * then strictly validate against the expanded-adjacency dataset contract.
 */
export async function assertSnapshotFromRawText(rawText: string): Promise<AdjacencySnapshot> {
  const bytes = toUtf8Bytes(rawText);
  await assertByteIdentity(bytes, FALLBACK_IDENTITY, "adjacency_fallback_snapshot");

  const text = decodeUtf8Fatal(bytes);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Expanded adjacency fallback bytes are not valid JSON: ${(error as Error).message}`,
    );
  }
  return assertAdjacencySnapshot(parsed);
}
