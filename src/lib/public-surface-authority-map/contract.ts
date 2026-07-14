// Public Surface and Authority-Ceiling Map — shared strict snapshot contract.
//
// This module is the reusable, browser-safe AND build-safe strict semantic
// validator for any Public Surface Authority Map snapshot. It enforces the
// public vocabulary, exact key schemas, authority-ceiling invariants, boundary
// semantics, and INTERNAL count consistency — but it does NOT hard-code the
// Phase 1 instance counts (27 nodes / 146 edges / 120 / 26 / 7). A generalized
// future snapshot may carry different, internally-consistent counts.
//
// Phase 1 provenance, fixed byte identity, and the exact Phase 1 instance counts
// live in `./fallback.ts`. For backward compatibility the Phase 1 provenance
// constants and the `assertSnapshotFromRawText` entry point are re-exported from
// here (see the compatibility re-exports at the bottom) so existing Phase 1
// components keep importing them from `contract.ts` unchanged.
//
// Raw byte-identity primitives (SHA-256, Git blob id, UTF-8 handling) live in
// `./byteIdentity.ts` and are shared across the data surface.

// --- Shared approved-source constants ---------------------------------------

export const SOURCE_REPOSITORY = "metawritingecology/meta-writing-ecology";
export const SOURCE_REPOSITORY_URL =
  "https://github.com/metawritingecology/meta-writing-ecology";
export const SOURCE_LINK_HOST = "github.com";
export const APPROVED_REPOSITORY_PATH = "/metawritingecology/meta-writing-ecology/";

// The only host/prefix source links are allowed to point at (used for display
// helpers; canonical URLs are additionally parsed and validated below).
export const SOURCE_LINK_PREFIX = `${SOURCE_REPOSITORY_URL}/`;

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

// Boundary statements that every snapshot MUST carry verbatim. These are
// universal authority-ceiling boundary invariants, not Phase 1 instance counts,
// so they belong in the shared contract. Altering or dropping any one fails.
export const REQUIRED_BOUNDARY_STATEMENTS = [
  "Selected public surface only.",
  "Visual position does not indicate conceptual importance or internal authority.",
  "Reference routing does not establish a confirmed conceptual relation.",
  "Omission does not imply nonexistence.",
] as const;

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

// Fixed Phase 1 (or any specific snapshot's) instance counts. When supplied to
// `assertSnapshot`, these exact values are enforced; when omitted the validator
// only enforces internal count consistency.
export interface ExpectedInstanceCounts {
  readonly nodes: number;
  readonly edges: number;
  readonly boundary_reference: number;
  readonly source_use_reference: number;
  readonly self_references_omitted: number;
}

export interface SnapshotValidationOptions {
  readonly expectedCounts?: ExpectedInstanceCounts;
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
  seenEdgeIds: Set<string>,
): PublicSurfaceEdge {
  const where = `edges[${index}]`;
  if (!isPlainObject(value)) {
    fail("edge_shape", `${where} must be a plain object`);
  }
  assertAllowedKeys(value, EDGE_ALLOWED_KEYS, where);

  const id = requireNonEmptyString(value.id, "edge_shape", `${where}.id`);
  if (seenEdgeIds.has(id)) {
    fail("edge_id_unique", `duplicate edge id "${id}" at ${where}`);
  }
  seenEdgeIds.add(id);

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
    id,
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
 *
 * When `options.expectedCounts` is supplied the exact instance counts are
 * enforced (Phase 1 uses this). When omitted, only INTERNAL count consistency
 * is enforced, so a generalized future snapshot with different but consistent
 * counts is accepted without weakening any semantic rule.
 */
export function assertSnapshot(
  input: unknown,
  options: SnapshotValidationOptions = {},
): PublicSurfaceAuthoritySnapshot {
  const expected = options.expectedCounts;

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
  // Every required boundary statement must be present verbatim.
  const boundaryStatementSet = new Set(boundaryStatements);
  for (const required of REQUIRED_BOUNDARY_STATEMENTS) {
    if (!boundaryStatementSet.has(required)) {
      fail(
        "boundary_statements",
        `required boundary statement is missing or altered: ${JSON.stringify(required)}`,
      );
    }
  }

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
  if (input.nodes.length === 0) {
    fail("node_count", "nodes must be a non-empty array");
  }
  if (expected && input.nodes.length !== expected.nodes) {
    fail("node_count", `expected ${expected.nodes} nodes, received ${input.nodes.length}`);
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
  if (expected && input.edges.length !== expected.edges) {
    fail("edge_count", `expected ${expected.edges} edges, received ${input.edges.length}`);
  }
  let boundaryReferenceCount = 0;
  let sourceUseReferenceCount = 0;
  const seenEdgeIds = new Set<string>();
  const edges = input.edges.map((edge, index) => {
    const parsed = assertEdge(edge, index, seenIds, seenEdgeIds);
    if (parsed.relation_type === "boundary_reference") {
      boundaryReferenceCount += 1;
    } else {
      sourceUseReferenceCount += 1;
    }
    return parsed;
  });

  if (expected && boundaryReferenceCount !== expected.boundary_reference) {
    fail(
      "boundary_reference_count",
      `expected ${expected.boundary_reference} boundary_reference edges, received ${boundaryReferenceCount}`,
    );
  }
  if (expected && sourceUseReferenceCount !== expected.source_use_reference) {
    fail(
      "source_use_reference_count",
      `expected ${expected.source_use_reference} source_use_reference edges, received ${sourceUseReferenceCount}`,
    );
  }

  // edge_counts must be strict integers agreeing with the actual edge counts
  // (internal consistency, enforced for every snapshot).
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

  // self_references_omitted_count: non-negative integer (internal), exact when
  // expected counts are supplied.
  const omitted = requireInteger(
    input.self_references_omitted_count,
    "self_references_omitted_count",
    "snapshot.self_references_omitted_count",
  );
  if (omitted < 0) {
    fail(
      "self_references_omitted_count",
      `self_references_omitted_count must be non-negative, received ${omitted}`,
    );
  }
  if (expected && omitted !== expected.self_references_omitted) {
    fail(
      "self_references_omitted_count",
      `expected ${expected.self_references_omitted}, received ${omitted}`,
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

// --- Phase 1 compatibility re-exports ---------------------------------------
//
// Existing Phase 1 components import these Phase-1-specific names FROM
// `contract.ts`. They now physically live in `./fallback.ts`; re-exporting them
// here preserves the existing import surface without editing any component. The
// re-exported bindings are used only at call time, so the contract <-> fallback
// module cycle initialises safely.

export {
  SNAPSHOT_SOURCE_COMMIT,
  SNAPSHOT_SOURCE_PATH,
  SNAPSHOT_COMMIT_URL,
  SNAPSHOT_SHA256,
  SNAPSHOT_GIT_BLOB_SHA,
  SNAPSHOT_BYTE_LENGTH,
  SNAPSHOT_STATUS,
  SNAPSHOT_STATUS_LABEL,
  EXPECTED_COUNTS,
  assertRawIdentity,
  assertSnapshotFromRawText,
} from "./fallback.ts";
