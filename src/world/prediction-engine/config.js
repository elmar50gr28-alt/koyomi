export const WORLD_PREDICTION_ENGINE_VERSION='koyomi-world-v1';
export const SEISMIC_BASELINE_VERSION='seismic-baseline-v1';
export const SEISMIC_SHORT_TERM_VERSION='seismic-shortterm-v1';
export const SNAPSHOT_SCHEMA_ID='koyomi-prediction-snapshot-v1';
export const SUPPORTED_HORIZONS_DAYS=Object.freeze([1,3,7,14]);
export const SUPPORTED_MAGNITUDES=Object.freeze([5,5.5,6,6.5]);
export const DEFAULT_FORECAST=Object.freeze({horizonDays:7,magnitudeThreshold:5.5});
export const LIFT_THRESHOLDS=Object.freeze({slightlyElevated:1.25,elevated:1.75,high:2.5,veryHigh:4});

export const FEATURE_REGISTRY=Object.freeze([
  Object.freeze({id:'seismic-density',name:'長期地震密度',category:'baseline',enabled:true,experimental:false,version:'1'}),
  Object.freeze({id:'recent-event-count',name:'直近地震回数',category:'seismic',enabled:true,experimental:false,version:'1'}),
  Object.freeze({id:'maximum-magnitude',name:'直近最大マグニチュード',category:'seismic',enabled:true,experimental:false,version:'1'}),
  Object.freeze({id:'cumulative-magnitude',name:'累積マグニチュード',category:'seismic',enabled:true,experimental:false,version:'1'}),
  Object.freeze({id:'distance-to-large-event',name:'直近大地震までの距離',category:'seismic',enabled:true,experimental:false,version:'1'}),
  Object.freeze({id:'seismic-rate-change',name:'地震活動率変化',category:'seismic',enabled:true,experimental:false,version:'1'}),
  Object.freeze({id:'volcano-observation',name:'火山観測変化',category:'volcano',enabled:false,experimental:true,version:'1'}),
  Object.freeze({id:'geomagnetic-lag',name:'地磁気遅延',category:'electromagnetic',enabled:false,experimental:true,version:'1'}),
  Object.freeze({id:'mundane-astrology',name:'マンデン占術',category:'mundane',enabled:true,experimental:true,version:'3'})
]);
