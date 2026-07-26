// Expanded Public Surface Adjacency Map — browser client module.
//
// Progressive enhancement ONLY. Everything this module adds sits on top of a
// complete server-rendered fallback: the 59-record list, every boundary
// statement, the legend, the counts, and the snapshot identity are already in
// the document before this file runs, and this module never removes them.
//
// Boundaries held here:
//   - only the 49 concept records enter the concept ring; the 10 role records
//     sit on a separate outer orbit and are never semantic-edge endpoints;
//   - glyph footprint is constant per presentation role, never derived from
//     data, so it can never encode degree, centrality, rank, or importance;
//   - edge visibility is a RENDER filter only. Positions are computed once from
//     the record set alone, so toggling a class cannot move a record, resize
//     it, or change any ordering;
//   - every string from the dataset is written with `textContent`, never as
//     HTML; only an approved HTTPS source-repository URL is ever set as an href;
//   - runtime activation is atomic: the whole view is rebuilt from ONE verified
//     snapshot, or the bundled fallback is retained untouched;
//   - no retry, no polling, no storage service, no service worker, no telemetry.
//
// P7.1 rendering contract:
//   - the SVG, its five layers, the single viewport wrapper and all 59 record
//     controls are AUTHORED in the component. This module binds to them by key.
//     It never creates, replaces, removes or reorders a layer or a record
//     control, and there is no teardown step;
//   - no custom Tab or Shift+Tab handler is installed and Tab is never
//     prevented, because native sequential focus order over the authored
//     controls IS the complete keyboard-reachability surface;
//   - arrow keys are a local spatial accelerator resolved purely from
//     coordinates. A null result changes nothing at all.
//
// P7.1 contains no viewport implementation: no zoom, pan, drag, pinch, pointer
// capture, grouping-arc activation, or +/-/0 shortcut, and no placeholder or
// dead branch for any of them.

import { select } from "d3-selection";

import {
  assertAdjacencySnapshot,
  isApprovedSourceUrl,
  EDGE_CLASSES,
  type AdjacencyEdgeClass,
  type AdjacencyNode,
  type AdjacencySnapshot,
} from "../lib/public-surface-adjacency-map/contract.ts";
import {
  buildDirectionalIndex,
  computeEdgeRouting,
  directionForKey,
  firstReachableId,
  GRAPH_RECORD_ORDER,
  lastReachableId,
  resolveDirectionalTarget,
  resolveReadoutLabel,
  type DirectionalIndex,
  type RoutedEdge,
} from "../lib/public-surface-adjacency-map/layout.ts";
import { resolveEmphasis } from "../lib/public-surface-adjacency-map/emphasis.ts";
import {
  FALLBACK_STATUS_LABEL,
  RUNTIME_STATUS_LABEL,
  RUNTIME_UNAVAILABLE_LABEL,
} from "../lib/public-surface-adjacency-map/fallback.ts";
import { READOUT_NEUTRAL_TEXT } from "../lib/public-surface-adjacency-map/publicWording.ts";
import { bootRuntimeLoader } from "../lib/public-surface-adjacency-map/runtimeLoader.ts";

const EDGE_CLASS_LABEL: Record<AdjacencyEdgeClass, string> = {
  source_named_adjacency: "Source-declared adjacency",
  navigation_adjacency: "Provisional navigation adjacency",
};

interface ViewState {
  snapshot: AdjacencySnapshot;
  routed: RoutedEdge[];
  navigation: DirectionalIndex;
  labels: Map<string, string>;
  visible: Record<AdjacencyEdgeClass, boolean>;
  selectedId: string | null;
  focusedId: string | null;
  hoveredId: string | null;
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
  const readout = container.querySelector<HTMLElement>("[data-psadj-label-readout]");
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

  const state = buildState(bundled, FALLBACK_STATUS_LABEL);

  const render = () => {
    drawGraph(canvas, state);
    renderDetails(details, state);
    renderReadout(readout, state);
  };

  // --- Edge-class toggles ---------------------------------------------------
  for (const input of container.querySelectorAll<HTMLInputElement>("[data-psadj-toggle]")) {
    const edgeClass = input.dataset.psadjToggle as AdjacencyEdgeClass;
    if (!EDGE_CLASSES.includes(edgeClass)) continue;
    input.checked = state.visible[edgeClass];
    input.addEventListener("change", () => {
      // A render filter only. Coordinates and routing are never recomputed
      // here, so no position, footprint, or ordering can change.
      state.visible[edgeClass] = input.checked;
      render();
      announce(live, state, `${EDGE_CLASS_LABEL[edgeClass]} ${input.checked ? "shown" : "hidden"}.`);
    });
  }

