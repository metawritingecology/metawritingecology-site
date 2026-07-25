// Expanded Public Surface Adjacency Map — browser client module.
//
// Progressive enhancement ONLY. Everything this module adds sits on top of a
// complete server-rendered fallback: the 59-record list, every boundary
// statement, the legend, the counts, and the snapshot identity are already in
// the document before this file runs, and this module never removes them.
//
// Boundaries held here:
//   - only the 49 concept records enter the semantic layout; the 10 fixed-band
//     records render in separate bands and are never semantic-edge endpoints;
//   - node size is constant per presentation role, never derived from data, so
//     it can never encode degree, centrality, rank, or importance;
//   - edge visibility is a RENDER filter only. Positions are computed once from
//     the record set alone, so toggling a class cannot move a node, resize it,
//     or change any ordering;
//   - every string from the dataset is written with `textContent`, never as
//     HTML; only an approved HTTPS source-repository URL is ever set as an href;
//   - runtime activation is atomic: the whole view is rebuilt from ONE verified
//     snapshot, or the bundled fallback is retained untouched;
//   - no retry, no polling, no storage service, no service worker, no telemetry.

import { select, type Selection } from "d3-selection";

import {
  assertAdjacencySnapshot,
  fixedBandRecords,
  isApprovedSourceUrl,
  semanticLayoutRecords,
  EDGE_CLASSES,
  type AdjacencyEdgeClass,
  type AdjacencyNode,
  type AdjacencySnapshot,
} from "../lib/public-surface-adjacency-map/contract.ts";
import {
  ADJACENCY_LAYOUT_METRICS,
  buildNavigationIndex,
  columnsForWidth,
  computeFixedBands,
  computeSemanticLayout,
  directionForKey,
  firstReachableId,
  lastReachableId,
  resolveSpatialTarget,
  type FixedBandLayout,
  type SemanticLayout,
  type SpatialNavigationNode,
} from "../lib/public-surface-adjacency-map/layout.ts";
import {
  FALLBACK_STATUS_LABEL,
  RUNTIME_STATUS_LABEL,
  RUNTIME_UNAVAILABLE_LABEL,
} from "../lib/public-surface-adjacency-map/fallback.ts";
import { bootRuntimeLoader } from "../lib/public-surface-adjacency-map/runtimeLoader.ts";

const M = ADJACENCY_LAYOUT_METRICS;

const EDGE_CLASS_LABEL: Record<AdjacencyEdgeClass, string> = {
  source_named_adjacency: "Source-declared adjacency",
  navigation_adjacency: "Provisional navigation adjacency",
};

const ROLE_LABEL: Record<string, string> = {
  concept: "concept",
  orientation: "orientation",
  boundary: "boundary",
  anchor: "anchor",
};

interface ViewState {
  snapshot: AdjacencySnapshot;
  semantic: SemanticLayout;
  fixed: FixedBandLayout;
  navigation: SpatialNavigationNode[];
  visible: Record<AdjacencyEdgeClass, boolean>;
  selectedId: string | null;
  statusLabel: string;
}

// --- Boot -------------------------------------------------------------------

const root = document.querySelector<HTMLElement>("[data-psadj]");
if (root) enhance(root);

