export const EARTHQUAKE_FORECAST_VERSION='2.8.0';

export const EARTHQUAKE_FORECAST_FLAGS=Object.freeze({
  earthquakeForecastEnabled:true,
  experimentalPredictiveUIEnabled:false,
  actionLevel1Enabled:false,
  actionLevel2Enabled:false,
  peakDateEnabled:false,
  tidalModifierEnabled:false,
  bValueStaticStateEnabled:false,
  celestialModifierEnabled:false
});

export const LOCKED_VALIDATION=Object.freeze({
  development:Object.freeze(['2005-01-01','2014-12-31']),
  holdout:Object.freeze(['2015-01-01','2025-12-31']),
  horizonsDays:Object.freeze([1,3,7,14,30])
});

export const EARTHQUAKE_SAFETY_NOTICE='この表示は地震発生確率や公式な地震予知ではありません。避難・津波・防災情報は気象庁・自治体等の公式情報を優先してください。';
