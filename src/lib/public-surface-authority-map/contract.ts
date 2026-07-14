// Public Surface and Authority-Ceiling Map — Phase 1 preview contract.
//
// This module is the single build-time gate for the bundled last-known-good
// preview snapshot. Phase 1 provenance constants live here, NOT inside the
// audited snapshot: the snapshot file must stay byte-identical to the audited
// source (see src/data/public-surface-authority-map/last-known-good.json).
//
// Build-time validation runs in two stages, in this exact order:
//
//   raw snapshot bytes
//     -> byte-length validation
//     -> SHA-256 validation
//     -> Git blob SHA validation      (assertRawIdentity)
//     -> JSON parse
//     -> strict structural validation (assertSnapshot)
//     -> render
//
// The interactive route is prerendered, so this runs during the Astro build.
// Any violation throws and fails the build; the map is never rendered from
// unverified bytes or partially valid data. Identity is checked on the RAW
// bytes, so a mutation that preserves node/edge counts and field structure but
// changes even one byte still fails (the SHA-256 / Git blob SHA will not match).

// --- Provenance constants (Phase 1) -----------------------------------------

export const SOURCE_REPOSITORY = "metawritingecology/meta-writing-ecology";
export const SOURCE_REPOSITORY_URL =
  "https://github.com/metawritingecology/meta-writing-ecology";
export const SOURCE_LINK_HOST = "github.com";
export const APPROVED_REPOSITORY_PATH = "/metawritingecology/meta-writing-ecology/";

// PR #20 merge commit — the immutable snapshot source commit.
export const SNAPSHOT_SOURCE_COMMIT =
  "18491105f0bc0451e0bf99eaa78c39f69c7cb57c";
export const SNAPSHOT_SOURCE_PATH =
  "visualizations/public-surface-authority-map/data.json";
export const SNAPSHOT_COMMIT_URL = `${SOURCE_REPOSITORY_URL}/commit/${SNAPSHOT_SOURCE_COMMIT}`;

// Fixed identity of the audited raw bytes. The displayed SHA-256 must come from
// SNAPSHOT_SHA256 (the same value assertRawIdentity verifies), never recomputed
// from live input for display.
export const SNAPSHOT_SHA256 =
  "82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e";
export const SNAPSHOT_GIT_BLOB_SHA = "aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b";
export const SNAPSHOT_BYTE_LENGTH = 83727;

export const SNAPSHOT_STATUS = "bundled_last_known_good_preview_snapshot";
export const SNAPSHOT_STATUS_LABEL = "Bundled last-known-good preview snapshot";

// The only host/prefix source links are allowed to point at (used for display
// helpers; canonical URLs are additionally parsed and validated below).
export const SOURCE_LINK_PREFIX = `${SOURCE_REPOSITORY_URL}/`;

// --- Expected counts --------------------------------------------------------

export const EXPECTED_COUNTS = {
  nodes: 27,
  edges: 146,
  boundary_reference: 120,
  source_use_reference: 26,
  self_references_omitted: 7,
} as const;

// --- Allowed vocabularies (derived verbatim from the audited snapshot) ------

export const ALLOWED_GROUPING_FIELDS = [
  "surface_role",
  "authority_ceiling",
  "public_surface_status",
] as const;

export const ALLOWED_EDGE_TYPES = [
  "boundary_reference",
  "source_use_reference",
] as const;

export const NAVIGATION_ONLY = "navigation_only";
export const REQUIRED_SCOPE = "selected_public_surface_only";
export const REQUIRED_SCHEMA_VERSION = "1.0";

const SURFACE_ROLES = [
  "boundary_document",
  "concept_node",
  "interpretation_guide",
  "public_anchor",
  "repository_orientation",
  "source_use_guide",
] as const;

const PUBLIC_SURFACE_STATUSES = [
  "public_boundary_document",
  "public_navigation_surface",
  "selected_external_node",
] as const;

const NODE_AUTHORITY_CEILINGS = [
  "navigation_only",
  "public_file_claim_only",
  "repository_boundary_only",
] as const;

