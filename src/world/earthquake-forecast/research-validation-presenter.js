import { compareValidationModels } from './prediction-evaluation.js';

const finite=value=>value!=null&&Number.isFinite(Number(value));
const clamp=(value,minimum=0,maximum=100)=>Math.max(minimum,Math.min(maximum,Number(value)));
const settledStatuses=new Set(['hit','nearby','miss','false-alarm','out-of-scope']);
const eventStatuses=new Set(['hit','nearby','miss']);

const latestEvaluation=(ledger,predictionId)=>(ledger?.evaluations||[])
  .filter(item=>item.predictionId===predictionId)
  .sort((left,right)=>Date.parse(right.evaluatedAt)-Date.parse(left.evaluatedAt))[0]||null;

const rowFor=(ledger,record)=>{
  const evaluation=latestEvaluation(ledger,record.predictionId);
  if(!settledStatuses.has(evaluation?.status))return null;
  return Object.freeze({
    record,
    evaluation,
    outcome:eventStatuses.has(evaluation.status)?1:0,
    backgroundProbability:record.baselineProbability,
    seismicProbability:record.seismicModel?.probability,
    depthProbability:record.seismicModel?.depthProbability??null,
    thermalProbability:record.seismicModel?.thermalProbability??null
  });
};

const summaryFor=rows=>{
  const statusCounts={hit:0,nearby:0,miss:0,'false-alarm':0,'out-of-scope':0};
  for(const row of rows)if(row.evaluation?.status in statusCounts)statusCounts[row.evaluation.status]++;
  const matched=statusCounts.hit+statusCounts.nearby,alerted=matched+statusCounts['false-alarm'],events=matched+statusCounts.miss;
  return Object.freeze({
    total:rows.length,
    matched,
    noMatch:statusCounts['false-alarm']+statusCounts['out-of-scope'],
    missed:statusCounts.miss,
    precision:alerted?matched/alerted:null,
    recall:events?matched/events:null,
    falseAlarmRate:alerted?statusCounts['false-alarm']/alerted:null,
    statusCounts:Object.freeze(statusCounts)
  });
};

const signalMetric=(rows,{key,label,available,positive})=>{
  const usable=rows.filter(row=>available(row.record));
  let truePositive=0,falsePositive=0,falseNegative=0,positiveCount=0;
  for(const row of usable){
    const signal=positive(row.record),outcome=Number(row.outcome)===1;
    if(signal)positiveCount++;
    if(signal&&outcome)truePositive++;
    else if(signal&&!outcome)falsePositive++;
    else if(!signal&&outcome)falseNegative++;
  }
  const predictedPositive=truePositive+falsePositive,actualPositive=truePositive+falseNegative;
  return Object.freeze({
    key,label,n:usable.length,positiveCount,truePositive,falsePositive,falseNegative,
    precision:predictedPositive?truePositive/predictedPositive:null,
    recall:actualPositive?truePositive/actualPositive:null,
    falseAlarmRate:predictedPositive?falsePositive/predictedPositive:null,
    status:usable.length?'available':'insufficient-data'
  });
};

const signalMetrics=rows=>Object.freeze([
  signalMetric(rows,{key:'seismic',label:'最近の地震活動',available:record=>record.seismicModel?.status==='available'||finite(record.seismicModel?.attentionValue),positive:record=>record.attention?.active===true||Number(record.seismicModel?.attentionValue)>=.6}),
  signalMetric(rows,{key:'depth',label:'震源深度移動',available:record=>record.depthMigration?.status==='available',positive:record=>record.depthMigration?.direction==='deep-to-shallow'}),
  signalMetric(rows,{key:'thermal',label:'熱移送仮説',available:record=>record.thermalTransferHypothesis?.status==='available'&&finite(record.thermalTransferHypothesis?.agreement),positive:record=>Number(record.thermalTransferHypothesis?.agreement)>=60}),
  signalMetric(rows,{key:'mundane',label:'マンデン占術',available:record=>record.divinationResults?.mundane?.status==='available'&&finite(record.divinationResults?.mundane?.score),positive:record=>Number(record.divinationResults?.mundane?.score)>=60})
]);

