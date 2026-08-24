import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  EARTHQUAKE_FORECAST_FLAGS,EARTHQUAKE_SAFETY_NOTICE,LOCKED_VALIDATION,actionLevelFor,assertChronologicalSplit,
  buildBaselineFeatures,createForecastUiModel,evaluateHoldoutRows,historyAvailableAt,peakDisplayMode,releaseGate,
  renderForecastShell,runBaselineModel,validateForecastRow,validateLockedPeriods
} from '../src/world/earthquake-forecast/index.js';

const event=(datetimeUtc,id='event',cell_id='cell')=>({id,datetimeUtc,cell_id});

// AT01: forecast features may only use information strictly before forecast time.
assert.throws(()=>historyAvailableAt([event('2025-01-01T00:00:00Z')],'2025-01-01T00:00:00Z'),/future leakage blocked/);
assert.throws(()=>buildBaselineFeatures({events:[event('2025-01-02T00:00:00Z')],forecastTime:'2025-01-01T00:00:00Z',cellId:'cell'}),/future leakage blocked/);
const features=buildBaselineFeatures({events:[event('2024-12-01T00:00:00Z'),event('2024-12-30T00:00:00Z'),event('2024-12-31T00:00:00Z'),event('2024-12-31T00:00:00Z','other','other-cell')],forecastTime:'2025-01-01T00:00:00Z',cellId:'cell'});
assert.equal(features.latestSourceTimeUtc,'2024-12-31T00:00:00.000Z');assert.equal(features.recentCount7d,2);
assert.equal(features.historyCount,3,'baseline history must remain scoped to one H3 cell');assert.throws(()=>buildBaselineFeatures({events:[],forecastTime:'2025-01-01T00:00:00Z'}),/cellId is required/);

// AT02: chronological periods are frozen and non-overlapping.
assert.equal(validateLockedPeriods(),true);assert.deepEqual(LOCKED_VALIDATION.development,['2005-01-01','2014-12-31']);assert.deepEqual(LOCKED_VALIDATION.holdout,['2015-01-01','2025-12-31']);
assert.throws(()=>validateLockedPeriods({development:['2006-01-01','2014-12-31'],holdout:['2015-01-01','2025-12-31']}),/must not change/);
const split=assertChronologicalSplit([event('2005-01-01T00:00:00Z')],[event('2025-12-31T23:59:59Z')]);assert.equal(split.development.length,1);assert.equal(split.holdout.length,1);

// Baseline is deterministic and contains only background/recent-rate factors.
const baseline=runBaselineModel(features,7);assert.ok(baseline.backgroundProbability>0&&baseline.backgroundProbability<1);assert.ok(baseline.modelProbability>0&&baseline.modelProbability<1);assert.deepEqual(baseline.topFactors,['背景活動率','直近7日活動率','直近30日活動率']);
for(const forbidden of ['潮汐','b値','天体','地磁気'])assert.ok(!baseline.topFactors.some(item=>item.includes(forbidden)));

// AT03 and AT06: predictive display and every unvalidated modifier default off.
assert.equal(EARTHQUAKE_FORECAST_FLAGS.earthquakeForecastEnabled,true);for(const key of ['experimentalPredictiveUIEnabled','actionLevel1Enabled','actionLevel2Enabled','peakDateEnabled','tidalModifierEnabled','bValueStaticStateEnabled','celestialModifierEnabled'])assert.equal(EARTHQUAKE_FORECAST_FLAGS[key],false,`${key} must default off`);

const passingMetrics={n_holdout_rows:1000,n_target_events:60,background_logloss:.6,model_logloss:.5,background_brier:.2,model_brier:.18,information_gain_nats_per_row:.1,event_recall:.5,alert_precision:.3,false_alert_fraction:.08,median_lead_days:2,peak_window_hit_rate:.6,topk_region_recall:.5};
const realHoldout={realHoldout:true,validationVersion:'2.8.0',dataset:{development_start:'2005-01-01',development_end:'2014-12-31',holdout_start:'2015-01-01',holdout_end:'2025-12-31',target_magnitude_threshold:6.5},sourceManifest:{provider:'GCMT',sha256:'a'.repeat(64),recordCount:1000},horizons:LOCKED_VALIDATION.horizonsDays.map(horizon_days=>({horizon_days,...passingMetrics}))};
assert.deepEqual(releaseGate(realHoldout),{allowed:false,reason:'predictive-ui-disabled'});
const releaseFlags={...EARTHQUAKE_FORECAST_FLAGS,experimentalPredictiveUIEnabled:true};assert.equal(releaseGate(realHoldout,releaseFlags).allowed,true);
assert.deepEqual(releaseGate({...realHoldout,sourceManifest:null},releaseFlags),{allowed:false,reason:'real-holdout-required'},'a boolean claim without verified source provenance must never release the UI');

