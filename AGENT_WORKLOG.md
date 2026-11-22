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


## 2026-11-18 — Beiyang article skip-link visibility
- Agent: ChatGPT assigned engineering task.
- Authorization: author requested removal of the visible Skip to article label; preserve accessible navigation where needed. No merge or deployment authorized.
- Inventory before append: main 4f119698 contains merged PR #175; #174 and #170 previously confirmed merged. GitHub open PR inventory empty. No other relevant unmerged work identified; existing branches and worklog history preserved.
- Change: dated Beiyang stylesheet hides its direct-child skip link offscreen, reveals it on keyboard focus, following the existing 18 October article pattern. Anchor and article target unchanged; no shared component or article copy changes.
- Files: dated stylesheet, shared-shell regression test, this append-only worklog.
- Validation: shared-shell and metadata contract tests, Astro check, diff whitespace check; exact-head Linux Site CI is full readiness authority. Local Cloudflare build is known blocked by uv_interface_addresses in this executor.
- Risk: keyboard focus intentionally reveals the navigation link; ordinary article reading no longer displays it. Other pages unaffected. No independent review; reviewer interface/lineage/mode/commit/evidence unknown.

### 2026-11-21 — Reconcile the Beiyang shortcut fix with current main

Agent: Gary (OpenAI). Author approved updating PR #176 and merging after checks. Carried forward only the prior Beiyang skip-link stylesheet and exact keyboard-accessibility assertion. Maintained the earlier date-format and homepage work; neither the article nor the target anchor changed.

Pre-append inventory: main 90516a4080947c09cee1ac5a3abeb54d70214e4f contains merged PR #177; PR #176 is the active branch, and #171–173 are dependency PRs. Main's worklog is preserved as a byte prefix. The original #176 worklog entry is appended unchanged.

Files: src/styles/public-surface-case-2026-11-18.css, tests/shared-shell.test.ts and this worklog. Local shared-shell, homepage and charset validation: 41 tests passed. git diff --check passed. Exact-head Site CI and deployment were not yet verified at this checkpoint. No independent review claimed.

### 2026-11-21 — Limit the #173 XML tooling upgrade to its intended scope

