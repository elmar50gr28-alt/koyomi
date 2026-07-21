import {
  buildBirthDateTime,
  calculateSolarTerms,
  calculateTrueSolarTime,
  normalizeProfile,
  resolveSchoolConfig
} from '../calendar/index.js';

/**
 * Prepare the calculation datetime without changing the existing correction
 * policy. This groups the former chart-builder sequence behind one boundary.
 */
export function prepareBirthCalculation(
  profile,
  schoolConfigInput = {}
) {
  const schoolConfig = resolveSchoolConfig(
    schoolConfigInput
  );

  const normalizedInput = normalizeProfile(
    profile
  );

  const birthLocal = buildBirthDateTime(
    normalizedInput
  );

  const warnings = [];

  if (!normalizedInput.date) {
    warnings.push('birth-date-missing');
  }

  if (normalizedInput.timeUnknown) {
    warnings.push(
      'birth-time-unknown-hour-pillar-partial'
    );
  }

  const trueSolarTime = birthLocal
    ? calculateTrueSolarTime(
        birthLocal,
        normalizedInput.place.longitude,
        normalizedInput.place.utcOffset
      )
    : null;

  if (trueSolarTime?.warning) {
    warnings.push(trueSolarTime.warning);
  }

  return {
    schoolConfig,
    normalizedInput,
    birthLocal,
    trueSolarTime,
    calculationDate:
      trueSolarTime?.date ||
      birthLocal ||
      new Date(),
    solarTerms: birthLocal
      ? calculateSolarTerms(
          birthLocal,
          normalizedInput.place.timezone
        )
      : [],
    warnings
  };
}
