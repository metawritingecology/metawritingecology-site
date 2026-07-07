import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://metawritingecology.org",
  output: "server",
  adapter: cloudflare(),
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/language-pressure-test-lab-prototype/")
    })
  ]
});
