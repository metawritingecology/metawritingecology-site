(()=>{
'use strict';
const data=JSON.parse(document.getElementById('case-data').textContent),d3=window.d3;
if(!d3)return;
const ui=data.ui,statusLabel=s=>ui.statusLabels[s]||s;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const events=new Map(data.events.map(e=>[e.id,e]));
const shapeNames={'已核實':'circle','當事方說法':'diamond','分析':'square','未定':'triangle'};
const el=(name,text,cls)=>{const e=document.createElement(name);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
function shapePath(kind,r=6){if(kind==='diamond')return `M0,${-r-2} L${r+2},0 L0,${r+2} L${-r-2},0 Z`;if(kind==='square')return `M${-r},${-r} H${r} V${r} H${-r} Z`;if(kind==='triangle')return `M0,${-r-2} L${r+2},${r} L${-r-2},${r} Z`;return `M${r},0 A${r},${r} 0 1,1 ${-r},0 A${r},${r} 0 1,1 ${r},0`;}
function showEvent(branch,event,announce=false){
  const panel=branch.querySelector('.branch-event-detail');
  if(!panel||!event)return;
  const top=el('div',undefined,'event-topline');top.append(el('time',event.dateLabel),el('span',statusLabel(event.status),'status'));top.querySelector('time').dateTime=event.date;
  const title=el('h3',event.title),summary=el('p',event.summary),sources=el('ul',undefined,'source-list');title.id=`selected-${branch.dataset.branch}`;
  for(const source of event.sources){const li=el('li'),a=el('a',['來源','Source'].includes(source.title)?`${ui.source} (${new URL(source.url).hostname})`:source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);sources.append(li);}
  const content=[top,title,summary];
  if(event.analysis)content.push(el('p',`${ui.analysis}${ui.colon}${event.analysis}`,'analysis-note'));
  if(event.caveat)content.push(el('p',event.caveat,'analysis-note'));
  content.push(sources);panel.replaceChildren(...content);panel.setAttribute('aria-labelledby',title.id);
  d3.select(branch).selectAll('.event-node').attr('aria-pressed',d=>String(d.event.id===event.id));
  branch.dataset.selectedEvent=event.id;
  if(announce)$('#event-announcer').textContent=`${event.dateLabel}${ui.comma}${event.title}${ui.comma}${statusLabel(event.status)}`;
}
function renderBranch(branch){
  if(!branch.open)return;
  const model=data.branches.find(b=>b.id===branch.dataset.branch);
  if(!model)return;
  const subset=model.eventIds.map(id=>events.get(id)).filter(Boolean).sort((a,b)=>a.sortDate.localeCompare(b.sortDate));
  const chart=branch.querySelector('.branch-chart');
  if(!chart||!subset.length)return;
  const width=Math.max(340,Math.floor(chart.parentElement.clientWidth)),margin={left:28,right:28,top:30,bottom:25};
  let domain=d3.extent(subset.map(e=>new Date(e.sortDate)));let span=+domain[1]- +domain[0];
  const padding=Math.max(span*.06,86400000*20);domain=[new Date(+domain[0]-padding),new Date(+domain[1]+padding)];
  const x=d3.scaleUtc().domain(domain).range([margin.left,width-margin.right]);
  const last=[];const plotted=subset.map(event=>{const px=x(new Date(event.sortDate));let slot=0;while(last[slot]!==undefined&&px-last[slot]<35)slot++;last[slot]=px;return {event,x:px,slot};});
  const height=margin.top+Math.max(1,last.length)*30+margin.bottom+23;const baseY=height-margin.bottom-20;
  plotted.forEach(p=>p.y=baseY-p.slot*30);
  d3.select(chart).selectAll('*').remove();
  const svg=d3.select(chart).append('svg').attr('class','branch-svg').attr('width',width).attr('height',height).attr('viewBox',`0 0 ${width} ${height}`).attr('role','group').attr('aria-label',ui.chartLabel);
  svg.append('title').text(ui.chartTitle);
  svg.append('desc').text(ui.chartDescription);
  const sameYear=subset.every(e=>e.year===subset[0].year);
  const axis=d3.axisBottom(x).ticks(Math.max(3,Math.floor(width/100))).tickFormat(sameYear?d3.utcFormat('%m/%d'):d3.utcFormat('%Y')).tickSize(4);
  svg.append('g').attr('class','branch-axis').attr('transform',`translate(0,${baseY+18})`).call(axis);
  const nodes=svg.append('g').selectAll('g').data(plotted).join('g').attr('class','event-node').attr('role','button').attr('tabindex',0).attr('data-event-id',d=>d.event.id).attr('aria-label',d=>`${d.event.dateLabel}${ui.colon}${d.event.title}${ui.semicolon}${statusLabel(d.event.status)}`).attr('aria-controls',`branch-event-${model.id}`).attr('transform',d=>`translate(${d.x},${d.y})`).on('click',(_,d)=>showEvent(branch,d.event,true)).on('keydown',(ev,d)=>{
    if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();showEvent(branch,d.event,true);}
    if(['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)){ev.preventDefault();const i=subset.indexOf(d.event);const next=ev.key==='Home'?0:ev.key==='End'?subset.length-1:Math.max(0,Math.min(subset.length-1,i+(ev.key==='ArrowRight'?1:-1)));showEvent(branch,subset[next],true);branch.querySelector(`[data-event-id="${CSS.escape(subset[next].id)}"]`)?.focus();}
  });
  nodes.append('line').attr('class','stem').attr('y2',d=>baseY-d.y);
  nodes.append('circle').attr('class','hit-area').attr('r',16);
  nodes.append('circle').attr('class','selection-halo').attr('r',12);
  nodes.append('path').attr('class','node-mark').attr('d',d=>shapePath(shapeNames[d.event.status])).attr('fill',d=>d.event.status==='已核實'?'var(--link)':d.event.status==='分析'?'var(--raised)':'var(--deep)').attr('stroke-dasharray',d=>d.event.status==='未定'?'2 2':null);
  nodes.append('title').text(d=>`${d.event.dateLabel}｜${d.event.title}`);
  showEvent(branch,subset.find(e=>e.id===branch.dataset.selectedEvent)||subset[0]);
}
$$('.reading-branch').forEach(branch=>branch.addEventListener('toggle',()=>renderBranch(branch)));
let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>$$('.reading-branch[open]').forEach(renderBranch),120)});
// Print expansion is temporary, including repeated beforeprint events and
// cancelled dialogs. Capture once per print cycle and restore after it ends.
let printDisclosureState=null;
window.addEventListener('beforeprint',()=>{
  if(!printDisclosureState)printDisclosureState=new Map($$('.reading-branch, .branch-sources, .reading-combination').map(detail=>[detail,detail.open]));
  for(const detail of printDisclosureState.keys())detail.open=true;
});
window.addEventListener('afterprint',()=>{
  if(!printDisclosureState)return;
  for(const [detail,wasOpen] of printDisclosureState)detail.open=wasOpen;
  printDisclosureState=null;
});
function revealHash(){
  const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const target=document.getElementById(id);if(!target)return;
  let ancestor=target.closest('details');while(ancestor){ancestor.open=true;ancestor=ancestor.parentElement?.closest('details');}
  if(typeof target.scrollIntoView==='function')requestAnimationFrame(()=>target.scrollIntoView({block:'center'}));
}
window.addEventListener('hashchange',revealHash);
document.documentElement.classList.add('js-ready');revealHash();
})();
