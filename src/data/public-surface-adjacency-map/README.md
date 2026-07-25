# Expanded Public Surface Adjacency Map — data namespace

This directory is the independent data namespace for the expanded public-surface
adjacency product served at `/public-surface-map/expanded/`.

It is separate from `src/data/public-surface-authority-map/`. Neither namespace
reads, aliases, or overrides the other. The two products are parallel public
views with different selection and edge contracts; neither supersedes the other.

## Adopted dataset

The single adopted dataset was copied as raw bytes (never parsed and
reserialized) from the source repository.

- source repository: `metawritingecology/meta-writing-ecology`
- source Phase 3A P5 merge commit: `814997119e543c8d39f312687f2b4b2ffc45da67`
- source Phase 3A P5 reviewed implementation head: `70724fc39ffbbc963889e2d53f8c074009245c80`
- source path at the merge commit: `visualizations/public-surface-adjacency-map/data.json`
- dataset embedded `source_commit`: `933274af9693d6d1d9fac36819aafdf56f9ab81d`

## Byte identity

The immutable snapshot and the bundled last-known-good fallback are
byte-identical to that source file.

- byte length: `206617`
- SHA-256: `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`
- Git blob: `3077568edeeb0d6a769899a1a3cf79c3f9152f83`

`.gitattributes` marks every JSON file in this directory `-text` so a checkout on
any platform cannot rewrite LF bytes into CRLF and invalidate that identity.

## Files

- `runtime-manifest.json` — the independent runtime manifest for this product
  only. It carries no timestamp, no automatic-latest claim, and
  `currentness_claim` is `none`.
- `last-known-good.json` — the bundled fallback rendered at build time for this
  page only. It does not replace or alias the authority-map fallback.
- `runtime-snapshots/<source_commit>-<sha256>.json` — the immutable retained
  snapshot served at the route declared by the manifest.

## Boundary

This dataset is selected public-document visualization membership. It is not the
full MWE archive, the internal Registry, a complete corpus, a classification
system, an ontology, a confirmed relation graph, a ranking, or a currentness
claim. The snapshot is not described as current, canonical, or authoritative.

## Counts

- 59 records: 49 concept, 2 orientation, 7 boundary, 1 anchor
- 49 semantic-layout participants, 10 fixed-band records
- 383 edges: 189 source-named adjacency, 194 provisional navigation adjacency
