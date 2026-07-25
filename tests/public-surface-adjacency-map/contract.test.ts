// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — dataset contract tests.
//
// These exercise the ACTUAL production contract against the ACTUAL adopted
// 59-record dataset, plus deliberate single-field mutations of it. Every
// mutation asserts a SPECIFIC stable contract code, so a widened or weakened
// rule fails here rather than silently shipping.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  assertAdjacencySnapshot,
  assertNoProhibitedSemantics,
  AdjacencySnapshotError,
  EDGE_CLASSES,
  EDGE_CLASS_DEFAULT_VISIBLE,
  EXPECTED_EDGE_COUNTS,
  EXPECTED_FIXED_BAND_RECORDS,
  EXPECTED_RECORD_COUNT,
  EXPECTED_ROLE_COUNTS,
  EXPECTED_SEMANTIC_LAYOUT_PARTICIPANTS,
  EXPECTED_TOTAL_EDGES,
  RELATION_CLASSES_NOT_RENDERED,
  SNAPSHOT_AUTHORITY_CEILING,
  SNAPSHOT_SOURCE_COMMIT,
  SOURCE_LINK_PREFIX,
  edgesOfClass,
  fixedBandRecords,
  isApprovedSourceUrl,
  semanticLayoutRecords,
} from "../../src/lib/public-surface-adjacency-map/contract.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const TRACKED_PATH = "src/data/public-surface-adjacency-map/last-known-good.json";
const rawTracked = rd(TRACKED_PATH);
const snapshot = assertAdjacencySnapshot(JSON.parse(rawTracked));

/** A fresh deep clone of the tracked dataset for each mutation. */
const clone = () => JSON.parse(rawTracked);

/** Assert the contract rejects `value` with the exact stable code. */
const rejects = (value, code) => {
  assert.throws(
    () => assertAdjacencySnapshot(value),
    (error) => {
      assert.ok(error instanceof AdjacencySnapshotError, `expected AdjacencySnapshotError, got ${error}`);
      assert.equal(error.code, code, `expected code "${code}", got "${error.code}"`);
      return true;
    },
  );
};

// ---------------------------------------------------------------------------
// Acceptance and exact counts
// ---------------------------------------------------------------------------

test("the tracked snapshot is accepted and returned unchanged", () => {
  const parsed = JSON.parse(rawTracked);
  const validated = assertAdjacencySnapshot(parsed);
  assert.equal(validated, parsed, "the contract must return the same object, never a rebuilt copy");
});

test("exact record and edge counts", () => {
  assert.equal(snapshot.nodes.length, EXPECTED_RECORD_COUNT);
  assert.equal(snapshot.nodes.length, 59);
  assert.equal(snapshot.edges.length, EXPECTED_TOTAL_EDGES);
  assert.equal(snapshot.edges.length, 383);
  assert.equal(snapshot.record_count, 59);
});

test("exact role distribution", () => {
  const counts = {};
  for (const node of snapshot.nodes) {
    counts[node.visualization_role] = (counts[node.visualization_role] ?? 0) + 1;
  }
  assert.deepEqual(counts, { concept: 49, orientation: 2, boundary: 7, anchor: 1 });
  assert.deepEqual({ ...EXPECTED_ROLE_COUNTS }, { concept: 49, orientation: 2, boundary: 7, anchor: 1 });
});

test("exact semantic-layout and fixed-band participation", () => {
  assert.equal(semanticLayoutRecords(snapshot).length, EXPECTED_SEMANTIC_LAYOUT_PARTICIPANTS);
  assert.equal(semanticLayoutRecords(snapshot).length, 49);
  assert.equal(fixedBandRecords(snapshot).length, EXPECTED_FIXED_BAND_RECORDS);
  assert.equal(fixedBandRecords(snapshot).length, 10);
  for (const node of semanticLayoutRecords(snapshot)) {
    assert.equal(node.visualization_role, "concept");
  }
  for (const node of fixedBandRecords(snapshot)) {
    assert.notEqual(node.visualization_role, "concept");
    assert.equal(node.relation_evidence_ceiling, "none");
    assert.equal(node.grouping_source, "visualization_role");
  }
});

test("exact edge-class counts and class separation", () => {
  assert.equal(edgesOfClass(snapshot, "source_named_adjacency").length, 189);
  assert.equal(edgesOfClass(snapshot, "navigation_adjacency").length, 194);
  assert.equal(EXPECTED_EDGE_COUNTS.source_named_adjacency, 189);
  assert.equal(EXPECTED_EDGE_COUNTS.navigation_adjacency, 194);
  assert.equal(189 + 194, EXPECTED_TOTAL_EDGES);

  // Class separation: the classes are never merged or deduplicated across. A
  // directed pair present in both classes stays present in both.
  const named = new Set(
    edgesOfClass(snapshot, "source_named_adjacency").map((e) => `${e.source}|${e.target}`),
  );
  const overlap = edgesOfClass(snapshot, "navigation_adjacency").filter((e) =>
    named.has(`${e.source}|${e.target}`),
  );
  assert.ok(overlap.length > 0, "fixture sanity: some pairs exist in both classes");
  assert.equal(
    edgesOfClass(snapshot, "source_named_adjacency").length +
      edgesOfClass(snapshot, "navigation_adjacency").length,
    snapshot.edges.length,
  );
});

