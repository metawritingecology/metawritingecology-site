# Agent Worklog

This public summary records changes, validation and remaining limitations at the time of each entry. Later entries may supersede earlier candidates or add evidence; a historical pending status is not a statement of current readiness. Implementation checks and independent review are distinguished. Private operational details are omitted.

## Entry Format

Each entry records the task and affected surfaces, results, validation scope and unresolved limitations. Test results apply only to the candidate and environment described.

### 2026-09-20 - Public worklog redaction

Removed private operational details from the public worklog and its supporting documentation. The historical archive was removed from the published repository. Application code and public website content were unchanged. Tests were not run because this was documentation-only cleanup. Earlier Git history was not rewritten.

### 2026-10-04 - Independent Public Surface Case

Added the October 4 case, Artistic Research introduction and link, server-rendered reading branches, dated assets and exact sitemap exclusion. The manuscript, earlier specimens, root dependencies and production configuration were preserved.

Validation: The original pull-request head passed the full repository CI check suite.

### 2026-10-04 - Source completeness and print-state fixes

Preserved source-section prose in its authored order and restored each disclosure's original state after printing. Regression coverage includes prose around numbered sources, repeated printing, cancelled or closed print dialogs and subsequent cycles.

Validation: The full repository check suite passed with 1,185 tests and zero failures; the indexing stage passed 247 tests. CI for the follow-up commit was still pending at this entry.

### 2026-10-05 - October 4 revisited page and bounded indexing update

Added the revisited essay with seven earlier additions and three separately coloured October 5 updates, preserving the original text and URL. Changes cover the new page, data, styles, interaction asset, Artistic Research entry, selected dated-route indexing contracts and tests. Other indexing exclusions were preserved.

Validation: Nineteen artifact-integrity, event-model and static-print checks passed. The 19-file proposal reproduced the reviewed source snapshots. Independent source review found no draft-content blocker after attribution and print-fallback corrections. That review was sequential and concerned a pre-commit artifact, not an exact committed head.

Remaining: Full build and exact-head CI; rendered metadata and response headers; keyboard/mobile behaviour; browser and JavaScript-on/off printing. Linux site-ci remains the full-chain readiness authority.

### 2026-10-05 - Revisited stylesheet order and print regression coverage

Loaded the October 5 palette after shared/revisited styles. Added event-model tests executing both shipped handlers with multiple listeners, mixed disclosure states, absent original-app initialisation, repeated printing, cancellation and later cycles. Scoped CSS fallback and import-order mutation checks were added. The original essay and all ten additions were unchanged.

Validation: Three focused regressions passed. The preceding head passed Linux site-ci and the hosting build. The repaired head still required fresh CI and review. Actual browser print layout remained unverified.

### 2026-10-05 - Composed-reading preservation regressions and entry boundaries

Restored authored-comparison, source-evidence and non-causality qualifications in the Artistic Research introduction. Added checks for byte-identical recovery of the original after removing the seven earlier and three later insertions, unique IDs, resolved fragments, closed source disclosures and visible main paragraphs. Negative cases cover altered text, duplicate IDs, broken fragments and prose moved inside disclosures. Essay bodies were unchanged.

Validation: Two focused tests and their negative cases passed. The preceding head passed Linux site-ci; the new head required fresh CI and review. The preceding review confirmed stylesheet order and requested the additional checks and boundaries. Actual browser printing and complete accessibility coverage remained outstanding.

### 2026-10-05 - Publication-state cleanup and distinct reading groups

Removed two obsolete publication-state statements from the original manuscript and synchronised original/revisited renderings and metadata. Source-distinction, case-date and cutoff qualifications remained. A reversal test restores exactly the removed strings and verifies the original hashes.

Added distinct headings for earlier Public Slices and the later reading groups, preserving the introduction except for disclosure of this cleanup. Added a scoped print hover-colour override and a regression that rejects its removal. Other essay/addition text and the homepage were unchanged.

