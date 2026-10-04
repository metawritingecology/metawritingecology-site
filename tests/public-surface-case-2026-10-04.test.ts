// @ts-nocheck — Node built-in integration contract; no added root dependencies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { splitSourceSection } from '../tools/public-surface-case-2026-10-04/source-section.mjs';
import { SITEMAP_EXCLUDED_PATHS, isSitemapEligible, resolveRouteSource, isValidGithubSourceUrl } from '../scripts/lib/indexing-discovery-contract.mjs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const base='src/data/public-surface-case/2026-10-04/';
const data=JSON.parse(read(base+'payload.en.json'));
const meta=JSON.parse(read(base+'metadata.en.json'));
const html=read(base+'rendered-body.en.html');
const astro=read('src/pages/artistic-research/public-surface-case/2026-10-04.astro');
const route='/artistic-research/public-surface-case/2026-10-04/';
test('dated case exclusion is exact and route resolves',()=>{
 assert(SITEMAP_EXCLUDED_PATHS.has(route));assert.equal(isSitemapEligible(route),false);
 assert.equal(isSitemapEligible('/artistic-research/public-surface-case/2026-10-05/'),true);
 assert(resolveRouteSource(route)?.endsWith('2026-10-04.astro'));
});
test('standalone route retains robots, raw SSR and ordered classic scripts',()=>{
 assert.match(astro,/name="robots" content="noindex, nofollow"/);
 assert.match(astro,/rendered-body\.en\.html\?raw/);assert.match(astro,/set:html=\{bodyHTML\}/);
 assert(!astro.includes('BaseLayout'));assert(!astro.includes('ui.unpublished'));assert(!astro.includes('ui.footer'));assert.match(astro,/styles\/global\.css/);
 assert(astro.indexOf('src="/assets/public-surface-case/2026-10-04/d3.')<astro.indexOf('src="/assets/public-surface-case/2026-10-04/branch-app.js"'));
 assert.equal((astro.match(/<script is:inline/g)||[]).length,3);
 assert.match(astro,/\.replace\(\/</);assert(!/<script[^>]+(?:async|defer)/.test(astro));
});
test('all dated metadata uses the English original and selection boundary',()=>{
 assert.equal(meta.title,data.title);assert.equal(meta.subtitle,data.subtitle);assert.equal(data.locale,'en');
 assert.equal(data.caseDate,'2026-10-04');assert.equal(data.editorialSelectionCutoff,'2026-10-04T12:30:00+08:00');
 assert.notEqual(data.updatedAt,data.editorialSelectionCutoff);assert.match(data.cutoffScope,/not.*independently reverified/);
 assert(!/Why Still Govern Through Fear|translation|third.draft/i.test(meta.title+' '+meta.subtitle+' '+meta.meta));
});
test('prebuilt body retains all branches, conditional combinations and sources without JS',()=>{
 assert.equal(data.events.length,29);assert.equal(data.branches.length,7);
 const cs=data.branches.flatMap(b=>b.readingCombinations||[]);assert.equal(cs.length,15);
 const events=new Set(data.events.map(e=>e.id));const branches=new Set(data.branches.map(b=>b.id));
 for(const b of data.branches){assert(html.includes('id="branch-'+b.id+'"'));for(const id of b.eventIds)assert(events.has(id));}
 for(const c of cs){assert.equal(c.status,'conditional_case_reading');assert(html.includes('id="combination-'+c.id+'"'));for(const id of c.eventIds)assert(events.has(id));for(const id of c.branchIds)assert(branches.has(id));}
 for(let n=1;n<=40;n++)assert(html.includes('id="source-'+n+'"'));
 assert(!/<script/i.test(html));assert(!html.includes('BRANCHTOKEN'));
});
test('SSR IDs and fragment references are complete and unambiguous',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 const idSet=new Set(ids);for(const m of html.matchAll(/href="#([^"]+)"/g))assert(idSet.has(m[1]),m[1]);
});
test('case styles are rooted and include focus, print and reduced motion rules',()=>{
 const css=read('src/styles/public-surface-case-2026-10-04.css');
 assert(css.includes('.case-2026-10-04'));assert(css.includes(':focus-visible'));assert(css.includes('@media print'));
 assert(css.includes('.case-2026-10-04.js-ready .js-only'));assert(!css.includes('.case-2026-10-04 .js-ready'));
 assert(css.includes('prefers-reduced-motion'));assert(css.includes('::details-content'));
 assert(!/(?:^|})\s*(?:body|main|:root|html(?!\.case-2026-10-04))\s*\{/.test(css));
});
test('generated SSR artifacts match their recorded editable sources',()=>{
 const hashes=JSON.parse(read(base+'source-hashes.json'));
 for(const [name,expected] of Object.entries(hashes))assert.equal(createHash('sha256').update(read(base+name)).digest('hex'),expected,name+' must be regenerated/reviewed');
});

