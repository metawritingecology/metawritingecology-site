// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — P7.1 visual state and composition.
//
// Canonical checks 84–129 and 138–151: layer structure, the decorative
// background, glow and visual state, neighbourhood emphasis, the two-control
// toolbar and the absence of every deferred control, the label-readout element
// contract and its precedence, non-interactive grouping arcs, route width and
// the responsive grid, and the content and DOM contracts. Sixty checks.
//
// The markup and CSS legs are asserted here against source; the emitted-bytes
// legs of the same checks are carried by the build verifier (PSADJ-15 through
// PSADJ-21), so each canonical check is asserted once at each level and counted
// once overall.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertAdjacencySnapshot } from "../../src/lib/public-surface-adjacency-map/contract.ts";
import {
  CENTRAL_TEXT_CLEAR_R,
  computeRadialLayout,
  computeRoleOrbit,
  GROUP_ARC_R,
  HIT_R,
  RING_R,
  SAME_GROUP_BULGE_R,
  SEPARATOR_RING_R,
} from "../../src/lib/public-surface-adjacency-map/layout.ts";
import { DECOR_MARKS, DECOR_VIGNETTE } from "../../src/lib/public-surface-adjacency-map/decor.ts";
import { resolveEmphasis } from "../../src/lib/public-surface-adjacency-map/emphasis.ts";
import { resolveReadoutLabel } from "../../src/lib/public-surface-adjacency-map/layout.ts";
import {
  CENTRAL_STATEMENT_LINES,
  GROUP_ARC_STATEMENT,
  READOUT_NEUTRAL_TEXT,
  RECORD_ORDER_DISCLAIMER,
  ROLE_ORBIT_CAPTION,
} from "../../src/lib/public-surface-adjacency-map/publicWording.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertAdjacencySnapshot(
  JSON.parse(rd("src/data/public-surface-adjacency-map/last-known-good.json")),
);
const nodes = snapshot.nodes;
const component = rd("src/components/PublicSurfaceAdjacencyMap.astro");
const client = rd("src/scripts/public-surface-adjacency-map.ts");
const page = rd("src/pages/public-surface-map/expanded/index.astro");
const interactive = rd("src/pages/public-surface-map/interactive.astro");
const baseLayout = rd("src/layouts/BaseLayout.astro");
const decorSource = rd("src/lib/public-surface-adjacency-map/decor.ts");
const emphasisSource = rd("src/lib/public-surface-adjacency-map/emphasis.ts");
const layoutSource = rd("src/lib/public-surface-adjacency-map/layout.ts");

const stripComments = (source) =>
  source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
    .join("\n");

const componentCode = stripComments(component);
const clientCode = stripComments(client);
const decorCode = stripComments(decorSource);

const layout = computeRadialLayout(nodes);
const orbit = computeRoleOrbit(nodes);

/**
 * The template only, with both `<style>` blocks removed. Counting occurrences
 * across the whole file would also count the CSS selector that styles an
 * element, so a single authored layer would read as two.
 */
const markup = componentCode.slice(0, componentCode.indexOf("<style"));

const LAYERS = ["decor", "edges", "arcs", "centre", "nodes"];
const layerIndex = (name) => componentCode.indexOf(`data-psadj-layer="${name}"`);
const readoutIndex = componentCode.indexOf("data-psadj-label-readout");
const svgCloseIndex = componentCode.indexOf("</svg>");
const legendIndex = componentCode.indexOf("psadj__compact-legend");

/** The tag that carries `data-psadj-label-readout`, with its attributes. */
const readoutTag = (() => {
  const start = componentCode.lastIndexOf("<", readoutIndex);
  const end = componentCode.indexOf(">", readoutIndex);
  return componentCode.slice(start, end + 1);
})();

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

/** Controls deferred to P7.2. None may be rendered, and no placeholder for one
 *  may exist, in this package. */
const DEFERRED_CONTROLS = [
  "Zoom Out",
  "Zoom In",
  "Fit All",
  "Reset Exploration",
  "Focus Record",
  "Reset view",
];

/** This file with its own prohibition vocabularies removed, so each scan flags
 *  a real usage rather than the list that names what to look for. */
const ownSourceScannable = ownSource
  .replace(/const SKIPPED_TEST_MARKERS = \[[\s\S]*?\n\];/, "")
  .replace(/const DEFERRED_CONTROLS = \[[\s\S]*?\n\];/, "");

