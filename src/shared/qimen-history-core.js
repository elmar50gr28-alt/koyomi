// Bump when chart, scoring, or reading semantics change. Never stamp legacy records.
(function(root){
  const VERSION = 'ring-door-v1-clock-split-v1-reading-v1';
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
  function recentDuplicate(history, key, now){
    return history.find(record => record.key === key && record.calculationVersion === VERSION &&
      Number.isFinite(record.savedAt) && now >= record.savedAt && now - record.savedAt < 30 * 60000);
  }
  function versionLabel(record){
    if(typeof record.calculationVersion !== 'string' || !record.calculationVersion.trim())
      return '計算方式の記録がない鑑定';
    return record.calculationVersion === VERSION ? '現在と同じ計算方式で保存' : '異なる計算方式で保存';
  }
  root.KoyomiQimenHistory = Object.freeze({VERSION, save, versionLabel, recentDuplicate, inputKey});
})(globalThis);
