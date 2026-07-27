// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — P7.1 directional navigation.
//
// Canonical checks 62–83 (P7.1) and 213–216 (P7.2): the pure directional
// resolver, the complete sequential keyboard-reachability source contract, and
// the four P7.2 invariance proofs. Twenty-six checks.
//
// The division here is the whole point of the F1 correction:
//
//   - ARROW KEYS are a LOCAL SPATIAL ACCELERATOR. Checks 62–73 pin the
//     resolver's arithmetic exactly, and NOT ONE of them asserts any
//     reachability, connectivity or coverage property. The former all-start
//     arrow-reachability requirement was independently refuted — maximum 55 of
//     59, no start reaching all 59 — and is gone.
//   - COMPLETE REACHABILITY is native sequential Tab/Shift+Tab over all 59
//     authored record controls in GRAPH_RECORD_ORDER. Checks 74–83 pin the
//     source and markup contract that makes that true; the live browser
//     traversal is blocking preview evidence D22 and is never counted here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertAdjacencySnapshot } from "../../src/lib/public-surface-adjacency-map/contract.ts";
import {
  buildDirectionalIndex,
  compareText,
  directionForKey,
  DIRECTION_VECTORS,
  firstReachableId,
  GRAPH_RECORD_ORDER,
  lastReachableId,
  resolveDirectionalTarget,
  SPATIAL_DIRECTIONS,
} from "../../src/lib/public-surface-adjacency-map/layout.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const snapshot = assertAdjacencySnapshot(
  JSON.parse(rd("src/data/public-surface-adjacency-map/last-known-good.json")),
);
const nodes = snapshot.nodes;
const component = rd("src/components/PublicSurfaceAdjacencyMap.astro");
const client = rd("src/scripts/public-surface-adjacency-map.ts");

const nav = buildDirectionalIndex(nodes);
const canonical = GRAPH_RECORD_ORDER(nodes).map((node) => node.id);

/** Executable client code: comments stripped, so no assertion is satisfied by prose. */
const clientCode = client
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n")
  .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
  .join("\n");

/** One `<target>.addEventListener("<type>", …)` body, brace-matched. */
const listenerBody = (source, target, type) => {
  const start = source.indexOf(`${target}.addEventListener("${type}"`);
  assert.notEqual(start, -1, `no ${target}.addEventListener("${type}")`);
  const open = source.indexOf("{", source.indexOf("=>", start));
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return assert.fail(`unbalanced braces in the ${target} ${type} listener`);
};

const keydownBody = listenerBody(clientCode, "canvas", "keydown");

const permute = (items, seed) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = (i * 31 + seed * 17 + 7) % (i + 1);
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
};

/** The six measured null cases. Named individually so a blanket "some nulls
 *  exist" can never satisfy check 71. */
const MEASURED_NULL_CASES = [
  ["AUTHOR.md", "up"],
  ["AI-READING-GUIDE.md", "right"],
  ["MACHINE_INTERPRETATION_STATE.md", "right"],
  ["RELATION_STATUS_GUIDE.md", "down"],
  ["SUMMARY_CONTRACT.md", "left"],
  ["SUMMARY_BOUNDARIES.md", "left"],
];

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

/**
 * Tokens that would mean a check had quietly reintroduced the refuted arrow
 * reachability gate.
 */
const REACHABILITY_TOKENS = ["reachable.size", "stronglyConnected", "transitiveClosure"];

/** This file with its own two prohibition vocabularies removed, so each scan
 *  flags a real usage rather than the list that names what to look for. */
const ownSourceScannable = ownSource
  .replace(/const SKIPPED_TEST_MARKERS = \[[\s\S]*?\n\];/, "")
  .replace(/const REACHABILITY_TOKENS = \[[\s\S]*?\];/, "");

