import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

// Replay the existing standard-time chart path, without replacing chart rules.
const app=readFileSync('app.html','utf8'),lines=app.split(/\r?\n/);
const ctx=vm.createContext({window:{},Date,console});
vm.runInContext(readFileSync('src/shared/qimen-time-core.js','utf8'),ctx);
const browser=readFileSync('vendor/astronomy-engine/2.1.19/astronomy.browser.min.js');
assert.equal(createHash('sha256').update(browser).digest('hex'),'f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6');
vm.runInContext(browser.toString('utf8'),ctx);
const selected=['const DAY=','const STEMS=','const STEM_ELEMENT=','const BRANCH_ELEMENT=','const TERM_NAMES='].map(p=>lines.find(l=>l.startsWith(p)));
const funcs=['solarLongitude','yearPillar','monthPillar'].map(n=>lines.find(l=>l.startsWith('function '+n+'(')));
assert.ok([...selected,...funcs].every(Boolean));
const core=app.slice(app.indexOf('const QMDJ_VERSION='),app.indexOf('function qmdjScorePalace('));
vm.runInContext(selected.join('\n')+'\nfunction mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}function fmtIso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}\n'+funcs.join('\n')+'\n'+core,ctx);
const active=lines.find(l=>l.startsWith('function v191zEphemerisActive(')),runtime=lines.find(l=>l.startsWith('solarLongitude=function(d)'));
assert.ok(active&&runtime);
vm.runInContext('let auditFallbackCalls=0;const approximate=solarLongitude;const v191zSolarLongitudeFallback=d=>{auditFallbackCalls++;return approximate(d)};\n'+active+'\n'+runtime+'\nthis.api={qmdjChart,qmdjTermStart,QMDJ_JU};this.fallbackCount=()=>auditFallbackCalls;',ctx);
assert.ok(ctx.v191zEphemerisActive());
const names='小寒 大寒 立春 雨水 啓蟄 春分 清明 穀雨 立夏 小満 芒種 夏至 小暑 大暑 立秋 処暑 白露 秋分 寒露 霜降 立冬 小雪 大雪 冬至'.split(' ');
const fields=['yuan','dun','ju','ground','hp','dp','yp','mp','xun','hidden','xunPalace','targetPalace','valueStar','valueDoor','doorTarget','voids','horse','monthElement','fiveNotMeet','fuyin','fanyin','palaces'];
const value=(chart,field)=>field==='yuan'?chart.yuan.yuan:chart[field];
const rows=[];
for(const year of [2025,2026,2027]){
  const official=JSON.parse(readFileSync(`data/qimen/naoj-solar-terms-${year}.json`,'utf8'));
  for(const [index,term] of official.terms.entries()){
    const published=Date.parse(term.datetime),root=ctx.api.qmdjTermStart(new Date(published+86400000)).start.getTime();
    assert.ok(Math.abs(root-published)<90000,year+' '+term.name+' measured root guard');
    for(const school of ['chaibu','fixed']){
      const chart=instant=>ctx.api.qmdjChart({date:new Date(instant),tz:9,lon:135,basis:'standard',boundary:23,school});
      const before=chart(root-1000),after=chart(root+1000);
      const previous=names[(index+23)%24];
      assert.equal(before.term.name,previous);
      assert.equal(after.term.name,term.name);
      assert.equal(chart(published-90000).term.name,previous,'official minute minus 90 seconds');
      assert.equal(chart(published+90000).term.name,term.name,'official minute plus 90 seconds');
      for(const c of [before,after]){
        assert.equal(c.ju,ctx.api.QMDJ_JU[c.term.name][c.yuan.yuan]);
        assert.equal(Object.keys(c.ground).length,9);
        assert.equal(Object.keys(c.palaces).length,9);
      }
      if(term.name==='夏至'){assert.equal(before.dun,'陽遁');assert.equal(after.dun,'陰遁');}
      else if(term.name==='冬至'){assert.equal(before.dun,'陰遁');assert.equal(after.dun,'陽遁');}
      else assert.equal(before.dun,after.dun,'only solstices switch dun');
      if(school==='fixed')assert.equal(after.yuan.yuan,0,'fixed yuan restarts at each computed root');
      const changedFields=fields.filter(f=>JSON.stringify(value(before,f))!==JSON.stringify(value(after,f)));
      rows.push({year,name:term.name,school,published:term.datetime,computedUtc:new Date(root).toISOString(),before:{term:before.term.name,dun:before.dun,ju:before.ju,yuan:before.yuan.yuan},after:{term:after.term.name,dun:after.dun,ju:after.ju,yuan:after.yuan.yuan},changedFields});
    }
  }
}
assert.equal(ctx.fallbackCount(),0);
const summary={years:[2025,2026,2027],terms:72,schoolPairs:rows.length,rootProbeSeconds:1,officialProbeSeconds:90,timeBasis:'standard UTC+09:00; longitude 135; day boundary 23:00',fallbackCalls:ctx.fallbackCount(),dunChangedPairs:rows.filter(r=>r.changedFields.includes('dun')).length,juChangedPairs:rows.filter(r=>r.changedFields.includes('ju')).length,groundChangedPairs:rows.filter(r=>r.changedFields.includes('ground')).length,palacesChangedPairs:rows.filter(r=>r.changedFields.includes('palaces')).length};
assert.equal(summary.schoolPairs,144);
assert.equal(summary.dunChangedPairs,12);
const report={scope:'Implementation transition regression only; not an approved classic chart or all-basis/all-location proof. Official minute values are not exact second boundaries.',summary,rows};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else console.log('Qimen real-engine term/chart boundaries passed: '+JSON.stringify(summary));
