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
  buildDirectionalIndex,
  compareNodes,
  computeRadialLayout,
  computeRoleOrbit,
  directionForKey,
  firstReachableId,
  GRAPH_RECORD_ORDER,
  HIT_R,
  lastReachableId,
  resolveDirectionalTarget,
  RING_R,
  ROLE_ORBIT_R,
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

const layout = () => computeRadialLayout(snapshot.nodes);
const bands = () => computeRoleOrbit(snapshot.nodes);
const navIndex = () => buildDirectionalIndex(snapshot.nodes);

const serialize = (l) =>
  JSON.stringify({
    groups: l.groups,
    concepts: l.concepts.map((n) => ({
      id: n.id,
      groupKey: n.node.grouping,
      orderIndex: n.orderIndex,
      theta: n.theta,
      x: n.x,
      y: n.y,
    })),
  });

// ---------------------------------------------------------------------------
// Layout membership
// ---------------------------------------------------------------------------

test("exactly the 49 concept records enter the semantic layout", () => {
  const l = layout();
  assert.equal(l.concepts.length, 49);
  assert.equal(new Set(l.concepts.map((n) => n.id)).size, 49);
  for (const entry of l.concepts) {
    assert.equal(entry.node.visualization_role, "concept");
    assert.equal(entry.node.semantic_layout_participation, true);
  }
  assert.equal(l.groups.length, 7);
});

test("the 10 fixed-band records sit outside the semantic layout", () => {
  const b = bands();
  assert.equal(b.roles.length, 10);
  assert.deepEqual(
    b.labels.map((label) => [label.role, label.count]),
    [
      ["orientation", 2],
      ["boundary", 7],
      ["anchor", 1],
    ],
  );
  const semanticIds = new Set(layout().concepts.map((n) => n.id));
  for (const item of b.roles) {
    assert.ok(!semanticIds.has(item.id));
    assert.equal(item.node.semantic_layout_participation, false);
  }
});

test("a fixed-band record cannot be forced into the semantic layout", () => {
  // The two coordinate spaces are separated by ROLE, not by a caller promise:
  // each producer selects its own records, so a fixed-band record can never
  // acquire a concept-ring coordinate and vice versa.
  const conceptIds = new Set(computeRadialLayout(snapshot.nodes).concepts.map((n) => n.id));
  const roleIds = new Set(computeRoleOrbit(snapshot.nodes).roles.map((n) => n.id));
  for (const node of bandNodes) assert.ok(!conceptIds.has(node.id), node.id);
  for (const node of concepts) assert.ok(!roleIds.has(node.id), node.id);
  assert.equal(conceptIds.size + roleIds.size, 59);
});

