// Bump when chart, scoring, or reading semantics change. Never stamp legacy records.
(function(root){
  const VERSION = 'ring-door-v1-clock-split-v1-reading-v1';
  function nextId(history, now){
    const base='qm_'+now, used=new Set(history.map(record=>record.id));
    let id=base, suffix=0;
    while(used.has(id)) id=base+'_'+(++suffix);
    return id;
  }
  function save(history, record){
    return [record, ...history.filter(old => !(old.key === record.key &&
      typeof record.calculationVersion === 'string' && record.calculationVersion.length > 0 &&
      old.calculationVersion === record.calculationVersion))].slice(0,100);
  }
  function inputKey(input){
    return JSON.stringify(['qimen-input-v2', input.date.getTime(), input.purpose.key,
      input.question.toLowerCase().replace(/\s/g,''), input.location, input.lat, input.lon,
      input.basis, input.school, input.tz, input.boundary, input.mode, input.situation]);
  }
  function inputSnapshot(input){
    return {date:input.date.toISOString(),tz:input.tz,lat:input.lat,lon:input.lon,
      basis:input.basis,school:input.school,boundary:input.boundary,mode:input.mode,situation:input.situation};
  }
  function conditionsLabel(record){
    const s=record.inputConditions;
    if(!s || typeof s !== 'object') return '保存時の設定は記録されていません';
    const labels=[];
    const bases={standard:'標準時',local:'地方平均時',solar:'真太陽時'};
    const schools={chaibu:'時家奇門・拆補法・転盤式',fixed:'時家奇門・節気三元固定式'};
    labels.push(Object.hasOwn(bases,s.basis)?'使用時刻 '+bases[s.basis]:'使用時刻は記録なし・未対応');
    labels.push(Object.hasOwn(schools,s.school)?'基準方式 '+schools[s.school]:'基準方式は記録なし・未対応');
    if(Number.isFinite(s.tz)) labels.push('UTC'+(s.tz>=0?'+':'')+s.tz);
    if(s.boundary===23 || s.boundary===0) labels.push('子刻の開始 '+s.boundary+'時');
    const modes={sister:'みつのめ姉さん本鑑定',zubat:'ズバッとモード'};
    const stages={planning:'まだ計画中',ready:'準備は整っている',negotiating:'相手と調整中',stalled:'停滞している',urgent:'今日中に判断が必要',withdraw:'撤退も考えている'};
    if(Object.hasOwn(modes,s.mode)) labels.push(modes[s.mode]);
    if(Object.hasOwn(stages,s.situation)) labels.push(stages[s.situation]);
    return labels.length?labels.join('｜'):'保存時の設定は確認できません';
  }
  function recentDuplicate(history, key, now){
    return history.find(record => record.key === key && record.calculationVersion === VERSION &&
      Number.isFinite(record.savedAt) && now >= record.savedAt && now - record.savedAt < 30 * 60000);
  }
  function versionLabel(record){
    if(typeof record.calculationVersion !== 'string' || !record.calculationVersion.trim())
      return '計算方式の記録がない鑑定';
    return record.calculationVersion === VERSION ? '現在と同じ計算方式で保存' : '異なる計算方式で保存';
  }
  root.KoyomiQimenHistory = Object.freeze({VERSION, save, versionLabel, recentDuplicate, inputKey, inputSnapshot, conditionsLabel, nextId});
})(globalThis);
