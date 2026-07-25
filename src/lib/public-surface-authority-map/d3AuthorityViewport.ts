// Public Surface and Authority-Ceiling Map — Phase 2B-1 bounded viewport.
//
// A PURE module: no DOM, no D3, no browser API, no randomness, no time, no host
// locale, no storage, and no mutation of its inputs. It owns ONLY transient
// interface state: how much of the already-computed deterministic content is
// magnified, and which part of it the map surface is scrolled to.
//
// Hard separation from the deterministic content layout:
//   - `d3AuthorityLayout.ts` alone decides groups, node order, node coordinates,
//     canvas dimensions, and routing-edge subsets. Nothing here changes any of
//     them; every function below reads layout output and returns presentation
//     numbers only.
//   - a viewport transform is applied AFTER layout, to one containing SVG group.
//     It is never written back into metadata, snapshot identity, semantic
//     classification, authority status, routing semantics, data validation, or
//     runtime currentness.
//
// Deliberately NOT computed anywhere in this module (Phase 2B-1 boundary):
//   - importance, hierarchy, authority, centrality, similarity, rank, weight;
//     causal direction, model family, formal conceptual relation, Registry
//     status, or currentness;
//   - force simulation, physics, or any iterative/converging placement;
//   - inferred nodes, inferred edges, or inferred relations.
//
// Zoom level, viewport position, and group navigation are navigation only. They
// are never recorded, never persisted, and never used as an analytic signal.
//
// No third-party zoom behavior is used. The bounded operations below are plain
// arithmetic over the layout's own numbers, so Phase 2B-1 adds NO npm package
// and keeps the existing `d3-selection`-only dependency surface intact. See the
// module note at the end of this header block for the rejected alternative.
//
// Rejected alternative: `d3-zoom`. It would pull in `d3-drag`, `d3-transition`,
// `d3-interpolate`, `d3-color`, `d3-ease`, `d3-timer`, and `d3-dispatch`; it
// binds gesture handling (wheel, dblclick, touch) to the surface by default,
// which this phase must constrain rather than adopt; and the repository's
// existing boundary tests and build verifier assert that no `d3-zoom` /
// `d3-drag` module and no `zoomTransform` / `zoomIdentity` / `dragDisable`
// symbol reaches the sources or the browser bundle. Implementing the bounded
// transform arithmetically keeps those checks intact instead of weakening them.

import {
  AUTHORITY_LAYOUT_METRICS,
  type AuthorityLayout,
  type AuthorityLayoutGroup,
  type AuthorityLayoutNode,
} from "./d3AuthorityLayout.ts";

const M = AUTHORITY_LAYOUT_METRICS;

// --- Fixed bounds ------------------------------------------------------------
//
// A bounded scale extent. The lower bound keeps the 0.8rem node label legible
// (0.5 x 0.8rem is the smallest step this map is verified at) and the upper
// bound keeps the magnified canvas within the existing map scroller at every
// tested width. Both are constants, never derived from data, so no zoom level
// can encode anything about a record.

export const VIEWPORT_SCALE = {
  /** Smallest permitted magnification. */
  MIN: 0.5,
  /** Largest permitted magnification. */
  MAX: 2.5,
  /** The identity magnification. The initial and reset state. */
  IDENTITY: 1,
  /** Multiplicative step for one zoom-in / zoom-out press. */
  STEP: 1.25,
} as const;

/** Scale rounding grid (4 decimal places). Keeps every step exactly stable. */
const SCALE_PRECISION = 10000;
/** Pixel rounding grid (2 decimal places) for surface and offset numbers. */
const PIXEL_PRECISION = 100;

// --- Types -------------------------------------------------------------------

/**
 * Transient viewport transform. `k` magnifies, `x`/`y` position the magnified
 * content inside the map surface. Applied to ONE containing SVG group, never to
 * nodes and edges separately.
 */
export interface ViewportTransform {
  readonly k: number;
  readonly x: number;
  readonly y: number;
}

/** The exact identity transform. Reset returns to this object's values. */
export const IDENTITY_VIEWPORT: ViewportTransform = Object.freeze({
  k: 1,
  x: 0,
  y: 0,
});

export interface ContentExtent {
  readonly width: number;
  readonly height: number;
}

export interface ContentRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Everything the renderer needs to draw one frame at one viewport state. */
export interface ViewportSurface {
  /** SVG `width` attribute (CSS pixels). */
  readonly width: number;
  /** SVG `height` attribute (CSS pixels). */
  readonly height: number;
  /** SVG `viewBox` attribute. User units equal CSS pixels. */
  readonly viewBox: string;
  readonly transform: ViewportTransform;
  /** `transform` attribute for the single containing viewport group. */
  readonly transformAttr: string;
}

// --- Safe arithmetic ---------------------------------------------------------

