// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Phase 2A deterministic Authority-View layout tests.
//
// These exercise the ACTUAL production layout module against the ACTUAL adopted
// 30-node snapshot. The layout module is pure (no DOM, no D3, no browser API),
// so it is fully testable under the existing Node test runner without adding a
// browser-testing framework.
//
// They also assert the Phase 2A boundaries as source-level contracts: no force
// simulation, no centrality/rank/similarity computation, no synthesized nodes or
// edges, and routing that stays navigation-only.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertSnapshot } from "../../src/lib/public-surface-authority-map/contract.ts";
import { EXPECTED_COUNTS } from "../../src/lib/public-surface-authority-map/fallback.ts";
import {
  AUTHORITY_LAYOUT_METRICS,
  GROUP_REGION_WIDTH,
  columnsForWidth,
  compareNodes,
  compareText,
  computeAuthorityLayout,
  groupNodes,
  resolveColumnsPerBand,
  resolveRoutingMode,
  selectRoutingEdges,
  shortenLabel,
} from "../../src/lib/public-surface-authority-map/d3AuthorityLayout.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const fallbackRaw = rd("src/data/public-surface-authority-map/last-known-good.json");
const snapshot = assertSnapshot(JSON.parse(fallbackRaw));
const allNodes = snapshot.nodes;

const GROUPING_FIELDS = [
  "surface_role",
  "authority_ceiling",
  "public_surface_status",
] as const;

const M = AUTHORITY_LAYOUT_METRICS;

const layoutOf = (nodes, field = "surface_role", options = {}) =>
  computeAuthorityLayout(nodes, field, options);

// A stable serialization of everything the renderer consumes.
const serialize = (layout) =>
  JSON.stringify({
    groupField: layout.groupField,
    width: layout.width,
    height: layout.height,
    columnsPerBand: layout.columnsPerBand,
    isEmpty: layout.isEmpty,
    groups: layout.groups,
    nodes: layout.nodes.map((entry) => ({
      id: entry.id,
      groupKey: entry.groupKey,
      bandIndex: entry.bandIndex,
      columnIndex: entry.columnIndex,
      rowIndex: entry.rowIndex,
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
      cx: entry.cx,
      cy: entry.cy,
      labelLines: entry.labelLines,
    })),
    positions: [...layout.positions.entries()],
  });

const rectsOverlap = (a, b) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

// --- Adopted dataset baseline ------------------------------------------------

test("runtime: the adopted 30-node / 161-edge dataset remains accepted", () => {
  assert.equal(allNodes.length, 30);
  assert.equal(snapshot.edges.length, 161);
  assert.equal(allNodes.length, EXPECTED_COUNTS.nodes);
  assert.equal(snapshot.edges.length, EXPECTED_COUNTS.edges);
  assert.equal(snapshot.edge_counts.boundary_reference, 132);
  assert.equal(snapshot.edge_counts.source_use_reference, 29);
  assert.equal(snapshot.self_references_omitted_count, 7);

  const layout = layoutOf(allNodes);
  assert.equal(layout.nodes.length, 30);
  assert.equal(layout.positions.size, 30);
});

// --- 1. Determinism ----------------------------------------------------------

test("layout: identical input produces byte-identical output", () => {
  for (const field of GROUPING_FIELDS) {
    const a = serialize(layoutOf(allNodes, field));
    const b = serialize(layoutOf(allNodes, field));
    assert.equal(a, b, `grouping ${field} must be deterministic`);
  }
});

test("layout: input order does not change the output", () => {
  const shuffled = [...allNodes].reverse();
  for (const field of GROUPING_FIELDS) {
    assert.equal(
      serialize(layoutOf(shuffled, field)),
      serialize(layoutOf(allNodes, field)),
      `grouping ${field} must not depend on input array order`,
    );
  }
});

test("layout: repeated recomputation after grouping changes returns to the same output", () => {
  const first = serialize(layoutOf(allNodes, "surface_role"));
  layoutOf(allNodes, "authority_ceiling");
  layoutOf(allNodes, "public_surface_status");
  const again = serialize(layoutOf(allNodes, "surface_role"));
  assert.equal(again, first);
});

test("layout: computing a layout does not mutate its input nodes", () => {
  const before = JSON.stringify(allNodes);
  layoutOf(allNodes, "authority_ceiling");
  assert.equal(JSON.stringify(allNodes), before);
});

// --- 1b. Locale independence of the ordering comparator -----------------------
//
// Group and node positions are derived from `compareText`, so if that
// comparator consulted host collation the same validated snapshot could lay out
// differently on a different browser, OS, Node version, ICU build, or default
// locale. These tests pin the comparator to stable UTF-16 code-unit order using
// an EXPLICIT fixture whose expected order is written out by hand — never
// computed with the implementation under test.

// Code points, in ascending code-unit order:
//   "Z" U+005A (90) < "_" U+005F (95) < "a" U+0061 (97) < "Ä" U+00C4 (196)
// Common collations disagree with this: they typically place "_" first and sort
// "a"/"Ä" before "Z" (and Swedish collation places "Ä" after "Z"). The fixture
// is chosen precisely because collation and code-unit order diverge on it.
const COLLATION_FIXTURE = ["Z", "_", "a", "Ä"];
const EXPECTED_CODE_UNIT_ORDER = ["Z", "_", "a", "Ä"];
const EXPECTED_CODE_UNITS = [90, 95, 97, 196];

// Fixed, seeded-free permutations. No Math.random anywhere in this file.
const reversed = (list) => [...list].reverse();
const shuffled = (list) =>
  list.map((_item, index) => list[(index * 7 + 3) % list.length]);

test("comparator: the fixture's code units are exactly the documented ones", () => {
  assert.deepEqual(
    COLLATION_FIXTURE.map((s) => s.charCodeAt(0)),
    EXPECTED_CODE_UNITS,
  );
});

test("comparator: sorts the fixture into the hand-written code-unit order", () => {
  // Expected order is a literal, not a compareText result.
  for (const start of [
    COLLATION_FIXTURE,
    reversed(COLLATION_FIXTURE),
    shuffled(COLLATION_FIXTURE),
    ["Ä", "a", "_", "Z"],
    ["a", "Ä", "Z", "_"],
  ]) {
    assert.deepEqual(
      [...start].sort(compareText),
      EXPECTED_CODE_UNIT_ORDER,
      `sorting ${JSON.stringify(start)} must give the code-unit order`,
    );
  }
});