function enhance(container: HTMLElement): void {
  const dataScript = container.querySelector<HTMLScriptElement>("[data-psadj-data]");
  if (!dataScript || !dataScript.textContent) return;

  let bundled: AdjacencySnapshot;
  try {
    // The bundled payload was already identity- and contract-validated at build
    // time; it is revalidated here so the client never renders anything the
    // contract would refuse.
    bundled = assertAdjacencySnapshot(JSON.parse(dataScript.textContent));
  } catch {
    return; // keep the untouched server-rendered fallback
  }

  const canvas = container.querySelector<HTMLElement>("[data-psadj-canvas]");
  const controls = container.querySelector<HTMLElement>("[data-psadj-controls]");
  const details = container.querySelector<HTMLElement>("[data-psadj-details]");
  const live = container.querySelector<HTMLElement>("[data-psadj-live]");
  const runtimeStatus = container.querySelector<HTMLElement>("[data-psadj-runtime-status]");
  const noscriptNote = container.querySelector<HTMLElement>("[data-psadj-noscript]");
  if (!canvas || !controls || !details || !live) return;

  controls.hidden = false;
  canvas.hidden = false;
  details.hidden = false;
  if (noscriptNote) {
    noscriptNote.textContent =
      "The complete record list below stays server rendered and is always available.";
  }

  const state = buildState(bundled, FALLBACK_STATUS_LABEL, availableWidth(canvas));

  const render = () => {
    drawGraph(canvas, state);
    renderDetails(details, state);
  };

  // --- Edge-class toggles ---------------------------------------------------
  for (const input of container.querySelectorAll<HTMLInputElement>("[data-psadj-toggle]")) {
    const edgeClass = input.dataset.psadjToggle as AdjacencyEdgeClass;
    if (!EDGE_CLASSES.includes(edgeClass)) continue;
    input.checked = state.visible[edgeClass];
    input.addEventListener("change", () => {
      // A render filter only. `state.semantic` / `state.fixed` are never
      // recomputed here, so no position, size, or ordering can change.
      state.visible[edgeClass] = input.checked;
      render();
      announce(live, state, `${EDGE_CLASS_LABEL[edgeClass]} ${input.checked ? "shown" : "hidden"}.`);
    });
  }

  // --- Keyboard interaction -------------------------------------------------
  canvas.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    const currentId = target?.closest<SVGGElement>("[data-psadj-node]")?.dataset.psadjNode;
    if (!currentId) return;

    if (event.key === "Escape") {
      focusNode(canvas, currentId);
      event.preventDefault();
      return;
    }
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      selectNode(state, currentId);
      renderDetails(details, state);
      drawGraph(canvas, state);
      focusNode(canvas, currentId);
      announce(live, state, `${labelOf(state, currentId)} selected.`);
      event.preventDefault();
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      const targetId =
        event.key === "Home"
          ? firstReachableId(state.navigation)
          : lastReachableId(state.navigation);
      if (targetId) {
        focusNode(canvas, targetId);
        event.preventDefault();
      }
      return;
    }
    const direction = directionForKey(event.key);
    if (!direction) return;
    const nextId = resolveSpatialTarget(state.navigation, currentId, direction);
    if (nextId) {
      focusNode(canvas, nextId);
      event.preventDefault();
    }
  });

  // Details-panel Escape: return focus to the selected graph node.
  //
  // A SEPARATE listener on the details panel, because the canvas listener above
  // only sees events inside a `[data-psadj-node]` group. The details panel holds
  // a focusable canonical-source link, and an Escape pressed there never reaches
  // the canvas, so focus could not otherwise return to the graph.
  //
  // This handler moves FOCUS only. It never changes the selection, clears the
  // details, recomputes the layout, redraws the graph, issues a request, alters
  // edge visibility, or infers a fallback node. With no selected record it is a
  // no-op and the default Escape action is left alone.
  details.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.selectedId) {
      focusNode(canvas, state.selectedId);
      event.preventDefault();
    }
  });

  canvas.addEventListener("click", (event) => {
    const group = (event.target as HTMLElement | null)?.closest<SVGGElement>("[data-psadj-node]");
    const id = group?.dataset.psadjNode;
    if (!id) return;
    selectNode(state, id);
    render();
    focusNode(canvas, id);
    announce(live, state, `${labelOf(state, id)} selected.`);
  });

  // Re-layout on viewport change. Column count is a function of available width
  // only — never of edge visibility, selection, or any data-derived value.
  let lastColumns = state.semantic.columnsPerBand;
  window.addEventListener("resize", () => {
    const columns = columnsForWidth(
      availableWidth(canvas),
      new Set(semanticLayoutRecords(state.snapshot).map((n) => n.grouping)).size,
    );
    if (columns === lastColumns) return;
    lastColumns = columns;
    relayout(state, columns);
    render();
  });

  render();

  // --- Runtime activation (at most one manifest + one snapshot request) -----
  void bootRuntimeLoader().then((result) => {
    if (!result.ok) {
      state.statusLabel = RUNTIME_UNAVAILABLE_LABEL;
      if (runtimeStatus) runtimeStatus.textContent = RUNTIME_UNAVAILABLE_LABEL;
      announce(live, state, RUNTIME_UNAVAILABLE_LABEL + ".");
      return; // bundled fallback retained, untouched and un-mixed
    }
    // Atomic activation: ONE fully verified snapshot replaces the whole view.
    const next = buildState(result.snapshot, RUNTIME_STATUS_LABEL, availableWidth(canvas));
    next.visible = { ...state.visible };
    Object.assign(state, next);
    if (runtimeStatus) runtimeStatus.textContent = RUNTIME_STATUS_LABEL;
    render();
    announce(live, state, RUNTIME_STATUS_LABEL + ".");
  });
}

