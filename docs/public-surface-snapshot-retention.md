# Immutable public-surface snapshot retention

This repository owns an append-only retention layer for validated Public
Surface and Authority-Ceiling Map candidate snapshots. Retention preserves
exact bytes under an identity-derived filename:

```text
<40-lowercase-hex-source-commit>-<64-lowercase-hex-data-sha256>.json
```

The staging command is:

```text
node scripts/retain-public-surface-snapshot.mjs \
  --source-commit <40-lowercase-hex> \
  --snapshot-sha256 <64-lowercase-hex> \
  --snapshot-path <repository-relative-forward-slash-path>
```

The input path must be repository-relative and use forward slashes. Absolute,
drive-qualified, parent-traversing, backslash, empty, and symlink or
reparse-point paths are rejected. The destination root is fixed in the tool and
cannot be selected from the command line.

Before writing, the tool validates the exact input bytes, their SHA-256, valid
UTF-8 JSON, and the existing public-surface map contract. A new identity is
created exclusively. An existing byte-identical identity is an idempotent
success; an existing identity with different bytes fails closed. The tool has
no overwrite, deletion, rename, or replacement operation.

The emitted single-line JSON is deterministic mechanical identity evidence. It
contains only byte length, repository-relative destination, SHA-256, and source
commit. It does not grant or record active, last-known-good, production,
Registry, ontology, deployment, publication, or authority status.

Retention and adoption are separate operations. This tool cannot read or write
`runtime-manifest.json` or `last-known-good.json`, and it has no pointer-adoption
option. A retained candidate is not active, last-known-good,
production-approved, deployed, Registry-confirmed, ontology-confirmed, or
authority-bearing.

Phase 3B-2 adds retention capability only. It adds no real candidate snapshot,
workflow, cross-repository orchestration, publication, or deployment behavior.