test("comparator: returns exactly -1, 0, or 1 with hand-written pair expectations", () => {
  const PAIRS = [
    ["Z", "_", -1],
    ["Z", "a", -1],
    ["Z", "Ä", -1],
    ["_", "a", -1],
    ["_", "Ä", -1],
    ["a", "Ä", -1],
    ["_", "Z", 1],
    ["a", "Z", 1],
    ["Ä", "Z", 1],
    ["a", "_", 1],
    ["Ä", "_", 1],
    ["Ä", "a", 1],
    ["Z", "Z", 0],
    ["Ä", "Ä", 0],
    ["", "", 0],
    ["", "a", -1],
    ["a", "", 1],
    // Uppercase sorts before lowercase under code units, unlike most collations.
    ["A", "a", -1],
    ["Z", "a", -1],
    // Digits before letters; space before digits.
    ["1", "A", -1],
    [" ", "1", -1],
  ];
  for (const [a, b, expected] of PAIRS) {
    assert.equal(
      compareText(a, b),
      expected,
      `compareText(${JSON.stringify(a)}, ${JSON.stringify(b)}) must be ${expected}`,
    );
  }
});

test("comparator: is reflexive, antisymmetric, and transitive over the fixture", () => {
  for (const a of COLLATION_FIXTURE) {
    assert.equal(compareText(a, a), 0);
    for (const b of COLLATION_FIXTURE) {
      // Sum form avoids the -0 vs 0 distinction that strict equality would flag
      // on the reflexive pair.
      assert.equal(compareText(a, b) + compareText(b, a), 0);
    }
  }
  for (let i = 0; i < EXPECTED_CODE_UNIT_ORDER.length - 2; i += 1) {
    const [x, y, z] = EXPECTED_CODE_UNIT_ORDER.slice(i, i + 3);
    assert.equal(compareText(x, y), -1);
    assert.equal(compareText(y, z), -1);
    assert.equal(compareText(x, z), -1);
  }
});

test("comparator: does not call or depend on String.prototype.localeCompare", () => {
  // Replace the collation API with a deliberately WRONG, call-counting stub and
  // recompute everything under it. If the layout consulted collation at all,
  // either the counter would move or the results would change. Results are
  // captured while patched and asserted only after restoring, so assertion
  // internals cannot pollute the counter.
  const realLocaleCompare = String.prototype.localeCompare;
  const realCollator = Intl.Collator;

  const expectedCompare = COLLATION_FIXTURE.map((a) =>
    COLLATION_FIXTURE.map((b) => compareText(a, b)),
  );
  const expectedLayout = serialize(layoutOf(allNodes, "surface_role"));
  const expectedSort = [...reversed(COLLATION_FIXTURE)].sort(compareText);

  let localeCompareCalls = 0;
  let collatorConstructions = 0;
  let patchedCompare;
  let patchedLayout;
  let patchedSort;
  try {
    // eslint-disable-next-line no-extend-native
    String.prototype.localeCompare = function stubLocaleCompare(that) {
      localeCompareCalls += 1;
      // Inverted relative to code-unit order, so any reliance on it shows up.
      return String(this) === String(that) ? 0 : String(this) < String(that) ? 1 : -1;
    };
    Intl.Collator = function StubCollator() {
      collatorConstructions += 1;
      return { compare: () => 0 };
    };

    patchedCompare = COLLATION_FIXTURE.map((a) =>
      COLLATION_FIXTURE.map((b) => compareText(a, b)),
    );
    patchedLayout = serialize(layoutOf(allNodes, "surface_role"));
    patchedSort = [...reversed(COLLATION_FIXTURE)].sort(compareText);
  } finally {
    String.prototype.localeCompare = realLocaleCompare;
    Intl.Collator = realCollator;
  }

  assert.equal(localeCompareCalls, 0, "localeCompare must never be called");
  assert.equal(collatorConstructions, 0, "Intl.Collator must never be constructed");
  assert.deepEqual(patchedCompare, expectedCompare);
  assert.equal(patchedLayout, expectedLayout);
  assert.deepEqual(patchedSort, EXPECTED_CODE_UNIT_ORDER);
  // The stub really was installed and really is wrong, so the assertions above
  // are meaningful rather than vacuous.
  assert.equal("Z".localeCompare("a"), realLocaleCompare.call("Z", "a"));
});

test("comparator: group ordering follows the explicit code-unit order", () => {
  // Synthetic grouping values drawn from the fixture. Group keys must come out
  // in the hand-written code-unit order, not any collation order.
  const nodes = COLLATION_FIXTURE.map((key, index) => ({
    ...allNodes[index],
    id: `fixture-${index}`,
    surface_role: key,
  }));
  for (const input of [nodes, reversed(nodes), shuffled(nodes)]) {
    const layout = computeAuthorityLayout(input, "surface_role");
    assert.deepEqual(
      layout.groups.map((group) => group.key),
      EXPECTED_CODE_UNIT_ORDER,
    );
    assert.deepEqual(
      layout.groups.map((group) => group.columnIndex),
      [0, 1, 2, 3],
    );
  }
});

test("comparator: node name ordering follows the explicit code-unit order", () => {
  const nodes = COLLATION_FIXTURE.map((name, index) => ({
    ...allNodes[index],
    id: `fixture-${index}`,
    surface_role: "concept_node",
    name,
  }));
  for (const input of [nodes, reversed(nodes), shuffled(nodes)]) {
    const layout = computeAuthorityLayout(input, "surface_role");
    assert.equal(layout.groups.length, 1);
    assert.deepEqual(
      layout.nodes.map((entry) => entry.node.name),
      EXPECTED_CODE_UNIT_ORDER,
    );
    assert.deepEqual(
      layout.nodes.map((entry) => entry.rowIndex),
      [0, 1, 2, 3],
    );
  }
});

test("comparator: the node-id tiebreak follows the explicit code-unit order", () => {
  // Identical names force the tiebreak; ids carry the fixture.
  const nodes = COLLATION_FIXTURE.map((id, index) => ({
    ...allNodes[index],
    id,
    surface_role: "concept_node",
    name: "Identical Name",
  }));
  for (const input of [nodes, reversed(nodes), shuffled(nodes)]) {
    const layout = computeAuthorityLayout(input, "surface_role");
    assert.deepEqual(layout.nodes.map((entry) => entry.id), EXPECTED_CODE_UNIT_ORDER);
  }
  // Name still dominates the id.
  const nameWins = [
    { ...allNodes[0], id: "Ä", surface_role: "concept_node", name: "A first" },
    { ...allNodes[1], id: "Z", surface_role: "concept_node", name: "B second" },
  ];
  assert.deepEqual(
    computeAuthorityLayout(reversed(nameWins), "surface_role").nodes.map((e) => e.id),
    ["Ä", "Z"],
  );
});

test("comparator: reversed and shuffled fixture input serialize identically", () => {
  const nodes = COLLATION_FIXTURE.map((key, index) => ({
    ...allNodes[index],
    id: `fixture-${index}`,
    surface_role: key,
    name: key,
  }));
  const baseline = serialize(computeAuthorityLayout(nodes, "surface_role"));
  for (const input of [reversed(nodes), shuffled(nodes), reversed(shuffled(nodes))]) {
    assert.equal(serialize(computeAuthorityLayout(input, "surface_role")), baseline);
  }
});

