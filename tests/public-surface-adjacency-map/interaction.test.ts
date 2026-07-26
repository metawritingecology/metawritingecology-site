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
  GROUP_REGION_WIDTH,
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

/**
 * Slice one `<target>.addEventListener("<type>", …)` call out of the production
 * client source by matching braces from the arrow-function body, then strip
 * comment lines. Everything returned is EXECUTABLE code, so no assertion below
 * can be satisfied by a comment or an unused string literal.
 */
const listenerBody = (source: string, target: string, type: string): string => {
  const head = `${target}.addEventListener("${type}"`;
  const start = source.indexOf(head);
  assert.notEqual(start, -1, `no ${target}.addEventListener("${type}") call found`);
  const bodyStart = source.indexOf("{", source.indexOf("=>", start));
  assert.notEqual(bodyStart, -1, `no arrow body for ${target} ${type} listener`);

  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  assert.notEqual(end, -1, `unbalanced braces in the ${target} ${type} listener`);

  return source
    .slice(bodyStart, end)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith("//") && !trimmed.startsWith("*") && !trimmed.startsWith("/*");
    })
    .join("\n");
};

test("a keydown listener is attached specifically to the details panel", () => {
  // Not the canvas, not the document, not the window — the details panel itself,
  // so an Escape pressed on the canonical-source link inside it is handled.
  assert.ok(/\bdetails\.addEventListener\(\s*"keydown"/.test(client));
  assert.equal([...client.matchAll(/\bdetails\.addEventListener\(/g)].length, 1);
  // No document- or window-level keydown listener exists: the fix is scoped to
  // the details panel, never a global key capture. (`window` is still used for
  // the responsive `resize` listener, which is unrelated and unchanged.)
  for (const wrongTarget of ["document", "window"]) {
    assert.ok(
      !new RegExp(`${wrongTarget}\\.addEventListener\\(\\s*"keydown"`).test(client),
      `${wrongTarget} must not capture keydown`,
    );
  }
  assert.ok(/window\.addEventListener\("resize"/.test(client), "the resize listener is unchanged");
});

test("details Escape returns focus to the selected node and is otherwise a no-op", () => {
  const body = listenerBody(client, "details", "keydown");

  // (2) it checks the Escape key, and (3) it checks the current selected id.
  assert.ok(/event\.key === "Escape"/.test(body), "must check event.key === Escape");
  assert.ok(/state\.selectedId/.test(body), "must check state.selectedId");

  // (4) it focuses the graph node whose id equals the selected id, via the
  //     existing bounded helper and the canvas the graph is rendered into.
  assert.ok(
    /focusNode\(canvas, state\.selectedId\)/.test(body),
    "must call focusNode(canvas, state.selectedId)",
  );

  // (5) preventDefault is reached only through the handled branch: it sits
  //     strictly after the guarded condition, inside the same block.
  const guard = body.indexOf('event.key === "Escape" && state.selectedId');
  const prevent = body.indexOf("event.preventDefault()");
  assert.notEqual(guard, -1, "the handled case must be a single guarded condition");
  assert.notEqual(prevent, -1, "the handled case must prevent the default action");
  assert.ok(prevent > guard, "preventDefault must be inside the guarded branch");
  assert.equal([...body.matchAll(/preventDefault\(\)/g)].length, 1, "exactly one preventDefault");

  // (6) a missing selected id is a no-op: `state.selectedId` is the guard's own
  //     truthiness test, so there is no else branch and no fallback lookup.
  assert.ok(!/else/.test(body), "no else branch");
  for (const fallback of [
    "firstReachableId",
    "lastReachableId",
    "state.navigation",
    "querySelector",
    "[data-psadj-node]",
    "nodes[0]",
  ]) {
    assert.ok(!body.includes(fallback), `must not infer a fallback node via ${fallback}`);
  }

  // (8) no layout, render, selection mutation, announcement or network call.
  for (const forbidden of [
    "computeSemanticLayout",
    "computeFixedBands",
    "buildNavigationIndex",
    "relayout(",
    "drawGraph(",
    "renderDetails(",
    "render()",
    "selectNode(",
    "state.selectedId =",
    "state.visible",
    "announce(",
    "bootRuntimeLoader",
    "fetch(",
    "textContent",
    "innerHTML",
    "hidden",
  ]) {
    assert.ok(!body.includes(forbidden), `details Escape must not use ${forbidden}`);
  }
});

test("the canvas keyboard behavior is unchanged and independent", () => {
  const body = listenerBody(client, "canvas", "keydown");
  // Graph-node Escape, activation, Home/End and arrow movement all still live on
  // the canvas listener, which was not moved.
  assert.ok(/event\.key === "Escape"/.test(body));
  assert.ok(/event\.key === "Enter" \|\| event\.key === " "/.test(body));
  assert.ok(/event\.key === "Home"/.test(body));
  assert.ok(/event\.key === "End"/.test(body));
  assert.ok(/firstReachableId\(state\.navigation\)/.test(body));
  assert.ok(/lastReachableId\(state\.navigation\)/.test(body));
  assert.ok(/directionForKey\(event\.key\)/.test(body));
  assert.ok(/resolveSpatialTarget\(state\.navigation, currentId, direction\)/.test(body));
  assert.ok(/selectNode\(state, currentId\)/.test(body));
  // It still only acts on events originating inside a rendered graph node —
  // which is exactly why the details panel needs its own listener.
  assert.ok(/closest<SVGGElement>\("\[data-psadj-node\]"\)/.test(body));

  // The two listeners are distinct registrations on distinct targets.
  assert.ok(client.indexOf('canvas.addEventListener("keydown"') !== client.indexOf('details.addEventListener("keydown"'));
});

/**
 * Bounded stylesheet model. These readers exist so the assertions below can
 * state the GUARANTEE a rule provides — an effectively visible focus outline,
 * an effectively non-solid edge pattern — instead of pinning the literal
 * declaration that happens to provide it today, AND so that a later rule cannot
 * quietly take that guarantee away again. Reading only the first matching rule,
 * or only testing that a value contains a digit, both admit a value such as
 * `stroke-dasharray: 0 0`, which is neither the word `none` nor a real pattern.
 *
 * This is not a CSS engine and does not try to be. It models exactly what this
 * component uses: flat class and element rules, optionally nested inside an
 * at-rule, with a later declaration of the same property winning.
 */

/** The declarations of one rule body, in source order. */
const cssDeclarations = (body: string): { property: string; value: string }[] =>
  body
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const colon = entry.indexOf(":");
      if (colon === -1) return null;
      return {
        property: entry.slice(0, colon).trim().toLowerCase(),
        value: entry.slice(colon + 1).trim(),
      };
    })
    .filter((declaration) => declaration !== null);

/**
 * Every style rule in the component's `<style>` blocks, in source order.
 * Comments are stripped first. An at-rule prelude is never treated as a
 * selector, but the rules nested inside it ARE returned, so a suppression
 * hidden inside a media query is still seen.
 */
const componentStyleRules = (source: string) => {
  const rules: { selector: string; declarations: { property: string; value: string }[] }[] = [];
  const collect = (css: string): void => {
    let buffer = "";
    let index = 0;
    while (index < css.length) {
      if (css[index] !== "{") {
        buffer += css[index];
        index += 1;
        continue;
      }
      let depth = 0;
      let end = index;
      for (; end < css.length; end += 1) {
        if (css[end] === "{") depth += 1;
        else if (css[end] === "}") {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      const prelude = buffer.trim();
      const body = css.slice(index + 1, end);
      if (prelude.startsWith("@")) collect(body);
      else if (prelude) rules.push({ selector: prelude, declarations: cssDeclarations(body) });
      buffer = "";
      index = end + 1;
    }
  };
  for (const block of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    collect(block[1].replace(/\/\*[\s\S]*?\*\//g, ""));
  }
  return rules;
};

const COMPONENT_RULES = componentStyleRules(component);

const SOURCE_NAMED_EDGE_CLASS = ".psadj-edge--source_named_adjacency";
const NAVIGATION_EDGE_CLASS = ".psadj-edge--navigation_adjacency";

/** The last-wins value of one property across EVERY rule whose selector
 *  contains `selectorPart`, or null when no rule declares it. The property name
 *  is matched exactly, so `outline-offset` never answers for `outline` and
 *  `stroke-width` never answers for `stroke`. */
const effectiveValue = (selectorPart: string, property: string): string | null => {
  const values = COMPONENT_RULES.filter((rule) => rule.selector.includes(selectorPart))
    .flatMap((rule) => rule.declarations)
    .filter((declaration) => declaration.property === property)
    .map((declaration) => declaration.value);
  return values.length > 0 ? values[values.length - 1] : null;
};


/**
 * Interpret an SVG `stroke-dasharray` value. `effective` is the guarantee that
 * matters: a pattern that actually renders non-solid, meaning at least one
 * positive dash AND at least one positive gap. `0 0` parses, contains digits
 * and is not `none`, yet paints a solid line — so it is reported ineffective.
 */
const dashPattern = (value: string | null) => {
  if (value === null) return { declared: false, valid: true, effective: false, reason: "no declaration" };
  const trimmed = value.trim();
  if (trimmed === "") return { declared: true, valid: false, effective: false, reason: "empty value" };
  if (/^none$/i.test(trimmed)) return { declared: true, valid: true, effective: false, reason: "none" };

  const lengths: number[] = [];
  for (const entry of trimmed.split(/[\s,]+/).filter(Boolean)) {
    const parsed = /^(-?\d*\.?\d+)(px|rem|em|pt|ch|%)?$/i.exec(entry);
    if (!parsed) {
      return { declared: true, valid: false, effective: false, reason: `unsupported dash entry "${entry}"` };
    }
    const length = Number(parsed[1]);
    if (!Number.isFinite(length)) {
      return { declared: true, valid: false, effective: false, reason: `non-numeric dash entry "${entry}"` };
    }
    if (length < 0) {
      return { declared: true, valid: false, effective: false, reason: `negative dash entry "${entry}"` };
    }
    lengths.push(length);
  }
  // An odd-length list repeats to complete the dash/gap alternation.
  const sequence = lengths.length % 2 === 1 ? [...lengths, ...lengths] : lengths;
  const dashes = sequence.filter((_, position) => position % 2 === 0);
  const gaps = sequence.filter((_, position) => position % 2 === 1);
  const effective = dashes.some((length) => length > 0) && gaps.some((length) => length > 0);
  return {
    declared: true,
    valid: true,
    effective,
    reason: effective ? "non-solid" : `no visible alternation in "${trimmed}"`,
  };
};

const OUTLINE_STYLES = [
  "none", "hidden", "dotted", "dashed", "solid", "double",
  "groove", "ridge", "inset", "outset", "auto",
];
const OUTLINE_WIDTH_KEYWORDS: Record<string, number> = { thin: 1, medium: 3, thick: 5 };

/** A value this bounded model cannot resolve statically. Colour functions such
 *  as `rgb(...)` are deliberately not listed: they never decide visibility. */
const DYNAMIC_VALUE = /\b(?:var|calc|env|clamp|min|max|attr)\s*\(/i;

/** A CSS length token as a number, or null when the token is not a length. */
const cssLength = (token: string): number | null => {
  const parsed = /^(-?\d*\.?\d+)(px|rem|em|pt|ch|ex|vh|vw)?$/i.exec(token);
  return parsed ? Number(parsed[1]) : null;
};

/**
 * The EFFECTIVE outline of a declaration sequence, applied in source order with
 * later declarations winning, understanding the `outline` shorthand as well as
 * the `outline-width` and `outline-style` longhands. Unset values fall back to
 * the CSS initial values — width `medium`, style `none` — so `outline-width: 0`
 * and `outline-style: none` are both correctly read as suppression.
 */
const effectiveOutline = (declarations: { property: string; value: string }[]) => {
  let width: number | null = null;
  let style: string | null = null;
  let touched = false;
  let unresolved: string | null = null;

  for (const { property, value } of declarations) {
    if (property === "outline") {
      touched = true;
      // A dynamic value cannot be resolved here, and must never be ASSUMED
      // visible; the contract fails closed instead.
      if (DYNAMIC_VALUE.test(value)) unresolved = `outline: ${value}`;
      // The shorthand resets every longhand it does not name.
      width = null;
      style = null;
      for (const token of value.split(/\s+/).filter(Boolean)) {
        const lower = token.toLowerCase();
        if (OUTLINE_STYLES.includes(lower)) style = lower;
        else if (lower in OUTLINE_WIDTH_KEYWORDS) width = OUTLINE_WIDTH_KEYWORDS[lower];
        else {
          const length = cssLength(token);
          if (length !== null) width = length;
        }
      }
    } else if (property === "outline-width") {
      touched = true;
      const lower = value.trim().toLowerCase();
      if (lower in OUTLINE_WIDTH_KEYWORDS) width = OUTLINE_WIDTH_KEYWORDS[lower];
      else {
        width = cssLength(value.trim());
        if (width === null) unresolved = `outline-width: ${value}`;
      }
    } else if (property === "outline-style") {
      touched = true;
      style = value.trim().toLowerCase();
      if (!OUTLINE_STYLES.includes(style)) unresolved = `outline-style: ${value}`;
    }
  }

  const resolvedWidth = width === null ? OUTLINE_WIDTH_KEYWORDS.medium : width;
  const resolvedStyle = style === null ? "none" : style;
  const visible =
    touched &&
    unresolved === null &&
    resolvedStyle !== "none" &&
    resolvedStyle !== "hidden" &&
    resolvedWidth > 0;
  return {
    touched,
    unresolved,
    width: resolvedWidth,
    style: resolvedStyle,
    visible,
    suppressed: touched && !visible,
  };
};

const INTERACTIVE_ELEMENTS = ["a", "button", "input", "select", "textarea"];

/**
 * Bounded selector model for the focus contract.
 *
 * Focus is a CASCADE property: a narrower rule that changes only
 * `outline-width` keeps the style established by a broader rule that already
 * matched the same element. Evaluating each rule's declarations in isolation
 * therefore misreads an ordinary positive refinement such as
 * `.psadj__toolbar button:focus-visible { outline-width: 4px }` as suppression.
 *
 * The model below resolves the effective outline PER TARGET ELEMENT: it works
 * out which `:focus-visible` rules apply to a representative element, then
 * composes their declarations in source order. It is deliberately conservative
 * rather than a full engine — specificity is not resolved, so a later
 * applicable zero or `none` declaration is always treated as suppression even
 * where real specificity might override it. Unsupported selector syntax inside
 * the protected focus set fails closed rather than being skipped.
 */

/** Split a selector list on top-level commas, never inside parentheses. */
const splitSelectorList = (selector: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

/** Split one selector into descendant compounds, never inside parentheses. */
const splitCompounds = (selector: string): string[] => {
  const compounds: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (/\s/.test(char) && depth === 0) {
      if (current) compounds.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) compounds.push(current);
  return compounds;
};

/**
 * Parse one compound into simple selectors, or return `null` for syntax this
 * bounded model does not interpret — a combinator, an id, a pseudo-element or
 * any pseudo-class other than `:focus-visible` and `:is()`. A `null` inside the
 * protected focus set is a hard test failure, never a silent skip.
 */
const parseCompound = (compound: string): { kind: string; value?: string; attr?: string; attrValue?: string | null; alternatives?: unknown[] }[] | null => {
  const simples = [];
  let index = 0;
  while (index < compound.length) {
    const rest = compound.slice(index);
    if (rest.startsWith("*")) {
      simples.push({ kind: "any" });
      index += 1;
    } else if (rest.startsWith(":focus-visible")) {
      simples.push({ kind: "focus" });
      index += ":focus-visible".length;
    } else if (rest.startsWith(":is(")) {
      let depth = 0;
      let end = index + 3;
      for (; end < compound.length; end += 1) {
        if (compound[end] === "(") depth += 1;
        else if (compound[end] === ")") {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      if (end >= compound.length) return null;
      const alternatives = splitSelectorList(compound.slice(index + 4, end)).map(parseCompound);
      if (alternatives.length === 0 || alternatives.some((alternative) => alternative === null)) return null;
      simples.push({ kind: "is", alternatives });
      index = end + 1;
    } else if (rest.startsWith(".")) {
      const match = /^\.([A-Za-z_][\w-]*)/.exec(rest);
      if (!match) return null;
      simples.push({ kind: "class", value: match[1] });
      index += match[0].length;
    } else if (rest.startsWith("[")) {
      const match = /^\[([A-Za-z_][\w-]*)(?:\s*=\s*["']([^"']*)["'])?\]/.exec(rest);
      if (!match) return null;
      simples.push({ kind: "attr", attr: match[1], attrValue: match[2] ?? null });
      index += match[0].length;
    } else {
      const match = /^[A-Za-z][\w-]*/.exec(rest);
      if (!match) return null;
      simples.push({ kind: "type", value: match[0].toLowerCase() });
      index += match[0].length;
    }
  }
  return simples.length > 0 ? simples : null;
};

/** A representative element: a type, a class set and an attribute map. */
const elementNode = (
  type: string | null,
  classes: string[] = [],
  attributes: [string, string | null][] = [],
) => ({ type, classes: new Set(classes), attributes: new Map(attributes) });

const mergeNodes = (base, extra) =>
  elementNode(
    extra.type ?? base.type,
    [...base.classes, ...extra.classes],
    [...base.attributes, ...extra.attributes],
  );

const simpleMatches = (simple, node): boolean => {
  switch (simple.kind) {
    case "any":
    case "focus":
      return true;
    case "type":
      return node.type === simple.value;
    case "class":
      return node.classes.has(simple.value);
    case "attr":
      if (!node.attributes.has(simple.attr)) return false;
      return simple.attrValue === null || node.attributes.get(simple.attr) === simple.attrValue;
    case "is":
      return simple.alternatives.some((alternative) =>
        alternative.every((inner) => simpleMatches(inner, node)),
      );
    default:
      return false;
  }
};

const compoundMatches = (simples, node) => simples.every((simple) => simpleMatches(simple, node));

/** Descendant matching, right to left. The SUBJECT compound — the last one —
 *  must match the target itself, so `.psadj-node:focus-visible rect` styles the
 *  descendant rect and never the focused record. */
const selectorMatchesTarget = (compounds, chain: unknown[]) => {
  let selectorIndex = compounds.length - 1;
  let chainIndex = chain.length - 1;
  if (!compoundMatches(compounds[selectorIndex], chain[chainIndex])) return false;
  selectorIndex -= 1;
  chainIndex -= 1;
  while (selectorIndex >= 0) {
    let matched = false;
    while (chainIndex >= 0) {
      const candidate = chain[chainIndex];
      chainIndex -= 1;
      if (compoundMatches(compounds[selectorIndex], candidate)) {
        matched = true;
        break;
      }
    }
    if (!matched) return false;
    selectorIndex -= 1;
  }
  return true;
};

/** The element candidates a compound could match, expanding `:is()`. */
const nodesFromCompound = (simples): unknown[] => {
  let candidates = [elementNode(null)];
  for (const simple of simples) {
    if (simple.kind === "focus" || simple.kind === "any") continue;
    if (simple.kind === "is") {
      candidates = simple.alternatives.flatMap((alternative) =>
        nodesFromCompound(alternative).flatMap((sub) =>
          candidates.map((base) => mergeNodes(base, sub)),
        ),
      );
    } else if (simple.kind === "type") {
      candidates = candidates.map((base) => mergeNodes(base, elementNode(simple.value)));
    } else if (simple.kind === "class") {
      candidates = candidates.map((base) => mergeNodes(base, elementNode(null, [simple.value])));
    } else if (simple.kind === "attr") {
      candidates = candidates.map((base) =>
        mergeNodes(base, elementNode(null, [], [[simple.attr, simple.attrValue]])),
      );
    }
  }
  return candidates;
};

const isInteractiveNode = (node) =>
  (node.type !== null && INTERACTIVE_ELEMENTS.includes(node.type)) || node.attributes.has("tabindex");

/** Every parsed `:focus-visible` selector in the component, in source order.
 *  Parsing happens once; anything uninterpretable is reported, not skipped. */
const FOCUS_RULES = COMPONENT_RULES.filter((rule) => rule.selector.includes(":focus-visible")).map(
  (rule) => ({
    selector: rule.selector,
    declarations: rule.declarations,
    selectors: splitSelectorList(rule.selector).map((part) => ({
      text: part,
      compounds: splitCompounds(part).map(parseCompound),
    })),
  }),
);

for (const rule of FOCUS_RULES) {
  for (const parsed of rule.selectors) {
    assert.ok(
      parsed.compounds.length > 0 && parsed.compounds.every((compound) => compound !== null),
      `the bounded focus model cannot interpret the protected selector "${parsed.text}"; extend the model rather than skipping the rule`,
    );
  }
}

/** A selector part whose SUBJECT carries `:focus-visible` — the ones that style
 *  the focused element itself. */
const focusSubjectSelectors = (rule) =>
  rule.selectors.filter((parsed) =>
    parsed.compounds[parsed.compounds.length - 1].some((simple) => simple.kind === "focus"),
  );

/** The component root. Every rule in this stylesheet is scoped beneath it, and
 *  the markup renders the whole product inside `<section class="psadj">`. */
const PSADJ_ROOT = elementNode(null, ["psadj"]);

/** Representative protected targets: the interactive contexts the component
 *  actually renders, plus one derived from every interactive focus selector the
 *  stylesheet itself declares, so a newly added focus rule is protected too. */
const focusTargets = () => {
  const targets: { name: string; chain: unknown[] }[] = [
    { name: "an anchor inside .psadj", chain: [PSADJ_ROOT, elementNode("a")] },
    { name: "a button inside .psadj", chain: [PSADJ_ROOT, elementNode("button")] },
    {
      name: "a toolbar button inside .psadj",
      chain: [PSADJ_ROOT, elementNode(null, ["psadj__toolbar"]), elementNode("button")],
    },
    { name: "an input inside .psadj", chain: [PSADJ_ROOT, elementNode("input")] },
    {
      name: "a [tabindex] element inside .psadj",
      chain: [PSADJ_ROOT, elementNode(null, [], [["tabindex", null]])],
    },
    {
      name: "a rendered record inside .psadj__canvas",
      chain: [
        PSADJ_ROOT,
        elementNode(null, ["psadj__canvas"]),
        elementNode(null, ["psadj-node"], [["tabindex", null]]),
      ],
    },
  ];

  for (const rule of FOCUS_RULES) {
    for (const parsed of focusSubjectSelectors(rule)) {
      const chains = parsed.compounds.reduce(
        (accumulated, compound) =>
          nodesFromCompound(compound).flatMap((node) =>
            accumulated.map((chain) => [...chain, node]),
          ),
        [[]],
      );
      for (const chain of chains) {
        if (!isInteractiveNode(chain[chain.length - 1])) continue;
        const rooted = chain[0].classes.has("psadj") ? chain : [PSADJ_ROOT, ...chain];
        targets.push({ name: `"${parsed.text}"`, chain: rooted });
      }
    }
  }
  return targets;
};

/** Declarations of every focus rule that applies to a target, in source order,
 *  composed rather than reset per rule. */
const applicableFocusDeclarations = (target) =>
  FOCUS_RULES.filter((rule) =>
    focusSubjectSelectors(rule).some((parsed) =>
      selectorMatchesTarget(parsed.compounds, target.chain),
    ),
  ).flatMap((rule) => rule.declarations);

// The model must never silently collapse: an empty or truncated rule list would
// make every effective-value assertion below vacuously true.
assert.ok(COMPONENT_RULES.length > 20, `only ${COMPONENT_RULES.length} component style rules parsed`);
assert.ok(
  COMPONENT_RULES.some((rule) => rule.selector.includes(":focus-visible")),
  "the stylesheet model did not find the focus rules",
);
assert.ok(
  COMPONENT_RULES.some((rule) => rule.selector.includes(".psadj-edge--navigation_adjacency")),
  "the stylesheet model did not find the edge-class rules",
);

/** The body of the first at-rule whose prelude matches, brace matched so a
 *  nested rule cannot end the slice early. */
const atRuleBody = (source: string, prelude: RegExp): string => {
  const match = prelude.exec(source);
  assert.ok(match, `no at-rule matching ${prelude}`);
  const open = source.indexOf("{", match.index);
  assert.notEqual(open, -1, `unterminated at-rule matching ${prelude}`);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return assert.fail(`unbalanced braces in the at-rule matching ${prelude}`);
};

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

  const focusRules = COMPONENT_RULES.filter((rule) => rule.selector.includes(":focus-visible"));
  assert.ok(focusRules.length > 0, "the component must define at least one :focus-visible rule");

  // The helper reads EFFECTIVE outline state, so these hold by construction and
  // a shorthand or longhand suppression cannot slip past the assertions below.
  assert.equal(effectiveOutline([{ property: "outline", value: "3px solid currentColor" }]).visible, true);
  for (const suppression of [
    { property: "outline", value: "none" },
    { property: "outline", value: "0" },
    { property: "outline", value: "0 solid currentColor" },
    { property: "outline-width", value: "0" },
    { property: "outline-width", value: "0px" },
    { property: "outline-style", value: "none" },
    { property: "outline-style", value: "hidden" },
  ]) {
    assert.equal(
      effectiveOutline([{ property: "outline", value: "3px solid currentColor" }, suppression]).visible,
      false,
      `a later ${suppression.property}: ${suppression.value} suppresses the focus outline`,
    );
  }
  // A later POSITIVE partial override refines the outline; it does not remove
  // it. This is the case the previous per-selector model got wrong.
  for (const refinement of [
    { property: "outline-width", value: "4px" },
    { property: "outline-width", value: "2px" },
    { property: "outline-width", value: "thick" },
    { property: "outline-style", value: "dashed" },
    { property: "outline-style", value: "dotted" },
  ]) {
    assert.equal(
      effectiveOutline([{ property: "outline", value: "3px solid currentColor" }, refinement]).visible,
      true,
      `a later ${refinement.property}: ${refinement.value} must remain visible`,
    );
  }
  // An unresolvable dynamic value fails closed rather than being assumed
  // visible, in the shorthand and in either longhand.
  for (const dynamic of [
    { property: "outline", value: "var(--focus-outline)" },
    { property: "outline-width", value: "var(--w)" },
    { property: "outline-width", value: "calc(1px * 0)" },
    { property: "outline-style", value: "var(--s)" },
  ]) {
    assert.equal(
      effectiveOutline([{ property: "outline", value: "3px solid currentColor" }, dynamic]).visible,
      false,
      `an unresolvable ${dynamic.property}: ${dynamic.value} must not be assumed visible`,
    );
  }

  // Equivalent positive longhands, and reordering that preserves the effective
  // state, both still pass.
  assert.equal(
    effectiveOutline([
      { property: "outline-width", value: "3px" },
      { property: "outline-style", value: "solid" },
      { property: "outline-color", value: "currentColor" },
    ]).visible,
    true,
  );
  assert.equal(
    effectiveOutline([
      { property: "outline-offset", value: "2px" },
      { property: "outline", value: "3px solid currentColor" },
    ]).visible,
    true,
  );

  // The selector model must resolve the rules that APPLY to each element, not
  // the rules that share a selector string.
  const targets = focusTargets();
  assert.ok(targets.length >= 6, `only ${targets.length} protected focus targets were derived`);
  assert.ok(
    targets.some((target) => target.name.includes("toolbar")),
    "the toolbar-button context must be a protected target",
  );

  for (const target of targets) {
    const outline = effectiveOutline(applicableFocusDeclarations(target));
    assert.ok(
      outline.touched,
      `no applicable :focus-visible rule establishes an outline for ${target.name}`,
    );
    assert.ok(
      !outline.suppressed,
      `an applicable rule removes the focus outline for ${target.name} (width ${outline.width}, style ${outline.style})`,
    );
    assert.ok(
      outline.visible,
      `${target.name} must paint a focus outline, got width ${outline.width} style ${outline.style}`,
    );
  }

  // The composition really is cross-selector, not per-selector-string: a rule
  // whose selector never mentions the toolbar still applies to a toolbar
  // button, which is exactly why a narrower rule setting one longhand inherits
  // the style already established instead of resetting it.
  const toolbar = targets.find((target) => target.name.includes("toolbar"));
  assert.ok(toolbar, "the toolbar-button target must exist");
  const toolbarRules = FOCUS_RULES.filter((rule) =>
    focusSubjectSelectors(rule).some((parsed) =>
      selectorMatchesTarget(parsed.compounds, toolbar.chain),
    ),
  );
  assert.ok(toolbarRules.length > 0, "no focus rule applies to a toolbar button");
  assert.ok(
    toolbarRules.some((rule) => !rule.selector.includes("psadj__toolbar")),
    "a broader rule must apply across selector text, not only to an identical selector",
  );

  // The rendered-record rule styles the descendant rect, so it is never treated
  // as the focused element's own outline contract.
  assert.ok(
    focusRules.some((rule) => rule.selector.includes(".psadj-node:focus-visible")),
    "the rendered-record focus rule must still exist",
  );
});

test("edge classes are distinguished by pattern and marker, not color alone", () => {
  // The legend states the pattern in words…
  assert.ok(component.includes("solid line, filled arrow head"));
  assert.ok(component.includes("dashed line, open arrow head"));

  // …the stylesheet carries a real, EFFECTIVE pattern difference. The exact
  // stroke width and dash lengths are presentation and are deliberately not
  // pinned; what is required is that the navigation class still renders
  // non-solid once every rule in the sheet has had its say. A value such as
  // `0 0` contains digits and is not the word `none`, yet paints a solid line,
  // so it must not satisfy this contract.
  //
  // The interpreter is pinned first, so the assertions that follow cannot pass
  // because the helper became permissive.
  for (const pattern of ["5 4", "5px 4px", "2 0 0 3", "5", "1.5,2.5"]) {
    assert.equal(dashPattern(pattern).effective, true, `${pattern} is a real dash pattern`);
  }
  for (const pattern of ["none", "", "0 0", "0px 0px", "0, 0", "0 0 0 0", "0", "-5 4", "var(--x)"]) {
    assert.equal(dashPattern(pattern).effective, false, `${pattern} is not a real dash pattern`);
  }
  assert.equal(dashPattern(null).declared, false);

  assert.ok(
    effectiveValue(NAVIGATION_EDGE_CLASS, "stroke-dasharray") !== null,
    "the navigation edge class must declare a stroke-dasharray",
  );
  const navigation = dashPattern(effectiveValue(NAVIGATION_EDGE_CLASS, "stroke-dasharray"));
  assert.ok(navigation.valid, `the navigation dash pattern is unusable: ${navigation.reason}`);
  assert.ok(
    navigation.effective,
    `the navigation edge class must render non-solid: ${navigation.reason}`,
  );

  const named = dashPattern(effectiveValue(SOURCE_NAMED_EDGE_CLASS, "stroke-dasharray"));
  assert.ok(
    !named.effective,
    `the source-named edge class must stay solid: ${named.reason}`,
  );

  // …and the distinction is never carried by colour: neither class sets a hue
  // of its own in any rule, so both render in the one shared stroke colour.
  for (const [name, selector] of [
    ["source-named", SOURCE_NAMED_EDGE_CLASS],
    ["navigation", NAVIGATION_EDGE_CLASS],
  ]) {
    for (const property of ["stroke", "fill", "color"]) {
      assert.equal(
        effectiveValue(selector, property),
        null,
        `the ${name} edge class must not carry its own ${property}`,
      );
    }
  }
  const sharedEdgeRule = COMPONENT_RULES.find((rule) => rule.selector.trim().endsWith(".psadj-edge"));
  assert.ok(sharedEdgeRule, "both classes must inherit one shared edge rule");
  assert.equal(
    sharedEdgeRule.declarations.find((declaration) => declaration.property === "stroke")?.value,
    "currentColor",
    "the shared edge rule carries the one stroke colour",
  );

  // …and each class carries its own arrow marker, so shape distinguishes them
  // even where a dash pattern cannot be seen.
  assert.ok(/psadj-arrow-filled/.test(client));
  assert.ok(/psadj-arrow-open/.test(client));
  assert.ok(/"marker-end"/.test(client));
  assert.ok(/url\(#psadj-arrow-filled\)/.test(client));
  assert.ok(/url\(#psadj-arrow-open\)/.test(client));
});

test("a reduced-motion media query is present and no animation is mandatory", () => {
  assert.ok(/@media \(prefers-reduced-motion: reduce\)/.test(component));
  // Nothing in the client schedules an animation or a transition at all.
  for (const forbidden of ["requestAnimationFrame", "transition(", ".duration(", "setInterval"]) {
    assert.ok(!client.includes(forbidden), forbidden);
  }
});

test("the layout is usable at narrow mobile width", () => {
  // A narrow-viewport rule exists and collapses the two-column description rows
  // to a single column. WHICH breakpoint it uses is presentation; that a
  // narrow-width rule exists and single-columns those grids is the guarantee.
  const narrowRule = atRuleBody(component, /@media \(max-width:\s*[^)]+\)/);
  assert.ok(
    /grid-template-columns:\s*1fr/.test(narrowRule),
    "the narrow-width rule must collapse the description grids to one column",
  );

  const groupCount = new Set(concepts.map((node) => node.grouping)).size;

  // However narrow the viewport, the resolved column count stays usable: a
  // whole number, at least one, and never more than there are groups.
  for (const width of [1, 16, 64, 200, 320, 576, 640, 960, 1200, 1920, 4096]) {
    const resolved = columnsForWidth(width, groupCount);
    assert.ok(Number.isInteger(resolved), `width ${width} must resolve to a whole number`);
    assert.ok(resolved >= 1 && resolved <= groupCount, `width ${width} resolved to ${resolved}`);
  }

  // A narrower viewport never resolves to MORE columns than a wider one.
  for (let width = 1; width <= 4096; width += 7) {
    assert.ok(
      columnsForWidth(width, groupCount) <= columnsForWidth(width + 7, groupCount),
      `the column count must not decrease as width grows, at width ${width}`,
    );
  }

  // One group column always fits: a viewport wide enough for exactly one group
  // region resolves to exactly one column. Derived from the layout module's own
  // constants, so no pixel literal is pinned here.
  assert.equal(
    columnsForWidth(GROUP_REGION_WIDTH + ADJACENCY_LAYOUT_METRICS.CANVAS_PADDING * 2, groupCount),
    1,
  );

  // An unknown or non-positive width falls back to the full group count — never
  // to zero columns and never to an unrenderable layout.
  for (const unknown of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(columnsForWidth(unknown, groupCount), groupCount, `width ${unknown}`);
  }

  // Responsiveness is a presentation parameter ONLY: every concept record is
  // present at every resolvable column count, and none is ever dropped.
  for (let columns = 1; columns <= groupCount; columns += 1) {
    const responsive = computeSemanticLayout(concepts, { columnsPerBand: columns });
    assert.equal(responsive.nodes.length, concepts.length, `columns ${columns}`);
    assert.equal(
      new Set(responsive.nodes.map((node) => node.id)).size,
      concepts.length,
      `columns ${columns}`,
    );
  }
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
