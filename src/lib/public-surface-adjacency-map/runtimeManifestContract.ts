// Expanded Public Surface Adjacency Map — runtime-manifest contract.
//
// Independent, fail-closed validator for this product's own runtime manifest.
// It is NOT the authority-map manifest contract and never reads, aliases, or
// widens it.
//
// The manifest is a WEBSITE-LOCAL runtime pointer only. A passing manifest
// establishes same-origin routing and declared byte identity — NOT currentness,
// canonicality, Registry status, ontology, completeness, supersession, ranking,
// or authority. `currentness_claim` is pinned to `none` and no timestamp field
// exists in the shape at all.

// ---------------------------------------------------------------------------
// Fixed identity
// ---------------------------------------------------------------------------

export const MANIFEST_SCHEMA_VERSION = "1.0";
export const MANIFEST_MAP_ID = "public-surface-adjacency-map";
export const SNAPSHOT_SCHEMA_VERSION = "1.0";
export const MANIFEST_CURRENTNESS_CLAIM = "none";

/** Fixed literal same-origin runtime-manifest path. Never user-controlled. */
export const MANIFEST_ROUTE_PATH = "/public-surface-map/expanded/data/manifest.json";
/** Fixed literal same-origin immutable-snapshot route prefix. */
export const SNAPSHOT_ROUTE_PREFIX = "/public-surface-map/expanded/data/snapshots/";
export const SNAPSHOT_ROUTE_SUFFIX = ".json";

/** The adopted dataset's embedded source commit. */
export const SELECTED_SOURCE_COMMIT = "933274af9693d6d1d9fac36819aafdf56f9ab81d";
/** Adopted dataset byte identity. */
export const SELECTED_BYTE_LENGTH = 206617;
export const SELECTED_SHA256 =
  "0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7";
export const SELECTED_GIT_BLOB = "3077568edeeb0d6a769899a1a3cf79c3f9152f83";

/** The one retained snapshot id (also the stored filename stem). */
export const SELECTED_SNAPSHOT_ID = `${SELECTED_SOURCE_COMMIT}-${SELECTED_SHA256}`;

/**
 * The complete retained snapshot set. The manifest's selected snapshot must be a
 * member; nothing outside this set is routable.
 */
export const RETAINED_SNAPSHOT_IDS: readonly string[] = [SELECTED_SNAPSHOT_ID];

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SHA1_PATTERN = /^[0-9a-f]{40}$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedSnapshot {
  readonly id: string;
  readonly source_commit: string;
  readonly snapshot_schema_version: string;
  readonly path: string;
  readonly byte_length: number;
  readonly sha256: string;
  readonly git_blob: string;
}

export interface AdjacencyRuntimeManifest {
  readonly schema_version: string;
  readonly map_id: string;
  readonly selected_snapshot: SelectedSnapshot;
  readonly currentness_claim: string;
}

export class AdjacencyRuntimeManifestError extends Error {
  readonly code: string;
  constructor(code: string, detail: string) {
    super(`Adjacency runtime manifest violation [${code}]: ${detail}`);
    this.name = "AdjacencyRuntimeManifestError";
    this.code = code;
  }
}

function fail(code: string, detail: string): never {
  throw new AdjacencyRuntimeManifestError(code, detail);
}

// ---------------------------------------------------------------------------
// Exact key allowlists
// ---------------------------------------------------------------------------

const MANIFEST_KEYS: readonly string[] = [
  "schema_version",
  "map_id",
  "selected_snapshot",
  "currentness_claim",
];

const SELECTED_SNAPSHOT_KEYS: readonly string[] = [
  "id",
  "source_commit",
  "snapshot_schema_version",
  "path",
  "byte_length",
  "sha256",
  "git_blob",
];