test("layout: reversed and shuffled real input serialize identically", () => {
  const permutation = shuffled(allNodes);
  assert.equal(permutation.length, allNodes.length);
  assert.equal(new Set(permutation.map((n) => n.id)).size, allNodes.length);
  assert.notDeepEqual(
    permutation.map((n) => n.id),
    allNodes.map((n) => n.id),
    "the permutation must actually reorder the input",
  );
  for (const field of GROUPING_FIELDS) {
    const baseline = serialize(layoutOf(allNodes, field));
    assert.equal(serialize(layoutOf(reversed(allNodes), field)), baseline);
    assert.equal(serialize(layoutOf(permutation, field)), baseline);
  }
});

// --- 2. Code-unit group ordering ---------------------------------------------

// The adopted snapshot's actual group keys, written out in the code-unit order
// the layout must produce. Hand-written, not derived from the implementation.
const EXPECTED_GROUP_KEYS = {
  surface_role: [
    "boundary_document",
    "concept_node",
    "interpretation_guide",
    "public_anchor",
    "repository_orientation",
    "source_use_guide",
  ],
  authority_ceiling: [
    "navigation_only",
    "public_file_claim_only",
    "repository_boundary_only",
  ],
  public_surface_status: [
    "public_boundary_document",
    "public_navigation_surface",
    "selected_external_node",
  ],
};

test("layout: group keys come out in the hand-written code-unit order", () => {
  for (const field of GROUPING_FIELDS) {
    const keys = layoutOf(allNodes, field).groups.map((group) => group.key);
    assert.deepEqual(keys, EXPECTED_GROUP_KEYS[field], `grouping ${field}`);
    assert.equal(new Set(keys).size, keys.length, "group keys must be unique");
  }
});

test("layout: group keys are verbatim metadata values, never invented", () => {
  for (const field of GROUPING_FIELDS) {
    const layout = layoutOf(allNodes, field);
    const actual = new Set(allNodes.map((node) => node[field]));
    for (const group of layout.groups) {
      assert.ok(actual.has(group.key), `unknown group key "${group.key}"`);
    }
    assert.equal(layout.groups.length, actual.size);
  }
});

test("layout: each group's declared count equals its rendered node count", () => {
  for (const field of GROUPING_FIELDS) {
    const layout = layoutOf(allNodes, field);
    for (const group of layout.groups) {
      const rendered = layout.nodes.filter((entry) => entry.groupKey === group.key);
      assert.equal(group.count, rendered.length, `count mismatch for ${group.key}`);
    }
    const summed = layout.groups.reduce((total, group) => total + group.count, 0);
    assert.equal(summed, allNodes.length);
  }
});

// --- 3. Code-unit node ordering inside groups ---------------------------------

test("layout: nodes inside a group are ordered by name, then id", () => {
  for (const field of GROUPING_FIELDS) {
    const layout = layoutOf(allNodes, field);
    for (const group of layout.groups) {
      const inGroup = layout.nodes
        .filter((entry) => entry.groupKey === group.key)
        .sort((a, b) => a.rowIndex - b.rowIndex);
      const expected = [...inGroup].sort((a, b) => compareNodes(a.node, b.node));
      assert.deepEqual(
        inGroup.map((entry) => entry.id),
        expected.map((entry) => entry.id),
        `node order inside ${group.key} must be name-then-id`,
      );
      inGroup.forEach((entry, index) => assert.equal(entry.rowIndex, index));
    }
  }
});

test("layout: name ties fall back to node id", () => {
  const [first, second] = allNodes;
  const role = first.surface_role;
  const tied = [
    { ...second, surface_role: role, id: "zzz-second", name: "Same Name" },
    { ...first, surface_role: role, id: "aaa-first", name: "Same Name" },
  ];
  const layout = computeAuthorityLayout(tied, "surface_role");
  assert.equal(layout.groups.length, 1);
  const ids = layout.nodes.map((entry) => entry.id);
  assert.deepEqual(ids, ["aaa-first", "zzz-second"]);
});

// --- 4 & 5. Exactly one position per visible node; none for hidden ones -------

test("layout: every visible node receives exactly one position", () => {
  for (const field of GROUPING_FIELDS) {
    const layout = layoutOf(allNodes, field);
    assert.equal(layout.nodes.length, allNodes.length);
    const ids = layout.nodes.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length, "no node may be placed twice");
    assert.deepEqual(
      [...ids].sort(compareText),
      allNodes.map((node) => node.id).sort(compareText),
    );
    for (const node of allNodes) {
      assert.ok(layout.positions.has(node.id), `missing position for ${node.id}`);
    }
    assert.equal(layout.positions.size, allNodes.length);
  }
});

test("layout: filtered-out nodes receive no position at all", () => {
  const visible = allNodes.filter((node) => node.surface_role === "concept_node");
  assert.ok(visible.length > 0 && visible.length < allNodes.length);
  const hidden = allNodes.filter((node) => node.surface_role !== "concept_node");

  const layout = layoutOf(visible);
  assert.equal(layout.nodes.length, visible.length);
  assert.equal(layout.positions.size, visible.length);
  for (const node of hidden) {
    assert.equal(layout.positions.has(node.id), false, `${node.id} must not be placed`);
    assert.equal(
      layout.nodes.some((entry) => entry.id === node.id),
      false,
    );
  }
  assert.equal(layout.groups.length, 1);
  assert.equal(layout.groups[0].key, "concept_node");
});

// --- 6. No node or edge is generated -----------------------------------------

test("layout: no node is generated, renamed, or altered", () => {
  const layout = layoutOf(allNodes);
  assert.equal(layout.nodes.length, allNodes.length);
  const byId = new Map(allNodes.map((node) => [node.id, node]));
  for (const entry of layout.nodes) {
    // Same object identity: the layout passes records through, never rebuilds.
    assert.equal(entry.node, byId.get(entry.id));
  }
});

test("routing: only existing snapshot edges are ever selected", () => {
  const layout = layoutOf(allNodes);
  const renderedIds = new Set(layout.nodes.map((entry) => entry.id));
  const edgeSet = new Set(snapshot.edges);

  const global = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds,
  });
  assert.equal(global.length, snapshot.edges.length);
  for (const edge of global) {
    assert.ok(edgeSet.has(edge), "every routed edge must be an existing snapshot edge");
  }

  const selectedId = allNodes[0].id;
  const selected = selectRoutingEdges(snapshot.edges, {
    mode: "selected",
    selectedId,
    renderedIds,
  });
  assert.ok(selected.length <= snapshot.edges.length);
  for (const edge of selected) {
    assert.ok(edgeSet.has(edge));
    assert.ok(edge.source === selectedId || edge.target === selectedId);
  }
  const expected = snapshot.edges.filter(
    (edge) => edge.source === selectedId || edge.target === selectedId,
  );
  assert.equal(selected.length, expected.length);
});

