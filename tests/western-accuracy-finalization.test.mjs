import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const files=['western-core-v1.js','western-transits-v1.js','western-synastry-v1.js','western-solar-return-v1.js','western-progressions-v1.js','western-dignities-v1.js','western-points-v1.js','western-patterns-v1.js','western-composite-v1.js','western-professional-v1.js','western-reading-v1.js','western-chart-wheel-v1.js','western-forecast-v1.js','western-solar-arc-v1.js','western-davison-v1.js','western-fixed-stars-v1.js','western-suite-loader.js'];
function context(extra={}){const c={console,Date,setTimeout,document:{readyState:'loading',addEventListener(){},getElementById(){return null}},...extra};c.globalThis=c;return c}
async function load(c){for(const file of files)vm.runInNewContext(await readFile(`src/astrology/${file}`,'utf8'),c,{filename:file})}

const c=context();await load(c);
const unknown=c.WesternAstrologySuite.buildResult({placements:{太陽:{lon:359.999,house:10},月:{lon:0.001,house:4}},angles:{asc:15,mc:280},cusps:Array.from({length:12},(_,i)=>15+i*30),birthMoment:new Date('2000-01-01T12:00:00Z'),birthTimeKnown:false});
assert.equal(unknown.schemaVersion,'western-130-v1');
assert.deepEqual(Object.keys(unknown.natal.angles),[]);
assert.equal(unknown.natal.cusps.length,0);
assert.equal('house' in unknown.natal.placements.太陽,false);
assert.equal(unknown.points.items.some(x=>x.name==='Part of Fortune'),false);
assert.equal(unknown.professional.accuracyClass,'date-only');
assert.equal(unknown.chartWheel.svg.includes('class="house-line"'),false);
assert.ok(unknown.calculationMeta.suppressed.includes('houses'));

const start=Date.parse('2026-01-01T00:00:00Z');
const eph=date=>({木星:c.WesternCoreV1.mod(-5+(new Date(date).getTime()-start)/86400000)});
const forecast=c.WesternForecastV1.build({natal:{placements:{太陽:{lon:0}}}},{targetDate:new Date(start),ephemeris:eph});
const conjunction=forecast.events.find(x=>x.tp==='木星'&&x.np==='太陽'&&x.name==='コンジャンクション');
assert.ok(conjunction,'exact conjunction must be found between monthly sample dates');
assert.ok(Math.abs(Date.parse(conjunction.exactAt)-Date.parse('2026-01-06T00:00:00Z'))<3600000);
assert.ok(conjunction.orb<=0.08);
assert.equal(forecast.calculation,'daily-scan-with-subday-refinement');

let rendered=0;
const isolated=context({console:{...console,error(){}},buildPersonal(){return{existing:true}},renderPersonal(value){rendered++;return value}});isolated.document.readyState='complete';await load(isolated);
isolated.WesternForecastV1.build=()=>{throw new Error('simulated offline ephemeris failure')};
const personal=isolated.buildPersonal();
assert.equal(personal.existing,true);
assert.equal('westernAstrology' in personal,false);
isolated.renderPersonal(personal);
assert.equal(rendered,1,'existing renderer must survive a Western failure');
console.log('Western accuracy, unknown-time and fault-isolation checks passed');
