import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile('app.html', 'utf8');
const fixture = JSON.parse(await readFile('data/qimen/xun-leader-candidates.json', 'utf8'));
const names = ['QMDJ_STAR_HOME', 'QMDJ_DOOR_HOME', 'QMDJ_INSTRUMENTS', 'QMDJ_XUN_HIDDEN'];
const functions = ['qmdjMod', 'qmdjGroundPlate', 'qmdjFindStemPalace'];
const lines = app.split(/\r?\n/);
const selected = [...names.map(name => lines.find(line => line.startsWith('const ' + name + '='))),
  ...functions.map(name => lines.find(line => line.startsWith('function ' + name + '(')))];
assert.ok(selected.every(Boolean), 'existing definitions must be present');
const context = vm.createContext({});
vm.runInContext(selected.join('\n') + '\nthis.api={qmdjGroundPlate,qmdjFindStemPalace,QMDJ_STAR_HOME,QMDJ_DOOR_HOME,QMDJ_XUN_HIDDEN};', context);
const api = context.api;
assert.equal(fixture.cases.length, 12);
assert.equal(new Set(fixture.cases.map(c => c.caseId)).size, 12);
assert.equal(fixture.source.reviewStatus, 'needs_facsimile_review');
for (const c of fixture.cases) {
  assert.equal(c.reviewStatus, 'needs_facsimile_review');
  const index = ['甲子','甲戌','甲申','甲午','甲辰','甲寅'].indexOf(c.xunHead);
  assert.equal(api.QMDJ_XUN_HIDDEN[index], c.hiddenStem, c.caseId + ': hidden stem');
  const ground = api.qmdjGroundPlate(c.ju, c.dun);
  const palace = api.qmdjFindStemPalace(ground, c.hiddenStem);
  assert.equal(palace, c.expected.xunPalace, c.caseId + ': home palace');
  assert.equal(api.QMDJ_STAR_HOME[palace], c.expected.valueStar, c.caseId + ': leader star');
  assert.equal(api.QMDJ_DOOR_HOME[palace === 5 ? 2 : palace], c.expected.valueDoor, c.caseId + ': leader door');
}
// These are partial mappings; this test does not call qmdjChart or validate dated charts.
console.log('12 transcription-candidate xun/home-leader mappings matched; facsimile review pending');
