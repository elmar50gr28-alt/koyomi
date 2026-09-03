import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateChangePreview, changeBand, CHANGE_BASELINE } from '../src/world/earthquake-forecast/index.js';

const DAY=86_400_000,START=Date.parse('2005-01-01T00:00:00Z'),FORECAST=Date.parse('2010-01-01T00:00:00Z');
const regular=(days,magnitude=4.6)=>Array.from({length:Math.floor((FORECAST-START)/(days*DAY))},(_,index)=>[START+(index+1)*days*DAY,magnitude,0,0]);
const catalog=eventsByCell=>({latestTimeUtcMs:FORECAST+365*DAY,freshness:{complete:true},eventsByCell});
const options={forecastTime:new Date(FORECAST).toISOString(),targetMagnitude:4.5,horizonDays:7};

// CT01 / CT07: neither the current value nor its expanding baseline may see future events.
const history=regular(15),withFuture=calculateChangePreview(catalog({A:[...history,[FORECAST+DAY,8,0,0]]}),options),withoutFuture=calculateChangePreview(catalog({A:history}),options);
assert.deepEqual(withFuture.rows,withoutFuture.rows);
const lateRevision=history.map(item=>[...item]);lateRevision[20][6]=FORECAST+DAY;const beforeRevision=calculateChangePreview(catalog({A:lateRevision}),options),eventAbsent=calculateChangePreview(catalog({A:history.filter((_,index)=>index!==20)}),options);assert.deepEqual(beforeRevision.rows,eventAbsent.rows,'observations updated after forecast time must not enter the baseline');

// CT02: a recent dynamic increase must raise the self-history percentile.
const quiet=calculateChangePreview(catalog({A:history}),options).rows[0],surgeEvents=[...history,...Array.from({length:12},(_,index)=>[FORECAST-(index+1)*DAY/2,5,0,0])].sort((a,b)=>a[0]-b[0]),surge=calculateChangePreview(catalog({A:surgeEvents}),options).rows[0];
assert.ok(surge.change_percentile>quiet.change_percentile);

// CT03: a persistently active cell at its usual cadence is not automatically extreme.
const highBackground=calculateChangePreview(catalog({A:regular(7)}),options).rows[0];
assert.ok(highBackground.change_percentile<80);

// CT04: even a lower-background cell becomes high when it rises against itself.
const lowBackgroundSurge=calculateChangePreview(catalog({A:[...regular(30),...Array.from({length:15},(_,index)=>[FORECAST-(index+1)*DAY/2,4.8,0,0])].sort((a,b)=>a[0]-b[0])}),options).rows[0];
assert.ok(lowBackgroundSurge.change_percentile>=80);

// CT05 / CT06: short or missing history is explicitly unavailable, never zero.
const insufficient=calculateChangePreview(catalog({A:[[FORECAST-3*DAY,4.6],[FORECAST-2*DAY,4.7],[FORECAST-DAY,4.8]]}),options).rows[0];
assert.equal(insufficient.status,'insufficient-history');assert.equal(insufficient.change_percentile,null);assert.equal(changeBand(insufficient.change_percentile),0);
const incomplete=calculateChangePreview({latestTimeUtcMs:FORECAST,freshness:{complete:false},eventsByCell:{A:history}},options);assert.equal(incomplete.status,'catalog-incomplete');assert.deepEqual(incomplete.rows,[]);

const mapUi=await readFile(new URL('../src/world/world-map-ui.js',import.meta.url),'utf8'),css=await readFile(new URL('../src/world/world-map.css',import.meta.url),'utf8');
// CT08 / CT09: the existing current rows and outcome overlay remain the respective sources.
for(const token of ["previewMode==='current'",'previewRowFor','eventsAfterPreview',"previewMode==='outcomes'",'forecast-outcome-dots'])assert.ok(mapUi.includes(token),token);
// CT10: the UI states that this is not a probability and never appends a percent sign.
assert.ok(mapUi.includes('地震の発生確率ではありません'));assert.ok(!mapUi.includes('change_percentile}%'));
// CT11: all three 44px-class mobile controls, sheet, ranking and globe remain present.
for(const token of ['data-preview-mode="change"','data-preview-mode="current"','data-preview-mode="outcomes"','world-change-ranking','world-sheet','type:\'globe\''])assert.ok(mapUi.includes(token),token);assert.ok(css.includes('.world-preview-mode button{min-height:42px'));assert.ok(css.includes('@media(max-width:430px)'));
// CT12: changing viewport only schedules map rendering; baseline calculation is keyed elsewhere.
assert.ok(mapUi.includes("map.on('moveend',()=>{syncEarthquakeDepthPresentation();scheduleUpdate()})"));assert.ok(mapUi.includes('const datedCache=new Map(),changeCache=new Map()'));assert.ok(!/moveend[^;]+calculateChangePreview/.test(mapUi));

assert.equal(CHANGE_BASELINE.anchorIntervalMonths,1);assert.equal(CHANGE_BASELINE.minimumHistoricalAnchors,24);assert.equal(CHANGE_BASELINE.minimumHistoryYears,2);
console.log('Earthquake change map acceptance passed: CT01-CT12');
