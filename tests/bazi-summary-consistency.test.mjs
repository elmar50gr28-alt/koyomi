import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateBazi,buildBaziReading} from '../src/bazi/index.js';
import {renderBaziCalculationSummary} from '../src/bazi/reading/summary-ui.js';

class Node{
 constructor(text=''){this.textContent=text;this.children=[];this.style={}}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children;this.textContent=children.map(child=>child.textContent).join('')}
 querySelector(){return this.children[0]||null}
 querySelectorAll(){return this.children}
}
const label=text=>{const row=new Node();row.append(new Node(text));return row};
const cells=Object.fromEntries(['metricDayMaster','metricDayMasterNote','metricUseful','metricUsefulNote','shichuDetails','elementBars'].map(id=>[id,new Node()]));
cells.shichuDetails.append(label('日主強弱'),label('用神・喜神'),label('出生地'),label('出生時刻補正'));
const doc={getElementById:id=>cells[id],createElement:()=>new Node(),createTextNode:text=>new Node(text)};
const profile={birthData:{date:'1990-06-15',timeUnknown:true,place:{longitude:139.753616,latitude:35.69389,utcOffset:9}}};
const result=calculateBazi(profile),original=structuredClone(result),reading=buildBaziReading(result,{locale:'ja'});
assert.equal(reading.calculationSummary.strengthLabel,'身弱');
assert.equal(reading.calculationSummary.favorable[0],'water');
assert.match(reading.sections.overall.evidenceSummary,/身弱/);
cells.metricDayMasterNote.textContent='中和 / 日柱 辛亥';cells.metricUseful.textContent='用神 土';
renderBaziCalculationSummary(doc,reading.calculationSummary);
assert.match(cells.metricDayMasterNote.textContent,/身弱.*出生時刻不明/);
assert.equal(cells.metricUseful.textContent,'用神候補 水');
assert.doesNotMatch(cells.shichuDetails.children[0].textContent,/支持率|中和/);
assert.match(cells.shichuDetails.children[1].textContent,/用神候補 水/);
assert.equal(cells.shichuDetails.children[2].children[0].textContent,'出生地','unrelated details remain intact');
assert.deepEqual(cells.elementBars.children.map(row=>row.children[2].textContent),['0.3','3.4','0.6','2.0','2.7']);
assert.match(cells.shichuDetails.children[3].textContent,/出生時刻不明/);
assert.deepEqual(result,original,'presentation must not alter calculation or scoring');

// A balanced result is a valid reading, distinct from an unavailable calculation.
const balanced=structuredClone(result);delete balanced.integratedReadingData;
balanced.strength.dayMasterStrength.level='balanced';balanced.strength.result='balanced';
const balancedReading=buildBaziReading(balanced,{locale:'ja'});
assert.equal(balancedReading.calculationSummary.strengthLabel,'中和');
assert.match(balancedReading.sections.overall.evidenceSummary,/中和/);

// Integrated data takes precedence over obsolete fields in a saved result.
const integrated=structuredClone(result);
integrated.integratedReadingData.analysis.strength.dayMasterStrength.level='balanced';
integrated.integratedReadingData.analysis.favorableElements=['wood'];
integrated.integratedReadingData.analysis.elementBalance=[{element:'wood',value:4.2}];
const integratedReading=buildBaziReading(integrated,{locale:'ja'});
renderBaziCalculationSummary(doc,integratedReading.calculationSummary);
assert.equal(cells.metricUseful.textContent,'用神候補 木');
assert.match(cells.metricDayMasterNote.textContent,/中和/);
assert.match(integratedReading.sections.overall.evidenceSummary,/中和/);
assert.equal(cells.elementBars.children[0].children[2].textContent,'4.2');

// A daily date change must never change natal facts or drift away from detailed evidence.
let count=0;
for(const timeUnknown of [false,true])for(let day=1;day<=30;day++){
 const r=calculateBazi({...profile,birthData:{...profile.birthData,time:'08:20',timeUnknown}},undefined,{referenceDate:new Date(Date.UTC(2026,9,day,3))});
 const b=buildBaziReading(r,{locale:'ja'}),m=b.calculationSummary;
 renderBaziCalculationSummary(doc,m);
 assert.ok(b.sections.overall.evidenceSummary.includes(m.strengthLabel));
 assert.ok(cells.metricDayMasterNote.textContent.includes(m.strengthLabel));
 assert.deepEqual(m.elementBalance,r.chart.elementBalance.map(({element,value})=>({element,value})));
 assert.equal(m.timeUnknown,timeUnknown);count++;
}
renderBaziCalculationSummary(doc,{elementBalance:[{element:'wood',value:NaN},{element:'fire',value:0}]});
assert.equal(cells.metricUseful.textContent,'用神候補は判定保留');
assert.equal(cells.elementBars.children[0].children[2].textContent,'—');
assert.equal(cells.elementBars.children[1].children[2].textContent,'0.0');
assert.ok(cells.elementBars.children.every(row=>!row.children[1].children[0].style.width.includes('NaN')));
const app=readFileSync('app.html','utf8'),sw=readFileSync('service-worker.js','utf8');
assert.match(app,/renderBaziCalculationSummary\(document,reading.calculationSummary\)/);
assert.ok(sw.includes('./src/bazi/reading/summary-ui.js'),'summary module must be pre-cached for offline use');
console.log(`Bazi summary consistency passed: contradiction reproduction, ${count} date/time scenarios, balanced and missing results`);
