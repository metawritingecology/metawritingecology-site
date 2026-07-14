// Prerendered runtime-manifest endpoint.
//
// Route: /public-surface-map/data/manifest.json
//
// The manifest is served as the EXACT raw source bytes (imported via Vite `?raw`
// so there is no filesystem access and no runtime request). The raw text is
// strictly validated at build time; a validation failure throws and fails the
// build. The body is never reconstructed via JSON.stringify — the source bytes
// are the response body, so the deployed bytes stay byte-identical to the
// repository source. No Worker-time computation, no GitHub fetch, no external
// source.

export const prerender = true;

import rawManifestText from "../../../data/public-surface-authority-map/runtime-manifest.json?raw";
import { assertRuntimeManifest } from "../../../lib/public-surface-authority-map/runtimeManifestContract.ts";

// Build-time gate: parse a COPY only to validate; the served body remains the
// exact raw source text.
assertRuntimeManifest(JSON.parse(rawManifestText));

export function GET(): Response {
  return new Response(rawManifestText, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
