import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { calculateDepthMigration } from '../src/world/earthquake-forecast/depth-migration.js';
import { classifyThermalSource,classifyThermalSources } from '../src/world/earthquake-forecast/thermal-source-exclusions.js';
import { createDisconnectedSurfaceTemperatureDataset,surfaceTemperatureForCell,validateSurfaceTemperatureDataset } from '../src/world/earthquake-forecast/surface-temperature-adapter.js';
import { evaluateThermalTransferHypothesis } from '../src/world/earthquake-forecast/thermal-transfer-hypothesis.js';
import { createPredictionRecord } from '../src/world/earthquake-forecast/prediction-schema.js';
import { appendPrediction,loadPredictionLedger } from '../src/world/earthquake-forecast/prediction-ledger.js';
import { compareValidationModels,evaluatePrediction,groupPredictionEpisodes } from '../src/world/earthquake-forecast/prediction-evaluation.js';
import { attentionState,attentionSummary,dataQualityText,depthMigrationText,thermalTransferText } from '../src/world/earthquake-forecast/research-validation-presenter.js';
import { aggregateSurfaceTemperatureRows } from '../scripts/aggregate-surface-temperature-grid.mjs';

const DAY=86_400_000,at=day=>Date.parse(`2026-01-${String(day).padStart(2,'0')}T00:00:00Z`),event=(day,depthKm,cellId='A',magnitude=5.5)=>({timeUtc:new Date(at(day)).toISOString(),magnitude,latitude:35+day/100,longitude:139+day/100,depthKm,cellId,id:`e${day}`});
const migrationEvents=[event(1,300),event(2,280),event(3,260),event(4,240),event(17,90,'B'),event(18,80,'B'),event(19,70,'B'),event(20,60,'B')];
assert.equal(calculateDepthMigration(migrationEvents.slice(0,7),{asOf:'2026-02-01T00:00:00Z',windowStart:'2026-01-01T00:00:00Z',targetCellId:'A',neighborCellIds:['B']}).status,'insufficient-data','minimum event count must fail closed');
const futureEvent={...event(25,1_000,'A'),timeUtc:'2026-02-02T00:00:00Z'};
const migration=calculateDepthMigration([...migrationEvents,futureEvent],{asOf:'2026-02-01T00:00:00Z',windowStart:'2026-01-01T00:00:00Z',targetCellId:'A',neighborCellIds:['B']});assert.equal(migration.status,'available');assert.equal(migration.usedCount,8,'future observation must be excluded');assert.equal(migration.direction,'deep-to-shallow');assert.equal(migration.neighborMigration.moved,true);assert.equal(migration.depthBandProportions.shallow,.125);

const asOf='2026-01-10T00:00:00Z',volcano={id:'v1',latitude:35,longitude:139},fixed={id:'f1',type:'industrial',latitude:36,longitude:140};
assert.equal(classifyThermalSource({timeUtc:'2026-01-09T12:00:00Z',latitude:35,longitude:139,confidence:'h',provider:'NASA FIRMS'},{asOf,volcanoes:[volcano]}).classification,'active-volcano');
assert.equal(classifyThermalSource({timeUtc:'2026-01-09T12:00:00Z',latitude:36,longitude:140,confidence:'h'},{asOf,fixedHeatSources:[fixed]}).classification,'industrial');
assert.equal(classifyThermalSource({timeUtc:'2026-01-09T12:00:00Z',latitude:10,longitude:10,confidence:'h',provider:'NASA FIRMS'},{asOf}).classification,'possible-wildfire');
assert.equal(classifyThermalSource({timeUtc:'2026-01-09T12:00:00Z',latitude:10,longitude:10,confidence:'l'},{asOf}).classification,'low-confidence');
assert.equal(classifyThermalSource({timeUtc:'2026-01-01T00:00:00Z',latitude:10,longitude:10,confidence:'h'},{asOf}).classification,'stale');
assert.equal(classifyThermalSources([{timeUtc:'2026-01-09T12:00:00Z',latitude:10,longitude:10,confidence:'h',multiSensorConfirmed:true}],{asOf}).eligibleCount,0,'phase 1 classifies multi-sensor FIRMS-like observations but never promotes them into earthquake probability');

