// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Phase 2B-2 spatial keyboard-navigation tests.
//
// These exercise the ACTUAL production resolver against (a) explicit synthetic
// index fixtures and (b) the ACTUAL adopted 30-node snapshot run through the
// ACTUAL deterministic layout. Every expected node id below is HAND WRITTEN from
// the layout's own published indices; none is produced by the resolver under
// test.
//
// The wiring that lives in the client component (which installs DOM listeners on
// import and therefore cannot be executed here) is asserted as source-level
// contracts over the exact expressions that file now uses, in the same style the
// Phase 2A.1 and Phase 2B-1 tests already use.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertSnapshot } from "../../src/lib/public-surface-authority-map/contract.ts";
import { EXPECTED_COUNTS } from "../../src/lib/public-surface-authority-map/fallback.ts";
import {
  computeAuthorityLayout,
  resolveColumnsPerBand,
} from "../../src/lib/public-surface-authority-map/d3AuthorityLayout.ts";
import {
  SPATIAL_DIRECTIONS,
  directionForKey,
  resolveSpatialTarget,
} from "../../src/lib/public-surface-authority-map/d3AuthorityKeyboardNavigation.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertSnapshot(
  JSON.parse(rd("src/data/public-surface-authority-map/last-known-good.json")),
);
const allNodes = snapshot.nodes;

/** One synthetic rendered node: id plus the three transient rendering indices. */
const n = (id, bandIndex, columnIndex, rowIndex) => ({
  id,
  bandIndex,
  columnIndex,
  rowIndex,
});

const freezeAll = (nodes) => Object.freeze(nodes.map((node) => Object.freeze(node)));

// ---------------------------------------------------------------------------
// Fixture A — two bands. Band 0 has three group columns of 4, 2, and 5 rows;
// band 1 has a single group column of 2 rows.
//
//   band 0    col 0        col 1        col 2
//     row 0   a0           b0           c0
//     row 1   a1           b1           c1
//     row 2   a2                        c2
//     row 3   a3                        c3
//     row 4                             c4
//
//   band 1    col 0
//     row 0   d0
//     row 1   d1
// ---------------------------------------------------------------------------

const FIXTURE_A = freezeAll([
  n("a0", 0, 0, 0),
  n("a1", 0, 0, 1),
  n("a2", 0, 0, 2),
  n("a3", 0, 0, 3),
  n("b0", 0, 1, 0),
  n("b1", 0, 1, 1),
  n("c0", 0, 2, 0),
  n("c1", 0, 2, 1),
  n("c2", 0, 2, 2),
  n("c3", 0, 2, 3),
  n("c4", 0, 2, 4),
  n("d0", 1, 0, 0),
  n("d1", 1, 0, 1),
]);

// ---------------------------------------------------------------------------
// 0. Direction mapping.
// ---------------------------------------------------------------------------

test("0a. exactly the four arrow keys map to a direction", () => {
  assert.equal(directionForKey("ArrowUp"), "up");
  assert.equal(directionForKey("ArrowDown"), "down");
  assert.equal(directionForKey("ArrowLeft"), "left");
  assert.equal(directionForKey("ArrowRight"), "right");
  assert.deepEqual([...SPATIAL_DIRECTIONS], ["up", "down", "left", "right"]);
});

test("0b. no other key maps to a direction (no WASD, Vim, numeric, paging)", () => {
  const rejected = [
    "w",
    "a",
    "s",
    "d",
    "W",
    "A",
    "S",
    "D",
    "h",
    "j",
    "k",
    "l",
    "1",
    "2",
    "9",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Tab",
    "Enter",
    " ",
    "Spacebar",
    "Escape",
    "Up",
    "Down",
    "Left",
    "Right",
    "arrowup",
    "ARROWUP",
    "",
  ];
  for (const key of rejected) {
    assert.equal(directionForKey(key), null, `key ${JSON.stringify(key)}`);
  }
});

// ---------------------------------------------------------------------------
// 1-2. Vertical navigation inside one group column.
// ---------------------------------------------------------------------------

test("1. ArrowUp selects the preceding row in the same group column", () => {
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a2", "up"), "a1");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a1", "up"), "a0");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c4", "up"), "c3");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d1", "up"), "d0");
});

test("2. ArrowDown selects the following row in the same group column", () => {
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a0", "down"), "a1");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a2", "down"), "a3");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c0", "down"), "c1");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d0", "down"), "d1");
});

test("1-2b. vertical navigation never leaves the current band or column", () => {
  // b1 is the last row of a 2-row column that sits BESIDE a 5-row column and
  // ABOVE another band. Neither may be reached vertically.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "b1", "down"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "b0", "up"), null);
});

