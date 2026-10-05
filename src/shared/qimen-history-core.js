// Bump when chart, scoring, or reading semantics change. Never stamp legacy records.
(function(root){
  const VERSION = 'ring-door-v1-clock-split-v1-reading-v1';
  function save(history, record){
    return [record, ...history.filter(old => !(old.key === record.key &&
      typeof record.calculationVersion === 'string' && record.calculationVersion.length > 0 &&
      old.calculationVersion === record.calculationVersion))].slice(0,100);
  }
  root.KoyomiQimenHistory = Object.freeze({VERSION, save});
})(globalThis);
