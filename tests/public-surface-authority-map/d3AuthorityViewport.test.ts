// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Phase 2B-1 bounded viewport-navigation tests.
//
// These exercise the ACTUAL production viewport module against the ACTUAL
// adopted 30-node snapshot and the ACTUAL deterministic layout it produces. The
// viewport module is pure (no DOM, no D3, no browser API), so it is fully
// testable under the existing Node test runner without adding a browser-testing
// framework.
//
// The wiring that lives in the client component (which installs DOM listeners on
// import and therefore cannot be executed here) is asserted as source-level
// contracts over the exact expressions that file now uses, in the same style the
// Phase 2A.1 ordering tests already use. Every expected value below is hand
// written; none is produced by the implementation under test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertSnapshot } from "../../src/lib/public-surface-authority-map/contract.ts";
import { EXPECTED_COUNTS } from "../../src/lib/public-surface-authority-map/fallback.ts";
import {
  AUTHORITY_LAYOUT_METRICS,
  computeAuthorityLayout,
  resolveColumnsPerBand,
  selectRoutingEdges,
} from "../../src/lib/public-surface-authority-map/d3AuthorityLayout.ts";
import {
  IDENTITY_VIEWPORT,
  VIEWPORT_SCALE,
  anchoredOffset,
  bringIntoViewOffset,
  centeredOffset,
  clampOffset,
  clampScale,
  computeViewportSurface,
  contentExtentOf,
  findGroup,
  findNode,
  fitScale,
  formatScalePercent,
  groupRect,
  isIdentityViewport,
  nodeRect,
  projectRect,
  roundPixel,
  roundScale,
  scaleIn,
  scaleOut,
  transformAttr,
} from "../../src/lib/public-surface-authority-map/d3AuthorityViewport.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertSnapshot(
  JSON.parse(rd("src/data/public-surface-authority-map/last-known-good.json")),
);
const allNodes = snapshot.nodes;

const GROUPING_FIELDS = [
  "surface_role",
  "authority_ceiling",
  "public_surface_status",
] as const;

const M = AUTHORITY_LAYOUT_METRICS;

const layoutOf = (nodes = allNodes, field = "surface_role", options = {}) =>
  computeAuthorityLayout(nodes, field, options);

// The exact serialization the Phase 2A layout tests use, so "did any content
// coordinate move?" is answered against the same bytes the renderer consumes.
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

// The three verified inspection widths.
const DESKTOP = 1440;
const TABLET = 834;
const MOBILE = 375;

// Hand-written geometry of the adopted snapshot at the two column policies.
// Wide: six group regions in one row. Narrow: one full-width column.
// 16 + 6 x 260 + 5 x 24 + 16 = 1712 wide; 16 + 260 + 16 = 292 for one column.
const WIDE_WIDTH = 1712;
const WIDE_HEIGHT = 1676;
const NARROW_WIDTH = 292;

// The full scale ladder, written out by hand from the fixed 1.25 step and the
// fixed 0.5 / 2.5 bounds on the fixed 4-decimal rounding grid.
const ZOOM_IN_LADDER = [1.25, 1.5625, 1.9531, 2.4414, 2.5, 2.5];
const ZOOM_OUT_LADDER = [0.8, 0.64, 0.512, 0.5, 0.5];

// ---------------------------------------------------------------------------
// 16. The adopted dataset is untouched by this phase.
// ---------------------------------------------------------------------------

test("dataset: the adopted 30-node / 161-edge snapshot is unchanged", () => {
  assert.equal(allNodes.length, 30);
  assert.equal(snapshot.edges.length, 161);
  assert.equal(EXPECTED_COUNTS.nodes, 30);
  assert.equal(EXPECTED_COUNTS.edges, 161);
  assert.equal(snapshot.edge_counts.boundary_reference, 132);
  assert.equal(snapshot.edge_counts.source_use_reference, 29);
  assert.equal(snapshot.self_references_omitted_count, 7);
});

test("layout: the wide and narrow canvases are the hand-written Phase 2A.1 sizes", () => {
  // Guards every surface expectation below against silently drifting with the
  // layout module.
  assert.equal(resolveColumnsPerBand(DESKTOP, 6), 6);
  assert.equal(resolveColumnsPerBand(TABLET, 6), 6);
  assert.equal(resolveColumnsPerBand(MOBILE, 6), 1);

  const wide = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  assert.equal(wide.width, WIDE_WIDTH);
  assert.equal(wide.height, WIDE_HEIGHT);

  const narrow = layoutOf(allNodes, "surface_role", { columnsPerBand: 1 });
  assert.equal(narrow.width, NARROW_WIDTH);
});

// ---------------------------------------------------------------------------
// 1. The identity transform is exact and stable.
// ---------------------------------------------------------------------------

test("identity: the identity transform is exactly k=1, x=0, y=0", () => {
  assert.deepEqual({ ...IDENTITY_VIEWPORT }, { k: 1, x: 0, y: 0 });
  assert.equal(VIEWPORT_SCALE.IDENTITY, 1);
  assert.equal(isIdentityViewport(IDENTITY_VIEWPORT), true);
  assert.equal(isIdentityViewport({ k: 1, x: 0, y: 0 }), true);
  assert.equal(isIdentityViewport({ k: 1.0001, x: 0, y: 0 }), false);
  assert.equal(isIdentityViewport({ k: 1, x: 0.5, y: 0 }), false);
  assert.equal(isIdentityViewport({ k: 1, x: 0, y: 0.5 }), false);
  assert.equal(transformAttr(IDENTITY_VIEWPORT), "translate(0,0) scale(1)");
  assert.equal(formatScalePercent(VIEWPORT_SCALE.IDENTITY), "100%");
});

