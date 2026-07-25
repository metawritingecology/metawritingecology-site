// Public Surface and Authority-Ceiling Map — Phase 2A D3 SVG renderer
// (Phase 2B-1: one containing viewport group).
//
// D3 (`d3-selection` only) owns the visual map's data join and SVG rendering.
// The coordinates it draws come entirely from the pure, deterministic layout
// module (`./d3AuthorityLayout.ts`); this file adds no geometry of its own
// beyond fixed text offsets, and computes nothing semantic.
//
// Phase 2B-1 adds exactly one structural change: the group regions, the edges,
// and the nodes are drawn inside a single containing viewport group, and the
// bounded transient transform from `./d3AuthorityViewport.ts` is applied to THAT
// group alone. Nodes and edges therefore always share one transform, and no
// content coordinate is recomputed when the viewport changes.
//
// Hard boundaries preserved here:
//   - locally installed npm package only — no CDN, no remote ESM, no runtime
//     package loading, no iframe, no external visualization service;
//   - no d3-force, d3-drag, d3-zoom, d3-hierarchy, geo, canvas, or WebGL;
//   - every node box is rendered at the SAME fixed size; size and position are
//     never derived from edge count, degree, rank, or any score;
//   - node fill/stroke encode only selection and focus UI STATE; the only
//     metadata-driven visual difference is the edge stroke, which distinguishes
//     the two existing `relation_type` values with equal weight;
//   - edges are drawn only from snapshot edges chosen by the pure selector; no
//     edge is synthesized, aggregated, weighted, or animated;
//   - all text is written with `textContent` (D3 `.text()`); `.html()`,
//     `innerHTML`, `eval`, and `new Function` are never used;
//   - links are not constructed here at all — canonical source links stay in
//     the existing detail panel and record table under the source-link
//     contract.

import { select, type Selection } from "d3-selection";

import type { PublicSurfaceEdge } from "./contract.ts";
import type {
  AuthorityLayout,
  AuthorityLayoutGroup,
  AuthorityLayoutNode,
} from "./d3AuthorityLayout.ts";
import type { ViewportSurface } from "./d3AuthorityViewport.ts";

// Fixed text geometry (CSS pixels). Constants, never data-derived.
const GLYPH_X = 15;
const GLYPH_RADIUS = 4;
const LABEL_X = 30;
const LABEL_LINE_HEIGHT = 16;
const LABEL_BASELINE_NUDGE = 4.5;
const GROUP_LABEL_Y = 18;
const GROUP_COUNT_Y = 34;
const NODE_CORNER_RADIUS = 6;
const GROUP_CORNER_RADIUS = 8;

export interface AuthorityRendererCallbacks {
  /** Invoked on click, Enter, or Space on a rendered node. */
  readonly onActivate: (id: string) => void;
}

export interface AuthorityRenderState {
  readonly layout: AuthorityLayout;
  /** Already-selected existing snapshot edges. Rendered verbatim. */
  readonly edges: readonly PublicSurfaceEdge[];
  readonly selectedId: string | null;
  /**
   * Transient viewport surface. Presentation only: it sets the SVG box and the
   * one containing group's transform, and never participates in layout.
   */
  readonly viewport: ViewportSurface;
}

export interface AuthorityRenderer {
  /** Draw one complete, deterministic frame. */
  render(state: AuthorityRenderState): void;
  /** Rendered node elements by node id (empty before the first render). */
  readonly nodeElements: ReadonlyMap<string, SVGGElement>;
  /** Replace the rendered node-element index (used by activation rollback). */
  adoptNodeElements(next: Map<string, SVGGElement>): void;
  /** Remove every rendered layer. */
  clear(): void;
}

type AnySelection = Selection<SVGGElement, unknown, null, undefined>;

function accessibleNodeLabel(node: AuthorityLayoutNode): string {
  const record = node.node;
  return (
    `${record.name} — surface role ${record.surface_role}; ` +
    `public-surface status ${record.public_surface_status}; ` +
    `authority ceiling ${record.authority_ceiling}. Navigation only.`
  );
}

