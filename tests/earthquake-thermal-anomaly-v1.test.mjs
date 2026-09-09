import assert from 'node:assert/strict';
import { FEATURE_REGISTRY,applyThermalCandidate,buildThermalAnomalyFeatures,compareThermalIncrement,thermalCandidateGate } from '../src/world/prediction-engine/index.js';

const AS_OF='2020-02-03T00:00:00Z';
const cells=['target','neighbor-a','neighbor-b'];
const observation=(cellId,timeUtc,nighttimeLSTK,overrides={})=>({cellId,timeUtc,nighttimeLSTK,localSolarHour:2,weatherAdjustmentK:0,sensorId:'MODIS-Terra',quality:{cloudFree:true,lstErrorK:.5,viewAngleDegrees:10,emissivityError:.005},confounders:{fire:false,volcano:false,industrial:false,snow:false},...overrides});
const history=[];
for(let year=2010;year<2020;year+=1)for(const cell of cells)for(const day of [28,29,30])history.push(observation(cell,`${year}-01-${day}T02:00:00Z`,300+(day-29)*.1));
const recent=cells.flatMap(cell=>[observation(cell,'2020-01-29T02:00:00Z',304),observation(cell,'2020-02-01T02:00:00Z',304.5)]);

const active=buildThermalAnomalyFeatures([...history,...recent],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF});
assert.equal(active.status,'candidate-active');
assert.ok(active.positiveEvidence>0);assert.equal(active.negativeEvidence,0);assert.equal(active.positivePersistence,1);assert.equal(active.positiveSpatialCoherence,1);assert.equal(active.scientificProbabilityContribution,0);assert.equal(active.reviewStatus,'research-only');
assert.ok(active.sourceIds.includes('NASA-MOD11-LST-USER-GUIDE'));

const future=observation('target','2020-02-04T02:00:00Z',330);
assert.deepEqual(buildThermalAnomalyFeatures([...history,...recent,future],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF}),active,'future observations must not enter thermal features');

const weatherOnly=cells.flatMap(cell=>[observation(cell,'2020-01-29T02:00:00Z',304,{weatherAdjustmentK:4}),observation(cell,'2020-02-01T02:00:00Z',304.5,{weatherAdjustmentK:4.5})]),weatherAdjusted=buildThermalAnomalyFeatures([...history,...weatherOnly],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF});
assert.equal(weatherAdjusted.status,'inactive','weather-explained warming must not become a thermal candidate');

const badRecent=cells.flatMap(cell=>[observation(cell,'2020-01-29T02:00:00Z',320,{quality:{cloudFree:false,lstErrorK:3,viewAngleDegrees:60,emissivityError:.03}}),observation(cell,'2020-02-01T02:00:00Z',320,{confounders:{fire:true}})]),bad=buildThermalAnomalyFeatures([...history,...badRecent],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF});
assert.notEqual(bad.status,'candidate-active','cloud, low-quality and fire observations must be excluded');
const missingQuality=buildThermalAnomalyFeatures([...history,...cells.map(cell=>observation(cell,'2020-02-01T02:00:00Z',320,{weatherAdjustmentK:null}))],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF});assert.notEqual(missingQuality.status,'candidate-active','missing weather correction must not be treated as zero');

const cold=cells.flatMap(cell=>[observation(cell,'2020-01-29T02:00:00Z',296),observation(cell,'2020-02-01T02:00:00Z',295.5)]),negative=buildThermalAnomalyFeatures([...history,...cold],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF});assert.equal(negative.status,'candidate-active');assert.equal(negative.positiveEvidence,0);assert.ok(negative.negativeEvidence>0,'cooling and warming must remain separate channels');

const single=cells.map(cell=>observation(cell,'2020-02-01T02:00:00Z',304.5)),notPersistent=buildThermalAnomalyFeatures([...history,...single],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF});assert.equal(notPersistent.status,'inactive','one observation must not pass persistence');
const asynchronous=[observation('target','2020-01-31T02:00:00Z',304),observation('target','2020-02-01T02:00:00Z',304.5),...['neighbor-a','neighbor-b'].flatMap(cell=>[observation(cell,'2020-01-27T02:00:00Z',304),observation(cell,'2020-01-28T02:00:00Z',304.5)])],notCoherent=buildThermalAnomalyFeatures([...history,...asynchronous],{cellId:'target',neighborCellIds:['neighbor-a','neighbor-b'],asOf:AS_OF,spatialTimeToleranceHours:36});assert.equal(notCoherent.status,'inactive','different-day neighbor anomalies must not be treated as spatial coherence');

const noNeighbors=buildThermalAnomalyFeatures([...history,...recent],{cellId:'target',neighborCellIds:[],asOf:AS_OF});
assert.equal(noNeighbors.status,'insufficient-spatial-coverage');assert.equal(noNeighbors.positiveEvidence,0);

const candidate=applyThermalCandidate({seismicProbability:.1,horizonDays:7,thermalFeatures:active,coefficients:{positive:.5,negative:0}});assert.ok(candidate.thermalModelProbability>.1);assert.equal(candidate.publishable,false);assert.equal(candidate.scientificProbabilityContribution,0);
const withheld=applyThermalCandidate({seismicProbability:.1,horizonDays:7,thermalFeatures:noNeighbors,coefficients:{positive:.5,negative:0}});assert.equal(withheld.thermalModelProbability,null);assert.equal(withheld.status,'withheld');

const rows=[{outcome:1,seismicProbability:.1,thermalModelProbability:.7,foldId:'a'},{outcome:0,seismicProbability:.1,thermalModelProbability:.05,foldId:'a'},{outcome:1,seismicProbability:.1,thermalModelProbability:.7,foldId:'b'},{outcome:0,seismicProbability:.1,thermalModelProbability:.05,foldId:'b'}],comparison=compareThermalIncrement(rows,{alertThreshold:.6});assert.ok(comparison.informationGain>0);assert.ok(comparison.brierImprovement>0);assert.equal(comparison.positiveFoldCount,2);assert.equal(comparison.spaceTimeAlarmFraction,.5);
assert.throws(()=>compareThermalIncrement([{outcome:1,seismicProbability:.1,thermalModelProbability:2,foldId:'a'}]),/probabilities/);
const blocked=thermalCandidateGate(comparison,{formulaLocked:true,realHoldoutExecuted:false,informationGainLower95:.01,negativeControlsPassed:true,minimumEvents:1,minimumFolds:2,minimumPositiveFolds:2,maximumSpaceTimeAlarmFraction:.6});assert.equal(blocked.accepted,false);assert.ok(blocked.failures.includes('real-holdout-required'));
const accepted=thermalCandidateGate(comparison,{formulaLocked:true,realHoldoutExecuted:true,informationGainLower95:.01,negativeControlsPassed:true,minimumEvents:1,minimumFolds:2,minimumPositiveFolds:2,maximumSpaceTimeAlarmFraction:.6});assert.equal(accepted.accepted,true);
assert.equal(thermalCandidateGate(undefined,{formulaLocked:true,realHoldoutExecuted:true,informationGainLower95:.01,negativeControlsPassed:true}).accepted,false,'missing evaluation must fail closed');

const registry=FEATURE_REGISTRY.find(item=>item.id==='earthquake-thermal-anomaly');assert.equal(registry.enabled,false);assert.equal(registry.experimental,true);assert.equal(registry.reviewStatus,'research-only');

console.log('KOYOMI earthquake thermal anomaly candidate v1 passed');
