// Stock-symbol divination: astronomy and numerology for reflection, NEVER a price
// forecast. A company date is optional and must be provided by the user, not invented.
import {readFinancialSky,positionsAt,BODY_LABELS} from './astrology-core.js';
import {marketDaySignal} from './market-direction.js';
import {normalizeStockCode} from './stock-directory.js';

export const STOCK_READING_META=Object.freeze({
  id:'koyomi-stock-symbolic-v2-distinct-bases',status:'symbolic-unvalidated',
  warning:'占い上の象徴であり、株価の上昇・下落や暴落発生確率の予測ではありません。売買判断には使わないでください。',
  dateBasis:'設立日・上場日のどちらかを自分で確認して入力。時刻・場所が不明な場合は天体のハウス、ASC、月を個別企業の根拠として使用しない。',
  dataBasis:'個別株の実価格・業績は使用しない。企業基準日がなければコードの数秘周期のみを銘柄別に算出し、共通天体の占いと分離する。',
  differentiation:'証券コードの数秘周期は識別子の象徴計算。類似コード・数秘の一致はあり、株価との因果関係や予測力はない。'
});
const DAY=86400000;
const PREDICTION_HORIZONS=Object.freeze([
 {from:1,to:30,label:'1〜30日後'},
 {from:31,to:60,label:'31〜60日後'},
 {from:61,to:90,label:'61〜90日後'}
]);
const ASPECTS=Object.freeze([
 {angle:0,label:'合',kind:'conjunction'},
 {angle:60,label:'セクスタイル',kind:'sextile'},
 {angle:90,label:'スクエア',kind:'square'},
 {angle:120,label:'トライン',kind:'trine'},
 {angle:180,label:'オポジション',kind:'opposition'}
]);
const NATAL_BODIES=['Sun','Jupiter','Saturn'];
const TRANSIT_BODIES=['Jupiter','Saturn','Uranus','Mars'];
const ASPECT_ORB=3;
const absAngle=(a,b)=>{const d=Math.abs(a-b)%360;return Math.min(d,360-d);};
function strToDate(key){
  if(typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(key))throw new RangeError('日付が不正です。');
  const date=new Date(key+'T12:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==key||key<'1900-01-01'||key>'2099-09-30'){
    throw new RangeError('実在する1900〜2099年の日付を入力してください。');
  }
  return date;
}
const addDays=(date,days)=>new Date(date.getTime()+days*DAY);
const keyOf=date=>date.toISOString().slice(0,10);
export function codeNumerology(code){
  const ticker=normalizeStockCode(code);
  if(!ticker)throw new RangeError('証券コードを確認してください。');
  const values=[...ticker].map(ch=>/[0-9]/.test(ch)?Number(ch):ch.charCodeAt(0)-64);
  let n=values.reduce((s,v)=>s+v,0);
  while(n>9)n=[...String(n)].reduce((s,v)=>s+Number(v),0);
  const meanings={
    1:'始まり・独立',2:'協調と調整',3:'発想と創造',4:'継続と土台',
    5:'変化と自由',6:'責任と調和',7:'探求と分析',8:'管理と実行',9:'仕上げと循環'
  };
  return {number:n,meaning:meanings[n],formula:values.join('＋')+' → '+n,
    note:'証券コードに割り振られた数字・英文字の数秘術です。企業の業績や株価との因果関係はありません。'};
}
// Clearly defined ticker-number symbolism. It is NOT an enterprise ephemeris,
// nor is its apparent differentiation evidence of forecast skill.
const CYCLE_THEMES=Object.freeze({
  1:{title:'始動',mood:'吉',theme:'新しい選択肢を整理する',focus:'新規事業・新製品の公表情報',caution:'勢いだけで飛び付かない'},
  2:{title:'連携',mood:'平',theme:'関係を整え、協力の条件を確かめる',focus:'提携・取引先との関係',caution:'思惑を事実と混同しない'},
  3:{title:'発信',mood:'吉',theme:'情報の流れを見直す',focus:'企業発表や説明資料',caution:'話題性だけで判断しない'},
  4:{title:'土台',mood:'平',theme:'基礎を点検し、持続性を考える',focus:'財務と事業の継続性',caution:'目先の変化に振り回されない'},
  5:{title:'変化',mood:'慎重',theme:'変化への備えを整える',focus:'事業環境・制度変更',caution:'急な結論を避ける'},
  6:{title:'均衡',mood:'吉',theme:'バランスを調べる',focus:'収益源と支出の構成',caution:'好材料だけを集めない'},
  7:{title:'検証',mood:'平',theme:'根拠を深く確かめる',focus:'決算資料と数字の整合性',caution:'一つの指標に依存しない'},
  8:{title:'実務',mood:'吉',theme:'計画と実行力を見直す',focus:'設備投資・事業計画',caution:'目標だけで評価しない'},
  9:{title:'区切り',mood:'慎重',theme:'これまでの前提を再評価する',focus:'方針の転換・事業整理',caution:'変化を売買の確定合図にしない'}
});
const rootOf=value=>{
  let n=value;
  while(n>9)n=[...String(n)].reduce((sum,d)=>sum+Number(d),0);
  return n||9;
};
const codeValues=ticker=>[...ticker].map(ch=>/[0-9]/.test(ch)?Number(ch):ch.charCodeAt(0)-64);
export function codeCycleAt(code,anchorDate,periodIndex=0){
  const ticker=normalizeStockCode(code);
  if(!ticker)throw new RangeError('証券コードを確認してください。');
  const date=strToDate(anchorDate);
  if(!Number.isInteger(periodIndex)||periodIndex<0||periodIndex>2)
    throw new RangeError('占い期間を確認してください。');
  const values=codeValues(ticker);
  const base=codeNumerology(ticker).number;
  const positionRoot=rootOf(values.reduce((sum,v,i)=>sum+v*(i+1),0));
  const dateRoot=rootOf([...keyOf(date).replaceAll('-','')].reduce((sum,ch)=>sum+Number(ch),0));
  const number=rootOf(base+positionRoot+dateRoot+periodIndex);
  const item=CYCLE_THEMES[number];
  const core=codeNumerology(ticker);
  return {
    number,title:item.title,mood:item.mood,
    coreNumber:base,coreMeaning:core.meaning,positionRoot,
    message:'コードの基礎数'+base+'「'+core.meaning+'」と、今期の数'+
      number+'「'+item.title+'」がテーマ。'+item.theme+'。株価の騰落を示すものではありません。',
    focus:item.focus,caution:item.caution,
    basis:'証券コード '+ticker+' → 基礎数'+base+'・加重数'+positionRoot+
      '・期間日付数'+dateRoot+'・区間'+(periodIndex+1)+' → '+number,
    method:'証券コードの数秘周期。企業の日付・業績・市場価格の代わりにはなりません。'
  };
}
function evaluateAspect(transit,natal,transitBody,natalBody){
  const separation=absAngle(transit,natal);
  const aspect=ASPECTS.map(a=>({...a,orb:Math.abs(separation-a.angle)}))
    .sort((a,b)=>a.orb-b.orb)[0];
  if(!aspect||aspect.orb>ASPECT_ORB)return null;
  let score=0;
  if(transitBody==='Jupiter'&&(aspect.kind==='conjunction'||aspect.kind==='trine'||aspect.kind==='sextile'))score=1;
  else if(['Saturn','Mars','Uranus'].includes(transitBody)&&
    ['square','opposition','conjunction'].includes(aspect.kind))score=-1;
  const label=BODY_LABELS[transitBody]+'の'+BODY_LABELS[natalBody]+'への'+aspect.label;
  return {transitBody,natalBody,aspect:aspect.kind,label,orb:Number(aspect.orb.toFixed(2)),
    score,description:score>0?'発展・組み合わせの象徴':score<0?'調整・再構築の象徴':'転換の象徴'};
}
function aspectsFromPositions(natal,transits){
  const findings=[];
  for(const t of TRANSIT_BODIES){
    for(const n of NATAL_BODIES){
      const v=evaluateAspect(transits[t],natal[n],t,n);
      if(v)findings.push(v);
    }
  }
  return findings.sort((a,b)=>a.orb-b.orb||
    a.label.localeCompare(b.label));
}
export function companyDateAspects(referenceDate,transitDate,astronomy){
  return aspectsFromPositions(
    positionsAt(strToDate(referenceDate),astronomy),
    positionsAt(strToDate(transitDate),astronomy)
  );
}
function sampleOffsets(bucket){
  const offsets=[];
  for(let offset=bucket.from;offset<=bucket.to;offset+=7)offsets.push(offset);
  if(offsets.at(-1)!==bucket.to)offsets.push(bucket.to);
  return offsets;
}
function labels(score){
  const mood=score>=0.55?'吉':score<=-0.55?'慎重':'平';
  const meanings={
    吉:'占術上は発展・協調がテーマ。実際の値上がりを意味しません。',
    慎重:'占術上は見直し・調整がテーマ。実際の値下がりを意味しません。',
    平:'占術上は強い偏りがなく、状況を整理する時期です。'
  };
  return {mood,message:meanings[mood]};
}
export function readStockSymbolic({stock,asOfDate,referenceDate=null,referenceType='listing',astronomy}){
  if(!stock||!normalizeStockCode(stock.code)||typeof stock.name!=='string'||!stock.name.trim())
    throw new Error('銘柄を正しく選択してください。');
  if(!['listing','established'].includes(referenceType))throw new Error('基準日の種類が不明です。');
  const start=strToDate(asOfDate);
  const hasReference=!!referenceDate;
  let natalPositions=null;
  if(hasReference){
    const ref=strToDate(referenceDate);
    if(ref.getTime()>start.getTime())throw new Error('企業の基準日が鑑定日より未来です。');
    // The natal chart is constant across 90 days. Calculate it once on mobile.
    natalPositions=positionsAt(ref,astronomy);
  }
  // Strictly independent from market closes. Position computations are deterministic
  // and valid ahead of time; no later observations can change this result.
  const periods=PREDICTION_HORIZONS.map((bucket,index)=>{
    const findings=[];const totals=[];
    for(const offset of sampleOffsets(bucket)){
      const date=keyOf(addDays(start,offset));
      if(hasReference){
        const aspects=aspectsFromPositions(natalPositions,positionsAt(strToDate(date),astronomy));
        totals.push(aspects.reduce((sum,item)=>sum+item.score,0));
        aspects.forEach(item=>findings.push({...item,date}));
      }else{
        const sky=readFinancialSky(strToDate(date),astronomy);
        const general=marketDaySignal(sky);
        totals.push(Math.max(-3,Math.min(3,general.score)));
      }
    }
    // A sampled symbolic trend, deliberately NOT calibrated to price or odds.
    const avg=totals.reduce((s,v)=>s+v,0)/totals.length;
    // Fix the anchor across the three 30-day buckets; month index advances
    // the symbolic cycle rather than accidentally cancelling the date-root.
    const codeCycle=codeCycleAt(stock.code,asOfDate,index);
    // Prefer evidence involving the company's dated Sun to generic slow-planet
    // coincidences. Show distinct pairs, not 18 near-identical daily statements.
    findings.sort((a,b)=>(a.natalBody==='Sun'?-1:0)-(b.natalBody==='Sun'?-1:0)
      ||Math.abs(b.score)-Math.abs(a.score)||a.orb-b.orb||a.date.localeCompare(b.date));
    const unique=new Set(),main=[];
    for(const finding of findings){
      const key=finding.transitBody+':'+finding.natalBody+':'+finding.aspect;
      if(unique.has(key))continue;
      unique.add(key);
      main.push(finding.date+'：'+finding.label+'（ずれ'+finding.orb+'°）／'+finding.description);
      if(main.length===3)break;
    }
    const summary=labels(avg);
    return {
      label:bucket.label,from:keyOf(addDays(start,bucket.from)),
      to:keyOf(addDays(start,bucket.to)),
      // When no enterprise date is supplied, do NOT reuse the identical
      // general-market sky score as if it were an individual stock forecast.
      mood:hasReference?summary.mood:codeCycle.mood,
      message:hasReference?summary.message:codeCycle.message,
      grounds:hasReference?
        (main.length?main:['入力された企業基準日と対象天体の主要な角度関係は見られませんでした。']):
        [codeCycle.basis],
      symbolicBasis:hasReference?'company-date-astrology':'ticker-code-numerology',
      codeCycle,
      marketContext:hasReference?null:
        '共通の市場天体象徴：'+summary.mood+'。すべての銘柄に共通し、銘柄固有の根拠ではありません。',
      companySpecific:hasReference,scanDays:totals.length
    };
  });
  return {stock:{code:normalizeStockCode(stock.code),name:stock.name.trim(),sector:stock.sector||'不明'},
    asOfDate,referenceDate:hasReference?referenceDate:null,referenceType,
    basis:hasReference?'company-date':'code-numerology-only',
    referenceNote:hasReference?
      (referenceType==='listing'?'入力された上場日':'入力された設立日')+
        'を12:00 UTCの仮時刻で計算しています。時刻不明のため月・ハウス・ASCは企業固有鑑定に使用しません。':
      '設立日・上場日が未登録です。90日間の銘柄別表示はコードの数秘周期であり、企業固有の星回りは計算していません。',
    periods,numerology:codeNumerology(stock.code),meta:STOCK_READING_META};
}
