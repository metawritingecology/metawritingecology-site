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
// P7.2 viewport contract:
//   - `reducePointer` from `viewport.ts` is the SOLE pointer-state and
//     pointer-derived viewport transition authority. Down, move and every
//     terminal route pass through it; this module never re-implements pointer
//     removal or phase settling;
//   - a transform is written to the ONE authored `[data-psadj-viewport]`
//     wrapper and nowhere else. The decor layer is outside it and is never
//     referenced by a transform path;
//   - only the graph BACKGROUND may begin a pan or a pinch. A pointerdown on a
//     record or a grouping arc returns before any capture;
//   - every pointer listener binds to the canvas. Pointer capture is what makes
//     that sufficient, so no window- or document-level listener is installed;
//   - grouping-arc activation fits the sector and changes the viewport only.

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
  CENTRE_X,
  CENTRE_Y,
  computeEdgeRouting,
  computeRadialLayout,
  directionForKey,
  firstReachableId,
  GRAPH_RECORD_ORDER,
  lastReachableId,
  resolveDirectionalTarget,
  resolveReadoutLabel,
  type DirectionalIndex,
  type RadialLayout,
  type RoutedEdge,
} from "../lib/public-surface-adjacency-map/layout.ts";
import {
  applyShortcut,
  centreOn,
  computeGroupingFitBounds,
  fitAll,
  fitLogicalBounds,
  idlePointerState,
  reducePointer,
  resetTransform,
  resolveShortcut,
  stepScale,
  tooltipRect,
  transformAttr,
  zoomAbout,
  type GroupFitInput,
  type PointerState,
  type PointerTerminalKind,
  type ViewportState,
} from "../lib/public-surface-adjacency-map/viewport.ts";
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
  // P7.2 siblings. No existing field is renamed, retyped or reordered.
  radial: RadialLayout;
  viewport: ViewportState;
  pointer: PointerState;
}

/**
 * Which kind of thing a pointer went down on.
 *
 * ONLY `background` may begin a pan or a pinch. A pointerdown on a record or a
 * grouping arc returns before any capture or viewport work, so their existing
 * activation paths keep behaving exactly as they did in P7.1.
 */
function pointerTargetKind(
  canvas: HTMLElement,
  target: EventTarget | null,
): "record" | "grouping-arc" | "background" | "outside" {
  const element = target instanceof Element ? target : null;
  if (!element || !canvas.contains(element)) return "outside";
  if (element.closest("[data-psadj-node]")) return "record";
  if (element.closest("[data-psadj-arc-action]")) return "grouping-arc";
  return "background";
}

/**
 * Release a pointer capture at most once, and never throw on a stale id.
 */
function safeReleaseCapture(canvas: HTMLElement, id: number): void {
  const element = canvas as HTMLElement & {
    hasPointerCapture?: (pointerId: number) => boolean;
    releasePointerCapture?: (pointerId: number) => void;
  };
  if (typeof element.hasPointerCapture !== "function") return;
  if (!element.hasPointerCapture(id)) return;
  element.releasePointerCapture?.(id);
}