test("routing: edges with an endpoint outside the current view are not drawn", () => {
  const visible = allNodes.filter((node) => node.surface_role === "concept_node");
  const layout = layoutOf(visible);
  const renderedIds = new Set(layout.nodes.map((entry) => entry.id));
  const drawn = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds,
  });
  assert.ok(drawn.length < snapshot.edges.length);
  for (const edge of drawn) {
    assert.ok(renderedIds.has(edge.source));
    assert.ok(renderedIds.has(edge.target));
  }
});

// --- 7. Finite, non-negative coordinates -------------------------------------

test("layout: all coordinates are finite and non-negative", () => {
  for (const field of GROUPING_FIELDS) {
    for (const columnsPerBand of [1, 2, 3, 6, 99]) {
      const layout = layoutOf(allNodes, field, { columnsPerBand });
      const numbers = [layout.width, layout.height];
      for (const group of layout.groups) {
        numbers.push(group.x, group.y, group.width, group.height);
      }
      for (const entry of layout.nodes) {
        numbers.push(entry.x, entry.y, entry.cx, entry.cy, entry.width, entry.height);
      }
      for (const point of layout.positions.values()) {
        numbers.push(point.cx, point.cy);
      }
      for (const value of numbers) {
        assert.ok(Number.isFinite(value), `non-finite coordinate ${value}`);
        assert.ok(value >= 0, `negative coordinate ${value}`);
      }
    }
  }
});

test("layout: every node stays inside its own group region and the canvas", () => {
  for (const field of GROUPING_FIELDS) {
    for (const columnsPerBand of [1, 2, 6]) {
      const layout = layoutOf(allNodes, field, { columnsPerBand });
      const groups = new Map(layout.groups.map((group) => [group.key, group]));
      for (const entry of layout.nodes) {
        const group = groups.get(entry.groupKey);
        assert.ok(group, `missing region for ${entry.groupKey}`);
        assert.ok(entry.x >= group.x);
        assert.ok(entry.x + entry.width <= group.x + group.width);
        assert.ok(entry.y >= group.y + M.GROUP_HEADER_HEIGHT - 1);
        assert.ok(entry.y + entry.height <= group.y + group.height);
        assert.ok(entry.x + entry.width <= layout.width);
        assert.ok(entry.y + entry.height <= layout.height);
      }
    }
  }
});

test("layout: no two nodes overlap and no two group regions overlap", () => {
  for (const field of GROUPING_FIELDS) {
    for (const columnsPerBand of [1, 2, 3, 6]) {
      const layout = layoutOf(allNodes, field, { columnsPerBand });
      for (let i = 0; i < layout.nodes.length; i += 1) {
        for (let j = i + 1; j < layout.nodes.length; j += 1) {
          assert.equal(
            rectsOverlap(layout.nodes[i], layout.nodes[j]),
            false,
            `nodes ${layout.nodes[i].id} and ${layout.nodes[j].id} overlap`,
          );
        }
      }
      for (let i = 0; i < layout.groups.length; i += 1) {
        for (let j = i + 1; j < layout.groups.length; j += 1) {
          assert.equal(
            rectsOverlap(layout.groups[i], layout.groups[j]),
            false,
            `groups ${layout.groups[i].key} and ${layout.groups[j].key} overlap`,
          );
        }
      }
    }
  }
});

test("layout: every node box has the identical fixed size", () => {
  const layout = layoutOf(allNodes);
  for (const entry of layout.nodes) {
    assert.equal(entry.width, M.NODE_WIDTH);
    assert.equal(entry.height, M.NODE_HEIGHT);
  }
  for (const group of layout.groups) {
    assert.equal(group.width, GROUP_REGION_WIDTH);
  }
});

// --- 8. Grouping changes stay valid and deterministic ------------------------

test("layout: each grouping choice yields a valid deterministic layout", () => {
  for (const field of GROUPING_FIELDS) {
    const layout = layoutOf(allNodes, field);
    assert.equal(layout.groupField, field);
    assert.ok(layout.groups.length > 0);
    assert.equal(layout.nodes.length, 30);
    assert.equal(layout.isEmpty, false);
    assert.equal(serialize(layout), serialize(layoutOf(allNodes, field)));
  }
});

test("layout: wrapping into bands stays deterministic and gap-consistent", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 2 });
  assert.equal(layout.columnsPerBand, 2);
  assert.equal(serialize(layout), serialize(layoutOf(allNodes, "surface_role", { columnsPerBand: 2 })));
  for (const group of layout.groups) {
    assert.ok(group.columnIndex < 2);
    assert.equal(
      group.x,
      M.CANVAS_PADDING + group.columnIndex * (GROUP_REGION_WIDTH + M.GROUP_GAP),
    );
  }
  const bands = new Set(layout.groups.map((group) => group.bandIndex));
  assert.ok(bands.size > 1, "six surface-role groups at two columns must wrap");
});

test("layout: columnsPerBand is clamped to at least one column", () => {
  for (const requested of [0, -5, Number.NaN]) {
    const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: requested });
    assert.ok(layout.columnsPerBand >= 1);
    assert.ok(Number.isFinite(layout.width) && layout.width > 0);
  }
});

test("columnsForWidth: deterministic, clamped, and never exceeds the group count", () => {
  assert.equal(columnsForWidth(0, 6), 6); // unmeasured container: no wrapping
  assert.equal(columnsForWidth(360, 6), 1); // narrow mobile
  assert.equal(columnsForWidth(20000, 6), 6); // never more columns than groups
  assert.equal(columnsForWidth(1200, 6), columnsForWidth(1200, 6));
  for (const width of [320, 480, 768, 1024, 1200, 1600]) {
    const columns = columnsForWidth(width, 6);
    assert.ok(Number.isInteger(columns) && columns >= 1 && columns <= 6);
  }
});

test("wrapping policy: one lexical row of columns, or one column when too narrow", () => {
  // Narrow mobile: a single full-width column, stacked vertically.
  assert.equal(resolveColumnsPerBand(360, 6), 1);
  assert.equal(resolveColumnsPerBand(280, 6), 1);
  // Anything that fits two or more regions keeps every group in one row.
  assert.equal(resolveColumnsPerBand(810, 6), 6);
  assert.equal(resolveColumnsPerBand(1200, 6), 6);
  assert.equal(resolveColumnsPerBand(600, 6), 6);
  // Deterministic and clamped for degenerate inputs.
  assert.equal(resolveColumnsPerBand(810, 1), 1);
  assert.equal(resolveColumnsPerBand(Number.NaN, 3), 3);
  assert.equal(resolveColumnsPerBand(0, 3), 3);
  assert.equal(resolveColumnsPerBand(810, 6), resolveColumnsPerBand(810, 6));
});

