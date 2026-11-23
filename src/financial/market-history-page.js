import {readFinancialWindow} from './astrology-core.js';
import {priceRiskAt,studyHistoricalCrashes} from './market-crash-research.js';
import {forecastLeadMonths} from './market-lead-forecast.js';
import {
  OFFICIAL_CSV_LINKS,parseMarketCSV,validatePriceRows,backtestMarketDirection
} from './market-history.js';
import {
  AUTO_MARKET_SOURCES,AUTO_REFRESH_INTERVAL_MS,
  ageOfLastClose,fetchAutomaticMarket,reconcileMarketHistory
} from './market-auto-import.js';

const KEY='koyomi-financial-market-prices-v1-';
const datasets=new Map();
const autoStates=new Map();
const activeSync=new Map();
const MARKET_NAMES={nikkei:'日経平均',nasdaq:'NASDAQ100',gold:'金先物',usdjpy:'ドル／円'};
const LAST_ATTEMPT_KEY='koyomi-financial-market-attempt-v2-'; // recheck immediately after switching to the fresh Nikkei source
const get=id=>document.getElementById(id);
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=String(text);return e;};
function selectedMarket(){return get('marketInstrument').value||'nikkei';}
function sourceLink(){
  const market=selectedMarket(),auto=get('historyAuto'),link=get('historyCSVLink');
  auto.hidden=false;
  auto.textContent='更新 ↻';
  link.href=OFFICIAL_CSV_LINKS[market];
  const hints={nikkei:'日経平均（権利に配慮して端末内のみで読み込む）',
    nasdaq:'NASDAQ100',usdjpy:'ドル／円',gold:'金価格（FREDのLBMA系列は終了。自動はCOMEX金先物）'};
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
  get('leadResult').hidden=true;
  get('historyResult').hidden=!data;
  if(!data){showMarketRisk();renderAutoStatuses();return;}
  const rows=data.rows,first=rows[0],last=rows.at(-1);
  get('historyLatest').textContent=last.close.toLocaleString('ja-JP',{maximumFractionDigits:4});
  const prev=rows.at(-2),daily=prev?(last.close/prev.close-1)*100:null;
  get('historyLatestDate').textContent=last.date+(daily===null?'':' ／ 前回比 '+(daily>0?'+':'')+daily.toFixed(2)+'%');
  get('historyRange').textContent=first.date.slice(0,7)+' ～ '+last.date.slice(0,7);
  get('historyRows').textContent=rows.length.toLocaleString('ja-JP')+'営業日分';
  const freshness=ageOfLastClose(rows);
  const oldTag=freshness.stale?' ／ 【データが古い：'+freshness.daysOld+'日前】':'';
  get('historySource').textContent='取得元：'+data.source+oldTag;
  drawPriceCurve(rows);
  get('historyStatus').textContent=freshness.stale
    ?'最終収録日は'+freshness.lastDate+'。提供元の更新が遅れているため、現在値として扱いません。'
    :'最終取引日の終値：'+freshness.lastDate+'。休場日は前回の終値を表示します。';
  showMarketRisk();
  renderAutoStatuses();
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
const MARKET_LABELS={
  nikkei:{title:'日経平均',unit:'ポイント',digits:2},
  nasdaq:{title:'NASDAQ100',unit:'ポイント',digits:2},
  usdjpy:{title:'ドル／円',unit:'円 / USD',digits:2},
  gold:{title:'金先物',unit:'USD / oz',digits:2}
};
function renderAutoStatuses(){
  const host=get('marketAutoStatuses');
  host.replaceChildren();
  const selected=selectedMarket();
  for(const market of ['nikkei','nasdaq','usdjpy','gold']){
    const info=autoStates.get(market),cached=datasets.get(market);
    const last=cached?.rows?.at(-1);
    const age=last?ageOfLastClose(cached.rows):null;
    const label=MARKET_LABELS[market];
    const displayName=market==='gold'&&cached?.instrument!=='COMEX-GC'?'金価格':label.title;
    const state=info?.status||'queued';
    const stale=!!(age?.stale||state==='stale');
    const headline=stale?'更新が遅れています':
      state==='checking'?'データ確認中':
      state==='unavailable'||state==='offline'?'保存データを表示':
      last?'直近の公表終値':'データ取得中';
    const card=node('button','');
    card.type='button';card.className='market-price-card';
    card.setAttribute('aria-pressed',String(market===selected));
    card.dataset.status=stale?'stale':state;
    const name=node('span',displayName);name.className='market-price-name';
    const amount=node('strong',last?
      last.close.toLocaleString('ja-JP',{minimumFractionDigits:market==='nikkei'?0:2,maximumFractionDigits:label.digits}):
      '—');amount.className='market-price-value';
    const unit=node('span',label.unit);unit.className='market-price-unit';
    const date=node('span',last?last.date.replaceAll('-','/')+' 終値':'取得待ち');
    date.className='market-price-date';
    const status=node('span',headline);status.className='market-price-status';
    card.append(name,amount,unit,date,status);
    card.addEventListener('click',()=>{
      if(market===selectedMarket())return;
      const select=get('marketInstrument');
      select.value=market;
      if(typeof select.dispatchEvent==='function'&&typeof Event!=='undefined')
        select.dispatchEvent(new Event('change',{bubbles:true}));
      else updateMarket();
      // The selected instrument is also used by historical validation controls.
    });
    host.append(card);
  }
}
function setAutoState(market,status,message=''){
  autoStates.set(market,{status,message});
  renderAutoStatuses();
  if(selectedMarket()===market){
    const existing=datasets.get(market);
    const last=existing?.rows?.at(-1)?.date;
    get('historyAutoStatus').textContent=
      status==='checking'?'最新の公表終値を確認しています…':
      status==='updated'?'更新しました。基準日 '+last:
      status==='stale'?'提供元の更新が遅れています。基準日 '+(last||'不明'):
      status==='offline'?'オフラインです。保存済みの終値を表示しています。':
      status==='unavailable'?'自動取得に失敗しました。保存済みの終値を表示しています。':
      status==='conflict'?'価格系列が一致しないため、既存の終値を保持しました。':
      last?'保存済みの終値：'+last:'価格データはまだ取得できていません。';
  }
}
function updateMarket(){
  sourceLink();showDataset();showMarketRisk();
  renderAutoStatuses();
  const status=autoStates.get(selectedMarket());
  if(status)setAutoState(selectedMarket(),status.status,status.message);
  else renderAutoStatuses();
}
function persistMarket(market,data){
  validatePriceRows(data.rows);
  const rows=data.rows.slice(-15000).map(r=>({date:r.date,close:r.close}));
  const stored={rows,source:String(data.source||'不明な出典'),
    sourceId:data.sourceId||null,instrument:data.instrument||null,
    downloadedAt:data.downloadedAt||null};
  datasets.set(market,stored);
  try{localStorage.setItem(KEY+market,JSON.stringify({
    rows:rows.map(r=>[r.date,r.close]),source:stored.source,sourceId:stored.sourceId,
    instrument:stored.instrument,downloadedAt:stored.downloadedAt
  }));}catch{
    if(selectedMarket()===market)get('historyStatus').textContent=
      '表示は可能ですが、保存容量の制限により次回は再取込が必要です。';
  }
  if(selectedMarket()===market)showDataset();
  else renderAutoStatuses();
}
function save(market,rows,source){
  persistMarket(market,{rows,source,sourceId:'manual-csv',
    instrument:null,downloadedAt:new Date().toISOString()});
}
function restore(){
  for(const market of Object.keys(OFFICIAL_CSV_LINKS)){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY+market)||'null');
      if(!raw||!Array.isArray(raw.rows)||raw.rows.length<2)continue;
      const rows=raw.rows.map(([date,close])=>({date,close}));
      validatePriceRows(rows);
      datasets.set(market,{rows,source:String(raw.source||'端末保存'),
        sourceId:raw.sourceId||null,instrument:raw.instrument||null,
        downloadedAt:raw.downloadedAt||null});
    }catch{}
    autoStates.set(market,{status:'queued',message:''});
  }
  updateMarket();
}
async function refreshMarket(market,{force=false}={}){
  if(activeSync.has(market))return activeSync.get(market);
  if(typeof navigator!=='undefined' && navigator.onLine===false){
    setAutoState(market,'offline','接続回復時に再試行します。');return;
  }
  const prior=datasets.get(market);
  let lastAttempt=0;
  try{lastAttempt=Number(localStorage.getItem(LAST_ATTEMPT_KEY+market))||0;}catch{}
  if(!force&&Date.now()-lastAttempt<AUTO_REFRESH_INTERVAL_MS&&lastAttempt<=Date.now()){
    const last=prior?.rows?.at(-1)?.date||'未取得';
    const stale=prior?ageOfLastClose(prior.rows).stale:false;
    setAutoState(market,prior?(stale?'stale':'unchanged'):'unavailable',
      '次回の自動更新まで前回の取得結果を利用（'+last+'）'+(stale?'・最新値ではありません':''));
    return;
  }
  const work=(async()=>{
    setAutoState(market,'checking');
    try{
      const result=await fetchAutomaticMarket(market);
      try{localStorage.setItem(LAST_ATTEMPT_KEY+market,String(Date.now()));}catch{}
      const joined=reconcileMarketHistory(prior,result);
      if(joined.updated)persistMarket(market,joined.data);
      const latest=joined.data.rows.at(-1).date;
      if(joined.reason==='conflict'||joined.reason==='different-instrument'||joined.reason==='unverified-source'){
        setAutoState(market,'conflict','保存済みCSVと一致しません。収録 '+latest+'、取得元 '+result.asOf);
      }else if(joined.reason==='older'||joined.reason==='unchanged'){
        const stale=ageOfLastClose(joined.data.rows).stale;
        setAutoState(market,stale?'stale':'unchanged',
          '取得元の終値 '+result.asOf+' ／ 採用せず'+(stale?'・保存履歴も古い':''));
      }else{
        setAutoState(market,result.stale?'stale':'updated',
          '取得元の終値 '+result.asOf+(result.stale?'（更新遅延）':'')+
          (result.errors.length?' ／ 一部取得先に制限あり':''));
      }
    }catch(error){
      setAutoState(market,'unavailable','原因：'+String(error?.message||error).slice(0,120));
      // Failed fetches use a short backoff instead of six-hour freshness suppression.
      try{localStorage.setItem(LAST_ATTEMPT_KEY+market,String(Date.now()-AUTO_REFRESH_INTERVAL_MS+15*60*1000));}catch{}
    }finally{activeSync.delete(market);}
  })();
  activeSync.set(market,work);
  return work;
}
async function refreshAllMarkets(){
  const preferred=selectedMarket(),markets=[preferred,...Object.keys(AUTO_MARKET_SOURCES).filter(x=>x!==preferred)];
  for(const market of markets)await refreshMarket(market);
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
  const button=get('historyAuto');button.disabled=true;
  try{await refreshMarket(selectedMarket(),{force:true});}
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
function evaluateLeadOffThread(prices,market,asOfDate){
  const fallback=()=>{
    const readSky=key=>{
      const [y,m,d]=key.split('-').map(Number);
      return readFinancialWindow(new Date(y,m-1,d,12),window.Astronomy,1)[0];
    };
    return forecastLeadMonths({prices,market,asOfDate,readSky});
  };
  if(typeof Worker==='undefined')return Promise.resolve(fallback());
  return new Promise((resolve,reject)=>{
    let worker;
    try{worker=new Worker(new URL('./market-history-worker.js',import.meta.url),{type:'module'});}
    catch{resolve(fallback());return;}
    const stop=()=>{clearTimeout(timer);worker.terminate();};
    const timer=setTimeout(()=>{stop();reject(new Error('学習の実行時間が上限を超えました。'));},120000);
    worker.onmessage=e=>{
      if(e.data?.requestId!==2)return;
      stop();
      if(e.data.ok)resolve(e.data.result);else reject(new Error(e.data.error||'学習に失敗しました。'));
    };
    worker.onerror=()=>{stop();reject(new Error('学習用の天文計算を起動できませんでした。'));};
    worker.postMessage({mode:'lead-months',requestId:2,prices,market,asOfDate});
  });
}
function showLeadForecast(data){
  const host=get('leadMonths');host.replaceChildren();
  if(data.status!=='experimental'){
    get('leadResult').hidden=true;
    get('leadStatus').textContent='予測保留：'+(data.reason||'学習に必要な暴落事例が不足しています。');
    return;
  }
  get('leadResult').hidden=false;
  get('leadHeadline').textContent=data.canClaimVerified
    ? '検証条件を満たした注意候補：'+(data.leadingPeriod||'判定保留')+'（スコア '+data.highestRiskScore+'/100）'
    : '時期の予測力は未確認。研究上の相対的な最高点：'+
      (data.leadingPeriod||'判定保留')+'（スコア '+data.highestRiskScore+'/100）';
  for(const item of data.buckets){
    const box=node('article','');box.className='lead-month';
    box.append(node('strong',item.period),
      node('small',item.start+' ～ '+item.end));
    if(item.status==='experimental'){
      box.dataset.risk=item.classification==='注意候補'?'high':'normal';
      box.append(node('span','研究スコア '+item.riskScore+'/100　'+item.classification),
        node('small','過去価格だけのモデル：'+item.priceOnlyScore+'/100'),
        node('small',item.selection?.usedAstronomy?'天体特徴を採用':'天体特徴は検証不足につき不採用'));
    }else{
      box.append(node('span','学習不足・判定保留'));
    }
    host.append(box);
  }
  const evaluated=data.diagnostics.filter(d=>d.status==='evaluated');
  const superior=evaluated.filter(d=>d.beatPriceOnly&&d.beatConstant);
  const detail=get('leadValidation');detail.replaceChildren();
  data.diagnostics.forEach(item=>{
    const row=node('p',item.bucket+'：'+(item.status==='evaluated'?
      '後方評価 '+item.testN+'件 ／ Brier：選択モデル '+item.model.brier+
      '・価格のみ '+item.priceOnly.brier+'・一定予想 '+item.model.baseBrier+
      ' ／ 警戒 '+item.model.alerts+'件（誤警戒 '+item.model.falseAlerts+'件）'+
      ' ／ 天体採用：'+(item.optimization?.usedAstronomy?'あり':'なし'):
      '評価データ不足'));
    detail.append(row);
  });
  get('leadDiagnostics').textContent='時系列後方の探索的検証：'+evaluated.length+
    '/3期間に評価値あり。価格のみ・単純予想の両方を上回った期間：'+superior.length+
    '/'+evaluated.length+'。'+
    (data.canClaimVerified?'全期間で過去比較に優位性。ただし前向きの精度は未証明。':
     '安定した予測優位性は未確認。スコアを投資判断に使用しないでください。');
  get('leadStatus').textContent='学習と試験完了：'+data.asOf+
    '終値確定後に利用できる価格だけを学習（将来の天体配置は事前に計算可能）。';
}
async function runLeadForecast(){
  const market=selectedMarket(),data=datasets.get(market);
  if(!data){get('leadStatus').textContent='先に対象市場の終値データを取り込んでください。';return;}
  const asOfDate=get('astroDate').value,button=get('leadRun');
  button.disabled=true;button.textContent='過去相場から学習しています…';
  get('leadResult').hidden=true;
  get('leadStatus').textContent='未来の相場価格を見ずに、月別の特徴と下落事例を照合しています…';
  try{
    await new Promise(r=>setTimeout(r,30));
    const result=await evaluateLeadOffThread(data.rows,market,asOfDate);
    if(selectedMarket()!==market||get('astroDate').value!==asOfDate)return;
    showLeadForecast(result);
  }catch(e){
    get('leadResult').hidden=true;get('leadStatus').textContent='予測エラー：'+e.message;
  }finally{button.disabled=false;button.textContent='過去の相場から学習して3か月先を占う';}
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
  get('astroDate').addEventListener('change',()=>{showMarketRisk();get('leadResult').hidden=true;});
  for(const id of ['astroPrev','astroNext','astroToday'])get(id).addEventListener('click',showMarketRisk);
  get('marketHorizon').addEventListener('change',()=>{get('historyStatistics').hidden=true;});
  get('historyAuto').addEventListener('click',loadOnline);
  get('historyFile').addEventListener('change',loadFile);
  get('historyRun').addEventListener('click',runHistoricalValidation);
  get('leadRun').addEventListener('click',runLeadForecast);

  restore();
  // No background polling: refresh automatically only on launch/reconnect/foreground.
  if(typeof window!=='undefined'){
    void refreshAllMarkets();
    window.addEventListener('online',()=>{void refreshAllMarkets();});
    // Updates while the page remains open; hidden background tabs are not polled.
    window.setInterval?.(()=>{
      if(!document.hidden)void refreshAllMarkets();
    },AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)void refreshAllMarkets();
    });
  }
}
if(typeof document!=='undefined')setup();
