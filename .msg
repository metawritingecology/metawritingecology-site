Re-aim the slice's evidence at the source repository

CI rejected the previous arrangement, and two of the three failures were the
contract speaking rather than a defect. ALLOWED_GITHUB_REPOS permits public
source links to metawritingecology/meta-writing-ecology only, and
human-governed-ai-workflows.astro states the same rule in published words:
website-repository files are referred to by visible path, without a GitHub URL.
A test asserts the allowlist holds exactly one repository.

Widening it was considered and rejected: that would edit a test whose purpose is
to guard a public claim, which is a governance decision and does not belong
inside this change.

So the two data files are removed from here and committed to the source
repository instead, at visualizations/mwe-development-rate/ via
metawritingecology/meta-writing-ecology#32. The page's five evidence pins now
name commit fd30bc6 there; the blob URL returns 200. That pull request must
merge before this one.

Nothing here reads those files. The page carries its charts as pre-rendered
inline SVG with no client script and no runtime fetch, so this removes a
duplicate rather than a dependency.

The third failure was an omission: the new route was not registered in
SITEMAP_EXCLUDED_PATHS, so it was treated as an ordinary indexable page and
failed the requirement that every sitemap-eligible page render through
BaseLayout. Its sibling has been registered there since it was added. The new
route now sits beside it. No other entry and no rule in that module changed.

Checks: indexing-discovery, human-governed-ai-workflows, metadata-contract and
security-resilience suites all pass; pnpm run build exit 0.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013cfYKkoAUEkr5Hw56hXkvF
