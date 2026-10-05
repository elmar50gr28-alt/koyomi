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

const now=Date.now(), recent={key:'same',savedAt:now-1,calculationVersion:core.VERSION};
vm.runInContext(app.match(/^function qmdjDuplicate\(.*$/m)[0],context);
history=[{...recent,calculationVersion:'previous'},{key:'same',savedAt:now-1}];
assert.equal(vm.runInContext('qmdjDuplicate({})',context),undefined,'old and legacy readings must not trigger repeat warning');
history.push(recent);
assert.equal(vm.runInContext('qmdjDuplicate({})',context),recent,'current same-input repeat still warns');
assert.equal(core.recentDuplicate([recent],'different',now),undefined);
assert.equal(core.recentDuplicate([{...recent,savedAt:now-30*60000}],'same',now),undefined,'30-minute boundary excluded');
assert.equal(core.recentDuplicate([{...recent,savedAt:now-30*60000+1}],'same',now).key,'same');
for(const savedAt of [now+1,NaN,undefined,'yesterday'])
 assert.equal(core.recentDuplicate([{...recent,savedAt}],'same',now),undefined,'invalid/future timestamps excluded');
console.log('Qimen repeat warning version and time boundaries passed');

const input={date:new Date('2026-06-21T08:24:00Z'),purpose:{key:'general'},question:'test',location:'Tokyo',lat:35.6812,lon:139.7671,basis:'local',school:'chaibu',tz:9,boundary:23,mode:'sister',situation:'normal'};
vm.runInContext(app.match(/^function qmdjHistoryKey\(.*$/m)[0],context);
context.keyInput=input;
const key=vm.runInContext('qmdjHistoryKey(keyInput)',context);
assert.equal(key,core.inputKey({...input,date:new Date(input.date)}),'identical conditions remain identical');
for(const change of [{date:new Date(input.date.getTime()+60000)},{boundary:0},{mode:'zubat'},{situation:'changed'},{lat:35.6813},{lon:139.7672},{basis:'solar'},{school:'fixed'},{tz:0},{purpose:{key:'work'}}]){
 const other=core.inputKey({...input,...change});
 assert.notEqual(other,key,'changed conditions must have their own saved reading');
 assert.equal(core.save([{key,calculationVersion:core.VERSION}],{key:other,calculationVersion:core.VERSION}).length,2);
 assert.equal(core.recentDuplicate([{key,savedAt:now,calculationVersion:core.VERSION}],other,now),undefined);
}
assert.notEqual(core.inputKey({...input,question:'a|b',location:'c'}),core.inputKey({...input,question:'a',location:'b|c'}),'text delimiters cannot collide');
console.log('Qimen input identity preserves minute and setting changes');