// AT07: a noisy or baseline-inferior model cannot pass the display gate.
const noisy={...realHoldout,horizons:realHoldout.horizons.map(item=>({...item,model_logloss:.7,information_gain_nats_per_row:-.1}))};assert.equal(releaseGate(noisy,releaseFlags).allowed,false);
const metrics=evaluateHoldoutRows([{outcome:1,backgroundProbability:.1,modelProbability:.7,alert:true,leadDays:2,peakHit:true,regionRank:1},{outcome:0,backgroundProbability:.1,modelProbability:.05,alert:false}]);assert.ok(metrics.model_logloss<metrics.background_logloss);assert.equal(metrics.event_recall,1);
assert.equal(evaluateHoldoutRows([{outcome:1,backgroundProbability:.1,modelProbability:.7,alert:true,leadDays:1},{outcome:1,backgroundProbability:.1,modelProbability:.7,alert:true,leadDays:3}]).median_lead_days,2);

// AT04: model output can never produce Level 3; only official information can.
const actionFlags={...EARTHQUAKE_FORECAST_FLAGS,actionLevel1Enabled:true,actionLevel2Enabled:true};assert.equal(actionLevelFor({riskScore:100,displayAllowed:true},actionFlags),2);assert.equal(actionLevelFor({riskScore:100,displayAllowed:true,officialInformation:true},actionFlags),2);assert.equal(actionLevelFor({riskScore:100,displayAllowed:true,officialInformation:{active:true,provider:'unverified'}},actionFlags),2);assert.equal(actionLevelFor({riskScore:100,displayAllowed:true,officialInformation:{active:true,provider:'JMA'}},actionFlags),3);assert.equal(actionLevelFor({riskScore:100,displayAllowed:false},actionFlags),0);

// AT08: peak date is downgraded unless both flag and locked-holdout threshold pass.
assert.equal(peakDisplayMode({peak_window_hit_rate:1}), 'window');assert.equal(peakDisplayMode({peak_window_hit_rate:.54},{...EARTHQUAKE_FORECAST_FLAGS,peakDateEnabled:true}),'window');assert.equal(peakDisplayMode({peak_window_hit_rate:.55},{...EARTHQUAKE_FORECAST_FLAGS,peakDateEnabled:true}),'date');

const row=validateForecastRow({forecast_time_utc:'2026-01-01T00:00:00Z',cell_id:'cell',region_name:'東京',horizon_days:7,risk_score_0_100:72,confidence_0_100:60,action_level:1,forecast_window_start_utc:'2026-01-01T00:00:00Z',forecast_window_end_utc:'2026-01-08T00:00:00Z',rise_start_utc:null,historical_precision:.3,historical_recall:.5,median_lead_days:2,data_quality:.8,top_factors:['背景活動率'],model_version:'model',validation_version:'2.8.0'});
assert.equal(row.risk_score_0_100,72);assert.ok(Object.isFrozen(row));
assert.throws(()=>validateForecastRow({...row,action_level:3}),/verified official information/);
assert.throws(()=>validateForecastRow({...row,forecast_window_end_utc:'2026-01-09T00:00:00Z'}),/match horizon_days/);

// AT05 and AT09: score is not probability, and official-information priority is always present.
const hiddenModel=createForecastUiModel({releaseResult:realHoldout,row});assert.equal(hiddenModel.visible,false);assert.equal(renderForecastShell(hiddenModel),'');
const visibleModel=createForecastUiModel({releaseResult:realHoldout,row},releaseFlags),html=renderForecastShell(visibleModel);assert.ok(html.includes('相対リスク指標 72 / 100'));assert.ok(!/発生確率\s*72|72\s*%/.test(html));assert.ok(html.includes(EARTHQUAKE_SAFETY_NOTICE));assert.match(EARTHQUAKE_SAFETY_NOTICE,/気象庁・自治体等の公式情報を優先/);

// AT10: existing World globe, bottom sheet and six-item mobile navigation remain untouched.
const [app,mapUi,mapCss,worker]=await Promise.all(['../app.html','../src/world/world-map-ui.js','../src/world/world-map.css','../service-worker.js'].map(path=>readFile(new URL(path,import.meta.url),'utf8')));
const mobileNav=app.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0]||'';assert.equal((mobileNav.match(/<button/g)||[]).length,6);assert.ok(mapUi.includes("map.setProjection({type:'globe'})"));assert.ok(mapUi.includes('world-sheet'));assert.ok(mapCss.includes('.world-sheet'));assert.ok(mapCss.includes('min-height:44px')||app.includes('min-height:46px'));
assert.ok(!app.includes('earthquake-forecast'),'predictive UI module must not be mounted before the real holdout release gate passes');assert.ok(!mapUi.includes('earthquake-forecast'),'existing World map must remain independent of the disabled predictive shell');
for(const asset of ['index.js','config.js','types.js','data.js','features.js','model.js','validation.js','display-policy.js','action-policy.js','ui.js'])assert.ok(worker.includes(`./src/world/earthquake-forecast/${asset}`),`${asset} must be cached offline`);

console.log('Earthquake forecast v2.8 safety acceptance passed: AT01-AT10');
