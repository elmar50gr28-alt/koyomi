import assert from 'node:assert/strict';
import { buildValidationDashboard } from '../src/world/earthquake-forecast/research-validation-presenter.js';

const record=(id,day,{kind='prospective',attention=false,seismic=.1,depth='stable',thermal=20,mundane=20}={})=>({
  predictionId:id,
  recordKind:kind,
  issuedAt:`2026-01-${String(day).padStart(2,'0')}T00:00:00.000Z`,
  calculationAsOf:`2026-01-${String(day).padStart(2,'0')}T00:00:00.000Z`,
  targetCellId:`cell-${id}`,
  target:{label:`地域${id}`,coordinateLabel:`${day}.0, ${day}.0`},
  neighborCellIds:[],
  targetWindow:{startUtc:`2026-01-${String(day).padStart(2,'0')}T00:00:00.000Z`,endUtc:`2026-02-${String(day).padStart(2,'0')}T00:00:00.000Z`,horizonDays:31},
  targetMagnitude:{minimum:5.5},
  targetDepthKm:{minimum:0,maximum:700},
  baselineProbability:.2,
  seismicModel:{status:'available',probability:seismic,attentionValue:seismic},
  depthMigration:{status:'available',direction:depth},
  thermalTransferHypothesis:{status:'available',agreement:thermal},
  divinationResults:{mundane:{status:'available',score:mundane,scientificProbabilityContribution:0}},
  attention:{active:attention,label:attention?'研究上の注目':'平常域'}
});

const evaluation=(item,status,day,{eventId=null}={})=>({
  predictionId:item.predictionId,
  evaluatedAt:`2026-03-${String(day).padStart(2,'0')}T00:00:00.000Z`,
  status,
  matchedEventId:eventId,
  leadDays:eventId?2:null,
  reason:`${status} result`
});

const hit=record('hit',1,{attention:true,seismic:.8,depth:'deep-to-shallow',thermal:80,mundane:20});
const nearby=record('nearby',2,{seismic:.2,depth:'deep-to-shallow',thermal:20,mundane:90});
const falseAlarm=record('false',3,{attention:true,seismic:.9,depth:'stable',thermal:80,mundane:20});
const miss=record('miss',4,{seismic:.1,depth:'stable',thermal:20,mundane:90});
const outside=record('outside',5,{seismic:.1,depth:'stable',thermal:20,mundane:20});
const pending=record('pending',6,{attention:true,seismic:.7});
const insufficient=record('insufficient',7,{attention:true,seismic:.7});
const replay=record('replay',1,{kind:'retrospective-replay',attention:true,seismic:.9,depth:'deep-to-shallow',thermal:90,mundane:90});
const ledger={
  predictions:[hit,nearby,falseAlarm,miss,outside,pending,insufficient,replay],
  evaluations:[
    evaluation(hit,'hit',1,{eventId:'event-1'}),
    evaluation(nearby,'nearby',2,{eventId:'event-2'}),
    evaluation(falseAlarm,'false-alarm',3),
    evaluation(miss,'miss',4,{eventId:'event-3'}),
    evaluation(outside,'out-of-scope',5),
    evaluation(pending,'pending',6),
    evaluation(insufficient,'insufficient-data',7),
    evaluation(replay,'hit',8,{eventId:'replay-event'})
  ]
};

const dashboard=buildValidationDashboard(ledger,{recentLimit:3});
assert.equal(dashboard.latest.record.predictionId,'insufficient','latest card must follow issuance time without inventing a result');
assert.equal(dashboard.latest.evaluation.status,'insufficient-data');
assert.equal(dashboard.pendingCount,1);
assert.equal(dashboard.insufficientCount,1);
assert.equal(dashboard.replayCount,1,'retrospective replay must remain visible but separate');
assert.deepEqual({total:dashboard.lifetime.total,matched:dashboard.lifetime.matched,noMatch:dashboard.lifetime.noMatch,missed:dashboard.lifetime.missed},{total:5,matched:2,noMatch:2,missed:1});
assert.equal(dashboard.lifetime.precision,2/3);
assert.equal(dashboard.lifetime.recall,2/3);
assert.equal(dashboard.lifetime.falseAlarmRate,1/3);
assert.deepEqual({total:dashboard.recent.total,matched:dashboard.recent.matched,noMatch:dashboard.recent.noMatch,missed:dashboard.recent.missed},{total:3,matched:0,noMatch:2,missed:1},'recent window must contain only the three latest settled forward records');
assert.equal(dashboard.lifetime.models.predictionCount,5,'pending, insufficient, and replay rows must not enter model scores');
assert.equal(dashboard.lifetime.models.models.backgroundProbability.n,5);
assert.equal('mundaneProbability' in dashboard.lifetime.models.models,false,'divination must never be disguised as a scientific probability model');
const signals=Object.fromEntries(dashboard.signals.map(signal=>[signal.key,signal]));
assert.equal(signals.seismic.precision,.5);
assert.equal(signals.seismic.recall,1/3);
assert.equal(signals.depth.precision,1);
assert.equal(signals.depth.recall,2/3);
assert.equal(signals.thermal.precision,.5);
assert.equal(signals.mundane.precision,1);
assert.equal(signals.mundane.recall,2/3);
assert.equal(dashboard.lifetime.statisticallyEvaluable,false,'small samples must not be presented as validated accuracy');

const empty=buildValidationDashboard();
assert.equal(empty.latest,null);
assert.equal(empty.recent.total,0);
assert.equal(empty.signals.every(signal=>signal.status==='insufficient-data'),true);
console.log('Earthquake validation dashboard passed');