// ---------------------------------------------------------------------------
// 3-6. Horizontal navigation between adjacent group columns.
// ---------------------------------------------------------------------------

test("3. ArrowLeft selects the immediately preceding group column in the band", () => {
  assert.equal(resolveSpatialTarget(FIXTURE_A, "b0", "left"), "a0");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "b1", "left"), "a1");
  // From column 2 the immediately preceding column is 1, never 0.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c0", "left"), "b0");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c1", "left"), "b1");
});

test("4. ArrowRight selects the immediately following group column in the band", () => {
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a0", "right"), "b0");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a1", "right"), "b1");
  // From column 0 the immediately following column is 1, never 2.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "b0", "right"), "c0");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "b1", "right"), "c1");
});

test("5. horizontal navigation chooses the closest row in the adjacent column", () => {
  // Row 4 of a 5-row column into a 2-row column: rows 0 and 1 are 4 and 3 away,
  // so the last available nearby row (1) is chosen.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c4", "left"), "b1");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c3", "left"), "b1");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c2", "left"), "b1");
  // Row 3 of a 4-row column into a 2-row column.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a3", "right"), "b1");
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a2", "right"), "b1");
  // A row that exists in both columns is matched exactly.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a0", "right"), "b0");
});

test("6. an equal row-distance tie chooses the smaller row index", () => {
  // A deliberately SPARSE column: the deterministic layout always emits
  // contiguous rows from 0, so an exact tie is a defensive case. The resolver
  // still has to resolve it identically everywhere. Current row 2; the adjacent
  // column holds rows 1 and 3, both exactly 1 away.
  const tie = freezeAll([
    n("left-1", 0, 0, 1),
    n("left-3", 0, 0, 3),
    n("cur", 0, 1, 2),
    n("right-3", 0, 2, 3),
    n("right-1", 0, 2, 1),
  ]);
  assert.equal(resolveSpatialTarget(tie, "cur", "left"), "left-1");
  // Same tie on the right, with the array deliberately holding the larger row
  // FIRST, so array order cannot decide the outcome.
  assert.equal(resolveSpatialTarget(tie, "cur", "right"), "right-1");
});

// ---------------------------------------------------------------------------
// 7-8. No wrapping.
// ---------------------------------------------------------------------------

test("7. no direction wraps between bands", () => {
  // Bottom of the last column of band 0 must not reach band 1.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a3", "down"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c4", "down"), null);
  // Top of band 1 must not reach band 0.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d0", "up"), null);
  // Band 1 has one column: no horizontal move reaches band 0's columns.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d0", "left"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d0", "right"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d1", "left"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d1", "right"), null);
});

test("8. no direction wraps between the first and the last node", () => {
  // First node of the whole rendering.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a0", "up"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "a0", "left"), null);
  // Last node of the whole rendering.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d1", "down"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d1", "right"), null);
  // Last column of band 0 does not wrap to its first column.
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c0", "right"), null);
  assert.equal(resolveSpatialTarget(FIXTURE_A, "c4", "right"), null);
});

// ---------------------------------------------------------------------------
// 9-12. Degenerate and boundary layouts.
// ---------------------------------------------------------------------------

test("9. a one-column responsive layout makes left and right safe no-ops", () => {
  // What `resolveColumnsPerBand` produces at a narrow width: every group gets
  // its own band at column 0.
  const oneColumn = freezeAll([
    n("g0-r0", 0, 0, 0),
    n("g0-r1", 0, 0, 1),
    n("g1-r0", 1, 0, 0),
    n("g2-r0", 2, 0, 0),
  ]);
  for (const id of ["g0-r0", "g0-r1", "g1-r0", "g2-r0"]) {
    assert.equal(resolveSpatialTarget(oneColumn, id, "left"), null, `${id} left`);
    assert.equal(resolveSpatialTarget(oneColumn, id, "right"), null, `${id} right`);
  }
  // Vertical navigation still works inside the one column of a band.
  assert.equal(resolveSpatialTarget(oneColumn, "g0-r0", "down"), "g0-r1");
  assert.equal(resolveSpatialTarget(oneColumn, "g0-r1", "up"), "g0-r0");
  // …and still does not cross a band.
  assert.equal(resolveSpatialTarget(oneColumn, "g0-r1", "down"), null);
  assert.equal(resolveSpatialTarget(oneColumn, "g1-r0", "up"), null);
});

