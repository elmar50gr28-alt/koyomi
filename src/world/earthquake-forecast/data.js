const eventTime=event=>{const value=new Date(event.datetimeUtc??event.time_utc??event.time);if(Number.isNaN(value.getTime()))throw new TypeError('event timestamp must be valid');return value};

export function historyAvailableAt(events,forecastTime){
  const cutoff=new Date(forecastTime);if(Number.isNaN(cutoff.getTime()))throw new TypeError('forecast time must be valid');
  const history=[];
  for(const event of events||[]){const time=eventTime(event);if(time>=cutoff)throw new RangeError('future leakage blocked: event timestamp must be before forecast time');history.push(Object.freeze({...event,datetimeUtc:time.toISOString()}))}
  return Object.freeze(history.sort((left,right)=>new Date(left.datetimeUtc)-new Date(right.datetimeUtc)));
}

export function assertChronologicalSplit(developmentEvents,holdoutEvents){
  const development=historyAvailableAt(developmentEvents,'2015-01-01T00:00:00.000Z'),holdout=historyAvailableAt(holdoutEvents,'2026-01-01T00:00:00.000Z');
  if(development.some(event=>event.datetimeUtc<'2005-01-01T00:00:00.000Z'))throw new RangeError('development event outside locked period');
  if(holdout.some(event=>event.datetimeUtc<'2015-01-01T00:00:00.000Z'))throw new RangeError('holdout event outside locked period');
  return Object.freeze({development,holdout});
}