export function buildValidationDashboard(ledger={predictions:[],evaluations:[]},{recentLimit=30}={}){
  const predictions=[...(ledger.predictions||[])],prospective=predictions.filter(record=>(record.recordKind||'prospective')==='prospective');
  const rows=prospective.map(record=>rowFor(ledger,record)).filter(Boolean).sort((left,right)=>Date.parse(left.evaluation.evaluatedAt)-Date.parse(right.evaluation.evaluatedAt));
  const limit=Math.max(1,Math.floor(Number(recentLimit)||30)),recentRows=rows.slice(-limit),latestRecord=[...predictions].sort((left,right)=>Date.parse(right.issuedAt)-Date.parse(left.issuedAt))[0]||null;
  const latest=latestRecord?Object.freeze({record:latestRecord,evaluation:latestEvaluation(ledger,latestRecord.predictionId)}):null;
  const completedModels=compareValidationModels(rows),recentModels=compareValidationModels(recentRows);
  return Object.freeze({
    latest,
    pendingCount:prospective.filter(record=>latestEvaluation(ledger,record.predictionId)?.status==='pending'||!latestEvaluation(ledger,record.predictionId)).length,
    insufficientCount:prospective.filter(record=>latestEvaluation(ledger,record.predictionId)?.status==='insufficient-data').length,
    replayCount:predictions.filter(record=>record.recordKind==='retrospective-replay').length,
    recent:Object.freeze({...summaryFor(recentRows),limit,models:recentModels}),
    lifetime:Object.freeze({...summaryFor(rows),models:completedModels,statisticallyEvaluable:completedModels.statisticallyEvaluable}),
    signals:signalMetrics(rows)
  });
}

export function attentionState(selection={}){
  const band=finite(selection.attentionBand)?Number(selection.attentionBand):null;
  if(selection.attentionActive===true||band>=4)return Object.freeze({key:'attention',label:'研究上の注目',shortLabel:'注目',symbol:'!'});
  if(band===3)return Object.freeze({key:'watch',label:'変化を観察',shortLabel:'観察',symbol:'△'});
  if(band!=null)return Object.freeze({key:'baseline',label:'平常域',shortLabel:'平常域',symbol:'○'});
  return Object.freeze({key:'unknown',label:'判定不能',shortLabel:'判定不能',symbol:'?'});
}

export function attentionSummary(selection={},view={}){
  const state=attentionState(selection),divinationReady=selection.divinationStatus==='available',thermalReady=view.thermal?.status==='available';
  let lead;
  if(state.key==='attention'&&divinationReady)lead='最近の地震活動とマンデン占術が同じ地域を示しています。';
  else if(state.key==='attention')lead='最近の地震活動に、平常時より大きな変化が見られます。';
  else if(state.key==='watch')lead='最近の地震活動に変化があり、継続して観察する地域です。';
  else if(state.key==='baseline'&&divinationReady)lead='観測上は平常域ですが、マンデン占術では注目が出ています。';
  else if(state.key==='baseline')lead='現在取得できる観測では、平常時からの大きな変化は確認されていません。';
  else lead='比較に必要な観測が不足しているため、現在の見立てを確定できません。';
  const thermal=thermalReady?`熱移送仮説との一致は ${Math.round(Number(view.thermal.agreement))} / 100 です。`:'熱移送仮説は現在判定できません。';
  return `${lead}${thermal}`;
}

export function depthMigrationText(migration={}){
  if(migration.status!=='available')return '標本不足のため判定できません';
  const direction=({
    'deep-to-shallow':'深部から浅部へ移動',
    'shallow-to-deep':'浅部から深部へ移動',
    stable:'大きな深度移動なし',
    mixed:'方向が一定しない'
  })[migration.direction]||'移動方向を判定できません';
  return finite(migration.halfDepthDifferenceKm)?`${direction}（前半・後半差 ${Math.round(Number(migration.halfDepthDifferenceKm)*10)/10}km）`:direction;
}

export function thermalTransferText(thermal={}){
  if(thermal.status!=='available')return thermal.reason||'必要な観測が不足しているため判定できません';
  return `研究上の一致 ${Math.round(Number(thermal.agreement))} / 100。発生確率には加算していません`;
}

const signal=({key,group='observation',label,state,stateLabel,headline,detail,meta=''})=>Object.freeze({key,group,label,state,stateLabel,headline,detail,meta});
const signedTemperature=value=>`${Number(value)>=0?'+':''}${Number(value).toFixed(1)}℃`;