  // --- Keyboard interaction -------------------------------------------------
  //
  // No Tab or Shift+Tab branch exists here. Sequential traversal of all 59
  // authored record controls is native browser behaviour over authored DOM
  // order, and intercepting it would replace a guarantee with an imitation.
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
      renderReadout(readout, state);
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
    const nextId = resolveDirectionalTarget(state.navigation, currentId, direction);
    // A null result is a normal outcome: focus, selection and presentation all
    // stay exactly as they are, and the key is not consumed.
    if (nextId) {
      focusNode(canvas, nextId);
      event.preventDefault();
    }
  });

  // Details-panel Escape: return focus to the selected graph record.
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

  // --- Readout state ---------------------------------------------------------
  //
  // Focus state is cleared ONLY by actual focus departure — never by selection,
  // hover or any other operation. Hover is tracked separately and can never
  // overwrite a keyboard-focused record's label, because the precedence resolver
  // ranks focus above hover.
  canvas.addEventListener("focusin", (event) => {
    const id = (event.target as HTMLElement | null)?.closest<SVGGElement>("[data-psadj-node]")
      ?.dataset.psadjNode;
    if (!id) return;
    state.focusedId = id;
    renderReadout(readout, state);
  });

  canvas.addEventListener("focusout", (event) => {
    const next = (event as FocusEvent).relatedTarget as HTMLElement | null;
    if (next && next.closest("[data-psadj-node]")) return;
    state.focusedId = null;
    renderReadout(readout, state);
  });

  canvas.addEventListener("pointerover", (event) => {
    const id = (event.target as HTMLElement | null)?.closest<SVGGElement>("[data-psadj-node]")
      ?.dataset.psadjNode;
    if (!id || id === state.hoveredId) return;
    state.hoveredId = id;
    renderReadout(readout, state);
  });

  canvas.addEventListener("pointerout", (event) => {
    const next = (event as PointerEvent).relatedTarget as HTMLElement | null;
    if (next && next.closest("[data-psadj-node]")) return;
    state.hoveredId = null;
    renderReadout(readout, state);
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
    const next = buildState(result.snapshot, RUNTIME_STATUS_LABEL);
    next.visible = { ...state.visible };
    Object.assign(state, next);
    if (runtimeStatus) runtimeStatus.textContent = RUNTIME_STATUS_LABEL;
    render();
    announce(live, state, RUNTIME_STATUS_LABEL + ".");
  });
}

// --- State ------------------------------------------------------------------

function buildState(snapshot: AdjacencySnapshot, statusLabel: string): ViewState {
  return {
    snapshot,
    routed: computeEdgeRouting(snapshot.nodes, snapshot.edges),
    navigation: buildDirectionalIndex(snapshot.nodes),
    labels: new Map(GRAPH_RECORD_ORDER(snapshot.nodes).map((node) => [node.id, node.display_label])),
    // Fixed initial visibility: source-named on, navigation off.
    visible: { source_named_adjacency: true, navigation_adjacency: false },
    selectedId: null,
    focusedId: null,
    hoveredId: null,
    statusLabel,
  };
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

/**
 * Update the authored SVG in place.
 *
 * Edges are a keyed join into the authored edge layer. Record controls are
 * never created, removed or reordered here — only their state attributes are
 * written, so focus survives every redraw and authored Tab order is preserved.
 */
function drawGraph(canvas: HTMLElement, state: ViewState): void {
  const svg = select(canvas).select<SVGSVGElement>("svg");
  if (svg.empty()) return;

  const emphasis = resolveEmphasis({
    selectedId: state.selectedId,
    edges: state.snapshot.edges,
    visible: state.visible,
  });

  const visibleEdges = state.routed.filter((edge) => state.visible[edge.edgeClass]);

  svg
    .select<SVGGElement>('[data-psadj-layer="edges"]')
    .selectAll<SVGPathElement, RoutedEdge>("path.psadj-edge")
    .data(visibleEdges, (edge) => edge.id)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", (edge) => `psadj-edge psadj-edge--${edge.edgeClass}`)
          .attr("d", (edge) => edge.d)
          .attr(
            "marker-end",
            (edge) =>
              edge.edgeClass === "source_named_adjacency"
                ? "url(#psadj-arrow-filled)"
                : "url(#psadj-arrow-open)",
          ),
      (update) => update,
      (exit) => exit.remove(),
    )
    .attr("data-emphasis", (edge) => (emphasis.edgeIds.has(edge.id) ? "true" : "false"))
    .attr("data-inactive", (edge) =>
      state.selectedId !== null && !emphasis.edgeIds.has(edge.id) ? "true" : "false",
    );

  // Record state only. No append, no remove, no reorder.
  svg.selectAll<SVGGElement, unknown>("[data-psadj-node]").each(function () {
    const id = this.dataset.psadjNode as string;
    const selected = state.selectedId === id;
    const adjacent = emphasis.nodeIds.has(id);
    this.setAttribute("data-selected", selected ? "true" : "false");
    this.setAttribute("aria-pressed", selected ? "true" : "false");
    this.setAttribute("data-emphasis", adjacent ? "true" : "false");
    // Inactive records stay focusable, selectable, announced and listed. Only
    // their opacity changes, and never below the legibility floor.
    this.setAttribute(
      "data-inactive",
      state.selectedId !== null && !selected && !adjacent ? "true" : "false",
    );
  });
}

/**
 * The visual label readout.
 *
 * Written with `textContent` only, and never given a role, a live-region value
 * or focus. It is a duplicate visual aid: the details panel, the 59-record list
 * and each control's accessible name remain the authoritative surfaces.
 */
function renderReadout(readout: HTMLElement | null, state: ViewState): void {
  if (!readout) return;
  readout.textContent = resolveReadoutLabel({
    focusedId: state.focusedId,
    hoveredId: state.hoveredId,
    selectedId: state.selectedId,
    labels: state.labels,
    neutralText: READOUT_NEUTRAL_TEXT,
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
