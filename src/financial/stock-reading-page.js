import {
  BUILTIN_STOCKS,STOCK_CATALOG_META,updateStockCatalog,
  stockSearch,lookupStock,makeManualStock,normalizeStockCode
} from './stock-directory.js';
import {readStockSymbolic} from './stock-reading-core.js';
import {drawCards,interpret} from './tarot.js';
import {parseMarketCSV,validatePriceRows} from './market-history.js';
import {priceRiskAt} from './market-crash-research.js';

const get=id=>document.getElementById(id);
const elt=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e;};
const SELECTED_KEY='koyomi-stock-reading-selection-v1';
const SAVED_KEY='koyomi-stock-reading-saved-v1';
const REFERENCE_KEY='koyomi-stock-reading-reference-v1-';
const PRICE_KEY='koyomi-stock-reading-close-v1-';
const USER_KEY='koyomi-stock-reading-user-v1-';
let catalog=BUILTIN_STOCKS,selected=null;
function readStorage(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}
}
function writeStorage(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}
}
const dateToday=()=>{
  const d=new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
};
function userStocks(){
  const list=readStorage(USER_KEY);
  return Array.isArray(list)?list.filter(x=>normalizeStockCode(x?.code)&&typeof x.name==='string'
    &&x.name.trim().length>=2).slice(0,100):[];
}
function allStocks(){
  const map=new Map(BUILTIN_STOCKS.map(x=>[x.code,x]));
  for(const item of catalog)map.set(item.code,item);
  for(const item of userStocks())if(!map.has(item.code))map.set(item.code,item);
  return [...map.values()];
}
function status(text){get('stockSearchStatus').textContent=text;}
function renderResults(){
  const query=get('stockQuery').value.trim(),host=get('stockResults');
  host.replaceChildren();
  if(!query){host.hidden=true;status(catalog.length>1000?
    '銘柄名、証券コードで検索できます。':'主要銘柄を内蔵しています。オンラインで銘柄一覧を取得すると検索範囲が広がります。');return;}
  const matches=stockSearch(query,allStocks(),12);
  host.hidden=!matches.length;
  for(const item of matches){
    const button=elt('button',undefined,'stock-result');button.type='button';
    button.append(elt('strong',item.code),elt('span',item.name+' · '+(item.sector||'業種未確認')));
    button.addEventListener('click',()=>selectStock(item));
    host.append(button);
  }
  status(matches.length?matches.length+'件の候補を表示。銘柄名・コードを確認して選択してください。':
    '一致する銘柄がありません。正しい証券コードと企業名を確認の上、手動登録できます。');
}
function loadReference(code){
  const r=readStorage(REFERENCE_KEY+code);
  get('stockReferenceType').value=r?.referenceType==='established'?'established':'listing';
  get('stockReferenceDate').value=typeof r?.date==='string'?r.date:'';
}
function loadPrice(code){
  const host=get('stockPriceResult');
  host.hidden=true;
  const stored=readStorage(PRICE_KEY+code);
  if(!Array.isArray(stored?.rows)||stored.rows.length<2){
    get('stockPriceStatus').textContent='この銘柄の価格は未取得です。実際の株価は推測しません。';return;
  }
  try{
    const rows=stored.rows.map(([date,close])=>({date,close}));
    validatePriceRows(rows);
    displayPrices(rows,stored.source||'端末に保存されたCSV');
  }catch{get('stockPriceStatus').textContent='保存された価格データが不正のため使用しません。';}
}
function displayPrices(rows,source){
  const last=rows.at(-1);
  get('stockPriceResult').hidden=false;
  get('stockLastClose').textContent=last.close.toLocaleString('ja-JP',{maximumFractionDigits:4});
  get('stockPriceDate').textContent=last.date+' 終値';
  get('stockPriceStatus').textContent='実市場データ：'+rows.length+'営業日分 ／ '+source;
  try{
    const risk=priceRiskAt(rows,get('stockDate').value);
    get('stockPriceWarning').textContent=risk.available?
      risk.label+'：'+risk.reason+'。事前に株価下落を予言したものではありません。':
      '価格警戒は判定保留：'+risk.reason;
  }catch(e){get('stockPriceWarning').textContent='価格警戒は計算できません：'+e.message;}
}
function favorites(){
  const x=readStorage(SAVED_KEY);
  return Array.isArray(x)?x.filter(y=>typeof y==='string').slice(0,100):[];
}
function renderFavorite(){
  if(!selected)return;
  const active=favorites().includes(selected.code),button=get('stockFavorite');
  button.setAttribute('aria-pressed',String(active));
  button.textContent=active?'★ 登録済':'☆ お気に入り';
}
function toggleFavorite(){
  if(!selected)return;
  const fav=favorites(),idx=fav.indexOf(selected.code);
  if(idx>=0)fav.splice(idx,1);
  else if(fav.length<100)fav.unshift(selected.code);
  writeStorage(SAVED_KEY,fav);renderFavorite();
}
function selectStock(item){
  const code=normalizeStockCode(item.code);
  if(!code||!item.name)return;
  selected={code,name:item.name,sector:item.sector||'',source:item.source};
  get('stockQuery').value=code+' '+item.name;
  get('stockResults').hidden=true;
  get('stockReading').hidden=false;
  get('selectedStockName').textContent=selected.name;
  get('selectedStockCode').textContent=code;
  get('selectedStockSector').textContent=selected.sector;
  get('selectedStockSource').textContent=(selected.source==='user-entered'?
    'ご自身が登録した銘柄情報。市場への上場・銘柄名の正確性は未確認。':
    '銘柄名の参考：'+STOCK_CATALOG_META.source+'（元資料 '+STOCK_CATALOG_META.snapshotDate+' 時点）。現在の上場状況はJPXで確認してください。');
  loadReference(code);loadPrice(code);renderFavorite();
  get('stockForecast').hidden=true;get('stockTarotResult').textContent='';
  get('stockStatus').textContent='鑑定ボタンを押すと、今後90日の象徴を計算します。';
  writeStorage(SELECTED_KEY,code);
  status('選択中：'+code+' '+selected.name);
  renderStock();
}
function renderStock(){
  if(!selected)return;
  try{
    const date=get('stockDate').value,referenceDate=get('stockReferenceDate').value||null;
    const referenceType=get('stockReferenceType').value;
    const reading=readStockSymbolic({stock:selected,asOfDate:date,referenceDate,
      referenceType,astronomy:window.Astronomy});
    const months=get('stockMonths');months.replaceChildren();
    get('stockForecast').hidden=false;
    get('stockBasis').textContent=reading.basis==='company-date'?
      '企業の'+(referenceType==='listing'?'上場日':'設立日')+'を使った星の象徴と、'+
        selected.code+'のコード数秘を区別して表示。株価の騰落ではありません。':
      '設立日・上場日が未登録です。下は'+selected.code+
        'のコード数秘による象徴で、企業固有の星回りではありません。市場共通の天体傾向は別記しています。';
    get('stockForecastHeading').textContent=referenceDate?
      '90日間の企業占星術とコード数秘':'90日間の銘柄コード数秘';
    for(const period of reading.periods){
      const card=elt('article',undefined,'month');card.dataset.mood=period.mood;
      const number=elt('div','基礎数 '+period.codeCycle.coreNumber+' ／ 今期 '+
        period.codeCycle.number+' · '+period.codeCycle.title,'period-number');
      const action=elt('p','確認する視点：'+period.codeCycle.focus+
        ' ／ 注意：'+period.codeCycle.caution,'period-focus');
      const codeBasis=elt('small',period.codeCycle.basis,'period-code-basis');
      card.append(elt('small',period.label+' / '+period.from.slice(5)+'〜'+period.to.slice(5)),
        elt('strong',period.mood),elt('span',period.message),number,
        action,elt('p',period.grounds[0]),codeBasis);
      if(period.marketContext)card.append(elt('p',period.marketContext,'market-context'));
      months.append(card);
    }
    get('stockReferenceExplanation').textContent=reading.referenceNote+
      ' 同じ設立日・上場日を入力すると星の位置も同じになります。数秘による銘柄別の象徴と混同しないでください。 / '+reading.meta.warning;
    get('stockNumerology').textContent=reading.numerology.number;
    get('stockNumerologyText').textContent=reading.numerology.meaning;
    get('stockNumerologyReason').textContent=reading.numerology.formula+'。'+reading.numerology.note;
    get('stockStatus').textContent='鑑定日 '+date+'。'+
      (referenceDate?'入力した企業基準日 '+referenceDate+' を反映しました。企業星回りと数秘は独立した象徴です。':
        'コードの数秘周期を表示中です。企業固有の占星術を使うには設立日または上場日を入力してください。');
    if(referenceDate)writeStorage(REFERENCE_KEY+selected.code,{date:referenceDate,referenceType});
    else try{localStorage.removeItem(REFERENCE_KEY+selected.code);}catch{}
    const stored=readStorage(PRICE_KEY+selected.code);
    if(stored?.rows?.length>=2)loadPrice(selected.code);
  }catch(e){
    get('stockForecast').hidden=true;
    get('stockStatus').textContent='鑑定できません：'+(e?.message||'日付や天文計算を確認してください。');
  }
}
async function importPriceFile(){
  if(!selected)return;
  const input=get('stockCSV'),file=input.files?.[0];
  if(!file)return;
  try{
    if(file.size>3500000)throw new Error('CSVファイルの上限は3.5MBです。');
    const rows=parseMarketCSV(await file.text());
    // Source identity is supplied by the person and cannot be verified from a generic CSV.
    writeStorage(PRICE_KEY+selected.code,{rows:rows.slice(-15000).map(r=>[r.date,r.close]),
      source:'手動取込：'+file.name.slice(0,80)});
    displayPrices(rows,'手動取込：'+file.name.slice(0,80));
  }catch(e){
    get('stockPriceResult').hidden=true;
    get('stockPriceStatus').textContent='終値CSVを読めません：'+e.message;
  }finally{input.value='';}
}
function drawTarot(){
  if(!selected)return;
  try{
    const card=drawCards(1)[0],reading=interpret(card,'この銘柄に向き合う視点');
    get('stockTarotResult').textContent=reading.card.symbol+' '+reading.card.name+
      '（'+reading.orientation+'）\n'+reading.message+'。\nカードは独立した無作為抽選で、株価への暗示ではありません。';
  }catch(e){get('stockTarotResult').textContent='カードを引けません：'+e.message;}
}
function saveManual(){
  try{
    const item=makeManualStock(get('stockManualCode').value,get('stockManualName').value);
    const fromCatalog=lookupStock(item.code,catalog);
    if(fromCatalog && fromCatalog.name!==item.name){
      throw new Error('登録済みのコードが別の銘柄名と一致しています。一覧から選択してください。');
    }
    if(fromCatalog){selectStock(fromCatalog);return;}
    const own=userStocks().filter(x=>x.code!==item.code);
    own.push(item);
    writeStorage(USER_KEY,own);
    selectStock(item);
  }catch(e){status('手動登録できません：'+e.message);}
}
function setup(){
  get('stockDate').value=dateToday();
  get('stockQuery').addEventListener('input',renderResults);
  get('stockQuery').addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    const q=get('stockQuery').value.trim();
    const exact=lookupStock(q,allStocks());
    if(exact){e.preventDefault?.();selectStock(exact);}
  });
  get('stockManualSave').addEventListener('click',saveManual);
  get('stockRead').addEventListener('click',renderStock);
  get('stockDate').addEventListener('change',renderStock);
  get('stockReferenceDate').addEventListener('change',renderStock);
  get('stockReferenceType').addEventListener('change',renderStock);
  get('stockCSV').addEventListener('change',importPriceFile);
  get('stockFavorite').addEventListener('click',toggleFavorite);
  get('stockTarotDraw').addEventListener('click',drawTarot);
  const prev=readStorage(SELECTED_KEY);
  const q=typeof window!=='undefined'?new URLSearchParams(window.location?.search||'').get('code'):null;
  const preferred=normalizeStockCode(q)||normalizeStockCode(prev);
  if(preferred){
    const found=lookupStock(preferred,allStocks());
    if(found)selectStock(found);
    else get('stockQuery').value=preferred;
  }
  // No query terms, favorite information, or other personal data are sent to the catalog provider.
  const store=typeof localStorage==='undefined'?null:localStorage;
  void updateStockCatalog({store}).then(result=>{
    catalog=result.items;
    if(!selected)renderResults();
    get('stockSearchStatus').textContent= result.error?
      'オンライン一覧を利用できません。端末内の'+catalog.length+'銘柄で検索できます。':
      '銘柄一覧 '+catalog.length+'件から検索できます。資料基準 '+STOCK_CATALOG_META.snapshotDate+'。';
    if(preferred){
      const match=lookupStock(preferred,allStocks());
      if(match&&(!selected||selected.code!==preferred))selectStock(match);
    }
  }).catch(()=>status('オンライン銘柄一覧を取得できません。端末内の銘柄は使えます。'));
  if('serviceWorker'in navigator){
    navigator.serviceWorker.register(new URL('../../service-worker.js',import.meta.url)).catch(()=>{});
  }
}
if(typeof document!=='undefined')setup();
