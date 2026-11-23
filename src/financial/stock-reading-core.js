// Stock-symbol divination: astronomy and numerology for reflection, NEVER a price
// forecast. A company date is optional and must be provided by the user, not invented.
import {readFinancialSky,positionsAt,BODY_LABELS} from './astrology-core.js';
import {marketDaySignal} from './market-direction.js';
import {normalizeStockCode} from './stock-directory.js';

export const STOCK_READING_META=Object.freeze({
  id:'koyomi-stock-symbolic-v1',status:'symbolic-unvalidated',
  warning:'占い上の象徴であり、株価の上昇・下落や暴落発生確率の予測ではありません。売買判断には使わないでください。',
  dateBasis:'設立日・上場日のどちらかを自分で確認して入力。時刻・場所が不明な場合は天体のハウス、ASC、月を個別企業の根拠として使用しない。',
  dataBasis:'実価格は自動取得しない。銘柄を変えると以前の企業の価格を継承しない。'
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
export function companyDateAspects(referenceDate,transitDate,astronomy){
  const natal=positionsAt(strToDate(referenceDate),astronomy);
  const transits=positionsAt(strToDate(transitDate),astronomy);
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
  if(hasReference){
    const ref=strToDate(referenceDate);
    if(ref.getTime()>start.getTime())throw new Error('企業の基準日が鑑定日より未来です。');
  }
  // Strictly independent from market closes. Position computations are deterministic
  // and valid ahead of time; no later observations can change this result.
  const periods=PREDICTION_HORIZONS.map(bucket=>{
    const findings=[];const totals=[];
    for(const offset of sampleOffsets(bucket)){
      const date=keyOf(addDays(start,offset));
      if(hasReference){
        const aspects=companyDateAspects(referenceDate,date,astronomy);
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
    const main=findings.sort((a,b)=>a.orb-b.orb)[0];
    const summary=labels(avg);
    return {
      label:bucket.label,from:keyOf(addDays(start,bucket.from)),
      to:keyOf(addDays(start,bucket.to)),
      mood:summary.mood,message:summary.message,
      grounds:main?[main.date+'：'+main.label+'（ずれ'+main.orb+'°）／'+main.description]:
        [hasReference?'計算対象の企業基準日と主要な角度関係は期間内に強く現れませんでした。':
          '企業の基準日未登録のため、市場全体に共通する天体の象意のみを表示しています。'],
      companySpecific:hasReference,scanDays:totals.length
    };
  });
  return {stock:{code:normalizeStockCode(stock.code),name:stock.name.trim(),sector:stock.sector||'不明'},
    asOfDate,referenceDate:hasReference?referenceDate:null,referenceType,
    basis:hasReference?'company-date':'general-market-only',
    referenceNote:hasReference?
      (referenceType==='listing'?'入力された上場日':'入力された設立日')+
        'を12:00 UTCの仮時刻で計算しています。時刻不明のため月・ハウス・ASCは企業固有鑑定に使用しません。':
      '設立日・上場日がないため、企業固有の占星術は未計算です。',
    periods,numerology:codeNumerology(stock.code),meta:STOCK_READING_META};
}
