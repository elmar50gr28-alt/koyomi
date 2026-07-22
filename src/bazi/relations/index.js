import {
  BRANCH_CLASHES,
  BRANCH_COMBINATIONS,
  BRANCH_DESTRUCTIONS,
  BRANCH_HARMS,
  BRANCH_PUNISHMENTS,
  BRANCH_SEASONAL_MEETINGS,
  BRANCH_TRINES,
  STEMS,
  STEM_CLASHES,
  STEM_COMBINATIONS,
  STEM_CONTROL_ELEMENTS
} from '../data.js';

const stemById = Object.fromEntries(STEMS.map(stem => [stem.id, stem]));

function relationKey(type, members) {
  return `${type}:${[...members].sort().join('|')}`;
}

function uniqueRelations(relations) {
  const seen = new Set();
  return relations.filter(relation => {
    const key = relationKey(relation.type, relation.members);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ruleHits(items, rules, type, hasResultElement = false) {
  const ids = new Set(items.filter(Boolean));
  return uniqueRelations(rules.filter(rule => {
    const members = hasResultElement ? rule.slice(0, -1) : rule;
    return members.every(id => ids.has(id));
  }).map(rule => {
    const members = hasResultElement ? rule.slice(0, -1) : rule.slice();
    return {
    type,
    members,
    resultElement: hasResultElement ? rule.at(-1) : null,
    established: true,
    strength: ids.size >= 4 ? 'normal' : 'weak',
    evidence: [`${type}-phase1`]
    };
  }));
}

function stemControlHits(stems) {
  const ids = [...new Set(stems.filter(Boolean))];
  const relations = [];
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const first = stemById[ids[left]];
      const second = stemById[ids[right]];
      if (!first || !second) continue;
      const forward = STEM_CONTROL_ELEMENTS.some(([controller, controlled]) => first.element === controller && second.element === controlled);
      const reverse = STEM_CONTROL_ELEMENTS.some(([controller, controlled]) => second.element === controller && first.element === controlled);
      if (!forward && !reverse) continue;
      const controller = forward ? first : second;
      const controlled = forward ? second : first;
      relations.push({
        type: 'stem-control',
        members: [controller.id, controlled.id],
        controller: controller.id,
        controlled: controlled.id,
        established: true,
        strength: 'normal',
        evidence: ['stem-control-elements']
      });
    }
  }
  return uniqueRelations(relations);
}

function halfTrineHits(branches, completeTrines) {
  const ids = new Set(branches.filter(Boolean));
  const completeKeys = new Set(completeTrines.map(relation => [...relation.members].sort().join('|')));
  const relations = [];
  for (const rule of BRANCH_TRINES) {
    const members = rule.slice(0, 3);
    if (completeKeys.has([...members].sort().join('|'))) continue;
    const present = members.filter(id => ids.has(id));
    if (present.length !== 2) continue;
    relations.push({
      type: 'branch-half-trine',
      members: present,
      resultElement: rule[3],
      established: true,
      strength: 'partial',
      evidence: ['branch-half-trine-core']
    });
  }
  return uniqueRelations(relations);
}

function punishmentHits(branches) {
  const counts = branches.filter(Boolean).reduce((result, id) => {
    result[id] = (result[id] || 0) + 1;
    return result;
  }, {});
  const ordinaryRules = BRANCH_PUNISHMENTS.filter(rule => rule.length > 1);
  const selfRules = BRANCH_PUNISHMENTS.filter(rule => rule.length === 1);
  return {
    punishments: ruleHits(branches, ordinaryRules, 'branch-punishment'),
    selfPunishments: selfRules.filter(([id]) => (counts[id] || 0) >= 2).map(([id]) => ({
      type: 'branch-self-punishment',
      members: [id, id],
      resultElement: null,
      established: true,
      strength: 'normal',
      evidence: ['branch-self-punishment-core']
    }))
  };
}

export function evaluateStemRelationSet(stems = []) {
  return {
    combinations: ruleHits(stems, STEM_COMBINATIONS, 'stem-combination', true),
    controls: stemControlHits(stems),
    clashes: ruleHits(stems, STEM_CLASHES, 'stem-clash')
  };
}

export function evaluateBranchRelationSet(branches = []) {
  const trines = ruleHits(branches, BRANCH_TRINES, 'branch-trine', true);
  const punishments = punishmentHits(branches);
  return {
    combinations: ruleHits(branches, BRANCH_COMBINATIONS, 'branch-six-combination', true),
    clashes: ruleHits(branches, BRANCH_CLASHES, 'branch-clash'),
    trines,
    seasonalMeetings: ruleHits(branches, BRANCH_SEASONAL_MEETINGS, 'branch-seasonal-meeting', true),
    halfTrines: halfTrineHits(branches, trines),
    punishments: punishments.punishments,
    selfPunishments: punishments.selfPunishments,
    harms: ruleHits(branches, BRANCH_HARMS, 'branch-harm'),
    destructions: ruleHits(branches, BRANCH_DESTRUCTIONS, 'branch-destruction')
  };
}

export function evaluateStemRelations(chartResult, schoolConfig = {}) {
  const stems = Object.values(chartResult.chart?.pillars || {}).filter(Boolean).map(p => p.stem.id);
  const relations = evaluateStemRelationSet(stems);
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    ...relations,
    competingRelations: [],
    evidence: ['stem-relations-seed']
  };
}

export function evaluateBasicStemRelations(chartResult, schoolConfig = {}) {
  return evaluateStemRelations(chartResult, schoolConfig);
}

export function evaluateBranchRelations(chartResult, schoolConfig = {}) {
  const branches = Object.values(chartResult.chart?.pillars || {}).filter(Boolean).map(p => p.branch.id);
  const relations = evaluateBranchRelationSet(branches);
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    ...relations,
    darkCombinations: [],
    storageOpening: [],
    evidence: ['branch-relations-seed']
  };
}

export function evaluateBasicBranchRelations(chartResult, schoolConfig = {}) {
  return evaluateBranchRelations(chartResult, schoolConfig);
}
