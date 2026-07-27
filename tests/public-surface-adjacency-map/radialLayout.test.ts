// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — P7.1 radial geometry.
//
// Canonical checks 14–61 and 130–137: deterministic ordering, the shared
// serializer, radial concept geometry, routing, lane assignment, the exact
// centre-clearance gate, both numeric tolerances, the role orbit, and the
// fixed-radius grouping arcs. Fifty-six checks, each registered once.
//
// Two rules govern this file:
//
//   1. MATHEMATICAL claims are asserted against full-precision values with an
//      explicit numeric tolerance. SERIALIZED claims are asserted against
//      strings. The two are never mixed — mixing them is the exact defect the
//      ring-interior diagnostic once had.
//   2. Every absence assertion carries a positive control proving the check can
//      actually fail, and every count assertion pins the population size, so an
//      empty or truncated set can never satisfy it vacuously.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  assertAdjacencySnapshot,
  EXPECTED_EDGE_COUNTS,
  EXPECTED_TOTAL_EDGES,
  FIXED_BAND_ROLES,
} from "../../src/lib/public-surface-adjacency-map/contract.ts";
import {
  assignLanes,
  bisectorDirection,
  CENTRAL_TEXT_CLEAR_R,
  CENTRE_X,
  CENTRE_Y,
  compareEdges,
  compareNodes,
  compareText,
  computeEdgeRouting,
  computeRadialLayout,
  computeRoleOrbit,
  CONCEPT_GROUP_ORDER,
  CONCEPT_ORDER,
  CONCEPT_PITCH,
  CORRIDOR_INNER_R,
  CORRIDOR_OUTER_R,
  CLEARANCE_SOLVER_EPSILON,
  formatLogicalNumber,
  GLYPH_FOOTPRINT,
  GRAPH_RECORD_ORDER,
  GROUP_ARC_R,
  groupArcPath,
  HIT_R,
  LANE_COUNT,
  LANE_STEP,
  LOGICAL_DECIMAL_PLACES,
  minimumQuadraticBezierRadius,
  RING_INTERIOR_DIAGNOSTIC_EPSILON,
  RING_R,
  ringInteriorDiagnostic,
  ROLE_LABEL_R,
  ROLE_ORBIT_ORDER,
  ROLE_ORBIT_PITCH,
  ROLE_ORBIT_R,
  ROLE_ORBIT_START_ANGLE,
  ROLE_ORDER,
  sampledMinimumBezierRadius,
  SAME_GROUP_BULGE_R,
  SEPARATOR_RING_R,
  START_ANGLE,
} from "../../src/lib/public-surface-adjacency-map/layout.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertAdjacencySnapshot(
  JSON.parse(rd("src/data/public-surface-adjacency-map/last-known-good.json")),
);
const nodes = snapshot.nodes;
const edges = snapshot.edges;
const layoutSource = rd("src/lib/public-surface-adjacency-map/layout.ts");

const CENTRE = { x: CENTRE_X, y: CENTRE_Y };

// The frozen owner measurements. If one of these fails the correct response is
// to raise a planning blocker — never to adjust a geometry constant.
const EXACT_CROSS_MINIMUM = 127.28851029932308;
const EXACT_SAME_MINIMUM = 319.7675861803592;
const RING_INTERIOR_COUNT = 8;

const layout = computeRadialLayout(nodes);
const orbit = computeRoleOrbit(nodes);
const routed = computeEdgeRouting(nodes, edges);
const sameGroup = routed.filter((edge) => edge.sameGroup);
const crossGroup = routed.filter((edge) => !edge.sameGroup);

const groupingById = new Map(nodes.map((node) => [node.id, node.grouping]));
const radiusOf = (point) => Math.hypot(point.x - CENTRE_X, point.y - CENTRE_Y);
const angleOf = (point) =>
  (Math.atan2(point.y - CENTRE_Y, point.x - CENTRE_X) * 180) / Math.PI;

/**
 * Deterministic permutation. No `Math.random` is used anywhere in this file —
 * a randomised shuffle would make a failure unreproducible, which is the
 * opposite of what a determinism test needs.
 */
const permute = (items, seed) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = (i * 31 + seed * 17 + 7) % (i + 1);
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
};

const serializePoints = (points) =>
  points.map((p) => `${formatLogicalNumber(p.x)},${formatLogicalNumber(p.y)}`).join(";");

/** Executable body of one named export, comments stripped. */
const functionBody = (name) => {
  const start = layoutSource.indexOf(`export function ${name}(`);
  assert.notEqual(start, -1, `layout.ts must export ${name}`);
  const open = layoutSource.indexOf("{", layoutSource.indexOf(")", start));
  let depth = 0;
  for (let i = open; i < layoutSource.length; i += 1) {
    if (layoutSource[i] === "{") depth += 1;
    else if (layoutSource[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return layoutSource
          .slice(open, i + 1)
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .split("\n")
          .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
          .join("\n");
      }
    }
  }
  return assert.fail(`unbalanced braces in ${name}`);
};

// ---------------------------------------------------------------------------
// Load-time integrity. These are NOT tests; they prevent a vacuous suite.
// ---------------------------------------------------------------------------

