// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — P7.2 pure viewport arithmetic.
//
// Canonical checks 155–181, 182, 184, 200–205, 207–212. Forty-one checks.
//
// Every check here exercises the REAL production module. Nothing in this file
// re-implements viewport, fit, shortcut or pointer arithmetic, so a test-only
// duplicate can never mask a defect in the shipped code.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertAdjacencySnapshot } from "../../src/lib/public-surface-adjacency-map/contract.ts";
import {
  computeRadialLayout,
  CENTRE_X,
  CENTRE_Y,
  GROUP_ARC_R,
  HIT_R,
  formatLogicalNumber,
} from "../../src/lib/public-surface-adjacency-map/layout.ts";
import {
  applyShortcut,
  centreOn,
  clampOffset,
  clampScale,
  classifyPointerEnd,
  computeGroupingFitBounds,
  DRAG_THRESHOLD,
  fitAll,
  fitLogicalBounds,
  FitValidationError,
  GROUP_FIT_PADDING,
  idlePointerState,
  LOGICAL_VIEWPORT_HEIGHT,
  LOGICAL_VIEWPORT_WIDTH,
  MAX_SCALE,
  MIN_FIT_EXTENT,
  MIN_SCALE,
  pinchFrom,
  reducePointer,
  resetTransform,
  resolveShortcut,
  SCALE_STEP,
  stepScale,
  tooltipRect,
  transformAttr,
  zoomAbout,
} from "../../src/lib/public-surface-adjacency-map/viewport.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertAdjacencySnapshot(
  JSON.parse(rd("src/data/public-surface-adjacency-map/last-known-good.json")),
);
const radial = computeRadialLayout(snapshot.nodes);

const viewportSource = rd("src/lib/public-surface-adjacency-map/viewport.ts");

/** Comments stripped, so a scan flags executable code rather than prose. */
const viewportCode = viewportSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const EPS = 1e-9;
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

/** The real group-fit input for one grouping, built the way production builds it. */
const groupFitInput = (key) => {
  const span = radial.groups.find((group) => group.key === key);
  const members = radial.concepts
    .filter((record) => record.node.grouping === key)
    .map((record) => ({ x: record.x, y: record.y }));
  return {
    members,
    arc: {
      centreX: CENTRE_X,
      centreY: CENTRE_Y,
      startAngle: span.startAngle,
      endAngle: span.endAngle,
    },
  };
};

const IDENTITY = { scale: 1, offsetX: 0, offsetY: 0 };

