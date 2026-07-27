// Expanded Public Surface Adjacency Map — pure viewport arithmetic (P7.2).
//
// PURITY CONTRACT, identical to `layout.ts`: no DOM, no dataset, no D3, no
// browser API, no timer, no randomness, no host locale, and no mutation of any
// input. Every function is a total, deterministic function of its arguments.
//
// This module is the SOLE home of:
//   - viewport scale/offset arithmetic (clamp, step, zoom, centre, reset);
//   - the grouping-arc fit pipeline (`computeGroupingFitBounds` then
//     `fitLogicalBounds`);
//   - keyboard-shortcut eligibility;
//   - pointer-state transitions.
//
// `reducePointer` is the SOLE pure pointer-state and pointer-derived viewport
// transition authority used by production handlers. Production code never
// re-implements pointer removal or phase settling outside it.
//
// Transform convention:
//   screenX = offsetX + scale * logicalX
//   screenY = offsetY + scale * logicalY
//
// Serialization goes through the single canonical three-decimal serializer
// `formatLogicalNumber`, imported from `layout.ts`. No second serializer is
// implemented here.
//
// `HIT_R` and `GROUP_ARC_R` are IMPORTED from the frozen geometry module. They
// are never redeclared here and never accepted as a caller parameter, so no
// runtime value can reach the grouping-arc radius.

import {
  CENTRE_X,
  CENTRE_Y,
  formatLogicalNumber,
  GROUP_ARC_R,
  HIT_R,
} from "./layout.ts";

// --- Constants ---------------------------------------------------------------

export const LOGICAL_VIEWPORT_WIDTH = 1000;
export const LOGICAL_VIEWPORT_HEIGHT = 1000;

/** Fixed clearance added on all four sides of the raw group-fit bounds. */
export const GROUP_FIT_PADDING = 48;

/** Floor applied to a padded extent, so a degenerate box can never divide by 0. */
export const MIN_FIT_EXTENT = 1;

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

/** Multiplicative zoom step, applied in both directions. */
export const SCALE_STEP = 1.25;

/** Logical travel at or above which a gesture is a drag, not an activation. */
export const DRAG_THRESHOLD = 3;

const DEGREES_TO_RADIANS = Math.PI / 180;

/** The four canonical axis angles, in the same degree convention as the layout. */
const AXIS_ANGLES = [0, 90, 180, 270] as const;

// --- Shared types ------------------------------------------------------------

export interface ViewportState {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface LogicalBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface ContainerRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TextExtent {
  readonly width: number;
  readonly height: number;
}

// --- Deterministic validation ------------------------------------------------

/**
 * One shared validation error family for the whole fit pipeline, so a reviewer
 * sees a single contract rather than two. The message is stable and carries no
 * host locale, no timestamp and no interpolated float.
 */
export class FitValidationError extends Error {
  constructor(detail: string) {
    super(`fit validation failed: ${detail}`);
    this.name = "FitValidationError";
  }
}

const assertFiniteValue = (value: number, label: string): void => {
  if (!Number.isFinite(value)) throw new FitValidationError(`${label} is not finite`);
};

// --- Viewport arithmetic -----------------------------------------------------

/** Enforces the approved range 1.0 through 4.0, exactly. Idempotent. */
export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return MIN_SCALE;
  if (scale < MIN_SCALE) return MIN_SCALE;
  if (scale > MAX_SCALE) return MAX_SCALE;
  return scale;
}

/** Multiplies (direction >= 0) or divides (direction < 0) by the fixed step. */
export function stepScale(scale: number, direction: number): number {
  const base = Number.isFinite(scale) ? scale : MIN_SCALE;
  return clampScale(direction >= 0 ? base * SCALE_STEP : base / SCALE_STEP);
}

/** The identity transform. Idempotent: scale 1.0, offsets exactly zero. */
export function resetTransform(): ViewportState {
  return { scale: MIN_SCALE, offsetX: 0, offsetY: 0 };
}

/**
 * Fit All is a VIEWPORT OPERATION ONLY and is exactly the identity transform.
 * It is deliberately not `fitLogicalBounds(wholeGraphBounds)`.
 */
export function fitAll(): ViewportState {
  return resetTransform();
}

