import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  CALENDAR_TIME_API,
  createCalendarTimeCompatibility
} from '../src/shared/calendar-time-compat.js';

const calls = [];
const sentinel = Object.freeze({ source: 'legacy-result' });
const legacy = Object.fromEntries(
  CALENDAR_TIME_API.map(name => [name, (...args) => {
    calls.push({ name, args });
    return sentinel;
  }])
);
const compat = createCalendarTimeCompatibility(legacy);
const date = new Date(2026, 6, 21, 23, 45, 12);

for (const name of CALENDAR_TIME_API) {
  const args = name === 'formatCalendarDate'
    ? [date, 'hebrew', 'ja-JP']
    : [date];
  assert.equal(compat[name](...args), sentinel, `${name} must return the legacy result unchanged`);
  assert.equal(calls.at(-1).name, name);
  assert.deepEqual(calls.at(-1).args, args, `${name} must forward arguments unchanged`);
}

assert.ok(Object.isFrozen(compat), 'compatibility API must be immutable');
assert.throws(() => createCalendarTimeCompatibility({}), /formatLocalDate/);

const legacyError = new Error('legacy failure');
const failing = Object.fromEntries(
  CALENDAR_TIME_API.map(name => [name, () => {
    throw legacyError;
  }])
);
assert.throws(() => createCalendarTimeCompatibility(failing).parseLocalDate('bad'), error => error === legacyError);

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('window.KOYOMI_CALENDAR_TIME_LEGACY=Object.freeze'));
assert.ok(app.includes('formatLocalDate:fmtIso'));
assert.ok(app.includes('parseLocalDate:safeDate'));
assert.ok(app.includes('startOfLocalDay:startOfDay'));
assert.ok(app.includes('formatCalendarDate:calendarFormat'));
assert.ok(app.includes("from './src/shared/calendar-time-compat.js'"));
assert.ok(app.includes('window.KOYOMI_CALENDAR_TIME=createCalendarTimeCompatibility'));

console.log('Calendar/time compatibility tests passed');
