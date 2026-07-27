// Expanded Public Surface Adjacency Map — neighbourhood emphasis.
//
// A PURE module: no DOM, no D3, no browser API, no randomness, no time, no
// mutation of its inputs.
//
// Emphasis is a PRESENTATION state and nothing else. Its only source of truth
// is the verified snapshot edge set, subject to the same class-visibility state
// the visitor already controls. It therefore cannot reveal a relation that the
// visitor has switched off, and cannot invent one that the dataset never
// recorded.
//
// It may raise the opacity of a selected record, its incident edges and its
// adjacent records, and reduce unrelated records to the legibility floor.
//
// It may NOT move a node, resize a glyph, change a coordinate, change a path
// string, add or infer an edge, reveal a currently disabled edge class, alter
// the viewport, change record order, change semantic state, or take any part in
// keyboard navigation. The return shape below carries no coordinate, no path,
// no order and no semantic field, which is what makes that last guarantee
// structural rather than a promise.

import type { AdjacencyEdge, AdjacencyEdgeClass } from "./contract.ts";

export interface EmphasisInput {
  /** The currently selected record, or null when nothing is selected. */
  readonly selectedId: string | null;
  /** The verified snapshot edges. Never a superset, never an inferred edge. */
  readonly edges: readonly AdjacencyEdge[];
  /** Current edge-class visibility, exactly as the toolbar toggles set it. */
  readonly visible: Readonly<Record<AdjacencyEdgeClass, boolean>>;
}

export interface EmphasisSets {
  /** Record ids adjacent to the selection through a currently visible edge. */
  readonly nodeIds: ReadonlySet<string>;
  /** Edge ids incident to the selection and currently visible. */
  readonly edgeIds: ReadonlySet<string>;
}

const EMPTY: EmphasisSets = Object.freeze({
  nodeIds: Object.freeze(new Set<string>()) as ReadonlySet<string>,
  edgeIds: Object.freeze(new Set<string>()) as ReadonlySet<string>,
});

/**
 * The emphasis neighbourhood of the current selection.
 *
 * With no selection there is no emphasis at all, so the rest state is a plain
 * empty result rather than a special case elsewhere.
 *
 * An edge participates only when its class is currently visible. That single
 * condition is what prevents emphasis from leaking a disabled class: a
 * neighbour reachable ONLY through a hidden class is simply absent.
 */
export function resolveEmphasis(input: EmphasisInput): EmphasisSets {
  if (input.selectedId === null) return EMPTY;

  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  for (const edge of input.edges) {
    if (!input.visible[edge.edge_class]) continue;
    if (edge.source === input.selectedId) {
      edgeIds.add(edge.id);
      nodeIds.add(edge.target);
    } else if (edge.target === input.selectedId) {
      edgeIds.add(edge.id);
      nodeIds.add(edge.source);
    }
  }

  // The selection itself is not an emphasised NEIGHBOUR; it carries its own
  // selected state, so including it here would double-encode one record.
  nodeIds.delete(input.selectedId);

  return { nodeIds, edgeIds };
}
