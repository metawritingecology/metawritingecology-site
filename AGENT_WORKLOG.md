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

### 2026-10-05 - Historical quotation and short film transition

Added the approved two-sentence reference to the 2009 television film Prayers for Bobby, followed by a separately dated 18 September 2010 excerpt from Chen Chun-ju, mother of Yeh Yung-chih. Chinese quotation and labelled English translation are visible; source/date limitations are in a separate disclosure. CivilMedia's 27 September 2010 publication date remains distinct from the event. The film is not presented as influencing Chen or dating a real council speech; neither mother is presented as responding to the 2026 case.

Removed the redundant newly drafted three-sentence explanation. Counts remain seven earlier additions, three October 5 news additions, one historical source and one short film transition. No original essay argument or existing addition changed, apart from the separately recorded approved publication-state cleanup. No homepage change is included.

Validation: twelve artifact checks and five bounded candidate contracts passed. The composition test now strips the two separate historical/film blocks as well as the earlier additions and compares the remainder exactly to the current original. No full build or independent review of this new candidate had run before commit; exact-head Linux CI and Copilot review are required next. No merge performed.
Review provenance: reviewer interface unknown for these latest additions; lineage unknown; mode unknown; reviewed commit unknown; evidence reference pending PR review. Earlier review approval does not cover this new material.

### 2026-10-05 - Preserve explicit GitHub source-policy restrictions

Restricted the exact pinned-manuscript exception to the default repository policy. Explicit empty or narrower allowlists now reject the URL; an explicit website-repository allowlist follows ordinary validation. Added direct-validator and occurrence-classifier regressions for all three cases. Article, metadata, CSS and interaction behavior are unchanged.

Validation: seven focused assertions passed. The preceding head passed full Linux site-ci and Cloudflare build. This repair requires new exact-head CI and review. No merge performed.
Review provenance: interface GitHub Copilot PR reviewer; lineage unknown; mode sequential; reviewed commit 7ac2c5bb9fe32a6d6c1fc4cb2a3b481de5a7961e; evidence PR #159 review submitted 2026-10-05T18:58:26Z. Real print/accessibility and production-response verification remain incomplete.

### 2026-10-07 - Desktop homepage article entries

Agent: AI-assisted implementation.
Task: Integrate the approved editorial desktop artwork and article copy as two reading groups after the homepage introduction.
Files changed: src/components/DesktopArticleEntries.astro, src/pages/index.astro, AGENT_WORKLOG.md.
Build / tests run: Source-preservation checks passed: removing the new import and component call recovers the original homepage exactly; both desktop SVGs and three approved links match the accepted preview; SVG XML is valid; mobile SVGs and mobile-specific styles are excluded. Original desktop preview rendering and article-link keyboard focus were checked. The integrated Astro build, full Linux site-ci and exact-head review remain pending.
Result: The new entries are displayed only at viewport widths of 1024 CSS pixels and above. Narrower layouts retain the existing homepage. The August/September pair remains one reading group, and the October revisited essay remains a separate group. Existing prose, navigation, search, metadata, global styles and diagnostic components are preserved.
Unresolved questions: Integrated browser verification and exact-head CI/review. Phone, touch and other responsive variants remain a separate task and are not included.
Risks or assumptions: The accepted standalone preview is source material, not a replacement for BaseLayout. Automatic branch builds may update the live site; the owner accepted that possibility for this desktop-only PR before push. No merge is requested.
Review provenance: reviewer interface unknown for this integration; reviewer lineage unknown; review mode unknown; reviewed commit unknown; review evidence reference pending PR review. Earlier source/preview checks do not constitute independent review of this integration.
Inventory: Main and all current remote branches and PRs were checked before this append. Previously owner-declared separate/held work remains separate under the dispositions recorded in PR #127; reviewed portions of #146/#147 were integrated by #151, and #148/#149 were followed by the public-worklog cleanup. Other applicable feature branches are merged. Open dependency PRs #153, #155, #156 and #158 are listed separately and excluded. No other branch is integrated.


### 2026-10-12 - Responsive homepage article entries

