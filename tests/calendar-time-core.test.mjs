import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { OFFLINE_CONTRACT } from '../src/shared/architecture-contracts.js';

const source = await readFile('src/shared/calendar-time-core.js', 'utf8');
const window = {};
vm.runInNewContext(source, { window, Date, Intl, isNaN });

const core = window.KOYOMI_CALENDAR_TIME_CORE;
assert.ok(Object.isFrozen(core));
assert.deepEqual(Object.keys(core), [
  'formatLocalDate',
  'parseLocalDate',
  'startOfLocalDay',
  'formatCalendarDate'
]);

const date = new Date(2026, 6, 21, 23, 45, 12, 345);
assert.equal(core.formatLocalDate(date), '2026-07-21');

const start = core.startOfLocalDay(date);
assert.equal(start.getFullYear(), 2026);
assert.equal(start.getMonth(), 6);
assert.equal(start.getDate(), 21);
assert.equal(start.getHours(), 0);
assert.equal(start.getMinutes(), 0);
assert.equal(start.getSeconds(), 0);
assert.equal(start.getMilliseconds(), 0);

const parsed = core.parseLocalDate('2026-07-21');
assert.equal(parsed.getFullYear(), 2026);
assert.equal(parsed.getMonth(), 6);
assert.equal(parsed.getDate(), 21);
assert.equal(parsed.getHours(), 12);
assert.equal(core.parseLocalDate(''), null);
assert.equal(core.parseLocalDate('not-a-date'), null);

const expectedGregorian = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(date);
assert.equal(core.formatCalendarDate(date, 'gregory', 'en-US'), expectedGregorian);
assert.equal(core.formatCalendarDate(date, 'invalid calendar!', 'en-US'), 'この環境では未対応');

const app = await readFile('app.html', 'utf8');
const scriptPath = './src/shared/calendar-time-core.js';
const coreScriptIndex = app.indexOf(`<script src="${scriptPath}"></script>`);
const applicationScriptIndex = app.indexOf("(function(){'use strict';");
assert.ok(coreScriptIndex >= 0, 'calendar/time core script missing');
assert.ok(coreScriptIndex < applicationScriptIndex, 'calendar/time core must load before the legacy application');
assert.ok(app.includes('startOfLocalDay:startOfDay'));
assert.ok(app.includes('formatLocalDate:fmtIso'));
assert.ok(app.includes('parseLocalDate:safeDate'));
assert.ok(app.includes('formatCalendarDate:calendarFormat'));
assert.ok(!app.includes('function startOfDay('));
assert.ok(!app.includes('function fmtIso('));
assert.ok(!app.includes('function safeDate('));
assert.ok(!app.includes('function calendarFormat('));

const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes(`'${scriptPath}'`));
assert.ok(OFFLINE_CONTRACT.shellFiles.includes(scriptPath));

console.log('Calendar/time core extraction tests passed');
