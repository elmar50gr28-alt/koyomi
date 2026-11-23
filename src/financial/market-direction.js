// KOYOMI financial astrology research layer: a SYMBOLIC directional reading.
// No prices, exchanges, asset-specific data or statistical backtest enter this model.
export const MARKET_TARGETS = Object.freeze({
  nikkei: '日経平均',
  nasdaq: 'NASDAQ100',
  gold: '金価格',
  usdjpy: 'ドル／円'
});
export const MARKET_PERIODS = Object.freeze([1, 7, 14]);
export const MARKET_DIRECTION_RULES = Object.freeze({
  id: 'koyomi-market-symbolic-direction-v1',
  reviewStatus: 'unvalidated-symbolic-model',
  methodology: '金星・木星の調和を上昇象意、土星・火星を含む緊張を下落象意、水星・金星の逆行を弱い下落象意として採点。期間平均と日別判定が同じ方向を支持する場合に占断する。',
  limitation: '上昇・下落は金融占星術の象徴による占いです。市場価格を使用せず、実際の騰落方向の的中率は未検証です。対象市場ごとの差は算出しません。'
});
function validDays(days, horizon) {
  if (!Array.isArray(days) || !days.length || !MARKET_PERIODS.includes(horizon)) {
    throw new RangeError('鑑定期間を確認してください。');
  }
  return days.slice(0, horizon);
}
function entry(date, direction, weight, text) {
  return {date, direction, weight, text};
}
export function marketDaySignal(day) {
  if (!day || typeof day.date!=='string' || !Array.isArray(day.aspects) || !Array.isArray(day.retrogrades)) {
    throw new TypeError('天文計算結果が不足しています。');
  }
  const contributions=[];
  for (const aspect of day.aspects) {
    const bodies=Array.isArray(aspect.bodies)?aspect.bodies:[];
    const has=body=>bodies.includes(body);
    const cooperative=aspect.type==='trine'||aspect.type==='sextile';
    const tense=aspect.type==='square'||aspect.type==='opposition';
    let direction=0,base=0;
    if (cooperative && (has('Jupiter')||has('Venus'))) {
      direction=1;base=has('Jupiter')&&has('Venus')?2:1;
    } else if (tense && (has('Saturn')||has('Mars'))) {
      direction=-1;base=2;
    } else if (tense && (has('Jupiter')||has('Venus'))) {
      direction=-1;base=1;
    } else if (aspect.type==='conjunction' && has('Jupiter') && has('Venus')) {
      direction=1;base=2;
    } else if (aspect.type==='conjunction' && has('Saturn') && (has('Mars')||has('Uranus'))) {
      direction=-1;base=2;
    }
    if (!direction) continue;
    const orb=Number(aspect.orb);
    if (!Number.isFinite(orb) || orb<0) continue;
    const weight=base*(orb<=1.5?2:1);
    contributions.push(entry(day.date,direction,weight,aspect.label+'・'+aspect.aspect));
  }
  for (const transit of day.retrogrades) {
    if (transit.body==='Mercury'||transit.body==='Venus') {
      contributions.push(entry(day.date,-1,1,transit.label+'の逆行'));
    }
  }
  const score=contributions.reduce((sum,item)=>sum+item.direction*item.weight,0);
  const direction=score>=2?'up':score<=-2?'down':'unclear';
  return {date:day.date,score,direction,contributions};
}
export function forecastMarketDirection(days, market='nikkei', horizon=7) {
  if (!Object.hasOwn(MARKET_TARGETS,market)) throw new RangeError('対象市場を選んでください。');
  const source=validDays(days,horizon);
  const daily=source.map(marketDaySignal);
  const mean=daily.reduce((sum,day)=>sum+day.score,0)/daily.length;
  const upDays=daily.filter(day=>day.direction==='up').length;
  const downDays=daily.filter(day=>day.direction==='down').length;
  const isUp=mean>=1.5 && upDays>downDays;
  const isDown=mean<=-1.5 && downDays>upDays;
  const direction=isUp?'up':isDown?'down':'unclear';
  const labels={up:'上昇',down:'下落',unclear:'方向感なし'};
  const headlines={
    up:'占断：上昇。買いの象意が優勢。',
    down:'占断：下落。売りの象意が優勢。',
    unclear:'占断：方向感なし。強弱が拮抗。'
  };
  const details={
    up:'選択期間の占星術上は、拡大・調和の象意が優勢です。市場の実測値に基づく上昇予測ではありません。',
    down:'選択期間の占星術上は、衝突・制約の象意が優勢です。市場の実測値に基づく下落予測ではありません。',
    unclear:'上昇と下落の象意が拮抗するか、明確な材料が足りません。無理に上げ下げを断定しません。'
  };
  const all=daily.flatMap(d=>d.contributions);
  const strongest=all.filter(x=>x.direction===(direction==='up'?1:direction==='down'?-1:0))
    .sort((a,b)=>b.weight-a.weight||a.date.localeCompare(b.date));
  const opposite=all.filter(x=>x.direction===(direction==='up'?-1:direction==='down'?1:0))
    .sort((a,b)=>b.weight-a.weight||a.date.localeCompare(b.date));
  const reasons=(direction==='unclear'? [...all].sort((a,b)=>b.weight-a.weight||a.date.localeCompare(b.date)):strongest)
    .slice(0,2).map(x=>x.date+' '+x.text);
  const cautions=opposite.slice(0,2).map(x=>x.date+' '+x.text);
  const periodStart=daily[0].date,periodEnd=daily.at(-1).date;
  return Object.freeze({
    market,marketLabel:MARKET_TARGETS[market],horizon,
    periodStart,periodEnd,observedDays:daily.length,direction,
    label:labels[direction],headline:headlines[direction],summary:details[direction],
    reason:reasons.length?reasons.join(' ／ '):'明確な方向を示す対象アスペクト・逆行はありません。',
    counterEvidence:cautions.length?cautions.join(' ／ '):'採用ルールに該当する主な反対象意はありません。',
    symbolicScore:Number(mean.toFixed(2)),upDays,downDays,
    daily:daily.map(item=>({date:item.date,direction:item.direction,label:labels[item.direction]})),
    meta:MARKET_DIRECTION_RULES,sharedAcrossMarkets:true
  });
}