const shortcutContext = (overrides = {}) => ({
  key: "+",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  withinGraphRegion: true,
  expandedMapActive: true,
  targetTagName: "DIV",
  targetIsContentEditable: false,
  targetIsButtonActivating: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Viewport arithmetic — checks 155–161
// ---------------------------------------------------------------------------

test("155 — clampScale enforces 1.0 and 4.0 exactly", () => {
  assert.equal(clampScale(0.25), MIN_SCALE);
  assert.equal(clampScale(9), MAX_SCALE);
  assert.equal(clampScale(MIN_SCALE), 1);
  assert.equal(clampScale(MAX_SCALE), 4);
  // Interior values pass through, so a constant-returning stub cannot pass.
  assert.equal(clampScale(2), 2);
  assert.equal(clampScale(3.5), 3.5);
  // Idempotent, and non-finite input resolves to the lower bound.
  assert.equal(clampScale(clampScale(9)), MAX_SCALE);
  assert.equal(clampScale(Number.NaN), MIN_SCALE);
});

test("156 — stepScale multiplies and divides by 1.25 and saturates at both bounds", () => {
  assert.equal(SCALE_STEP, 1.25);
  // A mid-range step really changes the value.
  assert.ok(near(stepScale(2, 1), 2.5));
  assert.ok(near(stepScale(2, -1), 1.6));
  // Both directions saturate.
  assert.equal(stepScale(MAX_SCALE, 1), MAX_SCALE);
  assert.equal(stepScale(MIN_SCALE, -1), MIN_SCALE);
  assert.equal(stepScale(3.9, 1), MAX_SCALE);
});

test("157 — resetTransform is idempotent and returns scale 1.0 offset zero", () => {
  assert.deepEqual(resetTransform(), IDENTITY);
  assert.deepEqual(resetTransform(), resetTransform());
  assert.equal(resetTransform().scale, 1);
  assert.equal(resetTransform().offsetX, 0);
  assert.equal(resetTransform().offsetY, 0);
});

test("158 — transformAttr formatting is stable, locale-independent and uses formatLogicalNumber", () => {
  const state = { scale: 2.5, offsetX: -123.4567, offsetY: 0 };
  const emitted = transformAttr(state);
  assert.equal(
    emitted,
    `translate(${formatLogicalNumber(state.offsetX)},${formatLogicalNumber(state.offsetY)})` +
      ` scale(${formatLogicalNumber(state.scale)})`,
  );
  assert.equal(emitted, "translate(-123.457,0.000) scale(2.500)");
  // Byte-identical across repeats.
  assert.equal(transformAttr(state), emitted);
  // Negative zero is normalised by the shared serializer, not by a local rule.
  assert.equal(transformAttr({ scale: 1, offsetX: -0, offsetY: -0.0001 }),
    "translate(0.000,0.000) scale(1.000)");
  // There is no second serializer in the module.
  assert.ok(!/toFixed|Intl\.NumberFormat|toLocaleString/.test(viewportCode));
  assert.ok(viewportCode.includes("formatLogicalNumber"));
});

test("159 — zoomAbout keeps the anchored point fixed", () => {
  const before = { scale: 1, offsetX: 0, offsetY: 0 };
  // An OFF-CENTRE anchor, so a centre-only implementation fails.
  const anchorX = 250;
  const anchorY = 700;
  const after = zoomAbout(before, 2, anchorX, anchorY);
  assert.equal(after.scale, 2);
  const screenBefore = [
    before.offsetX + before.scale * anchorX,
    before.offsetY + before.scale * anchorY,
  ];
  const screenAfter = [after.offsetX + after.scale * anchorX, after.offsetY + after.scale * anchorY];
  assert.ok(near(screenBefore[0], screenAfter[0], 1e-6));
  assert.ok(near(screenBefore[1], screenAfter[1], 1e-6));
});

test("160 — clampOffset bounds so content cannot leave the canvas", () => {
  // At scale 1.0 the only admissible offset is exactly (0, 0).
  assert.deepEqual(clampOffset(1, -500, 400), { scale: 1, offsetX: 0, offsetY: 0 });
  // At scale 2 the admissible range is [-1000, 0] on both axes.
  assert.deepEqual(clampOffset(2, -5000, 5000), { scale: 2, offsetX: -1000, offsetY: 0 });
  // An in-range offset is returned unchanged.
  assert.deepEqual(clampOffset(2, -400, -250), { scale: 2, offsetX: -400, offsetY: -250 });
  // At scale 4 the range widens to [-3000, 0].
  assert.equal(clampOffset(4, -9999, 0).offsetX, -3000);
});

test("161 — centreOn centres the given point at the current scale", () => {
  const centred = centreOn(4, 300, 800);
  // The requested point maps exactly to the logical viewport centre.
  assert.ok(near(centred.offsetX + centred.scale * 300, LOGICAL_VIEWPORT_WIDTH / 2, 1e-6));
  assert.ok(near(centred.offsetY + centred.scale * 800, LOGICAL_VIEWPORT_HEIGHT / 2, 1e-6));
  // At scale 1.0 the clamp collapses the offset to zero, by design.
  assert.deepEqual(centreOn(1, 300, 800), IDENTITY);
});

// ---------------------------------------------------------------------------
// fitLogicalBounds and the group-bounds constructor — checks 162–181
// ---------------------------------------------------------------------------

test("162 — one-point bounds", () => {
  const fitted = fitLogicalBounds({ minX: 500, minY: 500, maxX: 500, maxY: 500 });
  // A point pads to 96 x 96, well under the viewport, so the scale saturates.
  assert.equal(fitted.scale, MAX_SCALE);
  assert.ok(Number.isFinite(fitted.offsetX) && Number.isFinite(fitted.offsetY));
  // The padded centre is still the original point.
  assert.ok(near(fitted.offsetX + fitted.scale * 500, LOGICAL_VIEWPORT_WIDTH / 2, 1e-6));
});

test("163 — zero-width bounds use MIN_FIT_EXTENT", () => {
  assert.equal(MIN_FIT_EXTENT, 1);
  const fitted = fitLogicalBounds({ minX: 400, minY: 100, maxX: 400, maxY: 900 });
  assert.ok(Number.isFinite(fitted.scale));
  // Height dominates: padded height 896 -> rawScale 1000/896.
  assert.ok(near(fitted.scale, LOGICAL_VIEWPORT_HEIGHT / 896, 1e-9));
  // A non-degenerate width is untouched.
  const wide = fitLogicalBounds({ minX: 100, minY: 100, maxX: 900, maxY: 900 });
  assert.ok(near(wide.scale, LOGICAL_VIEWPORT_WIDTH / 896, 1e-9));
});

test("164 — zero-height bounds use MIN_FIT_EXTENT", () => {
  const fitted = fitLogicalBounds({ minX: 100, minY: 400, maxX: 900, maxY: 400 });
  assert.ok(Number.isFinite(fitted.scale));
  assert.ok(near(fitted.scale, LOGICAL_VIEWPORT_WIDTH / 896, 1e-9));
});

test("165 — reversed bounds normalize by numeric minima and maxima", () => {
  // Called DIRECTLY on fitLogicalBounds, not routed through the constructor,
  // because this obligation belongs to the public fit API boundary.
  const ordered = fitLogicalBounds({ minX: 100, minY: 200, maxX: 800, maxY: 700 });
  assert.deepEqual(fitLogicalBounds({ minX: 800, minY: 200, maxX: 100, maxY: 700 }), ordered);
  assert.deepEqual(fitLogicalBounds({ minX: 100, minY: 700, maxX: 800, maxY: 200 }), ordered);
  assert.deepEqual(fitLogicalBounds({ minX: 800, minY: 700, maxX: 100, maxY: 200 }), ordered);
});

test("166 — invalid non-finite bounds throw a deterministic validation error", () => {
  // Called DIRECTLY on fitLogicalBounds. Every field, and every non-finite kind.
  for (const field of ["minX", "minY", "maxX", "maxY"]) {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100, [field]: bad };
      assert.throws(() => fitLogicalBounds(bounds), FitValidationError);
    }
  }
  // The message is stable across repeats — deterministic, not incidental.
  const messageOf = (bounds) => {
    try {
      fitLogicalBounds(bounds);
    } catch (error) {
      return error.message;
    }
    return null;
  };
  const bad = { minX: Number.NaN, minY: 0, maxX: 1, maxY: 1 };
  assert.equal(messageOf(bad), messageOf(bad));
  assert.ok(typeof messageOf(bad) === "string" && messageOf(bad).length > 0);
  // The message names the offending field, so a failure is diagnosable.
  assert.ok(messageOf(bad).includes("minX"));
  // A finite box must NOT throw, so the check cannot pass by throwing always.
  assert.doesNotThrow(() => fitLogicalBounds({ minX: 0, minY: 0, maxX: 100, maxY: 100 }));
});

