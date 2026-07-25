// Public Surface and Authority-Ceiling Map — Phase 1 fallback validation.
//
// This module centralises the Phase-1-SPECIFIC facts about the single bundled
// last-known-good preview snapshot: its immutable provenance, its fixed raw byte
// identity (byte length / SHA-256 / Git blob id), and its exact instance counts
// (30 nodes / 161 edges / 132 boundary_reference / 29 source_use_reference /
// 7 omitted self-references).
//
// These constants live here — NOT inside the audited snapshot file, which must
// stay byte-identical to the audited source — and NOT inside the reusable
// semantic validator in `./contract.ts`, which must remain count-agnostic.
//
// The build path for the live Phase 1 page still validates the exact bundled
// fallback bytes before rendering:
//
//   raw snapshot bytes
//     -> byte-length -> SHA-256 -> Git blob id   (assertRawIdentity)
//     -> JSON parse
//     -> strict semantic validation WITH Phase 1 exact counts (assertSnapshot)
//     -> render
//
// `contract.ts` re-exports the names below so existing Phase 1 components keep
// importing them from `contract.ts` unchanged.

import {
  assertSnapshot,
  type ExpectedInstanceCounts,
  type PublicSurfaceAuthoritySnapshot,
} from "./contract.ts";
import {
  assertByteIdentity,
  decodeUtf8Fatal,
  toUtf8Bytes,
  type ExpectedIdentity,
} from "./byteIdentity.ts";

// --- Provenance constants (Phase 1) -----------------------------------------

export const SOURCE_REPOSITORY = "metawritingecology/meta-writing-ecology";
export const SOURCE_REPOSITORY_URL =
  "https://github.com/metawritingecology/meta-writing-ecology";

// Approved retained snapshot's immutable source commit.
export const SNAPSHOT_SOURCE_COMMIT =
  "3219fa03149b4bf1a229f059b4912b632028422b";
export const SNAPSHOT_SOURCE_PATH =
  "visualizations/public-surface-authority-map/data.json";
export const SNAPSHOT_COMMIT_URL = `${SOURCE_REPOSITORY_URL}/commit/${SNAPSHOT_SOURCE_COMMIT}`;

// Fixed identity of the audited raw bytes. The displayed SHA-256 must come from
// SNAPSHOT_SHA256 (the same value assertRawIdentity verifies), never recomputed
// from live input for display.
export const SNAPSHOT_SHA256 =
  "3b1e5993a52cbce340b85472fea1ae5ea6f921cf8f7751d2d635edc7b17216ea";
export const SNAPSHOT_GIT_BLOB_SHA = "2d59c4fdd07a2a9ddfad94e2e214a2d1c84912af";
export const SNAPSHOT_BYTE_LENGTH = 92903;

export const SNAPSHOT_STATUS = "bundled_last_known_good_preview_snapshot";
export const SNAPSHOT_STATUS_LABEL = "Bundled last-known-good preview snapshot";

// --- Expected Phase 1 instance counts ---------------------------------------

export const EXPECTED_COUNTS: ExpectedInstanceCounts = {
  nodes: 30,
  edges: 161,
  boundary_reference: 132,
  source_use_reference: 29,
  self_references_omitted: 7,
};

// Fixed Phase 1 raw byte identity as a reusable expected-identity descriptor.
export const FALLBACK_IDENTITY: ExpectedIdentity = {
  byteLength: SNAPSHOT_BYTE_LENGTH,
  sha256: SNAPSHOT_SHA256,
  gitBlob: SNAPSHOT_GIT_BLOB_SHA,
};

// --- Raw identity validation (runs before JSON.parse) -----------------------

/**
 * Validate the exact raw UTF-8 bytes of the bundled fallback against the fixed
 * Phase 1 identity: byte length, SHA-256, then Git blob id — in that order. Any
 * single-byte difference fails. Delegates to the shared byte-identity utility.
 */
export async function assertRawIdentity(rawText: string): Promise<void> {
  const bytes = toUtf8Bytes(rawText);
  await assertByteIdentity(bytes, FALLBACK_IDENTITY, "phase1_fallback_snapshot");
}

/**
 * Full Phase 1 build-time gate: identity-validate the raw bytes, parse, then
 * strictly validate the parsed object WITH the exact Phase 1 counts. Returns the
 * typed snapshot produced only from the identity-validated bytes.
 */
export async function assertSnapshotFromRawText(
  rawText: string,
): Promise<PublicSurfaceAuthoritySnapshot> {
  const bytes = toUtf8Bytes(rawText);
  await assertByteIdentity(bytes, FALLBACK_IDENTITY, "phase1_fallback_snapshot");

  // Decode from the identity-validated bytes (fatal UTF-8), then parse.
  const text = decodeUtf8Fatal(bytes);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Phase 1 fallback snapshot bytes are not valid JSON: ${(error as Error).message}`,
    );
  }

  return assertSnapshot(parsed, { expectedCounts: EXPECTED_COUNTS });
}