function finiteOr(value: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function roundTo(value: number, grid: number): number {
  return Math.round(value * grid) / grid;
}

/** Round a magnification onto the fixed 4-decimal grid. */
export function roundScale(scale: number): number {
  return roundTo(finiteOr(scale, VIEWPORT_SCALE.IDENTITY), SCALE_PRECISION);
}

/** Round a pixel quantity onto the fixed 2-decimal grid. */
export function roundPixel(value: number): number {
  return roundTo(finiteOr(value, 0), PIXEL_PRECISION);
}

// --- Scale operations --------------------------------------------------------

/** Clamp any candidate magnification into the fixed bounded extent. */
export function clampScale(scale: number): number {
  const rounded = roundScale(scale);
  if (rounded < VIEWPORT_SCALE.MIN) return VIEWPORT_SCALE.MIN;
  if (rounded > VIEWPORT_SCALE.MAX) return VIEWPORT_SCALE.MAX;
  return rounded;
}

/** One deterministic zoom-in step, clamped to the maximum bound. */
export function scaleIn(scale: number): number {
  return clampScale(clampScale(scale) * VIEWPORT_SCALE.STEP);
}

/** One deterministic zoom-out step, clamped to the minimum bound. */
export function scaleOut(scale: number): number {
  return clampScale(clampScale(scale) / VIEWPORT_SCALE.STEP);
}

/** True only for the exact identity transform. */
export function isIdentityViewport(transform: ViewportTransform): boolean {
  return (
    transform.k === IDENTITY_VIEWPORT.k &&
    transform.x === IDENTITY_VIEWPORT.x &&
    transform.y === IDENTITY_VIEWPORT.y
  );
}

/**
 * Whole-percent label for the current magnification. Interface state only: it
 * reports how large the drawing is, never a measurement of a record.
 * Locale-independent by construction (no number formatting API takes part).
 */
export function formatScalePercent(scale: number): string {
  return `${Math.round(clampScale(scale) * 100)}%`;
}

// --- Rendered content extent -------------------------------------------------

/**
 * Bounding extent of the CURRENTLY RENDERED group regions, plus the map's own
 * outer padding. Only groups that the deterministic layout actually produced
 * take part, so a filtered view fits what is on screen and nothing else. No
 * hidden record contributes, and no coordinate is recomputed.
 */
export function contentExtentOf(layout: AuthorityLayout): ContentExtent {
  if (layout.groups.length === 0) {
    return { width: layout.width, height: layout.height };
  }
  let right = 0;
  let bottom = 0;
  for (const group of layout.groups) {
    right = Math.max(right, group.x + group.width);
    bottom = Math.max(bottom, group.y + group.height);
  }
  return {
    width: right + M.CANVAS_PADDING,
    height: bottom + M.CANVAS_PADDING,
  };
}

/**
 * Largest magnification at which the rendered content fits the visible box,
 * never above the identity scale and never below the minimum bound. A
 * non-positive or unmeasured visible dimension is ignored rather than treated as
 * a constraint. Height is only considered when a bounded visible height is
 * supplied.
 */
export function fitScale(
  content: ContentExtent,
  visibleWidth: number,
  visibleHeight: number = 0,
): number {
  const width = finiteOr(visibleWidth, 0);
  const height = finiteOr(visibleHeight, 0);
  let ratio: number = VIEWPORT_SCALE.IDENTITY;
  if (width > 0 && content.width > 0) {
    ratio = Math.min(ratio, width / content.width);
  }
  if (height > 0 && content.height > 0) {
    ratio = Math.min(ratio, height / content.height);
  }
  return clampScale(ratio);
}

// --- Surface -----------------------------------------------------------------

/**
 * Resolve the drawing surface for one viewport state.
 *
 * The map surface never grows past the deterministic canvas at identity, so at
 * `scale === 1` the SVG carries EXACTLY the layout's own width, height, and
 * viewBox and the containing group carries a geometric identity transform — the
 * Phase 2A.1 drawing, unchanged. Above identity the surface grows with the
 * content so the existing map scroller reaches all of it; below identity the
 * surface shrinks and the smaller drawing is centred in whatever visible width
 * was measured, so nothing is clipped and no empty band is left implying
 * meaning.
 *
 * Node coordinates, group geometry, edge endpoints, and label shortening are
 * never touched here.
 */
export function computeViewportSurface(
  layoutWidth: number,
  layoutHeight: number,
  scale: number,
  visibleWidth: number = 0,
): ViewportSurface {
  const k = clampScale(scale);
  const lw = Math.max(0, finiteOr(layoutWidth, 0));
  const lh = Math.max(0, finiteOr(layoutHeight, 0));

  const scaledW = roundPixel(lw * k);
  const scaledH = roundPixel(lh * k);

  // Never wider than the identity canvas, so k === 1 reproduces Phase 2A.1.
  const visible = Math.max(0, finiteOr(visibleWidth, 0));
  const width = Math.max(scaledW, roundPixel(Math.min(visible, lw)));
  const height = Math.max(scaledH, M.MIN_CANVAS_HEIGHT);

  const x = width > scaledW ? roundPixel((width - scaledW) / 2) : 0;
  const y = height > scaledH ? roundPixel((height - scaledH) / 2) : 0;
  const transform: ViewportTransform = { k, x, y };

  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    transform,
    transformAttr: transformAttr(transform),
  };
}

