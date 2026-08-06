const REQUIRED_FIELDS = [
  'theme_id', 'theme_name', 'good_meaning', 'caution_meaning',
  'standard_text', 'mitsunome_text', 'today_action', 'avoid_action',
  'intensity', 'confidence', 'categories', 'version'
];

let loadedThemes = [];
let themeIndex = new Map();
let loadingPromise = null;

export function validateCommonReadingThemes(value) {
  const errors = [];
  if (!Array.isArray(value)) return { valid: false, errors: ['themes-not-array'] };
  const ids = new Set();
  value.forEach((theme, index) => {
    const prefix = `theme-${index}`;
    for (const field of REQUIRED_FIELDS) {
      if (!(field in (theme || {}))) errors.push(`${prefix}-${field}-missing`);
    }
    if (!theme?.theme_id || ids.has(theme.theme_id)) errors.push(`${prefix}-theme-id-invalid`);
    ids.add(theme?.theme_id);
    if (!Number.isFinite(theme?.intensity) || theme.intensity < 0 || theme.intensity > 1) errors.push(`${prefix}-intensity-invalid`);
    if (!Number.isFinite(theme?.confidence) || theme.confidence < 0 || theme.confidence > 1) errors.push(`${prefix}-confidence-invalid`);
    if (!Array.isArray(theme?.categories)) errors.push(`${prefix}-categories-invalid`);
  });
  return { valid: errors.length === 0, errors };
}

export function setCommonReadingThemes(value) {
  const validation = validateCommonReadingThemes(value);
  if (!validation.valid) throw new TypeError(`Invalid common reading themes: ${validation.errors.join(', ')}`);
  loadedThemes = value.map(theme => Object.freeze({ ...theme }));
  themeIndex = new Map(loadedThemes.map(theme => [theme.theme_id, theme]));
  return loadedThemes;
}

export function getCommonReadingThemes() {
  return loadedThemes;
}

export function getCommonReadingTheme(themeId) {
  return themeIndex.get(themeId) || null;
}

export function loadCommonReadingThemes(options = {}) {
  if (loadedThemes.length) return Promise.resolve(loadedThemes);
  if (loadingPromise) return loadingPromise;
  const fetcher = options.fetcher || globalThis.fetch;
  if (typeof fetcher !== 'function') return Promise.reject(new Error('Common reading theme fetch is unavailable'));
  const url = options.url || new URL('../../data/reading/common_reading_themes.json', import.meta.url);
  loadingPromise = Promise.resolve(fetcher(url)).then(response => {
    if (!response?.ok) throw new Error(`Common reading themes could not be loaded (${response?.status || 'unknown'})`);
    return response.json();
  }).then(setCommonReadingThemes).catch(error => {
    loadingPromise = null;
    throw error;
  });
  return loadingPromise;
}
