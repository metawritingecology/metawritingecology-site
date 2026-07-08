import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pagesDir = new URL("./src/pages/", import.meta.url);

// Map a public route pathname back to its source page file so we can derive a
// stable last-modified signal for the sitemap. This does not change routes,
// canonical URLs, or page content.
function resolveSourceFile(pathname) {
  const segment = pathname.replace(/^\/+|\/+$/g, "");
  const bases = segment === "" ? ["index"] : [segment, `${segment}/index`];
  const extensions = [".md", ".mdx", ".astro"];

  for (const base of bases) {
    for (const ext of extensions) {
      const fileUrl = new URL(`${base}${ext}`, pagesDir);
      if (existsSync(fileUrl)) return fileURLToPath(fileUrl);
    }
  }

  return null;
}

// Prefer git commit time (most stable across rebuilds and checkouts); fall back
// to file mtime when git history is unavailable (e.g. untracked file).
function lastmodFor(file) {
  try {
    const committed = execSync(`git log -1 --format=%cI -- "${file}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (committed) return committed;
  } catch {
    // ignore and fall back to mtime
  }

  try {
    return statSync(file).mtime.toISOString();
  } catch {
    return undefined;
  }
}

export default defineConfig({
  site: "https://metawritingecology.org",
  output: "server",
  adapter: cloudflare(),
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/language-pressure-test-lab-prototype/"),
      serialize(item) {
        try {
          const { pathname } = new URL(item.url);
          const file = resolveSourceFile(pathname);
          const lastmod = file ? lastmodFor(file) : undefined;
          if (lastmod) item.lastmod = lastmod;
        } catch {
          // leave the entry unchanged if lastmod cannot be resolved
        }

        return item;
      }
    })
  ]
});