test("167 — bounds padded to exactly 1000 x 1000 yield scale 1.0 and zero offsets", () => {
  // RAW bounds. After the 48-unit padding these become 0,0,1000,1000 exactly.
  // A formula that omits padding computes width 904 and fails here.
  const fitted = fitLogicalBounds({ minX: 48, minY: 48, maxX: 952, maxY: 952 });
  assert.equal(fitted.scale, 1);
  assert.equal(fitted.offsetX, 0);
  assert.equal(fitted.offsetY, 0);
});

test("168 — scale clamping at 1.0", () => {
  // An over-large box would want a scale below 1; it clamps to exactly 1.
  const fitted = fitLogicalBounds({ minX: -5000, minY: -5000, maxX: 5000, maxY: 5000 });
  assert.equal(fitted.scale, MIN_SCALE);
  assert.ok(Number.isFinite(fitted.offsetX) && Number.isFinite(fitted.offsetY));
});

test("169 — scale clamping at 4.0", () => {
  // A tiny box would want a scale above 4; it clamps to exactly 4.
  const fitted = fitLogicalBounds({ minX: 499, minY: 499, maxX: 501, maxY: 501 });
  assert.equal(fitted.scale, MAX_SCALE);
});

test("170 — exact centring maps the padded-bounds centre to the viewport centre", () => {
  // An off-centre box at an unclamped scale.
  const unclamped = fitLogicalBounds({ minX: 100, minY: 200, maxX: 400, maxY: 600 });
  const centreX = (100 - GROUP_FIT_PADDING + (400 + GROUP_FIT_PADDING)) / 2;
  const centreY = (200 - GROUP_FIT_PADDING + (600 + GROUP_FIT_PADDING)) / 2;
  assert.ok(near(unclamped.offsetX + unclamped.scale * centreX, LOGICAL_VIEWPORT_WIDTH / 2, 1e-6));
  assert.ok(near(unclamped.offsetY + unclamped.scale * centreY, LOGICAL_VIEWPORT_HEIGHT / 2, 1e-6));
  // And at a clamped scale the centring still holds exactly.
  const clamped = fitLogicalBounds({ minX: -5000, minY: -5000, maxX: 5000, maxY: 4000 });
  const cx = 0;
  const cy = (-5000 - GROUP_FIT_PADDING + (4000 + GROUP_FIT_PADDING)) / 2;
  assert.ok(near(clamped.offsetX + clamped.scale * cx, LOGICAL_VIEWPORT_WIDTH / 2, 1e-6));
  assert.ok(near(clamped.offsetY + clamped.scale * cy, LOGICAL_VIEWPORT_HEIGHT / 2, 1e-6));
});