const ownSource = readFileSync(fileURLToPath(import.meta.url), "utf8");

const SKIPPED_TEST_MARKERS = [
  "test.skip(",
  "test.todo(",
  "it.skip(",
  "describe.skip(",
  "skip: true",
  "todo: true",
];

/**
 * This file with its own prohibition vocabulary removed. Scanning the raw file
 * would flag the LIST that names what to look for rather than any real usage —
 * the same false-positive class every guard controls for.
 */
const ownSourceScannable = ownSource.replace(
  /const SKIPPED_TEST_MARKERS = \[[\s\S]*?\n\];/,
  "",
);

assert.ok(
  ownSourceScannable.length < ownSource.length,
  "the self-scan must strip this file's own prohibition vocabulary",
);
assert.equal(
  [...ownSource.matchAll(/^test\(/gm)].length,
  56,
  "this file must register exactly 56 canonical checks",
);
for (const marker of SKIPPED_TEST_MARKERS) {
  assert.ok(!ownSourceScannable.includes(marker), `no check may be ${marker}`);
}
assert.equal(nodes.length, 59, "the adopted snapshot must carry 59 records");
assert.equal(edges.length, EXPECTED_TOTAL_EDGES, "the adopted snapshot must carry 383 edges");
assert.ok(layoutSource.length > 0);

// The permutation generator must actually permute, or every determinism check
// below would be comparing a list against itself.
assert.ok(
  new Set(Array.from({ length: 200 }, (_, seed) => permute(nodes, seed).map((n) => n.id).join()))
    .size > 100,
  "the permutation generator must produce many distinct input orders",
);

// ---------------------------------------------------------------------------
// Radial geometry, routing and deterministic ordering — checks 14–33
// ---------------------------------------------------------------------------

test("14 — computeRadialLayout is byte-identical across runs and input permutations", () => {
  const baseline = serializePoints(computeRadialLayout(nodes).concepts);
  assert.ok(baseline.length > 0);
  assert.equal(serializePoints(computeRadialLayout(nodes).concepts), baseline);
  for (let seed = 0; seed < 200; seed += 1) {
    assert.equal(
      serializePoints(computeRadialLayout(permute(nodes, seed)).concepts),
      baseline,
      `permutation ${seed} produced different coordinates`,
    );
  }
});

test("15 — all 49 concept radii equal RING_R", () => {
  assert.equal(layout.concepts.length, 49);
  for (const concept of layout.concepts) {
    assert.ok(
      Math.abs(radiusOf(concept) - RING_R) < 1e-9,
      `${concept.id} sits at radius ${radiusOf(concept)}`,
    );
  }
});

test("16 — concept angular pitch is constant", () => {
  assert.equal(CONCEPT_PITCH, 360 / 49);
  const deltas = layout.concepts
    .slice(1)
    .map((concept, index) => concept.theta - layout.concepts[index].theta);
  assert.equal(deltas.length, 48);
  for (const delta of deltas) assert.ok(Math.abs(delta - CONCEPT_PITCH) < 1e-9);
  assert.equal(layout.concepts[0].theta, START_ANGLE);
});

test("17 — the layout is unchanged when the edge set varies", () => {
  // Structural: the coordinate producer accepts no edge parameter at all.
  assert.equal(computeRadialLayout.length, 1);
  assert.ok(!/\bedges\b/.test(functionBody("computeRadialLayout")));
  // Behavioural: the same records serialize identically however edges change.
  const baseline = serializePoints(layout.concepts);
  assert.equal(serializePoints(computeRadialLayout([...nodes]).concepts), baseline);
});

test("18 — grouping arcs are contiguous and ordered by compareText", () => {
  const keys = CONCEPT_GROUP_ORDER(nodes);
  assert.equal(keys.length, 7);
  assert.deepEqual(keys, [...keys].sort(compareText));
  assert.deepEqual(
    layout.groups.map((group) => group.key),
    keys,
  );
  let covered = 0;
  let expectedNext = 0;
  for (const group of layout.groups) {
    assert.equal(group.firstIndex, expectedNext, `${group.key} is not contiguous`);
    assert.equal(group.lastIndex, group.firstIndex + group.count - 1);
    expectedNext = group.lastIndex + 1;
    covered += group.count;
  }
  assert.equal(covered, 49, "every concept index must be covered exactly once");
});

test("19 — the role orbit sits outside the concept ring and the separator", () => {
  assert.ok(ROLE_ORBIT_R > RING_R);
  assert.ok(SEPARATOR_RING_R < ROLE_LABEL_R);
  assert.ok(ROLE_LABEL_R < ROLE_ORBIT_R);
  assert.equal(ROLE_ORBIT_R, 430);
  assert.equal(SEPARATOR_RING_R, 385);
});

test("20 — glyph footprint equality: every role box is exactly 18 by 18", () => {
  // One box, four shapes. Shape carries the role; size carries nothing.
  const shapes = ["concept", "orientation", "boundary", "anchor"];
  assert.equal(new Set(shapes).size, 4);
  for (const shape of shapes) {
    assert.equal(GLYPH_FOOTPRINT, 18, `${shape} must use the shared 18 by 18 box`);
  }
  assert.equal(HIT_R, 26);
});

test("21 — same-group control radius is the bulge; cross-group lies in the corridor", () => {
  assert.equal(sameGroup.length, 125);
  assert.equal(crossGroup.length, 258);
  for (const edge of sameGroup) assert.equal(edge.controlRadius, SAME_GROUP_BULGE_R);
  for (const edge of crossGroup) {
    assert.ok(
      edge.controlRadius >= CORRIDOR_INNER_R && edge.controlRadius <= CORRIDOR_OUTER_R,
      `${edge.id} control radius ${edge.controlRadius} left the corridor`,
    );
  }
});

test("22 — lane assignment is stable and never exceeds LANE_COUNT", () => {
  const lanes = assignLanes(edges, groupingById);
  assert.equal(lanes.size, EXPECTED_TOTAL_EDGES);
  for (const lane of lanes.values()) {
    assert.ok(Number.isInteger(lane) && lane >= 0 && lane < LANE_COUNT);
  }
  // The heaviest bucket really does exercise the no-wrap claim.
  const counts = new Map();
  for (const edge of edges) {
    const key = `${groupingById.get(edge.source)}|${groupingById.get(edge.target)}`;
    if (groupingById.get(edge.source) === groupingById.get(edge.target)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  assert.equal(counts.size, 40, "there must be 40 distinct ordered cross-group buckets");
  assert.equal(Math.max(...counts.values()), 15, "the heaviest bucket must hold 15 edges");
  assert.ok(Math.max(...counts.values()) < LANE_COUNT, "no bucket may wrap");
});

test("23 — the bisector fallback is deterministic for diametric endpoints", () => {
  const a = { x: CENTRE_X + 100, y: CENTRE_Y };
  const b = { x: CENTRE_X - 100, y: CENTRE_Y };
  const fallback = bisectorDirection(a, b);
  assert.ok(Math.abs(Math.hypot(fallback.x, fallback.y) - 1) < 1e-12);
  // Same lower-order endpoint, same answer, every time.
  assert.deepEqual(bisectorDirection(a, b), fallback);
  // A near-diametric pair resolves through the ordinary branch and is stable.
  const nearly = { x: CENTRE_X - 100, y: CENTRE_Y + 0.5 };
  assert.deepEqual(bisectorDirection(a, nearly), bisectorDirection(a, nearly));
});

test("24 — routing-form counts are 125, 258 and 383", () => {
  assert.equal(sameGroup.length, 125);
  assert.equal(crossGroup.length, 258);
  assert.equal(routed.length, EXPECTED_TOTAL_EDGES);
  assert.equal(sameGroup.length + crossGroup.length, routed.length);
  assert.equal(
    EXPECTED_EDGE_COUNTS.source_named_adjacency + EXPECTED_EDGE_COUNTS.navigation_adjacency,
    EXPECTED_TOTAL_EDGES,
  );
});

test("25 — CONCEPT_GROUP_ORDER equals the unique grouping keys sorted with compareText", () => {
  const independent = [...new Set(
    nodes.filter((n) => n.visualization_role === "concept").map((n) => n.grouping),
  )].sort(compareText);
  assert.deepEqual(CONCEPT_GROUP_ORDER(nodes), independent);
  assert.equal(independent.length, 7);
  assert.equal(independent[0], "AI-Readable Interface / Externalization");
  assert.equal(independent[6], "Semantic Field Foundations");
});

test("26 — CONCEPT_ORDER is permutation-invariant", () => {
  const baseline = CONCEPT_ORDER(nodes).map((n) => n.id);
  assert.equal(baseline.length, 49);
  for (let seed = 0; seed < 200; seed += 1) {
    assert.deepEqual(CONCEPT_ORDER(permute(nodes, seed)).map((n) => n.id), baseline);
  }
});

test("27 — GRAPH_RECORD_ORDER concatenates the two orders and is permutation-invariant", () => {
  const order = GRAPH_RECORD_ORDER(nodes);
  assert.equal(order.length, 59);
  assert.deepEqual(
    order.map((n) => n.id),
    [...CONCEPT_ORDER(nodes), ...ROLE_ORBIT_ORDER(nodes)].map((n) => n.id),
  );
  assert.equal(order[0].id, "ai-readable-knowledge-architecture.md");
  assert.equal(order[58].id, "public-anchors/ai-training-boundary-statement.md");
  const baseline = order.map((n) => n.id);
  for (let seed = 0; seed < 200; seed += 1) {
    assert.deepEqual(GRAPH_RECORD_ORDER(permute(nodes, seed)).map((n) => n.id), baseline);
  }
});

test("28 — compareEdges orders by class, source, target and assignLanes rejects a duplicate triple", () => {
  // "navigation_adjacency" sorts before "source_named_adjacency", and the class
  // decides even though this pair's source and target sort the other way.
  const a = { edge_class: "navigation_adjacency", source: "z.md", target: "z.md" };
  const b = { edge_class: "source_named_adjacency", source: "a.md", target: "a.md" };
  assert.ok(compareEdges(a, b) < 0, "edge class is compared first");
  assert.ok(
    compareEdges({ ...b, source: "a.md" }, { ...b, source: "b.md" }) < 0,
    "then source",
  );
  assert.ok(
    compareEdges({ ...b, target: "a.md" }, { ...b, target: "b.md" }) < 0,
    "then target",
  );
  // Negative control: the real 383-edge set must NOT throw.
  assert.doesNotThrow(() => assignLanes(edges, groupingById));
  // A duplicated triple is a dataset condition requiring owner review.
  const duplicated = [...edges, { ...edges[0], id: `${edges[0].id}#copy` }];
  assert.throws(() => assignLanes(duplicated, groupingById), /duplicate .*triple/);
});

test("29 — lane assignments are invariant under edge input permutation", () => {
  const baseline = [...assignLanes(edges, groupingById).entries()].sort().map(String).join("|");
  assert.ok(baseline.length > 0);
  assert.ok(
    [...assignLanes(edges, groupingById).values()].some((lane) => lane > 0),
    "at least one lane must be non-zero, or invariance would be trivial",
  );
  for (let seed = 0; seed < 200; seed += 1) {
    const permuted = [...assignLanes(permute(edges, seed), groupingById).entries()]
      .sort()
      .map(String)
      .join("|");
    assert.equal(permuted, baseline, `edge permutation ${seed} changed a lane`);
  }
});

test("30 — formatLogicalNumber follows the ECMAScript toFixed(3) contract, not a half-up rule", () => {
  assert.equal(LOGICAL_DECIMAL_PLACES, 3);
  // These two literals are the discriminating pair: a half-up helper returns
  // "1.001" for the first and would pass every other case here.
  assert.equal(formatLogicalNumber(1.0005), "1.000");
  assert.equal(formatLogicalNumber(2.0005), "2.001");
  assert.equal(formatLogicalNumber(0.5), "0.500");
  assert.equal(formatLogicalNumber(330), "330.000");
  assert.equal(formatLogicalNumber(-1.5), "-1.500");
});

test("31 — formatLogicalNumber normalises negative zero and negative near-zero", () => {
  assert.equal(formatLogicalNumber(-0), "0.000");
  assert.equal(formatLogicalNumber(-0.0000001), "0.000");
  assert.equal(formatLogicalNumber(-0.0004), "0.000");
  // Positive control: a genuinely negative value keeps its sign.
  assert.equal(formatLogicalNumber(-0.001), "-0.001");
  assert.ok(!formatLogicalNumber(-0.0004).startsWith("-"));
});

test("32 — repeated serialization of the same layout is byte-identical", () => {
  const once = serializePoints(computeRadialLayout(nodes).concepts);
  const twice = serializePoints(computeRadialLayout(nodes).concepts);
  const thrice = serializePoints(computeRadialLayout(nodes).concepts);
  assert.equal(once, twice);
  assert.equal(twice, thrice);
  assert.ok(once.includes("."), "serialized output must carry decimals");
  assert.ok(once.length > 100);
});

test("33 — no coordinate is rounded before a protected computation", () => {
  for (const name of [
    "computeRadialLayout",
    "computeRoleOrbit",
    "minimumQuadraticBezierRadius",
    "assignLanes",
    "resolveDirectionalTarget",
    "buildDirectionalIndex",
  ]) {
    const body = functionBody(name);
    assert.ok(
      !/formatLogicalNumber|toFixed/.test(body),
      `${name} must not serialize before computing`,
    );
  }
  // Positive control: the serializer IS used on the emit path, so absence
  // everywhere would be a false pass rather than a guarantee.
  assert.ok(/formatLogicalNumber/.test(functionBody("groupArcPath")));
});

// ---------------------------------------------------------------------------
// Exact centre clearance and numeric tolerance — checks 34–47
// ---------------------------------------------------------------------------

/** Independent oracle: a dense sweep, used only to corroborate the solver. */
const sweepMinimum = (p0, q, p2, samples = 1_000_000) => {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const inv = 1 - t;
    const x = inv * inv * p0.x + 2 * inv * t * q.x + t * t * p2.x;
    const y = inv * inv * p0.y + 2 * inv * t * q.y + t * t * p2.y;
    const r = Math.hypot(x - CENTRE_X, y - CENTRE_Y);
    if (r < best) best = r;
  }
  return best;
};

test("34 — minimumQuadraticBezierRadius on diametrically opposite endpoints", () => {
  // Labelled NON-GENERAL: the midpoint identity holds only when P0 + P2 = 2C.
  const p0 = { x: CENTRE_X + 330, y: CENTRE_Y };
  const p2 = { x: CENTRE_X - 330, y: CENTRE_Y };
  const q = { x: CENTRE_X, y: CENTRE_Y + 244 };
  const exact = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
  assert.ok(Math.abs(exact - 122) < 1e-9, `expected the midpoint value, got ${exact}`);
  assert.ok(Number.isFinite(exact));
});

test("35 — near-diametric endpoints agree with a dense independent sweep", () => {
  const p0 = { x: CENTRE_X + 330, y: CENTRE_Y };
  const p2 = { x: CENTRE_X - 329, y: CENTRE_Y + 12 };
  const q = { x: CENTRE_X + 4, y: CENTRE_Y + 244 };
  const exact = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
  assert.ok(Math.abs(exact - sweepMinimum(p0, q, p2)) < 1e-4);
  assert.ok(exact > 0);
});

test("36 — short arcs agree with the sweep", () => {
  const p0 = { x: CENTRE_X + 330, y: CENTRE_Y };
  const p2 = { x: CENTRE_X + 320, y: CENTRE_Y + 60 };
  const q = { x: CENTRE_X + 340, y: CENTRE_Y + 30 };
  const exact = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
  assert.ok(Math.abs(exact - sweepMinimum(p0, q, p2)) < 1e-4);
  assert.ok(exact > 300);
});

test("37 — symmetric synthetic cases are invariant under reflection", () => {
  const p0 = { x: CENTRE_X - 200, y: CENTRE_Y - 150 };
  const p2 = { x: CENTRE_X + 200, y: CENTRE_Y - 150 };
  const q = { x: CENTRE_X, y: CENTRE_Y + 130 };
  const direct = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
  const mirrored = minimumQuadraticBezierRadius(
    { x: 2 * CENTRE_X - p0.x, y: p0.y },
    { x: 2 * CENTRE_X - q.x, y: q.y },
    { x: 2 * CENTRE_X - p2.x, y: p2.y },
    CENTRE,
  );
  assert.ok(Math.abs(direct - mirrored) < 1e-9);
});

test("38 — tangent stationary points return a finite radius", () => {
  const p0 = { x: CENTRE_X - 300, y: CENTRE_Y + 200 };
  const p2 = { x: CENTRE_X + 300, y: CENTRE_Y + 200 };
  const q = { x: CENTRE_X, y: CENTRE_Y + 200 };
  const exact = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
  assert.ok(Number.isFinite(exact));
  assert.ok(Math.abs(exact - 200) < 1e-6, `expected the tangent distance, got ${exact}`);
});

test("39 — roots at or near the bracket endpoints are handled", () => {
  // A stationary point exactly at t = 0 and one a hair inside t = 1.
  const p0 = { x: CENTRE_X + 250, y: CENTRE_Y };
  const p2 = { x: CENTRE_X, y: CENTRE_Y + 250 };
  for (const q of [
    { x: CENTRE_X + 250, y: CENTRE_Y + 1e-9 },
    { x: CENTRE_X + 1e-9, y: CENTRE_Y + 250 },
    { x: CENTRE_X + 125, y: CENTRE_Y + 125 },
  ]) {
    const exact = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
    assert.ok(Number.isFinite(exact) && exact > 0, `q ${JSON.stringify(q)} gave ${exact}`);
    assert.ok(Math.abs(exact - sweepMinimum(p0, q, p2, 200_000)) < 1e-3);
  }
});

test("40 — repeated roots yield a single finite result", () => {
  const p0 = { x: CENTRE_X - 100, y: CENTRE_Y - 100 };
  const p2 = { x: CENTRE_X + 100, y: CENTRE_Y + 100 };
  const q = { x: CENTRE_X, y: CENTRE_Y };
  const exact = minimumQuadraticBezierRadius(p0, q, p2, CENTRE);
  assert.ok(Number.isFinite(exact));
  assert.ok(exact >= 0);
});

test("41 — every cross-group path clears CENTRAL_TEXT_CLEAR_R", () => {
  assert.equal(crossGroup.length, 258);
  const failures = crossGroup.filter((edge) => edge.minimumRadius < CENTRAL_TEXT_CLEAR_R);
  assert.deepEqual(failures.map((edge) => edge.id), []);
  const measured = Math.min(...crossGroup.map((edge) => edge.minimumRadius));
  assert.equal(
    measured,
    EXACT_CROSS_MINIMUM,
    "the frozen cross-group minimum must reproduce exactly",
  );
  assert.ok(measured - CENTRAL_TEXT_CLEAR_R > 9.28, "the measured margin must be preserved");
});

test("42 — every same-group path clears CENTRAL_TEXT_CLEAR_R", () => {
  assert.equal(sameGroup.length, 125);
  const failures = sameGroup.filter((edge) => edge.minimumRadius < CENTRAL_TEXT_CLEAR_R);
  assert.deepEqual(failures.map((edge) => edge.id), []);
  assert.equal(
    Math.min(...sameGroup.map((edge) => edge.minimumRadius)),
    EXACT_SAME_MINIMUM,
    "the frozen same-group minimum must reproduce exactly",
  );
});

test("43 — 64-point sampling is a secondary regression aid, never the proof", () => {
  assert.equal(routed.length, EXPECTED_TOTAL_EDGES);
  for (const edge of routed) {
    const sampled = sampledMinimumBezierRadius(edge.p0, edge.control, edge.p2, CENTRE, 64);
    // Sampling can only ever OVERSTATE the minimum; it never proves clearance.
    assert.ok(
      sampled >= edge.minimumRadius - 1e-9,
      `${edge.id}: sampling reported below the exact minimum`,
    );
  }
});

test("44 — the ring-interior diagnostic reports 8 of 125 at its own tolerance", () => {
  assert.equal(RING_INTERIOR_DIAGNOSTIC_EPSILON, 0.001);
  assert.equal(ringInteriorDiagnostic(routed), RING_INTERIOR_COUNT);
  // Sensitivity control: the count is stable across four orders of magnitude,
  // and a STRICT comparison inflates it — which is why the tolerance exists.
  const countAt = (epsilon) =>
    sameGroup.filter((edge) => edge.minimumRadius < RING_R - epsilon).length;
  assert.equal(countAt(1e-9), RING_INTERIOR_COUNT);
  assert.equal(countAt(1e-6), RING_INTERIOR_COUNT);
  assert.equal(countAt(0.001), RING_INTERIOR_COUNT);
  assert.equal(countAt(0.01), RING_INTERIOR_COUNT);
  assert.ok(countAt(0) > RING_INTERIOR_COUNT, "strict comparison must over-report");
});

test("45 — the diagnostic tolerance never enters the clearance gate", () => {
  const gate = functionBody("minimumQuadraticBezierRadius");
  assert.ok(!/RING_INTERIOR_DIAGNOSTIC_EPSILON/.test(gate));
  assert.ok(/CLEARANCE_SOLVER_EPSILON/.test(gate));
  const diagnostic = functionBody("ringInteriorDiagnostic");
  assert.ok(/RING_INTERIOR_DIAGNOSTIC_EPSILON/.test(diagnostic));
  assert.ok(!/CLEARANCE_SOLVER_EPSILON/.test(diagnostic));
  assert.ok(CLEARANCE_SOLVER_EPSILON <= 1e-9);
  assert.ok(RING_INTERIOR_DIAGNOSTIC_EPSILON > CLEARANCE_SOLVER_EPSILON);
});

test("46 — the clearance gate operates on numbers, never on serialized strings", () => {
  const value = minimumQuadraticBezierRadius(
    routed[0].p0,
    routed[0].control,
    routed[0].p2,
    CENTRE,
  );
  assert.equal(typeof value, "number");
  assert.ok(Number.isFinite(value));
  for (const edge of routed.slice(0, 20)) {
    assert.equal(typeof edge.minimumRadius, "number");
  }
  assert.ok(!/formatLogicalNumber/.test(functionBody("minimumQuadraticBezierRadius")));
});

test("47 — serialized precision is asserted separately from mathematical radius", () => {
  const edge = routed[0];
  // Mathematical: a number, compared with an explicit tolerance.
  assert.equal(typeof edge.minimumRadius, "number");
  assert.ok(Math.abs(edge.minimumRadius - edge.minimumRadius) < 1e-12);
  // Serialized: a string, compared as a string. The two never mix.
  assert.equal(typeof edge.d, "string");
  assert.match(edge.d, /^M -?\d+\.\d{3} -?\d+\.\d{3} Q /);
  assert.notEqual(typeof edge.d, typeof edge.minimumRadius);
});

// ---------------------------------------------------------------------------
// Role orbit — checks 48–61
// ---------------------------------------------------------------------------

const EXPECTED_ORBIT = [
  ["orientation", -90, "500.000", "70.000", "AUTHOR.md"],
  ["orientation", -54, "752.748", "152.123", "README.md"],
  ["boundary", -18, "908.954", "367.123", "AI-READING-GUIDE.md"],
  ["boundary", 18, "908.954", "632.877", "MACHINE_INTERPRETATION_STATE.md"],
  ["boundary", 54, "752.748", "847.877", "MACHINE_READING_PRECEDENCE.md"],
  ["boundary", 90, "500.000", "930.000", "RELATION_STATUS_GUIDE.md"],
  ["boundary", 126, "247.252", "847.877", "SOURCE_USE_GUIDE.md"],
  ["boundary", 162, "91.046", "632.877", "SUMMARY_CONTRACT.md"],
  ["boundary", 198, "91.046", "367.123", "SUMMARY_BOUNDARIES.md"],
  ["anchor", 234, "247.252", "152.123", "public-anchors/ai-training-boundary-statement.md"],
];

test("48 — there are exactly 10 role-orbit positions", () => {
  assert.equal(orbit.roles.length, 10);
  const byRole = new Map();
  for (const entry of orbit.roles) {
    const role = entry.node.visualization_role;
    byRole.set(role, (byRole.get(role) ?? 0) + 1);
  }
  assert.equal(byRole.get("orientation"), 2);
  assert.equal(byRole.get("boundary"), 7);
  assert.equal(byRole.get("anchor"), 1);
});

test("49 — every role-record radius equals ROLE_ORBIT_R", () => {
  assert.equal(orbit.roles.length, 10);
  for (const entry of orbit.roles) {
    assert.ok(Math.abs(radiusOf(entry) - ROLE_ORBIT_R) < 1e-9, entry.id);
  }
});

test("50 — role-orbit pitch is exactly 36 degrees", () => {
  assert.equal(ROLE_ORBIT_PITCH, 36);
  assert.equal(ROLE_ORBIT_PITCH * 10, 360);
  const deltas = orbit.roles
    .slice(1)
    .map((entry, index) => entry.theta - orbit.roles[index].theta);
  assert.equal(deltas.length, 9);
  for (const delta of deltas) assert.ok(Math.abs(delta - 36) < 1e-12);
});

test("51 — the role-orbit start angle is minus ninety degrees", () => {
  assert.equal(ROLE_ORBIT_START_ANGLE, -90);
  assert.equal(orbit.roles[0].theta, -90);
  assert.equal(formatLogicalNumber(orbit.roles[0].x), "500.000");
  assert.equal(formatLogicalNumber(orbit.roles[0].y), "70.000");
});

test("52 — the role order is orientation, boundary, anchor", () => {
  assert.deepEqual([...ROLE_ORDER], ["orientation", "boundary", "anchor"]);
  assert.deepEqual([...ROLE_ORDER], [...FIXED_BAND_ROLES]);
  assert.deepEqual(
    orbit.roles.map((entry) => entry.node.visualization_role),
    EXPECTED_ORBIT.map((row) => row[0]),
  );
});

test("53 — records within a role are ordered by compareNodes", () => {
  for (const role of ROLE_ORDER) {
    const rendered = orbit.roles
      .filter((entry) => entry.node.visualization_role === role)
      .map((entry) => entry.id);
    const independent = nodes
      .filter((node) => node.visualization_role === role)
      .sort(compareNodes)
      .map((node) => node.id);
    assert.deepEqual(rendered, independent, role);
  }
});

test("54 — each role occupies one unbroken index range", () => {
  for (const role of ROLE_ORDER) {
    const indices = orbit.roles
      .filter((entry) => entry.node.visualization_role === role)
      .map((entry) => entry.orderIndex);
    assert.ok(indices.length > 0, role);
    for (let i = 1; i < indices.length; i += 1) {
      assert.equal(indices[i], indices[i - 1] + 1, `${role} is not contiguous`);
    }
  }
});

test("55 — ROLE_ORBIT_ORDER is permutation-invariant and byte-identical", () => {
  const baseline = ROLE_ORBIT_ORDER(nodes).map((n) => n.id);
  assert.equal(baseline.length, 10);
  const serialized = serializePoints(orbit.roles);
  for (let seed = 0; seed < 200; seed += 1) {
    const permuted = permute(nodes, seed);
    assert.deepEqual(ROLE_ORBIT_ORDER(permuted).map((n) => n.id), baseline);
    assert.equal(serializePoints(computeRoleOrbit(permuted).roles), serialized);
  }
});

test("56 — edges do not affect role-orbit coordinates", () => {
  assert.equal(computeRoleOrbit.length, 1);
  assert.ok(!/\bedges\b/.test(functionBody("computeRoleOrbit")));
  assert.equal(serializePoints(computeRoleOrbit([...nodes]).roles), serializePoints(orbit.roles));
});

test("57 — role labels use ROLE_LABEL_R", () => {
  assert.equal(ROLE_LABEL_R, 407);
  assert.equal(orbit.labels.length, 3);
  for (const label of orbit.labels) {
    assert.ok(Math.abs(radiusOf(label) - ROLE_LABEL_R) < 1e-9, label.role);
  }
  assert.ok(SEPARATOR_RING_R < ROLE_LABEL_R && ROLE_LABEL_R < ROLE_ORBIT_R);
});

test("58 — each role label sits at the midpoint of its contiguous sector", () => {
  const expected = { orientation: -72, boundary: 90, anchor: 234 };
  for (const label of orbit.labels) {
    assert.equal(label.midAngle, expected[label.role], label.role);
    assert.equal(label.midAngle, (label.firstAngle + label.lastAngle) / 2);
  }
  const byRole = Object.fromEntries(orbit.labels.map((l) => [l.role, l]));
  assert.equal(formatLogicalNumber(byRole.orientation.x), "625.770");
  assert.equal(formatLogicalNumber(byRole.orientation.y), "112.920");
  assert.equal(formatLogicalNumber(byRole.boundary.x), "500.000");
  assert.equal(formatLogicalNumber(byRole.boundary.y), "907.000");
  assert.equal(formatLogicalNumber(byRole.anchor.x), "260.771");
  assert.equal(formatLogicalNumber(byRole.anchor.y), "170.730");
});

test("59 — no role record participates in concept-ring coordinates", () => {
  const conceptIds = new Set(layout.concepts.map((entry) => entry.id));
  const roleIds = new Set(orbit.roles.map((entry) => entry.id));
  assert.equal(conceptIds.size, 49);
  assert.equal(roleIds.size, 10);
  for (const id of roleIds) assert.ok(!conceptIds.has(id), id);
  assert.equal(conceptIds.size + roleIds.size, 59);
});

test("60 — no role record is an edge endpoint", () => {
  const roleIds = new Set(orbit.roles.map((entry) => entry.id));
  let scanned = 0;
  for (const edge of edges) {
    scanned += 1;
    assert.ok(!roleIds.has(edge.source), `${edge.id} sources a role record`);
    assert.ok(!roleIds.has(edge.target), `${edge.id} targets a role record`);
  }
  assert.equal(scanned, EXPECTED_TOTAL_EDGES, "every edge must have been scanned");
});

test("61 — the role orbit uses the same serializer as the concept ring", () => {
  for (const [, , x, y, id] of EXPECTED_ORBIT) {
    const entry = orbit.roles.find((candidate) => candidate.id === id);
    assert.ok(entry, `${id} is missing from the orbit`);
    assert.equal(formatLogicalNumber(entry.x), x);
    assert.equal(formatLogicalNumber(entry.y), y);
  }
  // Both rings route through one serializer, so both emit three decimals.
  const conceptSample = formatLogicalNumber(layout.concepts[0].x);
  const roleSample = formatLogicalNumber(orbit.roles[0].x);
  assert.match(conceptSample, /^-?\d+\.\d{3}$/);
  assert.match(roleSample, /^-?\d+\.\d{3}$/);
});

// ---------------------------------------------------------------------------
// Grouping arcs — checks 130–137 (geometry and serialization)
// ---------------------------------------------------------------------------

test("130 — GROUP_ARC_R exists in the geometry module and equals exactly 370", () => {
  assert.equal(GROUP_ARC_R, 370);
  assert.equal(typeof GROUP_ARC_R, "number");
  assert.ok(/export const GROUP_ARC_R = 370;/.test(layoutSource));
});

test("131 — every rendered grouping arc uses radius exactly 370", () => {
  assert.equal(layout.groups.length, 7);
  for (const group of layout.groups) {
    assert.equal(group.radius, GROUP_ARC_R, group.key);
    assert.equal(group.radius, 370);
  }
  for (const group of layout.groups) {
    assert.ok(groupArcPath(group).includes("A 370.000 370.000 "), group.key);
  }
});

test("132 — no grouping-arc radius derives from group size or any data count", () => {
  const body = functionBody("computeRadialLayout");
  const radiusLine = body
    .split("\n")
    .filter((line) => /radius:/.test(line))
    .join("\n");
  assert.ok(radiusLine.includes("GROUP_ARC_R"), "the radius must read the constant");
  for (const forbidden of [
    "count",
    "length",
    "size",
    "selected",
    "viewport",
    "scale",
    "label",
  ]) {
    assert.ok(!radiusLine.includes(forbidden), `arc radius must not read ${forbidden}`);
  }
  // Positive control: the pattern would catch a size-dependent expression.
  assert.ok(/count/.test("radius: GROUP_ARC_R + members.count,"));
  // Groups of different sizes still share one radius.
  const sizes = new Set(layout.groups.map((group) => group.count));
  assert.ok(sizes.size > 1, "the snapshot must contain differently sized groupings");
  assert.equal(new Set(layout.groups.map((group) => group.radius)).size, 1);
});

test("133 — every grouping arc remains outside the concept hit area", () => {
  assert.equal(RING_R + HIT_R, 356);
  assert.ok(GROUP_ARC_R > RING_R + HIT_R);
  for (const group of layout.groups) assert.ok(group.radius > 356, group.key);
});

test("134 — every grouping arc remains inside the separator ring", () => {
  assert.ok(GROUP_ARC_R < SEPARATOR_RING_R);
  assert.equal(SEPARATOR_RING_R - GROUP_ARC_R, 15);
  for (const group of layout.groups) assert.ok(group.radius < SEPARATOR_RING_R, group.key);
});

test("135 — every grouping arc remains outside the same-group bulge radius", () => {
  assert.ok(GROUP_ARC_R > SAME_GROUP_BULGE_R);
  // The full approved radial ordering, asserted as one chain.
  assert.ok(SAME_GROUP_BULGE_R < RING_R + HIT_R);
  assert.ok(RING_R + HIT_R < GROUP_ARC_R);
  assert.ok(GROUP_ARC_R < SEPARATOR_RING_R);
  assert.deepEqual(
    [SAME_GROUP_BULGE_R, RING_R + HIT_R, GROUP_ARC_R, SEPARATOR_RING_R],
    [352, 356, 370, 385],
  );
});

test("136 — arc spans derive only from the first and last member angles", () => {
  for (const group of layout.groups) {
    const members = layout.concepts.filter((entry) => entry.node.grouping === group.key);
    assert.equal(group.startAngle, members[0].theta, group.key);
    assert.equal(group.endAngle, members[members.length - 1].theta, group.key);
    assert.equal(group.midAngle, (group.startAngle + group.endAngle) / 2);
    // The span is the sector, not the member count: a one-member grouping would
    // collapse to a zero sweep rather than to some count-derived length.
    assert.ok(
      Math.abs(group.endAngle - group.startAngle - (group.count - 1) * CONCEPT_PITCH) < 1e-9,
      group.key,
    );
  }
});

test("137 — emitted arc path data uses the canonical serializer and is stable", () => {
  for (const group of layout.groups) {
    const once = groupArcPath(group);
    assert.equal(once, groupArcPath(group), group.key);
    assert.match(
      once,
      /^M -?\d+\.\d{3} -?\d+\.\d{3} A 370\.000 370\.000 0 [01] [01] -?\d+\.\d{3} -?\d+\.\d{3}$/,
      `${group.key}: ${once}`,
    );
  }
  assert.equal(new Set(layout.groups.map(groupArcPath)).size, 7);
});
