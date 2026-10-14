#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFreePort, withLocalServer } from './verify-metadata-build.mjs';
import { DATED_SHELL_ROUTES, SHELL_EXCEPTIONS, shellCounts, assertShellCounts } from './lib/shared-shell-contract.mjs';

const pages = fileURLToPath(new URL('../src/pages/', import.meta.url));
function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? sources(resolve(dir,e.name)) : [resolve(dir,e.name)]);
}
const routes = sources(pages).filter(p => ['.astro','.md','.mdx'].includes(extname(p))).map(p => {
  const name = relative(pages,p).replaceAll('\\','/').replace(/\.(astro|md|mdx)$/,'').replace(/(^|\/)index$/,'');
  return { route: name ? `/${name}/` : '/', source: readFileSync(p,'utf8') };
});
await withLocalServer(async (_origin, render) => {
  for (const { route, source } of routes) {
    const dated = DATED_SHELL_ROUTES.includes(route), exception = SHELL_EXCEPTIONS.includes(route);
    if (!dated && !exception && !source.includes('BaseLayout')) throw new Error(`${route}: unclassified standalone source`);
    const probe = route === '/404/' ? '/shared-shell-404-probe/' : route;
    const { status, body } = await render(probe);
    if (status !== (route === '/404/' ? 404 : 200)) throw new Error(`${route}: HTTP ${status}`);
    assertShellCounts(shellCounts(body), { present: !exception, dated }, route);
    console.log(`PASS shared shell ${route}`);
  }
  console.log(`verify-shared-shell-build: ${routes.length}/${routes.length} rendered human routes passed; no deploy`);
}, { port: await getFreePort() });
process.exit(0);
