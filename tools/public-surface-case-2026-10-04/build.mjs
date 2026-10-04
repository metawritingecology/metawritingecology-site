import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {normalize} from './normalize.mjs';
import {uiFor} from './i18n.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const {marked}=await import(require.resolve('marked'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locale='en',ui=uiFor(locale);
const dataDir=path.join(root,'../../src/data/public-surface-case/2026-10-04');
const assetDir=path.join(root,'../../public/assets/public-surface-case/2026-10-04');
const eventFile=process.env.EVENTS_FILE||path.join(dataDir,'events.en.json');
const articleFile=process.env.ARTICLE_FILE||path.join(dataDir,'article.en.md');
const output=process.env.OUTPUT_FILE||path.join(root,'preview.en.html');
const raw=JSON.parse(await fs.readFile(eventFile,'utf8')),data=normalize(raw,{locale});
data.locale=locale;data.ui=ui;
const branchFile=process.env.BRANCHES_FILE||path.join(dataDir,'branches.en.json');
const branchRaw=JSON.parse(await fs.readFile(branchFile,'utf8'));
data.branches=Array.isArray(branchRaw)?branchRaw:branchRaw.branches;
if(!Array.isArray(data.branches)||!data.branches.length)throw Error('Reading-branch metadata is required');
const eventIDs=new Set(data.events.map(e=>e.id));
for(const branch of data.branches){if(!branch.id||!branch.title||!Array.isArray(branch.eventIds)||branch.eventIds.some(id=>!eventIDs.has(id)))throw Error(`Invalid branch mapping: ${branch.id}`);}
let markdown=await fs.readFile(articleFile,'utf8');
if(markdown.length<200)throw Error('Refusing to build a blank or incomplete article');
const match=markdown.match(/^# (.+)\n(?:## (.+)\n)?\s*([^#\n]+)?/);
const title=match?.[1]||data.title||ui.pageKind;
const subtitle=match?.[2]||data.subtitle||'';
if(locale==='en'&&(data.title!==title||data.subtitle!==subtitle))throw Error('Article and event metadata must agree');
const meta=match?.[3]?.trim()||data.updatedAt||ui.draft;
if(match)markdown=markdown.slice(match[0].length).trimStart();
// The manuscript uses ### for its main numbered sections below its subtitle.
markdown=markdown.replace(/^### (?=[一二三四五六七八九十]+、)/gm,'## ');
const sourceHeading=markdown.match(/^## (?:查核與來源|Sources(?: and verification)?)\s*$/mi);
const sourceSection=sourceHeading?.index??-1;
if(sourceSection<0)throw Error('The source section is required');
let body=sourceSection>=0?markdown.slice(0,sourceSection):markdown;
let remaining=sourceSection>=0?markdown.slice(sourceSection):'';
body=body.replace(/\[(\d+)\](?!\()/g,(_,n)=>`[${n}](#source-${n})`);
const markers=[];
body=body.replace(/<!--\s*branch:\s*([a-z0-9-]+)\s*-->/g,(_,id)=>{markers.push(id);return `\n\nBRANCHTOKEN${id}\n\n`;});
if(markers.length!==data.branches.length)throw Error('Each branch must have one manuscript marker');
for(const branch of data.branches)if(!markers.includes(branch.id))throw Error(`Missing branch marker: ${branch.id}`);
const toc=[];let sectionIndex=0;
marked.use({renderer:{html(token){return esc(token.text)}}});
let bodyHTML=marked.parse(body);
function addHeadingIds(html){return html.replace(/<h([23])>(.*?)<\/h\1>/gs,(_,level,inner)=>{
  const text=inner.replace(/<[^>]*>/g,''),id=`section-${++sectionIndex}`;
  if(level==='2')toc.push({id,text});return `<h${level} id="${id}">${inner}</h${level}>`;
});}
bodyHTML=addHeadingIds(bodyHTML);
const citeCounts={};
bodyHTML=bodyHTML.replace(/<a href="#source-(\d+)">/g,(_,n)=>{citeCounts[n]=(citeCounts[n]||0)+1;return `<a id="cite-${n}-${citeCounts[n]}" href="#source-${n}" aria-label="${ui.source} ${n}">`;});
if(remaining){
  const endingAt=remaining.indexOf('\n## ',3);
  const ending=endingAt>=0?remaining.slice(endingAt).split('\n').filter(line=>!/^\[\d+\]/.test(line)).join('\n'):'';
  const sourceLines=remaining.split('\n').filter(l=>/^\[\d+\]/.test(l));
  const linkify=line=>{
    const parts=line.split(/(https?:\/\/[^\s；，。]+)/g);
    return parts.map(p=>/^https?:\/\//.test(p)?`<a href="${esc(p)}" target="_blank" rel="noopener noreferrer">${esc(new URL(p).hostname)}</a>`:esc(p)).join('');
  };
  bodyHTML+=`<h2 id="sources">${ui.sources}</h2><ol class="article-sources">${sourceLines.map(line=>{const m=line.match(/^\[(\d+)\]\s*(.*)$/);return `<li id="source-${m[1]}" value="${m[1]}"><p>${linkify(m[2])}${citeCounts[m[1]]?` <a class="source-back" href="#cite-${m[1]}-1">${ui.backToCitation}</a>`:''}</p></li>`}).join('')}</ol>`;
  toc.push({id:'sources',text:ui.sources});
  bodyHTML+=addHeadingIds(marked.parse(ending));
}
bodyHTML=bodyHTML.replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
const sourceList=e=>`<ul class="source-list">${e.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(['來源','Source'].includes(s.title)?`${ui.source} (${new URL(s.url).hostname})`:s.title)}</a></li>`).join('')}</ul>`;
const renderMarkdown=s=>marked.parse(String(s||'').replace(/\[(\d+)\](?!\()/g,(_,n)=>`[${n}](#source-${n})`)).replace(/<a href="#source-(\d+)">/g,(_,n)=>{citeCounts[n]=(citeCounts[n]||0)+1;return `<a id="cite-${n}-${citeCounts[n]}" href="#source-${n}" aria-label="${ui.source} ${n}">`;});
function combinationsHTML(branch){
 const cs=branch.readingCombinations||[];
 if(!cs.length)return '';
 const list=items=>`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
 return `<section class="reading-combinations"><h3>Conditional reading combinations</h3>${renderMarkdown(branch.readingCombinationsNote)}${cs.map(c=>{
 if(c.status!=='conditional_case_reading'||c.elements.length<2||c.elements.length>4)throw Error('Invalid reading combination');
 if(c.eventIds.some(id=>!eventIDs.has(id))||c.branchIds.some(id=>!data.branches.some(b=>b.id===id)))throw Error('Invalid combination mapping');
 return `<details class="reading-combination" id="combination-${esc(c.id)}"><summary id="summary-combination-${esc(c.id)}">${esc(c.title)}</summary><p class="label">Conditional case reading</p><p>${esc(c.scope)}</p><h4>Elements read together</h4>${list(c.elements)}<h4>Documented material</h4><p>${esc(c.record)}</p><h4>Possible readings</h4>${list(c.possibleReadings)}<h4>Conditions still needed</h4>${list(c.missingConditions)}<h4>Evidence limit</h4><p>${esc(c.evidenceLimit)}</p><h4>Explanatory work</h4><p>${esc(c.explanationWork.observed)}</p><p>${esc(c.explanationWork.toExamine)}</p><div>Sources: ${renderMarkdown(c.sourceRefs.map(n=>`[${n}]`).join(' '))}</div><div>Concept definitions: ${renderMarkdown(c.conceptRefs.map(n=>`[${n}]`).join(' '))}</div><p>Related reading branches: ${c.branchIds.map(id=>`<a href="#branch-${esc(id)}">${esc(data.branches.find(b=>b.id===id).title)}</a>`).join('; ')}</p></details>`;
 }).join('')}</section>`;
}
function branchHTML(branch){
  const subset=branch.eventIds.map(id=>data.events.find(e=>e.id===id));
  const counterpoints=branch.counterpoints||branch.caveats||[];
  const counterpointHTML=(Array.isArray(counterpoints)?counterpoints:[counterpoints]).filter(Boolean).map(p=>`<div class="branch-counterpoint"><span class="label">${ui.counterEvidence}</span>${renderMarkdown(p)}</div>`).join('');
  const eventHTML=subset.map(e=>`<li><div class="event-topline"><time datetime="${esc(e.date)}">${esc(e.dateLabel)}</time><span class="status">${esc(ui.statusLabels[e.status])}</span></div><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p>${e.analysis?`<p class="analysis-note">${ui.analysis}${ui.colon}${esc(e.analysis)}</p>`:''}${e.caveat?`<p class="analysis-note">${esc(e.caveat)}</p>`:''}${sourceList(e)}</li>`).join('');
  const body=branch.body||branch.text||branch.summary||'';
  return `<details class="reading-branch" id="branch-${esc(branch.id)}" data-branch="${esc(branch.id)}"><summary id="summary-${esc(branch.id)}"><span role="heading" aria-level="2">${esc(branch.title)}</span></summary><div class="branch-content">${body?`<div class="branch-reading">${renderMarkdown(body)}</div>`:''}${counterpointHTML}${combinationsHTML(branch)}${subset.length?`<div class="js-only"><div class="branch-chart-scroll"><div class="branch-chart"></div></div><p class="branch-hint">${ui.eventHint}</p><div class="branch-event-detail" id="branch-event-${esc(branch.id)}" role="region"></div><p class="branch-hint">${ui.legendHint}</p></div><details class="branch-sources"><summary id="summary-events-${esc(branch.id)}">${ui.eventList} (${subset.length} ${ui.eventUnit})</summary><ol class="branch-event-list">${eventHTML}</ol></details>`:''}</div></details>`;
}
for(const branch of data.branches)bodyHTML=bodyHTML.replace(`<p>BRANCHTOKEN${branch.id}</p>`,branchHTML(branch));
for(const n of Object.keys(citeCounts)){
  const pattern=new RegExp(`(id="source-${n}"[^>]*><p>)([\\s\\S]*?)(</p>)`);
  bodyHTML=bodyHTML.replace(pattern,(_,start,content,end)=>start+content+(content.includes('class="source-back"')?'':` <a class="source-back" href="#cite-${n}-1">${ui.backToCitation}</a>`)+end);
}
if(/BRANCHTOKEN/.test(bodyHTML))throw Error('Unresolved manuscript branch marker');
const css=await fs.readFile(path.join(root,'../../src/styles/public-surface-case-2026-10-04.css'),'utf8'),app=await fs.readFile(path.join(assetDir,'branch-app.js'),'utf8'),d3=await fs.readFile(path.join(assetDir,'d3.v7.9.0.min.js'),'utf8'),license=await fs.readFile(path.join(assetDir,'D3-LICENSE'),'utf8');
const dataJSON=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const html=`<!doctype html>
<html lang="${locale}" class="case-2026-10-04"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer"><meta name="description" content="${esc(subtitle||title)}"><title>${esc(title)} | ${ui.pageKind}</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2311100d'/%3E%3Cpath d='M5 8h22M5 16h22M5 24h22' stroke='%23332f28' stroke-width='2'/%3E%3Ccircle cx='11' cy='8' r='3' fill='%23d6b16f'/%3E%3Ccircle cx='22' cy='16' r='3' fill='%23f0d9a8'/%3E%3Ccircle cx='17' cy='24' r='3' fill='%23d6b16f'/%3E%3C/svg%3E"><style>${css}</style></head>
<body><a class="skip" href="#article">${ui.skip}</a><main>
<header class="case-head"><p class="kicker">${ui.kicker}</p><h1>${esc(title)}</h1>${subtitle?`<p class="subtitle">${esc(subtitle)}</p>`:''}<div class="meta"><span>${esc(meta)}</span></div></header>
<nav class="section-nav" aria-label="${ui.navigation}"><a href="#article">${ui.read}</a><a href="#sources">${ui.sources}</a></nav>
<p class="reading-intro">${ui.readingIntro}</p>
<div class="read-layout"><article class="article" id="article" aria-label="${ui.article}">${bodyHTML}</article></div>
<div id="event-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>

</main><script id="case-data" type="application/json">${dataJSON}</script><script>/* D3 v7.9.0. Vendored locally; no network dependency.\n${license.replace(/\*\//g,'* /')}\n*/\n${d3}</script><script>${app}</script></body></html>`;
await fs.writeFile(output,html);
await fs.writeFile(path.join(dataDir,'rendered-body.en.html'),bodyHTML);
await fs.writeFile(path.join(dataDir,'metadata.en.json'),JSON.stringify({title,subtitle,meta},null,2)+'\n');
await fs.writeFile(path.join(dataDir,'payload.en.json'),JSON.stringify(data,null,2)+'\n');
await fs.writeFile(path.join(root,locale==='en'?'build-report.en.json':'build-report.json'),JSON.stringify({title,locale,articleFile,eventFile,branchFile,output,events:data.events.length,branches:data.branches.length,articleSections:toc.length,d3:'7.9.0',offlineSelfContained:true,deploy:false,referenceCommit:'c40f8c4a51637338b6d54144e2017909cab136fe'},null,2));
console.log(`Built ${output} (${Buffer.byteLength(html)} bytes; ${data.events.length} events; ${data.branches.length} reading branches)`);

const hashFiles=["article.en.md", "branches.en.json", "events.en.json", "rendered-body.en.html", "metadata.en.json", "payload.en.json"];
const sourceHashes={};
for(const file of hashFiles)sourceHashes[file]=createHash("sha256").update(await fs.readFile(path.join(dataDir,file))).digest("hex");
await fs.writeFile(path.join(dataDir,"source-hashes.json"),JSON.stringify(sourceHashes,null,2)+"\n");