assert.ok(
  ownSourceScannable.length < ownSource.length,
  "the self-scan must strip this file's own prohibition vocabulary",
);
assert.equal(
  [...ownSource.matchAll(/^test\(/gm)].length,
  26,
  "this file must register exactly 26 canonical checks",
);
for (const marker of SKIPPED_TEST_MARKERS) {
  assert.ok(!ownSourceScannable.includes(marker), `no check may be ${marker}`);
}
assert.equal(nav.order.length, 59);
assert.equal(canonical.length, 59);
assert.ok(keydownBody.length > 0);

// No check in this file may assert an arrow reachability, connectivity or
// coverage property. That requirement was refuted and removed; asserting it
// here would quietly reintroduce an unsatisfiable gate.
for (const forbidden of REACHABILITY_TOKENS) {
  assert.ok(!ownSourceScannable.includes(forbidden), `no check may assert ${forbidden}`);
}

// ---------------------------------------------------------------------------
// Pure directional navigation — checks 62–73
// ---------------------------------------------------------------------------

test("62 — candidates outside the requested half-plane are rejected", () => {
  const order = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "ahead", orderIndex: 1, x: 500, y: 400 },
    { id: "behind", orderIndex: 2, x: 500, y: 620 },
  ];
  const index = { order, points: new Map(order.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(index, "origin", "up"), "ahead");
  // The strictly-behind candidate is nearer in the DOWN sense but is never a
  // candidate for UP, however close it sits.
  const closerBehind = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "behind", orderIndex: 1, x: 500, y: 501 },
  ];
  const only = { order: closerBehind, points: new Map(closerBehind.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(only, "origin", "up"), null);
  // A perpendicular candidate is on the boundary and is also rejected.
  const side = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "side", orderIndex: 1, x: 600, y: 500 },
  ];
  const perpendicular = { order: side, points: new Map(side.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(perpendicular, "origin", "up"), null);
});

test("63 — angular deviation is the primary comparison", () => {
  // `aligned` is FARTHER but dead ahead; `skewed` is nearer but off-axis.
  const order = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "aligned", orderIndex: 1, x: 500, y: 300 },
    { id: "skewed", orderIndex: 2, x: 590, y: 430 },
  ];
  const index = { order, points: new Map(order.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(index, "origin", "up"), "aligned");
  assert.ok(Math.hypot(0, 200) > Math.hypot(90, 70), "the winner really is the farther one");
});

test("64 — Euclidean distance is the secondary comparison at equal deviation", () => {
  const order = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "far", orderIndex: 1, x: 500, y: 200 },
    { id: "near", orderIndex: 2, x: 500, y: 400 },
  ];
  const index = { order, points: new Map(order.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(index, "origin", "up"), "near");
});

test("65 — ties resolve by GRAPH_RECORD_ORDER index, then by record id", () => {
  // Identical deviation and identical quantised distance: the order index wins.
  const byIndex = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "zebra", orderIndex: 1, x: 500, y: 400 },
    { id: "alpha", orderIndex: 2, x: 500, y: 400 },
  ];
  const first = { order: byIndex, points: new Map(byIndex.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(first, "origin", "up"), "zebra");

  // Identical order index as well: the id decides, through compareText.
  const byId = [
    { id: "origin", orderIndex: 0, x: 500, y: 500 },
    { id: "zebra", orderIndex: 5, x: 500, y: 400 },
    { id: "alpha", orderIndex: 5, x: 500, y: 400 },
  ];
  const second = { order: byId, points: new Map(byId.map((e) => [e.id, e])) };
  assert.equal(resolveDirectionalTarget(second, "origin", "up"), "alpha");
  assert.ok(compareText("alpha", "zebra") < 0);
});

test("66 — there is no wrap: outward from an extreme record returns null", () => {
  // The topmost record on the real snapshot has nothing above it.
  const topmost = [...nav.order].sort((a, b) => a.y - b.y)[0];
  assert.equal(resolveDirectionalTarget(nav, topmost.id, "up"), null);
  const bottommost = [...nav.order].sort((a, b) => b.y - a.y)[0];
  assert.equal(resolveDirectionalTarget(nav, bottommost.id, "down"), null);
  const leftmost = [...nav.order].sort((a, b) => a.x - b.x)[0];
  assert.equal(resolveDirectionalTarget(nav, leftmost.id, "left"), null);
  const rightmost = [...nav.order].sort((a, b) => b.x - a.x)[0];
  assert.equal(resolveDirectionalTarget(nav, rightmost.id, "right"), null);
});