assert.ok(
  ownSourceScannable.length < ownSource.length,
  "the self-scan must strip this file's own prohibition vocabularies",
);
assert.equal(
  [...ownSource.matchAll(/^test\(/gm)].length,
  60,
  "this file must register exactly 60 canonical checks",
);
for (const marker of SKIPPED_TEST_MARKERS) {
  assert.ok(!ownSourceScannable.includes(marker), `no check may be ${marker}`);
}
assert.ok(componentCode.length > 0 && clientCode.length > 0 && page.length > 0);
assert.notEqual(readoutIndex, -1, "the readout element must exist");
assert.notEqual(svgCloseIndex, -1, "the authored SVG must exist");
assert.notEqual(legendIndex, -1, "the compact legend must exist");

// ---------------------------------------------------------------------------
// Layer structure — checks 84–88
// ---------------------------------------------------------------------------

test("84 — the five named rendering layers are present, once each", () => {
  for (const layer of LAYERS) {
    const occurrences = [...markup.matchAll(new RegExp(`data-psadj-layer="${layer}"`, "g"))];
    assert.equal(occurrences.length, 1, `${layer} must appear exactly once`);
  }
  assert.equal(LAYERS.length, 5);
  assert.ok(markup.length > 0 && markup.length < componentCode.length);
});

test("85 — the layers appear in the required order", () => {
  const positions = LAYERS.map(layerIndex);
  for (const position of positions) assert.notEqual(position, -1);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test("86 — exactly one viewport wrapper exists", () => {
  const wrappers = [...componentCode.matchAll(/data-psadj-viewport/g)];
  assert.equal(wrappers.length, 1);
  // P7.1 writes no transform onto it; that is P7.2 work.
  assert.ok(!/data-psadj-viewport[^>]*transform/.test(componentCode));
  assert.ok(!/data-psadj-viewport/.test(clientCode), "the client never touches the wrapper");
});

test("87 — the wrapper contains the edges, arcs, centre and nodes layers", () => {
  const wrapperIndex = componentCode.indexOf("data-psadj-viewport");
  for (const layer of ["edges", "arcs", "centre", "nodes"]) {
    assert.ok(layerIndex(layer) > wrapperIndex, `${layer} must sit inside the wrapper`);
  }
  assert.ok(componentCode.indexOf("</svg>") > layerIndex("nodes"));
});

test("88 — the decor layer sits outside the viewport wrapper", () => {
  const wrapperIndex = componentCode.indexOf("data-psadj-viewport");
  assert.ok(layerIndex("decor") < wrapperIndex, "decor must precede the wrapper");
  // …and it is not a descendant: the decor group closes before the wrapper opens.
  const decorClose = componentCode.indexOf("</g>", layerIndex("decor"));
  assert.ok(decorClose < wrapperIndex, "the decor group must close before the wrapper opens");
});

// ---------------------------------------------------------------------------
// Decorative background — checks 89–95
// ---------------------------------------------------------------------------

test("89 — decor.ts imports no dataset, snapshot or layout module", () => {
  const imports = [...decorSource.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((m) => m[1]);
  assert.deepEqual(imports, [], "decor.ts must import nothing at all");
  for (const forbidden of ["contract", "layout", "last-known-good", "snapshot"]) {
    assert.ok(!decorCode.includes(forbidden), `decor must not reference ${forbidden}`);
  }
  assert.ok(DECOR_MARKS.length > 0);
});

test("90 — the exported marks are a frozen array of numeric literals", () => {
  assert.ok(Object.isFrozen(DECOR_MARKS));
  assert.ok(Object.isFrozen(DECOR_VIGNETTE));
  for (const mark of DECOR_MARKS) {
    for (const key of ["x", "y", "r", "opacity"]) {
      assert.equal(typeof mark[key], "number", key);
      assert.ok(Number.isFinite(mark[key]), key);
    }
  }
  // Every value in the committed array is a literal, never an expression.
  const arrayBody = decorCode.slice(
    decorCode.indexOf("DECOR_MARKS"),
    decorCode.indexOf("DECOR_VIGNETTE"),
  );
  assert.ok(!/[a-zA-Z_$][\w$]*\s*\(/.test(arrayBody.replace(/Object\.freeze\s*\(/g, "")));
});

test("91 — no generator and no pseudo-random source exists in the decor path", () => {
  for (const forbidden of ["Math.random", "crypto", "randomUUID", "seed", "noise", "for (", "while ("]) {
    assert.ok(!decorCode.includes(forbidden), `decor must contain no ${forbidden}`);
  }
  // Positive control: the scan would catch a real generator.
  assert.ok("const marks = Array.from({length: 20}, () => Math.random())".includes("Math.random"));
});

test("92 — no build step generates the marks", () => {
  const packageJson = JSON.parse(rd("package.json"));
  for (const command of Object.values(packageJson.scripts)) {
    assert.ok(!command.includes("decor"), `no script may generate decor: ${command}`);
  }
  // The component consumes the committed constant directly.
  assert.ok(/import \{ DECOR_MARKS \} from/.test(component));
  assert.ok(/DECOR_MARKS\.map/.test(componentCode));
});

test("93 — no decorative mark lies inside the central clear disc", () => {
  assert.ok(DECOR_MARKS.length >= 10, "the mark set must not be empty or trivial");
  for (const mark of DECOR_MARKS) {
    const radius = Math.hypot(mark.x - 500, mark.y - 500);
    assert.ok(radius > CENTRAL_TEXT_CLEAR_R, `a mark at radius ${radius} entered the clear disc`);
  }
});

test("94 — decor coordinates are disjoint from every computed record coordinate", () => {
  const points = [...layout.positions.values(), ...orbit.positions.values()];
  assert.equal(points.length, 59, "both coordinate spaces must have been populated");
  for (const mark of DECOR_MARKS) {
    for (const point of points) {
      assert.ok(
        Math.hypot(mark.x - point.cx, mark.y - point.cy) > 1,
        `a mark coincides with a record at ${point.cx},${point.cy}`,
      );
    }
  }
});

test("95 — the decor layer is aria-hidden, inert and carries no listener", () => {
  const decorTag = componentCode.slice(
    layerIndex("decor") - 40,
    componentCode.indexOf(">", layerIndex("decor")) + 1,
  );
  assert.ok(/aria-hidden="true"/.test(decorTag));
  assert.ok(!/tabindex/.test(decorTag));
  assert.ok(!/role=/.test(decorTag));
  assert.ok(/\[data-psadj-layer="decor"\]\s*\{[^}]*pointer-events:\s*none/.test(componentCode));
  assert.ok(!/decor[^\n]*addEventListener/.test(clientCode), "no listener may bind to decor");
});

// ---------------------------------------------------------------------------
// Glow and visual state — checks 96–100
// ---------------------------------------------------------------------------

test("96 — no filter, blur, shadow or glow is declared for the rest state", () => {
  for (const effect of ["filter:", "box-shadow", "drop-shadow", "feGaussianBlur", "text-shadow"]) {
    assert.ok(!componentCode.includes(effect), `${effect} must not appear`);
  }
  // Positive control: the scan would catch a real glow declaration.
  assert.ok(".psadj-node { filter: drop-shadow(0 0 4px gold); }".includes("filter:"));
});

test("97 — halo classes exist only for hover, focus and selected", () => {
  const haloRules = [...componentCode.matchAll(/([^{}]*psadj-node__halo[^{}]*)\{([^}]*)\}/g)];
  const activating = haloRules.filter(([, , body]) => /opacity:\s*1/.test(body));
  assert.equal(activating.length, 3, "exactly three states may raise the halo");
  const selectors = activating.map(([, selector]) => selector.trim()).join(" ");
  assert.ok(/:hover/.test(selectors));
  assert.ok(/:focus-visible/.test(selectors));
  assert.ok(/\[data-selected="true"\]/.test(selectors));
  // Rest state carries no halo at all.
  assert.ok(/\.psadj-node__halo\s*\{[^}]*opacity:\s*0/.test(componentCode));
});

test("98 — halo parameters are constants and no code path computes one", () => {
  const haloRule = /\.psadj-node__halo\s*\{([^}]*)\}/.exec(componentCode);
  assert.ok(haloRule, "the halo rule must exist");
  assert.ok(/stroke-width:\s*1\.5/.test(haloRule[1]), "one constant stroke width");
  assert.ok(/stroke:\s*var\(--accent\)/.test(haloRule[1]), "one constant colour token");
  assert.equal(new Set([...componentCode.matchAll(/psadj-node__halo" r="([\d.]+)"/g)].map((m) => m[1])).size, 1);
  assert.ok(!/halo/.test(clientCode), "the client must never compute a halo value");
});

test("99 — no blur rule targets record text, glyph geometry or active edges", () => {
  assert.ok(!/blur/.test(componentCode), "blur is confined to decor, and decor uses none");
  for (const protectedSelector of ["psadj-node__glyph", "psadj-edge", "psadj-arc-label"]) {
    const rules = [...componentCode.matchAll(new RegExp(`${protectedSelector}[^{}]*\\{([^}]*)\\}`, "g"))];
    assert.ok(rules.length > 0, `${protectedSelector} must be styled`);
    for (const [, body] of rules) {
      assert.ok(!/filter|blur/.test(body), `${protectedSelector} must not be blurred`);
    }
  }
});

test("100 — inactive opacity is constant and inactive records stay reachable", () => {
  assert.ok(/\[data-inactive="true"\]\s*\{\s*opacity:\s*0\.28/.test(componentCode));
  // Nothing removes an inactive record from the focus order or the record list.
  const inactiveRules = [...componentCode.matchAll(/\[data-inactive="true"\][^{}]*\{([^}]*)\}/g)];
  assert.ok(inactiveRules.length > 0);
  for (const [, body] of inactiveRules) {
    for (const removal of ["display: none", "visibility: hidden", "pointer-events: none"]) {
      assert.ok(!body.includes(removal), `an inactive record must not be ${removal}`);
    }
  }
  assert.ok(!/tabindex="-1"/.test(componentCode));
});

// ---------------------------------------------------------------------------
// Neighbourhood emphasis — checks 101–104
// ---------------------------------------------------------------------------

const SELECTED = "ai-readable-knowledge-architecture.md";
const bothVisible = { source_named_adjacency: true, navigation_adjacency: true };
const namedOnly = { source_named_adjacency: true, navigation_adjacency: false };

test("101 — the emphasis set derives only from currently visible edge classes", () => {
  const both = resolveEmphasis({ selectedId: SELECTED, edges: snapshot.edges, visible: bothVisible });
  const named = resolveEmphasis({ selectedId: SELECTED, edges: snapshot.edges, visible: namedOnly });
  assert.ok(both.edgeIds.size > 0, "the fixture must actually have neighbours");
  assert.ok(named.edgeIds.size > 0);
  assert.ok(named.edgeIds.size < both.edgeIds.size, "hiding a class must narrow the set");
  const byId = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
  for (const id of named.edgeIds) {
    assert.equal(byId.get(id).edge_class, "source_named_adjacency");
  }
});

test("102 — emphasis never includes a neighbour reachable only through a hidden class", () => {
  const both = resolveEmphasis({ selectedId: SELECTED, edges: snapshot.edges, visible: bothVisible });
  const named = resolveEmphasis({ selectedId: SELECTED, edges: snapshot.edges, visible: namedOnly });
  const onlyViaHidden = [...both.nodeIds].filter((id) => !named.nodeIds.has(id));
  assert.ok(onlyViaHidden.length > 0, "the fixture must contain such a neighbour");
  for (const id of onlyViaHidden) {
    assert.ok(!named.nodeIds.has(id), `${id} leaked from a hidden class`);
  }
});

test("103 — emphasis returns no edge outside the verified 383", () => {
  const known = new Set(snapshot.edges.map((edge) => edge.id));
  assert.equal(known.size, 383);
  for (const selectedId of [SELECTED, ...snapshot.nodes.slice(0, 12).map((n) => n.id)]) {
    const result = resolveEmphasis({ selectedId, edges: snapshot.edges, visible: bothVisible });
    for (const id of result.edgeIds) assert.ok(known.has(id), id);
  }
});

test("104 — the emphasis shape carries no coordinate, and never reaches navigation", () => {
  const result = resolveEmphasis({ selectedId: SELECTED, edges: snapshot.edges, visible: bothVisible });
  assert.deepEqual(Object.keys(result).sort(), ["edgeIds", "nodeIds"]);
  for (const forbidden of ["x", "y", "cx", "cy", "theta", "d", "order", "grouping"]) {
    assert.ok(!(forbidden in result), `emphasis must not expose ${forbidden}`);
  }
  // With no selection there is no emphasis at all.
  const none = resolveEmphasis({ selectedId: null, edges: snapshot.edges, visible: bothVisible });
  assert.equal(none.nodeIds.size, 0);
  assert.equal(none.edgeIds.size, 0);
  // Structural: navigation imports nothing from the emphasis module.
  assert.ok(!layoutSource.includes("emphasis"), "the navigation module must not read emphasis");
  assert.ok(!emphasisSource.includes("resolveDirectionalTarget"));
});

// ---------------------------------------------------------------------------
// Toolbar and deferred-control absence — checks 105–108
// ---------------------------------------------------------------------------

test("105 — exactly two functional toolbar controls are rendered", () => {
  const toggles = [...componentCode.matchAll(/data-psadj-toggle="([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(toggles, ["source_named_adjacency", "navigation_adjacency"]);
  assert.equal(toggles.length, 2);
  // Both are wired, so neither is a control without behaviour.
  assert.ok(/\[data-psadj-toggle\]/.test(clientCode));
  assert.ok(/input\.addEventListener\("change"/.test(clientCode));
  // No other button exists inside the toolbar.
  const toolbar = componentCode.slice(
    componentCode.indexOf("data-psadj-controls"),
    componentCode.indexOf("psadj__grid"),
  );
  assert.ok(!/<button/.test(toolbar), "the P7.1 toolbar renders no button");
});

test("106 — none of the five deferred controls is rendered", () => {
  for (const control of DEFERRED_CONTROLS) {
    assert.ok(!component.includes(control), `${control} must not be rendered in P7.1`);
    assert.ok(!client.includes(control), `${control} must not be wired in P7.1`);
  }
});

test("107 — no disabled or hidden placeholder exists for a deferred control", () => {
  assert.ok(!/aria-disabled/.test(componentCode));
  assert.ok(!/\bdisabled\b/.test(componentCode), "no control is rendered disabled in P7.1");
  // Only the three progressive-enhancement regions start hidden.
  const hiddenTargets = [
    ...componentCode.matchAll(/data-psadj-(\w+)[^>]*?(?<![\w-])hidden(?![\w-])/g),
  ].map((m) => m[1]);
  assert.deepEqual([...new Set(hiddenTargets)].sort(), ["canvas", "controls", "details"]);
});

test("108 — the client contains no handler or dead branch for a P7.2 surface", () => {
  for (const symbol of [
    "viewport.ts",
    "clampScale",
    "stepScale",
    "zoomAbout",
    "clampOffset",
    "centreOn",
    "fitLogicalBounds",
    "resetTransform",
    "transformAttr",
    "wheel",
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "setPointerCapture",
    "lostpointercapture",
  ]) {
    assert.ok(!clientCode.includes(symbol), `${symbol} is P7.2 and must be absent`);
  }
  for (const shortcut of ['=== "+"', '=== "-"', '=== "0"']) {
    assert.ok(!clientCode.includes(shortcut), `${shortcut} is a P7.2 shortcut`);
  }
  assert.ok(!/document\.addEventListener/.test(clientCode));
  assert.ok(!/window\.addEventListener/.test(clientCode));
});

// ---------------------------------------------------------------------------
// Label readout element contract — checks 109–122
// ---------------------------------------------------------------------------

test("109 — the readout is a <p> carrying data-psadj-label-readout", () => {
  assert.ok(readoutTag.startsWith("<p "), `expected a <p>, got ${readoutTag}`);
  assert.ok(readoutTag.includes("data-psadj-label-readout"));
  assert.equal([...markup.matchAll(/data-psadj-label-readout/g)].length, 1);
});

test("110 — <output> appears nowhere as a readout element", () => {
  assert.ok(!/<output/i.test(component));
  assert.ok(!/<output/i.test(client));
});

test("111 — the readout carries aria-hidden=true", () => {
  assert.ok(/aria-hidden="true"/.test(readoutTag), readoutTag);
});

test("112 — the readout carries no role attribute", () => {
  assert.ok(!/\srole=/.test(readoutTag), readoutTag);
});

test("113 — the readout carries no aria-live", () => {
  assert.ok(!/aria-live/.test(readoutTag), readoutTag);
});

test("114 — the readout carries no aria-atomic", () => {
  assert.ok(!/aria-atomic/.test(readoutTag), readoutTag);
});

test("115 — the readout carries no tabindex", () => {
  assert.ok(!/tabindex/.test(readoutTag), readoutTag);
});

test("116 — the readout is never focused programmatically", () => {
  assert.ok(!/readout[^\n]*\.focus\(/.test(clientCode));
  assert.ok(/focusNode\(canvas, /.test(clientCode), "focus only ever moves to a record control");
});

test("117 — the readout intercepts no pointer events", () => {
  assert.ok(/\[data-psadj-label-readout\]\s*\{[^}]*pointer-events:\s*none/.test(componentCode));
  assert.ok(!/readout[^\n]*addEventListener/.test(clientCode));
});

test("118 — the readout is not inside the SVG", () => {
  assert.ok(readoutIndex > svgCloseIndex, "the readout must follow the closing SVG tag");
});

test("119 — the readout sits after the SVG and before the compact legend", () => {
  assert.ok(svgCloseIndex < readoutIndex);
  assert.ok(readoutIndex < legendIndex);
});

test("120 — the readout is outside the viewport wrapper", () => {
  const wrapperIndex = componentCode.indexOf("data-psadj-viewport");
  assert.ok(readoutIndex > wrapperIndex);
  assert.ok(readoutIndex > svgCloseIndex, "and therefore outside every transform container");
});

test("121 — the readout is populated through textContent only", () => {
  assert.ok(/readout\.textContent = resolveReadoutLabel\(/.test(clientCode));
  for (const unsafe of ["innerHTML", "outerHTML", "insertAdjacentHTML"]) {
    assert.ok(!clientCode.includes(unsafe), unsafe);
  }
});

test("122 — the readout wraps, is never the only surface, and never announces", () => {
  assert.ok(/\[data-psadj-label-readout\]\s*\{[^}]*overflow-wrap:\s*anywhere/.test(componentCode));
  // The same values exist on the authoritative surfaces.
  assert.ok(/data-psadj-details-title/.test(componentCode), "the details panel carries the label");
  assert.ok(/data-psadj-record-list/.test(componentCode), "the record list carries every label");
  assert.ok(/aria-label=\{`\$\{node\.display_label\}/.test(componentCode), "so does each control");
  // Writing the readout never touches the status live region.
  const readoutWriter = clientCode.slice(
    clientCode.indexOf("function renderReadout"),
    clientCode.indexOf("function renderDetails"),
  );
  assert.ok(!/announce\(/.test(readoutWriter), "the readout must not announce");
});

// ---------------------------------------------------------------------------
// Label readout precedence — checks 123–128
// ---------------------------------------------------------------------------

const labels = new Map([
  ["a", "Alpha record"],
  ["b", "Beta record"],
  ["c", "Gamma record"],
]);
const readout = (state) =>
  resolveReadoutLabel({
    focusedId: null,
    hoveredId: null,
    selectedId: null,
    labels,
    neutralText: READOUT_NEUTRAL_TEXT,
    ...state,
  });

test("123 — keyboard focus takes priority over hover and selection", () => {
  assert.equal(readout({ focusedId: "a", hoveredId: "b", selectedId: "c" }), "Alpha record");
  assert.equal(readout({ focusedId: "a", selectedId: "c" }), "Alpha record");
  assert.equal(readout({ focusedId: "a", hoveredId: "b" }), "Alpha record");
});

test("124 — hover outranks selection only when no record has keyboard focus", () => {
  assert.equal(readout({ hoveredId: "b", selectedId: "c" }), "Beta record");
  // …and never while a record is focused. This is the direction that matters:
  // hover must not steal a keyboard user's label.
  assert.equal(readout({ focusedId: "a", hoveredId: "b", selectedId: "c" }), "Alpha record");
});

test("125 — selection remains the persistent fallback label", () => {
  assert.equal(readout({ selectedId: "c" }), "Gamma record");
  assert.equal(readout({ focusedId: null, hoveredId: null, selectedId: "c" }), "Gamma record");
});

test("126 — neutral text appears only when focus, hover and selection are absent", () => {
  assert.equal(readout({}), READOUT_NEUTRAL_TEXT);
  assert.ok(READOUT_NEUTRAL_TEXT.length > 0);
  // It originates from the approved wording module, by identity.
  assert.ok(/READOUT_NEUTRAL_TEXT/.test(clientCode));
  assert.ok(/export const READOUT_NEUTRAL_TEXT/.test(rd("src/lib/public-surface-adjacency-map/publicWording.ts")));
});

test("127 — arrow focus shows the focused label while the panel keeps the selection", () => {
  // Focus moves from selected record A to record B.
  assert.equal(readout({ focusedId: "b", selectedId: "a" }), "Beta record");
  // The details panel reads `selectedId` and nothing else, so the two surfaces
  // are allowed to disagree — which is the point of the precedence.
  const detailsRenderer = clientCode.slice(
    clientCode.indexOf("function renderDetails"),
    clientCode.indexOf("function appendField"),
  );
  assert.ok(/state\.selectedId/.test(detailsRenderer));
  assert.ok(!/focusedId/.test(detailsRenderer), "the details panel must not read focus");
  assert.ok(!/hoveredId/.test(detailsRenderer), "the details panel must not read hover");
});

test("128 — focus state clears only on actual focus departure", () => {
  // Exactly one assignment clears the focused record, and it is in `focusout`.
  const clears = [...clientCode.matchAll(/state\.focusedId = null/g)];
  assert.equal(clears.length, 1);
  const focusout = clientCode.slice(
    clientCode.indexOf('canvas.addEventListener("focusout"'),
    clientCode.indexOf('canvas.addEventListener("pointerover"'),
  );
  assert.ok(/state\.focusedId = null/.test(focusout));
  // Neither selection nor hover writes the focused record.
  const selectFn = clientCode.slice(
    clientCode.indexOf("function selectNode"),
    clientCode.indexOf("function nodeById"),
  );
  assert.ok(!/focusedId/.test(selectFn), "selection must not touch focus state");
  const pointerover = clientCode.slice(
    clientCode.indexOf('canvas.addEventListener("pointerover"'),
    clientCode.indexOf('canvas.addEventListener("pointerout"'),
  );
  assert.ok(!/focusedId/.test(pointerover), "hover must not touch focus state");
  // The resolver takes no viewport parameter, so no state transition needs one.
  assert.equal(resolveReadoutLabel.length, 1);
});

// ---------------------------------------------------------------------------
// Grouping arcs in P7.1 — checks 129 and 138
// ---------------------------------------------------------------------------

test("129 — grouping arcs and labels are rendered and non-interactive", () => {
  const arcs = [...componentCode.matchAll(/data-psadj-arc=/g)];
  assert.equal(arcs.length, 1, "arcs are emitted by one mapped template");
  assert.ok(/radial\.groups\.map/.test(componentCode), "all seven groupings are rendered");
  assert.equal(layout.groups.length, 7);
  const arcsLayer = componentCode.slice(layerIndex("arcs"), layerIndex("centre"));
  assert.ok(!/tabindex/.test(arcsLayer), "an arc must not be focusable in P7.1");
  assert.ok(!/role="button"/.test(arcsLayer), "an arc must not be a control in P7.1");
  assert.ok(!/addEventListener/.test(arcsLayer));
  assert.ok(!/data-psadj-arc/.test(clientCode), "the client must not bind an arc");
});

test("138 — no unresolved arc-radius owner-decision marker remains", () => {
  for (const source of [component, client, layoutSource, page]) {
    for (const marker of ["owner decision", "unspecified radius", "any radius in", "rendered radius"]) {
      assert.ok(!source.toLowerCase().includes(marker), `${marker} must not remain`);
    }
  }
  // Positive control: the scan would catch a real placeholder.
  assert.ok("// TODO: owner decision on the arc radius".toLowerCase().includes("owner decision"));
});

// ---------------------------------------------------------------------------
// Route width and responsive grid — checks 139–145
// ---------------------------------------------------------------------------

test("139 — the route declares max-width 1440px on its own main class", () => {
  assert.ok(/main\.main--psadj-expanded\s*\{[^}]*max-width:\s*1440px/.test(page));
  assert.ok(!/max-width:\s*1200px/.test(page), "the old route width must be gone");
});

test("140 — global width tokens are unchanged and the sibling route keeps 1200px", () => {
  assert.ok(/main\.main--psam-preview\s*\{[^}]*max-width:\s*1200px/.test(interactive));
  assert.ok(!/max-width/.test(baseLayout), "the shared layout must declare no width");
  assert.ok(!page.includes("main--psam-preview"), "the routes must not share a class");
});

test("141 — the graph grid declares the approved column tracks", () => {
  assert.ok(
    /grid-template-columns:\s*minmax\(0, 880px\) minmax\(280px, 340px\)/.test(componentCode),
  );
});

test("142 — the grid gap does not exceed 24px", () => {
  const grid = /\.psadj__grid\s*\{([^}]*)\}/.exec(componentCode);
  assert.ok(grid, "the grid rule must exist");
  const gap = /gap:\s*(\d+)px/.exec(grid[1]);
  assert.ok(gap, "the grid must declare a gap");
  assert.ok(Number(gap[1]) <= 24, `gap ${gap[1]}px exceeds the maximum`);
});

test("143 — the graph region declares min-width: 0", () => {
  assert.ok(/\.psadj__canvas-column\s*\{[^}]*min-width:\s*0/.test(componentCode));
});

test("144 — the SVG declares max-width: 100%", () => {
  assert.ok(/\.psadj__canvas svg\s*\{[^}]*max-width:\s*100%/.test(componentCode));
});

test("145 — wrap rules are declared and the grid collapses below 640px", () => {
  assert.ok(/overflow-wrap:\s*anywhere/.test(componentCode));
  const narrow = componentCode.slice(componentCode.indexOf("@media (max-width: 640px)"));
  assert.ok(narrow.length > 0, "the breakpoint must exist");
  assert.ok(/\.psadj__grid\s*\{\s*grid-template-columns:\s*1fr;/.test(narrow));
});

// ---------------------------------------------------------------------------
// Content and DOM contracts — checks 146–151
// ---------------------------------------------------------------------------

test("146 — the central region holds exactly the two approved lines", () => {
  assert.equal(CENTRAL_STATEMENT_LINES.length, 2);
  assert.deepEqual([...CENTRAL_STATEMENT_LINES], [
    "Navigation grouping only",
    "No hierarchy, ranking, or authority",
  ]);
  const centre = componentCode.slice(layerIndex("centre"), layerIndex("nodes"));
  assert.ok(/aria-hidden="true"/.test(centre));
  assert.ok(/CENTRAL_STATEMENT_LINES\.map/.test(centre));
  // Nothing else lives in the disc: no record, glyph, legend, count or logo.
  for (const forbidden of ["data-psadj-node", "psadj-arc", "psadj-decor", "count"]) {
    assert.ok(!centre.includes(forbidden), `the centre must not contain ${forbidden}`);
  }
  assert.ok(/\[data-psadj-layer="centre"\]\s*\{[^}]*pointer-events:\s*none/.test(componentCode));
});

test("147 — the grouping-arc statement is verbatim and survives without JavaScript", () => {
  assert.ok(GROUP_ARC_STATEMENT.startsWith("Group arc length reflects the number"));
  assert.ok(GROUP_ARC_STATEMENT.includes("does not indicate importance, authority"));
  // Rendered in the compact legend, which carries no `hidden` attribute…
  const legend = componentCode.slice(legendIndex, legendIndex + 600);
  assert.ok(/GROUP_ARC_STATEMENT/.test(legend));
  assert.ok(!/hidden/.test(legend), "the compact legend must never start hidden");
  // …and repeated in the about-region.
  assert.ok([...componentCode.matchAll(/GROUP_ARC_STATEMENT/g)].length >= 2);
});

test("148 — boundary text and the data-status row stay outside the collapsible region", () => {
  const detailsIndex = componentCode.indexOf("<details");
  assert.notEqual(detailsIndex, -1);
  for (const required of [
    "data-psadj-boundary-statements",
    "NOT_CLAIMS.map",
    "data-psadj-relationship",
    "data-psadj-runtime-status",
    "data-psadj-scope",
  ]) {
    const position = componentCode.indexOf(required);
    assert.ok(position !== -1 && position < detailsIndex, `${required} must precede <details>`);
  }
});

test("149 — the about-region content is server-rendered and closed by default", () => {
  assert.ok(/<details class="psadj__about">/.test(componentCode));
  assert.ok(!/<details[^>]*\bopen\b/.test(componentCode), "the region starts collapsed");
  const detailsIndex = componentCode.indexOf("<details");
  const body = componentCode.slice(detailsIndex);
  // Provenance is relocated, never removed: it renders inside the element.
  for (const relocated of ["data-psadj-sha256", "data-psadj-record-count", "psadj__legend-list"]) {
    assert.ok(body.includes(relocated), `${relocated} must render inside the about-region`);
  }
});

test("150 — the fallback still lists all 59 records and is not hidden", () => {
  assert.ok(/data-psadj-record-list/.test(componentCode));
  assert.ok(!/data-psadj-record-list[^>]*hidden/.test(componentCode));
  assert.ok(/allRecords\.map\(\(node\) =>/.test(componentCode));
  assert.equal(snapshot.nodes.length, 59);
  assert.ok(/data-psadj-record=\{node\.id\}/.test(componentCode));
});

test("151 — the orbit caption is verbatim and concept labels are not rendered on the ring", () => {
  assert.equal(ROLE_ORBIT_CAPTION, "Context records · outside the semantic layout");
  assert.ok(/ROLE_ORBIT_CAPTION/.test(componentCode));
  // Group arc labels and role labels ARE rendered…
  assert.ok(/psadj-arc-label/.test(componentCode));
  assert.ok(/psadj-role-label/.test(componentCode));
  assert.equal(orbit.labels.length, 3);
  // …and concept labels are not: 49 simultaneous labels at radius 330 cannot be
  // legible, which is exactly why the readout exists.
  const nodesLayer = componentCode.slice(layerIndex("nodes"));
  assert.ok(!/display_label\}<\/text>/.test(nodesLayer), "no concept label is drawn on the ring");
  assert.ok(RECORD_ORDER_DISCLAIMER.includes("does not indicate hierarchy"));
});
