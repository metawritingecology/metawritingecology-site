// Public Surface and Authority-Ceiling Map — Phase 2B-2 spatial keyboard
// navigation.
//
// A PURE module: no DOM, no D3, no browser API, no randomness, no time, no host
// locale, no storage, and no mutation of its inputs. It answers exactly one
// question: given the nodes the deterministic layout is CURRENTLY rendering and
// one focused node id, which node id sits immediately above, below, left, or
// right of it in that rendering?
//
// The answer is read from the layout's own transient rendering indices
// (`bandIndex`, `columnIndex`, `rowIndex`) and from nothing else. In particular
// this module never receives, reads, traverses, or derives:
//   - snapshot edges, relation types, relation status, or routing state;
//   - authority ceiling, surface role, public-surface status, Registry status,
//     classification evidence, model family, or currentness;
//   - node degree, centrality, connectivity, rank, weight, importance,
//     similarity, distance, clustering, hierarchy, or sequence;
//   - selection state, viewport state, zoom, scroll position, or pixel
//     measurements.
//
// Semantic boundary: the visual column and row structure is a TRANSIENT
// rendering organization produced by grouping, deterministic code-unit order,
// and responsive wrapping. Two nodes being arrow-adjacent therefore states
// nothing about them. It is not a relation, an adjacency claim, a similarity, a
// causal direction, a hierarchy, a sequence, an authority, an importance, or a
// centrality. Moving focus is navigation only; it selects nothing and activates
// nothing.
//
// No wrapping is implemented in any direction: not from the last node to the
// first, not between bands, not from the final group column of one band to the
// first column of another, and not from the bottom of one group column to
// another. A boundary is a no-op. The existing visible-group select already
// provides explicit cross-group access, and no navigation target is preferable
// to an implicit structural jump.

import { compareText } from "./d3AuthorityLayout.ts";

/** The four supported focus-navigation directions. Nothing else is handled. */
export type SpatialDirection = "up" | "down" | "left" | "right";

/** The complete supported direction set, in a fixed order. */
export const SPATIAL_DIRECTIONS: readonly SpatialDirection[] = Object.freeze([
  "up",
  "down",
  "left",
  "right",
]);

/**
 * The ONLY shape this module accepts: a node's id plus the three transient
 * rendering indices the deterministic layout assigned it. `AuthorityLayoutNode`
 * satisfies this structurally, so callers pass `layout.nodes` directly — but the
 * declared surface admits no edge, no relation type, no metadata field, no
 * viewport value, and no selection value, so none can reach the algorithm.
 */
export interface SpatialNavigationNode {
  readonly id: string;
  readonly bandIndex: number;
  readonly columnIndex: number;
  readonly rowIndex: number;
}

/**
 * Map one keyboard key to a supported direction. Only the four exact arrow key
 * values are recognized; every other key — including WASD, Vim keys, numeric
 * shortcuts, Home/End, and PageUp/PageDown — returns `null` and is left entirely
 * to the browser and to the existing Enter/Space activation.
 */
export function directionForKey(key: string): SpatialDirection | null {
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  return null;
}

/** Find one currently rendered node by exact id. Read-only. */
function findRendered(
  nodes: readonly SpatialNavigationNode[],
  id: string | null,
): SpatialNavigationNode | null {
  if (id === null) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
  }
  return null;
}

/**
 * Exact final tiebreak. The deterministic layout never assigns two rendered
 * nodes the same (band, column, row) triple, so this cannot decide a real
 * target; it exists so the result stays independent of the order the caller
 * happens to hold its array in even for a degenerate input. Code-unit
 * comparison only — no collation API, no host locale.
 */
function preferById(
  candidate: SpatialNavigationNode,
  incumbent: SpatialNavigationNode,
): boolean {
  return compareText(candidate.id, incumbent.id) < 0;
}

/**
 * The immediately preceding or following row in the SAME deterministic group
 * column. `step` is -1 for up (greatest row smaller than the current row) and +1
 * for down (smallest row greater than the current row). No other column, no
 * other band, and no wrap.
 */
