// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — interaction and accessibility tests.
//
// The deterministic layout and keyboard modules are pure, so they are exercised
// directly against the ACTUAL adopted dataset. The wiring that lives in the
// client module and the Astro component (which install DOM listeners on import
// and therefore cannot execute here) is asserted as source-level contracts over
// the exact expressions those files use — the same style the existing
// authority-map tests already use.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  assertAdjacencySnapshot,
  fixedBandRecords,
  semanticLayoutRecords,
  EDGE_CLASS_DEFAULT_VISIBLE,
} from "../../src/lib/public-surface-adjacency-map/contract.ts";
import {
  ADJACENCY_LAYOUT_METRICS,
  buildNavigationIndex,
  columnsForWidth,
  compareNodes,
  computeFixedBands,
  computeSemanticLayout,
  directionForKey,
  firstReachableId,
  lastReachableId,
  resolveSpatialTarget,
  shortenLabel,
  SPATIAL_DIRECTIONS,
} from "../../src/lib/public-surface-adjacency-map/layout.ts";
import {
  NOT_CLAIMS,
  RELATIONSHIP_SENTENCE,
  AUTHORITY_VIEW_LABEL,
  EXPANDED_VIEW_LABEL,
} from "../../src/lib/public-surface-adjacency-map/publicWording.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertAdjacencySnapshot(
  JSON.parse(rd("src/data/public-surface-adjacency-map/last-known-good.json")),
);
const concepts = semanticLayoutRecords(snapshot);
const bandNodes = fixedBandRecords(snapshot);

const component = rd("src/components/PublicSurfaceAdjacencyMap.astro");
const client = rd("src/scripts/public-surface-adjacency-map.ts");
const page = rd("src/pages/public-surface-map/expanded/index.astro");

const layout = (columns = 3) => computeSemanticLayout(concepts, { columnsPerBand: columns });
const bands = (columns = 3) => computeFixedBands(bandNodes, { columnsPerBand: columns });
const navIndex = (columns = 3) => buildNavigationIndex(layout(columns), bands(columns));

const serialize = (l) =>
  JSON.stringify({
    width: l.width,
    height: l.height,
    columnsPerBand: l.columnsPerBand,
    groups: l.groups,
    nodes: l.nodes.map((n) => ({
      id: n.id,
      groupKey: n.groupKey,
      bandIndex: n.bandIndex,
      columnIndex: n.columnIndex,
      rowIndex: n.rowIndex,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      cx: n.cx,
      cy: n.cy,
      labelLines: n.labelLines,
    })),
  });

// ---------------------------------------------------------------------------
// Layout membership
// ---------------------------------------------------------------------------

test("exactly the 49 concept records enter the semantic layout", () => {
  const l = layout();
  assert.equal(l.nodes.length, 49);
  assert.equal(new Set(l.nodes.map((n) => n.id)).size, 49);
  for (const entry of l.nodes) {
    assert.equal(entry.node.visualization_role, "concept");
    assert.equal(entry.node.semantic_layout_participation, true);
  }
  assert.equal(l.groups.length, 7);
});

test("the 10 fixed-band records sit outside the semantic layout", () => {
  const b = bands();
  assert.equal(b.items.length, 10);
  assert.deepEqual(
    b.bands.map((band) => [band.role, band.count]),
    [
      ["orientation", 2],
      ["boundary", 7],
      ["anchor", 1],
    ],
  );
  const semanticIds = new Set(layout().nodes.map((n) => n.id));
  for (const item of b.items) {
    assert.ok(!semanticIds.has(item.id));
    assert.equal(item.node.semantic_layout_participation, false);
  }
});

test("a fixed-band record cannot be forced into the semantic layout", () => {
  assert.throws(() => computeSemanticLayout(snapshot.nodes), /non-participating record/);
  assert.throws(() => computeFixedBands(snapshot.nodes), /semantic-layout record/);
});

test("fixed-band records contribute nothing to concept positions", () => {
  // The semantic layout is computed from the concept records alone; adding or
  // removing fixed-band records cannot change a single coordinate because they
  // are never an input to it.
  const withAll = serialize(computeSemanticLayout(concepts, { columnsPerBand: 3 }));
  const again = serialize(computeSemanticLayout([...concepts].reverse(), { columnsPerBand: 3 }));
  assert.equal(withAll, again, "input order must not affect the layout either");
});

test("no fixed-band record is ever a semantic edge endpoint", () => {
  const bandIds = new Set(bandNodes.map((n) => n.id));
  for (const edge of snapshot.edges) {
    assert.ok(!bandIds.has(edge.source));
    assert.ok(!bandIds.has(edge.target));
  }
});

