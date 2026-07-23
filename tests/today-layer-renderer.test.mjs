import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const context={};
vm.runInNewContext(await readFile('src/ui/today-layer-renderer.js','utf8'),context);
const renderer=context.KOYOMI_TODAY_LAYER_RENDERER;
const stem=(kanji,element,yinYang='yang')=>({kanji,element,yinYang});
const branch=kanji=>({kanji,hiddenStems:[{stem:{kanji:'甲'}}]});
const pillar=(a,b,element='wood')=>({stem:stem(a,element),branch:branch(b)});
const result={
 chart:{pillars:{year:pillar('甲','子'),month:pillar('乙','丑'),day:pillar('丙','寅','fire'),hour:pillar('丁','卯','fire')},elementBalance:[{element:'wood',value:4},{element:'fire',value:2}]},
 luckCycles:{cycles:[{pillar:pillar('戊','辰','earth'),startAge:5,endAge:14}],annual:[{pillar:pillar('己','巳','earth')}],monthly:[{pillar:pillar('庚','午','metal')}]}
};
const data=renderer.fromBaziResult(result,'2026-07-23');
assert.equal(data.dayPillar.stem,'丙');
assert.equal(data.dayPillar.hidden,'甲');
assert.equal(data.fiveElements.wood,100);
assert.equal(renderer.build(data,'basic').groups.includes('arms'),false);
assert.equal(renderer.build(data,'expert').groups.includes('arms'),true);
const flow=renderer.build(data,'flow');
assert.equal(flow.periods.length,3);
assert.equal(JSON.stringify(flow.facts.map(x=>x.label)),JSON.stringify(['大運','歳運','月運']));
assert.equal(renderer.build(data,'qimen').implemented,false);
assert.match(renderer.build(data,'qimen').message,/仕様の確定後/);

const today=await readFile('today.html','utf8');
const app=await readFile('app.html','utf8');
const worker=await readFile('service-worker.js','utf8');
assert.ok(today.includes('id="luckLayer"'));
assert.ok(today.includes('function renderLayer'));
assert.ok(today.includes("sessionStorage.getItem('koyomi.today-layer.v1')"));
assert.ok(app.includes("sessionStorage.setItem('koyomi.today-layer.v1'"));
assert.ok(worker.includes("'./src/ui/today-layer-renderer.js'"));
console.log('Today layer renderer passed');
