import { getCommonReadingThemes, loadCommonReadingThemes } from './theme-loader.js';
import { selectCommonReadingThemes } from './theme-selector.js';
import { composeCommonReading } from './sentence-composer.js';

export async function prepareCommonReadingThemes(options = {}) {
  return loadCommonReadingThemes(options);
}

export function buildCommonReading(result, options = {}) {
  const themes = options.themes || getCommonReadingThemes();
  if (!themes.length) return composeCommonReading([], options);
  return composeCommonReading(selectCommonReadingThemes(result, themes, options), options);
}

export { getCommonReadingTheme, getCommonReadingThemes, setCommonReadingThemes, validateCommonReadingThemes } from './theme-loader.js';
export { selectCommonReadingThemes } from './theme-selector.js';
export { composeCommonReading } from './sentence-composer.js';