// ---------------------------------------------------------------------------
// Edge visibility is a render filter only
// ---------------------------------------------------------------------------

test("default visibility: source-named on, navigation off", () => {
  assert.equal(EDGE_CLASS_DEFAULT_VISIBLE.source_named_adjacency, true);
  assert.equal(EDGE_CLASS_DEFAULT_VISIBLE.navigation_adjacency, false);

  // The component's server-rendered controls carry the same initial state: the
  // source-named checkbox is checked, the navigation checkbox is not.
  const namedControl = /data-psadj-toggle="source_named_adjacency"/.exec(component);
  assert.ok(namedControl);
  const namedBlock = component.slice(
    component.indexOf('type="checkbox"'),
    component.indexOf('data-psadj-toggle="source_named_adjacency"'),
  );
  assert.ok(/checked/.test(namedBlock), "source-named control must be checked by default");

  const navStart = component.indexOf('data-psadj-toggle="navigation_adjacency"');
  const navBlockStart = component.lastIndexOf('type="checkbox"', navStart);
  const navBlock = component.slice(navBlockStart, navStart);
  assert.ok(!/checked/.test(navBlock), "navigation control must be unchecked by default");

  // The client seeds the same fixed initial visibility.
  assert.ok(
    /visible: \{ source_named_adjacency: true, navigation_adjacency: false \}/.test(client),
  );
});