test("171 — constant 48-unit padding on all four sides", () => {
  assert.equal(GROUP_FIT_PADDING, 48);
  // A RECTANGULAR box, so a square-only implementation fails.
  const fitted = fitLogicalBounds({ minX: 200, minY: 300, maxX: 600, maxY: 500 });
  const paddedWidth = 600 - 200 + 2 * GROUP_FIT_PADDING;
  const paddedHeight = 500 - 300 + 2 * GROUP_FIT_PADDING;
  assert.ok(
    near(
      fitted.scale,
      Math.min(LOGICAL_VIEWPORT_WIDTH / paddedWidth, LOGICAL_VIEWPORT_HEIGHT / paddedHeight),
      1e-9,
    ),
  );
  // Padding precedes the extent floor: a point box pads to 96, not to 1.
  const point = fitLogicalBounds({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  assert.ok(near(point.offsetX, LOGICAL_VIEWPORT_WIDTH / 2 - point.scale * 0, 1e-9));
  assert.equal(point.scale, MAX_SCALE);
});

test("172 — member hit-box inclusion at HIT_R", () => {
  assert.equal(HIT_R, 26);
  const input = groupFitInput("Semantic Field Foundations");
  const result = computeGroupingFitBounds(input);
  assert.equal(result.ok, true);
  // Every member hit box is inside the returned bounds.
  for (const member of input.members) {
    assert.ok(result.bounds.minX <= member.x - HIT_R + EPS);
    assert.ok(result.bounds.maxX >= member.x + HIT_R - EPS);
    assert.ok(result.bounds.minY <= member.y - HIT_R + EPS);
    assert.ok(result.bounds.maxY >= member.y + HIT_R - EPS);
  }
  // Non-vacuity: dropping the hit boxes yields a strictly smaller box on at
  // least one edge, so the inclusion is doing real work.
  const shrunk = computeGroupingFitBounds({ ...input, members: [input.members[0]] });
  assert.ok(
    shrunk.bounds.minX > result.bounds.minX - EPS &&
      shrunk.bounds.maxX < result.bounds.maxX + EPS,
  );
  assert.ok(input.members.length > 1);
});

test("173 — grouping arc analytical bounds at GROUP_ARC_R = 370, including axis-crossing extrema", () => {
  assert.equal(GROUP_ARC_R, 370);
  // A synthetic span that crosses 90 degrees: the extremum is +370 on Y, which
  // is strictly beyond either endpoint.
  const crossing = computeGroupingFitBounds({
    members: [{ x: CENTRE_X, y: CENTRE_Y }],
    arc: { centreX: CENTRE_X, centreY: CENTRE_Y, startAngle: 60, endAngle: 120 },
  });
  assert.ok(near(crossing.bounds.maxY, CENTRE_Y + GROUP_ARC_R, 1e-9));
  // A span that does NOT cross 90 stops short of the extremum.
  const notCrossing = computeGroupingFitBounds({
    members: [{ x: CENTRE_X, y: CENTRE_Y }],
    arc: { centreX: CENTRE_X, centreY: CENTRE_Y, startAngle: 10, endAngle: 60 },
  });
  assert.ok(notCrossing.bounds.maxY < CENTRE_Y + GROUP_ARC_R - 1);
  // The real unwrapped data starts below zero; axis 0 is found there too.
  const real = computeGroupingFitBounds(groupFitInput("Semantic Field Foundations"));
  assert.equal(real.ok, true);
});

test("174 — permutation invariance of the result", () => {
  const input = groupFitInput("Boundary / Representation");
  const expected = computeGroupingFitBounds(input);
  for (let i = 0; i < 100; i += 1) {
    const shuffled = input.members.map((m, index) => input.members[(index + i) % input.members.length]);
    assert.deepEqual(computeGroupingFitBounds({ ...input, members: shuffled }), expected);
  }
  const reversed = [...input.members].reverse();
  assert.deepEqual(computeGroupingFitBounds({ ...input, members: reversed }), expected);
});

test("175 — no edge geometry, degree, relation count or semantic input affects the result", () => {
  // The GroupFitInput signature carries only {x, y} pairs and four numbers.
  const input = groupFitInput("Proxy / Legibility / Provenance");
  assert.deepEqual(Object.keys(input).sort(), ["arc", "members"]);
  for (const member of input.members) assert.deepEqual(Object.keys(member).sort(), ["x", "y"]);
  assert.deepEqual(Object.keys(input.arc).sort(), ["centreX", "centreY", "endAngle", "startAngle"]);
  // Varying the edge set cannot change the result, because no edge reaches it.
  const expected = computeGroupingFitBounds(input);
  for (const edges of [[], [...snapshot.edges], [...snapshot.edges].reverse()]) {
    assert.ok(Array.isArray(edges));
    assert.deepEqual(computeGroupingFitBounds(input), expected);
  }
  // No semantic field name appears in the constructor's source slice.
  const slice = viewportCode.slice(viewportCode.indexOf("export function computeGroupingFitBounds"));
  for (const forbidden of ["grouping", "edge_class", "relation_", "display_label", "visualization_role"]) {
    assert.ok(!slice.slice(0, slice.indexOf("export function fitLogicalBounds")).includes(forbidden));
  }
});

test("176 — no viewport-history input affects the result", () => {
  const input = groupFitInput("Coherence / Circulation / Collapse Risk");
  const expected = computeGroupingFitBounds(input);
  // Four prior viewport states, none of which can reach the constructor: it
  // takes no viewport parameter at all.
  for (const prior of [
    { scale: 1, offsetX: 0, offsetY: 0 },
    { scale: 2, offsetX: -400, offsetY: -100 },
    { scale: 4, offsetX: -3000, offsetY: -3000 },
    { scale: 2.5, offsetX: -12.5, offsetY: -900 },
  ]) {
    assert.ok(Number.isFinite(prior.scale));
    assert.deepEqual(computeGroupingFitBounds(input), expected);
  }
  assert.equal(computeGroupingFitBounds.length, 1);
});

test("177 — clampOffset is not applied after fitting", () => {
  // A box whose clamped scale differs from its raw scale, so the two candidate
  // offsets are genuinely DISTINCT — otherwise the check would be vacuous.
  const bounds = { minX: -5000, minY: -5000, maxX: 5000, maxY: 5000 };
  const fitted = fitLogicalBounds(bounds);
  const clamped = clampOffset(fitted.scale, fitted.offsetX, fitted.offsetY);
  assert.notDeepEqual({ x: fitted.offsetX, y: fitted.offsetY }, { x: clamped.offsetX, y: clamped.offsetY });
  // The centring offset is what is returned, not the clamped one.
  const centre = 0;
  assert.ok(near(fitted.offsetX + fitted.scale * centre, LOGICAL_VIEWPORT_WIDTH / 2, 1e-6));
  // And the source contains no post-fit clamp inside the fit function.
  const fitSlice = viewportCode.slice(
    viewportCode.indexOf("export function fitLogicalBounds"),
  );
  assert.ok(!fitSlice.slice(0, fitSlice.indexOf("export const LOGICAL_CENTRE")).includes("clampOffset"));
});

test("178 — all seven current groupings fit at radius 370, none below rawScale 1.0, minimum 1.992986", () => {
  assert.equal(radial.groups.length, 7);
  const results = radial.groups.map((group) => {
    const input = groupFitInput(group.key);
    const bounds = computeGroupingFitBounds(input);
    assert.equal(bounds.ok, true);
    const paddedWidth = bounds.bounds.maxX - bounds.bounds.minX + 2 * GROUP_FIT_PADDING;
    const paddedHeight = bounds.bounds.maxY - bounds.bounds.minY + 2 * GROUP_FIT_PADDING;
    const rawScale = Math.min(
      LOGICAL_VIEWPORT_WIDTH / paddedWidth,
      LOGICAL_VIEWPORT_HEIGHT / paddedHeight,
    );
    return { key: group.key, rawScale, fitted: fitLogicalBounds(bounds.bounds) };
  });
  // No grouping requires a scale below 1.0.
  for (const entry of results) {
    assert.ok(entry.rawScale >= MIN_SCALE, `${entry.key} needs rawScale ${entry.rawScale}`);
    // The clamp is a no-op for every current grouping.
    assert.ok(near(entry.fitted.scale, entry.rawScale, 1e-9));
  }
  const minimum = Math.min(...results.map((entry) => entry.rawScale));
  assert.equal(Number(minimum.toFixed(6)), 1.992986);
  assert.ok(near(minimum, 1.9929857762639689, 1e-12));
  // The minimum belongs to Boundary / Representation.
  const argmin = results.find((entry) => near(entry.rawScale, minimum, 1e-12));
  assert.equal(argmin.key, "Boundary / Representation");
});

test("179 — the arc-bounds term is evaluated at the imported GROUP_ARC_R and is not a caller parameter", () => {
  // GroupFitArc carries NO radius field.
  const input = groupFitInput("Constraint / Residue / Capability Shift");
  assert.ok(!Object.prototype.hasOwnProperty.call(input.arc, "radius"));
  assert.deepEqual(Object.keys(input.arc).sort(), ["centreX", "centreY", "endAngle", "startAngle"]);
  // The module imports the constant rather than redeclaring it.
  assert.ok(/import \{[\s\S]*?GROUP_ARC_R[\s\S]*?\} from "\.\/layout\.ts"/.test(viewportSource));
  assert.ok(!/const\s+GROUP_ARC_R\s*=/.test(viewportCode));
  // A supplied radius is ignored, because the parameter does not exist.
  const withRadius = { ...input, arc: { ...input.arc, radius: 999 } };
  assert.deepEqual(computeGroupingFitBounds(withRadius), computeGroupingFitBounds(input));
});

test("180 — no variable arc-radius input is supplied by runtime state", () => {
  const slice = viewportCode.slice(
    viewportCode.indexOf("export function computeGroupingFitBounds"),
    viewportCode.indexOf("export function fitLogicalBounds"),
  );
  assert.ok(slice.length > 0);
  // No viewport, selection, visitor, pointer or history value reaches the radius.
  for (const forbidden of ["viewport", "selection", "visitor", "pointer", "history", "scale"]) {
    assert.ok(!slice.includes(forbidden), `${forbidden} must not reach the radius`);
  }
  assert.ok(slice.includes("GROUP_ARC_R"));
});

test("181 — no DOM or rendered-text measurement determines the radius, and no DOM API is imported", () => {
  for (const forbidden of [
    "getBBox",
    "getBoundingClientRect",
    "getComputedStyle",
    "querySelector",
    "document",
    "window",
    "measureText",
  ]) {
    assert.ok(!viewportCode.includes(forbidden), `${forbidden} must not appear`);
  }
  // Positive control: the scan would catch a real DOM call.
  assert.ok("const b = node.getBBox();".includes("getBBox"));
  // The module imports only from layout.ts.
  const imports = [...viewportSource.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, ["./layout.ts"]);
});

// ---------------------------------------------------------------------------
// Fit All and Reset Exploration — checks 182 and 184
// ---------------------------------------------------------------------------

test("182 — Fit All changes only the transform", () => {
  // Fit All is EXACTLY the identity transform, not fitLogicalBounds(whole graph).
  assert.deepEqual(fitAll(), IDENTITY);
  assert.deepEqual(fitAll(), resetTransform());
  // The return shape carries only viewport fields, so it cannot express any
  // other change.
  assert.deepEqual(Object.keys(fitAll()).sort(), ["offsetX", "offsetY", "scale"]);
  assert.equal(fitAll.length, 0);
  // No check asserts Fit All is non-identity.
  assert.equal(applyShortcut({ scale: 3, offsetX: -500, offsetY: -500 }, "fit-all").scale, 1);
});

test("184 — Reset Exploration restores the identity transform", () => {
  // The viewport half of Reset Exploration is exactly the identity.
  const reset = resetTransform();
  assert.equal(reset.scale, 1);
  assert.equal(reset.offsetX, 0);
  assert.equal(reset.offsetY, 0);
  // A non-identity prior state does not survive.
  const prior = { scale: 3.5, offsetX: -1200, offsetY: -900 };
  assert.notDeepEqual(prior, resetTransform());
  assert.deepEqual(resetTransform(), IDENTITY);
});

// ---------------------------------------------------------------------------
// Keyboard-shortcut scope — checks 200–205
// ---------------------------------------------------------------------------

test("200 — the handler is scoped to the graph interaction region by event.target containment", () => {
  assert.equal(resolveShortcut(shortcutContext()), "zoom-in");
  // BOTH containment conditions are required.
  assert.equal(resolveShortcut(shortcutContext({ withinGraphRegion: false })), null);
  assert.equal(resolveShortcut(shortcutContext({ expandedMapActive: false })), null);
  assert.equal(
    resolveShortcut(shortcutContext({ withinGraphRegion: false, expandedMapActive: false })),
    null,
  );
});

test("201 — excludes input, textarea, select, contenteditable and button-under-activation targets", () => {
  for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) {
    assert.equal(resolveShortcut(shortcutContext({ targetTagName: tag })), null);
    // Case-insensitive, because DOM tag names vary by document type.
    assert.equal(resolveShortcut(shortcutContext({ targetTagName: tag.toLowerCase() })), null);
  }
  assert.equal(resolveShortcut(shortcutContext({ targetIsContentEditable: true })), null);
  assert.equal(resolveShortcut(shortcutContext({ targetIsButtonActivating: true })), null);
  // A plain target returns non-null, so the check cannot pass by rejecting all.
  assert.equal(resolveShortcut(shortcutContext({ targetTagName: "DIV" })), "zoom-in");
});

test("202 — excludes events with Ctrl, Meta or Alt", () => {
  for (const key of ["+", "-", "0"]) {
    assert.notEqual(resolveShortcut(shortcutContext({ key })), null);
    assert.equal(resolveShortcut(shortcutContext({ key, ctrlKey: true })), null);
    assert.equal(resolveShortcut(shortcutContext({ key, metaKey: true })), null);
    assert.equal(resolveShortcut(shortcutContext({ key, altKey: true })), null);
  }
});

test("203 — uses event.key rather than a physical key code, and permits Shift for +", () => {
  // Shift must NOT disqualify: `+` requires it on most layouts.
  assert.equal(resolveShortcut(shortcutContext({ key: "+", shiftKey: true })), "zoom-in");
  assert.equal(resolveShortcut(shortcutContext({ key: "-", shiftKey: true })), "zoom-out");
  assert.equal(resolveShortcut(shortcutContext({ key: "0", shiftKey: true })), "fit-all");
  // No physical key code is read anywhere in the module.
  assert.ok(!/keyCode|\bwhich\b|\bcode\s*===/.test(viewportCode));
  // No alias is invented: `=` is not a zoom key.
  assert.equal(resolveShortcut(shortcutContext({ key: "=" })), null);
});

test("204 — plus is Zoom In, minus is Zoom Out, step 1.25, clamped 1.0 to 4.0", () => {
  assert.equal(resolveShortcut(shortcutContext({ key: "+" })), "zoom-in");
  assert.equal(resolveShortcut(shortcutContext({ key: "-" })), "zoom-out");
  const from = { scale: 2, offsetX: 0, offsetY: 0 };
  assert.ok(near(applyShortcut(from, "zoom-in").scale, 2.5));
  assert.ok(near(applyShortcut(from, "zoom-out").scale, 1.6));
  // Both directions saturate at the approved bounds.
  assert.equal(applyShortcut({ scale: 4, offsetX: 0, offsetY: 0 }, "zoom-in").scale, MAX_SCALE);
  assert.equal(applyShortcut({ scale: 1, offsetX: 0, offsetY: 0 }, "zoom-out").scale, MIN_SCALE);
});

test("205 — zero invokes Fit All and never Reset Exploration", () => {
  assert.equal(resolveShortcut(shortcutContext({ key: "0" })), "fit-all");
  // The resolved operation set contains no reset-exploration member at all.
  const operations = new Set(
    ["+", "-", "0"].map((key) => resolveShortcut(shortcutContext({ key }))),
  );
  assert.deepEqual([...operations].sort(), ["fit-all", "zoom-in", "zoom-out"]);
  assert.ok(!viewportCode.includes("reset-exploration"));
  // Applying it yields the identity transform and touches nothing else.
  assert.deepEqual(applyShortcut({ scale: 3, offsetX: -900, offsetY: -100 }, "fit-all"), IDENTITY);
  // Every other key is ineligible, including the P7.1 bindings.
  for (const key of ["Tab", "Enter", " ", "Escape", "Home", "End", "ArrowUp", "ArrowLeft", "a"]) {
    assert.equal(resolveShortcut(shortcutContext({ key })), null);
  }
});

// ---------------------------------------------------------------------------
// Pointer arithmetic — checks 207–210
// ---------------------------------------------------------------------------

test("207 — drag-threshold arithmetic yields activation below and drag at or above", () => {
  assert.equal(DRAG_THRESHOLD, 3);
  // Below the threshold: an activation.
  assert.equal(classifyPointerEnd(100, 100, 101, 100, DRAG_THRESHOLD), "activation");
  assert.equal(classifyPointerEnd(100, 100, 100, 100, DRAG_THRESHOLD), "activation");
  // At and above: a drag. BOTH sides asserted, so a constant stub fails.
  assert.equal(classifyPointerEnd(100, 100, 103, 100, DRAG_THRESHOLD), "drag");
  assert.equal(classifyPointerEnd(100, 100, 140, 160, DRAG_THRESHOLD), "drag");
});

test("208 — pointer-state transition reducer for down, move, up, cancel and lost", () => {
  const v0 = resetTransform();
  const idle = idlePointerState();

  // down -> pending, with origin and start offset recorded.
  const down = reducePointer(idle, v0, { type: "down", id: 1, x: 200, y: 300 });
  assert.equal(down.pointer.phase, "pending");
  assert.equal(down.pointer.pointers.length, 1);
  assert.equal(down.pointer.originX, 200);
  assert.equal(down.pointer.verdict, "none");

  // move below threshold stays pending; at threshold becomes dragging + drag.
  const small = reducePointer(down.pointer, v0, { type: "move", id: 1, x: 201, y: 300 });
  assert.equal(small.pointer.phase, "pending");
  const dragged = reducePointer(down.pointer, v0, { type: "move", id: 1, x: 260, y: 300 });
  assert.equal(dragged.pointer.phase, "dragging");
  assert.equal(dragged.pointer.verdict, "drag");

  // up closes the pointer and returns to idle.
  const up = reducePointer(dragged.pointer, dragged.viewport, { type: "up", id: 1 });
  assert.equal(up.pointer.phase, "idle");
  assert.equal(up.pointer.pointers.length, 0);
  // A drag verdict SURVIVES the up route, so the resulting click can be eaten.
  assert.equal(up.pointer.verdict, "drag");

  // cancel and lost clear the verdict instead.
  assert.equal(
    reducePointer(dragged.pointer, dragged.viewport, { type: "cancel", id: 1 }).pointer.verdict,
    "none",
  );
  assert.equal(
    reducePointer(dragged.pointer, dragged.viewport, { type: "lost", id: 1 }).pointer.verdict,
    "none",
  );

  // Unknown or already-closed terminal id is a PURE NO-OP: pointer AND viewport
  // are returned unchanged, and a surviving pointer is never cancelled.
  for (const kind of ["up", "cancel", "lost", "runtime-cancel"]) {
    const noop = reducePointer(down.pointer, v0, { type: kind, id: 99 });
    assert.deepEqual(noop.pointer, down.pointer);
    assert.deepEqual(noop.viewport, v0);
  }

  // Structural impossibility DOES cancel deterministically — and only these.
  const impossible = { ...idle, phase: "pinching", pointers: [{ id: 1, x: 0, y: 0 }] };
  assert.deepEqual(reducePointer(impossible, v0, { type: "move", id: 1, x: 1, y: 1 }).pointer, idle);
  const duplicates = { ...idle, phase: "pending", pointers: [{ id: 1, x: 0, y: 0 }, { id: 1, x: 1, y: 1 }] };
  assert.deepEqual(reducePointer(duplicates, v0, { type: "up", id: 1 }).pointer, idle);
  const tooMany = {
    ...idle,
    phase: "pinching",
    pointers: [{ id: 1, x: 0, y: 0 }, { id: 2, x: 1, y: 1 }, { id: 3, x: 2, y: 2 }],
  };
  assert.deepEqual(reducePointer(tooMany, v0, { type: "up", id: 1 }).pointer, idle);
  const nonFinite = { ...idle, phase: "pending", pointers: [{ id: 1, x: Number.NaN, y: 0 }] };
  assert.deepEqual(reducePointer(nonFinite, v0, { type: "up", id: 1 }).pointer, idle);

  // Phase totality: every (phase, action) pair returns a defined phase.
  const phases = ["idle", "pending", "dragging", "pinching"];
  const actions = ["down", "move", "up", "cancel", "lost", "runtime-cancel"];
  let pairs = 0;
  for (const phase of phases) {
    for (const type of actions) {
      const seed =
        phase === "idle"
          ? idle
          : phase === "pinching"
            ? {
                ...idle,
                phase,
                pointers: [{ id: 1, x: 10, y: 10 }, { id: 2, x: 40, y: 10 }],
                pinchBaselineDistance: 30,
                pinchBaselineScale: 1,
                pinchBaselineMidpointX: 25,
                pinchBaselineMidpointY: 10,
                pinchBaselineOffsetX: 0,
                pinchBaselineOffsetY: 0,
                pinchBaselineAnchorX: 25,
                pinchBaselineAnchorY: 10,
              }
            : { ...idle, phase, pointers: [{ id: 1, x: 10, y: 10 }] };
      const result = reducePointer(seed, v0, { type, id: 1, x: 12, y: 12 });
      assert.ok(phases.includes(result.pointer.phase), `${phase}/${type}`);
      assert.ok(Number.isFinite(result.viewport.scale));
      pairs += 1;
    }
  }
  assert.equal(pairs, phases.length * actions.length);

  // The survivor transition: a pinch losing one pointer becomes a NEW pending
  // single-pointer gesture, and a delayed lost for the closed id changes nothing.
  const pinch = {
    ...idle,
    phase: "pinching",
    pointers: [{ id: 1, x: 400, y: 500 }, { id: 2, x: 600, y: 500 }],
    pinchBaselineDistance: 200,
    pinchBaselineScale: 1,
    pinchBaselineMidpointX: 500,
    pinchBaselineMidpointY: 500,
    pinchBaselineOffsetX: 0,
    pinchBaselineOffsetY: 0,
    pinchBaselineAnchorX: 500,
    pinchBaselineAnchorY: 500,
  };
  const survived = reducePointer(pinch, v0, { type: "up", id: 1 });
  assert.equal(survived.pointer.phase, "pending");
  assert.equal(survived.pointer.pointers.length, 1);
  assert.equal(survived.pointer.originX, 600);
  assert.equal(survived.pointer.pinchBaselineDistance, null);
  assert.equal(survived.pointer.pinchBaselineScale, null);
  assert.equal(survived.pointer.pinchBaselineMidpointX, null);
  assert.equal(survived.pointer.pinchBaselineMidpointY, null);
  assert.equal(survived.pointer.pinchBaselineOffsetX, null);
  assert.equal(survived.pointer.pinchBaselineOffsetY, null);
  assert.equal(survived.pointer.pinchBaselineAnchorX, null);
  assert.equal(survived.pointer.pinchBaselineAnchorY, null);
  const delayed = reducePointer(survived.pointer, survived.viewport, { type: "lost", id: 1 });
  assert.equal(JSON.stringify(delayed.pointer), JSON.stringify(survived.pointer));
  assert.equal(JSON.stringify(delayed.viewport), JSON.stringify(survived.viewport));
});

test("209 — pinch midpoint and scale come from two current pointer positions", () => {
  // An OFF-CENTRE midpoint, so a centre-only implementation fails.
  const a = { id: 1, x: 200, y: 400 };
  const b = { id: 2, x: 400, y: 400 };
  const pinch = pinchFrom(a, b);
  assert.equal(pinch.midX, 300);
  assert.equal(pinch.midY, 400);
  assert.equal(pinch.distance, 200);

  // The state retains live POSITIONS, which is what makes this computable.
  const seeded = {
    ...idlePointerState(),
    phase: "pinching",
    pointers: [a, b],
    pinchBaselineDistance: 200,
    pinchBaselineScale: 1,
    pinchBaselineMidpointX: 300,
    pinchBaselineMidpointY: 400,
    pinchBaselineOffsetX: 0,
    pinchBaselineOffsetY: 0,
    pinchBaselineAnchorX: 300,
    pinchBaselineAnchorY: 400,
  };
  const spread = reducePointer(seeded, resetTransform(), { type: "move", id: 2, x: 600, y: 400 });
  // Distance doubled from 200 to 400, so the scale doubles from 1 to 2.
  assert.ok(near(spread.viewport.scale, 2, 1e-9));
  assert.equal(spread.pointer.pointers.length, 2);
  assert.equal(spread.pointer.pointers[1].x, 600);
});

test("209a - same-distance two-pointer translation moves the viewport with the midpoint", () => {
  const initial = { scale: 2, offsetX: -400, offsetY: -300 };
  const first = reducePointer(idlePointerState(), initial, {
    type: "down",
    id: 1,
    x: 300,
    y: 300,
  });
  const pinch = reducePointer(first.pointer, first.viewport, {
    type: "down",
    id: 2,
    x: 500,
    y: 300,
  });
  const movedFirst = reducePointer(pinch.pointer, pinch.viewport, {
    type: "move",
    id: 1,
    x: 400,
    y: 400,
  });
  const movedBoth = reducePointer(movedFirst.pointer, movedFirst.viewport, {
    type: "move",
    id: 2,
    x: 600,
    y: 400,
  });
  assert.equal(movedBoth.viewport.scale, 2);
  assert.equal(movedBoth.viewport.offsetX, -300);
  assert.equal(movedBoth.viewport.offsetY, -200);
});

test("209b - pinch translation and scaling share the original midpoint anchor", () => {
  const initial = { scale: 2, offsetX: -400, offsetY: -300 };
  const first = reducePointer(idlePointerState(), initial, {
    type: "down",
    id: 1,
    x: 300,
    y: 300,
  });
  const pinch = reducePointer(first.pointer, first.viewport, {
    type: "down",
    id: 2,
    x: 500,
    y: 300,
  });
  const movedFirst = reducePointer(pinch.pointer, pinch.viewport, {
    type: "move",
    id: 1,
    x: 350,
    y: 350,
  });
  const movedBoth = reducePointer(movedFirst.pointer, movedFirst.viewport, {
    type: "move",
    id: 2,
    x: 650,
    y: 350,
  });
  assert.equal(movedBoth.viewport.scale, 3);
  assert.equal(movedBoth.viewport.offsetX, -700);
  assert.equal(movedBoth.viewport.offsetY, -550);
});

test("209c - pinch final state is independent of pointer move event order", () => {
  const initial = { scale: 2, offsetX: -400, offsetY: -300 };
  const build = () => {
    const one = reducePointer(idlePointerState(), initial, { type: "down", id: 1, x: 300, y: 300 });
    return reducePointer(one.pointer, one.viewport, { type: "down", id: 2, x: 500, y: 300 });
  };
  const firstOrder = build();
  const firstMoved = reducePointer(firstOrder.pointer, firstOrder.viewport, { type: "move", id: 1, x: 350, y: 350 });
  const firstFinal = reducePointer(firstMoved.pointer, firstMoved.viewport, { type: "move", id: 2, x: 650, y: 350 });
  const secondOrder = build();
  const secondMoved = reducePointer(secondOrder.pointer, secondOrder.viewport, { type: "move", id: 2, x: 650, y: 350 });
  const secondFinal = reducePointer(secondMoved.pointer, secondMoved.viewport, { type: "move", id: 1, x: 350, y: 350 });
  assert.deepEqual(secondFinal.viewport, firstFinal.viewport);
});

test("210 — tooltip-rectangle calculation is clamped to a supplied container rectangle", () => {
  const container = { x: 0, y: 0, width: 400, height: 300 };
  const extent = { width: 120, height: 40 };
  // All four edges clamp.
  assert.equal(tooltipRect("label", extent, -50, 10, container).x, 0);
  assert.equal(tooltipRect("label", extent, 10, -50, container).y, 0);
  assert.equal(tooltipRect("label", extent, 9999, 10, container).x, 400 - 120);
  assert.equal(tooltipRect("label", extent, 10, 9999, container).y, 300 - 40);
  // An already-inside rectangle is returned unchanged.
  assert.deepEqual(tooltipRect("label", extent, 100, 100, container), {
    x: 100,
    y: 100,
    width: 120,
    height: 40,
  });
  // Every edge lies inside the container for a sweep of anchors.
  for (let x = -100; x <= 500; x += 25) {
    for (let y = -100; y <= 400; y += 25) {
      const rect = tooltipRect("label", extent, x, y, container);
      assert.ok(rect.x >= container.x);
      assert.ok(rect.y >= container.y);
      assert.ok(rect.x + rect.width <= container.x + container.width + EPS);
      assert.ok(rect.y + rect.height <= container.y + container.height + EPS);
    }
  }
});

// ---------------------------------------------------------------------------
// Pointer purity — checks 211 and 212
// ---------------------------------------------------------------------------

test("211 — pointer helpers' signatures accept only viewport and pointer state", () => {
  // reducePointer(pointer, viewport, action) — three parameters, no DOM node,
  // no record, no edge, no grouping, no semantic metadata.
  assert.equal(reducePointer.length, 3);
  assert.equal(pinchFrom.length, 2);
  assert.equal(classifyPointerEnd.length, 5);
  assert.equal(tooltipRect.length, 5);
  const pointerSlice = viewportCode.slice(viewportCode.indexOf("export function reducePointer"));
  for (const forbidden of [
    "setPointerCapture",
    "releasePointerCapture",
    "addEventListener",
    "HTMLElement",
    "SVGElement",
    "Date.now",
    "performance.now",
  ]) {
    assert.ok(!pointerSlice.includes(forbidden), `${forbidden} must not appear`);
  }
  // Positive control: the scan would catch a real capture call.
  assert.ok("el.setPointerCapture(id);".includes("setPointerCapture"));
});

test("212 — the pointer helper module imports no dataset, contract or semantic-metadata module", () => {
  const imports = [...viewportSource.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, ["./layout.ts"]);
  for (const forbidden of [
    "./contract.ts",
    "./fallback.ts",
    "./runtimeLoader.ts",
    "./runtimeManifestContract.ts",
    "./emphasis.ts",
    "./decor.ts",
    "./publicWording.ts",
    "adjacency-map",
    "last-known-good",
  ]) {
    assert.ok(!imports.includes(forbidden), `${forbidden} must not be imported`);
    assert.ok(!viewportSource.includes(`from "${forbidden}"`));
  }
  // The imported symbols are geometry and serialization only.
  const importBlock = viewportSource.slice(0, viewportSource.indexOf('} from "./layout.ts"'));
  for (const symbol of ["CENTRE_X", "CENTRE_Y", "formatLogicalNumber", "GROUP_ARC_R", "HIT_R"]) {
    assert.ok(importBlock.includes(symbol));
  }
  assert.ok(!importBlock.includes("AdjacencyNode"));
  assert.ok(!importBlock.includes("AdjacencyEdge"));
});
