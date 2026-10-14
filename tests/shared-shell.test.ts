// @ts-nocheck — Node contract tests; no new dependencies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DATED_SHELL_ROUTES, SHELL_EXCEPTIONS, shellCounts, assertShellCounts } from '../scripts/lib/shared-shell-contract.mjs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const sha = s => createHash('sha256').update(s).digest('hex');
const baseline=JSON.parse(read('tests/fixtures/dated-shell-baseline.json'));

test('shell route coverage is exactly the eight approved dates and two preserved exceptions',()=>{
 assert.deepEqual(DATED_SHELL_ROUTES,[
  '/artistic-research/public-slice/2026-07-25/','/artistic-research/public-slice/2026-07-31/','/artistic-research/public-slice/2026-08-07/',
  '/artistic-research/public-surface-case/2026-08-18/','/artistic-research/public-surface-case/2026-08-22/','/artistic-research/public-surface-case/2026-09-19/',
  '/artistic-research/public-surface-case/2026-10-04/','/artistic-research/public-surface-case/2026-10-04-revisited/'
 ]);
 assert.deepEqual(SHELL_EXCEPTIONS,['/language-pressure-test-lab-prototype/','/404/']);
});

function removeApprovedIntegration(source) {
 let s=source.replace('import SiteHeader from "../../../components/SiteHeader.astro";\n','')
  .replace('import SiteFooter from "../../../components/SiteFooter.astro";\n','')
  .replace('\n    <SiteHeader articleShell />','').replace('    <SiteFooter articleShell />\n','')
  .replace('<footer role="note">','<footer>');
 for (const [a,b] of [[':global(:where(main)) a{','a{'],[':global(:where(main)) a:hover{','a:hover{'],[':global(:where(main)) a:focus-visible,:global(:where(main)) summary:focus-visible{','a:focus-visible,summary:focus-visible{'],[':global(:where(main)) h1,:global(:where(main)) h2,:global(:where(main)) h3{','h1,h2,h3{'],[':global(:where(main)) p{margin:0}','p{margin:0}'],['footer:not(.site-footer){','footer{']]) s=s.replace(a,b);
 return s;
}
for (const [path,expected] of Object.entries(baseline.pages)) {
 test(`${path}: original complete page survives only approved shell/CSS integration`,()=>{
  const s=read(path);
  assert.equal((s.match(/<SiteHeader\b/g)||[]).length,1);
  assert.equal((s.match(/<SiteFooter\b/g)||[]).length,1);
  assert.match(s,/<SiteHeader articleShell \/>/);assert.match(s,/<SiteFooter articleShell \/>/);
  assert.doesNotMatch(s,/<BaseLayout\b/);
  assert.equal(sha(removeApprovedIntegration(s)),expected,'head metadata, article text, local footer, scripts and ordering preserved');
  assert.notEqual(sha(removeApprovedIntegration(s.replace('<main','<main data-unapproved-change'))),expected,'unapproved markup cannot disappear in normalization');
 });
}
for (const [path,expected] of Object.entries(baseline.exceptions)) test(`${path}: exception is unchanged`,()=>assert.equal(sha(read(path)),expected));

test('extracted shared markup retains the exact original header/search and footer content',()=>{
 for (const [path,tag,key] of [['src/components/SiteHeader.astro','header','shared_header_whitespace_normalized'],['src/components/SiteFooter.astro','footer','shared_footer_whitespace_normalized']]) {
  const s=read(path);
  const raw=s.slice(s.indexOf(`<${tag} class="site-${tag}"`),s.indexOf(`</${tag}>`)+tag.length+3)
   .replace(' data-article-shell={articleShell ? "" : undefined}','').replace(' aria-label={articleShell ? "Site information" : undefined}','');
  assert.equal(sha(raw.replace(/\s+/g,' ')),baseline[key]);
 }
 const layout=read('src/layouts/BaseLayout.astro');assert.equal((layout.match(/<SiteHeader \/>/g)||[]).length,1);assert.equal((layout.match(/<SiteFooter \/>/g)||[]).length,1);
 assert.doesNotMatch(layout,/PublicSearchModal/);
});
test('dated case broad element styles are scoped without changing original article styles',()=>{
 const s=read('src/styles/public-surface-case-2026-10-04.css');
 const original=s.replace(/(\.case-2026-10-04 )main (?=(?:a|p|h[1-6]|button|input|select|textarea|ul|ol|li|summary|form|nav|header|footer)(?:[\s:{\[,]))/g,'$1');
 assert.equal(sha(original),baseline.case_stylesheet);
});

const valid='<header class="site-header"><nav class="site-nav"><button data-search-modal-trigger></button></nav><div data-public-search><section class="public-search__dialog"><input data-search-input></section></div></header><footer class="site-footer"></footer>';
test('rendered shell counter recognizes real markup, boolean attrs and quoted angle brackets',()=>{
 assertShellCounts(shellCounts(valid),{present:true,dated:false},'/');
 assertShellCounts(shellCounts(valid.replace('<header','<header data-description="x > y"')),{present:true,dated:false},'/');
 assertShellCounts(shellCounts(valid.replace('<header ','<header data-article-shell ').replace('<footer ','<footer data-article-shell ')+'<footer role="note">Original article boundary</footer>'),{present:true,dated:true},'/dated');
});
test('rendered shell counter rejects missing/duplicate shells and ignores script/comment spoofs',()=>{
 for(const s of [valid+valid,valid.replace('class="site-footer"','data-class="site-footer"'),valid.replace('class="site-nav"','class="site-nav-copy"')]) assert.throws(()=>assertShellCounts(shellCounts(s),{present:true,dated:false},'/'));
 assertShellCounts(shellCounts(valid+'<!--'+valid+'--><script>const template='+JSON.stringify(valid)+'</script><style>.x{content:'+JSON.stringify(valid)+'}</style>'),{present:true,dated:false},'/');
 assertShellCounts(shellCounts('<main><header>Article</header><footer>Article boundary</footer></main>'),{present:false,dated:false},'/exception');
});