test("identity: the surface at 100% IS the Phase 2A.1 canvas, at every width", () => {
  for (const field of GROUPING_FIELDS) {
    for (const columnsPerBand of [1, 2, 6]) {
      const layout = layoutOf(allNodes, field, { columnsPerBand });
      for (const visible of [0, MOBILE, TABLET, DESKTOP, 4000]) {
        const surface = computeViewportSurface(
          layout.width,
          layout.height,
          VIEWPORT_SCALE.IDENTITY,
          visible,
        );
        assert.equal(surface.width, layout.width, `width at ${visible}`);
        assert.equal(surface.height, layout.height, `height at ${visible}`);
        assert.equal(surface.viewBox, `0 0 ${layout.width} ${layout.height}`);
        assert.deepEqual({ ...surface.transform }, { k: 1, x: 0, y: 0 });
        assert.equal(surface.transformAttr, "translate(0,0) scale(1)");
        assert.equal(isIdentityViewport(surface.transform), true);
      }
    }
  }
});

test("identity: the surface is stable under repeated computation", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const once = computeViewportSurface(layout.width, layout.height, 1, DESKTOP);
  for (let index = 0; index < 5; index += 1) {
    assert.deepEqual(
      computeViewportSurface(layout.width, layout.height, 1, DESKTOP),
      once,
    );
  }
});

// ---------------------------------------------------------------------------
// 2 & 3. Bounded, deterministic zoom.
// ---------------------------------------------------------------------------

test("bounds: the scale extent is exactly 0.5 to 2.5", () => {
  assert.equal(VIEWPORT_SCALE.MIN, 0.5);
  assert.equal(VIEWPORT_SCALE.MAX, 2.5);
  assert.equal(VIEWPORT_SCALE.STEP, 1.25);
});

test("bounds: every candidate scale is clamped into the extent", () => {
  const CASES = [
    [0.5, 0.5],
    [2.5, 2.5],
    [1, 1],
    [0.49, 0.5],
    [0, 0.5],
    [-3, 0.5],
    [2.51, 2.5],
    [1000, 2.5],
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
    [Number.NEGATIVE_INFINITY, 1],
  ];
  for (const [input, expected] of CASES) {
    assert.equal(clampScale(input), expected, `clampScale(${input})`);
  }
  assert.equal(clampScale(undefined), 1);
  assert.equal(clampScale("2"), 1);
});

test("zoom: the zoom-in ladder is the hand-written deterministic sequence", () => {
  let scale = VIEWPORT_SCALE.IDENTITY;
  const seen = [];
  for (let step = 0; step < ZOOM_IN_LADDER.length; step += 1) {
    scale = scaleIn(scale);
    seen.push(scale);
  }
  assert.deepEqual(seen, ZOOM_IN_LADDER);
  // Saturates at the maximum and never exceeds it.
  assert.equal(scaleIn(VIEWPORT_SCALE.MAX), VIEWPORT_SCALE.MAX);
});

test("zoom: the zoom-out ladder is the hand-written deterministic sequence", () => {
  let scale = VIEWPORT_SCALE.IDENTITY;
  const seen = [];
  for (let step = 0; step < ZOOM_OUT_LADDER.length; step += 1) {
    scale = scaleOut(scale);
    seen.push(scale);
  }
  assert.deepEqual(seen, ZOOM_OUT_LADDER);
  assert.equal(scaleOut(VIEWPORT_SCALE.MIN), VIEWPORT_SCALE.MIN);
});

test("zoom: repeated identical operations produce identical results", () => {
  for (const scale of [0.5, 0.512, 0.8, 1, 1.25, 1.9531, 2.5]) {
    assert.equal(scaleIn(scale), scaleIn(scale));
    assert.equal(scaleOut(scale), scaleOut(scale));
    assert.equal(roundScale(scale), roundScale(scale));
  }
  // One step in then one step out returns to the same value everywhere the
  // ladder is not saturated.
  for (const scale of [0.8, 1, 1.25, 1.5625]) {
    assert.equal(scaleOut(scaleIn(scale)), scale);
  }
});

test("zoom: the percentage label is a bounded whole-percent interface string", () => {
  const CASES = [
    [0.5, "50%"],
    [0.512, "51%"],
    [0.64, "64%"],
    [0.8, "80%"],
    [1, "100%"],
    [1.25, "125%"],
    [1.5625, "156%"],
    [1.9531, "195%"],
    [2.4414, "244%"],
    [2.5, "250%"],
    [99, "250%"],
    [0, "50%"],
  ];
  for (const [scale, expected] of CASES) {
    assert.equal(formatScalePercent(scale), expected, `label for ${scale}`);
  }
});

// ---------------------------------------------------------------------------
// 4. Reset returns exactly to identity.
// ---------------------------------------------------------------------------

test("reset: returning to the identity scale reproduces the identity surface", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const identity = computeViewportSurface(
    layout.width,
    layout.height,
    VIEWPORT_SCALE.IDENTITY,
    DESKTOP,
  );
  // Walk the whole ladder in both directions, then reset.
  let scale = VIEWPORT_SCALE.IDENTITY;
  for (let step = 0; step < 6; step += 1) scale = scaleIn(scale);
  for (let step = 0; step < 9; step += 1) scale = scaleOut(scale);
  assert.equal(scale, VIEWPORT_SCALE.MIN);

  const afterReset = computeViewportSurface(
    layout.width,
    layout.height,
    VIEWPORT_SCALE.IDENTITY,
    DESKTOP,
  );
  assert.deepEqual(afterReset, identity);
  assert.equal(afterReset.width, layout.width);
  assert.equal(afterReset.height, layout.height);
  assert.equal(afterReset.transformAttr, "translate(0,0) scale(1)");
  assert.equal(isIdentityViewport(afterReset.transform), true);
  // Reset also returns the scroll position to the exact start of both axes.
  assert.equal(clampOffset(0, DESKTOP, afterReset.width), 0);
});

// ---------------------------------------------------------------------------
// 5 & 6. Fit stays within bounds and never magnifies above 100%.
// ---------------------------------------------------------------------------

