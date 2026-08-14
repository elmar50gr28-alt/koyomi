import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={};
for(const file of ['sister-renderer.js','reading-structure-planner.js','conversation-adapter.js'])vm.runInNewContext(await readFile(`src/persona/${file}`,'utf8'),context);
const adapter=context.KOYOMI_PERSONA_ADAPTER;
const systems=['四柱推命','宿曜','九星気学','西洋占星術','タロット','ルーン','姓名判断','数秘術','カバラ','六星周期','大運・暦'];
const oldHeadings=['現実に出やすい形','まず、これをおやりなさい','ここで止まりなさい','あとで確かめること','根拠はここよ'];
const count=(texts,term)=>texts.filter(text=>text.includes(`【${term}】`)).length;
const texts=[],structures=new Set();
for(let day=0;day<90;day++){
 const result=adapter.applyDivination('【鑑定結果】\n算出済みの専門資料。',{system:systems[day%systems.length],score:30+(day*17)%61,variant:day,evidence:[`根拠 ${day%9}`,`補助 ${day%7}`],action:['返事を読む','予定を整える','体を休める','相手に尋ねる','案を試す'][day%5]});
 texts.push(result.text);structures.add(result.structure.structureId);
 assert.ok(result.text.includes(`根拠 ${day%9}`)||result.text.includes('算出済みの専門資料'),'evidence must remain available');
}
assert.ok(structures.size>=10,`expected at least 10 structures, got ${structures.size}`);
for(const heading of oldHeadings)assert.ok(count(texts,heading)<=36,`${heading} remained too frequent: ${count(texts,heading)}/90`);
assert.equal(adapter.applyDivination('資料',{system:'タロット',score:55,variant:12,evidence:['同じ根拠']}).text,adapter.applyDivination('資料',{system:'タロット',score:55,variant:12,evidence:['同じ根拠']}).text,'same input must stay deterministic');
console.log(JSON.stringify({sampleSize:texts.length,oldModel:{structures:1,fixedHeadingRate:'100%'},newModel:{structures:structures.size,fixedHeadings:Object.fromEntries(oldHeadings.map(h=>[h,`${count(texts,h)}/90`]))}},null,2));
