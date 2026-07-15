# Manually gated public-surface candidate workflow

Phase 3B-4 packages the Phase 3B-3 candidate orchestration as a manually
dispatched, website-owned GitHub Actions workflow. The workflow creates review
candidates only. It does not approve a source commit, adopt a candidate, move a
runtime pointer, publish, deploy, confirm Registry or ontology status, promote
authority, or represent the complete MWE archive.

## Manual approval gate

`.github/workflows/public-surface-candidate-generation.yml` has
`workflow_dispatch` as its only trigger. It runs only from `refs/heads/main` in
`metawritingecology/metawritingecology-site` and requires the externally
supplied `SOURCE_COMMIT_APPROVED_FOR_GENERATION` input. The value must be exactly
40 lowercase hexadecimal characters. The workflow never selects source `main`,
`HEAD`, a tag, a release, a timestamp, website state, or a fallback commit.

The input identifies bytes to generate from; it does not itself approve those
bytes. Approval remains external to both repositories.

## Source-read and token boundary

The source repository is publicly readable. The generation job checks out both
public repositories with `persist-credentials: false` and an empty checkout
token, verifies the exact website and source commit identities, and runs the
Phase 3B-3 orchestration with no repository-write permission. The source
worktree must remain clean. A private source, or any source requiring a PAT,
repository secret, GitHub App credential, or other read credential, is outside
this design and requires a new authority decision.

The workflow has `permissions: {}` at top level. The generation job receives
only `contents: read`; it has no repository-write or pull-request-write token.
The publishing job receives only `contents: write` and `pull-requests: write`.
It checks out only website-owned code and never downloads, checks out, imports,
or executes source-repository code. No production secret, inherited secret,
deployment environment, cloud credential, administration permission, or OIDC
permission is used.

## Artifact boundary

The job boundary carries exactly three regular files: the exact candidate JSON
bytes, the deterministic Phase 3B-3 generation record, and a deterministic
SHA-256 identity record. The publisher rejects missing or extra entries,
directories, symlinks or reparse equivalents, malformed UTF-8 or JSON, contract
violations, and source, generator, retained-path, or SHA-256 mismatches. The
artifact contains no script, package file, Git metadata, credentials,
environment dump, absolute or temporary path, timestamp, user, host, or run ID.

The publishing job revalidates the candidate and calls the existing Phase 3B-2
retention library. Its worktree audit permits exactly one untracked path: the
identity-derived immutable snapshot. `runtime-manifest.json`,
`last-known-good.json`, existing snapshots, workflows, scripts, packages,
documentation, deployment files, Registry data, ontology data, relation maps,
and public-authority data cannot be part of the candidate commit.

## Deterministic branch and Draft PR

The branch is derived only from validated full identities:

```text
candidate/public-surface/<40-hex-source-commit>/<64-hex-candidate-sha256>
```

The publisher verifies that remote `main` still equals the exact workflow-base
commit immediately before branch handling. Drift fails as `WEBSITE_MAIN_DRIFT`
and a new manual dispatch is required. Concurrency serializes runs without
cancelling an in-progress run.

A missing branch is created from the exact workflow base without force push. An
existing branch is reused only when its Git tree is byte-identical to the
expected candidate tree; otherwise processing fails closed as
`CANDIDATE_BRANCH_IDENTITY_CONFLICT`. A candidate already present on `main`
returns `IDENTICAL_CANDIDATE_ALREADY_PRESENT` without creating a branch or PR.

The PR base is `main`, its head is the deterministic candidate branch, and it is
created as Draft. An exact open Draft PR is an idempotent no-op. A differing
open PR fails closed; a closed-unmerged PR is not reopened; multiple PR records
fail closed. The mechanical body prominently states `CANDIDATE ONLY — NOT
ADOPTED` and contains identity and validation facts only. The workflow never
marks a PR ready, reviews, approves, merges, enables auto-merge, moves a pointer,
or deploys.

## Repository prerequisite and residual risks

`GITHUB_ACTIONS_PR_CREATION_PREREQUISITE_UNVERIFIED`: repository settings are
not changed here, and the setting allowing GitHub Actions to create pull
requests was not readable through the available unauthenticated settings
interface. If disabled, Draft PR creation fails as
`GITHUB_PR_PERMISSION_UNAVAILABLE`; introducing a PAT is not an authorized
workaround.

Branch protection or rulesets may also reject branch creation or PR creation.
That is a safe failure, not permission to weaken repository settings. Official
actions are pinned to verified full commit identities, but the GitHub-hosted
runner image and the actions' transitive runtime remain external supply-chain
dependencies. Workflow artifacts are trusted only after strict revalidation;
GitHub Actions administrators remain part of the platform trust boundary.

Phase 3B-4 supplies candidate generation and review packaging only. Phase 3C
would require a separate decision for candidate review or adoption. Candidate
generation is not candidate adoption, and neither Phase 3C nor Phase 3D begins
with this workflow.
