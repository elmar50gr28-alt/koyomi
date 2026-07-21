export const PROFILE_SCHEMA_API = Object.freeze([
  'normalizeProfile',
  'validateProfile'
]);

/**
 * Stable facade over the legacy profile schema behavior. The legacy
 * functions remain responsible for every normalization and validation rule.
 */
export function createProfileSchemaCompatibility(legacy) {
  if (!legacy || typeof legacy !== 'object') {
    throw new TypeError('profile schema legacy adapter is required');
  }

  for (const name of PROFILE_SCHEMA_API) {
    if (typeof legacy[name] !== 'function') {
      throw new TypeError(`profile schema legacy function is required: ${name}`);
    }
  }

  return Object.freeze({
    normalizeProfile: (...args) => legacy.normalizeProfile(...args),
    validateProfile: (...args) => legacy.validateProfile(...args)
  });
}
