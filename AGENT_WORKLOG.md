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

### 2026-09-20 - Codex - public-worklog-redaction

Agent: Codex
Task: Remove internal operational details from public worklog surfaces.
Files changed: AGENT_WORKLOG.md, AGENTS.md, docs/worklogs/README.md, .gitattributes, docs/worklogs/AGENT_WORKLOG_2026-Q3_part-1.md.
Build / tests run: Not run; documentation and governance cleanup only.
Result: Removed internal paths, owner instructions, agent and model identifiers, session identifiers, evidence references, and other private operational details from the public worklog surface. The historical archive is no longer published in this public repository.
Unresolved questions: None.
Risks or assumptions: Application code and public content were not changed. Older Git history is not rewritten by this cleanup.

### 2026-10-04 - Codex - independent dated case integration preparation

Agent: Codex
Task: Prepare the independent October 4 English Public Surface Case for draft pull-request review.
Files changed: New dated Astro page, editable case data and prebuilt SSR artifacts, scoped stylesheet, vendored D3/application assets, isolated renderer, focused integration tests; Artistic Research introduction/link; exact sitemap exclusion; bounded immutable GitHub link validation; indexing-test registration; this append-only entry.
Build / tests run: Frozen dependency installation with pnpm 10.34.5; complete pnpm check chain passed with temporary local inspector settings; indexing suite 244/244 including 9 case/validator tests; isolated renderer and jsdom runtime tests passed; compiled Astro page rendered with all 29 events, 7 branches, 15 combinations, 40 source entries and 297 unique IDs; generated sitemap excludes the case.
Result: Prepared for review. No merge or public website deployment performed. Earlier specimens, root dependency configuration, Astro/Wrangler production configuration, main navigation and global.css remain unchanged.
Unresolved questions: Clean-environment CI remains authoritative for the unchanged default production configuration; no visual browser review was performed.
Risks or assumptions: The cloud environment blocks automatic network-interface discovery. Validation temporarily disabled Astro's local debugger and assigned Wrangler an ephemeral local inspector port; both source configuration files were then restored byte-for-byte. The selected-news cutoff remains editorial, not an independently reverified evidence cutoff. Noindex is not access control.
Compatibility change: Existing indexing tests initially rejected the approved full-SHA tree overview and full-SHA blob line citations. The validator now accepts only those immutable forms and positive, non-reversed line anchors/ranges, preserving repository, scheme, query, unsafe-path and mutable-branch guards. Negative tests run in the existing indexing CI stage.
Pre-append inventory: Main equals c40f8c4a51637338b6d54144e2017909cab136fe. Relevant earlier case/slice work is merged via PRs 118, 129, 133 and 151; PR 151 explicitly reapplied the case content from closed PR 146. Open dependency PRs 153–156 are outside this content task.
Reviewer interface: unknown
Reviewer lineage: unknown
Review mode: sequential
Reviewed commit: c40f8c4a51637338b6d54144e2017909cab136fe (baseline)
Review evidence reference: unknown