test('precise immutable GitHub source anchors and tree overview are accepted',()=>{
 const root='https://github.com/metawritingecology/meta-writing-ecology';
 const sha='ab5304b71fee9fb2f78f6f32997f2fa2109fb83f';
 for(const url of [`${root}/tree/${sha}`,`${root}/blob/${sha}/false-legibility.md#L21`,`${root}/blob/${sha}/false-legibility.md#L21-L79`])assert(isValidGithubSourceUrl(url),url);
});
test('GitHub compatibility keeps mutable, malformed and unsafe links rejected',()=>{
 const root='https://github.com/metawritingecology/meta-writing-ecology';
 const sha='ab5304b71fee9fb2f78f6f32997f2fa2109fb83f';
 const file=`${root}/blob/${sha}/false-legibility.md`;
 for(const hash of ['#section','#L0','#L01','#L-1','#L1-L0','#L79-L21','#L1-L2-extra','#L1%2dL2','#L9007199254740992','#L1?x=1'])assert.equal(isValidGithubSourceUrl(file+hash),false,hash);
 for(const url of [`${root}/blob/main/false-legibility.md#L1`,`${root}/blob/feature/false-legibility.md#L1`,`${root}/tree/${sha}#L1`,`${root}/tree/${sha}?x=1`,`${root}/tree/main`,`${root}/blob/${sha}`,`${root}/blob/main`,`${root}/blob/${sha}/%2e%2e/file.md#L1`,`${root}/blob/${sha}/safe%2ffile.md#L1`,`${root}/blob/${sha}//file.md#L1`,file+'?x=1#L1',file.replace('https:','http:')+'#L1',file.replace('github.com','user@github.com')+'#L1',file.replace('github.com','github.com:8443')+'#L1',file.replace('meta-writing-ecology','unapproved-repository')+'#L1'])assert.equal(isValidGithubSourceUrl(url),false,url);
});

test('source-section parser retains leading, intervening and trailing prose in order',()=>{
 const fixture='Intro with [1].\n\n[1] First record\n\n[2] Second record\n\nIntervening **scope**.\n\n[3] Third record\n\nTrailing limitation.';
 assert.deepEqual(splitSourceSection(fixture),[
  {type:'prose',markdown:'Intro with [1].'},
  {type:'sources',sources:[{number:'1',text:'First record'},{number:'2',text:'Second record'}]},
  {type:'prose',markdown:'Intervening **scope**.'},
  {type:'sources',sources:[{number:'3',text:'Third record'}]},
  {type:'prose',markdown:'Trailing limitation.'}
 ]);
});
test('rendered SSR preserves the approved source context and working citations',()=>{
 const manuscript=read(base+'article.en.md');
 const section=manuscript.split('## Sources and verification\n')[1].split('\n## ')[0];
 const prose=splitSourceSection(section).filter(part=>part.type==='prose');
 assert.equal(prose.length,1);
 const plain=html.replace(/<[^>]*>/g,'');
 for(const part of prose)assert(plain.includes(part.markdown.replace(/\[(\d+)\]/g,'$1')),part.markdown);
 assert(html.indexOf('Repository context in')<html.indexOf('<ol class="article-sources">'));
 const intro=html.slice(html.indexOf('Repository context in'),html.indexOf('<ol class="article-sources">'));
 for(const ref of [28,33,38])assert(intro.includes('href="#source-'+ref+'"'));
});
test('actual print handlers restore mixed disclosure state after cancellation and repeated cycles',()=>{
 const classes=['reading-branch','branch-sources','reading-combination','reading-branch'];
 const details=classes.map((className,i)=>({className,open:i%2===1,addEventListener(){}}));
 const listeners=new Map();
 const document={
  getElementById(id){return id==='case-data'?{textContent:JSON.stringify({events:[],branches:[],ui:{}})}:null;},
  querySelector(){return null;},
  querySelectorAll(selector){const wanted=selector.split(',').map(s=>s.trim().slice(1));return details.filter(d=>wanted.includes(d.className));},
  documentElement:{classList:{add(){}}}
 };
 const window={d3:{},addEventListener(type,handler){listeners.set(type,handler);}};
 runInNewContext(read('public/assets/public-surface-case/2026-10-04/branch-app.js'),{window,document,location:{hash:''},setTimeout,clearTimeout,requestAnimationFrame(){}});
 const states=()=>details.map(d=>d.open);
 const original=states();
 listeners.get('afterprint')();assert.deepEqual(states(),original,'unmatched afterprint is harmless');
 listeners.get('beforeprint')();assert(details.every(d=>d.open));
 listeners.get('beforeprint')();assert(details.every(d=>d.open));
 listeners.get('afterprint')();assert.deepEqual(states(),original,'cancel/close restores the state before the first beforeprint');
 listeners.get('afterprint')();assert.deepEqual(states(),original,'repeated afterprint is harmless');
 details[0].open=true;details[1].open=false;
 const next=states();listeners.get('beforeprint')();listeners.get('afterprint')();assert.deepEqual(states(),next,'a later print cycle captures its own original state');
});