test("fit: considers only the currently rendered group regions", () => {
  const wide = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  assert.deepEqual(contentExtentOf(wide), {
    width: WIDE_WIDTH,
    height: WIDE_HEIGHT,
  });

  // A filtered view fits what is on screen, and nothing else.
  const filtered = allNodes.filter((node) => node.surface_role === "concept_node");
  const one = layoutOf(filtered, "surface_role", { columnsPerBand: 6 });
  assert.equal(one.groups.length, 1);
  assert.equal(contentExtentOf(one).width, NARROW_WIDTH);

  // An empty view falls back to the layout's own canvas without throwing.
  const empty = layoutOf([], "surface_role");
  assert.deepEqual(contentExtentOf(empty), {
    width: empty.width,
    height: empty.height,
  });
});

test("fit: never exceeds 100% and never falls below the minimum bound", () => {
  const wide = contentExtentOf(layoutOf(allNodes, "surface_role", { columnsPerBand: 6 }));
  const narrow = contentExtentOf(layoutOf(allNodes, "surface_role", { columnsPerBand: 1 }));
  for (const content of [wide, narrow]) {
    for (const visible of [0, 1, 120, MOBILE, 480, 768, TABLET, 1024, DESKTOP, 1920, 8000]) {
      const scale = fitScale(content, visible);
      assert.ok(scale >= VIEWPORT_SCALE.MIN, `fit ${scale} below minimum`);
      assert.ok(scale <= VIEWPORT_SCALE.MAX, `fit ${scale} above maximum`);
      assert.ok(scale <= VIEWPORT_SCALE.IDENTITY, `fit ${scale} magnified above 100%`);
    }
  }
});

test("fit: the three inspection widths give the hand-written scales", () => {
  const wide = contentExtentOf(layoutOf(allNodes, "surface_role", { columnsPerBand: 6 }));
  const narrow = contentExtentOf(layoutOf(allNodes, "surface_role", { columnsPerBand: 1 }));
  // 1440 / 1712 = 0.84112…, rounded onto the fixed 4-decimal grid.
  assert.equal(fitScale(wide, DESKTOP), 0.8411);
  // 834 / 1712 = 0.48714…, which is below the minimum bound and clamps to it.
  assert.equal(fitScale(wide, TABLET), 0.5);
  // 375 / 268 would magnify, so fit stays at the identity scale.
  assert.equal(fitScale(narrow, MOBILE), 1);
  // An unmeasured container is not treated as a constraint.
  assert.equal(fitScale(wide, 0), 1);
  assert.equal(fitScale(wide, Number.NaN), 1);
  // A bounded visible height is honored when one is supplied.
  assert.equal(fitScale(wide, DESKTOP, 4000), 0.8411);
  assert.equal(fitScale(wide, DESKTOP, 838), 0.5);
});

// ---------------------------------------------------------------------------
// Surface geometry above and below identity.
// ---------------------------------------------------------------------------

test("surface: magnification grows the surface and keeps the content anchored", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const magnified = computeViewportSurface(layout.width, layout.height, 2.5, DESKTOP);
  assert.equal(magnified.width, 4280); // 1712 * 2.5
  assert.equal(magnified.height, 4190); // 1676 * 2.5
  assert.deepEqual({ ...magnified.transform }, { k: 2.5, x: 0, y: 0 });
  assert.equal(magnified.transformAttr, "translate(0,0) scale(2.5)");
  assert.equal(magnified.viewBox, "0 0 4280 4190");
});

test("surface: reduction shrinks the surface and centres the smaller drawing", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const reduced = computeViewportSurface(layout.width, layout.height, 0.5, DESKTOP);
  assert.equal(reduced.width, DESKTOP); // never past the identity canvas
  assert.equal(reduced.height, 838); // 1676 * 0.5
  assert.deepEqual({ ...reduced.transform }, { k: 0.5, x: 292, y: 0 });
  assert.equal(reduced.transformAttr, "translate(292,0) scale(0.5)");
});

test("surface: the map surface never grows past the identity canvas", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  for (const visible of [0, MOBILE, TABLET, DESKTOP, 4000]) {
    for (const scale of [0.5, 0.64, 0.8, 1]) {
      const surface = computeViewportSurface(
        layout.width,
        layout.height,
        scale,
        visible,
      );
      assert.ok(
        surface.width <= layout.width,
        `surface ${surface.width} wider than the identity canvas`,
      );
    }
  }
});

test("surface: degenerate inputs stay finite, non-negative, and bounded", () => {
  for (const args of [
    [0, 0, 1, 0],
    [Number.NaN, Number.NaN, Number.NaN, Number.NaN],
    [-100, -100, -1, -1],
    [WIDE_WIDTH, WIDE_HEIGHT, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
  ]) {
    const surface = computeViewportSurface(...args);
    for (const value of [
      surface.width,
      surface.height,
      surface.transform.k,
      surface.transform.x,
      surface.transform.y,
    ]) {
      assert.ok(Number.isFinite(value), `non-finite ${value}`);
      assert.ok(value >= 0, `negative ${value}`);
    }
    assert.ok(surface.transform.k >= VIEWPORT_SCALE.MIN);
    assert.ok(surface.transform.k <= VIEWPORT_SCALE.MAX);
    assert.ok(surface.height >= M.MIN_CANVAS_HEIGHT);
  }
});

// ---------------------------------------------------------------------------
// 7 & 8. Centering the selected node and jumping to a group region.
// ---------------------------------------------------------------------------

test("offsets: every computed offset is clamped into the scrollable range", () => {
  const CASES = [
    // offset, visible, total, expected
    [0, 1440, 4280, 0],
    [-500, 1440, 4280, 0],
    [1000, 1440, 4280, 1000],
    [99999, 1440, 4280, 2840],
    [500, 1440, 1000, 0], // content smaller than the box
    [500, 1440, 1440, 0],
    [Number.NaN, 1440, 4280, 0],
    [100, Number.NaN, 4280, 100],
  ];
  for (const [offset, visible, total, expected] of CASES) {
    assert.equal(
      clampOffset(offset, visible, total),
      expected,
      `clampOffset(${offset}, ${visible}, ${total})`,
    );
  }
});

test("center: the selected node's offset is bounded and hand-checkable", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const surface = computeViewportSurface(layout.width, layout.height, 2.5, DESKTOP);

  for (const entry of layout.nodes) {
    const projected = projectRect(nodeRect(entry), surface.transform);
    const offset = centeredOffset(
      projected.x,
      projected.width,
      DESKTOP,
      surface.width,
    );
    assert.ok(Number.isFinite(offset));
    assert.ok(offset >= 0, `offset ${offset} below the start of the axis`);
    assert.ok(
      offset <= surface.width - DESKTOP,
      `offset ${offset} past the end of the axis`,
    );
  }

  // One explicit, hand-written case: a rectangle at x=1000 of width 260 in a
  // 1440-wide box over a 4280-wide surface centres at 1000 + 130 - 720 = 410.
  assert.equal(centeredOffset(1000, 260, 1440, 4280), 410);
  assert.equal(centeredOffset(0, 260, 1440, 4280), 0);
  assert.equal(centeredOffset(4000, 260, 1440, 4280), 2840);
});