function edgeDescription(edge: PublicSurfaceEdge): string {
  return edge.relation_type === "boundary_reference"
    ? "Boundary reference. Navigation only."
    : "Source-use reference. Navigation only.";
}

/**
 * Ensure a `<g class="…">` layer exists under `parent` and return it.
 * Re-selected on every render so a rollback that restores previously captured
 * SVG children is picked up unchanged rather than duplicated.
 */
function ensureLayer<ParentElement extends SVGSVGElement | SVGGElement>(
  parent: Selection<ParentElement, unknown, null, undefined>,
  className: string,
): AnySelection {
  const existing = parent.select<SVGGElement>(`g.${className}`);
  if (!existing.empty()) return existing;
  return parent.append("g").attr("class", className);
}

export function createAuthorityRenderer(
  svg: SVGSVGElement,
  callbacks: AuthorityRendererCallbacks,
): AuthorityRenderer {
  const root = select<SVGSVGElement, unknown>(svg);
  let nodeElements = new Map<string, SVGGElement>();

  function render(state: AuthorityRenderState): void {
    const { layout, edges, selectedId, viewport } = state;

    // Responsive, deterministic canvas: the intrinsic size comes from the
    // layout, resolved through the bounded viewport surface. At the identity
    // transform the surface IS the layout canvas, so this reproduces the
    // Phase 2A.1 drawing exactly. The container scrolls when the surface is
    // wider than the visible box; labels are never scaled down by the layout.
    root
      .attr("width", String(viewport.width))
      .attr("height", String(viewport.height))
      .attr("viewBox", viewport.viewBox);

    // ONE containing viewport group holds group regions, edges, and nodes, and
    // carries the transient transform. Nodes and edges never receive separate
    // transforms, so routing stays aligned with node centres at every viewport
    // state without recomputing a single coordinate.
    const viewportLayer = ensureLayer(root, "psam__layer--viewport").attr(
      "transform",
      viewport.transformAttr,
    );

    const groupLayer = ensureLayer(viewportLayer, "psam__layer--groups");
    const edgeLayer = ensureLayer(viewportLayer, "psam__layer--edges");
    const nodeLayer = ensureLayer(viewportLayer, "psam__layer--nodes");

    // --- Group regions -------------------------------------------------------
    groupLayer
      .selectAll<SVGGElement, AuthorityLayoutGroup>("g.psam__group-region")
      .data(layout.groups, (group) => group.key)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "psam__group-region")
            .attr("role", "group");
          g.append("rect").attr("class", "psam__group-frame");
          g.append("text").attr("class", "psam__group-label");
          g.append("text").attr("class", "psam__group-count");
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("transform", (group) => `translate(${group.x},${group.y})`)
      .attr("aria-label", (group) => `${group.key} — ${group.count} records`)
      .call((selection) => {
        selection
          .select<SVGRectElement>("rect.psam__group-frame")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", (group) => group.width)
          .attr("height", (group) => group.height)
          .attr("rx", GROUP_CORNER_RADIUS);
        selection
          .select<SVGTextElement>("text.psam__group-label")
          .attr("x", 10)
          .attr("y", GROUP_LABEL_Y)
          .text((group) => group.key);
        selection
          .select<SVGTextElement>("text.psam__group-count")
          .attr("x", 10)
          .attr("y", GROUP_COUNT_Y)
          .text((group) => `${group.count} records`);
      });

    // --- Navigation-only routing --------------------------------------------
    // Straight lines between two already-rendered node centres. Both relation
    // types use the same stroke width and the same opacity; only hue and dash
    // pattern differ, so neither type reads as stronger than the other.
    edgeLayer
      .attr("aria-hidden", "true")
      .selectAll<SVGLineElement, PublicSurfaceEdge>("line.psam__edge")
      .data(edges, (edge) => edge.id)
      .join(
        (enter) => {
          const line = enter.append("line");
          line.append("title");
          return line;
        },
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("class", (edge) => `psam__edge psam__edge--${edge.relation_type}`)
      .attr("x1", (edge) => layout.positions.get(edge.source)?.cx ?? 0)
      .attr("y1", (edge) => layout.positions.get(edge.source)?.cy ?? 0)
      .attr("x2", (edge) => layout.positions.get(edge.target)?.cx ?? 0)
      .attr("y2", (edge) => layout.positions.get(edge.target)?.cy ?? 0)
      .call((selection) => {
        selection.select<SVGTitleElement>("title").text(edgeDescription);
      });

    // --- Nodes ---------------------------------------------------------------
    const nodes = nodeLayer
      .selectAll<SVGGElement, AuthorityLayoutNode>("g.psam__node")
      .data(layout.nodes, (node) => node.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "psam__node")
            .attr("role", "button")
            .attr("tabindex", 0);
          g.append("title");
          g.append("rect").attr("class", "psam__node-shape");
          g.append("circle").attr("class", "psam__node-glyph");
          g.append("text").attr("class", "psam__node-label");
          g.on("click", (_event: MouseEvent, node: AuthorityLayoutNode) => {
            callbacks.onActivate(node.id);
          });
          g.on("keydown", (event: KeyboardEvent, node: AuthorityLayoutNode) => {
            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
              event.preventDefault();
              callbacks.onActivate(node.id);
            }
          });
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      );

    nodes
      .attr("transform", (node) => `translate(${node.x},${node.y})`)
      .attr("data-id", (node) => node.id)
      .attr("aria-pressed", (node) => (node.id === selectedId ? "true" : "false"))
      .attr("aria-label", accessibleNodeLabel)
      .classed("psam__node--selected", (node) => node.id === selectedId);

    // Full document name stays reachable from the visual node itself.
    nodes.select<SVGTitleElement>("title").text((node) => node.node.name);

    nodes
      .select<SVGRectElement>("rect.psam__node-shape")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (node) => node.width)
      .attr("height", (node) => node.height)
      .attr("rx", NODE_CORNER_RADIUS);

    nodes
      .select<SVGCircleElement>("circle.psam__node-glyph")
      .attr("cx", GLYPH_X)
      .attr("cy", (node) => node.height / 2)
      .attr("r", GLYPH_RADIUS);

    // Multi-line label via tspans. Written with textContent only.
    nodes
      .select<SVGTextElement>("text.psam__node-label")
      .attr("x", LABEL_X)
      .attr("aria-hidden", "true")
      .each(function renderLabel(this: SVGTextElement, node: AuthorityLayoutNode) {
        const lines = node.labelLines;
        const first =
          (node.height - (lines.length - 1) * LABEL_LINE_HEIGHT) / 2 +
          LABEL_BASELINE_NUDGE;
        select(this)
          .selectAll<SVGTSpanElement, string>("tspan")
          .data(lines)
          .join("tspan")
          .attr("x", LABEL_X)
          .attr("y", (_line, index) => first + index * LABEL_LINE_HEIGHT)
          .text((line) => line);
      });

    // Refresh the element index in deterministic layout order.
    const nextElements = new Map<string, SVGGElement>();
    nodes.each(function indexNode(this: SVGGElement, node: AuthorityLayoutNode) {
      nextElements.set(node.id, this);
    });
    nodeElements = nextElements;
  }

  return {
    render,
    get nodeElements(): ReadonlyMap<string, SVGGElement> {
      return nodeElements;
    },
    adoptNodeElements(next: Map<string, SVGGElement>): void {
      nodeElements = next;
    },
    clear(): void {
      // Remove the SVG's DIRECT children only. Each removed layer keeps its own
      // subtree, so a capture taken before the teardown still holds the complete
      // drawing and an activation rollback restores real SVG content rather than
      // empty layer shells. A descendant-wide removal would detach every node,
      // group, and edge from its layer as well, emptying the very elements the
      // rollback path reinstates.
      root.selectChildren().remove();
      nodeElements = new Map<string, SVGGElement>();
    },
  };
}