/**
 * Bounds the offset so scaled content can never leave the logical canvas.
 *
 * At scale s the logical box [0, 1000] maps to [offset, offset + 1000 s], so the
 * admissible offset range is [1000 - 1000 s, 0]. At scale 1.0 that collapses to
 * exactly {0}, which is why a pan at scale 1.0 cannot move the view.
 *
 * Used for USER DRAG/PAN AND ZOOM ONLY. It is never applied after a group fit.
 */
export function clampOffset(scale: number, offsetX: number, offsetY: number): ViewportState {
  const s = clampScale(scale);
  const minX = LOGICAL_VIEWPORT_WIDTH - LOGICAL_VIEWPORT_WIDTH * s;
  const minY = LOGICAL_VIEWPORT_HEIGHT - LOGICAL_VIEWPORT_HEIGHT * s;
  const x = Number.isFinite(offsetX) ? offsetX : 0;
  const y = Number.isFinite(offsetY) ? offsetY : 0;
  return {
    scale: s,
    offsetX: x < minX ? minX : x > 0 ? 0 : x,
    offsetY: y < minY ? minY : y > 0 ? 0 : y,
  };
}

/**
 * Zoom to `nextScale` while holding the LOGICAL CONTENT point (anchorX, anchorY)
 * at the same screen position.
 *
 * screen = offset + scale * anchor, so holding it fixed gives
 * offset' = offset + (scale - scale') * anchor.
 */
export function zoomAbout(
  state: ViewportState,
  nextScale: number,
  anchorX: number,
  anchorY: number,
): ViewportState {
  const s = clampScale(nextScale);
  const ax = Number.isFinite(anchorX) ? anchorX : 0;
  const ay = Number.isFinite(anchorY) ? anchorY : 0;
  return clampOffset(
    s,
    state.offsetX + (state.scale - s) * ax,
    state.offsetY + (state.scale - s) * ay,
  );
}

/** Centres the given logical content point in the viewport at the given scale. */
export function centreOn(scale: number, x: number, y: number): ViewportState {
  const s = clampScale(scale);
  const cx = Number.isFinite(x) ? x : 0;
  const cy = Number.isFinite(y) ? y : 0;
  return clampOffset(
    s,
    LOGICAL_VIEWPORT_WIDTH / 2 - s * cx,
    LOGICAL_VIEWPORT_HEIGHT / 2 - s * cy,
  );
}

/**
 * The ONLY place a viewport number becomes a string, and it routes through the
 * single canonical serializer. Stable and locale-independent by construction:
 * `formatLogicalNumber` is `toFixed(3)` with negative zero normalised.
 */
export function transformAttr(state: ViewportState): string {
  const x = formatLogicalNumber(state.offsetX);
  const y = formatLogicalNumber(state.offsetY);
  const s = formatLogicalNumber(state.scale);
  return `translate(${x},${y}) scale(${s})`;
}

// --- Grouping-arc fit: layer 1, presentation geometry -> raw bounds ----------

export interface GroupFitPoint {
  readonly x: number;
  readonly y: number;
}

export interface GroupFitArc {
  readonly centreX: number;
  readonly centreY: number;
  readonly startAngle: number;
  readonly endAngle: number;
}

export interface GroupFitInput {
  readonly members: readonly GroupFitPoint[];
  readonly arc: GroupFitArc;
}

export type GroupFitBoundsResult =
  | { readonly ok: true; readonly bounds: LogicalBounds }
  | { readonly ok: false; readonly reason: "empty-group" };

/**
 * Does the canonical axis angle `axis` lie inside the sweep from `lo` to `hi`?
 *
 * The angular convention is READ FROM the current `groupArcPath`: raw DEGREES,
 * unwrapped, increasing clockwise on screen, with the sweep taken as the plain
 * difference `endAngle - startAngle` and never renormalised to [0, 360).
 *
 *   axis is inside  <=>  exists k in Z with lo <= axis + 360k <= hi
 *
 * Evaluated in closed form, with no search: k is the smallest integer placing
 * the axis at or above `lo`. This is correct for unwrapped spans that start
 * below zero (the current data begins at -90) and for wrapped spans alike.
 */
