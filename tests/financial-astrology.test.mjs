import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  positionsAt, lunarPhase, findAspects, retrogradesAt, readFinancialSky,
  readFinancialWindow, localDateKey, interpretEconomy, FINANCIAL_ASTROLOGY_META
} from '../src/financial/astrology-core.js';

const base=new Date(2026,10,23,12);
const normal=value=>(value%360+360)%360;
const changes={Mercury:-1.0,Venus:1.2,Mars:0.7,Jupiter:0.08,Saturn:0.04,Uranus:0.02,Neptune:0.01,Pluto:0.01};
const origins={Mercury:75,Venus:40,Mars:130,Jupiter:150,Saturn:240,Uranus:310,Neptune:30,Pluto:270};
const dayOf=date=>(date-base)/86400000;
const astronomy={
  Body:Object.fromEntries(Object.keys(changes).map(x=>[x,x])),
  SunPosition:date=>({elon:normal(100+dayOf(date))}),
  EclipticGeoMoon:date=>({lon:normal(100+dayOf(date)*13)}),
  GeoVector:(body,date)=>({body,date}),
  Ecliptic:vector=>({elon:normal(origins[vector.body]+dayOf(vector.date)*changes[vector.body])})
};
assert.equal(lunarPhase({Sun:359,Moon:1}).label,'新月付近');
assert.equal(lunarPhase({Sun:1,Moon:181}).label,'満月付近');
const aspect=findAspects({Sun:359,Moon:1});
assert.equal(aspect[0].type,'conjunction');
assert.equal(aspect[0].orb,2);
assert.equal(positionsAt(base,astronomy).Sun,100);
assert.equal(positionsAt(base,astronomy).Moon,100);
assert.ok(retrogradesAt(base,astronomy).some(x=>x.body==='Mercury'),'waterfall: retrograde derives from dated longitudes');
const reading=readFinancialSky(base,astronomy);
assert.equal(reading.date,'2026-11-23');
assert.ok(reading.headline);
assert.equal(reading.phase.label,'新月付近');
assert.ok(['吉','平','凶'].includes(reading.verdict.label));
assert.match(reading.verdict.headline,/経済運は/);
assert.match(reading.verdict.action,/今日の一手/);
assert.match(reading.verdict.reason,/根拠/);
assert.deepEqual(reading.verdict,readFinancialSky(base,astronomy).verdict,'same date always has same judgment');
const mock=(type,bodies)=>({type,bodies,orb:0.5,label:bodies.join(' × '),aspect:type});
const phase={label:'新月付近'};
assert.equal(interpretEconomy([mock('trine',['Venus','Jupiter']),mock('sextile',['Mercury','Jupiter'])],[],phase).label,'吉');
assert.equal(interpretEconomy([mock('square',['Venus','Saturn']),mock('opposition',['Mercury','Mars'])],[],phase).label,'凶');
assert.equal(interpretEconomy([],[],phase).label,'平');
assert.equal(interpretEconomy([mock('trine',['Venus','Jupiter']),mock('square',['Mercury','Saturn'])],[],phase).label,'平');
assert.equal(interpretEconomy([], [{body:'Mercury',label:'水星'}],phase).label,'平');
assert.equal(reading.meta.reviewStatus,'traditional-symbolism-not-market-validated');
assert.deepEqual(readFinancialWindow(base,astronomy,3).map(x=>x.date),['2026-11-23','2026-11-24','2026-11-25']);
assert.equal(readFinancialWindow(new Date(2026,11,31,12),astronomy,2)[1].date,'2027-01-01');
assert.equal(readFinancialWindow(new Date(2099,11,31,12),astronomy,14).length,1,'window gracefully ends at supported year');
assert.equal(localDateKey(new Date(2026,10,23,12)),'2026-11-23');
assert.throws(()=>positionsAt(base,null),/天文計算/);
assert.throws(()=>readFinancialWindow(base,astronomy,32),/表示期間/);
assert.throws(()=>readFinancialSky(new Date('bad'),astronomy),/有効な日付/);
assert.throws(()=>readFinancialSky(new Date(2100,0,1,12),astronomy),/1900年/);
assert.match(FINANCIAL_ASTROLOGY_META.disclaimer,/投資判断/);

