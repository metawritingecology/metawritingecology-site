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

### 2026-07-08 - Claude Code - audit-schema-jsonld

Agent: Claude Code
Task: Audit the existing minimal schema.org JSON-LD implementation for website identity and routing metadata. Inspected src/components/SchemaJsonLd.astro, src/layouts/BaseLayout.astro, src/pages/index.astro, src/pages/platforms.md, package.json, and astro.config.mjs.
Files changed:
- AGENT_WORKLOG.md - this entry only. No code patch was necessary.
Build / tests run: `pnpm run build` (Astro build) — completed successfully. JSON-LD output verified by rendering `/`, `/platforms/`, `/surfaces/`, and `/about/` through the dev server and parsing each embedded ld+json block with JSON.parse — all valid.
Result: Existing JSON-LD is already present and safe. BaseLayout renders one graph per page through SchemaJsonLd containing exactly two nodes: a WebSite node with stable @id `https://metawritingecology.org/#website` and a per-page WebPage node with stable @id `<canonical-url>#webpage`, linked via isPartOf. Only identity/routing metadata (name, url, description, genre) is emitted. No ontology, model graph, relation graph, reading-path graph, registry graph, source-authority hierarchy, or public/private boundary logic is encoded as structured data. No Dataset, ScholarlyArticle, ResearchProject, DefinedTermSet, Collection, CreativeWorkSeries, or ItemList types are used. No sameAs links are emitted. No canonical source files, homepage prose, navigation, models, publications, fiction, surfaces, entry-points, platforms, pre-model-writing, or llms.txt files were modified. No PR opened.
Unresolved questions: None.
Risks or assumptions: None — audit-only change; the existing implementation already met the minimal-schema requirements, so no refinement patch was applied.

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

### 2026-07-16 — Phase 3C provenance-retention disposition closure

Disposition:

- The user selected:
  `OPTION_A_MERGE_AS_IMMUTABLE_PROVENANCE_RETENTION`
- Candidate PR #63 was marked Ready for review without changing its title,
  body, commit, branch, or candidate-only boundary.
- PR #63 was merged using the merge-commit method as immutable provenance
  retention only.
- Merge commit:
  `e9804b846fbd31a9861e9d5084b2713864fc4bde`
- Merge tree:
  `aeb227ae9f55140682fe69d07c4f3edc448e3ec1`
- First parent:
  `9e50ea93de69ee3ee58bb71deea1581094743213`
- Second parent:
  `97d5750a919c8edc917dab87c046243053427b38`
- The merge adds only:
  `src/data/public-surface-authority-map/runtime-snapshots/97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json`
- The retained snapshot is 83727 bytes, 27 records, and 146 edges, with
  SHA-256:
  `82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`
- Snapshot Git blob:
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`
- Runtime snapshot count changed exactly from one to two.
- `runtime-manifest.json` remains:
  `03910040496c663ff49381f76c1bf6ccc7c5a8a1`
- `last-known-good.json` remains:
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`
- Selected production source remains:
  `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`
- The selected production snapshot and runtime pointer remain unchanged.
- `currentness_claim` remains `none`.
- The retained candidate bytes are identical to the existing production
  snapshot and `last-known-good.json`.
- Workflow-dispatch count remains exactly two. Run `29468064598` remains
  completed with failure at attempt 1 and was not rerun. Run `29482253609`
  remains completed successfully at attempt 1.
- Automatic platform preview/build activity completed successfully. No manual
  deployment or production adoption occurred.
- The controlled run and provenance-retention disposition are complete.
- Phase 3D has not started and requires a separate user decision and
  authorization.

Recorded final Phase 3C state:

`PHASE3C_CONTROLLED_RUN_PASS`
`PHASE3C_PROVENANCE_RETENTION_MERGED`
`PHASE3C_PROVENANCE_RETENTION_CLOSED`
`PHASE3C_COMPLETE`
`PHASE3D_NEXT`
`PHASE3D_NOT_STARTED`

Boundary:

Retaining the snapshot in repository history preserves immutable provenance; it
is not candidate adoption. Protected production pointers and the selected
production source remain unchanged. Phase 3C completion does not authorize
runtime selection, publication, deployment, or Phase 3D execution. Phase 3D
requires a separate user decision and explicit authorization.

### 2026-07-16 — Claude Code — Phase 3D Linux implementation validation (OPTION_B)

Agent: Claude Code

Task: Phase 3D — Linux implementation validation and local commit for the
pre-approved, boundary-fixed five-path change under selected option
`OPTION_B_SELECT_RETAINED_PROVENANCE_SNAPSHOT`. Reproduce the exact four
implementation changes, perform full Linux validation, append this worklog
entry only after validation, and create exactly one local commit. No push,
remote branch, PR, merge, pointer activation, or deployment authorized.

Selected option:

- `OPTION_B_SELECT_RETAINED_PROVENANCE_SNAPSHOT`

Baseline:

- `origin/main` verified exactly:
  `e710fccc2711bf93bfb7383e6b35ef98e2d14122`
- Implementation performed from a clean detached checkout of that commit.

Selected source substitution:

- Old selected source commit:
  `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`
- Proposed selected source commit:
  `97631bc0a36f39331a6950d1498400213208afb6`

Exact three `runtime-manifest.json` field substitutions (all other fields
unchanged):

- `selected_snapshot.id`
  from `18491105f0bc0451e0bf99eaa78c39f69c7cb57c-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`
  to `97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`
- `selected_snapshot.source_commit`
  from `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`
  to `97631bc0a36f39331a6950d1498400213208afb6`
- `selected_snapshot.path`
  from `/public-surface-map/data/snapshots/18491105f0bc0451e0bf99eaa78c39f69c7cb57c-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json`
  to `/public-surface-map/data/snapshots/97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json`

Resulting `runtime-manifest.json` identity:

- bytes: 685
- SHA-256:
  `4c077bf31ef0988128f36f6d64e6201e24d4e03e25fafb959010e837fa279ee3`
- Git blob:
  `bedc30bbcf4e353b8f51e680821847b2583cdd39`

Exact five changed paths (four implementation + this worklog):

- `src/data/public-surface-authority-map/runtime-manifest.json`
  → `bedc30bbcf4e353b8f51e680821847b2583cdd39`
- `src/pages/public-surface-map/data/snapshots/[snapshotId].json.ts`
  → `1954e0ad50dd4ecb6ac8650f77ba3c9a6642fe86`
- `scripts/verify-public-surface-map-build.mjs`
  → `0d0559aa6a5debea3a7e860859d4c443ba944d76`
- `tests/public-surface-authority-map/contracts.test.ts`
  → `8cbe3278faf43baaa86c40b988c282092b59341f`
- `AGENT_WORKLOG.md` (append-only)

Protected-state preservation evidence:

- Both immutable runtime snapshots remain byte-identical, each 83727 bytes,
  SHA-256 `82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`,
  Git blob `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`.
- Runtime snapshot count remains exactly two.
- Runtime data remains 83727 bytes, 27 records, and 146 edges.
- `last-known-good.json` remains unchanged:
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`.
- `fallback.ts` remains byte-identical
  (`4d4fb827ee1aee26834cd373b25dbabb5481517c`) and still attributes source
  `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`.
- `currentness_claim` remains `none`.
- Runtime provenance selection changes without any content update; the
  selected snapshot bytes are unchanged.
- The no-JS/failure fallback provenance is unchanged.

Linux validation results:

- Node: v22.22.2; pnpm: 10.33.0; Python: 3.11.15; Wrangler: 4.88.0.
- `pnpm install --frozen-lockfile`: exit 0; `pnpm-lock.yaml` unchanged.
  Ignored build scripts reported: esbuild@0.25.12, esbuild@0.25.4,
  esbuild@0.27.3, sharp@0.33.5, sharp@0.34.5, workerd@1.20251118.0,
  workerd@1.20260504.1.
- Tests (Linux, symlink test executed): contracts 48 passed; runtimeLoader 55
  passed; snapshotRetention 16 passed; candidateOrchestration 29 passed;
  candidateWorkflow 42 passed; total 190 passed; 0 failed; 0 errors; 0 skipped.
- Astro sync: pass (exit 0).
- TypeScript (`tsc`): pass (exit 0).
- Astro build: pass (exit 0); generated selected snapshot route
  `97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json`.
- Generated-build verifier: all 18 checks passed (exit 0).
- `wrangler deploy --dry-run`: exit 0; 94 assets read; total upload
  1210.67 KiB / gzip 239.52 KiB; no real deployment performed.

Generated-output identities:

- Generated active manifest: 685 bytes, SHA-256
  `4c077bf31ef0988128f36f6d64e6201e24d4e03e25fafb959010e837fa279ee3`, Git blob
  `bedc30bbcf4e353b8f51e680821847b2583cdd39`.
- Generated selected snapshot: 83727 bytes, SHA-256
  `82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`, Git blob
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`, 27 records, 146 edges.

Local commit state:

- Exactly one local commit created on local branch
  `codex/phase3d-runtime-provenance-selection`, parent
  `e710fccc2711bf93bfb7383e6b35ef98e2d14122`.
- No remote Draft PR created.
- No merge authorization.
- No production-deployment authorization.
- No manual deployment performed.
- No public announcement.

Recorded Phase 3D state:

`PHASE3D_OPTION_B_IMPLEMENTATION_PASS`
`PHASE3D_CONTENT_PRESERVING_PROVENANCE_SELECTION_PROPOSED`
`PHASE3D_VALIDATION_COMPLETE`
`PHASE3D_LOCAL_COMMIT_CREATED`
`PHASE3D_REMOTE_DRAFT_PR_NOT_CREATED`
`PHASE3D_MERGE_NOT_AUTHORIZED`
`PHASE3D_DEPLOYMENT_NOT_AUTHORIZED`
`PHASE3D_NOT_COMPLETE`

Boundary:

This is a proposed content-preserving runtime provenance selection, not a
content update. It does not modify fallback provenance, currentness, Registry,
ontology, relation, classification, completeness, or authority status. It is
not effective on main or production until separately reviewed and merged.
Merge authority must separately acknowledge potentially automatic Cloudflare
production behavior. Manual deployment and public announcement remain
unauthorized.

### 2026-07-16 — Phase 3D post-merge closure (OPTION_B)

This block records the final post-merge state of OPTION_B. It supersedes the
pre-merge status tokens in the preceding Phase 3D implementation entry, which
remains preserved as historical context.

Post-merge disposition:

- User selection:
  `OPTION_B_SELECT_RETAINED_PROVENANCE_SNAPSHOT`.
- PR #66 was transitioned from Draft to Ready for review without changing its
  title, body, implementation commit, tree, or five-path scope.
- The user explicitly authorized merging PR #66 using the merge-commit method
  and explicitly acknowledged that merging to main could trigger existing
  automatic Cloudflare build or deployment behavior.
- PR #66 was merged and closed using the merge-commit method.
- Merge commit:
  `99023e0dfb1efb90092a6644236bb20a0e3d3f36`.
- Merge tree:
  `bf8dd18977abb6e9e2c680559d1d4f232d39cc99`.
- First parent:
  `e710fccc2711bf93bfb7383e6b35ef98e2d14122`.
- Second parent:
  `ffdc5b70ecfc962c5e8f32d2f31a197d5a160c4b`.
- The merge contains exactly five changed paths, 144 insertions, and 7
  deletions, with no sixth path and no complete-file deletion:
  - `src/data/public-surface-authority-map/runtime-manifest.json`
    → `bedc30bbcf4e353b8f51e680821847b2583cdd39`
  - `src/pages/public-surface-map/data/snapshots/[snapshotId].json.ts`
    → `1954e0ad50dd4ecb6ac8650f77ba3c9a6642fe86`
  - `scripts/verify-public-surface-map-build.mjs`
    → `0d0559aa6a5debea3a7e860859d4c443ba944d76`
  - `tests/public-surface-authority-map/contracts.test.ts`
    → `8cbe3278faf43baaa86c40b988c282092b59341f`
  - `AGENT_WORKLOG.md`
    → append-only in the implementation commit.

Active state on main after merge:

- Selected runtime source changed from
  `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`
  to
  `97631bc0a36f39331a6950d1498400213208afb6`
  and is active on main.
- Active `runtime-manifest.json` is 685 bytes with SHA-256
  `4c077bf31ef0988128f36f6d64e6201e24d4e03e25fafb959010e837fa279ee3`
  and Git blob
  `bedc30bbcf4e353b8f51e680821847b2583cdd39`.
- Runtime content remains byte-identical and unchanged:
  83727 bytes, SHA-256
  `82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e`,
  Git blob
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`,
  27 records, and 146 edges.
- Runtime snapshot count remains two.
- Both immutable snapshots remain unchanged with Git blob
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`.
- `last-known-good.json` remains unchanged:
  `aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b`.
- `fallback.ts` remains unchanged:
  `4d4fb827ee1aee26834cd373b25dbabb5481517c`.
- Fallback and no-JS/failure attribution remain:
  `18491105f0bc0451e0bf99eaa78c39f69c7cb57c`.
- `currentness_claim` remains `none`.

Automatic platform activity:

- Merge-triggered Cloudflare check:
  `Workers Builds: metawritingecology-site`.
- Check run ID:
  `87602641453`.
- Build ID:
  `f940aa5c-2c47-4101-af6e-a0d3a90c263c`.
- Version ID:
  `79e00fc8-d60c-4245-aa3d-d5c3c350ae5e`.
- Target:
  `main` at
  `99023e0dfb1efb90092a6644236bb20a0e3d3f36`.
- Terminal conclusion:
  success.
- Available evidence establishes successful automatic platform activity but
  does not explicitly establish that the generated version became the live
  production deployment.
- Classification:
  `AUTOMATIC_PLATFORM_EFFECT_AMBIGUOUS`.

Authority audit:

- Workflow-dispatch count remains exactly two.
- Run `29468064598` remains completed with failure at attempt 1 and was not
  rerun.
- Run `29482253609` remains completed successfully at attempt 1.
- No third dispatch, retry, or rerun occurred.
- No approval review was submitted.
- Auto-merge was not enabled.
- No repository setting changed.
- No branch was deleted.
- No manual or manual-Wrangler deployment occurred.
- No public announcement occurred.
- No fallback reattribution occurred.
- No currentness change occurred.
- No rollback commit was created.

Recorded final Phase 3D state:

`PHASE3D_OPTION_B_MERGED`
`PHASE3D_CONTENT_PRESERVING_PROVENANCE_SELECTION_ACTIVE_ON_MAIN`
`PHASE3D_RUNTIME_CONTENT_UNCHANGED`
`PHASE3D_FALLBACK_PROVENANCE_UNCHANGED`
`PHASE3D_CURRENTNESS_UNCHANGED`
`PHASE3D_AUTOMATIC_PLATFORM_EFFECT_AMBIGUOUS`
`PHASE3D_POSTMERGE_CLOSURE_RECORDED`
`PHASE3D_COMPLETE`

Boundary:

Phase 3D changed runtime provenance selection without changing runtime content.
`last-known-good.json`, fallback provenance, and `currentness_claim` remained
unchanged. Automatic platform activity is classified only to the level
supported by available evidence: ambiguous, not verified production. No manual
deployment or public announcement occurred. Phase 3D completion does not
authorize any subsequent phase, publication, fallback reattribution,
currentness change, additional deployment, or repository mutation.

### 2026-07-19 — Claude Code — semantic-flow-corrections-and-three-source-entries

Agent: Claude Code
Task: Implement approved Phase A semantic/reading-flow corrections and Phase B
selective placement of three public source entries (Delegated Execution /
Retained Answerability; Structural Fidelity / Use-Validity Boundary;
LLM-Condition / Research-Result Boundary) across public surface pages. Bounded
website implementation task; no conceptual-repo, classification, relation,
Registry, ontology, or authority decisions.
Files changed:
- src/pages/models.md (classification-aware title/boundary/index heading;
  new "Selected Boundary Notes / Protocol-Facing Notes" section)
- src/pages/publications.md (source-linked DOI record wording; heading rename;
  normalized split pairs to one record per bullet; three entries appended)
- src/pages/entry-points.md (removed manual "Selected public corpus additions"
  list; new "Source Reading Paths" + "Boundary-Oriented Source Routes";
  site-path orientation note; compressed Medium boundary)
- src/pages/surfaces.md (compressed fiction-boundary sections; removed manual
  document list, replaced with Model Atlas / Reading Paths navigation;
  added Platform surface after Corpus surface — /platforms/ verified present)
- src/pages/public-records.md (replaced individual DOI enumeration with two
  category-level anchor bullets)
- src/layouts/BaseLayout.astro (added route-specific schemaOverrides for
  /models/, /publications/, /entry-points/, /public-records/;
  /surfaces/ override preserved)
- package.json (added test:semantic-flow script; wired into check)
- tests/semantic-flow-source-entries.test.ts (new: semantic, placement, and
  LLM-Condition guardrail tests; Node built-in runner, no new dependency)
Build / tests run: pnpm install --frozen-lockfile (lockfile unchanged);
pnpm run build (pass); pnpm run check (pass, incl. 21 new tests + 18
public-surface-map checks); git diff --check (clean); rendered-page review via
astro dev of /models/, /publications/, /entry-points/, /surfaces/,
/public-records/ (JSON-LD genres correct; blob/main links; exact DOIs; three
entries absent from /surfaces/ and /public-records/).
Result: All Phase A + Phase B edits applied and verified. No commit, push,
merge, PR, deploy, or publish performed.
Unresolved questions: None.
Risks or assumptions: Ran a frozen (no-write) install to restore node_modules
for build/test; pnpm-lock.yaml unchanged. Worklog updated per AGENTS.md.

Codex independent-review correction note:
- Restored the explicit Models-page limitation covering the full working
  corpus, complete Registry, private archive, and internal calibration layer.
- Replaced the broadened "professional methods" phrase with the prior
  clinical, legal, and financial method boundaries.
- Integrated the Medium boundary sentence into Source Reading Paths and
  removed the near-duplicate one-sentence Source-Based Reading Paths section.
- Merged the duplicate Publications bullets on Public Record Anchors.
- Restored the fictional-universe guardrail, aligned the closing surface names
  with Fiction/System/Corpus/Platform, and removed the repeated Related
  boundary pages label.
- Normalized the selected source-linked publication records to one continuous
  list with consistent em-dash separators.
- Strengthened the semantic-flow tests so placement is verified inside the
  approved sections, LLM-Condition guardrails cover each containing section,
  duplicate source-path/publication structures are rejected, and `.mdx` is an
  accepted Astro route source for `/platforms/`.
Independent validation: the corrected semantic-flow suite passed 21/21 with
zero failures or skips; `git diff --check` was clean before the Windows sandbox
helper stopped accepting shell commands. A full independent Astro build and
`pnpm run check` remain required before commit authorization because the review
environment blocked parent-directory enumeration used by esbuild. No commit,
push, merge, PR, deploy, or publish occurred.

### 2026-07-20 — Claude Code — package-1-deterministic-toolchain-ci

Agent: Claude Code
Task: Implement Package 1 only — deterministic PR/main CI, Astro-aware type
checking, retained explicit TypeScript checking, a pinned pnpm version, and a
grouped Dependabot configuration. Local implementation and validation only.
Baseline: origin/main verified at
d9014742d03a61297d97d1e3392f207590e1165b (matches the recorded baseline; no
drift). Work done in a dedicated clean worktree
(/home/user/mwe-site-package-1-ci) on branch
claude/site-ci-deterministic-toolchain created from the verified base. The
primary checkout was left untouched (it was already clean).
Files changed:
- package.json — added "packageManager": "pnpm@10.34.5" (Node ">=22" floor
  retained, unchanged); added devDependency "@astrojs/check": "0.9.9"; added
  scripts "check:astro" (astro check) and "check:ts" (tsc --noEmit); rewired
  the full "check" script so the bare tsc step became
  "pnpm run check:astro && pnpm run check:ts", leaving every existing step
  (astro build, wrangler deploy --dry-run, test:contracts, test:runtime,
  test:retention, test:orchestration, test:workflow, test:semantic-flow,
  verify:public-surface-map) in place and in order.
- pnpm-lock.yaml — regenerated with pnpm 10.34.5 to resolve @astrojs/check@0.9.9
  and its subtree; existing packages were re-keyed only to carry the new
  yaml@2.9.0 peer context. No existing dependency was downgraded, removed, or
  version-changed.
- .github/workflows/ci.yml (new) — "Site CI"; triggers pull_request and push to
  main; top-level permissions contents: read; one job with stable display name
  site-ci on ubuntu-latest; Node 22 via actions/setup-node (v4.4.0, full SHA);
  checkout via actions/checkout (v4.2.2, full SHA, persist-credentials false),
  both SHAs reused verbatim from the existing repository workflow; pnpm 10.34.5
  activated with corepack enable + corepack prepare pnpm@10.34.5 --activate;
  runs pnpm install --frozen-lockfile then pnpm run check. Concurrency cancels
  superseded runs for pull requests only (cancel-in-progress gated on
  event_name == 'pull_request'), so an in-flight main validation is never
  cancelled by a later main commit. No secrets, no real Wrangler deploy, no
  Cloudflare mutation, no publication, no cache (deterministic first version).
- .github/dependabot.yml (new) — version 2; npm ecosystem (dir /, weekly, limit
  5) with ordered minor/patch groups cloudflare-wrangler, astro, dev-tooling
  (majors intentionally left ungrouped so each surfaces as its own PR);
  github-actions ecosystem (dir /, weekly, limit 5). No auto-merge, no
  credentials, no ruleset.
- AGENT_WORKLOG.md — this entry (required by AGENTS.md).
Build / tests run: corepack pnpm 10.34.5 / Node v22.22.2. pnpm install
--frozen-lockfile (consistent); pnpm run check:astro (0 errors, 0 warnings, 1
pre-existing hint on SchemaJsonLd.astro); pnpm run check:ts (tsc --noEmit,
exit 0); pnpm run build (exit 0); pnpm run check end-to-end (exit 0):
astro check clean, tsc clean, wrangler 4.88.0 deploy --dry-run succeeded
("--dry-run: exiting now.", Total Upload 1208.57 KiB, no real deploy),
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21
(211 tests, 0 failures, 0 skipped), verify:public-surface-map 18/18.
git diff --check clean. YAML for both new files parsed and structurally
verified with the already-present yaml parser (no dependency added for
validation).
Result: Package 1 implemented locally. The existing public-surface
candidate-generation workflow was not modified. No content page, metadata,
crawler policy, header, 404, RSS, sitemap, link, GitHub setting, Cloudflare
setting, or deployment configuration changed. No commit, push, PR, merge,
deploy, or publish performed; review artifacts (patch + manifest) exported
outside the repository.
Unresolved questions: None.
Risks or assumptions: The lockfile change is the reviewed resolution of
@astrojs/check@0.9.9 only. Action SHAs were reused from the existing repository
workflow rather than newly sourced. Packages 2–5 were not implemented.

### 2026-07-20 — Claude Code — package-2a-custom-404-and-response-headers

Agent: Claude Code
Task: Implement Package 2A only — custom HTTP 404 surface and the response-header
architecture (SSR middleware + static _headers) with an enforced frame-ancestors
CSP and a broader Report-Only CSP. Implementation-only: local and uncommitted.
Scope is Package 2A exclusively. No SECURITY.md, no security.txt, and no
observability document were created. No commit, push, PR, preview deployment,
production deployment, GitHub setting, Cloudflare setting, or Email Routing
change occurred. No Package 2B work was performed.

Baseline: origin/main verified at
fb1a2c6a7c21b5164fb0a3cfee5d6d96242df3a5 (matches the recorded baseline; no
drift). Work was done on branch claude/package-2a-security-headers-404-uqcj32,
which the harness had already checked out at the exact verified base SHA (an
isolated feature-branch checkout equivalent to the requested clean worktree);
no separate main checkout exists to protect.

Files changed:
- src/pages/404.astro (new) — standalone Astro 404 route. Preserves a real HTTP
  404, imports the existing global stylesheet, does not use the shared layout,
  emits no canonical URL and no JSON-LD, and includes
  <meta name="robots" content="noindex, follow">. Bounded English title
  ("Page not found — Meta-Writing Ecology"); heading "Page not found"; body
  "The requested public page could not be found. Continue from Home, About,
  Entry Surfaces, or Thematic Entry Points."; stable links only to /, /about/,
  /surfaces/, /entry-points/. No wording implies the missing route is private,
  hidden, unpublished, suppressed, an internal archive, or a Registry entry.
  No search, diagnostics, map code, or new navigation.
- src/middleware.ts (new) — SSR middleware (defineMiddleware / onRequest) that
  awaits next() and then sets each Package 2A header exactly once on the
  returned response. It mutates only headers, so body, status, statusText, and
  existing headers are preserved verbatim (no Response rebuild, no 404→200, no
  redirect/route rewriting, no platform-error capture). No logging of request
  URLs, query strings, or bodies. Enforced: X-Content-Type-Options: nosniff;
  Referrer-Policy: strict-origin-when-cross-origin; Permissions-Policy:
  camera=(), geolocation=(), microphone=(); Content-Security-Policy:
  frame-ancestors 'self';. Report-Only: default-src 'self'; base-uri 'self';
  object-src 'none'; frame-ancestors 'self'; script-src 'self'; style-src
  'self'; img-src 'self'; font-src 'self'; connect-src 'self'
  https://66a032cb-79af-46cb-82f1-2576f76bae9d.search.ai.cloudflare.com;
  form-action 'self'; upgrade-insecure-requests;. No unsafe-inline/eval,
  nonce, hash, report-uri/report-to/Reporting-Endpoints, X-Frame-Options,
  HSTS, COOP, CORP, or COEP.
- public/_headers (edit) — added a /* catch-all rule carrying the same five
  Package 2A policy headers (four enforced + the Report-Only CSP). Preserved
  the manifest and snapshot rules' Content-Type, Cache-Control, and
  X-Robots-Tag. Removed the now-duplicate X-Content-Type-Options declarations
  from both path-specific blocks so the catch-all is its sole source and
  Cloudflare rule composition cannot produce a comma-joined value. No
  security.txt rule was added.
- scripts/verify-public-surface-map-build.mjs (edit; user-authorized as one
  additional in-scope file) — updated check 13 to the new header architecture
  without weakening verification: it now asserts the /* catch-all block
  contains exactly the four enforced headers plus the approved Report-Only CSP;
  asserts the manifest and snapshot path-specific blocks still contain their
  exact Content-Type, Cache-Control, and X-Robots-Tag; and asserts
  X-Content-Type-Options is not repeated in either path-specific block. Every
  other public-surface-map check is unchanged.
- tests/security-resilience.test.ts (new) — 26 deterministic Node built-in
  (node:test + assert) source-contract tests: 404 contract, middleware
  contract, _headers contract, and cross-layer consistency. No test framework
  or dependency added. Source-only, so Report-Only violations from known inline
  scripts cannot make them fail.
- package.json (edit) — added script test:security-resilience (node --test
  tests/security-resilience.test.ts) and inserted it into the full "check"
  chain immediately before verify:public-surface-map. No existing step removed,
  weakened, renamed, or reordered incompatibly. No dependency change.
- AGENT_WORKLOG.md — this entry.

No pnpm-lock.yaml change (verified byte-identical before/after
pnpm install --frozen-lockfile).

Build / tests run: corepack pnpm 10.34.5 / Node v22.22.2.
pnpm install --frozen-lockfile (consistent; lockfile unchanged);
pnpm run test:security-resilience 26/26; pnpm run check:astro (0 errors,
0 warnings, 1 pre-existing hint on SchemaJsonLd.astro); pnpm run check:ts
(tsc --noEmit exit 0); pnpm run build (exit 0, 404 route built);
pnpm run check end-to-end (exit 0): astro build, astro check, tsc,
wrangler 4.88.0 deploy --dry-run (dry-run only, no real deploy),
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 31/31 (242 tests, 0 failures, 0 skipped; totals
updated by the correction note below — superseding the original 26/26 and 237),
verify:public-surface-map 18/18. git diff --check clean.

Local response probes (wrangler dev, no deployment; "Parsed 3 valid header
rules"): / and /about/ (SSR HTML) → 200 with all five policy headers;
/public-surface-map/interactive/ (prerendered HTML) → 200 with all five;
/robots.txt, /llms.txt, /sitemap-index.xml (static) → 200 with all five;
/public-surface-map/data/manifest.json → 200 retaining application/json
Content-Type, no-cache Cache-Control, and noindex/nofollow/nosnippet X-Robots-Tag
plus the five policy headers, with X-Content-Type-Options and the enforced CSP
each appearing exactly once (no comma-join); a nonexistent route → 404 carrying
the custom body (heading "Page not found", noindex/follow, no canonical, the
four approved links) and all five headers. No redirect route exists in this
build to exercise; the middleware mutates only headers, so any redirect status
would be preserved.

CSP Report-Only observation: browser automation (Playwright/Puppeteer) is not
installed and adding a dependency is prohibited, so live console-report capture
is deferred to a preview stage. Static evidence: pages carrying the public
search modal include one inlined <script> (~14.4 KB) which, under Report-Only
script-src 'self', is an expected non-blocking Report-Only violation and
evidence for later work — not resolved here (no unsafe-inline, nonce, or hash
added). JSON-LD is emitted as non-executed application/ld+json data (not subject
to script-src). The only external data endpoint (the Cloudflare AI search
domain) is already covered by connect-src, so no unexpected external dependency
was found.

Result: Package 2A implemented locally and validated. Review artifacts (patch +
manifest) exported outside the repository. Nothing committed, staged, pushed, or
deployed.

Unresolved questions: None outstanding. One conflict was surfaced and resolved
by the user: the pre-existing verify:public-surface-map check 13 required
X-Content-Type-Options inside the path-specific _headers blocks, contradicting
the instruction to remove that duplicate; the user authorized
scripts/verify-public-surface-map-build.mjs as one additional in-scope file and
specified the new assertions, applied above.

Risks or assumptions: Expected inline-script Report-Only violations are recorded
as evidence for later work and were deliberately not silenced. Static header
delivery in production is governed by Cloudflare's _headers processing; wrangler
dev parsed and applied the rules locally, but final composition should be
reconfirmed at preview. Only Package 2A was implemented; Package 2B was not.

Correction note (Codex pre-commit review — same uncommitted Package 2A entry):
Codex identified that both the build verifier (check 13) and the security
tests relied on first-occurrence-only lookups (Array.indexOf on a path line)
and on substring/self-referential assertions, so a second, conflicting rule
block with a duplicate path — or a header value that appeared under the wrong
key — could pass undetected. Only scripts/verify-public-surface-map-build.mjs,
tests/security-resilience.test.ts, and this worklog entry were changed; no
runtime header value, middleware, 404 page, public/_headers, package.json,
dependency, or pnpm-lock.yaml changed, and the seven-file Package 2A scope is
unchanged. Corrections: (1) check 13 now normalizes CRLF/CR to LF, discovers
every rule block, and requires exactly one occurrence of /*,
/public-surface-map/data/manifest.json, and /public-surface-map/data/snapshots/*
(rejecting zero or more than one) before comparing exact ordered directive
bodies, so a correct first block followed by a conflicting duplicate is
rejected. (2) The middleware tests now parse the actual ENFORCED_HEADERS object
into a key→value mapping (exactly four entries, deep-equal to the approved
mapping), parse the actual REPORT_ONLY_CSP assignment, and assert the explicit
response.headers.set("Content-Security-Policy-Report-Only", REPORT_ONLY_CSP)
binding and the Object.entries(ENFORCED_HEADERS) set loop — no self-comparison
and no unrelated substring matching. (3) The _headers tests now parse the actual
public/_headers into unique rule blocks with exact bodies, confirm
X-Content-Type-Options / enforced CSP / Report-Only CSP live only in the
catch-all, retain the manifest and snapshot MIME/cache/robots contracts, and
confirm no security.txt rule. (4) Added deterministic in-memory fixtures that
reject a duplicate /*, a duplicate manifest rule, and a duplicate snapshot rule
(each a correct first block plus a conflicting second block), plus a CRLF
fixture confirming a valid CRLF-terminated file is accepted; fixtures never
mutate the real public/_headers or dist/_headers and do not depend on build
output. Cross-layer consistency now compares the parsed middleware mapping with
the parsed catch-all directive mapping. The broader CSP remains Report-Only and
Package 2B remains out of scope. Final validation after the correction:
test:security-resilience 31/31; full suite 242 tests, 0 failures, 0 skipped;
verify:public-surface-map 18/18; pnpm run check exit 0; wrangler deploy
--dry-run only; pnpm-lock.yaml unchanged; nothing staged.

### 2026-07-21 — Claude Code — package-2b-public-security-contact-and-observability

Agent: Claude Code
Task: Implement Package 2B only — public security contact and repository-side
security / observability boundary documentation. Implementation-only: local and
uncommitted. This adds SECURITY.md, public/.well-known/security.txt, and
SECURITY_OBSERVABILITY.md; adds one path-specific static-response rule for
security.txt to public/_headers; and extends the deterministic
security-resilience tests. Scope is Package 2B exclusively. No Package 2A
correction, no broader CSP enforcement, no CSP nonce/hash, no CSP reporting
collector, no GitHub Security Advisory / ruleset change, no Cloudflare / NEL /
Email Routing change, no search-service CORS change, no preview-origin
allowlist change, no crawler-policy redesign, no monitoring / log-shipping /
alerting integration, and no MWE classification, Registry, relation, or
authority change occurred.

Baseline: origin/main verified at the exact current SHA
5fa73e2088423527962c267f2f7f8b6e30fd7094 (Package 2B base). Package 2A merge
was confirmed present: commit 7491bc2b4d79c50c2b5dd380dfea59906f77b67b is an
ancestor of origin/main (git merge-base --is-ancestor succeeded). Work was done
in a clean, dedicated worktree at
/home/user/mwe-site-package-2b-security-policy on branch
claude/package-2b-security-policy, created from the verified base SHA; the
primary checkout was not modified.

Public contact and expiry: the sole public security contact is
security@metawritingecology.org and the security.txt Expires value is
2027-06-30T23:59:59Z, with Canonical
https://metawritingecology.org/.well-known/security.txt. The user confirmed
that an external delivery test to security@metawritingecology.org succeeded;
that confirmation is treated as sufficient. No private forwarding/mailbox
detail was accessed, inferred, or recorded; no Email Routing setting was
changed; no second test email was sent.

Files changed (six-file Package 2B scope):
- SECURITY.md (new) — public security policy. Scope limited to the public site
  (https://metawritingecology.org) and this public website repository, with the
  explicit boundary that it does not represent the full MWE archive, Registry,
  working corpus, or authority structure. Reporting via a mailto link to the
  approved public contact; bounded "please include" and "please avoid" guidance;
  bounded appropriate-report and out-of-scope lists (out-of-scope excludes
  conceptual, classification, Cross/Log/Protocol/Draft/Registry status, relation
  confirmation, OSF priority, editorial, publish/hide/rename/reclassify, ordinary
  non-security content edits, full-archive disputes, preview-only platform
  behavior, and marketing/scanning offers). "No unsupported commitments" states
  that receipt of a report does not create a response-time, resolution-time,
  confidentiality, compensation, bounty, or disclosure commitment; no
  legal-safe-harbor language added. No private forwarding address appears.
- public/.well-known/security.txt (new) — UTF-8 plain text, LF line endings,
  one final newline (145 bytes). Exactly three fields, in order: Contact:
  mailto:security@metawritingecology.org / Expires: 2027-06-30T23:59:59Z /
  Canonical: https://metawritingecology.org/.well-known/security.txt. No
  comments, no phone, no encryption key, no acknowledgement URL, no hiring
  field, no bounty/response-time statement, no Policy field, no
  Preferred-Languages field, no private forwarding address. Canonical points at
  production, not the workers.dev preview origin.
- SECURITY_OBSERVABILITY.md (new) — "Security and Observability Boundaries",
  separating (A) repository-enforced controls (deterministic CI; build/Astro/TS/
  contract checks; Wrangler dry-run; custom 404 contract; SSR + static
  response-header architecture; enforced same-origin framing; broader CSP in
  Report-Only mode; security-resilience tests; public-surface-map verification;
  security.txt source/response contract), (B) externally observed platform
  signals (GitHub checks; Cloudflare Workers build/deploy records; prod/preview
  HTTP inspection; browser console/network; Cloudflare-generated NEL Report-To
  header classified as platform-generated; preview X-Robots-Tag noindex overlay
  classified as a preview-origin overlay; preview search CORS classified as an
  external-service/origin limitation; each requiring reverification when
  platforms change), and (C) controls not asserted (uptime monitoring, incident
  paging, SOC, SIEM/centralized logs, log-retention duration, complete
  request-log access, automatic incident response, vulnerability-response SLAs,
  guaranteed report confidentiality, bug bounty, Cloudflare-account config,
  GitHub-org config, Email Routing internals, private mailbox identity, and a
  complete MWE archive/Registry/authority map). A review-boundary section states
  neither the repository nor platform records replace user authority over
  publication, classification, Registry status, public/private boundaries, or
  final release. No credentials, mailbox details, account IDs, tokens, or
  dashboard exports appear.
- public/_headers (edited) — added exactly one path-specific rule for
  /.well-known/security.txt with only Content-Type: text/plain; charset=utf-8
  and Cache-Control: public, max-age=3600, must-revalidate. The rule does not
  repeat any Package 2A catch-all header (X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, CSP, CSP-Report-Only) and carries no
  X-Robots-Tag. The existing catch-all /*, manifest, and snapshot rules and
  their exact directive bodies/ordering are unchanged; no CSP value changed.
- tests/security-resilience.test.ts (edited) — retained all Package 2A tests;
  the shared validateHeadersContract now requires exactly one
  /.well-known/security.txt rule with its exact ordered two-directive body and
  asserts that rule repeats no Package 2A catch-all header and carries no
  X-Robots-Tag; the synthetic VALID_FIXTURE now includes the security.txt block,
  and a new fixture rejects a conflicting duplicate security.txt rule. Added
  deterministic Package 2B tests for: the security.txt source (exact three
  fields/order, exact Contact/Expires/Canonical, LF-only, single final newline,
  no duplicate fields, no comments, no forbidden/unrelated fields, only the
  approved email present, no response-time/bounty/confidentiality/compensation
  promise); the SECURITY.md structural contract (approved contact + mailto,
  scope limited to public site and this public repo, MWE archive/Registry/
  authority boundary present, conceptual/classification/Registry/editorial/
  publication exclusions present, only the approved email present, bounded
  no-commitments clause present); the SECURITY_OBSERVABILITY.md contract
  (A/B/C sections in order; NEL classified platform-generated; preview
  X-Robots-Tag classified as overlay; preview search CORS classified as
  external-service/origin limitation; broader CSP still Report-Only;
  monitoring/alerting/SIEM/log-retention/SLA/confidentiality/bounty listed only
  under controls-not-asserted; no email address present and Email Routing named
  only as an internal boundary; scripts/signals not described as final MWE
  authority); and cross-file consistency (SECURITY.md and security.txt share the
  contact; Canonical matches production and is not a preview origin; expiry
  matches; observability doc does not contradict the enforced/Report-Only split;
  no private forwarding address or placeholder in any new Package 2B file).
- AGENT_WORKLOG.md (this entry).

No package.json or pnpm-lock.yaml change; no dependency added or removed.

Build / tests run (pinned toolchain: pnpm 10.34.5, node v22.22.2;
pnpm install --frozen-lockfile): pnpm run check exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 64/64 (was 31/31 under Package 2A; +33 Package 2B
tests), verify:public-surface-map 18/18. Full deterministic total: 275 tests,
0 failures, 0 skipped. check:astro 0 errors / 0 warnings / 1 pre-existing hint;
check:ts clean; wrangler deploy --dry-run only ("--dry-run: exiting now"; no
deploy). git diff --check clean; nothing staged; pnpm-lock.yaml unchanged.

Build-output verification: pnpm run build produced
dist/.well-known/security.txt; cmp against public/.well-known/security.txt
reports the bytes identical (145 bytes each).

Local response probes (wrangler dev on the built dist, no deployment;
"Parsed 4 valid header rules"): GET /.well-known/security.txt → 200, body
exactly the approved three-field document (145 bytes, no HTML wrapper, no
redirect), Content-Type text/plain; charset=utf-8, Cache-Control public,
max-age=3600, must-revalidate, and each Package 2A catch-all security header
(X-Content-Type-Options, Referrer-Policy, Permissions-Policy, enforced CSP,
Report-Only CSP) present exactly once with no comma-join and no X-Robots-Tag;
no private forwarding information present. Package 2A regression probes
unchanged: GET / → 200 with all five policy headers; a nonexistent route → 404
carrying the custom body ("Page not found", noindex/follow) and the enforced
headers; GET /public-surface-map/data/manifest.json → 200 retaining
application/json Content-Type, no-cache Cache-Control, and
noindex/nofollow/nosnippet X-Robots-Tag, with the enforced CSP and
X-Content-Type-Options each once.

Result: Package 2B implemented locally and validated in a dedicated worktree.
Review artifacts (patch + manifest) exported outside the repository. Nothing
committed, staged, pushed, or deployed; no PR opened; no preview or production
deployment; no GitHub, Cloudflare, Email Routing, CORS, NEL, preview-robots,
mailbox, or Package 2A change occurred.

Unresolved questions: None outstanding.

Risks or assumptions: Static header delivery in production is governed by
Cloudflare's _headers processing; wrangler dev parsed and applied all four
rules locally and composed the catch-all plus the security.txt path rule as
expected, but the exact deployed response composition should be reconfirmed at
PR preview. The external delivery test to the public contact is recorded only
as user-confirmed; no mailbox internals were inspected. Only Package 2B was
implemented.

Correction note (Codex substantive pre-commit review — same uncommitted
Package 2B entry): Codex found that the Package 2B policy-document tests were
substring/structural only and could pass even if contradictory affirmative
promises were appended to an otherwise valid document (e.g. a guaranteed
response time, guaranteed confidentiality, a bug bounty, coordinated-disclosure
terms, or legal safe harbor), and that the SECURITY_OBSERVABILITY.md checks used
whole-file substring searches that did not bind each interpretation to its
required section or reject a wrong section location, duplicate section, or
out-of-order section. Only tests/security-resilience.test.ts and this worklog
entry were changed; no policy document, security.txt, header, runtime,
middleware, package.json, dependency, or pnpm-lock.yaml changed, and the
six-file Package 2B scope is unchanged. Package 2A remains unchanged.

Corrections: (1) Added reusable local validators validateSecurityMd(text) and
validateSecurityObservabilityMd(text) that operate on supplied strings and
return an array of violation strings; the real repository documents and all
in-memory mutation fixtures are validated through the same helpers (no shared
helper file, no dependency). (2) SECURITY.md validation now requires the exact
first H1 "# Security Policy" (rejecting a missing, different, later, or
duplicated H1), binds the scope URL / "public website repository" / four-part
MWE-archive/Registry/working-corpus/authority boundary to the Scope section,
requires all eleven out-of-scope exclusion classes in the Out-of-scope section,
requires the bounded no-commitment negation plus "acceptance not guaranteed",
rejects any email other than the approved public contact, and rejects
affirmative promises anywhere (guaranteed response/resolution time, guaranteed
confidentiality, compensation/bounty, coordinated disclosure, legal safe
harbor, universal acceptance) using clause-level negation-aware analysis that
distinguishes a negated statement ("does not create a ... commitment") from an
affirmative promise. (3) SECURITY_OBSERVABILITY.md validation now parses the
Markdown into sections and requires exactly one ordered occurrence of A.
Repository-enforced controls, B. Externally observed platform signals, C.
Controls not asserted, and Review boundary (rejecting missing, duplicate, or
misordered sections); binds the section-A enforced-control statements and the
engineering-limitation boundary to section A; binds the NEL platform-generated,
preview X-Robots-Tag overlay, preview search-CORS, and non-permanence
interpretations to section B (rejecting NEL-as-repository-generated,
robots-as-permanent-production-rule, or CORS-as-Package-2A/2B); binds the
sixteen non-asserted controls to section C; binds the Review-boundary
statements; and rejects affirmative contradictions (guaranteed monitoring,
incident paging, SOC/SIEM, centralized log retention, response SLA, guaranteed
confidentiality, semantic-authority claim) anywhere. (4) Added deterministic
mutation fixtures that start from the approved real text: nine SECURITY.md
fixtures (guaranteed 24-hour response, guaranteed resolution time, guaranteed
confidentiality, bug-bounty/compensation offer, coordinated-disclosure
commitment, legal safe-harbor promise, universal acceptance, incorrect H1, and
a removed exclusion) and twelve SECURITY_OBSERVABILITY.md fixtures (NEL, preview
robots, and search-CORS interpretations moved out of section B; non-permanence
boundary removed; appended uptime-monitoring, incident-paging, SIEM/log-
retention, vulnerability-SLA, and confidentiality guarantees; semantic-authority
claim; a removed Review-boundary section; and a duplicated section C) — every
malformed variant is rejected. Each document also has a valid-negation fixture
proving that appended NEGATED non-assertion wording remains accepted. All prior
Package 2A tests and the existing Package 2B security.txt exact-bytes, field
order, LF/final-newline, public/_headers parsing/uniqueness, duplicate
security.txt-rule rejection, Package 2A header, and cross-file consistency tests
are retained unchanged and remain green; no test was weakened to pass.

Final validation after the correction (pinned toolchain pnpm 10.34.5, node
v22.22.2; pnpm install --frozen-lockfile): pnpm run check exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 77/77 (was 64/64 before this correction; +13 net),
verify:public-surface-map 18/18. Full deterministic total: 288 tests, 0
failures, 0 skipped. check:astro 0 errors / 0 warnings / 1 pre-existing hint;
check:ts clean; wrangler deploy --dry-run only; git diff --check clean;
pnpm-lock.yaml unchanged; package.json unchanged; nothing staged. Only
tests/security-resilience.test.ts and AGENT_WORKLOG.md changed in this
correction; SECURITY.md, SECURITY_OBSERVABILITY.md, public/.well-known/
security.txt, public/_headers, and all Package 2A runtime files are byte-for-byte
unchanged. No commit, stage, push, PR, deployment, GitHub setting, Cloudflare
setting, Email Routing, CORS, NEL, preview-robots, or mailbox action occurred.

Correction note (Codex negation-scope follow-up — same uncommitted Package 2B
entry): Codex found one remaining defect in the policy validators. The prior
affirmativeViolations applied negation at whole-clause scope — it skipped an
entire clause whenever any negation cue appeared — and clausesOf did not split
contrastive constructions, so a negated first proposition could shield an
affirmative, contradictory second proposition ("does not create a response-time
commitment, but confidentiality is guaranteed"; "does not guarantee uptime, but
it operates a SIEM"; "does not provide incident paging; however, incidents are
automatically paged"; "no bounty commitment is created, yet compensation is
offered"). Only tests/security-resilience.test.ts and this worklog entry were
changed; no policy document, security.txt, header, runtime file, dependency,
external setting, or Package 2A file changed, and the six-file Package 2B scope
is unchanged.

Correction: clausesOf now splits each sentence at contrastive conjunctions and
transitions (but, however, yet, while, although, nevertheless, except that) via
splitContrastive, so negation scope is local to the proposition that carries the
promise; each side is scored for negation independently, and a negated clause no
longer masks a following affirmative one. No general NLP dependency was added.
The two approved documents contain two benign contrastive sentences ("They
verify repository contracts, but they do not prove ...", "... accepted ... while
workers.dev preview origins are not present ...") whose non-negated side matches
no promise pattern, so both real documents still validate with zero violations.

Added deterministic contrastive mutation fixtures — four for SECURITY.md
(negated response commitment BUT guaranteed confidentiality; negated bounty YET
compensation; negated confidentiality HOWEVER coordinated disclosure; negated
response time WHILE universal acceptance) and five for SECURITY_OBSERVABILITY.md
(negated uptime BUT operates a SIEM; negated paging HOWEVER automatic paging;
negated log-retention BUT fixed retention; negated SLA YET affirmative SLA;
negated confidentiality WHILE guaranteed confidentiality) — each rejected by the
same validator used for the real document. Also added a SECURITY.md fixture that
introduces a second email address, proving the approved public contact must be
the only email (the private forwarding destination is neither encoded nor
searched for). Both valid-negation fixtures (SECURITY.md and
SECURITY_OBSERVABILITY.md) remain accepted with zero violations.

Final validation after this correction (pinned toolchain pnpm 10.34.5, node
v22.22.2; pnpm install --frozen-lockfile): pnpm run check exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 87/87 (was 77/77; +10 net), verify:public-surface-map
18/18. Full deterministic total: 298 tests, 0 failures, 0 skipped. check:astro
0 errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only; git diff --check clean; pnpm-lock.yaml unchanged; package.json
unchanged; nothing staged. SECURITY.md, SECURITY_OBSERVABILITY.md,
public/.well-known/security.txt, and public/_headers verified byte-identical to
the prior revision (cmp against the prior patch applied to a clean base). No
commit, stage, push, PR, deployment, GitHub setting, Cloudflare setting, Email
Routing, CORS, NEL, preview-robots, or mailbox action occurred.

Correction note (Codex leading-contrastive follow-up — same uncommitted Package
2B entry): Codex found that the proposition splitter handled middle-position
transitions ("A, but B") but not leading subordinate constructions ("Although A,
B" / "While A, B" / "Except that A, B"), so a negation inside the leading
subordinate proposition A could still suppress an affirmative forbidden claim in
the main proposition B. The earlier claim of complete transition coverage was
therefore incomplete. Only tests/security-resilience.test.ts and this worklog
entry were changed; no policy document, security.txt, header, runtime file,
dependency, external setting, or Package 2A file changed, and the six-file
Package 2B scope is unchanged.

Correction: added a bounded leading-subordinate parser (LEADING_SUBORDINATE,
^(?:although|while|except that)\s+([^,]+?)\s*,\s*(.+)$, case-insensitive,
whitespace/line-wrap tolerant) and a recursive splitPropositions helper.
splitPropositions first separates a leading subordinate proposition from its
main proposition at the delimiting comma (preserving both captured fragments),
then splits every fragment on the middle-position transitions (but, however,
yet, while, although, nevertheless, except that). Negation is scored per
proposition, so a leading OR middle negation no longer governs the following
main proposition. It does not globally split on commas and adds no NLP
dependency. Both approved documents still validate with zero violations (their
two benign contrastive sentences are middle-position and their non-negated side
matches no promise pattern).

Added deterministic fixtures: three leading-form SECURITY.md rejections (leading
although → guaranteed response; leading while → guaranteed confidentiality;
leading except that → compensation offered); three leading-form
SECURITY_OBSERVABILITY.md rejections (leading although → operates a SIEM;
leading while → guaranteed confidentiality; leading except that → automatic
paging); a seven-marker transition-coverage suite that DIRECTLY exercises each
claimed transition (but, however, yet, nevertheless in middle position; while,
although, except that in leading position) by pairing a negated subordinate with
an affirmative "confidentiality is guaranteed" main and asserting rejection; and
valid leading-negation fixtures for both documents whose benign main proposition
carries no forbidden commitment and which return zero violations. All prior
Package 2A and Package 2B tests — exact SECURITY.md title, required exclusions,
unsupported-commitment and universal-acceptance rejection, second-email
rejection, A/B/C/Review section uniqueness/order, section-A engineering
limitations, section-B NEL/preview-robots/CORS/non-permanence boundaries,
section-C non-asserted controls, Review-boundary authority constraints, existing
middle-position mixed mutations, valid negation, security.txt exact bytes,
public/_headers parsing, and Package 2A regression contracts — are retained
unchanged and remain green; no test was weakened.

Final validation after this correction (pinned toolchain pnpm 10.34.5, node
v22.22.2; pnpm install --frozen-lockfile): pnpm run check exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 102/102 (was 87/87; +15 net), verify:public-surface-map
18/18. Full deterministic total: 313 tests, 0 failures, 0 skipped. check:astro
0 errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only; git diff --check clean; pnpm-lock.yaml unchanged; package.json
unchanged; nothing staged. SECURITY.md, SECURITY_OBSERVABILITY.md,
public/.well-known/security.txt, and public/_headers verified byte-identical to
the prior revision (cmp against the prior patch applied to a clean base). No
commit, stage, push, PR, deployment, GitHub setting, Cloudflare setting, Email
Routing, CORS, NEL, preview-robots, or mailbox action occurred.

Correction note (Codex coordinated-claim follow-up — same uncommitted Package 2B
entry): the prior leading and middle contrastive splitting was correct as far as
it went, but affirmativeViolations still suppressed a whole fragment whenever any
negation cue appeared, so a negation in one proposition could shield a forbidden
affirmative in a later COORDINATED proposition that shared the same fragment
("No response time is guaranteed, and confidentiality is guaranteed"; "does not
guarantee uptime, and it operates a SIEM"; "No response SLA is asserted — every
report receives an SLA"). This corrects any earlier note implying the previous
splitter closed all negation-scope paths — it did not; coordinated independent
claims and colon/em-dash-joined claims still escaped. Only
tests/security-resilience.test.ts and this worklog entry were changed; no policy
document, security.txt, header, runtime file, dependency, external setting, or
Package 2A file changed, and the six-file Package 2B scope is unchanged.

Correction (bounded proposition-boundary, no NLP dependency): splitPropositions
now, in addition to leading-subordinate and middle-position contrastive
boundaries, splits each proposition at an explicit colon or em/en dash
(COLON_DASH = /\s*:\s+|\s+[—–]\s+|\s+--\s+/) and at a coordinating "and"
(COORDINATING = /,?\s+and\s+/) that joins two independent claims. Because each
coordinated or separator-delimited claim becomes its own fragment, the existing
per-fragment NEGATION_CUE test is now match-local: a negation only governs the
proposition that contains it and can no longer reach across a boundary to
suppress a later affirmative claim. Commas alone and "or" enumerations are
deliberately NOT split, so valid list-wide negation ("does not create a
response-time, resolution-time, confidentiality, compensation, bounty, or
disclosure commitment") is preserved, as are directly negated forms
("Confidentiality is not guaranteed."; "This repository does not operate a SOC
or SIEM"). The vulnerability-response-SLA affirmative pattern was broadened
(reports? receives? and optional "every") to detect the singular affirmative
"every report receives an SLA"; this only strengthens detection and does not
match any approved negated text. Both approved documents still validate with
zero violations (their only affirmative-pattern hits — "semantic authorities"
and "permanently configured" — remain within their governing negated segment).

Added deterministic coordinated-claim rejection fixtures: six for SECURITY.md
(comma+and negated response → guaranteed confidentiality; comma+and negated
bounty → compensation offered; colon negated confidentiality → coordinated
disclosure; em-dash negated safe harbor → legal safe harbor provided; plain-and
negated response → universal acceptance; semicolon+nevertheless negated
compensation → bug bounty offered) and five for SECURITY_OBSERVABILITY.md
(comma+and negated uptime → operates a SIEM; comma+and negated paging →
automatic paging; colon negated log retention → fixed retention; em-dash negated
SLA → affirmative SLA; plain-and negated confidentiality → guaranteed
confidentiality). Added valid-form fixtures that must NOT be over-rejected:
SECURITY.md list-wide negation and "Confidentiality is not guaranteed, and
reporters should avoid unnecessary sensitive data."; SECURITY_OBSERVABILITY.md
"This repository does not operate a SOC or SIEM and does not provide continuous
monitoring." and "No log-retention duration is asserted; repository checks may
still provide review evidence." — each returns zero violations. All prior
Package 2A and Package 2B tests — leading although/while/except that, middle
but/however/yet/nevertheless, exact SECURITY.md title, all exclusions,
acceptance boundary, email uniqueness, A/B/C/Review section parsing,
section-specific observability contracts, security.txt exact bytes,
public/_headers parsing, and Package 2A regression contracts — are retained
unchanged and remain green; no fixture was weakened or removed.

Final validation after this correction (pinned toolchain pnpm 10.34.5, node
v22.22.2; pnpm install --frozen-lockfile): pnpm run check exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 115/115 (was 102/102; +13 net), verify:public-surface-map
18/18. Full deterministic total: 326 tests, 0 failures, 0 skipped. check:astro
0 errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only; git diff --check clean; pnpm-lock.yaml unchanged; package.json
unchanged; nothing staged. SECURITY.md, SECURITY_OBSERVABILITY.md,
public/.well-known/security.txt, and public/_headers verified byte-identical to
the prior revision (cmp against the prior patch applied to a clean base). No
commit, stage, push, PR, deployment, GitHub setting, Cloudflare setting, Email
Routing, CORS, NEL, preview-robots, or mailbox action occurred.

Correction note (Codex Unicode-dash follow-up — same uncommitted Package 2B
entry): Codex found that the coordinated-claim proposition boundary recognized
Unicode em/en dashes only when surrounded by whitespace (COLON_DASH used
\s+[—–]\s+), so an UNSPACED dash ("No safe-harbor commitment exists—legal safe
harbor is provided.") kept the negated and affirmative propositions in one
fragment and the whole-fragment negation suppressed the affirmative. This
corrects the earlier worklog description that implied em/en-dash coverage was
complete: only spaced dashes were covered. Only tests/security-resilience.test.ts
and this worklog entry were changed; no policy document, security.txt, header,
runtime file, dependency, external setting, or Package 2A file changed, and the
six-file Package 2B scope is unchanged.

Correction (bounded, no dependency): COLON_DASH now matches an em/en dash
whether or not whitespace surrounds it (\s*[—–]\s*), so "A—B", "A — B", "A–B",
and "A – B" all split into independent propositions; colon (colon + following
space) and spaced double-hyphen handling are retained. ASCII "-" is deliberately
NOT in the dash class and ":" requires a following space, so ordinary hyphenated
tokens (safe-harbor, response-time, resolution-time, public-surface-map,
security-resilience, no-cache, max-age, workers.dev-related), the public contact
security@metawritingecology.org, the ISO expiry 2027-06-30T23:59:59Z, and the
Canonical URL https://metawritingecology.org/.well-known/security.txt are never
split — proven by a dedicated parser test asserting each token survives intact
in a single clause. The approved documents contain no em/en dash, so both real
documents still validate with zero violations.

Added deterministic unspaced-dash rejection fixtures: three for SECURITY.md
(em-dash negated safe harbor → legal safe harbor provided; en-dash negated
confidentiality → guaranteed confidentiality; em-dash negated bounty →
compensation offered) and three for SECURITY_OBSERVABILITY.md (em-dash negated
SLA → affirmative SLA; en-dash negated log retention → fixed retention; em-dash
negated monitoring → operates a SIEM). Added valid unspaced-dash fixtures whose
benign main proposition returns zero violations (SECURITY.md: "Confidentiality
is not guaranteed—reporters should avoid unnecessary sensitive data." and "No
response time is guaranteed–reports may still be submitted by email.";
SECURITY_OBSERVABILITY.md: "Continuous monitoring is not asserted—repository
checks may provide review evidence."). All existing spaced-dash, colon,
semicolon, comma+and, plain-and, leading although/while/except-that, and middle
but/however/yet/nevertheless fixtures, the seven-marker transition suite, and
every prior Package 2A and Package 2B contract test are retained unchanged and
remain green; no fixture was weakened or removed.

Final validation after this correction (pinned toolchain pnpm 10.34.5, node
v22.22.2; pnpm install --frozen-lockfile): pnpm run check exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 124/124 (was 115/115; +9 net), verify:public-surface-map
18/18. Full deterministic total: 335 tests, 0 failures, 0 skipped. check:astro
0 errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only; git diff --check clean; pnpm-lock.yaml unchanged; package.json
unchanged; nothing staged. SECURITY.md, SECURITY_OBSERVABILITY.md,
public/.well-known/security.txt, and public/_headers verified byte-identical to
the prior revision (cmp against the prior patch applied to a clean base). No
commit, stage, push, PR, deployment, GitHub setting, Cloudflare setting, Email
Routing, CORS, NEL, preview-robots, or mailbox action occurred.

### 2026-07-22 — Claude Code — package-c-indexing-discovery-contracts

Package C — Indexing and Discovery Contracts. Made the existing public route,
sitemap, robots, canonical, lastmod, feed, and link behavior explicit,
deterministic, and testable. Bounded website route-engineering only; no
typed public-page metadata, no JSON-LD migration, no language-metadata change,
and not a second MWE Registry. Nothing added here is an MWE authority: the
helper, verifier, and tests generate engineering validation results only and
make no naming, classification, public/private, relation, OSF, or publication
judgment.

Base SHA: facbf32f21a6b86a672bba4fb5477293ac299738 (origin/main, verified before
implementation). Branch: claude/package-c-indexing-discovery-contracts. Isolated
worktree: /home/user/mwe-site-package-c-indexing-discovery-contracts.

Fixed user decisions (final for Package C):
- Prototype /language-pressure-test-lab-prototype/: retains noindex,nofollow;
  excluded from sitemap; no canonical; excluded from feed; no nav prominence;
  page content unchanged. Source file not modified (direct inspection confirmed
  it already matches the approved contract).
- Interactive preview /public-surface-map/interactive/: retains noindex,nofollow;
  excluded from sitemap; retains its existing self-canonical; excluded from
  feed; bounded public-preview role preserved; page content unchanged. Source
  file not modified (direct inspection confirmed the contract).
- RSS/Atom: no RSS endpoint, no Atom endpoint, no feed-discovery markup, no feed
  eligibility model. The unused @astrojs/rss dependency was removed; no
  replacement feed package was added.
- Sitemap lastmod: derived only from the latest Git commit affecting each
  route's own direct source file; omitted when usable Git history is
  unavailable.
- Link validation: deterministic CI contracts only; external network
  availability is excluded from required CI.

Explicit sitemap exclusion contract (exact normalized-path matching, never
broad substring matching): the prototype route, the interactive preview route,
the unmatched-route representation (/404/), JSON endpoints (manifest + snapshot),
robots.txt, llms.txt, security.txt, generated sitemap files, any RSS/Atom
endpoint (which must not exist), assets, and any route whose approved robots
contract is noindex. A similarly named future route is never excluded by
accident (proven by mutation fixture).

Direct-source Git lastmod model: readDirectSourceLastmod runs
`git log -1 --format=%cI -- <direct source>` and returns that ISO 8601 committer
time, reflecting only the route's own source file (.astro/.md/.mdx, nested
index, fiction child, and /zh/ Chinese routes supported). Shared layouts,
components, styles, data, tests, package files, CI files, and unrelated commits
are intentionally excluded from lastmod propagation (proven by isolated
temporary-repository tests). When Git is unavailable, the source is untracked,
history is unreachable, or a shallow checkout lacks the commit, the timestamp is
omitted and no `<lastmod>` is emitted. The filesystem-mtime fallback that the
prior astro.config.mjs used was removed; a dedicated untracked-file test asserts
undefined (not the file's mtime) so any reintroduced mtime fallback fails closed.

Deterministic internal link and syntax contracts (no network): internal route
existence + normalization across Markdown/MDX/Astro pages, layouts, the search
modal navigation data, public/llms.txt, and public/robots.txt; internal asset
existence; fragment/anchor existence where stable heading slugs apply; DOI
structure (syntax only, no network, no authority); GitHub repository/file link
syntax against a bounded allowlist with HTTPS + stable-ref policy (feature-branch
and commit-preview URLs rejected); and forbidden-origin detection (localhost,
127.0.0.1, workers.dev, pages.dev preview, staging, deploy-preview) that is
context-aware and does not flag prose merely naming a platform.

External availability is excluded from required CI: no check performs a DOI,
GitHub, or other network request. .github/workflows/* were not modified; the new
scripts run through the existing `pnpm run check` path.

Exact file scope. New files:
- scripts/lib/indexing-discovery-contract.mjs (bounded helper + shared validators)
- scripts/verify-indexing-discovery-build.mjs (post-build verifier)
- tests/indexing-discovery.test.ts (source-level + mutation tests)
Modified files:
- astro.config.mjs (consumes the helper; mtime fallback removed)
- package.json (removed @astrojs/rss; added test:indexing-discovery and
  verify:indexing-discovery-build; both wired into `pnpm run check`)
- pnpm-lock.yaml (mechanical @astrojs/rss removal only: 66 deletions, its entry
  plus now-orphaned transitive deps fast-xml-parser and fast-xml-builder; no
  other version change)
- AGENT_WORKLOG.md (this entry)
No page content, BaseLayout, SchemaJsonLd, robots.txt, llms.txt, _headers,
security.txt, SECURITY*.md, public-surface manifest/snapshot data, workflow,
wrangler.json, or Package A/B/D/E file was changed.

Validation (pinned toolchain pnpm 10.34.5, node v22.22.2; pnpm install
--frozen-lockfile passes both before and after the lockfile change). `pnpm run
check` exit 0. Suite totals — test:contracts 48/48, test:runtime 55/55,
test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124,
test:indexing-discovery 47/47 (new). Deterministic total: 382 tests, 0 failures,
0 skipped (baseline was 335; +47 net, all from the new Package C suite; no
existing test weakened or removed). verify:public-surface-map 18/18 (Package
A/B regression intact). verify:indexing-discovery-build 93/93 against a fresh
build (40 sitemap URLs, all production-origin, normalized, unique, eligible,
each mapping to a real page source; 40 optional lastmods valid ISO 8601; no feed
output; interactive preview self-canonical + noindex + excluded confirmed).
check:astro 0 errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler
deploy --dry-run only (no deployment). Two clean builds from identical source
produced byte-identical sitemap-index.xml, sitemap-0.xml, and verifier output.
git diff --check clean; nothing staged; no unauthorized tracked or untracked
file. No GitHub, Cloudflare, Email Routing, CORS, NEL, mailbox, deployment,
content, metadata-architecture, JSON-LD, language, security-policy, or
public-boundary change occurred. No Package D or Package E work was started.

Correction (Codex fail-closed hardening follow-up — same uncommitted Package C
change, base facbf32f21a6b86a672bba4fb5477293ac299738, no commit): Codex found
the first-pass output was correct (40 routes, correct exclusions, Git-only
lastmod, no feed, @astrojs/rss removed) but that completeness and several
fail-closed paths were under-verified. This correction touches only five files
relative to the first-pass revision — AGENT_WORKLOG.md, astro.config.mjs,
scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
package.json and pnpm-lock.yaml are byte-identical to the first-pass revision:
@astrojs/rss stays removed, the indexing-discovery scripts stay wired into
`pnpm run check`, and no dependency or version changed.

Corrections to earlier overstatement: the first-pass verifier validated only
the URLs that were present; it did not prove every eligible page was present, so
"each sitemap URL maps to a real page source" did not by itself guarantee
sitemap completeness. Forbidden-origin and internal-link coverage in the
first pass used selective file lists, not one complete functional inventory,
and the resolver selected the first matching source form rather than failing
closed on ambiguity. Those gaps are now closed:

- Expected sitemap membership is independently derived (buildExpectedRouteSet in
  the verifier) from actual page sources (recursive .astro/.md/.mdx enumeration,
  JSON/data endpoint modules excluded) and their actual robots contracts
  (literal <meta name="robots">, literal BaseLayout robots="…" prop, literal
  Markdown/MDX frontmatter robots); it does not consult isSitemapEligible,
  SITEMAP_EXCLUDED_PATHS, or the generated sitemap. Ambiguous or dynamic robots
  declarations fail closed with an actionable finding rather than defaulting to
  indexable. The independently-derived expected set and the generated <loc> set
  are compared exactly (missing / unexpected / duplicate reported separately);
  the current tree yields exactly 40 on both sides.
- Raw page-loc and child-sitemap-loc spelling is validated BEFORE URL
  normalization (rawSitemapLocViolations / rawChildLocViolations), rejecting
  userinfo, explicit port, query, fragment, backslash, encoded slash/backslash,
  encoded or literal dot-traversal, duplicate slashes, non-production origin,
  and any non-exact serialized spelling; child files must resolve beneath dist
  and be unique.
- Route-source resolution is traversal-safe and ambiguity-fatal
  (assertSafeRoutePath + resolveRouteSource): unsafe input throws a stable
  RouteResolutionError code, a candidate escaping src/pages throws, and two
  matching source forms throw ROUTE_AMBIGUOUS_SOURCE instead of selecting the
  first. astro.config.mjs no longer swallows resolver contract errors — Git
  absence / unreachable history still omits lastmod, but an unsafe or ambiguous
  route fails the build. No mtime or other timestamp fallback exists.
- Generated dist paths are normalized platform-independently (distRelativeRoute
  handles both `/` and `\`), so prototype and interactive generated-route checks
  run on POSIX and Windows path forms without being silently skipped.
- The functional URL inventory now spans src/pages, src/layouts, src/components,
  src/data, public/llms.txt, and public/robots.txt, extracting Markdown
  links/images, literal href/src, literal object properties (href/src/url/route/
  path), route-map tuples, and production/GitHub/DOI autolinks. DOI (48) and
  GitHub (72) coverage now derives from that complete inventory rather than a
  hand-picked file subset; all validate. DOI validation additionally rejects
  query/fragment/userinfo/port/malformed-registrant/missing-suffix/control
  characters. GitHub validation now ACCEPTS a full 40-hex immutable commit SHA in
  an approved blob/tree source URL (an immutable source reference, not a
  commit-preview), while still rejecting mutable feature branches, off-allowlist
  repositories, non-HTTPS, userinfo, and traversal source paths.
- Feed absence is now checked by content/MIME signature (findFeedSignatures) in
  addition to filename: @astrojs/rss imports, application/rss+xml,
  application/atom+xml, RSS root markup, the Atom namespace, and feed-discovery
  link markup are detected in source and in generated output regardless of
  filename (a neutral-name RSS document such as /updates.xml is rejected), while
  ordinary non-feed XML is not flagged.

The verifier is now a callable function (verifyIndexingDiscoveryBuild) with the
CLI unchanged, so isolated fixtures exercise the real verifier. Mutation fixtures
run through the same production helper/verifier paths and reject: missing
eligible route, noindex source still in sitemap, unexpected route, duplicate
route, query/fragment/encoded-traversal/encoded-separator/userinfo/explicit-port
page locs, malformed and duplicate child locs, unsafe and encoded route-source
traversal, ambiguous route-source candidates, Windows path regression, route-map
missing route, missing src asset, forbidden preview origin in functional source,
malformed DOI query/fragment, malformed and feature-branch GitHub URLs, and a
neutral-name RSS document.

Correction validation (pnpm 10.34.5, node v22.22.2; pnpm install
--frozen-lockfile passes): `pnpm run check` exit 0. Suite totals — test:contracts
48/48, test:runtime 55/55, test:retention 16/16, test:orchestration 29/29,
test:workflow 42/42, test:semantic-flow 21/21, test:security-resilience 124/124,
test:indexing-discovery 58/58 (was 47/47; +11 net, all in the Package C suite).
Deterministic total: 393 tests, 0 failures, 0 skipped. verify:public-surface-map
18/18 (Package A/B regression intact). verify:indexing-discovery-build 187/187
against a fresh build (40 routes; independent expected set equals generated set).
check:astro 0 errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler
deploy --dry-run only. Two clean builds produced byte-identical sitemap-index.xml,
sitemap-0.xml, and verifier output. git diff --check clean; nothing staged;
complete Package C scope remains exactly seven files; protected src, layout,
component, robots.txt, llms.txt, _headers, security.txt, SECURITY*.md, workflow,
wrangler.json, and public-surface data files are byte-identical to base. No
content, metadata-architecture, JSON-LD, language, security-policy, GitHub,
Cloudflare, Email Routing, CORS, NEL, mailbox, deployment, Package D, or
Package E change occurred; Package C remains uncommitted.

Correction (Codex robots/GitHub/inventory follow-up — same uncommitted Package C
change, base facbf32f21a6b86a672bba4fb5477293ac299738, no commit): a further
review found several remaining fail-closed gaps. This correction touches only
four files relative to the prior revision — AGENT_WORKLOG.md,
scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
astro.config.mjs, package.json, and pnpm-lock.yaml are byte-identical to the
prior revision (@astrojs/rss stays removed; scripts stay wired into check; no
dependency/version change).

Corrections and corrected overstatements:

- Robots meta parsing was NOT order-independent before this correction: it
  assumed name="robots" immediately preceded content="…". classifyRobots now
  parses each <meta> tag as a bounded attribute SET, so attribute order and
  harmless intervening attributes (class, data-*) do not matter; name=robots is
  matched case-insensitively; literal content is identified independently;
  single- and double-quoted literal values are supported. name=robots with no
  literal content is ROBOTS_MALFORMED (fail closed); dynamic name or dynamic
  content is ROBOTS_DYNAMIC (fail closed); conflicting reordered declarations
  are ROBOTS_AMBIGUOUS (fail closed); duplicate identical declarations remain a
  single value. An unrelated meta tag's content is never treated as robots
  content. Frontmatter robots is now recognized with both LF and CRLF line
  endings. noindex sources (in any of these forms) remain absent from the
  independently-derived expected sitemap set.

- Not every malformed GitHub file path was rejected before this correction: a
  bare blob/<ref> with no source path was accepted. isValidGithubSourceUrl now
  requires a blob/tree SOURCE link to carry at least one non-empty, safe
  source-path segment after the ref, and rejects empty path, . or .. segments,
  encoded traversal/separator, literal backslash, duplicate slash, and any
  query or fragment. `main` and full 40-hex immutable-commit blob/tree URLs
  WITH an actual path remain accepted; feature branches, off-allowlist repos,
  non-HTTPS, and userinfo remain rejected. A bare repository-at-ref value
  (owner root, repo root, or blob/tree at a stable ref / immutable SHA with no
  path) is recognized by a new isGithubRepoAtRefBase predicate: this is the
  form of the diagnosticEntries `sourceRepoBase` concatenation prefix, so the
  inventory scan recognizes it as a valid base rather than flagging it. Real
  functional GitHub inventory: 72 references = 71 valid source URLs + 1
  repository-at-ref base, 0 unrecognized.

- Forbidden-origin validation did NOT previously run end-to-end over the whole
  functional inventory. A single validateInventory pass now applies internal
  route/asset validation to same-site destinations AND forbidden-origin
  validation (localhost, 127.0.0.1, workers.dev, pages.dev, preview, staging,
  deploy-preview, feature-branch public origins) to external destinations,
  across Markdown links/images, literal href/src, object properties, route-map
  tuples (now including absolute-URL tuple elements), and absolute public URLs
  in navigation/data files. Explanatory prose that merely names such a domain
  without forming a functional URL is never extracted and never flagged. The
  real inventory has zero forbidden functional origins.

- Windows resolver tests previously used POSIX-only endsWith("/…") comparisons;
  they now normalize the native path (or use path-aware comparison) before
  asserting, so they pass on POSIX and Windows. Explicit Windows-shaped
  distRelativeRoute assertions (including prototype/interactive routes) and the
  ambiguity/traversal assertions are retained.

- Child-sitemap containment previously used a string-prefix (startsWith) check,
  which a sibling directory sharing a prefix (dist vs dist2) could defeat. It
  now uses a path.relative-based isWithinDir that rejects an empty relative
  result, an absolute result, or any `..` traversal segment, on POSIX and
  Windows. The strict child basename contract is preserved.

- Fragment-validation boundary stated precisely: the real repository inventory
  contains ZERO internal functional fragment references (measured via
  collectFunctionalFragments over the complete inventory), so
  repository-integrated fragment validation is NOT exercised; the fragment
  validator is exercised only against synthetic fixtures, with a future guard
  that a deterministically checkable fragment introduced later must validate
  against the target route's stable heading anchors. Earlier wording implying
  repository-wide fragment coverage is corrected accordingly.

All current 40 sitemap routes are unchanged; expected 40 == generated 40;
missing 0, unexpected 0, duplicate 0.

Correction validation (pnpm 10.34.5, node v22.22.2; frozen install passes):
`pnpm run check` exit 0. Suite totals — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124 (Package A + B
regression intact), test:indexing-discovery 67/67 (was 58/58; +9).
Deterministic total: 402 tests, 0 failures, 0 skipped. verify:public-surface-map
18/18. verify:indexing-discovery-build 187/187 against a fresh build (expected
== generated == 40). Direct-source Git lastmod: this worktree has full history,
so all 40 optional lastmods are present and valid ISO 8601; under a
shallow/Gitless checkout the same routes would simply omit <lastmod> (no mtime
fallback). check:astro 0 errors / 0 warnings / 1 pre-existing hint; check:ts
clean; wrangler deploy --dry-run only. Two fresh clean builds produced
byte-identical sitemap-index.xml, sitemap-0.xml, and verifier output. git diff
--check clean; nothing staged; complete Package C scope remains exactly seven
files; astro.config.mjs, package.json, and pnpm-lock.yaml are byte-identical to
the prior revision; all protected src/public-boundary files are byte-identical
to base. No content, metadata-architecture, JSON-LD, language, security-policy,
GitHub, Cloudflare, Email Routing, CORS, NEL, mailbox, deployment, Package D, or
Package E change occurred; Package C remains uncommitted.

Correction (Codex duplicate-attribute + occurrence-context follow-up — same
uncommitted Package C change, base facbf32f21a6b86a672bba4fb5477293ac299738, no
commit): a further review demonstrated two remaining fail-closed defects. This
correction touches only four files relative to the prior revision —
AGENT_WORKLOG.md, scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
astro.config.mjs, package.json, and pnpm-lock.yaml are byte-identical to the
prior revision.

Defect 1 — duplicate robots attributes were silently reduced to the first
value. parseMetaAttributes previously kept only the first occurrence of each
attribute (`if (!attrs.has(name)) attrs.set(...)`), so a tag such as
`<meta name="robots" content="index" content="noindex">` was treated as safely
indexable. The earlier worklog wording calling the attribute map a fail-closed
"set" was inaccurate. parseMetaAttributes now returns bounded structured
evidence { attributes, occurrences, duplicateAttributes } preserving EVERY
attribute occurrence (names compared case-insensitively). classifyRobots now
fails closed (ROBOTS_MALFORMED) when a robots-relevant tag has a duplicate
`name` or duplicate `content` attribute — even when the duplicated values are
identical — and never selects a first or last value, never merges, and never
silently treats such a tag as non-robots or indexable. A meta tag whose name is
"description" is still not a robots declaration even when its content contains
"noindex". Valid behavior retained: name/content in any order, harmless
attributes before/between/after, single- and double-quoted literals,
case-insensitive names, duplicate IDENTICAL robots declarations across separate
valid meta tags, CRLF and LF frontmatter; dynamic name, dynamic content, missing
content, and conflicting separate declarations still fail closed.

Defect 2 — the repository-at-ref exception lost occurrence context and accepted
any bare blob/main string. The prior isGithubRepoAtRefBase accepted a bare
`.../blob/main` by URL string alone, in any context, and the functional
inventory deduplicated occurrences to unique URL strings before validation. The
earlier "71 source/root + 1 base" wording described the base as a valid
standalone source URL and conflated occurrence and unique-value counts.
extractFunctionalUrls now preserves occurrence records (value, kind, line, and,
for declarations, identifier) and does NOT deduplicate to unique values before
validation; it adds a literal variable-declaration kind (`const id = "url"`) and
range-claims structured occurrences so a declaration's URL is not re-emitted as
a standalone autolink. isGithubRepoAtRefBase is removed from the generic
destination-acceptance path and replaced by isApprovedSourceRepoBaseDeclaration:
the bare base is accepted ONLY as the exact literal declaration named
`sourceRepoBase`, in exactly src/data/diagnosticEntries.ts, whose value equals
the approved base exactly, and only when it is not itself a rendered
destination. classifyGithubOccurrence returns base-declaration only for that
exact declaration, source for a valid source/root URL, and invalid otherwise;
validateInventory applies it to every GitHub occurrence, so a bare blob/main
fails in every destination context (Markdown, autolink, href, src, navigation
url/href property, route-map tuple, standalone). Composed
`${sourceRepoBase}/<file>.md` URLs are dynamic (not statically extracted); the
composition is validated to produce a valid source URL, while a composed empty
path, traversal, or encoded separator is rejected. Repository allowlist
unchanged.

Actual GitHub inventory counts (this revision): 201 total functional GitHub
occurrences = 200 source occurrences + 1 base-declaration occurrence
(src/data/diagnosticEntries.ts line 19, identifier sourceRepoBase), 0 invalid,
0 unrecognized; 71 unique validated source/root URL values. The base declaration
is not a valid standalone source URL — it is accepted only as the bounded
declaration. Composed diagnostic-entry file URLs remain accepted. DOI inventory:
48, all valid.

All current 40 sitemap routes unchanged; expected 40 == generated 40; missing 0,
unexpected 0, duplicate 0. Forbidden-origin validation still runs end-to-end over
the complete occurrence inventory; feed content/MIME checks, path.relative child
containment, route-source traversal/ambiguity protection, Windows path handling,
raw page/child loc checks, and direct-source Git-only lastmod are all retained.
Real functional fragment count remains 0 (repository-integrated fragment
validation not exercised; validator exercised synthetically only).

Correction validation (pnpm 10.34.5, node v22.22.2; frozen install passes):
`pnpm run check` exit 0. Suite totals — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124 (Package A + B
regression intact), test:indexing-discovery 74/74 (was 67/67; +7). Deterministic
total: 409 tests, 0 failures, 0 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 187/187 against a fresh build (expected ==
generated == 40). Direct-source Git lastmod: this worktree has full history, so
all 40 optional lastmods are present and valid ISO 8601; under a shallow/Gitless
checkout the same routes would omit <lastmod> (no mtime fallback). check:astro 0
errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only. Two fresh clean builds produced byte-identical sitemap-index.xml,
sitemap-0.xml, and verifier output. git diff --check clean; nothing staged;
complete Package C scope remains exactly seven files; astro.config.mjs,
package.json, and pnpm-lock.yaml byte-identical to the prior revision; all
protected src/public-boundary files byte-identical to base. No content,
metadata-architecture, JSON-LD, language, security-policy, GitHub, Cloudflare,
Email Routing, CORS, NEL, mailbox, deployment, Package D, or Package E change
occurred; Package C remains uncommitted.

Correction (Codex sourceRepoBase template-composition follow-up — same
uncommitted Package C change, base facbf32f21a6b86a672bba4fb5477293ac299738, no
commit): a further review demonstrated that ${sourceRepoBase} template-literal
destinations (`href: `${sourceRepoBase}/<file>.md``) were outside the functional
inventory — the extractor ignored interpolated template literals, so the 15
real composed diagnostic-entry destinations were never extracted or validated,
and prior "composed URL" coverage was demonstrated only by manually resolving
strings and calling isValidGithubSourceUrl (not via extraction + inventory).
This correction touches only three files relative to the prior revision —
AGENT_WORKLOG.md, scripts/lib/indexing-discovery-contract.mjs,
tests/indexing-discovery.test.ts. scripts/verify-indexing-discovery-build.mjs is
byte-identical to the prior revision (no production reporting there consumes the
composition inventory), as are astro.config.mjs, package.json, and
pnpm-lock.yaml.

A bounded ${sourceRepoBase} template extractor was added to
extractFunctionalUrls: it recognizes ONLY the exact single-interpolation form
`${sourceRepoBase}<literal suffix>` with an empty static prefix, in a
destination property (href/src/url), and emits a
`github-template-composition` occurrence preserving value, rawValue, raw suffix,
file, line, property, and identifier. It evaluates no expression; an additional
interpolation inside the suffix (e.g. `${sourceRepoBase}/${filename}`) is kept,
not silently dropped, and fails closed at validation (SUFFIX_DYNAMIC). The
occurrence range is claimed so a composition is not re-emitted as an autolink,
literal URL, declaration, or property literal, and it is not deduplicated before
validation.

The raw literal suffix is validated by validateRepoBaseSuffix BEFORE any URL is
constructed, rejecting empty, slash-only, no-leading-slash, `.`/`..` segments,
encoded dot/slash/backslash, literal backslash, duplicate slash, query,
fragment, userinfo-like `@`, control/NUL characters, malformed percent-encoding,
and any additional interpolation. Composition binding is bounded to the exact
approved declaration by a same-file check: a composition resolves only when its
own file contains the exact approved sourceRepoBase declaration
(src/data/diagnosticEntries.ts, identifier sourceRepoBase, approved value) and
that file has no conflicting/duplicate sourceRepoBase declaration. After suffix
validation the resolved APPROVED_SOURCE_REPO_BASE + suffix is passed through the
ordinary isValidGithubSourceUrl (no separate weaker validator). The full
production path is exercised by the tests: source text -> extractFunctionalUrls
-> composition occurrence -> approved-declaration association -> raw suffix
validation -> resolved URL -> classifyGithubOccurrence -> validateInventory.

All 15 current compositions and their 9 distinct literal suffixes are extracted
and validate (0 invalid, 0 unrecognized). End-to-end mutations (via extraction +
validateInventory) reject: empty, slash-only, traversal, encoded-dot,
encoded-slash, encoded-backslash, query, fragment, and dynamic-suffix forms; a
valid-looking composition with a missing declaration, a declaration in an
unapproved file, a wrong declaration value, or conflicting duplicate
declarations; and the bare base used directly as a destination. src.data was not
modified.

Actual GitHub-related occurrence accounting (this revision, separate categories):
literal GitHub source occurrences 200; unique literal source/root values 71;
approved base-declaration occurrences 1; bounded template-composition occurrences
15 (9 distinct suffixes); invalid 0; unrecognized 0; total GitHub-related
occurrences 216. The base declaration is not counted as a standalone source URL,
and a composition is not counted as a literal occurrence. DOI inventory: 48, all
valid. Functional-fragment count: 0.

All current 40 sitemap routes unchanged; expected 40 == generated 40; missing 0,
unexpected 0, duplicate 0. Forbidden-origin validation still runs end-to-end over
the complete occurrence inventory (real: 0; mutations reject); feed content/MIME
checks, path.relative child containment, route-source traversal/ambiguity
protection, Windows path handling, raw page/child loc checks, duplicate
robots-attribute fail-closed classification, and direct-source Git-only lastmod
are all retained.

Correction validation (pnpm 10.34.5, node v22.22.2; frozen install passes):
`pnpm run check` exit 0. Suite totals — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124 (Package A + B
regression intact), test:indexing-discovery 81/81 (was 74/74; +7). Deterministic
total: 416 tests, 0 failures, 0 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 187/187 against a fresh build (expected ==
generated == 40). Direct-source Git lastmod: this worktree has full history, so
all 40 optional lastmods are present and valid ISO 8601; under a shallow/Gitless
checkout the same routes would omit <lastmod> (no mtime fallback). check:astro 0
errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only. Two fresh clean builds produced byte-identical sitemap-index.xml,
sitemap-0.xml, and verifier output. git diff --check clean; nothing staged;
complete Package C scope remains exactly seven files; astro.config.mjs,
package.json, pnpm-lock.yaml, and scripts/verify-indexing-discovery-build.mjs
byte-identical to the prior revision; all protected src/public-boundary files
byte-identical to base. No content, metadata-architecture, JSON-LD, language,
security-policy, GitHub, Cloudflare, Email Routing, CORS, NEL, mailbox,
deployment, Package D, or Package E change occurred; Package C remains
uncommitted.

Correction (Codex sourceRepoBase declaration-uniqueness follow-up — same
uncommitted Package C change, base facbf32f21a6b86a672bba4fb5477293ac299738, no
commit): a further review demonstrated that the composition-binding uniqueness
check counted DISTINCT declared VALUES (a Set) rather than declaration
OCCURRENCES, so two identical `const sourceRepoBase = "<approved>"` declarations
collapsed to a single value and were wrongly treated as an unambiguous approved
base. Additionally, a dynamic or template-literal redeclaration of sourceRepoBase
was invisible to the binding because the extractor only recorded quoted-URL
declarations. This correction touches only three files relative to the prior
revision — AGENT_WORKLOG.md, scripts/lib/indexing-discovery-contract.mjs,
tests/indexing-discovery.test.ts. astro.config.mjs, package.json, pnpm-lock.yaml,
and scripts/verify-indexing-discovery-build.mjs are byte-identical to the prior
revision.

The bounded extractor now records EVERY sourceRepoBase declaration as
occurrence-level evidence: a literal http(s)-URL declaration remains a
`declaration` occurrence (with value), and any non-URL / template / dynamic
initializer of the exact identifier sourceRepoBase (const/let/var) is emitted as
a `github-base-declaration-evidence` occurrence classified template or dynamic —
so an unsupported or dynamic redeclaration stays VISIBLE as ambiguous evidence
rather than being silently omitted. No JavaScript is evaluated and no symbol
resolver is used; it is a narrowly bounded scanner for the exact identifier.

The binding (approvedBaseDeclarationFiles) now depends on declaration OCCURRENCE
COUNT, not distinct value count. A file binds sourceRepoBase compositions only
when it is exactly src/data/diagnosticEntries.ts AND contains EXACTLY ONE
sourceRepoBase declaration occurrence (literal + evidence combined) AND that
single occurrence is the approved literal declaration. Verified fail-closed
through the real extraction + validateInventory path: zero declarations; two
identical approved declarations; approved + different literal; approved +
dynamic; approved + template; approved const + let; approved const + var; and a
lone dynamic declaration all yield GITHUB_INVALID_COMPOSITION /
NO_APPROVED_DECLARATION. Exactly one approved literal declaration still binds.
The exact duplicate case
`const sourceRepoBase = "<approved>"; const sourceRepoBase = "<approved>"; const
x = { href: `${sourceRepoBase}/valid.md` };` fails closed and records two
literal declaration occurrences (not collapsed by a Set).

The fixed template-composition contract is unchanged: exact
`${sourceRepoBase}<literal suffix>` extraction in href/src/url, raw suffix
validation before URL construction, additional-interpolation fail-closed,
ordinary GitHub source validator after composition, no double extraction. Real
src/data/diagnosticEntries.ts retains 1 approved declaration occurrence, 0
ambiguous declaration evidence, 15 valid template compositions, 9 distinct
suffixes, 0 invalid, 0 unrecognized.

Actual GitHub-related accounting (this revision, separate categories):
declaration occurrences 1; approved declarations 1; ambiguous declaration
evidence 0; literal GitHub source occurrences 200; unique literal source/root
values 71; valid template-composition occurrences 15 (9 distinct suffixes);
invalid composition occurrences 0; unrecognized occurrences 0; total
GitHub-related occurrences 216. DOI inventory 48 (all valid). Functional-fragment
count 0.

All current 40 sitemap routes unchanged; expected 40 == generated 40; missing 0,
unexpected 0, duplicate 0. Duplicate robots-attribute fail-closed classification,
raw sitemap URL validation, route-source traversal/ambiguity failure, Windows
path handling, end-to-end forbidden-origin validation, feed content/MIME checks,
and direct-source Git-only lastmod are all retained.

Correction validation (pnpm 10.34.5, node v22.22.2; frozen install passes):
`pnpm run check` exit 0. Suite totals — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124 (Package A + B
regression intact), test:indexing-discovery 89/89 (was 81/81; +8). Deterministic
total: 424 tests, 0 failures, 0 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 187/187 against a fresh build (expected ==
generated == 40). Direct-source Git lastmod: this worktree has full history, so
all 40 optional lastmods are present and valid ISO 8601; under a shallow/Gitless
checkout the same routes would omit <lastmod> (no mtime fallback). check:astro 0
errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only. Two fresh clean builds produced byte-identical sitemap-index.xml,
sitemap-0.xml, verifier output, and GitHub declaration/composition accounting.
git diff --check clean; nothing staged; complete Package C scope remains exactly
seven files; astro.config.mjs, package.json, pnpm-lock.yaml, and
scripts/verify-indexing-discovery-build.mjs byte-identical to the prior revision;
all protected src/public-boundary files byte-identical to base. No content,
metadata-architecture, JSON-LD, language, security-policy, GitHub, Cloudflare,
Email Routing, CORS, NEL, mailbox, deployment, Package D, or Package E change
occurred; Package C remains uncommitted.

Correction (Codex occurrence-identity follow-up — same uncommitted Package C
change, base facbf32f21a6b86a672bba4fb5477293ac299738, no commit): a further
review demonstrated that extractFunctionalUrls deduplicated occurrences by
line/value/identifier keys, so two IDENTICAL declarations on the SAME LINE
(`const sourceRepoBase = "<approved>"; const sourceRepoBase = "<approved>";`)
collapsed to a single occurrence and the composition was wrongly allowed. This
correction touches only three files relative to the prior revision —
AGENT_WORKLOG.md, scripts/lib/indexing-discovery-contract.mjs,
tests/indexing-discovery.test.ts. astro.config.mjs, package.json, pnpm-lock.yaml,
and scripts/verify-indexing-discovery-build.mjs are byte-identical to the prior
revision.

Occurrence identity is now the SOURCE OFFSET, not line/value: the structured
literal `add` key is `${kind}@${offset}`, the github-template-composition key is
`github-template-composition@${tm.index}`, and the
github-base-declaration-evidence key is
`github-base-declaration-evidence@${em.index}`; each occurrence also carries its
`offset`. Two distinct source occurrences — even identical text on the same line,
with the same value, identifier, property, or initializer shape — are recorded as
two occurrences; only the exact same offset (one regex match) dedupes. Claimed
ranges still prevent the same textual occurrence from being emitted by multiple
overlapping extractors (an autolink inside a structured occurrence is not
re-emitted).

Verified through the real extraction + declaration-evidence +
approvedBaseDeclarationFiles + validateInventory path: two identical approved
declarations on one line are recorded as two occurrences and fail closed
(NO_APPROVED_DECLARATION); same-line approved literal + dynamic redeclaration and
approved literal + template redeclaration fail closed with the redeclaration
recorded as ambiguous evidence; two identical declarations on separate lines fail
closed as two occurrences; exactly one approved declaration still binds; and two
genuinely separate same-line template-composition destinations remain two
occurrence records while a single composition remains exactly one (no double
extraction). Real src/data/diagnosticEntries.ts is unchanged: 1 approved
declaration occurrence, 0 ambiguous declaration evidence, 15 valid compositions,
9 distinct suffixes, 0 invalid, 0 unrecognized. GitHub accounting unchanged:
declaration occurrences 1; literal source occurrences 200; unique source/root
values 71; valid compositions 15; invalid 0; unrecognized 0; total GitHub-related
occurrences 216. DOI 48; functional fragments 0.

All current 40 sitemap routes unchanged; expected 40 == generated 40; missing 0,
unexpected 0, duplicate 0. Duplicate robots-attribute fail-closed classification,
raw sitemap URL validation, route-source traversal/ambiguity failure, Windows
path handling, end-to-end forbidden-origin validation, feed content/MIME checks,
and direct-source Git-only lastmod are all retained.

Correction validation (pnpm 10.34.5, node v22.22.2; frozen install passes):
`pnpm run check` exit 0. Suite totals — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124 (Package A + B
regression intact), test:indexing-discovery 94/94 (was 89/89; +5). Deterministic
total: 433 tests, 0 failures, 0 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 187/187 against a fresh build (expected ==
generated == 40). Direct-source Git lastmod: this worktree has full history, so
all 40 optional lastmods are present and valid ISO 8601; under a shallow/Gitless
checkout the same routes would omit <lastmod> (no mtime fallback). check:astro 0
errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only. Two fresh clean builds produced byte-identical sitemap-index.xml,
sitemap-0.xml, and verifier output. git diff --check clean; nothing staged;
complete Package C scope remains exactly seven files; astro.config.mjs,
package.json, pnpm-lock.yaml, and scripts/verify-indexing-discovery-build.mjs
byte-identical to the prior revision; all protected src/public-boundary files
byte-identical to base. No content, metadata-architecture, JSON-LD, language,
security-policy, GitHub, Cloudflare, Email Routing, CORS, NEL, mailbox,
deployment, Package D, or Package E change occurred; Package C remains
uncommitted.

Correction (Codex declaration-keyword + uninitialized-redeclaration follow-up —
same uncommitted Package C change, base facbf32f21a6b86a672bba4fb5477293ac299738,
no commit): a further review demonstrated that the generic literal-URL extractor
emitted a keyword-less `declaration` occurrence for sourceRepoBase, discarding
whether the keyword was const/let/var, so a `let`/`var` approved-value literal
could bind; and declarations without an initializer (`const sourceRepoBase;`,
`let sourceRepoBase;`, `var sourceRepoBase;`) were absent from evidence entirely,
so an uninitialized redeclaration did not prevent binding. A prior claim that
exact declaration enforcement was complete was inaccurate before keyword and
missing-initializer evidence existed. This correction touches only three files
relative to the prior revision — AGENT_WORKLOG.md,
scripts/lib/indexing-discovery-contract.mjs, tests/indexing-discovery.test.ts.
astro.config.mjs, package.json, pnpm-lock.yaml, and
scripts/verify-indexing-discovery-build.mjs are byte-identical to the prior
revision.

The generic literal declaration extractor now SKIPS sourceRepoBase, and a single
authoritative bounded scanner records EVERY sourceRepoBase declaration
(const/let/var, with or WITHOUT an initializer) as a
`github-base-declaration-evidence` occurrence carrying keyword, identifier,
initializerKind (approved-literal / other-literal / template / dynamic / missing
/ unsupported), value (when literal), file, line, and source offset. The
declaration keyword and initializer kind are load-bearing:
isApprovedSourceRepoBaseDeclaration now requires kind
`github-base-declaration-evidence`, keyword exactly `const`, initializerKind
`approved-literal`, identifier sourceRepoBase, the approved file, and the exact
approved value. approvedBaseDeclarationFiles binds a file only when it is exactly
src/data/diagnosticEntries.ts AND has exactly one sourceRepoBase declaration
occurrence AND that occurrence is the approved const literal. The declaration
scanner is authoritative and claims its range, so a sourceRepoBase declaration
containing a literal URL produces one declaration occurrence with its keyword,
not a declaration plus a generic URL occurrence; non-overlapping separate
same-line occurrences remain distinct by source offset. validateInventory treats
declaration evidence as metadata (never a rendered destination) even when its
literal value is a github.com URL.

Verified end-to-end (extractFunctionalUrls -> declaration evidence ->
approvedBaseDeclarationFiles -> validateInventory): lone approved-value let and
lone approved-value var fail closed; approved const + uninitialized let / var /
const fail closed (two occurrences, one initializerKind missing); approved const
+ dynamic let / var and approved const + template let / var fail closed; two
identical approved const declarations fail closed; same-line approved const +
uninitialized let / var fail closed as two occurrences; and exactly one approved
const literal binds. `let sourceRepoBase = "<approved>";` with a composition
produces NO approved binding and a stable NO_APPROVED_DECLARATION finding;
`const sourceRepoBase = "<approved>"; let sourceRepoBase;` with a composition
produces two declaration occurrences and fails closed.

Real src/data/diagnosticEntries.ts declaration accounting (this revision):
declaration occurrences 1; approved const literal declarations 1; mutable literal
declarations 0; uninitialized declarations 0; dynamic/template/unsupported
declarations 0; ambiguous declaration evidence 0; valid template compositions 15;
distinct suffixes 9; invalid compositions 0; unrecognized compositions 0.
Full-inventory GitHub accounting unchanged: literal source occurrences 200;
unique source/root values 71; total GitHub-related occurrences 216. DOI 48;
functional fragments 0.

All current 40 sitemap routes unchanged; expected 40 == generated 40; missing 0,
unexpected 0, duplicate 0. Occurrence offset identity, duplicate robots-attribute
fail-closed classification, raw sitemap URL validation, route-source
traversal/ambiguity failure, Windows path handling, end-to-end forbidden-origin
validation, feed content/MIME checks, and direct-source Git-only lastmod are all
retained.

Correction validation (pnpm 10.34.5, node v22.22.2; frozen install passes):
`pnpm run check` exit 0. Suite totals — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124 (Package A + B
regression intact), test:indexing-discovery 101/101 (was 94/94; +7).
Deterministic total: 436 tests, 0 failures, 0 skipped. verify:public-surface-map
18/18. verify:indexing-discovery-build 187/187 against a fresh build (expected ==
generated == 40). Direct-source Git lastmod: this worktree has full history, so
all 40 optional lastmods are present and valid ISO 8601; under a shallow/Gitless
checkout the same routes would omit <lastmod> (no mtime fallback). check:astro 0
errors / 0 warnings / 1 pre-existing hint; check:ts clean; wrangler deploy
--dry-run only. Two fresh clean builds produced byte-identical sitemap-index.xml,
sitemap-0.xml, and verifier output. git diff --check clean; nothing staged;
complete Package C scope remains exactly seven files; astro.config.mjs,
package.json, pnpm-lock.yaml, and scripts/verify-indexing-discovery-build.mjs
byte-identical to the prior revision; all protected src/public-boundary files
byte-identical to base. No content, metadata-architecture, JSON-LD, language,
security-policy, GitHub, Cloudflare, Email Routing, CORS, NEL, mailbox,
deployment, Package D, or Package E change occurred; Package C remains
uncommitted.

### 2026-07-23 — Claude Code — package-c-premerge-correction (two blocking findings)

Agent: Claude Code
Task: Correct the two blocking findings from the Codex pre-merge review of PR #81
(verdict CHANGES REQUIRED BEFORE MERGE) for Package C. Correction only; kept
local and UNCOMMITTED for a second Codex review. PR #81 not merged, the existing
commit not amended, no force-push, no push, no new PR, no deploy, and no
GitHub/Cloudflare/DNS/settings/branch-protection/secrets/environment change.
Package D and Package E not started. Starting state verified before any edit:
branch claude/package-c-indexing-discovery-contracts; local HEAD and origin
branch head both be2482bb6915c398cd808a0f37491ac1fa83d3b4; worktree clean;
nothing staged; PR #81 open and unmerged (mergeable_state clean). origin/main
recorded at facbf32f21a6b86a672bba4fb5477293ac299738 (a later origin/main SHA is
not, by itself, a reason to alter the Package C branch).

Finding A — shallow-history lastmod defect (scripts/lib/indexing-discovery-
contract.mjs, readDirectSourceLastmod). In a shallow checkout `git log -1 --
<path>` can report the shallow-boundary (grafted) commit for a path whose true
last change lies beyond the truncation, so an unchanged page would be stamped
with the boundary commit's timestamp (e.g. the PR-head time in a depth-one CI
checkout). This environment's own repository is shallow, so the pre-correction
build assigned that boundary timestamp to unchanged pages. Correction: the date
is still derived ONLY from the direct source file's Git history (never mtime,
build time, current time, package time, or PR time). The helper now obtains the
candidate commit SHA and committer date together, detects shallowness through
Git (`git rev-parse --is-shallow-repository`), and in a shallow repository
resolves the shallow-boundary file THROUGH Git
(`git rev-parse --path-format=absolute --git-path shallow`, worktree-aware, not
a fixed .git layout) and OMITS <lastmod> when the candidate commit is a
shallow-boundary commit. If shallow metadata cannot be read reliably it fails
closed (omits). Full-history behavior is unchanged (candidate date is
authoritative). No network or fetch. A separate injectable shallow-file reader
keeps the omission testable.

Finding B — regex-only XML structure validation (scripts/verify-indexing-
discovery-build.mjs). Replaced the regex tag-scraping (extractTags and the
`<url>…</url>` block regex) with a strict XML parser. Evaluated the dependency
graph first: the only strict parsers present (fast-xml-parser, sax) arrived
transitively via @astrojs/rss (removed in this PR) or @astrojs/sitemap and are
not directly importable under pnpm, so exactly one narrowly-scoped dev
dependency was added — fast-xml-parser 5.9.3 (pure XML parsing/validation; not
@astrojs/rss and not an RSS/feed/DOM/network dependency). Only package.json and
pnpm-lock.yaml changed beyond the four expected files. The verifier now enforces,
via the parser: sitemap-index well-formedness, correct <sitemapindex> root, the
sitemap namespace, exactly one <loc> per <sitemap> record, at most one <lastmod>
per record, unique child <loc>, no duplicate referenced child file, no
query/fragment/forbidden-origin (existing raw-shape validator), production
origin, and referenced child files exist; and for each child: well-formedness,
correct <urlset> root, the sitemap namespace, exactly one <loc> per <url>, at
most one <lastmod> per record, valid <lastmod> syntax, no duplicate raw <loc>
across records/files, no duplicate normalized URL (existing set validator), and
no forbidden origin. Every generated dist sitemap-*.xml is enumerated and must
agree exactly with the index references (unreferenced, missing/absent, and
duplicate references are rejected; child paths resolve strictly beneath dist;
even unreferenced stray sitemap files are scanned for forbidden origins; the
sitemap index is never treated as a child).

Tests (tests/indexing-discovery.test.ts): added a genuine shallow-history
regression using real depth-limited file:// clones — depth-1 omits the boundary
timestamp for an unchanged page; depth-2 omits a boundary path while preserving
a non-boundary tip path; a full clone keeps the true deep timestamp; unreadable
shallow metadata fails closed. Added real-verifier XML mutation fixtures for
malformed index/child XML, wrong index/child root, wrong index/child namespace,
two <loc> per index/url record, two <lastmod> per index/url record, invalid
<lastmod> syntax, duplicate raw <loc>, forbidden origin inside a child, an
unreferenced generated child file, an index-referenced child file that is
absent, and an unreferenced stray child with a forbidden origin; plus a positive
two-referenced-children exact-match case. All mutation tests run the REAL
verifier over isolated fixtures.

Preserved behavior: production origin https://metawritingecology.org; the current
40-route sitemap set; the prototype/interactive exclusions and noindex,nofollow
contracts; robots policy and Sitemap pointer; trailing-slash normalization; feed
absence; preview-host prohibition; JSON/asset endpoint exclusions; and the 404
representation. No approved public indexing/canonical/robots/sitemap/discovery/
Registry/archive/authority/classification/public-private policy changed.
astro.config.mjs is byte-identical to be2482bb.

Correction validation (pnpm 10.34.5, node v22.22.2): `pnpm run check` exit 0.
Suite totals — test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 124/124 (Package A + B regression intact),
test:indexing-discovery 122/122 (was 101/101; +21: +4 shallow-history, +17 XML
mutation). Deterministic total: 457 tests, 0 failures, 0 skipped.
verify:public-surface-map 18/18. verify:indexing-discovery-build 253/253 against
a fresh build (expected == generated == 40 routes; every generated sitemap-*.xml
agrees with index references). check:astro 0 errors / 0 warnings / 3 hints (the
pre-existing SchemaJsonLd is:inline hint plus two non-fatal ts(6385)
deprecation hints for the intentionally-used in-package XMLValidator; the
replacement is a separate package deliberately not added under the
single-dependency constraint). check:ts clean; wrangler deploy --dry-run only.
In this shallow environment the fresh build now emits 40 <loc> with 18 <lastmod>
(22 shallow-boundary timestamps correctly omitted rather than stamped).

Correction scope: exactly six files changed vs be2482bb — AGENT_WORKLOG.md,
package.json, pnpm-lock.yaml, scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
No content, metadata-architecture, JSON-LD, language, security-policy, GitHub,
Cloudflare, Email Routing, CORS, NEL, mailbox, deployment, Package D, or Package
E change occurred. Nothing committed, staged, pushed, or merged; PR #81 remains
open and unmerged for a second Codex review.

### 2026-07-23 — Claude Code — package-c-premerge-correction-round-2

Agent: Claude Code
Task: Implement the blocking corrections from the SECOND Codex pre-merge review
of PR #81 (verdict CHANGES REQUIRED BEFORE MERGE). Correction round 2 only; kept
local and UNCOMMITTED for further review. PR #81 not merged, the existing commit
not amended, no force-push, no push, no new PR, no deploy, and no
GitHub/Cloudflare/DNS/settings/branch-protection/secrets/environment/preview
change. Package D and Package E not started. Starting state verified before any
edit: branch claude/package-c-indexing-discovery-contracts; local HEAD and
origin branch head both be2482bb6915c398cd808a0f37491ac1fa83d3b4; nothing
staged; PR #81 open and unmerged; existing uncommitted correction scope exactly
the six expected files. origin/main recorded at
facbf32f21a6b86a672bba4fb5477293ac299738 (a later origin/main SHA is not, by
itself, a reason to alter the branch).

Seven blocker categories addressed:

1. Shallow-status fail-closed (scripts/lib/indexing-discovery-contract.mjs,
   readDirectSourceLastmod). Only the exact literal lowercase "false" is treated
   as full history and only the exact literal "true" enters shallow-boundary
   handling; empty, unknown, case-variant ("TRUE"), numeric ("1"), "yes",
   whitespace-only, malformed, or unreadable flag output all omit lastmod. Full
   history is never inferred from an absent/unreadable flag.

2. Strict Git object-id validation (new normalizeGitObjectId). The candidate
   commit id must be exactly 40- or 64-character hexadecimal; it is normalized to
   lowercase; abbreviated, empty, non-hex, and surrounded values are rejected.
   The candidate SHA and date are parsed from ONE NUL-separated `%H%x00%cI`
   result requiring exactly two fields; a missing separator, extra fields, empty
   SHA, or empty date omit. A date is never accepted independently of a valid
   candidate commit identity.

3. Strict shallow-boundary metadata validation. When Git reports the repository
   shallow, the boundary file is resolved through
   `git rev-parse --path-format=absolute --git-path shallow` (linked-worktree and
   non-default-layout aware, no fixed `.git/shallow` assumption), split on CRLF
   or LF with a final terminator ignored. EVERY non-empty boundary line must be
   an exact 40/64-hex object id (normalized to lowercase); at least one valid
   entry is required; an empty file, any malformed non-empty line, a partially
   malformed file, or unreadable metadata all omit. An uppercase boundary entry
   matches a lowercase candidate after normalization; multiple valid boundary
   SHAs are supported. No diff-tree or root-commit file listing is used.

4. Strict Git date validation (new validateCommitterIsoDate). The exact `%cI`
   lexical form is required (YYYY-MM-DDTHH:MM:SS, optional fractional seconds, and
   a Z or numeric ±HH:MM zone) with real calendar (leap-year aware), clock, and
   timezone (−12:00…+14:00) semantics; impossible dates/times/zones, locale-style
   dates, and surrounding whitespace are rejected. The original validated `%cI`
   string is returned rather than a JavaScript Date re-serialization. A shared
   strict W3C validator (new isValidSitemapLastmod) permits only YYYY-MM-DD or a
   complete datetime and is applied to BOTH sitemap-index and child URL lastmod
   in the verifier.

5. Raw XML scalar preservation + strict structural model + entity/DOCTYPE
   handling (scripts/verify-indexing-discovery-build.mjs). The parser now uses
   preserveOrder:true, trimValues:false, and processEntities:false; a DOCTYPE
   declaration is rejected outright before parsing (blocking internal, external,
   and parameter entity declarations) while ordinary predefined escapes such as
   &amp; continue to parse. An explicit structural model validates: exactly one
   correct root with the sitemap namespace and only xmlns / xmlns:* declarations
   (the approved @astrojs/sitemap news/xhtml/image/video namespace declarations
   are accepted; any non-namespace root attribute is rejected); no unexpected
   root attribute, root child element, or non-whitespace root text; each record
   has exactly one plain-scalar <loc> and at most one plain-scalar <lastmod> with
   no record attributes, unexpected child elements, non-whitespace record text,
   or loc/lastmod attributes or child elements. Leading/trailing scalar
   whitespace reaches the raw validators (no pre-trim) and is rejected. Any
   record with a structural or value finding is EXCLUDED entirely, so a malformed
   record contributes no loc, lastmod, URL entry, route, or reference downstream;
   a fatal root problem yields no records but is still reported.

6. Symlink / regular-file containment. Every sitemap read (sitemap-index.xml,
   each referenced child, each enumerated sitemap-*.xml) requires lstat to
   confirm an ordinary regular file (symlinks, directories, and other
   non-regular entries are rejected) and realpath(file) to remain under
   realpath(dist) before any content read; a symlink is never followed before the
   violation is reported. Directory enumeration detects and reports matching
   symbolic-link and non-regular entries rather than silently skipping them, and
   walkFiles no longer follows symlinks.

7. Dependency state preserved. fast-xml-parser@5.9.3 remains the single added
   dev dependency, unchanged; no second XML/validator dependency was added; the
   in-package XMLValidator deprecation hints are accepted as non-blocking. This
   round modified only four files; package.json and pnpm-lock.yaml were NOT
   changed in round 2 (byte-identical to the first uncommitted correction).

Tests (tests/indexing-discovery.test.ts): added strict Git fault-injection
coverage (shallow flag false/true/empty/unknown/TRUE/numeric/failure; invalid,
abbreviated, and well-formed candidate SHAs; missing and extra NUL fields; empty,
malformed, and impossible-calendar dates; uppercase boundary match; empty, fully
malformed, partially malformed, multiple-valid, and unreadable shallow files;
shallow-path command failure) plus a genuine linked-worktree shallow test, and
retained the round-1 file:// shallow-clone tests. Added real-verifier structural
mutation fixtures (leading/trailing scalar whitespace; loc/lastmod attribute and
child; unexpected root attribute; accepted xmlns:* declarations; unexpected
record attribute; unexpected root and record child elements; non-whitespace root
and record text; malformed-record exclusion from downstream entries; invalid
index and child lastmod incl. locale/impossible-date/invalid-time/invalid-zone;
DOCTYPE, internal/external/parameter entity rejection; normal &amp; accepted) and
containment fixtures (child directory; referenced symlink outside dist;
unreferenced sitemap symlink; symlinked sitemap-index.xml), with symlink-specific
tests skipped only where the platform cannot create symlinks.

Correction validation (pnpm 10.34.5, node v22.22.2; `pnpm install
--frozen-lockfile` passes): `pnpm run check` exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 124/124 (Package A + B regression intact),
test:indexing-discovery 176/176 (was 122/122; +54). Deterministic total: 511
tests, 0 failures, 0 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 152/152 against a fresh build (expected ==
generated == 40 routes; every generated sitemap-*.xml agrees with index
references). check:astro 0 errors / 0 warnings / 3 hints (the pre-existing
SchemaJsonLd is:inline hint plus two accepted ts(6385) XMLValidator deprecation
notes). check:ts clean; wrangler deploy --dry-run only. Two fresh clean builds
produced byte-identical sitemap-index.xml, sitemap-0.xml, and verifier output.
In this shallow environment the fresh build emits 40 <loc> with 18 <lastmod> (22
shallow-boundary timestamps omitted). git diff --check clean; nothing staged.

Accumulated correction scope vs be2482bb: exactly six files — AGENT_WORKLOG.md,
package.json, pnpm-lock.yaml, scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
Round 2 edited only four of these (AGENT_WORKLOG.md, the helper, the verifier,
the tests); package.json and pnpm-lock.yaml were unchanged this round.
astro.config.mjs remains byte-identical to be2482bb. No route membership,
indexing, canonical, robots, feed, public/private, Registry, archive, authority,
classification, or relation policy changed. No content, metadata-architecture,
JSON-LD, language, security-policy, GitHub, Cloudflare, Email Routing, CORS, NEL,
mailbox, deployment, Package D, or Package E change occurred. Nothing committed,
staged, pushed, or merged; PR #81 remains open and unmerged.

### 2026-07-23 — Claude Code — package-c-premerge-correction-round-3

Agent: Claude Code
Task: Implement the four remaining blocking findings from the THIRD Codex
pre-merge review of PR #81 (verdict CHANGES REQUIRED BEFORE MERGE). Correction
round 3 only; kept local and UNCOMMITTED. PR #81 not merged, the existing commit
not amended, no force-push, no push, no new PR, no deploy, and no
GitHub/Cloudflare/DNS/settings/branch-protection/secrets/environment/preview
change. Package D and Package E not started. Starting state verified before any
edit: branch claude/package-c-indexing-discovery-contracts; local HEAD and
origin branch head both be2482bb6915c398cd808a0f37491ac1fa83d3b4; nothing
staged; PR #81 open and unmerged; accumulated diff exactly the six expected
files. origin/main recorded at facbf32f21a6b86a672bba4fb5477293ac299738 (a later
origin/main SHA is not, by itself, a reason to alter the branch).

Prior accepted decisions unchanged: fast-xml-parser@5.9.3 remains the single
added dev dependency (not replaced, removed, upgraded, or supplemented); the
DOCTYPE/entity policy, record-level XML validation, sitemap lastmod lexical
rules, and symlink read-before-check protections from round 2 are preserved.

Four blocker categories addressed (scripts/lib/indexing-discovery-contract.mjs
and scripts/verify-indexing-discovery-build.mjs):

1. Exact shallow-STATUS parsing. readDirectSourceLastmod no longer trims the
   `git rev-parse --is-shallow-repository` output; it removes at most one
   terminal line ending (/\r?\n$/). Only exact "false" is full history and only
   exact "true" enters boundary handling; empty, whitespace-only, " false",
   "false ", "\tfalse", " true", "true ", "TRUE", "False", "unknown", "1",
   multiple trailing line endings, and trailing text all omit. Leading spaces,
   trailing spaces, and tabs are never stripped.

2. Exact shallow-PATH output handling. The
   `git rev-parse --path-format=absolute --git-path shallow` output is no longer
   trimmed; only one terminal line ending is removed. Legitimate leading/trailing
   path spaces are preserved and the exact returned path is read; empty output,
   embedded NUL, or any unexpected additional line omits lastmod.

3. Strict blank-line rejection in shallow-boundary metadata. The boundary file
   is split on LF/CRLF; at most the single final empty split element (from one
   normal terminal line ending) is removed; every remaining line must be an exact
   40/64-hex object id (normalized to lowercase). A leading blank, interior
   blank, extra trailing blank(s), whitespace-only line, surrounded SHA, or any
   malformed line fails the whole file closed; at least one valid id is required.
   One valid SHA with no newline / one LF / one CRLF, and multiple valid SHAs,
   are accepted.

4. Root-level XML findings are FATAL to record extraction. parseSitemapDocument
   now completes ALL root validation first (root type, default namespace,
   non-namespace root attribute, non-whitespace root text, unexpected root child
   element, multiple/malformed roots) and returns records: [] when ANY root
   finding exists; record validation runs only on a structurally clean root. An
   invalid sitemap-index root therefore contributes no referenced child
   filenames (no child file is opened from a record of an invalid root), and an
   invalid urlset root contributes no URL/route/duplicate/lastmod/origin/
   membership entries. Findings are still returned and fail verification.

5. Recursive sitemap-shaped inventory (part of blocker 4's discovery gap).
   Generated-child enumeration is now a recursive, symlink-non-following lstat
   traversal of dist. Every basename matching /^sitemap-\d+\.xml$/i anywhere
   under dist is inspected. The ONLY valid generated child is a root-level,
   exact-lowercase sitemap-<n>.xml ordinary regular file whose realpath stays
   beneath realpath(dist); every other shaped entry (nested, case-variant,
   symlink, directory, or other non-regular) is reported and never enters the
   valid generated set. Safe ordinary in-dist regular sitemap-shaped files
   (including nested/uppercase) are still scanned for forbidden origins and feed
   signatures — closing the prior false-pass where a nested sitemap containing a
   workers.dev URL escaped detection. Symbolic links (file or directory) are
   never followed or read; directory symlinks are not recursed into; traversal
   cannot escape dist or loop. sitemap-index.xml is never treated as a child.

Preserved (unchanged): production origin; route membership, exclusions, robots,
canonical, trailing-slash, feed-absence, preview-host, prototype/interactive
boundaries; generated JSON exclusion; 404 behavior; sitemap namespace policy
(default xmlns required, standard xmlns:* declarations accepted); parser
dependency; DOCTYPE/entity policy; record-level XML validation. astro.config.mjs
byte-identical to be2482bb.

Tests (tests/indexing-discovery.test.ts): added exact shallow-flag output cases
(false/true success; leading/trailing space, tab, CRLF, multiple newlines,
empty, whitespace-only, trailing-text variants), exact shallow-path cases (one
LF/CRLF removed, spaces preserved, extra line, embedded NUL, empty), strict
boundary blank-line cases (leading/interior/trailing blank, whitespace-only,
surrounded SHA reject; one-valid no-newline/LF/CRLF and multiple valid accept);
root-fatal index and child cases (unexpected root attribute, non-whitespace root
text, unexpected root child, wrong namespace) each proving zero downstream child
references / URL entries; and recursive-inventory cases (nested lowercase, nested
forbidden-origin still scanned, nested uppercase, root uppercase, nested
directory, nested file/dir symlinks reported-not-followed, directory symlink not
traversed, unrelated nested XML ignored, ordinary valid child passes). Genuine
file:// shallow-clone and linked-worktree tests retained. All tests call the real
production helper/verifier.

Correction validation (pnpm 10.34.5, node v22.22.2; `pnpm install
--frozen-lockfile` passes): `pnpm run check` exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 124/124 (Package A + B regression intact),
test:indexing-discovery 216/216 (was 176/176; +40). Deterministic total: 551
tests, 0 failures, 0 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 152/152 against a fresh build (expected ==
generated == 40 routes). check:astro 0 errors / 0 warnings / 3 hints (the
pre-existing SchemaJsonLd is:inline hint plus two accepted ts(6385) XMLValidator
deprecation notes). check:ts clean; wrangler deploy --dry-run only. Two fresh
clean builds produced byte-identical sitemap-index.xml, sitemap-0.xml, and
verifier output. In this shallow environment the fresh build emits 40 <loc> with
18 <lastmod>. git diff --check clean; nothing staged.

Accumulated correction scope vs be2482bb: exactly six files — AGENT_WORKLOG.md,
package.json, pnpm-lock.yaml, scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
Round 3 edited only four (AGENT_WORKLOG.md, the helper, the verifier, the tests);
package.json and pnpm-lock.yaml were NOT changed in round 3. No route membership,
indexing, canonical, robots, feed, public/private, Registry, archive, authority,
classification, or relation policy changed. No content, metadata-architecture,
JSON-LD, language, security-policy, GitHub, Cloudflare, Email Routing, CORS, NEL,
mailbox, deployment, Package D, or Package E change occurred. Nothing committed,
staged, pushed, or merged; PR #81 remains open and unmerged.

### 2026-07-23 — Claude Code — package-c-premerge-correction-round-4

Agent: Claude Code
Task: Implement the remaining blocking finding from the FOURTH Codex pre-merge
review of PR #81 (verdict CHANGES REQUIRED) — the recursive-inventory fail-open
defect — plus the bounded regression refinements it noted. Correction round 4
only; kept local and UNCOMMITTED. PR #81 not merged, existing commit not amended,
no force-push, no push, no new PR, no deploy, and no
GitHub/Cloudflare/DNS/settings/branch-protection/secrets/environment/preview
change. Package D and Package E not started. Starting state verified before any
edit: branch claude/package-c-indexing-discovery-contracts; local HEAD and origin
branch head both be2482bb6915c398cd808a0f37491ac1fa83d3b4; nothing staged; PR #81
open and unmerged; accumulated diff exactly the six expected files. origin/main
recorded at facbf32f21a6b86a672bba4fb5477293ac299738 (a later origin/main SHA is
not, by itself, a reason to alter the branch).

Remaining defect: the recursive sitemap inventory
(collectSitemapShapedEntries) silently swallowed directory-read failures
(`try { readdirSync(...) } catch { return; }`), treating an unreadable directory
as empty. A sitemap-shaped file (including one carrying a forbidden preview
origin) hidden beneath an unreadable directory could therefore be represented as
absent, letting generated/reference equality mask an incomplete scan.

Correction (scripts/verify-indexing-discovery-build.mjs):
- collectSitemapShapedEntries now returns { entries, traversalFindings }. Every
  failed directory read (root or nested) produces an explicit
  SITEMAP_INVENTORY_DIRECTORY_UNREADABLE traversal finding recording the
  dist-relative path and the stable errno code (no absolute path, no stack
  trace); traversal stops for that one directory but continues with its
  siblings.
- The dist root read uses the same fail-closed path (dist ABSENCE keeps its
  distinct existing BUILD_MISSING finding; "present but unreadable" is the new
  finding).
- At the call site every traversal finding is a failing check, and the
  generated/reference exact-match check now also requires an
  inventory-complete condition, so a matching set can never override a traversal
  failure. Forbidden-origin and feed scans are therefore never represented as
  complete when a directory could not be read; unreadable content is never read
  through.
- A narrowly-scoped internal test seam (testHooks.readDir, defaulting to the
  real readdirSync) allows deterministic injection of a directory-read failure
  for one exact directory without environment variables, global monkey-patching,
  new dependencies, or any change to public indexing behavior; it replaces only
  the listing step and cannot bypass the lstat/symlink/realpath/containment
  checks that gate file reads. The verifier result additionally exposes a
  bounded urlEntryCount so tests can assert zero extraction directly.
- Comment precision: the traversal documentation now distinguishes directory
  enumeration via readdirSync/Dirent from the explicit non-following
  classification and safety checks (lstat via classifyPathKind + realpath
  containment) performed before any file read; it no longer claims the traversal
  itself performs an lstat.

Tests (tests/indexing-discovery.test.ts): added deterministic injected-reader
regressions (unreadable inventory root; unreadable nested directory with
siblings continuing; hidden forbidden-origin sitemap not read through the
failure; generated/reference match not masking a traversal failure) — all run
unconditionally — plus a real chmod 0o000 permission test that is skipped only
when permission semantics are unenforceable (elevated/root execution), with a
privilege probe and permission restoration on cleanup. Added the minor Codex
refinements: Git flag "False\n" omits, exact "true\r\n" enters shallow handling,
a boundary SHA with surrounding tabs omits, multiple CRLF-separated boundary SHAs
are accepted; and a root-fatal refinement asserting an invalid child root
containing a forbidden-origin URL and a valid-looking route extracts zero URL
entries (urlEntryCount === 0) with no record-derived route/origin/duplicate/
membership/lastmod finding, only the root-structure finding. No production Git
helper change was needed; the helper is unchanged in round 4.

Preserved (unchanged): valid root-level sitemap inventory; recursive detection
of nested/case-variant sitemap files; symlink non-traversal; realpath
containment; forbidden-origin and feed-signature scanning for readable files;
generated/reference exact-set comparison; XML structure validation; Git lastmod
logic; dependencies; route set; indexing policy. The only behavioral change is
that an unreadable inventory directory now causes explicit verifier failure
instead of silent omission. astro.config.mjs and the Git helper are byte-
identical to their v3 state; package.json and pnpm-lock.yaml were NOT changed in
round 4.

Correction validation (pnpm 10.34.5, node v22.22.2; `pnpm install
--frozen-lockfile` passes): `pnpm run check` exit 0. Suite totals —
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:semantic-flow 21/21,
test:security-resilience 124/124 (Package A + B regression intact),
test:indexing-discovery 225 passed / 0 failed / 1 skipped (was 216/216; +10, of
which the single skip is the elevated-execution real-permission test). Total 560
passed, 0 failed, 1 skipped. verify:public-surface-map 18/18.
verify:indexing-discovery-build 152/152 against a fresh build (expected ==
generated == 40 routes). check:astro 0 errors / 0 warnings / 3 hints (pre-
existing SchemaJsonLd is:inline + two accepted ts(6385) XMLValidator deprecation
notes). check:ts clean; wrangler deploy --dry-run only. Two fresh clean builds
produced byte-identical sitemap-index.xml, sitemap-0.xml, and verifier output.
git diff --check clean; nothing staged.

Accumulated correction scope vs be2482bb: exactly six files — AGENT_WORKLOG.md,
package.json, pnpm-lock.yaml, scripts/lib/indexing-discovery-contract.mjs,
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts.
Round 4 edited only three (AGENT_WORKLOG.md, the verifier, the tests); the Git
helper, package.json, and pnpm-lock.yaml were unchanged in round 4. No indexing,
sitemap membership, robots, canonical, trailing-slash, feed, preview-host,
public/private, Registry, archive, authority, classification, or relation policy
changed. No content, metadata-architecture, JSON-LD, language, security-policy,
GitHub, Cloudflare, Email Routing, CORS, NEL, mailbox, deployment, dependency,
Package D, or Package E change occurred. Nothing committed, staged, pushed, or
merged; PR #81 remains open and unmerged.

### 2026-07-23 — Claude Code — package-c-ci-followup-round-5 (walkFiles fail-closed)

Agent: Claude Code
Task: Fix the CI-exposed fail-open/uncaught traversal path after PR #81's
required site-ci check failed. Correction round 5 only; kept local and
UNCOMMITTED for review. No amend/rewrite of ad131d0, no force-push, no push, no
new PR, no merge, no deploy, no re-run of the failed check via settings, and no
GitHub/Cloudflare/DNS/settings/branch-protection/secrets/environment/preview
change. Package D and Package E not started. Starting state verified: branch
claude/package-c-indexing-discovery-contracts; local HEAD and origin branch head
both ad131d05fd1f4e7fe2d2b3d99a80c5e2b07d6050; worktree clean; nothing staged; PR
#81 open, unmerged, two commits. origin/main recorded at
facbf32f21a6b86a672bba4fb5477293ac299738.

Context: the additive correction commit ad131d0 was pushed normally in the
preceding run. Its automated checks: Workers Builds:
metawritingecology-site SUCCEEDED (a build record, not a production deployment);
the required site-ci check FAILED
(https://github.com/metawritingecology/metawritingecology-site/actions/runs/30000394137/job/89183955941)
on the real unreadable-directory test with
"EACCES: permission denied, scandir '.../dist/hidden/'". CI (unprivileged)
exposed a SECOND recursive traversal — walkFiles, used by the feed/content
scan — that still threw an uncaught exception on an unreadable directory. The
round-4 hardening had covered only the sitemap-inventory traversal; the local
root environment skipped the capability-gated chmod test, hiding the gap.

Fix (scripts/verify-indexing-discovery-build.mjs): walkFiles now returns
{ files, traversalFindings } and never lets a directory-read failure escape as an
uncaught exception. Each failed readdir yields a structured
DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE finding carrying only a dist-relative
path ("." for the root) and a bounded errno (a shared normalizeErrno helper
accepts a short [A-Za-z0-9_]{1,32} code, else "unknown"; no absolute path, no
stack trace, no file contents). Traversal stops for the failed directory and
continues with readable siblings; symbolic links remain untraversed. At the call
site every walkFiles traversal finding is processed through the ordinary failing-
check mechanism so it contributes to the final failed state and later successful
checks cannot mask it; the file scan is not represented as complete when a
directory could not be read. A narrowly-bounded internal seam
testHooks.walkFilesReadDir (defaulting to readdirSync) allows deterministic
injection of a single-directory read failure without env vars, global patching,
new dependencies, or bypassing the readFileSync/lstat/realpath/symlink/
containment checks. The existing SITEMAP_INVENTORY_DIRECTORY_UNREADABLE finding
and all other checks (generated/reference exact match, forbidden-origin,
feed-signature, symlink/realpath, root-fatal XML) are retained; the inventory
errno is now bounded through the same normalizeErrno helper (closing the
non-blocking diagnostic-hardening note).

Tests (tests/indexing-discovery.test.ts): the real chmod test now also asserts
DISCOVERY_FILE_SCAN_DIRECTORY_UNREADABLE, no longer throws, receives an ordinary
failed result, and restores permissions on cleanup (its capability-based skip
remains only where chmod 000 is unenforceable, e.g. root). Added unconditional
walkFiles fault-injection tests (nested failure with sibling continuation and
bounded relative-path detail; root failure without exception; hidden feed-
signature content not read through the failure; readable sibling still scanned;
sitemap inventory complete while walkFiles independently fails; readable feed-
signature detection still active). All run under root. Verified the fix under
real CI permission semantics by running the indexing/discovery suite as the
unprivileged `nobody` user: 232/232 passed, 0 skipped, including the chmod test
(no EACCES). (A world read/execute bit was temporarily added to the container
home/repo directories only to let the unprivileged user traverse to the test
files; no repository file, ownership, tracked content, or committed artifact was
affected.)

Validation (pnpm 10.34.5, node v22.22.2; `pnpm install --frozen-lockfile`
passes): `pnpm run check` exit 0. As root — test:contracts 48/48, test:runtime
55/55, test:retention 16/16, test:orchestration 29/29, test:workflow 42/42,
test:semantic-flow 21/21, test:security-resilience 124/124,
test:indexing-discovery 231 passed / 0 failed / 1 skipped (the capability-gated
chmod test); total 566 passed, 0 failed, 1 skipped. As unprivileged nobody the
indexing/discovery suite is 232 passed, 0 skipped. verify:public-surface-map
18/18; verify:indexing-discovery-build 152/152 on a fresh build (expected ==
generated == 40 routes). check:astro 0 errors / 0 warnings / 3 hints; check:ts
clean; wrangler deploy --dry-run only. Two fresh clean builds produced byte-
identical sitemap-index.xml, sitemap-0.xml, and verifier output. No uncaught
EACCES remains. git diff --check clean; nothing staged.

Round-5 scope vs ad131d0: exactly three files —
scripts/verify-indexing-discovery-build.mjs, tests/indexing-discovery.test.ts,
AGENT_WORKLOG.md. The Git helper (scripts/lib/indexing-discovery-contract.mjs),
package.json, pnpm-lock.yaml, and astro.config.mjs are unchanged; no new
dependency. The only production behavior change is that a directory-read failure
during the walkFiles feed/content scan now yields a structured failed verifier
result instead of an uncaught exception. No indexing, sitemap membership, route,
robots, canonical, trailing-slash, feed-absence (for readable output),
preview-host, Registry, archive, authority, classification, relation, or
public/private policy changed. Nothing committed, staged, pushed, or merged; PR
#81 remains open and unmerged, still blocked by the existing failed site-ci until
a reviewed follow-up commit is pushed.

### 2026-07-23 — Claude Code — package-d-public-metadata-contracts

Agent: Claude Code
Task: Implement Package D — Public Metadata and Structured Representation
Contracts, as a local implementation and review-artifact task only (no stage,
commit, push, PR, merge, deploy, or external setting change).

User-approved Package D decisions applied verbatim: basic language parity in
scope; supported page-language values are exactly `en` and `zh`; JSON-LD types
remain exactly WebSite and WebPage (no Article/Book/CreativeWork/Dataset/
ScholarlyArticle/publication/archive/Registry/ontology/classification/authority
type); existing special-route behavior preserved (ordinary pages self-canonical
+ indexable + JSON-LD; interactive preview self-canonical + noindex/nofollow +
JSON-LD; prototype no-canonical + noindex/nofollow + no JSON-LD; 404 no-canonical
+ noindex/follow + no JSON-LD; JSON endpoints outside the HTML metadata
contract); Open Graph / Twitter out of scope; hreflang / alternate-language /
og:locale / translation architecture out of scope; existing title and
description wording not rewritten; HTML meta description and WebPage JSON-LD
description resolve from the same page description; existing structured genre
values preserved exactly (not expanded, renamed, normalized, or interpreted as
MWE classification); inert authority frontmatter (status/classification/
visibility/archive/registry/authority/relation/publication) not published; and
all Package C indexing/sitemap/canonical-origin/robots/lastmod/feed/exclusion/
preview-origin decisions unchanged.

Base SHA: 63caafcd57c5fd50749969937ba57cdd56a950f7 (Package C merge, PR #81;
verified as origin/main HEAD and as the branch base). origin/main had not
advanced past the recorded Package C merge.
Branch: claude/package-d-public-metadata-contracts (local only; not pushed).

Architecture — hybrid typed metadata contract (new src/lib/publicMetadata.ts):
page-local title and description remain in Astro props / Markdown frontmatter and
are NOT duplicated into a central registry; route POLICY (language, canonical
policy, indexing policy, structured-data enablement, and existing structured
genre only where already emitted) is centralized in an explicit typed registry
covering every BaseLayout route (all 40 indexable routes + the interactive
preview = 41 entries; no unrestricted generic fallback — an unregistered
BaseLayout route fails closed). Structured data is resolved through one
resolver (resolvePublicMetadata) from the page title, page description,
route-policy language, and approved canonical URL. The module has no Node/runtime
imports so it is safe in the SSR worker bundle. It is an engineering layer only:
it asserts no Registry/classification/relation/OSF/publication/ontology/authority
status, and enforces the WebSite/WebPage ceiling through types and fail-closed
checks, not new page prose.

Local title/description retained: BaseLayout reads only title, description, and
the presentational mainClass from props/frontmatter; it no longer consumes
schemaDescription/schemaGenre/robots and never reads a generic frontmatter
`language` or any inert authority field. Language is driven by the typed route
policy. The inert fields in artistic-research.md (status/classification/
visibility/language) remain untouched and unpublished.

Chinese language correction: /zh/ and /zh/boundary/ now render html lang="zh"
and WebPage inLanguage "zh" (previously incorrectly "en"). No Chinese
body prose or frontmatter title/description changed; the two Chinese Markdown
files were not edited (the registry supplies language, so no dedicated
frontmatter field was required).

HTML/JSON-LD description parity: the WebPage JSON-LD description now equals the
HTML meta description for every JSON-LD-enabled route, resolved from the single
existing page description. The prior independently-authored route-local schema
descriptions and the generic "Public orientation surface for Meta-Writing
Ecology." default were removed. No new description wording was authored (verified
route-by-route: 40 WebPage descriptions changed to equal the existing HTML
description; 0 introduced new wording).

WebPage inLanguage addition: every emitted WebPage now carries inLanguage equal
to html lang. WebSite node semantics/text preserved exactly (name and
description unchanged; url is the production origin). Supported JSON-LD types
remain exactly WebSite and WebPage; existing genre values preserved exactly and
no genre added/renamed. No author/publisher/sameAs/citation/DOI/datePublished/
dateModified/mainEntityOfPage or Open Graph / Twitter / hreflang / og:locale
contract introduced.

Special routes preserved: interactive preview keeps its route, title,
description, self-canonical, noindex/nofollow, JSON-LD (now with description
parity + inLanguage, genre preserved). src/pages/404.astro and
src/pages/language-pressure-test-lab-prototype.astro remain byte-identical
(confirmed by rendered-output snapshot: prototype and 404 IDENTICAL pre/post).
The two JSON endpoint classes remain application/json and outside the HTML
metadata system.

Files changed (7): AGENT_WORKLOG.md; package.json (scripts only — added
test:metadata-contract and verify:metadata-build and wired both into the full
`check` chain; no dependency added; pnpm-lock.yaml byte-identical);
src/layouts/BaseLayout.astro (resolver-driven metadata); tests/
semantic-flow-source-entries.test.ts (one mechanical source-location update:
the "baseLayout: route-specific metadata for the four approved routes" subtest
now verifies the four exact approved route-to-genre bindings in the typed
publicMetadata registry — exactly once each, absent from BaseLayout.astro —
instead of in the layout source; genre values and test semantics unchanged);
new src/lib/publicMetadata.ts; new tests/metadata-contract.test.ts; new
scripts/verify-metadata-build.mjs. src/components/SchemaJsonLd.astro left
unchanged (it remains a pure serializer; no serializer change was required).

Build verifier note: the site builds SSR (output: "server", Cloudflare adapter),
so ordinary indexable routes are not emitted as static HTML in dist; they render
on demand by the worker. scripts/verify-metadata-build.mjs therefore boots the
freshly built worker in the local offline Cloudflare runtime (wrangler dev
--local, workerd — the same engine as production) against the current dist,
fetches every route class, and applies bounded deterministic <head>/JSON-LD
extraction (no HTML-parser dependency; fast-xml-parser is not used as an HTML
parser). It uses a fresh OS-assigned free port per run and reaps the wrangler +
workerd process subtree on exit. Route membership is derived independently from
Package C's buildExpectedRouteSet (real page sources + robots), not from the
Package D registry, so coverage is not self-referential. No deployment and no
external setting change occur.

Validation (pnpm 10.34.5, node v22.22.2; pnpm install --frozen-lockfile passes):
pnpm run check exit 0 (51s). Source-level metadata contract: 26/26.
semantic-flow: 21/21 (previously 20/21 before the authorized one-assertion
update). verify-metadata-build: 1077/1077 against a fresh build. Package C
regression unchanged and passing: test:indexing-discovery 231 passed / 0 failed /
1 skipped (pre-existing capability-gated chmod skip), verify-indexing-discovery-
build 152/152 (expected == generated == 40 sitemap routes; robots sitemap
pointer unchanged; interactive/prototype/404/JSON endpoints remain sitemap-
excluded; no lastmod change), verify-public-surface-map 18/18. Other suites:
test:contracts 48/48, test:runtime 55/55, test:retention 16/16,
test:orchestration 29/29, test:workflow 42/42, test:security-resilience 124/124.
check:astro 0 errors / 0 warnings; check:ts clean; wrangler used dry-run only in
the check chain. Two fresh clean builds produced byte-identical rendered
<head>/JSON-LD (all 43 tested route classes), robots.txt, sitemap-index.xml, and
sitemap-0.xml (SHA-256 match). Untracked pre/post metadata snapshots confirm the
only rendered changes are the authorized ones (zh lang correction, inLanguage
addition, HTML/JSON-LD description parity); everything else — titles, HTML meta
descriptions, canonicals, robots, route membership, WebSite meaning, WebPage
URLs, structured-data type, genre, block cardinality, special-route enablement —
is stable. git diff --check clean; nothing staged; no tracked dist output;
pnpm-lock.yaml unchanged; no dependency added.

Status: all changes are LOCAL, UNSTAGED, UNCOMMITTED, and UNPUSHED. No push, PR,
merge, deployment, GitHub/Cloudflare/DNS/secret/ruleset/branch-protection change,
external action, or Package E work was performed. Review artifacts
(mwe-site-package-d-metadata-contract-v1.patch and its manifest) were exported
for Codex review.

Unresolved questions: None. The one out-of-scope test edit
(tests/semantic-flow-source-entries.test.ts) was explicitly user-authorized as a
mechanical source-location update after the approved migration of route-specific
metadata from BaseLayout.astro to the typed publicMetadata registry.
Risks or assumptions: The SSR build means per-route rendered HTML is produced by
the worker rather than emitted to dist; the metadata verifier and snapshots
therefore render through the local offline workerd runtime rather than reading
static dist HTML. Genre preservation assumes the currently-emitted genre for each
route (the 10 route-specific genres plus the default orientation genre for the
remaining routes) is the exact "existing" genre to retain.

### 2026-07-23 — Claude Code — package-d-public-metadata-contracts v2 (bounded-request correction)

Agent: Claude Code
Task: Implement the bounded Package D v2 correction after Codex review returned
CHANGES REQUIRED. This remains a local implementation and review-artifact task
only (no stage, commit, push, PR, merge, deploy, or external setting change).
The v1 entry above is unchanged.

Codex verdict: CHANGES REQUIRED. The sole blocker: scripts/verify-metadata-build.mjs
performed UNBOUNDED HTTP requests during local-worker readiness probing, rendered-
route verification, and response-body reading, so a nonresponsive route could
block verification indefinitely and prevent the Wrangler/workerd cleanup path
from running. No other blocking finding; the non-blocking duplicate-key
enhancement was intentionally NOT implemented in this correction.

Correction (bounded requests + verifier lifecycle):
- Added explicit, finite, deterministic constants: ROUTE_FETCH_TIMEOUT_MS = 10000,
  READINESS_FETCH_TIMEOUT_MS = 2000, plus READINESS_TOTAL_MS = 60000 and
  READINESS_INTERVAL_MS = 1000 bounding the readiness loop.
- One shared bounded-fetch mechanism (boundedFetch) using a native AbortController.
  A single timer per request spans BOTH the header wait AND the full body read and
  is cleared only in `finally` (after the body read finishes), so a headers-only
  response with an unfinished body is also aborted — clearing the timer right
  after fetch() would leave body reads unbounded. A timeout throws a deterministic
  VerifierTimeoutError (code VERIFIER_FETCH_TIMEOUT) identifying the phase/route
  without embedding external response data; ordinary network/rendering errors
  still propagate (fail closed). No request can continue indefinitely.
- Route reads: fetchRoute now wraps boundedFetch with ROUTE_FETCH_TIMEOUT_MS; the
  verifier hands its route loop a bound per-route fetcher so every rendered-route
  read is covered.
- Readiness: awaitReady replaces the plain readiness fetch. Each attempt is bounded
  by READINESS_FETCH_TIMEOUT_MS; the overall loop is bounded by a wall-clock
  deadline (READINESS_TOTAL_MS). A stalled attempt aborts and the loop continues to
  the next attempt; the final not-ready result is deterministic and still reaches
  the cleanup `finally` (killTree). No probe body/connection is left open.
- On any route timeout the error propagates out of the route loop, killTree reaps
  the Wrangler/workerd subtree in `finally`, and verifyMetadataBuild rejects
  deterministically (the CLI catch prints ERROR and exits nonzero).
- Trusted test hooks: verifyMetadataBuild({ port, testHooks }) accepts an OPTIONAL
  in-process { fetchImpl, routeFetchTimeoutMs, readinessFetchTimeoutMs,
  readinessTotalMs, readinessIntervalMs }. Production CLI passes none (defaults are
  globalThis.fetch and the production constants). Hooks are never read from env
  vars, CLI args, repository files, HTTP input, or build output, and cannot alter
  metadata policy, route membership, filesystem safety, or JSON-LD decisions.

Deterministic lifecycle regression tests (new tests/metadata-verifier-lifecycle.test.ts,
Node built-ins only, every test with an outer timeout so a regression cannot hang
the runner): A response-header timeout (server never sends headers → real helper
aborts within the bound with the deterministic error); B response-body timeout
(headers + partial body, never ended → body read is also aborted within the bound —
this fails if the timer were cleared after headers alone); C full-verifier route
timeout (real verifyMetadataBuild against the built local worker with a trusted hook
that stalls exactly one rendered route → deterministic rejection identifying the
route, no hang); D cleanup + port closure (explicit free port; after the timeout the
Wrangler/workerd listener is gone and the port is reusable; unrelated processes are
not touched); E readiness attempt timeout (a never-completing probe is bounded per
attempt and overall). All five pass. (A loopback HTTP server with tracked-and-
destroyed sockets is used for A/B; a known Node test-runner interaction with an
aborted fetch over a raw silent TCP socket is avoided by using a real HTTP
connection that is explicitly torn down.)

Body reads remain within the timeout; normal rendered output is unchanged. The
timeout correction touches only the verifier script and its new test — it alters no
HTML, JSON-LD, robots, sitemap, route membership, or response bodies.

Package script wiring: added test:metadata-verifier-lifecycle (Node test convention)
and integrated it into `pnpm run check` after the metadata source tests and before
the existing suites / Package C verifiers / normal metadata build verifier (order:
astro build → static checks → metadata source tests → metadata verifier lifecycle
tests → existing suites → Package C verifiers → normal metadata build verifier).
No existing check removed or weakened. No dependency added; pnpm-lock.yaml
byte-identical.

Validation (pnpm 10.34.5, node v22.22.2; pnpm install --frozen-lockfile passes):
test:metadata-contract 26/26 (unchanged); test:metadata-verifier-lifecycle 5/5;
test:semantic-flow 21/21; normal verify:metadata-build 1077/1077 on a fresh build
(no new verifier check added — lifecycle coverage lives in the separate test file —
so the total is unchanged and normal local routes never time out); check:astro
0 errors / 0 warnings (45 files); check:ts clean; Package C unchanged and passing
(test:indexing-discovery 231 passed / 0 failed / 1 skipped, verify-indexing-discovery-
build 152/152, verify-public-surface-map 18/18); test:contracts 48/48,
test:runtime 55/55, test:retention 16/16, test:orchestration 29/29, test:workflow
42/42, test:security-resilience 124/124. Full `pnpm run check` exit 0; no leftover
Wrangler/workerd afterward. Two fresh clean builds are byte-identical (rendered
<head>+JSON-LD for all 43 route classes, robots.txt, sitemap-index.xml,
sitemap-0.xml), and the v2 rendered dump is byte-identical (same SHA-256) to the v1
rendered dump — confirming the timeout change produced no rendered-output
difference. Dynamic ports, elapsed times, timeout diagnostics, and process IDs never
enter rendered output. git diff --check clean; nothing staged; no tracked dist;
pnpm-lock.yaml unchanged.

Accumulated Package D scope relative to 63caafc is exactly eight files:
AGENT_WORKLOG.md, package.json, scripts/verify-metadata-build.mjs,
src/layouts/BaseLayout.astro, src/lib/publicMetadata.ts, tests/metadata-contract.test.ts,
tests/metadata-verifier-lifecycle.test.ts, tests/semantic-flow-source-entries.test.ts.
Round-2 edits were limited to exactly four files: AGENT_WORKLOG.md, package.json,
scripts/verify-metadata-build.mjs, tests/metadata-verifier-lifecycle.test.ts.
BaseLayout.astro, publicMetadata.ts, metadata-contract.test.ts, and the semantic-flow
test were not modified in round 2; the typed metadata contract, route policy, titles,
descriptions, JSON-LD semantics, language/canonical/robots policy, genre values,
inert-frontmatter protection, special-route behavior, and Package C route membership
are all preserved.

Status: all changes remain LOCAL, UNSTAGED, UNCOMMITTED, and UNPUSHED. No PR, merge,
deployment, GitHub/Cloudflare/DNS/secret/ruleset/branch-protection change, external
action, or Package E work occurred. Superseding v2 review artifacts
(mwe-site-package-d-metadata-contract-v2.patch and its manifest) were exported.

Unresolved questions: None.
Risks or assumptions: The lifecycle cleanup/port-closure guarantee is asserted on
this Linux environment (killTree walks /proc); no cross-platform lifecycle guarantee
is claimed beyond what is tested. The full-verifier lifecycle tests build the SSR
dist on demand when absent (the check chain builds first, so no rebuild occurs there).

### 2026-07-24 — Claude Code — provenance-governance-changes

Agent: Claude Code
Task: Apply two approved changes from exact inline content: add narrowly scoped `.gitattributes` line-ending rules for the public-surface runtime artifacts, and add a public deployment-provenance governance document.
Files changed:
- .gitattributes (new) — three `-text` rules preserving byte identity for src/data/public-surface-authority-map/runtime-manifest.json, last-known-good.json, and runtime-snapshots/*.json. No matched JSON file was modified or renormalized.
- docs/deployment-provenance.md (new) — public governance summary of deployment provenance for the public website, status `PARTIALLY VERIFIED`, created verbatim from the approved content.
Build / tests run: pnpm install --frozen-lockfile (Linux, node v22.22.2, pnpm 10.34.5); full `pnpm run check` passed on both Phase 1 and Phase 2; public-surface byte-identity verifier `pnpm run verify:public-surface-map` passed all 18 checks; git diff --check clean.
Result: Two separate commits — 1c68e3c (.gitattributes) and 06a344a (docs/deployment-provenance.md) — pushed to branch claude/apply-approved-changes-970d2z. GitHub Actions runs 30106711488 (Phase 1) and 30107106458 (Phase 2) both completed successfully. PR #84 remains open and unmerged. No deployment or production change was claimed or performed.
Unresolved questions: None.
Risks or assumptions: Governance status is recorded as-is (`PARTIALLY VERIFIED`) and not reinterpreted; no operational identifiers or private deployment evidence are included; production deployment provenance is not claimed as verified.

### 2026-07-25 — Claude Code — phase-2a-d3-authority-foundation

Agent: Claude Code
Task: Phase 2A — replace the manually positioned native DOM/SVG map layout of the Public Surface and Authority-Ceiling Map with a D3-backed, deterministic grouped Authority View. Rendering and layout only; no semantic, snapshot, or contract change.
Files changed:
- package.json — added `d3-selection` 3.0.0 (dependency) and `@types/d3-selection` 3.0.11 (devDependency, exact pin); added `test:authority-layout` script and wired it into `check`.
- pnpm-lock.yaml — resolves exactly those two packages; both have zero transitive dependencies.
- src/lib/public-surface-authority-map/d3AuthorityLayout.ts (new) — pure deterministic layout module (no DOM, no D3, no browser API, no time, no randomness). Lexical group ordering, name-then-id node ordering, fixed uniform node geometry, label shortening, responsive column policy, and a pure navigation-only routing-edge selector.
- src/lib/public-surface-authority-map/d3AuthorityRenderer.ts (new) — D3 (`d3-selection` only) SVG renderer. Owns the data join for group regions, routing lines, and nodes; adds no geometry or semantics of its own. All text via `textContent`.
- src/components/publicSurfaceAuthorityMap.client.ts — integration only: single SVG surface instead of absolutely positioned HTML buttons; layout and routing delegated to the pure module; activation transaction reduced to seven stages and adapted to capture/restore the SVG child nodes verbatim; responsive re-layout on resize.
- src/components/PublicSurfaceAuthorityMap.astro — template: one `[data-psam-map-svg]` surface plus the existing no-JS fallback paragraph and a new empty-view notice and keyboard/scroll hint; legend gained a selected-state row and an explicit color-encoding note; styles rewritten for SVG rendering; map/detail stacking breakpoint raised to 1023px; reduced-motion rule broadened.
- scripts/verify-public-surface-map-build.mjs — new check 19 enforcing the Phase 2A D3 boundary (locally bundled d3-selection, no CDN/remote ESM, no force/drag/zoom/hierarchy/geo module, no canvas/WebGL, no eval/new Function, no HTML writing of metadata in the Phase 2A sources).
- tests/public-surface-authority-map/d3AuthorityLayout.test.ts (new) — 45 focused tests: determinism, lexical group and node ordering, one position per visible node, no position for filtered nodes, no generated node or edge, finite non-negative coordinates, no node or group overlap, valid layouts for every grouping choice, empty-result safety, the adopted 30-node/161-edge dataset, navigation-only routing, and the no-force/centrality/rank/similarity boundary.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `corepack enable`; `corepack prepare pnpm@10.34.5 --activate`; `pnpm install --frozen-lockfile`; `pnpm run test:authority-layout` (45/45); `pnpm run test:contracts` (52/52); `pnpm run test:runtime` (55/55); `pnpm run test:security-resilience` (124/124); `pnpm run build`; `pnpm run check:ts`; `pnpm run verify:public-surface-map` (19/19); `pnpm run check` (exit 0, 0 failures). Preview verified against the built `dist/` in headless Chromium at 1440 / 834 / 375 px: 30 nodes, 6 group regions, 0 node or region overlaps, no page-level horizontal overflow, no console errors, complete 30-row fallback table, all five boundary statements present, selected-node routing 35 edges, global routing 161 edges with the density warning visible, reset restoring the initial deterministic view.
Result: Branch `fable/phase-2a-d3-authority-foundation` off `main` at ec12706. Draft PR only; not marked ready and not merged.
Unresolved questions: None. Phase 2B (detailed zoom, pan, advanced mobile navigation) remains separate and unimplemented.
Risks or assumptions: Node accessibility is implemented directly on the SVG nodes (`role="button"`, `tabindex="0"`, Tab focus, Enter and Space activation, visible focus ring, per-node accessible label and full-name title); the complete server-rendered record table remains the authoritative no-JavaScript representation. `d3-selection` ships an unused `selection.html()` accessor on its selection prototype, which is not tree-shakeable and therefore appears in the browser bundle; no map code calls it, and verifier check 19 asserts that the Phase 2A sources contain no HTML-writing API. Snapshot identity, counts, manifest, retained snapshots, semantic contract, runtime-loader security model, and currentness claim are unchanged.

### 2026-07-25 — Claude Code — phase-2a-determinism-fix

Agent: Claude Code
Task: Address the independent review blocker on PR #88 — the Phase 2A layout comparator was not locale-independent. Replace it with a stable UTF-16 code-unit comparator so the same validated snapshot produces the same layout in every JavaScript environment.
Files changed:
- src/lib/public-surface-authority-map/d3AuthorityLayout.ts — `compareText()` now returns `0` for equal strings and otherwise `a < b ? -1 : 1`, using only the relational operators the language specifies over code units. The prior implementation called `a.localeCompare(b)` first and only fell back to a code-unit tiebreak when that returned zero, so any nonzero collation result passed straight through and varied with browser, OS, Node version, ICU build, or default locale. `compareNodes()` is unchanged in contract: document name first, node ID as the exact tiebreak, both through the code-unit comparator. Module header and comparator/grouping/layout comments updated to state code-unit ordering and no host-locale dependency.
- tests/public-surface-authority-map/d3AuthorityLayout.test.ts — 11 new tests (45 → 56) using the explicit fixture `"Z"`, `"_"`, `"a"`, `"Ä"` with the expected order hand-written as a literal, never computed with the implementation under test: code-point assertion; fixture sorting from several permutations; 21 hand-written pair expectations; reflexivity/antisymmetry/transitivity; a stub test that replaces `String.prototype.localeCompare` and `Intl.Collator` with wrong, call-counting implementations and proves zero calls and unchanged results; group ordering; node-name ordering; node-ID tiebreak; fixture and real-dataset reversed/shuffled inputs serializing identically; and a raw-source assertion that the layout module contains no collation or locale API. The pre-existing group-order test no longer derives its expectation from `compareText` — the adopted snapshot's group keys are now written out as literals for all three grouping fields.
- AGENT_WORKLOG.md — this entry.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm run test:authority-layout` (56/56); `pnpm run check:ts` (clean); `pnpm run check` (exit 0, zero FAIL lines, all suites and all three verifiers passing, including `verify-public-surface-map` 19/19 unmodified). Regression-checked the new tests by temporarily reinstating the old comparator: 8 of them fail, confirming they are not vacuous. Built output re-probed in headless Chromium at 1440 / 834 / 375 px: 30 nodes, 6 group regions, 0 overlaps, identical SVG dimensions, no page overflow, 30 fallback rows, all boundary statements present, no console errors.
Observable ordering delta on the adopted snapshot: group-key order is identical under both comparators for all three grouping fields. Exactly one adjacent node pair reorders — "Summary Contract" now precedes "Summary and Interpretation Boundaries" (code unit `C` U+0043 before `a` U+0061), where collation had ordered them case-insensitively. This affects the one group containing them under each grouping (`boundary_document`, `repository_boundary_only`, `public_boundary_document`). No geometry rule, metric, spacing value, routing behavior, or accessibility behavior changed.
Result: Commit on the existing branch `fable/phase-2a-d3-authority-foundation`. PR #88 remains open and draft; not marked ready, not merged.
Unresolved questions: `src/components/PublicSurfaceAuthorityMap.astro` (server-rendered record-table row order and filter-option order) and `distinctValues()` in `src/components/publicSurfaceAuthorityMap.client.ts` still use `localeCompare`. They are outside the correction's stated scope, which forbids changing the component template and limits changes to the layout module, its test, and this worklog. They do not affect layout determinism — map geometry is derived solely from the pure layout module. Reported for the repository owner to decide whether a follow-up should align them.
Risks or assumptions: The correction necessarily changes rendered node order wherever collation and code-unit order disagree; the exact delta for the adopted snapshot is enumerated above and is the intended consequence of removing the environment dependency. Snapshot identity, counts, manifest, retained snapshots, semantic contract, runtime loader, fallback, currentness claim, dependency versions, package and lockfile, renderer behavior, template, and CSS are all unchanged.

### 2026-07-25 — Claude Code — phase-2a1-ordering-alignment

Agent: Claude Code
Task: Phase 2A.1 — resolve the unresolved question left by the `phase-2a-determinism-fix` entry above. Phase 2A made the D3 Authority View order by a locale-independent UTF-16 code-unit comparator, but three ordering paths still ran through the host collation: the server-rendered record-table row order, the server-rendered filter-option order, and the client runtime filter-option order. Point all three at the same shared comparators so the map, the record table, and every filter option agree in every JavaScript environment. Ordering only; no Phase 2B work.
Files changed:
- src/components/PublicSurfaceAuthorityMap.astro — frontmatter only. Imports `compareNodes` and `compareText` by name from `../lib/public-surface-authority-map/d3AuthorityLayout.ts`; `tableNodes` now sorts with `compareNodes` (was `(a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)`) and `distinctValues()` now sorts with `compareText` (was `(a, b) => a.localeCompare(b)`). No comparator is reimplemented locally. Displayed records, fields, labels, table columns, filtering semantics, canonical links, markup, prose, and CSS are untouched.
- src/components/publicSurfaceAuthorityMap.client.ts — `compareText` added to the existing `d3AuthorityLayout.ts` import; `distinctValues()` now sorts with `compareText` (was `(a, b) => a.localeCompare(b)`). Runtime activation, the atomic activation/rollback transaction, filter values, selected-node behavior, routing, layout, and accessibility behavior are unchanged; `prepareActivation()` already sorted table rows with `compareNodes`.
- tests/public-surface-authority-map/d3AuthorityLayout.test.ts — 12 new tests (56 → 68) in a new section "13. Phase 2A.1: one ordering comparator across every visible surface". Source-level contracts: the component frontmatter really was extracted (guards the scans from matching an empty string); the record-table sort is `compareNodes`; the option sort is `compareText`; the client `distinctValues()` sort is `compareText`; both components import the shared comparators by name, define no local copy, and every `.sort(...)` in either file names one of the two; and none of the four production ordering paths (component, client, layout module, renderer) contains `.localeCompare(`, `Intl.Collator`, `Intl.`, a navigator/document language read, or a `toLocale*` call. Behavioral: a six-record fixture over `"S"`/`"Z"`/`"_"`/`"a"`/`"Ä"` (code units 83/90/95/97/196, where collation disagrees) with two records deliberately sharing one name to exercise the node-ID tiebreak, checked from three fixed permutations, asserting that the option list, the record table, the map's group columns, and the map's node rows all match hand-written literal expectations and that each group's rows are the record-table order restricted to that group; the adopted snapshot's 30-name table order and all four option lists as literals; group columns matching the option order for all three grouping fields; and the 30-node/161-edge dataset. Every expectation is written out, none produced by a comparator.
- AGENT_WORKLOG.md — this entry.
Not changed: `d3AuthorityLayout.ts` (no type export was needed — `compareText`/`compareNodes` were already exported), `d3AuthorityRenderer.ts`, snapshot files, runtime manifest, bundled fallback, semantic contract, runtime loader, CSS, geometry metrics, `package.json`, dependency versions, `pnpm-lock.yaml`, workflows, and the source repository.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm install --frozen-lockfile`; `pnpm run test:authority-layout` (68/68); `pnpm run check:ts` (clean after the build generates `.astro/types.d.ts`); `pnpm run check` (exit 0 — `astro build`, `astro check` 48 files / 0 errors, all eleven test suites, `wrangler deploy --dry-run`, `verify:public-surface-map` 19/19 unmodified, `verify:indexing-discovery-build`, `verify:metadata-build` 1077/1077). Regression-checked the new tests by reinstating each `localeCompare` form one at a time: each reversion fails three of them, so none is vacuous. Built `dist/public-surface-map/interactive/index.html` re-probed directly: 30 table rows in exact code-unit order, and all four rendered option lists unchanged.
Observable delta: filter-option order is byte-identical before and after for all four fields — the adopted snapshot's metadata values happen to order the same way under both comparators. The record table reorders exactly one adjacent pair: "Summary Contract" now precedes "Summary and Interpretation Boundaries" (code unit `C` U+0043 before `a` U+0061). That is the alignment itself — the map has ordered that pair this way since the Phase 2A determinism fix, so the table now agrees with it instead of contradicting it. Map geometry, SVG dimensions, group columns, node rows, routing, selection, and accessibility are unchanged, as the layout module was not touched.
Result: Branch `opus/phase-2a1-ordering-alignment` off `main` at 8c78d168b4016ede40478c698422d655350f8aac (verified equal to the expected base SHA before editing). One focused commit. Draft PR only; not marked ready and not merged.
Unresolved questions: The branch name in the task instruction (`opus/phase-2a1-ordering-alignment`) differs from the branch the session harness pre-created (`claude/phase-2a1-ordering-alignment-lrpqgx`); the explicit instruction was followed. No other open question — the follow-up flagged by the previous entry is now closed.
Risks or assumptions: The one-pair table reordering is the intended consequence of removing the host-collation dependency from the server-rendered surface, not an incidental side effect; it is enumerated above rather than described as "no visible change". The client module cannot be imported under the Node test runner (it installs DOM listeners at module scope) and the Astro component cannot be rendered there, so their ordering contracts are asserted at source level and paired with behavioral tests over the exact expressions they now use. Snapshot identity, byte length, SHA-256, Git blob, counts, manifest, retained snapshots, semantic contract, runtime loader security model, currentness claim, dependencies, lockfile, and CSS are all unchanged. Phase 2B — zoom, pan, drag, force simulation, advanced mobile navigation, Model Atlas, Combined View, Reading Paths — was not started.

### 2026-07-25 — Claude Code — phase-2b1-viewport-navigation

Agent: Claude Code
Task: Phase 2B-1 — add bounded, accessible viewport navigation to the existing deterministic 30-node D3 Authority View. Viewport transformation only; the deterministic content layout must keep producing exactly the same groups, node order, node coordinates, canvas dimensions, and routing-edge subsets. No Model Atlas, no Combined View, no Reading Paths, no Phase 2B-2 cross-node keyboard navigation, no node or relation added.
Files changed:
- src/lib/public-surface-authority-map/d3AuthorityViewport.ts (new) — pure viewport module (no DOM, no D3, no browser API, no time, no randomness, no storage). Owns the bounded scale extent (0.5 / 2.5, multiplicative 1.25 step, 4-decimal rounding grid), the exact identity transform, scale clamping and the zoom ladder, the whole-percent interface label, the rendered-content extent (from the currently rendered group regions only), fit-to-visible-content, the drawing surface (SVG width/height/viewBox plus one containing-group transform), content-rectangle projection, verbatim group/node lookup, and four bounded one-axis position helpers (clamp, centre, anchor-across-resize, bring-into-view-if-needed). Computes no importance, hierarchy, authority, centrality, similarity, rank, model family, relation, Registry status, or currentness, and never reads the snapshot's edges.
- src/lib/public-surface-authority-map/d3AuthorityRenderer.ts — group regions, edges, and nodes now render inside ONE containing `g.psam__layer--viewport`, which alone carries the transient transform; the SVG box comes from the viewport surface. Node/group/edge geometry, label shortening, data joins, accessibility attributes, and keyboard activation are unchanged. `ensureLayer()` generalized to any SVG parent. `clear()` changed from `root.selectAll("*").remove()` to `root.selectChildren().remove()` — see "Pre-existing defect" below.
- src/components/publicSurfaceAuthorityMap.client.ts — wires the native viewport controls to the pure module, holds the transient scale, keeps the group-jump options in the current deterministic group order, syncs the zoom label and the center-selected disabled state, resets the viewport to identity on grouping/filter change, on complete Reset view, and on a verified runtime activation, and leaves it untouched on selection and routing toggles. Extends the activation capture/restore with scale, surface, both scroll offsets, zoom label, center-button state, and group-jump options. Adds one `focusin` listener that brings a focused off-screen node into view without announcing or changing selection.
- src/components/PublicSurfaceAuthorityMap.astro — new hidden-until-JavaScript "Viewport navigation" panel inside the map region: five native buttons, a labelled group-jump `<select>`, the zoom percentage marked as interface state, and a new viewport boundary statement. CSS for wrapping rows, >= 44 CSS pixel tap targets, and disabled buttons. No existing prose, boundary statement, navigation, route, or record markup changed.
- tests/public-surface-authority-map/d3AuthorityViewport.test.ts (new) — 53 tests over the real module and the real adopted snapshot, plus source-level contracts for the client wiring (the client installs DOM listeners at module scope and cannot be imported under the Node test runner). Covers all 18 required proofs.
- scripts/verify-public-surface-map-build.mjs — new check 20 (viewport markers present in the bundle; approved D3 dependency surface unchanged; no storage/URL/history/cookie/telemetry/service-worker persistence; no excluded D3 module or symbol; no gesture handler; no HTML-writing path; native control labels and the control group's accessible name present in the generated route). Check 19(e) additionally scans the new viewport module. Checks 1-19 otherwise unchanged and unweakened.
- package.json — `test:authority-viewport` script added and wired into `check`. No dependency added or changed.
- AGENT_WORKLOG.md — this entry.
Not changed: runtime-manifest.json, last-known-good.json, everything under runtime-snapshots/, fallback.ts, contract.ts, runtimeLoader.ts, runtimeManifestContract.ts, byteIdentity.ts, d3AuthorityLayout.ts, source metadata, snapshot identity and counts, candidate-generation workflow, source repository, pnpm-lock.yaml, navigation, routes, canonical URLs, and every unrelated page.
Dependency impact: zero packages added, removed, or changed. `d3-zoom` was evaluated and rejected: it pulls in d3-drag, d3-transition, d3-interpolate, d3-color, d3-ease, d3-timer, and d3-dispatch; it binds wheel/dblclick/touch gestures by default, which this phase must constrain rather than adopt; and the repository's existing boundary test and build verifier assert that no d3-zoom / d3-drag module and no zoomTransform / zoomIdentity / dragDisable symbol reaches the sources or the bundle. Implementing the bounded transform arithmetically keeps those checks intact instead of weakening them. Browser bundle: 50576 -> 56322 bytes raw (+5746), 15538 -> 17408 bytes gzip (+1870).
Viewport behavior: bounded scale extent 0.5-2.5, identity 1.0, multiplicative 1.25 step. Initial state is the exact identity transform; the SVG then carries the layout's own width, height, and viewBox and the containing group carries `translate(0,0) scale(1)`. Zoom buttons keep the visible centre stable across the surface resize. Reset returns exactly to identity and to the start of both axes. Fit is `min(visible width / rendered content width, 1)` clamped into the extent — at the measured 810 px desktop map column against the 1712 px content that clamps to the 50% readable floor, which is the bound working as specified rather than a failure to fit. Center-selected and group-jump change viewport position only. Grouping and filter changes, complete Reset view, and a verified runtime activation all reset to identity; selection and routing toggles never do. No pointer, wheel, or touch gesture handler is installed at all, so ordinary wheel scrolling, one-finger vertical scrolling, and browser page zoom are untouched and every operation is reachable from a native labelled control. Nothing is persisted: no storage, URL parameter, cookie, history entry, analytics, or telemetry.
Pre-existing defect found and fixed: `renderer.clear()` used `root.selectAll("*").remove()`, which removes every descendant individually and therefore emptied the very layer elements the activation-rollback capture holds. Probed on the base commit build (19f25e9) and on this branch before the fix: after an injected activation-stage failure the model, detail panel, record table, provenance, and controls restored correctly but the SVG came back with 0 nodes and 0 group regions. Since Phase 2B-1 requires a failed activation to restore SVG content along with the viewport, `clear()` now removes direct children only, leaving each removed layer's subtree intact. Re-probed after the fix: 30 nodes, 6 group regions, and the selected node's `aria-pressed` all restored. A CI-level regression test pins this.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `corepack enable`; `corepack prepare pnpm@10.34.5 --activate`; `pnpm install --frozen-lockfile`; `pnpm run test:authority-viewport` (53/53); `pnpm run test:authority-layout` (68/68, unmodified); `pnpm run test:contracts` (52/52); `pnpm run test:runtime` (55/55); `pnpm run test:security-resilience` (124/124); `pnpm run build`; `pnpm run check:ts` (clean); `pnpm run verify:public-surface-map` (20/20); `pnpm run check` (exit 0, zero FAIL lines, all suites and all three verifiers). Environment-assisted browser verification (headless Chromium via the environment's GLOBAL Playwright — NOT a project dependency; package.json and pnpm-lock.yaml untouched; harness kept outside the repository) over a same-origin static server on the built `dist/`: 25/25 checks pass, including an A/B comparison of every node transform, group region, SVG width/height/viewBox against a baseline `dist/` built from the base commit at 1440 / 834 / 375 px (byte-identical at identity), the zoom ladder, reset, fit, node click and Enter/Space activation, centering without selection change, group jump across all six groups, edge endpoints coinciding with node centres at 125% / 100% / 80%, viewport reset on filter and grouping change, viewport held across selection and routing toggles, focus bringing an off-screen node into view without selecting it, no page-level horizontal overflow at any zoom level, no node overlap, tap targets >= 44 px and no clipping at 834 px and 375 px, vertical page scrolling available, verified runtime activation leaving an exact identity viewport, an injected activation-stage failure restoring the exact captured viewport and SVG content, and zero console or page errors. Eight screenshots captured and visually inspected at the three widths.
Result: Branch `opus/phase-2b1-viewport-navigation` off `main` at 19f25e9eaa02dac95ed91a160ff27fd4507cc071 (verified equal to the expected base SHA before editing). One focused commit. Draft PR only; not marked ready and not merged. Production unchanged until a separately authorized merge.
Unresolved questions: The branch name in the task instruction (`opus/phase-2b1-viewport-navigation`) differs from the branch the session harness pre-created (`claude/meta-writing-phase-2b1-viewport-zxzcr8`); as in the previous entry the explicit instruction was followed, and the identical commit was pushed to both names so neither is left behind. Whether "Fit visible content" should be allowed below the 50% readable floor at desktop, where the 1712 px content cannot fit the 810 px map column above that bound, is a bounded-range decision left to the repository owner; the current behavior clamps and the map continues to scroll as it did in Phase 2A.1.
Risks or assumptions: The viewport is transient interface state and never enters metadata, snapshot identity, semantic classification, authority status, routing semantics, data validation, or runtime currentness. Above the identity scale the map surface grows with the content so the existing bounded map scroller reaches all of it and the page becomes taller; below it the surface shrinks and the smaller drawing is centred. No third-party zoom behavior, force simulation, drag, hierarchy, ranking, similarity, or inferred relation was introduced. Snapshot identity, byte length, SHA-256, Git blob, counts, manifest, retained snapshots, semantic contract, authority ceilings, relation status, Registry status, runtime-loader security model, currentness claim, dependencies, and lockfile are all unchanged. Phase 2B-2, Phase 3, and Phase 4 were not started.

### 2026-07-25 — Claude Code — phase-2b1-accessibility-and-fit-status

Agent: Claude Code
Task: Address the two independent-review blockers on PR #90 (Phase 2B-1). (1) The 0.5 minimum scale violated the accessibility boundary: everything inside the viewport group scales, so a 64 px deterministic node box fell to a 32 px activation area and the three label sizes fell to roughly 0.4rem / 0.39rem / 0.36rem. (2) "Fit visible content" announced "Fitted the visible map content at 50%." even when the clamped scale still left the drawing wider than the viewport, so the announcement was inaccurate. One additional focused commit on the existing branch `opus/phase-2b1-viewport-navigation`; no new branch, no merge, no Phase 2B-2.
Files changed:
- src/lib/public-surface-authority-map/d3AuthorityViewport.ts — `VIEWPORT_SCALE.MIN` raised from `0.5` to `0.8`; identity `1`, maximum `2.5`, and step `1.25` unchanged, so the downward ladder is now 100% then 80% and holds at 80% (0.8 is exactly one multiplicative step below identity). The bounds comment was rewritten to state the floor as an accessibility floor with the arithmetic spelled out (64 x 0.8 = 51.2 CSS px activation box; 0.8/0.78/0.72rem labels become 0.64/0.624/0.576rem) and to record why 0.5 was rejected; the old "0.5 x 0.8rem is the smallest step this map is verified at" claim is gone. `fitScale()` was replaced by `fitViewport()` returning an explicit `FitViewportResult { scale, requiredScale, fullyFits, atReadableMinimum }`: `requiredScale` is the unconstrained scale a complete fit would need (never clamped up to the floor), `scale` is the bounded scale actually applied, and `fullyFits` is MEASURED from the applied scale against the rendered content on every constrained axis rather than inferred from a scale having been produced. An unmeasured visible box fails closed (`fullyFits: false`), so no fit is ever claimed that was not verified. New pure `describeFitOutcome()` builds the announcement, so the wording is directly testable.
- src/components/publicSurfaceAuthorityMap.client.ts — `fitVisibleContent()` now takes both the applied scale and the announcement from the pure fit result (`viewportScale = outcome.scale; announce(describeFitOutcome(outcome))`). The hand-rolled "Fitted the visible map content at X" template is gone from the client. The zoom indicator is still fed from the applied scale, so a clamped fit displays 80% rather than the unreachable 47%.
- tests/public-surface-authority-map/d3AuthorityViewport.test.ts — 53 -> 61 tests. New/updated: `VIEWPORT_SCALE.MIN === 0.8` plus the floor being exactly one step below identity; an accessibility test that states the 44 CSS px tap target and the 64 CSS px node box as HAND-WRITTEN constants (never read from the modules under test), asserts 64 x 0.8 = 51.2 >= 44, asserts the three scaled label sizes as literals, and asserts that the rejected 0.5 floor really did violate the requirement so the check is not vacuous; a sweep proving no clamp, zoom-in, zoom-out, surface, or fit operation can produce a scale below the floor from any candidate including NaN and infinities; the zoom-out ladder holding at 80%; the percentage label clamping anything under the floor before display; explicit `fullyFits` true/false outcomes for the mobile, desktop, tablet, measured-810 px-column, bounded-height, and unmeasured cases with hand-written `requiredScale` values (0.4731 for the 810 px column, 0.4871 for tablet, 0.8411 for 1440 px); a test that a clamped outcome's announcement never matches /fitted/i, does say "remains horizontally scrollable", reports 80% and not 47%; a test that a genuine fit announces the completed fit; a test that the degenerate unmeasured outcome overclaims neither a fit nor the readable minimum; and a client wiring contract that fit applies `outcome.scale` and announces `describeFitOutcome(outcome)` with no hand-rolled wording left. Regression-checked by reverting MIN to 0.5: 8 tests fail, so none is vacuous.
- AGENT_WORKLOG.md — this entry.
Not changed: deterministic layout coordinates, node/group geometry, edge endpoints, label CSS, routing, selection, grouping, filtering, runtime validation, rollback behavior (including the renderer direct-child teardown fix from the previous commit), snapshot identity, CSS, dependency surface, lockfile, the no-JavaScript fallback, `PublicSurfaceAuthorityMap.astro` (no wording correction was needed — the markup never quoted a scale value), and `scripts/verify-public-surface-map-build.mjs` (it asserts no minimum-scale value, so no update was required).
Final bounds and ladder: minimum 0.8, identity 1, maximum 2.5, step 1.25. Zoom in: 125% / 156% / 195% / 244% / 250%, saturating. Zoom out: 80%, then holding at 80%.
Announcements: genuine fit -> `Fitted the visible map content at <percent>. Navigation only.`; blocked by the floor -> `Reduced the map to the minimum readable zoom of <percent>. The complete map remains horizontally scrollable. Navigation only.`; unmeasured degenerate case -> `The map viewport is at <percent>. The complete map remains horizontally scrollable. Navigation only.` The word "Fitted" appears only when the complete rendered content genuinely fits.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm run test:authority-viewport` (61/61); `pnpm run test:authority-layout` (68/68, unmodified); `pnpm run check:ts` (clean); `pnpm run build`; `pnpm run verify:public-surface-map` (20/20); `pnpm run check` (exit 0, zero FAIL lines). Environment-assisted browser verification (headless Chromium via the environment's GLOBAL Playwright — not a project dependency; harness outside the repository) against the built `dist/` and a rebuilt Phase 2A.1 baseline `dist/`: 27/27 checks pass, up from 25 with two new accessibility checks. Measured at the floor at all three widths: node activation box 188.8 x 51.2 CSS px (identity 236 x 64) and computed label sizes 10.24 px node / 9.98 px group / 9.22 px group-count (identity 12.8 / 12.48 / 11.52). A second zoom-out at 80% does not reduce further; nodes stay clickable and Enter-activatable at the floor; the 810 px desktop map column reports `required 0.4731, applied 80%, fullyFits=false` and the announcement is the bounded-result wording with horizontal scrolling verified to actually remain; routing stays aligned at 125% / 100% / 80%; no page-level horizontal overflow; mobile vertical page scrolling usable; runtime activation and rollback still correct; zero console or page errors.
Result: One additional commit on `opus/phase-2b1-viewport-navigation` (previous head 0517b8d06d232480e8ac29b3b8e3b7ef175817c7). PR #90 left open, draft, and unmerged.
Unresolved questions: None. The bounded-range question the previous entry left open is now closed by the reviewer's decision: the floor is 0.8 and a fit that cannot be completed above it is announced as such rather than reported as a fit.
Risks or assumptions: Raising the floor means the six-column desktop layout can no longer be reduced to fit an 810 px map column at all; that is the intended consequence of the accessibility boundary, and the map region keeps scrolling horizontally exactly as it did in Phase 2A.1. `fitScale()` was removed rather than kept as an alias, so no caller can obtain a bare scale and infer success from it. No semantic, snapshot, dependency, or Phase 2B-2 change occurred.

### 2026-07-25 — Claude Code — phase-2b2-spatial-keyboard-navigation

Agent: Claude Code
Task: Phase 2B-2 — add an optional, deterministic spatial keyboard shortcut layer that moves FOCUS between currently rendered SVG nodes according to their existing deterministic visual positions. Navigation only. No Model Atlas, no Combined View, no Reading Paths, no node or edge added, no relation traversed, no merge.
Base identity: resolved `origin/main` before editing and confirmed it equals the expected base SHA `84e5c5af85fac81ae1df6dbf7164082bd1fe250a`.
Files changed:
- src/lib/public-surface-authority-map/d3AuthorityKeyboardNavigation.ts (new) — pure resolver (no DOM, no D3, no browser API, no time, no randomness, no storage, no mutation). Defines the four supported directions, maps exactly the four arrow key values to a direction, and resolves a target node id from the deterministic layout's own `bandIndex` / `columnIndex` / `rowIndex` and from nothing else. Its declared parameter surface is `{ id, bandIndex, columnIndex, rowIndex }` only, so no snapshot edge, relation type, metadata field, viewport value, or selection value can reach the algorithm. Its only import is the shared code-unit comparator `compareText` from the layout module, used solely as an exact final tiebreak for a degenerate input; no collation API, no host locale, no pixel measurement, no DOM order.
- src/components/publicSurfaceAuthorityMap.client.ts — one added `keydown` listener on the map SVG. It ignores the event when Ctrl, Meta, or Alt is held (Shift is never consulted, so it cannot alter the target), ignores any key that is not one of the four arrows, and ignores focus that is not on a rendered `.psam__node`. For a recognized unmodified arrow with focus inside a node it calls `preventDefault()` (suppressing arrow scrolling even at a boundary no-op), then delegates: read the focused `data-id`, call the pure resolver against `currentLayout.nodes`, focus the returned renderer element with `preventScroll: true`, and reuse the existing Phase 2B-1 `ensureNodeVisible()` reveal. The complete algorithm is NOT inlined in the listener. The listener holds no state, announces nothing, and touches no selection, detail panel, `aria-pressed`, grouping, filter, routing toggle, zoom, or viewport reset.
- src/components/PublicSurfaceAuthorityMap.astro — map-hint wording only. It now states that nodes are reachable with Tab, that arrow keys move focus between visible nodes (up/down within the same visual group column, left/right to the adjacent visual group column), that moving focus does not select a node, that Enter or Space activates the focused node, and that the record table remains available as the complete record. No proximity language ("related", "similar", "connected", "stronger", "more important", higher/lower authority) is used. No other prose, boundary statement, route, control, or record markup changed.
- tests/public-surface-authority-map/d3AuthorityKeyboardNavigation.test.ts (new) — 38 tests over the real resolver, explicit synthetic index fixtures, and the real adopted 30-node snapshot through the real deterministic layout. Every expected node id is hand written from the layout's own published indices; none is produced by the resolver under test. Covers all 25 required proofs.
- tests/public-surface-authority-map/d3AuthorityViewport.test.ts — one Phase 2B-1 assertion updated: the SVG-listener whitelist now reads `["focusin", "keydown"]` instead of `["focusin"]`. The pointer/wheel/touch/dblclick marker list in that same test is unchanged, so it still fails closed on any gesture handler; only the enumeration of the map's own focus/keyboard listeners was widened by the one listener this phase adds.
- scripts/verify-public-surface-map-build.mjs — new check 21. Checks 1-20 are unchanged and unweakened.
- package.json — `test:authority-keyboard` script added and wired into `check`. No dependency added, removed, or changed.
- AGENT_WORKLOG.md — this entry.
Not changed: everything under src/data/public-surface-authority-map/, fallback.ts, contract.ts, runtimeLoader.ts, runtimeManifestContract.ts, byteIdentity.ts, d3AuthorityLayout.ts, d3AuthorityViewport.ts, d3AuthorityRenderer.ts, snapshot and manifest files, source metadata, the source repository, pnpm-lock.yaml, CSS, site navigation, routes, canonical URLs, and every unrelated page.
Directional resolution algorithm: ArrowUp — same `bandIndex`, same `columnIndex`, greatest `rowIndex` smaller than the current row. ArrowDown — same band, same column, smallest `rowIndex` greater than the current row. ArrowLeft — same band, greatest `columnIndex` smaller than the current column, then within that one column the node whose `rowIndex` is closest to the current row, an equal gap resolving to the smaller row index. ArrowRight — same band, smallest `columnIndex` greater than the current column, then the same nearest-row rule. Nothing wraps in any direction: not between bands, not between the first and last node, not from the final group column of one band to the first column of another, and not from the bottom of one group column to another. Every boundary, an unrendered current node, and an empty layout are silent no-ops. The visible-group select remains the explicit cross-group route.
Tab, activation, and accessibility: every rendered node keeps `tabindex="0"`; no roving tabindex, no `tabindex="-1"`, no `aria-activedescendant`. Enter and Space (handled unchanged in the renderer) remain the only keyboard operations that activate a node. Arrow movement does not announce and does not touch `aria-pressed`. The complete 30-row record table remains the authoritative accessible record representation. No screen-reader graph interpretation was added.
Semantic boundary: the visual column and row structure is a transient rendering organization produced by grouping, deterministic code-unit order, and responsive wrapping. Arrow adjacency is therefore not a relation, adjacency claim, similarity, causal direction, hierarchy, sequence, authority, importance, centrality, model family, Registry status, or currentness, and no public claim of conceptual adjacency was added.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `corepack enable`; `corepack prepare pnpm@10.34.5 --activate`; `pnpm install --frozen-lockfile`; `node --test tests/public-surface-authority-map/d3AuthorityKeyboardNavigation.test.ts` (38/38); `pnpm run test:authority-viewport` (61/61); `pnpm run test:authority-layout` (68/68, unmodified); `pnpm run test:contracts` (52/52); `pnpm run test:runtime` (55/55); `pnpm run test:security-resilience` (124/124); `pnpm run build`; `pnpm run check:ts` (clean); `pnpm run verify:public-surface-map` (21/21); `pnpm run check` (exit 0, zero FAIL lines, all suites and all three verifiers). Environment-assisted browser verification (headless Chromium via the environment's GLOBAL Playwright — NOT a project dependency; package.json and pnpm-lock.yaml untouched; harness kept outside the repository) over a same-origin static server on the built `dist/` at 1440 / 834 / 375 px: 101/101 checks pass, including every node reachable and focusable, ArrowUp/ArrowDown moving only within the current visual group column, ArrowLeft/ArrowRight moving only to the adjacent column in the same band, left/right being safe no-ops in the one-column 375 px layout, no band wrapping at any width, focus movement leaving `aria-pressed`, the detail panel, and the selection unchanged, Enter and Space still selecting and still setting `aria-pressed="true"`, Ctrl/Meta/Alt + arrow not moving map focus, Shift + arrow resolving to the identical target, zoom preserved at 100% and at 125%, the newly focused target brought into view, grouping and filtering immediately using the new current layout, navigation confined to rendered nodes under a filter, routing off by default, verified runtime activation and an injected activation-stage rollback both leaving arrow navigation and Enter activation working over a restored 30-node map and 30-row table, no page-level horizontal overflow, usable mobile vertical scrolling, all five persistent boundary statements present, and zero console or page errors. Screenshots captured and inspected at all three widths. Cloudflare preview deployment was NOT inspected: no remote preview was reached from this environment, so the browser results above are local built-output verification only.
Result: Branch `opus/phase-2b2-spatial-keyboard-navigation` off `main` at 84e5c5af85fac81ae1df6dbf7164082bd1fe250a. One focused commit. Draft PR only; not marked ready and not merged. Production unchanged until a separately authorized merge.
Unresolved questions: The branch name in the task instruction (`opus/phase-2b2-spatial-keyboard-navigation`) differs from the branch the session harness pre-created (`claude/phase-2b2-spatial-nav-d0a3vj`); the explicit instruction was followed and the pre-created branch was left untouched rather than mirrored, as the instruction requested. Whether a future phase should offer explicit cross-band keyboard access (rather than the current no-op at a band edge) is an interface decision left to the repository owner; this phase deliberately provides none, because no navigation target is preferable to an implicit structural jump.
Risks or assumptions: One existing Phase 2B-1 test assertion had to be widened by exactly one listener name; its gesture-handler prohibitions were left intact and no other existing check was relaxed. Focus state remains the browser's own focused DOM element — no persistent keyboard-navigation state was introduced, so runtime activation, its rollback, grouping changes, filter changes, and responsive re-layout all leave navigation operating on the current layout with nothing stale to reconcile. Snapshot identity, byte length, SHA-256, Git blob, node and edge counts, edge-type counts, omitted self-references, manifest, retained snapshots, semantic contract, authority ceilings, relation status, Registry status, deterministic content coordinates, viewport scale bounds, routing behavior, runtime-loader security model, currentness claim, fallback table, dependencies, and lockfile are all unchanged. Phase 3 and Phase 4 were not started.

### 2026-07-25 — Claude Code — public-slice-prototype-2026-07-25

Agent: Claude Code
Task: Implement the first CSS-only Public Slice prototype at `/artistic-research/public-slice/2026-07-25/`, following an owner-approved Evidence Freeze Packet and Owner Review Packet. Stop 2 deliverable: local prototype for artistic review only. No merge, no publication, no PR.
Files changed:
- src/pages/artistic-research/public-slice/2026-07-25.astro (new) — standalone route owning its own `<html>`/`<head>`, importing `global.css` directly, declaring `<meta name="robots" content="noindex, nofollow">` in source. Does NOT use BaseLayout, so it needs no `ROUTE_METADATA_REGISTRY` entry and changes no route count. Holds one page-local typed constant of six moments; each moment keeps `observedFact` (grounding, not displayed), `phrase` (displayed), `evidence` (disclosure only) and `boundary` (disclosure only) distinct. `evidence.paths` carries one or two path/URL entries under a single commit SHA and timestamp for the two moments whose fact is a comparison of two files at one commit; this is deliberately NOT generalized into a companion-evidence schema or a repository-wide data model. Page-scoped `<style>` only, reusing existing `--text` / `--muted` / `--line` / `--accent` tokens; adds a focus ring and print styles locally because `global.css` defines neither.
- scripts/lib/indexing-discovery-contract.mjs — one exact normalized path `"/artistic-research/public-slice/2026-07-25/"` added to `SITEMAP_EXCLUDED_PATHS`, with comment. No verifier logic, contract function, threshold, or semantic changed. This is the single authorized shared edit; without it the route enters the sitemap and the independent robots oracle fails the build with SITEMAP_UNEXPECTED_ROUTE.
- AGENT_WORKLOG.md — this entry.
Not changed: src/pages/language-pressure-test-lab-prototype.astro (structural precedent, inspected only, zero lines changed), package.json, pnpm-lock.yaml, global.css, BaseLayout.astro, astro.config.mjs, src/pages/artistic-research.md, site navigation, route-count and metadata-registry tests, all three verify-*.mjs scripts, and every unrelated page. No `src/pages/artistic-research/index.*` was created, so the sibling directory does not trigger ROUTE_AMBIGUOUS_SOURCE against the existing `artistic-research.md`.
Evidence boundary: the six moments are frozen against 2026-07-25 23:59:59 Asia/Taipei (2026-07-25 15:59:59Z). Evidence was frozen after Taipei midnight and inspected at 2026-07-26 00:00:18 +08. `main` of the source repository was unchanged at 933274af9693d6d1d9fac36819aafdf56f9ab81d, with no commit after the cutoff; all eight evidence commits were confirmed reachable from `origin/main` with committer timestamps compared in UTC rather than by displayed calendar date. All nine outbound URLs are fixed-SHA blob links in `metawritingecology/meta-writing-ecology` and were validated by executing the repository's own `isValidGithubSourceUrl`; commit, PR, compare and Actions URL shapes were confirmed to fail and are not used. A public unmerged draft PR touching the same files existed inside the cutoff; it is excluded from the moments and the page discloses that the slice reads `main` only. It is not named on the page.
Counts: client-side JavaScript 0, SVG 0, Canvas 0, new dependencies 0, new permanent tests 0, hydration directives 0, shared semantic changes 0.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm install --frozen-lockfile`; `pnpm run check` (exit 0, 1250 PASS lines, zero FAIL, 769 tests, 0 failures, 1 pre-existing platform skip). The skip is `verifier traversal: a real unreadable nested directory (chmod)`; it was confirmed pre-existing by stashing the change and re-running on the clean tree (231 pass / 1 skip, identical). `verify-indexing-discovery-build` 152/152 and `verify-metadata-build` 1077/1077. Environment-assisted browser verification (headless Chromium via the environment's GLOBAL Playwright — NOT a project dependency; harness kept outside the repository; package.json and pnpm-lock.yaml untouched) against `wrangler dev` on the built output: route returns 200, robots is `noindex, nofollow`, 0 occurrences in `dist/sitemap-0.xml`, no canonical, no JSON-LD, 0 `<script>` / `<svg>` / `<canvas>` elements, exactly one `<details>`, six visible phrases, nine unique GitHub blob links, one internal return link. No page-level horizontal overflow at 360 / 390 / 768 / 1440 px with the disclosure open. Measured authored gaps between the six moments were 22 / 44 / 44 / 44 / 120 px against real intervals of 9.5h / 11d / 6min / 10.9h / 43min, confirming spacing carries no monotonic relation to elapsed time: the widest gap is the second-shortest interval and the eleven-day interval receives an ordinary gap.
Two self-introduced regressions were found during verification and fixed before completion: an interpolated `${REPO}` URL base that the link verifier correctly rejected (all evidence URLs are now complete literals, since the extractor resolves occurrences statically and fails closed on interpolation), and a blanket backtick-to-quote replacement that silently broke `class:list` so it emitted the literal string `is-${moment.spacing}` and neither spacing modifier applied; caught only by inspecting the render, fixed with string concatenation and re-verified in the DOM.
Result: One commit on `claude/public-slice-prototype-decisions-qenoz3`. No pull request opened, nothing merged, nothing published. The route is unreachable from navigation, the sitemap, and search indexing.
Unresolved questions: Two artistic-review questions are deliberately left to the repository owner. (1) Whether the ending reads as an unfixed defect: the closing moment carries no defect language, no label and no call to action, but a reader who assumes the two declared record counts ought to agree could still read a deficiency, and the correction to that assumption sits in disclosure rather than in the main layer. (2) Whether outward traversal is sufficiently integrated: the blob links appear inline within each moment's own evidence entry rather than as a trailing bibliography, but all traversal lives one layer down inside the disclosure. Three phrase-level residuals were also flagged rather than resolved: "four lines changed" is the closest diction in the main layer to a changelog; the small-caps COMMITTED / COMMIT field names in disclosure read slightly machine-emitted; and on very tall viewports the run from the trailing rule to the footer is quiet.
Risks or assumptions: The page is an authored selection, not a complete repository history, changelog, registry, authority layer, activity dashboard or timeline system, and it states this in its framing sentence, its disclosure and its footer boundary statement. Spacing is authored and qualitative and encodes no elapsed time, importance, resistance, severity or causal weight. Presentation phrases are approved for this prototype review only and are not permanent corpus language, a reusable vocabulary or repository-native statuses; no labels are used at all. Repository-authored causal statements are not used in the visible artistic layer, and one such correction appears in disclosure attributed to its commit. No conceptual resonance from `false-legibility.md` or `provenance-validity-separation-model.md` is used, and no claim is made that this case demonstrates, instantiates, validates or adopts an MWE model. Repository mechanics were not promoted into MWE model evidence, chronology was not promoted into causality, and public branch state was not treated as main-branch state. Rollback is deleting one route file and reverting one line.

### 2026-07-25 — Claude Code — public-slice-revision-2026-07-25

Agent: Claude Code
Task: Bounded revision of the Public Slice prototype page at `/artistic-research/public-slice/2026-07-25/`, following owner review of the committed prototype. Owner-approved wording was inserted verbatim; evidence traversal, evidence-layer subject position, and print disclosure were corrected. No redesign, no new case, no scope expansion.
Files changed:
- src/pages/artistic-research/public-slice/2026-07-25.astro — the only file in the revision commit.
Owner-approved language insertion: four owner-supplied strings inserted exactly, without polishing, shortening, expansion, punctuation normalisation, synonym substitution, tense change, or capitalisation change — one orientation line placed before the six moments, and replacement authored phrases for moments 3, 5 and 6. Authored wording for moments 1, 2 and 4 is unchanged. Earlier agent-authored replacements for these positions were reverted before insertion; no agent-generated phrase remains on the page.
Evidence traversal corrections: moment 3 now exposes both files supporting its claim at commit 0479406 rather than one; the later commit 8038fe1e referenced by moment 4's boundary is traversable as a fixed-SHA blob link rather than plain text; the reader imperative was replaced with a neutral `Files` label, and the added reference carries a `Later commit` label. Eleven fixed-SHA blob links in total, all within `metawritingecology/meta-writing-ecology`. No commit, PR, compare or Actions URL shape is used. No frozen evidence fact, commit SHA or timestamp was altered.
Evidence-layer subject-position corrections: narrator position, reader instruction and repository agency were removed in favour of object, state, relation and evidentiary boundary. One factual correction was made in the same pass: moment 4's boundary had claimed the shown commit was the only state at which the two values could be compared, which is inaccurate — two commits (0479406 and 3219fa03) expose the mismatch — so the claim was returned to "one commit where the two can be compared". Rewrites that widened a claim beyond its source, or that substituted preferred prose for an already factual statement, were reverted; the owner-supplied evidence-boundary wording was restored verbatim after an earlier pass had rewritten it.
Print disclosure fix: the disclosure is closed by default and a closed `details` element is not painted, so printing the page lost the entire evidence layer. Verified with `checkVisibility()` rather than element geometry, which reports layout without paint and was initially misleading. Two print-only rules now reveal the closed disclosure. Confirmed after the fix: print exposes the evidence layer (document height 1578 to 4519 px) and on-screen behaviour is unchanged, with the disclosure still closed by default. No JavaScript was introduced.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm run check` (exit 0, 1250 PASS lines, zero FAIL, 13 suites, 0 failures, 1 pre-existing platform skip); `verify-indexing-discovery-build` 152/152; `verify-metadata-build` 1077/1077. Environment-assisted browser verification (headless Chromium via the environment's GLOBAL Playwright — NOT a project dependency; package.json and pnpm-lock.yaml untouched; harness kept outside the repository) against the built output: route returns 200, six moments in unchanged order, the four approved strings present exactly and the three superseded phrases absent, eleven fixed-SHA links present, moment 3 exposing both files, moment 4 exposing the later commit, robots `noindex, nofollow`, zero sitemap entries, zero `script` / `svg` / `canvas` elements, no author section, no page-level horizontal overflow at 360 / 390 / 768 / 1440 px with the disclosure open, and authored spacing unchanged at 22 / 44 / 44 / 44 / 120 px.
Result: One commit, `940ec29abab7277ab6c923dddab3da84e99b886a`, on branch `claude/public-slice-prototype-decisions-qenoz3`, parent `edb9ac9285e14cdd914283d99edea98a0f857ced`. Not pushed, no pull request, not merged, not published. The route remains unreachable from navigation, the sitemap and search indexing.
Unresolved questions: None outstanding on this revision. The owner has approved the inserted wording and the revision commit.
Risks or assumptions: The revision changed page wording and evidence traversal only. Route, page identity, `noindex` and `nofollow`, sitemap exclusion, standalone form, six-moment order, spacing system, typography, CSS architecture, footer boundary statement, closing authored-selection statement, evidence cutoff and frozen SHA references are all unchanged, and no author or attribution section exists or was added. No shared file, dependency, lockfile or verifier logic was touched, and no permanent test was added. Authored presentation language remains owner authority and is not a repository-native status or a reusable vocabulary; no claim is made that this case demonstrates, instantiates, validates or adopts an MWE model. Publication and merge remain owner decisions.

### 2026-07-25 — Claude Code — phase3a-p6-expanded-public-surface-page

Agent: Claude Code
Task: Phase 3A P6 — implement the expanded 59-record public-surface adjacency view as a NEW, independent public product at `/public-surface-map/expanded/`. Implementation only, ending in a draft pull request. No deployment, no merge, no source-repository modification, no repointing of the existing 30-record product, and no Phase 3B automation work.
Website base SHA: resolved `origin/main` before editing and confirmed `HEAD` = `origin/main` = the expected base `220c2c03ec8a832bb4fecdadc1d5ee19b6097750`, with a clean working tree.
Branch: the session harness pre-created `claude/phase-3a-p6-expanded-page-kew7be`; that assigned branch was used and no second competing branch (`claude/phase-3a-p6-expanded-page`) was created.
Untouched baseline: `corepack enable`; `pnpm install --frozen-lockfile` (lockfile unchanged); `pnpm run check` exit 0 — 769 tests across 13 suites, 768 passed, 0 failed, 1 skipped; `astro check` 52 files, 0 errors, 0 warnings, 4 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean (1217.85 KiB / gzip 242.44 KiB); `verify-public-surface-map-build` 21/21; `verify-indexing-discovery-build` and `verify-metadata-build` all PASS. Node v22.22.2, pnpm 10.34.5 (corepack), Linux.
Source P5 merge SHA: `814997119e543c8d39f312687f2b4b2ffc45da67` (source repository `metawritingecology/meta-writing-ecology`, merge of PR #29).
Source P5 reviewed implementation head: `70724fc39ffbbc963889e2d53f8c074009245c80`.
Adopted dataset: `visualizations/public-surface-adjacency-map/data.json` at the P5 merge commit; embedded `source_commit` `933274af9693d6d1d9fac36819aafdf56f9ab81d`; byte length 206617; SHA-256 `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`; Git blob `3077568edeeb0d6a769899a1a3cf79c3f9152f83`. All three identities were verified BEFORE copying, and the file was copied as RAW BYTES (`git cat-file blob` then `cp`) — never regenerated, parsed, or reserialized.
Route and public label: `/public-surface-map/expanded/` — "Expanded Public Surface Adjacency Map".
Indexing policy: `noindex, nofollow`; self-canonical `https://metawritingecology.org/public-surface-map/expanded/`; bounded WebPage JSON-LD through the existing metadata system with the existing public orientation genre.
Independent data namespace: `src/data/public-surface-adjacency-map/` with `runtime-manifest.json`, `last-known-good.json`, `runtime-snapshots/933274af9693d6d1d9fac36819aafdf56f9ab81d-0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7.json` and `README.md`. `.gitattributes` was extended with three narrow `-text` rules for these JSON files so a Windows checkout cannot rewrite LF into CRLF; the existing authority-map rules were not touched. Staged Git blob ids were re-verified after `git add`.
Runtime-manifest identity: 695 bytes, SHA-256 `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203`, Git blob `d3ffa8fc8df6dceb0e20d1248c367ee1bea9042f`. Shape is exactly `schema_version` `1.0`, `map_id` `public-surface-adjacency-map`, `selected_snapshot`, `currentness_claim` `none`. No timestamp, no automatic-latest claim, and no current/canonical/authoritative wording.
Snapshot identity: 206617 bytes, SHA-256 `0b763eb7…f1637b7`, Git blob `3077568e…152f83` — byte-identical to the source `data.json`.
Fallback identity: byte-identical to the immutable snapshot and to the source `data.json` (same byte length, SHA-256 and Git blob). Verified again against the generated `dist/` bytes.
Counts: 59 records — 49 concept, 2 orientation, 7 boundary, 1 anchor; 49 semantic-layout participants and 10 fixed-band records; 7 MODEL_ATLAS-field groupings over the concept records; 383 edges — 189 source-named adjacency (default visible) and 194 provisional navigation adjacency (default hidden).
Independent contract: `src/lib/public-surface-adjacency-map/` holds its own `byteIdentity.ts`, `contract.ts`, `runtimeManifestContract.ts`, `fallback.ts`, `runtimeLoader.ts`, `layout.ts` and `publicWording.ts`. Nothing under `src/lib/public-surface-authority-map/` is imported by any of them or modified. The dataset contract fails closed on exact key allowlists, exact product identity, exact counts and role distribution, unique record ids and repository paths, id equal to repository path, non-empty display labels sourced from `registry_name`, concept-only `model_atlas_field` grouping, non-concept `visualization_role` grouping with no semantic participation and a `none` evidence ceiling, HTTPS canonical URLs restricted to the approved source-repository blob path, unique directed edges with registered concept endpoints, per-class default visibility, `relation_status` equal to the evidence class, `authority_ceiling` `navigation_only`, outright rejection of `governance_reference`, `source_use_reference`, `visual_layout_adjacency` and `user_confirmed_relation`, and a recursive scan rejecting any key implying confirmed relation, promotion, rank, centrality, authority score, importance, priority, canonicality, confidence, relation strength, generation time or currentness. Unknown object properties are rejected, never silently ignored. No reverse edge, derived edge, or record is ever synthesized, and the two classes are never merged or deduplicated across.
Independent verifier: `scripts/verify-public-surface-adjacency-map-build.mjs`, 14 checks with stable `PSADJ-01`…`PSADJ-14` codes, registered as `verify:public-surface-adjacency-map` and appended to `check`. `scripts/verify-public-surface-map-build.mjs` was not modified and its 21 checks still pass.
Relationship wording: the exact sentence "These are parallel public views with different selection and edge contracts; neither supersedes the other." appears verbatim on both the expanded page and the parent `/public-surface-map/` page, with the exact labels "30-record authority-ceiling view" and "59-record expanded adjacency view". The expanded page is never described as a replacement, the current authoritative version, the complete corpus, the full ontology, the internal Registry, the canonical graph, a confirmed relation graph, or an upgrade that supersedes the 30-record view.
Boundary wording: the page renders all 8 dataset boundary statements verbatim plus a restatement list ("not the full MWE archive", "not the internal Registry", "not a complete corpus", "not a classification system", "not an ontology", "not a confirmed relation graph", "not a ranking", "not a currentness claim") derived only from those statements and from the manifest's `currentness_claim` of `none`. No interpretation was added beyond the P5 dataset's existing boundary statements.
Visual and interaction contract: only the 49 concept records enter the semantic layout; the 10 non-concept records render in fixed, visibly separate orientation / boundary / anchor bands computed in their own coordinate space, so they cannot affect concept positions, edge layout, degree, node size, rank or centrality, and they are never semantic-edge endpoints. Node size is constant per presentation role and never data derived. Initial edge visibility is source-named on and navigation off, with two independent native checkboxes; the toggle handler mutates only a render filter and never calls the layout, so positions, sizes and ordering cannot change. There is no governance/source-use toggle and no confirmed-relation toggle.
Accessibility behavior: all controls are native checkboxes, links or focusable record groups with `role="button"` and `aria-pressed`; a visible `:focus-visible` outline is defined; every one of the 59 records is keyboard reachable (proved by exhaustive arrow-key traversal in tests); arrow keys move deterministically by band/column/row with no wrapping; Home and End reach the first and last reachable record; Escape returns focus from the details panel to the selected record; Enter and Space activate; a `role="status" aria-live="polite"` region announces runtime status, selection changes and edge-toggle state; the SVG carries `title`, `desc` and an `aria-label`; edge classes are distinguished by written label, dash pattern and arrow-head shape rather than color alone; a `prefers-reduced-motion` media query is present and no animation is required; a `max-width: 640px` query collapses the two-column rows and one group column always fits.
No-JavaScript fallback: the server-rendered page lists all 59 records with display label, visualization role, grouping, relation-evidence ceiling and canonical source link, ordered deterministically with an explicit note that order implies no hierarchy. It is not behind any JavaScript-only control; the only server-hidden regions are the progressive-enhancement controls, canvas and details panel. The generated `dist/public-surface-map/expanded/index.html` is 274805 bytes and contains 59 `data-psadj-record` ids.
Runtime behavior: the loader issues exactly one same-origin manifest request and at most one same-origin snapshot request under one shared budget, verifies HTTP success, JSON MIME essence, a 262144-byte ceiling before decoding, the exact manifest contract, snapshot byte length, SHA-256 and Git blob, fatal UTF-8 decoding, JSON parse and the full dataset contract, then activates atomically. Any failure retains the bundled fallback untouched with a bounded status message and stable result code; there is no partial activation, no mixed fallback/runtime state, no retry, no polling, no browser storage service, no service worker, no analytics, no telemetry, no `eval`, no dynamic remote import and no CDN script. No visitor browser request reaches GitHub, its raw-content host, OSF or any other external data origin.
Headers and sitemap exclusion: `public/_headers` gained exact rules for `/public-surface-map/expanded/data/manifest.json` (JSON content type, `no-cache, must-revalidate`, `nosniff`, `noindex, nofollow, nosnippet`) and `/public-surface-map/expanded/data/snapshots/*` (JSON content type, `public, max-age=31536000, immutable`, `nosniff`, `noindex, nofollow, nosnippet`). The existing authority-map header blocks are unchanged. `/public-surface-map/expanded/` was added to `SITEMAP_EXCLUDED_PATHS`; the route and both JSON endpoints are absent from every generated sitemap file, and the parent `/public-surface-map/` remains indexable and in the feed. The route metadata registry now holds 40 indexable routes and 2 noindex previews (42 total), with no generic fallback.
Exact test totals: final `pnpm run check` exit 0 — 938 tests across 20 suites, 937 passed, 0 failed, 1 skipped (the same single pre-existing skip as the baseline). New suites: contract 58, runtime manifest 18, runtime loader 23, interaction and accessibility 37, endpoint routing 10, metadata and indexing 10, preservation 8 (164 new tests). Updated existing suites: metadata-contract 26 (unchanged count), indexing-discovery 232 passed + 1 skipped (was 231 + 1), security-resilience 128 (was 124). `astro check` 72 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean (1224.32 KiB / gzip 243.07 KiB).
Existing verifier preservation: `scripts/verify-public-surface-map-build.mjs` is byte-identical to the base and still passes 21/21; it was not weakened, reordered or replaced, and the existing `check` pipeline survives as an unmodified prefix of the new one.
Old product byte-identity proof: byte length, SHA-256 and Git blob were captured OUTSIDE the repository at the untouched base for all 20 protected files (everything under `src/data/public-surface-authority-map/`, everything under `src/lib/public-surface-authority-map/`, `src/pages/public-surface-map/interactive.astro`, both existing data endpoints, `src/components/PublicSurfaceAuthorityMap.astro`, `src/components/publicSurfaceAuthorityMap.client.ts` and the existing verifier), recalculated after all work, and compared: all 20 identities unchanged. `git diff 220c2c03ec8a832bb4fecdadc1d5ee19b6097750 -- src/data/public-surface-authority-map src/pages/public-surface-map/interactive.astro src/pages/public-surface-map/data src/lib/public-surface-authority-map src/components/PublicSurfaceAuthorityMap.astro scripts/verify-public-surface-map-build.mjs` is empty. `tests/public-surface-adjacency-map/preservation.test.ts` pins the same identities so a future change fails closed.
Dependencies: no npm dependency added, removed or changed; no package-manager upgrade; `pnpm-lock.yaml` byte-identical. `package.json` changed only to register seven new test scripts and the new verifier and to append them to `check`.
Deployment: none. No Cloudflare configuration change, no KV/R2/D1, no workflow, no scheduled automation, no `astro.config.mjs` change, no `wrangler.json` change.
Source repository: not modified. The dataset was read from `meta-writing-ecology` at the P5 merge commit and nothing was written back.
Result: four implementation commits on `claude/phase-3a-p6-expanded-page-kew7be` — "Add expanded adjacency snapshot contract", "Add expanded public-surface adjacency page", "Register and verify expanded adjacency route", "Record Phase 3A P6 implementation". P6 draft pull request only; not marked ready, not merged, not deployed.
Unresolved questions: `src/lib/public-surface-adjacency-map/publicWording.ts` was added in commit 2 rather than commit 1 because the page, component, tests and verifier must pin identical approved strings from one module; the commit-scope list for commit 2 did not enumerate the lib namespace, so this is reported as a deliberate, minimal scope note rather than a silent widening. Whether the expanded view should ever gain a cross-view comparison surface, and whether the fixed-band records should remain outside every graph interaction, are conceptual decisions left to the repository owner.
Risks or assumptions: `tests/metadata-contract.test.ts`, `tests/indexing-discovery.test.ts` and `tests/security-resilience.test.ts` were modified because the new route cannot be registered and its new header rules cannot be pinned otherwise; in each case the change adds coverage and updates a mechanical count, and no existing prohibition was relaxed — the security header contract still requires the frozen manifest and snapshot blocks to carry no `X-Content-Type-Options` and no CSP directive of their own, while the two new expanded blocks pin `nosniff` explicitly as the task specified. The bundled dataset is embedded in the page as a JSON data island, so the generated HTML is large (274805 bytes); this mirrors the existing interactive route's approach and keeps the client free of any runtime request before verification. The snapshot-stage contract failure path in the runtime loader is unreachable by construction because the manifest pins the exact SHA-256, so that branch is proved by the direct contract tests rather than through the loader. No relation was promoted, no boundary statement was removed, no navigation was reorganized, and no MWE authority-level decision was made.

### 2026-07-25 — Claude Code — phase3a-p6-review-followup-details-escape-focus

Agent: Claude Code
Task: One narrow accessibility review follow-up on the Phase 3A P6 draft PR #92. No P6 redesign; no change to the dataset, runtime manifest, snapshot, fallback, contract, layout, endpoints, route, metadata, headers, indexing, or the existing 30-record product.
Previous head: `d6645b5f18b493a8705fc3128a598aa248ca5736` — verified before editing as `HEAD` = `origin/claude/phase-3a-p6-expanded-page-kew7be`, 4 commits ahead of the base `220c2c03ec8a832bb4fecdadc1d5ee19b6097750`, 34 changed files, clean working tree. The existing four commits were not amended, rebased, squashed, reset or rewritten.
Accessibility defect: the client attached its `keydown` handler only to `canvas`, and that handler returns early unless the event target sits inside a `[data-psadj-node]` group. The details panel contains a focusable canonical-source link, so an Escape pressed while that link held focus never reached the canvas listener and focus could not return to the selected graph node. The existing test only asserted that the string `Escape` appeared somewhere in the client source, which did not prove the details-to-node focus behavior.
Details Escape handler: a SEPARATE `details.addEventListener("keydown", …)` registration was added in `src/scripts/public-surface-adjacency-map.ts`. Its whole body is `if (event.key === "Escape" && state.selectedId) { focusNode(canvas, state.selectedId); event.preventDefault(); }`. It reuses the existing bounded `focusNode` helper and moves FOCUS only: it does not change the selection, clear or re-render the details, recompute the layout, redraw the graph, issue a runtime request, alter edge visibility, create a new focus state, or infer a fallback node. With `state.selectedId` null it is a no-op and the default Escape action is left alone. The existing canvas keyboard handler was NOT moved; graph-node Escape, Enter/Space activation, Home/End and arrow movement all remain on it, and the two listeners are independent registrations on distinct targets.
Focused test correction: the shallow single assertion in `tests/public-surface-adjacency-map/interaction.test.ts` was replaced by three tests built on a new `listenerBody()` helper that slices a named `addEventListener` call out of the production source by brace matching and strips comment lines, so every assertion identifies EXECUTABLE listener structure and cannot be satisfied by a comment or an unused string. They prove the listener is attached specifically to `details` (and that neither `document` nor `window` captures `keydown`, while the unrelated `window` `resize` listener is unchanged), that it checks `event.key === "Escape"`, that it checks `state.selectedId`, that it calls `focusNode(canvas, state.selectedId)`, that the single `event.preventDefault()` sits strictly inside the guarded branch, that a missing selected id is a no-op with no else branch and no fallback lookup (`firstReachableId`, `lastReachableId`, `state.navigation`, `querySelector`, `[data-psadj-node]`, `nodes[0]` all absent), that no layout, render, selection mutation, announcement or network call occurs inside the handler, and that the canvas arrow/Home/End/Enter/Space behavior remains present and still node-scoped.
Test non-vacuity: regression-checked with four independent mutations of the production handler — removing the details listener (2 tests fail), removing the `state.selectedId` guard (1 fails), moving `preventDefault()` outside the guarded branch (1 fails), and adding a `renderDetails()` call inside the handler (1 fails). The fixed source passes all 39.
Product identities unchanged: 40 pinned files were hashed before the edit and recalculated after all work — every byte length, SHA-256 and Git blob identical. Runtime manifest 695 bytes / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203` / `d3ffa8fc8df6dceb0e20d1248c367ee1bea9042f`; immutable snapshot and bundled fallback 206617 bytes / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7` / `3077568edeeb0d6a769899a1a3cf79c3f9152f83`; 59 records; 383 edges.
Old authority-map product unchanged: everything under `src/data/public-surface-authority-map/` and `src/lib/public-surface-authority-map/`, plus `src/pages/public-surface-map/interactive.astro`, `src/components/PublicSurfaceAuthorityMap.astro`, `src/components/publicSurfaceAuthorityMap.client.ts` and `scripts/verify-public-surface-map-build.mjs`, are byte-identical; `verify-public-surface-map-build` still passes 21/21.
Also unchanged in this follow-up: `src/data/public-surface-adjacency-map/**`, `src/lib/public-surface-adjacency-map/**`, `src/pages/public-surface-map/expanded/**`, `src/components/PublicSurfaceAdjacencyMap.astro`, `src/pages/public-surface-map.md`, `src/lib/publicMetadata.ts`, `scripts/lib/indexing-discovery-contract.mjs`, `scripts/verify-public-surface-adjacency-map-build.mjs`, `public/_headers`, `package.json` and `pnpm-lock.yaml`.
Final test totals: `pnpm install --frozen-lockfile` (lockfile byte-identical); focused suites — interaction 39/39 (was 37), contract 58/58, runtime manifest 18/18, runtime loader 23/23, endpoint routing 10/10, metadata and indexing 10/10, preservation 8/8; `verify:public-surface-map` 21/21; `verify:public-surface-adjacency-map` 14/14; `pnpm run check` exit 0 — 940 tests across 20 suites, 939 passed, 0 failed, 1 skipped (the same single pre-existing skip). `astro check` 72 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean (1224.32 KiB / gzip 243.07 KiB). Node v22.22.2, pnpm 10.34.5 (corepack), Linux.
Files changed: `src/scripts/public-surface-adjacency-map.ts`, `tests/public-surface-adjacency-map/interaction.test.ts`, `AGENT_WORKLOG.md` — exactly the three authorized files and nothing else.
Result: one additional commit on `claude/phase-3a-p6-expanded-page-kew7be` (five commits total). PR #92 remains draft, open and unmerged; not marked ready.
Deployment: none. No Cloudflare configuration change, no workflow, no dependency change, no lockfile change.
Unresolved questions: `origin/main` advanced to `cc64959abaa9d2cf11b18b1b574972ac30a7900b` during this follow-up while the PR branch stayed based on `220c2c03ec8a832bb4fecdadc1d5ee19b6097750`. No rebase or merge was performed because rewriting the existing commits is prohibited and the base-branch update is outside this follow-up's scope; whether to update the branch against the new base before review is left to the repository owner.
Risks or assumptions: the listener structure is asserted from the production source rather than from a simulated DOM, because the client installs listeners on import and the repository ships no browser-testing framework (adding one is prohibited); the four mutation checks above establish that those assertions are load-bearing. Graph-node Escape remains supported on the canvas listener, so the two paths are independent and neither shadows the other. No selection, layout, dataset, artifact, boundary statement, public wording or navigation change occurred.

### 2026-07-26 — Claude Code — phase3a-p6-base-synchronization

Agent: Claude Code
Task: Synchronize Phase 3A P6 draft PR #92 with the current website `main` by merging `cc64959abaa9d2cf11b18b1b574972ac30a7900b` into the P6 branch without rebasing, squashing, amending, resetting or otherwise rewriting the existing P6 commits. Bounded base synchronization only; no P6 redesign, no Public Slice modification, no deployment and no merge of PR #92 into `main`. This entry records that already-completed synchronization as required by the AGENTS.md worklog rule.
Previous P6 head: `bf6a8f1a9c4a5961ec979c447c0d39b00ef88b7d`.
Synchronization merge: `5cdb63f18ca9a545b59a5e60f5da78ada8ec97ae`, message `Merge current main into P6 branch`, merge tree `d8c3f674f8cc462e7f76c60c3cf8fd9c7bc56306`.
Merge parents: first parent `bf6a8f1a9c4a5961ec979c447c0d39b00ef88b7d`, second parent `cc64959abaa9d2cf11b18b1b574972ac30a7900b`. The merge was created with `git merge --no-ff`; no rebase, squash, reset, cherry-pick, amend or force-push was used, and the five prior P6 commits are byte-identical.
Files changed by the synchronization: `AGENT_WORKLOG.md`; `scripts/lib/indexing-discovery-contract.mjs`; `src/pages/artistic-research/public-slice/2026-07-25.astro`.
Conflict resolution: exactly the two anticipated shared append points conflicted, and no third file did. `AGENT_WORKLOG.md` preserved both append-only histories in commit-timestamp order — `edb9ac9` 2026-07-25T16:31:48Z (Public Slice prototype), `8f351f7` 20:53:21Z (Public Slice revision), `d6645b5` 20:54:25Z (P6 implementation), `bf6a8f1` 21:10:19Z (P6 details-Escape follow-up); the shared base was confirmed a strict prefix of both sides, the resolution is a byte-exact concatenation of base plus each side's appended block, and the merged length equals the exact sum of the three parts, so no entry was shortened, deduplicated, reworded or reordered internally. `scripts/lib/indexing-discovery-contract.mjs` retained the Public Slice and expanded adjacency exclusions exactly once each, alongside the two pre-existing exclusions, with both sides' comments preserved and normalization logic, sitemap-eligibility logic, verifier thresholds and unrelated exclusions untouched; occurrence counts were verified as exactly one for `/language-pressure-test-lab-prototype/`, `/public-surface-map/interactive/`, `/artistic-research/public-slice/2026-07-25/` and `/public-surface-map/expanded/`. The Public Slice page was adopted byte-identically from `main` (blob `fc642c9063c334dc8ca577976330e4bcd5e24ccd` on both sides, no diff against `origin/main`), was not registered in the metadata registry, and none of its layout, robots policy, wording, evidence links, moment order, CSS, print behavior, navigation absence or sitemap absence was altered. No conflict marker survives in any tracked file and no unresolved path remained.
Tests and checks run after the merge (Linux, node v22.22.2, pnpm 10.34.5 via corepack): `pnpm install --frozen-lockfile`; `pnpm run test:metadata-contract` 26/26; `pnpm run test:indexing-discovery` 233 tests, 232 passed, 1 skipped (the pre-existing platform skip); `pnpm run test:security-resilience` 128/128; `pnpm run test:adjacency-contract` 58/58; `pnpm run test:adjacency-runtime-manifest` 18/18; `pnpm run test:adjacency-runtime` 23/23; `pnpm run test:adjacency-interaction` 39/39; `pnpm run test:adjacency-endpoints` 10/10; `pnpm run test:adjacency-metadata` 10/10; `pnpm run test:adjacency-preservation` 8/8; `pnpm run verify:public-surface-map` 21/21; `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run verify:indexing-discovery-build` 155/155; `pnpm run verify:metadata-build` 1077/1077; `pnpm run check` exit 0 with 940 tests across 20 suites, 939 passed, 0 failed, 0 errors, 1 skipped. `astro check` reported 73 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean (1242.47 KiB / gzip 247.13 KiB). The indexing and metadata build-verifier counts rose from 141 and 1023 because they now also cover the adopted Public Slice route from the new base.
Preservation: 42 files were hashed before the merge and recalculated after, and every byte length, SHA-256 and Git blob is unchanged. P6 runtime manifest 695 bytes / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203` / `d3ffa8fc8df6dceb0e20d1248c367ee1bea9042f`; immutable snapshot and bundled fallback 206617 bytes / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7` / `3077568edeeb0d6a769899a1a3cf79c3f9152f83`; 59 records; 383 edges (189 source-named adjacency, 194 provisional navigation adjacency). The existing 30-record authority-map product is unchanged in full, including its data and contract namespaces, `src/pages/public-surface-map/interactive.astro`, its data endpoints, `src/components/PublicSurfaceAuthorityMap.astro`, its client module and `scripts/verify-public-surface-map-build.mjs`, whose verifier still passes 21/21. The details-panel Escape fix is present unchanged. `pnpm-lock.yaml` is byte-identical; no dependency, workflow or Cloudflare configuration change; no deployment.
Files changed by this worklog follow-up: `AGENT_WORKLOG.md` only. No implementation file, artifact, contract, route, metadata, header or test was touched, and no existing worklog entry was rewritten, reordered or edited.
Result: PR #92 head advanced from the synchronization merge to this worklog-only commit on `claude/phase-3a-p6-expanded-page-kew7be`. GitHub reported the PR mergeable against the new base after the synchronization. The PR remains draft, open, unmerged and not deployed; it was not marked ready and auto-merge was not enabled.
Unresolved questions: None.
Risks or assumptions: Worklog block order records append chronology only and implies no semantic priority. The synchronization adds no P6 semantic or public-surface decision, and adopting the Public Slice route creates no relationship to P6 beyond coexistence in the shared sitemap-exclusion set. The synchronization merge commit's message body retains the commented `# Conflicts:` lines that `git merge --no-edit` preserves from the merge template; its subject is exactly `Merge current main into P6 branch` and the commit was not amended, because rewriting it is prohibited. Because this follow-up changes only Markdown, the full production suite was not rerun; the post-merge results recorded above remain applicable.

### 2026-07-25 — Claude Code — public-slice-entry-and-closing-boundary

Agent: Claude Code
Task: Two local edits to existing pages, using owner-decided wording. Add a short in-site entry to the Public Slice from the Artistic Research page, and refine the closing boundary and return link on the Public Slice page. No redesign, no new page system, no new component.
Files changed:
- src/pages/artistic-research.md — added a `Selected Public Reading` section between `How to Read the Work as Artistic Research` and `Exhibition or Presentation Version`. One `h2`, one paragraph, one link to `/artistic-research/public-slice/2026-07-25/`. Uses the page's existing markdown heading, paragraph and link styles; the rendered block contains only `h2`, `p` and `a` elements. Surrounding paragraphs are unchanged and the document outline is unchanged. Root-relative link form matches the convention used across `src/pages`.
- src/pages/artistic-research/public-slice/2026-07-25.astro — replaced the closing disclosure paragraph with the owner-supplied sentence, removing the words `immutable`, `cannot change` and `is authored`. Swapped the order of the footer boundary statement and the return navigation so the closing order is boundary explanation, then the repository/reading distinction, then the return link. Return link text is now `Return to Artistic Research`, target `/artistic-research/` unchanged. The `margin-top` values of the two swapped elements were exchanged (6rem and 4rem) so the vertical rhythm below the sequence is identical to before.
- AGENT_WORKLOG.md — this entry.
Not changed: the six statements and their order, the spacing between statements 5 and 6, the coda-like separation of statement 6, the short horizontal rule, the evidence disclosure position, heading and contents, commit hashes, timestamps, file paths, uppercase labels, monospace typography, colours, column width, route structure, `noindex` and `nofollow`, canonical metadata, sitemap behaviour, global header, footer and navigation, homepage, global CSS, other artistic-research pages, dependencies and lockfile. No new page, component, card, button, icon, badge or border box was introduced.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm run check` (exit 0, 1250 PASS lines, zero FAIL, 13 suites, 0 failures, 1 pre-existing platform skip); `verify-indexing-discovery-build` 152/152; `verify-metadata-build` 1077/1077. Environment-assisted browser verification (headless Chromium via the environment's GLOBAL Playwright — NOT a project dependency; package.json and pnpm-lock.yaml untouched; harness kept outside the repository) against the built output: both routes return 200; the new section renders between the two named sections; the words `immutable`, `cannot change` and `is authored` are absent from the slice page; the closing order is boundary paragraph, boundary statement, return link; the return link resolves to `/artistic-research/`; the six statements are unchanged and in order; eleven fixed-SHA evidence links remain; the slice remains `noindex, nofollow` with zero sitemap entries while `/artistic-research/` remains in the sitemap; zero `script`, `svg` and `canvas` elements; statement spacing re-measured at 22 / 44 / 44 / 44 / 120 px; no page-level horizontal overflow at 360 / 390 / 768 / 1440 px; the disclosure remains closed by default on screen and exposed in print.
Result: Changes committed on branch `claude/public-slice-prototype-decisions-qenoz3`. Not merged and not published.
Unresolved questions: None on this change.
Risks or assumptions: The added link is in-site reachability only. It does not change search indexing, sitemap inclusion, global navigation, public/private status, route visibility, or the state of any registry or authority surface, and none of those was modified. The entry text states that a Public Slice is a bounded reading assembled from a small number of repository states and does not represent the full repository, archive or system. No series, publication, registry, authority or ontology relation is asserted between the parent page and the slice, and the section name remains singular. The margin exchange was required because the closing order changed; without it the spacing below the sequence would have shifted visibly.

### 2026-07-26 — Claude Code — phase3a-p6-second-base-synchronization

Agent: Claude Code
Task: Synchronize Phase 3A P6 draft PR #92 with current website `main` `66878864d49f4f3a2a20eaf4d463c190aa4da26c` using a merge commit, without rebasing, squashing, amending, resetting or otherwise rewriting the existing seven P6 commits. Bounded base synchronization only; no P6 redesign, no P6 implementation or artifact change, no modification of the owner-approved Public Slice changes, no deployment and no merge of PR #92 into `main`. This entry is appended inside the synchronization merge itself, so no separate worklog-only commit follows.
Previous P6 head: `b0c3ca0e3402cba9751821b38879f14964562fb5`.
Previous synchronized base: `cc64959abaa9d2cf11b18b1b574972ac30a7900b`.
New synchronized base: `66878864d49f4f3a2a20eaf4d463c190aa4da26c`, reached by `27096b2141d570bab9c34add78295abcdec6f2e1` (Add Public Slice entry point and refine its closing boundary) and the merge of PR #94.
Reason: Codex independent final review found no P6 implementation or artifact defect, but failed the final identity gate because `main` advanced during review and the PR became not mergeable. This synchronization corrects only that identity condition; no P6 technical finding was raised and none was fixed here.
Codex report identity: `P6-independent-final-review.md`, 18835 bytes, SHA-256 `1f136bd60ee56eb578db4efd22ce34d9d0cfe35ee3648b489c9da35f32495c77`. The report is an external review artifact and is not committed to this repository.
Main changes adopted: `AGENT_WORKLOG.md`; `src/pages/artistic-research.md`; `src/pages/artistic-research/public-slice/2026-07-25.astro`. Confirmed independently with `git diff --name-status cc64959…66878864` that current main changes exactly these three paths relative to the previous synchronized base, and the synchronization was not broadened beyond them.
Synchronization merge parents: first parent `b0c3ca0e3402cba9751821b38879f14964562fb5`, second parent `66878864d49f4f3a2a20eaf4d463c190aa4da26c`. Created with `git merge --no-ff`; no rebase, squash, reset, cherry-pick, amend or force-push was used, and the seven prior P6 commits are byte-identical.
Conflict resolution: only `AGENT_WORKLOG.md` conflicted; both Public Slice page files merged cleanly from main and required no manual P6-specific resolution. The shared merge base `cc64959` was confirmed a strict prefix of both sides, so both are pure appends; the resolution is a byte-exact concatenation of the shared history plus the branch's appended block plus main's appended block, and the merged length equals the exact sum of the three parts, so no entry was deleted, shortened, reworded, deduplicated or reordered internally and no old SHA, date, test total or conclusion changed. Append chronology follows the commit timestamp of the commit that appended each block: `d6645b5` 2026-07-25T20:54:25Z (P6 implementation), `bf6a8f1` 21:10:19Z (P6 details-Escape follow-up), `b0c3ca0` 21:36:11Z (P6 first base synchronization), `27096b2` 21:47:41Z (Public Slice entry and closing boundary). No conflict marker was retained and no unresolved path remained.
Public Slice adoption: both page files are byte-identical to current main — `src/pages/artistic-research.md` blob `c8da924bfa41486f738d6f626fefe37d3e5f03f6` and `src/pages/artistic-research/public-slice/2026-07-25.astro` blob `c4c3345bd98ede9d7961bd92f886e0828c28d09d` on both sides, with `git diff origin/main` empty for both. Retained unchanged: the Artistic Research page's `Selected Public Reading` section with its single bounded-reading paragraph and the link to `/artistic-research/public-slice/2026-07-25/`, with no global-navigation change and no registry or authority claim; and the Public Slice page's disclosure close ("Each reference is pinned to a fixed commit. The selection and sequence are specific to this reading, not to the repository."), its closing order of disclosure explanation then repository/reading boundary then return link, the return link text `Return to Artistic Research` targeting `/artistic-research/`, its `noindex, nofollow` policy, and its six moments, evidence links, timestamps and ordering. No prose, layout, CSS, link text, ordering or metadata was edited. These changes are not part of P6; their only relationship to P6 is that both products coexist in this repository.
Tests and checks run after the merge (Linux, node v22.22.2, pnpm 10.34.5 via corepack): `pnpm install --frozen-lockfile` with the lockfile byte-identical; `pnpm run build` clean; `pnpm run check:astro` 73 files, 0 errors, 0 warnings, 6 hints; `pnpm run check:ts` clean; `pnpm run test:metadata-contract` 26/26; `pnpm run test:indexing-discovery` 233 tests, 232 passed, 1 skipped (the pre-existing platform skip); `pnpm run test:security-resilience` 128/128; `pnpm run test:adjacency-contract` 58/58; `pnpm run test:adjacency-runtime-manifest` 18/18; `pnpm run test:adjacency-runtime` 23/23; `pnpm run test:adjacency-interaction` 39/39; `pnpm run test:adjacency-endpoints` 10/10; `pnpm run test:adjacency-metadata` 10/10; `pnpm run test:adjacency-preservation` 8/8; `pnpm run verify:public-surface-map` 21/21; `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run verify:indexing-discovery-build` 155/155; `pnpm run verify:metadata-build` 1077/1077; `pnpm run check` exit 0 with 940 tests across 20 suites, 939 passed, 0 failed, 0 errors, 1 skipped. `wrangler deploy --dry-run` clean (1243.09 KiB / gzip 247.36 KiB). Route policy reconfirmed: `/artistic-research/` remains indexable and present in the generated sitemap; the Public Slice route remains `noindex, nofollow` and excluded from the sitemap; the expanded P6 route remains `noindex, nofollow` and excluded from the sitemap.
Preservation: 50 files were hashed before the merge and recalculated after, and every byte length, SHA-256 and Git blob is unchanged. P6 runtime manifest `src/data/public-surface-adjacency-map/runtime-manifest.json` 695 bytes / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203` / `d3ffa8fc8df6dceb0e20d1248c367ee1bea9042f`; immutable snapshot and bundled fallback 206617 bytes / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7` / `3077568edeeb0d6a769899a1a3cf79c3f9152f83`; dataset 59 records and 383 edges (189 source_named_adjacency, 194 navigation_adjacency). No diff in `src/data/public-surface-adjacency-map/**`, `src/lib/public-surface-adjacency-map/**`, `src/pages/public-surface-map/expanded/**`, `tests/public-surface-adjacency-map/**`, `src/components/PublicSurfaceAdjacencyMap.astro`, `src/scripts/public-surface-adjacency-map.ts`, `scripts/verify-public-surface-adjacency-map-build.mjs`, `src/pages/public-surface-map.md`, `src/lib/publicMetadata.ts`, `public/_headers`, `scripts/lib/indexing-discovery-contract.mjs`, `package.json` or `pnpm-lock.yaml`. The details-panel Escape listener is unchanged. The existing 30-record authority-map product is unchanged in full, including its data and contract namespaces, `src/pages/public-surface-map/interactive.astro`, its data endpoints, `src/components/PublicSurfaceAuthorityMap.astro`, its client module and `scripts/verify-public-surface-map-build.mjs`, whose verifier remains byte-identical and still passes 21/21. No dependency was added, removed or changed.
Result: the synchronization merge is the eighth PR commit on `claude/phase-3a-p6-expanded-page-kew7be`; no ninth worklog-only commit was created because this entry is included in the merge itself. PR #92 remains draft, open, unmerged and not deployed; it was not marked ready and auto-merge was not enabled.
Unresolved questions: None.
Risks or assumptions: the second synchronization changes no P6 semantic, classification, naming or relation decision. Public Slice remains independent of P6, related only by coexistence in the shared sitemap-exclusion set, and its owner-approved wording was adopted rather than interpreted. The Codex report is an external artifact recorded here by path, size and SHA-256 only. PR #92 remains draft, open, unmerged and not deployed.

### 2026-07-26 — Claude Code — phase3a-p7-0-rendering-boundary-guards

Agent: Claude Code
Task: Implement the P7.0 package authorized by `PHASE3A_P7_CANONICAL_IMPLEMENTATION_PLAN_REV2_2_3.md` — policy and source-boundary guards only. Retarget the presentation-coupled assertions in the existing adjacency-map interaction test to intent level, add the thirteen immediately-passing P7.0 guards as a new sibling test, and add the named test script wired into `check`. No P7.1, P7.2 or P7.3 work; no production visual or runtime change; no merge and no deployment.
Authorizing evidence (external, not committed): canonical plan `PHASE3A_P7_CANONICAL_IMPLEMENTATION_PLAN_REV2_2_3.md`, 198155 bytes, SHA-256 `59c74670e2f1bf3e10e83f2e91aadcb7b9968a305e08242a5fb7c3aab040ff8c`, closing text `P7 CANONICAL PLAN REV2.2.3 COMPLETE — GROUPING-ARC GEOMETRY CONSTANT CLOSED, READY FOR FOCUSED INDEPENDENT RE-REVIEW`; independent review `P7_REV2_2_3_FOCUSED_INDEPENDENT_RE_REVIEW.md`, 14359 bytes, SHA-256 `1ad37903dbfe6b2e0278ccfc7a8e6dfd4a84c93e245d619d3e9dea841bd4f079`, final line `P7 REV2.2.3 FOCUSED INDEPENDENT RE-REVIEW PASS — READY FOR P7.0 IMPLEMENTATION`. Both sizes and digests were calculated directly from the raw attached files before any repository change. Neither file is copied into this repository.
Baseline: remote `refs/heads/main` queried with `git ls-remote` and confirmed as `32f992d28f7c84d21c7af5a2ca5430d5fb63eed8`, identical to the authorized base SHA. The branch was created from that exact commit; the local `origin/main` ref was stale at `220c2c03ec8a832bb4fecdadc1d5ee19b6097750` (a strict ancestor) and was refreshed by fetch, not reset. Working tree and index were clean and no merge, rebase, cherry-pick or bisect was in progress.
Files changed: `tests/public-surface-adjacency-map/interaction.test.ts` (assertion retargeting only); `tests/public-surface-adjacency-map/renderingBoundary.test.ts` (new, the thirteen guards); `package.json` (one new script plus its `check` wiring); `AGENT_WORKLOG.md` (this entry, appended under the AGENTS.md worklog rule).
Zero production source changed. `git diff` against the base SHA over `src`, `scripts` and `public` is empty. Every frozen path named by the plan is byte-identical: `src/data/public-surface-adjacency-map/**`, `src/data/public-surface-authority-map/**`, `src/lib/public-surface-authority-map/**`, `src/lib/public-surface-adjacency-map/{contract,fallback,runtimeLoader,runtimeManifestContract,byteIdentity}.ts`, `src/pages/public-surface-map/interactive.astro`, `src/pages/public-surface-map.md`, `src/pages/public-surface-map/data/**`, `tests/public-surface-authority-map/**`, `scripts/verify-public-surface-map-build.mjs`, `public/_headers` and `pnpm-lock.yaml`.
Interaction-test retargeting: three tests, six presentation-coupled assertions. The literal navigation-edge rule match (`stroke-width: 1.2; stroke-dasharray: 5 4`) became a rule-body inspection requiring the navigation class to declare a non-`none` dash pattern, the source-named class to declare none, and neither class rule to carry its own `stroke`, `fill` or `color`, so the pattern-not-colour guarantee is now proved rather than pinned. The literal `outline: 3px solid currentColor` match became a requirement that every `:focus-visible` rule declaring an outline uses a non-zero length and that no rule anywhere suppresses the outline. The literal `@media (max-width: 640px)` match became a requirement that the first narrow-width rule collapses the description grids to one column; `columnsForWidth(320, 7) === 1`, `columnsForWidth(0, 7) === 7`, `columnsForWidth(1200, 7) >= 1` and the pinned `columnsPerBand: 1` / `nodes.length === 49` pair became a width sweep asserting an integer result in `[1, groupCount]`, monotonicity in width, a single column at the module's own one-group-region width, the full group count for unknown or non-positive widths, and complete record retention at every resolvable column count — all derived from the dataset and the layout module's exported constants rather than pixel or count literals. No test was added or removed (39 before, 39 after) and no assertion was dropped; assertion count rose from 156 to 176.
Guard file: thirteen `test("guard N — …")` registrations driven by an auditable `P7_0_GUARDS` mapping table, with a load-time integrity check that the table is contiguous 1–13 and that each row has a matching registration in the file's own source. Scan scope is exactly the four adjacency production surfaces in deterministic sorted order, with repository-relative paths in every failure message; test files are excluded because existing tests legitimately carry forbidden tokens as absence assertions. Documented scope exceptions: `runtimeLoader.ts` is excluded from the timer guard only, because it is frozen and legitimately calls `setTimeout`; guard 6 is scoped to the component and client because frozen authority-map files and the existing build verifier name `iframe`; guard 10's metric scan covers the executable code of `layout.ts` and the client only, because `contract.ts` carries `centrality` / `importance` / `degree` as its own `PROHIBITED_KEY_TOKENS` vocabulary and the component states them in visible prose. Every guard carries an explicit false-positive control, and package checks are name-structural rather than substring, so `three-questions` and `the-central-naming-tower` are not matched.
Guard non-vacuity: verified by mutation in an isolated copy outside the repository, never against the repository working tree. Injecting a `three` import, a `getContext("webgl2")` call, a CodePen URL, `Math.random()`, `requestAnimationFrame`, a `ResizeObserver`, an `innerHTML` write, an `<iframe>`, an unauthorized `user_confirmed_relation` toggle, a stripped `rel="noopener noreferrer"`, a `three` dependency and a `jsdom` devDependency each failed exactly the expected guard or guards; the retargeted interaction assertions still failed when the edge dash pattern was removed or set to `none`, when the focus outline was suppressed, and when the class distinction was reduced to colour, while tolerating a changed breakpoint and a changed stroke width. Guard 13 was strengthened after an initial version tolerated deletion of a single assertion: it now extracts every `assert.*(…)` call by parenthesis matching, requires each retained guarantee to appear inside an assertion rather than anywhere in the file, enforces per-test assertion floors and a file-level assertion floor, and fails when one assertion, one guarantee or a whole test is removed.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5): `pnpm install --frozen-lockfile` with `package.json` and `pnpm-lock.yaml` byte-identical before and after; `pnpm run test:adjacency-rendering-boundary` 13/13; `pnpm run test:adjacency-interaction` 39/39; `pnpm run test:adjacency-preservation` 8/8; `pnpm run check` exit 0 with 953 tests across 21 suites, 952 passed, 0 failed, 1 skipped (the same pre-existing platform skip), up from 940 across 20 suites by exactly the thirteen new guards; `astro check` 74 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean (1243.09 KiB / gzip 247.36 KiB); `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run verify:public-surface-map` 21/21; `git diff --check` clean.
Artifact identity: `src/data/public-surface-adjacency-map/last-known-good.json` 206617 bytes / SHA-256 `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`; `src/data/public-surface-adjacency-map/runtime-manifest.json` 695 bytes / SHA-256 `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203`; `pnpm-lock.yaml` SHA-256 `9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719` at start and at end. Dependencies, devDependencies and `packageManager` parse identical to the base SHA; only `scripts` differs, by one added key and the `check` wiring.
Deterministic two-build comparison: both builds ran with output copied to temporary locations outside the repository. 90 of 92 emitted files are byte-identical between the two builds. The two that differ are `_worker.js/index.js` and the `_worker.js/manifest_<hash>.mjs` chunk it imports, because Astro embeds a freshly generated random `key` in the serialized SSR manifest on every build, which changes the chunk's content hash and therefore its filename; `index.js` differs only by that filename. The same two-build comparison at the unmodified base SHA in a separate worktree produced exactly the same two differing paths, so this is pre-existing and unrelated to P7.0. The entire public output — all 24 files outside `_worker.js`, including every HTML page, JSON endpoint, stylesheet, client bundle and `_headers` — is byte-identical across both builds and byte-identical to the base SHA's public output, aggregate SHA-256 `0f999817105db4bdaeb317670d35e48a17f17f2dea26457a46542130125f77f5` on both. Generated output was removed and nothing generated is committed.
Result: one commit on `claude/p7-0-rendering-boundary-guards-7nuss5`, parented directly on `32f992d28f7c84d21c7af5a2ca5430d5fb63eed8`, opened as a draft pull request. Not marked ready, not merged, not deployed. P7.1 was not started.
Unresolved questions: the task named `claude/p7-0-rendering-boundary-guards` as the preferred branch, while this session is provisioned for `claude/p7-0-rendering-boundary-guards-7nuss5`; the provisioned branch was used and the deviation is recorded here and in the pull request. `pnpm install --frozen-lockfile` was run because this environment had no `node_modules` and the required validation commands cannot execute without one; it installs the already-locked set and cannot alter `package.json` or `pnpm-lock.yaml`, both of which were confirmed byte-identical afterwards. Whether the pre-existing SSR-manifest build nondeterminism should be addressed separately is left to the repository owner; it is outside P7.0's authorized scope.
Risks or assumptions: the guards are source-contract assertions over production text rather than browser observations, because the client installs listeners on import and adding a browser or DOM harness is prohibited; the mutation battery above establishes that they are load-bearing. Guard 10's metric scan and guard 6's embed scan are deliberately narrower than the full namespace, for the measured reasons recorded above; widening either would fail on unmodified `main` and would be mis-scoped rather than stricter. The fixture parameter `columnsPerBand: 3` remains in the interaction test as an input to the currently shipping pure layout function; it is not an assertion about presentation, and the plan assigns removal of `columnsForWidth` and `computeSemanticLayout` to P7.1. The arrow-reachability test was not retargeted, because the plan assigns its replacement to P7.1 and P7.0 must not drop an assertion that still holds. No dataset, artifact, contract, route, metadata, header, dependency, boundary statement, public wording, naming, classification or relation decision was changed.

### 2026-07-26 — Claude Code — phase3a-p7-0-boundary-guard-bypass-remediation

Agent: Claude Code
Task: Bounded remediation of P7.0 draft PR #95, correcting exactly the four blocking test-boundary defects raised by the independent Codex implementation review. Not a new package, not P7.1. One additional correction commit on the existing PR branch; the original P7.0 commit is untouched. No production source change, no `package.json` change, no lockfile change, no merge, no manual deployment.
Authorizing evidence (external, not committed): `PHASE3A_P7_CANONICAL_IMPLEMENTATION_PLAN_REV2_2_3.md`, 198155 bytes, SHA-256 `59c74670e2f1bf3e10e83f2e91aadcb7b9968a305e08242a5fb7c3aab040ff8c`; `P7_REV2_2_3_FOCUSED_INDEPENDENT_RE_REVIEW.md`, 14359 bytes, SHA-256 `1ad37903dbfe6b2e0278ccfc7a8e6dfd4a84c93e245d619d3e9dea841bd4f079`; `P7_0_PR95_INDEPENDENT_IMPLEMENTATION_REVIEW.md`, 21339 bytes, SHA-256 `f753690eea3670a172efba81121b56e3bdee2daa58727203cf341d433df54635`, heading `# P7.0 PR #95 Independent Implementation Review`, classification `Overall classification: REVISION REQUIRED.` All three sizes and digests were calculated directly from the raw files before any repository change. The review's final line carries a character-encoding corruption in which the intended dash renders as `??`; per the owner instruction the size, digest, heading and classification are the identity authorities, and no exact final-line match was required.
Preflight: remote `main` re-queried as `32f992d28f7c84d21c7af5a2ca5430d5fb63eed8`; PR #95 confirmed open, draft, unmerged, base `main`, head `claude/p7-0-rendering-boundary-guards-7nuss5` at `9fd8bda1fe4d37ed1a0551492c78df78bd734ea8` with exactly one commit whose parent is the base SHA; working tree and index clean; no merge, rebase, cherry-pick or bisect in progress.
Files changed by this remediation: `tests/public-surface-adjacency-map/interaction.test.ts`; `tests/public-surface-adjacency-map/renderingBoundary.test.ts`; `AGENT_WORKLOG.md` (this entry, appended under the AGENTS.md worklog rule). `package.json` and `pnpm-lock.yaml` were deliberately not touched — the existing script and `check` wiring were already correct.
F-01, zero-length navigation dash patterns passed. The edge-class assertion required a `stroke-dasharray` that was not the word `none` and contained a digit, so `0 0` satisfied it while painting a solid line. Replaced the first-rule text slicer with a bounded stylesheet model that parses the component's two `<style>` blocks into ordered rules — descending into at-rule bodies so a suppression inside a media query is still seen — and resolves the last-wins value of a property across every matching rule. A `dashPattern` interpreter now parses the value into dash and gap lengths, repeating an odd-length list to complete the alternation, and requires at least one strictly positive dash and one strictly positive gap. `5 4`, `5px 4px`, `2 0 0 3`, `5` and `1.5,2.5` pass; `none`, empty, `0 0`, `0px 0px`, `0, 0`, `0 0 0 0`, `0`, `-5 4` and `var(--x)` fail; a later rule overriding the pattern to `none` or to all-zero fails. The source-named class must still resolve to no effective pattern. The colour-independence and marker-shape checks are retained and now also resolve across every matching rule rather than the first.
F-02, a later zero-width focus override passed. The focus assertion inspected the `outline:` shorthand only, so `.psadj__toolbar button:focus-visible { outline-width: 0; }` suppressed the indicator with every test green. Added an `effectiveOutline` resolver that applies `outline`, `outline-width` and `outline-style` in source order with the CSS initial values as fallbacks — width `medium`, style `none` — so `outline: none`, `outline: 0`, `outline: 0 solid currentColor`, `outline-width: 0` and `outline-style: none` are all read as suppression. Required interactive focus selectors are derived from the component by inspecting bare element names and `[tabindex]` in the focused compound, so the rendered-record rule that indicates focus with a stroke on its `rect` is correctly not required to carry an outline. The test now asserts that the rule covering `a`, `button`, `input` and `[tabindex]` actually paints an outline, that no interactive focus selector suppresses it, and that no rule anywhere in the component removes it. The outline-based contract was retained as the owner directed; no box-shadow or border focus system was designed and no production CSS changed.
F-03, Guard 13 counted commented-out assertions. Its hand-written parenthesis matcher could not distinguish an assertion from a comment, string, template literal or regex, so commenting out a protected assertion left the guard green. Replaced the extraction path with the TypeScript compiler API already present as a declared dependency — `ts.createSourceFile` plus AST traversal — identifying top-level `test(...)` calls, their titles and callback bodies, and the `assert.<method>(...)` call expressions inside them. Only a real call expression counts, so comments and literals are excluded by construction. Per-test assertion floors, the file-level floor and the requirement that every retained guarantee appear inside an active assertion are all now computed from the parse tree; the floors were recomputed against active assertions as 17, 10 and 8 for the three protected tests and 175 for the file. The guard includes fixture checks proving the parser refuses `// assert...`, `/* assert... */`, a string, a template literal and a bare `/assert\.match/` regex, while counting multiline, nested and regex-argument assertions. The suite still contains exactly thirteen top-level guards; no guard 14 was added.
F-04, Guard 9 did not enforce lockfile byte identity. It verified parsed package names only, so a lockfile whose bytes changed while its package-name set was preserved passed. Guard 9 now reads `pnpm-lock.yaml` as raw bytes — never newline-normalised text — and pins the authorized baseline identity: 184577 bytes, SHA-256 `9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719`, hashed with Node's built-in `crypto`. The structural package-name checks are retained alongside it.
Mutation validation, in a temporary copy outside the repository; the repository working tree was never mutated. All twelve required mutations now fail: navigation `0 0`; navigation `0px 0px`; a later override to `none`; a later override to all-zero; a later `outline-width: 0`, which is the exact Codex reproduction; a later `outline-style: none`; commenting out a protected assertion; moving its vocabulary into a comment; removing it outright; appending one whitespace byte to the lockfile; rewriting the lockfile to CRLF; and changing lockfile bytes while preserving the parsed package-name set. The first six fail the interaction suite and the last six fail the guard suite, and both suites run inside `pnpm run check`. All six benign controls still pass: a different valid positive dash and gap sequence; focus declarations reordered into longhands with the same effective style; a multiline active assertion; a regex literal used as a real assertion argument; an unrelated active assertion; and benign prose containing `assert.match(...)`.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5; no package installation of any kind was performed and `node_modules` was already present): `pnpm run test:adjacency-rendering-boundary` 13/13; `pnpm run test:adjacency-interaction` 39/39; `pnpm run test:adjacency-preservation` 8/8; `pnpm run check` exit 0 with 953 tests across 21 suites, 952 passed, 0 failed, 1 skipped (the same pre-existing platform skip); `astro check` 74 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean (1243.09 KiB / gzip 247.36 KiB); `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run verify:public-surface-map` 21/21; `git diff --check` clean.
Preservation: against the base SHA there remains zero diff under `src/`, `scripts/`, `public/`, every canonical frozen path and `pnpm-lock.yaml`. Dataset 206617 bytes / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`; runtime manifest 695 bytes / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203`; lockfile 184577 bytes / `9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719`. Dependencies, devDependencies and `packageManager` are unchanged, and the remediation diff against the PR head is exactly the two test files.
Owner clarification recorded, automatic Cloudflare preview: an automatic Cloudflare preview Worker version or preview URL created by the repository's PR check is permitted review infrastructure. It is not a manual or production deployment, provided no production environment, production hostname, deployment control or manual deploy command is changed. The preview was not deleted and no new manual deployment was triggered. The accurate wording for this PR is therefore: no manual deployment; no production deployment; an automatic PR preview may exist.
Owner clarification recorded, deterministic-build condition: complete build-tree byte identity is not established, because the Astro SSR worker manifest generates a fresh key on every build. The same two `_worker.js` differences were reproduced at the unchanged baseline. P7.0 acceptance therefore requires no additional PR-only differences, zero production-source change and visitor-facing public-output identity; it must not claim 92/92 complete-tree identity. Future packages should state which of four things a deterministic gate compares: the complete output tree, baseline-reproduced SSR manifest nondeterminism, additional PR-only differences, or visitor-facing public output. This is documentation only; no production or build configuration was changed.
Process deviations retained, not erased: the earlier `pnpm install --frozen-lockfile` dependency restore and the provisioned branch suffix both remain recorded as non-blocking process deviations. No no-op corrective commit was created, the branch was not renamed, and the first commit was not rewritten.
Result: one additional commit on `claude/p7-0-rendering-boundary-guards-7nuss5`, parented on `9fd8bda1fe4d37ed1a0551492c78df78bd734ea8`, giving two commits from base. PR #95 remains draft, open and unmerged; it was not marked ready, not merged, and auto-merge was not enabled. F-05 and F-06 are recorded as owner clarifications rather than code changes; F-07 and F-08 remain disclosed.
Unresolved questions: None introduced by this remediation. The pre-existing SSR-manifest build nondeterminism remains an owner decision, now recorded as an accepted condition for P7.0.
Risks or assumptions: the stylesheet model is a bounded reader of this component's flat rules, not a CSS engine; it models declaration order, at-rule nesting and last-wins resolution, which is what the four findings require, and its non-vacuity is established by the mutation matrix above. The interactive-focus selector derivation treats bare element names and `[tabindex]` as the interactive set, so a future focus rule targeting only a class would not be classed as owing an outline; the component-wide no-suppression assertion still covers that case. Guard 13's assertion floors pin the P7.0 state and will legitimately need updating by P7.1 when it rewrites these tests. P7.1 remains unauthorized and was not started.

### 2026-07-26 — Claude Code — phase3a-p7-0-f02-focus-cascade-correction

Agent: Claude Code
Task: F-02-only bounded follow-up on P7.0 draft PR #95. The focused independent re-review confirmed F-01, F-03 and F-04 closed but found F-02 not closed: the corrected focus helper rejected an explicitly required benign control. This entry records the third commit, which corrects only that false failure. Not a new package, not P7.1. No production source change, no `package.json` change, no lockfile change, no `renderingBoundary.test.ts` change, no merge, no manual deployment, no package installation.
Authorizing evidence (external, not committed): focused re-review `P7_0_PR95_REMEDIATION_FOCUSED_RE_REVIEW.md`, 23203 bytes, SHA-256 `858ac13d69664d2cf5d8ef98ad36d3ff6cf111a31cf4ac2e99d88cd4d80d4233`, heading `# P7.0 PR #95 Remediation Focused Re-Review`, classification `Overall classification: REVISION REQUIRED.`, substantive finding `F-02 closure: NOT CLOSED.` Also re-verified: canonical plan 198155 bytes / `59c74670e2f1bf3e10e83f2e91aadcb7b9968a305e08242a5fb7c3aab040ff8c`; planning review 14359 bytes / `1ad37903dbfe6b2e0278ccfc7a8e6dfd4a84c93e245d619d3e9dea841bd4f079`; original implementation review 21339 bytes / `f753690eea3670a172efba81121b56e3bdee2daa58727203cf341d433df54635`; first remediation report 27237 bytes / `e6136b28a630b07338a1e578368942b6b56774fe9e35d51ac77839a98f677529`. Both review reports carry a corrupted final dash rendered as `??`, so neither final line was used as an identity gate.
F-01, F-03 and F-04 remain closed and were not reopened. Their implementations were not altered: the dash-pattern interpreter, the TypeScript AST Guard 13 and the raw-bytes lockfile identity are unchanged.
The false failure: the previous helper aggregated declarations only for textually identical selectors, then evaluated each selector in isolation. A narrower applicable rule such as `.psadj__toolbar button:focus-visible { outline-width: 4px; }` sets a positive width but does not restate `outline-style`, so the helper applied the CSS initial style `none` and reported suppression — even though the general rule `.psadj :is(a, button, input, [tabindex]):focus-visible { outline: 3px solid currentColor; }` had already established a visible outline for the same element. A positive width-only refinement was therefore misread as removal of the focus indicator.
The correction: the bounded stylesheet model now resolves the effective outline PER TARGET ELEMENT rather than per selector string. It parses every `:focus-visible` selector in the component into compounds and simple selectors, supporting type selectors, class selectors, attribute selectors with and without a value, descendant relationships, selector lists, `:focus-visible`, `:is(...)` alternatives and the narrower selectors used in the regression cases. A selector only styles the focused element when its subject compound carries `:focus-visible`, which continues to exclude the rendered-record rule whose subject is a descendant `rect`. Representative protected targets are an anchor, a button, a toolbar button, an input, a `[tabindex]` element and a rendered record inside `.psadj`, plus one derived automatically from every interactive focus selector the stylesheet itself declares, so a newly added focus rule is protected without editing the test. For each target, every applicable rule's declarations are composed in source order: the `outline` shorthand still resets the subproperties it does not name, while `outline-width` and `outline-style` change only their own subproperty and preserve what an earlier applicable rule established. The state is never reinitialized per selector. Unsupported selector syntax inside the protected focus set now fails closed with an explicit message instead of being silently skipped, and an unresolvable dynamic value such as `var(...)`, `calc(...)` or an unknown style keyword is rejected rather than assumed visible.
The model is deliberately conservative and is not a browser layout engine: specificity is not resolved, so any applicable later zero or `none` declaration is still treated as suppression even where real specificity might override it. The test does not depend on a final effective width of exactly `4px`; the required result is only that the focus indicator remains visible.
Positive partial overrides now pass and suppressing partial overrides still fail. Mutation testing in disposable copies outside the repository, never against the repository working tree: nine required PASS controls all pass — unmodified production CSS, the exact `.psadj__toolbar button:focus-visible { outline-width: 4px; }` reproduction, `outline-width: 2px`, a later positive `outline-style: dashed`, equivalent positive width/style/colour longhands, declaration reordering, harmless comment and formatting changes, a positive width override on another protected target, and a later full positive shorthand including an `rgb(...)` colour. Twelve required FAIL mutations all fail — later `outline-width: 0`, `outline-width: 0px`, `outline-style: none`, `outline-style: hidden`, `outline: 0`, `outline: none`, suppression of an anchor, suppression of an input, suppression of a `[tabindex]` target, removal of the establishing general focus rule, an uninterpretable protected selector using a child combinator, and an unresolved `var()` width. Preservation spot checks: navigation `stroke-dasharray: 0 0` still fails the interaction suite, a benign `7px 3px` still passes, a commented protected assertion still fails Guard 13, one appended lockfile byte still fails Guard 9, and the unchanged lockfile passes.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5; `node_modules` already present and no package installation of any kind was performed): `pnpm run test:adjacency-interaction` 39/39; `pnpm run test:adjacency-rendering-boundary` 13/13; `pnpm run test:adjacency-preservation` 8/8; `pnpm run check` exit 0 with 953 tests across 21 suites, 952 passed, 0 failed, 1 skipped (the same pre-existing platform skip); `astro check` 74 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean, which is part of the repository's normal check pipeline and is not a manual or production deployment; `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run verify:public-surface-map` 21/21; `git diff --check` clean. No newly skipped test.
Files changed by this correction: `tests/public-surface-adjacency-map/interaction.test.ts` and `AGENT_WORKLOG.md` (this entry). Nothing else. Against both the base SHA and the pre-correction head there is zero diff under `src/**`, `scripts/**`, `public/**` and `.github/**`; `tests/public-surface-adjacency-map/renderingBoundary.test.ts`, `package.json` and `pnpm-lock.yaml` are byte-identical to the pre-correction head; dependencies, devDependencies and `packageManager` are unchanged; no workflow, verifier, dataset, manifest, fallback, snapshot or generated output changed; and no P7.1 implementation token is present. Dataset 206617 bytes / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`; runtime manifest 695 bytes / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203`; lockfile 184577 bytes / `9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719`.
`renderingBoundary.test.ts` was deliberately not touched. Its Guard 13 assertion floors are minimums and tolerate the additional active assertions this correction adds; they were not raised or adjusted.
Deployment status, unchanged from the previous entry: an automatic Cloudflare PR preview may exist and is permitted review infrastructure; no manual deployment; no production deployment. PR #95 remains draft, open and unmerged, and auto-merge was not enabled.
Result: one additional commit on `claude/p7-0-rendering-boundary-guards-7nuss5`, parented on `7e2c9698a03721c6083e7d4ea7cabdbd85b1aa54`, giving three commits from base. Neither prior commit was amended, rebased, squashed or force-pushed, and neither prior worklog entry was rewritten or erased.
Unresolved questions: None introduced by this correction. Whether real CSS specificity should be modelled beyond the current bounded selector set remains an open design question; the conservative choice taken here can only over-report suppression, never under-report it, and every required benign control now passes.
Risks or assumptions: the selector model assumes every rule in this stylesheet applies beneath the component root `.psadj`, which the markup confirms, so a derived target whose own selector omits `.psadj` is rooted there. Specificity is not resolved, by design. The model interprets only the selector grammar this component uses and fails closed on anything else, so a future focus rule using a combinator, an id or another pseudo-class will fail loudly and require the model to be extended rather than silently escaping the contract. P7.1 remains unauthorized and was not started.

### 2026-07-26 — Claude Code — phase3a-p7-0-f02-specificity-and-f03-floor-correction

Agent: Claude Code
Task: Fourth bounded correction on P7.0 draft PR #95, authorized by the final focused independent re-review. Corrects F-02A specificity-based false passes, F-02B specificity-based false failures, F-02C protected `!important` not failing closed, F-03R stale Guard 13 floors, and W-01 factual errors in the previous worklog entry. Not a new package, not P7.1. No production source change, no `package.json` change, no lockfile change, no package installation, no merge, no manual deployment.
Authorizing evidence (external, not committed): `P7_0_PR95_F02_FINAL_FOCUSED_RE_REVIEW.md`, 24350 bytes, SHA-256 `06830e9178cd589817e9c26e0c922fa04c78b217131bd46a5c510f63833c39a8`, heading `# P7.0 PR #95 F-02 Final Focused Re-Review`, classification `Overall classification: REVISION REQUIRED.`, findings `F-02 closure: NOT CLOSED.`, `F-03 preservation: REGRESSED.`, `F-01 preservation: PRESERVED.`, `F-04 preservation: PRESERVED.` Also re-verified: canonical plan 198155 / `59c74670e2f1bf3e10e83f2e91aadcb7b9968a305e08242a5fb7c3aab040ff8c`; planning review 14359 / `1ad37903dbfe6b2e0278ccfc7a8e6dfd4a84c93e245d619d3e9dea841bd4f079`; original implementation review 21339 / `f753690eea3670a172efba81121b56e3bdee2daa58727203cf341d433df54635`; first remediation report 27237 / `e6136b28a630b07338a1e578368942b6b56774fe9e35d51ac77839a98f677529`; first focused re-review 23203 / `858ac13d69664d2cf5d8ef98ad36d3ff6cf111a31cf4ac2e99d88cd4d80d4233`; third-commit correction report 19296 / `16f310d8c5a7d0fcfa9ae13c1debc36e5c5c7f259e9bf631ffd364b346b32978`.
W-01, correcting the previous entry rather than rewriting it. The third entry claimed that ignoring specificity "can only over-report suppression, never under-report it". **That claim was incorrect.** Independent review proved both directions: source-order-only evaluation produced false PASSES, where an earlier higher-specificity suppression is the declaration the browser actually applies but the later general rule was allowed to win in the model, and false FAILURES, where a later lower-specificity zero was treated as suppression although the stronger general rule still paints the outline. The third entry also claimed that commenting out a protected assertion still failed Guard 13. **That claim was no longer true** after the third commit raised the protected focus test from 10 to 17 active assertions and the file to 182 while leaving the floors at 10 and 175; an independent mutation commenting out `assert.ok(/:focus-visible/.test(component));` left Guard 13 green. Both prior entries are preserved unedited as historical evidence.
F-02A and F-02B, bounded specificity. Every parsed selector-list branch now carries a specificity tuple `(ids, classes/attributes/pseudo-classes, types/pseudo-elements)`: a type selector adds `(0,0,1)`; a class selector, an attribute selector and `:focus-visible` each add `(0,1,0)`; the universal selector adds nothing; descendant relationships add nothing; and `:is(...)` adds the lexicographically greatest specificity among its alternatives. Branches are evaluated independently. The current general selector `.psadj :is(a, button, input, [tabindex]):focus-visible` therefore scores `(0,3,0)`, because `:is(...)` takes `[tabindex]` at `(0,1,0)` rather than the matched type alternative — so a selector that merely reads as narrower, such as `.psadj__toolbar button:focus-visible` at `(0,2,1)`, does not win. Unsupported syntax still fails closed and is never silently assigned zero specificity.
Per-subproperty cascade. `outline-width` and `outline-style` are now resolved independently, each won by the candidate with the greatest (specificity, rule source order, declaration order). An `outline` shorthand contributes a candidate to both subproperties and resets whichever it does not name to the CSS initial value — width `medium`, style `none`; a longhand contributes only to its own subproperty. Colour tokens are ignored and never corrupt width or style parsing. Declarations are no longer flattened into a source-order-only state machine.
F-02C, protected `!important`. The bounded contract does not authorize important declarations, so any protected focus declaration containing a syntactically valid `!important` annotation now fails closed with an explicit message. Detection is case-insensitive and tolerates whitespace between `!` and `important`; declarations are comment-stripped before parsing, so a comment cannot hide the annotation; and only parsed protected focus declarations are inspected, so the component's unrelated reduced-motion `!important` declarations and any prose elsewhere are untouched. No `!important` was added to production CSS.
Verified S-cases, all asserted inside the existing protected focus test and independently reproduced against the real component: S1, an earlier higher-specificity `(0,3,1)` suppression beats the later general `(0,3,0)` rule and correctly FAILS; S2, a lower-specificity `(0,2,1)` suppression does not defeat the general rule and a higher-specificity `(0,3,1)` positive refinement applies, so both the generic button and the toolbar button remain visible and it PASSES; S3, at equal specificity source order decides in both directions — earlier zero then later positive PASSES, earlier positive then later zero FAILS; S4, the textually narrower `(0,2,1)` toolbar suppression loses to the general `(0,3,0)` rule and now correctly PASSES, replacing the previous conservative false failure; S5A, the strongest `(0,3,1)` shorthand suppression wins both subproperties and FAILS; S5B, the general rule protects a generic button while the strongest complete positive rule protects the toolbar, and it PASSES. Consistent with this, a later `.psadj input:focus-visible { outline-width: 0; }` at `(0,2,1)` now PASSES because the general rule still wins, while a later `.psadj [tabindex]:focus-visible { outline-width: 0; }` at `(0,3,0)` is equal-specificity and later, so it FAILS. The exact benign `.psadj__toolbar button:focus-visible { outline-width: 4px; }` control PASSES; the contract is visibility, and the browser-effective width remains `3px` because the general rule is more specific — the third-commit report's claim of an effective 4px was wrong and is corrected here.
F-03R, Guard 13 floors. The TypeScript AST extractor is unchanged and remains the only counting mechanism; no text counting was introduced. The floors were recomputed from the final parse tree after every edit in this commit: the protected focus test now has 36 active assertions and the whole interaction file 201, so the floors were raised from 10 to 36 and from 175 to 201. The edge-class floor stays 17 and the responsive floor stays 8, both still accurate. One Guard 13 literal-coupling check was made precise rather than removed: the focus-outline literal is coupling only when matched against the component, since the new cascade fixtures legitimately declare it as their own synthetic stylesheet input. Independently verified: line-commenting or block-commenting an original protected assertion fails Guard 13 even with comment, string and regex lookalikes added; removing any one new specificity assertion drops the count from 36 to 35 and fails; removing the protected focus test fails; inactive lookalikes alone do not count and pass. The interaction suite remains exactly 39 tests and the rendering-boundary suite exactly 13.
Mutation validation, in disposable copies outside the repository; the repository working tree was never mutated. Eleven required PASS controls all pass: current production CSS; the exact later toolbar `outline-width: 4px`; another lower-specificity positive width-only rule; S2; S3 earlier equal-specificity zero with a later positive; S4; S5B; equivalent positive longhands; harmless declaration reordering; harmless comments and formatting; and a lower-specificity later input zero that the stronger general rule defeats. Twelve required FAIL mutations all fail: S1; S3 earlier positive with a later equal-specificity zero; S5A; a later equal-specificity `[tabindex]` zero; a higher-specificity anchor suppression; a higher-specificity input suppression; removal of all visible focus establishment; an unresolved protected `var(...)`; unsupported protected selector syntax; and all three protected `!important` forms — `outline: 0 !important`, `outline-width: 0 ! IMPORTANT` and `outline-style: none!important`.
F-01 and F-04 remain preserved and were not reopened: navigation `stroke-dasharray: 0 0` still fails the interaction edge-class test, a valid `6 3` pattern still passes, one appended lockfile byte still fails Guard 9, and the unchanged lockfile passes.
Build / tests run locally (Linux, node v22.22.2, pnpm 10.34.5; `node_modules` already present and no package installation of any kind was performed): `pnpm run test:adjacency-interaction` 39 tests, 39 pass, 0 fail, 0 skipped; `pnpm run test:adjacency-rendering-boundary` 13 tests, 13 pass, 0 fail, 0 skipped; `pnpm run test:adjacency-preservation` 8 tests, 8 pass, 0 fail; `pnpm run check` exit 0 with 953 tests across 21 suites, 952 passed, 0 failed, 1 skipped; `astro check` 74 files, 0 errors, 0 warnings, 6 hints; `tsc --noEmit` clean; `wrangler deploy --dry-run` clean, which runs only inside the repository's existing `check` script and is not a manual or production deployment; `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run verify:public-surface-map` 21/21; `git diff --check` clean. The single local skip is `verifier traversal: a real unreadable nested directory (chmod)` in `test:indexing-discovery`, which skips here because this environment runs as root and `chmod` cannot make a directory unreadable to root; the same test executes under CI's unprivileged user, which is why live CI reports 953 passed and 0 skipped. That reconciles the non-blocking C-01 reporting discrepancy the review raised, and live CI counts are recorded separately from local counts rather than being reused.
Files changed by this correction: `tests/public-surface-adjacency-map/interaction.test.ts`, `tests/public-surface-adjacency-map/renderingBoundary.test.ts`, and `AGENT_WORKLOG.md` (this entry). Nothing else. Against both the base SHA and the pre-correction head `eb7bbe5c1811b5993826a4b7546465455a0c540e` there is zero diff under `src/**`, `scripts/**`, `public/**` and `.github/**`; `package.json` and `pnpm-lock.yaml` are byte-identical to the pre-correction head; dependencies, devDependencies and `packageManager` are identical to the base; no verifier, dataset, manifest, fallback, snapshot or generated output changed; and no P7.1 implementation exists. Dataset 206617 bytes / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`; runtime manifest 695 bytes / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203`; lockfile 184577 bytes / `9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719`.
Deployment status: an automatic Cloudflare PR preview may exist and is permitted review infrastructure; no manual deployment; no production deployment; the existing preview was neither changed nor removed. PR #95 remains draft, open and unmerged, and auto-merge was not enabled.
Result: one additional commit on `claude/p7-0-rendering-boundary-guards-7nuss5`, parented on `eb7bbe5c1811b5993826a4b7546465455a0c540e`, giving four commits from base. None of the first three commits was amended, rebased, squashed or force-pushed, and no earlier worklog entry was rewritten or erased.
Unresolved questions: the bounded model resolves specificity, source order and declaration order, and fails closed on importance, unsupported selector syntax and unresolvable values. It does not model cascade layers, `@scope`, inline styles, transitions or animations, none of which the protected focus surface uses; if any is introduced, the model must be extended rather than assumed. Whether to model importance properly instead of failing closed is left to the repository owner.
Risks or assumptions: the selector model assumes every rule in this stylesheet applies beneath the component root `.psadj`, which the markup confirms. Representative targets cover the interactive contexts the component renders plus one derived from every interactive focus selector declared, so a newly added focus rule is protected automatically. Guard 13's floors pin the current state and will legitimately need recomputation whenever a later package edits these tests — a stale floor is exactly the defect corrected here. No finding is self-certified as closed; a further independent focused review is required. P7.1 remains unauthorized and was not started.

### 2026-07-26 — Claude Code — phase3a-p7-0-focus-cascade-comment-correction

Agent: Claude Code
Task: Documentation-only cleanup after commit `98ad65439a90ad3bb071caa555acc052631697eb`. That commit replaced the source-order-only focus model with bounded CSS specificity, independent `outline-width` / `outline-style` cascade resolution, protected `!important` fail-closed behaviour and recomputed Guard 13 floors, but left behind comments from the superseded third-commit implementation that now contradicted the code. Only those comments were corrected.
Obsolete comments corrected in `tests/public-surface-adjacency-map/interaction.test.ts`: the bounded-selector-model header block claimed the model "composes their declarations in source order", that it is "deliberately conservative rather than a full engine — specificity is not resolved", and that "a later applicable zero or `none` declaration is always treated as suppression even where real specificity might override it". All three statements were false as of the fourth commit. The replacement states what the code actually does: each selector-list branch is parsed independently and carries a specificity tuple of ids, classes/attributes/pseudo-classes and types/pseudo-elements; `:is(...)` contributes the lexicographically greatest specificity among its alternatives, which is why the general selector scores (0,3,0) and outranks the textually narrower `.psadj__toolbar button:focus-visible` at (0,2,1); matching declarations contribute independent candidates for `outline-width` and `outline-style`; each subproperty is resolved by specificity, then rule source order, then declaration order; unsupported selector syntax and protected `!important` both fail closed; and the model intentionally supports only the component's authorized selector grammar and is not a complete CSS engine, with cascade layers, `@scope`, inline styles, transitions and animations explicitly out of scope. The outline-resolution JSDoc was likewise expanded to say that it only expands a declaration into candidates and decides nothing, that the shorthand contributes to both protected subproperties while a longhand contributes only to its own, that candidates are compared by specificity before source and declaration order so a later declaration does not simply win, and that an unresolvable dynamic value or a protected `!important` declaration never establishes visibility. No comment now claims that the toolbar `outline-width: 4px` rule produces an effective 4px width.
No executable logic, assertion, fixture, specificity tuple, cascade calculation, test count or Guard 13 floor changed. Verified mechanically with the TypeScript compiler API by comparing the parse tree before and after with JSDoc nodes excluded: 10335 executable tokens before and after, token stream identical; 620 string, template and regex literals identical, so every CSS fixture string is unchanged; 210 `assert` call expressions identical. Every changed line in the diff is a comment line.
Counts after the edit, recomputed from the parse tree: interaction tests 39; whole-file active assertions 201; protected focus test 36; edge-class test 17; responsive test 8. Guard 13 floors remain 36 and 201, with the edge floor 17 and responsive floor 8 unchanged. The rendering-boundary suite remains 13 tests.
F-01 through F-04 implementations are untouched: the dash-pattern interpreter, the specificity-aware focus cascade, the TypeScript AST Guard 13 extractor and the raw-bytes lockfile identity are all unchanged.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5; `node_modules` already present, no package installation): `pnpm run test:adjacency-interaction` 39 tests, 39 pass, 0 fail, 0 skipped; `pnpm run test:adjacency-rendering-boundary` 13 tests, 13 pass, 0 fail, 0 skipped; `pnpm run test:adjacency-preservation` 8 tests, 8 pass, 0 fail, 0 skipped; `git diff --check` clean. A full `pnpm run check` was not rerun, because this correction changes only comments and the targeted suites plus live CI cover it.
Files changed: `tests/public-surface-adjacency-map/interaction.test.ts` (comments only) and `AGENT_WORKLOG.md` (this entry). No production source, `renderingBoundary.test.ts`, `package.json`, `pnpm-lock.yaml`, workflow, verifier, dataset, manifest or generated-output change, and no P7.1 implementation. No package installation. No manual deployment and no production deployment; an automatic Cloudflare PR preview may remain and was neither changed nor removed. PR #95 remains draft, open and unmerged, and auto-merge was not enabled.
Result: one additional commit parented on `98ad65439a90ad3bb071caa555acc052631697eb`, giving five commits from base. No prior commit was amended, rebased, squashed or force-pushed, and no prior worklog entry was rewritten — the earlier entries remain as historical evidence, with their factual corrections already recorded in the fourth-commit entry.
Unresolved questions: None introduced. A final independent focused review is still required; nothing here is self-certified as closed.
Risks or assumptions: comment-only changes cannot alter behaviour, and that claim is backed by the token-stream, literal and assertion comparisons above rather than by inspection alone. P7.1 remains unauthorized and was not started.

### 2026-07-26 — Claude Code — phase3a-p7-1-radial-geometry-foundation

Agent: Claude Code
Task: P7.1 commit A of the approved two-commit sequence — the additive radial geometry foundation. Authorized by the owner-approved repository-grounded P7.1 implementation plan (107,969 bytes, SHA-256 `287152b6251af198abc2449211ab0eaca165f5098abb4c065a895d5101fdc356`, 1,448 lines, final substantive text `P7.1 PLAN READY FOR OWNER REVIEW`), with owner rulings Q1 through Q5 all approved. Retained authority: `PHASE3A_P7_CANONICAL_IMPLEMENTATION_PLAN_REV2_2_3.md` 198,155 / `59c74670e2f1bf3e10e83f2e91aadcb7b9968a305e08242a5fb7c3aab040ff8c`; `P7_REV2_2_3_FOCUSED_INDEPENDENT_RE_REVIEW.md` 14,359 / `1ad37903dbfe6b2e0278ccfc7a8e6dfd4a84c93e245d619d3e9dea841bd4f079`; `P7_0_PR95_FINAL_INDEPENDENT_ACCEPTANCE_REVIEW.md` 22,783 / `80b4040e2bdedb125351b304f7695e96d6b3be2137cca9e395ee998f47c36f27`. Branch created from `main` at `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`, the squash-merge result of accepted P7.0 PR #95.
Nothing is removed in this commit. The old column layout, the old spatial resolver and the resize-based responsive path all remain present and wired, so this pushed state carries the complete pre-existing keyboard navigation. That is the R1 invariant: removal happens only in commit B, in the same commit that wires the replacement.
Added to `layout.ts`, all pure and all additive: the canonical deterministic orders `CONCEPT_GROUP_ORDER`, `CONCEPT_ORDER`, `ROLE_ORDER`, `ROLE_ORBIT_ORDER` and `GRAPH_RECORD_ORDER`; the canonical edge comparator `compareEdges` and `assignLanes` with its `(edge_class, source, target)` uniqueness assertion; the single shared serializer `formatLogicalNumber` with `LOGICAL_DECIMAL_PLACES = 3`; every normative geometry constant including `GROUP_ARC_R = 370`, `RING_INTERIOR_DIAGNOSTIC_EPSILON = 0.001` and `CLEARANCE_SOLVER_EPSILON = 1e-9`; the coordinate producers `computeRadialLayout`, `computeRoleOrbit` and `groupArcPath`; both routing forms through `computeEdgeRouting` with `bisectorDirection` and its diametric fallback; the exact centre-clearance solver `minimumQuadraticBezierRadius` over a first-party deterministic cubic root finder with Newton polish; `sampledMinimumBezierRadius` as a secondary regression aid only; `ringInteriorDiagnostic`; `buildDirectionalIndex` and `resolveDirectionalTarget`; and `resolveReadoutLabel`.
Added `decor.ts` — committed literal marks only, importing nothing at all, with no generator, seed, randomness or build step; and `emphasis.ts` — a pure neighbourhood resolver reading only verified snapshot edges filtered by current class visibility, returning exactly two id sets and no coordinate, path, order or semantic field.
Frozen measurements independently reproduced by this implementation against the adopted snapshot: `CONCEPT_GROUP_ORDER` is the seven measured keys; `GRAPH_RECORD_ORDER` is 59 entries, first `ai-readable-knowledge-architecture.md`, last `public-anchors/ai-training-boundary-statement.md`; grouping spans 6/10/6/4/6/7/10 at contiguous index ranges 0-5, 6-15, 16-21, 22-25, 26-31, 32-38, 39-48; all ten published role-orbit coordinates identical to three decimals; the three role-label midpoints -72, 90 and 234 degrees at 625.770/112.920, 500.000/907.000 and 260.771/170.730; routing counts 125 same-group, 258 cross-group, 383 total; 40 distinct ordered cross-group buckets with the heaviest holding 15, so no lane wraps at `LANE_COUNT` 16; the exact cross-group minimum **127.28851029932308** and the exact same-group minimum **319.7675861803592**, both bit-identical to the frozen owner values; every one of the 383 paths at or above `CENTRAL_TEXT_CLEAR_R` 118; and the ring-interior diagnostic reporting **8 of 125** at 0.001, stable across 1e-9, 1e-6, 0.001 and 0.01 while a strict comparison over-reports.
One measured observation, reported rather than absorbed. The path ATTAINING the cross-group minimum differs from the one named illustratively in REV2.2.3 section 8.4. This implementation's minimum is attained by `navigation_adjacency::delegated-execution-retained-answerability.md->boundary-role-segmentation-model.md` at lane 0, control radius 244; the section 8.4 path `navigation_adjacency::generation-condition-disclosure-reproducibility-cross.md->model-use-reporting-boundary-protocol.md` is also present, also at lane 0, and measures 127.28851029932314 — six parts in 1e-14 above the minimum. Both are near-diametric chords in the same lane and the two values differ by roughly 27 units in the last place. The NORMATIVE value is reproduced exactly and no path fails the gate, so no stop condition is triggered. This is the same class of artefact REV2.2.3 section 0.1.4 already recorded when it corrected its own predecessor's named path: the value is normative, the worst-path identity is illustrative.
Guard 10(a) re-scoped under owner ruling Q2, from `the layout module must take no edge input` to `the coordinate producers must take no edge input`. The re-scope was required the moment `compareEdges` and `assignLanes` landed, because a module-wide ban would reject the canonical specification rather than a violation. Protected producers are `CONCEPT_GROUP_ORDER`, `CONCEPT_ORDER`, `ROLE_ORBIT_ORDER`, `GRAPH_RECORD_ORDER`, `computeRadialLayout`, `computeRoleOrbit`, `groupArcPath` and `buildDirectionalIndex`. Parameter renaming as an evasion was explicitly not used: `assignLanes` and `computeEdgeRouting` keep the parameter name `edges`, and the guard now asserts that they DO consume edge input, so the scope split is real rather than vacuous. Decisive mutation evidence is asserted inside the guard: the real `computeRadialLayout` body is mutated to read `edges.length`, the mutation is asserted to have actually changed the body, the unmutated producer passes, and the mutated producer fails.
`FUTURE_IMPLEMENTATION_TOKENS` re-scoped to P7.2 only, as the plan section 6.11 authorizes. The P7.1 vocabulary has now landed and is asserted by the P7.1 suites, so keeping it on a FORWARD prohibition list would forbid P7.1 from describing its own implemented behaviour. The list is extended rather than merely trimmed — `viewport.ts`, `clampScale`, `stepScale`, `zoomAbout`, `clampOffset`, `centreOn`, `resetTransform`, `transformAttr`, `Zoom In` and `Zoom Out` are added alongside the retained `fitLogicalBounds`, `Reset Exploration`, `Focus Record` and `Fit All` — so the forward boundary is tighter than before. No guard was deleted, weakened or made vacuous, and no floor was lowered.
Added `radialLayout.test.ts` — canonical checks 14 to 61 and 130 to 137, exactly 56 registrations, asserted at load. Mathematical claims use full-precision values with explicit tolerances; serialized claims use strings; the two are never mixed. Absence assertions carry positive controls and count assertions pin population sizes. A dense 1,000,000-point sweep is used as an independent oracle for the solver, and permutations are generated deterministically with no `Math.random` anywhere.
Files changed: `src/lib/public-surface-adjacency-map/layout.ts`, `src/lib/public-surface-adjacency-map/decor.ts` (new), `src/lib/public-surface-adjacency-map/emphasis.ts` (new), `tests/public-surface-adjacency-map/radialLayout.test.ts` (new), `tests/public-surface-adjacency-map/renderingBoundary.test.ts`, `package.json`, `AGENT_WORKLOG.md`. No component, client, route, wording, verifier, dataset, manifest, fallback, snapshot, workflow or generated-output change. `dependencies`, `devDependencies`, `packageManager` and `pnpm-lock.yaml` are untouched; the only `package.json` change is the `test:adjacency-radial-layout` script and its `check` wiring, appended after the existing adjacency block so the preservation suite's base-pipeline PREFIX assertion still holds.
Tests run locally (Linux, node v22.22.2): `radialLayout` 56 tests, 56 pass, 0 fail, 0 skipped; `interaction` 39/39; `preservation` 8/8; `metadataIndexing` 10/10; `contract` 58/58; `endpointRouting` 10/10; `runtimeLoader` 23/23; `runtimeManifest` 18/18. `git diff --check` clean.
Environment limitation, stated plainly rather than worked around: this container has NO `node_modules`, and package installation is prohibited by the task instruction. `renderingBoundary.test.ts` imports the TypeScript compiler API for its Guard 13 AST extractor and therefore cannot execute here, and `pnpm run check`, `astro build` and both build verifiers cannot run either. The re-scoped Guard 10(a) predicate and the Guard 13 AST counting were instead exercised by a measurement harness held entirely outside the repository, which reproduced the existing P7.0 floors exactly — 39 tests, 201 whole-file active assertions, protected counts 36, 17 and 8 — confirming it is a faithful replica of the guard's own counting. The repository's guard remains bound to its pinned TypeScript 5.9.3 and runs unchanged in CI. No package was installed and no dependency was added.
Unresolved questions: whether the owner wants `pnpm install --frozen-lockfile` permitted in future rounds so the pinned toolchain can be exercised locally before pushing. It cannot alter `package.json` or `pnpm-lock.yaml`, but it is literally package installation and was therefore not performed.
Risks or assumptions: the cross-group worst-path identity differs from the illustrative path named in REV2.2.3 section 8.4 while the normative minimum reproduces bit-exactly; this is recorded above as a measurement, not absorbed. The `decor.ts` literals were chosen to satisfy the asserted constraints — every mark outside the central clear radius and disjoint from all 59 record coordinates — and are reviewed as authored values; the automated checks establish the absence of generators, randomness, dataset inputs and layout inputs, and do not claim to establish the historical origin of each literal. P7.2 and P7.3 were not started, and no viewport, pointer, shortcut or deferred-control surface exists in this commit.

### 2026-07-26 — Claude Code — phase3a-p7-1-radial-constellation-interface

Agent: Claude Code
Task: P7.1 commit B of the approved two-commit sequence — the atomic interface and navigation swap. Same authorizing plan and evidence identities as the previous entry. This is the commit in which the old navigation is removed, and it is the same commit that authors all 59 sequentially focusable record controls and wires the replacement resolver. No submitted state between the two commits lacks keyboard navigation.
Authored the SVG statically. The `<svg>`, the five named layers, the single viewport wrapper and all 59 record controls are now written in the component rather than built at runtime. That is what makes layer identity, layer order and authored control order observable to a source contract and to the build verifier at all, and it is required because sequential Tab order follows authored DOM order and sequential Tab order is the complete keyboard-reachability surface. The `decor` layer sits outside the viewport wrapper; `edges`, `arcs`, `centre` and `nodes` sit inside it. Every control carries `tabindex="0"`, `role="button"`, `aria-pressed`, and the exact untruncated accessible name `{display_label}. {role} record.`; no control carries `tabindex="-1"` and the client never writes a tabindex, so no roving-tabindex design exists.
Replaced runtime teardown with keyed joins. `host.selectAll("*").remove()` is deleted outright. Edges are a keyed D3 join into the authored edge layer; record controls are never created, removed, sorted or re-inserted — only their state attributes are written — so focus survives every redraw and authored order is preserved. The window `resize` listener at the old line 206 is deleted; responsiveness is now a fixed `0 0 1000 1000` viewBox with `preserveAspectRatio="xMidYMid meet"` plus CSS.
Wired the P7.1 interaction surface: arrow keys call only `resolveDirectionalTarget`, and a `null` result leaves focus, selection and presentation untouched and does not consume the key; Home and End resolve to the first and final `GRAPH_RECORD_ORDER` entries; Enter, Space and both Escape paths are retained with their existing no-op guards; the `<p data-psadj-label-readout aria-hidden="true">` readout is written with `textContent` only and resolved through the focus to hover to selection to neutral precedence; neighbourhood emphasis is applied as CSS state classes from `emphasis.ts`. Focus state is cleared only in the `focusout` path — neither selection nor hover writes it — so hover can never steal a keyboard user's label. No custom Tab or Shift+Tab handler exists and no `preventDefault` is reachable from a Tab branch.
Page composition is graph-first. Boundary statements, not-claims, the relationship sentence and the data-status row all stay outside the collapsed `<details>` about-region, which relocates snapshot identity, counts, the extended legend, the fixed-band summary and the groupings without removing any of them. The compact legend carries the approved grouping-arc statement verbatim and is never hidden, so that statement is present in the no-JS fallback. The route width moved from 1200px to 1440px inside the existing route-scoped block only; `BaseLayout.astro` still declares no width and `/public-surface-map/interactive/` still declares its own 1200px.
Grouping arcs render at the fixed `GROUP_ARC_R = 370` and are non-interactive in P7.1: no listener, no `tabindex`, no control role, and no placeholder for P7.2 activation. The toolbar renders exactly the two functional edge-class toggles; none of Zoom Out, Zoom In, Fit All, Reset Exploration or Focus Record is rendered, and no disabled, hidden or `aria-disabled` placeholder for any of them exists.
Removed from `layout.ts` in this same commit: `computeSemanticLayout`, `computeFixedBands`, `groupConceptNodes`, `columnsForWidth`, `resolveColumnsPerBand`, `buildNavigationIndex`, `sortNavigationIndex`, `resolveSpatialTarget`, the private `nearestInColumn` and `columnsInBand`, the dead `SemanticLayout*`, `FixedBand*` and `SpatialNavigationNode` interfaces, and `ADJACENCY_LAYOUT_METRICS` with `GROUP_REGION_WIDTH`. Retained: `compareText`, `compareNodes`, `shortenLabel`, `LayoutPoint`, `SpatialDirection`, `SPATIAL_DIRECTIONS`, `directionForKey`. `firstReachableId` and `lastReachableId` keep their names and null behaviour and now read the canonical directional index.
Bounded test retargeting, exactly as plan sections 6.10 and 6.11 authorize. `interaction.test.ts` remains **exactly 39 tests**; no test was added, deleted or thinned. Eleven tests were retargeted off removed APIs, and four were retargeted because P7.1 moved their subject: record focusability and the graph title/description moved from the client to the component, the narrow-width test moved from a resolved column count to the responsive grid, and the arrow-reachability test was retargeted to the sequential-reachability contract — that test previously asserted that arrow keys reach all 59 records, which is exactly the claim F1 refuted and which the radial layout would make false. One further retarget was substantive and is flagged for review: the edge-class test previously asserted that neither class carries any stroke colour at all. P7.1 assigns each class an approved hue as a SECONDARY cue, so the assertion now states the actual guarantee more directly — strip every colour declaration from both class rules and the two must STILL differ, and specifically still differ in the dash channel. Colour-alone distinction remains prohibited and is asserted.
`renderingBoundary.test.ts` changes are bounded to what P7.1 falsifies, and all thirteen guards remain active. The module-level stripper self-check now pins `computeRadialLayout` instead of the removed `computeSemanticLayout`. Guard 11 is re-scoped: it previously required the resize listener to still EXIST, which P7.1 removes, so it now bans both `ResizeObserver` and any resize listener and additionally asserts the static replacement is present, so it cannot pass because responsive behaviour was dropped. Guard 13's `RETAINED` table swaps the `columnsForWidth` guarantee for the responsive-grid guarantee that survives. Guard 10(a) and the forward token list were re-scoped in commit A and are unchanged here.
Guard 13 floors recomputed from the final TypeScript AST state, never lowered: interaction tests **39** (unchanged, exact); whole-file active assertions **201 to 220**; protected edge-class test **17 to 21**; protected focus test **36** (unchanged); protected responsive test **8 to 9**. Every floor rose or held.
Added `directionalNavigation.test.ts` (canonical checks 62 to 83, exactly 22) and `visualState.test.ts` (canonical checks 84 to 129 and 138 to 151, exactly 60). Both assert their own registration count and their own freedom from skip, todo and placeholder markers at load, with their prohibition vocabularies stripped before self-scanning. The directional file additionally asserts that NO check in it references an arrow reachability, connectivity or coverage property, so the refuted gate cannot creep back in.
Build verifier: PSADJ-09 extended with the P7.1 required visible wording, and new checks PSADJ-15 through PSADJ-21 added for layer structure, the 59 emitted controls in canonical order with focusable tabindex and accessible names, the readout element contract and placement, the two-control toolbar with no deferred control or placeholder, route width and responsive grid, grouping arcs at radius 370 serialized to three decimals and non-interactive, and a build-output boundary scan. PSADJ-01 through PSADJ-14 are unchanged and unweakened.
P7.1 automated check allocation, as approved under Q5: `radialLayout` 56, `directionalNavigation` 22, `visualState` 60, build verifier 3 — total **141**.
Tests run locally (Linux, node v22.22.2), all with 0 skipped: `radialLayout` 56/56; `directionalNavigation` 22/22; `visualState` 60/60; `interaction` 39/39; `preservation` 8/8; `metadataIndexing` 10/10; `contract` 58/58; `endpointRouting` 10/10; `runtimeLoader` 23/23; `runtimeManifest` 18/18; `authority-layout` 68/68; `authority-viewport` 61/61; `authority-keyboard` 38/38; `contracts` 52/52. `git diff --check` clean. Frozen-path diff against the base is empty. Dataset 206617 / `0b763eb78fea5c53364609ecc5d7019422c54b950d32f29f79ad37f24f1637b7`; runtime manifest 695 / `eddc63e3cb0e382ed36b24b87c58e1a3c5196184d5c4c71d9a602762984df203`; lockfile 184577 / `9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719` — all unchanged. `dependencies`, `devDependencies` and `packageManager` are byte-identical to the base; the only `package.json` change is the three P7.1 test scripts and their `check` wiring.
Environment limitation, unchanged from commit A and stated plainly rather than worked around: this container has no `node_modules` and package installation is prohibited by the task instruction, so `renderingBoundary.test.ts` (which imports the TypeScript compiler API), `pnpm run check`, `astro build` and both build verifiers could not execute here. The Guard 13 floors above were measured with a harness held entirely outside the repository that replicates the guard's own AST extractor; it reproduced the pre-existing P7.0 floors exactly before being used to compute the new ones, which is the evidence that it is a faithful replica. The re-scoped Guard 10(a) predicate was exercised the same way, including its decisive mutation. The verifier was loaded to confirm it registers all 21 checks and fails only on the absent `dist/`. Everything in that list runs under the pinned toolchain in CI, and the CI result is reported separately from these local results rather than assumed.
D-evidence status: D15, D18, D20 and D22 are **PENDING OWNER PREVIEW REVIEW**. They are not satisfied by any automated result and none is self-certified here. D18 in particular remains the unresolved blocking gate on role-label rendered clearance; no role record was moved, no role orbit radius was changed, no role order was changed and no label offset was silently added.
Files changed across the P7.1 package: `src/lib/public-surface-adjacency-map/layout.ts`, `decor.ts` (new), `emphasis.ts` (new), `publicWording.ts`, `src/components/PublicSurfaceAdjacencyMap.astro`, `src/scripts/public-surface-adjacency-map.ts`, `src/pages/public-surface-map/expanded/index.astro`, `tests/public-surface-adjacency-map/radialLayout.test.ts` (new), `directionalNavigation.test.ts` (new), `visualState.test.ts` (new), `interaction.test.ts`, `renderingBoundary.test.ts`, `scripts/verify-public-surface-adjacency-map-build.mjs`, `package.json`, `AGENT_WORKLOG.md` — exactly the fifteen files the owner approved under Q1, and no other file.
Unresolved questions: whether the owner accepts the edge-class colour retarget described above, which is the one retarget that changes what an existing assertion claims rather than only how it is expressed. Whether `pnpm install --frozen-lockfile` should be permitted in future rounds so the pinned toolchain can be exercised locally before pushing.
Risks or assumptions: the cross-group worst-path identity differs from the illustrative path named in REV2.2.3 section 8.4 while both normative minima reproduce bit-exactly, as recorded in the previous entry. The bounded focus model in `interaction.test.ts` fails closed on selector syntax it does not support, so the halo rules are authored as separate `:hover` and `:focus-visible` rules rather than one selector list; pairing them would make a legitimate rule unevaluable rather than unsafe. P7.2 and P7.3 were not started: no `viewport.ts`, no zoom, pan, drag, pinch, pointer capture, grouping-arc activation or graph-scoped shortcut exists, and no placeholder for any of them.

### 2026-07-26 — Claude Code — phase3a-p7-1-astro-check-type-correction

Agent: Claude Code
Task: Correction on the P7.1 draft PR #96, fixing the two `astro check` type errors reported by the first CI run on head `7d2ce51875c7cd95cf3eb04dcbfbada7e33a95a0`. Not a new package, not a scope change, and no behavioural change to the rendered surface.
Cause, stated plainly: this container has no `node_modules` and package installation is prohibited, so `astro check` and `tsc --noEmit` could not run locally before pushing. Both errors are exactly the class the pinned toolchain catches and the Node suites cannot: `src/components/PublicSurfaceAdjacencyMap.astro:332` used `pointOf.get(node.id)` directly in the template, and `Map.get` is `LayoutPoint | undefined` under strict mode, so `point.cx` and `point.cy` were both `ts(18048) 'point' is possibly 'undefined'`.
Correction: added a `pointFor(id)` helper in the frontmatter that resolves the authored coordinate and THROWS when a record has none. Every record in `GRAPH_RECORD_ORDER` belongs to exactly one of the two coordinate spaces, so a miss is impossible by construction — but the route is prerendered, so failing the build is the correct response to an impossible state, and inventing a fallback position is not. The template now receives a non-optional `LayoutPoint`. No coordinate, order, path or attribute changed; the emitted markup is identical.
Also removed the unused `ROLE_LABEL_R` import from the component (role-label coordinates already arrive resolved on `orbit.labels`), and removed the unused `DECOR_VIGNETTE` export from `decor.ts` rather than shipping a constant nothing renders. Check 90 keeps the same assertion count: the vignette frozen-check was replaced by a stronger one asserting every individual mark object is frozen, so no consumer can mutate one in place, plus an assertion that the committed array is frozen in source.
Files changed: `src/components/PublicSurfaceAdjacencyMap.astro`, `src/lib/public-surface-adjacency-map/decor.ts`, `tests/public-surface-adjacency-map/visualState.test.ts`, `AGENT_WORKLOG.md`. All four are inside the approved fifteen-file allowlist. No production behaviour, no dataset, manifest, fallback, lockfile, dependency or verifier change.
Tests rerun locally, all 0 skipped: `radialLayout` 56/56; `directionalNavigation` 22/22; `visualState` 60/60; `interaction` 39/39; `preservation` 8/8. Guard 13 floors recomputed and unchanged by this correction — 39 tests, 220 whole-file, 21/36/9 protected — because `interaction.test.ts` was not touched here.
Result: one additional commit on `claude/p7-1-radial-constellation`, parented on `7d2ce51875c7cd95cf3eb04dcbfbada7e33a95a0`. Neither prior commit was amended, rebased, squashed or force-pushed, and no prior worklog entry was rewritten. The R1 invariant is unaffected: this commit touches neither resolver.
Unresolved questions: unchanged from the previous entry.
Risks or assumptions: the local Node suites cannot substitute for `astro check` and `tsc --noEmit`, which is precisely why this correction was needed; any further type error will surface only in CI under the same constraint.

### 2026-07-26 — Claude Code — phase3a-p7-1-psadj21-scope-correction

Agent: Claude Code
Task: Second correction on P7.1 draft PR #96, fixing the single failing build-verifier check on head `3cd078c871aed2c63a202288340eced3484c9237`. Not a scope change and not a production-source change.
Result of that CI run, recorded before the correction: `astro check` passed with 0 errors; the full build ran; every Node suite passed; and PSADJ-01 through PSADJ-20 all passed, including the six new P7.1 checks. The sole failure was PSADJ-21, the check this package itself added.
Cause: PSADJ-21 scanned every `.js` file in `dist/_astro` rather than the adjacency route's own chunks. That directory also holds the frozen authority-map product's bundles and Astro's shared runtime, which legitimately contain `requestAnimationFrame`. The check was therefore reporting another product's code as this route's violation — a mis-scoped guard, and the canonical instruction is explicit that the scan covers the adjacency route's OWN chunks.
Correction: PSADJ-21 now selects bundles exactly as PSADJ-11 already does — those referencing `/public-surface-map/expanded/data/` — and throws if none is found, so the narrowing cannot make the check vacuous. The prohibited-token list is unchanged and nothing was removed from it.
Files changed: `scripts/verify-public-surface-adjacency-map-build.mjs`, `AGENT_WORKLOG.md`. Both inside the approved allowlist. No production source, component, client, layout, dataset, manifest, fallback, lockfile or dependency change, and no test assertion changed.
Result: one additional commit, parented on `3cd078c871aed2c63a202288340eced3484c9237`. No prior commit was amended, rebased, squashed or force-pushed. The R1 invariant is unaffected: this commit touches neither resolver.
Unresolved questions: unchanged.
Risks or assumptions: narrowing a scan is a weakening if done carelessly, so the check now fails closed when no adjacency bundle is found, which is the same protection PSADJ-11 carries.

### 2026-07-26 — Claude Code — phase3a-p7-1-psadj21-token-scoping

Agent: Claude Code
Task: Third correction on P7.1 draft PR #96, completing the PSADJ-21 scoping fix on head `fccc205a4eeb7c40252125fa1a86f8959f62d82a`. Verifier-only; no production source, test assertion or contract change.
The previous correction narrowed PSADJ-21 to the adjacency route's own JS chunks but still scanned the whole rendered document for every token. `requestAnimationFrame` is present in the page HTML because the rendered document also carries the shared site chrome, which is not this route's output and not this package's to police. The check was therefore still reporting another surface's code as an adjacency violation.
Correction: each token is now scanned where it could actually originate from this product. Markup-level prohibitions — a CodePen reference, a `<canvas>` element, an embedded external runtime surface — are scanned against the route's own HTML, where this component is the author. Runtime prohibitions — CodePen, WebGL renderer or context, a WebGL context request, an animation frame loop, a random source, and `ResizeObserver` — are scanned against the adjacency route's own bundles, selected exactly as PSADJ-11 selects them and failing closed when none is found. No token was dropped; the markup list gained the embedded-surface prohibition, so the check is broader than before rather than narrower.
This is the same class of correction the P7.0 package documented at the head of its guard file: a guard that fails on code it does not govern is mis-scoped, and the guard is corrected rather than the source.
Files changed: `scripts/verify-public-surface-adjacency-map-build.mjs`, `AGENT_WORKLOG.md`. Both inside the approved allowlist.
Recorded from the previous CI run, before this correction: `astro check` 0 errors; full build green; every Node suite green with 0 skipped; PSADJ-01 through PSADJ-20 all PASS, including the six new P7.1 checks. PSADJ-21 was the only failure and is the check this package itself added.
Result: one additional commit, parented on `fccc205a4eeb7c40252125fa1a86f8959f62d82a`. No prior commit was amended, rebased, squashed or force-pushed. The R1 invariant is unaffected.
Unresolved questions: unchanged.
Risks or assumptions: splitting one scan into two narrows each individually, so the check fails closed when no adjacency bundle is found and the markup list was extended rather than trimmed.

### 2026-07-26 — Claude Code — phase3a-p7-1-p7-01-build-verifier-allocation

Agent: Claude Code
Task: Bounded correction round for finding **P7-01** only, from the independent P7.1 PR #96 implementation and R1 review (19,469 bytes / `faed6d4851592e1dd456ca0491be078850d616e5b9a57e2411e8cf3a8648b4ea` / 436 lines / final line `P7.1 PR #96 INDEPENDENT IMPLEMENTATION AND R1 REVIEW - REVISION REQUIRED`; reviewed base `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`, reviewed head `21f99ff0b5a0eaa006cbaaa384388f123fa2c332`). Both identity gates were verified from raw bytes and live GitHub state before anything changed: PR #96 open, draft, unmerged, head branch `claude/p7-1-radial-constellation`, 5 commits, 15 changed files. No finding that passed was reopened.
The finding was correct and is accepted in full. The build-verifier allocation claimed three checks (152–154) but substantively implemented none of them: the verifier printed `results.length` as a message rather than gating on it, no code performed a two-build route-byte comparison, and nothing prohibited a Three.js chunk.
**Correction A — fixed PSADJ count.** Added `EXPECTED_PSADJ_CHECKS = 21` and `EXPECTED_PSADJ_IDS`, and an allocation gate that runs in the ordinary verifier path on every invocation, before the pass/fail verdict. It compares the EXECUTED identifier sequence against `PSADJ-01 … PSADJ-21` exactly, so a deleted registration, a bypassed registration, a reordering and a duplicate added merely to restore the count all fail. A registered check that FAILED still fails the verifier independently. PSADJ-01 through PSADJ-21 keep their identifiers and order; no duplicate or placeholder registration was created to satisfy the count.
**Correction B — real two-build determinism.** Implemented inside PSADJ-21, executing in the ordinary pipeline. The pipeline's own build is build 1; its route artifacts are copied to a `mkdtemp` directory OUTSIDE the repository, `dist` is then deleted outright and the deletion is asserted, and a second Astro build is run through the package's own resolved `bin` entry on this exact pinned install — never by re-entering `pnpm run check`, so there is no recursion. Raw bytes are compared, never parsed DOM, normalized text, timestamps or summaries, together with the artifact SET itself, so an added, dropped or renamed route chunk fails just as a changed byte does. The compared set is the route document plus every route-reachable emitted artifact, in sorted order. The capture directory is removed in a `finally`, so no evidence file is left inside or outside the repository, and `dist` is never committed.
**Correction C — Three.js chunk prohibition.** Added `routeReachableArtifacts()`, which seeds from every `/_astro/` asset the route document itself references and follows emitted static imports transitively, failing closed on a missing document, a missing asset directory, a route referencing no asset, or a referenced artifact absent from the build. The `three` prohibition is scanned over that graph rather than the expanded-data-URL selector, because a transitively imported vendor chunk carries no such URL. Rejection is by filename identifying a `three` dependency or by content markers. Every existing prohibition — CodePen, Canvas, embedded runtime surface, WebGL renderer/context, explicit WebGL context creation, animation frame loops, randomness, ResizeObserver — is retained unchanged in its existing sound scoping; no protected token was dropped, and the markup list is unchanged.
Measured route graph on this build: 4 reachable artifacts (the adjacency client chunk, the `select` d3 chunk it statically imports, and two stylesheets). The frozen authority-map chunk and the other route's stylesheet are NOT reachable and are therefore outside the scan, which is exactly why an unrelated chunk cannot raise a false failure.
PSADJ-21's identifier and position are unchanged; its description was updated from `no prohibited runtime surface appears in the route's own output` to `route output is deterministic and free of prohibited runtime surfaces`, because the check now carries the whole of canonical check 154 and the former description would have understated it. This is disclosed rather than made silently.
Visual-state check 92 restored to its approved two-part contract: no decor generator, AND the emitted route byte-identical across two builds. A Node test cannot BE that proof, so 92 asserts that the gate is wired and cannot be silently dropped — out-of-repo capture, asserted `dist` deletion, a real second build, raw-byte comparison, artifact-set comparison, deterministic ordering, no re-entry into `check`, and `check` invoking the verifier. The decisive proof remains the executed comparison inside PSADJ-21. `visualState.test.ts` remains exactly **60** registrations.
Decisive mutation evidence, all disposable and all restored from a backup held outside the repository (the verifier's pristine SHA-256 was confirmed byte-identical after every mutation):
- **A1** bypass one registration (`PSADJ-20`) → `FAIL PSADJ allocation — expected exactly 21 registered PSADJ checks, 20 executed`, `allocation gate FAILED`.
- **A2** pad the count with a duplicate registration → `FAIL PSADJ allocation — expected exactly 21 registered PSADJ checks, 22 executed`. Recorded separately: this same mutation run against the PRE-correction verifier printed `all 22 checks passed`, which is the P7-01 defect reproduced directly.
- **A3** relabel `PSADJ-19` as `PSADJ-22` → `FAIL PSADJ allocation — the PSADJ identifier sequence drifted`, with the full expected-versus-executed sequence.
- **B** controlled second-build byte mismatch → `FAIL PSADJ-21 … route bytes differ between two builds: public-surface-map/expanded/index.html`, while the allocation gate still PASSED and the verifier still exited `1 check(s) FAILED` — confirming a failed registered check fails the verifier independently of the count gate.
- **C1** a REACHABLE fake `three` chunk, injected into `dist` and given an import edge from the adjacency chunk → `FAIL PSADJ-21 … a Three.js chunk is reachable from the route: three.FAKE1234.js is named as a Three.js dependency`.
- **C2** an UNRELATED, UNREACHABLE `three`-named chunk containing `new THREE.WebGLRenderer()` and `Object3D`, with no import edge → PSADJ-21 PASS. No false failure.
Validation, full pinned pipeline on node v22.22.2 with dependencies installed from the frozen lockfile: `pnpm run check` **exit 0**, which includes `astro build`, `astro check`, `tsc --noEmit`, `wrangler deploy --dry-run`, `verify:public-surface-map`, `verify:indexing-discovery-build`, `verify:metadata-build` and `verify:public-surface-adjacency-map`. Suite counts, all 0 skipped and 0 todo: radial layout 56/56; directional navigation 22/22; visual state 60/60; rendering boundary 13/13; interaction 39/39; preservation 8/8; metadata indexing 10/10. PSADJ-01 through PSADJ-21 all PASS plus `PASS PSADJ allocation — 21 of 21 checks registered and executed in order`. `git diff --check` clean. Empirically confirmed before implementing: two independent Astro builds of this source emit byte-identical route artifacts, so the determinism gate is satisfiable and not merely aspirational.
Files changed: `scripts/verify-public-surface-adjacency-map-build.mjs`, `tests/public-surface-adjacency-map/visualState.test.ts`, `AGENT_WORKLOG.md`. `package.json` needed no change — `check` already invokes the verifier, which is where the second build now runs — so it was left untouched. No production component or client source, `layout.ts`, `decor.ts`, `emphasis.ts`, public wording, route CSS, interaction test, rendering-boundary test, dataset, runtime manifest, snapshot, fallback, lockfile, dependency or workflow changed. Frozen identities re-confirmed unchanged: dataset 206617 / `0b763eb7…`, manifest 695 / `eddc63e3…`, lockfile 184577 / `9da220e6…`.
Result: exactly one new commit, parented directly on `21f99ff0b5a0eaa006cbaaa384388f123fa2c332`. None of the five reviewed commits was amended, rebased, squashed or force-pushed. R1 is unaffected — this commit touches neither resolver, no record order, no keyboard listener and no tabindex behaviour.
Unresolved questions: none arising from this correction. The dependency install used `pnpm install --frozen-lockfile`, which cannot alter `package.json` or the lockfile, and both were confirmed byte-identical afterwards.
Risks or assumptions: the two-build gate adds one full Astro build to every `check` run (about 8 seconds locally). Build determinism was measured on this toolchain and is a real property of the current source; if a future dependency introduced non-deterministic output, this gate would fail, which is the intended behaviour rather than a defect. D15, D18, D20 and D22 remain PENDING OWNER PREVIEW REVIEW and were not begun. P7.2 and P7.3 were not begun.

### 2026-07-26 — Claude Code — phase3a-p7-1-owner-preview-correction

Agent: Claude Code
Task: Bounded owner-preview visual correction on PR #96 — D18 mobile role-label readability, and the owner's rejection of the graph-local palette. Identity verified before any change: PR #96 open, draft, unmerged, head `f19e69ff221552807e09ac768e1e12ffb15450da`, base `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`. Owner preview results carried forward unchanged: D15 PASS, D20 PASS, D22 PASS, D18 FAIL. No code, R1, geometry, ordering, routing, accessibility or verifier decision that already passed independent review was reopened.
Everything below was MEASURED in a real browser (globally installed Chromium driven by Playwright from a harness held entirely outside the repository) rather than reasoned about. No browser tooling was added to the project and no dependency changed.
**D18 — measured cause.** The logical viewBox is fixed, so a label's rendered size is its logical size times the SVG's on-screen scale. Measured baseline: 390px viewport gave a 317px canvas, scale 0.32, and the 13-unit label rendered at **4.12 CSS px**. Confirmed readable at the widths the owner accepted: 1200px 9.71px, 1440px 11.41px.
**A defect the owner's three test widths did not reach.** Sweeping 620–1240px showed the two-column grid engages at 641px while the details panel holds its 280px minimum, so the canvas COLLAPSES to **207px at 660px viewport** — narrower than at 320px mobile — and was as bad at 768px (315px canvas, 4.10px label) as at 390px. Fixing only the mobile breakpoint would have left the identical defect across a ~460px-wide band. Reported below rather than silently left.
**D18 correction, label presentation only.** Two compact bands were added, both in the global style block AFTER the existing 640px rule so the first `max-width` at-rule in the component remains the grid breakpoint (the interaction suite's responsive test reads that first at-rule): at most 1199px the label is 24px, at most 899px it is 38px, and both bands move the label outward via a CSS transform. The outward move is required because a 38-unit label cannot fit the 31-unit annulus between the separator ring at 385 and the role halo at 416 and would cross the ring; outside the orbit it has room. The shift is authored per label as `--psadj-label-shift-x/y`, computed from that label's own radius vector as `COMPACT_ROLE_LABEL_R / ROLE_LABEL_R - 1` with `COMPACT_ROLE_LABEL_R = 486`, so each label stays on its own angle and the label-to-role association is unambiguous — label outside, glyph inside, same angle.
Measured after correction, rendered role-label size: 320px **9.39**, 390px **12.05** (was 4.12, and now above the 1440px desktop figure), 480px 15.23, 640px 20.95, 768px **11.98** (was 4.10), 860px 15.47, 899px 16.96, 900px 10.73, 1024px 13.71, 1199px 17.91, 1200px **9.71 unchanged**, 1440px **11.41 unchanged**. Across every width measured: no separator-ring crossing, no clipping, no label-to-label overlap, no body-level horizontal overflow, and every halo clearance in the compact regime positive (minimum 5.59 logical units).
One measurement is reported precisely rather than glossed. A conservative axis-aligned bounding-box test reports NEGATIVE halo clearance for the `anchor` label at 1200px and 1440px (−7.44 and −7.92). That is a bounding-box artefact, not a visual overlap: the box is wide and axis-aligned while the glyph sits diagonally. A 3× zoom capture at both 1440px and 390px confirms the word sits cleanly clear of the hexagon with a visible gap. The condition is PRE-EXISTING in the untouched wide regime, is unchanged by this correction, and the owner observed no overlap at those widths.
**Palette correction — and a measurement that changed the design.** The first attempt used a near-black blue field (`#080c13`). Measured against the actual page surface, that gave a field-versus-page contrast ratio of **1.03**: the site background is `#11100d`, essentially the same luminance, so a near-black graph on a near-black page reads as more page — which is exactly the owner's complaint, reproduced. The field was therefore lifted as well as cooled to `#1b2740`, which sits about 11 L* above the page surface at a **1.28** ratio: a visible step that still reads as deep blue-black.
Final Dark Archival Observatory tokens, all declared on `.psadj__canvas` so nothing reaches the global palette or any other route: field `#1b2740`, centre/glyph surface `#2c3c5e`, text `#e4eaf5`, muted `#a6b3ca`, line `#3a4a6e`, decor `#222f4c` (deliberately sub-threshold), edges `#c6d1e3` and `#8492ac`, and muted jewel group hues `#cbab52` `#5299c2` `#bd6178` `#57a984` `#977cc0` `#c87e46` `#46a3a3`. Measured contrast on the field: role labels and centre lines 7.03, text 12.32, edges 9.66 and 4.74, and every group hue at or above 3.65. The three structural fills below 3.0 — glyph interior, arcs/ring, decor — are not text and are subtle by design.
State channel, previously indistinct: focus and hover rendered identically. They now take three distinct hues — focus `#f4e7cb` pale warm (12.15), selection `#57c8ec` cool cyan (7.71), hover `#ab92e0` restrained violet (5.61) — none of them a group hue, so a state can never be mistaken for a grouping. Halo GEOMETRY is unchanged and identical in all three states: same radius, same stroke width, same opacity, never varying with any data value. Selection additionally changes the glyph stroke, so the states differ by more than colour. Inactive opacity was raised 0.28 → 0.42 because the same fraction reads dimmer against blue-black than against the previous warm charcoal; inactive records remain focusable, selectable, announced and listed.
No glow, neon, animation, filter, blur or shadow was added anywhere; the existing prohibition checks still scan for all of them.
Tests updated, both strengthened rather than relaxed. Check 98 previously pinned a single `var(--accent)` halo colour; it now asserts the colour is a TOKEN with a token fallback, that no halo parameter is computed, that the halo radius and stroke width remain single constants, and additionally that the three state hues are exactly `--hover`, `--focus`, `--selection` and are mutually distinct. Check 100 previously pinned the literal `0.28`; it now asserts a legibility FLOOR of 0.35 and that the value still reads as de-emphasised, which is the guarantee the number was standing in for. Check 145 gained the D18 contract: both compact bands, the outward transform, the per-label shift authoring, and an assertion that the wide regime still declares 13px so 1200px and 1440px render as reviewed. `visualState.test.ts` remains exactly **60** registrations.
Verifier: PSADJ-19 extended with three emitted-CSS contracts for the label bands and the shift, plus an assertion that all three role labels carry an outward shift in the emitted HTML — so a label band silently dropped at build time fails. PSADJ-19 keeps its identifier and position, and the registered set is still exactly 21.
Files changed: `src/components/PublicSurfaceAdjacencyMap.astro`, `tests/public-surface-adjacency-map/visualState.test.ts`, `scripts/verify-public-surface-adjacency-map-build.mjs`, `AGENT_WORKLOG.md`. Nothing else. Verified by an explicit path-excluded diff: `layout.ts`, the client module, the route page, `decor.ts`, `emphasis.ts`, `publicWording.ts`, `package.json` and every other test file are byte-unchanged, so geometry, ordering, routing, navigation and accessibility behaviour are untouched by construction. Role record coordinates, `ROLE_ORBIT_R`, `ROLE_LABEL_R`, role order, record order, glyph footprint, concept coordinates, grouping arcs and the separator ring are all unchanged; the coordinates `computeRoleOrbit` publishes are still rendered unchanged into `x` and `y`.
Validation, full pinned pipeline on node v22.22.2: `pnpm run check` **exit 0**. Suite counts, all 0 skipped and 0 todo: radial layout 56/56; directional navigation 22/22; visual state 60/60; rendering boundary 13/13; interaction **39/39 unchanged and unmodified**; preservation 8/8; metadata indexing 10/10. PSADJ-01 through PSADJ-21 all PASS plus `PASS PSADJ allocation — 21 of 21`. `verify:public-surface-map` green. `git diff --check` clean. Frozen identities unchanged.
Recorded, not acted on, per instruction: directional navigation is spatial rather than clockwise/counterclockwise and may feel unintuitive within the inner ring. Arrow-key behaviour was NOT changed.
Unresolved questions, both needing an owner decision and neither actioned here: (1) the 641–1199px two-column band squeezes the canvas to as little as 207px, so role labels there reach only about 9.4px at the worst point despite this correction — fixing it properly means raising the grid's single-column breakpoint, which is a layout decision outside a label-presentation correction and would alter where the details panel sits at those widths; (2) the grouping-arc labels around the ring are similarly small at compact widths, but D18 named only the outer role labels and grouping arcs are on the do-not-change list, so they were left alone.
Risks or assumptions: the compact bands are breakpoint steps, not a continuous ramp, because CSS cannot make a logical font size inversely proportional to the SVG's on-screen scale; sizes were chosen from measured scale ranges so each band stays readable at its narrowest and not oversized at its widest. D15, D18, D20 and D22 all require owner RE-CHECK; none is self-certified here. P7.2 and P7.3 were not begun.

### 2026-07-26 — Claude Code — phase3a-p7-1-archival-mineral-palette

Agent: Claude Code
Task: Bounded palette-only owner-preview correction on PR #96. The blue field was previewed and rejected — not for contrast, but because it read as a conventional technology/data-visualization interface. Replaced with an archival-mineral / volcanic-graphite palette. Identity verified live before any change: PR #96 open, draft, unmerged, head `0a5840097db5c85080473bb61d5c8d1e9fd676db`, base `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`, branch `claude/p7-1-radial-constellation`, 7 commits / 15 files, worktree clean. The D18 geometry and responsive-label work was NOT reopened.
Every value below was measured in a real browser against the built route, not asserted from source.
**Field.** `#1b2740` → `#24211d`. Measured against the actual page background `#11100d`: contrast **1.19**, and the field's blue channel is **7 below** its red channel, so it reads as warm graphite rather than blue. Supporting surfaces: structural rule `#49453f`, decor `#2b2823` (deliberately sub-threshold).
**Node treatment — the spectrum reading removed.** Record bodies are now ONE neutral archival stone `#b8b6aa` with a neutral outline `#cfccc0`; the grouping accent survives only as the thin rim it already was. Selection no longer fills a record with its grouping colour — it lifts the body to `#cfccc0` and takes a mineral-teal rim, so grouping never controls a record's visual mass in any state. Inactive records take the muted stone `#85877f`, and their opacity was raised 0.42 → 0.55 so they stay readable at that lower value.
**Seven equal-status mineral accents, assigned deliberately non-spectrum.** Going clockwise from ring position 1: AI-Readable steel slate `#7a929d`, Boundary sandstone `#b59a72`, Coherence dry sage `#81917b`, Constraint iron rose `#9b7e78`, Proxy verdigris `#708a86`, Responsibility dusty plum `#957e89`, Semantic Field Foundations muted ochre `#a88767`. The two warm-tan accents (sandstone, ochre) and the two green-grey accents (sage, verdigris) are each two ring positions apart, never adjacent, so neither pair can read as one category. Measured hues in ring order are 199°, 33°, 102°, 11°, 168°, 334°, 28° — neither ascending nor descending. Measured saturation 0.15–0.39 against the rejected jewel palette's 0.58–0.63, so no group reads as the "important" one. Contrast on the field 4.29–5.98, all within a 1.4× band of each other.
**Edges — ambient field, not central fog.** Source `#706d66` at 0.9px, navigation `#66645f` at 0.8px, both at opacity 0.12 (measured live with navigation toggled on). Selected-neighbourhood edges lift to 0.58, inactive fall to 0.05. Dash differentiation, arrow markers and edge classes are untouched: navigation keeps `5px, 4px` and the open marker, source stays solid with the filled marker, so F-01 and the non-colour channel are intact. No edge was removed, filtered or re-routed and no geometry changed.
One point reported rather than papered over: the plan's 0.38–0.55 "focus/hover-related" edge band has **no corresponding state in P7.1**. Edge emphasis is driven by SELECTION only — the client's `resolveEmphasis` takes `selectedId` and nothing else — so the two states that exist were set to the ambient and selected bands. Wiring a hover-driven edge state would be a client change, not a palette change, and was therefore not done.
**Central statement.** Parchment `#e6e1d5` at weight 500 with 0.04em letter spacing; measured contrast 12.28 on the field. No new geometry was added — there is no existing central surface element to adjust, and adding a disc would have been a new geometric layer, which is prohibited. The centre stays legible because ambient edges sit at 0.12 rather than because anything was placed behind the text.
**Peripheral and role labels.** Colour only: `#a39e94`, measured contrast 6.01. Font weight, geometry and the responsive bands are untouched.
**States.** Focus `#e8d6a7`, hover `#b6a5b8`, selection `#8faea7` — three restrained mineral hues, none of them a group accent, none a neon cyan. Halo geometry, the three-state structure, stroke-width cues and the focus > hover > selection > neutral precedence are all unchanged.
**D18 preserved and verified by measurement, not assertion.** Rendered role-label size after the palette change: 390px **12.05px**, 768px **11.98px**, 1200px **9.71px**, 1440px **11.41px** — identical to the D18 round. A diff of the component restricted to font-size, transform, shift, breakpoint, text-anchor, grid and label rules returns empty: no geometry or responsive line changed.
**A correction to the previous report.** That report listed 660px as rendering at 9.39px. The measured value is **7.87px**: 660px yields the narrowest canvas in the sweep at 207px, and 38 × 0.207 = 7.87, whereas 9.39 corresponds to the 247px canvas at 700px. The geometry is unchanged and this round did not cause it — the earlier table simply carried the wrong figure for that row. 660px remains inside the separately disclosed 641–1199px layout question, which was explicitly not addressed here.
Test contract strengthened, count unchanged. Check 96 now also pins the archival-mineral contract: the field's blue channel may not exceed its red channel; the record body must be a neutral stone with its three channels within 24; no grouping accent may ever appear as a glyph `fill` in any rule; the accent must be painted as the concept rim; the seven hues in ring order must be neither ascending nor descending; and no accent may exceed 0.45 saturation. That last threshold separates the approved accents (0.15–0.39) from the palette it replaced (0.58–0.63), so it is a real boundary rather than a number fitted to the current values. Three disposable mutations confirmed it decisive: restoring the blue field failed with "blue 64 exceeds red 27"; re-ordering the accents into ascending hue failed with "must not run in hue order: 10,30,36,104,171,199,331"; and substituting one jewel-tone accent failed at 0.596. The component was restored byte-identically after each. `visualState.test.ts` remains exactly **60** registrations and no assertion floor was lowered.
Files changed: `src/components/PublicSurfaceAdjacencyMap.astro`, `tests/public-surface-adjacency-map/visualState.test.ts`, `AGENT_WORKLOG.md`. The build verifier needed no change and was left untouched. Verified by an explicit path-excluded diff: `layout.ts`, `decor.ts`, `emphasis.ts`, `publicWording.ts`, the client module, the route page, `package.json` and every other test file are byte-unchanged, so node geometry, grouping meaning, ordering, routing, navigation and accessibility are untouched by construction.
Validation: `pnpm run check` **exit 0**. Suites, all 0 skipped and 0 todo: radial layout 56/56; directional navigation 22/22; visual state 60/60; rendering boundary 13/13; interaction 39/39 (file unmodified); preservation 8/8; metadata indexing 10/10. PSADJ-01 through PSADJ-21 all PASS plus `PASS PSADJ allocation — 21 of 21`, two-build determinism and the Three.js prohibition included. `verify:public-surface-map` green. `git diff --check` clean. Frozen identities unchanged; `package.json` and the lockfile untouched.
Unresolved questions: the 641–1199px two-column canvas collapse remains open and was explicitly out of scope this round; grouping-arc label size and placement were not touched, as instructed.
Risks or assumptions: the accent-to-group assignment is a deliberate non-spectrum arrangement chosen to keep similar hues non-adjacent; it encodes no ordering and the automated check now forbids a hue-ordered arrangement. D15, D18, D20 and D22 all require owner RE-CHECK; none is self-certified. P7.2 and P7.3 were not begun.

### 2026-07-26 — Claude Code — wp0-wp5-boundary-footer-reconciliation

Agent: Claude Code
Task: Implement the approved WP0 shared-boundary architecture (central public-boundary anchor `/boundary/` plus the bounded global footer notice) and record the WP5 current-state reconciliation. Local implementation and validation only. Not a commit, push, pull request, merge, publication or deployment.
Branch and baseline: implemented on `claude/wp0-wp5-boundary-footer-reconciliation`, created from `origin/main` at `3120ed33e2bcb7b3e837fc80bb4acda51fa68314` after a read-only `git fetch origin main`. The branch was verified absent both locally (`git branch --list`) and remotely (`git ls-remote --heads origin`) before creation; no existing branch was reused, reset, overwritten, deleted or force-updated. Preflight confirmed a clean working tree, a clean index and no untracked files. HEAD remains `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`; no commit was created.
Files changed: exactly three authorized paths — `src/layouts/BaseLayout.astro`, `src/pages/boundary.md`, `AGENT_WORKLOG.md` (this entry). `git diff --name-only` lists these three and nothing else.
WP0 central anchor: `/boundary/` is selected as the central canonical public-boundary anchor. It is an existing route backed by `src/pages/boundary.md`; no new route was created and no route policy changed.
WP0 canonical paragraph: inserted verbatim into `src/pages/boundary.md` as an unheaded ordinary paragraph, placed after both existing introductory paragraphs ("This website is a public orientation surface for Meta-Writing Ecology." and "It provides selected public entry points for readers, researchers, citation systems, crawlers, and people arriving through fiction or public records.") and immediately before the first existing section heading `## What This Site Includes`. Inserted text: "The public surfaces are selective rather than exhaustive. They publish substantial translated material sufficient for bounded conceptual, structural, and case-based interpretation, while withholding the internal operating layers required to reconstruct the full working system." The edit is a pure insertion of two lines — one blank line and one paragraph line. No existing sentence was removed or rewritten, no paragraph or section was moved, no heading was added, the frontmatter is unchanged, the existing section order is unchanged, the exclusion lists were not edited, and the paragraph occurs exactly once in the repository.
WP0 shared-footer notice: the existing footer statement in `src/layouts/BaseLayout.astro` was replaced in place. The previous wording ("Meta-Writing Ecology is a public-facing orientation surface of a recursive linguistic and structural analysis system. This site does not contain the full working corpus or a complete applied methodology.") no longer occurs anywhere under `src/`. The approved bounded notice now reads: "Meta-Writing Ecology is a selective public-facing orientation surface. It supports bounded conceptual, structural, and case-based interpretation while withholding the full working corpus, complete applied methodology, and internal operating layers required to reconstruct the full working system. See Boundary." Only the visible word `Boundary` is linked, as native Astro HTML `<a href="/boundary/">Boundary</a>`, giving the rendered ending `See <a href="/boundary/">Boundary</a>.` The `<footer>` element, its `site-footer` class, its position after `<main>`, the surrounding layout structure, the rendering scope and the existing language behaviour are all unchanged. Verified mechanically: `href="/boundary/"` occurs exactly once in the file and exactly once inside the footer block; the footer block contains exactly one `<a>` element and exactly one `<p>`; no second footer paragraph, heading, wrapper component, constant, data file or localization logic was introduced; and no ARIA, `title`, `target`, `rel` or external-URL attribute was added. Source-code line wrapping follows the file's existing pattern; whitespace-normalized comparison confirms the rendered punctuation and word order match the approved wording exactly, once.
Verified shared-footer scope, carried from the completed read-only repository planning and re-confirmed here: the footer lives in exactly one source location, `src/layouts/BaseLayout.astro`, which is the repository's only layout. 42 of 45 page sources render through it, so every indexable, sitemap-eligible public HTML route receives the notice. The three previously identified excluded representations remain outside that rendering chain and were not touched: `src/pages/404.astro` (the unmatched-route representation, deliberately standalone and pinned by `tests/security-resilience.test.ts`), `src/pages/language-pressure-test-lab-prototype.astro` (noindex, nofollow, sitemap-excluded) and `src/pages/artistic-research/public-slice/2026-07-25.astro` (noindex, sitemap-excluded, renders its own `slice-foot` footer). Non-HTML JSON endpoints render no footer by nature. No page-local duplicate notice was added anywhere.
Structural meaning preserved. The global bounded footer notice is not a new capability claim, not a top-navigation entry, not a navigation taxonomy entry, not a Registry relation, not a formal dependency, and not a complete methodology disclosure. The central canonical public-boundary statement on `/boundary/` is not the full archive, not the full Registry, not the full authority map, not a complete applied methodology, and not reconstructive access.
Scope exclusions verified: no new route, redirect, component, constant, data file, test, script or in-repository planning file was created; no metadata, sitemap, navigation, localization, CSS, Registry, relation, ontology, adjacency-map, authority-map, concept-source or dataset change occurred; no test file was added or modified; `src/styles/global.css`, `src/lib/publicMetadata.ts`, `package.json`, `pnpm-lock.yaml`, `AGENT_TASKS.md`, `public/llms.txt`, `src/components/PublicSearchModal.astro`, `astro.config.mjs`, `src/pages/public-records.md` and every file under `tests/` are unchanged. Symbol hygiene: no literal ASCII `!=` was introduced into human-facing public prose; both touched files were scanned and neither contains one.
WP5 current-state reconciliation. WP0 shared architecture is approved and is implemented locally by this change. `/boundary/` is the selected central canonical boundary anchor. The global footer replacement is approved and applied. WP1 is eligible for read-only repository planning, but WP1 implementation remains unauthorized. WP2 is closed without implementation, and no WP2 wording was migrated. The approved external author-governance record reports WP3 Option 3a as committed and pushed to its feature branch; the current repository working tree alone does not independently establish that external WP3 branch state, and no WP3 material was opened or modified. WP3 pull request, merge, publication and deployment remain unauthorized. WP4 remains deferred and was not activated. No new WP5 repository document was created — this append-only worklog entry is the whole repository-local WP5 record, consistent with the existing convention that `AGENT_WORKLOG.md` is the only authoritative repository-local state record. No existing worklog entry was edited, replaced, reordered or removed.
Preserved distinction: historical author-governance evidence is not independently established repository-local state, and neither is identical to current-state reconciliation. Items reported from the external author-governance record are labelled as such above and are not asserted as repository-verified facts.
Dependency handling: `node_modules` was absent, so `pnpm install --frozen-lockfile` was run once (pnpm 10.34.5, exit 0, completed in 6.5s). It changed no tracked file — `package.json` and `pnpm-lock.yaml` are byte-unchanged, no dependency was added, removed or updated, and `--no-frozen-lockfile` was not used. The changed-file set after installation remained exactly the three authorized paths.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5), in the required order, every command exit 0: `pnpm run check:astro` — 74 files, 0 errors, 0 warnings, 6 hints; `pnpm run build` — Astro server build complete, sitemap-index.xml created, server built in 4.13s; `pnpm run check:ts` — `tsc --noEmit` clean; `pnpm run test:semantic-flow` — 21 tests, 21 pass, 0 fail, 0 skipped; `pnpm run check` — 953 tests across 21 suites, 952 passed, 0 failed, 1 skipped, plus `verify:public-surface-map` 21/21 and `verify:public-surface-adjacency-map` 14/14. The single skip is `verifier traversal: a real unreadable nested directory (chmod)` in `test:indexing-discovery`, which skips in this environment because it runs as root and `chmod` cannot make a directory unreadable to root; it executes normally under CI's unprivileged user. These counts match the previously recorded baseline exactly, so no test result changed as a result of this implementation. `wrangler deploy --dry-run` ran only inside the repository's existing `check` pipeline and reported `Total Upload: 1243.79 KiB / gzip: 247.51 KiB` followed by `--dry-run: exiting now.` — it is a build validation step, not a deployment, and nothing was uploaded or published. `git diff --check` clean.
Result: three files modified in the working tree of `claude/wp0-wp5-boundary-footer-reconciliation`. The implementation is left unstaged and uncommitted; nothing was staged, committed, pushed, force-pushed, amended, rebased or merged; no pull request was opened or updated; no publication and no deployment occurred; and no branch switch was performed after implementation. Commit, push, pull request, merge, publication and deployment all remain unauthorized. An author review packet was written outside the repository and is not tracked here.
Unresolved questions: whether the canonical paragraph should later carry its own heading and public anchor rather than remaining an unheaded lead paragraph; whether `/boundary/` should be added to the "Public boundary anchors" list in `public/llms.txt`, which does not currently list it even though `/boundary/` is now the designated central anchor — changing that file was outside this authorization; whether the English footer and its English `Boundary` link should differ on the Chinese surfaces `/zh/` and `/zh/boundary/`, which continue to render the shared English footer as they did before this change; and whether the approved footer and boundary wording should in future be pinned by a visible-text string contract, which the repository does not currently maintain.
Risks or assumptions: the footer is the first link ever placed inside `.site-footer`, so it inherits the global anchor rule in `src/styles/global.css` and renders in the link colour against muted footer text, and it receives the browser default focus ring exactly as every other ordinary body link does; no CSS was added or changed, by instruction. The replacement copy is longer than the copy it replaces, so the footer wraps to one or two additional lines at narrow viewports; `.site-footer` is a plain block with no fixed height, grid, flex row or truncation, so no layout constraint is exceeded. The new wording is strictly more restrictive than the wording it replaces, because it adds internal operating layers to the explicitly withheld set; no boundary statement was weakened or removed. Operation-layer exposure is very low: both strings describe only what is withheld and name no internal layer, file, method, prompt, protocol, calibration artifact or registry entry. Aggregation risk is low: `/boundary/` was already public, indexable, sitemap-eligible, listed in the public search modal and linked from `/zh/boundary/`, so the footer link increases its reachability without publishing any new fact or creating any new cross-surface join. Repository evidence is not live deployment: this entry records source-tree state and local validation only, and asserts nothing about what is currently served in production.

### 2026-07-26 — Claude Code — wp3-option-3a-public-records-bounded-cross-reference

Agent: Claude Code
Task: Implement the author-approved WP3 Option 3a bounded cross-reference. Local, uncommitted implementation only. Not a new page, not a new route, not a case-bearing surface, and not a WP3 implementation authorization beyond this single bounded edit.
Author decisions applied: no new route; no independent WP3 page; no case-bearing surface; no final WP3 case; target the existing `/public-records/` page at `src/pages/public-records.md`; the exact two-paragraph public copy was supplied and fixed by the author; no focused content-contract test added for this change; the authorized file set contains exactly two files.
Branch: `claude/wp3-option-3a-public-records-cross-reference`, created from `origin/main` at `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`. The branch did not exist locally or remotely beforehand; nothing was overwritten, reset, reused, or force-updated. Preflight found a clean working tree, a clean index, and no untracked file.
Files changed: exactly two — `src/pages/public-records.md` and `AGENT_WORKLOG.md` (this entry). No third path appears in `git diff --name-only`.
Insertion location: inside the existing `## Boundary` section of `src/pages/public-records.md`, immediately before that section's existing final closing paragraph ("It should not be treated as the complete archive, complete registry, full authority map, or full internal method."). The diff is purely additive: four added lines, zero removed lines, no existing sentence altered, no section moved or reordered, and no heading, list item, or list entry added.
Public copy inserted, exactly as approved, as two separate paragraphs:
"For public source and citation traversal, use [Publications](/publications/) for source-linked publication records and the [Citation Guide](/citation-guide/) for citation guidance."
"This traversal does not establish validity, completeness, reproducibility, or a complete research workflow."
Internal links used: `/publications/` and `/citation-guide/`, each appearing exactly once in the added copy. Both are existing internal routes already registered in the route-metadata registry.
No external-link or DOI verification was required, because the change uses existing internal routes only. No external URL, DOI, OSF record, or GitHub source link was added. The added copy names no source document and selects no case.
Structural meaning preserved: internal cross-reference ≠ new route ≠ new evidence claim ≠ case selection ≠ validation ≠ reproducibility ≠ complete research workflow. The copy does not describe the traversal as a method, workflow system, validation procedure, infrastructure service, or institutional capability; does not name WP3; does not use the name "Independent Research Evidence Infrastructure"; does not introduce the phrase "evidence continuity"; and restates neither the citation guidance on `/citation-guide/` nor the publication records on `/publications/`.
No change was made to: frontmatter, page title, description, layout, route policy, metadata, or route counts. One bounded internal cross-reference was added inside the existing `/public-records/` Boundary section. No site navigation structure, top navigation, Entry Points, `/surfaces/` taxonomy, search-modal registration, or navigation taxonomy was changed. Preserve the distinction: bounded internal cross-reference added ≠ site navigation structure changed ≠ navigation taxonomy changed. No Registry, relation, ontology, adjacency-map dataset, or authority-map dataset was touched. `src/lib/publicMetadata.ts`, the route-count tests and verifiers, `package.json`, `pnpm-lock.yaml`, Entry Points, the homepage, `BaseLayout.astro`, `PublicSearchModal.astro`, `/surfaces/`, `/citation-guide/`, `/publications/`, the Diagnostic Entry Layer, the source-link allowlist, and the sitemap configuration are all unmodified. No page, route, redirect, component, script, test file, data file, or temporary in-repository file was created. The concept-source repository was not touched.
Symbol hygiene: the touched human-facing file was scanned for literal `!=`; zero occurrences are present in `src/pages/public-records.md`. The added prose contains no comparison operator.
Dependency state: `node_modules` was absent in this environment, so the validation commands could not initially run. Installation was separately authorized by the author and performed as `pnpm install --frozen-lockfile` (exit 0). `package.json` and `pnpm-lock.yaml` were verified byte-identical before and after by checksum; no dependency, devDependency, or `packageManager` value changed, and no lockfile update was written.
Validation commands and actual results (Linux, node v22.22.2, pnpm 10.34.5): `pnpm run check:astro` exit 0, 74 files, 0 errors, 0 warnings, 6 hints. `pnpm run build` exit 0, server built, sitemap-index.xml created. `pnpm run check:ts` exit 0, clean, after the build generated the Astro types the `?raw` endpoint imports depend on — this is the reason the repository's own `check` chain orders `astro build` before `check:ts`. `pnpm run test:semantic-flow` exit 0, 21 tests, 21 pass, 0 fail, 0 skipped. `pnpm run check` exit 0 across 21 suites: 953 tests, 952 passed, 0 failed, 1 skipped; `wrangler deploy --dry-run` completed inside the `check` script and is not a deployment; `verify:public-surface-map` 21/21, `verify:indexing-discovery-build` 155/155, `verify:metadata-build` 1077/1077, `verify:public-surface-adjacency-map` 14/14. `git diff --check` clean.
The single skip is `verifier traversal: a real unreadable nested directory (chmod)` in `test:indexing-discovery`, which skips because this environment runs as root and `chmod` cannot make a directory unreadable to root. It executes under CI's unprivileged user. Local and CI counts are recorded separately and not reused.
Commit state: the implementation is left uncommitted and unstaged. Nothing was staged, committed, pushed, merged, rebased, or amended; no pull request was opened or updated; no publication or deployment occurred. Commit, push, pull-request, merge, publication, and deployment each remain unauthorized and require separate explicit author authorization.
Unresolved questions: the shared WP0 boundary short notice and its central location remain blocked pending separate author approval, so this page ships with its existing local boundary wording and no WP0 short notice. Whether any later surface should link back to this cross-reference is not decided here.
Risks or assumptions: the change is additive prose inside an existing boundary section, so it alters no route, contract, or dataset, and the full repository gate passed unchanged against the recorded baseline. The assumption that the two paragraphs are final author-approved copy is taken from the implementation authorization; they were inserted verbatim and were not edited, reformatted, or rewrapped. Deployment parity remains unverified and the live deployment state is `deployment_unconfirmed`.

### 2026-07-27 — Claude Code — claude/wp3-option-3a-public-records-cross-reference

Agent: Claude Code
Task: Synchronize the WP3 Option 3a feature branch with current `origin/main` under explicit author authorization, and record the resulting current state. Authorized scope: fetch remote state; verify PR #98 remains draft and unchanged; merge current `origin/main` into the feature branch; resolve only the expected append-tail conflict in `AGENT_WORKLOG.md`; run focused and full validation; create one synchronization merge commit; push normally to the existing feature branch; let the existing draft pull request update automatically. Not authorized and not performed: rebase, squash, force-push, historical-worklog rewrite, WP3 public-copy change, a third feature-scope file, marking PR #98 ready, approval, merge, or deployment.
Synchronization: merged `origin/main` at `5271c03c6f6e2cc7624fcd283c006dad02b56c0f` into the feature branch, whose pre-merge head was `47ac67731a59e31398558476898fc6f91cc24a67`. Merge base `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`. One ordinary merge commit was created with `--no-ff`; no rebase, no squash, no amend, and no force-update. The pre-merge feature identity is preserved as the merge's first parent and `origin/main` as its second parent.
Conflict resolution: exactly one conflict occurred, in `AGENT_WORKLOG.md`, and it was the expected append-tail conflict where both sides appended entries after the shared merge-base history. No conflict occurred in any other file. Resolved by preserving all current-`origin/main` worklog entries byte-for-byte first, then the historical WP3 entry byte-for-byte after the current-main history, then this current-state reconciliation entry. Verified mechanically: the merge-base worklog is a byte-exact prefix of both the `origin/main` worklog and the feature worklog; the preserved current-main block equals the `origin/main` worklog verbatim, and the preserved WP3 block equals the exact bytes the feature branch appended beyond the merge base. No earlier or historical worklog entry was edited, reordered, combined, summarized, rewrapped, or removed, and no worklog rollover was performed.
Public copy: `src/pages/public-records.md` was not touched by the synchronization and is byte-identical to the reviewed feature head `47ac67731a59e31398558476898fc6f91cc24a67` (blob `4dddfa34d278b578507114fffdff5747d715c566`). The approved two paragraphs remain exact: "For public source and citation traversal, use [Publications](/publications/) for source-linked publication records and the [Citation Guide](/citation-guide/) for citation guidance." and "This traversal does not establish validity, completeness, reproducibility, or a complete research workflow." No WP3 public wording was altered.
Feature scope after synchronization: the feature difference against the synchronized `origin/main` is exactly two paths — `AGENT_WORKLOG.md` and `src/pages/public-records.md`. No third feature-scope path exists. Every other file now equals `origin/main` byte-for-byte as a result of the synchronization.
Foreign artifact: `docs/deployment-provenance.md` was not inspected, added, staged as a change, modified, moved, renamed, or deleted. It is already present and byte-identical on both merge sides, so the merge did not alter it and it does not appear in the feature difference.
Symbol hygiene: the only touched human-facing file this round is `AGENT_WORKLOG.md`; its prose uses the proper `≠` symbol and introduces no literal ASCII not-equal marker. `src/pages/public-records.md` was re-scanned and contains no literal not-equal marker.
Validation (Linux, node v22.22.2, pnpm 10.34.5; `node_modules` was absent, so `pnpm install --frozen-lockfile` was run once, exit 0, with `package.json` and `pnpm-lock.yaml` verified byte-identical before and after by SHA-256). Full gate `pnpm run check` exit 0: `astro build` complete and `sitemap-index.xml` created; `check:astro` 79 files, 0 errors, 0 warnings, 6 hints; `check:ts` clean; aggregate 1091 tests across the suite chain, 1090 passed, 0 failed, 1 skipped; `verify:public-surface-map` 21/21, `verify:indexing-discovery-build` 155/155, `verify:metadata-build` 1077/1077, `verify:public-surface-adjacency-map` 21/21; `wrangler deploy --dry-run` reported `Total Upload: 1244.39 KiB / gzip: 247.61 KiB` then `--dry-run: exiting now.` and is build validation, not a deployment. Focused re-run `test:indexing-discovery` exit 0: 233 tests, 232 passed, 0 failed, 1 skipped. `git diff --check` clean, staged and unstaged. The single skip is `verifier traversal: a real unreadable nested directory (chmod)`, which skips because this environment runs as root; it executes under CI's unprivileged user. These counts match the recorded baseline; no test result changed as a result of the synchronization.
Commit, push, and PR state: this synchronization produced exactly one merge commit, which carries this entry, pushed normally (no force) to the existing feature branch `claude/wp3-option-3a-public-records-cross-reference`, updating the existing draft pull request #98 automatically. PR #98 remains a draft and was not marked ready, approved, or merged. No publication and no deployment occurred. Ready-for-review, approval, merge, publication, and deployment remain unauthorized.
Unresolved questions: whether PR #98 should later be marked ready is an author decision not taken here; any readiness revalidation beyond this synchronization is deferred to the author.
Risks or assumptions: the synchronization is a merge only; it adds no route, contract, dataset, or dependency, and the full repository gate passed unchanged against the recorded baseline. Repository evidence is not live deployment: this entry records source-tree state and local validation only and asserts nothing about what is currently served in production.

### 2026-07-26 — Claude Code — applied-evidence-layer-human-governed-ai-workflows

Agent: Claude Code
Task: Execute the author-approved Applied Evidence Layer implementation package — `appliedevidencelayerplanrev5.md`, `appliedevidencelayer_author_decision_summary.md` and `claude_code_implementation_prompt.md`, all supplied by the author — creating the public route `/human-governed-ai-workflows/` with the fixed rev5 §8 public copy, registering it once in the route-metadata registry, updating every affected route-count assertion, adding one author-approved Entry Points inbound entry, and adding a focused page-content contract test. Local implementation and validation only. The two author corrections that accompanied the task were applied: both open decisions are recorded as explicit author decisions rather than agent defaults, and verification is split into a focused page-content test plus a separate authorized-file audit.
Repository and branch: `metawritingecology/metawritingecology-site`, branch `claude/human-governed-ai-workflows-kns5yj`. Working HEAD `32f992d28f7c84d21c7af5a2ca5430d5fb63eed8`; `origin/main` `32f992d28f7c84d21c7af5a2ca5430d5fb63eed8` after `git fetch origin main`. The local remote-tracking ref was stale at `220c2c03ec8a832bb4fecdadc1d5ee19b6097750` before the fetch; after fetching, the branch and `origin/main` are the same commit and neither is ahead of the other. Both recorded planning baselines matched: site `32f992d28f7c84d21c7af5a2ca5430d5fb63eed8`, concept repository `3207fcf9a491c44574abc17438f9eac5ccc326af`. No material drift; nothing in the reviewed route, layout, metadata architecture, Entry Points structure, source-link policy, test architecture, file plan or evidence claims differed from the reviewed baseline. Working tree was clean before implementation. No branch was created, switched or renamed.
Files created:
- `src/pages/human-governed-ai-workflows.astro` — the public page. Reuses `BaseLayout` unmodified. Renders the rev5 §8.1–§8.10 copy verbatim: eyebrow, H1, subtitle, HTML title, meta description, hero introduction, fixed evidence boundary, framework introduction, the three cases, the NIST section, the ISO section and the closing copy. Semantic HTML with page-scoped CSS only. No client JavaScript, D3, Canvas, SVG, filter or simulation; no global design change. Section `id` attributes only — no in-page table of contents was added, so there is no anchor to make keyboard-reachable.
- `tests/human-governed-ai-workflows.test.ts` — focused page-content contract test, Node 22 built-in runner and `assert` only, matching existing repository test conventions. No new testing framework, no `package.json` change.
Files modified:
- `src/lib/publicMetadata.ts` — one registry entry `"/human-governed-ai-workflows/": en()` inserted in the existing alphabetical order between `/fiction/the-repair-of-neglected-wings/` and `/interpretation-boundaries/`, plus the route-count comment `40 indexable routes` → `41 indexable routes`. Default genre; no custom genre and no authority, classification, relation, registry, ontology, publication, visibility, archive, certification, compliance or framework-status metadata.
- `tests/metadata-contract.test.ts` — route-count assertions and labels: 40 → 41 indexable, 42 → 43 total, and the two descriptive comments.
- `tests/indexing-discovery.test.ts` — the `buildExpectedRouteSet` generated-route expectation and its test name: 40 → 41.
- `tests/public-surface-adjacency-map/metadataIndexing.test.ts` — route-count assertion and test label: 40 → 41 indexable, 42 → 43 total.
- `scripts/verify-metadata-build.mjs` — the `INDEXABLE_COUNT` check, its label and the section comment: 40 → 41.
- `src/pages/entry-points.md` — one `## Applied Evidence` subsection appended at the end of the file containing exactly one list item with the author-approved label `View public AI workflow cases`, the fixed link `/human-governed-ai-workflows/` and the fixed short description. No other capability entry, explanatory paragraph, category definition or navigation structure was added.
- `AGENT_WORKLOG.md` — this entry.
Route-count sites were located by semantic search across `src/`, `tests/` and `scripts/`, not by stored line numbers, and the search was repeated after editing; no stale 40/42 count or label remains, and no affected count was found outside the authorized file scope. The `for (let i = 0; i < 40; i++)` loop in `tests/metadata-verifier-lifecycle.test.ts` is a bounded port-release poll, not a route count, and was left unchanged.
Author decisions recorded as fixed: Decision #1 — every `Direct evidence.` sentence is rendered as plain text with no per-case hyperlink. This was explicitly selected by the author; the absence of per-case links is intentional and is not an unresolved choice, a Claude Code default or a provisional state. Decision #2 — one minimal Applied Evidence subsection in Entry Points was explicitly approved by the author. Both are fixed for this implementation scope.
Source-link treatment: the page contains no anchor element and no absolute URL of any kind. No repository document, file path, URL, label or source target was inferred. The GitHub allowlist in `scripts/lib/indexing-discovery-contract.mjs` was not read for modification and is unchanged; the focused test asserts it still holds exactly `metawritingecology/meta-writing-ecology`. The approved §8 copy fixes no framework hyperlink, so no NIST or ISO URL was added.
Boundary preservation: the four-level distinction is rendered as `Declared control ≠ implemented artifact ≠ tested property ≠ measured outcome.` using the `≠` symbol; the page source contains no literal ASCII `!=`. Case 01 keeps the exact split labels, with human-authority rules as a declared control and metadata/machine-reading artifacts as a tested technical property. Case 02 keeps the exact artifact-scoped reconstruction sentence and names the correction register only as a scoped mechanism, with no entry count, error rate or effectiveness claim. Case 03 keeps `Declared Workflow Architecture` and `Observed Public Execution` as separate ordered subsections with the exact aggregate statement, and includes no named end-to-end execution chain, commit id, PR number, reviewer name, dated worklog reference, task package, prompt or routing logic. All three measurement states render exactly as `Not measured.`; the phrase appears four times in total, three as measurement states and once in the evidence-boundary sentence that names the state. The NIST Measure boundary sentence and the ISO public-overview boundary sentence are present verbatim. No adoption, implementation, conformity, certification, audit, compliance, measured-effectiveness or risk-reduction claim appears outside explicit non-establishment language. Page-local visible text, metadata and accessible labels are English only; no Chinese duplicate, locale, language-navigation or language-policy change was made.
Tests and checks run (Linux, node v22.22.2, pnpm 10.34.5 via corepack), all after the final state of the files: `pnpm install --frozen-lockfile` with the lockfile byte-identical; `node --test tests/human-governed-ai-workflows.test.ts` 29/29 passed; `pnpm run build` clean; `pnpm run check:astro` 75 files, 0 errors, 0 warnings, 6 hints; `pnpm run check:ts` clean; `pnpm run test:metadata-contract` 26/26; `pnpm run test:indexing-discovery` 233 tests, 232 passed, 1 skipped (the pre-existing platform skip); `pnpm run test:semantic-flow` 21/21; `pnpm run test:adjacency-metadata` 10/10; `pnpm run verify:indexing-discovery-build` 158/158 (was 155; the new indexable route adds checks); `pnpm run verify:metadata-build` 1103/1103 (was 1077, same reason); `pnpm run verify:public-surface-map` 21/21; `pnpm run verify:public-surface-adjacency-map` 14/14; `pnpm run check` exit 0 with 940 tests across 20 suites, 939 passed, 0 failed, 1 skipped — the same totals and the same single pre-existing skip as before this change, because the focused test is intentionally not wired into the aggregate script. `wrangler deploy --dry-run` ran clean inside `pnpm run check`.
Focused-test non-vacuity: five independent mutations were applied and reverted, and each was caught — replacing the first `Not measured.` with a stronger state (1 test failed), adding a per-case hyperlink into a `Direct evidence.` sentence (2 failed), replacing the ISO public-overview boundary with a clause-level mapping claim (1 failed), dropping the Case 02 artifact-scope limitation (1 failed), and adding a second Entry Points capability entry (1 failed). The page file was confirmed byte-identical to its pre-mutation state afterwards, and the full suite plus the focused test were re-run on the final state.
Rendered inspection: performed against a local `wrangler dev --local` worker on 127.0.0.1:8799 serving the built output. `/human-governed-ai-workflows/` returns 200 with the exact approved `<title>` and meta description, `html lang="en"`, no robots meta (indexable), canonical `https://metawritingecology.org/human-governed-ai-workflows/`, and one JSON-LD block containing only WebSite and WebPage nodes with `genre` `Public orientation surface` and the WebPage description equal to the meta description. The generated sitemap contains 41 URLs including the new route. The rendered document outline is h1 Human-Governed AI Workflows; h2 for each of the three case titles; h3 Declared Workflow Architecture and h3 Observed Public Execution; h2 for the NIST and ISO sections; h2 This page does not establish. The three case ordinals render as Case 01, Case 02, Case 03; the closing list renders all ten items; `Measurement state. Not measured.` appears exactly three times; the `≠` symbol appears three times and no literal `!=` appears; `<main>` contains zero anchors, zero scripts, zero canvas and zero SVG elements, and no `github.com` or `http`/`https` reference. `/entry-points/` returns 200 and renders one `Applied Evidence` h2 containing exactly one link to the new route with the approved label and description. Browser inspection used the environment's GLOBAL Playwright and Chromium — NOT a project dependency; `package.json` and `pnpm-lock.yaml` were not touched and the harness was kept outside the repository. At 1440×900, 768×1024, 390×844 and 360×800 there was no element extending past the viewport, no clipping and no page-level horizontal overflow; the only console message on the new page is the site-wide report-only CSP `upgrade-insecure-requests` notice, which reproduces identically on `/entry-points/` and is therefore pre-existing and unrelated.
Authorized-file audit: `git diff --name-only` and `git status --short` were run before this entry was written. Tracked modifications are `scripts/verify-metadata-build.mjs`, `src/lib/publicMetadata.ts`, `src/pages/entry-points.md`, `tests/indexing-discovery.test.ts`, `tests/metadata-contract.test.ts` and `tests/public-surface-adjacency-map/metadataIndexing.test.ts`; untracked additions are `src/pages/human-governed-ai-workflows.astro` and `tests/human-governed-ai-workflows.test.ts`. Every path is inside the authorized file set. No homepage, top-navigation, `BaseLayout`, Diagnostic Entry Layer, Application Boundary, Three Questions, boundary, interpretation-boundaries, models, atlas, AI-Readable Knowledge Architecture, language-navigation, `astro.config.mjs`, `scripts/lib/indexing-discovery-contract.mjs`, GitHub-allowlist, `package.json`, `AGENTS.md`, `CLAUDE.md`, Registry, relation, Applied Capability Surfaces or WP0–WP5 file was modified. The concept repository `metawritingecology/meta-writing-ecology` was inspected read-only and its working tree is clean at `3207fcf9a491c44574abc17438f9eac5ccc326af`. No unrelated user change was reverted, altered or absorbed.
Result: all changes remain uncommitted for author review. No commit, push, merge, pull request, publication or deployment occurred, and no branch was created or switched. No dependency, lockfile, workflow or Cloudflare configuration change.
Unresolved questions: The rev5 §8 copy fixes no hyperlink for any `Direct evidence.` sentence, so each is rendered verbatim as plain text, exactly as the author decided; whether any of the three should later carry an approved source-repository link remains an author decision and was not made here. The page renders one structural element that is not §8 prose: a small uppercase ordinal label reading `Case 01`, `Case 02` and `Case 03` above each case heading, matching the page-eyebrow pattern. It carries the ordinals the planning document itself uses for these blocks and was added so that the approved §8.8 and §8.9 sentences referring to "Case 01", "Case 02" and "Case 03" resolve to something visible. It adds no claim and no heading variant, and it can be removed on request. No other text was added, and no approved heading was replaced.
Risks or assumptions: The focused test asserts source and registry properties only. It does not, and must not be read to, establish governance, framework effectiveness, conformity, oversight, or any measured outcome, and it does not prove that unrelated repository files are unmodified — that proof comes from the authorized-file audit recorded above. Its assertions about the homepage, top navigation and Diagnostic Entry Layer establish only that no inbound link to the new route was added to those files, not their integrity. The new route is registered as an ordinary indexable public orientation surface; registration, sitemap presence and navigation reachability create no Registry status, classification, relation, ontology or reading-path claim. Live deployment remains separately unconfirmed: repository implementation is not confirmed live deployment.
Correction (same task, applied before author review): the visible `Case 01` / `Case 02` / `Case 03` ordinal labels described above under "Unresolved questions" were removed at the author's instruction, together with the now-unused `.hgaw-case-number` rule. They are planning-document identifiers rather than approved public copy, so rendering them conflicted with the verbatim-copy and no-added-public-prose requirements. Nothing else changed: the three approved case titles, section order, the section ids `case-01` / `case-02` / `case-03` (structural anchors that never depended on the visible label), all rev5 copy including the in-copy "Case 01/02/03" references in the approved §8.8 and §8.9 sentences, metadata, Entry Points, route registration, claim ceilings, `Direct evidence.` treatment and the NIST and ISO wording are untouched, and no other file was modified. `tests/human-governed-ai-workflows.test.ts` was updated only where it asserted the visible ordinals: the ordinal-label assertion was replaced by an assertion that the three case sections appear in the approved order by id, plus a new assertion that no standalone `Case 01/02/03` element is rendered. Rerun after the correction: `node --test tests/human-governed-ai-workflows.test.ts` 29/29; `pnpm run build` clean; `pnpm run check:astro` 75 files, 0 errors, 0 warnings, 6 hints; `pnpm run check:ts` clean; `pnpm run test:metadata-contract` 26/26; `pnpm run test:indexing-discovery` 233 tests, 232 passed, 1 pre-existing skip; `pnpm run verify:indexing-discovery-build` 158/158; `pnpm run verify:metadata-build` 1103/1103. Rendered recheck against a local `wrangler dev --local` worker: the route returns 200, the document outline and the nine section ids are unchanged, no standalone ordinal element is present, the three `Measurement state. Not measured.` states remain, `≠` appears three times with no literal `!=`, `<main>` still contains zero anchors, and there is no page-level horizontal overflow or page error at 1440 and 390 CSS pixels. Changed and untracked paths remain exactly the previously authorized set. Still uncommitted; no commit, push, pull request, publication or deployment.
Second correction (same task, applied before author review; the historical ordinal-label correction above is unchanged): an independent Codex audit identified one commit-gating defect in the focused test — it was under-complete for the fixed public copy, protecting selected sentences rather than the whole approved copy set, and simultaneously over-specific about internals, requiring the literal section ids `case-01`, `case-02` and `case-03`, which the approved plan never fixes. Both were corrected in `tests/human-governed-ai-workflows.test.ts` only. Added: `APPROVED_VISIBLE_TEXT`, a fixed independent transcription of the complete author-approved rev5 §8.1–§8.10 visible copy in the approved order, normalized through the test's existing `visibleText()` helper, plus the whole-page assertion `assert.equal(text, APPROVED_VISIBLE_TEXT)`. The constant is typed from the approved copy and is not derived from `pageSource`, `body`, `text`, a rendered snapshot or any runtime extraction of the implementation, so the assertion is a contract rather than a tautology; it carries no HTML title, meta description or Entry Points text, because those remain separately asserted. Removed: the `assert.deepEqual(caseSections, ["case-01", "case-02", "case-03"])` dependency. No literal case id is asserted anywhere in the test now. The replacement verifies structure only — exactly three `<section>` elements carrying the `hgaw-case` class, the three approved case headings each occurring exactly once and in the approved order, and no standalone visible `Case 01`/`Case 02`/`Case 03` element. Retained unchanged: the exact HTML title and meta description assertions, route registration and metadata-policy assertions, the single approved Entry Points subsection and link, the no-additional-inbound-navigation assertion, the no-case-level-link assertions, the GitHub-allowlist assertion, and every existing semantic and claim-ceiling assertion, which now stand as secondary protections behind the equality contract.
Not changed by this correction: `src/pages/human-governed-ai-workflows.astro` is byte-identical — the page, all rev5 public copy, metadata, route registration, navigation, page structure, section ids, source-link treatment, NIST and ISO wording and every claim ceiling are untouched. `src/pages/entry-points.md`, `src/lib/publicMetadata.ts` and every route-count, indexing and verifier file are byte-identical to the previously reviewed working-tree state. This correction changed exactly two files: `tests/human-governed-ai-workflows.test.ts` and `AGENT_WORKLOG.md`.
Equality-contract non-vacuity: the normalized approved copy is 12,931 characters / 1,608 words. Seven independent in-memory mutations of the page string were normalized and compared against the same reference, and all seven differ — omitting a sentence, changing one word, weakening a boundary sentence, dropping a closing list item, reordering two sections, duplicating a paragraph and adding new prose. The mutations were applied in memory only; the page file was confirmed byte-identical on disk before and after the check, and no mutated copy was written into the repository.
Commands rerun after the correction (Linux, node v22.22.2, pnpm 10.34.5 via corepack): `node --test tests/human-governed-ai-workflows.test.ts` 30/30 passed, 0 failed (was 29 tests; the equality contract is the new test); `pnpm run build` clean; `pnpm run check:astro` 75 files, 0 errors, 0 warnings, 6 hints; `pnpm run check:ts` clean; `pnpm run test:metadata-contract` 26/26; `pnpm run test:indexing-discovery` 233 tests, 232 passed, 1 skipped (the pre-existing platform skip); `pnpm run verify:indexing-discovery-build` 158/158; `pnpm run verify:metadata-build` 1103/1103. `git diff --check` reports no whitespace error and no conflict marker. `git diff --name-only` and `git status --short` still list exactly the nine previously authorized paths — seven modified, two untracked — and no tenth path appeared.
Result: all changes remain uncommitted for author review. Nothing was staged, committed, pushed, merged, opened as a pull request, published or deployed, and no branch was created or switched.

### 2026-07-27 — Claude Code — claude/human-governed-ai-workflows-kns5yj

Agent: Claude Code
Task: Synchronize the Human-Governed AI Workflows feature branch with current `origin/main` under explicit author authorization, resolve the expected append-tail `AGENT_WORKLOG.md` conflict, validate, and record current state. Authorized: fetch; verify PR #99 remains draft and unchanged; non-fast-forward merge of current `origin/main`; append-only worklog reconciliation; validation; one synchronization merge commit; normal push; automatic draft-PR update; external review packet. Not authorized and not performed: rebase, squash, cherry-pick, amend, reset, force-push, marking ready, approval, merge, publication, manual deployment, PR #100 modification, WP1 synchronization, worklog rollover, or instruction-rule implementation.
Integration-queue state: PR #97 (WP0 + WP5 shared public-boundary) and PR #98 (WP3 Option 3a bounded source and citation cross-reference) are now merged into `main`; current `main` is `973e739438df8060c312f01a101f1b6d5485a20e`. PR #99 (this branch) remains a draft and unmerged. PR #100 (WP1 Option B, Entry Points relation boundary) remains waiting and was not touched. D3 / P7.x remains author-classified `in_progress` and excluded from this scope. Dependabot updates remain a separate queue and none was absorbed.
Layer distinction: Human-Governed AI Workflows is a separate Applied Evidence Layer; it is not part of the WP0–WP5 workstream and asserts no WP-series status. The three cases and their bounded correspondence to NIST AI RMF 1.0 and the public ISO/IEC 42001 overview remain review-only, with declared control ≠ implemented artifact ≠ tested property ≠ measured outcome preserved, and no claim of adoption, conformity, certification, certification readiness, audit, compliance assessment, effectiveness, measured improvement, or risk reduction.
Synchronization: non-fast-forward merge of `origin/main` at `973e739438df8060c312f01a101f1b6d5485a20e` into the feature branch, whose pre-merge head was `1e89d1a7ef8186c3106ea694cbdb3975240ae2f4`. Merge base `3120ed33e2bcb7b3e837fc80bb4acda51fa68314`. One merge commit; the pre-merge feature identity is the first parent and `origin/main` the second. No rebase, squash, cherry-pick, amend, reset, or force-update.
Conflict resolution: exactly one conflict, in `AGENT_WORKLOG.md`, the expected append-tail conflict. No other file conflicted. Resolved by placing the complete current-`origin/main` worklog byte-for-byte first, then the single historical Human-Governed feature entry (`### 2026-07-26 — Claude Code — applied-evidence-layer-human-governed-ai-workflows`) byte-for-byte, then this reconciliation entry. Verified mechanically: the current-main worklog is used verbatim (it already contains every earlier entry the feature branch carried); the Human-Governed entry equals the exact bytes commit `895b4d5` appended over its parent and is the sole worklog header unique to the feature branch relative to current main. No historical entry was edited, reordered, shortened, rewrapped, summarized, or removed; no worklog rollover was performed. Historical evidence ≠ current-state reconciliation ≠ deployment evidence.
Feature scope after synchronization: the feature difference against synchronized `origin/main` is exactly nine paths — `AGENT_WORKLOG.md`, `scripts/verify-metadata-build.mjs`, `src/lib/publicMetadata.ts`, `src/pages/entry-points.md`, `src/pages/human-governed-ai-workflows.astro`, `tests/human-governed-ai-workflows.test.ts`, `tests/indexing-discovery.test.ts`, `tests/metadata-contract.test.ts`, `tests/public-surface-adjacency-map/metadataIndexing.test.ts`. No tenth path. The eight non-worklog feature files are byte-identical to the reviewed head `1e89d1a`, so the merge introduced no semantic expansion. Current-main WP0/WP5 footer and boundary, the WP3 `public-records.md` change, and the P7.1 baseline are all preserved (equal to `origin/main`) and were not reverted. `docs/deployment-provenance.md` was not touched and is absent from the feature difference. No PR #100 content and no Dependabot update were introduced.
Structure preserved: exactly one route `/human-governed-ai-workflows/`; Entry Points gains only the top-level `## Applied Evidence` section in its reviewed location, containing only the approved route link and description, with no WP1 paragraph, no homepage change, no top-navigation change, no Diagnostic Entry Layer change, no additional route or public capability, and no graph relation, ontology, Registry, or authority metadata. The three cases remain: AI Authority Boundaries and Human Oversight; AI Provenance, Version Control, and Artifact Reconstruction; Multi-Agent Execution and Retained Answerability.
Route and metadata: the synchronized tree adds exactly one ordinary public route entry (the Human-Governed route). Count changes are explained solely by that one route: `verify:indexing-discovery-build` 155 to 158, `verify:metadata-build` 1077 to 1103, and `check:astro` 79 to 81 files, relative to current main. Canonical and sitemap behavior verified by the passing metadata and indexing build verifiers.
Symbol hygiene: the only touched human-facing file this round is `AGENT_WORKLOG.md`; its prose uses `≠` and introduces no literal ASCII not-equal marker.
Validation (Linux, node v22.22.2, pnpm 10.34.5; `node_modules` already present, no installation performed; `package.json` and `pnpm-lock.yaml` SHA-256 unchanged). Focused `node --test tests/human-governed-ai-workflows.test.ts` exit 0: 30 tests, 30 passed, 0 failed, 0 skipped. Full gate `pnpm run check` exit 0: `astro build` complete and `sitemap-index.xml` created; `check:astro` 81 files, 0 errors, 0 warnings, 6 hints; `check:ts` clean; aggregate 1091 tests, 1090 passed, 0 failed, 1 skipped (root chmod skip); `verify:public-surface-map` 21/21; `verify:indexing-discovery-build` 158/158; `verify:metadata-build` 1103/1103; `verify:public-surface-adjacency-map` 21/21; `wrangler deploy --dry-run` reported `Total Upload: 1267.75 KiB / gzip: 252.58 KiB` then `--dry-run: exiting now.` and is build validation, not a deployment. `git diff --check` clean, staged and unstaged.
Commit, push, and PR state: this synchronization produced exactly one merge commit carrying this entry, pushed normally (no force) to the existing feature branch, updating draft PR #99 automatically. PR #99 remains a draft; not marked ready, not approved, not merged. Repository evidence is not live deployment; no publication and no deployment occurred. Ready-for-review, approval, merge, publication, and manual deployment remain unauthorized.
Unresolved questions: whether PR #99 should later be marked ready is an author decision not taken here.
Risks or assumptions: the synchronization is a merge only; it adds no route beyond the one already reviewed, no dependency, and the full repository gate passed. Repository evidence records source-tree state and local validation only and asserts nothing about production.

### 2026-07-26 — Claude Code — wp1-entry-points-relation-boundary

Agent: Claude Code
Task: Implement the author-approved WP1 Option B bounded public cross-reference on an existing page. Local implementation and validation only. Not a commit, push, pull request, merge, publication or deployment.
Branch and baseline: implemented on `claude/wp1-entry-points-relation-boundary`, created with `git switch -c … origin/main` from the actual current `origin/main` at `8261b7c505a17bd907a5c8dbcd30ea2b07115f46` after a read-only `git fetch origin main`. The branch was verified absent both locally (`git branch --list`) and remotely (`git ls-remote --heads origin`) before creation. Preflight confirmed a clean working tree, a clean index and no untracked files. The read-only planning branch `claude/wp1-readonly-repository-planning` was not modified, reset, deleted, amended or pushed, and remains at `8261b7c505a17bd907a5c8dbcd30ea2b07115f46`. HEAD remains `8261b7c505a17bd907a5c8dbcd30ea2b07115f46`; no commit was created.
Files changed: exactly two authorized paths — `src/pages/entry-points.md` and `AGENT_WORKLOG.md` (this entry). `git diff --name-only` lists these two and nothing else.
Target route: `/entry-points/`. Target section: `## Source Reading Paths`.
Exact existing anchor sentence (byte-for-byte unchanged, occurs exactly once, remains inside `## Source Reading Paths`): "Those paths are public navigation only. They do not establish formal conceptual relations, ontology, priority, hierarchy, or Registry status."
Exact inserted public paragraph (its own ordinary paragraph, immediately after the anchor paragraph, occurs exactly once): "These paths also do not establish formal dependency. For the distinction between candidate and confirmed relations, see [Boundary-Preserving Use Conditions](/boundary-preserving-use-conditions/)."
The edit is a pure insertion of two lines — one blank line and one paragraph line. No existing line was removed or rewritten; the anchor paragraph is unchanged; no heading was added; the section order is unchanged; the following line `### Boundary-Oriented Source Routes` remains the next heading, confirming the new paragraph sits inside `## Source Reading Paths`. The link `[Boundary-Preserving Use Conditions](/boundary-preserving-use-conditions/)` occurs once in the added paragraph, with its trailing slash, and is the only link in the paragraph; no external URL was added.
Scope: no new route, page, heading, card, list item, callout, component, metadata entry, navigation entry, search-modal entry, test, dataset, graph relation, ontology, Registry record, or authority-map change. No public use of the internal WP1 name "Knowledge Authority and Semantic Integrity Boundaries". The phrase "Semantic Integrity" does not occur in the public file. No graph vocabulary such as "provisional navigation adjacency" was introduced. The two existing non-trailing-slash links at `interpretation-boundaries.md:89` and `application-boundary.md:83` were not changed. No vocabulary reconciliation between `candidate relation` and `provisional navigation adjacency` was performed. Symbol hygiene: no literal ASCII `!=` was introduced into human-facing public prose; the touched page contains none.
Structural meaning preserved: public navigation is not a formal conceptual relation, not a formal dependency, not an ontology assertion, and not a Registry confirmation; a candidate relation is not a confirmed relation; and this bounded cross-reference is not a relation promotion, not a relation confirmation, not a formal dependency between the two pages, and not a semantic-integrity capability. The added paragraph states only what is not established and points to an existing public boundary page; it makes no relation, Registry, or ontology claim.
State reconciliation: WP2 remains closed without implementation. WP3 (`claude/wp3-option-3a-public-records-cross-reference`) remains separate and unmodified; it was not merged or checked out. WP4 remains deferred. The pending WP0/WP5 branch (`claude/wp0-wp5-boundary-footer-reconciliation`) was not merged or checked out; its content is pending branch evidence, not origin/main content and not deployed content. Repository evidence is not live deployment: this entry records source-tree state and local validation only.
Prohibited files confirmed untouched: `src/pages/surfaces.md`, `src/pages/boundary.md`, `src/pages/boundary-preserving-use-conditions.md`, `src/pages/interpretation-boundaries.md`, `src/pages/application-boundary.md`, `src/pages/public-records.md`, `src/components/PublicSearchModal.astro`, `src/lib/publicMetadata.ts`, `src/layouts/BaseLayout.astro`, `public/llms.txt`, `package.json`, `pnpm-lock.yaml`, every file under `tests/` and `scripts/`, all snapshots, graph components, relation/adjacency/authority datasets, and the concept-source repository.
Dependency handling: `node_modules` was present, so no install was run; `package.json` and `pnpm-lock.yaml` are untouched.
Build / tests run (Linux, node v22.22.2, pnpm 10.34.5), in the required order, every command exit 0: `pnpm run check:astro` — 79 files, 0 errors, 0 warnings, 6 hints; `pnpm run build` — Astro server build complete, sitemap-index.xml created; `pnpm run check:ts` — `tsc --noEmit` clean; `pnpm run test:semantic-flow` — 21 tests, 21 pass, 0 fail, 0 skipped; `pnpm run check` — 1091 tests across 24 suites, 1090 passed, 0 failed, 1 skipped, plus `verify:public-surface-map` 21/21 and `verify:public-surface-adjacency-map` 21/21. The single skip is `verifier traversal: a real unreadable nested directory (chmod)` in `test:indexing-discovery`, which skips because this environment runs as root; it executes under CI's unprivileged user. These counts match the recorded baseline, so no test result changed as a result of this change. `wrangler deploy --dry-run` ran only inside the repository's existing `check` pipeline and reported `--dry-run: exiting now.` — it is build validation, not a deployment. `git diff --check` clean.
Result: two files modified in the working tree of `claude/wp1-entry-points-relation-boundary`. The implementation is left unstaged and uncommitted; nothing was staged, committed, pushed, force-pushed, amended, rebased or merged; no pull request was opened or updated; no publication and no deployment occurred; and no branch switch was performed after implementation. An author review packet was written outside the repository and is not tracked here. Commit, push, pull request, merge, publication and deployment all remain unauthorized.
Preserve: historical evidence is not current-state reconciliation, is not relation confirmation, and is not deployment evidence.
Unresolved questions: whether `/boundary-preserving-use-conditions/` should additionally be added to `PublicSearchModal.astro`, and whether the two existing non-trailing-slash inbound links elsewhere should be normalized — both were reported in WP1 planning and remain outside this authorization. Whether the two relation vocabularies should later be verbally reconciled remains an author classification decision, not performed here.
Risks or assumptions: the added paragraph reuses the page's existing plain-paragraph form and inherits the global link styling; no CSS was added or changed. Operation-layer exposure is Low: the copy is restrictive and names no internal layer, file, method, prompt, protocol, calibration artifact or Registry entry. Aggregation risk is Limited: the paragraph links two already-public, already-indexed boundary surfaces with restrictive statements, publishing no new fact and creating no new substantive cross-surface join. Repository evidence is not live deployment.

### 2026-07-27 — Claude Code — claude/wp1-entry-points-relation-boundary

Agent: Claude Code
Task: Synchronize the WP1 Option B Entry Points relation-boundary feature branch with current `origin/main` under explicit author authorization, resolve the expected append-tail `AGENT_WORKLOG.md` conflict, perform the combined Entry Points review, validate, and record current state. Authorized: fetch; verify PR #100 remains draft and unchanged; non-fast-forward merge of current `origin/main`; append-only worklog reconciliation; combined Entry Points review; validation; one synchronization merge commit; normal push; automatic draft-PR update; external review packet. Not authorized and not performed: rebase, squash, cherry-pick, amend, reset, force-push, marking ready, approval, merge, manual or production deployment, D3 / P7.x modification, Dependabot modification, instruction-rule change, worklog rollover, or deployment-provenance classification work.
Integration-queue state: PR #97 (WP0 + WP5), PR #98 (WP3 Option 3a), and PR #99 (Human-Governed AI Workflows Applied Evidence) are all merged into `main`; their automatic Cloudflare Workers production deployments each completed successfully (PR #97 Version b23be15e; PR #98 Version 84801e52; PR #99 Version c332c409). Current `main` is `0831227c806cbbeae054de750de3529ef1af5121`. PR #100 (this branch) remains a draft and unmerged. D3 / P7.x remains author-classified `in_progress` and excluded from this scope. Dependabot updates remain a separate queue and none was absorbed. The deployment-provenance document role review remains deferred and no classification work was performed on it.
Synchronization: non-fast-forward merge of `origin/main` at `0831227c806cbbeae054de750de3529ef1af5121` into the feature branch, whose pre-merge head was `4d6b9952a1e929cec4e61aa85234d5f2b91fb746`. Merge base `8261b7c505a17bd907a5c8dbcd30ea2b07115f46`. One merge commit; the pre-merge feature identity is the first parent and `origin/main` the second. No rebase, squash, cherry-pick, amend, reset, or force-update.
Conflict resolution: exactly one conflict, in `AGENT_WORKLOG.md`, the expected append-tail conflict; `src/pages/entry-points.md` auto-merged with no conflict because the WP1 paragraph and the Human-Governed `## Applied Evidence` section occupy separate locations. Resolved the worklog by placing the complete current-`origin/main` worklog byte-for-byte first, then the single historical WP1 feature entry (`### 2026-07-26 — Claude Code — wp1-entry-points-relation-boundary`) byte-for-byte, then this reconciliation entry. Verified mechanically: the merge-base worklog is a byte-exact prefix of both sides; the current-main worklog is used verbatim (it already contains every earlier entry the feature branch carried); the WP1 entry equals the exact bytes commit `4d6b995` appended over the merge base and is the sole worklog header unique to the feature branch relative to current main. No historical entry was edited, reordered, shortened, rewrapped, summarized, or removed; no worklog rollover. Historical evidence ≠ current-state reconciliation ≠ deployment evidence.
Feature scope after synchronization: the feature difference against synchronized `origin/main` is exactly two paths — `AGENT_WORKLOG.md` and `src/pages/entry-points.md`. No third path. Relative to current main, `src/pages/entry-points.md` adds only the one approved WP1 paragraph inside `## Source Reading Paths`; relative to the WP1 head it adds only main's `## Applied Evidence` section. Current-main baseline is preserved and not reverted: WP0/WP5 shared footer and the `/boundary/` paragraph, the WP3 `/public-records/` traversal copy, the Human-Governed route, metadata, tests, and Applied Evidence section, the P7.1 baseline, `docs/deployment-provenance.md`, and `package.json` / `pnpm-lock.yaml` all remain equal to `origin/main`. No Dependabot update was absorbed.
Exact WP1 public copy (occurs once): "These paths also do not establish formal dependency. For the distinction between candidate and confirmed relations, see [Boundary-Preserving Use Conditions](/boundary-preserving-use-conditions/)." It is its own ordinary paragraph, immediately after the unchanged existing navigation-only paragraph ("Those paths are public navigation only. They do not establish formal conceptual relations, ontology, priority, hierarchy, or Registry status."), inside `## Source Reading Paths`; no heading was added; the link target retains its trailing slash and resolves to the existing `src/pages/boundary-preserving-use-conditions.md`; "Semantic Integrity" remains absent; no graph relation, ontology, Registry, authority, or dependency claim is introduced. Preserved distinctions: public navigation ≠ formal conceptual relation ≠ formal dependency ≠ ontology assertion ≠ Registry confirmation; candidate relation ≠ confirmed relation.
Combined Entry Points review: the page now contains both approved additions — the WP1 paragraph inside `## Source Reading Paths`, and the Human-Governed `## Applied Evidence` as a separate top-level section. No textual conflict occurred; neither addition was rewritten; neither section is nested under the other; neither is authoritative over the other; the WP1 boundary applies only to source-reading paths; the Applied Evidence section remains a separate public evidence entry byte-identical to its current-main form; both internal links (`/boundary-preserving-use-conditions/` and `/human-governed-ai-workflows/`) resolve to existing routes; no additional navigation, heading, card, route, or taxonomy was added; no WP2 or WP3 content migrated into WP1.
Symbol hygiene: the only touched human-facing files this round are `AGENT_WORKLOG.md` and `src/pages/entry-points.md`; both use `≠` where a not-equal relation is expressed and neither introduces a literal ASCII not-equal marker.
Validation (Linux, node v22.22.2, pnpm 10.34.5; `node_modules` already present, no installation performed; `package.json` and `pnpm-lock.yaml` SHA-256 unchanged). Focused `pnpm run test:semantic-flow` exit 0: 21 tests, 21 passed, 0 failed, 0 skipped. Full gate `pnpm run check` exit 0: `astro build` complete and `sitemap-index.xml` created; `check:astro` 81 files, 0 errors, 0 warnings, 6 hints; `check:ts` clean; aggregate 1091 tests, 1090 passed, 0 failed, 1 skipped (root chmod skip); `verify:public-surface-map` 21/21; `verify:indexing-discovery-build` 158/158; `verify:metadata-build` 1103/1103; `verify:public-surface-adjacency-map` 21/21; `wrangler deploy --dry-run` reported `Total Upload: 1268.16 KiB / gzip: 252.68 KiB` then `--dry-run: exiting now.` and is build validation, not a deployment. `git diff --check` clean, staged and unstaged. WP1 adds no route, so route, metadata, and indexing totals are unchanged from current main.
Commit, push, and PR state: this synchronization produced exactly one merge commit carrying this entry, pushed normally (no force) to the existing feature branch, updating draft PR #100 automatically. PR #100 remains a draft; not marked ready, not approved, not merged. Repository evidence is not live deployment; no publication and no deployment occurred. Ready-for-review, approval, merge, publication, and manual or production deployment remain unauthorized.
Unresolved questions: whether PR #100 should later be marked ready is an author decision not taken here.
Risks or assumptions: the synchronization is a merge only; it adds no route or dependency, and the full repository gate passed. Repository evidence records source-tree state and local validation only and asserts nothing about production.

### 2026-07-27 — Codex — worklog-governance-change-set-a

Agent: Codex
Task: Implement Change Set A only: pre-append worklog governance instruction alignment plus one lightweight read-only validation/inventory script. Authorized scope covered AGENTS.md canonical governance, CLAUDE.md mirror text, AGENT_WORKLOG.md active-log notice plus this entry, and scripts/check-agent-worklog-governance.mjs. Not authorized and not performed: ready-for-review, approval, merge, production deployment, manual deployment, worklog rollover, archive creation, docs/worklogs creation, README pointer, tests, package or lockfile changes, workflow changes, public route/content changes, D3 / P7.x changes, Dependabot processing, deployment-provenance classification, or cross-repository propagation.
Files changed:
- AGENTS.md -- added canonical Worklog Governance rules, including the pre-append integration inventory gate, historical-entry protection, rollover review triggers, archive immutability, and the script invocation boundary.
- CLAUDE.md -- added a mirror-only Worklog Governance pointer back to AGENTS.md.
- AGENT_WORKLOG.md -- inserted the Active Log Notice immediately after the opening append instruction and appended this single dated entry; pre-existing dated entries were not rewritten, reordered, summarized, normalized, or deleted.
- scripts/check-agent-worklog-governance.mjs -- added a read-only Node.js built-in-only evidence script with human-readable and --json modes.
Starting main and branch: fresh clean clone at C:/Users/kasmo/Documents/Codex/mwe-csa after the first attempted clone under the generated workspace failed checkout because of Windows path length. The successful clone used Git OpenSSL transport and core.longpaths. Required preflight was read-only and clean: git fetch --prune origin exit 0; git status --short empty; git diff --cached --name-only empty; git ls-files --others --exclude-standard empty; branch main; HEAD 411eb08fe93094faa7f01f9a3324fc894b9947c9; origin/main 411eb08fe93094faa7f01f9a3324fc894b9947c9; worktree list showed only the clean implementation tree. Created codex/worklog-governance-change-set-a from exact 411eb08fe93094faa7f01f9a3324fc894b9947c9. No rebase, reset, cherry-pick, stale branch reuse, merge, force update, or branch deletion occurred.
Manual pre-append inventory result: current GitHub main was 411eb08fe93094faa7f01f9a3324fc894b9947c9. Open PRs were dependency queue only: #70, #71, #72, #73, #74, #76, #77, #78, and #82, all Dependabot. PR #97 (claude/wp0-wp5-boundary-footer-reconciliation), PR #98 (claude/wp3-option-3a-public-records-cross-reference), PR #99 (claude/human-governed-ai-workflows-kns5yj), and PR #100 (claude/wp1-entry-points-relation-boundary) were confirmed closed and merged with merge metadata. D3 / P7.x was treated as author-declared in_progress and non-blocking. No relevant non-bot work was classified as completed_pushed_unmerged, ambiguous, or author_status_unknown for this Change Set A task, so no blocker remained before the first worklog write.
Validation-script role and non-authority boundary: the script reports repository root, current branch, current HEAD, available origin/main SHA, exact AGENT_WORKLOG byte size and line count, dated-entry count, rollover line status, Active Log Notice presence and AGENTS.md pointer checks, remote branch evidence, current branch exclusion, dependency branch separation, and observable non-bot branch evidence. It never modifies files, stages, commits, fetches, pushes, opens or edits PRs, deletes branches, classifies author status, decides merge readiness, or authorizes integration, publication, or deployment. Script output is evidence only, not semantic authority.
Build / tests run:
- node --check scripts/check-agent-worklog-governance.mjs -- exit 0.
- node scripts/check-agent-worklog-governance.mjs -- exit 0 after the final byte-restored worklog state; reported repository root C:/Users/kasmo/Documents/Codex/mwe-csa, branch codex/worklog-governance-change-set-a, HEAD and origin/main 411eb08fe93094faa7f01f9a3324fc894b9947c9, AGENT_WORKLOG 513113 bytes / 3908 lines, 73 dated entries, below_review_threshold, exactly one Active Log Notice, AGENTS.md pointer true, remote branch evidence available, 9 dependency branches separated, and PR state unavailable through gh because the local gh token returned HTTP 401.
- node scripts/check-agent-worklog-governance.mjs --json -- exit 0 with equivalent core facts to human-readable mode.
- git diff --check -- exit 0, with Git line-ending warnings only.
- pnpm run check via the bundled pnpm.cmd -- did not complete. Because node_modules was absent, pnpm attempted an install, then stopped with ERR_PNPM_IGNORED_BUILDS for native build scripts (esbuild, sharp, workerd). The generated untracked pnpm-workspace.yaml produced by that failed install was removed because it was outside the authorized four-path scope. package.json and pnpm-lock.yaml remained unchanged.
Preservation verification: committed starting AGENT_WORKLOG.md blob at HEAD was 505829 bytes with 72 dated entries. The working-tree checkout before the first worklog edit measured 509709 bytes / 3881 lines because of checkout line-ending expansion; the committed blob is the byte-preservation source of truth. Before commit, the dated-entry stream from HEAD:AGENT_WORKLOG.md was extracted and compared with the current stream from the first pre-existing dated entry through the line before this new entry. Result: 72 old entries, 72 current pre-existing entries, byteIdentical true, oldStreamSha256 and currentPreExistingStreamSha256 both 4157FAB5A71EE6A262578D97EF9E480AF42145E62BF62A8E3B5B7BF668191768, newEntryCount 1, Active Log Notice count 1. The only insertion before the dated-entry stream is the Active Log Notice placed after "Agents must append entries here after making changes." No rollover, truncation, normalization, or rewrapping was performed.
Result: Change Set A instruction implementation is present in exactly the authorized four paths. Rollover remains recommended but was not executed. Archive creation, docs/worklogs/README.md, README pointer, tests, package changes, workflow changes, public route/content changes, D3 / P7.x work, Dependabot processing, deployment-provenance review, and cross-repository propagation remain deferred.
Unresolved questions: local gh authentication is invalid, so the new script demonstrates GitHub-unavailable behavior by reporting pr_state_unavailable; manual PR metadata for the gate was obtained through read-only GitHub API/connector evidence instead. Full pnpm validation remains blocked locally by pnpm ignored native build scripts unless the author separately authorizes the dependency-build approval path or CI validates the branch.
Risks or assumptions: the validation script intentionally does not produce governance classifications such as completed_pushed_unmerged, in_progress, hold, ambiguous, or author_status_unknown. Some surviving remote branch tips are not locally classifiable by ancestry alone; that evidence is advisory and was not treated as an unmerged-work claim. Repository evidence is not live deployment evidence, and no ready, approval, merge, publication, manual deployment, production deployment, branch deletion, or worklog archive action occurred.

### 2026-08-01 - Codex - update-download-artifact-current-main-20260801

Agent: Codex
Task: Recreate the actions/download-artifact dependency update from current main on owner branch chore/update-download-artifact-20260801-current-main. The pinned action changed from v4.3.0 to v8.0.1 in .github/workflows/public-surface-candidate-generation.yml, including the audit-readable version comment. The old Dependabot branch was not rewritten.
Files changed: .github/workflows/public-surface-candidate-generation.yml and AGENT_WORKLOG.md. No dependency guard, package manifest, lockfile, HANDOFF.md, production publishing workflow, or public content changed.
Build / tests run: pnpm.cmd install --frozen-lockfile completed after local CI-mode dependency installation and approved native build scripts. pnpm.cmd run check was executed and remained blocked by a Windows esbuild access-denied failure while resolving aria-query and axobject-query package files; CI validation is required. rg action pin audit passed. git diff origin/main...HEAD --check passed. Artifact upload/download round-trip contract was checked locally: producer and consumer use the same artifact name public-surface-candidate-data and path candidate-artifact; no production workflow was run.
Unresolved questions: GitHub Actions CI must confirm the updated download action in the hosted runner and confirm the artifact round trip.
Risks or assumptions: The source Dependabot commit was cherry-picked and amended only to update the human-readable version comment. The workflow remains manually gated and was not dispatched.

### 2026-08-01 - Codex - update-setup-node-20260801

Agent: Codex
Task: Recreate the actions/setup-node dependency update from current main on owner branch chore/update-setup-node-20260801. All three setup-node pins and audit-readable comments changed from v4.4.0 to v7.0.0. The old Dependabot branch was not rewritten.
Files changed: .github/workflows/ci.yml, .github/workflows/public-surface-candidate-generation.yml, and AGENT_WORKLOG.md. No dependency guard, package manifest, lockfile, HANDOFF.md, production publishing workflow, or public content changed.
Build / tests run: pnpm.cmd install --frozen-lockfile completed. pnpm.cmd run check was executed and remained blocked by a Windows esbuild access-denied failure while resolving aria-query and axobject-query package files; CI validation is required. rg setup-node pin audit passed with three updated comments. git diff origin/main...HEAD --check passed.
Unresolved questions: GitHub Actions CI must confirm the updated setup-node action on all three uses.
Risks or assumptions: The source Dependabot commit was cherry-picked and amended only to update the human-readable version comments. No production workflow was dispatched.

### 2026-08-01 - Codex - update-checkout-20260801

Agent: Codex
Task: Recreate the actions/checkout dependency update from current main on owner branch chore/update-checkout-20260801. All four checkout pins and audit-readable comments changed from v4.2.2 to v7.0.1. The old Dependabot branch was not rewritten.
Files changed: .github/workflows/ci.yml, .github/workflows/public-surface-candidate-generation.yml, and AGENT_WORKLOG.md. No dependency guard, package manifest, lockfile, HANDOFF.md, production publishing workflow, or public content changed.
Build / tests run: pnpm.cmd install --frozen-lockfile completed. pnpm.cmd run check was executed and remained blocked by a Windows esbuild access-denied failure while resolving aria-query and axobject-query package files; CI validation is required. rg checkout pin audit passed with four updated comments. git diff origin/main...HEAD --check passed.
Unresolved questions: GitHub Actions CI must confirm the updated checkout action on all four uses.
Risks or assumptions: The source Dependabot commit was cherry-picked and amended only to update the human-readable version comments. No production workflow was dispatched.

### 2026-08-01 - Codex - update-upload-artifact-20260801

Agent: Codex
Task: Recreate the actions/upload-artifact dependency update from current main on owner branch chore/update-upload-artifact-20260801. The upload pin and audit-readable comment changed from v4.6.2 to v7.0.1. The old Dependabot branch was not rewritten.
Files changed: .github/workflows/public-surface-candidate-generation.yml and AGENT_WORKLOG.md. No dependency guard, package manifest, lockfile, HANDOFF.md, production publishing workflow, or public content changed.
Build / tests run: pnpm.cmd install --frozen-lockfile completed. pnpm.cmd run check was executed and remained blocked by a Windows esbuild access-denied failure while resolving aria-query and axobject-query package files; CI validation is required. rg upload-artifact pin audit passed. git diff origin/main...HEAD --check passed. Artifact upload/download round-trip contract was checked locally: the producer uploads public-surface-candidate-data from candidate-artifact and the consumer downloads the same name to the same path; no production workflow was run.
Unresolved questions: GitHub Actions CI must confirm the updated upload action and the hosted artifact round trip with the existing download action.
Risks or assumptions: The source Dependabot commit was cherry-picked and amended only to update the human-readable version comment. No production workflow was dispatched.

### 2026-08-06 - Claude Code - public-slice-2026-07-31-data

Agent: Claude Code, model claude-opus-5[1m]
Task: Add the two data files behind a forthcoming Artistic Research public slice, and nothing else. src/data/mwe-development-rate/monthly_development_rate.csv and summary.json hold a measurement of a private working corpus over eleven months ending 2026-07-31: words written, posts published, and AI tokens logged, each month set against its own base month. The page that draws them is deliberately not in this change; see below.
Files changed: src/data/mwe-development-rate/monthly_development_rate.csv (added, 709 bytes, sha256 prefix A0E3E90E13FD), src/data/mwe-development-rate/summary.json (added, 674 bytes, A64D1FCCC934), and AGENT_WORKLOG.md. No page, component, layout, style, script, test, workflow, manifest, lockfile or public navigation surface changed.
Why the page is a separate change: the slice page pins its evidence to the commit that contains these files. That commit does not exist until this merges, and a squash merge would strand a pin aimed at this branch head. The page is built, reviewed and held; it is not in this pull request so that its pins can name a commit that is actually on main.
Line-ending normalization: both files were produced on Windows with CRLF and stand at 721 bytes 9B42350049CD and 701 bytes 8DC3744D0E9B in the authoring record. This repository is LF, so both were normalized before committing. Equivalence was proved rather than assumed: parsed CSV rows compare equal across the two encodings (11 data rows) and parsed JSON objects compare equal.
Build / tests run: pnpm install --frozen-lockfile completed (exit 0). pnpm run build completed (exit 0) both before and after these files were added. The full pnpm run check was not run: it includes wrangler deploy --dry-run and the complete adjacency and authority suites, and this change adds two static data files that no test, loader or manifest reads. CI validation is required. git status --short showed only the intended addition. A CR byte scan of both added files returned zero.
Pre-append worklog inventory: node scripts/check-agent-worklog-governance.mjs was run against origin/main b090c33c0b3f50607fb3931359e6b4444c60ab9e. Five non-bot branches returned requires_author_or_pr_review=true. The owner dispositioned them on 2026-08-06 before this entry was written: #101 claude/p7-1-implementation-plan-7t42ah and #103 claude/public-authority-phase1-recovery-guide are live work and must not be touched; the three closed-unmerged branches behind #1, #10 and #106 are assigned to another agent and are out of scope here. No prior entry was altered, reordered, summarized, normalized or removed; this entry is appended.
Unresolved questions: The three closed-unmerged branches remain on the remote and will keep the inventory flagged until whoever owns that task disposes of them. Nothing in this change depends on that.
Risks or assumptions: No classification, naming, registry, relation or public/private boundary decision was made. The decision to publish these figures was made by the owner on 2026-08-06; this change executes it. The corpus itself is not published and these files are not a route into it. The pull request is opened as a draft and left unmerged; merge is an owner decision.