test("grouping counts come from concept records only", () => {
  const counted = {};
  for (const node of snapshot.nodes) {
    if (node.visualization_role !== "concept") continue;
    counted[node.grouping] = (counted[node.grouping] ?? 0) + 1;
  }
  assert.deepEqual(counted, { ...snapshot.grouping_distribution });
  assert.equal(
    Object.values(counted).reduce((a, b) => a + b, 0),
    49,
  );
});

test("default visibility is fixed per class: source-named visible, navigation hidden", () => {
  assert.equal(EDGE_CLASS_DEFAULT_VISIBLE.source_named_adjacency, true);
  assert.equal(EDGE_CLASS_DEFAULT_VISIBLE.navigation_adjacency, false);
  for (const edge of snapshot.edges) {
    assert.equal(edge.default_visible, EDGE_CLASS_DEFAULT_VISIBLE[edge.edge_class]);
    assert.equal(edge.relation_status, edge.edge_class);
    assert.equal(edge.authority_ceiling, SNAPSHOT_AUTHORITY_CEILING);
    assert.equal(edge.directed, true);
  }
});

test("no reverse edge is ever synthesized", () => {
  const stored = new Set(snapshot.edges.map((e) => `${e.edge_class}|${e.source}|${e.target}`));
  const validated = assertAdjacencySnapshot(JSON.parse(rawTracked));
  const revalidated = new Set(
    validated.edges.map((e) => `${e.edge_class}|${e.source}|${e.target}`),
  );
  assert.equal(revalidated.size, stored.size);
  assert.equal(validated.edges.length, EXPECTED_TOTAL_EDGES);

  // At least one directed pair has no stored reverse; validation must not
  // invent one.
  const oneWay = snapshot.edges.filter(
    (e) => !stored.has(`${e.edge_class}|${e.target}|${e.source}`),
  );
  assert.ok(oneWay.length > 0, "fixture sanity: some edges are one-directional");
  for (const edge of oneWay) {
    assert.ok(!revalidated.has(`${edge.edge_class}|${edge.target}|${edge.source}`));
  }
  assert.equal(snapshot.transform_notes.reverse_edges_inferred, false);
});

test("boundary statements and not-rendered relation classes are carried intact", () => {
  assert.ok(snapshot.boundary_statements.length >= 8);
  for (const statement of snapshot.boundary_statements) {
    assert.equal(typeof statement, "string");
    assert.ok(statement.length > 0);
  }
  assert.deepEqual([...snapshot.relation_classes_not_rendered].sort(), [
    ...RELATION_CLASSES_NOT_RENDERED,
  ].sort());
  for (const value of Object.values(snapshot.transform_notes)) {
    assert.equal(value, false);
  }
});

test("canonical public URLs are HTTPS and point only at the approved source path", () => {
  for (const node of snapshot.nodes) {
    assert.ok(node.canonical_public_url.startsWith("https://"));
    assert.ok(node.canonical_public_url.startsWith(SOURCE_LINK_PREFIX));
    assert.ok(isApprovedSourceUrl(node.canonical_public_url, node.repository_path));
  }
  assert.equal(isApprovedSourceUrl("javascript:alert(1)", "a.md"), false);
  assert.equal(isApprovedSourceUrl("http://github.com/x", "a.md"), false);
  assert.equal(isApprovedSourceUrl("https://example.com/a.md", "a.md"), false);
  assert.equal(isApprovedSourceUrl(`${SOURCE_LINK_PREFIX}a.md?x=1`, "a.md"), false);
  assert.equal(isApprovedSourceUrl(`${SOURCE_LINK_PREFIX}other.md`, "a.md"), false);
});

// ---------------------------------------------------------------------------
// Node mutations
// ---------------------------------------------------------------------------

test("duplicate node is rejected", () => {
  const data = clone();
  const first = data.nodes[0];
  const twinIndex = data.nodes.findIndex(
    (node, index) =>
      index > 0 &&
      node.visualization_role === first.visualization_role &&
      node.grouping === first.grouping &&
      node.relation_evidence_ceiling === first.relation_evidence_ceiling,
  );
  assert.ok(twinIndex > 0, "fixture sanity: a same-role, same-grouping twin exists");
  data.nodes[twinIndex].id = first.id;
  data.nodes[twinIndex].repository_path = first.repository_path;
  data.nodes[twinIndex].canonical_public_url = first.canonical_public_url;
  rejects(data, "node_id_duplicate");
});