test("center: projection never mutates or recomputes a layout rectangle", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const entry = layout.nodes[0];
  const before = JSON.stringify(nodeRect(entry));
  const projected = projectRect(nodeRect(entry), { k: 2, x: 10, y: 20 });
  assert.deepEqual(projected, {
    x: entry.x * 2 + 10,
    y: entry.y * 2 + 20,
    width: entry.width * 2,
    height: entry.height * 2,
  });
  assert.equal(JSON.stringify(nodeRect(entry)), before);
  // At the identity transform, projection is the content rectangle itself.
  assert.deepEqual(projectRect(nodeRect(entry), IDENTITY_VIEWPORT), {
    x: entry.x,
    y: entry.y,
    width: entry.width,
    height: entry.height,
  });
});

test("group jump: targets the explicit existing group region, verbatim", () => {
  for (const field of GROUPING_FIELDS) {
    const layout = layoutOf(allNodes, field, { columnsPerBand: 6 });
    const surface = computeViewportSurface(layout.width, layout.height, 1, DESKTOP);
    for (const group of layout.groups) {
      const found = findGroup(layout, group.key);
      // Same object identity: no group is rebuilt, renamed, merged, or invented.
      assert.equal(found, group, `group ${group.key} must be returned verbatim`);
      assert.deepEqual(groupRect(found), {
        x: group.x,
        y: group.y,
        width: group.width,
        height: group.height,
      });
      const projected = projectRect(groupRect(found), surface.transform);
      const offset = centeredOffset(
        projected.x,
        projected.width,
        DESKTOP,
        surface.width,
      );
      assert.ok(offset >= 0 && offset <= Math.max(0, surface.width - DESKTOP));
    }
    // The jump options are exactly the rendered groups, in the deterministic
    // order the layout produced. No grouping is inferred.
    assert.deepEqual(
      layout.groups.map((group) => group.key),
      layout.groups.map((group) => findGroup(layout, group.key).key),
    );
  }
});

test("anchor: zooming keeps the visible centre stable and bounded", () => {
  // 1712 -> 2140 (a 1.25 step) with a 1440 box: the centre fraction 720/1712
  // maps to 900, so the new offset is 900 - 720 = 180.
  assert.equal(anchoredOffset(0, 1440, 1712, 2140), 180);
  // An unchanged surface leaves the offset where it was.
  assert.equal(anchoredOffset(0, 1440, 1712, 1712), 0);
  assert.equal(anchoredOffset(200, 1440, 4280, 4280), 200);
  // Always clamped into the new range.
  assert.equal(anchoredOffset(2840, 1440, 4280, 1712), 272);
  assert.equal(anchoredOffset(2840, 1440, 4280, 1440), 0);
  // A degenerate previous extent falls back to the start of the axis.
  assert.equal(anchoredOffset(500, 1440, 0, 4280), 0);
  assert.equal(anchoredOffset(500, 1440, Number.NaN, 4280), 0);
});

test("focus: bringing a node into view moves nothing when it is already visible", () => {
  assert.equal(bringIntoViewOffset(100, 64, 0, 800, 4000), 0);
  assert.equal(bringIntoViewOffset(0, 800, 0, 800, 4000), 0);
  // Out of view below: centred, clamped.
  assert.equal(bringIntoViewOffset(2000, 64, 0, 800, 4000), 1632);
  // Out of view above: centred, clamped to the start.
  assert.equal(bringIntoViewOffset(10, 64, 900, 800, 4000), 0);
  // An unmeasured box never moves anything.
  assert.equal(bringIntoViewOffset(2000, 64, 300, 0, 4000), 300);
});

// ---------------------------------------------------------------------------
// 9. Missing selected node and missing group are safe no-ops.
// ---------------------------------------------------------------------------

test("safety: a missing selection or a missing group resolves to null", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  assert.equal(findNode(layout, null), null);
  assert.equal(findNode(layout, ""), null);
  assert.equal(findNode(layout, "no-such-node"), null);
  assert.equal(findGroup(layout, ""), null);
  assert.equal(findGroup(layout, "no-such-group"), null);
  assert.equal(findGroup(layout, "CONCEPT_NODE"), null); // exact key only

  // A node filtered out of the current view has no rendered position, so
  // centering it is a no-op rather than a jump to a stale coordinate.
  const filtered = allNodes.filter((node) => node.surface_role === "concept_node");
  const partial = layoutOf(filtered, "surface_role", { columnsPerBand: 6 });
  const hidden = allNodes.find((node) => node.surface_role !== "concept_node");
  assert.ok(hidden);
  assert.equal(findNode(partial, hidden.id), null);
  assert.equal(findGroup(partial, hidden.surface_role), null);

  // An empty view resolves everything to null without throwing.
  const empty = layoutOf([], "surface_role");
  assert.equal(findNode(empty, allNodes[0].id), null);
  assert.equal(findGroup(empty, "concept_node"), null);
});

test("safety: a found node is the verbatim rendered entry", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  for (const entry of layout.nodes) {
    assert.equal(findNode(layout, entry.id), entry);
  }
});