const html=fs.readFileSync('financial-astrology.html','utf8');
const css=fs.readFileSync('src/financial/astrology-page.css','utf8');
const home=fs.readFileSync('index.html','utf8');
const tarot=fs.readFileSync('financial.html','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');
assert.match(html,/data-panel="world"/);
assert.match(html,/data-panel="personal"/);
assert.match(html,/id="astroVerdict"/);
assert.match(html,/id="astroReason"/);
assert.match(html,/id="astroAction"/);
assert.match(html,/吉・平・凶/);
assert.match(html,/aria-live="polite"/);
assert.match(html,/astroDate/);
assert.match(html,/astronomy.browser.min.js/);
assert.match(html,/株価や上昇期待値ではありません/);
assert.match(html,/ブラッドリー曲線は原典の係数/);
assert.match(css,/min-height:48px/);
assert.match(css,/:focus-visible/);
assert.match(css,/prefers-reduced-motion/);
assert.match(home,/href="financial-astrology.html"/);
assert.match(tarot,/href="financial-astrology.html"/);
for (const asset of ['./financial-astrology.html','./src/financial/astrology-core.js','./src/financial/astrology-page.js','./src/financial/astrology-page.css']) {
  assert.ok(worker.includes("'"+asset+"'"),asset+' must be precached offline');
}
console.log('Financial astrology calculation, offline assets, mobile accessibility contracts passed');

// Small DOM stub verifies the actual entry script, both tabs, date controls and SVG output.
class Element {
  constructor(){this.listeners={};this.children=[];this.attributes={};this.value='';this.textContent='';this.hidden=false;this.dataset={};}
  append(...values){this.children.push(...values);}
  replaceChildren(...values){this.children=values;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  setAttribute(name,value){this.attributes[name]=value;}
  click(){this.listeners.click();}
}
const ids=Object.fromEntries(['astroStatus','astroDate','astroPrev','astroNext','astroToday','astroHeadline',
  'astroSummary','astroVerdict','astroReason','astroAction','astroPhase','astroPhaseTheme','astroRetrogrades','astroAspects','astroCurve',
  'astroWindow','astroResult','worldPanel','personalPanel'].map(key=>[key,new Element()]));
const tabs=['world','personal'].map(panel=>Object.assign(new Element(),{dataset:{panel}}));
globalThis.document={getElementById:id=>ids[id],querySelectorAll:()=>tabs,
  createElement:()=>new Element(),createElementNS:()=>new Element()};
globalThis.window={Astronomy:astronomy};
const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{register:()=>Promise.resolve()}}});
try {
  await import('../src/financial/astrology-page.js?ui');
  assert.equal(ids.astroResult.hidden,false);
  assert.ok(['吉','平','凶'].includes(ids.astroVerdict.textContent));
  assert.match(ids.astroHeadline.textContent,/経済運は/);
  assert.match(ids.astroAction.textContent,/今日の一手/);
  assert.ok(ids.astroAspects.children.length);
  assert.ok(ids.astroCurve.children[0].children.length>0);
  tabs[1].click();
  assert.equal(ids.personalPanel.hidden,false);
  assert.equal(ids.worldPanel.hidden,true);
  assert.equal(tabs[1].attributes['aria-pressed'],'true');
  tabs[0].click();
  assert.equal(ids.personalPanel.hidden,true);
  ids.astroDate.value='2026-11-23';
  ids.astroNext.click();
  assert.equal(ids.astroDate.value,'2026-11-24');
  ids.astroPrev.click();
  assert.equal(ids.astroDate.value,'2026-11-23');
  ids.astroDate.value='2026-02-30';
  ids.astroDate.listeners.change();
  assert.equal(ids.astroResult.hidden,true,'invalid date hides stale interpretation');
  assert.match(ids.astroStatus.textContent,/表示できません/);
} finally {
  delete globalThis.document;delete globalThis.window;
  if (descriptor) Object.defineProperty(globalThis,'navigator',descriptor);
  else delete globalThis.navigator;
}
console.log('Financial astrology tabs, date navigation, chart and invalid date UI passed');