Validation: Five focused preservation, grouping and print tests passed. The isolated original renderer was not run. The preceding head passed Linux CI; this head required fresh CI and review. Actual print-engine and complete accessibility evidence remained outstanding. Prior review threads were not treated as resolved merely by this entry.

### 2026-10-05 - Historical quotation and short film transition

Added a two-sentence reference to the 2009 film *Prayers for Bobby* and a separately dated 18 September 2010 quotation from Chen Chun-ju. The Chinese quotation, labelled English translation and separate source/date limitations distinguish the event from the source's 27 September publication. The film is not presented as influencing the speaker; neither historical scene is described as responding to the 2026 case.

Removed a redundant new explanation. The seven earlier additions, three October 5 additions, historical source and film transition remain distinct. The existing argument and homepage were otherwise unchanged.

Validation: Twelve artifact checks and five bounded candidate contracts passed. Composition checks remove the new blocks and compare the remainder exactly with the current original. Full build and independent review of these additions had not run; exact-head CI and fresh review remained required. Earlier approval did not cover this new material.

### 2026-10-05 - Preserve explicit GitHub source-policy restrictions

Restricted the pinned-manuscript exception to the default repository policy. Explicit empty or narrower allowlists reject the URL; an explicit website-repository allowlist follows ordinary validation. Added validator and occurrence-classifier regressions for all three cases. Article, metadata, CSS and interaction behaviour were unchanged.

Validation: Seven focused assertions passed. The preceding head passed Linux site-ci and the hosting build. This repair required fresh exact-head CI and review. Real printing, accessibility and production-response verification remained incomplete.

### 2026-10-07 - Desktop homepage article entries

Integrated editorial artwork and copy as two reading groups after the homepage introduction, using a shared component. Existing prose, navigation, search, metadata, global styles and diagnostic components were preserved. This version displayed the entries only at widths of at least 1024 CSS pixels; narrower layouts remained unchanged.

Validation: Removing the new component/import exactly recovered the original homepage. Both desktop SVGs and three links matched the accepted preview; SVG XML was valid. Standalone preview rendering and article-link keyboard focus were checked. Integrated build/browser verification, exact-head CI and review remained pending. Mobile/touch variants were outside this version's scope.

### 2026-10-12 - Responsive homepage article entries

Completed the responsive homepage layout and repaired cascade continuity, check-tail integration and duplicate-link regressions. The two mobile SVGs and existing desktop SVGs were preserved exactly, sharing three article links. At widths up to 700 CSS pixels, mobile artwork follows the copy; above that, the desktop composition applies. Global reading width, prose, navigation and URLs were unchanged. Search closing restores focus to its opening control; the original issue had left focus on the document body.

Validation history: The preceding candidate passed 1,195 tests (1,194 passed, zero failed, one platform skip), build, static checks and build verifiers. Its built-worker browser checks passed 179 cases. A separate sequential review returned seven non-blocking findings; it did not approve the later repair.

Repair validation: Full check passed 1,199 tests (1,198 passed, zero failed, one permission-capability skip). Four homepage tests ran at the preserved pipeline tail. Build, static checks and verifiers passed. The browser matrix and reference comparisons passed 179 checks, with five additional focus/re-entry cases, for 184 total. Desktop and mobile reference images matched their respective accepted sources.

Limits: Exact 700/701 boundaries passed. Requested fractional layout widths remained untested because available viewport controls rounded or rejected them; failed attempts were excluded from pass counts. No useful-control focus fallback is claimed when the opener has been removed or the body opened the modal. Fresh independent difference review, exact-head CI, physical-device/Safari coverage and publication-process verification remained outstanding. Windows line-ending failures were corrected by restoring committed bytes, without changing tracked source or persistent Git settings.

### 2026-10-13 - Local desktop homepage width candidate

Prepared a card-only desktop-width candidate: the entry component grows from 712px to a 1064px cap on fine-pointer, hover-capable viewports of at least 1024px. SVG proportions remain intact and copy is capped at 460px. Touch/mobile styles, prose, article pages and navigation were unchanged. Taller cards were a visible design tradeoff.

