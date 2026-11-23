import {readFinancialWindow} from './astrology-core.js';
import {priceRiskAt,studyHistoricalCrashes} from './market-crash-research.js';
import {
  MARKET_PRICE_SOURCE,OFFICIAL_CSV_LINKS,parseMarketCSV,validatePriceRows,backtestMarketDirection
} from './market-history.js';

const KEY='koyomi-financial-market-prices-v1-';
const datasets=new Map();
const get=id=>document.getElementById(id);
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=String(text);return e;};
function selectedMarket(){return get('marketInstrument').value||'nikkei';}
function sourceLink(){
  const market=selectedMarket(),auto=get('historyAuto'),link=get('historyCSVLink');
  auto.hidden=market!=='nasdaq';
  link.href=OFFICIAL_CSV_LINKS[market];
  const hints={nikkei:'日経平均（権利に配慮して端末内のみで読み込む）',
    nasdaq:'NASDAQ100',usdjpy:'ドル／円',gold:'金価格（FRED系列は2022年で終了）'};
  link.textContent=hints[market]+'のFRED終値CSVを取得';
}
function drawPriceCurve(rows){
  const host=get('historyPriceCurve');host.replaceChildren();
  const recent=rows.slice(-35),ns='http://www.w3.org/2000/svg';
  if(recent.length<2)return;
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 600 135');svg.setAttribute('aria-hidden','true');
  const values=recent.map(x=>x.close),low=Math.min(...values),high=Math.max(...values);
  const x=i=>12+i*576/(recent.length-1),y=v=>112-(v-low)/Math.max(high-low,1e-9)*91;
  const path=document.createElementNS(ns,'polyline');
  path.setAttribute('points',recent.map((r,i)=>x(i)+','+y(r.close)).join(' '));
  path.setAttribute('fill','none');path.setAttribute('stroke','#edcb90');
  path.setAttribute('stroke-width','2.7');svg.append(path);
  host.append(svg);host.setAttribute('aria-label','収録された直近'+recent.length+'取引日の終値。'+recent[0].date+'から'+recent.at(-1).date);
}
function showDataset(){
  const market=selectedMarket(),data=datasets.get(market);
  get('historyStatistics').hidden=true;
  get('historyResult').hidden=!data;
  if(!data){showMarketRisk();return;}
  const rows=data.rows,first=rows[0],last=rows.at(-1);
  get('historyLatest').textContent=last.close.toLocaleString('ja-JP',{maximumFractionDigits:4});
  const prev=rows.at(-2),daily=prev?(last.close/prev.close-1)*100:null;
  get('historyLatestDate').textContent=last.date+(daily===null?'':' ／ 前回比 '+(daily>0?'+':'')+daily.toFixed(2)+'%');
  get('historyRange').textContent=first.date.slice(0,7)+' ～ '+last.date.slice(0,7);
  get('historyRows').textContent=rows.length.toLocaleString('ja-JP')+'営業日分';
  get('historySource').textContent='取得元：'+data.source;
  drawPriceCurve(rows);
  get('historyStatus').textContent='終値データを読み込みました。期間を選んで「過去検証を実行」を押してください。';
  showMarketRisk();
}
function showMarketRisk(){
  const market=selectedMarket(),data=datasets.get(market);
  const date=get('astroDate').value;
  const tag=get('marketRiskTag'),reason=get('marketRiskText'),verdict=get('marketRiskVerdict');
  const star=get('marketDirection').dataset.direction;
  if(!data){
    tag.textContent='価格未取得';tag.dataset.level='unavailable';
    reason.textContent='相場終値を読み込むと、既に起こった価格の下落を独立して判定できます。';
    verdict.textContent='価格データがないため、占星術の結果を補正していません。';
    return;
  }
  try{
    const risk=priceRiskAt(data.rows,date);
    tag.textContent=risk.label;tag.dataset.level=risk.level;
    reason.textContent=risk.available
      ? '判定の基準日：'+risk.lastDate+'終値 ／ '+risk.reason
      : risk.reason;
    verdict.textContent=!risk.available
      ? '価格による危険度は判定保留。星の判断だけで安全とは言えません。'
      : risk.warning
        ? (star==='up'?'星は上昇占断ですが、実際の価格は急落警戒。売買判断への転用は避けてください。':
          '実際の下落が観測されています。ただし暴落前に予知したことではありません。')
        : '実価格に固定閾値の下落警戒はありません。将来の上昇や安全を保証しません。';
  }catch(error){
    tag.textContent='判定保留';tag.dataset.level='unavailable';
    reason.textContent='価格の条件を確認できません：'+error.message;
    verdict.textContent='実市場の安全性は未確認です。';
  }
}
function updateMarket(){sourceLink();showDataset();showMarketRisk();}
function save(market,rows,source){
  validatePriceRows(rows);
  // The browser keeps only closes and dates; no remote upload or account required.
  const slim=rows.slice(-4200).map(r=>[r.date,r.close]);
  const data={rows:slim.map(([date,close])=>({date,close})),source};
  datasets.set(market,data);
  try{localStorage.setItem(KEY+market,JSON.stringify({rows:slim,source}));}
  catch{get('historyStatus').textContent='表示中ですが、端末の保存容量により次回起動時は再取込が必要です。';}
  showDataset();
}
function restore(){
  for(const market of Object.keys(OFFICIAL_CSV_LINKS)){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY+market)||'null');
      if(!raw||!Array.isArray(raw.rows)||raw.rows.length<2)continue;
      const rows=raw.rows.map(([date,close])=>({date,close}));
      validatePriceRows(rows);
      datasets.set(market,{rows,source:String(raw.source||'端末保存')});
    }catch{}
  }
  updateMarket();
}
function showCrashResults(data){
  const section=get('historyCrashes'),host=get('historyCrashList');
  host.replaceChildren();
  const events=data?.events||[];
  section.hidden=!events.length;
  for(const item of events){
    if(item.status!=='evaluated'){
      const box=node('article','');box.className='crash-case';
      box.append(node('h4',item.title),node('p','対象期間の終値データが不足しています。未検証です。'));
      host.append(box);continue;
    }
    const box=node('article','');box.className='crash-case';
    box.append(node('h4',item.title),
      node('p','この期間の最大下落 '+item.observedDrawdownPct.toFixed(1)+'% ／ 14日以内8%以上下落 '+item.crashCases+'件 ／ 評価日 '+item.n+'件'),
      node('p','星の「下落」判定：下落例の捕捉 '+(item.astro.recall===null?'–':item.astro.recall.toFixed(1)+'%')+
        '、非暴落時の誤警戒 '+item.astro.falseAlerts+'件'),
      node('p','実価格の下落警戒：下落例の捕捉 '+(item.priceGuard.recall===null?'–':item.priceGuard.recall.toFixed(1)+'%')+
        '、非暴落時の誤警戒 '+item.priceGuard.falseAlerts+'件'));
    if(item.checkpoint){
      box.append(node('p','暴落前後の基準日 '+item.checkpoint.date+'：星 '+item.checkpoint.astro+
        ' ／ 価格 '+item.checkpoint.priceRisk+' ／ 次の14日間の最大下落 '+item.checkpoint.futureWorstPct.toFixed(1)+'%'));
    }
    host.append(box);
  }
}
function showBacktest(result){
  get('historyStatistics').hidden=false;
  showCrashResults(result.crises);
  get('historyAccuracy').textContent=result.modelAccuracy===null?'算出不可':result.modelAccuracy.toFixed(1)+'%';
  get('historyBaseline').textContent=result.baselineAccuracy===null?'算出不可':result.baselineAccuracy.toFixed(1)+'%';
  get('historyCount').textContent=result.evaluated+'件';
  get('historyInterpretation').textContent=result.testStatus==='insufficient'
    ? '判定数が30件未満のため、的中率は参考値です。'
    : (result.differencePoints>0
      ? 'この履歴では常時上昇予想を'+result.differencePoints.toFixed(1)+'ポイント上回りました。ただし将来の的中を保証しません。'
      : 'この履歴では常時上昇予想を上回っていません。占いの有効性は確認できません。')+
      ' ／ 中立・変化なし：'+result.neutralOrFlat+'件。売買手数料・リスクを含みません。';
  const host=get('historyExamples');host.replaceChildren();
  for(const entry of result.cases.slice(-12).reverse()){
    const p=node('p',entry.start+' → '+entry.end+'：占断'+(entry.prediction==='up'?'上昇':'下落')+
      ' ／ 実際'+(entry.returnPct>0?'+':'')+entry.returnPct.toFixed(2)+'%　'+(entry.correct?'的中':'不一致'));
    host.append(p);
  }
}
async function loadOnline(){
  const market=selectedMarket(),source=MARKET_PRICE_SOURCE[market];
  if(!source)return;
  const button=get('historyAuto');button.disabled=true;
  get('historyStatus').textContent='公開されているNASDAQ100の終値CSVを取得しています…';
  try{
    const response=await fetch(source.url,{cache:'no-store'});
    if(!response.ok)throw new Error('取得先がHTTP '+response.status+'を返しました。');
    const text=await response.text();
    const prices=parseMarketCSV(text);
    save(market,prices,source.attribution);
  }catch(e){get('historyStatus').textContent='オンライン取得できません：'+e.message+'。FREDのCSV取込をお試しください。';}
  finally{button.disabled=false;}
}
async function loadFile(){
  const market=selectedMarket(),file=get('historyFile').files?.[0];
  if(!file)return;
  try{
    if(file.size>3500000)throw new Error('CSVの上限は3.5MBです。');
    const prices=parseMarketCSV(await file.text());
    save(market,prices,'端末のCSV：'+file.name);
  }catch(e){get('historyStatus').textContent='取込エラー：'+e.message;}
  finally{get('historyFile').value='';}
}
function evaluateOffThread(prices,market,horizon){
  const fallback=()=>{
    const readWindow=(date,days)=>readFinancialWindow(date,window.Astronomy,days);
    return {
      ...backtestMarketDirection({prices,market,horizon,readWindow}),
      crises:studyHistoricalCrashes({prices,market,readWindow,horizon:14})
    };
  };
  if(typeof Worker==='undefined')return Promise.resolve(fallback());
  return new Promise((resolve,reject)=>{
    let worker;
    try{worker=new Worker(new URL('./market-history-worker.js',import.meta.url),{type:'module'});}
    catch{resolve(fallback());return;}
    const stop=()=>{clearTimeout(limit);worker.terminate();};
    const limit=setTimeout(()=>{stop();reject(new Error('検証処理が長時間続いたため中断しました。'));},120000);
    worker.onmessage=e=>{
      if(e.data?.requestId!==1)return;
      stop();
      if(e.data.ok)resolve(e.data.result);
      else reject(new Error(e.data?.error||'計算に失敗しました。'));
    };
    worker.onerror=()=>{stop();reject(new Error('バックグラウンドの天文計算を開始できませんでした。'));};
    worker.postMessage({requestId:1,prices,market,horizon});
  });
}
async function runHistoricalValidation(){
  const market=selectedMarket(),data=datasets.get(market),horizon=Number(get('marketHorizon').value);
  if(!data){get('historyStatus').textContent='先に終値CSVを取り込んでください。';return;}
  const button=get('historyRun');button.disabled=true;button.textContent='実際の相場と照合中…';
  get('historyStatus').textContent='過去の天体位置から占断を再計算しています…';
  try{
    // Yield a frame before CPU-bound offline ephemeris evaluation.
    await new Promise(resolve=>setTimeout(resolve,30));
    const result=await evaluateOffThread(data.rows,market,horizon);
    if(selectedMarket()!==market||Number(get('marketHorizon').value)!==horizon)return;
    showBacktest(result);
    get('historyStatus').textContent='検証完了：'+result.sourceStart+' ～ '+result.sourceEnd+' ／ '+horizon+'暦日判定。';
  }catch(e){get('historyStatistics').hidden=true;get('historyStatus').textContent='検証エラー：'+e.message;}
  finally{button.disabled=false;button.textContent='この市場の過去検証を実行';}
}
function setup(){
  get('marketInstrument').addEventListener('change',updateMarket);
  get('astroDate').addEventListener('change',showMarketRisk);
  for(const id of ['astroPrev','astroNext','astroToday'])get(id).addEventListener('click',showMarketRisk);
  get('marketHorizon').addEventListener('change',()=>{get('historyStatistics').hidden=true;});
  get('historyAuto').addEventListener('click',loadOnline);
  get('historyFile').addEventListener('change',loadFile);
  get('historyRun').addEventListener('click',runHistoricalValidation);
  restore();
}
if(typeof document!=='undefined')setup();
