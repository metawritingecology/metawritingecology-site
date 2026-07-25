// Expanded Public Surface Adjacency Map — dataset contract.
//
// Independent, fail-closed validator for the adopted 59-record expanded
// public-surface adjacency dataset. It is deliberately NOT shared with
// `src/lib/public-surface-authority-map/contract.ts`: the frozen 30-record
// authority-ceiling product keeps its own contract, this product keeps its own,
// and neither imports the other.
//
// This module is an ENGINEERING gate only. Passing validation establishes
// structural shape, byte-level provenance, and the declared evidence-class
// separation. It establishes NOTHING about Registry status, classification,
// ontology, completeness, currentness, ranking, authority, or confirmed
// conceptual relations.
//
// Fail-closed posture:
//   - every object shape is validated against an EXACT key allowlist; an
//     unknown property is a rejection, never a silently ignored extra;
//   - a recursive scan additionally rejects any key whose name implies
//     confirmed relation, formal promotion, rank, centrality, authority score,
//     importance, priority, canonicality, confidence, relation strength,
//     generation time, or currentness;
//   - only the two approved edge classes are accepted; the four
//     explicitly-not-rendered relation classes are rejected outright;
//   - no reverse edge, no derived edge, and no node is ever synthesized here.
//
// The module is pure: no DOM, no filesystem, no network, no time, no randomness,
// no host locale.

// ---------------------------------------------------------------------------
// Fixed product identity
// ---------------------------------------------------------------------------

export const SNAPSHOT_SCHEMA_VERSION = "1.0";
export const SNAPSHOT_SCOPE = "expanded_public_surface_visualization_membership";
export const SNAPSHOT_AUTHORITY_CEILING = "navigation_only";

/** The adopted dataset's embedded source commit. */
export const SNAPSHOT_SOURCE_COMMIT = "933274af9693d6d1d9fac36819aafdf56f9ab81d";

export const SOURCE_REPOSITORY = "metawritingecology/meta-writing-ecology";
export const SOURCE_REPOSITORY_URL =
  "https://github.com/metawritingecology/meta-writing-ecology";

/** The ONLY accepted canonical public URL prefix. HTTPS, approved host, approved path. */
export const SOURCE_LINK_PREFIX = `${SOURCE_REPOSITORY_URL}/blob/main/`;

// ---------------------------------------------------------------------------
// Fixed expected counts
// ---------------------------------------------------------------------------

export const EXPECTED_RECORD_COUNT = 59;
export const EXPECTED_ROLE_COUNTS = {
  concept: 49,
  orientation: 2,
  boundary: 7,
  anchor: 1,
} as const;
export const EXPECTED_SEMANTIC_LAYOUT_PARTICIPANTS = 49;
export const EXPECTED_FIXED_BAND_RECORDS = 10;
export const EXPECTED_EDGE_COUNTS = {
  source_named_adjacency: 189,
  navigation_adjacency: 194,
} as const;
export const EXPECTED_TOTAL_EDGES = 383;

// ---------------------------------------------------------------------------
// Approved vocabularies
// ---------------------------------------------------------------------------

export type AdjacencyVisualizationRole =
  | "concept"
  | "orientation"
  | "boundary"
  | "anchor";

export const VISUALIZATION_ROLES: readonly AdjacencyVisualizationRole[] = [
  "concept",
  "orientation",
  "boundary",
  "anchor",
];

/** Roles rendered in fixed, visibly separate bands outside the semantic layout. */
export const FIXED_BAND_ROLES: readonly AdjacencyVisualizationRole[] = [
  "orientation",
  "boundary",
  "anchor",
];

export type AdjacencyEdgeClass = "source_named_adjacency" | "navigation_adjacency";

export const EDGE_CLASSES: readonly AdjacencyEdgeClass[] = [
  "source_named_adjacency",
  "navigation_adjacency",
];

/** Fixed initial visibility per edge class. Never derived from data. */
export const EDGE_CLASS_DEFAULT_VISIBLE: Readonly<Record<AdjacencyEdgeClass, boolean>> = {
  source_named_adjacency: true,
  navigation_adjacency: false,
};

/**
 * Relation classes that are recorded at product level in the source dataset but
 * are NEVER rendered as semantic edges and are rejected outright if they appear
 * as an edge class.
 */