Validation: Full local check passed 1,199 tests (1,198 passed, zero failed, one platform skip), including build and verifiers. Four SVG/link preservation tests passed. Browser behaviour checks passed across desktop/mobile sizes, repeated resizing, links, history, focus and search. Strict image comparisons retained two small SVG raster differences at 390px and 701px; the cause was unresolved at this entry.

Limits: Captures were synthetic local browser evidence, not physical-screen acceptance. Direct physical-screen observation failed before browser enumeration. Independent review and exact-candidate CI remained outstanding. This candidate was superseded by the following wider-scope entry.

### 2026-10-13 - Shared desktop site width; supersedes card-only candidate

Expanded the candidate to shared desktop containers, including title, navigation, preface and footer. Ordinary outer width is 1112px, with about 1064px of content; paragraphs retain an 80ch cap and the homepage preface uses the content width. Standalone readings share the outer width, while authored inner reading caps remain distinct. Existing wider graph workspaces retain their accommodation. Phone, touch and print rules are preserved. Copy, links, navigation entries and metadata were unchanged.

Validation: Full local check passed 1,199 tests (1,198 passed, zero failed, one Windows skip). A fresh build contained the expected width. Representative built-worker regression passed 134 checks across ordinary and custom layouts, graphs and the error page. A navigation alignment assertion was corrected because it compared top edges rather than aligned centres; a local preview crash was retained as a failed attempt.

Image investigation: Matched baseline/candidate DOM, styles and geometry showed three exact-zero full-page comparisons and repeat captures at each of 390px and 701px. Earlier element-image differences were consistent with raster/coordinate quantisation; the exact browser-internal cause remained inferred, and original failures were retained.

Limits: Independent review and exact-head CI were pending. Synthetic renders did not establish physical-screen acceptance; direct observation remained unavailable.

### 2026-10-13 - Shared-width exact check and independent-review capacity hold

The frozen source candidate passed the exact-commit full check: 1,199 tests, 1,198 passed, zero failed and one platform skip. Representative browser checks passed 134/134; six strict-zero full-page comparison pairs remained valid evidence.

The independent-review attempt failed because reviewer capacity was unavailable. It produced no completed review or findings and is not review approval. Exact-head CI and the required independent review remained outstanding. Physical-screen acceptance was still unverified.

### 2026-10-13 - Shared navigation and site footer on eight dated readings

Added shared navigation/search/header and site footer to eight standalone readings, preserving authored presentation, article footers, metadata/indexing and scripts. Prototype and error pages remain unchanged exceptions. Shared components appear exactly once; added chrome is hidden in print. Article footers use note semantics to avoid duplicate site landmarks. Search can restore focus to chart elements.

Two initial CSS-scoping attempts caused 16 spacing failures; they were corrected without relaxing comparisons. October pages remain standalone. Dependencies, production settings and navigation entries were unchanged.

Validation: Final local full check passed 1,214 tests (1,213 passed, zero failed, one existing Windows permission skip), plus build, static checks and verifiers. Fifteen source contracts passed, including preservation and negative cases. Rendered shell verification passed 54/54 routes. Browser baseline/candidate comparisons passed 243 checks plus 72 supplementary checks, 315 total, including all former spacing failures and responsive, keyboard, focus, navigation, disclosure and print-restoration cases.

Limits: These are local synthetic browser results, not physical-device acceptance. Independent review and exact-head CI were pending; Safari, physical devices and actual paper output remained untested. Initial failed artifacts were retained.

### 2026-10-13 - Dated-page independent-review capacity hold

The candidate retained the previously checked runtime/test sources. Line endings were restored to authored LF conventions, and all 15 preservation contracts passed again. No semantic source changes followed the 315 browser checks and local 1,214-test check.

A further independent-review attempt failed because reviewer capacity was unavailable. It produced no completed review or findings. Exact-head CI could provide separate build evidence, but could not replace the pending review. Manuscript, indexing, prototype and error-page content remained unchanged.