/** Logical viewBox coordinates for a pointer event, before the viewport transform. */
function logicalPoint(canvas: HTMLElement, event: PointerEvent | WheelEvent): { x: number; y: number } {
  const svg = canvas.querySelector("svg");
  const rect = (svg ?? canvas).getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return { x: CENTRE_X, y: CENTRE_Y };
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1000,
    y: ((event.clientY - rect.top) / rect.height) * 1000,
  };
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
  const tooltip = container.querySelector<HTMLElement>("[data-psadj-tooltip]");
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
    // Viewport shortcuts resolve FIRST and require no focused record, so `+`,
    // `-` and `0` work from the background, an arc or a record alike. The
    // record-only gate below is retained verbatim and still guards every
    // branch that genuinely needs a focused record.
    const shortcutTarget = event.target as HTMLElement | null;
    const operation = resolveShortcut({
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      withinGraphRegion: shortcutTarget ? canvas.contains(shortcutTarget) : false,
      expandedMapActive: true,
      targetTagName: shortcutTarget?.tagName ?? "",
      targetIsContentEditable: shortcutTarget?.isContentEditable === true,
      targetIsButtonActivating:
        shortcutTarget?.tagName === "BUTTON" && (event.key === "Enter" || event.key === " "),
    });
    if (operation) {
      state.viewport = applyShortcut(state.viewport, operation);
      writeViewportTransform(canvas, state.viewport);
      event.preventDefault();
      return;
    }

    const arcKey = shortcutTarget?.closest<SVGPathElement>("[data-psadj-arc-action]")?.dataset
      .psadjArc;
    if (arcKey && (event.key === "Enter" || event.key === " " || event.key === "Spacebar")) {
      activateGroupingArc(canvas, state, arcKey);
      event.preventDefault();
      return;
    }

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
      syncFocusRecord();
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
    // One-shot drag suppression. A gesture that crossed the drag threshold
    // leaves the verdict at "drag" through terminal cleanup; the click it
    // produces is consumed here, the verdict resets, and the NEXT click
    // behaves normally. Cancel and lost clear the verdict instead, so no
    // stale suppression can swallow an unrelated click.
    if (state.pointer.verdict === "drag") {
      state.pointer = { ...state.pointer, verdict: "none" };
      event.preventDefault();
      return;
    }

    const arcKey = (event.target as HTMLElement | null)?.closest<SVGPathElement>(
      "[data-psadj-arc-action]",
    )?.dataset.psadjArc;
    if (arcKey) {
      activateGroupingArc(canvas, state, arcKey);
      return;
    }

    const group = (event.target as HTMLElement | null)?.closest<SVGGElement>("[data-psadj-node]");
    const id = group?.dataset.psadjNode;
    if (!id) return;
    selectNode(state, id);
    syncFocusRecord();
    render();
    focusNode(canvas, id);
    announce(live, state, `${labelOf(state, id)} selected.`);
  });

  // --- P7.2 viewport operations ---------------------------------------------
  for (const button of container.querySelectorAll<HTMLButtonElement>("[data-psadj-action]")) {
    const action = button.dataset.psadjAction;
    button.addEventListener("click", () => {
      if (action === "zoom-out" || action === "zoom-in") {
        state.viewport = applyShortcut(state.viewport, action);
      } else if (action === "fit-all") {
        // A viewport operation ONLY: selection, details, readout, emphasis and
        // edge-class visibility are all preserved.
        state.viewport = fitAll();
      } else if (action === "reset-exploration") {
        state.viewport = resetTransform();
        state.selectedId = null;
        state.visible = { source_named_adjacency: true, navigation_adjacency: false };
        for (const input of container.querySelectorAll<HTMLInputElement>("[data-psadj-toggle]")) {
          const edgeClass = input.dataset.psadjToggle as AdjacencyEdgeClass;
          if (EDGE_CLASSES.includes(edgeClass)) input.checked = state.visible[edgeClass];
        }
        render();
        syncFocusRecord();
        // Hover is NOT cleared: the readout falls back through the existing
        // focus > hover > selection > neutral precedence on its own.
        return;
      } else if (action === "focus-record") {
        // Defensive no-selection guard: returns without centring, without any
        // viewport or selection change, and without an announcement.
        if (!state.selectedId) return;
        const point = state.radial.positions.get(state.selectedId);
        if (!point) return;
        state.viewport = centreOn(state.viewport.scale, point.cx, point.cy);
      } else {
        return;
      }
      writeViewportTransform(canvas, state.viewport);
    });
  }

  /** Focus Record is enabled exactly when a record is selected. */
  function syncFocusRecord(): void {
    const button = container.querySelector<HTMLButtonElement>('[data-psadj-action="focus-record"]');
    if (button) button.disabled = state.selectedId === null;
  }

  // --- Wheel zoom -----------------------------------------------------------
  canvas.addEventListener(
    "wheel",
    (event) => {
      const eligible =
        canvas.contains(event.target as Node) ||
        (document.activeElement !== null && canvas.contains(document.activeElement));
      if (!eligible) return;
      const point = logicalPoint(canvas, event);
      const anchorX = (point.x - state.viewport.offsetX) / state.viewport.scale;
      const anchorY = (point.y - state.viewport.offsetY) / state.viewport.scale;
      const next = stepScale(state.viewport.scale, event.deltaY < 0 ? 1 : -1);
      state.viewport = zoomAbout(state.viewport, next, anchorX, anchorY);
      writeViewportTransform(canvas, state.viewport);
      event.preventDefault();
    },
    { passive: false },
  );

  // --- Pointer lifecycle ----------------------------------------------------
  canvas.addEventListener("pointerdown", (event) => {
    // Only the graph background may begin a pan or a pinch. A record or an arc
    // returns here, before any capture, suppression or viewport work.
    if (pointerTargetKind(canvas, event.target) !== "background") return;
    canvas.setPointerCapture(event.pointerId);
    const point = logicalPoint(canvas, event);
    const next = reducePointer(state.pointer, state.viewport, {
      type: "down",
      id: event.pointerId,
      x: point.x,
      y: point.y,
    });
    state.pointer = next.pointer;
    state.viewport = next.viewport;
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.pointer.pointers.some((live) => live.id === event.pointerId)) return;
    const point = logicalPoint(canvas, event);
    const before = state.viewport;
    const next = reducePointer(state.pointer, state.viewport, {
      type: "move",
      id: event.pointerId,
      x: point.x,
      y: point.y,
    });
    state.pointer = next.pointer;
    state.viewport = next.viewport;
    // Write the transform only when the returned viewport actually changed.
    if (
      next.viewport.scale !== before.scale ||
      next.viewport.offsetX !== before.offsetX ||
      next.viewport.offsetY !== before.offsetY
    ) {
      writeViewportTransform(canvas, state.viewport);
    }
  });

  canvas.addEventListener("pointerup", (event) => {
    finalizePointer(canvas, state, event.pointerId, "up");
  });
  canvas.addEventListener("pointercancel", (event) => {
    finalizePointer(canvas, state, event.pointerId, "cancel");
  });
  canvas.addEventListener("lostpointercapture", (event) => {
    finalizePointer(canvas, state, event.pointerId, "lost");
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
    renderTooltip(tooltip, canvas, state, event, id);
  });

  canvas.addEventListener("pointerout", (event) => {
    const next = (event as PointerEvent).relatedTarget as HTMLElement | null;
    if (next && next.closest("[data-psadj-node]")) return;
    state.hoveredId = null;
    renderReadout(readout, state);
    hideTooltip(tooltip);
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
    // The visitor's explicit choices survive; transient pointer state does not.
    const next = buildState(result.snapshot, RUNTIME_STATUS_LABEL);
    next.visible = { ...state.visible };
    next.viewport = { ...state.viewport };
    for (const live of [...state.pointer.pointers]) {
      finalizePointer(canvas, state, live.id, "runtime-cancel");
    }
    next.pointer = idlePointerState();
    Object.assign(state, next);
    writeViewportTransform(canvas, state.viewport);
    syncFocusRecord();
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
    radial: computeRadialLayout(snapshot.nodes),
    viewport: resetTransform(),
    pointer: idlePointerState(),
  };
}

