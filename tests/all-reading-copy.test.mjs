import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { calculateBazi, buildBaziReading, buildCommonReading } from '../src/bazi/index.js';
import { setCommonReadingThemes } from '../src/reading/index.js';
import { describeMonthlyIndex } from '../src/mundane/western/monthly-trend-core.js';

const app = await readFile('app.html', 'utf8');
for (const path of ['app.html','today.html','src/persona/sister-renderer.js','src/persona/sister-lexicon.js','src/persona/reading-structure-planner.js','src/persona/persona-policy.js','src/persona/conversation-adapter.js','src/bazi/reading/chart-interpretation.js','src/shared/qimen-history-core.js']) {
  const decoded=(await readFile(path,'utf8')).replace(/\\u([0-9a-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
  assert.doesNotMatch(decoded,/ミツノメ|みつのめ|姐さん|姉さん|アンタ|アタシ|三つ目|あなたね、|ハイヒール/, 'character-free templates, including escaped labels: '+path);
}
for (const id of ['oracleModeSetting','qmMode']) {
  const options=app.match(new RegExp('<select id="'+id+'">([\\s\\S]*?)</select>'))[1];
  assert.ok(options.includes('<option value="sister">やさしく伝える</option>'));
  assert.ok(options.includes('<option value="zubat">はっきり伝える</option>'));
}
for (const key of ['mitsunome_v191_complete','mitsunome_qimen_history_v193','mitsunome_v194_destiny_ledger','MITSUNOME_ENCRYPTED_BACKUP','MITSUNOME_v300 Foundation_LEDGER']) assert.ok(app.includes(key),'existing data contract: '+key);
assert.ok(!app.includes('${v196Feel(g.context.score)}／今日の宿題：${g.life.homework}'), 'result note must not reattach a separate fixed homework');
const themes = JSON.parse(await readFile('data/reading/common_reading_themes.json', 'utf8'));
setCommonReadingThemes(themes);
const micro = /小さく(?:試|始|動|進|実行)|小さな(?:一歩|試行|実行)|最小の一手|一件だけ|一つだけ|\d+分(?:だけ|試|実行)|十五分で終わる/;
function check(text, name) {
  assert.doesNotMatch(String(text), micro, name);
  assert.doesNotMatch(String(text), /ミツノメ|みつのめ|姐さん|姉さん|アンタ|アタシ|三つ目|あなたね、|ハイヒール/, 'character-free generated reading: '+name);
  assert.doesNotMatch(String(text), /PLACEHOLDER|undefined|ことこと|するのが正解/);
}
function part(start, end) {
  const index=app.indexOf(start); assert.ok(index>=0,start);
  const last=app.indexOf(end,index); assert.ok(last>index,end);
  return app.slice(index,last);
}
function line(name) {
  const index=app.indexOf('function '+name+'('); assert.ok(index>=0,name);
  return app.slice(index,app.indexOf('\n',index));
}
const helper={pad:value=>String(value).padStart(2,'0')};
vm.createContext(helper);
vm.runInContext(line('v191zGrade')+'\n'+line('v191rThemeHouses')+'\n'+part('function v191sElementAction(', 'function v191sPersonaOpening(')+'\n'+line('v191zThemePlan')+'\n'+line('v191zMethodPlan'),helper);
vm.runInContext(part('const V191Z_METHOD_LABEL=', 'function v191zMode('),helper);
vm.runInContext('globalThis.methodLabels=V191Z_METHOD_LABEL',helper);
const keys=Object.keys(helper.methodLabels);
assert.equal(keys.length,11);
const files=['sister-lexicon.js','sister-renderer.js','reading-structure-planner.js','persona-policy.js','beginner-explainer.js','conversation-adapter.js'];
const contexts=[];
for(const commonEngine of [false,true]) {
  const context={Math:Object.assign(Object.create(Math),{random(){throw Error('random is forbidden');}})};
  vm.createContext(context);
  for(const file of files)vm.runInContext(await readFile('src/persona/'+file,'utf8'),context);
  if(commonEngine) for(const file of ['app-narrative-engine.js','universal-reading-engine.js','adaptive-narrative-engine.js'])vm.runInContext(await readFile('src/reading/'+file,'utf8'),context);
  contexts.push({context,commonEngine});
}
const samples=[], metrics=[];
let methodCases=0;
for(const {context,commonEngine} of contexts)for(const key of keys) {
  const system=helper.methodLabels[key];
  for(const level of ['beginner','standard','detailed'])for(const mode of ['sister','zubat']) {
    const history=[],actions=new Set();
    for(let day=1;day<=30;day++) {
      const score=[0,34,45,60,66,68,70,71,72,90][(day-1)%10],date=new Date(Date.UTC(2026,0,day)).toISOString().slice(0,10);
      const frame={use:{useful:['木','火','土','金','水'][day%5]},i:{qFocus:['career','relationship','purchase','healthrhythm','choice'][day%5],theme:['work','love','money','health','decision'][day%5],qResource:['information','support','energy','confidence','time'][day%5],decisionDeadline:'',name:'検証用'},tarot:Array.from({length:10},()=>({name:'愚者',meaning:'新しい計画と準備'})),runes:[{name:'フェフ'},{name:'ウルズ'},{name:'アンスズ',meaning:'伝えたいことと相手の意向'}]};
      const action=helper.v191zMethodPlan(key,frame)[0];
      const input={system,domain:frame.i.theme,score,level,mode,date,variant:day,evidence:['入力条件を確認済み'],action,history};
      const source='【算出済みの資料】\n'+system+'の検証用資料。';
      const reading=context.KOYOMI_PERSONA_ADAPTER.applyDivination(source,input);
      check(reading.text,system+'/'+level+'/'+mode+'/'+date);
      assert.equal(reading.scenario.state,score>=68?'前進':score<45?'防御':'試行');
      assert.equal(reading.scenario.action,action,'a supplied action must not gain an unrelated timer task');
      assert.equal(reading.text.includes('【詳しい鑑定資料】'),commonEngine?level==='detailed':level!=='beginner');
      if(commonEngine){assert.equal(reading.narrative.quality.pass,true,system+': '+reading.narrative.quality.issues);assert.ok(!/【見直す時】\n\d+日に、/.test(reading.text),'review intervals are rendered as days later, not a calendar day');}
      assert.equal(context.KOYOMI_PERSONA_ADAPTER.applyDivination(source,input).text,reading.text);
      if(!commonEngine&&level==='beginner')assert.ok(!reading.text.includes('これだけを10分'));
      actions.add(action); history.unshift({narrative:reading.narrative||{structure:reading.structure?.structureId}}); methodCases++;
      if(day===4&&level==='standard'&&mode==='sister')samples.push({system,path:commonEngine?'共通生成':'代替表示',text:reading.text});
    }
    metrics.push({system,path:commonEngine?'common':'fallback',level,mode,days:30,distinctActions:actions.size});
  }
  for(const state of ['constructor','toString','__proto__']) {
    const result=context.KOYOMI_PERSONA_ADAPTER.applyDivination('判定済み資料',{system,score:55,state});
    assert.equal(result.persona.state,'test');assert.equal(result.scenario.state,'試行');check(result.text,'unknown state fallback');
  }
  const controlled=context.KOYOMI_PERSONA_ADAPTER.applyDivination('判定済み資料',{system,domain:'work',score:70,state:'test'});
  assert.equal(controlled.persona.state,'test');
  assert.equal(controlled.scenario.state,'試行','an explicit computed state wins over a default score threshold');
  for(const psychRisk of [70,74,95]) {
    const dangerous=context.KOYOMI_PERSONA_ADAPTER.applyDivination('安全確認用資料',{system,domain:'relationship',score:90,psychRisk,level:'standard'});
    assert.equal(dangerous.persona.serious,true);
    assert.equal(dangerous.persona.state,'protect');
    assert.equal(dangerous.scenario.state,'防御');
    assert.equal(dangerous.persona.aside,'');
    if(commonEngine){assert.equal(context.KOYOMI_APP_NARRATIVE.frame({score:90,risk:psychRisk,serious:true}).direction,'protect');assert.doesNotMatch(dangerous.text,/相手と話す機会を作りましょう/);}
  }

}

const standaloneFallback={};
vm.createContext(standaloneFallback);
vm.runInContext(await readFile('src/reading/adaptive-narrative-engine.js','utf8'),standaloneFallback);
standaloneFallback.KOYOMI_ADAPTIVE_NARRATIVE.register(JSON.parse(await readFile('data/reading/adaptive_narrative_catalog.json','utf8')));
let fallbackCases=0;
for(const domain of ['work','money','relationship','health','overall'])for(let day=1;day<=30;day++) {
  const result=standaloneFallback.KOYOMI_ADAPTIVE_NARRATIVE.compose({domain,score:[0,40,60,85][day%4],date:'2026-01-'+String(day).padStart(2,'0'),seed:domain+day});
  check(result.text,'単独の代替生成');assert.equal(result.meta.quality.pass,true);fallbackCases++;
}
for(const risk of [70,74,95]) {
  const result=standaloneFallback.KOYOMI_ADAPTIVE_NARRATIVE.compose({domain:'relationship',state:'forward',score:90,risk,seed:'risk'+risk});
  assert.equal(result.meta.state,'protect');assert.equal(result.meta.structure,'protect');
}

let baziCases=0;
for(let index=0;index<30;index++) {
  const result=calculateBazi({displayName:'専用本文検証',birthData:{date:(1970+index)+'-06-15',time:'08:20',timeUnknown:index%3===0,place:{longitude:135,latitude:35,utcOffset:9,timezone:'Asia/Tokyo'}}});
  const saved=JSON.stringify(result);
  const reading=buildBaziReading(result,{locale:'ja'});
  check(JSON.stringify(reading),'四柱専用本文');
  assert.doesNotMatch(JSON.stringify(buildBaziReading(result,{locale:'en'})),/small (?:steps|repeatable|action)/);
  for(const tone of ['standard','mitsunome'])for(const question of ['いつ転職できますか','買うべきか迷っています','疲れが続く理由を知りたい'])check(JSON.stringify(buildCommonReading(result,{tone,question})),'共通テーマ・具体回答');
  assert.equal(JSON.stringify(result),saved,'copy generation cannot change calculated facts'); baziCases++;
}

let surfaceCases=0;
const common=contexts.find(item=>item.commonEngine).context;
for(const surface of ['personal','compatibility','today','oracle','qimen','mundane'])for(const mode of ['sister','zubat'])for(let day=1;day<=30;day++) {
  const reading=common.KOYOMI_APP_NARRATIVE.compose({surface,domain:['work','money','relationship','health','timing'][day%5],score:[0,40,60,85][day%4],seed:surface+mode+day,variant:day});
  check(reading.text,surface+'/'+mode);assert.equal(reading.meta.quality.pass,true);surfaceCases++;
}

helper.v191zMode=()=>helper.mode;
vm.runInContext(line('v192StandaloneMesoReading')+'\n'+line('v192StandaloneOnkanReading'),helper);
let oracleCases=0;
for(const mode of ['sister','zubat'])for(let day=1;day<=30;day++) {
  helper.mode=mode;const score=[0,40,60,85][day%4],grade=helper.v191zGrade(score);
  const meso={score,grade,md:{full:'検証用復元暦',month:{season:'季節のテーマ',theme:'準備と連絡',action:'必要な段取りと連絡する内容を確認する'}},signals:['復元モデルの条件']};
  const onkan={score,grade,core:1,coreInfo:['役割の説明'],stagnant:2,opening:3,openingInfo:['伝えたい内容を整理する'],shape:'検証用形状',dir:'検証用方向',confidence:70};
  for(const text of [helper.v192StandaloneMesoReading(meso),helper.v192StandaloneOnkanReading(onkan)]){check(text,'古代神託');oracleCases++;}
}

vm.runInContext(part('const QMDJ_RANKS=', 'const QMDJ_PURPOSE_GROUPS=')+'\n'+line('qmdjRank')+'\n'+part('function qmdjGenerateReading(', 'function qmdjDuplicate('),helper);
const purposeStart=app.indexOf('const QMDJ_PURPOSE_GROUPS=');
vm.runInContext(app.slice(purposeStart,app.indexOf('\n};',purposeStart)+4)+';globalThis.realPurposes=QMDJ_PURPOSE_GROUPS;',helper);
helper.QMDJ_DOORS={開門:{good:['相談','連絡'],bad:['強行']},死門:{good:['整理'],bad:['即断']}};
let qimenCases=0;
for(const mode of ['sister','zubat'])for(const purposeKey of ['work','medical','rest'])for(let day=1;day<=30;day++) {
  const score=[0,34,47,48,60,72,90][day%7],rank=helper.qmdjRank(score);
  const best={dir:'北',door:'開門',star:'天心',deity:'六合',heaven:'甲',earth:'乙',parts:[{value:3,label:'検証用加点'}]};
  const worst={...best,dir:'南',door:'死門',parts:[{value:-3,label:'検証用減点'}]};
  const ev={overall:score,rank,best,second:best,worst,purpose:{...helper.realPurposes[purposeKey],key:purposeKey,label:purposeKey==='medical'?'通院・相談':purposeKey==='rest'?'休息':'仕事'},chart:{method:'検証用モデル',term:{name:'立春'},yuan:{label:'上元'},dun:'陽遁',ju:1,valueStar:'天心',valueDoor:'開門'},metrics:{'対人抵抗の低さ':60,'速度':50,'継続性':55,'金銭安全度':50,'逆転余地':45}};
  const slots=[8,10,12].map((hour,index)=>({start:new Date(2026,0,day,hour),end:new Date(2026,0,day,hour+2),ev:{overall:Math.max(0,score-index),rank:helper.qmdjRank(Math.max(0,score-index))}}));
  const reading=helper.qmdjGenerateReading(ev,slots,{mode});check(reading.reading,'奇門本文');
  const action=reading.reading.split('【今日の具体的な一手】')[1];
  assert.ok(action);assert.ok(!action.includes('24時間以内'));
  if(score<48){assert.match(action,/延期|急がず/);assert.ok(!action.includes('実行する場合は'));if(['medical','rest'].includes(purposeKey))assert.match(action,/受診や休息.*遅らせない/);}
  qimenCases++;
}
for(const score of [0,45,60,85])check(JSON.stringify(describeMonthlyIndex(score,score,0)),'世俗占星術・月間傾向');

const sources=['src/reading/app-narrative-engine.js','src/reading/daily/daily-reading-core.js','src/reading/universal-reading-engine.js','src/astrology/western-reading-v1.js','app.html','today.html','src/persona/persona-policy.js','src/persona/conversation-adapter.js','src/persona/beginner-explainer.js','src/persona/sister-lexicon.js','src/persona/sister-renderer.js','src/reading/adaptive-narrative-engine.js','src/reading/meaning-evidence-translator.js','src/reading/concrete-answer-composer.js','src/bazi/reading/index.js','src/bazi/reading/chart-interpretation.js','data/reading/common_reading_themes.json','data/reading/adaptive_narrative_catalog.json','src/mundane/western/monthly-trend-core.js','src/mundane/western/browser-global.js'];
for(const directory of ['src/reading','src/reading/daily','src/persona','src/bazi/reading'])for(const entry of await readdir(directory,{withFileTypes:true})){const path=directory+'/'+entry.name;if(entry.isFile()&&entry.name.endsWith('.js')&&!sources.includes(path))sources.push(path);}
for(const path of sources)assert.doesNotMatch(await readFile(path,'utf8'),/小さく試|小さく始め|小さく動|小さく進|小さな試行|最小の一手|一件だけ|\d+分だけ|最初の15分|十五分で終わる|これだけを10分/,'source: '+path);
const report={methodCases,fallbackCases,baziCases,surfaceCases,oracleCases,qimenCases,sourceCount:sources.length,metrics,samples,scope:'Generated copy uses synthetic consultation/calculation frames; Bazi also uses calculated fixtures. No claim that every possible input has been linguistically verified.'};
if(process.env.KOYOMI_COPY_REPORT)await writeFile(process.env.KOYOMI_COPY_REPORT,JSON.stringify(report,null,2));
console.log('All reading copy: ok '+JSON.stringify({methodCases,fallbackCases,baziCases,surfaceCases,oracleCases,qimenCases,sourceCount:sources.length}));
