import assert from 'node:assert/strict';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const requiredWorkflows = [
  'validate.yml',
  'bazi-tests.yml',
  'mobile-regression.yml',
  'deploy-pages.yml'
];

const requiredData = [
  'elements.json',
  'stems.json',
  'branches.json',
  'hidden-stems.json',
  'ten-gods.json',
  'twelve-stages.json',
  'stem-relations.json',
  'branch-relations.json',
  'solar-term-rules.json',
  'school-settings.json',
  'test-cases.json',
  'month-command.json',
  'root-strength.json',
  'exposed-stems.json',
  'element-flow.json',
  'climate-rules.json',
  'strength-rules.json',
  'pattern-catalog.json',
  'pattern-rules.json',
  'pattern-rescue-rules.json',
  'follow-pattern-rules.json',
  'transformation-pattern-rules.json',
  'yongshen-methods.json',
  'yongshen-rules.json',
  'favorable-unfavorable.json',
  'luck-cycle-rules.json',
  'phase2-test-cases.json',
  'classical-index.json',
  'classical-excerpts.json',
  'interpretation-rules.json',
  'luck-interpretation-rules.json',
  'example-cases.json',
  'explanation-templates.json',
  'mitsunome-input-schema.json',
  'quality-audit.json',
  'rule-consolidation.json',
  'contradiction-report.json',
  'source-coverage-report.json',
  'low-confidence-report.json',
  'review-status-report.json',
  'implementation-rate-report.json',
  'case-classification.json',
  'phase4-test-cases.json',
  'final-rule-audit.json',
  'final-classical-audit.json',
  'final-example-cases.json',
  'final-test-cases.json',
  'final-quality-score.json',
  'final-ai-review.json',
  'practical-audit-cases.json'
];

for (const file of requiredWorkflows) {
  await access(join('.github', 'workflows', file));
}

for (const file of requiredData) {
  JSON.parse(
    await readFile(
      join('data', 'bazi', file),
      'utf8'
    )
  );
}

const app = await readFile('app.html', 'utf8');

assert.ok(
  app.includes('KOYOMI_BAZI'),
  'app.html must expose the Bazi engine without profile re-entry'
);

const serviceWorker = await readFile(
  'service-worker.js',
  'utf8'
);

assert.ok(
  serviceWorker.includes('CACHE_VERSION'),
  'service worker must declare a cache version'
);

assert.ok(
  serviceWorker.includes('APP_SHELL'),
  'service worker must declare the application shell'
);

assert.ok(
  serviceWorker.includes('networkFirstHtml'),
  'service worker must use a network-first strategy for HTML'
);

assert.ok(
  serviceWorker.includes('staleWhileRevalidate'),
  'service worker must use stale-while-revalidate for runtime resources'
);

assert.ok(
  serviceWorker.includes('isSameOrigin'),
  'service worker must restrict runtime interception to same-origin requests'
);

assert.ok(
  !serviceWorker.includes(
    ".catch(()=>caches.match('./index.html'))"
  ),
  'non-HTML resource failures must not fall back to index.html'
);

const requiredShellFiles = [
  './index.html',
  './today.html',
  './app.html',
  './smoke-test.html',
  './manifest.webmanifest',
  './icon.svg'
];

for (const shellFile of requiredShellFiles) {
  assert.ok(
    serviceWorker.includes(shellFile),
    `service worker shell must include ${shellFile}`
  );
}

assert.ok(
  app.includes('koyomi-bazi-summary'),
  'app.html must render practical Bazi summary first'
);

assert.ok(
  app.includes('function koyomiBaziLocale'),
  'app.html must choose Bazi display language from app/device locale'
);

assert.ok(
  app.includes('\\u7dcf\\u5408\\u7d50\\u8ad6'),
  'app.html must expose Japanese overall conclusion label'
);

assert.ok(
  app.includes(
    '\\u6839\\u62e0\\u30fb\\u5c02\\u9580\\u5bb6\\u8868\\u793a'
  ),
  'app.html must expose localized expert evidence display'
);

assert.ok(
  app.includes('根拠・専門家表示'),
  'app.html must expose expert evidence display'
);

assert.ok(
  app.includes('<details><summary>'),
  'app.html must keep long reading sections collapsed'
);

const docs = await readdir(join('docs', 'bazi'));

assert.ok(
  docs.includes('IMPLEMENTATION_STATUS.md'),
  'implementation status doc missing'
);

const srcStat = await stat(
  join('src', 'bazi', 'index.js')
);

assert.ok(
  srcStat.size > 0,
  'bazi index module is empty'
);

const readingStat = await stat(
  join('src', 'bazi', 'reading', 'index.js')
);

assert.ok(
  readingStat.size > 0,
  'bazi reading module is empty'
);

const appHtml = await readFile('app.html', 'utf8');
assert.ok(!appHtml.includes('<div class="version-note"'), 'legacy release history must not be rendered');
assert.ok(!appHtml.includes('<h1>KOYOMI <span'), 'legacy version label must not be rendered in the heading');
assert.ok(appHtml.includes('<h1>KOYOMI</h1>'), 'current product heading is missing');
assert.ok(appHtml.includes('class="current-guide"'), 'current guidance entry point is missing');
assert.ok(appHtml.includes('href="#personal"'), 'personal reading entry point is missing');
assert.ok(appHtml.includes('id="personalActionSummary"'), 'visible personal action summary is missing');
for (const action of ['do', 'stop', 'homework']) {
  assert.ok(appHtml.includes(`data-personal-action="${action}"`), `${action} action summary field is missing`);
}
assert.ok(appHtml.includes("e.preventDefault();const target=document.getElementById(link.getAttribute('href').slice(1))"), 'reading index must bypass page hash routing');
assert.ok(appHtml.includes("target.open=true;target.scrollIntoView"), 'reading index must open and scroll to its result');
assert.ok(appHtml.includes('id="sukuyoResultSummary"'), 'Sukuyo result summary is missing');
for (const field of ['conclusion', 'evidence', 'action', 'caution', 'confidence']) {
  assert.ok(appHtml.includes(`data-sukuyo-summary="${field}"`), `Sukuyo ${field} summary field is missing`);
}
assert.ok(appHtml.includes("v191zMethodScore('sukuyo',r)"), 'Sukuyo summary must reuse the existing method score');
assert.ok(appHtml.includes("v191zMethodPlan('sukuyo',r)"), 'Sukuyo summary must reuse the existing action plan');

console.log(
  `Static validation passed: workflows=${requiredWorkflows.length}, data=${requiredData.length}`
);