### 2026-10-14 - Independent review of the dated-page shell

A sequential independent review completed with no findings. All 22 bounded source items, delivered in 42 parts, were read; 43 successful reads including the manifest were checked for byte identity, completeness and scope. No runtime/test source changed after review.

The reviewer did not execute tests. The 315 browser checks and 1,214/1,214 Linux test passes remain implementation/CI evidence, not reviewer-run tests. Earlier failed review attempts remain historical failures. The following documentation-only change still required its own exact-head CI. Safari, physical-device and actual paper-output limits remained unresolved.

### 2026-10-18 - France public-surface reading and approved entry points

Added the English France/Taiwan/Hong Kong reading, homepage entry and Artistic Research introduction. The article uses the date-only route and has no inline illustration; the geometric SVG appears only on the homepage. The original 04:01 UTC snapshot and 04:23 UTC event-record cutoff remain distinct from later editing time.

The page preserves French/Chinese terms and the dated event hashtag. Canonical, language, structured metadata, indexing and shared-shell registration follow existing contracts. Earlier content, four existing SVGs, navigation, dependencies, lockfile and check pipeline were preserved. All 54 citations retain source/rendered URL parity. Fragment validation uses actual section IDs and retains missing-fragment negative cases.

Validation: Pinned-toolchain installation, Astro and TypeScript checks passed. Initial focused tests passed 305/305. A later source-contract batch passed 1,212/1,212, with no failures or skips. Diff and touched-prose checks passed. Full check stopped during Cloudflare prerender setup because network-interface enumeration failed; a retry could not start. No full-build or browser pass is claimed.

A sequential source review found no actionable content/preservation issue and identified a test-extraction false positive that was corrected. This was not a separate-lineage independent review and did not run browser tests or recheck external sources. Exact-head CI, hosted-preview/browser verification and a later release decision remained outstanding.

### 2026-11-15 - Guandu dated reading

Added the English Guandu reading, selected homepage illustration and Artistic Research listing. Updated dated-route metadata, shared-shell registration and related tests. Existing content and navigation are preserved; the illustration appears only on the homepage. Numbered references follow the existing reference typography.

Validation: Astro and TypeScript checks passed. Focused metadata, homepage, shared-shell, adjacency-metadata and indexing tests passed 316/316. Charset, pipeline-preservation and diff checks passed. Static desktop and mobile previews were inspected. Full build remains unverified because the local build environment failed during Cloudflare prerender setup.

Remaining: Successful full build and exact-commit CI verification. No independent review is claimed; static preview inspection is not an integrated runtime browser pass.

## Active Log Notice

This is the active public worklog. Repository guidance is in `AGENTS.md`.

### 2026-11-18 — Beiyang dated reading and entry surfaces

Agent: Codex. Implemented the author-approved English reading at the 18 November dated route, with a homepage card and Artistic Research entry. The approved illustration appears only on those two entry surfaces, not in the article. Removed draft/editorial presentation notices; preserved article wording, two broadcast passages, case-date metadata, 18 citations and 15 source entries. Shared site navigation and earlier content remain unchanged. Added scoped styling, route/shell registration and updated expected route/link contracts; no dependency or pipeline changes.

Pre-append inventory: based on main 0c42d0010c447cfda5d2cd0d8243bc863ac73361. Remote open-PR query returned none. Relevant sanitize-guandu-worklog work is merged_via_pr: GitHub PR #170 reports merged on 15 November, merge commit d913779f9cfd7f997722460af54c8fc68ffc2f06. Local Guandu candidate trees match the earlier integrated source tree except historical worklog records; those branches and records were not modified. Remaining remote branch names were inventoried without inferring unmerged status from ancestry. Historical dependency branches are a separate queue, not included in this content change.

Files: new dated page, rendered article, scoped style and PNG asset; homepage component, Artistic Research markdown, metadata registry, shell route contract and four corresponding tests. Existing worklog bytes were preserved as an exact prefix.

