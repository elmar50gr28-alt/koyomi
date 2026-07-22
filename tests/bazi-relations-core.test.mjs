import assert from 'node:assert/strict';
import { evaluateBranchRelationSet, evaluateStemRelationSet } from '../src/bazi/relations/index.js';

function one(relations, key, type, members) {
  assert.equal(relations[key].length, 1, `${type} should have one match`);
  assert.equal(relations[key][0].type, type);
  assert.deepEqual(new Set(relations[key][0].members), new Set(members));
  assert.equal(relations[key][0].established, true);
}

function none(relations, key, message) {
  assert.deepEqual(relations[key], [], message);
}

const stemCombination = evaluateStemRelationSet(['ji', 'jia', 'jia']);
one(stemCombination, 'combinations', 'stem-combination', ['jia', 'ji']);
assert.equal(stemCombination.combinations[0].resultElement, 'earth');
none(evaluateStemRelationSet(['jia', 'yi']), 'combinations', 'unrelated stems must not combine');

const stemControl = evaluateStemRelationSet(['wu', 'jia']);
one(stemControl, 'controls', 'stem-control', ['jia', 'wu']);
assert.equal(stemControl.controls[0].controller, 'jia');
assert.equal(stemControl.controls[0].controlled, 'wu');
none(evaluateStemRelationSet(['jia', 'yi']), 'controls', 'same-element stems must not control');

one(evaluateBranchRelationSet(['chou', 'zi']), 'combinations', 'branch-six-combination', ['zi', 'chou']);
none(evaluateBranchRelationSet(['zi', 'yin']), 'combinations', 'unrelated branches must not six-combine');

one(evaluateBranchRelationSet(['wu', 'zi']), 'clashes', 'branch-clash', ['zi', 'wu']);
none(evaluateBranchRelationSet(['zi', 'chou']), 'clashes', 'unrelated branches must not clash');

const trine = evaluateBranchRelationSet(['chen', 'shen', 'zi']);
one(trine, 'trines', 'branch-trine', ['shen', 'zi', 'chen']);
none(trine, 'halfTrines', 'complete trine must not also return half trines');
none(evaluateBranchRelationSet(['shen', 'zi', 'xu']), 'trines', 'two members must not establish a complete trine');

one(evaluateBranchRelationSet(['chen', 'yin', 'mao']), 'seasonalMeetings', 'branch-seasonal-meeting', ['yin', 'mao', 'chen']);
none(evaluateBranchRelationSet(['yin', 'mao', 'si']), 'seasonalMeetings', 'two members must not establish a seasonal meeting');

one(evaluateBranchRelationSet(['zi', 'shen']), 'halfTrines', 'branch-half-trine', ['shen', 'zi']);
none(evaluateBranchRelationSet(['zi', 'wu']), 'halfTrines', 'branches outside one trine must not form a half trine');

one(evaluateBranchRelationSet(['shen', 'yin', 'si']), 'punishments', 'branch-punishment', ['yin', 'si', 'shen']);
none(evaluateBranchRelationSet(['yin', 'si']), 'punishments', 'incomplete three-punishment must not establish');

one(evaluateBranchRelationSet(['chen', 'chen']), 'selfPunishments', 'branch-self-punishment', ['chen']);
none(evaluateBranchRelationSet(['chen']), 'selfPunishments', 'one occurrence must not establish self-punishment');

one(evaluateBranchRelationSet(['wei', 'zi']), 'harms', 'branch-harm', ['zi', 'wei']);
none(evaluateBranchRelationSet(['zi', 'chou']), 'harms', 'unrelated branches must not harm');

one(evaluateBranchRelationSet(['you', 'zi']), 'destructions', 'branch-destruction', ['zi', 'you']);
none(evaluateBranchRelationSet(['zi', 'chou']), 'destructions', 'unrelated branches must not destroy');

const duplicateInput = evaluateBranchRelationSet(['zi', 'chou', 'zi', 'chou']);
assert.equal(duplicateInput.combinations.length, 1, 'duplicate input must not duplicate a relation');

console.log('Bazi relations core passed: combinations, controls, clashes, trines, meetings, half-trines, punishments, harms, destructions');
