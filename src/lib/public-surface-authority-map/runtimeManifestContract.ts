// Public Surface and Authority-Ceiling Map — runtime manifest contract.
//
// Strict, browser-safe AND build-safe validator for the runtime manifest. The
// manifest is a WEBSITE-LOCAL runtime selection only. It does NOT establish
// currentness, Registry status, ontology status, authority, completeness,
// supersession, ranking, or any confirmed conceptual relation.
//
// This module performs NO network requests, DOM access, retries, timers,
// storage, telemetry, or selection logic. It validates shape and identity, and
// composes the snapshot route path from the validated id and a FIXED prefix.
// A future Phase 2B browser client must construct the fetch path from the
// validated id + fixed prefix and MUST NOT trust an arbitrary manifest URL
// string. No browser client is implemented in Phase 2A.

import { MAX_RUNTIME_SNAPSHOT_BYTES } from "./byteIdentity.ts";

export const MANIFEST_SCHEMA_VERSION = "1.0";
export const MANIFEST_MAP_ID = "public-surface-authority-map";
export const SNAPSHOT_SCHEMA_VERSION = "1.0";
export const MANIFEST_CURRENTNESS_CLAIM = "none";

// The ONLY prefix a snapshot route path may use. Same-origin, absolute, fixed.
export const SNAPSHOT_ROUTE_PREFIX = "/public-surface-map/data/snapshots/";
export const SNAPSHOT_ROUTE_SUFFIX = ".json";

const MANIFEST_TOP_LEVEL_KEYS = [
  "schema_version",
  "map_id",
  "selected_snapshot",
  "currentness_claim",
] as const;

const SELECTED_SNAPSHOT_KEYS = [
  "id",
  "source_commit",
  "snapshot_schema_version",
  "path",
  "byte_length",
  "sha256",
  "git_blob",
] as const;

// Authority-inflating fields that must never appear anywhere in the manifest.
const MANIFEST_PROHIBITED_FIELDS_LOWER = new Set(
  [
    "internal_registry_status",
    "registry_status",
    "complete_archive_status",
    "formal_relation_status",
    "ontology_status",
    "semantic_supersession",
    "supersedes",
    "derived_from",
    "parent",
    "child",
    "prompt",
    "source_conversation",
    "currentness",
    "authority",
    "ranking",
  ].map((field) => field.toLowerCase()),
);

const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;

export interface SelectedSnapshot {
  readonly id: string;
  readonly source_commit: string;
  readonly snapshot_schema_version: "1.0";
  readonly path: string;
  readonly byte_length: number;
  readonly sha256: string;
  readonly git_blob: string;
}

export interface RuntimeManifest {
  readonly schema_version: "1.0";
  readonly map_id: "public-surface-authority-map";
  readonly selected_snapshot: SelectedSnapshot;
  readonly currentness_claim: "none";
}

export class RuntimeManifestError extends Error {
  readonly code: string;
  constructor(code: string, detail: string) {
    super(`Runtime manifest violation [${code}]: ${detail}`);
    this.name = "RuntimeManifestError";
    this.code = code;
  }
}