Agent: Codex.
Task: Complete the accepted v4 homepage article-entry layout and narrowly repair F1/F2/F3 of the preceding independent review: continuous responsive cascade, check-tail integration and duplicate-anchor regression coverage, without changing the global reading width.
Files changed: src/components/DesktopArticleEntries.astro, src/components/PublicSearchModal.astro, tests/homepage-responsive.test.ts, AGENT_WORKLOG.md.
Result: The two accepted mobile SVGs are preserved exactly alongside the existing desktop SVGs, with a shared set of three article links. Up to 700 CSS pixels the original v4 mobile artwork follows the copy; above 700 pixels the accepted desktop composition is the default, including fractional layout widths. Global styles, the 760px container, homepage prose, navigation and article URLs are unchanged. Search now restores the opening control's focus on close; the observable baseline issue was failure to return focus to the opener; the dev baseline's activeElement was body.
Build / tests run: The preceding candidate's full pnpm run check passed (exit 0): 1,195 Node tests, 1,194 passed, zero failed, one platform skip; build, Astro check (zero errors/warnings, six hints), TypeScript, deployment dry-run and all build verifiers passed. The preceding two focused homepage source-preservation tests passed separately. This repair expands them to four tests (including duplicate-anchor negative mutations) and appends test:homepage-responsive at the existing check tail, preserving all previous steps and dependencies. The preceding built-worker Chrome verification passed 179 checks covering 390, 500, 700, 701, 1023, 1024 and wide desktop, extra narrow/landscape and low-height cases, repeated resize and emulated mobile pinch zoom, overflow, reading/link focus, all three destinations, Back/Forward and search focus return. Desktop pixel comparisons were captured at 900px height. Their original HEAD baseline was obtained from astro dev; the candidate matrix used a built local worker. Desktop images at 1024/1440/1920 match the original implementation pixel-for-pixel; mobile images at 390/500/700 match the accepted v4 source pixel-for-pixel.
Unresolved questions: Fresh independent difference review, exact-head Linux site-ci, requested fractional-layout cases, physical-device/Safari coverage and publication-process verification remain pending. Live external search queries and production-site access were not performed.
Risks or assumptions: The original mobile artwork was obtained through a complete supported text read after local materialization failed on Windows; normalized source/SVG identity and XML validity were verified. Earlier environment failures are retained separately. Windows auto-CRLF checkout caused source/byte tests to fail; restoring baseline files to their exact committed bytes resolved those failures without changing tracked source or persistent Git configuration. A Windows-unavailable permission test remains skipped. No push, PR, merge or deployment was performed. Automatic branch-build publication remains a release gate.
Review provenance: the preceding uncommitted candidate (patch SHA-256 e4e9c196329de5e59db2294fb3fe4509724bb9c2b30a3aa64c6f5cb27b46184f) was reviewed by Claude Code 2.1.296; reviewer lineage Anthropic Claude Opus (reported model claude-opus-5-5); review mode sequential, not blind; reviewed commit none; review evidence reference separately retained original independent report. Its verdict was NON-BLOCKING FINDINGS (seven findings). This report is not approval of the repair candidate; a new difference review is required. The original report and separate 900px/dependency clarification remain unchanged. The implementation agent's checks are not independent review.
Inventory: The current branch was excluded from the read-only branch/PR inventory. Main remains at the accepted desktop baseline; PR #160 is merged_via_pr_or_squash. No open feature PR duplicates this work. Previously owner-declared separate/held branches remain separate under recorded dispositions; reviewed portions of #146/#147 were integrated by #151. Open dependency PRs #153, #155, #156 and #158 are excluded. No other work was integrated.

Repair validation: Full pnpm run check passed (exit 0): 1,199 tests, 1,198 passed, zero failed and one permission-capability skip; the four homepage tests ran at the new check tail. Build, Astro/TypeScript and all build verifiers passed. The repeated built-worker matrix and reference comparisons passed 179 checks; five additional search reentry/removed-opener/body-shortcut checks passed after render settling, for 184 total. Immediate and settled focus observations are retained; no useful-control fallback is claimed when the opener is removed or body opened the modal. Exact 700/701 boundaries passed. Requested fractional layout widths 700.1/700.5/700.9 remain untested: current adapters reject/round fractional dimensions; attempted visual/pinch sizing and zoom requests did not produce those layout/media-query conditions, and are excluded from pass counts. Source desktop rules now apply by default and mobile overrides at <=700px, with no query gap. Search source is byte-identical to the preceding candidate; no focus trap or fallback added. Fresh difference review is separate evidence and does not retroactively alter the original report.


### 2026-10-13 - Local desktop homepage width candidate