Validation: pinned pnpm frozen-lockfile installation; Astro check 0 errors and 0 warnings (4 hints); TypeScript check passed; 328 focused metadata, indexing, homepage, shared-shell, charset and pipeline-structure tests passed. Diff whitespace, article-text/citation preservation, source fragments, image identity and entry-only image placement checks passed. Full check stopped during Cloudflare prerender setup at `uv_interface_addresses returned Unknown system error 1`; no full build or integrated browser pass is claimed. Offline three-surface preview is a static review artifact, not production-build evidence.

No independent review is claimed. Reviewer interface: unknown; reviewer lineage: unknown; review mode: unknown; reviewed commit: unknown; review evidence reference: unknown. Exact-head CI and author review remain pending. This change prepares a draft PR only; no merge, production deployment or publication is authorized by this entry.

### 2026-11-18 — Beiyang CI route-count follow-up

Agent: Codex. With author approval, corrected two missed fixed-count checks after the new reading increased the site to 49 indexable routes and 51 registered routes; the two noindex routes remain unchanged. Added the 18 November route to the named rendered metadata-verification list and a regression assertion for that coverage. Article content, entry images, navigation, dependency inputs and the frozen check pipeline are unchanged.

Inventory refresh: PR #174 is the only open PR returned by GitHub; its base remains 0c42d0010c447cfda5d2cd0d8243bc863ac73361 and the previous Guandu work remains verified merged via PR #170. This is a continuation of the same content branch, not an integration of other work. Historical worklog bytes are preserved.

Failure evidence: Site CI run 44346321176, job 134949568375, reported `FAIL INDEXABLE_COUNT exactly 48 indexable routes — 49`; the unmodified adjacency metadata test separately reproduced `49 !== 48`. Modified files: scripts/verify-metadata-build.mjs and tests/public-surface-adjacency-map/metadataIndexing.test.ts. Validation: 302 focused metadata/indexing/adjacency/pipeline tests passed, including the new named-route regression test; git diff --check passed. Full rendered verification remains delegated to exact-head Linux CI because the local Cloudflare environment cannot complete the production build; broader local lifecycle suites were not yet complete at this checkpoint. No independent review or CI pass claimed. No merge or deployment.

### 2026-11-18 — Match the Artistic Research text-only list

Agent: Codex. At the author's request, removed only the Beiyang illustration element from the Artistic Research listing, retaining its dated heading, description and article link in the same text-only form as adjacent entries. The homepage preview illustration and image-free article are unchanged.

Pre-append inventory: current main 14de4471907a3c1a6f1f7be028c7297c0f7064d9 includes merged PR #174 (GitHub merge timestamp 18 November 17:08:29 UTC); open-PR query returned none. Earlier Guandu work remains merged via PR #170. No other branch was integrated, rewritten or deleted. Historical worklog bytes remain an exact prefix.

Files changed: src/pages/artistic-research.md and this appended record. Validation: 322 homepage, shared-shell, indexing, metadata and charset tests passed; exact-diff assertion confirms one image element and its following blank line are the only page changes; homepage image retained and article image-free checks passed; git diff --check passed. Full-build verification is left to exact-head CI due to the previously recorded local Cloudflare environment limitation. No independent review claimed. Separate follow-up draft PR only; no merge or deployment.

### 2026-11-21 — Kaohsiung dated reading and entry surfaces

Agent: Codex. Prepared the author-requested English reading, homepage card with the projection illustration, and a text-only Artistic Research entry. The dated article retains its two internal figures. Existing works, earlier cards and top navigation remain unchanged. The article identifies public commentary and first-person accounts without identifying private material supplied to the editor, and does not embed screenshots.

Pre-append inventory: main 4f1196982fb9d506d3b8e4f597c37e67ed4a0f03. PR #176 is an existing, separately held Beiyang correction; its stylesheet and regression test are not incorporated in this draft. Dependabot PRs #171, #172 and #173 are a separate queue. No other open feature PR was returned. No other branch was integrated, rewritten or deleted.

