const finite=value=>value!=null&&Number.isFinite(Number(value));

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

export function dataQualityText({migration={},surface={}}={}){
  const available=[];
  if(migration.status==='available')available.push(`震源深度 ${migration.usedCount||0}件`);
  if(surface.status==='available')available.push('地表温度取得済み');
  else available.push('地表温度未接続');
  return available.join('・');
}