const axisInsideSweep = (axis: number, lo: number, hi: number): boolean => {
  const k = Math.ceil((lo - axis) / 360);
  return axis + 360 * k <= hi;
};

/**
 * Raw, UNPADDED group-fit bounds: the union of every member hit box at `HIT_R`
 * and the exact analytical bounds of the grouping arc at `GROUP_ARC_R`,
 * including every axis-crossing extremum inside the sweep.
 *
 * Receives ONLY presentation geometry. It never receives a grouping key, a
 * grouping name, a record, an edge, a relation count, semantic metadata,
 * selection, pointer state, viewport history, runtime state or a DOM node — and
 * it never receives a radius.
 */
export function computeGroupingFitBounds(input: GroupFitInput): GroupFitBoundsResult {
  const { members, arc } = input;

  if (members.length === 0) return { ok: false, reason: "empty-group" };

  assertFiniteValue(arc.centreX, "arc centreX");
  assertFiniteValue(arc.centreY, "arc centreY");
  assertFiniteValue(arc.startAngle, "arc startAngle");
  assertFiniteValue(arc.endAngle, "arc endAngle");

  const sweep = arc.endAngle - arc.startAngle;
  if (Math.abs(sweep) > 360) throw new FitValidationError("arc span exceeds one full turn");

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const include = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  // Member hit boxes. Order-independent: taken with numeric minima and maxima.
  for (const member of members) {
    assertFiniteValue(member.x, "member x");
    assertFiniteValue(member.y, "member y");
    include(member.x - HIT_R, member.y - HIT_R);
    include(member.x + HIT_R, member.y + HIT_R);
  }

  // Both arc endpoints, at the imported radius.
  const endpoint = (angle: number): void => {
    include(
      arc.centreX + GROUP_ARC_R * Math.cos(angle * DEGREES_TO_RADIANS),
      arc.centreY + GROUP_ARC_R * Math.sin(angle * DEGREES_TO_RADIANS),
    );
  };
  endpoint(arc.startAngle);
  endpoint(arc.endAngle);

  // Every axis-crossing extremum inside the sweep, at the imported radius.
  const lo = Math.min(arc.startAngle, arc.endAngle);
  const hi = Math.max(arc.startAngle, arc.endAngle);
  for (const axis of AXIS_ANGLES) {
    if (!axisInsideSweep(axis, lo, hi)) continue;
    if (axis === 0) include(arc.centreX + GROUP_ARC_R, arc.centreY);
    else if (axis === 90) include(arc.centreX, arc.centreY + GROUP_ARC_R);
    else if (axis === 180) include(arc.centreX - GROUP_ARC_R, arc.centreY);
    else include(arc.centreX, arc.centreY - GROUP_ARC_R);
  }

  return { ok: true, bounds: { minX, minY, maxX, maxY } };
}

// --- Grouping-arc fit: layer 2, raw bounds -> transform ----------------------

/**
 * Fit RAW, UNPADDED logical bounds into the logical viewport.
 *
 * This function validates, normalizes, pads and floors ITS OWN argument. It does
 * not assume `computeGroupingFitBounds` already did any of that, because a
 * direct call at the public API boundary must be just as safe. The two
 * validation layers are defence in depth, not a single delegated step.
 *
 * `clampOffset` is deliberately NOT applied afterwards: the fitted target is
 * centred on purpose, and the free-pan clamp would silently de-centre the very
 * sector the visitor asked to see.
 */
