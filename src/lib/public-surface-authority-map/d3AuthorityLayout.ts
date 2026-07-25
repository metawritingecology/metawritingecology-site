// Public Surface and Authority-Ceiling Map — Phase 2A deterministic layout.
//
// A PURE module: no DOM, no D3, no browser API, no randomness, no time, no
// mutation of its inputs. Given the same validated snapshot nodes, the same
// grouping field, and the same options, it returns byte-for-byte identical
// coordinates. Semantic validation stays in `contract.ts` / `fallback.ts`; this
// module only turns already-validated public metadata into positions.
//
// Deliberately NOT computed anywhere in this module (Phase 2A boundary):
//   - centrality, degree, connectivity, or any edge-count-derived value;
//   - similarity, distance, clustering, community detection, or hierarchy;
//   - rank, importance, influence, weight, or authority scores;
//   - force simulation, physics, or any iterative/converging placement;
//   - inferred nodes, inferred edges, or inferred relations.
//
// Grouping and ordering are lexical over explicit approved metadata only.
// Position therefore encodes group membership and alphabetical order — nothing
// else. Every node is rendered at the SAME size in every group.

import type {
  GroupingField,
  PublicSurfaceEdge,
  PublicSurfaceNode,
} from "./contract.ts";

// --- Fixed layout metrics (CSS pixels) --------------------------------------
//
// Every node uses NODE_WIDTH x NODE_HEIGHT. Size is a constant, never derived
// from data, so it can never encode importance, authority, or connectivity.

export const AUTHORITY_LAYOUT_METRICS = {
  /** Uniform node box width. Identical for every node. */
  NODE_WIDTH: 236,
  /** Uniform node box height. Identical for every node. */
  NODE_HEIGHT: 64,
  /** Vertical gap between node boxes inside one group column. */
  NODE_GAP: 12,
  /** Inner padding between a group region border and its node boxes. */
  GROUP_PADDING: 12,
  /** Height reserved at the top of a group region for its label + count. */
  GROUP_HEADER_HEIGHT: 48,
  /** Horizontal gap between two group regions in the same band. */
  GROUP_GAP: 24,
  /** Vertical gap between two wrapped bands of group regions. */
  BAND_GAP: 28,
  /** Outer padding around the whole map. */
  CANVAS_PADDING: 16,
  /** Minimum rendered map height (keeps an empty view stable). */
  MIN_CANVAS_HEIGHT: 240,
  /** Maximum characters per rendered label line. */
  LABEL_LINE_MAX: 28,
  /** Maximum rendered label lines per node. */
  LABEL_MAX_LINES: 2,
} as const;

const M = AUTHORITY_LAYOUT_METRICS;

/** Outer width of one group region (uniform for every group). */
export const GROUP_REGION_WIDTH = M.NODE_WIDTH + M.GROUP_PADDING * 2;

// --- Types ------------------------------------------------------------------

export interface LayoutPoint {
  readonly cx: number;
  readonly cy: number;
}

export interface AuthorityLayoutNode {
  readonly id: string;
  /** The original validated node object, passed through by reference. */
  readonly node: PublicSurfaceNode;
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
  /** Shortened, readable label lines. The full name is never discarded. */
  readonly labelLines: readonly string[];
  /** True when `labelLines` is a shortened form of `node.name`. */
  readonly labelTruncated: boolean;
}

