// Expanded Public Surface Adjacency Map — approved public wording.
//
// The exact public strings for this product, held in ONE place so the page
// metadata, the component, the tests, and the build verifier all pin the same
// values. Nothing here is generated, derived, or interpolated at runtime.
//
// This module holds wording only. It asserts no Registry status, no
// classification, no relation validity, and no authority.

/** The approved public page title and label. */
export const APPROVED_TITLE = "Expanded Public Surface Adjacency Map";

/** The approved page description (also the WebPage JSON-LD description). */
export const APPROVED_DESCRIPTION =
  "An expanded 59-record public-surface adjacency view with separate source-named and provisional navigation evidence classes.";

/** The exact product-relationship sentence. Used verbatim on both pages. */
export const RELATIONSHIP_SENTENCE =
  "These are parallel public views with different selection and edge contracts; neither supersedes the other.";

/** Compact label for the existing 30-record route. */
export const AUTHORITY_VIEW_LABEL = "30-record authority-ceiling view";
/** Compact label for this route. */
export const EXPANDED_VIEW_LABEL = "59-record expanded adjacency view";

/** The route this product is served at. */
export const EXPANDED_ROUTE = "/public-surface-map/expanded/";
/** The existing 30-record route. */
export const AUTHORITY_ROUTE = "/public-surface-map/interactive/";
/** The parent orientation route. */
export const PARENT_ROUTE = "/public-surface-map/";

/**
 * What this view is NOT. Every line restates the adopted dataset's own boundary
 * statements or the runtime manifest's declared `currentness_claim` of "none".
 * No interpretation is added beyond them.
 */
export const NOT_CLAIMS: readonly string[] = [
  "not the full MWE archive",
  "not the internal Registry",
  "not a complete corpus",
  "not a classification system",
  "not an ontology",
  "not a confirmed relation graph",
  "not a ranking",
  "not a currentness claim",
];

/** The concise scope statement rendered above the boundary banner. */
export const SCOPE_STATEMENT =
  "This page shows selected public-document visualization membership: the public documents chosen for this visualization, and the adjacency written in or recorded about those documents.";

// --- P7.1 graph wording -----------------------------------------------------
//
// Added by P7.1 and used by the radial view. Wording only: nothing here asserts
// a Registry status, a classification, a relation validity, or an authority.

/** Accessible name of the graph region. */
export const GRAPH_REGION_LABEL = "Radial adjacency constellation";

/** The two functional edge-class toggle labels. */
export const SOURCE_NAMED_TOGGLE_LABEL = "Source-declared adjacency";
export const NAVIGATION_TOGGLE_LABEL = "Provisional navigation adjacency";

/**
 * Neutral text for the visual label readout, shown when no record is focused,
 * hovered or selected. The readout is a duplicate visual aid and never the only
 * surface for any value.
 */
export const READOUT_NEUTRAL_TEXT =
  "Focus or hover a record to read its complete label.";

/** The public role-orbit caption, rendered verbatim. */
export const ROLE_ORBIT_CAPTION = "Context records · outside the semantic layout";

/** Written role labels for the outer orbit. Words, never colour alone. */
export const ROLE_ORBIT_LABELS: Readonly<Record<string, string>> = {
  orientation: "orientation",
  boundary: "boundary",
  anchor: "anchor",
};

/** Summary of the collapsed about-region. */
export const ABOUT_SUMMARY = "About this view";

/**
 * The exact two lines of the path-free central region. No third line, no
 * record, no glyph, no legend, no count, no logo, no decoration.
 */
export const CENTRAL_STATEMENT_LINES: readonly string[] = [
  "Navigation grouping only",
  "No hierarchy, ranking, or authority",
];

/** The approved grouping-arc statement, rendered verbatim wherever arcs appear. */
export const GROUP_ARC_STATEMENT =
  "Group arc length reflects the number of displayed records only. It does not indicate importance, authority, classification strength, or relation strength.";

/**
 * The required visible boundary statement wherever record order is described.
 * Record order is lexical determinism only.
 */
export const RECORD_ORDER_DISCLAIMER =
  "Record order is a lexical contract derived from display labels and record identifiers. It does not indicate hierarchy, authority, priority, or importance.";

/** Caption for the separator ring between the semantic layout and the orbit. */
export const SEPARATOR_CAPTION =
  "The dashed ring separates the semantic layout from the context records outside it.";