export function fitLogicalBounds(bounds: LogicalBounds): ViewportState {
  // Step 0 — independent finite validation, BEFORE any comparison runs. A
  // non-finite value would otherwise propagate silently through Math.min/max
  // into the returned transform.
  assertFiniteValue(bounds.minX, "bounds minX");
  assertFiniteValue(bounds.minY, "bounds minY");
  assertFiniteValue(bounds.maxX, "bounds maxX");
  assertFiniteValue(bounds.maxY, "bounds maxY");

  const normalizedMinX = Math.min(bounds.minX, bounds.maxX);
  const normalizedMaxX = Math.max(bounds.minX, bounds.maxX);
  const normalizedMinY = Math.min(bounds.minY, bounds.maxY);
  const normalizedMaxY = Math.max(bounds.minY, bounds.maxY);

  const paddedMinX = normalizedMinX - GROUP_FIT_PADDING;
  const paddedMaxX = normalizedMaxX + GROUP_FIT_PADDING;
  const paddedMinY = normalizedMinY - GROUP_FIT_PADDING;
  const paddedMaxY = normalizedMaxY + GROUP_FIT_PADDING;

  const width = Math.max(MIN_FIT_EXTENT, paddedMaxX - paddedMinX);
  const height = Math.max(MIN_FIT_EXTENT, paddedMaxY - paddedMinY);

  const rawScale = Math.min(
    LOGICAL_VIEWPORT_WIDTH / width,
    LOGICAL_VIEWPORT_HEIGHT / height,
  );
  const scale = clampScale(rawScale);

  const boundsCentreX = (paddedMinX + paddedMaxX) / 2;
  const boundsCentreY = (paddedMinY + paddedMaxY) / 2;

  return {
    scale,
    offsetX: LOGICAL_VIEWPORT_WIDTH / 2 - scale * boundsCentreX,
    offsetY: LOGICAL_VIEWPORT_HEIGHT / 2 - scale * boundsCentreY,
  };
}

/** The logical centre of the authored viewBox, for centre-anchored zoom steps. */
export const LOGICAL_CENTRE: GroupFitPoint = { x: CENTRE_X, y: CENTRE_Y };

// --- Keyboard-shortcut eligibility -------------------------------------------

export type ShortcutOperation = "zoom-in" | "zoom-out" | "fit-all";

/**
 * Everything the eligibility predicate needs, and nothing else.
 *
 * A key-and-modifier-only signature could not express region containment or
 * target exclusion, so those are supplied explicitly by the caller and are part
 * of the pure contract rather than a DOM lookup performed in here.
 */
export interface ShortcutContext {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly withinGraphRegion: boolean;
  readonly expandedMapActive: boolean;
  readonly targetTagName: string;
  readonly targetIsContentEditable: boolean;
  readonly targetIsButtonActivating: boolean;
}

const EXCLUDED_TARGET_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

/**
 * `+` -> Zoom In, `-` -> Zoom Out, `0` -> Fit All. Never Reset Exploration.
 *
 * Reads the KEY VALUE, never a physical key code. Shift is PERMITTED, because
 * `+` requires it on most layouts. Ctrl, Meta and Alt each disqualify, so the
 * browser keeps Ctrl+Plus, Ctrl+Minus and Ctrl+0.
 *
 * Returns null when ineligible, and the caller then performs no preventDefault.
 */
export function resolveShortcut(context: ShortcutContext): ShortcutOperation | null {
  if (!context.withinGraphRegion) return null;
  if (!context.expandedMapActive) return null;
  if (context.ctrlKey || context.metaKey || context.altKey) return null;
  if (EXCLUDED_TARGET_TAGS.includes(context.targetTagName.toUpperCase())) return null;
  if (context.targetIsContentEditable) return null;
  if (context.targetIsButtonActivating) return null;

  if (context.key === "+") return "zoom-in";
  if (context.key === "-") return "zoom-out";
  if (context.key === "0") return "fit-all";
  return null;
}

/** Apply a resolved shortcut to the viewport, anchored at the logical centre. */
export function applyShortcut(state: ViewportState, operation: ShortcutOperation): ViewportState {
  if (operation === "fit-all") return fitAll();
  const next = stepScale(state.scale, operation === "zoom-in" ? 1 : -1);
  return zoomAbout(state, next, LOGICAL_CENTRE.x, LOGICAL_CENTRE.y);
}

// --- Pointer state -----------------------------------------------------------

export type PointerPhase = "idle" | "pending" | "dragging" | "pinching";