function resolveVertical(
  nodes: readonly SpatialNavigationNode[],
  current: SpatialNavigationNode,
  step: -1 | 1,
): SpatialNavigationNode | null {
  let best: SpatialNavigationNode | null = null;
  for (const node of nodes) {
    if (node.bandIndex !== current.bandIndex) continue;
    if (node.columnIndex !== current.columnIndex) continue;
    if (step === -1 ? node.rowIndex >= current.rowIndex : node.rowIndex <= current.rowIndex) {
      continue;
    }
    if (best === null) {
      best = node;
      continue;
    }
    // Up wants the LARGEST qualifying row; down the SMALLEST.
    if (step === -1 ? node.rowIndex > best.rowIndex : node.rowIndex < best.rowIndex) {
      best = node;
    } else if (node.rowIndex === best.rowIndex && preferById(node, best)) {
      best = node;
    }
  }
  return best;
}

/**
 * The group column immediately to the left or right IN THE SAME BAND. `step` is
 * -1 for left (greatest column smaller than the current column) and +1 for right
 * (smallest column greater than the current column).
 *
 * Inside that one adjacent column the target is the node whose `rowIndex` is
 * closest to the current row. An equal distance resolves to the SMALLER row
 * index. A shorter column therefore naturally yields its last available nearby
 * row. No band is crossed and nothing wraps.
 */
function resolveHorizontal(
  nodes: readonly SpatialNavigationNode[],
  current: SpatialNavigationNode,
  step: -1 | 1,
): SpatialNavigationNode | null {
  // 1. The adjacent column index, chosen from rendered nodes only.
  let column: number | null = null;
  for (const node of nodes) {
    if (node.bandIndex !== current.bandIndex) continue;
    if (step === -1 ? node.columnIndex >= current.columnIndex : node.columnIndex <= current.columnIndex) {
      continue;
    }
    if (column === null) {
      column = node.columnIndex;
      continue;
    }
    if (step === -1 ? node.columnIndex > column : node.columnIndex < column) {
      column = node.columnIndex;
    }
  }
  if (column === null) return null;

  // 2. The nearest row inside that column; equal distance prefers the smaller
  //    row index.
  let best: SpatialNavigationNode | null = null;
  let bestRowGap = 0;
  for (const node of nodes) {
    if (node.bandIndex !== current.bandIndex) continue;
    if (node.columnIndex !== column) continue;
    const rowGap = Math.abs(node.rowIndex - current.rowIndex);
    if (best === null) {
      best = node;
      bestRowGap = rowGap;
      continue;
    }
    if (rowGap < bestRowGap) {
      best = node;
      bestRowGap = rowGap;
    } else if (rowGap === bestRowGap) {
      if (node.rowIndex < best.rowIndex) {
        best = node;
      } else if (node.rowIndex === best.rowIndex && preferById(node, best)) {
        best = node;
      }
    }
  }
  return best;
}

/**
 * Resolve the deterministic focus-navigation target for one direction.
 *
 * Returns the target node's id, or `null` when there is no target — an empty
 * rendered set, a `currentId` that is not currently rendered, or a layout
 * boundary in the requested direction. `null` means "remain on the current
 * node": the caller performs no focus move at all.
 *
 * Pure and total: `nodes` and every element of it are only read, never sorted,
 * reordered, or written, and the result depends on nothing but the values of the
 * three rendering indices and (for a degenerate exact tie) the node ids.
 */
export function resolveSpatialTarget(
  nodes: readonly SpatialNavigationNode[],
  currentId: string | null,
  direction: SpatialDirection,
): string | null {
  const current = findRendered(nodes, currentId);
  if (current === null) return null;

  let target: SpatialNavigationNode | null = null;
  if (direction === "up") {
    target = resolveVertical(nodes, current, -1);
  } else if (direction === "down") {
    target = resolveVertical(nodes, current, 1);
  } else if (direction === "left") {
    target = resolveHorizontal(nodes, current, -1);
  } else {
    target = resolveHorizontal(nodes, current, 1);
  }

  if (target === null || target.id === current.id) return null;
  return target.id;
}