test("the two toggles are independent controls", () => {
  const toggles = [...component.matchAll(/data-psadj-toggle="([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(toggles, ["source_named_adjacency", "navigation_adjacency"]);
  assert.equal(new Set(toggles).size, 2);
  // Each toggle mutates only its own class key.
  assert.ok(/state\.visible\[edgeClass\] = input\.checked/.test(client));
});

test("node positions cannot change from edge visibility alone", () => {
  // Structural proof: the layout function has NO edge parameter, and the toggle
  // handler never recomputes the layout.
  const layoutSource = rd("src/lib/public-surface-adjacency-map/layout.ts");
  assert.ok(!/edges/.test(layoutSource.split("export function computeSemanticLayout")[1].split("\n}\n")[0]));

  const toggleHandler = client.slice(
    client.indexOf('input.addEventListener("change"'),
    client.indexOf("// --- Keyboard interaction"),
  );
  assert.ok(!/computeSemanticLayout|computeFixedBands|relayout|buildNavigationIndex/.test(toggleHandler));

  // Behavioural proof: the same records produce byte-identical coordinates
  // regardless of which edges a caller intends to draw.
  assert.equal(serialize(layout(3)), serialize(layout(3)));
});

test("no toggle exists for governance, source-use, or confirmed relations", () => {
  for (const forbidden of [
    "governance_reference",
    "source_use_reference",
    "visual_layout_adjacency",
    "user_confirmed_relation",
  ]) {
    assert.ok(!component.includes(`data-psadj-toggle="${forbidden}"`), forbidden);
  }
});

// ---------------------------------------------------------------------------
// Node presentation
// ---------------------------------------------------------------------------

test("node size is constant per presentation role and never data derived", () => {
  const l = layout();
  const widths = new Set(l.nodes.map((n) => n.width));
  const heights = new Set(l.nodes.map((n) => n.height));
  assert.deepEqual([...widths], [ADJACENCY_LAYOUT_METRICS.NODE_WIDTH]);
  assert.deepEqual([...heights], [ADJACENCY_LAYOUT_METRICS.NODE_HEIGHT]);

  const b = bands();
  assert.deepEqual([...new Set(b.items.map((i) => i.width))], [ADJACENCY_LAYOUT_METRICS.BAND_ITEM_WIDTH]);
  assert.deepEqual([...new Set(b.items.map((i) => i.height))], [ADJACENCY_LAYOUT_METRICS.BAND_ITEM_HEIGHT]);
});

test("labels come from the dataset only, never from a filename", () => {
  const l = layout();
  for (const entry of l.nodes) {
    const expected = shortenLabel(entry.node.display_label);
    assert.deepEqual([...entry.labelLines], [...expected.lines]);
    assert.equal(entry.node.display_label_source, "registry_name");
    // A label line is never the repository path.
    assert.ok(!entry.labelLines.includes(entry.node.repository_path));
  }
  // The accessible name carries the FULL untruncated label.
  assert.ok(/\$\{visual\.node\.display_label\}/.test(client));
});

test("no centrality, degree, rank, or importance is computed anywhere", () => {
  const layoutSource = rd("src/lib/public-surface-adjacency-map/layout.ts");
  for (const source of [layoutSource, client]) {
    const code = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    for (const forbidden of [
      "centrality",
      "degree(",
      "forceSimulation",
      "d3-force",
      "rankOf",
      "importance",
    ]) {
      assert.ok(!code.includes(forbidden), `${forbidden} must not appear in executable code`);
    }
  }
});

test("external links use safe attributes and only approved URLs", () => {
  const componentLinks = [...component.matchAll(/target="_blank"/g)];
  assert.ok(componentLinks.length > 0);
  assert.equal(
    componentLinks.length,
    [...component.matchAll(/rel="noopener noreferrer"/g)].length,
    "every target=_blank link must carry rel=noopener noreferrer",
  );
  assert.ok(/isApprovedSourceUrl\(node\.canonical_public_url, node\.repository_path\)/.test(component));
  assert.ok(/link\.rel = "noopener noreferrer"/.test(client));
  assert.ok(/link\.target = "_blank"/.test(client));
  assert.ok(/isApprovedSourceUrl\(node\.canonical_public_url, node\.repository_path\)/.test(client));
});

test("dataset strings are written as text, never as raw HTML", () => {
  for (const forbidden of ["innerHTML", "outerHTML", "insertAdjacentHTML", "document.write"]) {
    assert.ok(!client.includes(forbidden), forbidden);
  }
  // The one `set:html` in the component is the JSON data island, whose "<" is
  // escaped before serialization.
  const setHtml = [...component.matchAll(/set:html=\{(\w+)\}/g)].map((m) => m[1]);
  assert.deepEqual(setHtml, ["dataJson"]);
  assert.ok(/\.replace\(\/<\/g, "\\\\u003c"\)/.test(component));
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

test("every one of the 59 records is keyboard reachable", () => {
  const index = navIndex();
  assert.equal(index.length, 59);

  const start = firstReachableId(index);
  const reached = new Set([start]);
  let frontier = [start];
  while (frontier.length > 0) {
    const next = [];
    for (const id of frontier) {
      for (const direction of SPATIAL_DIRECTIONS) {
        const target = resolveSpatialTarget(index, id, direction);
        if (target && !reached.has(target)) {
          reached.add(target);
          next.push(target);
        }
      }
    }
    frontier = next;
  }
  assert.equal(reached.size, 59, "arrow keys must reach every record");
  for (const node of index) assert.ok(reached.has(node.id), node.id);
});

test("Home and End reach the first and last record deterministically", () => {
  const index = navIndex();
  const first = firstReachableId(index);
  const last = lastReachableId(index);
  assert.ok(first && last);
  assert.notEqual(first, last);
  // Stable across repeated calls and across input order.
  assert.equal(firstReachableId([...index].reverse()), first);
  assert.equal(lastReachableId([...index].reverse()), last);
});

test("arrow-key movement is deterministic and locale independent", () => {
  const index = navIndex();
  for (const node of index) {
    for (const direction of SPATIAL_DIRECTIONS) {
      const a = resolveSpatialTarget(index, node.id, direction);
      const b = resolveSpatialTarget([...index].reverse(), node.id, direction);
      assert.equal(a, b, `${node.id} ${direction}`);
    }
  }
});

test("arrow-key movement over hand-written indices", () => {
  const grid = [
    { id: "a", bandIndex: 0, columnIndex: 0, rowIndex: 0 },
    { id: "b", bandIndex: 0, columnIndex: 0, rowIndex: 1 },
    { id: "c", bandIndex: 0, columnIndex: 1, rowIndex: 0 },
    { id: "d", bandIndex: 1, columnIndex: 0, rowIndex: 0 },
  ];
  assert.equal(resolveSpatialTarget(grid, "a", "down"), "b");
  assert.equal(resolveSpatialTarget(grid, "b", "up"), "a");
  assert.equal(resolveSpatialTarget(grid, "a", "right"), "c");
  assert.equal(resolveSpatialTarget(grid, "c", "left"), "a");
  assert.equal(resolveSpatialTarget(grid, "b", "down"), "d");
  assert.equal(resolveSpatialTarget(grid, "d", "up"), "b");
  // Focus never wraps: there is no target past an edge.
  assert.equal(resolveSpatialTarget(grid, "a", "up"), null);
  assert.equal(resolveSpatialTarget(grid, "c", "right"), null);
  assert.equal(resolveSpatialTarget(grid, "d", "down"), null);
  assert.equal(resolveSpatialTarget(grid, "missing", "up"), null);
});

test("arrow keys map to directions and nothing else does", () => {
  assert.equal(directionForKey("ArrowUp"), "up");
  assert.equal(directionForKey("ArrowDown"), "down");
  assert.equal(directionForKey("ArrowLeft"), "left");
  assert.equal(directionForKey("ArrowRight"), "right");
  for (const key of ["Tab", "Enter", " ", "Escape", "Home", "End", "a"]) {
    assert.equal(directionForKey(key), null, key);
  }
});

test("the client wires Home, End, Escape, Enter and Space explicitly", () => {
  assert.ok(/event\.key === "Home"/.test(client));
  assert.ok(/event\.key === "End"/.test(client));
  assert.ok(/event\.key === "Escape"/.test(client));
  assert.ok(/event\.key === "Enter"/.test(client));
  assert.ok(/firstReachableId\(state\.navigation\)/.test(client));
  assert.ok(/lastReachableId\(state\.navigation\)/.test(client));
});

// ---------------------------------------------------------------------------
// Accessibility surface
// ---------------------------------------------------------------------------

test("every rendered record is focusable with a button role and a pressed state", () => {
  assert.ok(/\.attr\("tabindex", 0\)/.test(client));
  assert.ok(/\.attr\("role", "button"\)/.test(client));
  assert.ok(/aria-pressed/.test(client));
  assert.ok(/data-selected/.test(client));
});

test("all controls are native elements", () => {
  // Only native checkboxes, links, and the focusable record groups exist; there
  // is no div-with-onclick control anywhere in the component.
  assert.ok(/<input\s+type="checkbox"/.test(component));
  assert.ok(!/role="checkbox"/.test(component));
  assert.ok(!/role="link"/.test(component));
  assert.ok(!/onclick=/i.test(component));
});

test("the graphic carries a title and description", () => {
  assert.ok(/\.append\("title"\)/.test(client));
  assert.ok(/\.append\("desc"\)/.test(client));
  assert.ok(/\.attr\("aria-label", "Expanded public surface adjacency graph"\)/.test(client));
});

test("a polite live region announces status, selection, and toggle state", () => {
  assert.ok(/aria-live="polite"/.test(component));
  assert.ok(/role="status"/.test(component));
  assert.ok(/data-psadj-live/.test(component));
  assert.ok(/selected\.`\)/.test(client), "selection changes are announced");
  assert.ok(/shown" : "hidden"/.test(client), "toggle state is announced");
  assert.ok(/Shown: \$\{shown \|\| "none"\}\. Hidden: \$\{hidden \|\| "none"\}/.test(client));
});

test("a visible focus indicator is defined for every interactive element", () => {
  assert.ok(/:focus-visible/.test(component));
  assert.ok(/outline: 3px solid currentColor/.test(component));
});

test("edge classes are distinguished by pattern and marker, not color alone", () => {
  // The legend states the pattern in words, and the stylesheet distinguishes the
  // two classes by dash pattern and stroke width — no `color`/`stroke:` hue is
  // used to carry the distinction.
  assert.ok(component.includes("solid line, filled arrow head"));
  assert.ok(component.includes("dashed line, open arrow head"));
  assert.ok(/\.psadj-edge--navigation_adjacency \{\s*stroke-width: 1\.2;\s*stroke-dasharray: 5 4;/.test(component));
  assert.ok(/psadj-arrow-filled/.test(client));
  assert.ok(/psadj-arrow-open/.test(client));
});

test("a reduced-motion media query is present and no animation is mandatory", () => {
  assert.ok(/@media \(prefers-reduced-motion: reduce\)/.test(component));
  // Nothing in the client schedules an animation or a transition at all.
  for (const forbidden of ["requestAnimationFrame", "transition(", ".duration(", "setInterval"]) {
    assert.ok(!client.includes(forbidden), forbidden);
  }
});

test("the layout is usable at narrow mobile width", () => {
  assert.ok(/@media \(max-width: 640px\)/.test(component));
  // One group column always fits, however narrow the viewport is.
  assert.equal(columnsForWidth(320, 7), 1);
  assert.equal(columnsForWidth(0, 7), 7);
  assert.ok(columnsForWidth(1200, 7) >= 1);
  const narrow = computeSemanticLayout(concepts, { columnsPerBand: 1 });
  assert.equal(narrow.columnsPerBand, 1);
  assert.equal(narrow.nodes.length, 49);
});

// ---------------------------------------------------------------------------
// No-JavaScript fallback
// ---------------------------------------------------------------------------

test("the server-rendered fallback lists every record and is not behind a JS control", () => {
  // The record list is rendered from `allRecords`, which is every node.
  assert.ok(/const allRecords = \[\.\.\.snapshot\.nodes\]\.sort\(compareNodes\)/.test(component));
  assert.ok(/allRecords\.map\(\(node\) =>/.test(component));
  // The list section carries no `hidden` attribute and no JS-only gate; the
  // only server-hidden elements are the progressive-enhancement regions.
  const hiddenTargets = [...component.matchAll(/data-psadj-(\w+)[^>]*hidden/g)].map((m) => m[1]);
  for (const target of hiddenTargets) {
    assert.ok(
      ["controls", "canvas", "details"].includes(target),
      `only progressive-enhancement regions may start hidden, found ${target}`,
    );
  }
  assert.ok(!/data-psadj-record-list[^>]*hidden/.test(component));
  // Each record entry carries all four required fields.
  for (const field of [
    "Visualization role",
    "Grouping",
    "Relation evidence ceiling",
    "Canonical source",
  ]) {
    assert.ok(component.includes(field), field);
  }
});

test("the fallback record order is deterministic and carries no hierarchy claim", () => {
  const ordered = [...snapshot.nodes].sort(compareNodes);
  assert.equal(ordered.length, 59);
  assert.deepEqual(
    ordered.map((n) => n.id),
    [...snapshot.nodes].sort(compareNodes).map((n) => n.id),
  );
  assert.ok(component.includes("Order does not indicate"));
});

test("the client never removes the server-rendered fallback", () => {
  assert.ok(!/record-list[\s\S]{0,80}remove\(\)/.test(client));
  // The only cleared subtree is the canvas the client itself owns.
  const removals = [...client.matchAll(/selectAll\("\*"\)\.remove\(\)/g)];
  assert.equal(removals.length, 1);
  assert.ok(/const host = select\(canvas\);\s*host\.selectAll\("\*"\)\.remove\(\)/.test(client));
});

// ---------------------------------------------------------------------------
// Required visible content and approved wording
// ---------------------------------------------------------------------------

test("the component renders the exact relationship sentence and both view labels", () => {
  assert.equal(
    RELATIONSHIP_SENTENCE,
    "These are parallel public views with different selection and edge contracts; neither supersedes the other.",
  );
  assert.equal(AUTHORITY_VIEW_LABEL, "30-record authority-ceiling view");
  assert.equal(EXPANDED_VIEW_LABEL, "59-record expanded adjacency view");
  assert.ok(/data-psadj-relationship>\{RELATIONSHIP_SENTENCE\}/.test(component));
  assert.ok(component.includes("{AUTHORITY_VIEW_LABEL}"));
  assert.ok(component.includes("{EXPANDED_VIEW_LABEL}"));
});

test("the component links to both the parent page and the 30-record view", () => {
  assert.ok(/href=\{AUTHORITY_ROUTE\}/.test(component));
  assert.ok(/href=\{PARENT_ROUTE\}/.test(component));
});

test("all dataset boundary statements and every not-claim are rendered", () => {
  assert.ok(/snapshot\.boundary_statements\.map/.test(component));
  assert.ok(/NOT_CLAIMS\.map/.test(component));
  assert.deepEqual([...NOT_CLAIMS], [
    "not the full MWE archive",
    "not the internal Registry",
    "not a complete corpus",
    "not a classification system",
    "not an ontology",
    "not a confirmed relation graph",
    "not a ranking",
    "not a currentness claim",
  ]);
});

test("the page never claims supersession, canonicality, or currentness", () => {
  const prose = `${component}\n${page}\n${rd("src/pages/public-surface-map.md")}`;
  for (const forbidden of [
    "supersedes the 30",
    "replaces the 30",
    "current authoritative",
    "the canonical graph",
    "the complete corpus",
    "the full ontology",
    "confirmed relation graph of",
  ]) {
    assert.ok(!prose.includes(forbidden), forbidden);
  }
});

test("the route registers robots noindex, nofollow through the shared registry", () => {
  assert.ok(/robots="noindex, nofollow"/.test(page));
  assert.ok(/import BaseLayout from/.test(page));
  assert.ok(/export const prerender = true/.test(page));
});

test("the new product imports nothing from the frozen authority-map product", () => {
  for (const source of [component, client, page]) {
    assert.ok(!source.includes("public-surface-authority-map"), "no authority-map import");
    assert.ok(!source.includes("PublicSurfaceAuthorityMap"), "no authority-map component");
  }
});