function fail(code: string, detail: string): never {
  throw new RuntimeManifestError(code, detail);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// Recursively require JSON-compatible plain data (no prototype-bearing objects,
// no class instances, no non-finite numbers, etc.).
function assertPlainData(value: unknown, path: string): void {
  if (value === null) return;
  const type = typeof value;
  if (type === "string" || type === "boolean") return;
  if (type === "number") {
    if (!Number.isFinite(value)) fail("plain_data", `${path} is a non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPlainData(item, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) assertPlainData(value[key], `${path}.${key}`);
    return;
  }
  fail("plain_data", `${path} is not JSON-compatible plain data (received ${type})`);
}

function assertNoProhibitedFields(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProhibitedFields(item, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (MANIFEST_PROHIBITED_FIELDS_LOWER.has(key.toLowerCase())) {
        fail("prohibited_field", `prohibited field "${key}" at ${path}.${key}`);
      }
      assertNoProhibitedFields(value[key], `${path}.${key}`);
    }
  }
}

function assertExactKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(obj)) {
    if (!allowedSet.has(key)) fail("unexpected_field", `unexpected key "${key}" at ${where}`);
  }
  for (const required of allowed) {
    if (!Object.hasOwn(obj, required)) {
      fail("missing_field", `missing required key "${required}" at ${where}`);
    }
  }
}

function requireLowerHex(
  value: unknown,
  pattern: RegExp,
  code: string,
  where: string,
): string {
  if (typeof value !== "string") {
    fail(code, `${where} must be a string, received ${typeof value}`);
  }
  if (value !== value.toLowerCase()) {
    fail(code, `${where} must be lowercase, received ${JSON.stringify(value)}`);
  }
  if (!pattern.test(value)) {
    fail(code, `${where} is not a valid identifier, received ${JSON.stringify(value)}`);
  }
  return value;
}

// Reject any path that is not a same-origin absolute route under the fixed
// prefix. Rejects scheme/host/credentials/query/fragment/backslash/`..`/
// percent-encoded traversal and arbitrary alternate prefixes.
function assertSnapshotPath(value: unknown, expectedPath: string, where: string): string {
  if (typeof value !== "string") {
    fail("path_type", `${where} must be a string, received ${typeof value}`);
  }
  if (value.includes("\\")) fail("path_backslash", `${where} must not contain backslashes`);
  if (value.includes("..")) fail("path_traversal", `${where} must not contain ".."`);
  if (/%2e|%2f|%5c/i.test(value)) {
    fail("path_percent_traversal", `${where} must not contain percent-encoded traversal`);
  }
  if (value.includes("?")) fail("path_query", `${where} must not contain a query`);
  if (value.includes("#")) fail("path_fragment", `${where} must not contain a fragment`);
  // Reject scheme (e.g. https:) / protocol-relative / any host component.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) fail("path_scheme", `${where} must not include a scheme`);
  if (value.startsWith("//")) fail("path_host", `${where} must not be protocol-relative`);
  if (!value.startsWith(SNAPSHOT_ROUTE_PREFIX)) {
    fail("path_prefix", `${where} must start with ${SNAPSHOT_ROUTE_PREFIX}`);
  }
  if (value !== expectedPath) {
    fail(
      "path_mismatch",
      `${where} ${JSON.stringify(value)} does not equal the id-derived path ${JSON.stringify(expectedPath)}`,
    );
  }
  return value;
}

/** Compose the canonical snapshot route path from a validated id + fixed prefix. */
export function snapshotPathForId(id: string): string {
  return `${SNAPSHOT_ROUTE_PREFIX}${id}${SNAPSHOT_ROUTE_SUFFIX}`;
}

/**
 * Strictly validate a parsed runtime manifest object and return a typed
 * manifest. Throws RuntimeManifestError on the first violated invariant. Does
 * not coerce or repair.
 */
export function assertRuntimeManifest(input: unknown): RuntimeManifest {
  assertPlainData(input, "manifest");
  if (!isPlainObject(input)) fail("manifest_shape", "manifest root must be a plain object");
  assertNoProhibitedFields(input, "manifest");
  assertExactKeys(input, MANIFEST_TOP_LEVEL_KEYS, "manifest");

  if (input.schema_version !== MANIFEST_SCHEMA_VERSION) {
    fail(
      "schema_version",
      `expected "${MANIFEST_SCHEMA_VERSION}", received ${JSON.stringify(input.schema_version)}`,
    );
  }
  if (input.map_id !== MANIFEST_MAP_ID) {
    fail("map_id", `expected "${MANIFEST_MAP_ID}", received ${JSON.stringify(input.map_id)}`);
  }
  if (input.currentness_claim !== MANIFEST_CURRENTNESS_CLAIM) {
    fail(
      "currentness_claim",
      `expected "${MANIFEST_CURRENTNESS_CLAIM}", received ${JSON.stringify(input.currentness_claim)}`,
    );
  }

  const selected = input.selected_snapshot;
  if (!isPlainObject(selected)) {
    fail("selected_snapshot", "selected_snapshot must be a plain object");
  }
  assertExactKeys(selected, SELECTED_SNAPSHOT_KEYS, "manifest.selected_snapshot");

  if (selected.snapshot_schema_version !== SNAPSHOT_SCHEMA_VERSION) {
    fail(
      "snapshot_schema_version",
      `expected "${SNAPSHOT_SCHEMA_VERSION}", received ${JSON.stringify(selected.snapshot_schema_version)}`,
    );
  }

  const sourceCommit = requireLowerHex(
    selected.source_commit,
    HEX40,
    "source_commit",
    "manifest.selected_snapshot.source_commit",
  );
  const sha256 = requireLowerHex(
    selected.sha256,
    HEX64,
    "sha256",
    "manifest.selected_snapshot.sha256",
  );
  const gitBlob = requireLowerHex(
    selected.git_blob,
    HEX40,
    "git_blob",
    "manifest.selected_snapshot.git_blob",
  );

  // id === source_commit + "-" + sha256
  const expectedId = `${sourceCommit}-${sha256}`;
  if (typeof selected.id !== "string") {
    fail("id_type", "manifest.selected_snapshot.id must be a string");
  }
  if (selected.id !== selected.id.toLowerCase()) {
    fail("id_case", "manifest.selected_snapshot.id must be lowercase");
  }
  if (selected.id !== expectedId) {
    fail(
      "id_composition",
      `id ${JSON.stringify(selected.id)} must equal source_commit + "-" + sha256 (${expectedId})`,
    );
  }

  // byte_length: positive safe integer within ceiling.
  if (
    typeof selected.byte_length !== "number" ||
    !Number.isSafeInteger(selected.byte_length) ||
    selected.byte_length <= 0
  ) {
    fail(
      "byte_length",
      `manifest.selected_snapshot.byte_length must be a positive safe integer, received ${JSON.stringify(selected.byte_length)}`,
    );
  }
  if (selected.byte_length > MAX_RUNTIME_SNAPSHOT_BYTES) {
    fail(
      "byte_length_max",
      `byte_length ${selected.byte_length} exceeds maximum ${MAX_RUNTIME_SNAPSHOT_BYTES}`,
    );
  }

  const expectedPath = snapshotPathForId(expectedId);
  const path = assertSnapshotPath(
    selected.path,
    expectedPath,
    "manifest.selected_snapshot.path",
  );

  return {
    schema_version: MANIFEST_SCHEMA_VERSION,
    map_id: MANIFEST_MAP_ID,
    currentness_claim: MANIFEST_CURRENTNESS_CLAIM,
    selected_snapshot: {
      id: expectedId,
      source_commit: sourceCommit,
      snapshot_schema_version: SNAPSHOT_SCHEMA_VERSION,
      path,
      byte_length: selected.byte_length,
      sha256,
      git_blob: gitBlob,
    },
  };
}

/**
 * Build-time cross-check: the validated manifest's selected snapshot must match
 * the actual runtime snapshot identity (id, byte length, SHA-256, Git blob).
 */
export function assertManifestMatchesSnapshot(
  manifest: RuntimeManifest,
  snapshot: {
    readonly id: string;
    readonly byteLength: number;
    readonly sha256: string;
    readonly gitBlob: string;
  },
): void {
  const sel = manifest.selected_snapshot;
  if (sel.id !== snapshot.id) {
    fail("snapshot_id_mismatch", `manifest id ${sel.id} ≠ snapshot id ${snapshot.id}`);
  }
  if (sel.byte_length !== snapshot.byteLength) {
    fail(
      "snapshot_byte_length_mismatch",
      `manifest byte_length ${sel.byte_length} ≠ snapshot ${snapshot.byteLength}`,
    );
  }
  if (sel.sha256 !== snapshot.sha256) {
    fail("snapshot_sha256_mismatch", `manifest sha256 ${sel.sha256} ≠ snapshot ${snapshot.sha256}`);
  }
  if (sel.git_blob !== snapshot.gitBlob) {
    fail(
      "snapshot_git_blob_mismatch",
      `manifest git_blob ${sel.git_blob} ≠ snapshot ${snapshot.gitBlob}`,
    );
  }
}
