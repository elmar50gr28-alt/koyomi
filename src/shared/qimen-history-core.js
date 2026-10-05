// Bump when chart, scoring, or reading semantics change. Never stamp legacy records.
(function(root){
  const VERSION = 'ring-door-v1-clock-split-v1-reading-v1';
  function save(history, record){
    return [record, ...history.filter(old => !(old.key === record.key &&
      typeof record.calculationVersion === 'string' && record.calculationVersion.length > 0 &&
      old.calculationVersion === record.calculationVersion))].slice(0,100);
  }
  function versionLabel(record){
    if(typeof record.calculationVersion !== 'string' || !record.calculationVersion.trim())
      return '計算方式の記録がない鑑定';
    return record.calculationVersion === VERSION ? '現在と同じ計算方式で保存' : '異なる計算方式で保存';
  }
  root.KoyomiQimenHistory = Object.freeze({VERSION, save, versionLabel});
})(globalThis);
