import assert from 'node:assert/strict';
import {marketDaySignal,forecastMarketDirection,MARKET_TARGETS,MARKET_PERIODS,MARKET_DIRECTION_RULES} from '../src/financial/market-direction.js';

function fixture(date,{up=false,down=false,reverse=false}={}) {
  const aspects=[];
  if(up) aspects.push({bodies:['Venus','Jupiter'],type:'trine',orb:0.2,label:'金星 × 木星',aspect:'トライン'});
  if(down) aspects.push({bodies:['Saturn','Mars'],type:'square',orb:0.2,label:'土星 × 火星',aspect:'スクエア'});
  return {date,aspects,retrogrades:reverse?[{body:'Mercury',label:'水星'}]:[],phase:{label:'新月付近'}};
}
const sample=[
  fixture('2026-11-23',{up:true}),
  fixture('2026-11-24',{up:true}),
  fixture('2026-11-25',{down:true}),
  fixture('2026-11-26',{up:true}),
  fixture('2026-11-27',{up:true}),
  fixture('2026-11-28',{up:true}),
  fixture('2026-11-29',{up:true})
];
assert.equal(marketDaySignal(sample[0]).direction,'up');
assert.equal(marketDaySignal(sample[2]).direction,'down');
assert.equal(marketDaySignal(fixture('2026-11-23')).direction,'unclear');
assert.equal(marketDaySignal(fixture('2026-11-23',{reverse:true})).direction,'unclear','one retrograde is not a directional proof');
assert.equal(marketDaySignal(fixture('2026-11-23',{up:true,down:true})).direction,'unclear','contradictory aspects cancel');
const up=forecastMarketDirection(sample,'nikkei',7);
assert.equal(up.direction,'up');
assert.equal(up.label,'上昇');
assert.equal(up.marketLabel,'日経平均');
assert.match(up.headline,/占断：上昇/);
assert.match(up.reason,/金星/);
assert.match(up.counterEvidence,/土星/);
assert.equal(up.observedDays,7);
assert.equal(up.periodStart,'2026-11-23');
assert.equal(up.periodEnd,'2026-11-29');
assert.equal(up.daily.length,7);
assert.equal(forecastMarketDirection(sample.map(day=>day===sample[2]?fixture(day.date,{down:true}):fixture(day.date,{down:true})),'nasdaq',7).direction,'down');
assert.equal(forecastMarketDirection([fixture('2026-11-23',{up:true,down:true})],'nikkei',1).direction,'unclear');
const noEvidence=forecastMarketDirection([fixture('2026-11-23')],'nikkei',1);
assert.equal(noEvidence.direction,'unclear');
assert.match(noEvidence.summary,/材料が足りません/);
assert.equal(forecastMarketDirection(sample,'gold',7).direction,up.direction,'same astronomy signal regardless of market');
assert.equal(forecastMarketDirection(sample,'usdjpy',7).symbolicScore,up.symbolicScore);
assert.equal(forecastMarketDirection([...sample,fixture('2026-11-30',{down:true})],'nikkei',7).direction,up.direction,'later observations cannot affect shorter horizon');
assert.ok(Object.keys(MARKET_TARGETS).length>=3);
assert.deepEqual(MARKET_PERIODS,[1,7,14]);
assert.match(MARKET_DIRECTION_RULES.limitation,/未検証/);
assert.throws(()=>forecastMarketDirection(sample,'__proto__',7),/対象市場/);
assert.throws(()=>forecastMarketDirection([], 'nikkei',7),/鑑定期間/);
assert.throws(()=>forecastMarketDirection(sample,'nikkei',2),/鑑定期間/);
assert.throws(()=>marketDaySignal({date:'2026-11-23'}),/天文計算結果/);
console.log('Symbolic market direction rules, three outcomes, opposing evidence, horizon bounds and market invariance passed');