export const RELATION_CLASSES_NOT_RENDERED: readonly string[] = [
  "governance_reference",
  "source_use_reference",
  "visual_layout_adjacency",
  "user_confirmed_relation",
];

/** Required transform-note keys. Every one of them must be exactly `false`. */
export const REQUIRED_FALSE_TRANSFORM_NOTES: readonly string[] = [
  "record_order_implies_hierarchy",
  "node_size_implies_importance",
  "layout_position_implies_relation",
  "grouping_implies_classification_or_ontology",
  "adjacency_implies_formal_relation",
  "reverse_edges_inferred",
  "non_concept_records_participate_in_layout",
  "governance_or_source_use_edges_rendered",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdjacencyNode {
  readonly id: string;
  readonly repository_path: string;
  readonly display_label: string;
  readonly display_label_source: "registry_name";
  readonly visualization_role: AdjacencyVisualizationRole;
  readonly visualization_membership: "included";
  readonly semantic_layout_participation: boolean;
  readonly grouping_source: "model_atlas_field" | "visualization_role";
  readonly grouping: string;
  readonly relation_evidence_ceiling: string;
  readonly canonical_public_url: string;
}

export interface AdjacencyEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly edge_class: AdjacencyEdgeClass;
  readonly directed: true;
  readonly default_visible: boolean;
  readonly relation_status: AdjacencyEdgeClass;
  readonly authority_ceiling: "navigation_only";
}

export interface AdjacencyEdgeClassDescriptor {
  readonly edge_class: AdjacencyEdgeClass;
  readonly display_label: string;
  readonly directed: true;
  readonly default_visible: boolean;
  readonly evidence_source: string;
}

export interface AdjacencySnapshot {
  readonly schema_version: string;
  readonly title: string;
  readonly scope: string;
  readonly authority_ceiling: string;
  readonly source_commit: string;
  readonly source_repository: string;
  readonly generated_from: readonly string[];
  readonly record_count: number;
  readonly boundary_statements: readonly string[];
  readonly role_distribution: Readonly<Record<string, number>>;
  readonly semantic_layout_participant_count: number;
  readonly fixed_band_record_count: number;
  readonly grouping_distribution: Readonly<Record<string, number>>;
  readonly relation_evidence_ceiling_distribution: Readonly<Record<string, number>>;
  readonly edge_classes: readonly AdjacencyEdgeClassDescriptor[];
  readonly raw_edge_counts: Readonly<Record<string, number>>;
  readonly edge_counts: Readonly<Record<string, number>>;
  readonly excluded_non_concept_endpoint_counts: Readonly<Record<string, number>>;
  readonly source_named_declaration_counts: Readonly<Record<string, number>>;
  readonly relation_classes_not_rendered: readonly string[];
  readonly transform_notes: Readonly<Record<string, boolean>>;
  readonly nodes: readonly AdjacencyNode[];
  readonly edges: readonly AdjacencyEdge[];
}

// ---------------------------------------------------------------------------
// Fail-closed error
// ---------------------------------------------------------------------------

export class AdjacencySnapshotError extends Error {
  readonly code: string;
  constructor(code: string, detail: string) {
    super(`Adjacency snapshot contract violation [${code}]: ${detail}`);
    this.name = "AdjacencySnapshotError";
    this.code = code;
  }
}

function fail(code: string, detail: string): never {
  throw new AdjacencySnapshotError(code, detail);
}

// ---------------------------------------------------------------------------
// Exact key allowlists
// ---------------------------------------------------------------------------

const SNAPSHOT_KEYS: readonly string[] = [
  "schema_version",
  "title",
  "scope",
  "authority_ceiling",
  "source_commit",
  "source_repository",
  "generated_from",
  "record_count",
  "boundary_statements",
  "role_distribution",
  "semantic_layout_participant_count",
  "fixed_band_record_count",
  "grouping_distribution",
  "relation_evidence_ceiling_distribution",
  "edge_classes",
  "raw_edge_counts",
  "edge_counts",
  "excluded_non_concept_endpoint_counts",
  "source_named_declaration_counts",
  "relation_classes_not_rendered",
  "transform_notes",
  "nodes",
  "edges",
];

const NODE_KEYS: readonly string[] = [
  "id",
  "repository_path",
  "display_label",
  "display_label_source",
  "visualization_role",
  "visualization_membership",
  "semantic_layout_participation",
  "grouping_source",
  "grouping",
  "relation_evidence_ceiling",
  "canonical_public_url",
];

