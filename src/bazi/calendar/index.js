import { BRANCHES, SCHOOL_PROFILES, STEMS } from '../data.js';

const branchById = Object.fromEntries(
  BRANCHES.map(branch => [branch.id, branch])
);

const RISSHUN_BOUNDARIES_JST = Object.freeze({
  2024: '2024-02-04T17:27:00+09:00',
  2025: '2025-02-03T23:10:00+09:00',
  2026: '2026-02-04T05:02:00+09:00',
  2027: '2027-02-04T10:46:00+09:00'
});

const MONTH_BOUNDARIES_JST_BY_YEAR = Object.freeze({
  2025: Object.freeze([
    {
      termId: 'shokan',
      nameJa: '小寒',
      branchId: 'chou',
      datetime: '2025-01-05T11:33:00+09:00'
    },
    {
      termId: 'risshun',
      nameJa: '立春',
      branchId: 'yin',
      datetime: '2025-02-03T23:10:00+09:00'
    },
    {
      termId: 'keichitsu',
      nameJa: '啓蟄',
      branchId: 'mao',
      datetime: '2025-03-05T17:07:00+09:00'
    },
    {
      termId: 'seimei',
      nameJa: '清明',
      branchId: 'chen',
      datetime: '2025-04-04T21:49:00+09:00'
    },
    {
      termId: 'rikka',
      nameJa: '立夏',
      branchId: 'si',
      datetime: '2025-05-05T14:57:00+09:00'
    },
    {
      termId: 'boshu',
      nameJa: '芒種',
      branchId: 'wu',
      datetime: '2025-06-05T18:57:00+09:00'
    },
    {
      termId: 'shosho',
      nameJa: '小暑',
      branchId: 'wei',
      datetime: '2025-07-07T05:05:00+09:00'
    },
    {
      termId: 'risshu',
      nameJa: '立秋',
      branchId: 'shen',
      datetime: '2025-08-07T14:52:00+09:00'
    },
    {
      termId: 'hakuro',
      nameJa: '白露',
      branchId: 'you',
      datetime: '2025-09-07T17:52:00+09:00'
    },
    {
      termId: 'kanro',
      nameJa: '寒露',
      branchId: 'xu',
      datetime: '2025-10-08T09:41:00+09:00'
    },
    {
      termId: 'ritto',
      nameJa: '立冬',
      branchId: 'hai',
      datetime: '2025-11-07T13:04:00+09:00'
    },
    {
      termId: 'taisetsu',
      nameJa: '大雪',
      branchId: 'zi',
      datetime: '2025-12-07T06:05:00+09:00'
    }
  ]),

  2026: Object.freeze([
    {
      termId: 'shokan',
      nameJa: '小寒',
      branchId: 'chou',
      datetime: '2026-01-05T17:23:00+09:00'
    },
    {
      termId: 'risshun',
      nameJa: '立春',
      branchId: 'yin',
      datetime: '2026-02-04T05:02:00+09:00'
    },
    {
      termId: 'keichitsu',
      nameJa: '啓蟄',
      branchId: 'mao',
      datetime: '2026-03-05T22:59:00+09:00'
    },
    {
      termId: 'seimei',
      nameJa: '清明',
      branchId: 'chen',
      datetime: '2026-04-05T03:40:00+09:00'
    },
    {
      termId: 'rikka',
      nameJa: '立夏',
      branchId: 'si',
      datetime: '2026-05-05T20:49:00+09:00'
    },
    {
      termId: 'boshu',
      nameJa: '芒種',
      branchId: 'wu',
      datetime: '2026-06-06T00:48:00+09:00'
    },
    {
      termId: 'shosho',
      nameJa: '小暑',
      branchId: 'wei',
      datetime: '2026-07-07T10:57:00+09:00'
    },
    {
      termId: 'risshu',
      nameJa: '立秋',
      branchId: 'shen',
      datetime: '2026-08-07T20:43:00+09:00'
    },
    {
      termId: 'hakuro',
      nameJa: '白露',
      branchId: 'you',
      datetime: '2026-09-07T23:41:00+09:00'
    },
    {
      termId: 'kanro',
      nameJa: '寒露',
      branchId: 'xu',
      datetime: '2026-10-08T15:29:00+09:00'
    },
    {
      termId: 'ritto',
      nameJa: '立冬',
      branchId: 'hai',
      datetime: '2026-11-07T18:52:00+09:00'
    },
    {
      termId: 'taisetsu',
      nameJa: '大雪',
      branchId: 'zi',
      datetime: '2026-12-07T11:53:00+09:00'
    }
  ])
});

