import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(readFileSync('data/qimen/naoj-solar-terms-2026.json','utf8'));
const lines=readFileSync('app.html','utf8').split(/\r?\n/);
const definitions=['solarLongitude','qmdjMod','qmdjSignedAngle','qmdjTermStart'].map(n=>lines.find(l=>l.startsWith('function '+n+'(')));
if(definitions.some(l=>!l))throw Error('Solar term functions missing');
const context=vm.createContext({DAY:86400000});
vm.runInContext('function mod(n,m){return((n%m)+m)%m}function jd(d){return d.getTime()/DAY+2440587.5}\n'+lines.find(l=>l.startsWith('const TERM_NAMES='))+'\n'+definitions.join('\n')+'\nthis.api={qmdjTermStart};',context);
const report=data.terms.map(row=>{
  const official=Date.parse(row.datetime);
  // Query one day after the published event to find this event's preceding root.
  const term=context.api.qmdjTermStart(new Date(official+86400000));
  if(term.name!==row.name)throw Error('Unexpected term: '+row.name);
  return {name:row.name,official:row.datetime,computedUtc:term.start.toISOString(),differenceMinutes:Number(((term.start-official)/60000).toFixed(3))};
});
const max=report.reduce((a,b)=>Math.abs(a.differenceMinutes)>Math.abs(b.differenceMinutes)?a:b);
const summary={year:2026,count:report.length,meanAbsoluteMinutes:Number((report.reduce((s,r)=>s+Math.abs(r.differenceMinutes),0)/report.length).toFixed(3)),maxAbsoluteMinutes:Math.abs(max.differenceMinutes),maxTerm:max.name};
if(process.argv.includes('--json'))console.log(JSON.stringify({summary,report},null,2));
else{console.table(report);console.log(summary);console.log('Measurement only: minute-resolution official times; no accuracy acceptance threshold or Qimen approval implied.');}