const EDGE_KEYS: readonly string[] = [
  "id",
  "source",
  "target",
  "edge_class",
  "directed",
  "default_visible",
  "relation_status",
  "authority_ceiling",
];

const EDGE_CLASS_DESCRIPTOR_KEYS: readonly string[] = [
  "edge_class",
  "display_label",
  "directed",
  "default_visible",
  "evidence_source",
];

const SOURCE_NAMED_DECLARATION_KEYS: readonly string[] = [
  "markdown_link_declarations",
  "same_section_repeated_evidence",
  "self_references_omitted",
  "unique_directed_edges",
];

// Every key name the contract explicitly enumerates and therefore explicitly
// permits. The recursive prohibited-semantics scan below exempts exactly these
// names and nothing else.
const EXPLICITLY_PERMITTED_KEY_NAMES: ReadonlySet<string> = new Set([
  ...SNAPSHOT_KEYS,
  ...NODE_KEYS,
  ...EDGE_KEYS,
  ...EDGE_CLASS_DESCRIPTOR_KEYS,
  ...SOURCE_NAMED_DECLARATION_KEYS,
  ...REQUIRED_FALSE_TRANSFORM_NOTES,
  ...VISUALIZATION_ROLES,
  ...EDGE_CLASSES,
  "none",
]);

/**
 * Substrings that, in a key name outside the explicit allowlist, imply a
 * semantic this product must never carry. Matched against the lower-cased key
 * with spaces and hyphens folded to underscores.
 */
const PROHIBITED_KEY_TOKENS: readonly string[] = [
  "confirmed",
  "promotion",
  "promoted",
  "rank",
  "centrality",
  "authority_score",
  "importance",
  "priority",
  "canonicality",
  "confidence",
  "strength",
  "weight",
  "score",
  "degree",
  "generated_at",
  "generated_on",
  "generated_time",
  "generated_timestamp",
  "timestamp",
  "updated_at",
  "retrieved_at",
  "currentness",
  "current_as_of",
  "freshness",
  "latest",
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * Recursively reject any key whose name implies a prohibited semantic. Runs over
 * the RAW parsed input before shape validation, so a widened field is rejected
 * even where it sits inside a nested structure.
 */
export function assertNoProhibitedSemantics(input: unknown, path = "$"): void {
  if (Array.isArray(input)) {
    input.forEach((item, index) => assertNoProhibitedSemantics(item, `${path}[${index}]`));
    return;
  }
  if (input === null || typeof input !== "object") return;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!EXPLICITLY_PERMITTED_KEY_NAMES.has(key)) {
      const normalized = normalizeKey(key);
      for (const token of PROHIBITED_KEY_TOKENS) {
        if (normalized.includes(token)) {
          fail(
            "prohibited_field",
            `${path}.${key}: key implies a prohibited semantic (${token})`,
          );
        }
      }
    }
    assertNoProhibitedSemantics(value, `${path}.${key}`);
  }
}

// ---------------------------------------------------------------------------
// Primitive guards
// ---------------------------------------------------------------------------

