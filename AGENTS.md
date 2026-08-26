# Agent Rules for the Meta-Writing Ecology Website Repository

This repository is a public-facing website surface for Meta-Writing Ecology (MWE).

It does not represent the full MWE archive, internal registry, backend corpus, complete methodology, or authority layer.

Agents may perform approved technical work only.

## Role Allocation

### User-Led Conceptual Review

Use this review layer for conceptual decisions that require authorial judgment, including structural reasoning, naming decisions, classification decisions, public/private boundary review, OSF / GitHub / website positioning, and relation-status decisions.

This layer may include AI-assisted discussion, but AI-generated output is not repository authority.

Conceptual decisions become actionable only when explicitly approved by the user / repository owner and translated into concrete implementation instructions.

AI agents must not treat prior AI-assisted discussion as independent authorship, source authority, or standing permission to modify conceptual files.

Final authority remains with the user / repository owner.

### Claude Code
Use Claude Code for routine engineering:
- Astro implementation
- page or component creation after approval
- CSS, layout, and interaction work
- D3 / Canvas / Three.js prototypes from prepared public data
- JSON / CSV transformation
- local scripts
- import, route, build, and component fixes
- small repo-local edits

Claude Code must not decide:
- MWE model classification
- OSF priority
- public/private status
- naming authority
- registry confirmation
- candidate relation validity
- relation promotion
- top-navigation inclusion
- whether a visualization becomes public

### Codex
Reserve Codex for boundary-sensitive engineering:
- public-surface consistency audits
- website / GitHub / OSF alignment checks
- review of Claude Code output
- high-risk batch edits
- data architecture affecting MWE relation status
- repository changes that may affect conceptual boundaries

## Allowed Work

Agents may:
- implement explicitly requested website changes
- add approved pages or components
- fix broken imports, routes, or build errors
- add or update technical support files
- implement prepared graph or constellation prototypes
- update JSON / CSV data supplied by the user

## Not Allowed

Agents must not:
- rewrite MWE conceptual framing
- rename pages, models, protocols, notes, or concepts unless explicitly instructed
- invent new relations between MWE concepts
- promote candidate relations into confirmed relations
- remove boundary statements
- imply the website represents the full MWE archive or methodology
- reorganize navigation unless explicitly instructed
- alter OSF, Publications, AI Architecture, Fiction, Artistic Research, or About content without explicit approval
- treat public graph data as full ontology

## Graph and Visualization Rules

For constellation maps, relation graphs, D3 maps, or Three.js maps:
- use only public or explicitly approved data
- preserve candidate / navigation / confirmed / formal dependency / ontology distinctions
- do not make visual centrality imply authority
- keep boundary statements visible
- do not present any visualization as the full MWE system

## Symbol hygiene

When editing human-facing prose, use the proper not-equal symbol `≠` instead of the ASCII marker `!=`.

Apply this only to prose-level content, including:

- Markdown content
- public documentation text
- visible page text
- boundary statements
- human-facing explanatory text

Do not replace `!=` or `!==` in:

- executable code
- JavaScript or TypeScript logic
- config files
- JSON
- scripts
- comparison expressions
- package files
- lockfiles
- generated files
- dependencies

Before committing prose/content edits, scan touched human-facing files for literal `!=`.

Replace `!=` with `≠` only when it appears as prose.

If `!=` appears outside the edited files, report it but do not expand scope unless explicitly approved.

## Frozen Check-Pipeline Prefix

The `check` script in `package.json` is a single `&&` chain. Its first twenty steps (`astro build` through `pnpm run verify:metadata-build`, the `BASE_PIPELINE` list in `tests/public-surface-adjacency-map/preservation.test.ts` and `tests/check-pipeline-structure.test.ts`) are a frozen prefix.

Rule for any change to `scripts.check`:
- the `BASE_PIPELINE` steps must remain present, in their original relative order, and none may be removed or duplicated
- a step that is not in `BASE_PIPELINE` may appear only after the last `BASE_PIPELINE` step: new steps are appended at the tail of the chain
- extending `BASE_PIPELINE` itself is a freeze move and requires explicit owner authorization recorded in the worklog

