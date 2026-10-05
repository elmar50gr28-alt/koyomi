import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Partial placement audit only. Inputs come from CADAL01053967 images 3–5, 11–12.
// No historical calendar date is invented; astronomy/day derivation is bypassed.
const app=readFileSync('app.html','utf8'),lines=app.split(/\r?\n/);
const prefixes=['const STEMS=','const STEM_ELEMENT=','const BRANCH_ELEMENT='];
const selected=prefixes.map(p=>lines.find(l=>l.startsWith(p)));
assert.ok(selected.every(Boolean));
const core=app.slice(app.indexOf('const QMDJ_VERSION='),app.indexOf('function qmdjScorePalace('));
assert.ok(core.startsWith('const QMDJ_VERSION='));
const ctx=vm.createContext({window:{},Date});
vm.runInContext(selected.join('\n')+'\n'+core,ctx);
// Invoke the production chart body with explicitly supplied term/yuan/hour inputs.
// Year/month are placeholders used by unrelated scoring metadata, not source evidence.
vm.runInContext(`
window.KOYOMI_QIMEN_TIME_CORE={calculationTimes:()=>({astronomicalDate:null,clockDate:null,adjusted:{date:null}})};
qmdjTermStart=()=>({name:'監査入力'});
qmdjYuan=()=>({yuan:0});
qmdjDun=()=> '陽遁';
yearPillar=()=>({});
monthPillar=()=>({branchIndex:0});
this.run=(ju,hourIndex)=>{
 QMDJ_JU['監査入力']=[ju,ju,ju];
 qmdjHourPillar=()=>({index:hourIndex,stem:STEMS[hourIndex%10],branch:BRANCHES[hourIndex%12],stemIndex:hourIndex%10,dayPillar:{stemIndex:0}});
 const c=qmdjChart({tz:0,lon:0,basis:'standard',boundary:0,school:'fixed'});
 return {valueStar:c.valueStar,valueDoor:c.valueDoor,palaces:c.palaces};
};
`,ctx);
const cases=[
 {id:'V2-TIAN-YANG4',ju:4,hourIndex:21,palace:1,expected:{valueStar:'天心',valueDoor:'開門',door:'生門',heaven:'丙',earth:'丁'}},
 {id:'V2-DI-YANG1',ju:1,hourIndex:27,palace:2,expected:{valueStar:'天冲',valueDoor:'傷門',heaven:'乙',earth:'己'}},
 {id:'V2-BIRD-YANG9',ju:9,hourIndex:7,palace:9,expected:{valueStar:'天英',heaven:'丙',earth:'戊'}}
];
const report=cases.map(c=>{
 const chart=ctx.run(c.ju,c.hourIndex),p=chart.palaces[c.palace];
 const actual=Object.fromEntries(Object.keys(c.expected).map(k=>[k,k in chart?chart[k]:p[k]]));
 const mismatches=Object.keys(c.expected).filter(k=>c.expected[k]!==actual[k]);
 return {caseId:c.id,palace:c.palace,expected:c.expected,actual,mismatches};
});
console.log(JSON.stringify({scope:'partial_placement_only',reviewStatus:'needs_human_review',cases:report},null,2));
// A successful audit run is not a passing classical-correctness test.
// Differences are reported without changing production rules or approving the source.