function asObject(value: unknown, code: string, where: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(code, `${where} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, code: string, where: string): unknown[] {
  if (!Array.isArray(value)) fail(code, `${where} must be an array`);
  return value;
}

function assertExactKeys(
  object: Record<string, unknown>,
  allowed: readonly string[],
  code: string,
  where: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(object)) {
    if (!allowedSet.has(key)) {
      fail(code, `${where}: unknown property "${key}"`);
    }
  }
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(object, key)) {
      fail(code, `${where}: missing required property "${key}"`);
    }
  }
}

function requireString(
  object: Record<string, unknown>,
  key: string,
  code: string,
  where: string,
): string {
  const value = object[key];
  if (typeof value !== "string" || value.length === 0) {
    fail(code, `${where}.${key} must be a non-empty string`);
  }
  return value;
}

function requireExactString(
  object: Record<string, unknown>,
  key: string,
  expected: string,
  code: string,
  where: string,
): string {
  const value = requireString(object, key, code, where);
  if (value !== expected) {
    fail(code, `${where}.${key} must be exactly "${expected}", received "${value}"`);
  }
  return value;
}

function requireExactNumber(
  object: Record<string, unknown>,
  key: string,
  expected: number,
  code: string,
  where: string,
): number {
  const value = object[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(code, `${where}.${key} must be an integer`);
  }
  if (value !== expected) {
    fail(code, `${where}.${key} must be exactly ${expected}, received ${value}`);
  }
  return value;
}

function requireExactBoolean(
  object: Record<string, unknown>,
  key: string,
  expected: boolean,
  code: string,
  where: string,
): boolean {
  const value = object[key];
  if (typeof value !== "boolean") fail(code, `${where}.${key} must be a boolean`);
  if (value !== expected) {
    fail(code, `${where}.${key} must be exactly ${String(expected)}`);
  }
  return value;
}

function requireStringArray(
  object: Record<string, unknown>,
  key: string,
  code: string,
  where: string,
): string[] {
  const raw = asArray(object[key], code, `${where}.${key}`);
  return raw.map((item, index) => {
    if (typeof item !== "string" || item.length === 0) {
      fail(code, `${where}.${key}[${index}] must be a non-empty string`);
    }
    return item;
  });
}

function requireCountMap(
  object: Record<string, unknown>,
  key: string,
  code: string,
  where: string,
): Record<string, number> {
  const map = asObject(object[key], code, `${where}.${key}`);
  const out: Record<string, number> = {};
  for (const [name, value] of Object.entries(map)) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      fail(code, `${where}.${key}.${name} must be a non-negative integer`);
    }
    out[name] = value;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Canonical public URL guard
// ---------------------------------------------------------------------------

/**
 * A canonical public URL is accepted ONLY when it is an exact HTTPS URL under
 * the approved source repository blob path AND its path tail equals the record's
 * repository path. No other scheme, host, or path may enter a rendered link.
 */
export function isApprovedSourceUrl(url: string, repositoryPath: string): boolean {
  if (typeof url !== "string") return false;
  if (!url.startsWith(SOURCE_LINK_PREFIX)) return false;
  if (url !== `${SOURCE_LINK_PREFIX}${repositoryPath}`) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.host !== "github.com") return false;
  if (parsed.search !== "" || parsed.hash !== "") return false;
  return true;
}

// ---------------------------------------------------------------------------
// Node validation
// ---------------------------------------------------------------------------

function assertNode(raw: unknown, index: number): AdjacencyNode {
  const where = `nodes[${index}]`;
  const node = asObject(raw, "node_shape", where);
  assertExactKeys(node, NODE_KEYS, "node_unknown_field", where);

  const id = requireString(node, "id", "node_id", where);
  const repositoryPath = requireString(node, "repository_path", "node_path", where);
  if (id !== repositoryPath) {
    fail("node_id_path_mismatch", `${where}: id "${id}" must equal repository_path "${repositoryPath}"`);
  }

  requireString(node, "display_label", "node_display_label", where);
  requireExactString(
    node,
    "display_label_source",
    "registry_name",
    "node_display_label_source",
    where,
  );

  const role = requireString(node, "visualization_role", "node_role", where);
  if (!VISUALIZATION_ROLES.includes(role as AdjacencyVisualizationRole)) {
    fail("node_role", `${where}.visualization_role "${role}" is not an approved role`);
  }

  requireExactString(
    node,
    "visualization_membership",
    "included",
    "node_membership",
    where,
  );

  const participation = node.semantic_layout_participation;
  if (typeof participation !== "boolean") {
    fail("node_participation", `${where}.semantic_layout_participation must be a boolean`);
  }

  const groupingSource = requireString(node, "grouping_source", "node_grouping_source", where);
  requireString(node, "grouping", "node_grouping", where);
  const ceiling = requireString(
    node,
    "relation_evidence_ceiling",
    "node_evidence_ceiling",
    where,
  );

  if (role === "concept") {
    if (groupingSource !== "model_atlas_field") {
      fail(
        "node_grouping_source",
        `${where}: a concept record must use grouping_source "model_atlas_field", received "${groupingSource}"`,
      );
    }
    if (participation !== true) {
      fail(
        "node_participation",
        `${where}: a concept record must participate in the semantic layout`,
      );
    }
    if (!EDGE_CLASSES.includes(ceiling as AdjacencyEdgeClass)) {
      fail(
        "node_evidence_ceiling",
        `${where}: concept relation_evidence_ceiling must be an approved edge class, received "${ceiling}"`,
      );
    }
  } else {
    if (groupingSource !== "visualization_role") {
      fail(
        "node_grouping_source",
        `${where}: a non-concept record must use grouping_source "visualization_role", received "${groupingSource}"`,
      );
    }
    if (participation !== false) {
      fail(
        "node_participation",
        `${where}: a non-concept record must not participate in the semantic layout`,
      );
    }
    if (ceiling !== "none") {
      fail(
        "node_evidence_ceiling",
        `${where}: a non-concept record must declare relation_evidence_ceiling "none", received "${ceiling}"`,
      );
    }
  }

  const url = requireString(node, "canonical_public_url", "node_url", where);
  if (!isApprovedSourceUrl(url, repositoryPath)) {
    fail(
      "node_url",
      `${where}.canonical_public_url is not an approved HTTPS source-repository URL`,
    );
  }

  return node as unknown as AdjacencyNode;
}

// ---------------------------------------------------------------------------
// Edge validation
// ---------------------------------------------------------------------------

function assertEdge(
  raw: unknown,
  index: number,
  conceptIds: ReadonlySet<string>,
  registeredIds: ReadonlySet<string>,
): AdjacencyEdge {
  const where = `edges[${index}]`;
  const edge = asObject(raw, "edge_shape", where);
  assertExactKeys(edge, EDGE_KEYS, "edge_unknown_field", where);

  const edgeClass = requireString(edge, "edge_class", "edge_class", where);
  if (RELATION_CLASSES_NOT_RENDERED.includes(edgeClass)) {
    fail(
      "edge_class_not_rendered",
      `${where}.edge_class "${edgeClass}" is recorded at product level only and must never be rendered as a semantic edge`,
    );
  }
  if (!EDGE_CLASSES.includes(edgeClass as AdjacencyEdgeClass)) {
    fail("edge_class", `${where}.edge_class "${edgeClass}" is not an approved edge class`);
  }

  const source = requireString(edge, "source", "edge_endpoint", where);
  const target = requireString(edge, "target", "edge_endpoint", where);
  if (source === target) {
    fail("edge_self_reference", `${where}: an edge must not be a self reference`);
  }
  for (const [label, endpoint] of [
    ["source", source],
    ["target", target],
  ] as const) {
    if (!registeredIds.has(endpoint)) {
      fail("edge_endpoint_unregistered", `${where}.${label} "${endpoint}" is not a registered record`);
    }
    if (!conceptIds.has(endpoint)) {
      fail(
        "edge_endpoint_non_concept",
        `${where}.${label} "${endpoint}" is not a concept record; non-concept records are never semantic-edge endpoints`,
      );
    }
  }

  requireExactBoolean(edge, "directed", true, "edge_directed", where);
  requireExactBoolean(
    edge,
    "default_visible",
    EDGE_CLASS_DEFAULT_VISIBLE[edgeClass as AdjacencyEdgeClass],
    "edge_default_visible",
    where,
  );
  requireExactString(edge, "relation_status", edgeClass, "edge_relation_status", where);
  requireExactString(
    edge,
    "authority_ceiling",
    SNAPSHOT_AUTHORITY_CEILING,
    "edge_authority_ceiling",
    where,
  );

  const id = requireString(edge, "id", "edge_id", where);
  const expectedId = `${edgeClass}::${source}->${target}`;
  if (id !== expectedId) {
    fail("edge_id", `${where}.id must be "${expectedId}", received "${id}"`);
  }

  return edge as unknown as AdjacencyEdge;
}

// ---------------------------------------------------------------------------
// Edge-class descriptor validation
// ---------------------------------------------------------------------------

function assertEdgeClassDescriptor(raw: unknown, index: number): AdjacencyEdgeClassDescriptor {
  const where = `edge_classes[${index}]`;
  const descriptor = asObject(raw, "edge_class_shape", where);
  assertExactKeys(
    descriptor,
    EDGE_CLASS_DESCRIPTOR_KEYS,
    "edge_class_unknown_field",
    where,
  );

  const edgeClass = requireString(descriptor, "edge_class", "edge_class", where);
  if (!EDGE_CLASSES.includes(edgeClass as AdjacencyEdgeClass)) {
    fail("edge_class", `${where}.edge_class "${edgeClass}" is not an approved edge class`);
  }
  requireString(descriptor, "display_label", "edge_class_label", where);
  requireExactBoolean(descriptor, "directed", true, "edge_class_directed", where);
  requireExactBoolean(
    descriptor,
    "default_visible",
    EDGE_CLASS_DEFAULT_VISIBLE[edgeClass as AdjacencyEdgeClass],
    "edge_class_default_visible",
    where,
  );
  requireString(descriptor, "evidence_source", "edge_class_evidence_source", where);

  return descriptor as unknown as AdjacencyEdgeClassDescriptor;
}

// ---------------------------------------------------------------------------
// Snapshot validation
// ---------------------------------------------------------------------------

/**
 * Strictly validate a parsed expanded-adjacency dataset. Returns the SAME object
 * typed; never rewrites, repairs, normalizes, deduplicates, sorts, or augments
 * the input, and never synthesizes a reverse edge, derived edge, or record.
 */
export function assertAdjacencySnapshot(input: unknown): AdjacencySnapshot {
  assertNoProhibitedSemantics(input);

  const snapshot = asObject(input, "snapshot_shape", "$");
  assertExactKeys(snapshot, SNAPSHOT_KEYS, "snapshot_unknown_field", "$");

  requireExactString(snapshot, "schema_version", SNAPSHOT_SCHEMA_VERSION, "schema_version", "$");
  requireString(snapshot, "title", "title", "$");
  requireExactString(snapshot, "scope", SNAPSHOT_SCOPE, "scope", "$");
  requireExactString(
    snapshot,
    "authority_ceiling",
    SNAPSHOT_AUTHORITY_CEILING,
    "authority_ceiling",
    "$",
  );
  requireExactString(snapshot, "source_commit", SNAPSHOT_SOURCE_COMMIT, "source_commit", "$");
  requireExactString(
    snapshot,
    "source_repository",
    SOURCE_REPOSITORY,
    "source_repository",
    "$",
  );
  requireStringArray(snapshot, "generated_from", "generated_from", "$");

  requireExactNumber(snapshot, "record_count", EXPECTED_RECORD_COUNT, "record_count", "$");
  requireExactNumber(
    snapshot,
    "semantic_layout_participant_count",
    EXPECTED_SEMANTIC_LAYOUT_PARTICIPANTS,
    "semantic_layout_participant_count",
    "$",
  );
  requireExactNumber(
    snapshot,
    "fixed_band_record_count",
    EXPECTED_FIXED_BAND_RECORDS,
    "fixed_band_record_count",
    "$",
  );

  const boundaryStatements = requireStringArray(
    snapshot,
    "boundary_statements",
    "boundary_statements",
    "$",
  );
  if (boundaryStatements.length === 0) {
    fail("boundary_statements", "$: at least one boundary statement is required");
  }

  // --- relation classes recorded as not rendered ---------------------------
  const notRendered = requireStringArray(
    snapshot,
    "relation_classes_not_rendered",
    "relation_classes_not_rendered",
    "$",
  );
  for (const declared of RELATION_CLASSES_NOT_RENDERED) {
    if (!notRendered.includes(declared)) {
      fail(
        "relation_classes_not_rendered",
        `$: relation_classes_not_rendered must declare "${declared}"`,
      );
    }
  }
  for (const declared of notRendered) {
    if (!RELATION_CLASSES_NOT_RENDERED.includes(declared)) {
      fail(
        "relation_classes_not_rendered",
        `$: unexpected not-rendered relation class "${declared}"`,
      );
    }
  }

  // --- transform notes ------------------------------------------------------
  const transformNotes = asObject(snapshot.transform_notes, "transform_notes", "$.transform_notes");
  assertExactKeys(
    transformNotes,
    REQUIRED_FALSE_TRANSFORM_NOTES,
    "transform_notes",
    "$.transform_notes",
  );
  for (const key of REQUIRED_FALSE_TRANSFORM_NOTES) {
    requireExactBoolean(transformNotes, key, false, "transform_notes", "$.transform_notes");
  }

  // --- edge-class descriptors ----------------------------------------------
  const rawEdgeClasses = asArray(snapshot.edge_classes, "edge_classes", "$.edge_classes");
  if (rawEdgeClasses.length !== EDGE_CLASSES.length) {
    fail(
      "edge_classes",
      `$.edge_classes must declare exactly ${EDGE_CLASSES.length} classes, received ${rawEdgeClasses.length}`,
    );
  }
  const edgeClasses = rawEdgeClasses.map(assertEdgeClassDescriptor);
  const declaredClasses = new Set(edgeClasses.map((entry) => entry.edge_class));
  for (const approved of EDGE_CLASSES) {
    if (!declaredClasses.has(approved)) {
      fail("edge_classes", `$.edge_classes must declare "${approved}"`);
    }
  }

  // --- nodes ----------------------------------------------------------------
  const rawNodes = asArray(snapshot.nodes, "nodes", "$.nodes");
  if (rawNodes.length !== EXPECTED_RECORD_COUNT) {
    fail("node_count", `$.nodes must contain exactly ${EXPECTED_RECORD_COUNT} records, received ${rawNodes.length}`);
  }

  const nodes = rawNodes.map(assertNode);

  const ids = new Set<string>();
  const paths = new Set<string>();
  const roleCounts: Record<string, number> = {};
  const groupingCounts: Record<string, number> = {};
  const ceilingCounts: Record<string, number> = {};
  let semanticParticipants = 0;

  for (const node of nodes) {
    if (ids.has(node.id)) fail("node_id_duplicate", `$.nodes: duplicate record id "${node.id}"`);
    ids.add(node.id);
    if (paths.has(node.repository_path)) {
      fail("node_path_duplicate", `$.nodes: duplicate repository path "${node.repository_path}"`);
    }
    paths.add(node.repository_path);

    roleCounts[node.visualization_role] = (roleCounts[node.visualization_role] ?? 0) + 1;
    groupingCounts[node.grouping] = (groupingCounts[node.grouping] ?? 0) + 1;
    ceilingCounts[node.relation_evidence_ceiling] =
      (ceilingCounts[node.relation_evidence_ceiling] ?? 0) + 1;
    if (node.semantic_layout_participation) semanticParticipants += 1;
  }

  for (const [role, expected] of Object.entries(EXPECTED_ROLE_COUNTS)) {
    if ((roleCounts[role] ?? 0) !== expected) {
      fail(
        "role_count",
        `$.nodes: expected ${expected} "${role}" records, counted ${roleCounts[role] ?? 0}`,
      );
    }
  }
  if (semanticParticipants !== EXPECTED_SEMANTIC_LAYOUT_PARTICIPANTS) {
    fail(
      "semantic_participant_count",
      `$.nodes: expected ${EXPECTED_SEMANTIC_LAYOUT_PARTICIPANTS} semantic-layout participants, counted ${semanticParticipants}`,
    );
  }
  if (nodes.length - semanticParticipants !== EXPECTED_FIXED_BAND_RECORDS) {
    fail(
      "fixed_band_count",
      `$.nodes: expected ${EXPECTED_FIXED_BAND_RECORDS} fixed-band records, counted ${nodes.length - semanticParticipants}`,
    );
  }

  // --- declared distributions must equal the counted instances --------------
  assertDistributionMatches(
    requireCountMap(snapshot, "role_distribution", "role_distribution", "$"),
    roleCounts,
    "role_distribution",
  );
  assertDistributionMatches(
    requireCountMap(snapshot, "grouping_distribution", "grouping_distribution", "$"),
    // Grouping distribution covers the MODEL_ATLAS-field grouping of concept
    // records only; fixed-band records group by visualization role.
    countBy(nodes.filter((node) => node.visualization_role === "concept"), (node) => node.grouping),
    "grouping_distribution",
  );
  assertDistributionMatches(
    requireCountMap(
      snapshot,
      "relation_evidence_ceiling_distribution",
      "relation_evidence_ceiling_distribution",
      "$",
    ),
    ceilingCounts,
    "relation_evidence_ceiling_distribution",
  );

  // --- edges ----------------------------------------------------------------
  const conceptIds = new Set(
    nodes.filter((node) => node.visualization_role === "concept").map((node) => node.id),
  );

  const rawEdges = asArray(snapshot.edges, "edges", "$.edges");
  if (rawEdges.length !== EXPECTED_TOTAL_EDGES) {
    fail("edge_count", `$.edges must contain exactly ${EXPECTED_TOTAL_EDGES} edges, received ${rawEdges.length}`);
  }

  const edges = rawEdges.map((raw, index) => assertEdge(raw, index, conceptIds, ids));

  const edgeIds = new Set<string>();
  const classCounts: Record<string, number> = {
    source_named_adjacency: 0,
    navigation_adjacency: 0,
  };
  // Class separation: a directed pair may legitimately exist in BOTH classes;
  // the two classes are never merged, deduplicated across, or collapsed. Only a
  // duplicate WITHIN one class is a violation.
  const seenWithinClass = new Set<string>();

  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      fail("edge_id_duplicate", `$.edges: duplicate edge id "${edge.id}"`);
    }
    edgeIds.add(edge.id);

    const withinClass = `${edge.edge_class}|${edge.source}|${edge.target}`;
    if (seenWithinClass.has(withinClass)) {
      fail(
        "edge_duplicate_within_class",
        `$.edges: duplicate directed pair inside class "${edge.edge_class}"`,
      );
    }
    seenWithinClass.add(withinClass);

    classCounts[edge.edge_class] += 1;
  }

  for (const [edgeClass, expected] of Object.entries(EXPECTED_EDGE_COUNTS)) {
    if (classCounts[edgeClass] !== expected) {
      fail(
        "edge_class_count",
        `$.edges: expected ${expected} "${edgeClass}" edges, counted ${classCounts[edgeClass]}`,
      );
    }
  }

  assertDistributionMatches(
    requireCountMap(snapshot, "edge_counts", "edge_counts", "$"),
    classCounts,
    "edge_counts",
  );

  // Raw and excluded counts are product-level provenance figures: raw minus
  // excluded non-concept endpoints must equal the retained per-class counts.
  const rawCounts = requireCountMap(snapshot, "raw_edge_counts", "raw_edge_counts", "$");
  const excludedCounts = requireCountMap(
    snapshot,
    "excluded_non_concept_endpoint_counts",
    "excluded_non_concept_endpoint_counts",
    "$",
  );
  for (const edgeClass of EDGE_CLASSES) {
    const raw = rawCounts[edgeClass];
    const excluded = excludedCounts[edgeClass];
    if (typeof raw !== "number" || typeof excluded !== "number") {
      fail("edge_provenance_counts", `$: raw/excluded counts must declare "${edgeClass}"`);
    }
    if (raw - excluded !== classCounts[edgeClass]) {
      fail(
        "edge_provenance_counts",
        `$: ${edgeClass} raw ${raw} minus excluded ${excluded} must equal retained ${classCounts[edgeClass]}`,
      );
    }
  }

  const declarationCounts = requireCountMap(
    snapshot,
    "source_named_declaration_counts",
    "source_named_declaration_counts",
    "$",
  );
  assertExactKeys(
    declarationCounts as unknown as Record<string, unknown>,
    SOURCE_NAMED_DECLARATION_KEYS,
    "source_named_declaration_counts",
    "$.source_named_declaration_counts",
  );
  if (declarationCounts.unique_directed_edges !== EXPECTED_EDGE_COUNTS.source_named_adjacency) {
    fail(
      "source_named_declaration_counts",
      `$: unique_directed_edges must equal ${EXPECTED_EDGE_COUNTS.source_named_adjacency}`,
    );
  }

  return snapshot as unknown as AdjacencySnapshot;
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function assertDistributionMatches(
  declared: Record<string, number>,
  counted: Record<string, number>,
  label: string,
): void {
  const declaredKeys = Object.keys(declared).sort();
  const countedKeys = Object.keys(counted).sort();
  if (declaredKeys.length !== countedKeys.length) {
    fail(label, `$.${label}: declares ${declaredKeys.length} keys, instances produce ${countedKeys.length}`);
  }
  for (const key of countedKeys) {
    if (declared[key] !== counted[key]) {
      fail(
        label,
        `$.${label}.${key}: declared ${String(declared[key])}, instances produce ${counted[key]}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Derived, boundary-neutral selectors (no ranking, no centrality, no degree)
// ---------------------------------------------------------------------------

/** Concept records — the only records that enter the semantic layout. */
export function semanticLayoutRecords(snapshot: AdjacencySnapshot): readonly AdjacencyNode[] {
  return snapshot.nodes.filter((node) => node.semantic_layout_participation);
}

/** Fixed-band records — rendered in visibly separate bands, never in the layout. */
export function fixedBandRecords(snapshot: AdjacencySnapshot): readonly AdjacencyNode[] {
  return snapshot.nodes.filter((node) => !node.semantic_layout_participation);
}

/** Edges of exactly one class. Classes are never merged or deduplicated across. */
export function edgesOfClass(
  snapshot: AdjacencySnapshot,
  edgeClass: AdjacencyEdgeClass,
): readonly AdjacencyEdge[] {
  return snapshot.edges.filter((edge) => edge.edge_class === edgeClass);
}