// --- State ------------------------------------------------------------------

function availableWidth(canvas: HTMLElement): number {
  const width = canvas.clientWidth;
  return Number.isFinite(width) && width > 0 ? width : 960;
}

function buildState(
  snapshot: AdjacencySnapshot,
  statusLabel: string,
  width: number,
): ViewState {
  const concepts = semanticLayoutRecords(snapshot);
  const groupCount = new Set(concepts.map((node) => node.grouping)).size;
  const columnsPerBand = columnsForWidth(width, groupCount);
  const semantic = computeSemanticLayout(concepts, { columnsPerBand });
  const fixed = computeFixedBands(fixedBandRecords(snapshot), { columnsPerBand });
  return {
    snapshot,
    semantic,
    fixed,
    navigation: buildNavigationIndex(semantic, fixed),
    // Fixed initial visibility: source-named on, navigation off.
    visible: { source_named_adjacency: true, navigation_adjacency: false },
    selectedId: null,
    statusLabel,
  };
}

function relayout(state: ViewState, columnsPerBand: number): void {
  const concepts = semanticLayoutRecords(state.snapshot);
  state.semantic = computeSemanticLayout(concepts, { columnsPerBand });
  state.fixed = computeFixedBands(fixedBandRecords(state.snapshot), { columnsPerBand });
  state.navigation = buildNavigationIndex(state.semantic, state.fixed);
}

function selectNode(state: ViewState, id: string): void {
  state.selectedId = state.selectedId === id ? null : id;
}

function nodeById(state: ViewState, id: string): AdjacencyNode | undefined {
  return state.snapshot.nodes.find((node) => node.id === id);
}

function labelOf(state: ViewState, id: string): string {
  return nodeById(state, id)?.display_label ?? id;
}

// --- Rendering --------------------------------------------------------------

