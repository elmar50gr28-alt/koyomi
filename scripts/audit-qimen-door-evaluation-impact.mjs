import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Synthetic impact audit. No classical expected scores or historical dates.
// No historical calendar date is invented; astronomy/day derivation is bypassed.
const app=readFileSync('app.html','utf8'),lines=app.split(/\r?\n/);
const prefixes=['const STEMS=','const STEM_ELEMENT=','const BRANCH_ELEMENT='];
const selected=prefixes.map(p=>lines.find(l=>l.startsWith(p)));
assert.ok(selected.every(Boolean));
const evaluators=['qmdjScorePalace','qmdjEvaluate'].map(n=>lines.find(l=>l.startsWith('function '+n+'(')));
assert.ok(evaluators.every(Boolean));
let core=app.slice(app.indexOf('const QMDJ_VERSION='),app.indexOf('function qmdjScorePalace('));
assert.ok(core.startsWith('const QMDJ_VERSION='));
const ringTarget="QMDJ_RING[qmdjMod(QMDJ_RING.indexOf(xunPalace===5?2:xunPalace)+(dun==='陽遁'?hourStep:-hourStep),8)]";
assert.equal(core.split(ringTarget).length,2,'Expected one production door-target expression');
function make(mode){
let source=mode.startsWith('candidate')?core.replace(ringTarget,"qmdjMod(xunPalace-1+(dun==='陽遁'?hourStep:-hourStep),9)+1"):core;
const ctx=vm.createContext({window:{},Date});
vm.runInContext(selected.join('\n')+'\n'+source+'\nfunction clamp(n,min,max){return Math.min(max,Math.max(min,n))}\n'+evaluators.join('\n'),ctx);
// Invoke the production chart body with explicitly supplied term/yuan/hour inputs.
// Month/day metadata is held fixed for sensitivity analysis, not source evidence.
vm.runInContext(`
window.KOYOMI_QIMEN_TIME_CORE={calculationTimes:()=>({astronomicalDate:null,clockDate:null,adjusted:{date:null}})};
qmdjTermStart=()=>({name:'監査入力'});
qmdjYuan=()=>({yuan:0});
qmdjDun=()=> '陽遁';
yearPillar=()=>({});
monthPillar=()=>({branchIndex:0});
this.run=(ju,hourIndex,dun='陽遁')=>{
 qmdjDun=()=>dun;
 QMDJ_JU['監査入力']=[ju,ju,ju];
 qmdjHourPillar=()=>({index:hourIndex,stem:STEMS[hourIndex%10],branch:BRANCHES[hourIndex%12],stemIndex:hourIndex%10,dayPillar:{stemIndex:0}});
 const c=qmdjChart({tz:0,lon:0,basis:'standard',boundary:0,school:'fixed'});
 return c;
};
`,ctx);
vm.runInContext("this.evaluate=c=>qmdjEvaluate(c,{key:'general',...QMDJ_PURPOSE_GROUPS.general});",ctx);
return {run:ctx.run,evaluate:ctx.evaluate};
}
const current=make('current'),candidate=make('candidate');
let combinations=0,bestDirectionChanged=0,overallChanged=0,pressureChanged=0,fuyinChanged=0,fanyinChanged=0,maxOverallDifference=0;
const examples=[];
for(const dun of ['陽遁','陰遁'])for(let ju=1;ju<=9;ju++)for(let hour=0;hour<60;hour++){
 const a=current.run(ju,hour,dun),b=candidate.run(ju,hour,dun);
 const before=current.evaluate(a),after=candidate.evaluate(b);
 combinations++;
 if(before.best.no!==after.best.no)bestDirectionChanged++;
 if(before.overall!==after.overall)overallChanged++;
 maxOverallDifference=Math.max(maxOverallDifference,Math.abs(before.overall-after.overall));
 if(a.fuyin!==b.fuyin)fuyinChanged++;
 if(a.fanyin!==b.fanyin)fanyinChanged++;
 if(Array.from({length:9},(_,i)=>a.palaces[i+1].pressure).join()!==Array.from({length:9},(_,i)=>b.palaces[i+1].pressure).join())pressureChanged++;
 assert.ok(Number.isFinite(after.overall)&&after.overall>=0&&after.overall<=100);
 if(before.best.no!==after.best.no&&examples.length<4)examples.push({dun,ju,hourIndex:hour,before:{best:before.best.dir,overall:before.overall},after:{best:after.best.dir,overall:after.overall}});
}
console.log(JSON.stringify({scope:'synthetic_general_purpose_only',context:{monthBranch:'子',dayStem:'甲',dates:null,centerHosting:'5_to_2_unapproved'},combinations,bestDirectionChanged,overallChanged,maxOverallDifference,pressureChanged,fuyinChanged,fanyinChanged,examples},null,2));
