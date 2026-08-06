import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  PRODUCTION_ORIGIN,
  isSitemapEligible,
  resolveRouteSource,
  readDirectSourceLastmod
} from "./scripts/lib/indexing-discovery-contract.mjs";

const repositoryRoot = fileURLToPath(new URL(".", import.meta.url));

function resolveDeploymentCommit() {
  const configured = process.env.PSADJ_DEPLOYMENT_COMMIT?.trim();
  const commit = configured || execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();

  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error("PSADJ_DEPLOYMENT_COMMIT must be a full lowercase Git SHA");
  }

  return commit;
}

const deploymentCommit = resolveDeploymentCommit();
const pagesDir = new URL("./src/pages/", import.meta.url);

export default defineConfig({
  site: PRODUCTION_ORIGIN,
  output: "server",
  adapter: cloudflare(),
  vite: {
    define: {
      __PSADJ_DEPLOYMENT_COMMIT__: JSON.stringify(deploymentCommit)
    }
  },
  integrations: [
    mdx(),
    sitemap({
      // Explicit normalized-path sitemap contract (Package C). Excludes the
      // noindex prototype and interactive-preview routes, the unmatched-route
      // representation, and any endpoint/asset route. Exact-path matching so a
      // future, similarly named route is never excluded by accident.
      filter: (page) => isSitemapEligible(page),
      serialize(item) {
        // Resolver contract violations (unsafe route input, ambiguous source
        // resolution) are NOT swallowed — they fail the build. Only Git
        // absence / unreachable history (handled inside readDirectSourceLastmod
        // as an omitted timestamp) or a null source for an otherwise valid
        // unsupported route legitimately omits lastmod. No mtime or other
        // timestamp fallback is ever used.
        const { pathname } = new URL(item.url);
        const source = resolveRouteSource(pathname, { pagesDir });
        if (source) {
          // lastmod is derived ONLY from the latest Git commit affecting the
          // route's own direct source file. When no usable Git history exists
          // the timestamp is omitted — never filesystem mtime, never a
          // repository-wide or build-time value.
          const lastmod = readDirectSourceLastmod(source);
          if (lastmod) item.lastmod = lastmod;
        }

        return item;
      }
    })
  ]
});
