export const CALENDAR_TIME_API = Object.freeze([
  'formatLocalDate',
  'parseLocalDate',
  'startOfLocalDay',
  'formatCalendarDate'
]);

/**
 * Exposes legacy calendar/time behavior behind a stable, side-effect-free API.
 * The supplied functions remain the sole source of calculation behavior.
 */
export function createCalendarTimeCompatibility(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new TypeError('calendar/time legacy adapter is required');
  }

  for (const name of CALENDAR_TIME_API) {
    if (typeof legacy[name] !== 'function') {
      throw new TypeError(`calendar/time legacy function is required: ${name}`);
    }
  }

  return Object.freeze({
    formatLocalDate: (...args) => legacy.formatLocalDate(...args),
    parseLocalDate: (...args) => legacy.parseLocalDate(...args),
    startOfLocalDay: (...args) => legacy.startOfLocalDay(...args),
    formatCalendarDate: (...args) => legacy.formatCalendarDate(...args)
  });
}
