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
assert.ok(appHtml.includes("'sukuyoResultSummary'"), 'Sukuyo result summary is missing');
assert.ok(appHtml.includes("'kyuseiResultSummary'"), 'Kyusei result summary is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'sukuyo','sukuyoReading','sukuyoResultSummary')"), 'Sukuyo summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'kyusei','kyuseiReading','kyuseiResultSummary')"), 'Kyusei summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'astrology','astrologyReading','astrologyResultSummary')"), 'Astrology summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'tarot','tarotReading','tarotResultSummary')"), 'Tarot summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'runes','runesReading','runesResultSummary')"), 'Runes summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'name','nameReading','nameResultSummary')"), 'Name reading summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'numerology','numerologyReading','numerologyResultSummary')"), 'Numerology summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'kabbalah','kabbalahReading','kabbalahResultSummary')"), 'Kabbalah summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'rokusei','rokuseiReading','rokuseiResultSummary')"), 'Rokusei cycle summary adapter is missing');
assert.ok(appHtml.includes("v196RenderMethodSummary(r,'timing','timingReading','timingResultSummary')"), 'Timing summary adapter is missing');
for (const section of ['【相談とケルト十字】', '【カードごとの読み】', '【十字部分：問題の構造】', '【杖部分：本人から結果まで】', '【相談への回答】', '【現実での確認】']) {
  assert.ok(appHtml.includes(section), `Tarot full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes("dominant&&dominant[1]>=3"), 'Tarot reading must evaluate repeated suits');
assert.ok(appHtml.includes("大アルカナ${majors}枚、正位置${upright}枚、逆位置${reversed}枚"), 'Tarot reading must expose spread balance');
for (const position of ['現状', '障害', '顕在意識', '潜在意識', '過去', '近い未来', '自分の立場', '周囲の状況', '願望・恐れ', '最終結果']) {
  assert.ok(appHtml.includes(position), `Celtic Cross position is missing: ${position}`);
}
assert.ok(appHtml.includes('arr.length<10'), 'Celtic Cross must draw ten unique cards');
for (const section of ['【相談と三つのルーン】', '【現在の核】', '【越える課題】', '【次の一手】', '【三枚のつながり】', '【相談への回答】', '【現実での確認】']) {
  assert.ok(appHtml.includes(section), `Runes full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes("rev===3?'3枚とも反転"), 'Runes reading must handle all-reversed spreads');
for (const section of ['【相談と姓名判断】', '【姓名の五格】', '【五格の関係】', '【仕事・対人・内面】', '【相談への回答】', '【画数と判定の確度】', '【現実での確認】']) {
  assert.ok(appHtml.includes(section), `Name full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes("filter(ch=>!NAME_STROKES[ch])"), 'Name reading must disclose fallback stroke counts');
assert.ok(appHtml.includes('globalThis.KOYOMI_NAME_STROKES'), 'Name reading must use the generated stroke dictionary');
assert.ok(appHtml.includes('complete:false,unknownChars'), 'Name reading must withhold incomplete stroke calculations');
for (const section of ['【相談と数秘術】', '【四つの数】', '【数同士の関係】', '【仕事・対人・内面】', '【相談への回答】', '【判定の確度】', '【現実での確認】']) {
  assert.ok(appHtml.includes(section), `Numerology full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes('coreGap=Math.abs(reduceNumber(lp)-reduceNumber(attitude))'), 'Numerology must compare core and attitude numbers');
for (const section of ['【カバラ・ゲマトリアは判定保留】', '【相談とカバラ・ゲマトリア】', '【三つの名前数】', '【生年月日と名前の橋】', '【外向きの役割と内面】', '【相談への回答】', '【判定の確度】', '【現実での確認】']) {
  assert.ok(appHtml.includes(section), `Kabbalah full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes("if(!clean)return`【カバラ・ゲマトリアは判定保留】"), 'Kabbalah must withhold readings without romanized names');
assert.ok(appHtml.includes("$('romaji').value=n.romanizedName||n.originalSpelling||''"), 'ledger selection must copy the romanized name into the reading form');
assert.ok(appHtml.includes("$('lpRomanizedName').value=$('romaji')?.value||''"), 'profile creation must preserve the reading form romanized name');
assert.ok(appHtml.includes('`採用表記 ${r.i.romaji}`'), 'Kabbalah result metadata must show the romanized spelling used');
for (const section of ['【相談と独自12周期】', '【年運：${r.year}】', '【月運：${r.month}】', '【年運と月運の組み合わせ】', '【相談への回答】', '【進める条件・止める条件】', '【判定の確度】', '【現実での確認】']) {
  assert.ok(appHtml.includes(section), `Rokusei cycle full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes('if(yearCaution&&monthCaution)'), 'Rokusei cycle reading must combine year and month caution periods');
for (const section of ['【相談と四層の時期】', '【大運：長期の土台】', '【流年：今年の優先】', '【月運：今月の実行量】', '【日運：選択日の使い方】', '【四層の一致度】', '【相談への回答】', '【時刻・出生地の確度】', '【再判定条件】']) {
  assert.ok(appHtml.includes(section), `Timing full reading section is missing: ${section}`);
}
assert.ok(appHtml.includes('strong=signals.filter(x=>x>=65).length'), 'Timing reading must compare all four time horizons');
for (const field of ['conclusion', 'evidence', 'action', 'caution', 'confidence']) {
  assert.ok(appHtml.includes(`data-method-summary="${field}"`), `${field} method summary field is missing`);
}
assert.ok(appHtml.includes('v191zMethodScore(key,r)'), 'method summaries must reuse the existing method score');
assert.ok(appHtml.includes('v191zMethodPlan(key,r)'), 'method summaries must reuse the existing action plan');

console.log(
  `Static validation passed: workflows=${requiredWorkflows.length}, data=${requiredData.length}`
);