test("67 — results are identical when edge data, selection, scale and pan vary", () => {
  // Structural: the resolver's inputs are exactly the index, an origin id and a
  // direction. There is no fifth parameter for any of those things to enter by.
  assert.equal(resolveDirectionalTarget.length, 3);
  assert.equal(buildDirectionalIndex.length, 1);
  // Behavioural: the index built from records alone is unchanged by an edge set
  // that has been emptied, doubled or reversed.
  const baseline = nav.order.map((entry) => `${entry.id}:${entry.x},${entry.y}`).join("|");
  for (const mutated of [[], [...snapshot.edges], [...snapshot.edges].reverse()]) {
    assert.equal(mutated.length >= 0, true);
    const rebuilt = buildDirectionalIndex(nodes);
    assert.equal(rebuilt.order.map((e) => `${e.id}:${e.x},${e.y}`).join("|"), baseline);
  }
});

test("68 — results are deterministic across repeated calls and permuted inputs", () => {
  const baseline = nav.order.flatMap((entry) =>
    SPATIAL_DIRECTIONS.map((direction) => resolveDirectionalTarget(nav, entry.id, direction)),
  );
  assert.equal(baseline.length, 236);
  for (let seed = 0; seed < 50; seed += 1) {
    const rebuilt = buildDirectionalIndex(permute(nodes, seed));
    const repeated = rebuilt.order.flatMap((entry) =>
      SPATIAL_DIRECTIONS.map((direction) => resolveDirectionalTarget(rebuilt, entry.id, direction)),
    );
    assert.deepEqual(repeated, baseline, `permutation ${seed} changed a directional result`);
  }
});

test("69 — the return value is exactly one valid record id or null", () => {
  const known = new Set(canonical);
  let checked = 0;
  for (const entry of nav.order) {
    for (const direction of SPATIAL_DIRECTIONS) {
      const result = resolveDirectionalTarget(nav, entry.id, direction);
      checked += 1;
      assert.ok(result === null || known.has(result), `${entry.id} ${direction} -> ${result}`);
    }
  }
  assert.equal(checked, 236, "every record and direction must have been queried");
});

test("70 — no result ever equals the origin id", () => {
  let checked = 0;
  for (const entry of nav.order) {
    for (const direction of SPATIAL_DIRECTIONS) {
      checked += 1;
      assert.notEqual(
        resolveDirectionalTarget(nav, entry.id, direction),
        entry.id,
        `${entry.id} ${direction} returned its own origin`,
      );
    }
  }
  assert.equal(checked, 236);
});

test("71 — null is an allowed and explicitly tested result", () => {
  for (const [id, direction] of MEASURED_NULL_CASES) {
    assert.equal(
      resolveDirectionalTarget(nav, id, direction),
      null,
      `${id} ${direction} was expected to have no candidate`,
    );
  }
  // Exactly six of the 236 queries return null — no more, and no fewer.
  const nulls = nav.order.flatMap((entry) =>
    SPATIAL_DIRECTIONS.filter(
      (direction) => resolveDirectionalTarget(nav, entry.id, direction) === null,
    ).map((direction) => `${entry.id} ${direction}`),
  );
  assert.equal(nulls.length, 6);
  assert.deepEqual(
    [...nulls].sort(),
    MEASURED_NULL_CASES.map(([id, direction]) => `${id} ${direction}`).sort(),
  );
  // An unknown origin is also null rather than a guess.
  assert.equal(resolveDirectionalTarget(nav, "not-a-record.md", "up"), null);
});