Both tests enforce this. `tests/check-pipeline-structure.test.ts` names the violated condition and carries the two historical violations as negative fixtures (the 2026-08-15 insertion of `test:human-governed`, corrected on PR #122; the 2026-08-22 insertion of `test:html-charset`, corrected by commit `e00d6cf` on PR #132). Both were caught by CI, not locally: `pnpm run check` on a Windows clone aborts at `test:orchestration` (see below) before reaching the preservation test, so a local partial run does not stand in for the pipeline rule.

## Known-Environmental Failures

The Linux `site-ci` workflow run on the pushed branch is the readiness authority for `pnpm run check`. The following local failures are known, environmental, and outside this repository; report them, do not fix them here, and do not treat them as evidence about the change under test:

- Under Git Bash on Windows, `/usr/bin/tar` is GNU tar, which reads a `C:\...` path as `host:path` (`tar: Cannot connect to C: resolve failed`); `test:orchestration` then fails 22 of 29. From PowerShell, `tar` resolves to `C:\WINDOWS\system32\tar.exe` and the same tests pass.
- PSADJ-21 in the adjacency-map suite fails on Windows for the same class of reason and passes on the Linux CI runner.

A local failure that is not on this list is not environmental until shown to be; record it as a finding.

## Required Worklog

After any change, update AGENT_WORKLOG.md with:
- agent used
- task performed
- files changed
- tests or build checks run
- unresolved questions
- risks or assumptions

For boundary-sensitive work and any change that received an independent review, also record the review provenance. Record a value as `unknown` rather than omitting the field:
- reviewer interface (for example Codex CLI, Copilot pull-request reviewer, Cursor, direct API)
- reviewer lineage (the model family behind the interface; `unknown` if the interface does not disclose it)
- review mode (`parallel blind`, `sequential blind`, `sequential`, or `corroboration`)
- reviewed commit (the exact commit SHA the reviewer saw)
- review evidence reference (where the review text and its verdict are kept)

## Worklog Governance

`AGENT_WORKLOG.md` is the single active append target for agent worklog entries.

Agents must preserve historical worklog entries byte-for-byte. Historical entries are evidence of the state and authorization at the time they were written; they must not be rewritten, reordered, summarized, normalized, or deleted to match later repository, PR, deployment, or author-status changes.

Before the first modification of `AGENT_WORKLOG.md` in each task, run a read-only local/remote inventory of other project work when remote evidence is available. Exclude the current branch. Exclude routine bot/dependency branches from the normal feature-work gate unless the task concerns dependency integration; list them separately as the dependency queue.

Classify relevant non-bot work as one of: `completed_pushed_unmerged`, `in_progress`, `hold`, `merged_directly`, `merged_via_pr_or_squash`, `ambiguous`, or `author_status_unknown`.

Do not rely only on ancestry checks. A branch tip that is not an ancestor of `main` may still have been merged by PR or squash merge. Prefer PR merge metadata, then patch/tree equivalence, then direct ancestry, then explicit author/worklog status, then branch age/name/workstream clues. Weak evidence must produce `ambiguous`, not an unmerged-work claim.

If any relevant non-bot work is classified as `completed_pushed_unmerged`, `ambiguous`, or `author_status_unknown`, stop before the first worklog write and ask the author whether to include that work in the current integration cycle, continue separately, classify it as `in_progress` or `hold`, or stop and process the existing work first.

Author-declared `in_progress` or `hold` work must be listed but does not repeatedly block unrelated work. Reconfirm only when `main` advances in a relevant way, the branch or PR state changes, an integration operation occurs, or the previous inventory is no longer current.

If GitHub or PR state is unavailable, distinguish available remote branch evidence from unavailable PR state. Report uncertainty instead of inferring PR status. Unknown PR state blocks only when the work is otherwise relevant and lacks current author status.

The pre-append inventory is advisory evidence only. It does not authorize merge, conflict resolution, PR creation, publication, deployment, branch deletion, or status promotion.

Review `AGENT_WORKLOG.md` rollover eligibility at 4,000 lines, do not normally exceed 5,000 lines without explicit author deferral, and also review after a major integration cycle or quarterly, whichever trigger occurs first. Execute rollover only as a separate authorized task after `main` is stable. Archived worklogs are immutable historical evidence. `AGENT_WORKLOG.md` remains the current append target after rollover.

When available, run `node scripts/check-agent-worklog-governance.mjs` as read-only validation evidence. Its output does not determine author status, merge readiness, integration priority, or authorization.

### Guard lifecycle

Every guard introduced by a governance change carries a review date (`review_after`) and a stated sunset condition (`sunset_condition`), so that it is retired deliberately rather than accumulating by default. When `review_after` passes, the guard is re-examined and either renewed with a new date, retired because its sunset condition is met, or escalated to the owner. Guards added by the 2026-08-26 governance PR (`agentgov/worklog-prefix-check-and-rule-elevation`):

- Byte-prefix append-only check (`scripts/check-agent-worklog-governance.mjs`, `AGENT_WORKLOG.md` must keep the `origin/main` worklog as an exact byte prefix): review_after 2026-11-26; sunset_condition: retired when the repository migrates to per-run immutable records (`agent-runs/` plus a generated index) and `AGENT_WORKLOG.md` is archived with a pinned identity.
- Structural pipeline test (`tests/check-pipeline-structure.test.ts`, the frozen `scripts.check` prefix rule above): review_after 2026-11-26; sunset_condition: merged into `tests/public-surface-adjacency-map/preservation.test.ts`, or retired when the frozen prefix is replaced by the semantic layer.
- Known-environmental note (the "Known-Environmental Failures" section above): review_after 2026-11-26; sunset_condition: removed when CI runs on Windows or the GNU tar `host:path` defect is fixed upstream.

The user remains final authority for public release, naming, classification, relation confirmation, top navigation, and merge / publication decisions.
