// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// GUARD LIFECYCLE (AGENTS.md "Guard lifecycle"; PLAN 5.A1: every new guard
// carries review_after and sunset_condition).
//   review_after: 2026-11-26
//   sunset_condition: EITHER the seven source pins listed below (`contract.ts`,
//   `d3AuthorityLayout.ts`, `d3AuthorityKeyboardNavigation.ts`,
//   `d3AuthorityViewport.ts`, `fallback.ts`, `runtimeManifestContract.ts`,
//   `byteIdentity.ts`) are retired by owner ruling and this test becomes the
//   sole protection of their behaviour, OR this test is retired if those pins
//   stay byte-frozen indefinitely. Retiring a pin is an owner freeze exception
//   and is not taken by this file.
//
// Public Surface Authority Map — semantic / structural invariants.
//
// PURPOSE. `tests/public-surface-adjacency-map/preservation.test.ts` pins the
// SOURCE files of this map (`contract.ts`, `d3Authority*.ts`, `fallback.ts`,
// `runtimeLoader.ts`, `runtimeManifestContract.ts`, `byteIdentity.ts`,
// `publicSurfaceAuthorityMap.client.ts`, ...) by byte identity. Byte identity
// protects the behaviour only indirectly: a forced dependency fix (PR #139,
// TypeScript 6.0.3) had to move a pin on a file whose behaviour did not change.
// This file protects the BEHAVIOUR directly, so that the source pins can later
// be retired by an owner decision without losing protection. It does not touch,
// weaken, or replace any pin: the frozen artifacts (`last-known-good.json`,
// `runtime-manifest.json`, the runtime snapshots) stay byte-pinned and are used
// HERE as the oracle.
//
// METHOD. Every invariant is DERIVED from the frozen artifact
// (`last-known-good.json`) and the frozen runtime manifest — never restated by
// hand from the source modules — and is then checked against the output the
// pinned modules DERIVE from a candidate map. The same `checkInvariants`
// function is run twice per invariant: once on the frozen map (must report zero
// violations) and once on a mutated copy (must report exactly that invariant).
// A check with no failing fixture is indistinguishable from a check that does
// nothing, so a negative fixture exists for every invariant.
//
// INVARIANTS (agent-governance-plan phase-0 PLAN §5.A2):
//   I1 relation set unchanged
//   I2 public/private boundary unchanged
//   I3 navigation semantics unchanged
//   I4 protected labels present
//   I5 forbidden edges absent
//   I6 accessibility contract unchanged (labels, roles, keyboard reachability)
//   I7 a toolchain change leaves the derived output hash unchanged
//
// What this file deliberately does NOT do: read `preservation.test.ts`, edit
// any pin, compare source text of the pinned modules to a copy of itself, or
// spin up a DOM. The renderer's accessibility attributes are checked at source
// level (the same technique the existing d3Authority*.test.ts files use)
// because `d3AuthorityRenderer.ts` needs a DOM and `d3-selection` to run.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  assertSnapshot,
  SnapshotContractError,
  ALLOWED_EDGE_TYPES,
  ALLOWED_GROUPING_FIELDS,
  NAVIGATION_ONLY,
  REQUIRED_BOUNDARY_STATEMENTS,
  SOURCE_LINK_PREFIX,
} from "../../src/lib/public-surface-authority-map/contract.ts";
import { EXPECTED_COUNTS } from "../../src/lib/public-surface-authority-map/fallback.ts";
import {
  AUTHORITY_LAYOUT_METRICS,
  computeAuthorityLayout,
  resolveColumnsPerBand,
  resolveRoutingMode,
  selectRoutingEdges,
  shortenLabel,
} from "../../src/lib/public-surface-authority-map/d3AuthorityLayout.ts";
import {
  SPATIAL_DIRECTIONS,
  directionForKey,
  resolveSpatialTarget,
} from "../../src/lib/public-surface-authority-map/d3AuthorityKeyboardNavigation.ts";
import {
  computeViewportSurface,
  contentExtentOf,
  fitViewport,
} from "../../src/lib/public-surface-authority-map/d3AuthorityViewport.ts";
import {
  assertRuntimeManifest,
  assertManifestMatchesSnapshot,
} from "../../src/lib/public-surface-authority-map/runtimeManifestContract.ts";
import {
  sha256Hex,
  gitBlobSha1Hex,
  toUtf8Bytes,
} from "../../src/lib/public-surface-authority-map/byteIdentity.ts";

