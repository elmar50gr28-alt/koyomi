import { BRANCHES, SCHOOL_PROFILES, STEMS } from '../data.js';

const stemById = Object.fromEntries(STEMS.map(stem => [stem.id, stem]));
const branchById = Object.fromEntries(BRANCHES.map(branch => [branch.id, branch]));

/**
 * 国立天文台「暦要項」を基準にした、日本中央標準時の立春時刻。
 *
 * 正式な基準データ：
 * data/bazi/solar-term-boundaries.json
 *
 * 現段階では、ブラウザとNode.jsの双方で安定して動作させるため、
 * 年柱計算で必要な値をこのモジュール内にも保持する。
 * 対象年は今後段階的に拡張する。
 */
const RISSHUN_BOUNDARIES_JST = Object.freeze({
  2024: '2024-02-04T17:27:00+09:00',
  2025: '2025-02-03T23:10:00+09:00',
  2026: '2026-02-04T05:02:00+09:00',
  2027: '2027-02-04T10:46:00+09:00'
});

const monthBoundaries = [
  { m: 2, d: 4, branch: 'yin' },
  { m: 3, d: 6, branch: 'mao' },
  { m: 4, d: 5, branch: 'chen' },
  { m: 5, d: 6, branch: 'si' },
  { m: 6, d: 6, branch: 'wu' },
  { m: 7, d: 7, branch: 'wei' },
  { m: 8, d: 8, branch: 'shen' },
  { m: 9, d: 8, branch: 'you' },
  { m: 10, d: 8, branch: 'xu' },
  { m: 11, d: 7, branch: 'hai' },
  { m: 12, d: 7, branch: 'zi' },
  { m: 1, d: 6, branch: 'chou' }
];

const monthStemStartByYearStem = {
  jia: 3,
  ji: 3,
  yi: 5,
  geng: 5,
  bing: 7,
  xin: 7,
  ding: 9,
  ren: 9,
  wu: 1,
  gui: 1
};

const hourStemStartByDayStem = {
  jia: 1,
  ji: 1,
  yi: 3,
  geng: 3,
  bing: 5,
  xin: 5,
  ding: 7,
  ren: 7,
  wu: 9,
  gui: 9
};

const JST_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric'
});

export function resolveSchoolConfig(config = {}) {
  const schoolId = config.schoolId || 'koyomi-integrated';

  return {
    schoolId,
    ...SCHOOL_PROFILES[schoolId],
    ...config
  };
}

export function normalizeProfile(profile = {}) {
  const birth = profile.birthData || profile.birth || {};
  const place = birth.place || profile.birthPlace || {};
  const date = birth.date || profile.birthDate || profile.date;
  const timeUnknown = Boolean(
    birth.timeUnknown ||
    profile.timeUnknown
  );

  return {
    personId: profile.personId || profile.id || null,
    name: profile.displayName || profile.name || '',
    date,
    time: timeUnknown
      ? ''
      : (birth.time || profile.birthTime || ''),
    timeUnknown,
    place: {
      label: place.label || place.city || profile.birthPlace || '',
      latitude: numberOrNull(
        place.latitude ??
        profile.latitude
      ),
      longitude: numberOrNull(
        place.longitude ??
        profile.longitude
      ),
      timezone:
        place.timezone ||
        profile.timezone ||
        'Asia/Tokyo',
      utcOffset: Number(
        place.utcOffset ??
        profile.utcOffset ??
        9
      )
    }
  };
}

function numberOrNull(value) {
  if (value === '' || value == null) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function requireValidDate(value, functionName) {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`${functionName} requires a valid date`);
  }

  return date;
}

function getJstYear(date) {
  return Number(JST_YEAR_FORMATTER.format(date));
}

function getRisshunBoundary(year) {
  const officialBoundary = RISSHUN_BOUNDARIES_JST[year];

  if (officialBoundary) {
    return {
      date: new Date(officialBoundary),
      datetime: officialBoundary,
      precision: 'official-minute',
      sourceId: `naoj-rekiyou-${year}`,
      dataPath: 'data/bazi/solar-term-boundaries.json',
      warning: null
    };
  }

  const fallbackDatetime =
    `${year}-02-04T00:00:00+09:00`;

  return {
    date: new Date(fallbackDatetime),
    datetime: fallbackDatetime,
    precision: 'fallback-fixed-day',
    sourceId: null,
    dataPath: null,
    warning: 'risshun-official-boundary-missing'
  };
}

export function julianDay(date) {
  const validDate = requireValidDate(
    date,
    'julianDay'
  );

  return (
    validDate.getTime() / 86400000 +
    2440587.5
  );
}

export function calculateTrueSolarTime(
  datetime,
  longitude,
  timezoneOffset = 9
) {
  const base = requireValidDate(
    datetime,
    'calculateTrueSolarTime'
  );

  if (!Number.isFinite(Number(longitude))) {
    return {
      date: base,
      minutesOffset: 0,
      precision: 'timezone-only',
      warning: 'longitude-missing'
    };
  }

  const standardLongitude =
    Number(timezoneOffset) * 15;

  const minutesOffset =
    (Number(longitude) - standardLongitude) * 4;

  return {
    date: new Date(
      base.getTime() +
      minutesOffset * 60000
    ),
    minutesOffset,
    precision: 'longitude',
    warning: null
  };
}