// ---------------------------------------------------------------------------
// 12 & 13. No content coordinate moves; no node or edge is created.
// ---------------------------------------------------------------------------

test("isolation: no viewport operation changes a content coordinate", () => {
  for (const field of GROUPING_FIELDS) {
    for (const columnsPerBand of [1, 2, 6]) {
      const layout = layoutOf(allNodes, field, { columnsPerBand });
      const before = serialize(layout);

      // Every viewport operation this phase exposes, over the whole ladder.
      let scale = VIEWPORT_SCALE.IDENTITY;
      for (const visible of [MOBILE, TABLET, DESKTOP]) {
        for (let step = 0; step < 6; step += 1) {
          scale = scaleIn(scale);
          const surface = computeViewportSurface(
            layout.width,
            layout.height,
            scale,
            visible,
          );
          for (const group of layout.groups) {
            projectRect(groupRect(group), surface.transform);
            centeredOffset(group.x, group.width, visible, surface.width);
          }
          for (const entry of layout.nodes) {
            projectRect(nodeRect(entry), surface.transform);
            bringIntoViewOffset(entry.x, entry.width, 0, visible, surface.width);
          }
          anchoredOffset(0, visible, layout.width, surface.width);
        }
        for (let step = 0; step < 9; step += 1) {
          scale = scaleOut(scale);
          computeViewportSurface(layout.width, layout.height, scale, visible);
        }
        fitScale(contentExtentOf(layout), visible);
      }

      assert.equal(serialize(layout), before, `content moved for ${field}`);
    }
  }
});

test("isolation: no node, group, or edge is created by any viewport operation", () => {
  const layout = layoutOf(allNodes, "surface_role", { columnsPerBand: 6 });
  const renderedIds = new Set(layout.nodes.map((entry) => entry.id));
  const routedBefore = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds,
  });

  for (const scale of [0.5, 0.8, 1, 1.25, 2.5]) {
    const surface = computeViewportSurface(layout.width, layout.height, scale, DESKTOP);
    assert.equal(layout.nodes.length, 30);
    assert.equal(layout.groups.length, 6);
    assert.equal(layout.positions.size, 30);
    // The extent is derived from the rendered groups only; it adds nothing.
    const extent = contentExtentOf(layout);
    assert.ok(extent.width > 0 && extent.height > 0);
    assert.equal(surface.transform.k, clampScale(scale));
  }

  const routedAfter = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds,
  });
  assert.equal(routedAfter.length, routedBefore.length);
  assert.equal(routedAfter.length, 161);
  assert.equal(layout.nodes.length, 30);
});

// ---------------------------------------------------------------------------
// Source-level contracts.
// ---------------------------------------------------------------------------

const viewportSource = rd("src/lib/public-surface-authority-map/d3AuthorityViewport.ts");
const rendererSource = rd("src/lib/public-surface-authority-map/d3AuthorityRenderer.ts");
const clientSource = rd("src/components/publicSurfaceAuthorityMap.client.ts");
const astroSource = rd("src/components/PublicSurfaceAuthorityMap.astro");
const packageJson = JSON.parse(rd("package.json"));

// Boundary scans run over EXECUTABLE code only. These files deliberately name
// the banned APIs in prose to document the boundary, so a raw substring scan
// would flag the documentation instead of the implementation. Identical to the
// stripper the Phase 2A boundary tests already use.
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
    .join("\n");

const viewportCode = stripComments(viewportSource);
const rendererCode = stripComments(rendererSource);
const clientCode = stripComments(clientSource);

const PHASE_2B1_SOURCES = [
  ["d3AuthorityViewport.ts", viewportCode],
  ["d3AuthorityRenderer.ts", rendererCode],
  ["publicSurfaceAuthorityMap.client.ts", clientCode],
];

test("scan: the comment stripper leaves executable code intact", () => {
  // Guards every scan below against silently matching an empty string.
  assert.ok(viewportCode.includes("export function computeViewportSurface"));
  assert.ok(rendererCode.includes('from "d3-selection"'));
  assert.ok(clientCode.includes("function resetViewport"));
  assert.equal(viewportCode.includes("Rejected alternative"), false);
});

// ---------------------------------------------------------------------------
// 10 & 11. Which interactions reset the viewport, and which never do.
// ---------------------------------------------------------------------------