test("10. a single-node group makes up and down safe no-ops", () => {
  assert.equal(resolveSpatialTarget(FIXTURE_A, "d0", "up"), null);
  const solo = freezeAll([n("only", 0, 0, 0), n("beside", 0, 1, 0)]);
  assert.equal(resolveSpatialTarget(solo, "only", "up"), null);
  assert.equal(resolveSpatialTarget(solo, "only", "down"), null);
  // Horizontal navigation out of a single-node group still works.
  assert.equal(resolveSpatialTarget(solo, "only", "right"), "beside");
});

test("11. a missing current node is a safe no-op in every direction", () => {
  for (const direction of SPATIAL_DIRECTIONS) {
    assert.equal(resolveSpatialTarget(FIXTURE_A, "not-rendered", direction), null);
    assert.equal(resolveSpatialTarget(FIXTURE_A, null, direction), null);
    assert.equal(resolveSpatialTarget(FIXTURE_A, "", direction), null);
  }
});

test("12. an empty layout is a safe no-op in every direction", () => {
  for (const direction of SPATIAL_DIRECTIONS) {
    assert.equal(resolveSpatialTarget([], "a0", direction), null);
    assert.equal(resolveSpatialTarget([], null, direction), null);
  }
  const empty = computeAuthorityLayout([], "surface_role", { columnsPerBand: 6 });
  assert.equal(empty.isEmpty, true);
  assert.equal(empty.nodes.length, 0);
  for (const direction of SPATIAL_DIRECTIONS) {
    assert.equal(resolveSpatialTarget(empty.nodes, "README.md", direction), null);
  }
});

// ---------------------------------------------------------------------------
// The real adopted snapshot through the real deterministic layout.
//
// Published indices at the desktop layout (grouped by surface_role, six group
// columns in one band), read from the layout module's own output and written
// out by hand here:
//
//   col 0 boundary_document       rows 0-2
//   col 1 concept_node            rows 0-20
//   col 2 interpretation_guide    rows 0-2
//   col 3 public_anchor           row 0
//   col 4 repository_orientation  row 0
//   col 5 source_use_guide        row 0
// ---------------------------------------------------------------------------

const DESKTOP_GROUPS = 6;
const desktop = computeAuthorityLayout(allNodes, "surface_role", {
  columnsPerBand: DESKTOP_GROUPS,
});

test("real snapshot: the desktop layout has the hand-written indices used below", () => {
  const index = new Map(
    desktop.nodes.map((node) => [
      node.id,
      `${node.bandIndex}/${node.columnIndex}/${node.rowIndex}`,
    ]),
  );
  const EXPECTED = {
    "MACHINE_INTERPRETATION_STATE.md": "0/0/0",
    "SUMMARY_CONTRACT.md": "0/0/1",
    "SUMMARY_BOUNDARIES.md": "0/0/2",
    "ai-readable-knowledge-architecture.md": "0/1/0",
    "boundary-failure-diagnostics.md": "0/1/1",
    "constraint-residue-governance.md": "0/1/2",
    "verification-labor-compression.md": "0/1/20",
    "AI-READING-GUIDE.md": "0/2/0",
    "MACHINE_READING_PRECEDENCE.md": "0/2/1",
    "RELATION_STATUS_GUIDE.md": "0/2/2",
    "public-anchors/ai-training-boundary-statement.md": "0/3/0",
    "README.md": "0/4/0",
    "SOURCE_USE_GUIDE.md": "0/5/0",
  };
  for (const [id, position] of Object.entries(EXPECTED)) {
    assert.equal(index.get(id), position, id);
  }
  assert.equal(desktop.nodes.length, 30);
  assert.equal(desktop.groups.length, DESKTOP_GROUPS);
});

test("real snapshot: vertical navigation inside one group column", () => {
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "SUMMARY_CONTRACT.md", "up"),
    "MACHINE_INTERPRETATION_STATE.md",
  );
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "SUMMARY_CONTRACT.md", "down"),
    "SUMMARY_BOUNDARIES.md",
  );
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "ai-readable-knowledge-architecture.md", "down"),
    "boundary-failure-diagnostics.md",
  );
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "constraint-residue-governance.md", "up"),
    "boundary-failure-diagnostics.md",
  );
  // Column boundaries.
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "MACHINE_INTERPRETATION_STATE.md", "up"),
    null,
  );
  assert.equal(resolveSpatialTarget(desktop.nodes, "SUMMARY_BOUNDARIES.md", "down"), null);
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "verification-labor-compression.md", "down"),
    null,
  );
  // A single-node group column.
  assert.equal(resolveSpatialTarget(desktop.nodes, "README.md", "up"), null);
  assert.equal(resolveSpatialTarget(desktop.nodes, "README.md", "down"), null);
});

