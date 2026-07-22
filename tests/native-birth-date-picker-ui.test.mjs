import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, worker] = await Promise.all([readFile('app.html', 'utf8'), readFile('service-worker.js', 'utf8')]);
for (const id of ['birthDate', 'partnerBirthDate', 'birthA', 'birthB', 'lpBirthDate']) {
  assert.match(app, new RegExp(`id="${id}"[^>]*type="date"|type="date"[^>]*id="${id}"`));
  assert.ok(app.includes(`'${id}'`));
}
assert.ok(app.includes('input.max=core.todayIso()'));
assert.ok(app.includes("input.lang='ja-JP'"));
assert.ok(app.includes("input.inputMode='none'"));
assert.ok(app.includes('native-birth-date-display'));
assert.ok(app.includes('./src/shared/native-date-picker-core.js'));
assert.ok(worker.includes("'./src/shared/native-date-picker-core.js'"));

console.log('native birth date picker UI tests passed');
