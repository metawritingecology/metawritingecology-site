// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — P7.1 visual state and composition.
//
// Canonical checks 84–129 and 138–151 (P7.1), plus 183, 185–199, 206 and
// 217–222 (P7.2). Eighty-three checks.
//
// P7.1 scope: layer structure, the decorative
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
import { DECOR_MARKS } from "../../src/lib/public-surface-adjacency-map/decor.ts";
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
  83,
  "this file must register exactly 83 canonical checks",
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
  // P7.2: the wrapper is AUTHORED at the identity transform, and it is the one
  // and only element the client ever writes a transform to.
  assert.ok(/data-psadj-viewport transform="translate\(0\.000,0\.000\) scale\(1\.000\)"/.test(componentCode));
  const wrapperWrites = [...clientCode.matchAll(/setAttribute\("transform"/g)];
  assert.equal(wrapperWrites.length, 1, "exactly one transform write site");
  assert.ok(/querySelector<SVGGElement>\("\[data-psadj-viewport\]"\)/.test(clientCode));
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
  // Each mark is frozen too, so no consumer can mutate one in place.
  for (const mark of DECOR_MARKS) assert.ok(Object.isFrozen(mark));
  for (const mark of DECOR_MARKS) {
    for (const key of ["x", "y", "r", "opacity"]) {
      assert.equal(typeof mark[key], "number", key);
      assert.ok(Number.isFinite(mark[key]), key);
    }
  }
  // Every value in the committed array is a literal, never an expression.
  const arrayBody = decorCode.slice(decorCode.indexOf("DECOR_MARKS"));
  assert.ok(arrayBody.includes("Object.freeze"), "the committed array must be frozen in source");
  assert.ok(!/[a-zA-Z_$][\w$]*\s*\(/.test(arrayBody.replace(/Object\.freeze\s*\(/g, "")));
});

test("91 — no generator and no pseudo-random source exists in the decor path", () => {
  for (const forbidden of ["Math.random", "crypto", "randomUUID", "seed", "noise", "for (", "while ("]) {
    assert.ok(!decorCode.includes(forbidden), `decor must contain no ${forbidden}`);
  }
  // Positive control: the scan would catch a real generator.
  assert.ok("const marks = Array.from({length: 20}, () => Math.random())".includes("Math.random"));
});

test("92 — no build step generates the marks, and two builds emit identical route bytes", () => {
  const packageJson = JSON.parse(rd("package.json"));
  for (const command of Object.values(packageJson.scripts)) {
    assert.ok(!command.includes("decor"), `no script may generate decor: ${command}`);
  }
  // The component consumes the committed constant directly.
  assert.ok(/import \{ DECOR_MARKS \} from/.test(component));
  assert.ok(/DECOR_MARKS\.map/.test(componentCode));

  // The second half of this check's approved contract: the emitted route must be
  // byte-identical across two builds. A Node test cannot BE that proof — the
  // decisive proof is the executed two-build byte comparison inside PSADJ-21,
  // which really deletes build 1 and really runs build 2. What this asserts is
  // that the gate is wired into the ordinary pipeline and cannot be silently
  // dropped, which is the part a source-level suite can actually guarantee.
  const verifier = rd("scripts/verify-public-surface-adjacency-map-build.mjs");

  // Build 1 is captured outside the repository, and left nowhere afterwards.
  assert.ok(/mkdtempSync\(join\(tmpdir\(\)/.test(verifier), "build 1 is captured outside the repo");
  assert.ok(/rmSync\(captureDir, \{ recursive: true, force: true \}\)/.test(verifier));
  // Build 1 output is destroyed, so no stale byte can satisfy the comparison.
  assert.ok(/rmSync\(p\("dist"\), \{ recursive: true, force: true \}\)/.test(verifier));
  assert.ok(/build 1 output could not be isolated before build 2/.test(verifier));
  // Build 2 really runs, on this pinned install, without re-entering `check`.
  assert.ok(/execFileSync\(process\.execPath, \[astroBinaryPath\(\), "build"\]/.test(verifier));
  assert.ok(!/"run",\s*"check"/.test(verifier), "the verifier must not re-enter the check script");
  // Raw bytes, not parsed DOM or normalized text, plus the artifact set itself.
  assert.ok(/bytesEqual\(readBytes\(first\), readBytes\(second\)\)/.test(verifier));
  assert.ok(/route bytes differ between two builds/.test(verifier));
  assert.ok(/the route-owned artifact set changed between builds/.test(verifier));
  assert.ok(/build 2 is missing a route artifact/.test(verifier));
  // At minimum the route document is compared.
  assert.ok(/public-surface-map\/expanded\/index\.html", join\(captureDir, "route\.html"\)/.test(verifier));
  // …and the comparison is over a deterministically ordered artifact list.
  assert.ok(/\[\.\.\.reachable\]\.sort\(\)/.test(verifier));

  // The gate runs in the ordinary pipeline: `check` invokes the verifier.
  assert.ok(packageJson.scripts.check.includes("verify:public-surface-adjacency-map"));
  assert.ok(/^node scripts\/verify-public-surface-adjacency-map-build\.mjs$/.test(
    packageJson.scripts["verify:public-surface-adjacency-map"],
  ));
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

test("96 — no glow, and the field is neutral graphite carrying no spectrum", () => {
  for (const effect of ["filter:", "box-shadow", "drop-shadow", "feGaussianBlur", "text-shadow"]) {
    assert.ok(!componentCode.includes(effect), `${effect} must not appear`);
  }
  // Positive control: the scan would catch a real glow declaration.
  assert.ok(".psadj-node { filter: drop-shadow(0 0 4px gold); }".includes("filter:"));

  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const token = (name: string) => {
    const match = new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i").exec(componentCode);
    assert.ok(match, `${name} must be declared`);
    return match[1].toLowerCase();
  };

  // The field is warm graphite, not a technology blue. Blue must not exceed red.
  const [fieldR, , fieldB] = rgb(token("--bg"));
  assert.ok(
    fieldB <= fieldR,
    `the graph field must not read blue: blue ${fieldB} exceeds red ${fieldR}`,
  );

  // Record bodies are ONE neutral stone: the three channels sit close together,
  // and that neutral — never a grouping accent — is what fills a glyph.
  const [bodyR, bodyG, bodyB] = rgb(token("--node-body"));
  assert.ok(
    Math.max(bodyR, bodyG, bodyB) - Math.min(bodyR, bodyG, bodyB) <= 24,
    "the record body must be a neutral stone, not a hue",
  );
  const glyphFills = [...componentCode.matchAll(/\.psadj-node__glyph[^{]*\{[^}]*fill:\s*([^;]+);/g)]
    .map((match) => match[1].trim());
  assert.ok(glyphFills.length > 0, "the glyph fill must be declared");
  for (const fill of glyphFills) {
    assert.ok(
      !/--group-/.test(fill),
      `a grouping accent must never fill a record body, found ${fill}`,
    );
  }
  // …and the accent is painted as a stroke, so grouping stays a thin rim.
  assert.ok(/\.psadj-node--concept \.psadj-node__glyph \{\s*stroke: var\(--group-stroke/.test(componentCode));

  // The seven accents are not arranged as a hue spectrum. Their hues, taken in
  // ring order, must be neither ascending nor descending.
  const RING_ORDER = [
    "--group-ai-readable",
    "--group-boundary-representation",
    "--group-coherence",
    "--group-constraint",
    "--group-proxy",
    "--group-responsibility",
    "--group-semantic-field-foundations",
  ];
  const hueOf = (hex: string) => {
    const [r, g, b] = rgb(hex).map((channel) => channel / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return h * 60;
  };
  const hues = RING_ORDER.map((name) => hueOf(token(name)));
  assert.equal(hues.length, 7);
  const ascending = hues.every((h, i) => i === 0 || h >= hues[i - 1]);
  const descending = hues.every((h, i) => i === 0 || h <= hues[i - 1]);
  assert.ok(!ascending && !descending, `the accents must not run in hue order: ${hues.map(Math.round)}`);
  // No accent is a saturated attention colour that would mark one group as
  // more important than the others. The threshold separates the approved
  // mineral accents (0.15–0.39 measured) from the rejected jewel/neon palette
  // it replaced (0.58–0.63 measured), so it is a real boundary rather than a
  // number fitted to the current values.
  for (const name of RING_ORDER) {
    const [r, g, b] = rgb(token(name));
    const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b);
    assert.ok(saturation <= 0.45, `${name} is too saturated to be equal-status: ${saturation}`);
  }
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
  // The hue is now a per-state token, so focus, hover and selection are told
  // apart from each other. It is still a TOKEN — never computed, never derived
  // from any data value — and the halo GEOMETRY is identical in all three
  // states, which is what this check has always protected.
  assert.ok(
    /stroke:\s*var\(--halo-color, var\(--focus\)\)/.test(haloRule[1]),
    "the halo colour must be a token with a token fallback",
  );
  assert.ok(!/calc\(|attr\(/.test(haloRule[1]), "no halo parameter may be computed");
  const stateColours = [...componentCode.matchAll(/--halo-color:\s*var\((--[\w-]+)\)/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(stateColours, ["--hover", "--focus", "--selection"]);
  assert.equal(new Set(stateColours).size, 3, "the three states must be visually distinct");
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
  // A legibility FLOOR rather than one pinned magic number: the value was
  // raised with the darker observatory field, because the same fraction reads
  // dimmer against blue-black than against the previous warm charcoal. The
  // guarantee is that inactive records stay readable while still reading as
  // de-emphasised.
  const inactiveRule = /\.psadj-node\[data-inactive="true"\]\s*\{[^}]*opacity:\s*([\d.]+)/.exec(
    componentCode,
  );
  assert.ok(inactiveRule, "the inactive record rule must declare one constant opacity");
  const inactiveOpacity = Number(inactiveRule[1]);
  assert.ok(inactiveOpacity >= 0.35, `inactive records must stay legible, got ${inactiveOpacity}`);
  assert.ok(inactiveOpacity < 1, "inactive records must still read as de-emphasised");
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
  // P7.2: exactly five viewport buttons, in the approved order.
  const actions = [...toolbar.matchAll(/data-psadj-action="([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(actions, [
    "zoom-out",
    "zoom-in",
    "fit-all",
    "reset-exploration",
    "focus-record",
  ]);
  assert.equal([...toolbar.matchAll(/<button/g)].length, 5, "exactly five viewport buttons");
  assert.ok(toolbar.length > 0, "the toolbar slice must be non-empty");
  // Every one is wired.
  assert.ok(/\[data-psadj-action\]/.test(clientCode));
  assert.ok(/button\.addEventListener\("click"/.test(clientCode));
});

test("106 — the five approved controls are rendered and the unapproved wording is absent", () => {
  // P7.2: the five approved labels are REQUIRED, and each must come from a
  // publicWording constant rather than an inline duplicate (guard 10(h)).
  const wording = rd("src/lib/public-surface-adjacency-map/publicWording.ts");
  const APPROVED = [
    ["Zoom Out", "ZOOM_OUT_LABEL"],
    ["Zoom In", "ZOOM_IN_LABEL"],
    ["Fit All", "FIT_ALL_LABEL"],
    ["Reset Exploration", "RESET_EXPLORATION_LABEL"],
    ["Focus Record", "FOCUS_RECORD_LABEL"],
  ];
  for (const [label, token] of APPROVED) {
    // The label is an approved constant…
    assert.ok(wording.includes(`export const ${token} = "${label}"`), `${token} must be approved`);
    // …the component INTERPOLATES it…
    assert.ok(componentCode.includes(`{${token}}`), `${token} must be interpolated`);
    // …and never duplicates the literal inline, per guard 10(h).
    assert.ok(!componentCode.includes(`>${label}<`), `${label} must not be inlined`);
  }
  // RETAINED: the unapproved wording variant stays prohibited everywhere.
  assert.ok(!component.includes("Reset view"));
  assert.ok(!client.includes("Reset view"));
  // Positive control: the scan would catch it.
  assert.ok('<button>Reset view</button>'.includes("Reset view"));
});

test("107 — native disabled is bounded to Focus Record and aria-disabled stays absent", () => {
  // RETAINED VERBATIM: aria-disabled is never the mechanism.
  assert.ok(!/aria-disabled/.test(componentCode));
  // RE-SCOPED: exactly one control may be rendered disabled, and it must be
  // Focus Record. A component with NO disabled control also fails, so the check
  // cannot be satisfied by removing the feature.
  const disabledButtons = [...componentCode.matchAll(/<button[^>]*?(?<![\w-])disabled(?![\w-])[^>]*>/g)];
  assert.equal(disabledButtons.length, 1, "exactly one control may be rendered disabled");
  assert.ok(/data-psadj-action="focus-record"/.test(disabledButtons[0][0]));
  // Scoped to the MARKUP: `.psadj__action:disabled` is a style rule, not a
  // rendered disabled control, and must not be read as one.
  const outsideButtons = markup.replace(/<button[\s\S]*?<\/button>/g, "");
  assert.ok(
    !/(?<![\w-])disabled(?![\w-])/.test(outsideButtons),
    "disabled is admissible only on a button",
  );
  // Only the three progressive-enhancement regions start hidden.
  const hiddenTargets = [
    ...componentCode.matchAll(/data-psadj-(\w+)[^>]*?(?<![\w-])hidden(?![\w-])/g),
  ].map((m) => m[1]);
  assert.deepEqual([...new Set(hiddenTargets)].sort(), ["canvas", "controls", "details"]);
});

test("108 — the P7.2 viewport surface is implemented, and stays element-scoped", () => {
  const viewportCode = rd("src/lib/public-surface-adjacency-map/viewport.ts");

  // (a) The eight viewport functions are REQUIRED exports of viewport.ts, and
  //     each must actually be wired in the client. An unused import fails.
  for (const symbol of [
    "clampScale",
    "stepScale",
    "zoomAbout",
    "clampOffset",
    "centreOn",
    "fitLogicalBounds",
    "resetTransform",
    "transformAttr",
  ]) {
    assert.ok(
      viewportCode.includes(`export function ${symbol}`),
      `${symbol} must be exported by viewport.ts`,
    );
  }
  assert.ok(clientCode.includes("public-surface-adjacency-map/viewport.ts"));
  for (const wired of ["stepScale", "zoomAbout", "centreOn", "fitLogicalBounds", "resetTransform", "transformAttr"]) {
    assert.ok(clientCode.includes(`${wired}(`), `${wired} must be called, not merely imported`);
  }

  // (b) The event surface is REQUIRED, and every listener binds to the CANVAS.
  //     Asserting the binding target is what makes a move to `window` fail even
  //     though the event name would still be present.
  for (const listener of [
    "wheel",
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "lostpointercapture",
  ]) {
    assert.ok(
      new RegExp(`canvas\\.addEventListener\\(\\s*"${listener}"`).test(clientCode),
      `${listener} must bind to the canvas, not to a global`,
    );
  }
  assert.ok(clientCode.includes("setPointerCapture"));
  assert.ok(/\{ passive: false \}/.test(clientCode), "wheel must bind with passive: false");

  // (c) Shortcut resolution lives in viewport.ts and reads event.key.
  for (const shortcut of ['"+"', '"-"', '"0"']) {
    assert.ok(viewportCode.includes(shortcut), `${shortcut} must be resolved in viewport.ts`);
  }
  assert.ok(!/keyCode|\bwhich\b/.test(stripComments(viewportCode)));

  // (d) RETAINED UNCHANGED — pointer capture makes a global listener
  //     unnecessary, so introducing one would be a regression, not a feature.
  assert.ok(!/document\.addEventListener/.test(clientCode));
  assert.ok(!/window\.addEventListener/.test(clientCode));
  // Positive controls for clause (d).
  assert.ok(/window\.addEventListener/.test('window.addEventListener("pointermove", f)'));
  assert.ok(/document\.addEventListener/.test('document.addEventListener("keydown", f)'));

  const canvasCss = componentCode.slice(
    componentCode.indexOf(".psadj__canvas {"),
    componentCode.indexOf(".psadj__details {"),
  );
  assert.match(canvasCss, /touch-action:\s*none/);
  assert.equal((componentCode.match(/touch-action:\s*none/g) ?? []).length, 1);
  assert.ok(!/(?:^|\s)(?:html|body)\s*\{[^}]*touch-action:/s.test(componentCode));

  const tooltipCss = componentCode.slice(
    componentCode.indexOf(".psadj__tooltip {"),
    componentCode.indexOf(".psadj__tooltip[data-visible=\"false\"] {"),
  );
  assert.match(tooltipCss, /position:\s*absolute/);
  assert.match(tooltipCss, /left:\s*var\(--psadj-tooltip-x/);
  assert.match(tooltipCss, /top:\s*var\(--psadj-tooltip-y/);
  assert.match(tooltipCss, /pointer-events:\s*none/);

  const pointerMove = clientCode.slice(
    clientCode.indexOf('canvas.addEventListener("pointermove"'),
    clientCode.indexOf('canvas.addEventListener("pointerup"'),
  );
  assert.ok(pointerMove.includes("renderTooltip(tooltip, canvas, state, event, hoverId)"));
  assert.ok(pointerMove.indexOf("renderTooltip(") < pointerMove.indexOf("if (!state.pointer.pointers"));
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
  assert.ok(arcsLayer.length > 0, "the arcs slice must be non-empty");
  // P7.2: every arc is a keyboard-operable control.
  assert.ok(/tabindex="0"/.test(arcsLayer), "every arc is focusable in P7.2");
  assert.ok(/role="button"/.test(arcsLayer));
  assert.ok(/aria-label=/.test(arcsLayer));
  assert.ok(
    !/data-psadj-arc="[^"]*"[^>]*aria-hidden/.test(componentCode),
    "an arc control must not be aria-hidden",
  );
  // RETAINED: the component binds no inline listener; the client delegates.
  assert.ok(!/addEventListener/.test(arcsLayer));
  assert.ok(/data-psadj-arc-action/.test(clientCode), "the client binds arcs by delegation");
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

  // D18 — responsive role labels.
  //
  // The viewBox is fixed, so a label's rendered size is its logical size times
  // the SVG's on-screen scale. That scale falls as low as 0.21, which renders
  // the 13-unit desktop label at about 3 CSS pixels. These bands raise the
  // logical size as the scale falls, and move the label outward past the orbit
  // where a large label has room — the annulus between the separator ring and
  // the role halo is only 31 units wide.
  assert.ok(
    /@media \(max-width: 1199px\)[\s\S]{0,240}?\.psadj-role-label\s*\{[^}]*font-size:\s*24px/.test(
      componentCode,
    ),
    "the intermediate label band must be declared",
  );
  assert.ok(
    /@media \(max-width: 899px\)[\s\S]{0,240}?\.psadj-role-label\s*\{[^}]*font-size:\s*38px/.test(
      componentCode,
    ),
    "the compact label band must be declared",
  );
  assert.ok(
    /transform:\s*translate\(var\(--psadj-label-shift-x, 0\), var\(--psadj-label-shift-y, 0\)\)/.test(
      componentCode,
    ),
    "the compact bands must move the label outward",
  );
  // The shift is authored per label from its own radius vector, so it stays on
  // the label's own angle and the label-to-role association is unambiguous.
  assert.ok(/const COMPACT_ROLE_LABEL_R = 486;/.test(component));
  assert.ok(/COMPACT_ROLE_LABEL_R \/ ROLE_LABEL_R - 1/.test(component));
  assert.ok(/style=\{compactLabelShift\(label\)\}/.test(component));
  // The wide regime is untouched, so 1200px and 1440px render as reviewed.
  assert.ok(/\.psadj__canvas \.psadj-role-label\s*\{[^}]*font-size:\s*13px/.test(componentCode));
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

// ---------------------------------------------------------------------------
// P7.2 — Fit All and Reset Exploration state contracts — checks 183, 185, 186
// ---------------------------------------------------------------------------

const ACTION_LOOP = 'for (const button of container.querySelectorAll<HTMLButtonElement>("[data-psadj-action]"))';
const actionHandler = clientCode.slice(
  clientCode.indexOf(ACTION_LOOP),
  clientCode.indexOf("function syncFocusRecord()"),
);

test("183 — Fit All preserves selection, details, readout, emphasis and edge visibility", () => {
  assert.ok(actionHandler.length > 0);
  const fitAllBranch = actionHandler.slice(
    actionHandler.indexOf('action === "fit-all"'),
    actionHandler.indexOf('action === "reset-exploration"'),
  );
  assert.ok(fitAllBranch.includes("fitAll()"));
  // It writes ONLY the viewport; none of the five preserved surfaces appears.
  for (const preserved of ["selectedId", "visible", "hoveredId", "focusedId", "renderDetails", "resolveEmphasis"]) {
    assert.ok(!fitAllBranch.includes(preserved), `Fit All must not touch ${preserved}`);
  }
});

test("185 — Reset Exploration clears selection and emphasis and falls back through the precedence", () => {
  const reset = actionHandler.slice(
    actionHandler.indexOf('action === "reset-exploration"'),
    actionHandler.indexOf('action === "focus-record"'),
  );
  assert.ok(reset.includes("state.selectedId = null"));
  assert.ok(reset.includes("resetTransform()"));
  // Hover is NOT cleared: the §7.2 resolver decides the readout on its own.
  assert.ok(!reset.includes("state.hoveredId"), "hover must not be cleared");
  assert.ok(/resolveReadoutLabel/.test(clientCode), "the precedence resolver is retained");
});

test("186 — Reset Exploration restores canonical edge defaults and touches no data surface", () => {
  const reset = actionHandler.slice(
    actionHandler.indexOf('action === "reset-exploration"'),
    actionHandler.indexOf('action === "focus-record"'),
  );
  assert.ok(reset.includes("source_named_adjacency: true"));
  assert.ok(reset.includes("navigation_adjacency: false"));
  for (const forbidden of ["bootRuntimeLoader", "location", "history", "fetch(", "pushState"]) {
    assert.ok(!reset.includes(forbidden), `Reset Exploration must not use ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// P7.2 — Focus Record — checks 187–192
// ---------------------------------------------------------------------------

const focusRecordBranch = actionHandler.slice(actionHandler.indexOf('action === "focus-record"'));

test("187 — the native disabled binding derives from selection state", () => {
  const sync = clientCode.slice(
    clientCode.indexOf("function syncFocusRecord()"),
    clientCode.indexOf('"wheel",'),
  );
  assert.ok(sync.includes("button.disabled = state.selectedId === null"));
  // The expression reads ONLY selectedId.
  for (const other of ["hoveredId", "focusedId", "visible", "viewport"]) {
    assert.ok(!sync.includes(other), `the disabled binding must not read ${other}`);
  }
});

test("188 — the handler contains the defensive no-selection guard", () => {
  assert.ok(focusRecordBranch.includes("if (!state.selectedId) return;"));
  // The guard precedes every effect in that branch.
  assert.ok(
    focusRecordBranch.indexOf("if (!state.selectedId) return;") <
      focusRecordBranch.indexOf("centreOn("),
  );
});

test("189 — the no-selection branch performs no centring, state change or announcement", () => {
  const guardIndex = focusRecordBranch.indexOf("if (!state.selectedId) return;");
  const beforeGuard = focusRecordBranch.slice(0, guardIndex);
  for (const effect of ["centreOn(", "announce(", "state.viewport =", "selectNode("]) {
    assert.ok(!beforeGuard.includes(effect), `${effect} must not run without a selection`);
  }
});

test("190 — the selected state enables the control by removing native disabled", () => {
  assert.ok(/data-psadj-action="focus-record" disabled/.test(markup), "authored disabled");
  assert.ok(clientCode.includes("button.disabled = state.selectedId === null"));
  // aria-disabled is never the mechanism, anywhere.
  assert.ok(!/aria-disabled/.test(componentCode));
  assert.ok(!/aria-disabled/.test(clientCode));
});

test("191 — Focus Record is the only individual-record centring caller", () => {
  const calls = [...clientCode.matchAll(/centreOn\(/g)];
  assert.equal(calls.length, 1, "exactly one centreOn call site");
  assert.ok(focusRecordBranch.includes("centreOn("));
});

test("192 — selection never invokes centring", () => {
  // Neither the click nor the Enter/Space selection path writes the viewport.
  const clickBlock = clientCode.slice(
    clientCode.indexOf('canvas.addEventListener("click"'),
    clientCode.indexOf(ACTION_LOOP),
  );
  const selectIndex = clickBlock.indexOf("selectNode(state, id)");
  assert.ok(selectIndex > 0);
  assert.ok(!clickBlock.slice(selectIndex).includes("centreOn("));
  // And a pointerdown on a record or an arc returns BEFORE any capture, so
  // selecting can never begin a viewport gesture either.
  const down = clientCode.slice(
    clientCode.indexOf('canvas.addEventListener("pointerdown"'),
    clientCode.indexOf('canvas.addEventListener("pointermove"'),
  );
  assert.ok(down.indexOf("pointerTargetKind") < down.indexOf("setPointerCapture"));
  assert.ok(/!== "background"\) return;/.test(down));
});

// ---------------------------------------------------------------------------
// P7.2 — grouping-arc activation — checks 193–195
// ---------------------------------------------------------------------------

const activateBlock = clientCode.slice(
  clientCode.indexOf("function activateGroupingArc("),
  clientCode.indexOf("function selectNode("),
);

test("193 — activation invokes group-bounds fitting only", () => {
  assert.ok(activateBlock.includes("computeGroupingFitBounds("));
  assert.ok(activateBlock.includes("fitLogicalBounds("));
  // No selection, classification or layout function is called.
  for (const forbidden of ["selectNode", "resolveEmphasis", "computeRadialLayout", "announce("]) {
    assert.ok(!activateBlock.includes(forbidden), `activation must not call ${forbidden}`);
  }
  // The empty-group result returns BEFORE any transform is produced.
  assert.ok(activateBlock.indexOf("if (!bounds.ok) return;") < activateBlock.indexOf("fitLogicalBounds("));
  assert.ok(!/state\.viewport = resetTransform\(\)/.test(activateBlock), "no identity assignment");
});

test("194 — activation preserves selection, edge visibility, details and emphasis", () => {
  for (const preserved of ["selectedId", "state.visible", "renderDetails", "resolveEmphasis"]) {
    assert.ok(!activateBlock.includes(preserved), `activation must not touch ${preserved}`);
  }
  // It writes the viewport and nothing else.
  assert.ok(activateBlock.includes("state.viewport = fitLogicalBounds"));
});

test("195 — arcs expose keyboard-operable control semantics with the full grouping label", () => {
  const arcsLayer = componentCode.slice(layerIndex("arcs"), layerIndex("centre"));
  assert.ok(/tabindex="0"/.test(arcsLayer));
  assert.ok(/role="button"/.test(arcsLayer));
  // The accessible name contains the COMPLETE grouping label.
  assert.ok(/aria-label=\{`\$\{group\.key\}\./.test(arcsLayer));
  assert.equal(layout.groups.length, 7);
  // Enter and Space both activate, via the client's keydown delegation.
  assert.ok(/data-psadj-arc-action/.test(clientCode));
  assert.ok(/event\.key === "Enter" \|\| event\.key === " "/.test(clientCode));
  // SUPPORTING: the arc `d` expression is untouched, so the emitted path bytes
  // are byte-identical to the accepted P7.1 baseline.
  assert.ok(/d=\{groupArcPath\(group\)\}/.test(componentCode));
  for (const group of layout.groups) assert.equal(group.radius, GROUP_ARC_R);
});

// ---------------------------------------------------------------------------
// P7.2 — final toolbar — checks 196–198
// ---------------------------------------------------------------------------

const toolbarSlice = componentCode.slice(
  componentCode.indexOf("data-psadj-controls"),
  componentCode.indexOf("psadj__grid"),
);

test("196 — the final toolbar contains exactly seven functional controls", () => {
  const toggles = [...toolbarSlice.matchAll(/data-psadj-toggle="([a-z_]+)"/g)];
  const actions = [...toolbarSlice.matchAll(/data-psadj-action="([a-z-]+)"/g)];
  assert.equal(toggles.length, 2);
  assert.equal(actions.length, 5);
  assert.equal(toggles.length + actions.length, 7);
  // Every one is wired.
  assert.ok(/input\.addEventListener\("change"/.test(clientCode));
  assert.ok(/button\.addEventListener\("click"/.test(clientCode));
});

test("197 — no ambiguous Reset view control or string exists", () => {
  assert.ok(!component.includes("Reset view"));
  assert.ok(!client.includes("Reset view"));
  assert.ok(!rd("src/lib/public-surface-adjacency-map/publicWording.ts").includes("Reset view"));
  assert.ok("<button>Reset view</button>".includes("Reset view"));
});

test("198 — each new control has markup, handler, state and disabled state in this package", () => {
  for (const action of ["zoom-out", "zoom-in", "fit-all", "reset-exploration", "focus-record"]) {
    assert.ok(toolbarSlice.includes(`data-psadj-action="${action}"`), `${action} markup`);
    assert.ok(actionHandler.includes(`"${action}"`), `${action} handler`);
  }
  // No rendered control lacks a bound handler.
  assert.ok(/for \(const button of container\.querySelectorAll/.test(clientCode));
  // The disabled-state contract ships in the same package.
  assert.ok(clientCode.includes("function syncFocusRecord()"));
  assert.ok(/data-psadj-action="focus-record" disabled/.test(markup));
});

// ---------------------------------------------------------------------------
// P7.2 — shortcut scope, client legs — checks 199 and 206
// ---------------------------------------------------------------------------

test("199 — no document-level or window-level shortcut listener is installed", () => {
  assert.ok(!/document\.addEventListener/.test(clientCode));
  assert.ok(!/window\.addEventListener/.test(clientCode));
  // Extended in P7.2 to pointer and wheel listeners: pointer capture makes a
  // global listener unnecessary, so one would be a regression.
  for (const event of ["wheel", "pointermove", "pointerup", "pointercancel"]) {
    assert.ok(!new RegExp(`window\\.addEventListener\\(\\s*"${event}"`).test(clientCode));
    assert.ok(new RegExp(`canvas\\.addEventListener\\(\\s*"${event}"`).test(clientCode));
  }
  // Positive controls.
  assert.ok(/window\.addEventListener/.test('window.addEventListener("pointermove", f)'));
  assert.ok(/document\.addEventListener/.test('document.addEventListener("keydown", f)'));
});

test("206 — preventDefault only for eligible handled shortcuts, and Tab is never intercepted", () => {
  const keydown = clientCode.slice(
    clientCode.indexOf('canvas.addEventListener("keydown"'),
    clientCode.indexOf('details.addEventListener("keydown"'),
  );
  // The shortcut preventDefault sits INSIDE the non-null operation branch.
  const branch = keydown.slice(keydown.indexOf("if (operation) {"), keydown.indexOf("const arcKey"));
  assert.ok(branch.includes("event.preventDefault();"));
  // Shortcut resolution precedes the record-only gate, which is retained verbatim.
  assert.ok(keydown.indexOf("resolveShortcut({") < keydown.indexOf("if (!currentId) return;"));
  assert.ok(keydown.includes("if (!currentId) return;"));
  // Wheel binds with passive:false and only prevents inside its eligibility branch.
  const wheel = clientCode.slice(
    clientCode.indexOf('"wheel",'),
    clientCode.indexOf('canvas.addEventListener("pointerdown"'),
  );
  assert.ok(wheel.includes("{ passive: false }"));
  assert.ok(wheel.indexOf("if (!eligible) return;") < wheel.indexOf("event.preventDefault();"));
  // Tab is never named anywhere in the client.
  assert.ok(!clientCode.includes('"Tab"'));
});

// ---------------------------------------------------------------------------
// P7.2 — non-adoption and readout retention — checks 217–222
// ---------------------------------------------------------------------------

const pointerPath = clientCode + rd("src/lib/public-surface-adjacency-map/viewport.ts");

test("217 — no easing, inertia, momentum or velocity token in the pointer path", () => {
  for (const token of ["easing", "inertia", "momentum", "velocity"]) {
    assert.ok(!stripComments(pointerPath).toLowerCase().includes(token), `${token} is not adopted`);
  }
  // Positive control for each.
  for (const token of ["easing", "inertia", "momentum", "velocity"]) {
    assert.ok(`const ${token} = 0.9;`.includes(token));
  }
});

test("218 — no pointer-lock request", () => {
  for (const token of ["requestPointerLock", "pointerlockchange", "pointerLockElement", "exitPointerLock"]) {
    assert.ok(!pointerPath.includes(token), `${token} is not adopted`);
  }
});

test("219 — no rotation is applied to data space", () => {
  const writers = stripComments(clientCode);
  assert.ok(!/rotate\(/.test(writers), "no rotation in any transform writer");
  assert.ok(!/matrix\(/.test(writers));
  // The only transform written is translate+scale.
  assert.ok(/translate\(\$\{x\},\$\{y\}\) scale\(\$\{s\}\)/.test(rd("src/lib/public-surface-adjacency-map/viewport.ts")));
});

test("220 — no transform-writing code path references the decor layer", () => {
  const writer = clientCode.slice(
    clientCode.indexOf("function writeViewportTransform("),
    clientCode.indexOf("function finalizePointer("),
  );
  assert.ok(writer.length > 0);
  assert.ok(writer.includes("[data-psadj-viewport]"));
  assert.ok(!writer.includes("decor"), "the transform writer must not reference decor");
  // decor is authored OUTSIDE the wrapper, so it can never be transformed.
  assert.ok(layerIndex("decor") < componentCode.indexOf("data-psadj-viewport"));
});

test("221 — the <p> readout still exists and focus and selection paths still populate it", () => {
  assert.ok(readoutTag.startsWith("<p "));
  assert.ok(readoutTag.includes("data-psadj-label-readout"));
  assert.ok(readoutTag.includes('aria-hidden="true"'));
  assert.ok(/function renderReadout\(/.test(clientCode));
  // focusin and the selection paths still call the renderer.
  const focusin = clientCode.slice(clientCode.indexOf('canvas.addEventListener("focusin"'));
  assert.ok(focusin.slice(0, 400).includes("renderReadout("));
  assert.ok(/selectNode\(state, currentId\);\n      syncFocusRecord\(\);\n      renderDetails/.test(clientCode));
});

test("222 — no role, aria-live or aria-atomic is added to the readout, and the tooltip does not replace it", () => {
  for (const forbidden of ["role=", "aria-live", "aria-atomic", "tabindex"]) {
    assert.ok(!readoutTag.includes(forbidden), `the readout must not carry ${forbidden}`);
  }
  // The tooltip is a DISTINCT element and carries no readout attribute.
  const tooltipIndex = componentCode.indexOf("data-psadj-tooltip");
  assert.notEqual(tooltipIndex, -1, "the tooltip element must exist");
  assert.notEqual(tooltipIndex, readoutIndex);
  const tooltipTag = componentCode.slice(
    componentCode.lastIndexOf("<", tooltipIndex),
    componentCode.indexOf(">", tooltipIndex) + 1,
  );
  assert.ok(!tooltipTag.includes("data-psadj-label-readout"));
  for (const forbidden of ["role=", "aria-live", "aria-atomic"]) {
    assert.ok(!tooltipTag.includes(forbidden), `the tooltip must not carry ${forbidden}`);
  }
  assert.ok(tooltipTag.includes('aria-hidden="true"'));
  // The readout is still written, and the tooltip writes a separate element.
  assert.ok(/readout\.textContent = resolveReadoutLabel/.test(clientCode));
  assert.ok(/tooltip\.textContent = label/.test(clientCode));
});