export function buildPrecursorDisplay(selection={},view={}){
  const seismicState=attentionState(selection),attentionBand=finite(selection.attentionBand)?Math.round(clamp(selection.attentionBand,0,4)):null;
  const seismic=signal({
    key:'seismic',label:'最近の地震活動',
    state:seismicState.key==='attention'?'strong':seismicState.key==='watch'?'watch':seismicState.key==='baseline'?'quiet':'unavailable',
    stateLabel:seismicState.key==='attention'?'強い変化':seismicState.key==='watch'?'変化あり':seismicState.key==='baseline'?'大きな変化なし':'データ不足',
    headline:selection.seismicLabel||'比較できる地震活動データがありません',
    detail:attentionBand==null?'この地域自身の過去と比較できません':`平常時との相対区分 ${attentionBand} / 4`,
    meta:'長期履歴と直近活動を比較'
  });

  const migration=view.depthMigration||{},depthReady=migration.status==='available',depthDirection=migration.direction;
  const depth=signal({
    key:'depth',label:'震源の深さの移動',
    state:!depthReady?'unavailable':depthDirection==='deep-to-shallow'?(Number(migration.strength)>=.5?'strong':'watch'):depthDirection==='stable'?'quiet':'watch',
    stateLabel:!depthReady?'データ不足':depthDirection==='deep-to-shallow'?'浅部へ移動':depthDirection==='shallow-to-deep'?'深部へ移動':'大きな移動なし',
    headline:depthMigrationText(migration),
    detail:depthReady?`${migration.usedCount||0}件を期間前半・後半で比較`:(migration.dataQuality?.reason||'計算に必要な地震数が不足しています'),
    meta:migration.lastObservationUtc?`最新 ${String(migration.lastObservationUtc).slice(0,10)}`:'最新観測なし'
  });

  const thermalResearch=selection.thermalSignal||null,thermalResearchReady=['candidate-active','inactive'].includes(thermalResearch?.status),thermalEvidence=thermalResearchReady?Math.max(Number(thermalResearch.positiveEvidence)||0,Number(thermalResearch.negativeEvidence)||0):null;
  const surface=view.surface||{},surfaceReady=surface.status==='available',deviation=surfaceReady&&finite(surface.monthlyTimeBaselineDeviationC)?Number(surface.monthlyTimeBaselineDeviationC):null,absoluteDeviation=deviation==null?null:Math.abs(deviation);
  const surfaceSignal=thermalResearch?signal({
    key:'surface',label:'地表熱の変化',
    state:!thermalResearchReady?'unavailable':thermalResearch.status==='candidate-active'?(thermalEvidence>=.65?'strong':'watch'):'quiet',
    stateLabel:!thermalResearchReady?'データ不足':thermalResearch.status==='candidate-active'?'熱異常候補':'基準内',
    headline:thermalResearch.reason||'地表熱を判定できません',
    detail:thermalResearchReady?`上昇側 ${Math.round((Number(thermalResearch.positiveEvidence)||0)*100)} / 100・低下側 ${Math.round((Number(thermalResearch.negativeEvidence)||0)*100)} / 100`:'取得済みデータをこの縮尺・日時では比較できません',
    meta:thermalResearch.latestObservationUtc?`最新 ${String(thermalResearch.latestObservationUtc).slice(0,10)}・${thermalResearch.provider?.name||'NASA熱データ'}・研究用`:'最新観測なし'
  }):signal({
    key:'surface',label:'地表付近の温度変化',
    state:!surfaceReady?'unavailable':absoluteDeviation>=3?'strong':absoluteDeviation>=1.5?'watch':'quiet',
    stateLabel:!surfaceReady?'データ不足':absoluteDeviation>=3?'大きな偏差':absoluteDeviation>=1.5?'偏差あり':'大きな偏差なし',
    headline:deviation==null?(surface.reason||'温度偏差を判定できません'):`平年同時期比 ${signedTemperature(deviation)}`,
    detail:surfaceReady?`周辺との差 ${signedTemperature(surface.neighborDeviationC)}・${surface.persistenceDays||0}日継続`:(surface.reason||'地表付近の温度データがありません'),
    meta:surface.latestObservationUtc?`最新 ${String(surface.latestObservationUtc).slice(0,10)}・研究用`:'最新観測なし'
  });

  const divinationReady=selection.divinationStatus==='available'&&finite(selection.divinationScore),divinationScore=divinationReady?Math.round(clamp(selection.divinationScore)):null;
  const divination=signal({
    key:'mundane',group:'divination',label:'マンデン占術',
    state:!divinationReady?'unavailable':divinationScore>=75?'strong':divinationScore>=50?'watch':'quiet',
    stateLabel:!divinationReady?'判定不能':divinationScore>=75?'強い兆し':divinationScore>=50?'兆しあり':'穏やか',
    headline:selection.divinationLabel||'判定不能',
    detail:divinationScore==null?'占術計算を利用できません':`占術上の活性 ${divinationScore} / 100`,
    meta:'占い表示・科学観測には加算しません'
  });

  const observations=[seismic,depth,surfaceSignal],available=observations.filter(item=>item.state!=='unavailable'),candidates=available.filter(item=>['strong','watch'].includes(item.state));
  const state=!available.length?'unavailable':candidates.length>=2?'strong':candidates.length===1?'watch':'quiet';
  const label=state==='strong'?'複数の変化候補':state==='watch'?'変化候補あり':state==='quiet'?'大きな変化候補なし':'判定不能';
  const summary=!available.length?'科学観測のデータが不足しており、予兆候補を判定できません。':`科学観測3項目中${available.length}項目を判定し、${candidates.length}項目に変化候補があります。`;
  return Object.freeze({state,label,summary,availableCount:available.length,candidateCount:candidates.length,signals:Object.freeze([...observations,divination])});
}

export function dataQualityText({migration={},surface={}}={}){
  const available=[];
  if(migration.status==='available')available.push(`震源深度 ${migration.usedCount||0}件`);
  if(surface.status==='available')available.push('地表温度取得済み');
  else available.push('地表温度未接続');
  return available.join('・');
}
