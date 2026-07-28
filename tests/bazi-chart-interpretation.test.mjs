import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { calculateBazi, buildBaziReading } from '../src/bazi/index.js';

const result=calculateBazi({
  displayName:'命式解説確認',
  birthData:{date:'1980-02-05',time:'02:00',timeUnknown:false,place:{timeZone:'Asia/Tokyo',utcOffset:9,latitude:36.7419,longitude:138.3694}}
});
const reading=buildBaziReading(result,{locale:'ja'});
const chart=reading.chartInterpretation;

assert.equal(chart.schemaId,'koyomi-bazi-chart-interpretation');
for(const id of ['pillar-year','pillar-month','pillar-day','pillar-hour','element-balance','relations']){
  assert.ok(chart.items.some(item=>item.id===id),`${id} interpretation must exist`);
}
assert.ok(chart.items.every(item=>item.reading&&item.meaning&&item.evidence.length),'each chart item must explain reading, meaning and evidence');
assert.equal(chart.sourcePolicy.noNewDivinationCalculation,true);
assert.deepEqual(reading.mitsunomeInput.chartInterpretation,chart);

const context={globalThis:null};context.globalThis=context;
vm.runInNewContext(await readFile('src/persona/sister-renderer.js','utf8'),context);
const text=context.KOYOMI_PERSONA_RENDERER.render({
  system:'四柱推命の命式',opening:chart.introduction,axis:'命式を読むわよ。',result:chart.conclusion,
  analysis:chart.items,evidence:chart.evidence,closing:chart.closing,
  order:['opening','result','analysis','evidence','closing']
});
assert.ok(text.includes('姐さんが読むわ'));
assert.ok(text.includes('姐さんからの宿題'));
assert.ok(text.includes('現実ではね'));
assert.ok(text.includes('【年柱'));
assert.ok(text.includes('【五行の配分】'));
assert.ok(text.includes('【柱同士の関係】'));

const unknown=calculateBazi({
  displayName:'時刻不明確認',
  birthData:{date:'1980-02-05',time:'',timeUnknown:true,place:{timeZone:'Asia/Tokyo',utcOffset:9,latitude:36.7419,longitude:138.3694}}
});
const unknownHour=buildBaziReading(unknown,{locale:'ja'}).chartInterpretation.items.find(item=>item.id==='pillar-hour');
assert.match(unknownHour.reading,/出生時刻が不明/);

console.log('Bazi chart interpretation and sister renderer connection passed');
