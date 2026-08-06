import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildCommonReading,
  selectCommonReadingThemes,
  setCommonReadingThemes,
  validateCommonReadingThemes
} from '../src/reading/index.js';
import { calculateBazi } from '../src/bazi/index.js';

const themes = JSON.parse(await readFile(new URL('../data/reading/common_reading_themes.json', import.meta.url), 'utf8'));
const validation = validateCommonReadingThemes(themes);
assert.deepEqual(validation, { valid: true, errors: [] });
setCommonReadingThemes(themes);

const result = {
  chart: {
    pillars: {
      year: { stem: { tenGod: { kanji: '正財' } }, branch: { twelveStage: { kanji: '長生' } } },
      month: { stem: { tenGod: { kanji: '偏印' } }, branch: { twelveStage: { kanji: '病' } } }
    }
  }
};

const selected = selectCommonReadingThemes(result, themes, { maxThemes: 6 });
assert.equal(selected.length, 6);
assert.ok(selected.some(entry => entry.theme.theme_id === 'MONEY_LONG_TERM_STABILITY'));
assert.ok(selected.some(entry => entry.theme.theme_id === 'MIND_STRONG_INTUITION'));
assert.ok(selected.every(entry => entry.evidence.every(evidence => evidence.system === 'bazi')));

const reading = buildCommonReading(result, { tone: 'mitsunome', maxThemes: 6 });
assert.equal(reading.schemaId, 'koyomi-common-reading');
assert.equal(reading.available, true);
assert.equal(reading.items.length, 6);
assert.ok(reading.summary.length > 0);
assert.ok(reading.todayAction.length > 0);
assert.deepEqual(reading.sourcePolicy, { existingCalculationResultsOnly: true, offlineDataOnly: true });

const empty = buildCommonReading({ chart: { pillars: {} } });
assert.equal(empty.available, false);
assert.equal(empty.summary, '');

const calculated = calculateBazi({
  displayName: 'Common Reading Integration',
  birthData: {
    date: '1984-02-05',
    time: '12:00',
    place: { label: 'Tokyo', longitude: 139.767, utcOffset: 9, timezone: 'Asia/Tokyo' }
  }
});
assert.equal(calculated.commonReading.schemaId, 'koyomi-common-reading');
assert.equal(calculated.reading.commonReading, calculated.commonReading);
assert.equal(calculated.commonReading.available, true, 'a real Bazi chart should select evidence-backed common themes');
assert.ok(calculated.commonReading.items.every(item => item.evidence.length > 0));

console.log('Common reading engine passed');