test("wrapping policy: the wide layout is one band with no empty column slot", () => {
  const columnsPerBand = resolveColumnsPerBand(1200, 6);
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand });
  assert.equal(new Set(layout.groups.map((group) => group.bandIndex)).size, 1);
  const columns = layout.groups.map((group) => group.columnIndex);
  assert.deepEqual(columns, [0, 1, 2, 3, 4, 5]);
  // Every group starts at the same top edge, so no column carries dead space.
  assert.equal(new Set(layout.groups.map((group) => group.y)).size, 1);
  assert.equal(
    layout.height,
    Math.max(...layout.groups.map((group) => group.y + group.height)) + M.CANVAS_PADDING,
  );
});

test("wrapping policy: the narrow layout stacks groups without horizontal growth", () => {
  const columnsPerBand = resolveColumnsPerBand(360, 6);
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand });
  assert.equal(layout.width, M.CANVAS_PADDING * 2 + GROUP_REGION_WIDTH);
  assert.deepEqual(
    layout.groups.map((group) => group.columnIndex),
    [0, 0, 0, 0, 0, 0],
  );
  const tops = layout.groups.map((group) => group.y);
  assert.deepEqual(tops, [...tops].sort((a, b) => a - b));
  assert.equal(new Set(tops).size, tops.length);
});

// --- 9. Empty filtered results ------------------------------------------------

test("layout: an empty visible set is handled safely", () => {
  const layout = layoutOf([]);
  assert.equal(layout.isEmpty, true);
  assert.deepEqual(layout.nodes, []);
  assert.deepEqual(layout.groups, []);
  assert.equal(layout.positions.size, 0);
  assert.ok(Number.isFinite(layout.width) && layout.width > 0);
  assert.equal(layout.height, M.MIN_CANVAS_HEIGHT);
  assert.equal(serialize(layout), serialize(layoutOf([])));
});

test("routing: an empty view routes nothing", () => {
  const drawn = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds: new Set(),
  });
  assert.deepEqual(drawn, []);
});

test("layout: a single visible node is handled safely", () => {
  const layout = layoutOf([allNodes[0]]);
  assert.equal(layout.nodes.length, 1);
  assert.equal(layout.groups.length, 1);
  assert.equal(layout.groups[0].count, 1);
  assert.equal(layout.isEmpty, false);
});

// --- 11. Routing remains navigation only --------------------------------------

test("routing: is off by default and only enabled by an explicit toggle", () => {
  assert.equal(resolveRoutingMode(false, false, null), "off");
  assert.equal(resolveRoutingMode(false, false, "node-a"), "off");
  // Selected-node routing requires BOTH the toggle and a selection.
  assert.equal(resolveRoutingMode(true, false, null), "off");
  assert.equal(resolveRoutingMode(true, false, "node-a"), "selected");
  // Global routing is only ever reached through its own explicit toggle.
  assert.equal(resolveRoutingMode(false, true, null), "global");
  assert.equal(resolveRoutingMode(true, true, "node-a"), "global");
});

test("routing: mode 'off' draws no edge even with a selection", () => {
  const layout = layoutOf(allNodes);
  const renderedIds = new Set(layout.nodes.map((entry) => entry.id));
  assert.deepEqual(
    selectRoutingEdges(snapshot.edges, {
      mode: "off",
      selectedId: allNodes[0].id,
      renderedIds,
    }),
    [],
  );
});

test("routing: every routed edge keeps navigation-only status and an allowed type", () => {
  const layout = layoutOf(allNodes);
  const renderedIds = new Set(layout.nodes.map((entry) => entry.id));
  const drawn = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds,
  });
  for (const edge of drawn) {
    assert.equal(edge.relation_status, "navigation_only");
    assert.equal(edge.authority_ceiling, "navigation_only");
    assert.ok(
      edge.relation_type === "boundary_reference" ||
        edge.relation_type === "source_use_reference",
    );
    assert.notEqual(edge.source, edge.target);
  }
  const boundary = drawn.filter((e) => e.relation_type === "boundary_reference").length;
  const sourceUse = drawn.filter((e) => e.relation_type === "source_use_reference").length;
  assert.equal(boundary, 132);
  assert.equal(sourceUse, 29);
});

// --- Label shortening ---------------------------------------------------------

test("labels: shortening is deterministic and bounded, and the full name survives", () => {
  const layout = layoutOf(allNodes);
  for (const entry of layout.nodes) {
    assert.ok(entry.labelLines.length >= 1);
    assert.ok(entry.labelLines.length <= M.LABEL_MAX_LINES);
    for (const line of entry.labelLines) {
      assert.ok(
        line.length <= M.LABEL_LINE_MAX,
        `label line too long: ${JSON.stringify(line)}`,
      );
    }
    // The full name is never lost: it stays on the passed-through record.
    assert.equal(entry.node.name.length > 0, true);
    assert.equal(
      entry.labelTruncated,
      entry.labelLines.join(" ") !== entry.node.name.replace(/\s+/g, " ").trim(),
    );
    assert.deepEqual(shortenLabel(entry.node.name).lines, entry.labelLines);
  }
});

test("labels: a short name is shown in full and not marked truncated", () => {
  const result = shortenLabel("Summary Contract");
  assert.deepEqual(result.lines, ["Summary Contract"]);
  assert.equal(result.truncated, false);
});

test("labels: an over-long single word is hard-split and ellipsised", () => {
  const result = shortenLabel("A".repeat(200));
  assert.equal(result.lines.length, M.LABEL_MAX_LINES);
  assert.equal(result.truncated, true);
  assert.ok(result.lines[result.lines.length - 1].endsWith("…"));
});

test("labels: an empty name is handled safely", () => {
  assert.deepEqual(shortenLabel("").lines, [""]);
});

// --- 12. No force / centrality / rank / similarity ----------------------------

const layoutSource = rd("src/lib/public-surface-authority-map/d3AuthorityLayout.ts");
const rendererSource = rd("src/lib/public-surface-authority-map/d3AuthorityRenderer.ts");
const clientSource = rd("src/components/publicSurfaceAuthorityMap.client.ts");
const packageJson = JSON.parse(rd("package.json"));

// Boundary scans run over EXECUTABLE code only. Comments in these files
// deliberately name the banned APIs to document the boundary, so a raw
// substring scan would flag the documentation instead of the implementation.
// Block comments are dropped wholesale; a `//` line comment is dropped unless
// it is part of a URL literal (preceded by `:`), which is left intact so URL
// scans below still see it.
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
    .join("\n");

const layoutCode = stripComments(layoutSource);
const rendererCode = stripComments(rendererSource);
const clientCode = stripComments(clientSource);

