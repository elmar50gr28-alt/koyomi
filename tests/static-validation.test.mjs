import assert from 'node:assert/strict';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const requiredWorkflows = ['validate.yml', 'bazi-tests.yml', 'mobile-regression.yml', 'deploy-pages.yml'];
const requiredData = [
  'elements.json', 'stems.json', 'branches.json', 'hidden-stems.json', 'ten-gods.json',
  'twelve-stages.json', 'stem-relations.json', 'branch-relations.json', 'solar-term-rules.json',
  'school-settings.json', 'test-cases.json',
  'month-command.json', 'root-strength.json', 'exposed-stems.json', 'element-flow.json',
  'climate-rules.json', 'strength-rules.json', 'pattern-catalog.json', 'pattern-rules.json',
  'pattern-rescue-rules.json', 'follow-pattern-rules.json', 'transformation-pattern-rules.json',
  'yongshen-methods.json', 'yongshen-rules.json', 'favorable-unfavorable.json',
  'luck-cycle-rules.json', 'phase2-test-cases.json'
  ,'classical-index.json','classical-excerpts.json','interpretation-rules.json',
  'luck-interpretation-rules.json','example-cases.json','explanation-templates.json',
  'mitsunome-input-schema.json',
  'quality-audit.json','rule-consolidation.json','contradiction-report.json',
  'source-coverage-report.json','low-confidence-report.json','review-status-report.json',
  'implementation-rate-report.json','case-classification.json','phase4-test-cases.json'
];

for (const file of requiredWorkflows) await access(join('.github', 'workflows', file));
for (const file of requiredData) JSON.parse(await readFile(join('data', 'bazi', file), 'utf8'));

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('KOYOMI_BAZI'), 'app.html must expose the Bazi engine without profile re-entry');

const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes('koyomi-bazi-phase4-quality'), 'service worker cache name must include bazi phase4 quality');
assert.ok(serviceWorker.includes('./src/bazi/index.js'), 'service worker must cache bazi engine entry');
assert.ok(serviceWorker.includes('./data/bazi/solar-term-rules.json'), 'service worker must cache solar-term rules');
assert.ok(serviceWorker.includes('./data/bazi/phase2-test-cases.json'), 'service worker must cache phase2 test cases');
assert.ok(serviceWorker.includes('./data/bazi/example-cases.json'), 'service worker must cache phase3 example cases');
assert.ok(serviceWorker.includes('./data/bazi/quality-audit.json'), 'service worker must cache phase4 quality audit');
assert.ok(serviceWorker.includes('./data/bazi/phase4-test-cases.json'), 'service worker must cache phase4 test cases');

const docs = await readdir(join('docs', 'bazi'));
assert.ok(docs.includes('IMPLEMENTATION_STATUS.md'), 'implementation status doc missing');

const srcStat = await stat(join('src', 'bazi', 'index.js'));
assert.ok(srcStat.size > 0, 'bazi index module is empty');

console.log(`Static validation passed: workflows=${requiredWorkflows.length}, data=${requiredData.length}`);