const fallbackMonthBoundaries = [
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
    birth.timeUnknown || profile.timeUnknown
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
      label:
        place.label ||
        place.city ||
        profile.birthPlace ||
        '',
      latitude: numberOrNull(
        place.latitude ?? profile.latitude
      ),
      longitude: numberOrNull(
        place.longitude ?? profile.longitude
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
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `${functionName} requires a valid date`
    );
  }

  return date;
}

function getJstYear(date) {
  return Number(
    JST_YEAR_FORMATTER.format(date)
  );
}

function getRisshunBoundary(year) {
  const officialBoundary =
    RISSHUN_BOUNDARIES_JST[year];

  if (officialBoundary) {
    return {
      date: new Date(officialBoundary),
      datetime: officialBoundary,
      precision: 'official-minute',
      sourceId: `naoj-rekiyou-${year}`,
      dataPath:
        'data/bazi/solar-term-boundaries.json',
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
    warning:
      'risshun-official-boundary-missing'
  };
}

function getOfficialMonthBoundary(date) {
  const year = getJstYear(date);
  const boundaries =
    MONTH_BOUNDARIES_JST_BY_YEAR[year];

  if (!boundaries) {
    return null;
  }

  let selectedBoundary = null;

  for (const boundary of boundaries) {
    const boundaryDate =
      new Date(boundary.datetime);

    if (date >= boundaryDate) {
      selectedBoundary = {
        ...boundary,
        year,
        date: boundaryDate
      };
    } else {
      break;
    }
  }

  return selectedBoundary;
}

function getFallbackMonthBranch(date) {
  const key =
    date.getMonth() + 1 === 1 &&
    date.getDate() < 6
      ? new Date(
          date.getFullYear() - 1,
          11,
          7
        )
      : date;

  let branch = 'chou';

  for (const boundary of fallbackMonthBoundaries) {
    const boundaryYear =
      boundary.m === 1
        ? key.getFullYear() + 1
        : key.getFullYear();

    const boundaryDate =
      new Date(
        boundaryYear,
        boundary.m - 1,
        boundary.d
      );

    if (key >= boundaryDate) {
      branch = boundary.branch;
    }
  }

  return branch;
}

function buildMonthPillar(
  branchId,
  yearStemId,
  boundary
) {
  const branchOrder =
    branchById[branchId].order;

  const stemStart =
    monthStemStartByYearStem[
      yearStemId
    ] || 1;

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
  const branch = branchById[branchId];

  return {
    stem,
    branch,
    index: null,
    label: `${stem.kanji}${branch.kanji}`,
    boundary
  };
}

export function julianDay(date) {
  const validDate = requireValidDate(
    date,
    'julianDay'
  );

  return (
    validDate.getTime() /
    86400000 +
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

  if (
    longitude === null ||
    longitude === undefined ||
    longitude === '' ||
    !Number.isFinite(
      Number(longitude)
    )
  ) {
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
    (
      Number(longitude) -
      standardLongitude
    ) * 4;

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
  const officialBoundaries =
    MONTH_BOUNDARIES_JST_BY_YEAR[year];

  if (officialBoundaries) {
    return officialBoundaries.map(
      boundary => ({
        termId: boundary.termId,
        name: boundary.nameJa,
        branchId: boundary.branchId,
        datetime: boundary.datetime,
        timezone: 'Asia/Tokyo',
        precision: 'official-minute',
        sourceId: `naoj-rekiyou-${year}`
      })
    );
  }

  return fallbackMonthBoundaries.map(
    (boundary, index) => ({
      termId:
        `term-${String(
          index + 1
        ).padStart(2, '0')}`,

      name:
        `${branchById[
          boundary.branch
        ].kanji}月節入`,

      branchId:
        boundary.branch,

      datetime:
        `${year}-` +
        `${String(
          boundary.m
        ).padStart(2, '0')}-` +
        `${String(
          boundary.d
        ).padStart(2, '0')}` +
        'T00:00:00',

      timezone,

      precision:
        'fallback-fixed-day',

      sourceId: null
    })
  );
}

function cyclePillar(index) {
  const normalizedIndex =
    ((index % 60) + 60) % 60;

  const stem =
    STEMS[normalizedIndex % 10];

  const branch =
    BRANCHES[normalizedIndex % 12];

  return {
    stem,
    branch,
    index:
      normalizedIndex + 1,
    label:
      `${stem.kanji}${branch.kanji}`
  };
}

export function calculateYearPillar(date) {
  const validDate = requireValidDate(
    date,
    'calculateYearPillar'
  );

  const calendarYear =
    getJstYear(validDate);

  const boundary =
    getRisshunBoundary(
      calendarYear
    );

  const pillarYear =
    validDate < boundary.date
      ? calendarYear - 1
      : calendarYear;

  return {
    ...cyclePillar(
      pillarYear - 1984
    ),

    pillarYear,

    boundary: {
      termId: 'risshun',
      nameJa: '立春',
      datetime:
        boundary.datetime,
      timezone:
        'Asia/Tokyo',
      precision:
        boundary.precision,
      sourceId:
        boundary.sourceId,
      dataPath:
        boundary.dataPath,
      warning:
        boundary.warning
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

  const officialBoundary =
    getOfficialMonthBoundary(
      validDate
    );

  if (officialBoundary) {
    return buildMonthPillar(
      officialBoundary.branchId,
      yearStemId,
      {
        termId:
          officialBoundary.termId,
        nameJa:
          officialBoundary.nameJa,
        datetime:
          officialBoundary.datetime,
        timezone:
          'Asia/Tokyo',
        precision:
          'official-minute',
        sourceId:
          `naoj-rekiyou-${officialBoundary.year}`,
        dataPath:
          'data/bazi/solar-term-boundaries.json',
        warning: null
      }
    );
  }

  const fallbackBranch =
    getFallbackMonthBranch(
      validDate
    );

  return buildMonthPillar(
    fallbackBranch,
    yearStemId,
    {
      termId: null,
      nameJa: null,
      datetime: null,
      timezone:
        'Asia/Tokyo',
      precision:
        'fallback-fixed-day',
      sourceId: null,
      dataPath: null,
      warning:
        'month-boundary-official-data-missing'
    }
  );
}

export function calculateDayPillar(date) {
  const validDate = requireValidDate(
    date,
    'calculateDayPillar'
  );

  const base =
    new Date(1984, 1, 2);

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

  const hour =
    validDate.getHours();

  const branchIndex =
    hour === 23
      ? 0
      : Math.floor(
          (hour + 1) / 2
        ) % 12;

  const stemStart =
    hourStemStartByDayStem[
      dayStemId
    ] || 1;

  const stem =
    STEMS[
      (
        stemStart -
        1 +
        branchIndex
      ) % 10
    ];

  const branch =
    BRANCHES[branchIndex];

  return {
    stem,
    branch,
    index: null,
    label:
      `${stem.kanji}${branch.kanji}`,
    ziHourPolicy:
      schoolConfig.ziHour
  };
}

export function buildBirthDateTime(
  normalized
) {
  if (!normalized.date) {
    return null;
  }

  const time =
    normalized.time ||
    '00:00';

  return new Date(
    `${normalized.date}T${time}:00`
  );
}
