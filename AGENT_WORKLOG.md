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

### 2026-10-05 - October 4 revisited page and bounded indexing update

Agent: AI-assisted implementation.
Task: Add the approved revisited essay with seven earlier additions and three separately colored October 5 updates; preserve the original text and URL.
Files changed: New revisited page, its data, styles and interaction asset; Artistic Research entry; indexing metadata and contracts for August 18, September 19, October 4 and the revisited route; corresponding tests; this worklog.
Build / tests run: 19 artifact integrity, event-model and static print checks passed. The 19-file proposal patch reproduced the reviewed source snapshots. Full repository build, browser and actual print checks remain pending; Linux site-ci is authoritative.
Result: Independent source review found no Draft PR content blocker after attribution and print-fallback corrections.
Unresolved questions: Exact-head CI; rendered metadata, response headers, keyboard/mobile behavior and JavaScript-on/off printing.
Risks or assumptions: Other indexing exclusions remain unchanged. Automatic branch deployment may update the live site; this risk was acknowledged before this push. No merge is requested.
Review provenance: reviewer interface: independent document review; reviewer lineage: unknown in this public record; review mode: sequential; reviewed commit: unknown (pre-commit source artifact); review evidence reference: PR review-status summary. Private operational details are omitted from this public log.
Inventory: Current main and remote branches/PRs were checked before this append. Previously declared separate/held work remains separate under the recorded dispositions in PR #127; reviewed portions of #146/#147 were integrated by #151. Other applicable feature branches are merged. The open dependency queue (#153, #155, #156, #158) is excluded. No other work is integrated here.

### 2026-10-05 - Revisited stylesheet order and print regression coverage

Addressed the first PR review's remaining technical findings: load the October 5 palette after shared/revisited styles, and commit event-model tests that execute both shipped handlers with multiple listeners retained. The tests cover mixed original/earlier/latest disclosure states, absent original-app initialization, repeated print events, cancellation/closure and later cycles. Added scoped CSS fallback and import-order mutation checks. The original essay and all ten additions remain unchanged.

Validation: three focused regression tests passed. The preceding head passed full Linux site-ci and Cloudflare build; the new head requires its own CI and review. Real-browser print layout remains unverified.
Review provenance: interface GitHub Copilot PR reviewer; lineage unknown; mode sequential; reviewed commit 2e1fa81b537274c3065cc5fd54f68bf235239903; evidence PR #159 inline review. This repair is pending re-review. No merge performed.

### 2026-10-05 - Composed-reading preservation regressions and entry boundaries

Restored the Artistic Research introduction's existing authored-comparison, source-evidence and non-causality qualifications beside the new links. Added committed composition checks for byte-identical recovery of the original after removing seven earlier and three latest insertions, unique IDs, resolved fragments, closed source disclosures and visible main paragraphs. Negative mutations cover altered original text, duplicate IDs, broken fragments and prose moved inside a disclosure. Essay bodies remain unchanged.

Validation: two focused tests and their negative mutations passed; preceding head 13bc27ee76d6b52f7f162aef095a0eeffbafd72f passed full Linux site-ci. This head requires fresh CI and review. The second Copilot review confirmed stylesheet order, retained earlier open threads, and suggested these additional regressions and restored boundaries. Real-browser print and accessibility coverage remain incomplete; no merge performed.
Review provenance: interface GitHub Copilot PR reviewer; lineage unknown; mode sequential; reviewed commit 13bc27ee76d6b52f7f162aef095a0eeffbafd72f; evidence PR #159 second review.

### 2026-10-05 - Publication-state cleanup and distinct reading groups

Removed only the two approved obsolete publication-state statements from the original manuscript and synchronized original/revisited renderings and metadata. Retained the remaining source-distinction, case-date and cutoff sentence. Updated source hashes and added a reversal test: restoring exactly those removed strings must recover each frozen original hash. Other essay and addition text remains unchanged.

Added separate entry headings for the three earlier Public Slices and for the August/September pair versus the independent October original/revisited pair. Preserved the accepted introduction, with its preservation sentence clarified to disclose only the publication-state cleanup. No homepage changes.

Added a scoped print hover-color override for the earlier seven additions and a regression that rejects its removal. Validation: five focused preservation/grouping/print tests passed; source hashes synchronized through exact text transformations. The isolated original renderer was not run and no dependency installation was performed. The preceding head passed full Linux CI; this head needs fresh CI and Copilot review. Real print-engine and complete accessibility evidence remain outstanding. No merge performed.
Review provenance: interface GitHub Copilot PR reviewer; lineage unknown; mode sequential; reviewed commit 05d160e636ec9c13ca54a49f88c134cef2086394; evidence PR #159 third review. Its additional hover finding is addressed here; earlier open threads are not manually marked resolved.
