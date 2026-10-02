import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFirmsCsv, validateUsgsPayload, publishObservations } from '../scripts/lib/volcano-feed-validation.mjs';

const header = 'latitude,longitude,acq_date,acq_time,frp,bright_ti4';
assert.deepEqual(parseFirmsCsv(header), [], 'valid empty feed is distinct from failure');
assert.equal(parseFirmsCsv(`${header}\n35,139,2026-10-01,0130,4,350`).length, 1);
for (const text of ['Invalid MAP_KEY', '<html>Unavailable</html>', '', `${header}\n35,139`, `${header}\n,139,2026-10-01,0130,4,350`, `${header}\n35,139,2026-10-01,2560,4,350`]) assert.throws(() => parseFirmsCsv(text));
assert.deepEqual(validateUsgsPayload({ type: 'FeatureCollection', features: [] }).features, []);
for (const payload of [{}, {error: 'unavailable'}, {type:'FeatureCollection',features:[{}]}]) assert.throws(() => validateUsgsPayload(payload));
const dir = await mkdtemp(join(tmpdir(), 'koyomi-feed-'));
try {
  const path = join(dir, 'observations.json');
  await writeFile(path, 'last verified data');
  await assert.rejects(publishObservations(path, { freshness: { publishable: false } }));
  assert.equal(await readFile(path, 'utf8'), 'last verified data');
  const payload = { freshness: { publishable: true }, thermalByVolcano: {} };
  await publishObservations(path, payload);
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), payload);
} finally { await rm(dir, { recursive: true, force: true }); }
console.log('Volcano provider errors, empty feeds, and safe publication passed');