function asObject(value: unknown, code: string, where: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(code, `${where} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  object: Record<string, unknown>,
  allowed: readonly string[],
  code: string,
  where: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(object)) {
    if (!allowedSet.has(key)) fail(code, `${where}: unknown property "${key}"`);
  }
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(object, key)) {
      fail(code, `${where}: missing required property "${key}"`);
    }
  }
}

function requireExactString(
  object: Record<string, unknown>,
  key: string,
  expected: string,
  code: string,
  where: string,
): void {
  const value = object[key];
  if (typeof value !== "string") fail(code, `${where}.${key} must be a string`);
  if (value !== expected) {
    fail(code, `${where}.${key} must be exactly "${expected}", received "${value}"`);
  }
}

// ---------------------------------------------------------------------------
// Route-path construction and containment
// ---------------------------------------------------------------------------

/**
 * Build the one canonical same-origin snapshot path for a retained id. The id is
 * never interpolated into a path without also being checked against the retained
 * set and against the containment guard below.
 */
export function snapshotPathForId(id: string): string {
  return `${SNAPSHOT_ROUTE_PREFIX}${id}${SNAPSHOT_ROUTE_SUFFIX}`;
}

/**
 * A snapshot path is contained when it is an absolute same-origin path that
 * starts with the exact route prefix, ends with `.json`, and whose id segment
 * contains no separator, dot segment, encoded separator, scheme, query, or
 * fragment. Traversal input can therefore never escape the route namespace.
 */
export function isContainedSnapshotPath(path: unknown): boolean {
  if (typeof path !== "string") return false;
  if (!path.startsWith(SNAPSHOT_ROUTE_PREFIX)) return false;
  if (!path.endsWith(SNAPSHOT_ROUTE_SUFFIX)) return false;
  if (path.includes("?") || path.includes("#") || path.includes("\\")) return false;
  if (path.includes("//")) return false;
  if (/%2e|%2f|%5c/i.test(path)) return false;

  const id = path.slice(
    SNAPSHOT_ROUTE_PREFIX.length,
    path.length - SNAPSHOT_ROUTE_SUFFIX.length,
  );
  return isRoutableSnapshotId(id);
}

/**
 * A routable snapshot id is exactly `<40-hex commit>-<64-hex sha256>`. No slash,
 * dot, colon, percent, or whitespace can appear, so no id can express a path
 * segment, a scheme, or a traversal step.
 */
export function isRoutableSnapshotId(id: unknown): boolean {
  return typeof id === "string" && /^[0-9a-f]{40}-[0-9a-f]{64}$/.test(id);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Strictly validate a parsed runtime manifest. Returns the SAME object typed;
 * never repairs, defaults, or normalizes a field.
 */
export function assertAdjacencyRuntimeManifest(input: unknown): AdjacencyRuntimeManifest {
  const manifest = asObject(input, "manifest_shape", "$");
  assertExactKeys(manifest, MANIFEST_KEYS, "manifest_unknown_field", "$");

  requireExactString(manifest, "schema_version", MANIFEST_SCHEMA_VERSION, "schema_version", "$");
  requireExactString(manifest, "map_id", MANIFEST_MAP_ID, "map_id", "$");
  requireExactString(
    manifest,
    "currentness_claim",
    MANIFEST_CURRENTNESS_CLAIM,
    "currentness_claim",
    "$",
  );

  const where = "$.selected_snapshot";
  const selected = asObject(manifest.selected_snapshot, "selected_snapshot_shape", where);
  assertExactKeys(selected, SELECTED_SNAPSHOT_KEYS, "selected_snapshot_unknown_field", where);

  requireExactString(selected, "id", SELECTED_SNAPSHOT_ID, "selected_snapshot_id", where);
  requireExactString(
    selected,
    "source_commit",
    SELECTED_SOURCE_COMMIT,
    "selected_snapshot_source_commit",
    where,
  );
  requireExactString(
    selected,
    "snapshot_schema_version",
    SNAPSHOT_SCHEMA_VERSION,
    "selected_snapshot_schema_version",
    where,
  );

  const id = selected.id as string;
  if (!RETAINED_SNAPSHOT_IDS.includes(id)) {
    fail("selected_snapshot_not_retained", `${where}.id "${id}" is not in the retained snapshot set`);
  }
  if (!isRoutableSnapshotId(id)) {
    fail("selected_snapshot_id_format", `${where}.id is not a routable snapshot id`);
  }

  const path = selected.path;
  if (typeof path !== "string") fail("selected_snapshot_path", `${where}.path must be a string`);
  if (!isContainedSnapshotPath(path)) {
    fail(
      "selected_snapshot_path_escape",
      `${where}.path must stay inside ${SNAPSHOT_ROUTE_PREFIX}`,
    );
  }
  if (path !== snapshotPathForId(id)) {
    fail(
      "selected_snapshot_path",
      `${where}.path must be exactly ${snapshotPathForId(id)}, received ${path}`,
    );
  }

  const byteLength = selected.byte_length;
  if (typeof byteLength !== "number" || !Number.isInteger(byteLength)) {
    fail("selected_snapshot_byte_length", `${where}.byte_length must be an integer`);
  }
  if (byteLength !== SELECTED_BYTE_LENGTH) {
    fail(
      "selected_snapshot_byte_length",
      `${where}.byte_length must be exactly ${SELECTED_BYTE_LENGTH}, received ${byteLength}`,
    );
  }

  const sha256 = selected.sha256;
  if (typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256)) {
    fail("selected_snapshot_sha256_format", `${where}.sha256 must be 64 lowercase hex characters`);
  }
  if (sha256 !== SELECTED_SHA256) {
    fail("selected_snapshot_sha256", `${where}.sha256 does not match the adopted dataset`);
  }

  const gitBlob = selected.git_blob;
  if (typeof gitBlob !== "string" || !SHA1_PATTERN.test(gitBlob)) {
    fail("selected_snapshot_git_blob_format", `${where}.git_blob must be 40 lowercase hex characters`);
  }
  if (gitBlob !== SELECTED_GIT_BLOB) {
    fail("selected_snapshot_git_blob", `${where}.git_blob does not match the adopted dataset`);
  }

  return manifest as unknown as AdjacencyRuntimeManifest;
}

/**
 * Cross-check a validated manifest against the ACTUAL bytes of the snapshot it
 * selects. Used at build time by the immutable-snapshot endpoint.
 */
export function assertManifestMatchesSnapshot(
  manifest: AdjacencyRuntimeManifest,
  actual: { id: string; byteLength: number; sha256: string; gitBlob: string },
): void {
  const selected = manifest.selected_snapshot;
  if (selected.id !== actual.id) {
    fail("snapshot_id_mismatch", `manifest selects "${selected.id}", actual is "${actual.id}"`);
  }
  if (selected.byte_length !== actual.byteLength) {
    fail(
      "snapshot_byte_length_mismatch",
      `manifest declares ${selected.byte_length} bytes, actual is ${actual.byteLength}`,
    );
  }
  if (selected.sha256 !== actual.sha256) {
    fail("snapshot_sha256_mismatch", "manifest SHA-256 does not match the actual bytes");
  }
  if (selected.git_blob !== actual.gitBlob) {
    fail("snapshot_git_blob_mismatch", "manifest Git blob does not match the actual bytes");
  }
}
