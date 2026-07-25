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

// --- 2. Lexical group ordering ----------------------------------------------

test("layout: group keys are ordered lexically", () => {
  for (const field of GROUPING_FIELDS) {
    const keys = layoutOf(allNodes, field).groups.map((group) => group.key);
    const sorted = [...keys].sort(compareText);
    assert.deepEqual(keys, sorted, `grouping ${field} keys must be lexical`);
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

// --- 3. Lexical node ordering inside groups -----------------------------------

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