const RELATION_DEFAULTS = [
  "adjacency_only",
  "navigation_only",
  "not_applicable",
] as const;

const CLASSIFICATION_EVIDENCE = ["explicit_in_file", "not_asserted"] as const;

const PUBLICLY_DECLARED_CLASSIFICATIONS = [
  "Boundary Note / Conceptual Framework",
  "Boundary Packet / Boundary Note",
  "Cross / Domain Declaration / Structural Note",
  "Cross / Protocol Orientation / Domain Declaration",
  "Cross / Structural Account / Domain Declaration",
  "Model / Conceptual Framework / Domain Declaration",
  "Model / Domain Declaration",
  "Protocol / Method Orientation",
  "Protocol Orientation / Methodological Note / Domain Declaration",
  "Training-facing Public Surface Anchor",
] as const;

// --- Allowed key schemas (exact own-key sets) -------------------------------

const TOP_LEVEL_KEYS = [
  "authority_ceiling",
  "boundary_statements",
  "edge_counts",
  "edges",
  "generated_from",
  "generated_record_count",
  "grouping_fields",
  "nodes",
  "schema_version",
  "scope",
  "self_references_omitted_count",
  "title",
  "transform_notes",
] as const;

const NODE_ALLOWED_KEYS = [
  "authority_ceiling",
  "boundary_references",
  "canonical_public_url",
  "classification_evidence",
  "id",
  "name",
  "public_surface_status",
  "publicly_declared_classification",
  "relation_default",
  "repository_path",
  "source_use_reference",
  "surface_role",
] as const;

const EDGE_ALLOWED_KEYS = [
  "authority_ceiling",
  "evidence_source",
  "id",
  "relation_status",
  "relation_type",
  "source",
  "target",
] as const;

const EDGE_COUNTS_KEYS = ["boundary_reference", "source_use_reference"] as const;

const TRANSFORM_NOTES_KEYS = [
  "layout_position_implies_relation",
  "node_size_implies_importance",
  "record_order_implies_hierarchy",
  "self_references_omitted_from_edges",
] as const;

// Authority-inflating fields that must never appear anywhere in the snapshot.
// Rejected recursively and case-insensitively.
export const PROHIBITED_FIELDS = [
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
] as const;

const PROHIBITED_FIELDS_LOWER = new Set(
  PROHIBITED_FIELDS.map((field) => field.toLowerCase()),
);

// --- Types ------------------------------------------------------------------

export type GroupingField = (typeof ALLOWED_GROUPING_FIELDS)[number];
export type EdgeType = (typeof ALLOWED_EDGE_TYPES)[number];

export interface PublicSurfaceNode {
  readonly id: string;
  readonly name: string;
  readonly repository_path: string;
  readonly canonical_public_url: string;
  readonly surface_role: string;
  readonly public_surface_status: string;
  readonly authority_ceiling: string;
  readonly relation_default: string;
  readonly classification_evidence: string;
  readonly boundary_references: readonly string[];
  readonly source_use_reference: string;
  readonly publicly_declared_classification?: string;
}

export interface PublicSurfaceEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly relation_type: EdgeType;
  readonly relation_status: "navigation_only";
  readonly evidence_source: string;
  readonly authority_ceiling: "navigation_only";
}

export interface EdgeCounts {
  readonly boundary_reference: number;
  readonly source_use_reference: number;
}

export interface TransformNotes {
  readonly self_references_omitted_from_edges: boolean;
  readonly record_order_implies_hierarchy: boolean;
  readonly node_size_implies_importance: boolean;
  readonly layout_position_implies_relation: boolean;
}

export interface PublicSurfaceAuthoritySnapshot {
  readonly schema_version: "1.0";
  readonly title: string;
  readonly scope: "selected_public_surface_only";
  readonly authority_ceiling: "navigation_only";
  readonly generated_from: readonly string[];
  readonly generated_record_count: number;
  readonly boundary_statements: readonly string[];
  readonly grouping_fields: readonly string[];
  readonly edge_counts: EdgeCounts;
  readonly self_references_omitted_count: number;
  readonly nodes: readonly PublicSurfaceNode[];
  readonly edges: readonly PublicSurfaceEdge[];
  readonly transform_notes: TransformNotes;
}

