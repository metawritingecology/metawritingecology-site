# Agent Worklog

Agents must append entries here after making changes.

## Active Log Notice

This is the single active append target for agent worklog entries. Preserve historical entries byte-for-byte. Canonical governance rules, including pre-append inventory and rollover policy, live in `AGENTS.md`. Archived logs, when present, are indexed under `docs/worklogs/`.

## Entry Format

### YYYY-MM-DD — agent-name — task-name

Agent:
Task:
Files changed:
Build / tests run:
Result:
Unresolved questions:
Risks or assumptions:

## Archived volumes

Historical dated entries from 2026-07-06 through 2026-08-26 are immutable evidence in `docs/worklogs/AGENT_WORKLOG_2026-Q3_part-1.md`, indexed by `docs/worklogs/README.md`. Do not edit archived logs. This file remains the single active append target.

### 2026-09-19 - Claude Code - q002-worklog-rollover-materialized

Agent: Claude Code (claude-fable-5-1) on the PC, local worktree C:\dev\_worktrees\mwe-q002-q003, branch sitegov/q002-worklog-rollover cut from 6fc0f4ed593ff0d744d78408650ae44218d57f85 (origin/main at the time of writing). No upstream is configured for the branch.
Task: Materialize the owner-authorized AGENT_WORKLOG.md rollover (owner-queue Q-002, ruled proceed 2026-08-26T23:20Z; owner instruction 2026-09-19 to complete the rules locally without touching GitHub) on a fresh branch off the integration commit, so that a rollover pull request would carry only the rollover. Not performed and not authorized: push, pull request, merge, any change under src/, scripts/, tests/, package.json or pnpm-lock.yaml.
Files changed:
- docs/worklogs/AGENT_WORKLOG_2026-Q3_part-1.md - new immutable archive; byte-identical to `6fc0f4ed593ff0d744d78408650ae44218d57f85:AGENT_WORKLOG.md` (git blob `cbbac1bf86ee5801e3bcba5d9383d06f2505139e`, 766253 bytes, 4837 LF lines, 114 dated entries 2026-07-06 through 2026-08-26, sha256 `a370fa54f6ac95af6e8d2f1a4a82fd334342cf93fffbda7656b3074350e629bd`).
- docs/worklogs/README.md - new archive index (891 bytes, sha256 `5e94079073e6e20dbb899b5c647e0fd841538e51674921f1ec39646fcd044016`).
- AGENT_WORKLOG.md - rolled: the header bytes of the source worklog (Active Log Notice and Entry Format, unchanged), an Archived volumes pointer, and this entry. No historical entry is edited or dropped; every one of them lives in the archive.
- .gitattributes - adds `docs/worklogs/*.md text eol=lf` beside the existing AGENT_WORKLOG.md pin, so the archive's byte identity survives a checkout with core.autocrlf on.
- AGENTS.md - one sentence added to the rollover paragraph under Worklog Governance, stating what the byte-prefix check reports at an authorized rollover and which invariant replaces it for that single integration. The Guard lifecycle schedule is not edited.
Build / tests run:
- python Roll-Worklog.py (kept with the evidence, path below): archive re-read from disk equals the source blob; the active file equals header + pointer + this entry; strict UTF-8, no CR, no BOM.
- node scripts/check-agent-worklog-governance.mjs (this branch carries the origin/main version): exit 1 with exactly one error, "AGENT_WORKLOG.md is not append-only" - expected at a rollover, because the observed integration-commit worklog has moved into the archive and is no longer a prefix of the rolled file. Active Log Notice count 1, points to AGENTS.md, AGENTS.md invocation pointer present. The check is advisory (AGENTS.md: its output does not determine merge readiness) and is not part of `pnpm run check` or the site-ci workflow; it holds again for every later branch once the rolled file is on main.
- node --test tests/public-surface-adjacency-map/preservation.test.ts and tests/check-pipeline-structure.test.ts on this branch: recorded in the evidence folder.
Result: Rollover materialized locally on a branch that carries nothing else. Nothing pushed, no pull request, no merge. The prior 2026-08-27 execution of Q-002 by Grok Build (uncommitted, in the sitegov/astro7-migration working tree) is preserved as evidence in C:\dev\shared\site-gov\versions\20260919-1511-q002-q003-materialized\inputs\ (active file 8917 bytes, sha256 73c0bae004d63f7c...; README 891 bytes, sha256 5e94079073e6e20d...) and is superseded by this materialization; its two dated entries were never committed and are not carried into this file.
Pre-append inventory gate, run before the first modification of AGENT_WORKLOG.md in this task (AGENTS.md, Worklog Governance). Current branch excluded. git fetch --prune origin; origin/main = 6fc0f4ed593ff0d744d78408650ae44218d57f85. gh pr list --state open: #147 sitegov/pr142-144-145-baseline-integration (repository owner, stacked on #146) and #146 claude/tender-turing-tniexe (repository owner), both classified in_progress (open pull requests by the author, site-ci green at the time of the inventory); #142, #144, #145 are dependabot (bot, excluded). Closed-PR branches still carrying requires_author_or_pr_review=true keep their 2026-08-27 classification: claude/p7-1-implementation-plan-7t42ah (#101) hold; claude/related-governance-surface (#127) hold; codex/update-site-from-meta-writing-ecology (#10) hold; fix-public-surface-metadata-and-crawler-files (#1) hold; rev10-deployment-metadata merged_via_pr_or_squash by tree equivalence (#120); chore/update-download-artifact-20260801 (#106) superseded via #107. No relevant non-bot work is completed_pushed_unmerged, ambiguous, or author_status_unknown. Gate does not stop. The inventory is advisory only and authorizes no merge, publication, or deployment.
Review provenance: reviewer interface none at the time of this entry (independent review pending); reviewer lineage unknown; review mode unknown; reviewed commit unknown; review evidence reference C:\dev\shared\site-gov\versions\20260919-1511-q002-q003-materialized\ (to be updated when a review lands).
Unresolved questions: (1) Landing order and timing are the owner's. The archive equals main's worklog at 6fc0f4ed593ff0d744d78408650ae44218d57f85; open pull requests #146 and #147 append to AGENT_WORKLOG.md (their heads carry 5026 and 5068 LF lines), so if either merges first the rollover must be regenerated against the new main with Roll-Worklog.py before a rollover pull request is opened. A stale archive is a landing failure. (2) Whether the checker gains a rollover-aware mode is a separate governance change under the Guard lifecycle schedule (review_after 2026-11-26); this branch relies on the documented single-integration expectation instead.
Risks or assumptions: The rolled file is below the 4,000-line review threshold by construction. The 5,000-line ceiling in AGENTS.md has no mechanical consequence; the checker reports a status string only. Line counts here are LF-byte counts. No classification, naming, registry, relation, or public/private boundary decision was made.
### 2026-09-19 - Claude Code - q003-standing-identity-move-flow

