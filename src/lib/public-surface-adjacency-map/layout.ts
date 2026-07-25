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

import type { AdjacencyNode, AdjacencyVisualizationRole } from "./contract.ts";
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