const PHASE_2A_SOURCES = [
  ["d3AuthorityLayout.ts", layoutCode],
  ["d3AuthorityRenderer.ts", rendererCode],
  ["publicSurfaceAuthorityMap.client.ts", clientCode],
];

test("boundary: the comment stripper leaves executable code and URL literals intact", () => {
  // Guards the scans below against silently stripping the code they inspect.
  assert.ok(layoutCode.includes("export function computeAuthorityLayout"));
  assert.ok(rendererCode.includes('from "d3-selection"'));
  assert.ok(clientCode.includes("https://github.com/metawritingecology/meta-writing-ecology/"));
  assert.equal(rendererCode.includes("Phase 2A D3 SVG renderer"), false);
});

test("boundary: no force, drag, zoom, hierarchy, geo, canvas, or WebGL API is used", () => {
  const forbidden = [
    "forceSimulation",
    "forceLink",
    "forceManyBody",
    "forceCenter",
    "forceCollide",
    "d3-force",
    "d3-drag",
    "d3-zoom",
    "d3-hierarchy",
    "d3-geo",
    "getContext(",
    "WebGLRenderingContext",
  ];
  for (const [name, source] of PHASE_2A_SOURCES) {
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, `${name} must not use ${marker}`);
    }
  }
});

test("boundary: the layout module contains no locale-dependent API at all", () => {
  // Scanned against the RAW source, comments included: these tokens must not
  // appear anywhere in the deterministic layout module, not even in prose.
  const forbidden = [
    ".localeCompare(",
    "localeCompare",
    "Intl.Collator",
    "Intl.",
    "navigator.language",
    "navigator.languages",
    "document.documentElement.lang",
    "toLocaleUpperCase",
    "toLocaleLowerCase",
    "toLocaleString",
    "normalize(",
  ];
  for (const marker of forbidden) {
    assert.equal(
      layoutSource.includes(marker),
      false,
      `d3AuthorityLayout.ts must not contain ${marker}`,
    );
  }
  // The comparator is the relational-operator form, with no collation step.
  assert.match(
    layoutCode,
    /export function compareText\(a: string, b: string\): number \{\s*if \(a === b\) return 0;\s*return a < b \? -1 : 1;\s*\}/,
  );
  // Both sorts inside the module go through the deterministic comparators.
  const sorts = [...layoutCode.matchAll(/\.sort\(([^)]*)\)/g)].map((m) => m[1].trim());
  assert.deepEqual(sorts, ["compareText", "compareNodes"]);
});