function drawGraph(canvas: HTMLElement, state: ViewState): void {
  const { semantic, fixed } = state;
  const width = Math.max(semantic.width, fixed.width);
  const bandsTop = semantic.height + M.BAND_GAP;
  const height = bandsTop + fixed.height;

  const host = select(canvas);
  host.selectAll("*").remove();

  const svg = host
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "group")
    .attr("aria-label", "Expanded public surface adjacency graph");

  svg
    .append("title")
    .text(
      `Expanded public surface adjacency graph: ${semantic.nodes.length} concept records in the semantic layout and ${fixed.items.length} records in fixed bands.`,
    );
  svg
    .append("desc")
    .text(
      "Directed edges are drawn between concept records only. Source-declared adjacency uses a solid line with a filled arrow head; provisional navigation adjacency uses a dashed line with an open arrow head. Every record is also listed in full below this graph.",
    );

  appendArrowMarkers(svg);

  // --- Group regions --------------------------------------------------------
  const groups = svg.append("g").attr("class", "psadj-groups");
  for (const group of semantic.groups) {
    const node = groups.append("g").attr("class", "psadj-group");
    node
      .append("rect")
      .attr("x", group.x)
      .attr("y", group.y)
      .attr("width", group.width)
      .attr("height", group.height)
      .attr("rx", 4);
    node
      .append("text")
      .attr("class", "psadj-group-label")
      .attr("x", group.x + M.GROUP_PADDING)
      .attr("y", group.y + 22)
      .text(`${group.key} (${group.count})`);
  }

  // --- Edges (render filter only) -------------------------------------------
  const edgeLayer = svg.append("g").attr("class", "psadj-edges");
  for (const edge of state.snapshot.edges) {
    if (!state.visible[edge.edge_class]) continue;
    const from = semantic.positions.get(edge.source);
    const to = semantic.positions.get(edge.target);
    if (!from || !to) continue; // a non-concept record is never an endpoint
    edgeLayer
      .append("line")
      .attr("class", `psadj-edge psadj-edge--${edge.edge_class}`)
      .attr("x1", from.cx)
      .attr("y1", from.cy)
      .attr("x2", to.cx)
      .attr("y2", to.cy)
      .attr(
        "marker-end",
        edge.edge_class === "source_named_adjacency"
          ? "url(#psadj-arrow-filled)"
          : "url(#psadj-arrow-open)",
      );
  }

  // --- Concept records ------------------------------------------------------
  const nodeLayer = svg.append("g").attr("class", "psadj-nodes");
  for (const entry of semantic.nodes) {
    appendRecord(nodeLayer, {
      id: entry.id,
      node: entry.node,
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
      labelLines: entry.labelLines,
      selected: state.selectedId === entry.id,
    });
  }

  // --- Fixed bands ----------------------------------------------------------
  const bandLayer = svg.append("g").attr("class", "psadj-bands").attr("transform", `translate(0, ${bandsTop})`);
  for (const band of fixed.bands) {
    const bandGroup = bandLayer.append("g").attr("class", "psadj-band");
    bandGroup
      .append("rect")
      .attr("x", M.CANVAS_PADDING / 2)
      .attr("y", band.y)
      .attr("width", Math.max(fixed.width - M.CANVAS_PADDING, M.BAND_ITEM_WIDTH))
      .attr("height", band.height)
      .attr("rx", 4);
    bandGroup
      .append("text")
      .attr("class", "psadj-band-label")
      .attr("x", M.CANVAS_PADDING)
      .attr("y", band.y + 20)
      .text(`${ROLE_LABEL[band.role] ?? band.role} band (${band.count}) — outside the semantic layout`);
    for (const item of band.items) {
      appendRecord(bandGroup, {
        id: item.id,
        node: item.node,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        labelLines: item.labelLines,
        selected: state.selectedId === item.id,
      });
    }
  }
}

function appendArrowMarkers(svg: Selection<SVGSVGElement, unknown, null, undefined>): void {
  const defs = svg.append("defs");
  const filled = defs
    .append("marker")
    .attr("id", "psadj-arrow-filled")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 9)
    .attr("refY", 5)
    .attr("markerWidth", 7)
    .attr("markerHeight", 7)
    .attr("orient", "auto-start-reverse");
  filled.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "currentColor");

  const open = defs
    .append("marker")
    .attr("id", "psadj-arrow-open")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 9)
    .attr("refY", 5)
    .attr("markerWidth", 7)
    .attr("markerHeight", 7)
    .attr("orient", "auto-start-reverse");
  open
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1.4);
}

interface RecordVisual {
  id: string;
  node: AdjacencyNode;
  x: number;
  y: number;
  width: number;
  height: number;
  labelLines: readonly string[];
  selected: boolean;
}

