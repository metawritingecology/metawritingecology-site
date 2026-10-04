# October 4 case renderer

This isolated, English-only generator prepares the approved source for the standalone Astro route. It is not a publication command.

Editable inputs are `src/data/public-surface-case/2026-10-04/article.en.md`, `branches.en.json`, and `events.en.json`. The checked-in `rendered-body.en.html`, `metadata.en.json`, and `payload.en.json` are the explicit prebuilt SSR handoff. Astro imports these files and does not require marked in the main application dependencies.

To regenerate with Node 24+ and pnpm 10.34.5:

1. Run `pnpm --dir tools/public-surface-case-2026-10-04 install`.
2. Run `pnpm --dir tools/public-surface-case-2026-10-04 run build`.
3. Review generated changes and run the root project's checks.

The renderer also produces an ignored local-only `preview.en.html`. Styles are maintained in the case-scoped stylesheet under `src/styles/`; the vendored D3 runtime, license, and application script are under `public/assets/public-surface-case/2026-10-04/`.

The source title, subtitle and selection limits must stay synchronized. The editorial cutoff is a selection boundary, not an independently reverified evidence cutoff. Changes before first publication may revise this unpublished draft; later substantive evidence after approval/publication requires a separately dated layer.