export function calculateSolarTerms(
  datetime,
  timezone = 'Asia/Tokyo'
) {
  const date = requireValidDate(
    datetime,
    'calculateSolarTerms'
  );

  const year = getJstYear(date);

  return monthBoundaries.map((boundary, index) => ({
    termId: `term-${String(index + 1).padStart(2, '0')}`,
    name: `${branchById[boundary.branch].kanji}月節入`,
    branchId: boundary.branch,
    datetime:
      `${year}-` +
      `${String(boundary.m).padStart(2, '0')}-` +
      `${String(boundary.d).padStart(2, '0')}` +
      'T00:00:00',
    timezone,
    precision: 'phase1-fixed-day'
  }));
}

function cyclePillar(index) {
  const normalizedIndex =
    ((index % 60) + 60) % 60;

  const stem = STEMS[normalizedIndex % 10];
  const branch = BRANCHES[normalizedIndex % 12];

  return {
    stem,
    branch,
    index: normalizedIndex + 1,
    label: `${stem.kanji}${branch.kanji}`
  };
}

/**
 * 年柱を立春の瞬間で切り替える。
 *
 * 例：2026年
 * 立春前   2026-02-04 05:01 JST → 乙巳
 * 立春以降 2026-02-04 05:02 JST → 丙午
 *
 * 正式時刻が未登録の年は、暫定的に2月4日0時JSTを使用し、
 * boundary.warningで未精密であることを明示する。
 */
export function calculateYearPillar(date) {
  const validDate = requireValidDate(
    date,
    'calculateYearPillar'
  );

  const calendarYear = getJstYear(validDate);
  const boundary =
    getRisshunBoundary(calendarYear);

  const pillarYear =
    validDate < boundary.date
      ? calendarYear - 1
      : calendarYear;

  return {
    ...cyclePillar(pillarYear - 1984),
    pillarYear,
    boundary: {
      termId: 'risshun',
      nameJa: '立春',
      datetime: boundary.datetime,
      timezone: 'Asia/Tokyo',
      precision: boundary.precision,
      sourceId: boundary.sourceId,
      dataPath: boundary.dataPath,
      warning: boundary.warning
    }
  };
}

export function calculateMonthPillar(
  date,
  yearStemId
) {
  const validDate = requireValidDate(
    date,
    'calculateMonthPillar'
  );

  const key =
    validDate.getMonth() + 1 === 1 &&
    validDate.getDate() < 6
      ? new Date(
          validDate.getFullYear() - 1,
          11,
          7
        )
      : validDate;

  let branch = 'chou';

  for (const boundary of monthBoundaries) {
    const boundaryYear =
      boundary.m === 1
        ? key.getFullYear() + 1
        : key.getFullYear();

    const boundaryDate = new Date(
      boundaryYear,
      boundary.m - 1,
      boundary.d
    );

    if (key >= boundaryDate) {
      branch = boundary.branch;
    }
  }

  const branchOrder =
    branchById[branch].order;

  const stemStart =
    monthStemStartByYearStem[yearStemId] || 1;

  const stemIndex =
    (
      stemStart -
      1 +
      (
        branchOrder -
        3 +
        12
      )
    ) % 10;

  const stem = STEMS[stemIndex];
  const branchData = branchById[branch];

  return {
    stem,
    branch: branchData,
    index: null,
    label: `${stem.kanji}${branchData.kanji}`
  };
}

export function calculateDayPillar(date) {
  const validDate = requireValidDate(
    date,
    'calculateDayPillar'
  );

  const base = new Date(1984, 1, 2);

  const days = Math.floor(
    (
      Date.UTC(
        validDate.getFullYear(),
        validDate.getMonth(),
        validDate.getDate()
      ) -
      Date.UTC(
        base.getFullYear(),
        base.getMonth(),
        base.getDate()
      )
    ) / 86400000
  );

  return cyclePillar(days);
}

export function calculateHourPillar(
  date,
  dayStemId,
  schoolConfig = {}
) {
  if (!date) {
    return null;
  }

  const validDate = requireValidDate(
    date,
    'calculateHourPillar'
  );

  const hour = validDate.getHours();

  const branchIndex =
    hour === 23
      ? 0
      : Math.floor((hour + 1) / 2) % 12;

  const stemStart =
    hourStemStartByDayStem[dayStemId] || 1;

  const stem =
    STEMS[
      (
        stemStart -
        1 +
        branchIndex
      ) % 10
    ];

  const branch = BRANCHES[branchIndex];

  return {
    stem,
    branch,
    index: null,
    label: `${stem.kanji}${branch.kanji}`,
    ziHourPolicy: schoolConfig.ziHour
  };
}

export function buildBirthDateTime(normalized) {
  if (!normalized.date) {
    return null;
  }

  const time = normalized.time || '00:00';

  return new Date(
    `${normalized.date}T${time}:00`
  );
}
