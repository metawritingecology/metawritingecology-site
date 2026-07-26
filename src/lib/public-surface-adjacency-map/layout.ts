// Expanded Public Surface Adjacency Map — deterministic layout and spatial
// keyboard navigation.
//
// A PURE module: no DOM, no D3, no browser API, no randomness, no time, no host
// locale, no mutation of its inputs. Given the same validated records and the
// same options it returns byte-for-byte identical coordinates in every
// JavaScript environment.
//
// Deliberately NOT computed anywhere in this module:
//   - centrality, degree, connectivity, or any edge-count-derived value;
//   - similarity, clustering, community detection, or hierarchy;
//   - rank, importance, influence, weight, or authority scores;
//   - force simulation, physics, or any iterative placement;
//   - inferred nodes, inferred edges, or inferred relations.
//
// Two independent coordinate spaces:
//   - the SEMANTIC LAYOUT, containing the 49 concept records only;
//   - the FIXED BANDS, containing the 10 non-concept records, rendered in
//     visibly separate role bands.
// The fixed bands are computed from their own records alone, so they cannot
// affect a concept position, an edge route, a node size, or any ordering.
//
// Edge visibility is never an input here. Toggling an edge class therefore
// cannot move a node: `computeSemanticLayout` has no edge parameter at all.

import type {
  AdjacencyEdge,
  AdjacencyEdgeClass,
  AdjacencyNode,
  AdjacencyVisualizationRole,
} from "./contract.ts";
import { FIXED_BAND_ROLES } from "./contract.ts";

// --- Fixed metrics (CSS pixels) ---------------------------------------------
//
// Every semantic node uses NODE_WIDTH x NODE_HEIGHT and every fixed-band record
// uses BAND_ITEM_WIDTH x BAND_ITEM_HEIGHT. Size is constant per presentation
// role, never derived from data, so it can never encode importance, authority,
// or connectivity.

export const ADJACENCY_LAYOUT_METRICS = {
  NODE_WIDTH: 236,
  NODE_HEIGHT: 64,
  NODE_GAP: 12,
  GROUP_PADDING: 12,
  GROUP_HEADER_HEIGHT: 48,
  GROUP_GAP: 24,
  BAND_GAP: 28,
  CANVAS_PADDING: 16,
  MIN_CANVAS_HEIGHT: 240,
  BAND_ITEM_WIDTH: 236,
  BAND_ITEM_HEIGHT: 48,
  BAND_ITEM_GAP: 12,
  BAND_HEADER_HEIGHT: 36,
  LABEL_LINE_MAX: 30,
  LABEL_MAX_LINES: 2,
} as const;

const M = ADJACENCY_LAYOUT_METRICS;

/** Outer width of one group region (uniform for every group). */
export const GROUP_REGION_WIDTH = M.NODE_WIDTH + M.GROUP_PADDING * 2;

// --- Deterministic comparison -----------------------------------------------

/**
 * Locale-independent UTF-16 code-unit comparison. No collation API, no host
 * locale, no browser language takes part, so ordering is identical across
 * browsers, operating systems, Node versions, and ICU builds.
 */
export function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Display label first, then record id as the total-order tiebreak. */
export function compareNodes(a: AdjacencyNode, b: AdjacencyNode): number {
  const byLabel = compareText(a.display_label, b.display_label);
  return byLabel !== 0 ? byLabel : compareText(a.id, b.id);
}

// --- Label shortening (the full label is never discarded) -------------------

export interface ShortenedLabel {
  readonly lines: readonly string[];
  readonly truncated: boolean;
}

/**
 * Wrap a display label into at most `maxLines` lines of at most `lineMax`
 * characters. Purely presentational; the untouched label always remains
 * available on the record for the accessible name and the fallback list.
 */
export function shortenLabel(
  label: string,
  lineMax: number = M.LABEL_LINE_MAX,
  maxLines: number = M.LABEL_MAX_LINES,
): ShortenedLabel {
  const words = label.split(" ").filter((word) => word.length > 0);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current === "" ? word : `${current} ${word}`;
    if (candidate.length <= lineMax) {
      current = candidate;
      continue;
    }
    if (current !== "") lines.push(current);
    current = word.length <= lineMax ? word : word.slice(0, lineMax);
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current !== "") lines.push(current);

  const rendered = lines.join(" ");
  const truncated = rendered !== label;
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length > lineMax - 1 ? `${last.slice(0, lineMax - 1)}…` : `${last}…`;
  }
  return { lines: lines.length > 0 ? lines : [""], truncated };
}

// --- Semantic layout --------------------------------------------------------

export interface LayoutPoint {
  readonly cx: number;
  readonly cy: number;
}

export interface SemanticLayoutNode {
  readonly id: string;
  readonly node: AdjacencyNode;
  readonly groupKey: string;
  readonly bandIndex: number;
  readonly columnIndex: number;
  readonly rowIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly cx: number;
  readonly cy: number;
  readonly labelLines: readonly string[];
  readonly labelTruncated: boolean;
}