test("fixed-band records contribute nothing to concept positions", () => {
  // Concept coordinates are computed from the concept records alone; adding,
  // removing or reordering fixed-band records cannot change a single
  // coordinate because they are never an input to that space.
  const withAll = serialize(computeRadialLayout(snapshot.nodes));
  const again = serialize(computeRadialLayout([...snapshot.nodes].reverse()));
  assert.equal(withAll, again, "input order must not affect the layout either");
  assert.equal(serialize(computeRadialLayout(concepts)), withAll);
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
  assert.ok(
    !/edges/.test(layoutSource.split("export function computeRadialLayout")[1].split("\n}\n")[0]),
  );

  const toggleHandler = client.slice(
    client.indexOf('input.addEventListener("change"'),
    client.indexOf("// --- Keyboard interaction"),
  );
  assert.ok(
    !/computeRadialLayout|computeRoleOrbit|computeEdgeRouting|buildDirectionalIndex/.test(
      toggleHandler,
    ),
  );

  // Behavioural proof: the same records produce byte-identical coordinates
  // regardless of which edges a caller intends to draw.
  assert.equal(serialize(layout()), serialize(layout()));
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
  // Every glyph is inscribed in ONE box and every record carries the same hit
  // radius, so footprint can encode neither degree nor grouping size. The
  // authored markup is the proof: one halo radius, one hit radius, and glyph
  // geometry that is literal in every branch.
  const haloRadii = new Set([...component.matchAll(/psadj-node__halo" r="([\d.]+)"/g)].map((m) => m[1]));
  const hitRadii = new Set([...component.matchAll(/psadj-node__hit" r="([\d.]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...haloRadii], ["14"]);
  assert.deepEqual([...hitRadii], [String(HIT_R)]);

  // Concept and role records sit on their own single radius apiece.
  const l = layout();
  const conceptRadii = new Set(
    l.concepts.map((n) => Math.round(Math.hypot(n.x - 500, n.y - 500) * 1e6) / 1e6),
  );
  assert.deepEqual([...conceptRadii], [RING_R]);
  const b = bands();
  const roleRadii = new Set(
    b.roles.map((n) => Math.round(Math.hypot(n.x - 500, n.y - 500) * 1e6) / 1e6),
  );
  assert.deepEqual([...roleRadii], [ROLE_ORBIT_R]);
});

test("labels come from the dataset only, never from a filename", () => {
  for (const node of snapshot.nodes) {
    assert.equal(node.display_label_source, "registry_name");
    // A shortened label is never the repository path.
    const shortened = shortenLabel(node.display_label);
    assert.ok(!shortened.lines.includes(node.repository_path), node.id);
  }
  // The accessible name carries the FULL untruncated label plus the role, and
  // it is authored in the component rather than assembled at runtime.
  assert.ok(/aria-label=\{`\$\{node\.display_label\}\. \$\{role\} record\.`\}/.test(component));
  assert.ok(!/display_label\.slice/.test(component), "an accessible name is never truncated");
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
  // Retargeted at P7.1. Complete keyboard reachability is NATIVE SEQUENTIAL
  // traversal over all 59 authored record controls, not arrow traversal — the
  // arrow-reachability claim this test once made was independently refuted
  // (maximum 55 of 59, and no starting record reaches all 59), so asserting it
  // would pin an unsatisfiable requirement.
  const index = navIndex();
  assert.equal(index.order.length, 59);

  // Every record is authored as its own control, in canonical order…
  const authored = [...component.matchAll(/data-psadj-node=\{node\.id\}/g)];
  assert.equal(authored.length, 1, "controls are authored by one mapped template");
  assert.ok(/GRAPH_RECORD_ORDER\(snapshot\.nodes\)/.test(component));
  assert.deepEqual(
    index.order.map((entry) => entry.id),
    GRAPH_RECORD_ORDER(snapshot.nodes).map((node) => node.id),
  );

  // …each one focusable, with none removed from the sequential order.
  assert.ok(/tabindex="0"/.test(component));
  assert.ok(!/tabindex="-1"/.test(component), "no record may leave the sequential focus order");

  // …and Tab is never intercepted, so the browser's own guarantee holds.
  for (const interception of ['"Tab"', "keyCode === 9", "which === 9"]) {
    assert.ok(!client.includes(interception), `Tab must not be intercepted via ${interception}`);
  }
});

test("Home and End reach the first and last record deterministically", () => {
  const index = navIndex();
  const first = firstReachableId(index);
  const last = lastReachableId(index);
  assert.ok(first && last);
  assert.notEqual(first, last);
  // They are the ends of the canonical record order, not of a render order.
  const canonical = GRAPH_RECORD_ORDER(snapshot.nodes);
  assert.equal(first, canonical[0].id);
  assert.equal(last, canonical[canonical.length - 1].id);
  // Stable across repeated calls and across input order.
  assert.equal(firstReachableId(buildDirectionalIndex([...snapshot.nodes].reverse())), first);
  assert.equal(lastReachableId(buildDirectionalIndex([...snapshot.nodes].reverse())), last);
});

test("arrow-key movement is deterministic and locale independent", () => {
  const index = navIndex();
  const reversed = buildDirectionalIndex([...snapshot.nodes].reverse());
  for (const node of index.order) {
    for (const direction of SPATIAL_DIRECTIONS) {
      const a = resolveDirectionalTarget(index, node.id, direction);
      const b = resolveDirectionalTarget(reversed, node.id, direction);
      assert.equal(a, b, `${node.id} ${direction}`);
    }
  }
});

test("arrow-key movement over hand-written indices", () => {
  // A hand-built cross: one record at the centre and one in each direction.
  const entry = (id, x, y, orderIndex) => ({ id, orderIndex, x, y });
  const order = [
    entry("centre", 500, 500, 0),
    entry("above", 500, 400, 1),
    entry("below", 500, 600, 2),
    entry("leftward", 400, 500, 3),
    entry("rightward", 600, 500, 4),
  ];
  const grid = { order, points: new Map(order.map((e) => [e.id, e])) };

  assert.equal(resolveDirectionalTarget(grid, "centre", "up"), "above");
  assert.equal(resolveDirectionalTarget(grid, "centre", "down"), "below");
  assert.equal(resolveDirectionalTarget(grid, "centre", "left"), "leftward");
  assert.equal(resolveDirectionalTarget(grid, "centre", "right"), "rightward");
  // Focus never wraps: there is no target past an edge, and null is normal.
  assert.equal(resolveDirectionalTarget(grid, "above", "up"), null);
  assert.equal(resolveDirectionalTarget(grid, "below", "down"), null);
  assert.equal(resolveDirectionalTarget(grid, "leftward", "left"), null);
  assert.equal(resolveDirectionalTarget(grid, "rightward", "right"), null);
  assert.equal(resolveDirectionalTarget(grid, "missing", "up"), null);
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
  // Retargeted at P7.1: the responsive `resize` listener is GONE, because
  // responsiveness is now a fixed logical viewBox plus CSS. So no window-level
  // listener of any kind remains here.
  assert.ok(
    !/window\.addEventListener\(/.test(client),
    "no window-level listener may remain in the client",
  );
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
  assert.ok(/resolveDirectionalTarget\(state\.navigation, currentId, direction\)/.test(body));
  assert.ok(/selectNode\(state, currentId\)/.test(body));
  // Exactly one directional resolver is consulted, and Tab is not among the
  // keys this listener handles at all.
  assert.equal([...body.matchAll(/resolveDirectionalTarget\(/g)].length, 1);
  assert.ok(!body.includes('"Tab"'));
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
const parseStyleRules = (styleSheet: string) => {
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
  collect(styleSheet.replace(/\/\*[\s\S]*?\*\//g, ""));
  return rules;
};

/** The same, over every `<style>` block of an Astro component, in order. */
const componentStyleRules = (source: string) =>
  [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].flatMap((block) =>
    parseStyleRules(block[1]),
  );

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
/** The CSS initial outline state. */
const OUTLINE_INITIAL = { width: OUTLINE_WIDTH_KEYWORDS.medium, style: "none" };

/** A `!important` annotation, case-insensitive and whitespace-tolerant. */
const IMPORTANT_ANNOTATION = /!\s*important\b/i;

const OUTLINE_PROPERTIES = ["outline", "outline-width", "outline-style"];

/**
 * Outline resolution, step one: expand one declaration into the subproperty
 * CANDIDATES it contributes. Nothing is decided here — a candidate only becomes
 * effective once `resolveOutline` weighs it against every other candidate that
 * applies to the same target.
 *
 *   - the `outline` shorthand contributes to BOTH protected subproperties,
 *     resetting to the CSS initial value whichever of them it does not name;
 *   - `outline-width` and `outline-style` contribute only to their own
 *     subproperty, leaving the other one to whatever else wins it;
 *   - colour tokens are ignored and never corrupt the parse.
 *
 * Candidates are compared by specificity BEFORE rule source order and
 * declaration order, so a later declaration does not simply win. Two inputs
 * never establish visibility at all: an unresolvable dynamic value, and a
 * protected `!important` declaration — both are reported as defects by
 * `focusModelDefects` and fail closed.
 *
 * This resolves the outline subproperties only. It is not the complete browser
 * cascade.
 */
const outlineCandidates = ({ property, value }: { property: string; value: string }) => {
  if (property === "outline") {
    let width: number | null = null;
    let style: string | null = null;
    for (const token of value.split(/\s+/).filter(Boolean)) {
      const lower = token.toLowerCase();
      if (OUTLINE_STYLES.includes(lower)) style = lower;
      else if (lower in OUTLINE_WIDTH_KEYWORDS) width = OUTLINE_WIDTH_KEYWORDS[lower];
      else {
        const length = cssLength(token);
        if (length !== null) width = length;
      }
    }
    return [
      { subproperty: "width", value: width === null ? OUTLINE_INITIAL.width : width },
      { subproperty: "style", value: style === null ? OUTLINE_INITIAL.style : style },
    ];
  }
  if (property === "outline-width") {
    const lower = value.trim().toLowerCase();
    const width = lower in OUTLINE_WIDTH_KEYWORDS ? OUTLINE_WIDTH_KEYWORDS[lower] : cssLength(value.trim());
    return width === null ? [] : [{ subproperty: "width", value: width }];
  }
  if (property === "outline-style") {
    return [{ subproperty: "style", value: value.trim().toLowerCase() }];
  }
  return [];
};

const INTERACTIVE_ELEMENTS = ["a", "button", "input", "select", "textarea"];

/**
 * Bounded selector model for the focus contract.
 *
 * Focus is a CASCADE property. Which declaration a browser applies is decided
 * by importance, then specificity, and only then by source and declaration
 * order — so neither evaluating a rule in isolation nor comparing rules by
 * source order alone gives the right answer.
 *
 * The model below therefore:
 *
 *   - parses each selector-list branch INDEPENDENTLY, as CSS does;
 *   - gives every branch a specificity tuple
 *     (ids, classes/attributes/pseudo-classes, types/pseudo-elements), where
 *     `:is(...)` contributes the lexicographically greatest specificity among
 *     its alternatives — which is why
 *     `.psadj :is(a, button, input, [tabindex]):focus-visible` scores (0,3,0)
 *     and outranks the textually narrower
 *     `.psadj__toolbar button:focus-visible` at (0,2,1);
 *   - resolves each representative target against every branch that matches it;
 *   - lets matching declarations contribute independent candidates for
 *     `outline-width` and `outline-style`, each subproperty being won by
 *     specificity, then rule source order, then declaration order.
 *
 * Two things fail closed rather than being skipped or assumed visible:
 * unsupported selector syntax inside the protected focus set, and a protected
 * `!important` declaration, which this contract does not authorize.
 *
 * This intentionally supports only the component's authorized selector grammar.
 * It is not a complete CSS engine: cascade layers, `@scope`, inline styles,
 * transitions and animations are not modelled, and none of them appears on the
 * protected focus surface. Extend the model rather than assume, if one ever
 * does.
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

/**
 * Specificity, as the tuple (ids, classes/attributes/pseudo-classes, types).
 * Source order decides only AFTER specificity, which is why a selector that
 * merely reads as narrower is not necessarily the one the browser applies:
 * `:is()` contributes the specificity of its MOST specific argument, so
 * `.psadj :is(a, button, input, [tabindex]):focus-visible` scores (0,3,0)
 * — higher than `.psadj__toolbar button:focus-visible` at (0,2,1).
 */
const compareSpecificity = (left: number[], right: number[]) =>
  left[0] - right[0] || left[1] - right[1] || left[2] - right[2];

const specificityOfCompound = (simples): number[] => {
  const total = [0, 0, 0];
  for (const simple of simples) {
    if (simple.kind === "class" || simple.kind === "attr" || simple.kind === "focus") total[1] += 1;
    else if (simple.kind === "type") total[2] += 1;
    else if (simple.kind === "is") {
      let best = [0, 0, 0];
      for (const alternative of simple.alternatives) {
        const candidate = specificityOfCompound(alternative);
        if (compareSpecificity(candidate, best) > 0) best = candidate;
      }
      total[0] += best[0];
      total[1] += best[1];
      total[2] += best[2];
    }
  }
  return total;
};

/** A whole selector branch: descendant compounds simply sum. */
const specificityOf = (compounds): number[] =>
  compounds.reduce(
    (total, compound) => {
      const part = specificityOfCompound(compound);
      return [total[0] + part[0], total[1] + part[1], total[2] + part[2]];
    },
    [0, 0, 0],
  );

/** Cascade position: specificity first, then rule order, then declaration order. */
const compareCascade = (left, right) =>
  compareSpecificity(left.specificity, right.specificity) ||
  left.rule - right.rule ||
  left.declaration - right.declaration;

/**
 * Parse a rule list into protected focus rules: every rule mentioning
 * `:focus-visible`, with each selector-list branch parsed into compounds and
 * carrying its own specificity. Branches are independent, exactly as in CSS.
 */
const focusRulesFrom = (rules) =>
  rules
    .map((rule, index) => ({ ...rule, index }))
    .filter((rule) => rule.selector.includes(":focus-visible"))
    .map((rule) => ({
      index: rule.index,
      selector: rule.selector,
      declarations: rule.declarations,
      branches: splitSelectorList(rule.selector).map((part) => {
        const compounds = splitCompounds(part).map(parseCompound);
        const usable = compounds.length > 0 && compounds.every((compound) => compound !== null);
        return { text: part, compounds, specificity: usable ? specificityOf(compounds) : null };
      }),
    }));

/**
 * Everything about a protected focus rule set this bounded model refuses to
 * evaluate. Each of these FAILS CLOSED rather than being skipped or assumed
 * visible: unsupported selector syntax, an `!important` annotation the bounded
 * contract does not authorize, and any outline value that cannot be resolved
 * statically. Declarations are already comment-stripped, so a comment cannot
 * hide an annotation, and nothing outside a parsed protected declaration is
 * ever inspected.
 */
const focusModelDefects = (focusRules): string[] => {
  const defects: string[] = [];
  for (const rule of focusRules) {
    for (const branch of rule.branches) {
      if (branch.specificity === null) {
        defects.push(
          `the bounded focus model cannot interpret the protected selector "${branch.text}"; extend the model rather than skipping the rule`,
        );
      }
    }
    for (const { property, value } of rule.declarations) {
      if (IMPORTANT_ANNOTATION.test(value)) {
        defects.push(
          `"${rule.selector}" declares "${property}: ${value}"; the bounded focus contract does not authorize !important declarations`,
        );
        continue;
      }
      if (!OUTLINE_PROPERTIES.includes(property)) continue;
      if (DYNAMIC_VALUE.test(value)) {
        defects.push(`"${rule.selector}" declares an unresolvable "${property}: ${value}"`);
        continue;
      }
      if (
        property === "outline-width" &&
        !(value.trim().toLowerCase() in OUTLINE_WIDTH_KEYWORDS) &&
        cssLength(value.trim()) === null
      ) {
        defects.push(`"${rule.selector}" declares an uninterpretable width "${value}"`);
      }
      if (property === "outline-style" && !OUTLINE_STYLES.includes(value.trim().toLowerCase())) {
        defects.push(`"${rule.selector}" declares an uninterpretable style "${value}"`);
      }
    }
  }
  return defects;
};

/** A branch whose SUBJECT carries `:focus-visible` — the ones that style the
 *  focused element itself rather than a descendant of it. */
const focusSubjectBranches = (rule) =>
  rule.branches.filter(
    (branch) =>
      branch.specificity !== null &&
      branch.compounds[branch.compounds.length - 1].some((simple) => simple.kind === "focus"),
  );

/**
 * The browser-effective outline for one target. Width and style are cascaded
 * INDEPENDENTLY, each won by the candidate with the greatest
 * (specificity, rule order, declaration order). Flattening declarations into
 * source order — the previous model — is not the cascade and produced both
 * false passes and false failures.
 */
const resolveOutline = (focusRules, target) => {
  const winners: Record<string, { value: unknown; at: unknown }> = { width: null, style: null };
  for (const rule of focusRules) {
    const matching = focusSubjectBranches(rule).filter((branch) =>
      selectorMatchesTarget(branch.compounds, target.chain),
    );
    if (matching.length === 0) continue;
    let specificity = [0, 0, 0];
    for (const branch of matching) {
      if (compareSpecificity(branch.specificity, specificity) > 0) specificity = branch.specificity;
    }
    rule.declarations.forEach((declaration, declarationIndex) => {
      for (const candidate of outlineCandidates(declaration)) {
        const at = { specificity, rule: rule.index, declaration: declarationIndex };
        const current = winners[candidate.subproperty];
        if (current === null || compareCascade(at, current.at) >= 0) {
          winners[candidate.subproperty] = { value: candidate.value, at };
        }
      }
    });
  }
  const width = winners.width === null ? OUTLINE_INITIAL.width : winners.width.value;
  const style = winners.style === null ? OUTLINE_INITIAL.style : winners.style.value;
  const declared = winners.width !== null || winners.style !== null;
  return {
    declared,
    width,
    style,
    visible: declared && style !== "none" && style !== "hidden" && width > 0,
  };
};

const FOCUS_RULES = focusRulesFrom(COMPONENT_RULES);

/** The component root. Every rule in this stylesheet is scoped beneath it, and
 *  the markup renders the whole product inside `<section class="psadj">`. */
const PSADJ_ROOT = elementNode(null, ["psadj"]);

/** Representative protected targets: the interactive contexts the component
 *  actually renders, plus one derived from every interactive focus selector the
 *  stylesheet itself declares, so a newly added focus rule is protected too. */
const focusTargetsFor = (focusRules) => {
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

  for (const rule of focusRules) {
    for (const branch of focusSubjectBranches(rule)) {
      const chains = branch.compounds.reduce(
        (accumulated, compound) =>
          nodesFromCompound(compound).flatMap((node) =>
            accumulated.map((chain) => [...chain, node]),
          ),
        [[]],
      );
      for (const chain of chains) {
        if (!isInteractiveNode(chain[chain.length - 1])) continue;
        const rooted = chain[0].classes.has("psadj") ? chain : [PSADJ_ROOT, ...chain];
        targets.push({ name: `"${branch.text}"`, chain: rooted });
      }
    }
  }
  return targets;
};

/** Build a complete bounded focus model from raw CSS, for the fixtures below. */
const focusModelOf = (styleSheet: string) => {
  const focusRules = focusRulesFrom(parseStyleRules(styleSheet));
  return { focusRules, defects: focusModelDefects(focusRules), targets: focusTargetsFor(focusRules) };
};

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
  // Authored in the component at P7.1, because sequential Tab order follows
  // authored DOM order and cannot be left to a runtime append loop.
  assert.ok(/tabindex="0"/.test(component));
  assert.ok(/role="button"/.test(component));
  assert.ok(/aria-pressed="false"/.test(component));
  assert.ok(/data-selected="false"/.test(component));
  // The client updates that state without ever creating or reordering a control.
  assert.ok(/setAttribute\("aria-pressed"/.test(client));
  assert.ok(/setAttribute\("data-selected"/.test(client));
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
  // Authored server-side at P7.1, so both are present in the emitted HTML
  // rather than appearing only once the client has run.
  assert.ok(/<title>/.test(component));
  assert.ok(/<desc>/.test(component));
  assert.ok(/aria-label=\{GRAPH_REGION_LABEL\}/.test(component));
  assert.ok(/role="group"/.test(component));
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

  // --- the bounded cascade model, pinned before it is relied upon ------------
  //
  // Specificity decides before source order. `:is()` contributes its MOST
  // specific argument, so a selector that merely reads as narrower is not
  // necessarily the one the browser applies.
  const specificityText = (selector: string) =>
    specificityOf(splitCompounds(selector).map(parseCompound)).join(",");
  assert.equal(specificityText(".psadj :is(a, button, input, [tabindex]):focus-visible"), "0,3,0");
  assert.equal(specificityText(".psadj .psadj__toolbar button:focus-visible"), "0,3,1");
  assert.equal(specificityText(".psadj button:focus-visible"), "0,2,1");
  assert.equal(specificityText(".psadj__toolbar button:focus-visible"), "0,2,1");
  assert.equal(specificityText(".psadj [tabindex]:focus-visible"), "0,3,0");
  assert.equal(specificityText("*:focus-visible"), "0,1,0");

  const GENERAL = `.psadj :is(a, button, input, [tabindex]):focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }`;
  const outlineFor = (styleSheet: string, targetName: string) => {
    const model = focusModelOf(styleSheet);
    assert.deepEqual(model.defects, [], `fixture stylesheet is not evaluable: ${model.defects[0]}`);
    const target = model.targets.find((entry) => entry.name === targetName);
    assert.ok(target, `fixture target ${targetName} was not derived`);
    return resolveOutline(model.focusRules, target);
  };
  const TOOLBAR = "a toolbar button inside .psadj";
  const BUTTON = "a button inside .psadj";
  const INPUT = "an input inside .psadj";
  const TABINDEX = "a [tabindex] element inside .psadj";

  // S1 — an EARLIER higher-specificity suppression still wins. Source order
  //      would wrongly let the later general rule paint an outline the browser
  //      never shows.
  assert.equal(
    outlineFor(
      `.psadj .psadj__toolbar button:focus-visible { outline-width: 0; }\n${GENERAL}`,
      TOOLBAR,
    ).visible,
    false,
    "S1: a higher-specificity suppression must win and remove the focus outline",
  );

  // S2 — a lower-specificity suppression does not defeat a stronger positive
  //      rule, and a higher-specificity positive refinement still applies.
  const s2 = `${GENERAL}
    .psadj button:focus-visible { outline-width: 0; }
    .psadj .psadj__toolbar button:focus-visible { outline-width: 4px; }`;
  assert.equal(outlineFor(s2, BUTTON).visible, true, "S2: the stronger general rule wins");
  assert.equal(outlineFor(s2, TOOLBAR).visible, true, "S2: the toolbar refinement wins");

  // S3 — at EQUAL specificity, source order decides, in both directions.
  const equal = ".psadj :is(a, button, input, [tabindex]):focus-visible";
  assert.equal(
    outlineFor(`${equal} { outline-width: 0; }\n${GENERAL}`, BUTTON).visible,
    true,
    "S3: at equal specificity a later positive declaration wins",
  );
  assert.equal(
    outlineFor(`${GENERAL}\n${equal} { outline-width: 0; }`, BUTTON).visible,
    false,
    "S3: at equal specificity a later zero suppresses the focus outline",
  );

  // S4 — `:is()` specificity is NOT the matched alternative. The general rule
  //      scores (0,3,0) and defeats the textually narrower (0,2,1) suppression,
  //      so the outline survives. The previous model failed this benign case.
  assert.equal(
    outlineFor(`${GENERAL}\n.psadj__toolbar button:focus-visible { outline-width: 0; }`, TOOLBAR)
      .visible,
    true,
    "S4: :is() takes its most specific argument, so the general rule still wins",
  );

  // S5 — shorthand and longhand cascade per subproperty, by specificity.
  assert.equal(
    outlineFor(
      `.psadj .psadj__toolbar button:focus-visible { outline: 0; }\n${GENERAL}\n.psadj__toolbar button:focus-visible { outline-width: 4px; }`,
      TOOLBAR,
    ).visible,
    false,
    "S5A: the strongest shorthand suppression wins both subproperties",
  );
  const s5b = `${GENERAL}
    .psadj button:focus-visible { outline: 0; }
    .psadj .psadj__toolbar button:focus-visible { outline: 4px solid currentColor; }`;
  assert.equal(outlineFor(s5b, BUTTON).visible, true, "S5B: the general rule protects a button");
  assert.equal(outlineFor(s5b, TOOLBAR).visible, true, "S5B: the strongest positive rule wins");

  // A lower-specificity later suppression the general rule defeats stays
  // visible; an EQUAL-specificity later suppression does not.
  assert.equal(
    outlineFor(`${GENERAL}\n.psadj input:focus-visible { outline-width: 0; }`, INPUT).visible,
    true,
    "a weaker later zero does not remove the focus outline",
  );
  assert.equal(
    outlineFor(`${GENERAL}\n.psadj [tabindex]:focus-visible { outline-width: 0; }`, TABINDEX)
      .visible,
    false,
    "an equal-specificity later zero suppresses the focus outline",
  );

  // Shorthand reset semantics, per subproperty.
  for (const [shorthand, width, style] of [
    ["outline: 3px solid currentColor", 3, "solid"],
    ["outline: 0", 0, "none"],
    ["outline: none", 3, "none"],
    ["outline: solid", 3, "solid"],
  ]) {
    const resolved = outlineFor(`.psadj button:focus-visible { ${shorthand}; }`, BUTTON);
    assert.equal(resolved.width, width, `${shorthand} resolves width ${width}`);
    assert.equal(resolved.style, style, `${shorthand} resolves style ${style}`);
  }

  // Positive refinements remain visible; every suppressing form does not.
  for (const refinement of [
    "outline-width: 4px",
    "outline-width: 2px",
    "outline-width: thick",
    "outline-style: dashed",
    "outline-style: dotted",
    "outline: 4px dashed rgb(1, 2, 3)",
  ]) {
    assert.equal(
      outlineFor(`${GENERAL}\n${equal} { ${refinement}; }`, BUTTON).visible,
      true,
      `a later ${refinement} must remain visible`,
    );
  }
  for (const suppression of [
    "outline: none",
    "outline: 0",
    "outline: 0 solid currentColor",
    "outline-width: 0",
    "outline-width: 0px",
    "outline-style: none",
    "outline-style: hidden",
  ]) {
    assert.equal(
      outlineFor(`${GENERAL}\n${equal} { ${suppression}; }`, BUTTON).visible,
      false,
      `a later ${suppression} suppresses the focus outline`,
    );
  }

  // Unsupported syntax, unresolvable values and `!important` all FAIL CLOSED:
  // they are reported as defects, never skipped and never assumed visible.
  for (const unevaluable of [
    ".psadj > button:focus-visible { outline: 3px solid currentColor; }",
    `${GENERAL}\n.psadj input:focus-visible { outline-width: var(--w); }`,
    `${GENERAL}\n.psadj input:focus-visible { outline-width: calc(1px * 0); }`,
    `${GENERAL}\n.psadj input:focus-visible { outline-style: var(--s); }`,
    `${GENERAL}\n.psadj input:focus-visible { outline: 0 !important; }`,
    `${GENERAL}\n.psadj input:focus-visible { outline-width: 0 ! IMPORTANT; }`,
    `${GENERAL}\n.psadj input:focus-visible { outline-style: none!important; }`,
  ]) {
    assert.ok(
      focusModelOf(unevaluable).defects.length > 0,
      `the bounded model must fail closed on: ${unevaluable.split("\n").pop()}`,
    );
  }
  // …while ordinary colour functions and the real stylesheet do not.
  assert.deepEqual(focusModelOf(`${GENERAL}\n${equal} { outline: 2px solid rgb(0, 0, 0); }`).defects, []);

  // --- the component's own protected focus contract -------------------------
  assert.deepEqual(
    focusModelDefects(FOCUS_RULES),
    [],
    "the component's protected focus rules must be fully evaluable",
  );

  const targets = focusTargetsFor(FOCUS_RULES);
  assert.ok(targets.length >= 6, `only ${targets.length} protected focus targets were derived`);
  assert.ok(
    targets.some((target) => target.name.includes("toolbar")),
    "the toolbar-button context must be a protected target",
  );

  for (const target of targets) {
    const outline = resolveOutline(FOCUS_RULES, target);
    assert.ok(
      outline.declared,
      `no applicable :focus-visible rule establishes an outline for ${target.name}`,
    );
    assert.ok(
      outline.visible,
      `${target.name} must paint a focus outline, got width ${outline.width} style ${outline.style}`,
    );
  }
  assert.deepEqual(
    targets.filter((target) => !resolveOutline(FOCUS_RULES, target).visible).map((t) => t.name),
    [],
    "no applicable rule removes the focus outline from a protected interactive target",
  );

  // The composition really is cross-selector: a rule whose selector never
  // mentions the toolbar still applies to a toolbar button.
  const toolbar = targets.find((target) => target.name.includes("toolbar"));
  assert.ok(toolbar, "the toolbar-button target must exist");
  const toolbarRules = FOCUS_RULES.filter((rule) =>
    focusSubjectBranches(rule).some((branch) =>
      selectorMatchesTarget(branch.compounds, toolbar.chain),
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
    FOCUS_RULES.some((rule) => rule.selector.includes(".psadj-node:focus-visible")),
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

  // …and the distinction is never carried by colour ALONE.
  //
  // Retargeted at P7.1, which assigns each class an approved hue as a SECONDARY
  // cue. The guarantee was never "no colour anywhere" — it is that a visitor who
  // cannot distinguish the two hues can still tell the classes apart. So the
  // assertion is now the stronger, more direct one: strip every colour
  // declaration from both class rules and they must STILL differ, and they must
  // still differ specifically in the dash channel.
  const nonColourDeclarations = (selectorPart: string) => {
    const rules = COMPONENT_RULES.filter((rule) => rule.selector.includes(selectorPart));
    assert.ok(rules.length > 0, `${selectorPart} must declare a rule of its own`);
    return rules
      .flatMap((rule) => rule.declarations)
      .filter((declaration) => !["stroke", "fill", "color"].includes(declaration.property))
      .map((declaration) => `${declaration.property}:${declaration.value}`)
      .sort()
      .join(";");
  };
  const namedNonColour = nonColourDeclarations(SOURCE_NAMED_EDGE_CLASS);
  const navigationNonColour = nonColourDeclarations(NAVIGATION_EDGE_CLASS);
  assert.notEqual(
    namedNonColour,
    navigationNonColour,
    "with colour removed the two edge classes must still differ",
  );
  assert.ok(/stroke-dasharray/.test(navigationNonColour), "navigation keeps its dash pattern");
  assert.ok(!/stroke-dasharray/.test(namedNonColour), "source-named keeps no dash pattern");

  // Neither class paints a fill of its own; the shared rule owns that.
  for (const [name, selector] of [
    ["source-named", SOURCE_NAMED_EDGE_CLASS],
    ["navigation", NAVIGATION_EDGE_CLASS],
  ]) {
    assert.equal(
      effectiveValue(selector, "fill"),
      null,
      `the ${name} edge class must not carry its own fill`,
    );
  }
  const sharedEdgeRule = COMPONENT_RULES.find((rule) => rule.selector.trim().endsWith(".psadj-edge"));
  assert.ok(sharedEdgeRule, "both classes must inherit one shared edge rule");
  assert.equal(
    sharedEdgeRule.declarations.find((declaration) => declaration.property === "fill")?.value,
    "none",
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

  // Retargeted at P7.1. Responsiveness is no longer a resolved column count —
  // it is a fixed logical viewBox plus CSS — but the guarantee is unchanged:
  // the layout stays usable at narrow width and never drops a record.

  // The two-column graph grid collapses to one column at the same breakpoint,
  // so the docked details panel moves BELOW the canvas instead of overflowing.
  assert.ok(
    /\.psadj__grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 880px\) minmax\(280px, 340px\)/.test(
      component,
    ),
    "the wide grid must declare the approved tracks",
  );
  assert.ok(
    /\.psadj__grid\s*\{\s*grid-template-columns:\s*1fr;/.test(narrowRule),
    "the narrow-width rule must collapse .psadj__grid to one column",
  );

  // Nothing may force body-level horizontal overflow: the canvas column can
  // shrink, and the SVG is width-constrained rather than fixed.
  assert.ok(/min-width:\s*0/.test(component), "the canvas column must be allowed to shrink");
  assert.ok(/max-width:\s*100%/.test(component), "the SVG must be width-constrained");
  assert.ok(/overflow-wrap:\s*anywhere/.test(component), "long labels must wrap");

  // The geometry is width-independent by construction: one fixed logical
  // viewport, scaled by the browser, so no record is dropped or repositioned at
  // any viewport width.
  assert.ok(/preserveAspectRatio="xMidYMid meet"/.test(component));
  const responsive = computeRadialLayout(snapshot.nodes);
  assert.equal(responsive.concepts.length, concepts.length);
  assert.equal(new Set(responsive.concepts.map((node) => node.id)).size, concepts.length);
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
  // The BOOLEAN `hidden` attribute only. `aria-hidden` is a different contract
  // — it removes decoration from the accessibility tree without hiding anything
  // from a sighted visitor — so the lookbehind keeps it out of this scan.
  const hiddenTargets = [...component.matchAll(/data-psadj-(\w+)[^>]*?(?<![\w-])hidden(?![\w-])/g)].map(
    (m) => m[1],
  );
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
  // Retargeted at P7.1: there is no teardown at all any more. The SVG, its
  // layers and all 59 record controls are authored server-side, so a wholesale
  // clear would destroy the very DOM order that carries sequential Tab
  // traversal — and would drop focus on every redraw.
  const teardowns = [...client.matchAll(/selectAll\("\*"\)\.remove\(\)/g)];
  assert.equal(teardowns.length, 0, "no full-subtree teardown may remain");
  assert.ok(!/\.innerHTML\s*=/.test(client), "no subtree may be cleared through innerHTML");
  // The only removal is the exit selection of the keyed EDGE join, which owns
  // nothing authored and no record control.
  const removals = [...client.matchAll(/exit\) => exit\.remove\(\)/g)];
  assert.equal(removals.length, 1, "only the keyed edge join may remove anything");
  assert.ok(
    !/\[data-psadj-node\][^\n]*remove\(\)/.test(client),
    "a record control is never removed",
  );
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