export interface AuthorityLayoutGroup {
  readonly key: string;
  readonly count: number;
  readonly bandIndex: number;
  readonly columnIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface AuthorityLayout {
  readonly groupField: GroupingField;
  readonly groups: readonly AuthorityLayoutGroup[];
  readonly nodes: readonly AuthorityLayoutNode[];
  readonly positions: ReadonlyMap<string, LayoutPoint>;
  readonly width: number;
  readonly height: number;
  readonly columnsPerBand: number;
  readonly isEmpty: boolean;
}

export interface AuthorityLayoutOptions {
  /**
   * How many group regions may sit side by side before wrapping to the next
   * band. Clamped to at least 1. Omitted means "all groups in one band".
   */
  readonly columnsPerBand?: number;
}

// --- Deterministic comparators ----------------------------------------------

/**
 * Lexical comparison with a code-unit tiebreak, so the result never depends on
 * host locale collation for otherwise-equal strings.
 */
export function compareText(a: string, b: string): number {
  const primary = a.localeCompare(b);
  if (primary !== 0) return primary;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Node order inside a group: document name, then node id. */
export function compareNodes(a: PublicSurfaceNode, b: PublicSurfaceNode): number {
  return compareText(a.name, b.name) || compareText(a.id, b.id);
}

// --- Label shortening --------------------------------------------------------

/**
 * Produce at most `LABEL_MAX_LINES` readable lines of at most `LABEL_LINE_MAX`
 * characters from a document name. Greedy word wrapping; an over-long single
 * word is hard-split; overflow is marked with a single ellipsis. Purely a
 * display shortening — the caller always keeps the full name reachable (SVG
 * title, accessible label, detail panel, and the complete record table).
 */
export function shortenLabel(
  name: string,
  lineMax: number = M.LABEL_LINE_MAX,
  maxLines: number = M.LABEL_MAX_LINES,
): { lines: readonly string[]; truncated: boolean } {
  const normalized = name.replace(/\s+/g, " ").trim();
  if (normalized === "") {
    return { lines: [""], truncated: false };
  }

  // Wrap greedily into as many lines as the text needs, then keep the first
  // `maxLines`. Wrapping first and trimming after keeps the result independent
  // of where the cut lands.
  const wrapped: string[] = [];
  let current = "";
  const flush = (): void => {
    if (current !== "") {
      wrapped.push(current);
      current = "";
    }
  };

  for (const word of normalized.split(" ")) {
    let remaining = word;
    // Hard-split a single word that cannot fit on one line at all.
    while (remaining.length > lineMax) {
      flush();
      wrapped.push(remaining.slice(0, lineMax));
      remaining = remaining.slice(lineMax);
    }
    if (remaining === "") continue;
    const candidate = current === "" ? remaining : `${current} ${remaining}`;
    if (candidate.length <= lineMax) {
      current = candidate;
    } else {
      flush();
      current = remaining;
    }
  }
  flush();

  if (wrapped.length <= maxLines) {
    return { lines: wrapped, truncated: wrapped.join(" ") !== normalized };
  }

  const kept = wrapped.slice(0, maxLines);
  const last = kept[maxLines - 1] ?? "";
  const room = Math.max(0, lineMax - 1);
  const trimmed = (last.length > room ? last.slice(0, room) : last).trimEnd();
  kept[maxLines - 1] = `${trimmed}…`;
  return { lines: kept, truncated: true };
}

// --- Grouping ----------------------------------------------------------------

/**
 * Bucket already-validated nodes by one approved grouping field. Group keys are
 * ordered lexically and nodes inside each group by name then id. No key is
 * invented: every key is a verbatim metadata value present on some node.
 */
export function groupNodes(
  nodes: readonly PublicSurfaceNode[],
  groupField: GroupingField,
): ReadonlyArray<{ key: string; nodes: readonly PublicSurfaceNode[] }> {
  const buckets = new Map<string, PublicSurfaceNode[]>();
  for (const node of nodes) {
    const key = node[groupField];
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(node);
    } else {
      buckets.set(key, [node]);
    }
  }
  return Array.from(buckets.keys())
    .sort(compareText)
    .map((key) => ({
      key,
      nodes: (buckets.get(key) ?? []).slice().sort(compareNodes),
    }));
}

// --- Layout ------------------------------------------------------------------

/**
 * Compute the full deterministic grouped layout for the currently VISIBLE
 * nodes. Filtered-out nodes are simply absent from `nodes` and `positions`, so
 * they receive no coordinates at all.
 *
 * Coordinates are integers derived only from fixed metrics and lexical order.
 * They are always finite and non-negative.
 */
export function computeAuthorityLayout(
  visibleNodes: readonly PublicSurfaceNode[],
  groupField: GroupingField,
  options: AuthorityLayoutOptions = {},
): AuthorityLayout {
  const grouped = groupNodes(visibleNodes, groupField);

  const requested = options.columnsPerBand;
  const columnsPerBand = Math.max(
    1,
    Math.floor(
      typeof requested === "number" && Number.isFinite(requested)
        ? requested
        : Math.max(grouped.length, 1),
    ),
  );

  const groups: AuthorityLayoutGroup[] = [];
  const layoutNodes: AuthorityLayoutNode[] = [];
  const positions = new Map<string, LayoutPoint>();

  let bandTop = M.CANVAS_PADDING;
  let bandHeight = 0;
  let widestBandColumns = 0;

  grouped.forEach((group, index) => {
    const bandIndex = Math.floor(index / columnsPerBand);
    const columnIndex = index % columnsPerBand;

    if (columnIndex === 0 && index > 0) {
      bandTop += bandHeight + M.BAND_GAP;
      bandHeight = 0;
    }

    const groupX =
      M.CANVAS_PADDING + columnIndex * (GROUP_REGION_WIDTH + M.GROUP_GAP);
    const groupY = bandTop;
    const groupHeight =
      M.GROUP_HEADER_HEIGHT +
      group.nodes.length * (M.NODE_HEIGHT + M.NODE_GAP) -
      M.NODE_GAP +
      M.GROUP_PADDING;

    groups.push({
      key: group.key,
      count: group.nodes.length,
      bandIndex,
      columnIndex,
      x: groupX,
      y: groupY,
      width: GROUP_REGION_WIDTH,
      height: groupHeight,
    });

    group.nodes.forEach((node, rowIndex) => {
      const x = groupX + M.GROUP_PADDING;
      const y =
        groupY + M.GROUP_HEADER_HEIGHT + rowIndex * (M.NODE_HEIGHT + M.NODE_GAP);
      const cx = x + M.NODE_WIDTH / 2;
      const cy = y + M.NODE_HEIGHT / 2;
      const label = shortenLabel(node.name);
      layoutNodes.push({
        id: node.id,
        node,
        groupKey: group.key,
        bandIndex,
        columnIndex,
        rowIndex,
        x,
        y,
        width: M.NODE_WIDTH,
        height: M.NODE_HEIGHT,
        cx,
        cy,
        labelLines: label.lines,
        labelTruncated: label.truncated,
      });
      positions.set(node.id, { cx, cy });
    });

    bandHeight = Math.max(bandHeight, groupHeight);
    widestBandColumns = Math.max(widestBandColumns, columnIndex + 1);
  });

  const usedColumns = Math.max(widestBandColumns, 1);
  const width =
    M.CANVAS_PADDING * 2 +
    usedColumns * GROUP_REGION_WIDTH +
    (usedColumns - 1) * M.GROUP_GAP;
  const contentBottom = grouped.length === 0 ? 0 : bandTop + bandHeight;
  const height = Math.max(
    M.MIN_CANVAS_HEIGHT,
    contentBottom + M.CANVAS_PADDING,
  );

  return {
    groupField,
    groups,
    nodes: layoutNodes,
    positions,
    width,
    height,
    columnsPerBand,
    isEmpty: layoutNodes.length === 0,
  };
}

/**
 * How many group regions fit side by side in `availableWidth`. Purely
 * arithmetic and deterministic for a given width; it never changes ordering,
 * grouping, or which records are shown. When not even one region fits, 1 is
 * returned and the caller's container scrolls horizontally.
 */
export function columnsForWidth(availableWidth: number, groupCount: number): number {
  const groups = Math.max(1, Math.floor(groupCount));
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return groups;
  const usable = availableWidth - M.CANVAS_PADDING * 2 + M.GROUP_GAP;
  const perColumn = GROUP_REGION_WIDTH + M.GROUP_GAP;
  const fits = Math.floor(usable / perColumn);
  return Math.min(groups, Math.max(1, fits));
}

/**
 * Phase 2A wrapping policy.
 *
 * Wide enough for two or more group regions: every group keeps its own column
 * in ONE lexical row, and the map container scrolls horizontally when the row
 * is wider than the viewport. Too narrow for two: each group takes the full
 * width and the groups stack vertically, so nothing is clipped and no label is
 * shrunk.
 *
 * A partially filled grid is deliberately avoided. Group sizes in this dataset
 * are very uneven, so a wrapped grid leaves a large empty region beside a short
 * column — blank space that carries no meaning but could be read as if it did.
 * One lexical row keeps the reading order unambiguous and the canvas compact.
 */
export function resolveColumnsPerBand(
  availableWidth: number,
  groupCount: number,
): number {
  const groups = Math.max(1, Math.floor(groupCount));
  return columnsForWidth(availableWidth, groups) <= 1 ? 1 : groups;
}

// --- Navigation-only routing selection ---------------------------------------

export type RoutingMode = "off" | "selected" | "global";

/**
 * Resolve the routing mode from the two existing, independent toggles. Routing
 * is off unless a toggle is explicitly enabled by the user; global routing
 * takes precedence when both are on. Never enabled implicitly.
 */
export function resolveRoutingMode(
  showSelected: boolean,
  showGlobal: boolean,
  selectedId: string | null,
): RoutingMode {
  if (showGlobal) return "global";
  if (showSelected && selectedId !== null) return "selected";
  return "off";
}

export interface RoutingSelectionOptions {
  readonly mode: RoutingMode;
  readonly selectedId: string | null;
  /** Ids that currently have a rendered position (i.e. are visible). */
  readonly renderedIds: ReadonlySet<string>;
}

/**
 * Select which EXISTING snapshot edges are drawn. This is a pure subset filter:
 * every returned element is the identical object from `edges`. No edge is
 * created, merged, aggregated, weighted, re-typed, or inferred, and no edge is
 * drawn unless both endpoints are currently rendered. All returned edges remain
 * navigation-only references.
 */
export function selectRoutingEdges(
  edges: readonly PublicSurfaceEdge[],
  options: RoutingSelectionOptions,
): readonly PublicSurfaceEdge[] {
  if (options.mode === "off") return [];
  const { renderedIds } = options;
  return edges.filter((edge) => {
    if (!renderedIds.has(edge.source) || !renderedIds.has(edge.target)) {
      return false;
    }
    if (options.mode === "global") return true;
    const active = options.selectedId;
    return active !== null && (edge.source === active || edge.target === active);
  });
}