export interface LivePointer {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

export type PointerVerdict = "none" | "activation" | "drag";

export interface PointerState {
  readonly phase: PointerPhase;
  readonly pointers: readonly LivePointer[];
  readonly originX: number;
  readonly originY: number;
  readonly startOffsetX: number;
  readonly startOffsetY: number;
  readonly pinchBaselineDistance: number | null;
  readonly pinchBaselineScale: number | null;
  readonly verdict: PointerVerdict;
}

export type PointerTerminalKind = "up" | "cancel" | "lost" | "runtime-cancel";

export type PointerAction =
  | { readonly type: "down"; readonly id: number; readonly x: number; readonly y: number }
  | { readonly type: "move"; readonly id: number; readonly x: number; readonly y: number }
  | { readonly type: PointerTerminalKind; readonly id: number };

export function idlePointerState(): PointerState {
  return {
    phase: "idle",
    pointers: [],
    originX: 0,
    originY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    pinchBaselineDistance: null,
    pinchBaselineScale: null,
    verdict: "none",
  };
}

/** Below the threshold a gesture is an activation; at or above it, a drag. */
export function classifyPointerEnd(
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
  threshold: number,
): PointerVerdict {
  const travel = Math.hypot(currentX - originX, currentY - originY);
  return travel >= threshold ? "drag" : "activation";
}

/** Midpoint and separation of two live pointers, from their CURRENT positions. */
export function pinchFrom(
  a: LivePointer,
  b: LivePointer,
): { midX: number; midY: number; distance: number } {
  return {
    midX: (a.x + b.x) / 2,
    midY: (a.y + b.y) / 2,
    distance: Math.hypot(b.x - a.x, b.y - a.y),
  };
}

/**
 * A live state that cannot arise from any legal sequence. Only these four cases
 * trigger deterministic cancellation — an unknown terminal id does NOT, because
 * cancelling then would destroy a surviving pointer's pending gesture.
 */
const isStructurallyImpossible = (pointer: PointerState): boolean => {
  if (pointer.pointers.length > 2) return true;
  if (pointer.phase === "pinching" && pointer.pointers.length < 2) return true;
  const seen = new Set<number>();
  for (const live of pointer.pointers) {
    if (seen.has(live.id)) return true;
    seen.add(live.id);
    if (!Number.isFinite(live.x) || !Number.isFinite(live.y)) return true;
  }
  return false;
};

const withoutPointer = (pointer: PointerState, id: number): readonly LivePointer[] =>
  pointer.pointers.filter((live) => live.id !== id);

/**
 * THE SOLE PURE POINTER-STATE AND POINTER-DERIVED VIEWPORT TRANSITION AUTHORITY.
 *
 * Every production down, move, up, cancel and lost route passes through here.
 * Production handlers never re-implement pointer removal or phase settling.
 *
 * Neither argument is mutated; a new pair is always returned.
 */
export function reducePointer(
  pointer: PointerState,
  viewport: ViewportState,
  action: PointerAction,
): { pointer: PointerState; viewport: ViewportState } {
  if (isStructurallyImpossible(pointer)) {
    return { pointer: idlePointerState(), viewport };
  }

  if (action.type === "down") {
    if (pointer.pointers.length >= 2) return { pointer, viewport };
    const next = [...pointer.pointers, { id: action.id, x: action.x, y: action.y }];
    if (next.length === 2) {
      const pinch = pinchFrom(next[0] as LivePointer, next[1] as LivePointer);
      return {
        pointer: {
          ...pointer,
          phase: "pinching",
          pointers: next,
          pinchBaselineDistance: pinch.distance,
          pinchBaselineScale: viewport.scale,
        },
        viewport,
      };
    }
    return {
      pointer: {
        ...pointer,
        phase: "pending",
        pointers: next,
        originX: action.x,
        originY: action.y,
        startOffsetX: viewport.offsetX,
        startOffsetY: viewport.offsetY,
        pinchBaselineDistance: null,
        pinchBaselineScale: null,
        verdict: "none",
      },
      viewport,
    };
  }

  if (action.type === "move") {
    if (!pointer.pointers.some((live) => live.id === action.id)) {
      return { pointer, viewport };
    }
    const moved = pointer.pointers.map((live) =>
      live.id === action.id ? { id: live.id, x: action.x, y: action.y } : live,
    );

    if (pointer.phase === "pinching" && moved.length === 2) {
      const pinch = pinchFrom(moved[0] as LivePointer, moved[1] as LivePointer);
      const baseDistance = pointer.pinchBaselineDistance;
      const baseScale = pointer.pinchBaselineScale;
      if (baseDistance === null || baseScale === null || baseDistance === 0) {
        return { pointer: { ...pointer, pointers: moved }, viewport };
      }
      const nextScale = clampScale((baseScale * pinch.distance) / baseDistance);
      // Anchor is the CONTENT point currently under the pinch midpoint.
      const anchorX = (pinch.midX - viewport.offsetX) / viewport.scale;
      const anchorY = (pinch.midY - viewport.offsetY) / viewport.scale;
      return {
        pointer: { ...pointer, pointers: moved },
        viewport: zoomAbout(viewport, nextScale, anchorX, anchorY),
      };
    }

    if (pointer.phase === "pending") {
      const verdict = classifyPointerEnd(
        pointer.originX,
        pointer.originY,
        action.x,
        action.y,
        DRAG_THRESHOLD,
      );
      if (verdict !== "drag") {
        return { pointer: { ...pointer, pointers: moved }, viewport };
      }
      return {
        pointer: { ...pointer, phase: "dragging", pointers: moved, verdict: "drag" },
        viewport: clampOffset(
          viewport.scale,
          pointer.startOffsetX + (action.x - pointer.originX),
          pointer.startOffsetY + (action.y - pointer.originY),
        ),
      };
    }

    if (pointer.phase === "dragging") {
      // Offset moves with the pointer in logical viewBox units; the CONTENT
      // displacement is that delta divided by the current scale, which is what
      // makes panning feel identical at every zoom level.
      return {
        pointer: { ...pointer, pointers: moved },
        viewport: clampOffset(
          viewport.scale,
          pointer.startOffsetX + (action.x - pointer.originX),
          pointer.startOffsetY + (action.y - pointer.originY),
        ),
      };
    }

    return { pointer: { ...pointer, pointers: moved }, viewport };
  }

  // --- Terminal transitions --------------------------------------------------
  //
  // An unknown or already-closed id is a PURE NO-OP. It must not cancel a
  // surviving pointer, clear a valid pending survivor, or touch the viewport.
  if (!pointer.pointers.some((live) => live.id === action.id)) {
    return { pointer, viewport };
  }

  const survivors = withoutPointer(pointer, action.id);
  const clearedVerdict: PointerVerdict = action.type === "up" ? pointer.verdict : "none";

  if (survivors.length === 0) {
    return {
      pointer: { ...idlePointerState(), verdict: clearedVerdict },
      viewport,
    };
  }

  // Exactly one survivor. A two-pointer pinch baseline CANNOT be recomputed from
  // one pointer, so the gesture becomes a fresh single-pointer pending drag with
  // a NEW origin at the survivor's current position and both baselines cleared.
  const survivor = survivors[0] as LivePointer;
  return {
    pointer: {
      phase: "pending",
      pointers: survivors,
      originX: survivor.x,
      originY: survivor.y,
      startOffsetX: viewport.offsetX,
      startOffsetY: viewport.offsetY,
      pinchBaselineDistance: null,
      pinchBaselineScale: null,
      verdict: clearedVerdict,
    },
    viewport,
  };
}

// --- Tooltip geometry --------------------------------------------------------

/**
 * A tooltip rectangle clamped so all four edges lie inside `container`.
 *
 * Receives a label string, a MEASURED text extent, an anchor drawn from pointer
 * coordinates, and the container rectangle. It never receives a record's
 * semantic fields, and it never measures anything itself.
 */
export function tooltipRect(
  label: string,
  extent: TextExtent,
  anchorX: number,
  anchorY: number,
  container: ContainerRect,
): ContainerRect {
  const width = Math.min(Math.max(extent.width, 0), container.width);
  const height = Math.min(Math.max(extent.height, 0), container.height);
  const maxX = container.x + container.width - width;
  const maxY = container.y + container.height - height;
  const rawX = Number.isFinite(anchorX) ? anchorX : container.x;
  const rawY = Number.isFinite(anchorY) ? anchorY : container.y;
  // `label` participates only as the thing being described; an empty label still
  // yields a valid, clamped rectangle.
  const emptyLabel = label.length === 0;
  return {
    x: rawX < container.x ? container.x : rawX > maxX ? maxX : rawX,
    y: rawY < container.y ? container.y : rawY > maxY ? maxY : rawY,
    width: emptyLabel ? 0 : width,
    height: emptyLabel ? 0 : height,
  };
}