const fixture=validateSurfaceTemperatureDataset(JSON.parse(await readFile(new URL('./fixtures/surface-temperature-grid-v1.json',import.meta.url),'utf8'))),surface=surfaceTemperatureForCell(fixture,{cellId:'fixture-cell',asOf:'2026-01-10T00:00:00Z'});assert.equal(surface.status,'available');assert.equal(surface.monthlyTimeBaselineDeviationC,2.1);assert.equal(surfaceTemperatureForCell(createDisconnectedSurfaceTemperatureDataset({generatedAt:asOf}),{cellId:'A',asOf}).status,'data-unavailable');
const missingTemperature=validateSurfaceTemperatureDataset({...fixture,rows:[{...fixture.rows[0],surfaceTemperatureC:null}]});assert.equal(surfaceTemperatureForCell(missingTemperature,{cellId:'fixture-cell',asOf:'2026-01-10T00:00:00Z'}).status,'insufficient-data','missing observations must never become zero');
const aggregated=aggregateSurfaceTemperatureRows(fixture.rows,{generatedAt:asOf,source:fixture.source});assert.equal(aggregated.rows.length,1);assert.equal(aggregated.source.provider,'test-fixture-only');
const blockedHypothesis=evaluateThermalTransferHypothesis({depthMigration:migration,surfaceTemperature:{status:'data-unavailable'},sourceExclusions:{status:'insufficient-data'},dataQuality:{status:'insufficient-data'},spatialMatch:{status:'insufficient-data'},temporalMatch:{status:'insufficient-data'}});assert.equal(blockedHypothesis.status,'insufficient-data');assert.equal(blockedHypothesis.agreement,null);assert.equal(blockedHypothesis.scientificProbabilityContribution,0,'FIRMS or missing surface data must never raise probability');

const baseInput={issuedAt:'2026-01-10T00:00:00Z',targetCellId:'A',neighborCellIds:['B'],targetWindow:{startUtc:'2026-01-10T00:00:00Z',endUtc:'2026-01-17T00:00:00Z'},targetMagnitude:{minimum:5.5},targetDepthKm:{minimum:10,maximum:100},baselineProbability:.1,seismicModel:{probability:.2},depthMigration:migration,thermalTransferHypothesis:blockedHypothesis,divinationResults:{mundane:{score:80,scientificProbabilityContribution:0}},latestDataTimes:{earthquake:'2026-01-09T00:00:00Z',surfaceTemperature:null},versions:{engine:'v1',dataSchema:'v1'},attention:{active:true,label:'研究上の注目'}};
await assert.rejects(()=>createPredictionRecord({...baseInput,latestDataTimes:{earthquake:'2026-01-11T00:00:00Z'}},{cryptoImpl:webcrypto}),/future data leakage/);
const record=await createPredictionRecord(baseInput,{cryptoImpl:webcrypto}),memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};assert.equal(appendPrediction(record,{storage}).stored,true);assert.equal(appendPrediction(record,{storage}).reason,'already-exists');assert.equal(loadPredictionLedger(storage).predictions.length,1,'issued record must be append-only');
const fullStorage={getItem:()=>null,setItem:()=>{throw new DOMException('full','QuotaExceededError')}};const memoryOnly=appendPrediction(record,{storage:fullStorage});assert.equal(memoryOnly.stored,false);assert.equal(memoryOnly.ledger.predictions.length,1,'quota failure must retain the newly issued immutable record in memory');
const replay=await createPredictionRecord({...baseInput,recordKind:'retrospective-replay',issuedAt:'2026-01-30T00:00:00Z',calculationAsOf:'2026-01-10T00:00:00Z'},{cryptoImpl:webcrypto});assert.equal(replay.recordKind,'retrospective-replay');assert.equal(replay.issuedAt,'2026-01-30T00:00:00.000Z');assert.equal(replay.calculationAsOf,'2026-01-10T00:00:00.000Z','past replay cutoff and actual issue time must remain distinct');
const boundary=evaluatePrediction(record,[event(12,100,'A',5.5)],{asOf:'2026-01-18T00:00:00Z',catalogThroughUtc:'2026-01-18T00:00:00Z'});assert.equal(boundary.status,'hit','magnitude and depth boundaries are inclusive');
const nearby=evaluatePrediction(record,[event(12,50,'B',5.6)],{asOf:'2026-01-18T00:00:00Z',catalogThroughUtc:'2026-01-18T00:00:00Z'});assert.equal(nearby.status,'nearby');
assert.equal(evaluatePrediction(record,[event(12,50,'OUTSIDE',6.5)],{asOf:'2026-01-18T00:00:00Z',catalogThroughUtc:'2026-01-18T00:00:00Z'}).status,'false-alarm','events outside the fixed target and neighbors must not match');
assert.equal(evaluatePrediction(record,[],{asOf:'2026-01-12T00:00:00Z'}).status,'pending');
assert.equal(evaluatePrediction(record,[],{asOf:'2026-01-18T00:00:00Z',catalogThroughUtc:'2026-01-15T00:00:00Z'}).status,'insufficient-data');
const record2=await createPredictionRecord({...baseInput,issuedAt:'2026-01-11T00:00:00Z',targetWindow:{startUtc:'2026-01-11T00:00:00Z',endUtc:'2026-01-18T00:00:00Z'},latestDataTimes:{earthquake:'2026-01-10T00:00:00Z'}},{cryptoImpl:webcrypto});assert.equal(groupPredictionEpisodes([record,record2]).length,1,'consecutive identical predictions must form one episode');
const score=compareValidationModels([{record,evaluation:boundary,outcome:1,backgroundProbability:.2,seismicProbability:.6,depthProbability:.7,thermalProbability:.8},{record:record2,evaluation:{...nearby,status:'false-alarm'},outcome:0,backgroundProbability:.2,seismicProbability:.1,depthProbability:.1,thermalProbability:.1}]);assert.ok(Math.abs(score.models.backgroundProbability.brierScore-.34)<1e-12);assert.ok(score.models.seismicProbability.logLoss<score.models.backgroundProbability.logLoss);assert.equal(score.models.thermalProbability.n,2);assert.equal(score.models.seismicProbability.calibration.reduce((sum,bin)=>sum+bin.count,0),2);
const missingModelScore=compareValidationModels([{record,evaluation:boundary,outcome:1,backgroundProbability:.2,seismicProbability:.6,depthProbability:null,thermalProbability:null}]);assert.equal(missingModelScore.models.depthProbability.status,'insufficient-data');assert.equal(missingModelScore.models.depthProbability.n,0,'missing probability must not be evaluated as zero');assert.equal(missingModelScore.models.thermalProbability.n,0);

