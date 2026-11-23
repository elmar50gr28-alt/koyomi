import {readFinancialSky, readFinancialWindow, localDateKey} from './astrology-core.js';

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function byId(id) { return document.getElementById(id); }
function fromInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('日付を確認してください。');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month-1, day, 12);
  if (!Number.isFinite(date.getTime()) || localDateKey(date) !== value) throw new RangeError('実在する日付を選んでください。');
  return date;
}
function fillAspects(aspects) {
  const list = byId('astroAspects');
  list.replaceChildren();
  if (!aspects.length) {
    list.append(el('p','主要なアスペクトは本日の判定範囲では見つかりませんでした。','empty'));
    return;
  }
  aspects.slice(0,4).forEach(item => {
    const box = el('article',undefined,'aspect');
    box.append(
      el('strong',item.label + ' · ' + item.aspect),
      el('span',item.meaning + '。'),
      el('small','象徴：'+item.topic+' ／ 角度のずれ '+item.orb.toFixed(2)+'°')
    );
    list.append(box);
  });
}
function drawCurve(days) {
  const host=byId('astroCurve');
  host.replaceChildren();
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 600 175');
  svg.setAttribute('aria-hidden','true');
  const max=Math.max(1,...days.map(day=>day.tightAspectCount));
  const x=index=>32+index*536/Math.max(days.length-1,1);
  const y=value=>137-value/max*100;
  const shape=(tag,attributes,text)=>{
    const node=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    if(text!==undefined)node.textContent=text;
    svg.append(node);return node;
  };
  for(let n=0;n<=max;n++){
    if(max>6 && n!==0 && n!==max)continue;
    const yy=y(n);
    shape('line',{x1:30,y1:yy,x2:572,y2:yy,stroke:'#45566a','stroke-width':1});
    shape('text',{x:7,y:yy+4,fill:'#d2d9db','font-size':12},String(n));
  }
  shape('polyline',{points:days.map((day,index)=>x(index)+','+y(day.tightAspectCount)).join(' '),
    fill:'none',stroke:'#f0ce86','stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round'});
  days.forEach((day,index)=>{
    shape('circle',{cx:x(index),cy:y(day.tightAspectCount),r:3.5,fill:'#f8deab'});
  });
  shape('text',{x:31,y:164,fill:'#d5dade','font-size':12},days[0].date.slice(5));
  shape('text',{x:563,y:164,'text-anchor':'end',fill:'#d5dade','font-size':12},days.at(-1).date.slice(5));
  host.append(svg);
  host.setAttribute('aria-label','アスペクト密度：'+days.map(day=>day.date+' '+day.tightAspectCount+'件').join('、'));
}
function fillWindow(days) {
  drawCurve(days);
  const list=byId('astroWindow');
  list.replaceChildren();
  const items=days.filter((day,index)=>index===0 || day.tightAspectCount>=2 || day.phase.label.includes('月付近')).slice(0,5);
  (items.length?items:days.slice(0,3)).forEach(day=>{
    const row=el('div',undefined,'day');
    row.append(el('strong',day.date.slice(5).replace('-','/')),el('span',day.headline),el('em','密度 '+day.tightAspectCount+'件'));
    list.append(row);
  });
}
function renderDate() {
  const status=byId('astroStatus');
  try {
    const day=fromInput(byId('astroDate').value);
    if (day.getFullYear()<1900 || day.getFullYear()>2099) throw new RangeError('1900〜2099年の日付を指定してください。');
    const astronomy=window.Astronomy;
    const result=readFinancialSky(day,astronomy);
    const days=readFinancialWindow(day,astronomy,14);
    byId('astroHeadline').textContent=result.headline;
    byId('astroSummary').textContent=result.overview;
    byId('astroPhase').textContent=result.phase.label;
    byId('astroPhaseTheme').textContent='象徴：'+result.phase.theme+' ／ 太陽と月の黄経差 '+Math.round(result.phase.angle)+'°';
    byId('astroRetrogrades').textContent=result.retrogrades.length
      ? result.retrogrades.map(item=>item.label+'（'+item.theme+'）').join('、')
      : 'この日に逆行と計算された主要惑星はありません。';
    fillAspects(result.aspects);
    fillWindow(days);
    status.textContent=result.date+'の天文計算結果を表示中。';
    byId('astroResult').hidden=false;
  } catch (error) {
    status.textContent='表示できません：'+(error?.message||'日付と計算環境を確認してください。');
    byId('astroResult').hidden=true;
    byId('astroAspects').replaceChildren();
    byId('astroWindow').replaceChildren();
    byId('astroCurve').replaceChildren();
  }
}
function updateDate(offset) {
  try{
    const date=fromInput(byId('astroDate').value);
    date.setDate(date.getDate()+offset);
    const key=localDateKey(date);
    if (key<'1900-01-01'||key>'2099-12-31')return;
    byId('astroDate').value=key;
    renderDate();
  }catch(error){byId('astroStatus').textContent=error.message;}
}
function setup() {
  const tabs=[...document.querySelectorAll('[data-panel]')];
  tabs.forEach(tab=>tab.addEventListener('click',()=>{
    const chosen=tab.dataset.panel;
    tabs.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.panel===chosen)));
    byId('worldPanel').hidden=chosen!=='world';
    byId('personalPanel').hidden=chosen!=='personal';
  }));
  byId('astroDate').value=localDateKey(new Date());
  byId('astroDate').addEventListener('change',renderDate);
  byId('astroPrev').addEventListener('click',()=>updateDate(-1));
  byId('astroNext').addEventListener('click',()=>updateDate(1));
  byId('astroToday').addEventListener('click',()=>{
    byId('astroDate').value=localDateKey(new Date());renderDate();
  });
  renderDate();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(new URL('../../service-worker.js',import.meta.url)).catch(()=>{});
  }
}
if (typeof document !== 'undefined') setup();
