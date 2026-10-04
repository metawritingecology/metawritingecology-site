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

### 2026-10-04 - Independent Public Surface Case

Added the October 4 case, its Artistic Research introduction and link, server-rendered reading branches, dated-case assets, and exact sitemap exclusion. The approved manuscript, earlier specimens, root dependencies, and production configuration remain unchanged.

Validation: the original PR head passed the full repository CI check suite.

### 2026-10-04 - Source completeness and print-state fixes

Preserved source-section prose in its authored order and restored each disclosure's original state after printing. Regression tests cover source prose around numbered entries, repeated print events, cancelled or closed dialogs, and subsequent print cycles.

Validation: the full repository check suite passed with 1,185 tests and zero failures; the indexing stage passed 247 tests. CI for the follow-up commit is pending.
