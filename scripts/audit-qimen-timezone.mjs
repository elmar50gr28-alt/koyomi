import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Diagnostic only: runs the current legacy input/adjustment functions in separate timezones.
if (process.argv.includes('--worker')) {
  const lines = readFileSync('app.html', 'utf8').split(/\r?\n/);
  const names = ['qmdjInputDate', 'qmdjEquationOfTime', 'qmdjAdjustedTime'];
  const definitions = names.map(name => lines.find(line => line.startsWith('function ' + name + '(')));
  if (definitions.some(line => !line)) throw new Error('Qimen definitions not found');
  const context = vm.createContext({ window: {}, DAY: 86400000, $: id => ({ value: id === 'qmTimezone' ? '9' : '2026-07-13T20:30' }) });
  vm.runInContext(readFileSync('src/shared/qimen-time-core.js', 'utf8'), context);
  vm.runInContext(definitions.join('\n') + '\nthis.result=qmdjAdjustedTime(qmdjInputDate(),139.7671,9,"standard");', context);
  process.stdout.write(JSON.stringify({ hostTimezone: process.env.TZ, input: '2026-07-13T20:30', selectedUtcOffset: 9,
    actualInstant: context.result.date.toISOString(), expectedInstant: '2026-07-13T11:30:00.000Z' }));
} else {
  const rows = ['Asia/Tokyo', 'UTC', 'America/New_York'].map(TZ => {
    const run = spawnSync(process.execPath, [process.argv[1], '--worker'], { env: { ...process.env, TZ }, encoding: 'utf8' });
    if (run.status !== 0) throw new Error(run.stderr || 'Timezone worker failed');
    return JSON.parse(run.stdout);
  });
  console.table(rows);
  const mismatch = rows.some(row => row.actualInstant !== row.expectedInstant);
  console.log(mismatch ? 'REPRODUCED: selected UTC+9 input depends on host timezone.' : 'No mismatch detected for this fixture.');
  // A nonzero result signals the unresolved defect; this diagnostic is not a CI test.
  process.exitCode = mismatch ? 1 : 0;
}
