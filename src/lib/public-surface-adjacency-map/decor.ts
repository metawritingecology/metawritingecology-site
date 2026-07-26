// Expanded Public Surface Adjacency Map — static decorative background marks.
//
// A PURE CONSTANT module. It imports nothing at all: not the dataset, not the
// snapshot, not the contract, not the layout. That import boundary is the
// mechanism that keeps decoration from ever acquiring meaning, and it is
// asserted rather than merely intended.
//
// Every value below is a committed literal. There is no generator, no seed, no
// pseudo-random placement, no noise function, no build step and no runtime
// computation. The marks are identical in every environment and in every build.
//
// AUTHORING POLICY, stated plainly because it is NOT machine-verifiable:
//
//   The committed decorative coordinates are reviewed as authored literals.
//   Automated checks prove the absence of generators, randomness, dataset
//   inputs and layout inputs; they do not claim to establish the historical
//   origin of each literal value.
//
// Constraints the marks satisfy, and which the visual-state tests assert:
//   - every mark lies outside the central clear disc, so no decoration can
//     enter the path-free region that holds the two boundary lines;
//   - no mark coincides with a record coordinate — records sit only on the
//     concept ring and the role orbit, and no mark uses either radius;
//   - the scatter carries no grouping, no directional flow and no apparent
//     conceptual centre;
//   - the whole layer is removable without information loss.
//
// The layer renders behind every data layer and OUTSIDE the viewport wrapper,
// so it never pans, zooms or produces moving parallax.

export interface DecorMark {
  /** Logical x in the 0 0 1000 1000 viewBox. */
  readonly x: number;
  /** Logical y in the 0 0 1000 1000 viewBox. */
  readonly y: number;
  /** Mark radius in logical units. */
  readonly r: number;
  /** Fixed opacity. Never derived from data, never animated. */
  readonly opacity: number;
}

/**
 * The authored decorative field: a sparse, deliberately uneven scatter of faint
 * marks in the two quiet bands of the composition — inside the corridor and
 * outside the role orbit. Sizes and opacities vary only to create static depth.
 */
export const DECOR_MARKS: readonly DecorMark[] = Object.freeze([
  // Inner quiet band, between the central clear disc and the chord corridor.
  Object.freeze({ x: 372.0, y: 349.0, r: 2.4, opacity: 0.55 }),
  Object.freeze({ x: 641.0, y: 331.0, r: 1.6, opacity: 0.4 }),
  Object.freeze({ x: 683.0, y: 588.0, r: 2.9, opacity: 0.5 }),
  Object.freeze({ x: 447.0, y: 672.0, r: 1.9, opacity: 0.35 }),
  Object.freeze({ x: 318.0, y: 527.0, r: 2.2, opacity: 0.45 }),
  Object.freeze({ x: 560.0, y: 297.0, r: 1.4, opacity: 0.3 }),
  Object.freeze({ x: 296.0, y: 618.0, r: 1.7, opacity: 0.38 }),
  Object.freeze({ x: 714.0, y: 447.0, r: 2.1, opacity: 0.42 }),

  // Outer quiet band, beyond the role orbit.
  Object.freeze({ x: 138.0, y: 214.0, r: 3.4, opacity: 0.5 }),
  Object.freeze({ x: 861.0, y: 176.0, r: 2.6, opacity: 0.4 }),
  Object.freeze({ x: 934.0, y: 508.0, r: 3.1, opacity: 0.45 }),
  Object.freeze({ x: 806.0, y: 871.0, r: 2.3, opacity: 0.35 }),
  Object.freeze({ x: 489.0, y: 953.0, r: 3.6, opacity: 0.48 }),
  Object.freeze({ x: 173.0, y: 838.0, r: 2.0, opacity: 0.32 }),
  Object.freeze({ x: 61.0, y: 561.0, r: 2.8, opacity: 0.44 }),
  Object.freeze({ x: 244.0, y: 96.0, r: 1.8, opacity: 0.3 }),
  Object.freeze({ x: 651.0, y: 61.0, r: 2.5, opacity: 0.36 }),
  Object.freeze({ x: 947.0, y: 703.0, r: 1.5, opacity: 0.28 }),
  Object.freeze({ x: 337.0, y: 917.0, r: 2.7, opacity: 0.41 }),
  Object.freeze({ x: 72.0, y: 372.0, r: 2.2, opacity: 0.33 }),
  Object.freeze({ x: 903.0, y: 289.0, r: 1.9, opacity: 0.29 }),
  Object.freeze({ x: 618.0, y: 941.0, r: 2.1, opacity: 0.37 }),
]);

/** Static vignette geometry. Fixed, decorative, dataset-independent. */
export const DECOR_VIGNETTE = Object.freeze({
  cx: 500,
  cy: 500,
  innerR: 300,
  outerR: 720,
});