Agent: Claude Code (claude-fable-5-1) on the PC, local worktree C:\dev\_worktrees\mwe-q002-q003, branch sitegov/q003-identity-move-flow, stacked on sitegov/q002-worklog-rollover (cut from 6fc0f4ed593ff0d744d78408650ae44218d57f85). No upstream is configured for the branch.
Task: Materialize owner-queue Q-003 (ruled yes 2026-08-26T23:20Z; owner instruction 2026-09-19 to complete the rules locally without touching GitHub): generalise the 2026-08-25/26 one-file freeze exception on tests/public-surface-adjacency-map/preservation.test.ts FROZEN_IDENTITIES into a standing owner-authorized identity-move flow, the same shape as guard 9 in renderingBoundary.test.ts, written against origin/main's current state rather than the 2026-08-27 astro7-branch draft. Not performed and not authorized: any FROZEN_IDENTITIES byteLength, sha256 or gitBlob value change; pin retirement (Q-007); push; pull request; merge.
Files changed:
- AGENTS.md - new section "Frozen Product Identities" placed after "Frozen Check-Pipeline Prefix": restore by default; the only exception is an explicit owner authorization naming the path(s); the same change updates that entry's identities, records the previous identities in a dated comment on the entry and cites the authorization in this file; every other entry stays frozen. One Guard lifecycle line is added for the new section (review_after 2026-11-26).
- tests/public-surface-adjacency-map/preservation.test.ts - the header now states the standing exception and carries the identity-move history (2026-08-18 scripts/verify-public-surface-map-build.mjs on PR #130; 2026-08-25/26 src/components/publicSurfaceAuthorityMap.client.ts on PR #139). The two moved entries gain a dated comment recording their previous identities, which the flow requires and which main did not yet record. Comments only: no byteLength, sha256 or gitBlob value changed, FROZEN_IDENTITIES.length stays 20, BASE_PIPELINE untouched.
- AGENT_WORKLOG.md - this entry.
Build / tests run:
- node --test tests/public-surface-adjacency-map/preservation.test.ts and node --test tests/check-pipeline-structure.test.ts (the latter reads preservation.test.ts as source text): results recorded in the evidence folder.
- node scripts/check-agent-worklog-governance.mjs: exit 1 with the single expected rollover error inherited from the Q-002 branch beneath this one; every other assertion passes.
- Scan of the touched prose for the literal ASCII not-equal marker: none introduced.
Result: The standing flow exists on a branch stacked on the rollover. It does not authorize a pin move by existing; each move still needs its own owner authorization naming the path. Nothing pushed, no pull request, no merge. The 2026-08-27 draft of the same change (Grok Build, uncommitted on sitegov/astro7-migration) is preserved as evidence in C:\dev\shared\site-gov\versions\20260919-1511-q002-q003-materialized\inputs\ and superseded: two of its sentences described that branch's stale client.ts pin and would have been false on main.
Pre-append inventory gate: the task-level inventory recorded in the q002 entry above was run before this task's first worklog write; nothing changed between the two writes (origin/main 6fc0f4ed593ff0d744d78408650ae44218d57f85; open pull requests #146 and #147 in_progress; dependabot excluded). Gate does not stop.
Review provenance: reviewer interface none at the time of this entry (independent review pending); reviewer lineage unknown; review mode unknown; reviewed commit unknown; review evidence reference C:\dev\shared\site-gov\versions\20260919-1511-q002-q003-materialized\.
Unresolved questions: (1) Q-007 (retire seven byte-frozen pins, deadline 2026-09-26) is open; this flow covers whichever entries remain pinned under any of its outcomes. (2) If this branch is landed without the rollover beneath it, this entry must be re-appended onto main's worklog as a pure append. (3) Independent review has not yet been dispatched.
Risks or assumptions: Comments in preservation.test.ts are not the live contract; the FROZEN_IDENTITIES values are. The new AGENTS.md section is a rule about an existing guard rather than a new guard; it carries a Guard lifecycle line anyway, following the precedent of the Known-environmental note. No classification, naming, registry, relation, or public/private boundary decision was made.
