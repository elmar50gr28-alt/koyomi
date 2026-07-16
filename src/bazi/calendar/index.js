import { BRANCHES, SCHOOL_PROFILES, STEMS } from '../data.js';

const stemById = Object.fromEntries(STEMS.map(s => [s.id, s]));
const branchById = Object.fromEntries(BRANCHES.map(b => [b.id, b]));
const monthBoundaries = [
  { m: 2, d: 4, branch: 'yin' }, { m: 3, d: 6, branch: 'mao' }, { m: 4, d: 5, branch: 'chen' },
  { m: 5, d: 6, branch: 'si' }, { m: 6, d: 6, branch: 'wu' }, { m: 7, d: 7, branch: 'wei' },
  { m: 8, d: 8, branch: 'shen' }, { m: 9, d: 8, branch: 'you' }, { m: 10, d: 8, branch: 'xu' },
  { m: 11, d: 7, branch: 'hai' }, { m: 12, d: 7, branch: 'zi' }, { m: 1, d: 6, branch: 'chou' }
];
const monthStemStartByYearStem = { jia: 3, ji: 3, yi: 5, geng: 5, bing: 7, xin: 7, ding: 9, ren: 9, wu: 1, gui: 1 };
const hourStemStartByDayStem = { jia: 1, ji: 1, yi: 3, geng: 3, bing: 5, xin: 5, ding: 7, ren: 7, wu: 9, gui: 9 };

export function resolveSchoolConfig(config = {}) {
  const schoolId = config.schoolId || 'koyomi-integrated';
  return { schoolId, ...SCHOOL_PROFILES[schoolId], ...config };
}

export function normalizeProfile(profile = {}) {
  const birth = profile.birthData || profile.birth || {};
  const place = birth.place || profile.birthPlace || {};
  const date = birth.date || profile.birthDate || profile.date;
  const timeUnknown = Boolean(birth.timeUnknown || profile.timeUnknown);
  return {
    personId: profile.personId || profile.id || null,
    name: profile.displayName || profile.name || '',
    date,
    time: timeUnknown ? '' : (birth.time || profile.birthTime || ''),
    timeUnknown,
    place: {
      label: place.label || place.city || profile.birthPlace || '',
      latitude: numberOrNull(place.latitude ?? profile.latitude),
      longitude: numberOrNull(place.longitude ?? profile.longitude),
      timezone: place.timezone || profile.timezone || 'Asia/Tokyo',
      utcOffset: Number(place.utcOffset ?? profile.utcOffset ?? 9)
    }
  };
}

function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function julianDay(date) {
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return t / 86400000 + 2440587.5;
}

export function calculateTrueSolarTime(datetime, longitude, timezoneOffset = 9) {
  const base = datetime instanceof Date ? new Date(datetime) : new Date(datetime);
  if (!Number.isFinite(Number(longitude))) {
    return { date: base, minutesOffset: 0, precision: 'timezone-only', warning: 'longitude-missing' };
  }
  const standardLongitude = timezoneOffset * 15;
  const minutesOffset = (Number(longitude) - standardLongitude) * 4;
  return { date: new Date(base.getTime() + minutesOffset * 60000), minutesOffset, precision: 'longitude' };
}

export function calculateSolarTerms(datetime, timezone = 'Asia/Tokyo') {
  const y = new Date(datetime).getFullYear();
  return monthBoundaries.map((b, i) => ({
    termId: `term-${String(i + 1).padStart(2, '0')}`,
    name: branchById[b.branch].kanji + '\u6708\u7bc0\u5165',
    branchId: b.branch,
    datetime: `${y}-${String(b.m).padStart(2, '0')}-${String(b.d).padStart(2, '0')}T00:00:00`,
    timezone,
    precision: 'phase1-fixed-day'
  }));
}

function cyclePillar(index) {
  const n = ((index % 60) + 60) % 60;
  return { stem: STEMS[n % 10], branch: BRANCHES[n % 12], index: n + 1, label: STEMS[n % 10].kanji + BRANCHES[n % 12].kanji };
}

export function calculateYearPillar(date) {
  const d = new Date(date);
  const spring = new Date(d.getFullYear(), 1, 4);
  const year = d < spring ? d.getFullYear() - 1 : d.getFullYear();
  return cyclePillar(year - 1984);
}

export function calculateMonthPillar(date, yearStemId) {
  const d = new Date(date);
  const key = d.getMonth() + 1 === 1 && d.getDate() < 6 ? new Date(d.getFullYear() - 1, 11, 7) : d;
  let branch = 'chou';
  for (const b of monthBoundaries) {
    const boundaryYear = b.m === 1 ? key.getFullYear() + 1 : key.getFullYear();
    if (key >= new Date(boundaryYear, b.m - 1, b.d)) branch = b.branch;
  }
  const branchOrder = branchById[branch].order;
  const start = monthStemStartByYearStem[yearStemId] || 1;
  const stem = STEMS[(start - 1 + (branchOrder - 3 + 12)) % 10];
  return { stem, branch: branchById[branch], index: null, label: stem.kanji + branchById[branch].kanji };
}

export function calculateDayPillar(date) {
  const d = new Date(date);
  const base = new Date(1984, 1, 2);
  const days = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(base.getFullYear(), base.getMonth(), base.getDate())) / 86400000);
  return cyclePillar(days);
}

export function calculateHourPillar(date, dayStemId, schoolConfig = {}) {
  if (!date) return null;
  const hour = new Date(date).getHours();
  const branchIndex = hour === 23 ? 0 : Math.floor((hour + 1) / 2) % 12;
  const start = hourStemStartByDayStem[dayStemId] || 1;
  const stem = STEMS[(start - 1 + branchIndex) % 10];
  const branch = BRANCHES[branchIndex];
  return { stem, branch, index: null, label: stem.kanji + branch.kanji, ziHourPolicy: schoolConfig.ziHour };
}

export function buildBirthDateTime(normalized) {
  if (!normalized.date) return null;
  const time = normalized.time || '00:00';
  return new Date(`${normalized.date}T${time}:00`);
}
