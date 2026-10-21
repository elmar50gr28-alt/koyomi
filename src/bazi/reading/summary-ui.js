const ELEMENTS={wood:'木',fire:'火',earth:'土',metal:'金',water:'水'};
const unique=values=>[...new Set((values||[]).filter(value=>Object.hasOwn(ELEMENTS,value)))];

// Use the same adapted facts as the detailed reading; never recompute a chart here.
export function renderBaziCalculationSummary(document,summary){
 if(!summary)return;
 const put=(id,text)=>{const node=document.getElementById(id);if(node)node.textContent=text};
 const favorable=unique(summary.favorable),avoid=unique(summary.avoid),primary=favorable[0];
 const useful=primary?`用神候補 ${ELEMENTS[primary]}`:'用神候補は判定保留';
 const secondary=favorable.slice(1).map(value=>ELEMENTS[value]).join('・')||'特定なし';
 const caution=avoid.map(value=>ELEMENTS[value]).join('・')||'特定なし';
 const strength=summary.strengthLabel||'判定保留';
 put('metricDayMaster',summary.dayMaster||'判定保留');
 put('metricDayMasterNote',`${strength} / 日柱 ${summary.dayPillar||'判定保留'}${summary.timeUnknown?' / 出生時刻不明':''}`);
 put('metricUseful',useful);
 put('metricUsefulNote',`補助候補 ${secondary} / 注意する五行 ${caution}`);
 const rows=document.getElementById('shichuDetails')?.querySelectorAll('.kv')||[];
 for(const row of rows){
  const label=row.querySelector('b')?.textContent;
  if(label==='出生時刻補正'&&summary.timeUnknown){
   const heading=document.createElement('b');heading.textContent=label;
   row.replaceChildren(heading,document.createTextNode('出生時刻不明のため、補正後の時刻は表示しません'));
  }
  if(label==='日主強弱'||label==='用神・喜神'||label==='用神・補助候補'){
   const heading=document.createElement('b');heading.textContent=label==='日主強弱'?'日主強弱':'用神・補助候補';
   row.replaceChildren(heading,document.createTextNode(label==='日主強弱'?`${strength}${summary.timeUnknown?'（出生時刻不明）':''}`:`${useful} / 補助候補 ${secondary}`));
  }
 }
 const bars=document.getElementById('elementBars');
 if(bars){
  const values=Object.keys(ELEMENTS).map(element=>{const value=summary.elementBalance?.find(item=>item.element===element)?.value;return{element,value:typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null}});
  const max=Math.max(0,...values.map(item=>item.value||0));
  bars.replaceChildren(...values.map(({element,value})=>{
   const row=document.createElement('div');row.className='bar-row';
   const label=document.createElement('span');label.textContent=ELEMENTS[element];
   const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('i');fill.style.width=`${max&&value!==null?value/max*100:0}%`;bar.append(fill);
   const number=document.createElement('b');number.textContent=value===null?'—':value.toFixed(1);row.append(label,bar,number);return row;
  }));
 }
}
