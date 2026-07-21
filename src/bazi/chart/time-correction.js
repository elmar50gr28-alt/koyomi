import { calculateTrueSolarTime } from '../calendar/index.js';

/**
 * Apply the selected birth-time basis. The historical default remains true
 * solar time, while an explicit `standard` setting keeps the entered time.
 */
export function applyBirthTimeCorrection(
  birthLocal,
  place = {},
  solarSetting = 'true'
) {
  if (!birthLocal) return null;

  if (solarSetting === 'standard') {
    return {
      date: new Date(birthLocal.getTime()),
      minutesOffset: 0,
      precision: 'standard-time',
      warning: null
    };
  }

  return calculateTrueSolarTime(
    birthLocal,
    place.longitude,
    place.utcOffset
  );
}