Files: homepage and Artistic Research entries; dated Astro page, English HTML payload, scoped CSS and two WebP assets; route and shared-shell registration and accompanying build-verifier and test expectations. Dependencies, check pipeline and worklog history are preserved.

Validation: 340 focused tests passed; Astro check 0 errors, 0 warnings (4 existing hints); git diff --check and citation fragment checks passed. Local build compiled the Vite bundles but stopped in Cloudflare prerender setup at `uv_interface_addresses returned Unknown system error 1`. Exact-head Linux CI and author review remain outstanding. No independent review of the integrated commit is claimed: reviewer interface, reviewer lineage, review mode, reviewed commit and review evidence reference are unknown. Draft for review only; no merge or deployment.

### 2026-11-21 — Bring the Kaohsiung welcome anecdote into the closing comparison

Agent: Gary (OpenAI). At the author's request, kept the World Games Station wayfinding in the transport opening and moved the Mallorca visitor and the quiet offer of help to the closing Liuhe–Lima comparison. The original source references, ending, illustrations, homepage and Artistic Research entry are unchanged. No screenshots or new factual claims were added.

Pre-append inventory: continuing draft PR #177, whose base is 4f1196982fb9d506d3b8e4f597c37e67ed4a0f03. Beiyang draft PR #176 remains on hold and unchanged; PRs #171–173 are the separate dependency queue. No other open feature PR was returned. The entire previous worklog is preserved.

Files changed: src/data/public-surface-case/2026-11-21/rendered-body.en.html and this appended record. Validation: 38 focused shell, homepage and charset tests; citation-target and worklog-prefix checks; git diff --check. Full build not rerun for this prose edit. No independent review, merge or deployment.

### 2026-11-21 — Keep recognition separate from contact in the Liuhe passage

Agent: Gary (OpenAI). Added one interpretive paragraph after the Liuhe footage passage, using the phone and the decision not to follow to express the author's point about learned restraint. It is written as a possibility, not an account of a specific spectator or a claim about a whole city. No wildlife analogy, new sources, screenshots or factual claims were added.

Pre-append inventory: continued draft PR #177 at 36c7c228abfd22e7cfe258376d5330c45b57392b, based on main 4f1196982fb9d506d3b8e4f597c37e67ed4a0f03. The separately held Beiyang draft #176 and dependency PRs #171–173 were not integrated. All earlier worklog entries are preserved.

Files changed: src/data/public-surface-case/2026-11-21/rendered-body.en.html and this appended record. Validation: 38 focused shell, homepage and charset tests passed; single-paragraph insertion, unchanged link and anchor checks, and git diff --check passed. No full build or independent review claimed. No merge or deployment.

### 2026-11-21 — Align homepage typography and dated reading labels

Agent: Gary (OpenAI). Unified the date presentation in the homepage reading cards, the Artistic Research index and all twelve dated reading headers (the Beiyang header already complied). The six homepage cards now share title, summary, date and link typography at every width. Kept artwork, card order, reading destinations and evidentiary cutoff values. No article body was rewritten; the homepage scope is the public reading cards.

Pre-append inventory: continued draft PR #177 at 2bb6fc3cca69acc4feed769d283ae3d15ed13e05 with main at 4f1196982fb9d506d3b8e4f597c37e67ed4a0f03. Beiyang draft #176 remains separately held; dependency PRs #171–173 were not integrated. All earlier worklog entries are preserved.

Files changed: DesktopArticleEntries.astro, the Artistic Research index, the dated slice/case header templates or payloads, exact date-only shell normalization fixture, homepage and preservation assertions, and this worklog. Validation: 345 focused tests passed; Astro check found 0 errors, 0 warnings and 4 existing hints. Original shell digests, artwork hashes and reading link destinations remain tested. git diff --check passed. Local headless Chromium could not start because its process socket was denied; no browser visual pass or exact-head CI pass is claimed here. No independent review, merge or deployment.