Agent: Codex implementation and self-verification.
Task: Respond to the new desktop visual-width request following merged PR #164, without publishing unseen styling.
Files changed: src/components/DesktopArticleEntries.astro, AGENT_WORKLOG.md.
Result: Only the homepage entry component expands on fine-pointer hover-capable desktop viewports from 1024px. Its width starts at the existing 712px and grows to a 1064px cap; SVG proportions are retained and copy is capped at 460px. Touch devices, mobile styles, prose, article pages, navigation and links are untouched. Larger desktop artwork also makes the cards taller; this design tradeoff remains for the owner to view.
Validation: Full local pnpm run check exit 0: 1199 tests, 1198 passed, 0 failed, 1 platform skips; build, Astro, TypeScript, deployment dry-run and verifiers completed. Four accepted-SVG/link preservation tests passed. Built-worker browser verification covers 390/500/700/701/1023/1024/1280/1440/1579/1920, 900px/320px heights, repeated resize, links, Back/Forward, focus and search. All behavioral checks passed; strict screenshot comparisons retain two failures at 390 and 701 (small SVG raster differences; exact cause unresolved). Geometry and accepted SVG source identity remain unchanged below the new desktop breakpoint. Baseline/candidate captures are local headless Chrome at synthetic sizes, not the user's current PC screen. Earlier development-render and sandbox Worker readiness failures are retained in evidence-desktop-width rather than presented as passing.
Inventory: Current branch excluded. Local responsive branch is merged_via_pr_or_squash via #164 at 20dd7076922c9e32fc590ff488181e2838540093; no open non-bot feature PR duplicates this work. Previously owner-declared held/separate unrelated work remains under its recorded disposition. Open bot dependency queue #153/#155/#156/#158/#161/#162/#163 is excluded. No other work integrated.
Unresolved: Existing CUA js_reset/getState and a new getState following confirmed PC reconnection all return Transport closed before browser enumeration; current user URL/title/screenshot/viewport/DPR/zoom remain unavailable. Physical desktop visual acceptance, independent review of this candidate and exact-candidate Linux site-ci remain unperformed. No new reviewer dispatch is authorized by prior bounded PR164 review.
Risks / assumptions: Local browser metrics are synthetic and do not establish the current user's zoom or viewport. Strict pixel discrepancies are disclosed without changing source to conceal them. No push, new PR, merge, deployment, Gateway operation or permission/service change occurred.
Review provenance: reviewer interface unknown; reviewer lineage unknown; review mode unknown; reviewed commit unknown (uncommitted candidate); review evidence reference none for this new styling. Codex's own checks are not independent review.


### 2026-10-13 - Shared desktop site width; supersedes card-only candidate

Agent: Codex implementation and self-verification.
Authorization: Owner explicitly expanded the same candidate from homepage cards to title/navigation/preface, then to the desktop outer containers on all pages. Existing normal GitHub publication authorization applies after complete validation and independent review. The preceding local-only card candidate is historical and is not the release scope.
Files: src/styles/global.css, src/components/DesktopArticleEntries.astro, two public-slice pages (2026-07-25 and 2026-07-31), language-pressure-test-lab-prototype.astro, public-surface-case-2026-10-04.css, AGENT_WORKLOG.md.
Result: Shared ordinary desktop outer width 1112px, content about 1064px, including homepage title, preface, lower sections and footer. Navigation width 1064px with natural wrapping retained, desktop gap 16px. Text paragraphs cap at 80ch; the homepage preface uses the full content width. Standalone dated reading pages inherit the shared outer width and two slice/prototype overrides are adapted. All 54 page sources share global.css directly (10) or via BaseLayout (44). Existing 1200px/1440px graph workspaces retain their wider canvas/side-panel accommodation; authored inner reading caps remain distinct from outer width. No copy, links, navigation entries or metadata changes. Screen media requires width at least 1024px, fine pointer and hover; phone/touch/print rules are preserved.
Tests: Full local check exit 0: 1199 tests, 1198 pass, 0 fail, 1 Windows permission skip. Fresh post-check build exit 0 and generated assets contain 1112px. Representative built-worker regression 134 checks, all pass, covering ordinary directory/fiction/long-form, all custom layout types, graph pages and 404; existing main size matrix and search/link/focus/Back/Forward checks passed. A first nav-row assertion incorrectly compared child top edges rather than aligned centers; the 1px button height difference was a harness issue. A localhost Wrangler proxy crash was retained and the task's own preview was restarted; no update or Gateway operation performed. Trailing whitespace cleanup was nonsemantic; an exact frozen-candidate check is scheduled before publication.
Pixel diagnosis: At 701px identical DOM/CSS/geometry repeated element screenshots reproduce the 16-pixel difference. At 390px the three legacy differing edge pixels change RGB channels by at most 1. Paired baseline/candidate captures remove only the new inactive desktop media blocks: full DOM, all computed styles and geometry match; 390/701 each have three exact-zero full-page A/B comparisons and exact-zero same-document full-page repeats. Zero tolerance preserved. Element capture raster/coordinate quantization explains the historical comparison; exact Chromium internals remain inferred. Original failed artifacts retained. Evidence: evidence-site-width/pixel-diagnosis.json and pixel-diagnosis/states.json.
Inventory: Main freshly confirmed 20dd7076922c9e32fc590ff488181e2838540093; current candidate branch excluded; #164 merged_via_pr_or_squash. No open non-bot duplicate work. Prior owner-held/separate unrelated work remains under its disposition. Dependency queue #153/#155/#156/#158/#161/#162/#163 excluded.
Unresolved: Independent review is pending for this expanded scope, exact-head Linux CI pending push/PR. Physical PC observation remains unavailable because previously retried CUA transport closes before Edge enumeration. All screenshots are synthetic local renders, not current-PC acceptance; repeated same failed CUA calls are avoided.
Review provenance: interface unknown (pending Claude Code read-only review); lineage unknown; mode sequential; reviewed commit unknown until freeze; evidence reference pending site-width-review. Codex self-verification is not independent review.