test("real snapshot: horizontal navigation between adjacent group columns", () => {
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "SUMMARY_BOUNDARIES.md", "right"),
    "constraint-residue-governance.md",
  );
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "AI-READING-GUIDE.md", "left"),
    "ai-readable-knowledge-architecture.md",
  );
  // Nearest row into a much shorter column: row 20 into a 3-row column.
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "verification-labor-compression.md", "left"),
    "SUMMARY_BOUNDARIES.md",
  );
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "verification-labor-compression.md", "right"),
    "RELATION_STATUS_GUIDE.md",
  );
  // Single-node columns at the right-hand end of the band.
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "README.md", "left"),
    "public-anchors/ai-training-boundary-statement.md",
  );
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "README.md", "right"),
    "SOURCE_USE_GUIDE.md",
  );
  // Band edges do not wrap.
  assert.equal(
    resolveSpatialTarget(desktop.nodes, "MACHINE_INTERPRETATION_STATE.md", "left"),
    null,
  );
  assert.equal(resolveSpatialTarget(desktop.nodes, "SOURCE_USE_GUIDE.md", "right"), null);
});

test("9b. real snapshot: the narrow responsive layout is one column per band", () => {
  const columns = resolveColumnsPerBand(375, DESKTOP_GROUPS);
  assert.equal(columns, 1);
  const narrow = computeAuthorityLayout(allNodes, "surface_role", {
    columnsPerBand: columns,
  });
  for (const node of narrow.nodes) {
    assert.equal(node.columnIndex, 0);
  }
  for (const node of narrow.nodes) {
    assert.equal(resolveSpatialTarget(narrow.nodes, node.id, "left"), null, node.id);
    assert.equal(resolveSpatialTarget(narrow.nodes, node.id, "right"), null, node.id);
  }
  // Vertical navigation still works inside each band, and still does not wrap.
  assert.equal(
    resolveSpatialTarget(narrow.nodes, "MACHINE_INTERPRETATION_STATE.md", "down"),
    "SUMMARY_CONTRACT.md",
  );
  assert.equal(
    resolveSpatialTarget(narrow.nodes, "SUMMARY_BOUNDARIES.md", "down"),
    null,
  );
  assert.equal(resolveSpatialTarget(narrow.nodes, "README.md", "up"), null);
  assert.equal(resolveSpatialTarget(narrow.nodes, "README.md", "down"), null);
});

test("13. filtered layouts consider only the currently rendered nodes", () => {
  // Only boundary_document + interpretation_guide survive the filter, so the
  // rendered band is TWO columns and the concept_node column does not exist.
  const kept = new Set(["boundary_document", "interpretation_guide"]);
  const filtered = allNodes.filter((node) => kept.has(node.surface_role));
  const layout = computeAuthorityLayout(filtered, "surface_role", {
    columnsPerBand: 2,
  });
  assert.equal(layout.nodes.length, 6);
  assert.equal(layout.groups.length, 2);

  // Right from column 0 now reaches interpretation_guide directly, NOT the
  // concept_node column that the unfiltered layout puts in between.
  assert.equal(
    resolveSpatialTarget(layout.nodes, "SUMMARY_BOUNDARIES.md", "right"),
    "RELATION_STATUS_GUIDE.md",
  );
  assert.equal(
    resolveSpatialTarget(layout.nodes, "MACHINE_INTERPRETATION_STATE.md", "right"),
    "AI-READING-GUIDE.md",
  );
  // A filtered-out node is not a valid current node and is never a target.
  for (const direction of SPATIAL_DIRECTIONS) {
    assert.equal(
      resolveSpatialTarget(layout.nodes, "verification-labor-compression.md", direction),
      null,
    );
  }
  const ids = new Set(layout.nodes.map((node) => node.id));
  for (const id of ids) {
    for (const direction of SPATIAL_DIRECTIONS) {
      const target = resolveSpatialTarget(layout.nodes, id, direction);
      if (target !== null) {
        assert.equal(ids.has(target), true, `${id} ${direction} -> ${target}`);
      }
    }
  }
  // Right from the last rendered column is still a no-op.
  assert.equal(
    resolveSpatialTarget(layout.nodes, "AI-READING-GUIDE.md", "right"),
    null,
  );
});

