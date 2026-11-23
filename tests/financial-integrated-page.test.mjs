import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as bazi from '../src/bazi/index.js';
const read=p=>fs.readFileSync(p,'utf8');
const context={Date,console};context.window=context;
for(const p of ['src/reading/integrated-judgment-core.js','src/reading/meaning-evidence-translator.js','src/reading/app-narrative-engine.js','src/reading/method-interpretation.js','src/persona/conversation-adapter.js','src/financial/integrated-page.js'])vm.runInNewContext(read(p),context,{filename:p});
const api=context.KOYOMI_FINANCIAL_PAGE;
const verdict=api.directVerdict;
assert.equal(verdict({scoreAvailable:true,state:'forward',contradiction:false},'income').label,'吉');
assert.equal(verdict({scoreAvailable:true,state:'protect',contradiction:false},'income').label,'凶');
assert.equal(verdict({scoreAvailable:true,state:'test',contradiction:true},'purchase').label,'半吉半凶');
assert.match(verdict({scoreAvailable:true,state:'protect'},'purchase').title,/見送れ/);
assert.equal(verdict({scoreAvailable:false,state:'protect'},'income').label,'保留');
const fields=Object.fromEntries(['theme','qFocus','question','memo','consultation','qMethodPriority'].map(id=>[id,{id,value:'original-'+id}]));
const before=JSON.stringify(fields);let date=new Date('2026-01-01T12:00:00'),original=date;
const document={getElementById:id=>fields[id]};
const bridge={document,getDate:()=>date,setDate:value=>date=value,calculate:()=>{
 assert.equal(fields.theme.value,'money');assert.equal(fields.qFocus.value,'income');assert.equal(fields.memo.value,'');assert.equal(date.getMonth(),10);return 'result';
}};
assert.equal(api.withInputs(bridge,'income','2026-11-22'),'result');
assert.equal(JSON.stringify(fields),before);assert.equal(date,original);
assert.throws(()=>api.withInputs({...bridge,calculate:()=>{throw Error('failure')}},'income','2026-11-22'),/failure/);
assert.equal(JSON.stringify(fields),before);assert.equal(date,original);
for(const focus of ['__proto__','overall','love'])assert.throws(()=>api.withInputs(bridge,focus,'2026-11-22'));
for(const value of ['2026-02-30','bad','2026-2-1'])assert.throws(()=>api.withInputs(bridge,'income',value));
const profile={displayName:'財運テスト',personId:'test-finance',gender:'female',birthData:{date:'1990-06-15',time:'08:20',place:{longitude:135,latitude:35,utcOffset:9}}};
const methods=[{key:'astrology',label:'西洋占星術',available:true,score:60,conf:{score:70},factors:['太陽の位置を確認']},{key:'name',label:'姓名判断',available:false,conf:{available:false},factors:[]}];
const judgment=context.KOYOMI_INTEGRATED_JUDGMENT.build({domain:'income',signals:methods.map(m=>({...m,id:m.key,confidence:m.conf}))});
const pack={legacy:{divinations:{astrology:'元の鑑定'}},methods,judgment,profile};
for(const focus of ['income','purchase']){
 const reading=api.createReading(pack,bazi,focus,'2026-11-22');
 assert.ok(reading.finance.beginnerSummary.length>0);
 assert.ok(reading.finance.action.length>0);
 assert.equal(reading.views[0].available,true);assert.ok(reading.views[0].text.length>0);
 assert.equal(reading.views[1].available,false);assert.match(reading.views[1].text,/判定を保留/);
 assert.ok(judgment.withheldSystems.includes('姓名判断'));
}
const unknown=api.createReading({...pack,profile:{...profile,birthData:{...profile.birthData,time:'',timeUnknown:true}}},bazi,'income','2026-11-22');
assert.equal(unknown.timeUnknown,true);
const app=read('app.html'),home=read('index.html'),worker=read('service-worker.js');
assert.match(home,/href="app.html#financial"/);
assert.match(app,/id="page-financial"/);
assert.match(app,/KOYOMI_FINANCIAL_PAGE\?\.mount/);
assert.match(app,/v202IntegratedJudgment\(legacy\)/);
assert.match(app,/v191zMethodScore\(key,legacy\)/);
assert.match(worker,/'\.\/src\/financial\/integrated-page.js'/);
assert.match(worker,/'\.\/src\/financial\/integrated-page.css'/);
assert.match(read('financial.html'),/href="app.html#financial"/);
const router={};vm.runInNewContext(read('src/shared/menu-routing-core.js'),router);
assert.equal(router.KOYOMI_MENU_ROUTING_CORE.resolveHash('#financial'),'financial');
console.log('Integrated financial page: existing Bazi/adapter, withheld systems, unknown birth time, restored inputs/date, routes and offline assets passed');
// Exercise the form lifecycle, missing-profile guidance, failures and stale results.
class Element{
 constructor(id=''){this.id=id;this.dataset={};this.listeners={};this.children=[];this.textContent='';this.value='';this.hidden=false;this.disabled=false;}
 addEventListener(name,fn){this.listeners[name]=fn;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
}
const ids=Object.fromEntries(['financialReadingForm','financialReadingDate','financialReadingFocus','financialReadingResult','financialReadingStatus','financialReadingSubmit'].map(id=>[id,new Element(id)]));
const uiDocument={getElementById:id=>ids[id],createElement:()=>new Element()};
let ready=false,failing=false,release;
let pending=null;
api.mount({document:uiDocument,prepare:async()=>ready,calculate:()=>{if(failing)throw Error('再試行できます');return pack;},loadBazi:async()=>{if(pending)await pending;return bazi;}});
ids.financialReadingFocus.value='income';ids.financialReadingDate.value='2026-11-22';
const submit=()=>ids.financialReadingForm.listeners.submit({preventDefault(){}});
await submit();assert.match(ids.financialReadingStatus.textContent,/プロフィール/);assert.equal(ids.financialReadingSubmit.disabled,false);
ready=true;await submit();assert.equal(ids.financialReadingResult.hidden,false);assert.ok(ids.financialReadingResult.children.length>=5);
assert.match(ids.financialReadingResult.children[2].children[1].textContent,/金運は/);
ids.financialReadingForm.listeners.input();assert.equal(ids.financialReadingResult.hidden,true);assert.equal(ids.financialReadingResult.children.length,0);
failing=true;await submit();assert.equal(ids.financialReadingResult.hidden,true);assert.match(ids.financialReadingStatus.textContent,/再試行/);assert.equal(ids.financialReadingSubmit.disabled,false);
failing=false;pending=new Promise(resolve=>release=resolve);const waiting=submit();await Promise.resolve();await Promise.resolve();ids.financialReadingDate.value='2026-11-23';release();await waiting;
assert.equal(ids.financialReadingResult.hidden,true,'a changed date must not display stale results');assert.equal(ids.financialReadingSubmit.disabled,false);
console.log('Financial UI: initial setup, successful result, input invalidation, retry and stale async results passed');
