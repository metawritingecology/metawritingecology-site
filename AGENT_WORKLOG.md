# Agent Worklog

Agents must append entries here after making changes.

## Entry Format

### YYYY-MM-DD — agent-name — task-name

Agent:
Task:
Files changed:
Build / tests run:
Result:
Unresolved questions:
Risks or assumptions:

### 2026-07-06 — Claude Code — add-agent-coordination-files

Agent: Claude Code
Task: Add repo-level agent coordination instructions (AGENTS.md, CLAUDE.md, AGENT_TASKS.md, AGENT_WORKLOG.md, .github/copilot-instructions.md) per user-supplied content.
Files changed: AGENTS.md, CLAUDE.md, AGENT_TASKS.md, AGENT_WORKLOG.md, .github/copilot-instructions.md (all newly created; none pre-existed)
Build / tests run: None — no build/test tooling was run since no application code was touched.
Result: All five files added verbatim as specified by the user; no other files modified.
Unresolved questions: None.
Risks or assumptions: None — no existing files were overwritten or merged.

### 2026-07-06 — Claude Code — source-navigation-placement-and-public-record-consistency

Agent: Claude Code
Task: Adjust website source-navigation placement wording and public-record consistency after External Lifeline Collapse under Residual Infrastructure Cross was placed in the canonical source navigation layer.
Files changed:
- src/pages/atlas.md — removed the "Source Navigation Placement" section and its DOI-anchored entry for External Lifeline Collapse under Residual Infrastructure Cross; replaced it with an "Individual Source Records" section pointing to /models/ and /publications/.
- src/pages/public-records.md — added AI-Readable Knowledge Architecture and External Lifeline Collapse under Residual Infrastructure Cross DOI links under "Current source DOI records including"; existing entries left unchanged.
- src/pages/entry-points.md — changed "Current public corpus additions include:" to "Selected public corpus additions include:"; no entries added or removed.
- src/pages/surfaces.md — changed "Current public source additions include:" to "Selected public source additions include:"; no entries added or removed.
Build / tests run: None — wording/link-list edits only to existing Markdown pages; no build or test tooling was run.
Result: Requested wording and placement cleanup applied exactly as specified. No conceptual text rewritten beyond the exact requested wording. No navigation/layout files changed. No source repo (GitHub) content or links modified.
Unresolved questions: None.
Risks or assumptions: None — edits were limited strictly to the five allowed files and the exact wording specified in the task.

### 2026-07-06 — Claude Code — sync-five-osf-source-entries

Agent: Claude Code
Task: Sync five new source-visible OSF-linked entries from the canonical meta-writing-ecology repository into the website's public navigation surfaces, using an exact mapping supplied by the user (Text-Conditioned Semantic Rendering, Surface-Bounded Semantic Rendering, Generation-Condition Disclosure–Reproducibility Cross, Model-Use Reporting Boundary Protocol, Source/Summary/Citation Boundary Packet).
Files changed:
- src/pages/models.md — added entries to Model Index under existing categories: Boundary / Representation (Text-Conditioned Semantic Rendering, Surface-Bounded Semantic Rendering, Source Summary and Citation Boundary Packet), AI-Mediated Interpretation / Verification (Model-Use Reporting Boundary Protocol), Cross Structures (Generation-Condition Disclosure–Reproducibility Cross). No new categories created.
- src/pages/publications.md — added five title/DOI pairs under "Current Canonical Source DOI Records"; existing entries left in place, none moved.
- src/pages/public-records.md — added five DOI links under "Current source DOI records including"; existing entries retained.
- src/pages/entry-points.md — added two grouped orientation bullets under "Selected public corpus additions include" (not five separate bullets).
- src/pages/surfaces.md — added two grouped bullets under "Selected public source additions include"; kept the existing "declared classifications and canonical source navigation" sentence.
- atlas.md — intentionally not changed, per task instructions.
- No navigation layout or homepage changes made.
Build / tests run: None — link-list/content edits only to existing Markdown pages; no build or test tooling was run.
Result: Five canonical source entries synced into the five allowed public-facing pages exactly per the supplied mapping. No classification, naming, or public-boundary decisions made by Claude Code; the mapping and category placement were fully specified by the user.
Unresolved questions: None.
Risks or assumptions: None — edits limited strictly to the six allowed files (five page files plus this worklog); no push or PR made.

### 2026-07-07 — Claude Code — restore-medium-companion-reading-paths

Agent: Claude Code
Task: Restore Medium companion reading paths to the entry-points page. Appended the user-approved "Medium Companion Reading Paths" section (boundary note plus six external Medium reading-path links mapped to the six thematic entry zones) after the "Public Site Reading Paths" section, exactly as drafted in the approved planning file medium_entry_points_companion_section_draft.md.
Files changed:
- src/pages/entry-points.md — one section appended at the end of the page; no existing content modified.
- AGENT_WORKLOG.md — this entry.
Build / tests run: pnpm build (Astro build with @astrojs/cloudflare adapter) — completed successfully. Symbol hygiene scan of the touched page: no literal != in prose.
Result: Six Medium reading-path links restored as external companion surfaces with the required boundary note. No canonical repo files modified (MODEL_ATLAS, RELATION_MAP, README, canonical READING_PATHS untouched). No Medium PUB companion versions added (Semantic Pressure, Cultural Curvature Unified Field, Observer Immunity Constant, Semantic Alloy, Anchor Document excluded per instruction). No changes to homepage, top navigation, /models/, /publications/, /surfaces/, /fiction/, /platforms/, or llms.txt. Commit/push status: later committed and pushed to branch `claude/medium-posts-website-audit-nki8ts` for PR #44 review; no merge performed by Claude Code.
Unresolved questions: Remaining Medium-integration decisions are tracked in the planning file medium_remaining_decisions.md (account identity, PUB companion surfacing, Semantic Alloy status, Anchor Document status, unresolved chain titles, duplicate titles, narrative-fragment representation).
Risks or assumptions: Assumed the six export-recorded public slugs under medium.com/@metawritingecology remain live; account-identity question flagged in planning files but does not affect these already-public URLs.

### 2026-07-07 — Claude Code — source-based-reading-paths-pr45

Agent: Claude Code
Task: PR45 revises the entry-points reading-path layer after PR44. Removed the "Medium Companion Reading Paths" section and its six Medium links from src/pages/entry-points.md and replaced it with a "Source-Based Reading Paths" section pointing to the canonical reading paths in the public GitHub source repository (meta-writing-ecology model-atlas READING_PATHS.md). Medium is treated as a poetic / pre-model / legacy public writing surface, not fiction and not canonical source; per instruction, no individual Medium post links were added and no Medium archive page was created.
Files changed:
- src/pages/entry-points.md — replaced the "Medium Companion Reading Paths" section (boundary note plus six Medium links) with the user-supplied "Source-Based Reading Paths" section; no other sections modified.
- AGENT_WORKLOG.md — this entry.
Build / tests run: pnpm build (Astro build) — result recorded in PR. Symbol hygiene scan of touched files: no literal != in prose.
Result: Medium companion reading-path links removed from the current entry-points page; replacement points to canonical source reading paths in the public GitHub source repository. No canonical repo files were modified (MODEL_ATLAS, RELATION_MAP, README, canonical READING_PATHS untouched). No changes to homepage, top navigation, /models/, /publications/, /surfaces/, /fiction/, /platforms/, or llms.txt.
Unresolved questions: None for this patch; broader Medium-integration decisions remain tracked in medium_remaining_decisions.md.
Risks or assumptions: None — edits limited strictly to the two allowed files; structural decision about Medium's status was supplied by the user, not made by the agent.

### 2026-07-08 - Codex - draft-pre-model-writing-page

