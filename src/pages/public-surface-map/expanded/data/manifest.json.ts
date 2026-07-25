// Prerendered runtime-manifest endpoint for the expanded adjacency product.
//
// Route: /public-surface-map/expanded/data/manifest.json
//
// Independent of the 30-record authority-map endpoint; neither reads the other.
//
// The manifest is served as the EXACT raw source bytes (imported via Vite `?raw`
// so there is no filesystem access and no runtime request). The raw text is
// strictly validated at build time; a validation failure throws and fails the
// build. The body is never reconstructed via JSON.stringify — the source bytes
// ARE the response body, so deployed bytes stay byte-identical to the repository
// source. No Worker-time computation, no generated timestamp, no external fetch.

export const prerender = true;

import rawManifestText from "../../../../data/public-surface-adjacency-map/runtime-manifest.json?raw";
import { assertAdjacencyRuntimeManifest } from "../../../../lib/public-surface-adjacency-map/runtimeManifestContract.ts";

// Build-time gate: parse a COPY only to validate; the served body remains the
// exact raw source text.
assertAdjacencyRuntimeManifest(JSON.parse(rawManifestText));

export function GET(): Response {
  return new Response(rawManifestText, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
