const DAY_MS = 86400000;

export const SEASONAL_INGRESSES = Object.freeze([
  Object.freeze({ id: 'aries', nameJa: '春分図', targetLongitude: 0, startMonth: 2, startDay: 18 }),
  Object.freeze({ id: 'cancer', nameJa: '夏至図', targetLongitude: 90, startMonth: 5, startDay: 19 }),
  Object.freeze({ id: 'libra', nameJa: '秋分図', targetLongitude: 180, startMonth: 8, startDay: 21 }),
  Object.freeze({ id: 'capricorn', nameJa: '冬至図', targetLongitude: 270, startMonth: 11, startDay: 19 })
]);

export const MONTHLY_INGRESSES = Object.freeze([
  Object.freeze({ id: 'aquarius', nameJa: '1月図', targetLongitude: 300, startMonth: 0, startDay: 18, month: 1 }),
  Object.freeze({ id: 'pisces', nameJa: '2月図', targetLongitude: 330, startMonth: 1, startDay: 16, month: 2 }),
  Object.freeze({ id: 'aries', nameJa: '3月図', targetLongitude: 0, startMonth: 2, startDay: 18, month: 3 }),
  Object.freeze({ id: 'taurus', nameJa: '4月図', targetLongitude: 30, startMonth: 3, startDay: 18, month: 4 }),
  Object.freeze({ id: 'gemini', nameJa: '5月図', targetLongitude: 60, startMonth: 4, startDay: 19, month: 5 }),
  Object.freeze({ id: 'cancer', nameJa: '6月図', targetLongitude: 90, startMonth: 5, startDay: 19, month: 6 }),
  Object.freeze({ id: 'leo', nameJa: '7月図', targetLongitude: 120, startMonth: 6, startDay: 20, month: 7 }),
  Object.freeze({ id: 'virgo', nameJa: '8月図', targetLongitude: 150, startMonth: 7, startDay: 20, month: 8 }),
  Object.freeze({ id: 'libra', nameJa: '9月図', targetLongitude: 180, startMonth: 8, startDay: 21, month: 9 }),
  Object.freeze({ id: 'scorpio', nameJa: '10月図', targetLongitude: 210, startMonth: 9, startDay: 21, month: 10 }),
  Object.freeze({ id: 'sagittarius', nameJa: '11月図', targetLongitude: 240, startMonth: 10, startDay: 20, month: 11 }),
  Object.freeze({ id: 'capricorn', nameJa: '12月図', targetLongitude: 270, startMonth: 11, startDay: 19, month: 12 })
]);

const ASPECTS = Object.freeze([
  Object.freeze({ id: 'conjunction', angle: 0, orb: 6 }),
  Object.freeze({ id: 'sextile', angle: 60, orb: 4 }),
  Object.freeze({ id: 'square', angle: 90, orb: 5 }),
  Object.freeze({ id: 'trine', angle: 120, orb: 5 }),
  Object.freeze({ id: 'opposition', angle: 180, orb: 6 })
]);

const normalize = value => ((Number(value) % 360) + 360) % 360;
const signedDistance = (value, target) => ((normalize(value) - normalize(target) + 540) % 360) - 180;
const angularDistance = (left, right) => Math.abs(signedDistance(left, right));