Agent: Codex
Task: Draft a low-discoverability pre-model writing page for earlier Medium public writing surfaces using the approved planning outputs.
Files changed:
- src/pages/pre-model-writing.md - added a draft boundary page for Medium as poetic / pre-model / legacy public writing, with one Medium profile link and no individual Medium post links.
- AGENT_WORKLOG.md - this entry.
Build / tests run: Bundled Node Astro build command (`node.exe .\node_modules\astro\astro.js build`) completed successfully. `pnpm run build` could not be used directly because `node` is not on PATH in this shell.
Result: Draft page added locally only. No homepage, top navigation, /models/, /publications/, /fiction/, /surfaces/, /entry-points/, llms.txt, canonical source repo, MODEL_ATLAS, RELATION_MAP, README, or canonical READING_PATHS changes made.
Unresolved questions: Final publication, route discoverability, and any future individual Medium post surfacing remain user authority decisions.
Risks or assumptions: Assumes one Medium profile link is appropriate for a low-discoverability boundary page; all individual post links and authority-sensitive categories remain deferred.

### 2026-07-08 - Codex - pre-model-writing-wording-cleanup

Agent: Codex
Task: Apply user-requested wording cleanup to the local pre-model writing page draft.
Files changed:
- src/pages/pre-model-writing.md - removed "draft" from the opening boundary sentence, changed user/GPT review wording to separate boundary review, and renamed "First-draft scope" to "Boundary scope".
- AGENT_WORKLOG.md - this entry.
Build / tests run: Bundled Node Astro build command (`node.exe .\node_modules\astro\astro.js build`) completed successfully.
Result: Local wording cleanup applied only to the allowed page. No Medium profile link change and no individual Medium post links added.
Unresolved questions: None.
Risks or assumptions: None.

### 2026-07-08 - Codex - pre-model-writing-status-categories

Agent: Codex
Task: PR47 adds status categories to the pre-model writing page.
Files changed:
- src/pages/pre-model-writing.md - added a categorical status list for Medium materials without adding counts, individual links, or a full archive index.
- AGENT_WORKLOG.md - this entry.
Build / tests run: Bundled Node Astro build command (`node.exe .\node_modules\astro\astro.js build`) completed successfully.
Result: No individual Medium post links were added. No full Medium archive index was added. No Medium post was classified as a Model, Cross, Log, Protocol, or Draft. No canonical repo files were modified.
Unresolved questions: None.
Risks or assumptions: Status categories remain review categories only and do not decide final public status for individual posts.

### 2026-07-08 - Codex - link-pre-model-writing-from-platforms

Agent: Codex
Task: PR48 links the pre-model writing boundary page from `/platforms/`.
Files changed:
- src/pages/platforms.md - added one low-authority link to `/pre-model-writing/` near the Medium platform reference.
- AGENT_WORKLOG.md - this entry.
Build / tests run: Bundled Node Astro build command (`node.exe .\node_modules\astro\astro.js build`) completed successfully.
Result: No individual Medium post links were added. No full Medium archive index was added. No Medium post was classified as a Model, Cross, Log, Protocol, or Draft. No canonical repo files were modified. No top navigation or homepage changes were made.
Unresolved questions: None.
Risks or assumptions: The link is platform-context reachability only and does not change Medium authority status.

### 2026-07-08 - Claude Code - pre-model-writing-selected-poetic-links

Agent: Claude Code
Task: PR49 adds a selected poetic surfaces section to the pre-model writing page.
Files changed:
- src/pages/pre-model-writing.md - added a "Selected poetic surfaces" section after "Status categories" and before "Current source layer", containing only the 12 approved poetic Medium links.
- AGENT_WORKLOG.md - this entry.
Build / tests run: `pnpm run build` (Astro build).
Result: Only the 12 approved poetic Medium links were added. No full Medium archive index was added. No Medium post was classified as a Model, Cross, Log, Protocol, or Draft. No canonical repo files were modified. No homepage, top navigation, model, publication, fiction, surface, entry-point, platform, or llms.txt changes were made.
Unresolved questions: None.
Risks or assumptions: The selected links are low-authority public writing traces only and do not decide final public status for any other Medium post.

### 2026-07-08 - Claude Code - sitemap-lastmod-freshness-signal

Agent: Claude Code
Task: Add `<lastmod>` freshness signals to generated sitemap entries.
Files changed:
- astro.config.mjs - added a sitemap `serialize` function that maps each public route back to its source page file and sets `lastmod` from git commit time, falling back to file mtime. The existing filter excluding `language-pressure-test-lab-prototype` is preserved unchanged.
- AGENT_WORKLOG.md - this entry.
Build / tests run: `pnpm run build` (Astro build) completed successfully. Verified `sitemap-index.xml` and `sitemap-0.xml` still generate, all 40 public URLs carry a `<lastmod>`, and the prototype page remains excluded.
Result: Engineering-only freshness signal. No canonical URLs, page content, navigation, boundary wording, JSON-LD, BaseLayout metadata, search modal behavior, robots.txt, or llms.txt were changed. No search-result URLs are produced by the sitemap.
Unresolved questions: None.
Risks or assumptions: `lastmod` derives from git history at build time; in a shallow or history-less checkout it falls back to file mtime, which is still a valid freshness signal.

### 2026-07-14 — Claude Code — pr20-website-integration-phase1-preview