test("14. input-array reversal or shuffling does not change any target", () => {
  const reversed = [...allNodes].reverse();
  // A fixed, hand-written permutation — no randomness takes part.
  const shuffled = [...allNodes];
  const swaps = [
    [0, 17],
    [1, 29],
    [2, 8],
    [3, 21],
    [4, 12],
    [5, 25],
    [6, 14],
    [7, 19],
    [9, 28],
    [10, 22],
  ];
  for (const [i, j] of swaps) {
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  for (const variant of [reversed, shuffled]) {
    const layout = computeAuthorityLayout(variant, "surface_role", {
      columnsPerBand: DESKTOP_GROUPS,
    });
    // Hand-written expectations, identical to the canonical-order assertions.
    assert.equal(
      resolveSpatialTarget(layout.nodes, "SUMMARY_CONTRACT.md", "up"),
      "MACHINE_INTERPRETATION_STATE.md",
    );
    assert.equal(
      resolveSpatialTarget(layout.nodes, "SUMMARY_CONTRACT.md", "down"),
      "SUMMARY_BOUNDARIES.md",
    );
    assert.equal(
      resolveSpatialTarget(layout.nodes, "AI-READING-GUIDE.md", "left"),
      "ai-readable-knowledge-architecture.md",
    );
    assert.equal(
      resolveSpatialTarget(layout.nodes, "SUMMARY_BOUNDARIES.md", "right"),
      "constraint-residue-governance.md",
    );
    assert.equal(
      resolveSpatialTarget(layout.nodes, "verification-labor-compression.md", "left"),
      "SUMMARY_BOUNDARIES.md",
    );
    assert.equal(resolveSpatialTarget(layout.nodes, "SOURCE_USE_GUIDE.md", "right"), null);
  }

  // Reversing the RESOLVER's own input array (without re-running the layout)
  // also changes nothing.
  const reversedRendered = [...desktop.nodes].reverse();
  assert.equal(
    resolveSpatialTarget(reversedRendered, "verification-labor-compression.md", "right"),
    "RELATION_STATUS_GUIDE.md",
  );
  assert.equal(
    resolveSpatialTarget(reversedRendered, "README.md", "left"),
    "public-anchors/ai-training-boundary-statement.md",
  );
  const reversedFixture = [...FIXTURE_A].reverse();
  assert.equal(resolveSpatialTarget(reversedFixture, "c4", "left"), "b1");
  assert.equal(resolveSpatialTarget(reversedFixture, "a2", "down"), "a3");
});

test("16. resolution does not modify the layout or any node object", () => {
  const before = JSON.stringify(
    desktop.nodes.map((node) => [
      node.id,
      node.bandIndex,
      node.columnIndex,
      node.rowIndex,
    ]),
  );
  const idsBefore = desktop.nodes.map((node) => node.id).join("|");
  for (const node of desktop.nodes) {
    for (const direction of SPATIAL_DIRECTIONS) {
      resolveSpatialTarget(desktop.nodes, node.id, direction);
    }
  }
  const after = JSON.stringify(
    desktop.nodes.map((node) => [
      node.id,
      node.bandIndex,
      node.columnIndex,
      node.rowIndex,
    ]),
  );
  assert.equal(after, before);
  // Array order itself is untouched (no in-place sort).
  assert.equal(desktop.nodes.map((node) => node.id).join("|"), idsBefore);
  // A frozen input proves no write is even attempted (strict mode would throw).
  for (const direction of SPATIAL_DIRECTIONS) {
    assert.doesNotThrow(() => resolveSpatialTarget(FIXTURE_A, "c2", direction));
  }
});

test("determinism: every reachable target is reciprocal-free of host state", () => {
  // The same call, repeated, returns the same answer; and the resolver depends
  // on no argument beyond the three indices, so a structurally identical but
  // distinct object collection resolves identically.
  const clone = desktop.nodes.map((node) => ({
    id: node.id,
    bandIndex: node.bandIndex,
    columnIndex: node.columnIndex,
    rowIndex: node.rowIndex,
  }));
  for (const node of desktop.nodes) {
    for (const direction of SPATIAL_DIRECTIONS) {
      const a = resolveSpatialTarget(desktop.nodes, node.id, direction);
      const b = resolveSpatialTarget(desktop.nodes, node.id, direction);
      const c = resolveSpatialTarget(clone, node.id, direction);
      assert.equal(a, b);
      assert.equal(a, c, `${node.id} ${direction}`);
    }
  }
});

test("24. the dataset remains 30 nodes and 161 edges", () => {
  assert.equal(snapshot.nodes.length, 30);
  assert.equal(snapshot.edges.length, 161);
  assert.equal(EXPECTED_COUNTS.nodes, 30);
  assert.equal(EXPECTED_COUNTS.edges, 161);
  assert.equal(snapshot.edge_counts.boundary_reference, 132);
  assert.equal(snapshot.edge_counts.source_use_reference, 29);
  assert.equal(snapshot.self_references_omitted_count, 7);
  assert.equal(desktop.nodes.length, 30);
});

// ---------------------------------------------------------------------------
// Source-level contracts.
// ---------------------------------------------------------------------------

const navSource = rd(
  "src/lib/public-surface-authority-map/d3AuthorityKeyboardNavigation.ts",
);
const clientSource = rd("src/components/publicSurfaceAuthorityMap.client.ts");
const rendererSource = rd("src/lib/public-surface-authority-map/d3AuthorityRenderer.ts");
const astroSource = rd("src/components/PublicSurfaceAuthorityMap.astro");
const packageJson = JSON.parse(rd("package.json"));

// Boundary scans run over EXECUTABLE code only. These files deliberately name
// the banned APIs and concepts in prose to document the boundary, so a raw
// substring scan would flag the documentation instead of the implementation.
// Identical to the stripper the Phase 2A / 2B-1 boundary tests already use.
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
    .join("\n");

const navCode = stripComments(navSource);
const clientCode = stripComments(clientSource);
const rendererCode = stripComments(rendererSource);

test("scan: the comment stripper leaves executable code intact", () => {
  // Guards every scan below against silently matching an empty string.
  assert.ok(navCode.includes("export function resolveSpatialTarget("));
  assert.ok(navCode.includes("export function directionForKey("));
  assert.ok(clientCode.includes('svgEl.addEventListener("keydown"'));
  assert.ok(rendererCode.includes('.attr("tabindex", 0)'));
  // …and that it really does remove prose.
  assert.ok(navSource.includes("snapshot edges"));
  assert.ok(!navCode.includes("snapshot edges"));
});

test("15. resolution uses no edge, relation, metadata, or ranking input", () => {
  const FORBIDDEN = [
    "edge",
    "Edge",
    "relation",
    "Relation",
    "boundary_reference",
    "source_use_reference",
    "surface_role",
    "authority_ceiling",
    "public_surface_status",
    "classification_evidence",
    "relation_default",
    "canonical_public_url",
    "snapshot",
    "Snapshot",
    "degree",
    "centrality",
    "rank",
    "weight",
    "score",
    "similar",
    "distance",
    "cluster",
    "hierarch",
    "routing",
    "selected",
    "viewport",
    "scale",
  ];
  const offenders = FORBIDDEN.filter((marker) => navCode.includes(marker));
  assert.deepEqual(offenders, []);

  // The module's ONLY import is the shared deterministic comparator.
  const imports = navCode.match(/^import[\s\S]*?;$/gm) ?? [];
  assert.equal(imports.length, 1);
  assert.ok(imports[0].includes("compareText"));
  assert.ok(imports[0].includes("./d3AuthorityLayout.ts"));
  assert.ok(!imports[0].includes("contract.ts"));
  assert.ok(!imports[0].includes("d3AuthorityViewport"));
  assert.ok(!imports[0].includes("d3-"));

  // The declared parameter surface admits only the three rendering indices.
  assert.ok(navCode.includes("readonly bandIndex: number;"));
  assert.ok(navCode.includes("readonly columnIndex: number;"));
  assert.ok(navCode.includes("readonly rowIndex: number;"));
});

test("determinism: the resolver uses no collation, DOM, time, or randomness", () => {
  const FORBIDDEN = [
    "localeCompare",
    "Intl",
    "Collator",
    "getBoundingClientRect",
    "document",
    "window",
    "navigator",
    "Math.random",
    "Date",
    "performance.now",
    "requestAnimationFrame",
    "setTimeout",
    "localStorage",
    "sessionStorage",
    "fetch(",
    ".sort(",
    ".reverse(",
    ".push(",
    "querySelector",
  ];
  const offenders = FORBIDDEN.filter((marker) => navCode.includes(marker));
  assert.deepEqual(offenders, []);
  // Only the shared code-unit comparator is used for the exact final tiebreak.
  assert.ok(navCode.includes("compareText(candidate.id, incumbent.id)"));
});

// The client's arrow-navigation listener, isolated so every assertion below is
// scoped to it rather than to the whole file.
const keydownBlock = (() => {
  const start = clientCode.indexOf('svgEl.addEventListener("keydown"');
  assert.notEqual(start, -1, "arrow-navigation keydown listener not found");
  const end = clientCode.indexOf("if (resetEl) {", start);
  assert.notEqual(end, -1);
  return clientCode.slice(start, end);
})();

test("client wiring: the listener only resolves, focuses, and reveals", () => {
  // 1. identify the focused node id …
  assert.ok(keydownBlock.includes('target.classList.contains("psam__node")'));
  assert.ok(keydownBlock.includes('target.getAttribute("data-id")'));
  // 2. … call the pure resolver against the CURRENT rendered layout …
  assert.ok(keydownBlock.includes("resolveSpatialTarget("));
  assert.ok(keydownBlock.includes("currentLayout.nodes,"));
  // 3. … focus the returned renderer element …
  assert.ok(keydownBlock.includes("renderer.nodeElements.get(nextId)"));
  assert.ok(keydownBlock.includes("nextEl.focus({ preventScroll: true })"));
  // 4. … and reuse the existing viewport reveal.
  assert.ok(keydownBlock.includes("ensureNodeVisible(nextId)"));
  // The algorithm itself is NOT inlined in the listener.
  for (const marker of ["bandIndex", "columnIndex", "rowIndex", "Math.abs"]) {
    assert.ok(!keydownBlock.includes(marker), marker);
  }
});

test("20. Ctrl, Meta and Alt with an arrow key do not trigger map navigation", () => {
  assert.ok(
    keydownBlock.includes("if (event.ctrlKey || event.metaKey || event.altKey) {"),
  );
  // The modifier guard precedes both the direction lookup and preventDefault.
  const guard = keydownBlock.indexOf("event.ctrlKey");
  const lookup = keydownBlock.indexOf("directionForKey(event.key)");
  const prevent = keydownBlock.indexOf("event.preventDefault()");
  assert.ok(guard < lookup);
  assert.ok(guard < prevent);
  // Shift is never consulted, so it cannot alter the target.
  assert.ok(!keydownBlock.includes("shiftKey"));
});

test("keys: only the four arrow keys are handled, via the pure mapper", () => {
  assert.ok(keydownBlock.includes("directionForKey(event.key)"));
  assert.ok(keydownBlock.includes("if (direction === null) {"));
  // No key literal is re-implemented in the client.
  for (const marker of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW"]) {
    assert.ok(!keydownBlock.includes(marker), marker);
  }
  // preventDefault runs for a recognized unmodified arrow while focus is inside
  // a map node — before the target is resolved, so a boundary no-op still
  // suppresses arrow scrolling.
  const prevent = keydownBlock.indexOf("event.preventDefault()");
  const resolve = keydownBlock.indexOf("resolveSpatialTarget(");
  assert.ok(prevent > 0 && prevent < resolve);
});

test("18. arrow focus movement does not select or modify aria-pressed", () => {
  const FORBIDDEN = [
    "aria-pressed",
    "selectNode(",
    "selectedId =",
    "renderDetail(",
    "clearSelection(",
    "announce(",
    "redrawRouting(",
    "draw(",
    "layout(",
    "refresh(",
    "resetViewport(",
    "viewportScale",
    "centerContentRect(",
    "jumpToGroup(",
    "aria-activedescendant",
    "tabIndex",
    "setAttribute",
  ];
  const offenders = FORBIDDEN.filter((marker) => keydownBlock.includes(marker));
  assert.deepEqual(offenders, []);
});

test("21. focus movement preserves zoom, filters, grouping and routing state", () => {
  // Nothing in the listener touches the filter inputs, grouping radios, routing
  // toggles, or the transient viewport scale.
  const FORBIDDEN = [
    "filterTextEl",
    "metadataSelects",
    "groupRadios",
    "routeSelectedEl",
    "routeGlobalEl",
    "groupJumpEl",
    "clampScale(",
    "scaleIn(",
    "scaleOut(",
    "fitViewport(",
    "scrollLeft =",
    "scrollTop =",
  ];
  const offenders = FORBIDDEN.filter((marker) => keydownBlock.includes(marker));
  assert.deepEqual(offenders, []);
});

test("22. the newly focused target is brought into view by the existing logic", () => {
  assert.ok(keydownBlock.includes("ensureNodeVisible(nextId)"));
  // `ensureNodeVisible` is the Phase 2B-1 reveal: it moves only far enough, via
  // `bringIntoViewOffset`, and never centres or resets.
  const reveal = (() => {
    const start = clientCode.indexOf("function ensureNodeVisible(");
    assert.notEqual(start, -1);
    return clientCode.slice(start, clientCode.indexOf("\n  }\n", start));
  })();
  assert.ok(reveal.includes("bringIntoViewOffset("));
  assert.ok(!reveal.includes("centeredOffset("));
  assert.ok(!reveal.includes("resetViewport("));
  assert.ok(!reveal.includes("announce("));
  assert.ok(!reveal.includes("viewportScale ="));
});

test("17. every rendered node keeps tabindex=\"0\"; no roving tabindex", () => {
  assert.ok(rendererCode.includes('.attr("tabindex", 0)'));
  for (const marker of [
    '"tabindex", -1',
    '"tabindex", "-1"',
    "aria-activedescendant",
    "roving",
  ]) {
    assert.ok(!rendererCode.includes(marker), marker);
    assert.ok(!clientCode.includes(marker), marker);
  }
  // The tabindex attribute is set once, on enter, for every node.
  assert.equal(rendererCode.split('.attr("tabindex"').length - 1, 1);
});

test("19. Enter and Space activation is unchanged", () => {
  assert.ok(
    rendererCode.includes(
      'if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {',
    ),
  );
  assert.ok(rendererCode.includes("callbacks.onActivate(node.id);"));
  // Arrow keys are NOT handled by the renderer's activation listener, so they
  // can never activate a node.
  assert.ok(!rendererCode.includes("Arrow"));
  // Click activation is unchanged too.
  assert.ok(rendererCode.includes('g.on("click"'));
});

test("23. runtime activation and rollback still restore a focusable node", () => {
  // Focus capture / restore is the existing Phase 2B path, untouched: the
  // focused node id is captured from the live DOM before the transaction, a
  // successful activation refocuses the same node when it is still rendered,
  // and a missing node falls back to the existing stable control.
  assert.ok(clientCode.includes('active.classList.contains("psam__node")'));
  assert.ok(clientCode.includes("restoreFocus(focusedNodeId);"));
  assert.ok(clientCode.includes("renderer.nodeElements.get(focusedNodeId)"));
  assert.ok(clientCode.includes("const stable = resetEl ?? filterTextEl ?? groupRadios[0] ?? null;"));
  // Rollback restores the captured active element.
  assert.ok(clientCode.includes("cap.activeEl.focus({ preventScroll: true })"));
  // Arrow navigation reads `currentLayout` and `renderer.nodeElements`, both of
  // which the activation transaction and its rollback maintain, so no separate
  // keyboard state exists that could survive either path.
  assert.ok(clientCode.includes("renderer.adoptNodeElements(new Map(cap.nodeElements))"));
  assert.ok(clientCode.includes("currentLayout = cap.layout;"));
  const KEYBOARD_STATE = [
    "lastFocusedNodeId",
    "keyboardCursor",
    "navCursor",
    "focusedIndex",
  ];
  for (const marker of KEYBOARD_STATE) {
    assert.ok(!clientCode.includes(marker), marker);
  }
});

test("25. no semantic, relation, ranking or inference path is added", () => {
  const FORBIDDEN = [
    "forceSimulation",
    "d3-force",
    "d3-zoom",
    "d3-drag",
    "d3-hierarchy",
    "similarity",
    "inferRelation",
    "promoteRelation",
    "confirmedRelation",
  ];
  for (const [name, code] of [
    ["d3AuthorityKeyboardNavigation.ts", navCode],
    ["publicSurfaceAuthorityMap.client.ts", clientCode],
    ["d3AuthorityRenderer.ts", rendererCode],
  ]) {
    for (const marker of FORBIDDEN) {
      assert.ok(!code.includes(marker), `${marker} in ${name}`);
    }
  }
  // No keyboard-navigation, focus-management, or hotkey package was added.
  const deps = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const FORBIDDEN_PACKAGES = [
    "mousetrap",
    "hotkeys-js",
    "tinykeys",
    "hotkeys",
    "focus-trap",
    "focus-visible",
    "tabbable",
    "react-hotkeys",
    "keymaster",
    "arrow-key-navigation",
    "roving-ux",
  ];
  for (const name of FORBIDDEN_PACKAGES) {
    assert.ok(!(name in deps), name);
  }
  assert.deepEqual(Object.keys(deps).sort(), [
    "@astrojs/check",
    "@astrojs/cloudflare",
    "@astrojs/mdx",
    "@astrojs/sitemap",
    "@types/d3-selection",
    "astro",
    "d3-selection",
    "fast-xml-parser",
    "typescript",
    "wrangler",
  ]);
});

test("accessibility: the map hint states focus navigation without relation language", () => {
  const start = astroSource.indexOf("data-psam-map-hint");
  assert.notEqual(start, -1);
  const hint = astroSource.slice(start, astroSource.indexOf("</p>", start));
  // Required statements.
  assert.ok(hint.includes("reachable with Tab"));
  assert.ok(hint.includes("Arrow keys move focus between"));
  assert.ok(hint.includes("visible nodes"));
  assert.ok(hint.includes("visual group column"));
  assert.ok(hint.includes("Enter or Space activates the focused node"));
  assert.ok(hint.includes("moving focus does not\n        select a node"));
  assert.ok(hint.includes("record\n        table, which remains available"));
  // Prohibited proximity language.
  for (const marker of [
    "related",
    "similar",
    "connected",
    "stronger",
    "more important",
    "higher",
    "lower authority",
    "adjacent concept",
  ]) {
    assert.ok(!hint.includes(marker), marker);
  }
});