// --- Viewport plumbing ------------------------------------------------------

/**
 * The ONLY transform write in this module, and it targets the ONE authored
 * viewport wrapper. The decor layer sits outside that wrapper and is never
 * referenced here, so decoration cannot be dragged along with the data space.
 */
function writeViewportTransform(canvas: HTMLElement, viewport: ViewportState): void {
  const wrapper = canvas.querySelector<SVGGElement>("[data-psadj-viewport]");
  if (wrapper) wrapper.setAttribute("transform", transformAttr(viewport));
}

/**
 * Close one logical pointer lifecycle, exactly once.
 *
 * `reducePointer` is the SOLE transition authority: this function never removes
 * a pointer or settles a phase itself. The reducer closes the id BEFORE the
 * capture release, so the `lostpointercapture` the release causes — whether it
 * arrives before or after this function returns — finds the id already closed
 * and is absorbed as a no-op. Correctness does not depend on that ordering.
 */
function finalizePointer(
  canvas: HTMLElement,
  state: ViewState,
  id: number,
  kind: PointerTerminalKind,
): void {
  if (!state.pointer.pointers.some((live) => live.id === id)) return;
  const next = reducePointer(state.pointer, state.viewport, { type: kind, id });
  state.pointer = next.pointer;
  state.viewport = next.viewport;
  safeReleaseCapture(canvas, id);
}

/**
 * Locate a grouping's already-computed presentation geometry.
 *
 * The grouping key is used HERE and only here, purely to find the geometry. The
 * pure constructor downstream receives coordinates and four numbers — never the
 * key, a record, an edge or any semantic field.
 */
function resolveGroupFitInput(radial: RadialLayout, key: string): GroupFitInput | null {
  const span = radial.groups.find((group) => group.key === key);
  if (!span) return null;
  const members = radial.concepts
    .filter((record) => record.node.grouping === key)
    .map((record) => ({ x: record.x, y: record.y }));
  return {
    members,
    arc: {
      centreX: CENTRE_X,
      centreY: CENTRE_Y,
      startAngle: span.startAngle,
      endAngle: span.endAngle,
    },
  };
}

/**
 * Grouping-arc activation: group-bounds fitting ONLY.
 *
 * On an empty group this returns without producing a ViewportState, without
 * assigning a transform, without rendering and without announcing, so a zoomed
 * view stays exactly where it was.
 */
function activateGroupingArc(canvas: HTMLElement, state: ViewState, key: string): void {
  const input = resolveGroupFitInput(state.radial, key);
  if (!input) return;
  const bounds = computeGroupingFitBounds(input);
  if (!bounds.ok) return;
  state.viewport = fitLogicalBounds(bounds.bounds);
  writeViewportTransform(canvas, state.viewport);
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

/**
 * The pointer tooltip.
 *
 * A DUPLICATE visual aid. It never replaces the persistent `<p>` readout, it
 * carries no role, no aria-live and no aria-atomic, and it is written with
 * `textContent` only. Its rectangle comes from the pure `tooltipRect`, which
 * receives a label, a measured extent, the pointer anchor and the container —
 * never a record's semantic fields.
 */
function renderTooltip(
  tooltip: HTMLElement | null,
  canvas: HTMLElement,
  state: ViewState,
  event: PointerEvent,
  id: string,
): void {
  if (!tooltip) return;
  const label = state.labels.get(id) ?? id;
  const container = canvas.getBoundingClientRect();
  const rect = tooltipRect(
    label,
    { width: Math.min(label.length * 7 + 16, container.width), height: 22 },
    event.clientX - container.left,
    event.clientY - container.top,
    { x: 0, y: 0, width: container.width, height: container.height },
  );
  tooltip.textContent = label;
  tooltip.dataset.visible = "true";
  tooltip.style.setProperty("--psadj-tooltip-x", `${rect.x}px`);
  tooltip.style.setProperty("--psadj-tooltip-y", `${rect.y}px`);
}

function hideTooltip(tooltip: HTMLElement | null): void {
  if (!tooltip) return;
  tooltip.textContent = "";
  tooltip.dataset.visible = "false";
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