Agent: Claude Code
Task: Implement the approved PR #20 Website Integration Phase 1 preview only — a website-native, review-first child route at `/public-surface-map/interactive/` using one audited, bundled PR #20 snapshot. Native DOM + native SVG, no new dependency, no D3, no external data request. Local implementation only.
Files changed:
- src/data/public-surface-authority-map/last-known-good.json (added) — byte-identical audited PR #20 snapshot acquired from the immutable merge commit `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`. Byte length 83727, SHA-256 `82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`, git blob `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`. Not normalized or repaired.
- src/lib/public-surface-authority-map/contract.ts (added) — readonly snapshot/node/edge types, Phase 1 provenance constants (source repo, merge commit, SHA-256, byte length, status), expected counts, allowed grouping fields and edge types, and a strict build-time `assertSnapshot` that verifies every section-5 invariant and recursively rejects prohibited authority fields. Contract failure throws and fails the build.
- src/components/PublicSurfaceAuthorityMap.astro (added) — server-rendered component: persistent scope banner (all five boundary statements), snapshot/data-status block, approved title and subtitle, grouping controls, dataset-local name/path filter, metadata filters, categorical map container, native SVG routing layer, node detail panel, legend, routing controls, persistent global-routing density warning, server-rendered table of all 27 records, and footer boundary statement. All visualization CSS is rooted under `.psam`.
- src/components/publicSurfaceAuthorityMap.client.ts (added) — native DOM/SVG progressive enhancement. Reads the already-rendered bundled JSON (no fetch/CDN/D3/iframe/innerHTML). Grouping, filtering, deterministic categorical layout with equal-area nodes, node selection/detail, selected-node routing and secondary global routing with a persistent density warning, `aria-live` status for selection and filtering (edge redraws are not announced), and link validation restricting source hrefs to the approved source repository over HTTPS with `rel="noopener"`.
- src/pages/public-surface-map/interactive.astro (added) — prerendered child route using BaseLayout with the approved title/subtitle, route-level `noindex, nofollow`, a route-specific `main--psam-preview` width hook, and generic WebPage schema only.
- src/pages/public-surface-map.md (modified) — added one contextual "Interactive public-surface view" section linking to the child route with a selected-public-metadata boundary note. Rest of the parent page unchanged.
- src/layouts/BaseLayout.astro (modified) — added backward-compatible optional `robots` and `mainClass` props (routes passing neither render exactly as before: no robots meta, bare `<main>`).
- astro.config.mjs (modified) — added an exact sitemap exclusion for `/public-surface-map/interactive/`; preserved the existing prototype exclusion and the serialize/lastmod behavior.
- AGENT_WORKLOG.md — this entry.
Build / tests run: `pnpm install --frozen-lockfile`; baseline `pnpm run check` on clean main passed before any edit; `pnpm run check` (astro build + tsc + wrangler deploy --dry-run) passed after implementation. Generated-output checks: interactive route exists with correct canonical URL and `noindex, nofollow`; route absent from `sitemap-0.xml`; parent route and prototype exclusion preserved; all five boundary statements, title, subtitle rendered; server-rendered table has 27 data rows; visualization JS bundle contains no fetch/XMLHttpRequest/WebSocket/dynamic import; all source links are under the approved source repository. Snapshot integrity and all data invariants verified (27 nodes, 146 edges, 120 boundary_reference, 26 source_use_reference, 7 omitted self-references, navigation-only, no prohibited fields). Symbol hygiene: no literal `!=` in touched prose; `!==` operators preserved in TypeScript.
Result: Local, preview-ready Phase 1 implementation only. No commit, push, PR, deployment, workflow, secret, source-repository change, or Cloudflare resource was created. Protected files (package.json, pnpm-lock.yaml, wrangler.json, public/robots.txt, src/styles/global.css, src/components/PublicSearchModal.astro, src/pages/index.astro, .github/**) are unchanged. Top navigation, homepage links, and public search are unchanged.
Unresolved questions: The source repository's current `main` SHA and the live PR #20 "merged" boolean could not be retrieved because api.github.com is blocked by session GitHub scoping (source repo not in session scope). The immutable merge commit resolved and returned byte-exact expected content, confirming the merged snapshot; the current-main-SHA recording is left as a check that could not be completed under current scope.
Risks or assumptions: The site is committed to a single (dark) theme in global.css; the component uses the site palette and never relies on color alone (glyphs, text, and line styles accompany every encoding), so it remains readable under forced-colors/high-contrast. The preview intentionally remains excluded from indexing and the sitemap; all Phase 2/3 items (runtime manifest loading, by-commit endpoints, current pointer, retention policy, Actions, Cloudflare KV/R2, auto-merge, public-search inclusion, production deployment) are deferred and were not implemented.

Narrow audit fix (2026-07-14, same uncommitted Phase 1 entry — Codex decision: CHANGES_REQUIRED):
- Raw snapshot identity now enforced at build time. `src/lib/public-surface-authority-map/contract.ts` gained `assertRawIdentity` and `assertSnapshotFromRawText`, running byte-length -> SHA-256 -> Git blob SHA (computed as `blob <len>\0<bytes>` via Web Crypto, no subprocess/no Git invocation) BEFORE JSON.parse and structural validation. The component now imports the snapshot as raw text (`...last-known-good.json?raw`) and awaits `assertSnapshotFromRawText`, so a single-byte mutation that preserves counts/structure fails the build. The displayed SHA-256 still comes from the fixed `SNAPSHOT_SHA256` constant; no filesystem path is exposed in output; validation stays at build time (not shipped to browser JS).
- Strict contract hardening: exact allowed-key schemas for top-level/nodes/edges/edge_counts/transform_notes; strict boolean checks (no Boolean() coercion); exact vocabularies derived verbatim from the audited snapshot for surface_role, public_surface_status, node authority_ceiling, relation_default, classification_evidence, and publicly_declared_classification; `generated_record_count` must equal actual node count; declared `edge_counts` must agree with actual; `grouping_fields` must equal the approved set (rejects unknowns like `ontology`); canonical_public_url parsed and constrained to https + host github.com + repo metawritingecology/meta-writing-ecology, rejecting credentials/ports/other hosts/other repos; prohibited-field scan is now case-insensitive (rejects `Registry_Status`); JSON-compatible plain-data enforced, rejecting prototype-bearing objects and inherited properties.
- Mutation tests (temporary out-of-repo audit script, Node type-stripping, no new dependency, no permanent test file added): 14 required mutations plus baseline and 2 bonus checks — 17/17 as-expected. #1 harmless byte change -> raw_sha256; #2 formal_authority -> node_authority_ceiling; #3 confirmed_relation -> node_relation_default; #4 off-repo URL -> canonical_url; #5 generated_record_count=1 -> generated_record_count; #6 grouping_fields=[ontology] -> grouping_fields; #7 boolean->string -> transform_notes; #8 declared classification number -> node_declared_classification; #9 nested Registry_Status -> prohibited_authority_field; #10 duplicate id -> node_id_unique; #11 missing edge target -> edge_shape; #12 unsupported edge type -> edge_type_allowed; #13 relation_status=confirmed_relation -> edge_navigation_only; #14 edge authority_ceiling=formal_authority -> edge_navigation_only.
- Mobile snapshot-status layout: CSS-only, scoped under `.psam`, at the existing 780px breakpoint status rows become single-column (labels above values; hashes/URLs wrap in full-width segments). No wording/provenance/semantics changed. Verified readable with no page-level horizontal overflow at 320px and 400%-zoom-equivalent.
- Snapshot bytes unchanged: `last-known-good.json` remains byte-identical (83727 bytes, SHA-256 82f7f74b…f4ef1e, Git blob aa25de9c…). No Unicode normalization. Codex NOTE on private-use Unicode in /nodes/13/name and /nodes/19/name is recorded as an upstream-source issue requiring separate user authority; no aliases/replacements/fallbacks were added in Phase 1.
- `pnpm run check` passes (astro build + tsc + wrangler dry-run); route still prerenders; noindex/nofollow and sitemap exclusion preserved; parent still in sitemap; 27 fallback rows; no external visualization request; lockfile unchanged. No Phase 2/3 work. No commit, push, PR, or deployment. Files changed in this narrow fix: src/lib/public-surface-authority-map/contract.ts, src/components/PublicSurfaceAuthorityMap.astro, AGENT_WORKLOG.md.

### 2026-07-14 — Claude Code — public-surface-map-phase2a-data-surface

Agent: Claude Code
Task: Implement Phase 2A ONLY of the Public Surface and Authority-Ceiling Map data surface — a repository-owned, same-origin, build-validated data surface (strict runtime manifest, immutable prerendered snapshot route, shared semantic validation, shared byte-identity utilities, fallback-specific Phase 1 validation, route-scoped static headers, build-output verification, mutation tests). Phase 2A does NOT activate any browser runtime loading. Local implementation only.

Codex architecture decision: APPROVE_WITH_REQUIRED_CHANGES. Phase 2A/2B split honored — Phase 2A delivers contracts, identity utilities, manifest, immutable snapshot route, `_headers`, build gates, mutation tests, and a deployment-verification plan; Phase 2B (browser loader, atomic interface replacement, runtime state wording, accessibility/state reconciliation) is NOT implemented.

Reviewed architecture baseline SHA: 9037d0738e2a1f7364bd5f4e43add35c6ee0666b.
Actual implementation baseline: origin/main == 9037d0738e2a1f7364bd5f4e43add35c6ee0666b (exact match). Local branch `claude/public-surface-map-phase2a-data-surface` created from origin/main.

Initial runtime snapshot selection: the existing Phase 1 snapshot is reused as the first immutable runtime snapshot, intentionally byte-identical to the bundled fallback (source commit 18491105f0bc0451e0bf99eaa78c39f69c7cb57c, byte length 83727, SHA-256 82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e, Git blob aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b). Copied as exact bytes; no Unicode/whitespace/newline normalization.

Files added:
- src/data/public-surface-authority-map/runtime-manifest.json — strict runtime manifest; website-local runtime selection only; `currentness_claim: "none"`; establishes no currentness/Registry/ontology/authority/completeness/supersession/ranking/confirmed-relation.
- src/data/public-surface-authority-map/runtime-snapshots/<id>.json — immutable runtime snapshot, byte-identical to last-known-good.json.
- src/lib/public-surface-authority-map/byteIdentity.ts — shared browser-safe/build-safe byte identity (UTF-8 encode, exact/max byte-length, SHA-256 primary digest, Git blob SHA-1 reproduction via assembled `blob <len>\0<bytes>` header, fatal UTF-8 decode, parse-after-identity, bounded byte accumulation for future 2B). Constants: MAX_MANIFEST_BYTES 16384, MAX_RUNTIME_SNAPSHOT_BYTES 262144.
- src/lib/public-surface-authority-map/fallback.ts — Phase 1-specific validation centralized: fixed provenance, FALLBACK_IDENTITY (byte length/SHA-256/Git blob), EXPECTED_COUNTS (27 nodes / 146 edges / 120 boundary_reference / 26 source_use_reference / 7 omitted), `assertRawIdentity`, and `assertSnapshotFromRawText` (identity -> fatal decode -> parse -> strict semantic validation WITH exact Phase 1 counts).
- src/lib/public-surface-authority-map/runtimeManifestContract.ts — strict manifest schema: exact own keys, lowercase hex identity (40/64/40), id composition (source_commit + "-" + sha256), fixed snapshot route prefix, exact path construction, byte-size ceiling, currentness_claim === "none", case-insensitive prohibited-field rejection, and path rejection for scheme/host/credentials/query/fragment/backslash/`..`/percent-encoded traversal/alternate prefixes; plus a build-time manifest<->snapshot identity cross-check. No network/DOM/retries/timers/storage/telemetry/selection logic.
- src/pages/public-surface-map/data/manifest.json.ts — prerendered (`prerender = true`); serves the exact raw manifest source bytes; validates at build; no reserialization; no Worker-time computation; no GitHub/external fetch.
- src/pages/public-surface-map/data/snapshots/[snapshotId].json.ts — prerendered; `getStaticPaths()` enumerates only the approved snapshot; validates id/filename/source bytes and manifest reference at build; serves exact raw snapshot bytes.
- public/_headers — route-scoped rules: manifest (no-cache, must-revalidate) and snapshots/* (public, max-age=31536000, immutable), each with `application/json; charset=utf-8`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow, nosnippet`. No global rules added. (public/_headers did not previously exist on the baseline.)
- scripts/verify-public-surface-map-build.mjs — post-build verifier (18 checks): route existence, generated==source byte equality for manifest and snapshot, byte length 83727, SHA-256, Git blob, manifest + snapshot contract validation, manifest<->snapshot identity, runtime snapshot == fallback bytes, `_headers` presence + exact non-overlapping rules, no external runtime URL in the browser bundle, Phase 1 interactive route present, 27 fallback records, boundary statements present, and no Phase 2B loader marker in the browser bundle. No network requests; no source writes.
- tests/public-surface-authority-map/contracts.test.ts — Node 22 built-in test runner (no dependency added). 48 tests, all pass; 37 distinct stable rejection codes exercised across snapshot-semantic, byte-identity, and manifest mutation categories, plus baseline acceptance and manifest/snapshot cross-check.

Files modified:
- src/lib/public-surface-authority-map/contract.ts — refactored into the SHARED strict semantic validator: `assertSnapshot(input, { expectedCounts? })` enforces the full public vocabulary, exact key schemas, authority-ceiling invariants, navigation-only edge semantics, unique node AND edge IDs, valid endpoints, no self-edges, required boundary statements (verbatim), and INTERNAL count consistency, WITHOUT hard-coding Phase 1 instance counts. Phase 1 provenance, fixed identity, exact counts, `assertRawIdentity`, and `assertSnapshotFromRawText` now live in fallback.ts and are re-exported from contract.ts so existing Phase 1 components import them unchanged (no component edited). Raw identity primitives delegated to byteIdentity.ts.
- package.json — added `test:contracts` (node --test) and `verify:public-surface-map` scripts; extended `check` to run astro build -> tsc -> wrangler deploy --dry-run -> test:contracts -> verify:public-surface-map (generated-output verification runs only after `dist` exists). No dependency added; pnpm-lock.yaml unchanged.
- AGENT_WORKLOG.md — this entry.

Build / tests run: `pnpm install --frozen-lockfile`; `pnpm run check` passes end-to-end (astro build + tsc + wrangler deploy --dry-run + 48 contract/mutation tests + 18 generated-route verifications). `git diff --check` clean; lockfile byte-identical; no unauthorized file changed; fallback snapshot unchanged; runtime snapshot byte-identical to fallback.

Phase 1 unchanged: the live interactive route, component, client module, and all rendered wording are untouched; the build path still validates the exact bundled fallback (identity + exact counts) before rendering; the no-JavaScript fallback still lists 27 records; the browser bundle makes no new manifest or snapshot request.

Boundary-sensitive areas / notes:
- public/_headers interaction with public/.assetsignore (which lists `_headers`) is a DEPLOYMENT-time Cloudflare concern outside Phase 2A. `.assetsignore` is not in the authorized modify list and was not changed; the file is present and byte-verified in `dist/`. Header behavior at the edge must be confirmed during the separately-authorized deployment verification.
- Symbol hygiene: touched human-facing prose uses `≠`; ASCII inequality operators are preserved unchanged in code.

Unresolved questions: whether `_headers` will be served at the edge given `.assetsignore` — deferred to deployment verification (separate authority).
Risks or assumptions: no Phase 2B behavior added; no browser runtime request; no UI wording change; no Phase 3; no dependency; no lockfile change; no Cloudflare configuration change; no source-repository change. No commit, push, PR, merge, or deployment performed.

### 2026-07-14 — Claude Code — public-surface-map-phase2b-runtime-loader

Agent: Claude Code
Task: Phase 2B — Verified Browser Runtime Activation. Add progressive browser runtime loading to /public-surface-map/interactive/ that fetches the fixed same-origin Phase 2A manifest once, strictly validates it, constructs the approved immutable snapshot URL, fetches the snapshot once, validates bytes/identity/UTF-8/JSON/shared snapshot semantics, prepares the complete replacement off-DOM, and atomically activates the verified runtime snapshot. Any failure preserves the Phase 1 fallback, all five boundary statements, and shows only the approved bounded fallback status, with no retry.

Phase 2A production verification: PHASE2A_PRODUCTION_VERIFIED (endpoints, decoded bytes, hashes, contracts, cache/robots headers, transport variants, Phase 1 regression all passed).
Implementation baseline SHA: HEAD == origin/main == d7290b4ffedbc6e949339d8be970c01ec9a02720 (exact match). Local branch `claude/public-surface-map-phase2b-runtime-loader` created from origin/main. Not pushed.

User-approved public strings (verbatim; not paraphrased):
- Initial server-rendered status: "Bundled last-known-good preview snapshot" (existing do-not-modify SNAPSHOT_STATUS_LABEL — retained unchanged).
- Verified runtime status: "Verified same-origin runtime snapshot."
- Runtime failure status: "Runtime snapshot unavailable; showing bundled last-known-good preview snapshot."
- Missing-selection announcement: "The previously selected node is not present in the verified runtime snapshot. Selection and selected-node routing were cleared."

Files added:
- src/lib/public-surface-authority-map/runtimeLoader.ts — browser-executed loader (no DOM rendering). Fixed manifest path /public-surface-map/data/manifest.json; approved snapshot prefix /public-surface-map/data/snapshots/. Reuses byteIdentity.ts, runtimeManifestContract.ts, contract.ts unchanged. Constants: manifest cap 16384 bytes, snapshot cap 262144 bytes, one shared 10000 ms total budget (single AbortController + one setTimeout, never restarted, always cleared in finally). Manifest request: one attempt, fixed literal same-origin path, GET, credentials same-origin, redirect error, no query/fragment, no retry. Snapshot request: one attempt only after a valid manifest; pathname reconstructed from prefix + validated id + ".json" and compared to the validated manifest path. Response checks for both: response.ok, exact final origin === window.location.origin, exact expected final pathname, redirected === false, MIME essence application/json, non-null body, bounded streaming byte read before any text decode (decoded response-body bytes are the identity boundary; response.json()/response.text() never used for identity). Manifest pipeline: fetch → bounded read → fatal UTF-8 → JSON parse → strict runtime manifest contract → approved URL construction. Snapshot pipeline: fetch → bounded read → exact byte-length → SHA-256 → Git blob → fatal UTF-8 → JSON parse → shared strict snapshot contract (internal-consistency counts, not Phase 1 fixed counts) → schema-version cross-check → complete verified snapshot. Boot: exactly one attempt per page load (module latch), no intervals/polling/retry/background refresh/visibility listeners/storage-backed state. Result type: verified success or bounded failure with stable (stage, code[, detail]) codes; internal details never surfaced to public UI.
- tests/public-surface-authority-map/runtimeLoader.test.ts — Node 22 built-in test runner, no dependency added. 52 tests, all pass; 48 distinct result codes exercised. Deterministic mocked fetch + controlled shared budget against the ACTUAL production loader/contracts/byte utilities. Covers: 4 success cases (two-request order/paths, transport-agnostic decoded-byte identity, agreeing id/path/schema/identity, internally-consistent different-count snapshot); manifest transport + contract failures (404/non-OK, redirect, wrong origin, wrong pathname, wrong MIME, missing body, timeout, >16 KiB, invalid UTF-8, malformed JSON, unknown field, schema mismatch, map_id mismatch, non-none currentness, malformed id, uppercase identity, path mismatch, traversal, percent-encoded traversal, query, fragment, backslash, advertised oversize) each with one manifest request and zero snapshot requests; snapshot failures (404, redirect, wrong origin/pathname, wrong MIME, missing body, shared-budget timeout, >256 KiB, wrong byte length, wrong SHA-256, wrong Git blob, invalid UTF-8, malformed JSON, invalid schema version, authority elevation, confirmed relation, duplicate node/edge id, unknown endpoint, altered boundary statement, defensive schema cross-check) each with exactly two requests and no partial return; boot tests (single request pair across repeated boots, no retry/background request after failure, abort timer cleared).

Files modified:
- src/components/PublicSurfaceAuthorityMap.astro — added one explicit snapshot-dependent runtime root [data-psam-runtime-root] wrapping status/provenance/controls/routing/map/detail/legend/table. The five persistent boundary statements (scope banner) and the boundary footer remain OUTSIDE the runtime root and are never sourced from the manifest or snapshot. Added data hooks (record count, edge count, source commit link+code, SHA-256, schema version, omitted count, snapshot status label = bounded runtime status element, table heading, table body). Initial server-rendered status remains the bundled fallback label. No new live region added (the single existing role="status" aria-live="polite" region is reused for final runtime results).
- src/components/publicSurfaceAuthorityMap.client.ts — refactored without weakening Phase 1 interaction. The bundled snapshot remains the initial active model; Phase 2B starts from the fully-initialized fallback and invokes the loader once. On failure: only the bounded failure status updates (no data/map/table/provenance mutation, no retry). On success: prepareActivation builds all runtime-dependent state off-DOM (new node buttons detached, option value sets, table fragment), then commitActivation synchronously replaces the map, filter options, table body, status/provenance, and reconciles selection/routing/focus in one pass so no mixed fallback/runtime interface is observable. State preservation: text filter, grouping, metadata filters (reset only when a value no longer exists), global-routing preference (never auto-enabled), selected node and selected-node routing (kept when the node exists; cleared with the exact missing-selection announcement and focus moved to the nearest stable control when absent). Edges remain navigation only; no centrality/rank/similarity/ontology/authority/relation inference.
- scripts/verify-public-surface-map-build.mjs — check #18 ONLY updated from a Phase 2A-era categorical prohibition on Phase 2B markers to Phase 2B-aware verification: REQUIRE the same-origin /public-surface-map/data/manifest.json and /public-surface-map/data/snapshots/ routes in the browser bundle; REJECT off-origin data URLs (raw/githubusercontent/objects.githubusercontent/api.github.com), storage APIs (localStorage/sessionStorage/indexedDB/document.cookie), serviceWorker, retry/polling (setInterval), telemetry (sendBeacon), and remote dynamic import (import(). setTimeout/AbortController remain allowed (bounded shared budget). Checks #1–#17 unchanged; no snapshot/route/header/boundary/identity verification weakened.
- package.json — script-only change (authorized): added `test:runtime` (node --test on runtimeLoader.test.ts) and appended it to `check`. `test:contracts` preserved; no dependency added; pnpm-lock.yaml byte-identical.
- AGENT_WORKLOG.md — this entry.

Build / tests run: `pnpm install --frozen-lockfile`; `pnpm run check` passes end-to-end (astro build + tsc + wrangler deploy --dry-run + 48 contract tests + 52 runtime-loader tests + 18 generated-route verifications incl. updated check #18). Built browser bundle verified: contains the fixed same-origin manifest route and snapshot prefix; no GitHub-raw/off-origin data URL; no setInterval/retry; no storage API; no serviceWorker; no telemetry; no dynamic import; setTimeout/AbortController present for the bounded budget. Browser interaction tests (headless Chromium via the environment's global Playwright — NOT a project dependency, package.json/lockfile untouched — over a same-origin static server on the built dist/): 59 checks pass across fallback-initial, verified activation, state preservation, missing-selected-node reconciliation, runtime failure, no-JavaScript, and responsive/accessibility (320px + 200%/400% zoom, single component live region, focusable controls, no page-level horizontal overflow, no uncaught console/page errors). Five screenshots regenerated (fallback initial, verified runtime, runtime-failure fallback, missing-selection reconciliation, mobile verified). `git diff --check` clean; only the six authorized files changed; no protected file changed; no lockfile change; no deletion.

Phase 2A preservation: manifest bytes, snapshot bytes, manifest schema, snapshot route, manifest route, _headers, cache behavior, robots headers, Phase 2A contract semantics, and the production data pointer are all unchanged. The loader consumes Phase 2A; it does not redefine it.

Boundary-sensitive areas / notes:
- Two package.json + verifier changes beyond the original five-file scope were explicitly authorized by the user after a reported spec contradiction: the Phase 2A verifier check #18 categorically forbade the exact browser-bundle markers Phase 2B must introduce. Authorization limited the verifier edit to check #18 (Phase 2B-aware, without weakening other checks) and package.json to the smallest script-only change to discover the new test. Both applied within that authorization; the exact package.json diff and old/new check #18 logic were reported before implementation.
- Symbol hygiene: touched human-facing prose uses `≠`; ASCII inequality operators (!=, !==) preserved in code. No literal `!=` introduced in prose.

Unresolved questions: None within Phase 2B scope.
Risks or assumptions: no external fetch; no GitHub runtime request; no D3/CDN/iframe/eval/new Function/remote import; no localStorage/sessionStorage/IndexedDB/cookies; no service worker; no telemetry/analytics; no background polling or retry loops; no runtime writes; no Cloudflare KV/R2/service bindings/separate Workers; no Phase 3 automation; no dependency; no lockfile change; no Cloudflare configuration change; no source-repository change. No commit, push, PR, merge, or deployment performed.

#### Required narrow fix (2026-07-14, same Phase 2B entry) — Codex decision READY_AFTER_REQUIRED_NARROW_FIX

Narrow corrective pass on the same uncommitted branch. Authorized files this pass: src/components/publicSurfaceAuthorityMap.client.ts, src/components/PublicSurfaceAuthorityMap.astro, src/lib/public-surface-authority-map/runtimeLoader.ts, tests/public-surface-authority-map/runtimeLoader.test.ts, AGENT_WORKLOG.md. package.json and scripts/verify-public-surface-map-build.mjs were NOT modified in this pass (they remain exactly as in the accepted Phase 2B implementation).

- Rollback-safe activation transaction (client.ts): preparation stays off-DOM; activation now captures the complete live model + DOM state (active snapshot/model reference, map node elements, node labels, map edge elements, filter option lists + selected values, filter counts, table body + row links, status label, provenance fields, record/edge counts, schema/version fields, detail panel, selected node, selected-node routing, global-routing preference, layout/routing output, focus target), applies all live mutations in eight discrete stages, and on any stage throwing restores every captured surface completely and shows only the bounded runtime-failure status — leaving the Phase 1 fallback fully interactive with no mixed fallback/runtime surface. Restore steps are individually guarded so a restore can never raise an uncaught exception. The transaction does not merely restore the status label.
- Activation-stage fault injection: exercised by the environment-assisted browser harness, which one-shot-overrides the specific DOM operation each of the 8 commit stages performs (node+label replacement, edge replacement, filter-option replacement, table-row replacement, status/provenance update, selection/detail reconciliation, layout+routing, focus restoration). No production seam, global, DOM attribute, query parameter, or debug mode is added. For every injected failure the harness verifies: original active model, nodes, edges, filter options/values, table rows/links, provenance/counts, and selection/routing are restored; no mixed surface remains; the fallback stays interactive; the exact approved runtime-failure status is shown; no retry (manifest=1, snapshot=1); no uncaught console error. Result: 8/8 stages rolled back cleanly.
- Two approved neutral public descriptions (PublicSurfaceAuthorityMap.astro): "The active snapshot status is shown below." replaces "This is a bundled last-known-good preview snapshot." and "This table lists every record in the active snapshot." replaces "This table lists every record in the bundled preview snapshot." Both are static and apply identically to the bundled fallback and the verified runtime state (never rewritten during activation). No banned adjectives; the bundled fallback status label, verified-runtime status, runtime-failure status, missing-selection announcement, five boundary statements, provenance values, map semantics, and authority-ceiling wording are unchanged. After successful activation no visible text claims the runtime table/model is still the bundled preview.
- Loader final-URL hardening (runtimeLoader.ts): fetchExactBytes now, after constructing the final response URL, requires exact origin, exact pathname, empty search, empty hash, and redirected === false — rejecting query (code "query"), fragment (code "fragment"), alternate origin, alternate pathname, and redirect without silently stripping search/hash.
- Pre-abort guard (runtimeLoader.ts): before invoking the fetch function, an already-aborted signal fails immediately with zero network requests (code "aborted"), no timer restart, and no retry; the shared 10-second manifest+snapshot budget is unchanged and the timer is still cleared on all completion paths. An injectable `controller` dep (tests only; production never passes it) exercises this.
- Updated test counts: Phase 2A contract tests 48/48 unchanged; Phase 2B loader tests 55/55 (added final-URL query, final-URL fragment, already-aborted-signal; 51 distinct result codes incl. manifest:query, manifest:fragment, manifest:aborted). Browser scenarios 75/75 including 8 rollback fault-injection stages and neutral-description presence/stale-absence checks in fallback and runtime. Generated verifier remains 18/18.
- Deferred non-blocking findings (recorded, not fixed): (1) focused fallback table-link restoration is a low finding — the transaction restores the exact prior table row nodes (including their links) and the prior active element where still in the document, but does not separately re-home focus onto a specific in-table link; (2) verifier check #18's known marker-based limitations remain — check #18 is retained as a known-marker regression gate and was NOT modified in this pass.
- Preservation: Phase 2A manifest, snapshots, contracts, routes, headers, and production pointer remain unchanged; package scripts and the verifier remain exactly as in the accepted Phase 2B implementation; no Phase 3; no dependency; no lockfile change; no commit, push, PR, merge, or deployment.

#### PR #54 follow-up — boundary-footer public wording (2026-07-14)

Draft PR #54 opened for the accepted Phase 2B implementation (commit afadbed6). Follow-up narrow wording fix on the same branch, authorized files only (src/components/PublicSurfaceAuthorityMap.astro, AGENT_WORKLOG.md): in the persistent boundary footer, replaced the first sentence "This preview shows a bundled last-known-good snapshot of a selected public surface." with "This view shows the active snapshot of a selected public surface." The remainder of the footer is byte-for-byte unchanged. The five persistent boundary statements, runtime status strings, provenance values, runtime loader/client transaction, package.json, lockfile, verifier, Phase 2A data/routes, and Cloudflare configuration are unchanged. No Phase 3; no merge; no deploy; PR remains Draft.
### 2026-07-15 — Codex — phase3b2-immutable-snapshot-retention

Agent: Codex
Task: Implement Phase 3B-2 website-owned deterministic, append-only retention for immutable Public Surface and Authority-Ceiling Map candidate snapshots.
Files changed: scripts/public-surface-snapshot-retention.mjs; scripts/retain-public-surface-snapshot.mjs; tests/public-surface-authority-map/snapshotRetention.test.ts; docs/public-surface-snapshot-retention.md; package.json; AGENT_WORKLOG.md.
Checks run: New retention tests; existing public-surface contract tests; existing runtime-loader tests; public-surface generated-build verification; TypeScript; Astro build; existing Wrangler dry-run check attempted; repository audits.
Result: The fixed-root tool validates repository-relative paths, exact-byte SHA-256 identity, UTF-8 JSON, and the existing snapshot contract before exclusive creation. Byte-identical re-staging is idempotent; conflicting bytes fail closed. Synthetic tests prove multi-snapshot coexistence and pointer separation. No real candidate snapshot was added. The active manifest, last-known-good file, and existing production snapshot remain byte-identical.
Unresolved validation state: WRANGLER_DRY_RUN_BLOCKED_BY_WINDOWS_SANDBOX
Unresolved questions: The required Wrangler 4.88 dry-run is blocked on this Windows host because its native esbuild resolver receives access denied while scanning filesystem ancestors, including after read-only permission grants and a system-temp validation copy. Candidate authority, generator authority, production status, Registry status, ontology status, and pointer adoption remain outside this phase.
Risks or assumptions: The tool intentionally exposes no deletion, overwrite, rename, replacement, pointer-adoption, workflow, orchestration, publication, or deployment operation. Its deterministic output is mechanical identity evidence only and is not semantic authority. The local commit is validation-pending; no push or PR was made.

### 2026-07-15 — Phase 3B-2 post-merge closure

Closure update:

- The earlier `WRANGLER_DRY_RUN_BLOCKED_BY_WINDOWS_SANDBOX` result was
  environment-specific historical context.
- A read-only Linux validation was completed against exact PR head commit
  `48ddb092038b574a78232434d4a54689ad216abc`.
- Wrangler 4.88.0 dry-run completed successfully with exit code 0.
- Contract tests: 48 passed.
- Runtime-loader tests: 55 passed.
- Snapshot-retention tests: 16 passed.
- Total tests: 119 passed, 0 failures, 0 errors, 0 skips.
- Generated-build verification: 18/18 passed.
- TypeScript and Astro build passed.
- PR #55 was merged using the merge-commit method.
- Merge commit:
  `399dbd78ec52a2345a76ed8de6e34179396efe78`
- Merge tree:
  `83555477d1568b9437917fb7390448e2b3a27244`
- `main` advanced to the merge commit.
- The active runtime manifest, last-known-good file, and existing production
  snapshot remained unchanged.
- No real candidate snapshot, pointer adoption, workflow, cross-repository
  orchestration, manual deployment, Registry promotion, ontology promotion,
  or authority promotion occurred.

Recorded closure state:

`PHASE3B2_MERGED`
`PHASE3B2_CLOSED`
`PHASE3B3_NEXT`
`PHASE3B3_NOT_STARTED`

Boundary:

Phase 3B-2 closure records implementation and validation completion only.
It does not authorize Phase 3B-3, Phase 3C, Phase 3D, candidate adoption,
production pointer movement, or publication.

### 2026-07-15 — Codex — phase3b3-cross-repository-orchestration

Agent: Codex

Task: Phase 3B-3 — implement the local, deterministic, fail-closed bridge from
the source-owned Phase 3B-1 isolated generator to the website-owned Phase 3B-2
immutable retention layer. Local implementation and validation only.

Baselines: fresh fetches verified source `origin/main` at
`97631bc0a36f39331a6950d1498400213208afb6` and website `origin/main` at
`339adeb1ef4206ea338111b4b251e2a34107842b`. Website branch
`codex/phase3b3-cross-repository-orchestration` was created at the exact website
baseline. Source repository remained on `main`, clean and read-only.

Boundary assessment: the canonical generator sequence is the Phase 3B-1
`validate_public_metadata.py` preflight, isolated
`build_public_surface_authority_map.py`, and dependency-inventory verification.
Generator identity is the exact immutable commit containing the executed
builder, validator, and inventory schema; Phase 3B-1 intentionally adds no
generator field to map or inventory data. Website validation and retention use
the existing `assertSnapshot` contract through
`retainPublicSurfaceSnapshot`. Snapshot identity remains
`<source-commit>-<exact-byte-sha256>.json` under the fixed website root.

Files added: `scripts/public-surface-candidate-orchestration.mjs`,
`scripts/run-public-surface-candidate-orchestration.mjs`,
`tests/public-surface-authority-map/candidateOrchestration.test.ts`,
`docs/public-surface-candidate-orchestration.md`.

Files modified: `package.json`, `AGENT_WORKLOG.md`.

Implementation: the exact `SOURCE_COMMIT_APPROVED_FOR_GENERATION` gate and an
exact matching generator commit are mandatory. The source origin and commit
object are verified. Separate source and generator roots are materialized with
`git archive`; generation runs with argument arrays, no shell, isolated Python
environment, and outputs outside both roots. Exact output-set and pre/post
byte identities are checked. Candidate bytes receive fatal UTF-8 decoding,
JSON parsing, the shared website contract, and exact-byte SHA-256 before the
existing retention entry point is called. Protected pointers, pre-existing
snapshots, and source bytes/refs are audited. Temporary state is removed on
success and failure. The deterministic result contains mechanical facts only.

Tests: 29 synthetic orchestration tests pass with 0 failures, 0 errors, and 0
skips. Together with existing contract (48), runtime-loader (55), and retention
(16) suites, 148 tests pass. Coverage includes the exact gate, absent commit,
HEAD and dirty-worktree isolation, generator identity and exits, missing and
ambiguous output, inventory verification, UTF-8, JSON, map contract, candidate
SHA mutation, exact SHA identity, first/idempotent/conflicting retention,
pointer and source preservation, deterministic records, forbidden volatile or
authority fields, no external actions, and success/failure cleanup.

Validation: Astro build passed; TypeScript `tsc --noEmit` passed; generated
public-surface verification passed 18/18; `git diff --check` and repository
audits passed. `pnpm install --frozen-lockfile` resolved the exact lockfile but
the managed wrapper returned `ERR_PNPM_IGNORED_BUILDS` for esbuild, sharp,
and workerd and briefly created an unauthorized `pnpm-workspace.yaml`; that
file was removed immediately and the lockfile remained unchanged. Tests and
build were then run directly with the bundled Node runtime against the exact
installed dependency tree.

Wrangler: version 4.88.0 dry-run was attempted only after the successful Astro
build. It was blocked by the Windows sandbox: Wrangler could not write its
AppData log (`EPERM`) and esbuild could not read filesystem ancestors (`Access
is denied`), followed by failure to resolve `dist/_worker.js/index.js`. No broad
filesystem request was made and no code or configuration was changed to bypass
the environment.

Protected identities: `runtime-manifest.json` remains 685 bytes, SHA-256
`a534d8885b7fe7aff87b161202ca57460b28b3fd374800469de07d33ca12249b`,
Git blob `03910040496c663ff49381f76c1bf6ccc7c5a8a1`;
`last-known-good.json` and the existing production snapshot each remain 83727
bytes, SHA-256
`82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`,
Git blob `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`. The fresh Windows clone initially
smudged these files and `public/_headers` to CRLF despite clean Git status; the
exact baseline blob bytes were re-materialized from `HEAD` by `git archive`
before final validation. No semantic or tracked diff resulted.

Unresolved questions: None.

Risks or assumptions: Wrangler remains environment-blocked as described. No
real candidate snapshot, runtime-pointer movement, last-known-good change,
production pointer, source-repository change, network or GitHub action,
workflow, commit, push, PR, review, merge, deployment, Phase 3B-4, Phase 3C, or
Phase 3D action occurred.


### 2026-07-15 — Phase 3B-3 post-merge closure

Closure update:

- The earlier `WRANGLER_DRY_RUN_BLOCKED_BY_WINDOWS_SANDBOX` result recorded in
  the Codex phase3b3-cross-repository-orchestration entry was
  environment-specific historical context and did not reproduce on Linux.
- A read-only Linux validation was completed against exact PR #57 head commit
  `53739e5b31272b6eb4fc85f73c2a703bb6334860`.
- Wrangler 4.88.0 dry-run completed successfully with exit code 0.
- Contract tests: 48 passed.
- Runtime-loader tests: 55 passed.
- Snapshot-retention tests: 16 passed.
- Candidate-orchestration tests: 29 passed.
- Total tests: 148 passed, 0 failures, 0 errors, 0 skips.
- Generated-build verification: 18/18 passed.
- TypeScript and Astro build passed.
- PR #57 was merged using the merge-commit method.
- Merge commit:
  `f7019509298f3c23e294e483b52c046814086107`
- Merge tree:
  `96792655246130b452d000956895fdbc0fa2029e`
- First parent:
  `339adeb1ef4206ea338111b4b251e2a34107842b`
- Second parent:
  `53739e5b31272b6eb4fc85f73c2a703bb6334860`
- `main` advanced to the merge commit.
- The active runtime manifest, last-known-good file, and existing production
  snapshot remained unchanged.
- No real candidate snapshot, pointer adoption, runtime or last-known-good
  pointer movement, workflow, cross-repository orchestration run, manual
  deployment, Registry promotion, ontology promotion, or authority promotion
  occurred.

Recorded closure state:

`PHASE3B3_MERGED`
`PHASE3B3_CLOSED`
`PHASE3B4_NEXT`
`PHASE3B4_NOT_STARTED`

Boundary:

Phase 3B-3 closure records implementation and validation completion only.
It does not authorize Phase 3B-4, Phase 3C, Phase 3D, candidate adoption,
production pointer movement, or publication.

### 2026-07-16 — Codex — Phase 3B-4 manually gated candidate workflow

Agent: Codex
Task: Add the website-owned, manual-only GitHub Actions mechanism that packages the completed Phase 3B-3 orchestration into token-separated generation and controlled Draft-PR publishing jobs.
Files changed: .github/workflows/public-surface-candidate-generation.yml (new), scripts/public-surface-candidate-workflow.mjs (new), tests/public-surface-authority-map/candidateWorkflow.test.ts (new), docs/public-surface-candidate-workflow.md (new), package.json, AGENT_WORKLOG.md.
Checks run: Exact source and website baseline fetch/verification; official action tag resolution; script syntax; package JSON parse; contract, runtime-loader, snapshot-retention, candidate-orchestration, and candidate-workflow suites (190 total: 189 passed, 0 failed, 1 Windows symlink-permission skip); conservative workflow structural and forbidden-token/trigger audit; protected byte/SHA-256/Git-blob identities; snapshot-count, changed-path, deleted-file, lockfile, generated/cache, source-state, and `git diff --check` audits. Frozen pnpm install resolved the lockfile and installed 391 packages but returned `ERR_PNPM_IGNORED_BUILDS`. Astro sync/build was attempted and hit the known Windows sandbox ancestor-read denial; therefore generated-build verification could not run, TypeScript could not obtain Astro's generated raw-import declarations, and Wrangler was not attempted because the build prerequisite did not succeed.
Result: Local mechanism implemented with manual approval-input validation, public-source credential isolation, exact artifact validation, immutable retention reuse, deterministic branch identity, fail-closed branch and Draft-PR state handling, main-drift protection, protected-path audit, and no pointer, adoption, merge, or deployment mechanism. No workflow was dispatched and no real source-corpus orchestration was run.
Unresolved questions: GITHUB_ACTIONS_PR_CREATION_PREREQUISITE_UNVERIFIED; the repository setting allowing GitHub Actions to create pull requests was not readable through the available unauthenticated settings interface.
Risks or assumptions: Both repositories were publicly cloneable without credentials at the verified baselines. Official action pins were verified against their release tags. Branch protection or rulesets may safely reject mutation. GitHub-hosted runners, official action runtime dependencies, and repository administrators remain platform trust boundaries. Phase 3C and Phase 3D were not started.

### 2026-07-16 — Phase 3B-4 post-merge closure

Closure update:

- The earlier Windows-specific Astro, TypeScript, generated-build, and
  Wrangler limitations remain historical context.
- Read-only Linux validation completed successfully against exact PR #59 head
  commit `e674456a02ce1405f15d7686a30c6187bd2572b8`.
- All 190 tests passed with 0 failures, 0 errors, and 0 skips.
- YAML parsing, workflow structural/security tests, Astro sync, TypeScript,
  Astro build, generated-build verification, and Wrangler 4.88.0 dry-run
  passed.
- PR #59 was merged using the merge-commit method.
- Merge commit:
  `30b27a09666cdcc0e82a87588e33e358fb2c6365`
- Merge tree:
  `eaa173fdebc77a8699d166cd8c569894239de3a0`
- First parent:
  `5a315130a1d24041412d01f30891a3cb91e6d67d`
- Second parent:
  `e674456a02ce1405f15d7686a30c6187bd2572b8`
- `main` advanced to the merge commit.
- Automatic Cloudflare preview/build activity was observed as platform
  integration activity only.
- No manual deployment or production adoption occurred.
- The candidate-generation workflow has zero workflow_dispatch runs.
- No source commit was approved and no real candidate, workflow-generated
  candidate branch, or candidate PR was created.
- Runtime snapshot count remains one.
- `runtime-manifest.json` and `last-known-good.json` remain unchanged.
- The user directly verified that the repository setting
  “Allow GitHub Actions to create and approve pull requests” is currently
  disabled.
- No repository setting was changed.
- Phase 3C workflow dispatch remains blocked pending an explicit user decision
  to enable this repository setting or redesign the Draft-PR publication path.
- Phase 3C and Phase 3D were not started.

Recorded closure state:

`PHASE3B4_MERGED`
`PHASE3B4_CLOSED`
`PHASE3C_NEXT`
`PHASE3C_NOT_STARTED`
`GITHUB_ACTIONS_PR_CREATION_PREREQUISITE_VERIFIED_DISABLED`
`PHASE3C_BLOCKED_PENDING_REPOSITORY_SETTING_DECISION`

Boundary:

Phase 3B-4 closure records implementation, validation, and merge completion
only. It does not approve a source commit, dispatch the workflow, generate or
adopt a candidate, move a pointer, publish, deploy, change repository settings,
or authorize Phase 3D.

### 2026-07-16 — Phase 3C checkout-token repair

The single authorized Phase 3C dispatch was consumed by run `29468064598`,
which failed before candidate generation because explicit `token: ""` inputs
caused `actions/checkout` to reject the first checkout step. Publishing was
skipped; no artifact, candidate branch, candidate commit, retained snapshot, or
Draft PR was created. The protected production identities and single runtime
snapshot remained unchanged, and no retry was authorized or performed.

This repair removes only the invalid empty-token inputs while retaining
`persist-credentials: false`, read-only generation permissions, and the
existing publishing-job isolation. A new dispatch requires separate user
authorization after this repair is validated and merged.

`PHASE3C_CONTROLLED_RUN_FAILED_NO_RETRY_AUTHORIZED`
`PHASE3C_WORKFLOW_REPAIR_IN_PROGRESS`
`PHASE3C_RETRY_NOT_AUTHORIZED`
`PHASE3D_NOT_STARTED`

### 2026-07-16 — Phase 3C checkout-token repair post-merge closure

Closure update:

- The original single Phase 3C dispatch authorization was consumed by run
  `29468064598`.
- Run `29468064598` remains completed with failure at attempt 1. Explicit empty
  `token: ""` checkout inputs caused the first checkout to fail before candidate
  generation. Publishing was skipped.
- No retry, rerun, second controlled dispatch, candidate artifact, candidate
  branch, candidate commit, candidate PR, or new runtime snapshot was created.
- PR #61 repaired the checkout-token defect while retaining both
  `persist-credentials: false` boundaries, read-only generation permissions,
  publishing-job isolation, and the manual-only trigger.
- Read-only Linux validation completed against exact repair head
  `9f225ebb603b79f128c2e4d734a7309e65d2c845` with classification
  `REVIEW_PASS_VALIDATION_COMPLETE`.
- All 190 tests passed with 0 failures, 0 errors, and 0 skips. YAML parsing,
  42 workflow structural/security tests, and `git diff --check` passed.
- PR #61 was merged using the merge-commit method.
- Merge commit:
  `c4b5ad33c49710e07d9229af611f7d0958e46d1f`
- Merge tree:
  `47fd78e92085c515435a88bcc9fa8195385b0ba2`
- First parent:
  `a2021d2e58103415e14a670c394dd692a8b91782`
- Second parent:
  `9f225ebb603b79f128c2e4d734a7309e65d2c845`
- The merged workflow blob is:
  `a2ab2a45920ba4cb9b52b8147ecf925305741abb`
- Automatic Cloudflare Workers build activity completed successfully as
  platform integration activity only. No manual deployment or production
  adoption occurred.
- Runtime snapshot count remains one. `runtime-manifest.json` and
  `last-known-good.json` remain unchanged.
- The repair merge does not authorize a rerun. Any future controlled dispatch
  requires new explicit user authorization.
- Phase 3C candidate generation remains incomplete, and Phase 3D has not
  started.

Recorded closure state:

`PHASE3C_FIRST_CONTROLLED_RUN_FAILED_SAFELY`
`PHASE3C_WORKFLOW_REPAIR_MERGED`
`PHASE3C_WORKFLOW_REPAIR_CLOSED`
`PHASE3C_NEW_DISPATCH_AUTHORIZATION_REQUIRED`
`PHASE3C_CONTROLLED_RUN_NOT_COMPLETED`
`PHASE3D_NOT_STARTED`

Boundary:

The original dispatch authorization remains consumed, and the repair merge does
not authorize a rerun. A new dispatch requires new explicit user authorization.
No candidate was generated or adopted, no production pointer moved, and no
production publication or manual deployment occurred. Phase 3D is not
authorized.

### 2026-07-16 — Phase 3C successful controlled-run closure

Closure update:

- Workflow-dispatch count advanced exactly from 1 to 2 under one new explicit
  authorization.
- Earlier run `29468064598` remains completed with failure at attempt 1 and was
  not retried or rerun.
- Controlled run `29482253609` completed successfully at attempt 1 using
  website commit `c5e5b21ed0dec674de38b5badae9979513ee2ed1` and authorized source
  commit `97631bc0a36f39331a6950d1498400213208afb6`.
- Read-only generation and controlled candidate publishing both succeeded.
- Artifact `8368955545`, `public-surface-candidate-data`, was created with
  archive digest
  `sha256:d430597b2367e844e567ee4d90bfd39e81128fa1ce0ae3e0870182a7c3c0bc37`.
- Candidate identity is 83727 bytes, 27 records, 146 edges, SHA-256
  `82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`.
- Deterministic branch:
  `candidate/public-surface/97631bc0a36f39331a6950d1498400213208afb6/82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`
- Candidate commit:
  `97d5750a919c8edc917dab87c046243053427b38`
- Candidate tree:
  `3f33dc6db07a7636a94a58e1aa2788223a7e7dee`
- Candidate parent:
  `c5e5b21ed0dec674de38b5badae9979513ee2ed1`
- The commit adds only:
  `src/data/public-surface-authority-map/runtime-snapshots/97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json`
- Snapshot Git blob:
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`
- GitHub Actions successfully created PR #63 as an open Draft candidate PR.
- PR #63 remains Draft, unapproved, unmerged, candidate-only, and explicitly
  not adopted.
- Candidate bytes are identical to the existing production snapshot and
  `last-known-good.json`; no content update occurred.
- Runtime snapshot count on main remains one. `runtime-manifest.json` and
  `last-known-good.json` remain unchanged.
- Automatic Cloudflare preview/build activity succeeded as platform integration
  activity only. No manual deployment or production adoption occurred.
- Candidate disposition remains a separate user decision. No merge or close
  authorization is recorded here.
- Phase 3D has not started.

Recorded closure state:

`PHASE3C_CONTROLLED_RUN_PASS`
`PHASE3C_CANDIDATE_PR63_DRAFT`
`PHASE3C_CANDIDATE_NOT_ADOPTED`
`PHASE3C_POINTERS_UNCHANGED`
`PHASE3C_CANDIDATE_DISPOSITION_DECISION_REQUIRED`
`PHASE3D_NOT_STARTED`

Boundary:

This block closes the successful controlled-run record only. It does not select
a candidate disposition, mark PR #63 ready, approve, merge, close, adopt,
publish, move a protected pointer, deploy manually, or authorize Phase 3D.
