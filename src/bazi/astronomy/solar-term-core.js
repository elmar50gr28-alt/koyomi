const DAY_MS = 86400000;
const MINUTE_MS = 60000;

const SETSU_TERMS = Object.freeze([
  { termId: 'shokan', nameJa: '小寒', branchId: 'chou', month: 1, targetLongitude: 285 },
  { termId: 'risshun', nameJa: '立春', branchId: 'yin', month: 2, targetLongitude: 315 },
  { termId: 'keichitsu', nameJa: '啓蟄', branchId: 'mao', month: 3, targetLongitude: 345 },
  { termId: 'seimei', nameJa: '清明', branchId: 'chen', month: 4, targetLongitude: 15 },
  { termId: 'rikka', nameJa: '立夏', branchId: 'si', month: 5, targetLongitude: 45 },
  { termId: 'boshu', nameJa: '芒種', branchId: 'wu', month: 6, targetLongitude: 75 },
  { termId: 'shosho', nameJa: '小暑', branchId: 'wei', month: 7, targetLongitude: 105 },
  { termId: 'risshu', nameJa: '立秋', branchId: 'shen', month: 8, targetLongitude: 135 },
  { termId: 'hakuro', nameJa: '白露', branchId: 'you', month: 9, targetLongitude: 165 },
  { termId: 'kanro', nameJa: '寒露', branchId: 'xu', month: 10, targetLongitude: 195 },
  { termId: 'ritto', nameJa: '立冬', branchId: 'hai', month: 11, targetLongitude: 225 },
  { termId: 'taisetsu', nameJa: '大雪', branchId: 'zi', month: 12, targetLongitude: 255 }
]);

const cache = new Map();
const radians = degrees => degrees * Math.PI / 180;
const normalize = value => ((value % 360) + 360) % 360;
const signedDistance = (longitude, target) =>
  ((normalize(longitude) - normalize(target) + 540) % 360) - 180;

export function solarApparentLongitude(datetime) {
  const date = datetime instanceof Date ? datetime : new Date(datetime);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('solarApparentLongitude requires a valid date');
  }

  const julianDay = date.getTime() / DAY_MS + 2440587.5;
  const centuries = (julianDay - 2451545) / 36525;
  const meanLongitude = normalize(
    280.46646 + centuries * (36000.76983 + 0.0003032 * centuries)
  );
  const meanAnomaly = normalize(
    357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)
  );
  const equationOfCenter =
    Math.sin(radians(meanAnomaly)) *
      (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) +
    Math.sin(radians(2 * meanAnomaly)) *
      (0.019993 - 0.000101 * centuries) +
    Math.sin(radians(3 * meanAnomaly)) * 0.000289;
  const omega = 125.04 - 1934.136 * centuries;

  return normalize(
    meanLongitude +
    equationOfCenter -
    0.00569 -
    0.00478 * Math.sin(radians(omega))
  );
}

function activeSolarLongitude(date) {
  const astronomy = globalThis.Astronomy;
  if (astronomy?.SunPosition) {
    return normalize(astronomy.SunPosition(date).elon);
  }
  return solarApparentLongitude(date);
}

export function findSolarLongitudeCrossing(
  year,
  definition,
  solarLongitude = activeSolarLongitude
) {
  if (!Number.isInteger(year) || year < 1899 || year > 2101) {
    throw new RangeError('solar-term year must be between 1899 and 2101');
  }

  let low = new Date(Date.UTC(year, definition.month - 1, 1));
  let high = new Date(Date.UTC(year, definition.month - 1, 10));
  const lowDistance = signedDistance(
    solarLongitude(low),
    definition.targetLongitude
  );
  const highDistance = signedDistance(
    solarLongitude(high),
    definition.targetLongitude
  );

  if (!(lowDistance <= 0 && highDistance >= 0)) {
    throw new RangeError(`unable to bracket solar term ${definition.termId} for ${year}`);
  }

  while (high.getTime() - low.getTime() > MINUTE_MS / 8) {
    const middle = new Date((low.getTime() + high.getTime()) / 2);
    const distance = signedDistance(
      solarLongitude(middle),
      definition.targetLongitude
    );
    if (distance >= 0) high = middle;
    else low = middle;
  }

  return new Date(
    Math.round((low.getTime() + high.getTime()) / (2 * MINUTE_MS)) * MINUTE_MS
  );
}

export function calculateSetsuBoundaries(year) {
  const usesAstronomyEngine = Boolean(globalThis.Astronomy?.SunPosition);
  const cacheKey = `${year}:${usesAstronomyEngine ? 'high' : 'fallback'}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const boundaries = Object.freeze(SETSU_TERMS.map(definition => {
    const date = findSolarLongitudeCrossing(year, definition);
    return Object.freeze({
      ...definition,
      date,
      datetime: date.toISOString(),
      timezone: 'UTC',
      precision: usesAstronomyEngine ? 'astronomy-engine-minute' : 'calculated-minute',
      sourceId: usesAstronomyEngine
        ? 'astronomy-engine-2.1.19'
        : 'koyomi-solar-longitude-core'
    });
  }));

  cache.set(cacheKey, boundaries);
  return boundaries;
}

export { SETSU_TERMS };