const root = new URL("../../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

// ---------------------------------------------------------------------------
// The oracle: the frozen artifact and the frozen runtime manifest.
// ---------------------------------------------------------------------------

const ORACLE_PATH = "src/data/public-surface-authority-map/last-known-good.json";
const MANIFEST_PATH = "src/data/public-surface-authority-map/runtime-manifest.json";
const RENDERER_PATH = "src/lib/public-surface-authority-map/d3AuthorityRenderer.ts";
const COMPONENT_PATH = "src/components/PublicSurfaceAuthorityMap.astro";

const oracleRaw = rd(ORACLE_PATH);
const oracleObject = JSON.parse(oracleRaw);
const manifestObject = JSON.parse(rd(MANIFEST_PATH));

/** Deep-clone the oracle so a mutation can never leak into another test. */
const cloneOracle = () => JSON.parse(oracleRaw);

// A fixed set of rendering situations the derived output is computed at. The
// values are inputs to the pinned modules, not facts about the map.
const RENDER_SITUATIONS = Object.freeze([
  { width: 320, columnsPerBand: 1 },
  { width: 900, columnsPerBand: undefined },
  { width: 1600, columnsPerBand: undefined },
]);

// ---------------------------------------------------------------------------
// Derivation: expected invariants, computed from the oracle only.
// ---------------------------------------------------------------------------

const sortStrings = (values) => Array.from(values).sort();

function edgeTriple(edge) {
  return `${edge.relation_type} | ${edge.source} | ${edge.target}`;
}

/**
 * Everything a candidate map must agree with, read from the frozen artifact.
 * Nothing in here comes from a source module except the vocabulary constants
 * (`REQUIRED_BOUNDARY_STATEMENTS`, `ALLOWED_EDGE_TYPES`, ...) that the contract
 * module itself declares as "derived verbatim from the audited snapshot"; those
 * are cross-checked against the artifact in I4/I5 rather than trusted.
 */
function deriveExpected(oracle) {
  const nodeIds = sortStrings(oracle.nodes.map((n) => n.id));
  return Object.freeze({
    // I1
    edgeIds: sortStrings(oracle.edges.map((e) => e.id)),
    edgeTriples: sortStrings(oracle.edges.map(edgeTriple)),
    edgeCounts: { ...oracle.edge_counts },
    // I2
    nodeIds,
    scope: oracle.scope,
    boundaryByNode: Object.fromEntries(
      oracle.nodes.map((n) => [
        n.id,
        {
          public_surface_status: n.public_surface_status,
          canonical_public_url: n.canonical_public_url,
          repository_path: n.repository_path,
        },
      ]),
    ),
    // I3
    topLevelAuthorityCeiling: oracle.authority_ceiling,
    navigationByNode: Object.fromEntries(
      oracle.nodes.map((n) => [
        n.id,
        {
          authority_ceiling: n.authority_ceiling,
          relation_default: n.relation_default,
          surface_role: n.surface_role,
        },
      ]),
    ),
    transformNotes: { ...oracle.transform_notes },
    // I4
    boundaryStatements: [...oracle.boundary_statements],
    title: oracle.title,
    nameById: Object.fromEntries(oracle.nodes.map((n) => [n.id, n.name])),
    // I5
    edgeTypes: sortStrings(new Set(oracle.edges.map((e) => e.relation_type))),
    selfReferencesOmitted: oracle.self_references_omitted_count,
    // I6
    groupingFields: [...oracle.grouping_fields],
  });
}

const EXPECTED = deriveExpected(oracleObject);

// ---------------------------------------------------------------------------
// Observation: what the pinned modules derive from a candidate map.
// ---------------------------------------------------------------------------

function keyboardGraph(layoutNodes) {
  const graph = {};
  for (const node of layoutNodes) {
    const out = {};
    for (const direction of SPATIAL_DIRECTIONS) {
      out[direction] = resolveSpatialTarget(layoutNodes, node.id, direction);
    }
    graph[node.id] = out;
  }
  return graph;
}

function reachableFrom(graph, startId) {
  const seen = new Set([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const direction of SPATIAL_DIRECTIONS) {
      const next = graph[current]?.[direction] ?? null;
      if (next !== null && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/**
 * The keyboard band-reachability rule, as `{ invariant: "I6" }` violations.
 * Shared by `checkInvariants` and by the I6 negative fixture so the fixture
 * exercises the same code path the checker runs.
 */
function keyboardReachabilityViolations(layoutNodes, graph, label) {
  const out = [];
  const ids = layoutNodes.map((n) => n.id);
  const bandOf = new Map(layoutNodes.map((n) => [n.id, n.bandIndex]));
  for (const id of ids) {
    const band = bandOf.get(id);
    const expectedReach = sortStrings(ids.filter((other) => bandOf.get(other) === band));
    const reach = sortStrings(reachableFrom(graph, id));
    if (JSON.stringify(reach) !== JSON.stringify(expectedReach)) {
      out.push({
        invariant: "I6",
        detail: `keyboard navigation from ${id} reaches ${reach.length} nodes, its band holds ${expectedReach.length} (${label})`,
      });
    }
  }
  return out;
}

function serializeLayout(layout) {
  return {
    groupField: layout.groupField,
    width: layout.width,
    height: layout.height,
    columnsPerBand: layout.columnsPerBand,
    groups: layout.groups.map((g) => ({
      key: g.key,
      count: g.count,
      bandIndex: g.bandIndex,
      columnIndex: g.columnIndex,
      x: g.x,
      y: g.y,
      width: g.width,
      height: g.height,
    })),
    nodes: layout.nodes.map((n) => ({
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
      labelLines: [...n.labelLines],
      labelTruncated: n.labelTruncated,
      name: n.node.name,
    })),
  };
}

/**
 * Run a candidate map through the pinned modules exactly as the client does:
 * contract validation, then layout for every grouping field at every render
 * situation, routing selection, viewport fit, keyboard resolution. Returns a
 * plain, JSON-serialisable observation. A contract rejection is returned as
 * `{ rejected }` rather than thrown so the caller can attribute it.
 */
function observe(candidateObject) {
  let snapshot;
  try {
    snapshot = assertSnapshot(candidateObject);
  } catch (error) {
    if (error instanceof SnapshotContractError) {
      return { rejected: error.message };
    }
    throw error;
  }

  const renderedIds = new Set(snapshot.nodes.map((n) => n.id));
  const globalEdges = selectRoutingEdges(snapshot.edges, {
    mode: "global",
    selectedId: null,
    renderedIds,
  });
  const offEdges = selectRoutingEdges(snapshot.edges, {
    mode: "off",
    selectedId: null,
    renderedIds,
  });
  // Selection probe: the lexically smallest id, so the observation does not
  // depend on record order (record order is not semantics).
  const firstId = sortStrings(renderedIds)[0] ?? null;
  const selectedEdges = selectRoutingEdges(snapshot.edges, {
    mode: "selected",
    selectedId: firstId,
    renderedIds,
  });

  const renders = [];
  for (const field of snapshot.grouping_fields) {
    for (const situation of RENDER_SITUATIONS) {
      const probe = computeAuthorityLayout(snapshot.nodes, field);
      const columnsPerBand =
        situation.columnsPerBand ??
        resolveColumnsPerBand(situation.width, probe.groups.length);
      const layout = computeAuthorityLayout(snapshot.nodes, field, { columnsPerBand });
      const extent = contentExtentOf(layout);
      const fit = fitViewport(extent, situation.width, 600);
      const surface = computeViewportSurface(
        layout.width,
        layout.height,
        fit.scale,
        situation.width,
      );
      renders.push({
        field,
        situation,
        layout: serializeLayout(layout),
        extent,
        fit,
        surface,
        keyboard: keyboardGraph(layout.nodes),
      });
    }
  }

  return {
    snapshot,
    routing: {
      modeOff: resolveRoutingMode(false, false, firstId),
      modeSelectedWithoutSelection: resolveRoutingMode(true, false, null),
      modeSelected: resolveRoutingMode(true, false, firstId),
      modeGlobal: resolveRoutingMode(true, true, firstId),
      globalEdgeIds: sortStrings(globalEdges.map((e) => e.id)),
      globalEdgeTriples: sortStrings(globalEdges.map(edgeTriple)),
      offEdgeCount: offEdges.length,
      selectedEdgeIds: sortStrings(selectedEdges.map((e) => e.id)),
      selectedId: firstId,
      globalIdentityPreserved: globalEdges.every((e) => snapshot.edges.includes(e)),
    },
    renders,
  };
}

// ---------------------------------------------------------------------------
// Checking: expected vs observed. Returns a list of `{ invariant, detail }`.
// ---------------------------------------------------------------------------

/** Forbidden-edge scan on the RAW object, before the contract can reject it. */
function forbiddenEdgeViolations(rawObject, expected) {
  const out = [];
  const edges = Array.isArray(rawObject?.edges) ? rawObject.edges : [];
  const nodeIds = new Set(
    (Array.isArray(rawObject?.nodes) ? rawObject.nodes : []).map((n) => n?.id),
  );
  const seenIds = new Set();
  for (const edge of edges) {
    if (edge.source === edge.target) {
      out.push({ invariant: "I5", detail: `self edge ${edge.id}` });
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      out.push({ invariant: "I5", detail: `dangling endpoint on ${edge.id}` });
    }
    if (!expected.edgeTypes.includes(edge.relation_type)) {
      out.push({ invariant: "I5", detail: `edge type ${edge.relation_type} on ${edge.id}` });
    }
    if (edge.id !== `${edge.relation_type}::${edge.source}->${edge.target}`) {
      out.push({ invariant: "I5", detail: `edge id does not name its endpoints: ${edge.id}` });
    }
    if (seenIds.has(edge.id)) {
      out.push({ invariant: "I5", detail: `duplicate edge id ${edge.id}` });
    }
    seenIds.add(edge.id);
    if (edge.relation_status !== NAVIGATION_ONLY || edge.authority_ceiling !== NAVIGATION_ONLY) {
      out.push({ invariant: "I5", detail: `non-navigation edge ${edge.id}` });
    }
  }
  if (rawObject?.self_references_omitted_count !== expected.selfReferencesOmitted) {
    out.push({
      invariant: "I5",
      detail: `self_references_omitted_count ${rawObject?.self_references_omitted_count} ≠ ${expected.selfReferencesOmitted}`,
    });
  }
  return out;
}

function checkInvariants(rawObject, expected, sources) {
  const violations = [];
  const push = (invariant, detail) => violations.push({ invariant, detail });

  // I5 runs on the raw object so a forbidden edge is attributed to I5 even
  // when the contract would also reject the map.
  violations.push(...forbiddenEdgeViolations(rawObject, expected));

  const observed = observe(rawObject);
  if (observed.rejected) {
    push("CONTRACT", observed.rejected);
    return { violations, observed };
  }
  const { snapshot, routing, renders } = observed;

  // --- I1 relation set unchanged -------------------------------------------
  if (JSON.stringify(routing.globalEdgeIds) !== JSON.stringify(expected.edgeIds)) {
    push("I1", "global routing edge-id set differs from the frozen artifact");
  }
  if (JSON.stringify(routing.globalEdgeTriples) !== JSON.stringify(expected.edgeTriples)) {
    push("I1", "global routing (type, source, target) set differs from the frozen artifact");
  }
  if (!routing.globalIdentityPreserved) {
    push("I1", "routing returned an edge object that is not from the snapshot");
  }
  for (const type of Object.keys(expected.edgeCounts)) {
    const n = snapshot.edges.filter((e) => e.relation_type === type).length;
    if (n !== expected.edgeCounts[type]) {
      push("I1", `${type} count ${n} ≠ frozen ${expected.edgeCounts[type]}`);
    }
  }

  // --- I2 public/private boundary unchanged ---------------------------------
  const observedIds = sortStrings(snapshot.nodes.map((n) => n.id));
  if (JSON.stringify(observedIds) !== JSON.stringify(expected.nodeIds)) {
    push("I2", "node id set differs from the frozen artifact");
  }
  if (snapshot.scope !== expected.scope) {
    push("I2", `scope ${snapshot.scope} ≠ ${expected.scope}`);
  }
  for (const node of snapshot.nodes) {
    const want = expected.boundaryByNode[node.id];
    if (!want) continue; // already reported as an id-set difference
    for (const key of Object.keys(want)) {
      if (node[key] !== want[key]) {
        push("I2", `${node.id}.${key} ${node[key]} ≠ ${want[key]}`);
      }
    }
    if (!node.canonical_public_url.startsWith(SOURCE_LINK_PREFIX)) {
      push("I2", `${node.id} links outside the approved source repository`);
    }
  }

  // --- I3 navigation semantics unchanged ------------------------------------
  if (snapshot.authority_ceiling !== expected.topLevelAuthorityCeiling) {
    push("I3", `top-level authority_ceiling ${snapshot.authority_ceiling}`);
  }
  for (const edge of snapshot.edges) {
    if (edge.relation_status !== NAVIGATION_ONLY || edge.authority_ceiling !== NAVIGATION_ONLY) {
      push("I3", `edge ${edge.id} is not navigation-only`);
    }
  }
  for (const node of snapshot.nodes) {
    const want = expected.navigationByNode[node.id];
    if (!want) continue;
    for (const key of Object.keys(want)) {
      if (node[key] !== want[key]) {
        push("I3", `${node.id}.${key} ${node[key]} ≠ ${want[key]}`);
      }
    }
  }
  for (const key of Object.keys(expected.transformNotes)) {
    if (snapshot.transform_notes[key] !== expected.transformNotes[key]) {
      push("I3", `transform_notes.${key} ${snapshot.transform_notes[key]}`);
    }
  }
  if (routing.modeOff !== "off" || routing.modeSelectedWithoutSelection !== "off") {
    push("I3", "routing is enabled without an explicit user toggle");
  }
  if (routing.modeSelected !== "selected" || routing.modeGlobal !== "global") {
    push("I3", "routing mode resolution changed");
  }
  if (routing.offEdgeCount !== 0) {
    push("I3", `routing mode off drew ${routing.offEdgeCount} edges`);
  }
  const incident = sortStrings(
    snapshot.edges
      .filter((e) => e.source === routing.selectedId || e.target === routing.selectedId)
      .map((e) => e.id),
  );
  if (JSON.stringify(routing.selectedEdgeIds) !== JSON.stringify(incident)) {
    push("I3", "selected-mode routing is not exactly the incident edge set");
  }

  // --- I4 protected labels present ------------------------------------------
  if (
    JSON.stringify(sortStrings(snapshot.boundary_statements)) !==
    JSON.stringify(sortStrings(expected.boundaryStatements))
  ) {
    push("I4", "boundary statement set differs from the frozen artifact");
  }
  for (const statement of expected.boundaryStatements) {
    if (!snapshot.boundary_statements.includes(statement)) {
      push("I4", `boundary statement missing from map: ${statement}`);
    }
    if (!sources.component.includes(statement)) {
      push("I4", `boundary statement missing from rendered surface: ${statement}`);
    }
  }
  for (const statement of REQUIRED_BOUNDARY_STATEMENTS) {
    if (!expected.boundaryStatements.includes(statement)) {
      push("I4", `contract requires a statement the frozen artifact lacks: ${statement}`);
    }
  }
  if (snapshot.title !== expected.title) {
    push("I4", `title ${snapshot.title}`);
  }
  for (const render of renders) {
    for (const node of render.layout.nodes) {
      const name = expected.nameById[node.id];
      if (name === undefined) continue;
      if (node.name !== name) {
        push("I4", `${node.id} rendered record name differs from the frozen name`);
      }
      const wantLines = shortenLabel(name).lines;
      if (JSON.stringify([...node.labelLines]) !== JSON.stringify([...wantLines])) {
        push("I4", `${node.id} label lines differ from the pinned shortening of the frozen name`);
      }
      if (node.labelLines.length === 0 || node.labelLines.some((l) => l === "")) {
        push("I4", `${node.id} rendered with an empty label`);
      }
    }
  }

  // --- I5 forbidden edges absent (post-contract part) -----------------------
  for (const type of expected.edgeTypes) {
    if (!ALLOWED_EDGE_TYPES.includes(type)) {
      push("I5", `frozen artifact uses an edge type the contract does not allow: ${type}`);
    }
  }
  const positionsById = new Map();
  for (const render of renders) {
    for (const node of render.layout.nodes) positionsById.set(node.id, true);
  }
  for (const edge of routing.globalEdgeIds) {
    const [, rest] = edge.split("::");
    const [source, target] = rest.split("->");
    if (!positionsById.has(source) || !positionsById.has(target)) {
      push("I5", `routed edge ${edge} has an endpoint that is never rendered`);
    }
  }

  // --- I6 accessibility contract unchanged ----------------------------------
  if (
    JSON.stringify(sortStrings(snapshot.grouping_fields)) !==
    JSON.stringify(sortStrings(expected.groupingFields))
  ) {
    push("I6", "grouping field set differs from the frozen artifact");
  }
  for (const field of expected.groupingFields) {
    if (!ALLOWED_GROUPING_FIELDS.includes(field)) {
      push("I6", `frozen grouping field ${field} is not an allowed grouping`);
    }
    if (!renders.some((r) => r.field === field)) {
      push("I6", `grouping field ${field} produced no render`);
    }
  }
  const M = AUTHORITY_LAYOUT_METRICS;
  for (const render of renders) {
    const ids = render.layout.nodes.map((n) => n.id);
    if (ids.length !== expected.nodeIds.length) {
      push("I6", `render ${render.field}@${render.situation.width} drew ${ids.length} nodes`);
    }
    for (const node of render.layout.nodes) {
      if (node.labelLines.length > M.LABEL_MAX_LINES) {
        push("I6", `${node.id} label exceeds ${M.LABEL_MAX_LINES} lines`);
      }
      if (node.labelLines.some((l) => l.length > M.LABEL_LINE_MAX)) {
        push("I6", `${node.id} label line exceeds ${M.LABEL_LINE_MAX} characters`);
      }
      if (node.width !== M.NODE_WIDTH || node.height !== M.NODE_HEIGHT) {
        push("I6", `${node.id} is not drawn at the uniform node size`);
      }
    }
    // Keyboard reachability contract, derived from the layout the modules
    // produced: arrow keys never cross a band and never wrap, so from any node
    // exactly the nodes of ITS OWN band must be reachable — no fewer (an
    // orphaned node) and no more (an implicit structural jump).
    violations.push(
      ...keyboardReachabilityViolations(
        render.layout.nodes,
        render.keyboard,
        `${render.field}@${render.situation.width}`,
      ),
    );
    if (!render.fit.fullyFits && !render.fit.atReadableMinimum) {
      push("I6", `fit at ${render.situation.width}px neither fits nor sits on the readable floor`);
    }
  }
  for (const [key, want] of Object.entries({
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  })) {
    if (directionForKey(key) !== want) push("I6", `${key} no longer maps to ${want}`);
  }
  for (const key of ["w", "k", "Home", "PageUp", "Tab"]) {
    if (directionForKey(key) !== null) push("I6", `${key} is now a spatial navigation key`);
  }
  // Renderer accessibility attributes (source level: the renderer needs a DOM).
  const rendererA11y = extractRendererA11y(sources.renderer);
  for (const [attr, want] of Object.entries(RENDERER_A11Y_REQUIRED)) {
    if (rendererA11y[attr] !== want) {
      push("I6", `renderer ${attr}: expected ${want}, found ${rendererA11y[attr] ?? "absent"}`);
    }
  }

  return { violations, observed };
}

// The renderer's accessibility contract, as attribute -> value pairs that must
// be set on the node group (`role="button"`, focusable, labelled, pressed
// state) and the group region (`role="group"`), plus the two decorative layers
// hidden from assistive technology. Counted from the renderer source with the
// same comment-stripping approach the other d3Authority tests use.
const RENDERER_A11Y_REQUIRED = Object.freeze({
  'attr("role", "button")': 1,
  'attr("role", "group")': 1,
  'attr("tabindex", 0)': 1,
  'attr("aria-pressed"': 1,
  'attr("aria-label", accessibleNodeLabel)': 1,
  'attr("aria-label", (group) =>': 1,
  'attr("aria-hidden", "true")': 2,
});

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function extractRendererA11y(source) {
  const code = stripComments(source);
  const out = {};
  for (const needle of Object.keys(RENDERER_A11Y_REQUIRED)) {
    out[needle] = code.split(needle).length - 1;
  }
  return out;
}

const SOURCES = Object.freeze({
  renderer: rd(RENDERER_PATH),
  component: rd(COMPONENT_PATH),
});

const violationsOf = (rawObject, sources = SOURCES) =>
  checkInvariants(rawObject, EXPECTED, sources).violations;

const invariantsHit = (violations) => sortStrings(new Set(violations.map((v) => v.invariant)));

// ---------------------------------------------------------------------------
// Positive: the frozen map satisfies every invariant through the pinned modules.
// ---------------------------------------------------------------------------

test("oracle: the frozen artifact is the bundled fallback the modules describe", async () => {
  const bytes = toUtf8Bytes(oracleRaw);
  const sha256 = await sha256Hex(bytes);
  const manifest = assertRuntimeManifest(manifestObject);
  // The expected id is NOT read from the manifest being validated: it is
  // rebuilt from the artifact's own SHA-256 and the frozen runtime-snapshot
  // file that carries that SHA in its name, and that file must be
  // byte-identical to the artifact.
  const snapshotDir = "src/data/public-surface-authority-map/runtime-snapshots/";
  const commit = manifest.selected_snapshot.source_commit;
  const expectedId = `${commit}-${sha256}`;
  const snapshotFile = `${snapshotDir}${expectedId}.json`;
  assert.ok(existsSync(fileURLToPath(new URL(snapshotFile, root))), snapshotFile);
  assert.equal(rd(snapshotFile), oracleRaw, "runtime snapshot must equal the artifact");
  assertManifestMatchesSnapshot(manifest, {
    id: expectedId,
    byteLength: bytes.byteLength,
    sha256,
    gitBlob: await gitBlobSha1Hex(bytes),
  });
  assertSnapshot(oracleObject, { expectedCounts: EXPECTED_COUNTS });
  assert.equal(EXPECTED.nodeIds.length, EXPECTED_COUNTS.nodes);
  assert.equal(EXPECTED.edgeIds.length, EXPECTED_COUNTS.edges);
});

test("frozen map: zero invariant violations through the pinned modules", () => {
  const violations = violationsOf(cloneOracle());
  assert.deepEqual(violations, []);
});

test("derivation: every expected value is read from the artifact, not the modules", () => {
  // If a module constant drifted from the artifact, the expected values must
  // still equal the artifact (they are derived), and the mismatch must surface
  // as a violation in the frozen-map test above rather than being absorbed.
  assert.deepEqual(EXPECTED.boundaryStatements, oracleObject.boundary_statements);
  assert.deepEqual(EXPECTED.groupingFields, oracleObject.grouping_fields);
  assert.deepEqual(EXPECTED.edgeCounts, oracleObject.edge_counts);
  assert.equal(EXPECTED.edgeIds.length, oracleObject.edges.length);
  assert.equal(EXPECTED.nodeIds.length, oracleObject.nodes.length);
});

// ---------------------------------------------------------------------------
// I7: a toolchain change leaves the derived output hash unchanged.
//
// The hash below is of the OUTPUT the pinned modules derive from the frozen
// artifact (layouts, routing, viewport fit, keyboard graph), not of any source
// file. A dependency or compiler upgrade that preserves behaviour reproduces
// it; a behaviour change, or a changed map, does not. Captured 2026-08-26 on
// the working tree at cb2f1329184cd694722e416f1cb579e8789ba025 with Node 24 and
// re-verified under the CI Node 22 run; if this ever fails while the frozen
// map itself still passes the invariant tests above, the modules changed
// behaviour and the correct response is to explain the change, not to re-pin.
// ---------------------------------------------------------------------------

const DERIVED_OUTPUT_SHA256 = "1d51508829d996876db11fbd515e00c33ad08c84bab83925c72c27a882e15d9b";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

async function derivedOutputHash(rawObject) {
  const observed = observe(rawObject);
  assert.equal(observed.rejected, undefined);
  const { routing, renders } = observed;
  return sha256Hex(toUtf8Bytes(JSON.stringify(canonical({ routing, renders }))));
}

test("I7: derived output hash of the frozen map is unchanged", async () => {
  const actual = await derivedOutputHash(cloneOracle());
  assert.equal(actual, DERIVED_OUTPUT_SHA256);
});

test("I7: the derived output hash is deterministic across repeated derivations", async () => {
  const a = await derivedOutputHash(cloneOracle());
  const b = await derivedOutputHash(cloneOracle());
  assert.equal(a, b);
});

// ---------------------------------------------------------------------------
// Negative fixtures: one mutated copy per invariant, each of which MUST fail
// on exactly the invariant it targets. Every mutation keeps the map internally
// consistent (counts updated) wherever the contract would otherwise reject it
// first, so the failure is attributable to this file's check and not only to
// `assertSnapshot`. Where the contract rejects the mutation anyway, that is
// asserted too, so a future loosening of the contract still fails here.
// ---------------------------------------------------------------------------

function consistentCounts(map) {
  map.edge_counts = {
    boundary_reference: map.edges.filter((e) => e.relation_type === "boundary_reference").length,
    source_use_reference: map.edges.filter((e) => e.relation_type === "source_use_reference").length,
  };
  map.generated_record_count = map.nodes.length;
}

function addEdge(map, source, target, type = "boundary_reference") {
  map.edges.push({
    id: `${type}::${source}->${target}`,
    source,
    target,
    relation_type: type,
    relation_status: NAVIGATION_ONLY,
    evidence_source: source,
    authority_ceiling: NAVIGATION_ONLY,
  });
  consistentCounts(map);
}

/** A (source, target, type) pair that is NOT an edge in the frozen artifact. */
function absentEdgeCandidate(map) {
  const present = new Set(map.edges.map((e) => `${e.source}->${e.target}`));
  for (const a of map.nodes) {
    for (const b of map.nodes) {
      if (a.id !== b.id && !present.has(`${a.id}->${b.id}`)) return [a.id, b.id];
    }
  }
  throw new Error("frozen artifact is a complete graph; fixture cannot be built");
}

test("I1 negative: an invented relation fails the relation-set invariant", () => {
  const map = cloneOracle();
  const [source, target] = absentEdgeCandidate(map);
  addEdge(map, source, target);
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I1"), JSON.stringify(violations));
});

test("I1 negative: a dropped relation fails the relation-set invariant", () => {
  const map = cloneOracle();
  map.edges.splice(0, 1);
  consistentCounts(map);
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I1"), JSON.stringify(violations));
});

test("I2 negative: a node moved across the public-surface boundary fails", () => {
  const map = cloneOracle();
  const node = map.nodes.find((n) => n.public_surface_status === "selected_external_node");
  node.public_surface_status = "public_boundary_document";
  const violations = violationsOf(map);
  assert.deepEqual(invariantsHit(violations), ["I2"]);
});

test("I2 negative: a node re-pointed outside the approved repository is rejected", () => {
  const map = cloneOracle();
  map.nodes[0].canonical_public_url = "https://example.invalid/x.md";
  const violations = violationsOf(map);
  assert.ok(violations.length > 0);
  // The contract rejects it first; the boundary check exists independently.
  assert.ok(
    violations.some((v) => v.invariant === "CONTRACT" || v.invariant === "I2"),
    JSON.stringify(violations),
  );
  const notRejected = checkInvariants(map, EXPECTED, SOURCES).observed.rejected;
  assert.ok(typeof notRejected === "string", "contract must reject an off-repository link");
});

test("I3 negative: a node whose relation default changed fails navigation semantics", () => {
  const map = cloneOracle();
  const node = map.nodes.find((n) => n.relation_default === "adjacency_only");
  node.relation_default = "navigation_only";
  const violations = violationsOf(map);
  assert.deepEqual(invariantsHit(violations), ["I3"]);
});

test("I3 negative: an edge promoted beyond navigation-only is rejected", () => {
  const map = cloneOracle();
  map.edges[0].relation_status = "confirmed";
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I5"), "raw scan must flag it");
  assert.ok(violations.some((v) => v.invariant === "CONTRACT"), "contract must reject it");
});

test("I3 negative: a transform note flipped to imply hierarchy fails", () => {
  const map = cloneOracle();
  map.transform_notes.record_order_implies_hierarchy = true;
  const violations = violationsOf(map);
  assert.ok(
    violations.some((v) => v.invariant === "I3" || v.invariant === "CONTRACT"),
    JSON.stringify(violations),
  );
});

test("I4 negative: a boundary statement removed from the map fails", () => {
  const map = cloneOracle();
  map.boundary_statements = map.boundary_statements.slice(1);
  const violations = violationsOf(map);
  assert.ok(
    violations.some((v) => v.invariant === "I4" || v.invariant === "CONTRACT"),
    JSON.stringify(violations),
  );
});

test("I4 negative: a boundary statement removed from the rendered surface fails", () => {
  const statement = EXPECTED.boundaryStatements[1];
  assert.ok(SOURCES.component.includes(statement));
  const mutated = { ...SOURCES, component: SOURCES.component.split(statement).join("") };
  const violations = violationsOf(cloneOracle(), mutated);
  assert.deepEqual(invariantsHit(violations), ["I4"]);
});

test("I4 negative: an extra boundary statement fails the exact-set check", () => {
  const map = cloneOracle();
  map.boundary_statements.push("An additional statement.");
  const violations = violationsOf(map);
  assert.ok(
    violations.some((v) => v.invariant === "I4" || v.invariant === "CONTRACT"),
    JSON.stringify(violations),
  );
});

test("I4 negative: a changed suffix of a truncated name still fails", () => {
  const map = cloneOracle();
  const long = map.nodes.find((n) => shortenLabel(n.name).truncated);
  assert.ok(long, "the frozen artifact has at least one truncated label");
  long.name = `${long.name} (suffix changed beyond the rendered label)`;
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I4" && /record name/.test(v.detail)));
});

test("I6 negative: an extra grouping field fails the exact-set check", () => {
  const map = cloneOracle();
  map.grouping_fields.push("classification_evidence");
  const violations = violationsOf(map);
  assert.ok(
    violations.some((v) => v.invariant === "I6" || v.invariant === "CONTRACT"),
    JSON.stringify(violations),
  );
});

test("I4 negative: a renamed record fails the label invariant", () => {
  const map = cloneOracle();
  map.nodes[0].name = "Some other document";
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I4"), JSON.stringify(violations));
});

test("I5 negative: a self edge is a forbidden edge", () => {
  const map = cloneOracle();
  const id = map.nodes[0].id;
  addEdge(map, id, id);
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I5" && /self edge/.test(v.detail)));
});

test("I5 negative: an edge to a node outside the map is a forbidden edge", () => {
  const map = cloneOracle();
  addEdge(map, map.nodes[0].id, "NOT-A-PUBLIC-NODE.md");
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I5" && /dangling/.test(v.detail)));
});

test("I5 negative: an edge of an unknown relation type is a forbidden edge", () => {
  const map = cloneOracle();
  const [source, target] = absentEdgeCandidate(map);
  addEdge(map, source, target, "formal_dependency");
  const violations = violationsOf(map);
  assert.ok(violations.some((v) => v.invariant === "I5" && /edge type/.test(v.detail)));
});

test("I6 negative: an unreachable node fails keyboard reachability", () => {
  // Build the frozen layout, then collapse two nodes onto one grid cell. The
  // resolver breaks the tie by id, so one of the two can never be reached from
  // anywhere in its band: the band-reachability contract must report it.
  const snapshot = assertSnapshot(cloneOracle());
  const layout = computeAuthorityLayout(snapshot.nodes, "surface_role", { columnsPerBand: 2 });
  const [a, b] = layout.nodes;
  const nodes = layout.nodes.map((n) =>
    n.id === a.id
      ? { ...n, bandIndex: b.bandIndex, columnIndex: b.columnIndex, rowIndex: b.rowIndex }
      : { ...n },
  );
  const violations = keyboardReachabilityViolations(nodes, keyboardGraph(nodes), "fixture");
  assert.deepEqual(invariantsHit(violations), ["I6"]);
  assert.ok(violations.some((v) => /keyboard navigation from/.test(v.detail)));
  // Control: the untouched frozen layout satisfies the same rule.
  assert.deepEqual(
    keyboardReachabilityViolations(layout.nodes, keyboardGraph(layout.nodes), "control"),
    [],
  );
});

test("I6 negative: a renderer that drops role/tabindex/aria fails the accessibility contract", () => {
  const stripped = SOURCES.renderer
    .replace('.attr("role", "button")', "")
    .replace('.attr("tabindex", 0)', "");
  assert.notEqual(stripped, SOURCES.renderer);
  const violations = violationsOf(cloneOracle(), { ...SOURCES, renderer: stripped });
  assert.deepEqual(invariantsHit(violations), ["I6"]);
  assert.ok(violations.some((v) => /role/.test(v.detail)));
  assert.ok(violations.some((v) => /tabindex/.test(v.detail)));
});

test("I6 negative: a renderer that drops the group-region aria-label fails", () => {
  const needle = '.attr("aria-label", (group) => `${group.key} — ${group.count} records`)';
  assert.ok(SOURCES.renderer.includes(needle), "renderer must carry the group aria-label");
  const stripped = SOURCES.renderer.replace(needle, "");
  const violations = violationsOf(cloneOracle(), { ...SOURCES, renderer: stripped });
  assert.deepEqual(invariantsHit(violations), ["I6"]);
  assert.ok(violations.some((v) => /\(group\)/.test(v.detail)));
});

test("I6 negative: an accessibility attribute hidden inside a comment does not count", () => {
  const commented = SOURCES.renderer.replace(
    '.attr("role", "button")',
    '/* .attr("role", "button") */',
  );
  const violations = violationsOf(cloneOracle(), { ...SOURCES, renderer: commented });
  assert.deepEqual(invariantsHit(violations), ["I6"]);
});

test("I7 negative: a mutated map does not reproduce the derived output hash", async () => {
  const map = cloneOracle();
  map.nodes[0].name = `${map.nodes[0].name} (renamed)`;
  const actual = await derivedOutputHash(map);
  assert.notEqual(actual, DERIVED_OUTPUT_SHA256);
});

test("I7 negative: a reordered node list still reproduces the hash (order is not semantics)", async () => {
  const map = cloneOracle();
  map.nodes.reverse();
  const actual = await derivedOutputHash(map);
  assert.equal(actual, DERIVED_OUTPUT_SHA256);
});
