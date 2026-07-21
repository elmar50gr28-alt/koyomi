import {
  calculateDayPillar,
  calculateHourPillar,
  calculateMonthPillar,
  calculateYearPillar
} from '../calendar/index.js';

/**
 * Calculate only the four-pillar foundation from the already resolved
 * calculation datetime. Timezone and true-solar-time correction stay with the
 * caller so this boundary does not change any existing calendar policy.
 */
export function calculatePillarFoundation(
  calculationDate,
  options = {}
) {
  const {
    timeUnknown = false,
    schoolConfig = {}
  } = options;

  const year = calculateYearPillar(
    calculationDate
  );

  const month = calculateMonthPillar(
    calculationDate,
    year.stem.id
  );

  const day = calculateDayPillar(
    calculationDate
  );

  const hour = timeUnknown
    ? null
    : calculateHourPillar(
        calculationDate,
        day.stem.id,
        schoolConfig
      );

  return { year, month, day, hour };
}
