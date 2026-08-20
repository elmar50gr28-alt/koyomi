import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile('src/reading/output-quality-guard.js','utf8'),context={};context.globalThis=context;vm.runInNewContext(source,context);
const guard=context.KOYOMI_OUTPUT_QUALITY;
const raw='第10室は仕事の領域です。誰が・何を・いつまでに、の三点を一行にしなさい。休みなさい。第10室は仕事の領域です。undefined';
const fixed=guard.process(raw,{generalizeAstrology:true});
assert.match(fixed.text,/仕事上の立場や社会で目指す姿/);
assert.doesNotMatch(fixed.text,/第10室|領域|誰が・何を・いつまで|しなさい|undefined/);
assert.equal((fixed.text.match(/仕事上の立場や社会で目指す姿/g)||[]).length,1);
assert.equal(fixed.quality.pass,true,JSON.stringify(fixed.quality));

for(let i=0;i<90;i++){
 const house=i%12+1,text=`第${house}室が中心です。確認しなさい。確認しなさい。${i%3===0?'null':''}`;
 const result=guard.process(text,{generalizeAstrology:true});
 assert.equal(result.quality.metrics.duplicates,0,`duplicate case ${i}`);
 assert.ok(result.quality.metrics.commands<=1,`command case ${i}`);
 assert.equal(result.quality.metrics.broken,0,`broken case ${i}`);
 assert.doesNotMatch(result.text,/第(?:[1-9]|1[0-2])室/);
}

context.buildPersonal=()=>({reading:raw,divinations:{astrology:raw,other:'同じ助言です。同じ助言です。'}});
assert.equal(guard.install(),true);
const personal=context.buildPersonal();
assert.doesNotMatch(personal.reading,/第10室|誰が・何を・いつまで|undefined/);
assert.equal(personal.outputQuality.metrics.broken,0);

const app=await readFile('app.html','utf8'),worker=await readFile('service-worker.js','utf8'),western=await readFile('src/astrology/western-reading-v1.js','utf8');
assert.ok(app.includes('./src/reading/output-quality-guard.js'));
assert.ok(worker.includes("'./src/reading/output-quality-guard.js'"));
assert.ok(western.includes('generalizeAstrology:true'));
assert.ok(western.includes('out.quality=guard.audit'));
const finalGenerator=app.indexOf('const v191zBuildPersonalBase=buildPersonal');
const liveHook=app.indexOf('const v191qFinalBuildPersonalBase=buildPersonal');
assert.ok(liveHook>finalGenerator,'quality guard must wrap the real final in-page generator');
assert.ok(app.includes("c.reading=guard.process(c.reading,{generalizeAstrology:true}).text"));
assert.ok(app.includes('西洋占星術 本鑑定（生まれた時の星と現在の流れ）'));
assert.ok(app.includes('<summary>専門データを見る</summary>'));
const westernContext={};westernContext.globalThis=westernContext;vm.runInNewContext(source,westernContext);vm.runInNewContext(western,westernContext);
const westernReading=westernContext.WesternReadingV1.build({natal:{placements:{太陽:{sign:'牡羊座',degree:4,house:10},月:{sign:'蟹座',degree:2,house:4}},aspects:[]},dignities:{ascSign:'天秤座',chartRuler:'金星'},transits:{highlights:[],periodDays:31},patterns:{items:[]}});
assert.doesNotMatch([westernReading.summary,...Object.values(westernReading.sections)].join('\n'),/第(?:[1-9]|1[0-2])室|ASC|MC|チャートルーラー|トランジット/);
assert.match(westernReading.summary,/仕事上の立場や社会で目指す姿/);
assert.ok(western.includes('x.house'), 'expert calculation must remain available to the specialist renderer');
console.log('Output language quality guard passed: 90 corpus cases');