assert.deepEqual(attentionState({attentionBand:4}),{key:'attention',label:'研究上の注目',shortLabel:'注目',symbol:'!'});
assert.equal(attentionState({attentionBand:3}).label,'変化を観察');
assert.equal(attentionState({attentionBand:1}).label,'平常域');
assert.equal(attentionState({attentionBand:null}).label,'判定不能');
assert.match(attentionSummary({attentionBand:4,divinationStatus:'available'},{thermal:{status:'insufficient-data'}}),/地震活動とマンデン占術/);
assert.match(attentionSummary({attentionBand:null},{thermal:{status:'insufficient-data'}}),/観測が不足/);
assert.match(depthMigrationText(migration),/深部から浅部/);
assert.match(thermalTransferText(blockedHypothesis),/地表温度データ未接続/);
assert.equal(dataQualityText({migration,surface:{status:'data-unavailable'}}),'震源深度 8件・地表温度未接続');

const [ui,css,worker,app]=await Promise.all(['../src/world/earthquake-forecast/research-validation-ui.js','../src/world/world-map.css','../service-worker.js','../app.html'].map(path=>readFile(new URL(path,import.meta.url),'utf8')));
for(const text of ['現在の見立てへ戻る','予測記録を見る','過去の答え合わせ','熱移送仮説','地震が起きる確率ではありません','公的機関の情報を優先'])assert.ok(ui.includes(text),`validation UI missing: ${text}`);
for(const forbidden of ['地震が起きます','安全です','科学的に証明済み','熱移送を確認','予知成功'])assert.ok(!ui.includes(forbidden));
assert.match(css,/@media\(max-width:600px\)[^{]*\{[^}]*earthquake-validation-panel/s);
assert.match(css,/earthquake-validation-grid\{grid-template-columns:1fr/);
for(const asset of ['depth-migration.js','thermal-source-exclusions.js','prediction-ledger.js','prediction-evaluation.js','research-validation-ui.js','surface-temperature-adapter.js'])assert.ok(worker.includes(asset),`${asset} must be cached offline`);
assert.match(ui,/value!=null&&Number\.isFinite\(Number\(value\)\)/,'missing UI values must not be formatted as zero');
for(const text of ['いま注目する場所','なぜこの結果？','地図で場所を見る','過去の答え合わせを見る','この見立ては期間終了後に自動で答え合わせされます'])assert.ok(ui.includes(text),`readable UI missing: ${text}`);
assert.ok(!ui.includes('role="tablist"'),'default earthquake result must not start with competing tabs');
assert.match(ui,/regions=\[\.\.\.\(value\|\|\[\]\)\]\.slice\(0,3\)/,'attention list must be limited to three regions');
assert.ok(worker.includes('research-validation-presenter.js'),'readable presenter must work offline');
assert.match(app,/readable-attention-ui/,'app must request the readable attention UI generation');
console.log('Earthquake thermal validation engine passed');
