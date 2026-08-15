# Meta-Writing Ecology Site

This repository hosts the public surface website for Meta-Writing Ecology.

The site provides the landing page, entry surfaces, AI-reading pages, fiction catalogue, publication links, platform links, and selected public-facing documentation.

This repository does not contain the full Meta-Writing Ecology corpus, private working archive, calibration materials, registry remediation material, or unpublished system layers.

## Project purpose

The website functions as the primary public entry surface for Meta-Writing Ecology. It is canonical as a public orientation route, but it is not the complete registry, internal authority map, or full working corpus.

It is intended to be readable by human visitors, crawlers, archives, and AI-mediated reading systems without exposing private or internal working layers.

## Local setup

This project is pinned to pnpm 10.34.5 via the `packageManager` field. Use pnpm, not npm.

Install dependencies:

```bash
pnpm install
```

Run a local development server:

```bash
pnpm run dev
```

Build the site:

```bash
pnpm run build
```

Run project checks:

```bash
pnpm run check
```

## Deployment caution

Production deployment should happen only after review and successful validation.

Do not deploy directly from an unreviewed branch.

## Generated files

Do not edit generated output directly.

Generated or local build folders include:

- `dist/`
- `.astro/`
- `.wrangler/`
- `node_modules/`

Source content should be edited in `src/`, `public/`, and configuration files as appropriate.

## License

Unless a file header names a different Creative Commons license, materials in this repository are licensed under [CC BY 4.0](./LICENSE). See [NOTICE](./NOTICE).