Agent: Gary (OpenAI). The owner authorized sequential dependency maintenance (#173, then #171, then #172), each gated by full CI. Updated the development-only fast-xml-parser pin from 5.12.0 to 5.12.1 and its required fast-xml-builder resolution from 1.3.1 to 1.3.2. Excluded unrelated Astro, Prism and Prettier lockfile churn from the original automated diff. Kept the exact dependency and lockfile guards; only updated the authorized pin and audited lockfile SHA-256.

Inventory: main 83a5ecfb80bd6ddfcf5c79d268712a8f63a384ae contains merged #176 and #177; #171 and #172 remain separate dependency work in the user's approved sequence. Main worklog is preserved byte-for-byte as a prefix. Files: package.json, pnpm-lock.yaml, tests/public-surface-adjacency-map/renderingBoundary.test.ts and this worklog. Local validation: selected lockfile hunks apply exactly and match reviewed byte count and SHA-256; exact-head full Linux CI required before merging. No live action performed by this patch.
Local guard suite on the assembled candidate: 13 checks passed (existing TypeScript evaluator; the new dependency installation is left to CI).

### 2026-11-21 — Constrain the refreshed #171 Cloudflare and Wrangler update

Agent: Gary (OpenAI). Continued the owner-approved dependency sequence after #173. Dependabot refreshed #171 to Cloudflare adapter 14.4.8 and Wrangler 4.164.0. Carried forward those exact two approved direct dependency updates and their required transitive closure, excluding unrelated Astro/MDX and checker changes. Preserved the exact direct-version and lockfile-identity guards, updating only the intended pins and audited lock identity.

Inventory: main 83ee64db5618487bb0afbf8d148e675d1a606347 includes #173, #176 and #177; #171 is current and #172 remains separate. Files: package.json, pnpm-lock.yaml, renderingBoundary.test.ts, and this append-only worklog. Frozen pnpm 10.34.5 installation and 21 local boundary/homepage checks passed. Audited lockfile: 148368 bytes, SHA-256 83daad2fba194630a404cdbc7b9e5d0e57baffa8a56340443dddc75ce9a65cc1. Full exact-head Site CI remains the merge gate. No manual deployment.

### 2026-11-21 — Complete the authorized Astro tooling update in #178

Agent: Gary (OpenAI). The owner approved Sitemap in #178 after Dependabot replaced #172. Updated the three direct pins only: Astro 7.4.12, MDX 8.1.6, and Sitemap 3.7.5. Kept the already merged Cloudflare 14.4.8, Wrangler 4.164.0 and XML tooling pins; rebound the adapter peer to the new Astro. Used the published astro2tsx 0.1.4 package to pair emnapi core/runtime 1.11.3 in the checker graph, without a global override. Kept the exact dependency-version and lockfile identity checks.

Inventory: main f128c5282f883e868e06f32d5ddfc886663ba61b includes #171, #173, #176 and #177. #172 was closed unmerged by Dependabot; #178 is the only open PR in the inventory. Main worklog is preserved byte-for-byte. Files: package.json, pnpm-lock.yaml, renderingBoundary.test.ts and this worklog. Frozen installation with pnpm 10.34.5, 21 local boundary/homepage tests and astro check (0 errors, 0 warnings) passed. Audited lockfile: 134938 bytes, SHA-256 0edbad78a24856cc5373861f40d33904711024280bf94059cfa634303c2f1d08. Full exact-head Linux CI is required before merge. No manual deployment.

### 2026-11-21 — Remove redundant bottom navigation on the two newest readings

Agent: Gary (OpenAI). At the owner's request, removed the standalone bottom-link block from the Beiyang and Kaohsiung case pages because the shared header already links Artistic Research. Retained the shared footer, keyboard skip link and content target, article copy, dates, sources, and artwork. Reviewed older readings: a few early Public Slices use a separately arranged return link, and several dated cases use a footer note for an evidence boundary. No old pages were changed.

Pre-append inventory: main 91a7422d8802da046c8f8a11b4f7db02c28039fd contains #176–#178, and the open PR query returned none. Historical worklog bytes are preserved.

Files: the 18 and 21 November Astro shells, tests/shared-shell.test.ts, and this append-only record. Validation: 42 focused tests passed and astro check reported 0 errors and 0 warnings (4 existing hints). No independent review or exact-head full Site CI pass yet. Draft only; no merge or deployment.

### 2026-11-22 - The Name on the Ballot

Prepared the dated English reading with the shared article header and footer, numbered sources, and the existing article palette and type. Added the illustrated homepage entry and text-only Artistic Research entry in date order. Registered the new route and extended the existing homepage, shell, and indexing checks without changing the check pipeline.

Validation: Dot prepared the local candidate. The focused contracts passed 312 tests. A two-page Astro static build verified the new and adjacent reading with the same shared page structure. The full Cloudflare build remains subject to repository CI; no production deployment or independent review was performed.

### 2026-11-22 - Beiyang reading layout alignment

Aligned the Beiyang article's title and reading gutters with the adjacent dated articles, and condensed the source list without changing the prose, contents links, 15 source targets, or 20 external source URLs. Changes are confined to the Beiyang rendered entry and its dedicated stylesheet.

Validation: Dot verified preservation of the article and link targets, and rendered the updated route in the focused Astro static build. No production deployment or independent review was performed.

### 2026-11-22 - Synchronize route-count checks for PR #181

Agent: Gary (OpenAI). Updated the adjacency metadata regression test to expect 51 indexable routes and the same two noindex previews, and to verify explicitly that both the Beiyang and Ballot readings are named in the rendered metadata verifier and registered as indexable. No route, article, style, dependency, or check-pipeline changes.

Pre-append inventory: PR #181 was the only open pull request. The relevant Beiyang, Kaohsiung, footer and Taipei follow-up work (#174–#177, #179–#180) is merged via PR. Routine dependency refs were excluded from the feature gate.

Files: tests/public-surface-adjacency-map/metadataIndexing.test.ts and this append-only entry. Reproduced both assertions before the fix; 323 focused tests passed afterward. Local full check reached the Cloudflare Vite build and stopped on the runner's network-interface system error; exact-head GitHub Site CI remains the full verification. No independent review, merge or production deployment.

### 2026-11-22 - Restore the Beiyang keyboard skip-link styling

Agent: Gary (OpenAI). Site CI run 44996772552 cleared the metadata assertions and found that the revised Beiyang stylesheet omitted the existing off-screen and visible-on-focus skip-link rules. Restored the original two scoped rules without changing the new reading layout or article content. The shell test retains its original accessibility assertions.

Inventory unchanged: #181 is separate from the merged Beiyang and adjacent reading work. Files: src/styles/public-surface-case-2026-11-18.css and this append-only entry. 323 focused tests passed after testing with the revised stylesheet actually in place. Full GitHub Site CI is the remaining check; no independent review, merge or deployment.
