import { SCHOOL_PROFILES } from '../data.js';

const clone = value => value && typeof value === 'object' ? structuredClone(value) : value;
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const choice = (value, values, fallback) => values.includes(value) ? value : fallback;
const boolean = (value, fallback) => typeof value === 'boolean' ? value : fallback;

export const DEFAULT_BAZI_SETTINGS = Object.freeze({
  version: 1,
  schoolId: 'koyomi-integrated',
  calendar: Object.freeze({
    dayBoundary: 'midnight',
    ziHour: 'split',
    timeBasis: 'true',
    unknownBirthTime: 'omit-hour-pillar',
    monthCommand: 'solar-term',
    solarTermBoundary: 'longitude'
  }),
  derived: Object.freeze({ hiddenStems: 'weighted', emptyVoid: 'jun' }),
  strength: Object.freeze({ method: 'integrated', weights: Object.freeze({}) }),
  patterns: Object.freeze({
    weights: Object.freeze({}), thresholds: Object.freeze({}),
    allowFollowEstablishment: false, allowTransformationEstablishment: false
  }),
  yongshen: Object.freeze({
    weights: Object.freeze({}), allowUrgentClimatePrimary: true,
    allowSpecialPatternPrimary: false
  }),
  luck: Object.freeze({
    direction: 'gender-year-yin-yang', defaultDirection: 'forward',
    startMethod: 'solar-term-distance', annualBoundary: 'risshun',
    monthlyBoundary: 'solar-term'
  })
});

/** Normalize structured, school-profile, UI, and historical flat settings. */
export function normalizeBaziSettings(input = {}) {
  const raw = object(input?.baziSettings || input?.schoolConfig || input);
  const requestedSchoolId = typeof raw.schoolId === 'string' ? raw.schoolId : DEFAULT_BAZI_SETTINGS.schoolId;
  const schoolId = SCHOOL_PROFILES[requestedSchoolId] ? requestedSchoolId : DEFAULT_BAZI_SETTINGS.schoolId;
  const profile = object(SCHOOL_PROFILES[schoolId]);
  const calendar = object(raw.calendar);
  const derived = object(raw.derived);
  const strength = object(raw.strength);
  const patterns = object(raw.patterns);
  const yongshen = object(raw.yongshen);
  const luck = object(raw.luck);
  const legacyBoundary = raw.boundary === 23 || raw.boundary === '23' ? 'late-zi-next-day'
    : raw.boundary === 0 || raw.boundary === '0' ? 'midnight' : raw.dayBoundary;
  const dayBoundary = choice(calendar.dayBoundary ?? legacyBoundary ?? profile.dayBoundary,
    ['midnight', 'late-zi-next-day'], DEFAULT_BAZI_SETTINGS.calendar.dayBoundary);
  const ziHour = choice(calendar.ziHour ?? raw.ziHour ?? (dayBoundary === 'late-zi-next-day' ? 'late-zi-next-day' : profile.ziHour),
    ['split', 'late-zi-next-day', 'early-zi-same-day', '23', '0'], DEFAULT_BAZI_SETTINGS.calendar.ziHour);
  const normalized = {
    version: 1,
    schoolId,
    calendar: {
      dayBoundary,
      ziHour,
      timeBasis: choice(calendar.timeBasis ?? raw.timeBasis ?? raw.solar, ['standard', 'local', 'true'], DEFAULT_BAZI_SETTINGS.calendar.timeBasis),
      unknownBirthTime: choice(calendar.unknownBirthTime ?? raw.unknownBirthTime, ['omit-hour-pillar'], DEFAULT_BAZI_SETTINGS.calendar.unknownBirthTime),
      monthCommand: choice(calendar.monthCommand ?? raw.monthCommand, ['solar-term'], DEFAULT_BAZI_SETTINGS.calendar.monthCommand),
      solarTermBoundary: choice(calendar.solarTermBoundary ?? raw.term, ['longitude', 'fixed'], DEFAULT_BAZI_SETTINGS.calendar.solarTermBoundary)
    },
    derived: {
      hiddenStems: choice(derived.hiddenStems ?? raw.hidden, ['weighted', 'equal', 'main'], DEFAULT_BAZI_SETTINGS.derived.hiddenStems),
      emptyVoid: choice(derived.emptyVoid ?? raw.kuubo, ['jun', 'none'], DEFAULT_BAZI_SETTINGS.derived.emptyVoid)
    },
    strength: {
      method: typeof (strength.method ?? raw.strengthMethod ?? profile.strengthMethod) === 'string'
        ? (strength.method ?? raw.strengthMethod ?? profile.strengthMethod) : DEFAULT_BAZI_SETTINGS.strength.method,
      weights: clone(object(strength.weights ?? raw.strengthWeights))
    },
    patterns: {
      weights: clone(object(patterns.weights ?? raw.patternWeights)),
      thresholds: clone(object(patterns.thresholds ?? raw.patternThresholds)),
      allowFollowEstablishment: boolean(patterns.allowFollowEstablishment ?? raw.allowFollowPatternEstablishment, false),
      allowTransformationEstablishment: boolean(patterns.allowTransformationEstablishment ?? raw.allowTransformationPatternEstablishment, false)
    },
    yongshen: {
      weights: clone(object(yongshen.weights ?? raw.yongshenWeights)),
      allowUrgentClimatePrimary: boolean(yongshen.allowUrgentClimatePrimary ?? raw.allowUrgentClimatePrimary, true),
      allowSpecialPatternPrimary: boolean(yongshen.allowSpecialPatternPrimary ?? raw.allowSpecialPatternYongshen, false)
    },
    luck: {
      direction: choice(luck.direction ?? raw.luckDirection, ['gender-year-yin-yang'], DEFAULT_BAZI_SETTINGS.luck.direction),
      defaultDirection: choice(luck.defaultDirection ?? raw.defaultLuckDirection, ['forward', 'reverse'], DEFAULT_BAZI_SETTINGS.luck.defaultDirection),
      startMethod: choice(luck.startMethod ?? raw.luckStart ?? profile.luckStart, ['solar-term-distance'], DEFAULT_BAZI_SETTINGS.luck.startMethod),
      annualBoundary: choice(luck.annualBoundary ?? raw.annualBoundary, ['risshun'], DEFAULT_BAZI_SETTINGS.luck.annualBoundary),
      monthlyBoundary: choice(luck.monthlyBoundary ?? raw.monthlyBoundary, ['solar-term'], DEFAULT_BAZI_SETTINGS.luck.monthlyBoundary)
    }
  };
  return normalized;
}

