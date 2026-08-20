import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const context={};
vm.runInNewContext(await readFile('src/reading/meaning-evidence-translator.js','utf8'),context);
const translator=context.KOYOMI_MEANING_EVIDENCE;
const forbidden=/四柱推命|宿曜|九星|西洋占星術|タロット|ルーン|大運|流年|日主|用神|五行|トランジット|逆位置|正位置|\d+点/;
for(const domain of ['overall','work','money','relationship','health','timing','identity'])for(const state of ['forward','test','protect'])for(const contradiction of [false,true]){
  const lines=translator.translate({domain,state,score:state==='forward'?78:state==='protect'?32:55,contradiction,evidence:[{system:'四柱推命',text:'大運76'},{system:'タロット',text:'逆位置'}]});
  assert.ok(lines.length>=3,`${domain}/${state} needs a conclusion, meaning, and action`);
  assert.equal(translator.assertPublic(lines),true);
  assert.doesNotMatch(lines.join(' '),forbidden);
  assert.match(lines.at(-1),/ください/);
}
assert.equal(translator.containsForbidden('四柱推命：大運76'),true);
assert.equal(translator.containsForbidden('今日は小さく試してください'),false);
const app=await readFile('app.html','utf8');
assert.ok(app.includes('if(r?.meaningEvidence?.length)return r.meaningEvidence.slice(0,4)'));
assert.ok(!app.includes('judgment.evidence.map(item=>`${item.system}：${item.text}`)'));
assert.ok(app.includes("evidence:requestedLevel==='detailed'?method.factors:publicEvidence"));
assert.ok(app.includes("level:requestedLevel==='detailed'?'detailed':'beginner'"));
assert.ok(app.includes("system:requestedLevel==='detailed'?(V191Z_METHOD_LABEL[key]||key):'今日の流れ'"));
console.log('Meaning evidence translator passed');