/** SVG transform attribute for one containing viewport group. */
export function transformAttr(transform: ViewportTransform): string {
  return `translate(${transform.x},${transform.y}) scale(${transform.k})`;
}

/**
 * Project a deterministic content rectangle into surface pixels. Read-only: the
 * source rectangle keeps its layout coordinates.
 */
export function projectRect(
  rect: ContentRect,
  transform: ViewportTransform,
): ContentRect {
  return {
    x: roundPixel(rect.x * transform.k + transform.x),
    y: roundPixel(rect.y * transform.k + transform.y),
    width: roundPixel(rect.width * transform.k),
    height: roundPixel(rect.height * transform.k),
  };
}

/** The layout rectangle of one rendered group region. */
export function groupRect(group: AuthorityLayoutGroup): ContentRect {
  return { x: group.x, y: group.y, width: group.width, height: group.height };
}

/** The layout rectangle of one rendered node box. */
export function nodeRect(node: AuthorityLayoutNode): ContentRect {
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

/** Find one rendered group region by its exact deterministic key. */
export function findGroup(
  layout: AuthorityLayout,
  key: string,
): AuthorityLayoutGroup | null {
  for (const group of layout.groups) {
    if (group.key === key) return group;
  }
  return null;
}

/** Find one rendered node by its exact id. */
export function findNode(
  layout: AuthorityLayout,
  id: string | null,
): AuthorityLayoutNode | null {
  if (id === null) return null;
  for (const node of layout.nodes) {
    if (node.id === id) return node;
  }
  return null;
}

// --- Bounded viewport positions ----------------------------------------------
//
// One axis at a time. `visible` is the visible extent of the scrollable box and
// `total` the full extent of its content; every result is clamped into
// `[0, max(0, total - visible)]`, so no operation can scroll past the content or
// leave the user stranded outside the drawing.

/** Clamp any candidate offset into the scrollable range of one axis. */
export function clampOffset(offset: number, visible: number, total: number): number {
  const max = Math.max(0, roundPixel(finiteOr(total, 0) - finiteOr(visible, 0)));
  const candidate = roundPixel(finiteOr(offset, 0));
  if (candidate < 0) return 0;
  if (candidate > max) return max;
  return candidate;
}

/**
 * Offset that centres a rectangle inside the visible box, clamped. Used by
 * "center the selected node" and "jump to a visible group": both move the
 * viewport only. Neither changes selection, grouping, or filtering.
 */
export function centeredOffset(
  start: number,
  size: number,
  visible: number,
  total: number,
): number {
  const centre =
    finiteOr(start, 0) + finiteOr(size, 0) / 2 - finiteOr(visible, 0) / 2;
  return clampOffset(centre, visible, total);
}

/**
 * Offset that keeps the current visible centre stable while the surface resizes
 * — how the zoom buttons operate around the viewport centre rather than around
 * a corner. Clamped, and a degenerate previous extent falls back to the start of
 * the axis instead of producing a non-finite offset.
 */
export function anchoredOffset(
  previousOffset: number,
  visible: number,
  previousTotal: number,
  nextTotal: number,
): number {
  const prevTotal = finiteOr(previousTotal, 0);
  const box = finiteOr(visible, 0);
  if (prevTotal <= 0) return clampOffset(0, box, nextTotal);
  const centreFraction = (finiteOr(previousOffset, 0) + box / 2) / prevTotal;
  const nextCentre = centreFraction * finiteOr(nextTotal, 0);
  return clampOffset(nextCentre - box / 2, box, nextTotal);
}

/**
 * Offset that brings a rectangle into view WITHOUT moving when it is already
 * fully visible. Used when focus lands on a node outside the visible area:
 * focusing makes a node visible, and changes nothing about its selection or any
 * other semantic state.
 */
export function bringIntoViewOffset(
  start: number,
  size: number,
  offset: number,
  visible: number,
  total: number,
): number {
  const current = clampOffset(offset, visible, total);
  const box = finiteOr(visible, 0);
  const top = finiteOr(start, 0);
  const bottom = top + finiteOr(size, 0);
  if (box <= 0) return current;
  if (top >= current && bottom <= current + box) return current;
  return centeredOffset(top, size, visible, total);
}
