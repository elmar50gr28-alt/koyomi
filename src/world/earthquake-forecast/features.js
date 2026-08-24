import { historyAvailableAt } from './data.js';

const DAY_MS=86400000;
export function buildBaselineFeatures({events,forecastTime,cellId,historyStart='2005-01-01T00:00:00.000Z'}){
  const cutoff=new Date(forecastTime),start=new Date(historyStart);if(Number.isNaN(cutoff.getTime())||Number.isNaN(start.getTime())||start>=cutoff)throw new RangeError('valid history interval is required');
  if(!cellId)throw new TypeError('cellId is required for cell-scoped baseline features');
  const history=historyAvailableAt(events,cutoff).filter(event=>String(event.cell_id??event.cellId)===String(cellId)),ageDays=Math.max(1,(cutoff-start)/DAY_MS),countSince=days=>history.filter(event=>new Date(event.datetimeUtc)>=new Date(cutoff-days*DAY_MS)).length;
  const recentCount7d=countSince(7),recentCount30d=countSince(30),backgroundDailyRate=history.length/ageDays,recentDailyRate7d=recentCount7d/7,recentDailyRate30d=recentCount30d/30;
  return Object.freeze({forecastTimeUtc:cutoff.toISOString(),cellId:String(cellId),historyCount:history.length,backgroundDailyRate,recentCount7d,recentCount30d,recentRateRatio7d:backgroundDailyRate?recentDailyRate7d/backgroundDailyRate:recentDailyRate7d?1:0,recentRateRatio30d:backgroundDailyRate?recentDailyRate30d/backgroundDailyRate:recentDailyRate30d?1:0,latestSourceTimeUtc:history.at(-1)?.datetimeUtc||null});
}