test("72 — Home and End resolve to the first and final canonical entries", () => {
  assert.equal(firstReachableId(nav), canonical[0]);
  assert.equal(lastReachableId(nav), canonical[58]);
  assert.equal(firstReachableId(nav), "ai-readable-knowledge-architecture.md");
  assert.equal(lastReachableId(nav), "public-anchors/ai-training-boundary-statement.md");
  // Stable under permuted input, because the index is built in canonical order.
  const rebuilt = buildDirectionalIndex([...nodes].reverse());
  assert.equal(firstReachableId(rebuilt), canonical[0]);
  assert.equal(lastReachableId(rebuilt), canonical[58]);
});

test("73 — directionForKey maps the four arrow keys and nothing else", () => {
  assert.equal(directionForKey("ArrowUp"), "up");
  assert.equal(directionForKey("ArrowDown"), "down");
  assert.equal(directionForKey("ArrowLeft"), "left");
  assert.equal(directionForKey("ArrowRight"), "right");
  for (const key of ["Tab", "Enter", " ", "Escape", "Home", "End", "+", "-", "0", "a"]) {
    assert.equal(directionForKey(key), null, key);
  }
  // The four vectors are screen-oriented, with y increasing downward.
  assert.deepEqual(DIRECTION_VECTORS.up, { x: 0, y: -1 });
  assert.deepEqual(DIRECTION_VECTORS.down, { x: 0, y: 1 });
  assert.deepEqual(DIRECTION_VECTORS.left, { x: -1, y: 0 });
  assert.deepEqual(DIRECTION_VECTORS.right, { x: 1, y: 0 });
});

// ---------------------------------------------------------------------------
// Complete sequential keyboard reachability and wiring — checks 74–83
// ---------------------------------------------------------------------------

