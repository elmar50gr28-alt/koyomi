import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync('app.html','utf8');
let history=[{id:'legacy',key:'same',reading:'old reading',unknown:{keep:true}},
 {id:'previous',key:'same',calculationVersion:'previous',reading:'previous reading'}];
const originals=structuredClone(history);
const context=vm.createContext({Date,Object,JSON,KoyomiQimenHistory:null,
 storageJson:()=>history,storageSet:(_area,_key,value)=>history=JSON.parse(value),
 qmdjHistoryKey:()=> 'same',qmdjFormatDateTime:()=> 'time',
 qmdjRenderHistory:()=>{},toast:()=>{},QMDJ_HISTORY:'qmdj_history_v193',
 QMDJ_LAST:{input:{location:'test',question:'test',purpose:{label:'general'}},
 chart:{raw:0,usedDate:0,method:'test',dun:'陽遁',ju:1,dp:{text:'甲子'},hp:{text:'甲子'},valueStar:'天蓬',valueDoor:'休門'},
 ev:{rank:{label:'test'},overall:50,best:{dir:'北'},scored:{}},text:{bestRange:'test',reading:'new reading'}}});
vm.runInContext(readFileSync('src/shared/qimen-history-core.js','utf8'),context);
vm.runInContext(app.match(/^function qmdjSaveCurrent\(\).*$/m)[0],context);
vm.runInContext('qmdjSaveCurrent()',context);
assert.equal(history.length,3);
assert.equal(history[0].calculationVersion,context.KoyomiQimenHistory.VERSION);
assert.deepEqual(history.slice(1),originals);
vm.runInContext('qmdjSaveCurrent()',context);
assert.equal(history.length,3,'same-version repeat replaces only its own snapshot');
assert.deepEqual(history.slice(1),originals);
const core=context.KoyomiQimenHistory;
const mixed=Array.from({length:100},(_,i)=>({id:i,key:String(i)}));
assert.equal(core.save(mixed,{key:'new',calculationVersion:core.VERSION}).length,100);
assert.equal(core.save([{key:'same'}],{key:'same'}).length,2,'unversioned records must never erase another legacy record');
assert.ok(app.includes('<script src="./src/shared/qimen-history-core.js"></script>'));
assert.ok(readFileSync('service-worker.js','utf8').includes("'./src/shared/qimen-history-core.js'"));
console.log('Qimen saved-reading version preservation passed');

const list={innerHTML:''};
context.$=()=>list;
context.$$=()=>[];
vm.runInContext(app.match(/^function qmdjRenderHistory\(\).*$/m)[0],context);
vm.runInContext(app.match(/^function qmdjEscape\(.*$/m)[0],context);
const beforeRender=JSON.stringify(history);
vm.runInContext('qmdjRenderHistory()',context);
assert.ok(list.innerHTML.includes('現在と同じ計算方式で保存'));
assert.ok(list.innerHTML.includes('異なる計算方式で保存'));
assert.ok(list.innerHTML.includes('計算方式の記録がない鑑定'));
assert.equal(JSON.stringify(history),beforeRender,'rendering must never rewrite saved readings');
history=[{id:'unsafe',calculationVersion:'<img src=x onerror=alert(1)>',reading:'saved'}];
vm.runInContext('qmdjRenderHistory()',context);
assert.ok(!list.innerHTML.includes('<img'),'unknown version must not become HTML');
assert.equal(core.versionLabel({calculationVersion:' '}),'計算方式の記録がない鑑定');
history=[];
vm.runInContext('qmdjRenderHistory()',context);
assert.ok(list.innerHTML.includes('保存された奇門鑑定はありません'));
console.log('Qimen history version presentation passed');
