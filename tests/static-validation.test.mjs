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
  'implementation-rate-report.json','case-classification.json','phase4-test-cases.json',
  'final-rule-audit.json','final-classical-audit.json','final-example-cases.json',
  'final-test-cases.json','final-quality-score.json','final-ai-review.json',
  'practical-audit-cases.json'
];

for (const file of requiredWorkflows) await access(join('.github', 'workflows', file));
for (const file of requiredData) JSON.parse(await readFile(join('data', 'bazi', file), 'utf8'));

const app = await readFile('app.html', 'utf8');
assert.ok(app.includes('KOYOMI_BAZI'), 'app.html must expose the Bazi engine without profile re-entry');

const serviceWorker = await readFile('service-worker.js', 'utf8');
assert.ok(serviceWorker.includes('koyomi-bazi-japanese-reading'), 'service worker cache name must include bazi japanese reading');
assert.ok(serviceWorker.includes('./src/bazi/index.js'), 'service worker must cache bazi engine entry');
assert.ok(serviceWorker.includes('./data/bazi/solar-term-rules.json'), 'service worker must cache solar-term rules');
assert.ok(serviceWorker.includes('./data/bazi/phase2-test-cases.json'), 'service worker must cache phase2 test cases');
assert.ok(serviceWorker.includes('./data/bazi/example-cases.json'), 'service worker must cache phase3 example cases');
assert.ok(serviceWorker.includes('./data/bazi/quality-audit.json'), 'service worker must cache phase4 quality audit');
assert.ok(serviceWorker.includes('./data/bazi/phase4-test-cases.json'), 'service worker must cache phase4 test cases');
assert.ok(serviceWorker.includes('./data/bazi/final-quality-score.json'), 'service worker must cache final quality score');
assert.ok(serviceWorker.includes('./data/bazi/final-test-cases.json'), 'service worker must cache final test cases');
assert.ok(serviceWorker.includes('./data/bazi/practical-audit-cases.json'), 'service worker must cache practical audit cases');
assert.ok(app.includes('koyomi-bazi-summary'), 'app.html must render practical Bazi summary first');
assert.ok(app.includes('function koyomiBaziLocale'), 'app.html must choose Bazi display language from app/device locale');
assert.ok(app.includes('\\u7dcf\\u5408\\u7d50\\u8ad6'), 'app.html must expose Japanese overall conclusion label');
assert.ok(app.includes('\\u6839\\u62e0\\u30fb\\u5c02\\u9580\\u5bb6\\u8868\\u793a'), 'app.html must expose localized expert evidence display');
assert.ok(app.includes('根拠・専門家表示'), 'app.html must expose expert evidence display');
assert.ok(app.includes('<details><summary>'), 'app.html must keep long reading sections collapsed');

const docs = await readdir(join('docs', 'bazi'));
assert.ok(docs.includes('IMPLEMENTATION_STATUS.md'), 'implementation status doc missing');

const srcStat = await stat(join('src', 'bazi', 'index.js'));
assert.ok(srcStat.size > 0, 'bazi index module is empty');
const readingStat = await stat(join('src', 'bazi', 'reading', 'index.js'));
assert.ok(readingStat.size > 0, 'bazi reading module is empty');
assert.ok(serviceWorker.includes('./src/bazi/reading/index.js'), 'service worker must cache bazi reading engine');

console.log(`Static validation passed: workflows=${requiredWorkflows.length}, data=${requiredData.length}`);
