import { getCommonReadingThemes, loadCommonReadingThemes } from './theme-loader.js';
import { selectCommonReadingThemes } from './theme-selector.js';
import { composeCommonReading } from './sentence-composer.js';
import { composeConcreteAnswer } from './concrete-answer-composer.js';

export async function prepareCommonReadingThemes(options = {}) {
  return loadCommonReadingThemes(options);
}

export function buildCommonReading(result, options = {}) {
  const themes = options.themes || getCommonReadingThemes();
  const reading = composeCommonReading(themes.length ? selectCommonReadingThemes(result, themes, options) : [], options);
  return { ...reading, answer: composeConcreteAnswer(reading, options) };
}

export { getCommonReadingTheme, getCommonReadingThemes, setCommonReadingThemes, validateCommonReadingThemes } from './theme-loader.js';
export { selectCommonReadingThemes } from './theme-selector.js';
export { composeCommonReading } from './sentence-composer.js';
export { composeConcreteAnswer } from './concrete-answer-composer.js';
export { interpretReadingQuestion, normalizeReadingQuestion } from './question-interpreter.js';