test("wiring: a grouping or filter change resets the viewport to identity", () => {
  // The single deterministic-relayout path resets before drawing.
  assert.match(
    clientCode,
    /function refresh\(announceMode: "count" \| "silent"\): void \{\s*const visible = visibleNodes\(\);\s*resetViewport\(\);\s*draw\(layout\(visible\)\);/,
  );
  // Grouping radios and every filter control go through exactly that path.
  assert.match(clientCode, /for \(const radio of groupRadios\) \{[\s\S]{0,220}?refresh\("silent"\)/);
  assert.match(
    clientCode,
    /filterTextEl\.addEventListener\("input", \(\) => \{\s*refresh\("count"\);/,
  );
  assert.match(
    clientCode,
    /for \(const select of metadataSelects\.values\(\)\) \{\s*select\.addEventListener\("change", \(\) => \{\s*refresh\("count"\);/,
  );
  // Reset returns the scale to the identity constant and both axes to zero.
  assert.match(
    clientCode,
    /function resetViewport\(\): void \{\s*viewportScale = VIEWPORT_SCALE\.IDENTITY;\s*if \(scrollEl\) \{\s*scrollEl\.scrollLeft = 0;\s*scrollEl\.scrollTop = 0;/,
  );
});

test("wiring: the complete Reset view also resets the viewport", () => {
  assert.match(
    clientCode,
    /updateDensityWarning\(\);\s*clearSelection\(\);\s*resetViewport\(\);\s*draw\(layout\(visibleNodes\(\)\)\);/,
  );
});

test("wiring: selection and routing toggles never reset the viewport", () => {
  // The routing/selection redraw path draws the CURRENT layout and does not
  // touch the viewport at all.
  const redraw = /function redrawRouting\(\): void \{([\s\S]*?)\n  \}/.exec(clientCode);
  assert.ok(redraw, "redrawRouting() must exist");
  assert.equal(redraw[1].includes("resetViewport"), false);
  assert.equal(redraw[1].includes("viewportScale"), false);

  const select = /function selectNode\(id: string\): void \{([\s\S]*?)\n  \}/.exec(clientCode);
  assert.ok(select, "selectNode() must exist");
  assert.equal(select[1].includes("resetViewport"), false);
  assert.match(select[1], /redrawRouting\(\);/);

  // Both routing toggles use the same non-resetting path.
  assert.match(
    clientCode,
    /routeSelectedEl\.addEventListener\("change", \(\) => \{\s*redrawRouting\(\);\s*\}\);/,
  );
  assert.match(
    clientCode,
    /routeGlobalEl\.addEventListener\("change", \(\) => \{\s*updateDensityWarning\(\);\s*redrawRouting\(\);\s*\}\);/,
  );
  // Routing remains off by default: no viewport control enables it.
  for (const marker of ["routeGlobalEl.checked = true", "routeSelectedEl.checked = true"]) {
    assert.equal(clientCode.includes(marker), false, `must not contain ${marker}`);
  }
});

test("wiring: every required viewport control is wired to a bounded operation", () => {
  const CONTROLS = [
    ["data-psam-zoom-in", /zoomInEl\.addEventListener\("click"/],
    ["data-psam-zoom-out", /zoomOutEl\.addEventListener\("click"/],
    ["data-psam-zoom-reset", /zoomResetEl\.addEventListener\("click"/],
    ["data-psam-zoom-fit", /zoomFitEl\.addEventListener\("click"/],
    ["data-psam-center-selected", /centerSelectedEl\.addEventListener\("click"/],
    ["data-psam-group-jump", /groupJumpEl\.addEventListener\("change"/],
    ["data-psam-zoom-level", /zoomLevelEl\.textContent = formatScalePercent/],
  ];
  for (const [hook, wiring] of CONTROLS) {
    assert.ok(astroSource.includes(hook), `markup must expose ${hook}`);
    assert.ok(clientCode.includes(hook), `client must query ${hook}`);
    assert.match(clientCode, wiring, `client must wire ${hook}`);
  }
  // The zoom-in / zoom-out buttons use the bounded ladder, never a raw number.
  assert.match(clientCode, /applyScale\(\s*scaleIn\(viewportScale\),/);
  assert.match(clientCode, /applyScale\(\s*scaleOut\(viewportScale\),/);
  // Center-selected is disabled unless a currently visible node is selected.
  assert.match(
    clientCode,
    /centerSelectedEl\.disabled = findNode\(active, selectedId\) === null;/,
  );
  // Group-jump options come from the current deterministic group order.
  assert.match(clientCode, /for \(const group of active\.groups\) \{/);
  assert.equal(clientCode.includes("groupJumpEl.value = groupJumpEl"), false);
});

test("wiring: the renderer applies one transform to one containing group", () => {
  // Exactly one viewport layer, carrying the transform, wrapping all three
  // content layers. Nodes and edges never receive their own transform.
  assert.match(
    rendererCode,
    /const viewportLayer = ensureLayer\(root, "psam__layer--viewport"\)\.attr\(\s*"transform",\s*viewport\.transformAttr,\s*\);/,
  );
  for (const layer of ["groups", "edges", "nodes"]) {
    assert.ok(
      rendererCode.includes(`ensureLayer(viewportLayer, "psam__layer--${layer}")`),
      `${layer} layer must live inside the viewport group`,
    );
  }
  // The SVG box comes from the viewport surface, and the node/group/edge
  // geometry still comes only from the deterministic layout.
  assert.match(rendererCode, /\.attr\("width", String\(viewport\.width\)\)/);
  assert.match(rendererCode, /\.attr\("viewBox", viewport\.viewBox\)/);
  assert.match(rendererCode, /\.attr\("transform", \(node\) => `translate\(\$\{node\.x\},\$\{node\.y\}\)`\)/);
  assert.match(rendererCode, /\.attr\("x1", \(edge\) => layout\.positions\.get\(edge\.source\)\?\.cx \?\? 0\)/);
  // Only one `transform` attribute is written outside the deterministic node
  // and group placements.
  const transforms = [...rendererCode.matchAll(/\.attr\(\s*"transform"/g)];
  assert.equal(transforms.length, 3);
});

// ---------------------------------------------------------------------------
// 14. Runtime rollback restores viewport state.
// ---------------------------------------------------------------------------

test("rollback: viewport state is captured with every other live surface", () => {
  assert.match(
    clientCode,
    /interface LiveCapture \{[\s\S]*?viewportScale: number;[\s\S]*?viewportSurface: ViewportSurface \| null;[\s\S]*?scrollLeft: number;[\s\S]*?scrollTop: number;[\s\S]*?zoomLabel: string \| null;[\s\S]*?centerDisabled: boolean;[\s\S]*?groupJump: \{[\s\S]*?groupJumpKey: string;[\s\S]*?\n\}/,
  );
  const capture = /function captureLiveState\(\): LiveCapture \{([\s\S]*?)\n  \}/.exec(clientCode);
  assert.ok(capture, "captureLiveState() must exist");
  for (const marker of [
    "viewportScale,",
    "viewportSurface: currentSurface,",
    "scrollLeft: scrollEl ? scrollEl.scrollLeft : 0,",
    "scrollTop: scrollEl ? scrollEl.scrollTop : 0,",
    "zoomLabel: zoomLevelEl?.textContent ?? null,",
    "centerDisabled: centerSelectedEl ? centerSelectedEl.disabled : true,",
    "groupJumpKey,",
  ]) {
    assert.ok(capture[1].includes(marker), `capture must record ${marker}`);
  }
});

test("rollback: viewport state is restored on a failed activation", () => {
  const restore =
    /function restoreLiveState\(cap: LiveCapture\): void \{([\s\S]*?)function applyActivation/.exec(
      clientCode,
    );
  assert.ok(restore, "restoreLiveState() must exist");
  for (const marker of [
    "viewportScale = cap.viewportScale;",
    "currentSurface = cap.viewportSurface;",
    "groupJumpKey = cap.groupJumpKey;",
    "scrollEl.scrollLeft = cap.scrollLeft;",
    "scrollEl.scrollTop = cap.scrollTop;",
    "zoomLevelEl.textContent = cap.zoomLabel;",
    "centerSelectedEl.disabled = cap.centerDisabled;",
    "groupJumpEl.replaceChildren(...jump.options);",
  ]) {
    assert.ok(restore[1].includes(marker), `restore must reinstate ${marker}`);
  }
  // The rendered SVG (and therefore the containing group's transform and the
  // SVG box) is still restored as captured child nodes, never by re-rendering.
  assert.ok(restore[1].includes("svgEl!.replaceChildren(...cap.svgChildren);"));
  assert.ok(restore[1].includes('setOrRemoveAttr(svgEl!, "viewBox", cap.svgVB);'));
});

test("rollback: activation teardown removes direct children only, so content survives", () => {
  // The capture holds the SVG's DIRECT children. A descendant-wide teardown
  // (`selectAll("*").remove()`) detaches every node, group, and edge from its
  // layer as well, so the rollback would reinstate empty layer shells and the
  // drawing would be lost. Removing only the direct children keeps each removed
  // layer's subtree intact.
  assert.match(rendererCode, /clear\(\): void \{[\s\S]*?root\.selectChildren\(\)\.remove\(\);/);
  assert.equal(rendererCode.includes('root.selectAll("*")'), false);
  // The capture really is the direct-children list the teardown leaves intact.
  assert.match(clientCode, /svgChildren: Array\.from\(svgEl!\.childNodes\),/);
});

test("rollback: a successful activation leaves a known valid identity viewport", () => {
  assert.match(
    clientCode,
    /updateDensityWarning\(\);\s*resetViewport\(\);\s*draw\(layout\(visibleNodes\(\)\)\);\s*\n\s*restoreFocus\(focusedNodeId\);/,
  );
  // The loader's own security model is untouched: still one boot, no retry.
  assert.match(clientCode, /if \(runtimeBooted\) \{\s*return;\s*\}\s*runtimeBooted = true;/);
  assert.equal(clientCode.includes("setInterval"), false);
});

// ---------------------------------------------------------------------------
// 15. Viewport state is not persisted.
// ---------------------------------------------------------------------------

test("persistence: no viewport state is written anywhere it could survive a load", () => {
  const forbidden = [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "serviceWorker",
    "sendBeacon",
    "URLSearchParams",
    "location.search",
    "location.hash",
    "history.pushState",
    "history.replaceState",
    "window.name",
    "caches.",
    "BroadcastChannel",
    "postMessage",
    "dataLayer",
    "gtag(",
  ];
  for (const [name, source] of PHASE_2B1_SOURCES) {
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
  // The scale always starts from the identity constant on a fresh page load.
  assert.match(
    clientCode,
    /let viewportScale: number = VIEWPORT_SCALE\.IDENTITY;/,
  );
  assert.match(clientCode, /let currentSurface: ViewportSurface \| null = null;/);
});

// ---------------------------------------------------------------------------
// 17. No force, hierarchy, ranking, similarity, or inferred relation.
// ---------------------------------------------------------------------------

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
    "d3-transition",
    "zoomIdentity",
    "zoomTransform",
    "dragDisable",
    "getContext(",
    "WebGLRenderingContext",
  ];
  for (const [name, source] of PHASE_2B1_SOURCES) {
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, `${name} must not use ${marker}`);
    }
  }
});

test("boundary: no centrality, rank, similarity, or authority score is computed", () => {
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
    /\bhierarchy\s*[=(]/i,
  ];
  for (const [name, source] of PHASE_2B1_SOURCES) {
    for (const pattern of forbidden) {
      assert.equal(pattern.test(source), false, `${name} must not match ${pattern}`);
    }
  }
});

test("boundary: the viewport module reads the layout and infers no relation", () => {
  // It never sees the snapshot's edges at all, so it cannot create, merge,
  // weight, re-type, or infer one.
  assert.equal(viewportCode.includes("edges"), false);
  assert.equal(viewportCode.includes("relation"), false);
  assert.equal(viewportCode.includes("boundary_reference"), false);
  assert.equal(viewportCode.includes("source_use_reference"), false);
  // No DOM, no D3, no browser API, no time, no randomness.
  for (const marker of [
    "document",
    "window",
    "navigator",
    "fetch(",
    "Date.",
    "Math.random",
    "setTimeout",
    "requestAnimationFrame",
    "addEventListener",
  ]) {
    assert.equal(
      viewportCode.includes(marker),
      false,
      `d3AuthorityViewport.ts must not contain ${marker}`,
    );
  }
});

test("boundary: no innerHTML, eval, or new Function in any Phase 2B-1 source", () => {
  for (const [name, source] of PHASE_2B1_SOURCES) {
    for (const marker of [
      "innerHTML",
      "outerHTML",
      "insertAdjacentHTML",
      "eval(",
      "new Function",
      ".html(",
    ]) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
});

test("boundary: no locale-dependent API takes part in the viewport", () => {
  for (const marker of [
    "localeCompare",
    "Intl.",
    "toLocaleString",
    "toLocaleUpperCase",
    "toLocaleLowerCase",
    "navigator.language",
  ]) {
    assert.equal(
      viewportSource.includes(marker),
      false,
      `d3AuthorityViewport.ts must not contain ${marker}`,
    );
  }
  // The percentage label is built from plain arithmetic and a template string.
  assert.match(
    viewportCode,
    /return `\$\{Math\.round\(clampScale\(scale\) \* 100\)\}%`;/,
  );
});

// ---------------------------------------------------------------------------
// 18. No remote dependency and no runtime package load.
// ---------------------------------------------------------------------------

test("dependency: the approved D3 surface is unchanged — no package was added", () => {
  const deps = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const d3Packages = Object.keys(deps).filter(
    (name) => name === "d3" || name.startsWith("d3-") || name.startsWith("@types/d3"),
  );
  assert.deepEqual(d3Packages.sort(), ["@types/d3-selection", "d3-selection"]);
  assert.equal(deps["d3-selection"], "3.0.0");
  assert.equal(deps["@types/d3-selection"], "3.0.11");
  // Nothing in the forbidden set exists at any version.
  for (const forbidden of [
    "d3",
    "d3-force",
    "d3-drag",
    "d3-zoom",
    "d3-hierarchy",
    "d3-geo",
    "d3-transition",
    "@types/d3-zoom",
    "@types/d3-drag",
  ]) {
    assert.equal(forbidden in deps, false, `${forbidden} must not be a dependency`);
  }
});

test("dependency: the viewport module imports only the local layout module", () => {
  const imports = [...viewportCode.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, ["./d3AuthorityLayout.ts"]);
  // No CDN, no remote ESM, no runtime package loading, no dynamic import.
  for (const [name, source] of PHASE_2B1_SOURCES) {
    for (const marker of [
      "http://",
      "cdn.",
      "unpkg",
      "jsdelivr",
      "esm.sh",
      "skypack",
      "d3js.org",
      "import(",
      "<iframe",
      "document.write",
    ]) {
      assert.equal(source.includes(marker), false, `${name} must not contain ${marker}`);
    }
  }
  // The renderer still imports exactly one external package, by name.
  const rendererImports = [...rendererCode.matchAll(/from\s+"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((spec) => !spec.startsWith("."));
  assert.deepEqual(rendererImports, ["d3-selection"]);
});

// ---------------------------------------------------------------------------
// Accessibility and boundary preservation in the rendered markup.
// ---------------------------------------------------------------------------

test("markup: viewport controls are native, labelled, and keyboard operable", () => {
  // Native buttons with visible text labels.
  for (const label of [
    "Zoom in",
    "Zoom out",
    "Reset to 100%",
    "Fit visible content",
    "Center selected node",
  ]) {
    assert.ok(astroSource.includes(`>\n            ${label}\n          </button>`) ||
      astroSource.includes(label), `missing viewport control label: ${label}`);
  }
  // A real <select> with a real <label>, and the group is named.
  assert.ok(astroSource.includes('<label for="psam-group-jump">Jump to visible group</label>'));
  assert.ok(astroSource.includes('<select id="psam-group-jump" data-psam-group-jump>'));
  assert.ok(astroSource.includes('aria-label="Map viewport navigation"'));
  // Center-selected starts disabled; the panel starts hidden (JavaScript only).
  assert.match(astroSource, /data-psam-center-selected\s*\n\s*disabled/);
  assert.match(astroSource, /data-psam-viewport\s*\n[\s\S]{0,120}?hidden/);
  // No gesture-only navigation path, and no custom keyboard graph traversal.
  for (const marker of ["onwheel", "ontouchstart", "touch-action: none"]) {
    assert.equal(astroSource.includes(marker), false, `must not contain ${marker}`);
  }
});

test("markup: the zoom display is presented as interface state only", () => {
  assert.ok(astroSource.includes("Interface state only. Not a measurement, score, or property of any"));
  assert.ok(
    astroSource.includes(
      "viewport position, and group navigation do not indicate importance",
    ),
  );
});

test("markup: every persistent boundary statement is still present", () => {
  const REQUIRED = [
    "Selected public surface only.",
    "Visual position does not indicate conceptual importance or internal authority.",
    "Reference routing does not establish a confirmed conceptual relation.",
    "Omission does not imply nonexistence.",
    "The public surface is not the internal Registry or a complete archive.",
  ];
  for (const statement of REQUIRED) {
    assert.ok(astroSource.includes(statement), `missing boundary statement: ${statement}`);
  }
  // The complete no-JavaScript record table is unchanged.
  assert.ok(astroSource.includes("<tbody data-psam-table-body>"));
  assert.ok(astroSource.includes("data-psam-map-fallback"));
  assert.match(astroSource, /Routing is off by default\./);
});

test("markup: node keyboard activation is unchanged", () => {
  assert.match(
    rendererCode,
    /if \(event\.key === "Enter" \|\| event\.key === " " \|\| event\.key === "Spacebar"\)/,
  );
  assert.match(rendererCode, /\.attr\("role", "button"\)\s*\.attr\("tabindex", 0\)/);
  assert.match(rendererCode, /g\.on\("click", \(_event: MouseEvent, node: AuthorityLayoutNode\) => \{/);
});

test("markup: no pointer gesture handler is installed on the map", () => {
  for (const marker of [
    '"wheel"',
    '"pointerdown"',
    '"pointermove"',
    '"pointerup"',
    '"touchstart"',
    '"touchmove"',
    '"dblclick"',
    '"mousedown"',
    '"mousemove"',
  ]) {
    assert.equal(
      clientCode.includes(marker),
      false,
      `client must not install a ${marker} handler`,
    );
  }
  // The only listener the map adds to the SVG surface is focus tracking.
  const svgListeners = [...clientCode.matchAll(/svgEl\.addEventListener\("([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(svgListeners, ["focusin"]);
});

test("motion: viewport changes are applied without animation or timing", () => {
  for (const marker of [
    "transition(",
    "requestAnimationFrame",
    'behavior: "smooth"',
    "scroll-behavior: smooth",
    "@keyframes",
  ]) {
    assert.equal(clientCode.includes(marker), false, `client must not contain ${marker}`);
    assert.equal(astroSource.includes(marker), false, `markup must not contain ${marker}`);
  }
  assert.match(clientCode, /window\.scrollTo\(\{ top: next, behavior: "auto" \}\)/);
  // The component-wide reduced-motion guarantee is still in place.
  assert.match(astroSource, /@media \(prefers-reduced-motion: reduce\)/);
});