test("node id that differs from its repository path is rejected", () => {
  const data = clone();
  data.nodes[0].id = `${data.nodes[0].id}-x`;
  rejects(data, "node_id_path_mismatch");
});

test("empty display label is rejected", () => {
  const data = clone();
  data.nodes[0].display_label = "";
  rejects(data, "node_display_label");
});

test("display label source other than registry_name is rejected", () => {
  const data = clone();
  data.nodes[0].display_label_source = "filename";
  rejects(data, "node_display_label_source");
});

test("non-concept record with semantic layout participation is rejected", () => {
  const data = clone();
  const index = data.nodes.findIndex((node) => node.visualization_role !== "concept");
  data.nodes[index].semantic_layout_participation = true;
  rejects(data, "node_participation");
});

test("concept record with the non-concept grouping source is rejected", () => {
  const data = clone();
  const index = data.nodes.findIndex((node) => node.visualization_role === "concept");
  data.nodes[index].grouping_source = "visualization_role";
  rejects(data, "node_grouping_source");
});

test("non-concept record with a relation evidence ceiling other than none is rejected", () => {
  const data = clone();
  const index = data.nodes.findIndex((node) => node.visualization_role !== "concept");
  data.nodes[index].relation_evidence_ceiling = "source_named_adjacency";
  rejects(data, "node_evidence_ceiling");
});

test("non-HTTPS or off-repository canonical URL is rejected", () => {
  const data = clone();
  data.nodes[0].canonical_public_url = "http://example.com/evil.md";
  rejects(data, "node_url");

  const other = clone();
  other.nodes[0].canonical_public_url = "javascript:alert(1)";
  rejects(other, "node_url");
});

test("unknown node property is rejected, never silently ignored", () => {
  const data = clone();
  data.nodes[0].extra_note = "hello";
  rejects(data, "node_unknown_field");
});

test("wrong record count is rejected", () => {
  const data = clone();
  data.nodes.pop();
  rejects(data, "node_count");
});

// ---------------------------------------------------------------------------
// Edge mutations
// ---------------------------------------------------------------------------

test("duplicate edge id is rejected", () => {
  const data = clone();
  const first = data.edges[0];
  const twinIndex = data.edges.findIndex(
    (edge, index) => index > 0 && edge.edge_class === first.edge_class,
  );
  assert.ok(twinIndex > 0);
  data.edges[twinIndex] = { ...first };
  rejects(data, "edge_id_duplicate");
});

test("non-concept semantic-edge endpoint is rejected", () => {
  const data = clone();
  const nonConcept = data.nodes.find((node) => node.visualization_role !== "concept");
  const edge = data.edges[0];
  edge.source = nonConcept.id;
  edge.id = `${edge.edge_class}::${edge.source}->${edge.target}`;
  rejects(data, "edge_endpoint_non_concept");
});

test("unregistered edge endpoint is rejected", () => {
  const data = clone();
  const edge = data.edges[0];
  edge.target = "not-a-registered-record.md";
  edge.id = `${edge.edge_class}::${edge.source}->${edge.target}`;
  rejects(data, "edge_endpoint_unregistered");
});

for (const forbidden of RELATION_CLASSES_NOT_RENDERED) {
  test(`edge class "${forbidden}" is rejected outright`, () => {
    const data = clone();
    const edge = data.edges[0];
    edge.edge_class = forbidden;
    edge.relation_status = forbidden;
    edge.id = `${forbidden}::${edge.source}->${edge.target}`;
    rejects(data, "edge_class_not_rendered");
  });
}

test("an unknown edge class is rejected", () => {
  const data = clone();
  const edge = data.edges[0];
  edge.edge_class = "invented_adjacency";
  edge.relation_status = "invented_adjacency";
  edge.id = `invented_adjacency::${edge.source}->${edge.target}`;
  rejects(data, "edge_class");
});

test("wrong default visibility is rejected for either class", () => {
  const hidden = clone();
  const navIndex = hidden.edges.findIndex((e) => e.edge_class === "navigation_adjacency");
  hidden.edges[navIndex].default_visible = true;
  rejects(hidden, "edge_default_visible");

  const shown = clone();
  const namedIndex = shown.edges.findIndex((e) => e.edge_class === "source_named_adjacency");
  shown.edges[namedIndex].default_visible = false;
  rejects(shown, "edge_default_visible");
});

test("relation status that disagrees with the edge class is rejected", () => {
  const data = clone();
  const index = data.edges.findIndex((e) => e.edge_class === "navigation_adjacency");
  data.edges[index].relation_status = "source_named_adjacency";
  rejects(data, "edge_relation_status");
});