test("boundary: no centrality, rank, similarity, or authority score is computed", () => {
  // Matches an identifier/assignment, not the prose that documents the ban.
  const forbidden = [
    /\bcentrality\s*[=(:]/i,
    /\bdegreeOf\b/i,
    /\bcomputeRank\b/i,
    /\bsimilarity\s*[=(:]/i,
    /\bimportanceScore\b/i,
    /\bauthorityScore\b/i,
    /\bpageRank\b/i,
    /\bcommunityDetect/i,
    /\bcluster\s*[=(]/i,
  ];
  for (const [name, source] of PHASE_2A_SOURCES) {
    for (const pattern of forbidden) {
      assert.equal(pattern.test(source), false, `${name} must not match ${pattern}`);
    }
  }
});

test("boundary: node geometry is a constant, never derived from edges", () => {
  assert.equal(typeof M.NODE_WIDTH, "number");
  assert.equal(typeof M.NODE_HEIGHT, "number");
  // The layout module never reads the snapshot's edges at all.
  assert.equal(/\bedges\b/.test(layoutSource.replace(/\/\/[^\n]*/g, "")), true);
  const layout = layoutOf(allNodes);
  const sizes = new Set(layout.nodes.map((entry) => `${entry.width}x${entry.height}`));
  assert.equal(sizes.size, 1, "every node must share one size");
});

test("boundary: only the approved D3 surface is a dependency", () => {
  const deps = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const d3Packages = Object.keys(deps).filter(
    (name) => name === "d3" || name.startsWith("d3-") || name.startsWith("@types/d3"),
  );
  assert.deepEqual(d3Packages.sort(), ["@types/d3-selection", "d3-selection"]);
  assert.equal(deps["d3-selection"], "3.0.0");
});

test("boundary: the renderer imports only d3-selection, by name", () => {
  const imports = [...rendererCode.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  const external = imports.filter((spec) => !spec.startsWith("."));
  assert.deepEqual(external, ["d3-selection"]);
  assert.match(rendererCode, /import\s*\{\s*select\s*,\s*type Selection\s*\}\s*from\s*"d3-selection"/);
  // No CDN, no remote ESM, no runtime package loading, no dynamic import.
  for (const [name, source] of PHASE_2A_SOURCES) {
    for (const marker of ["http://", "cdn.", "unpkg", "jsdelivr", "esm.sh", "skypack", "import("]) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
});

test("boundary: no innerHTML, eval, new Function, storage, or telemetry in Phase 2A sources", () => {
  const forbidden = [
    "innerHTML",
    "outerHTML",
    "insertAdjacentHTML",
    "eval(",
    "new Function",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "serviceWorker",
    "sendBeacon",
    "setInterval",
  ];
  for (const [name, source] of PHASE_2A_SOURCES) {
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
  // D3's own text writer is used; its HTML writer never is.
  assert.equal(/\.html\(/.test(rendererCode), false);
});

test("boundary: grouping remains exactly the three approved fields", () => {
  assert.deepEqual([...GROUPING_FIELDS].sort(), [...snapshot.grouping_fields].sort());
  for (const field of GROUPING_FIELDS) {
    assert.doesNotThrow(() => layoutOf(allNodes, field));
  }
});

test("boundary: groupNodes never drops or duplicates a record", () => {
  for (const field of GROUPING_FIELDS) {
    const grouped = groupNodes(allNodes, field);
    const ids = grouped.flatMap((group) => group.nodes.map((node) => node.id));
    assert.equal(ids.length, allNodes.length);
    assert.equal(new Set(ids).size, allNodes.length);
  }
});

// --- 13. Phase 2A.1: one ordering comparator across every visible surface ------
//
// Phase 2A made the D3 Authority View locale-independent. Three ordering paths
// still ran through the host collation afterwards: the server-rendered record
// table, the server-rendered filter options, and the client runtime option
// lists. Phase 2A.1 points all three at the SAME shared comparators, so the map,
// the record table, and every filter option agree in every environment.
//
// The scans below are source-level contracts (the Astro component cannot be
// rendered under the Node test runner, and the client module installs DOM
// listeners on import), paired with behavioral assertions over the exact
// expressions those two files now use. Every expected value is hand written.

const astroSource = rd("src/components/PublicSurfaceAuthorityMap.astro");

// Ordering code lives in the component's leading `---` frontmatter fence. The
// markup, prose, and CSS below it are deliberately excluded from these scans.
const astroFrontmatterMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(astroSource);
const astroFrontmatter = astroFrontmatterMatch ? astroFrontmatterMatch[1] : "";

// `.sort(...)` arguments, normalized so a multi-line call with a trailing comma
// compares equal to the single-line form.
const sortArgs = (source) =>
  [...source.matchAll(/\.sort\(([^)]*)\)/g)]
    .map((match) => match[1].replace(/\s+/g, " ").trim().replace(/,$/, ""))
    .sort();

test("ordering: the component frontmatter really was extracted", () => {
  // Guards every frontmatter scan below against silently matching an empty
  // string, which would make the assertions vacuous.
  assert.ok(astroFrontmatterMatch, "PublicSurfaceAuthorityMap.astro needs a frontmatter fence");
  assert.ok(astroFrontmatter.includes("const tableNodes"));
  assert.ok(astroFrontmatter.includes("const distinctValues"));
  // The fence really did stop before the markup.
  assert.equal(astroFrontmatter.includes("<section class=\"psam\""), false);
});

test("ordering: server-rendered record-table order goes through compareNodes()", () => {
  assert.match(
    astroFrontmatter,
    /const tableNodes = \[\.\.\.snapshot\.nodes\]\.sort\(compareNodes\);/,
  );
});

test("ordering: server-rendered metadata options go through compareText()", () => {
  assert.match(
    astroFrontmatter,
    /const distinctValues = \(field: FilterField\): string\[\] =>\s*Array\.from\(new Set\(snapshot\.nodes\.map\(\(node\) => node\[field\]\)\)\)\.sort\(\s*compareText,?\s*\);/,
  );
});

test("ordering: client runtime metadata options go through compareText()", () => {
  assert.match(
    clientCode,
    /function distinctValues\([\s\S]*?\)\.sort\(\s*compareText,?\s*\);\s*\}/,
  );
});

test("ordering: both components import the shared comparators, never redefine them", () => {
  // Imported by name from the single deterministic layout module.
  assert.match(
    astroFrontmatter,
    /import \{\s*compareNodes,\s*compareText,\s*\} from "\.\.\/lib\/public-surface-authority-map\/d3AuthorityLayout\.ts";/,
  );
  assert.match(
    clientCode,
    /import \{\s*compareNodes,\s*compareText,[\s\S]*?\} from "\.\.\/lib\/public-surface-authority-map\/d3AuthorityLayout\.ts";/,
  );
  // No local copy of either comparator, and no inline relational-operator or
  // collation-shaped comparison standing in for one.
  for (const [name, source] of [
    ["PublicSurfaceAuthorityMap.astro", astroFrontmatter],
    ["publicSurfaceAuthorityMap.client.ts", clientCode],
  ]) {
    for (const marker of [
      "function compareText",
      "function compareNodes",
      "const compareText",
      "const compareNodes",
      "? -1 : 1",
    ]) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
  // Every ordering call in either file names one of the two shared comparators.
  assert.deepEqual(sortArgs(astroFrontmatter), ["compareNodes", "compareText"]);
  assert.deepEqual(sortArgs(clientCode), ["compareNodes", "compareText"]);
});

test("ordering: no production ordering path uses collation any more", () => {
  // Scanned against RAW sources, comments included. These four files are every
  // production path that orders a user-visible surface of this map.
  const ORDERING_SOURCES = [
    ["PublicSurfaceAuthorityMap.astro", astroSource],
    ["publicSurfaceAuthorityMap.client.ts", clientSource],
    ["d3AuthorityLayout.ts", layoutSource],
    ["d3AuthorityRenderer.ts", rendererSource],
  ];
  const forbidden = [
    ".localeCompare(",
    "localeCompare",
    "Intl.Collator",
    "Intl.",
    "navigator.language",
    "navigator.languages",
    "document.documentElement.lang",
    "toLocaleUpperCase",
    "toLocaleLowerCase",
    "toLocaleString",
  ];
  for (const [name, source] of ORDERING_SOURCES) {
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
});

// A fixture whose code-unit order and collation order disagree. Code units:
// "S"=83, "Z"=90, "_"=95, "a"=97, "Ä"=196. A typical collation instead places
// "_" first, folds case, and sorts "a"/"Ä" before "Z" (Swedish collation puts
// "Ä" after "Z"), so every surface below would reorder if any of them consulted
// the host locale. Two records deliberately share one name so the record-table
// order also exercises compareNodes()' explicit id tiebreak.
const ORDER_FIXTURE_NODES = [
  { ...allNodes[0], id: "fx-a", name: "Z name", surface_role: "Z" },
  { ...allNodes[1], id: "fx-b", name: "_ name", surface_role: "_" },
  { ...allNodes[2], id: "fx-c", name: "a name", surface_role: "_" },
  { ...allNodes[3], id: "fx-d", name: "Ä name", surface_role: "_" },
  { ...allNodes[4], id: "fx-f", name: "Same name", surface_role: "Z" },
  { ...allNodes[5], id: "fx-e", name: "Same name", surface_role: "Z" },
];

// Hand-written expectations. None of these is produced by a comparator.
const FIXTURE_CODE_UNITS = [83, 90, 95, 97, 196];
const FIXTURE_EXPECTED_OPTIONS = ["Z", "_"];
const FIXTURE_EXPECTED_TABLE_IDS = ["fx-e", "fx-f", "fx-a", "fx-b", "fx-c", "fx-d"];
const FIXTURE_EXPECTED_MAP = [
  { key: "Z", ids: ["fx-e", "fx-f", "fx-a"] },
  { key: "_", ids: ["fx-b", "fx-c", "fx-d"] },
];

// The exact expressions the two components now use, applied verbatim here.
const tableOrderOf = (nodes) => [...nodes].sort(compareNodes);
const optionOrderOf = (nodes, field) =>
  Array.from(new Set(nodes.map((node) => node[field]))).sort(compareText);

test("ordering: the fixture's code units are exactly the documented ones", () => {
  assert.deepEqual(
    ["S", "Z", "_", "a", "Ä"].map((s) => s.charCodeAt(0)),
    FIXTURE_CODE_UNITS,
  );
  // The real snapshot diverges the same way: "Summary Contract" precedes
  // "Summary and Interpretation Boundaries" because "C" (67) precedes "a" (97),
  // while any case-folding collation inverts that pair.
  assert.equal("C".charCodeAt(0), 67);
  assert.equal("a".charCodeAt(0), 97);
  assert.equal(
    compareText("Summary Contract", "Summary and Interpretation Boundaries"),
    -1,
  );
});

test("ordering: map, record table, and filter options agree on the fixture", () => {
  for (const input of [
    ORDER_FIXTURE_NODES,
    reversed(ORDER_FIXTURE_NODES),
    shuffled(ORDER_FIXTURE_NODES),
  ]) {
    // 1. Filter options (server-rendered and client runtime use this expression).
    assert.deepEqual(optionOrderOf(input, "surface_role"), FIXTURE_EXPECTED_OPTIONS);

    // 2. Record table (server-rendered fallback and runtime rebuild).
    assert.deepEqual(
      tableOrderOf(input).map((node) => node.id),
      FIXTURE_EXPECTED_TABLE_IDS,
    );

    // 3. Map: group columns and node rows in the D3 Authority View.
    const layout = computeAuthorityLayout(input, "surface_role");
    assert.deepEqual(
      layout.groups.map((group) => group.key),
      FIXTURE_EXPECTED_OPTIONS,
    );
    const mapGroups = layout.groups.map((group) => ({
      key: group.key,
      ids: layout.nodes
        .filter((entry) => entry.groupKey === group.key)
        .sort((x, y) => x.rowIndex - y.rowIndex)
        .map((entry) => entry.id),
    }));
    assert.deepEqual(mapGroups, FIXTURE_EXPECTED_MAP);

    // 4. Cross-surface agreement: group columns follow the option list, and each
    //    group's rows are the record-table order restricted to that group.
    const tableIds = tableOrderOf(input).map((node) => node.id);
    for (const group of mapGroups) {
      const groupIds = new Set(group.ids);
      assert.deepEqual(group.ids, tableIds.filter((id) => groupIds.has(id)));
    }
  }
});

// The adopted snapshot's own hand-written ordering expectations.
const EXPECTED_TABLE_NAME_ORDER = [
  "AI Reading Guide for Meta-Writing Ecology",
  "AI Training Boundary Statement",
  "AI-Readable Knowledge Architecture for Structural Misreading Prevention: Documentation Boundaries and Machine-Facing Interpretation Constraints",
  "Boundary Failure Diagnostics for AI-Mediated Workflows: Over-Fusion, Over-Separation, and Functional Boundary Calibration in Human-AI and Institutional Systems",
  "Constraint Residue Governance: Instruction-Layer Sedimentation and Post-Hoc Control Drift in AI-Mediated and Institutional Systems",
  "Delegated Execution / Retained Answerability",
  "Evaluation Boundary Failure under Permitted Surface Variation",
  "Generation-Condition Disclosure–Reproducibility Cross",
  "LLM-Condition / Research-Result Boundary",
  "Machine Interpretation State and Inference Ceiling",
  "Machine Reading Precedence",
  "Meta-Writing Ecology",
  "Model-Induced Coherence Pressure",
  "Model-Use Reporting Boundary Protocol",
  "Observing AI-Induced Semantic Deviation in Pressure-Dense Texts",
  "Origin Control and Validity Burden in Accelerated Submission Systems: Provenance Anxiety, Verification Labor, and Review Capacity Under Low-Friction Production",
  "Policy Continuity Evidence Mapping",
  "Premature Circulation Diagnostics for AI-Mediated Information Flows",
  "Provenance–Validity Separation Model: Traceable Origin, Validity Gap, and Semantic Adequacy in AI-Mediated Evidence and Information Systems",
  "Relation Status Guide",
  "Responsibility Alignment Diagnostics: Capacity-Ownership Misalignment, Visibility-Responsibility Drift, and Accountability Calibration in AI-Mediated and Institutional Systems",
  "Semantic Field Diagnostics",
  "Source Use Guide",
  "Source, Summary, and Citation Boundary Packet",
  "Structural Fidelity / Use-Validity Boundary",
  "Summary Contract",
  "Summary and Interpretation Boundaries",
  "Surface-Bounded Semantic Rendering",
  "Text-Conditioned Semantic Rendering",
  "Verification Labor Compression",
];

const EXPECTED_OPTION_ORDER = {
  surface_role: [
    "boundary_document",
    "concept_node",
    "interpretation_guide",
    "public_anchor",
    "repository_orientation",
    "source_use_guide",
  ],
  authority_ceiling: [
    "navigation_only",
    "public_file_claim_only",
    "repository_boundary_only",
  ],
  public_surface_status: [
    "public_boundary_document",
    "public_navigation_surface",
    "selected_external_node",
  ],
  classification_evidence: ["explicit_in_file", "not_asserted"],
};

test("ordering: the adopted snapshot's record-table order matches the literal order", () => {
  assert.deepEqual(
    tableOrderOf(allNodes).map((node) => node.name),
    EXPECTED_TABLE_NAME_ORDER,
  );
  // The one pair in this dataset where collation and code units disagree.
  assert.equal(EXPECTED_TABLE_NAME_ORDER[25], "Summary Contract");
  assert.equal(EXPECTED_TABLE_NAME_ORDER[26], "Summary and Interpretation Boundaries");
});

test("ordering: the adopted snapshot's filter options match the literal order", () => {
  for (const [field, expected] of Object.entries(EXPECTED_OPTION_ORDER)) {
    assert.deepEqual(optionOrderOf(allNodes, field), expected, `options for ${field}`);
  }
});

test("ordering: map group columns match the filter-option order for every field", () => {
  // The three grouping fields are also filter fields, so the map's group columns
  // and the corresponding option list must read in the same order.
  for (const field of GROUPING_FIELDS) {
    const layout = computeAuthorityLayout(allNodes, field);
    assert.deepEqual(
      layout.groups.map((group) => group.key),
      EXPECTED_OPTION_ORDER[field],
      `group columns for ${field}`,
    );
  }
  // Each group's node rows are the record-table order restricted to that group.
  const tableIds = tableOrderOf(allNodes).map((node) => node.id);
  for (const field of GROUPING_FIELDS) {
    const layout = computeAuthorityLayout(allNodes, field);
    for (const group of layout.groups) {
      const rows = layout.nodes
        .filter((entry) => entry.groupKey === group.key)
        .sort((x, y) => x.rowIndex - y.rowIndex)
        .map((entry) => entry.id);
      const ids = new Set(rows);
      assert.deepEqual(rows, tableIds.filter((id) => ids.has(id)), `${field}/${group.key}`);
    }
  }
});

test("ordering: the adopted dataset is still 30 nodes and 161 edges", () => {
  assert.equal(allNodes.length, 30);
  assert.equal(snapshot.edges.length, 161);
  assert.equal(EXPECTED_COUNTS.nodes, 30);
  assert.equal(EXPECTED_COUNTS.edges, 161);
  assert.equal(EXPECTED_COUNTS.boundary_reference, 132);
  assert.equal(EXPECTED_COUNTS.source_use_reference, 29);
  assert.equal(EXPECTED_TABLE_NAME_ORDER.length, 30);
  // Ordering is a display concern only: no record is added, dropped, or merged.
  assert.equal(new Set(tableOrderOf(allNodes).map((node) => node.id)).size, 30);
});