// --- Error ------------------------------------------------------------------

export class SnapshotContractError extends Error {
  constructor(invariant: string, detail: string) {
    super(
      `Public Surface Authority Map snapshot contract violation [${invariant}]: ${detail}`,
    );
    this.name = "SnapshotContractError";
  }
}

function fail(invariant: string, detail: string): never {
  throw new SnapshotContractError(invariant, detail);
}

// --- Raw identity validation (runs before JSON.parse) -----------------------

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

// Git blob SHA-1: SHA-1 of `blob <byte-length>\0<raw-bytes>`, where \0 is a
// single NUL separator byte. The NUL is assembled as a byte (not embedded in
// source) so this file stays plain text.
async function gitBlobSha1Hex(bytes: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${bytes.length}`);
  const combined = new Uint8Array(header.length + 1 + bytes.length);
  combined.set(header, 0);
  combined[header.length] = 0; // NUL separator
  combined.set(bytes, header.length + 1);
  return toHex(await crypto.subtle.digest("SHA-1", combined));
}

/**
 * Validate the exact raw UTF-8 bytes of the snapshot against the fixed Phase 1
 * identity: byte length, SHA-256, and Git blob SHA — in that order. Any
 * single-byte difference fails.
 */
export async function assertRawIdentity(rawText: string): Promise<void> {
  const bytes = new TextEncoder().encode(rawText);

  if (bytes.length !== SNAPSHOT_BYTE_LENGTH) {
    fail(
      "raw_byte_length",
      `expected ${SNAPSHOT_BYTE_LENGTH} UTF-8 bytes, received ${bytes.length}`,
    );
  }

  const sha256 = await sha256Hex(bytes);
  if (sha256 !== SNAPSHOT_SHA256) {
    fail(
      "raw_sha256",
      `expected SHA-256 ${SNAPSHOT_SHA256}, computed ${sha256}`,
    );
  }

  const blob = await gitBlobSha1Hex(bytes);
  if (blob !== SNAPSHOT_GIT_BLOB_SHA) {
    fail(
      "raw_git_blob_sha",
      `expected Git blob SHA ${SNAPSHOT_GIT_BLOB_SHA}, computed ${blob}`,
    );
  }
}

/**
 * Full build-time gate: identity-validate the raw bytes, parse, then strictly
 * validate the parsed object. Returns the typed snapshot produced only from the
 * identity-validated bytes.
 */
export async function assertSnapshotFromRawText(
  rawText: string,
): Promise<PublicSurfaceAuthoritySnapshot> {
  await assertRawIdentity(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    fail(
      "json_parse",
      `snapshot bytes are not valid JSON: ${(error as Error).message}`,
    );
  }

  return assertSnapshot(parsed);
}

// --- Plain-data / prototype guards ------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// Recursively require JSON-compatible plain data. Rejects prototype-bearing
// objects, class instances, Map/Set/Date, functions, symbols, bigint,
// undefined, and non-finite numbers. Only own enumerable keys are traversed.
function assertPlainData(value: unknown, path: string): void {
  if (value === null) {
    return;
  }
  const type = typeof value;
  if (type === "string" || type === "boolean") {
    return;
  }
  if (type === "number") {
    if (!Number.isFinite(value)) {
      fail("plain_data", `${path} is a non-finite number`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPlainData(item, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      assertPlainData(value[key], `${path}.${key}`);
    }
    return;
  }
  fail(
    "plain_data",
    `${path} is not JSON-compatible plain data (received ${type})`,
  );
}

function assertNoProhibitedFields(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoProhibitedFields(item, `${path}[${index}]`),
    );
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (PROHIBITED_FIELDS_LOWER.has(key.toLowerCase())) {
        fail(
          "prohibited_authority_field",
          `prohibited field "${key}" found at ${path}.${key}`,
        );
      }
      assertNoProhibitedFields(value[key], `${path}.${key}`);
    }
  }
}

function assertAllowedKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(obj)) {
    if (!allowedSet.has(key)) {
      fail("unexpected_field", `unexpected key "${key}" at ${where}`);
    }
  }
}

// --- Scalar guards ----------------------------------------------------------

function requireString(value: unknown, invariant: string, where: string): string {
  if (typeof value !== "string") {
    fail(invariant, `${where} must be a string, received ${typeof value}`);
  }
  return value;
}

function requireNonEmptyString(
  value: unknown,
  invariant: string,
  where: string,
): string {
  const str = requireString(value, invariant, where);
  if (str.length === 0) {
    fail(invariant, `${where} must be a non-empty string`);
  }
  return str;
}

function requireBoolean(
  value: unknown,
  invariant: string,
  where: string,
): boolean {
  if (typeof value !== "boolean") {
    fail(
      invariant,
      `${where} must be a boolean, received ${typeof value} (${JSON.stringify(value)})`,
    );
  }
  return value;
}

function requireInteger(
  value: unknown,
  invariant: string,
  where: string,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(
      invariant,
      `${where} must be an integer, received ${JSON.stringify(value)}`,
    );
  }
  return value;
}

function requireEnum(
  value: unknown,
  allowed: readonly string[],
  invariant: string,
  where: string,
): string {
  if (typeof value !== "string" || !allowed.includes(value)) {
    fail(
      invariant,
      `${where} ${JSON.stringify(value)} is not one of: ${allowed.join(", ")}`,
    );
  }
  return value;
}

function assertCanonicalUrl(value: unknown, where: string): string {
  const raw = requireNonEmptyString(value, "canonical_url", where);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail("canonical_url", `${where} is not a valid URL: ${raw}`);
  }
  if (url.protocol !== "https:") {
    fail("canonical_url", `${where} must use https, received ${url.protocol}`);
  }
  if (url.hostname !== SOURCE_LINK_HOST) {
    fail(
      "canonical_url",
      `${where} host must be ${SOURCE_LINK_HOST}, received ${url.hostname}`,
    );
  }
  if (url.username !== "" || url.password !== "") {
    fail("canonical_url", `${where} must not contain credentials`);
  }
  if (url.port !== "") {
    fail("canonical_url", `${where} must not specify a port`);
  }
  if (!url.pathname.startsWith(APPROVED_REPOSITORY_PATH)) {
    fail(
      "canonical_url",
      `${where} must remain within ${SOURCE_REPOSITORY}, received path ${url.pathname}`,
    );
  }
  return raw;
}

// --- Node / edge validation -------------------------------------------------

function assertNode(
  value: unknown,
  index: number,
  seenIds: Set<string>,
): PublicSurfaceNode {
  const where = `nodes[${index}]`;
  if (!isPlainObject(value)) {
    fail("node_shape", `${where} must be a plain object`);
  }
  assertAllowedKeys(value, NODE_ALLOWED_KEYS, where);

  const id = requireNonEmptyString(value.id, "node_id", `${where}.id`);
  if (seenIds.has(id)) {
    fail("node_id_unique", `duplicate node id "${id}" at ${where}`);
  }
  seenIds.add(id);

  const rawRefs = value.boundary_references;
  if (!Array.isArray(rawRefs)) {
    fail("node_shape", `${where}.boundary_references must be an array`);
  }
  const boundaryReferences = rawRefs.map((entry, refIndex) =>
    requireNonEmptyString(
      entry,
      "node_shape",
      `${where}.boundary_references[${refIndex}]`,
    ),
  );

  const hasDeclaredClassification = Object.hasOwn(
    value,
    "publicly_declared_classification",
  );

  return {
    id,
    name: requireNonEmptyString(value.name, "node_shape", `${where}.name`),
    repository_path: requireNonEmptyString(
      value.repository_path,
      "node_shape",
      `${where}.repository_path`,
    ),
    canonical_public_url: assertCanonicalUrl(
      value.canonical_public_url,
      `${where}.canonical_public_url`,
    ),
    surface_role: requireEnum(
      value.surface_role,
      SURFACE_ROLES,
      "node_surface_role",
      `${where}.surface_role`,
    ),
    public_surface_status: requireEnum(
      value.public_surface_status,
      PUBLIC_SURFACE_STATUSES,
      "node_public_surface_status",
      `${where}.public_surface_status`,
    ),
    authority_ceiling: requireEnum(
      value.authority_ceiling,
      NODE_AUTHORITY_CEILINGS,
      "node_authority_ceiling",
      `${where}.authority_ceiling`,
    ),
    relation_default: requireEnum(
      value.relation_default,
      RELATION_DEFAULTS,
      "node_relation_default",
      `${where}.relation_default`,
    ),
    classification_evidence: requireEnum(
      value.classification_evidence,
      CLASSIFICATION_EVIDENCE,
      "node_classification_evidence",
      `${where}.classification_evidence`,
    ),
    boundary_references: boundaryReferences,
    source_use_reference: requireNonEmptyString(
      value.source_use_reference,
      "node_shape",
      `${where}.source_use_reference`,
    ),
    ...(hasDeclaredClassification
      ? {
          publicly_declared_classification: requireEnum(
            value.publicly_declared_classification,
            PUBLICLY_DECLARED_CLASSIFICATIONS,
            "node_declared_classification",
            `${where}.publicly_declared_classification`,
          ),
        }
      : {}),
  };
}

function assertEdge(
  value: unknown,
  index: number,
  nodeIds: Set<string>,
): PublicSurfaceEdge {
  const where = `edges[${index}]`;
  if (!isPlainObject(value)) {
    fail("edge_shape", `${where} must be a plain object`);
  }
  assertAllowedKeys(value, EDGE_ALLOWED_KEYS, where);

  const source = requireNonEmptyString(value.source, "edge_shape", `${where}.source`);
  const target = requireNonEmptyString(value.target, "edge_shape", `${where}.target`);
  const relationType = requireEnum(
    value.relation_type,
    ALLOWED_EDGE_TYPES,
    "edge_type_allowed",
    `${where}.relation_type`,
  );

  if (source === target) {
    fail("edge_no_self_reference", `${where} is a self-reference on "${source}"`);
  }
  if (!nodeIds.has(source)) {
    fail(
      "edge_endpoint_exists",
      `${where}.source "${source}" is not a known node id`,
    );
  }
  if (!nodeIds.has(target)) {
    fail(
      "edge_endpoint_exists",
      `${where}.target "${target}" is not a known node id`,
    );
  }
  if (value.relation_status !== NAVIGATION_ONLY) {
    fail(
      "edge_navigation_only",
      `${where}.relation_status must be "${NAVIGATION_ONLY}", received ${JSON.stringify(value.relation_status)}`,
    );
  }
  if (value.authority_ceiling !== NAVIGATION_ONLY) {
    fail(
      "edge_navigation_only",
      `${where}.authority_ceiling must be "${NAVIGATION_ONLY}", received ${JSON.stringify(value.authority_ceiling)}`,
    );
  }

  return {
    id: requireNonEmptyString(value.id, "edge_shape", `${where}.id`),
    source,
    target,
    relation_type: relationType as EdgeType,
    relation_status: NAVIGATION_ONLY,
    evidence_source: requireNonEmptyString(
      value.evidence_source,
      "edge_shape",
      `${where}.evidence_source`,
    ),
    authority_ceiling: NAVIGATION_ONLY,
  };
}

// --- Top-level structural validation ----------------------------------------

/**
 * Strictly validate a parsed snapshot object and return a typed snapshot.
 * Throws SnapshotContractError on the first violated invariant. Does not coerce
 * or repair values.
 */
export function assertSnapshot(input: unknown): PublicSurfaceAuthoritySnapshot {
  // Reject prototype-bearing / non-JSON data anywhere in the tree first.
  assertPlainData(input, "snapshot");
  if (!isPlainObject(input)) {
    fail("snapshot_shape", "snapshot root must be a plain object");
  }

  assertNoProhibitedFields(input, "snapshot");
  assertAllowedKeys(input, TOP_LEVEL_KEYS, "snapshot");

  if (input.schema_version !== REQUIRED_SCHEMA_VERSION) {
    fail(
      "schema_version",
      `expected "${REQUIRED_SCHEMA_VERSION}", received ${JSON.stringify(input.schema_version)}`,
    );
  }
  if (input.scope !== REQUIRED_SCOPE) {
    fail("scope", `expected "${REQUIRED_SCOPE}", received ${JSON.stringify(input.scope)}`);
  }
  if (input.authority_ceiling !== NAVIGATION_ONLY) {
    fail(
      "top_level_authority_ceiling",
      `expected "${NAVIGATION_ONLY}", received ${JSON.stringify(input.authority_ceiling)}`,
    );
  }

  const title = requireNonEmptyString(input.title, "title", "snapshot.title");

  // generated_from: non-empty array of non-empty strings.
  if (!Array.isArray(input.generated_from) || input.generated_from.length === 0) {
    fail("generated_from", "generated_from must be a non-empty array");
  }
  const generatedFrom = input.generated_from.map((entry, index) =>
    requireNonEmptyString(entry, "generated_from", `snapshot.generated_from[${index}]`),
  );

  // boundary_statements: non-empty array of non-empty strings.
  if (
    !Array.isArray(input.boundary_statements) ||
    input.boundary_statements.length === 0
  ) {
    fail("boundary_statements", "boundary_statements must be a non-empty array");
  }
  const boundaryStatements = input.boundary_statements.map((entry, index) =>
    requireNonEmptyString(
      entry,
      "boundary_statements",
      `snapshot.boundary_statements[${index}]`,
    ),
  );

  // grouping_fields: exactly the approved grouping fields, unique, no unknowns.
  if (!Array.isArray(input.grouping_fields)) {
    fail("grouping_fields", "grouping_fields must be an array");
  }
  const groupingFields = input.grouping_fields.map((entry, index) =>
    requireString(entry, "grouping_fields", `snapshot.grouping_fields[${index}]`),
  );
  const groupingSet = new Set(groupingFields);
  if (groupingSet.size !== groupingFields.length) {
    fail("grouping_fields", "grouping_fields must not contain duplicates");
  }
  for (const field of groupingFields) {
    if (!(ALLOWED_GROUPING_FIELDS as readonly string[]).includes(field)) {
      fail(
        "grouping_fields",
        `unknown grouping field "${field}"; allowed: ${ALLOWED_GROUPING_FIELDS.join(", ")}`,
      );
    }
  }
  for (const approved of ALLOWED_GROUPING_FIELDS) {
    if (!groupingSet.has(approved)) {
      fail("grouping_fields", `grouping_fields is missing approved field "${approved}"`);
    }
  }

  // transform_notes: strict booleans, exact key set.
  if (!isPlainObject(input.transform_notes)) {
    fail("transform_notes", "transform_notes must be a plain object");
  }
  assertAllowedKeys(input.transform_notes, TRANSFORM_NOTES_KEYS, "snapshot.transform_notes");
  const transformNotes: TransformNotes = {
    self_references_omitted_from_edges: requireBoolean(
      input.transform_notes.self_references_omitted_from_edges,
      "transform_notes",
      "snapshot.transform_notes.self_references_omitted_from_edges",
    ),
    record_order_implies_hierarchy: requireBoolean(
      input.transform_notes.record_order_implies_hierarchy,
      "transform_notes",
      "snapshot.transform_notes.record_order_implies_hierarchy",
    ),
    node_size_implies_importance: requireBoolean(
      input.transform_notes.node_size_implies_importance,
      "transform_notes",
      "snapshot.transform_notes.node_size_implies_importance",
    ),
    layout_position_implies_relation: requireBoolean(
      input.transform_notes.layout_position_implies_relation,
      "transform_notes",
      "snapshot.transform_notes.layout_position_implies_relation",
    ),
  };

  // nodes
  if (!Array.isArray(input.nodes)) {
    fail("nodes_present", "nodes must be an array");
  }
  if (input.nodes.length !== EXPECTED_COUNTS.nodes) {
    fail("node_count", `expected ${EXPECTED_COUNTS.nodes} nodes, received ${input.nodes.length}`);
  }
  const seenIds = new Set<string>();
  const nodes = input.nodes.map((node, index) => assertNode(node, index, seenIds));

  // generated_record_count must equal the actual node count.
  const generatedRecordCount = requireInteger(
    input.generated_record_count,
    "generated_record_count",
    "snapshot.generated_record_count",
  );
  if (generatedRecordCount !== nodes.length) {
    fail(
      "generated_record_count",
      `generated_record_count ${generatedRecordCount} must equal the actual node count ${nodes.length}`,
    );
  }

  // edges
  if (!Array.isArray(input.edges)) {
    fail("edges_present", "edges must be an array");
  }
  if (input.edges.length !== EXPECTED_COUNTS.edges) {
    fail("edge_count", `expected ${EXPECTED_COUNTS.edges} edges, received ${input.edges.length}`);
  }
  let boundaryReferenceCount = 0;
  let sourceUseReferenceCount = 0;
  const edges = input.edges.map((edge, index) => {
    const parsed = assertEdge(edge, index, seenIds);
    if (parsed.relation_type === "boundary_reference") {
      boundaryReferenceCount += 1;
    } else {
      sourceUseReferenceCount += 1;
    }
    return parsed;
  });

  if (boundaryReferenceCount !== EXPECTED_COUNTS.boundary_reference) {
    fail(
      "boundary_reference_count",
      `expected ${EXPECTED_COUNTS.boundary_reference} boundary_reference edges, received ${boundaryReferenceCount}`,
    );
  }
  if (sourceUseReferenceCount !== EXPECTED_COUNTS.source_use_reference) {
    fail(
      "source_use_reference_count",
      `expected ${EXPECTED_COUNTS.source_use_reference} source_use_reference edges, received ${sourceUseReferenceCount}`,
    );
  }

  // edge_counts must be strict integers agreeing with the actual edge counts.
  if (!isPlainObject(input.edge_counts)) {
    fail("edge_counts", "edge_counts must be a plain object");
  }
  assertAllowedKeys(input.edge_counts, EDGE_COUNTS_KEYS, "snapshot.edge_counts");
  const declaredBoundary = requireInteger(
    input.edge_counts.boundary_reference,
    "edge_counts",
    "snapshot.edge_counts.boundary_reference",
  );
  const declaredSourceUse = requireInteger(
    input.edge_counts.source_use_reference,
    "edge_counts",
    "snapshot.edge_counts.source_use_reference",
  );
  if (
    declaredBoundary !== boundaryReferenceCount ||
    declaredSourceUse !== sourceUseReferenceCount
  ) {
    fail(
      "edge_counts",
      `declared edge_counts { boundary_reference: ${declaredBoundary}, source_use_reference: ${declaredSourceUse} } must agree with actual { ${boundaryReferenceCount}, ${sourceUseReferenceCount} }`,
    );
  }

  // self_references_omitted_count
  const omitted = requireInteger(
    input.self_references_omitted_count,
    "self_references_omitted_count",
    "snapshot.self_references_omitted_count",
  );
  if (omitted !== EXPECTED_COUNTS.self_references_omitted) {
    fail(
      "self_references_omitted_count",
      `expected ${EXPECTED_COUNTS.self_references_omitted}, received ${omitted}`,
    );
  }

  return {
    schema_version: REQUIRED_SCHEMA_VERSION,
    title,
    scope: REQUIRED_SCOPE,
    authority_ceiling: NAVIGATION_ONLY,
    generated_from: generatedFrom,
    generated_record_count: generatedRecordCount,
    boundary_statements: boundaryStatements,
    grouping_fields: groupingFields,
    edge_counts: {
      boundary_reference: declaredBoundary,
      source_use_reference: declaredSourceUse,
    },
    self_references_omitted_count: omitted,
    nodes,
    edges,
    transform_notes: transformNotes,
  };
}