function validDate(value, name) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${name} must return a valid date`);
  return date;
}

function validateLocation(location = {}) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError('latitude must be between -90 and 90');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('longitude must be between -180 and 180');
  return { label: String(location.label || '対象地点'), latitude, longitude, timezone: location.timezone || 'UTC' };
}

export function findSeasonalIngress(year, definition, solarLongitude) {
  if (!Number.isInteger(year) || year < 1800 || year > 2200) throw new RangeError('year must be an integer from 1800 to 2200');
  if (typeof solarLongitude !== 'function') throw new TypeError('solarLongitude adapter is required');
  let low = new Date(Date.UTC(year, definition.startMonth, definition.startDay));
  let high = new Date(low.getTime() + 8 * DAY_MS);
  let lowDistance = signedDistance(solarLongitude(low), definition.targetLongitude);
  let highDistance = signedDistance(solarLongitude(high), definition.targetLongitude);
  if (!(lowDistance <= 0 && highDistance >= 0)) throw new RangeError(`${definition.id} ingress was not bracketed by the ephemeris adapter`);
  for (let index = 0; index < 48; index += 1) {
    const middle = new Date((low.getTime() + high.getTime()) / 2);
    const distance = signedDistance(solarLongitude(middle), definition.targetLongitude);
    if (distance >= 0) high = middle;
    else low = middle;
  }
  return new Date((low.getTime() + high.getTime()) / 2);
}

function julianDay(date) { return date.getTime() / DAY_MS + 2440587.5; }

export function calculateAngles(date, location) {
  const jd = julianDay(date);
  const centuries = (jd - 2451545) / 36525;
  const sidereal = normalize(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * centuries ** 2 - centuries ** 3 / 38710000 + location.longitude);
  const theta = sidereal * Math.PI / 180;
  const obliquity = (23.439291 - 0.0130042 * centuries) * Math.PI / 180;
  const latitude = location.latitude * Math.PI / 180;
  const ascendant = normalize(Math.atan2(-Math.cos(theta), Math.sin(obliquity) * Math.tan(latitude) + Math.cos(obliquity) * Math.sin(theta)) * 180 / Math.PI);
  const midheaven = normalize(Math.atan2(Math.sin(theta) * Math.cos(obliquity), Math.cos(theta)) * 180 / Math.PI);
  return { ascendant, midheaven, localSiderealTime: sidereal, precision: 'standard-astronomical-formula' };
}

function buildHouses(ascendant, system) {
  const start = system === 'whole-sign' ? Math.floor(ascendant / 30) * 30 : ascendant;
  return Array.from({ length: 12 }, (_, index) => normalize(start + index * 30));
}

function houseOf(longitude, cusps) {
  const offset = normalize(longitude - cusps[0]);
  return Math.floor(offset / 30) + 1;
}

function buildAspects(positions) {
  const entries = Object.entries(positions);
  const output = [];
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const separation = angularDistance(entries[left][1], entries[right][1]);
      const aspect = ASPECTS.map(item => ({ ...item, delta: Math.abs(separation - item.angle) })).find(item => item.delta <= item.orb);
      if (aspect) output.push({ type: aspect.id, bodies: [entries[left][0], entries[right][0]], separation, orb: aspect.delta });
    }
  }
  return output.sort((left, right) => left.orb - right.orb);
}

function buildRetrogrades(date, adapter, positions) {
  const before = adapter.planetLongitudes(new Date(date.getTime() - 12 * 3600000));
  const after = adapter.planetLongitudes(new Date(date.getTime() + 12 * 3600000));
  return Object.fromEntries(Object.keys(positions).map(body => [body, signedDistance(after[body], before[body]) < 0]));
}

export function buildSeasonalIngressChart({ year, definition, location, ephemeris, houseSystem = 'equal' }) {
  const place = validateLocation(location);
  if (!ephemeris || typeof ephemeris.solarLongitude !== 'function' || typeof ephemeris.planetLongitudes !== 'function') throw new TypeError('ephemeris must provide solarLongitude and planetLongitudes');
  if (!['equal', 'whole-sign'].includes(houseSystem)) throw new RangeError('houseSystem must be equal or whole-sign');
  const datetime = findSeasonalIngress(year, definition, ephemeris.solarLongitude);
  const positions = Object.fromEntries(Object.entries(ephemeris.planetLongitudes(datetime)).map(([body, longitude]) => [body, normalize(longitude)]));
  if (!Object.keys(positions).length || Object.values(positions).some(value => !Number.isFinite(value))) throw new TypeError('planetLongitudes must return finite longitude values');
  const angles = calculateAngles(datetime, place);
  const cusps = buildHouses(angles.ascendant, houseSystem);
  const placements = Object.fromEntries(Object.entries(positions).map(([body, longitude]) => [body, { longitude, house: houseOf(longitude, cusps) }]));
  return {
    schemaId: 'koyomi-mundane-seasonal-ingress-v1',
    chartType: definition.id,
    nameJa: definition.nameJa,
    year,
    datetime: datetime.toISOString(),
    location: place,
    houseSystem,
    angles,
    cusps,
    positions,
    placements,
    retrogrades: buildRetrogrades(datetime, ephemeris, positions),
    aspects: buildAspects(positions),
    calculation: { ephemerisId: ephemeris.id || 'unspecified', precision: ephemeris.precision || 'unspecified', targetSolarLongitude: definition.targetLongitude },
    warnings: ephemeris.precision === 'fallback' ? ['fallback-ephemeris'] : []
  };
}

export function buildSeasonalIngressCharts(options) {
  return SEASONAL_INGRESSES.map(definition => buildSeasonalIngressChart({ ...options, definition }));
}

export function buildMonthlyIngressCharts(options) {
  return MONTHLY_INGRESSES.map(definition => ({ ...buildSeasonalIngressChart({ ...options, definition }), month: definition.month }));
}