function appendRecord(
  parent: Selection<SVGGElement, unknown, null, undefined>,
  visual: RecordVisual,
): void {
  const group = parent
    .append("g")
    .attr("class", "psadj-node")
    .attr("data-psadj-node", visual.id)
    .attr("data-selected", visual.selected ? "true" : "false")
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-pressed", visual.selected ? "true" : "false")
    // The accessible name carries the FULL untruncated label plus the role, so
    // a shortened on-canvas label never becomes the accessible name.
    .attr(
      "aria-label",
      `${visual.node.display_label}. ${ROLE_LABEL[visual.node.visualization_role] ?? visual.node.visualization_role} record.`,
    );

  group
    .append("rect")
    .attr("x", visual.x)
    .attr("y", visual.y)
    .attr("width", visual.width)
    .attr("height", visual.height)
    .attr("rx", 4);

  const text = group
    .append("text")
    .attr("x", visual.x + 10)
    .attr("y", visual.y + 20)
    .attr("aria-hidden", "true");
  visual.labelLines.forEach((line, index) => {
    text
      .append("tspan")
      .attr("x", visual.x + 10)
      .attr("dy", index === 0 ? 0 : 14)
      // Dataset strings are always written as text, never as HTML.
      .text(line);
  });
}

function renderDetails(details: HTMLElement, state: ViewState): void {
  const title = details.querySelector<HTMLElement>("[data-psadj-details-title]");
  const body = details.querySelector<HTMLElement>("[data-psadj-details-body]");
  if (!title || !body) return;

  body.textContent = "";
  if (!state.selectedId) {
    title.textContent = "No record selected";
    return;
  }
  const node = nodeById(state, state.selectedId);
  if (!node) {
    title.textContent = "No record selected";
    return;
  }

  title.textContent = node.display_label;
  appendField(body, "Visualization role", node.visualization_role);
  appendField(body, "Grouping", node.grouping);
  appendField(body, "Grouping source", node.grouping_source);
  appendField(body, "Relation evidence ceiling", node.relation_evidence_ceiling);
  appendField(
    body,
    "Semantic layout",
    node.semantic_layout_participation ? "participates" : "fixed band, outside the layout",
  );

  const row = document.createElement("div");
  row.className = "psadj__status-row";
  const term = document.createElement("dt");
  term.textContent = "Canonical source";
  const value = document.createElement("dd");
  if (isApprovedSourceUrl(node.canonical_public_url, node.repository_path)) {
    const link = document.createElement("a");
    link.href = node.canonical_public_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = node.repository_path;
    value.appendChild(link);
  } else {
    const code = document.createElement("code");
    code.textContent = node.repository_path;
    value.appendChild(code);
  }
  row.append(term, value);
  body.appendChild(row);
}

function appendField(body: HTMLElement, label: string, value: string): void {
  const row = document.createElement("div");
  row.className = "psadj__status-row";
  const term = document.createElement("dt");
  term.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  row.append(term, dd);
  body.appendChild(row);
}

function focusNode(canvas: HTMLElement, id: string): void {
  const target = canvas.querySelector<SVGGElement>(`[data-psadj-node="${cssEscape(id)}"]`);
  if (target && typeof target.focus === "function") target.focus();
}

/** Escape an id for use inside an attribute selector without any HTML parsing. */
function cssEscape(value: string): string {
  const escaper = (globalThis as { CSS?: { escape?: (input: string) => string } }).CSS;
  if (escaper && typeof escaper.escape === "function") return escaper.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function announce(live: HTMLElement, state: ViewState, message: string): void {
  const shown = EDGE_CLASSES.filter((edgeClass) => state.visible[edgeClass])
    .map((edgeClass) => EDGE_CLASS_LABEL[edgeClass])
    .join(", ");
  const hidden = EDGE_CLASSES.filter((edgeClass) => !state.visible[edgeClass])
    .map((edgeClass) => EDGE_CLASS_LABEL[edgeClass])
    .join(", ");
  live.textContent = `${message} ${state.statusLabel}. Shown: ${shown || "none"}. Hidden: ${hidden || "none"}.`;
}
