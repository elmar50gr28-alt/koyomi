export const WORLD_THEME_IDS = Object.freeze(['earthquake','volcano','weather','conflict','social_unrest','economy','politics','public_health']);
export const WORLD_MODES = Object.freeze(['forecast','validation']);

export function createWorldContext(input = {}) {
  const date = new Date(input.datetimeUtc);
  if (Number.isNaN(date.getTime())) throw new TypeError('datetimeUtc must be a valid date');
  if (!WORLD_THEME_IDS.includes(input.themeId)) throw new RangeError('unknown world theme');
  if (!WORLD_MODES.includes(input.mode)) throw new RangeError('unknown world mode');
  const context = { datetimeUtc: date.toISOString(), themeId: input.themeId, mode: input.mode };
  for (const key of ['latitude','longitude']) if (input[key] !== undefined) {
    const value = Number(input[key]);
    if (!Number.isFinite(value)) throw new TypeError(`${key} must be finite`);
    context[key] = value;
  }
  if (context.latitude !== undefined && (context.latitude < -90 || context.latitude > 90)) throw new RangeError('latitude must be between -90 and 90');
  if (context.longitude !== undefined && (context.longitude < -180 || context.longitude > 180)) throw new RangeError('longitude must be between -180 and 180');
  if (input.spatialCellId) context.spatialCellId = String(input.spatialCellId);
  if (input.gridSystemId) context.gridSystemId = String(input.gridSystemId);
  if (input.gridVersion) context.gridVersion = String(input.gridVersion);
  if (input.resolution !== undefined) context.resolution = Number(input.resolution);
  return Object.freeze(context);
}

export function validateWorldResult(result) {
  if (!result || typeof result !== 'object') throw new TypeError('result is required');
  if (!result.systemId || !result.version || !WORLD_THEME_IDS.includes(result.themeId)) throw new TypeError('invalid result identity');
  if (!Number.isFinite(result.score) || result.score < 0 || result.score > 100) throw new RangeError('score must be from 0 to 100');
  if (!Array.isArray(result.contributors)) throw new TypeError('contributors must be an array');
  return result;
}

export function consensusOf(results, threshold = 70) {
  const valid = results.map(validateWorldResult);
  return Object.freeze({ matched: valid.filter(item => item.score >= threshold).length, total: valid.length, threshold });
}
