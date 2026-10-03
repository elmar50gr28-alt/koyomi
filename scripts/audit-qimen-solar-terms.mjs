import {solarApparentLongitude} from '../src/bazi/astronomy/solar-term-core.js';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(readFileSync('data/qimen/naoj-solar-terms-2026.json','utf8'));
const lines=readFileSync('app.html','utf8').split(/\r?\n/);
const definitions=['solarLongitude','qmdjMod','qmdjSignedAngle','qmdjTermStart'].map(n=>lines.find(l=>l.startsWith('function '+n+'(')));
if(definitions.some(l=>!l))throw Error('Solar term functions missing');
const engineIndex=process.argv.indexOf('--astronomy-browser');
const enginePath=engineIndex<0?null:process.argv[engineIndex+1];
if(engineIndex>=0 && (!enginePath || enginePath.startsWith('--')))throw Error('--astronomy-browser requires the verified 2.1.19 browser file path');
if(enginePath && process.argv.includes('--bazi-candidate'))throw Error('Select only one model');
const model=enginePath?'astronomy-engine-2.1.19-runtime':process.argv.includes('--bazi-candidate')?'bazi-apparent-candidate':'legacy-offline-fallback';
const context=vm.createContext({DAY:86400000,Date,window:{}});
let engineSha256;
if(enginePath){
  const bytes=readFileSync(enginePath);
  engineSha256=createHash('sha256').update(bytes).digest('hex');
  if(engineSha256!=='f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6')throw Error('Astronomy Engine browser file differs from verified npm 2.1.19');
  vm.runInContext(bytes.toString('utf8'),context,{filename:'astronomy.browser.min.js'});
  context.window.Astronomy=context.window.Astronomy||context.Astronomy;
}
vm.runInContext('function mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}\n'+lines.find(l=>l.startsWith('const TERM_NAMES='))+'\n'+definitions.join('\n')+'\nthis.api={qmdjTermStart};',context);
if(enginePath){
  const active=lines.find(l=>l.startsWith('function v191zEphemerisActive('));
  const runtime=lines.find(l=>l.startsWith('solarLongitude=function(d)'));
  if(!active || !runtime)throw Error('Runtime ephemeris override missing');
  context.auditFallback= context.solarLongitude;
  context.auditFallbackCalls=0;
  vm.runInContext('const v191zSolarLongitudeFallback=d=>{auditFallbackCalls++;return auditFallback(d)};\n'+active+'\n'+runtime,context);
  if(!context.v191zEphemerisActive())throw Error('Runtime Astronomy Engine path is inactive');
}
if(model==='bazi-apparent-candidate')context.solarLongitude=solarApparentLongitude;
const report=data.terms.map(row=>{
  const official=Date.parse(row.datetime);
  // Query one day after the published event to find this event's preceding root.
  const term=context.api.qmdjTermStart(new Date(official+86400000));
  if(term.name!==row.name)throw Error('Unexpected term: '+row.name);
  return {name:row.name,official:row.datetime,computedUtc:term.start.toISOString(),differenceMinutes:Number(((term.start-official)/60000).toFixed(3))};
});
if(enginePath && context.auditFallbackCalls!==0)throw Error('Astronomy Engine audit silently fell back to the approximation');
const max=report.reduce((a,b)=>Math.abs(a.differenceMinutes)>Math.abs(b.differenceMinutes)?a:b);
const summary={model,engineSha256,fallbackCalls:enginePath?context.auditFallbackCalls:undefined,year:2026,count:report.length,meanAbsoluteMinutes:Number((report.reduce((s,r)=>s+Math.abs(r.differenceMinutes),0)/report.length).toFixed(3)),maxAbsoluteMinutes:Math.abs(max.differenceMinutes),maxTerm:max.name};
if(process.argv.includes('--json'))console.log(JSON.stringify({summary,report},null,2));
else{console.table(report);console.log(summary);console.log('Measurement only: model-labelled comparison; Astronomy Engine mode replays the app runtime override with a verified library file. Minute-resolution official times; no accuracy acceptance threshold or Qimen approval implied.');}
