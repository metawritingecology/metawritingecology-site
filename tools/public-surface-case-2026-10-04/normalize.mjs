export const DEFAULT_LANES=[{id:'public-health',label:'公共衛生'},{id:'harm-reduction',label:'減害'},{id:'rights',label:'人權與同志'},{id:'controversy-2026',label:'2026 爭議'}];
export const STATUSES=['已核實','當事方說法','分析','未定'];
const statusAlias={verified:'已核實',claim:'當事方說法',analysis:'分析',uncertain:'未定',pending:'未定'};
export function dateInfo(raw){
  const value=String(raw??'');
  if(!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value))throw Error(`Invalid event date: ${value}`);
  const bits=value.split('-').map(Number),[year,month=7,day=15]=bits;
  const date=new Date(Date.UTC(year,month-1,bits.length===1?1:day));
  if(month<1||month>12||day<1||day>31||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1)throw Error(`Invalid event date: ${value}`);
  return {date:date.toISOString(),year,precision:bits.length===1?'year':bits.length===2?'month':'day',dateLabel:bits.length===1?`${year} 年`:bits.length===2?`${year} 年 ${month} 月`:`${year} 年 ${month} 月 ${day} 日`};
}
export function safeUrl(raw){const u=new URL(raw);if(!['https:','http:'].includes(u.protocol))throw Error('Only HTTP(S) source links are allowed');return u.href;}
export function normalize(raw,{locale='zh-Hant'}={}){
  const obj=Array.isArray(raw)?{events:raw}:raw;
  if(!obj||!Array.isArray(obj.events)||!obj.events.length)throw Error('Refusing to build an empty event preview');
  const lanes=obj.lanes||DEFAULT_LANES;
  if(new Set(lanes.map(l=>l.id)).size!==lanes.length)throw Error('Duplicate lane ID');
  const laneIDs=new Set(lanes.map(l=>l.id));const ids=new Set();
  const events=obj.events.map((e,i)=>{
    const id=e.id||`event-${i+1}`;if(ids.has(id))throw Error(`Duplicate event ID: ${id}`);ids.add(id);
    const d=dateInfo(e.date);const eventLanes=e.lanes||[e.lane];
    if(!eventLanes.length||eventLanes.some(l=>!laneIDs.has(l)))throw Error(`Unknown event lane for ${id}: ${eventLanes}`);
    const status=statusAlias[e.status]||e.status;if(!STATUSES.includes(status))throw Error(`Unknown evidence status for ${id}: ${status}`);
    if(!e.title||!e.summary)throw Error(`Missing event title/summary for ${id}`);
    if(!Array.isArray(e.sources)||!e.sources.length)throw Error(`Missing sources for ${id}`);
    const sources=e.sources.map(s=>({title:s.title||s.label||s.url,url:safeUrl(s.url)}));
    const localDate=locale==='en'?(d.precision==='year'?String(d.year):new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'long',...(d.precision==='day'?{day:'numeric'}:{}),timeZone:'UTC'}).format(new Date(d.date))):d.dateLabel;
    return {...e,id,lanes:eventLanes,status,sources,sortDate:d.date,year:d.year,precision:d.precision,dateLabel:e.dateLabel||localDate};
  }).sort((a,b)=>a.sortDate.localeCompare(b.sortDate));
  return {...obj,lanes,events};
}
