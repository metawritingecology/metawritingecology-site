const zh={
  pageKind:'公共事件切片',draft:'中文討論稿',source:'來源',sources:'查核與來源',backToCitation:'回到引文',counterEvidence:'反證與邊界',analysis:'分析',
  eventHint:'事件僅按日期排列，不表示因果。點選節點查看來源；上下錯開只為避免重疊。',
  legendHint:'實心圓＝已核實；菱形＝當事方說法；方形＝分析；虛線三角＝未定。只記年／月的事件以時段中點定位。',
  eventList:'逐則閱讀事件與來源',eventUnit:'則',skip:'跳至全文',kicker:'PUBLIC SURFACE CASE · 公共事件切片',navigation:'頁面導覽',read:'閱讀全文',article:'中文全文',
  readingIntro:'沿著論述往下讀；文中的延伸節點可點開，查看相關事件、來源與反證。',unpublished:'中文討論稿 · 未公開發布',footer:'來源可核對，分析可修正',
  chartLabel:'此延伸節點的事件日期；不表示因果',chartTitle:'延伸事件切片',chartDescription:'節點只按日期排列，不表示因果。Tab 選取後按 Enter 查看來源，左右方向鍵切換事件。',
  statusLabels:{'已核實':'已核實','當事方說法':'當事方說法','分析':'分析','未定':'未定'},comma:'，',colon:'：',semicolon:'；'
};
const en={
  pageKind:'Public Surface Case',draft:'Discussion draft',source:'Source',sources:'Sources and verification',backToCitation:'Back to citation',counterEvidence:'Counter-evidence and limits',analysis:'Analysis',
  eventHint:'Events are arranged by date, not as a causal sequence. Select a point to inspect its sources. Vertical offsets only prevent overlap. Group membership and shared display are authored selections, not proof of causation or coordinated action.',
  legendHint:'“Documented record” identifies the cited documentary record; it does not certify adjacent analysis. Filled circle: documented record; diamond: attributed account; square: analysis; dashed triangle: unresolved. Events dated only to a year or month are positioned at that period’s midpoint.',
  eventList:'Read the events and sources',eventUnit:'events',skip:'Skip to full text',kicker:'PUBLIC SURFACE CASE',navigation:'Page navigation',read:'Read the essay',article:'Full essay',
  readingIntro:'Follow the main argument. Open the in-text branches for related events, sources and counter-evidence.',unpublished:'',footer:'',
  chartLabel:'Dates of related events; the arrangement does not indicate causation',chartTitle:'Related events',chartDescription:'Points are arranged by date, not causation. Use Tab to select a point, Enter to inspect its sources, and the left and right arrow keys to move between events.',
  statusLabels:{'已核實':'Documented record','當事方說法':'Attributed account','分析':'Analysis','未定':'Unresolved'},comma:', ',colon:': ',semicolon:'; '
};
export function uiFor(locale){return locale==='en'?en:zh;}