test("edge authority ceiling other than navigation_only is rejected", () => {
  const data = clone();
  data.edges[0].authority_ceiling = "confirmed";
  rejects(data, "edge_authority_ceiling");
});

test("undirected edge is rejected", () => {
  const data = clone();
  data.edges[0].directed = false;
  rejects(data, "edge_directed");
});

test("unknown edge property is rejected", () => {
  const data = clone();
  data.edges[0].note = "x";
  rejects(data, "edge_unknown_field");
});

test("wrong edge count is rejected", () => {
  const data = clone();
  data.edges.pop();
  rejects(data, "edge_count");
});

// ---------------------------------------------------------------------------
// Product identity mutations
// ---------------------------------------------------------------------------

test("wrong source commit is rejected", () => {
  const data = clone();
  data.source_commit = "0000000000000000000000000000000000000000";
  rejects(data, "source_commit");
  assert.equal(snapshot.source_commit, SNAPSHOT_SOURCE_COMMIT);
});

test("wrong product authority ceiling is rejected", () => {
  const data = clone();
  data.authority_ceiling = "confirmed_relation";
  rejects(data, "authority_ceiling");
});

test("wrong scope is rejected", () => {
  const data = clone();
  data.scope = "full_corpus";
  rejects(data, "scope");
});

test("unsupported schema version is rejected", () => {
  const data = clone();
  data.schema_version = "2.0";
  rejects(data, "schema_version");
});

test("unknown top-level property is rejected", () => {
  const data = clone();
  data.registry_status = "public";
  rejects(data, "snapshot_unknown_field");
});

test("a transform note flipped to true is rejected", () => {
  const data = clone();
  data.transform_notes.reverse_edges_inferred = true;
  rejects(data, "transform_notes");
});

test("dropping a not-rendered relation class declaration is rejected", () => {
  const data = clone();
  data.relation_classes_not_rendered = data.relation_classes_not_rendered.filter(
    (name) => name !== "user_confirmed_relation",
  );
  rejects(data, "relation_classes_not_rendered");
});

// ---------------------------------------------------------------------------
// Prohibited semantics
// ---------------------------------------------------------------------------

const PROHIBITED_FIELD_CASES = [
  ["confirmed_relation", (data) => (data.edges[0].confirmed_relation = true)],
  ["relation_promotion", (data) => (data.edges[0].relation_promotion = "confirmed")],
  ["rank", (data) => (data.nodes[0].rank = 1)],
  ["centrality", (data) => (data.nodes[0].centrality = 0.5)],
  ["authority_score", (data) => (data.nodes[0].authority_score = 9)],
  ["importance", (data) => (data.nodes[0].importance = "high")],
  ["priority", (data) => (data.priority = 1)],
  ["canonicality", (data) => (data.canonicality = "canonical")],
  ["confidence", (data) => (data.edges[0].confidence = 0.9)],
  ["relation_strength", (data) => (data.edges[0].relation_strength = 3)],
  ["generated_at", (data) => (data.generated_at = "2026-01-01T00:00:00Z")],
  ["currentness", (data) => (data.currentness = "current")],
  ["nested confirmed key", (data) => (data.transform_notes.confirmed_by_user = false)],
];

for (const [label, mutate] of PROHIBITED_FIELD_CASES) {
  test(`prohibited field is rejected: ${label}`, () => {
    const data = clone();
    mutate(data);
    rejects(data, "prohibited_field");
  });
}

test("the recursive prohibited-semantics scan reaches deeply nested keys", () => {
  assert.throws(
    () => assertNoProhibitedSemantics({ a: [{ b: { centrality_score: 1 } }] }),
    (error) => error instanceof AdjacencySnapshotError && error.code === "prohibited_field",
  );
  // The explicitly enumerated keys are never treated as prohibited.
  assertNoProhibitedSemantics({
    authority_ceiling: "navigation_only",
    canonical_public_url: "https://example.invalid/",
    node_size_implies_importance: false,
    generated_from: ["x"],
  });
});

test("the tracked dataset carries no prohibited semantics", () => {
  assertNoProhibitedSemantics(JSON.parse(rawTracked));
});

// ---------------------------------------------------------------------------
// Shape guards
// ---------------------------------------------------------------------------

test("non-object input fails closed", () => {
  rejects(null, "snapshot_shape");
  rejects([], "snapshot_shape");
  rejects("{}", "snapshot_shape");
  rejects(42, "snapshot_shape");
});

test("approved edge classes are exactly the two adjacency classes", () => {
  assert.deepEqual([...EDGE_CLASSES], ["source_named_adjacency", "navigation_adjacency"]);
  for (const forbidden of RELATION_CLASSES_NOT_RENDERED) {
    assert.ok(!EDGE_CLASSES.includes(forbidden));
  }
});