export interface SemanticLayoutGroup {
  readonly key: string;
  readonly count: number;
  readonly bandIndex: number;
  readonly columnIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SemanticLayout {
  readonly groups: readonly SemanticLayoutGroup[];
  readonly nodes: readonly SemanticLayoutNode[];
  readonly positions: ReadonlyMap<string, LayoutPoint>;
  readonly width: number;
  readonly height: number;
  readonly columnsPerBand: number;
  readonly isEmpty: boolean;
}

export interface SemanticLayoutOptions {
  /** Group regions side by side before wrapping. Clamped to at least 1. */
  readonly columnsPerBand?: number;
}

/** Group concept records by their MODEL_ATLAS-field grouping, deterministically. */
export function groupConceptNodes(
  nodes: readonly AdjacencyNode[],
): { key: string; nodes: AdjacencyNode[] }[] {
  const buckets = new Map<string, AdjacencyNode[]>();
  for (const node of nodes) {
    const bucket = buckets.get(node.grouping);
    if (bucket) bucket.push(node);
    else buckets.set(node.grouping, [node]);
  }
  return [...buckets.keys()]
    .sort(compareText)
    .map((key) => ({ key, nodes: [...(buckets.get(key) as AdjacencyNode[])].sort(compareNodes) }));
}

/** How many group regions fit in `availableWidth`. Always at least 1. */
export function columnsForWidth(availableWidth: number, groupCount: number): number {
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return Math.max(1, groupCount);
  const usable = availableWidth - M.CANVAS_PADDING * 2;
  const perColumn = GROUP_REGION_WIDTH + M.GROUP_GAP;
  const fit = Math.floor((usable + M.GROUP_GAP) / perColumn);
  return Math.max(1, Math.min(Math.max(1, groupCount), fit));
}

export function resolveColumnsPerBand(groupCount: number, options: SemanticLayoutOptions): number {
  const requested = options.columnsPerBand;
  if (typeof requested !== "number" || !Number.isFinite(requested)) {
    return Math.max(1, groupCount);
  }
  return Math.max(1, Math.min(Math.max(1, groupCount), Math.floor(requested)));
}

/**
 * Compute the semantic layout for concept records ONLY. Any record whose
 * `semantic_layout_participation` is false is rejected: a fixed-band record can
 * never enter this coordinate space.
 */
export function computeSemanticLayout(
  nodes: readonly AdjacencyNode[],
  options: SemanticLayoutOptions = {},
): SemanticLayout {
  for (const node of nodes) {
    if (!node.semantic_layout_participation || node.visualization_role !== "concept") {
      throw new Error(
        `semantic layout received a non-participating record: ${node.id} (${node.visualization_role})`,
      );
    }
  }

  const grouped = groupConceptNodes(nodes);
  const columnsPerBand = resolveColumnsPerBand(grouped.length, options);

  const groups: SemanticLayoutGroup[] = [];
  const layoutNodes: SemanticLayoutNode[] = [];
  const positions = new Map<string, LayoutPoint>();

  let bandTop = M.CANVAS_PADDING;
  let bandIndex = 0;

  for (let start = 0; start < grouped.length; start += columnsPerBand) {
    const band = grouped.slice(start, start + columnsPerBand);
    let bandHeight = 0;

    band.forEach((group, columnIndex) => {
      const x = M.CANVAS_PADDING + columnIndex * (GROUP_REGION_WIDTH + M.GROUP_GAP);
      const regionHeight =
        M.GROUP_HEADER_HEIGHT +
        M.GROUP_PADDING * 2 +
        group.nodes.length * M.NODE_HEIGHT +
        Math.max(0, group.nodes.length - 1) * M.NODE_GAP;

      groups.push({
        key: group.key,
        count: group.nodes.length,
        bandIndex,
        columnIndex,
        x,
        y: bandTop,
        width: GROUP_REGION_WIDTH,
        height: regionHeight,
      });
      bandHeight = Math.max(bandHeight, regionHeight);

      group.nodes.forEach((node, rowIndex) => {
        const nodeX = x + M.GROUP_PADDING;
        const nodeY =
          bandTop +
          M.GROUP_HEADER_HEIGHT +
          M.GROUP_PADDING +
          rowIndex * (M.NODE_HEIGHT + M.NODE_GAP);
        const shortened = shortenLabel(node.display_label);
        const cx = nodeX + M.NODE_WIDTH / 2;
        const cy = nodeY + M.NODE_HEIGHT / 2;

        layoutNodes.push({
          id: node.id,
          node,
          groupKey: group.key,
          bandIndex,
          columnIndex,
          rowIndex,
          x: nodeX,
          y: nodeY,
          width: M.NODE_WIDTH,
          height: M.NODE_HEIGHT,
          cx,
          cy,
          labelLines: shortened.lines,
          labelTruncated: shortened.truncated,
        });
        positions.set(node.id, { cx, cy });
      });
    });

    bandTop += bandHeight + M.BAND_GAP;
    bandIndex += 1;
  }

  const usedColumns = Math.min(columnsPerBand, Math.max(1, grouped.length));
  const width =
    grouped.length === 0
      ? M.CANVAS_PADDING * 2
      : M.CANVAS_PADDING * 2 +
        usedColumns * GROUP_REGION_WIDTH +
        Math.max(0, usedColumns - 1) * M.GROUP_GAP;
  const height = Math.max(
    M.MIN_CANVAS_HEIGHT,
    bandTop - M.BAND_GAP + M.CANVAS_PADDING,
  );

  return {
    groups,
    nodes: layoutNodes,
    positions,
    width,
    height,
    columnsPerBand,
    isEmpty: layoutNodes.length === 0,
  };
}

// --- Fixed bands ------------------------------------------------------------

export interface FixedBandItem {
  readonly id: string;
  readonly node: AdjacencyNode;
  readonly role: AdjacencyVisualizationRole;
  readonly bandIndex: number;
  readonly columnIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly labelLines: readonly string[];
  readonly labelTruncated: boolean;
}

export interface FixedBand {
  readonly role: AdjacencyVisualizationRole;
  readonly bandIndex: number;
  readonly count: number;
  readonly items: readonly FixedBandItem[];
  readonly y: number;
  readonly height: number;
}

export interface FixedBandLayout {
  readonly bands: readonly FixedBand[];
  readonly items: readonly FixedBandItem[];
  readonly width: number;
  readonly height: number;
}

/**
 * Lay out the non-concept records in fixed, visibly separate bands, in the fixed
 * role order orientation -> boundary -> anchor. Computed from these records
 * alone, in their own coordinate space.
 */
export function computeFixedBands(
  nodes: readonly AdjacencyNode[],
  options: { columnsPerBand?: number } = {},
): FixedBandLayout {
  for (const node of nodes) {
    if (node.semantic_layout_participation || node.visualization_role === "concept") {
      throw new Error(`fixed bands received a semantic-layout record: ${node.id}`);
    }
  }

  const perBand = Math.max(
    1,
    typeof options.columnsPerBand === "number" && Number.isFinite(options.columnsPerBand)
      ? Math.floor(options.columnsPerBand)
      : 4,
  );

  const bands: FixedBand[] = [];
  const items: FixedBandItem[] = [];
  let top = M.CANVAS_PADDING;
  let maxColumns = 1;

  FIXED_BAND_ROLES.forEach((role, bandIndex) => {
    const bandNodes = nodes
      .filter((node) => node.visualization_role === role)
      .sort(compareNodes);

    const rows = Math.max(1, Math.ceil(bandNodes.length / perBand));
    const bandHeight =
      M.BAND_HEADER_HEIGHT + rows * M.BAND_ITEM_HEIGHT + Math.max(0, rows - 1) * M.BAND_ITEM_GAP;

    const bandItems: FixedBandItem[] = bandNodes.map((node, index) => {
      const column = index % perBand;
      const row = Math.floor(index / perBand);
      maxColumns = Math.max(maxColumns, column + 1);
      const shortened = shortenLabel(node.display_label);
      return {
        id: node.id,
        node,
        role,
        bandIndex,
        columnIndex: index,
        x: M.CANVAS_PADDING + column * (M.BAND_ITEM_WIDTH + M.BAND_ITEM_GAP),
        y: top + M.BAND_HEADER_HEIGHT + row * (M.BAND_ITEM_HEIGHT + M.BAND_ITEM_GAP),
        width: M.BAND_ITEM_WIDTH,
        height: M.BAND_ITEM_HEIGHT,
        labelLines: shortened.lines,
        labelTruncated: shortened.truncated,
      };
    });

    bands.push({ role, bandIndex, count: bandItems.length, items: bandItems, y: top, height: bandHeight });
    items.push(...bandItems);
    top += bandHeight + M.BAND_GAP;
  });

  return {
    bands,
    items,
    width:
      M.CANVAS_PADDING * 2 +
      maxColumns * M.BAND_ITEM_WIDTH +
      Math.max(0, maxColumns - 1) * M.BAND_ITEM_GAP,
    height: Math.max(M.BAND_HEADER_HEIGHT, top - M.BAND_GAP + M.CANVAS_PADDING),
  };
}

// --- Spatial keyboard navigation --------------------------------------------

export type SpatialDirection = "up" | "down" | "left" | "right";

export const SPATIAL_DIRECTIONS: readonly SpatialDirection[] = Object.freeze([
  "up",
  "down",
  "left",
  "right",
]);

export function directionForKey(key: string): SpatialDirection | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

export interface SpatialNavigationNode {
  readonly id: string;
  readonly bandIndex: number;
  readonly columnIndex: number;
  readonly rowIndex: number;
}

/**
 * Build ONE navigation index covering every rendered record: the semantic layout
 * bands first, then the fixed bands appended as further bands. Every one of the
 * 59 records is therefore keyboard reachable, while the two coordinate spaces
 * stay independent.
 */
export function buildNavigationIndex(
  semantic: SemanticLayout,
  fixed: FixedBandLayout,
): SpatialNavigationNode[] {
  const semanticBands = semantic.nodes.reduce(
    (max, node) => Math.max(max, node.bandIndex + 1),
    0,
  );
  const index: SpatialNavigationNode[] = semantic.nodes.map((node) => ({
    id: node.id,
    bandIndex: node.bandIndex,
    columnIndex: node.columnIndex,
    rowIndex: node.rowIndex,
  }));
  for (const item of fixed.items) {
    index.push({
      id: item.id,
      bandIndex: semanticBands + item.bandIndex,
      columnIndex: item.columnIndex,
      rowIndex: 0,
    });
  }
  return sortNavigationIndex(index);
}

/** Deterministic reading order: band, then column, then row, then id. */
export function sortNavigationIndex(
  nodes: readonly SpatialNavigationNode[],
): SpatialNavigationNode[] {
  return [...nodes].sort(
    (a, b) =>
      a.bandIndex - b.bandIndex ||
      a.columnIndex - b.columnIndex ||
      a.rowIndex - b.rowIndex ||
      compareText(a.id, b.id),
  );
}

function nearestInColumn(
  nodes: readonly SpatialNavigationNode[],
  bandIndex: number,
  columnIndex: number,
  preferredRow: number,
): SpatialNavigationNode | null {
  const column = nodes
    .filter((node) => node.bandIndex === bandIndex && node.columnIndex === columnIndex)
    .sort((a, b) => a.rowIndex - b.rowIndex || compareText(a.id, b.id));
  if (column.length === 0) return null;
  let best = column[0];
  let bestDistance = Math.abs(best.rowIndex - preferredRow);
  for (const candidate of column) {
    const distance = Math.abs(candidate.rowIndex - preferredRow);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

function columnsInBand(nodes: readonly SpatialNavigationNode[], bandIndex: number): number[] {
  return [
    ...new Set(nodes.filter((node) => node.bandIndex === bandIndex).map((n) => n.columnIndex)),
  ].sort((a, b) => a - b);
}

/**
 * Resolve the deterministic spatial target for one arrow key press.
 *
 * up/down move inside the current column, then step to the adjacent band at the
 * nearest existing column. left/right move to the adjacent column in the current
 * band, landing on the nearest existing row. Returns null when no target exists,
 * so focus never wraps unpredictably.
 */
export function resolveSpatialTarget(
  nodes: readonly SpatialNavigationNode[],
  currentId: string,
  direction: SpatialDirection,
): string | null {
  const all = sortNavigationIndex(nodes);
  const current = all.find((node) => node.id === currentId);
  if (!current) return null;

  if (direction === "up" || direction === "down") {
    const step = direction === "up" ? -1 : 1;
    const sameColumn = all
      .filter(
        (node) =>
          node.bandIndex === current.bandIndex && node.columnIndex === current.columnIndex,
      )
      .sort((a, b) => a.rowIndex - b.rowIndex || compareText(a.id, b.id));
    const position = sameColumn.findIndex((node) => node.id === currentId);
    const next = sameColumn[position + step];
    if (next) return next.id;

    const bands = [...new Set(all.map((node) => node.bandIndex))].sort((a, b) => a - b);
    const bandPosition = bands.indexOf(current.bandIndex);
    const targetBand = bands[bandPosition + step];
    if (targetBand === undefined) return null;
    const columns = columnsInBand(all, targetBand);
    if (columns.length === 0) return null;
    const column = columns.reduce((best, candidate) =>
      Math.abs(candidate - current.columnIndex) < Math.abs(best - current.columnIndex)
        ? candidate
        : best,
    );
    const landing = all
      .filter((node) => node.bandIndex === targetBand && node.columnIndex === column)
      .sort((a, b) => a.rowIndex - b.rowIndex || compareText(a.id, b.id));
    if (landing.length === 0) return null;
    return direction === "up" ? landing[landing.length - 1].id : landing[0].id;
  }

  const step = direction === "left" ? -1 : 1;
  const columns = columnsInBand(all, current.bandIndex);
  const columnPosition = columns.indexOf(current.columnIndex);
  const targetColumn = columns[columnPosition + step];
  if (targetColumn === undefined) return null;
  const target = nearestInColumn(all, current.bandIndex, targetColumn, current.rowIndex);
  return target ? target.id : null;
}

/** First reachable record in the deterministic order (Home). */
export function firstReachableId(nodes: readonly SpatialNavigationNode[]): string | null {
  const all = sortNavigationIndex(nodes);
  return all.length > 0 ? all[0].id : null;
}

/** Last reachable record in the deterministic order (End). */
export function lastReachableId(nodes: readonly SpatialNavigationNode[]): string | null {
  const all = sortNavigationIndex(nodes);
  return all.length > 0 ? all[all.length - 1].id : null;
}

// ===========================================================================
// P7.1 — Radial Research Constellation
// ===========================================================================
//
// Everything below is the P7.1 radial layer. It obeys the same purity contract
// as the module header: no DOM, no D3, no browser API, no randomness, no time,
// no host locale, no mutation of inputs.
//
// The division of responsibility inside this layer matters, and the
// rendering-boundary guard asserts it:
//
//   - COORDINATE PRODUCERS take records only. Concept coordinates, role
//     coordinates, grouping spans and the canonical record orders are computed
//     from the record set alone, so no relation, edge, count or class can move
//     a record. They accept no edge parameter at all.
//   - ROUTING takes edges, because a chord is a function of the two records it
//     connects. Routing reads the coordinates the producers already fixed; it
//     never writes one back.
//
// Nothing here derives a value from record count, connectivity, grouping size,
// authority, evidence ceiling or classification.

// --- Canonical geometry constants (logical SVG units) -----------------------

export const VIEWBOX = "0 0 1000 1000";
export const CENTRE_X = 500;
export const CENTRE_Y = 500;

/** Path-free central disc holding the two approved boundary lines. */
export const CENTRAL_TEXT_CLEAR_R = 118;

/** Cross-group chords place their control point inside this corridor. */
export const CORRIDOR_INNER_R = 244;
export const CORRIDOR_OUTER_R = 316;
export const LANE_COUNT = 16;
export const LANE_STEP = 4.5;

/** The single concept ring. Every concept record shares this radius. */
export const RING_R = 330;

/**
 * 49 is the frozen concept-record count of the adopted snapshot. Equal angular
 * pitch is what refuses any "more central" reading, so it is a constant of the
 * layout rather than a function of whatever subset a caller passes.
 */
export const CONCEPT_PITCH = 360 / 49;
export const START_ANGLE = -90;

export const SAME_GROUP_BULGE_R = 352;

/**
 * The sole normative grouping-arc radius. It varies with nothing: not member
 * count, angular span, edge count, relation count, authority, evidence
 * ceiling, selection, viewport state, visitor state or label length. It implies
 * no hierarchy, authority, strength or standing.
 */
export const GROUP_ARC_R = 370;

export const SEPARATOR_RING_R = 385;
export const ROLE_LABEL_R = 407;
export const ROLE_ORBIT_R = 430;
export const ROLE_ORBIT_START_ANGLE = -90;
export const ROLE_ORBIT_PITCH = 36;

/** Every role glyph is inscribed in the same box. Shape carries no ordering. */
export const GLYPH_FOOTPRINT = 18;

/** Transparent hit circle over every glyph. */
export const HIT_R = 26;

/**
 * Descriptive tolerance for the same-group ring-interior diagnostic ONLY.
 *
 * Same-group chords have both endpoints on the ring, so their true minimum is
 * frequently exactly RING_R, and floating-point evaluation returns a value a
 * few units in the last place below it. Without a tolerance the diagnostic
 * counts that rounding noise as an incursion.
 *
 * It must never weaken, replace, relax or participate in the exact
 * central-clearance gate.
 */
export const RING_INTERIOR_DIAGNOSTIC_EPSILON = 0.001;

/**
 * Gate-internal solver tolerance ONLY. It absorbs cubic-solver comparison
 * noise — root-bracket endpoints, repeated roots, near-tangent stationary
 * points. It does not permit a geometric shortfall: the measured clearance
 * margin is roughly ten orders of magnitude above it.
 *
 * It must never be substituted for the ring-interior diagnostic tolerance.
 */
export const CLEARANCE_SOLVER_EPSILON = 1e-9;

// --- Canonical serialization ------------------------------------------------

export const LOGICAL_DECIMAL_PLACES = 3;

/**
 * The single shared serializer for every emitted logical coordinate. The
 * concept ring and the role orbit must never serialize differently, so both
 * route through this one function.
 *
 * Behaviour is exactly the ECMAScript `toFixed(3)` contract, NOT a half-up
 * rule; the two differ observably — 1.0005 formats as "1.000" while 2.0005
 * formats as "2.001". Do not substitute a rounding helper.
 *
 * Negative zero, and negative values that serialize to zero, normalise to
 * "0.000" so a sign artefact can never reach emitted bytes.
 */
export function formatLogicalNumber(value: number): string {
  const result = value.toFixed(LOGICAL_DECIMAL_PLACES);
  return result === "-0.000" ? "0.000" : result;
}

// --- Canonical deterministic orders -----------------------------------------
//
// No source-file order, JSON input order, object-property order, edge order,
// viewport state, selection state or visitor state may affect any order here.

/** The fixed role order. No other role order is permitted. */
export const ROLE_ORDER: readonly AdjacencyVisualizationRole[] = Object.freeze([
  "orientation",
  "boundary",
  "anchor",
]);

const isConceptRecord = (node: AdjacencyNode) => node.visualization_role === "concept";

/** Unique concept grouping keys, sorted with `compareText`. */
export function CONCEPT_GROUP_ORDER(nodes: readonly AdjacencyNode[]): string[] {
  return [...new Set(nodes.filter(isConceptRecord).map((node) => node.grouping))].sort(
    compareText,
  );
}

/**
 * Concept records grouped by `CONCEPT_GROUP_ORDER`, each grouping internally
 * sorted with `compareNodes`, then flattened. Each grouping therefore occupies
 * a contiguous index range, which is what lets a grouping arc be one span.
 */
export function CONCEPT_ORDER(nodes: readonly AdjacencyNode[]): AdjacencyNode[] {
  const concepts = nodes.filter(isConceptRecord);
  const buckets = new Map<string, AdjacencyNode[]>();
  for (const node of concepts) {
    const bucket = buckets.get(node.grouping);
    if (bucket) bucket.push(node);
    else buckets.set(node.grouping, [node]);
  }
  return CONCEPT_GROUP_ORDER(concepts).flatMap((key) =>
    [...(buckets.get(key) as AdjacencyNode[])].sort(compareNodes),
  );
}

/** Role records in `ROLE_ORDER`, each role internally sorted with `compareNodes`. */
export function ROLE_ORBIT_ORDER(nodes: readonly AdjacencyNode[]): AdjacencyNode[] {
  return ROLE_ORDER.flatMap((role) =>
    nodes.filter((node) => node.visualization_role === role).sort(compareNodes),
  );
}

/**
 * The complete graph-record order: concepts, then role records.
 *
 * This governs authored control order, sequential Tab order, Home, End, and the
 * directional tie-break index.
 *
 * It implies NO hierarchy, authority, priority or standing. It is a lexical
 * determinism contract derived from display labels and record ids through
 * `compareText` / `compareNodes`. No edge count, grouping size, evidence
 * ceiling or classification takes part in it.
 */
export function GRAPH_RECORD_ORDER(nodes: readonly AdjacencyNode[]): AdjacencyNode[] {
  return [...CONCEPT_ORDER(nodes), ...ROLE_ORBIT_ORDER(nodes)];
}

// --- Canonical edge order and lane assignment -------------------------------

/**
 * Canonical edge key: edge class, then source record id, then target record id,
 * each compared with `compareText`.
 */
export function compareEdges(a: AdjacencyEdge, b: AdjacencyEdge): number {
  return (
    compareText(a.edge_class, b.edge_class) ||
    compareText(a.source, b.source) ||
    compareText(a.target, b.target)
  );
}

const edgeTriple = (edge: AdjacencyEdge) => `${edge.edge_class} ${edge.source} ${edge.target}`;

/**
 * Lane index per edge, assigned within its ordered
 * `(sourceGrouping -> targetGrouping)` bucket after sorting with
 * `compareEdges`, modulo `LANE_COUNT`. Lane position carries no meaning.
 *
 * The `(edge_class, source, target)` triple is asserted unique. On the adopted
 * snapshot it yields 383 distinct keys across 383 edges, so it is already a
 * total order; `edge.id` is derived from those same three fields and carries no
 * independent discriminating information. Inventing a fourth sort field from a
 * derived or semantically loaded field is prohibited, so a duplicate triple
 * throws: that is a dataset condition requiring owner review, never a silent
 * ordering decision.
 */
export function assignLanes(
  edges: readonly AdjacencyEdge[],
  groupingById: ReadonlyMap<string, string>,
): Map<string, number> {
  const seen = new Set<string>();
  for (const edge of edges) {
    const triple = edgeTriple(edge);
    if (seen.has(triple)) {
      throw new Error(
        `duplicate (edge_class, source, target) triple requires owner review: ${edge.edge_class}::${edge.source}->${edge.target}`,
      );
    }
    seen.add(triple);
  }

  const ordered = [...edges].sort(compareEdges);
  const counters = new Map<string, number>();
  const lanes = new Map<string, number>();
  for (const edge of ordered) {
    const bucket = `${groupingById.get(edge.source) ?? ""} ${groupingById.get(edge.target) ?? ""}`;
    const position = counters.get(bucket) ?? 0;
    counters.set(bucket, position + 1);
    lanes.set(edge.id, position % LANE_COUNT);
  }
  return lanes;
}

// --- Radial coordinate producers --------------------------------------------
//
// These take records only. None of them accepts an edge parameter.

const RADIANS = Math.PI / 180;

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface RadialRecord {
  readonly id: string;
  readonly node: AdjacencyNode;
  readonly orderIndex: number;
  readonly theta: number;
  readonly x: number;
  readonly y: number;
}

export interface GroupArcSpan {
  readonly key: string;
  readonly count: number;
  readonly firstIndex: number;
  readonly lastIndex: number;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly midAngle: number;
  readonly radius: number;
}

export interface RadialLayout {
  readonly concepts: readonly RadialRecord[];
  readonly groups: readonly GroupArcSpan[];
  readonly positions: ReadonlyMap<string, LayoutPoint>;
}

const pointOnCircle = (theta: number, radius: number): Vec2 => ({
  x: CENTRE_X + radius * Math.cos(theta * RADIANS),
  y: CENTRE_Y + radius * Math.sin(theta * RADIANS),
});

/**
 * Concept ring coordinates and grouping arc spans.
 *
 * Equal radius, equal angular pitch. Takes records only — there is no edge
 * parameter, so adding or toggling a relation cannot move a record.
 */
export function computeRadialLayout(nodes: readonly AdjacencyNode[]): RadialLayout {
  const order = CONCEPT_ORDER(nodes);
  const positions = new Map<string, LayoutPoint>();

  const concepts: RadialRecord[] = order.map((node, orderIndex) => {
    const theta = START_ANGLE + orderIndex * CONCEPT_PITCH;
    const point = pointOnCircle(theta, RING_R);
    positions.set(node.id, { cx: point.x, cy: point.y });
    return { id: node.id, node, orderIndex, theta, x: point.x, y: point.y };
  });

  const groups: GroupArcSpan[] = CONCEPT_GROUP_ORDER(nodes).flatMap((key) => {
    const members = concepts.filter((entry) => entry.node.grouping === key);
    if (members.length === 0) return [];
    const first = members[0];
    const last = members[members.length - 1];
    return [
      {
        key,
        count: members.length,
        firstIndex: first.orderIndex,
        lastIndex: last.orderIndex,
        startAngle: first.theta,
        endAngle: last.theta,
        midAngle: (first.theta + last.theta) / 2,
        // Fixed. Read from the constant, never derived from `members.length`.
        radius: GROUP_ARC_R,
      },
    ];
  });

  return { concepts, groups, positions };
}

export interface RoleLabelSpan {
  readonly role: AdjacencyVisualizationRole;
  readonly count: number;
  readonly firstAngle: number;
  readonly lastAngle: number;
  readonly midAngle: number;
  readonly x: number;
  readonly y: number;
}

export interface RoleOrbitLayout {
  readonly roles: readonly RadialRecord[];
  readonly labels: readonly RoleLabelSpan[];
  readonly positions: ReadonlyMap<string, LayoutPoint>;
}

/**
 * Role-orbit coordinates and role-label anchors.
 *
 * One radius and one constant pitch for all ten records, so the orbit implies
 * no rank. Takes records only — no edge, visibility, selection, label length,
 * viewport state, DOM measurement or visitor state may affect a role
 * coordinate.
 */
export function computeRoleOrbit(nodes: readonly AdjacencyNode[]): RoleOrbitLayout {
  const order = ROLE_ORBIT_ORDER(nodes);
  const positions = new Map<string, LayoutPoint>();

  const roles: RadialRecord[] = order.map((node, orderIndex) => {
    const theta = ROLE_ORBIT_START_ANGLE + orderIndex * ROLE_ORBIT_PITCH;
    const point = pointOnCircle(theta, ROLE_ORBIT_R);
    positions.set(node.id, { cx: point.x, cy: point.y });
    return { id: node.id, node, orderIndex, theta, x: point.x, y: point.y };
  });

  const labels: RoleLabelSpan[] = ROLE_ORDER.flatMap((role) => {
    const members = roles.filter((entry) => entry.node.visualization_role === role);
    if (members.length === 0) return [];
    const firstAngle = members[0].theta;
    const lastAngle = members[members.length - 1].theta;
    const midAngle = (firstAngle + lastAngle) / 2;
    const point = pointOnCircle(midAngle, ROLE_LABEL_R);
    return [{ role, count: members.length, firstAngle, lastAngle, midAngle, x: point.x, y: point.y }];
  });

  return { roles, labels, positions };
}

/** Serialized arc path for one grouping span, at the fixed `GROUP_ARC_R`. */
export function groupArcPath(span: GroupArcSpan): string {
  const start = pointOnCircle(span.startAngle, span.radius);
  const end = pointOnCircle(span.endAngle, span.radius);
  const sweep = span.endAngle - span.startAngle;
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
  const direction = sweep < 0 ? 0 : 1;
  const radius = formatLogicalNumber(span.radius);
  return (
    `M ${formatLogicalNumber(start.x)} ${formatLogicalNumber(start.y)} ` +
    `A ${radius} ${radius} 0 ${largeArc} ${direction} ` +
    `${formatLogicalNumber(end.x)} ${formatLogicalNumber(end.y)}`
  );
}

// --- Exact centre clearance -------------------------------------------------

const clampUnit = (value: number) => (value < -1 ? -1 : value > 1 ? 1 : value);

/**
 * Real roots of `a3 t^3 + a2 t^2 + a1 t + a0`, first-party and deterministic.
 * No dependency is added for this, and no polynomial-root package is
 * introduced.
 */
function realCubicRoots(a3: number, a2: number, a1: number, a0: number): number[] {
  const roots: number[] = [];

  if (Math.abs(a3) <= CLEARANCE_SOLVER_EPSILON) {
    if (Math.abs(a2) <= CLEARANCE_SOLVER_EPSILON) {
      if (Math.abs(a1) > CLEARANCE_SOLVER_EPSILON) roots.push(-a0 / a1);
      return roots;
    }
    const discriminant = a1 * a1 - 4 * a2 * a0;
    if (discriminant < 0) return roots;
    const root = Math.sqrt(discriminant);
    roots.push((-a1 + root) / (2 * a2), (-a1 - root) / (2 * a2));
    return roots;
  }

  // Depressed cubic x^3 + p x + q, with t = x - a2 / (3 a3).
  const b = a2 / a3;
  const c = a1 / a3;
  const d = a0 / a3;
  const shift = -b / 3;
  const p = c - (b * b) / 3;
  const q = (2 * b * b * b) / 27 - (b * c) / 3 + d;
  const discriminant = (q * q) / 4 + (p * p * p) / 27;

  if (discriminant > CLEARANCE_SOLVER_EPSILON) {
    const root = Math.sqrt(discriminant);
    roots.push(Math.cbrt(-q / 2 + root) + Math.cbrt(-q / 2 - root) + shift);
  } else if (discriminant >= -CLEARANCE_SOLVER_EPSILON) {
    // Repeated-root case, including the exactly-tangent stationary point.
    const u = Math.cbrt(-q / 2);
    roots.push(2 * u + shift, -u + shift);
  } else {
    const magnitudeBase = Math.sqrt(-(p * p * p) / 27);
    const phi = Math.acos(clampUnit(-q / (2 * magnitudeBase)));
    const magnitude = 2 * Math.sqrt(-p / 3);
    for (let k = 0; k < 3; k += 1) {
      roots.push(magnitude * Math.cos((phi - 2 * Math.PI * k) / 3) + shift);
    }
  }

  // Newton polish against the ORIGINAL cubic, so the depressed-form algebra
  // above cannot leave a root a few units in the last place off a bracket.
  return roots.map((initial) => {
    let t = initial;
    for (let step = 0; step < 8; step += 1) {
      const value = ((a3 * t + a2) * t + a1) * t + a0;
      const slope = (3 * a3 * t + 2 * a2) * t + a1;
      if (!Number.isFinite(slope) || Math.abs(slope) < 1e-14) break;
      const delta = value / slope;
      t -= delta;
      if (Math.abs(delta) < 1e-15) break;
    }
    return Number.isFinite(t) ? t : initial;
  });
}

/**
 * Exact minimum radial distance from `centre` to the quadratic Bezier
 * `B(t) = (1-t)^2 P0 + 2(1-t)t Q + t^2 P2`.
 *
 * Writing `D(t) = B(t) - centre = A t^2 + B t + C` and `F(t) = D(t) . D(t)`,
 * the minimum occurs at t = 0, at t = 1, or at a real root in [0,1] of the
 * cubic `F'(t)/2 = 2(A.A) t^3 + 3(A.B) t^2 + (2(A.C) + B.B) t + (B.C)`.
 *
 * Operates on full-precision inputs and returns a full-precision value. It must
 * never receive or return a serialized string. Solver tolerance is
 * `CLEARANCE_SOLVER_EPSILON`; the ring-interior diagnostic tolerance is not
 * permitted anywhere in this calculation.
 */
export function minimumQuadraticBezierRadius(
  p0: Vec2,
  control: Vec2,
  p2: Vec2,
  centre: Vec2,
): number {
  const ax = p0.x - 2 * control.x + p2.x;
  const ay = p0.y - 2 * control.y + p2.y;
  const bx = 2 * (control.x - p0.x);
  const by = 2 * (control.y - p0.y);
  const cx = p0.x - centre.x;
  const cy = p0.y - centre.y;

  const squaredRadius = (t: number) => {
    const dx = (ax * t + bx) * t + cx;
    const dy = (ay * t + by) * t + cy;
    return dx * dx + dy * dy;
  };

  let best = Math.min(squaredRadius(0), squaredRadius(1));

  const aa = ax * ax + ay * ay;
  const ab = ax * bx + ay * by;
  const ac = ax * cx + ay * cy;
  const bb = bx * bx + by * by;
  const bc = bx * cx + by * cy;

  for (const root of realCubicRoots(2 * aa, 3 * ab, 2 * ac + bb, bc)) {
    if (!Number.isFinite(root)) continue;
    if (root < -CLEARANCE_SOLVER_EPSILON || root > 1 + CLEARANCE_SOLVER_EPSILON) continue;
    const t = root < 0 ? 0 : root > 1 ? 1 : root;
    const value = squaredRadius(t);
    if (value < best) best = value;
  }

  return Math.sqrt(best);
}

/**
 * Secondary regression aid only. Sampling is NOT the mathematical proof, and
 * the absence of a sampled failure never replaces the exact stationary-point
 * calculation above.
 */
export function sampledMinimumBezierRadius(
  p0: Vec2,
  control: Vec2,
  p2: Vec2,
  centre: Vec2,
  samples = 64,
): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const inverse = 1 - t;
    const x = inverse * inverse * p0.x + 2 * inverse * t * control.x + t * t * p2.x;
    const y = inverse * inverse * p0.y + 2 * inverse * t * control.y + t * t * p2.y;
    const radius = Math.hypot(x - centre.x, y - centre.y);
    if (radius < best) best = radius;
  }
  return best;
}

// --- Edge routing -----------------------------------------------------------

const unitFromCentre = (point: Vec2): Vec2 => {
  const dx = point.x - CENTRE_X;
  const dy = point.y - CENTRE_Y;
  const length = Math.hypot(dx, dy);
  return length === 0 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
};

/**
 * Angular bisector direction for a chord.
 *
 * `lower` is the endpoint with the lower `GRAPH_RECORD_ORDER` index. That only
 * matters in the near-diametric fallback, where the summed unit vectors cancel
 * and the bisector would otherwise be undefined; taking the perpendicular of
 * the lower-order endpoint makes the choice deterministic rather than dependent
 * on which record happened to be the edge source.
 */
export function bisectorDirection(lower: Vec2, other: Vec2): Vec2 {
  const a = unitFromCentre(lower);
  const b = unitFromCentre(other);
  const sx = a.x + b.x;
  const sy = a.y + b.y;
  const length = Math.hypot(sx, sy);
  if (length < 1e-6) return { x: -a.y, y: a.x };
  return { x: sx / length, y: sy / length };
}

export interface RoutedEdge {
  readonly id: string;
  readonly edgeClass: AdjacencyEdgeClass;
  readonly source: string;
  readonly target: string;
  readonly sameGroup: boolean;
  /** -1 for same-group chords, which use the fixed bulge radius instead. */
  readonly lane: number;
  readonly controlRadius: number;
  readonly p0: Vec2;
  readonly control: Vec2;
  readonly p2: Vec2;
  readonly d: string;
  /** Full precision. Never compared against a serialized string. */
  readonly minimumRadius: number;
}

const quadraticPath = (p0: Vec2, control: Vec2, p2: Vec2) =>
  `M ${formatLogicalNumber(p0.x)} ${formatLogicalNumber(p0.y)} ` +
  `Q ${formatLogicalNumber(control.x)} ${formatLogicalNumber(control.y)} ` +
  `${formatLogicalNumber(p2.x)} ${formatLogicalNumber(p2.y)}`;

/**
 * Both deterministic routing forms.
 *
 * Same-group chords bulge outward to `SAME_GROUP_BULGE_R`; cross-group chords
 * pass through the central corridor at `CORRIDOR_INNER_R + lane * LANE_STEP`.
 * Neither width, opacity, length nor lane position varies with any count.
 *
 * This function consumes edges, which is exactly why it is not a coordinate
 * producer: it reads positions that `computeRadialLayout` already fixed, and
 * never writes one back.
 */
export function computeEdgeRouting(
  nodes: readonly AdjacencyNode[],
  edges: readonly AdjacencyEdge[],
): RoutedEdge[] {
  const layout = computeRadialLayout(nodes);
  const groupingById = new Map<string, string>();
  const orderIndexById = new Map<string, number>();
  GRAPH_RECORD_ORDER(nodes).forEach((node, index) => {
    orderIndexById.set(node.id, index);
    groupingById.set(node.id, node.grouping);
  });

  const lanes = assignLanes(edges, groupingById);
  const centre: Vec2 = { x: CENTRE_X, y: CENTRE_Y };

  return [...edges].sort(compareEdges).flatMap((edge) => {
    const from = layout.positions.get(edge.source);
    const to = layout.positions.get(edge.target);
    // A role record is never a semantic-edge endpoint. If one ever appeared the
    // chord is skipped rather than invented.
    if (!from || !to) return [];

    const p0: Vec2 = { x: from.cx, y: from.cy };
    const p2: Vec2 = { x: to.cx, y: to.cy };
    const sameGroup = groupingById.get(edge.source) === groupingById.get(edge.target);
    const lane = sameGroup ? -1 : (lanes.get(edge.id) as number);
    const controlRadius = sameGroup ? SAME_GROUP_BULGE_R : CORRIDOR_INNER_R + lane * LANE_STEP;

    const sourceIndex = orderIndexById.get(edge.source) ?? 0;
    const targetIndex = orderIndexById.get(edge.target) ?? 0;
    const lower = sourceIndex <= targetIndex ? p0 : p2;
    const other = sourceIndex <= targetIndex ? p2 : p0;
    const bisector = bisectorDirection(lower, other);
    const control: Vec2 = {
      x: CENTRE_X + bisector.x * controlRadius,
      y: CENTRE_Y + bisector.y * controlRadius,
    };

    return [
      {
        id: edge.id,
        edgeClass: edge.edge_class,
        source: edge.source,
        target: edge.target,
        sameGroup,
        lane,
        controlRadius,
        p0,
        control,
        p2,
        d: quadraticPath(p0, control, p2),
        minimumRadius: minimumQuadraticBezierRadius(p0, control, p2, centre),
      },
    ];
  });
}

/**
 * Descriptive diagnostic: how many same-group chords dip meaningfully inside
 * the concept ring. Uses `RING_INTERIOR_DIAGNOSTIC_EPSILON` and nothing else,
 * and takes no part in the clearance gate.
 */
export function ringInteriorDiagnostic(routed: readonly RoutedEdge[]): number {
  return routed.filter(
    (edge) => edge.sameGroup && edge.minimumRadius < RING_R - RING_INTERIOR_DIAGNOSTIC_EPSILON,
  ).length;
}

// --- Pure directional navigation --------------------------------------------
//
// Arrow keys are a LOCAL SPATIAL ACCELERATOR. They are not the complete
// keyboard traversal system: that is native sequential Tab/Shift+Tab over all
// authored record controls in GRAPH_RECORD_ORDER, plus Home/End and the
// complete record list.
//
// Relation edges are never used as navigation adjacency, and no navigation link
// is inferred. No connectivity, reachability or coverage property of the arrow
// graph is an accessibility requirement.

export const DIRECTION_VECTORS: Readonly<Record<SpatialDirection, Vec2>> = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

export interface DirectionalEntry {
  readonly id: string;
  readonly orderIndex: number;
  readonly x: number;
  readonly y: number;
}

export interface DirectionalIndex {
  readonly order: readonly DirectionalEntry[];
  readonly points: ReadonlyMap<string, DirectionalEntry>;
}

/**
 * One directional index over every rendered record — concept ring and role
 * orbit alike — in `GRAPH_RECORD_ORDER`.
 *
 * Inputs are records only: no edge data, no scale, no pan offset, no selection
 * state, no DOM, no viewport state.
 */
export function buildDirectionalIndex(nodes: readonly AdjacencyNode[]): DirectionalIndex {
  const radial = computeRadialLayout(nodes);
  const orbit = computeRoleOrbit(nodes);
  const order: DirectionalEntry[] = [];
  const points = new Map<string, DirectionalEntry>();

  GRAPH_RECORD_ORDER(nodes).forEach((node, orderIndex) => {
    const point = radial.positions.get(node.id) ?? orbit.positions.get(node.id);
    if (!point) return;
    const entry: DirectionalEntry = { id: node.id, orderIndex, x: point.cx, y: point.cy };
    order.push(entry);
    points.set(node.id, entry);
  });

  return { order, points };
}

/**
 * Resolve one arrow key press to a record id, or to `null`.
 *
 * Candidates must lie strictly inside the requested half-plane. Among those,
 * integer angular deviation is the primary comparison, quantised Euclidean
 * distance the secondary, then `GRAPH_RECORD_ORDER` index and finally record id
 * as deterministic tie-breaks. Both sort keys are integer-quantised, which makes
 * the chain a total order immune to cross-engine floating-point differences.
 *
 * There is no wraparound and no fallback jump outside the requested half-plane.
 * `null` is a normal, expected, tested outcome; the caller leaves focus,
 * selection and presentation unchanged.
 */
export function resolveDirectionalTarget(
  nav: DirectionalIndex,
  fromId: string,
  direction: SpatialDirection,
): string | null {
  const origin = nav.points.get(fromId);
  if (!origin) return null;
  const vector = DIRECTION_VECTORS[direction];

  let bestId: string | null = null;
  let bestDeviation = 0;
  let bestDistance = 0;
  let bestOrder = 0;

  for (const candidate of nav.order) {
    if (candidate.id === fromId) continue;
    const vx = candidate.x - origin.x;
    const vy = candidate.y - origin.y;
    if (vx === 0 && vy === 0) continue;

    const dot = vx * vector.x + vy * vector.y;
    if (dot <= 0) continue;

    const length = Math.hypot(vx, vy);
    const deviation = Math.round((Math.acos(clampUnit(dot / length)) * 180) / Math.PI);
    if (deviation >= 90) continue;

    const distance = Math.round(length * 1000);

    const better =
      bestId === null ||
      deviation < bestDeviation ||
      (deviation === bestDeviation &&
        (distance < bestDistance ||
          (distance === bestDistance &&
            (candidate.orderIndex < bestOrder ||
              (candidate.orderIndex === bestOrder && compareText(candidate.id, bestId) < 0)))));

    if (better) {
      bestId = candidate.id;
      bestDeviation = deviation;
      bestDistance = distance;
      bestOrder = candidate.orderIndex;
    }
  }

  return bestId;
}

// --- Label readout ----------------------------------------------------------

export interface ReadoutState {
  readonly focusedId: string | null;
  readonly hoveredId: string | null;
  readonly selectedId: string | null;
  readonly labels: ReadonlyMap<string, string>;
  readonly neutralText: string;
}

/**
 * Resolve the visual label readout.
 *
 * Precedence is focus, then hover, then selection, then neutral text. Keyboard
 * focus outranks selection deliberately: otherwise a keyboard-focused record's
 * label would vanish whenever a different record happened to be selected. For
 * the same reason pointer hover must not overwrite the label while a record
 * holds keyboard focus.
 *
 * The details panel continues to show the SELECTED record even when this
 * readout shows the focused or hovered one. The two surfaces are allowed to
 * disagree; that is the point of the precedence.
 */
export function resolveReadoutLabel(state: ReadoutState): string {
  for (const id of [state.focusedId, state.hoveredId, state.selectedId]) {
    if (id === null) continue;
    const label = state.labels.get(id);
    if (label !== undefined) return label;
  }
  return state.neutralText;
}
