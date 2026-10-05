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
test('dated case is sitemap-eligible and route resolves',()=>{
 assert(!SITEMAP_EXCLUDED_PATHS.has(route));assert.equal(isSitemapEligible(route),true);
 assert(!SITEMAP_EXCLUDED_PATHS.has('/artistic-research/public-surface-case/2026-10-05/'));
 assert.equal(isSitemapEligible('/artistic-research/public-surface-case/2026-10-05/'),true);
 assert(resolveRouteSource(route)?.endsWith('2026-10-04.astro'));
});
test('standalone route has indexable metadata, raw SSR and ordered classic scripts',()=>{
 assert.doesNotMatch(astro,/name="robots"/i);
 assert.equal((astro.match(/rel="canonical"/g)||[]).length,1);
 assert.match(astro,/rel="canonical"\s+href=\{publicMetadata\.canonicalUrl\}/);
 assert.match(astro,/route:\s*Astro\.url\.pathname/);assert.match(astro,/resolvePublicMetadata/);
 assert.match(astro,/<SchemaJsonLd data=\{jsonLd\}/);
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

// Execute both shipped scripts. This model checks event ownership/restoration,
// not real browser print layout or assistive-technology behavior.
for (const originalReady of [true, false]) {
 test(`revisited print coordination: original app ${originalReady ? 'ready' : 'absent'}`, () => {
  class Detail {
   constructor(className, open) { this.className=className; this.open=open; this.parentElement=null; }
   matches(selector) { return selector.split(',').map(s=>s.trim().slice(1)).includes(this.className); }
   addEventListener() {}
  }
  const details=[
   new Detail('reading-branch',false),new Detail('branch-sources',true),new Detail('reading-combination',false),
   ...Array.from({length:7},(_,i)=>new Detail('review-evidence',i%2===0)),
   ...Array.from({length:3},(_,i)=>new Detail('latest-evidence',i%2===1)),new Detail('unrelated',false)
  ];
  const listeners=new Map(), classes=new Set();
  const document={
   getElementById(id) { return id==='case-data'?{textContent:JSON.stringify({events:[],branches:[],ui:{}})}:null; },
   querySelector() { return null; },
   querySelectorAll(selector) { return selector==='details'?details:details.filter(d=>d.matches(selector)); },
   documentElement:{classList:{add(c){classes.add(c);},contains(c){return classes.has(c);}}}
  };
  const window={d3:originalReady?{}:undefined,addEventListener(type,handler){
   if(!listeners.has(type)) listeners.set(type,[]);
   listeners.get(type).push(handler);
  }};
  const context={window,document,location:{hash:''},HTMLDetailsElement:Detail,setTimeout,clearTimeout,requestAnimationFrame(){}};
  runInNewContext(read('public/assets/public-surface-case/2026-10-04/branch-app.js'),context);
  runInNewContext(read('public/assets/public-surface-case/2026-10-04-revisited/review-layer.js'),context);
  assert.equal(classes.has('js-ready'),originalReady);
  assert.equal(listeners.get('beforeprint').length,originalReady?2:1,'retain both handlers');
  assert.equal(listeners.get('afterprint').length,originalReady?2:1,'retain both handlers');
  const emit=event=>listeners.get(event)?.forEach(handler=>handler());
  const states=()=>details.map(d=>d.open);
  const original=states();
  emit('afterprint'); assert.deepEqual(states(),original);
  emit('beforeprint'); assert(details.every(d=>d.open));
  emit('beforeprint'); emit('afterprint'); assert.deepEqual(states(),original,'cancel/close restores mixed states');
  emit('afterprint'); assert.deepEqual(states(),original,'repeated close is harmless');
  details[0].open=true; details[3].open=false; details[10].open=true;
  const next=states(); emit('beforeprint'); emit('beforeprint'); assert(details.every(d=>d.open));
  emit('afterprint'); assert.deepEqual(states(),next,'later cycle captures new states');
 });
}

test('revisited print fallback and October 5 stylesheet precedence stay scoped', () => {
 const page=read('src/pages/artistic-research/public-surface-case/2026-10-04-revisited.astro');
 const assertOrder=source=>{
  const imports=[...source.matchAll(/import "([^"\n]+\.css)";/g)].map(m=>m[1]);
  const ordered=['global.css','public-surface-case-2026-10-04.css','public-surface-case-2026-10-04-revisited.css','public-surface-case-2026-10-05-additions.css'];
  const indexes=ordered.map(name=>imports.findIndex(p=>p.endsWith('/'+name)));
  assert(indexes.every(i=>i>=0));
  assert(indexes.every((i,n)=>n===0||i>indexes[n-1]));
 };
 assertOrder(page);
 const latestImport='import "../../../styles/public-surface-case-2026-10-05-additions.css";';
 assert.throws(()=>assertOrder(latestImport+'\n'+page.replace(latestImport,'')));
 const css=read('src/styles/public-surface-case-2026-10-04-revisited.css');
 const rule='.review-2026-10-04 .review-insertion details > :not(summary){display:block!important}';
 const assertFallback=source=>{
  const i=source.indexOf('@media print{'); assert(i>=0);
  assert(!source.slice(0,i).includes(rule));
  assert.equal(source.slice(i).split(rule).length-1,1);
  assert(source.slice(i).includes('.review-2026-10-04 .review-insertion details::details-content{content-visibility:visible!important;display:block!important}'));
 };
 assertFallback(css);
 assert.throws(()=>assertFallback(css.replace(rule,'')));
 assert.throws(()=>assertFallback(css.replace(rule,rule.replace(':not(summary)','*'))));
 assert.throws(()=>assertFallback(rule+css.replace(rule,'')));
 const latest=read('src/styles/public-surface-case-2026-10-05-additions.css');
 assert(latest.slice(latest.indexOf('@media print{')).includes('.review-2026-10-04 .latest-insertion{background:#f4eff7;color:#2d2338;border-left-color:#77638d}'));
});

test('revisited composition preserves the original, ten additions and a historical source', () => {
 const dir='src/data/public-surface-case/2026-10-04-revisited/';
 const composed=read(dir+'rendered-body.en.html');
 const earlier=JSON.parse(read(dir+'annotations.en.json')).annotations;
 const latest=JSON.parse(read(dir+'latest-updates.en.json')).blocks;
 const decode=s=>s.replace(/<[^>]+>/g,'').replace(/&#(?:39|x27);/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
 const verify=body=>{
  const blocks=[...body.matchAll(/\n<!-- BEGIN (REVIEW|LATEST|HISTORICAL|FILM) INSERTION ([a-z0-9-]+) -->\n([\s\S]*?)\n<!-- END \1 INSERTION \2 -->/g)];
  assert.equal(blocks.filter(m=>m[1]==='REVIEW').length,7);
  assert.equal(blocks.filter(m=>m[1]==='LATEST').length,3);
  assert.equal(blocks.filter(m=>m[1]==='HISTORICAL').length,1);
  assert.equal(blocks.filter(m=>m[1]==='FILM').length,1);
  assert.equal(new Set(blocks.map(m=>m[2])).size,12);
  let stripped=body; for(const m of blocks) stripped=stripped.replace(m[0],'');
  assert.equal(stripped,html,'removing the ten additions and historical insertion recovers the original bytes');
  const ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,'unique composed IDs');
  const idSet=new Set(ids); for(const m of body.matchAll(/href="#([^"]+)"/g)) assert(idSet.has(m[1]),m[1]);
  for(const note of [...earlier,...latest]) {
   const block=blocks.find(m=>m[2]===note.id); assert(block,note.id);
   assert.equal((block[3].match(/<details\b/g)||[]).length,1,note.id);
   assert(!/<details\b[^>]*\bopen\b/.test(block[3]),'sources initially closed');
   const main=block[3].slice(0,block[3].indexOf('<details'));
   assert(!/\bhidden\b|display\s*:\s*none|visibility\s*:\s*hidden/.test(main));
   for(const paragraph of Array.isArray(note.body)?note.body:[note.body]) assert(decode(main).includes(paragraph),note.id+' main prose stays outside details');
  }
 };
 verify(composed);
 assert.throws(()=>verify(composed.replace('This independent Public Surface Case','Changed original text')));
 assert.throws(()=>verify(composed.replace('id="review-note-reading-boundary"','id="source-1"')));
 assert.throws(()=>verify(composed.replace('href="#review-evidence-reading-boundary"','href="#missing-review-target"')));
 const first=composed.indexOf('data-review-insertion="reading-boundary"');
 const start=composed.indexOf('</p><p>',first)+4, end=composed.indexOf('</p><details',start)+4;
 const paragraph=composed.slice(start,end);
 assert(paragraph.startsWith('<p>')&&paragraph.endsWith('</p>'));
 const moved=composed.slice(0,start)+composed.slice(end);
 const at=moved.indexOf('</summary>',start)+10;
 assert.throws(()=>verify(moved.slice(0,at)+paragraph+moved.slice(at)));
});

test('Artistic Research retains the original comparison and causality boundaries', () => {
 const intro=read('src/pages/artistic-research.md');
 assert(intro.includes('The comparisons are authored; the sources retain their own evidentiary limits.'));
 assert(intro.includes('Optional reading branches and timelines expose the selected material without establishing causal relations.'));
});

test('publication-status cleanup is limited to the two explicitly removed states', () => {
 const label=' | Not publicly published';
 const sentence='The article and branch materials have not been publicly published. ';
 const originals={
  'article.en.md':'3d28c4ebc0836624839665be1e0985d499f3c06bc5aed024750ccfeb824c94b9',
  'metadata.en.json':'62d24dd5a77b98545bd23df537eb0a0486794f3f63b1bdcbac8c56ca0466149a',
  'rendered-body.en.html':'0a441ccfa93e718501f1a76f684e2e65d7478388687356c95fd503ea855d0881'
 };
 for(const [name,expected] of Object.entries(originals)) {
  const current=read(base+name); assert(!current.includes(label)); assert(!current.includes(sentence));
  let restored=current;
  if(name!=='rendered-body.en.html') {
   const caption='Observational essay | October 4, 2026';
   assert.equal(restored.split(caption).length-1,1);
   restored=restored.replace(caption,caption+label);
  }
  if(name!=='metadata.en.json') {
   const anchor=name==='article.en.md'?'- The interactive version':'<li>The interactive version';
   assert.equal(restored.split(anchor).length-1,1);
   restored=restored.replace(anchor,anchor.replace('The interactive version',sentence+'The interactive version'));
  }
  assert.equal(createHash('sha256').update(restored).digest('hex'),expected,name+' has no other original-text changes');
 }
 const composed=read('src/data/public-surface-case/2026-10-04-revisited/rendered-body.en.html');
 assert(!composed.includes(sentence));
 assert(composed.includes('The interactive version should retain these source distinctions and the case&#39;s date and cutoff.'));
});

test('Artistic Research separates three slices and the two distinct case groups', () => {
 const page=read('src/pages/artistic-research.md');
 for(const date of ['25 July 2026','31 July 2026','7 August 2026']) assert.equal(page.split('### Public Slice — '+date+'\n').length-1,1);
 const first=page.split('#### 18 August and 19 September 2026\n')[1]?.split('#### 4 October 2026 — original and revisited\n')[0];
 const second=page.split('#### 4 October 2026 — original and revisited\n')[1]?.split('\n## ')[0];
 assert(first&&second);
 for(const route of ['2026-08-18','2026-09-19']) {assert(first.includes('/public-surface-case/'+route+'/')); assert(!second.includes('/public-surface-case/'+route+'/'));}
 for(const route of ['2026-10-04','2026-10-04-revisited']) {assert(second.includes('/public-surface-case/'+route+'/')); assert(!first.includes('/public-surface-case/'+route+'/'));}
});

test('earlier additions retain dark text and source URLs when hovered in print', () => {
 const css=read('src/styles/public-surface-case-2026-10-04-revisited.css');
 const verify=source=>{
  const print=source.slice(source.indexOf('@media print{'));
  assert.match(print,/\.review-2026-10-04 \.review-insertion a:hover,[^{]+\{color:#122d30\}/);
 };
 verify(css);
 const i=css.indexOf('@media print{');
 assert.throws(()=>verify(css.slice(0,i)+css.slice(i).replace('.review-2026-10-04 .review-insertion a:hover,','')));
});
