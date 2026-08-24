const finite=(value,name)=>{const number=Number(value);if(!Number.isFinite(number))throw new TypeError(`${name} must be finite`);return number};
const bounded=(value,name,low,high)=>{const number=finite(value,name);if(number<low||number>high)throw new RangeError(`${name} must be from ${low} to ${high}`);return number};
const iso=(value,name,nullable=false)=>{if(nullable&&value==null)return null;const date=new Date(value);if(Number.isNaN(date.getTime()))throw new TypeError(`${name} must be ISO8601`);return date.toISOString()};
const nullableMetric=(value,name)=>value==null?null:bounded(value,name,0,1);

export function validateForecastRow(input={}){
  const horizonDays=Math.trunc(finite(input.horizon_days,'horizon_days')),actionLevel=Math.trunc(finite(input.action_level,'action_level'));
  if(horizonDays<1)throw new RangeError('horizon_days must be positive');
  if(![0,1,2].includes(actionLevel))throw new RangeError('forecast action_level must be 0, 1 or 2; level 3 belongs to verified official information');
  const forecastTime=iso(input.forecast_time_utc,'forecast_time_utc'),start=iso(input.forecast_window_start_utc,'forecast_window_start_utc'),end=iso(input.forecast_window_end_utc,'forecast_window_end_utc');
  if(new Date(end)<=new Date(start))throw new RangeError('forecast window end must follow start');
  if(new Date(start)<new Date(forecastTime))throw new RangeError('forecast window must not begin before forecast time');
  if((new Date(end)-new Date(start))/86400000!==horizonDays)throw new RangeError('forecast window must match horizon_days');
  if(!input.cell_id||!input.model_version||!input.validation_version)throw new TypeError('forecast identity is required');
  return Object.freeze({
    forecast_time_utc:forecastTime,cell_id:String(input.cell_id),region_name:input.region_name==null?null:String(input.region_name),horizon_days:horizonDays,
    risk_score_0_100:bounded(input.risk_score_0_100,'risk_score_0_100',0,100),confidence_0_100:bounded(input.confidence_0_100,'confidence_0_100',0,100),action_level:actionLevel,
    forecast_window_start_utc:start,forecast_window_end_utc:end,rise_start_utc:iso(input.rise_start_utc,'rise_start_utc',true),historical_precision:nullableMetric(input.historical_precision,'historical_precision'),historical_recall:nullableMetric(input.historical_recall,'historical_recall'),median_lead_days:input.median_lead_days==null?null:Math.max(0,finite(input.median_lead_days,'median_lead_days')),data_quality:bounded(input.data_quality,'data_quality',0,1),top_factors:Object.freeze((input.top_factors||[]).map(String)),model_version:String(input.model_version),validation_version:String(input.validation_version)
  });
}