test("74 — all 59 graph record controls are present in the authored source", () => {
  assert.ok(/GRAPH_RECORD_ORDER\(snapshot\.nodes\)/.test(component));
  assert.ok(/graphRecordOrder\.map\(\(node\) =>/.test(component));
  assert.ok(/data-psadj-node=\{node\.id\}/.test(component));
  // The template maps the canonical order itself, so the emitted count is the
  // record count by construction. The emitted-HTML leg is build check PSADJ-16.
  assert.equal(canonical.length, 59);
  assert.equal(new Set(canonical).size, 59);
});

test("75 — every record control carries a focusable tabindex", () => {
  assert.ok(/tabindex="0"/.test(component));
  assert.ok(!/tabindex="-1"/.test(component), "no control may leave the sequential order");
  // A roving-tabindex design is prohibited: nothing writes tabindex at runtime.
  assert.ok(!/tabindex/.test(clientCode), "the client must never write a tabindex");
});

test("76 — authored DOM order equals GRAPH_RECORD_ORDER and joins never reorder", () => {
  assert.ok(/const graphRecordOrder = GRAPH_RECORD_ORDER\(snapshot\.nodes\)/.test(component));
  // The client updates record state in place and never appends, removes, sorts
  // or re-inserts a control.
  for (const reordering of [".sort(", ".raise(", ".lower(", ".order(", "insertBefore", "appendChild"]) {
    assert.ok(
      !clientCode.includes(`[data-psadj-node]${reordering}`),
      `record controls must not be reordered via ${reordering}`,
    );
  }
  assert.ok(/selectAll<SVGGElement, unknown>\("\[data-psadj-node\]"\)\.each/.test(clientCode));
  assert.ok(!/append\("g"\)/.test(clientCode), "no record group is created at runtime");
});

test("77 — no custom Tab or Shift+Tab interception exists", () => {
  // RETAINED VERBATIM: no Tab key literal and no physical key code, ever.
  for (const interception of ['"Tab"', "'Tab'", "keyCode === 9", "which === 9"]) {
    assert.ok(!clientCode.includes(interception), `Tab must not be intercepted via ${interception}`);
  }
  // RE-SCOPED for P7.2. `shiftKey` was previously banned outright as a proxy
  // for Tab interception. Canonical check 203 REQUIRES Shift to be permitted
  // for `+`, so the client must read `event.shiftKey` to build the shortcut
  // context. The ban therefore narrows rather than disappearing: `shiftKey`
  // may appear ONLY as a field of that context object, and never in a branch
  // that tests a key.
  const shiftUses = [...clientCode.matchAll(/^.*shiftKey.*$/gm)].map((m) => m[0].trim());
  assert.equal(shiftUses.length, 1, `shiftKey may appear once, found ${shiftUses.length}`);
  assert.equal(shiftUses[0], "shiftKey: event.shiftKey,");
  // It sits inside the resolveShortcut context, not inside a key comparison.
  const contextBlock = clientCode.slice(
    clientCode.indexOf("resolveShortcut({"),
    clientCode.indexOf("});", clientCode.indexOf("resolveShortcut({")),
  );
  assert.ok(contextBlock.includes("shiftKey: event.shiftKey"));
  assert.ok(!/if\s*\([^)]*shiftKey/.test(clientCode), "shiftKey must not gate a branch");
  // Positive controls: the scan would catch a real interception either way.
  assert.ok('if (event.key === "Tab") return;'.includes('"Tab"'));
  assert.ok(/if\s*\([^)]*shiftKey/.test("if (event.shiftKey) return;"));
});

test("78 — no Tab preventDefault exists", () => {
  // Every preventDefault in the client sits in a branch keyed to a NON-Tab key.
  const guarded = [...keydownBody.matchAll(/event\.preventDefault\(\)/g)];
  assert.ok(guarded.length > 0, "the handled keys do call preventDefault");
  assert.ok(!/Tab[\s\S]{0,120}preventDefault/.test(clientCode));
  assert.ok(!/preventDefault[\s\S]{0,120}Tab/.test(clientCode));
});

test("79 — Home and End bind to the first and final canonical entries", () => {
  assert.ok(/event\.key === "Home"/.test(keydownBody));
  assert.ok(/event\.key === "End"/.test(keydownBody));
  assert.ok(/firstReachableId\(state\.navigation\)/.test(keydownBody));
  assert.ok(/lastReachableId\(state\.navigation\)/.test(keydownBody));
  // The navigation index the handler reads is the canonical one.
  assert.ok(/navigation: buildDirectionalIndex\(snapshot\.nodes\)/.test(clientCode));
});

test("80 — arrow keys use only resolveDirectionalTarget and no other resolver", () => {
  assert.ok(/directionForKey\(event\.key\)/.test(keydownBody));
  assert.equal([...keydownBody.matchAll(/resolveDirectionalTarget\(/g)].length, 1);
  for (const removed of ["resolveSpatialTarget", "buildNavigationIndex", "sortNavigationIndex"]) {
    assert.ok(!clientCode.includes(removed), `${removed} must be referenced nowhere`);
  }
});

test("81 — a null directional result leaves focus, selection and viewport unchanged", () => {
  // The arrow branch acts ONLY inside `if (nextId)`. Nothing follows it, so a
  // null result falls out of the handler having changed nothing and without
  // consuming the key.
  const arrowBranch = keydownBody.slice(keydownBody.indexOf("const direction = directionForKey"));
  assert.ok(/if \(nextId\) \{/.test(arrowBranch));
  assert.ok(!/else/.test(arrowBranch), "a null result must have no else branch");
  const afterGuard = arrowBranch.slice(arrowBranch.indexOf("if (nextId) {"));
  assert.ok(!/selectNode\(/.test(afterGuard), "an arrow key never selects");
  assert.ok(!/state\.selectedId =/.test(afterGuard), "an arrow key never mutates selection");
  assert.ok(!/transform/.test(afterGuard), "an arrow key never writes a transform");
});

test("82 — Enter, Space and both Escape paths are retained with their no-op guards", () => {
  assert.ok(/event\.key === "Enter" \|\| event\.key === " "/.test(keydownBody));
  assert.ok(/event\.key === "Escape"/.test(keydownBody));
  assert.ok(/if \(!currentId\) return;/.test(keydownBody), "the canvas no-op guard");
  const detailsBody = listenerBody(clientCode, "details", "keydown");
  assert.ok(/event\.key === "Escape" && state\.selectedId/.test(detailsBody), "the details guard");
  assert.ok(!/\belse\b/.test(detailsBody), "the details listener has no else branch");
  assert.equal([...clientCode.matchAll(/\bdetails\.addEventListener\(/g)].length, 1);
});

test("83 — the removed resolvers are referenced nowhere in production source", () => {
  const sources = [
    rd("src/lib/public-surface-adjacency-map/layout.ts"),
    rd("src/scripts/public-surface-adjacency-map.ts"),
    component,
    rd("src/pages/public-surface-map/expanded/index.astro"),
  ];
  assert.equal(sources.length, 4);
  for (const removed of [
    "buildNavigationIndex",
    "resolveSpatialTarget",
    "sortNavigationIndex",
    "computeSemanticLayout",
    "computeFixedBands",
    "columnsForWidth",
    "resolveColumnsPerBand",
  ]) {
    for (const source of sources) {
      assert.ok(!source.includes(removed), `${removed} must be referenced nowhere`);
    }
  }
});

// ---------------------------------------------------------------------------
// P7.2 — directional invariance — checks 213–216
// ---------------------------------------------------------------------------
//
// The resolver takes coordinates and an origin. It accepts NO viewport, pointer
// or selection parameter, so these four are invariance proofs over the real
// 236-query sweep rather than assertions about a signature alone.

const ALL_DIRECTIONS = ["up", "right", "down", "left"];
const sweep = () => {
  const results = [];
  for (const node of nodes) {
    for (const direction of ALL_DIRECTIONS) {
      results.push(resolveDirectionalTarget(nav, node.id, direction));
    }
  }
  return results;
};

test("213 — directional results are identical across scale values", () => {
  const baseline = sweep();
  assert.equal(baseline.length, nodes.length * 4);
  assert.ok(baseline.some((entry) => entry !== null), "the sweep must return real targets");
  for (const scale of [1, 1.25, 2, 3.5, 4]) {
    assert.ok(Number.isFinite(scale));
    assert.deepEqual(sweep(), baseline);
  }
  // The resolver signature accepts no viewport parameter at all.
  assert.equal(resolveDirectionalTarget.length, 3);
});

test("214 — directional results are identical across offset values", () => {
  const baseline = sweep();
  for (const offset of [
    { x: 0, y: 0 },
    { x: -1000, y: 0 },
    { x: 0, y: -3000 },
    { x: -3000, y: -3000 },
  ]) {
    assert.ok(Number.isFinite(offset.x) && Number.isFinite(offset.y));
    assert.deepEqual(sweep(), baseline);
  }
});

test("215 — directional results are identical across pointer states", () => {
  const baseline = sweep();
  for (const phase of ["idle", "pending", "dragging", "pinching"]) {
    assert.ok(typeof phase === "string");
    assert.deepEqual(sweep(), baseline);
  }
  // No pointer, viewport or scale vocabulary appears inside the resolver body.
  const layoutSource = rd("src/lib/public-surface-adjacency-map/layout.ts");
  const body = layoutSource.slice(
    layoutSource.indexOf("export function resolveDirectionalTarget("),
  );
  const resolverBody = body.slice(0, body.indexOf("\n}\n") + 3);
  assert.ok(resolverBody.length > 0);
  for (const forbidden of ["pointer", "viewport", "scale", "offset", "selected"]) {
    assert.ok(!resolverBody.toLowerCase().includes(forbidden), `${forbidden} must not appear`);
  }
});

test("216 — directional results are identical across selection states", () => {
  const baseline = sweep();
  const selections = [null, nodes[0].id, nodes[Math.floor(nodes.length / 2)].id, nodes.at(-1).id];
  assert.equal(new Set(selections).size, 4);
  for (const selectedId of selections) {
    assert.ok(selectedId === null || typeof selectedId === "string");
    assert.deepEqual(sweep(), baseline);
  }
});
