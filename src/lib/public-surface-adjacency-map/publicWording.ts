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