/** Existing cores keep their public flat option API while receiving one normalized source. */
export function toLegacySchoolConfig(settingsInput = {}) {
  const settings = normalizeBaziSettings(settingsInput);
  return {
    schoolId: settings.schoolId,
    dayBoundary: settings.calendar.dayBoundary,
    ziHour: settings.calendar.ziHour,
    solar: settings.calendar.timeBasis,
    hidden: settings.derived.hiddenStems,
    kuubo: settings.derived.emptyVoid,
    term: settings.calendar.solarTermBoundary,
    strengthMethod: settings.strength.method,
    strengthWeights: clone(settings.strength.weights),
    patternWeights: clone(settings.patterns.weights),
    patternThresholds: clone(settings.patterns.thresholds),
    allowFollowPatternEstablishment: settings.patterns.allowFollowEstablishment,
    allowTransformationPatternEstablishment: settings.patterns.allowTransformationEstablishment,
    yongshenWeights: clone(settings.yongshen.weights),
    allowUrgentClimatePrimary: settings.yongshen.allowUrgentClimatePrimary,
    allowSpecialPatternYongshen: settings.yongshen.allowSpecialPatternPrimary,
    defaultLuckDirection: settings.luck.defaultDirection,
    luckStart: settings.luck.startMethod,
    annualBoundary: settings.luck.annualBoundary,
    monthlyBoundary: settings.luck.monthlyBoundary,
    baziSettings: settings
  };
}

export function inspectBaziSettings(input = {}) {
  const settings = normalizeBaziSettings(input);
  return { settings, defaults: clone(DEFAULT_BAZI_SETTINGS), legacy: toLegacySchoolConfig(settings) };
}
