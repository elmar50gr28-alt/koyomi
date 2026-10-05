import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Partial placement audit only. Inputs come from CADAL01053967 images 3–5, 11–12.
// No historical calendar date is invented; astronomy/day derivation is bypassed.
const app=readFileSync('app.html','utf8'),lines=app.split(/\r?\n/);
const prefixes=['const STEMS=','const STEM_ELEMENT=','const BRANCH_ELEMENT='];
const selected=prefixes.map(p=>lines.find(l=>l.startsWith(p)));
assert.ok(selected.every(Boolean));
let core=app.slice(app.indexOf('const QMDJ_VERSION='),app.indexOf('function qmdjScorePalace('));
assert.ok(core.startsWith('const QMDJ_VERSION='));
const ringTarget="QMDJ_RING[qmdjMod(QMDJ_RING.indexOf(xunPalace===5?2:xunPalace)+(dun==='陽遁'?hourStep:-hourStep),8)]";
assert.equal(core.split(ringTarget).length,2,'Expected one production door-target expression');
function make(mode){
let source=mode.startsWith('candidate')?core.replace(ringTarget,"qmdjMod(xunPalace-1+(dun==='陽遁'?hourStep:-hourStep),9)+1"):core;
if(mode==='candidate-center8'){
 const placement='qmdjRingPlace(doorSeq,xunPalace===5?2:xunPalace,doorTarget)';
 assert.equal(source.split(placement).length,2);
 source=source.replace(placement,'qmdjRingPlace(doorSeq,xunPalace===5?2:xunPalace,doorTarget===5?8:doorTarget)');
}
const ctx=vm.createContext({window:{},Date});
vm.runInContext(selected.join('\n')+'\n'+source,ctx);
// Invoke the production chart body with explicitly supplied term/yuan/hour inputs.
// Year/month are placeholders used by unrelated scoring metadata, not source evidence.
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
 return {valueStar:c.valueStar,valueDoor:c.valueDoor,doorTarget:c.doorTarget,targetPalace:c.targetPalace,xunPalace:c.xunPalace,palaces:c.palaces};
};
`,ctx);
return ctx.run;
}
const current=make('current'),candidate=make('candidate'),center8=make('candidate-center8');
const cases=[
 {id:'V2-TIAN-YANG4',ju:4,hourIndex:21,palace:1,expected:{valueStar:'天心',valueDoor:'開門',doorTarget:7,door:'生門',heaven:'丙',earth:'丁'}},
 {id:'V2-DI-YANG1',ju:1,hourIndex:27,palace:2,expected:{valueStar:'天冲',valueDoor:'傷門',doorTarget:1,heaven:'乙',earth:'己'}},
 {id:'V2-BIRD-YANG9',ju:9,hourIndex:7,palace:9,expected:{valueStar:'天英',heaven:'丙',earth:'戊'}},
 {id:'V2-TIAN-YIN6',dun:'陰遁',ju:6,hourIndex:56,palace:9,expected:{valueStar:'天蓬',valueDoor:'休門',doorTarget:4,door:'生門',heaven:'丙',earth:'丁'}},
 {id:'V1-YANG1-JIACHEN',ju:1,hourIndex:40,palace:5,expected:{valueStar:'天禽',valueDoor:'死門'}},
 {id:'V1-YIN9-JIACHEN',dun:'陰遁',ju:9,hourIndex:40,palace:5,expected:{valueStar:'天禽',valueDoor:'死門'}},
 {id:'V2-REN-YANG7',ju:7,hourIndex:12,palace:6,expected:{valueStar:'天任',valueDoor:'生門',targetPalace:5,doorTarget:1,door:'休門',heaven:'丁',deity:'太陰'}},
 {id:'V2-YUNV-YANG1',ju:1,hourIndex:6,palace:7,expected:{valueDoor:'休門',doorTarget:7,earth:'丁'}}
];
const compare=(run,c)=>{
 const chart=run(c.ju,c.hourIndex,c.dun),p=chart.palaces[c.palace];
 const actual=Object.fromEntries(Object.keys(c.expected).map(k=>[k,k in chart?chart[k]:p[k]]));
 return {actual,mismatches:Object.keys(c.expected).filter(k=>c.expected[k]!==actual[k])};
};
const report=cases.map(c=>({caseId:c.id,expected:c.expected,current:compare(current,c),candidate:compare(candidate,c)}));
// Synthetic coverage is a change-impact inventory, not classical ground truth.
let changedTargets=0,changedDoors=0,centerOrigins=0,centerTargets=0,combinations=0,centerPolicyDifferences=0;
const centerExamples=[];
const partitions={neither:0,originOnly:0,targetOnly:0,both:0};
const jiaHours={total:0,centerOrigin:0,centerTarget:0};
for(const dun of ['陽遁','陰遁'])for(let ju=1;ju<=9;ju++)for(let hour=0;hour<60;hour++){
 const a=current(ju,hour,dun),b=candidate(ju,hour,dun);
 combinations++;
 partitions[b.xunPalace===5?(b.doorTarget===5?'both':'originOnly'):(b.doorTarget===5?'targetOnly':'neither')]++;
 if(hour%10===0){jiaHours.total++;if(b.xunPalace===5)jiaHours.centerOrigin++;if(b.doorTarget===5)jiaHours.centerTarget++;}
 assert.ok(b.doorTarget>=1&&b.doorTarget<=9);
 assert.equal(a.valueStar,b.valueStar);
 assert.equal(a.valueDoor,b.valueDoor);
 for(let p=1;p<=9;p++){
  assert.equal(a.palaces[p].star,b.palaces[p].star);
  assert.equal(a.palaces[p].heaven,b.palaces[p].heaven);
  assert.equal(a.palaces[p].earth,b.palaces[p].earth);
 }
 if(a.doorTarget!==b.doorTarget)changedTargets++;
 if(Array.from({length:9},(_,i)=>a.palaces[i+1].door).join()!==Array.from({length:9},(_,i)=>b.palaces[i+1].door).join())changedDoors++;
 if(b.xunPalace===5)centerOrigins++;
 if(b.doorTarget===5)centerTargets++;
 const alternate=center8(ju,hour,dun);
 const doors=c=>Array.from({length:9},(_,i)=>c.palaces[i+1].door);
 const different=doors(b).join()!==doors(alternate).join();
 if(different)centerPolicyDifferences++;
 if(b.doorTarget!==5)assert.deepEqual(doors(b),doors(alternate));
 assert.equal(b.doorTarget,alternate.doorTarget);
 for(let p=1;p<=9;p++){
  assert.equal(b.palaces[p].star,alternate.palaces[p].star);
  assert.equal(b.palaces[p].heaven,alternate.palaces[p].heaven);
  assert.equal(b.palaces[p].earth,alternate.palaces[p].earth);
 }
 if(b.doorTarget===5&&centerExamples.length<4)centerExamples.push({dun,ju,hourIndex:hour,xunPalace:b.xunPalace,rawDoorTarget:5,to2:doors(b),to8:doors(alternate)});
}
assert.equal(Object.values(partitions).reduce((a,b)=>a+b,0),combinations);
console.log(JSON.stringify({scope:'audit_only_not_connected_to_app',centerPolicy:'existing_ringPlace_5_to_2_unverified',cases:report,synthetic:{combinations,changedTargets,changedDoors,centerOrigins,centerTargets},centerSensitivity:{centerPolicyDifferences,partitions,jiaHours,examples:centerExamples,sourceApproval:false}},null,2));
