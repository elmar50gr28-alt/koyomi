import {
  buildBirthDateTime,
  calculateSolarTerms,
  normalizeProfile,
  resolveSchoolConfig
} from '../calendar/index.js';
import { applyBirthTimeCorrection } from './time-correction.js';
import { normalizeBaziSettings, toLegacySchoolConfig } from '../settings/index.js';

/**
 * Prepare the calculation datetime without changing the existing correction
 * policy. This groups the former chart-builder sequence behind one boundary.
 */
export function prepareBirthCalculation(
  profile,
  schoolConfigInput = {}
) {
  const baziSettings = normalizeBaziSettings(schoolConfigInput);
  const schoolConfig = resolveSchoolConfig(
    schoolConfigInput?.baziSettings || schoolConfigInput?.calendar
      ? toLegacySchoolConfig(baziSettings)
      : schoolConfigInput
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
    ? applyBirthTimeCorrection(
        birthLocal,
        normalizedInput.place,
        schoolConfig.solar
      )
    : null;

  if (trueSolarTime?.warning) {
    warnings.push(trueSolarTime.warning);
  }

  return {
    schoolConfig,
    baziSettings,
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
