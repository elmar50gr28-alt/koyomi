import { BRANCH_CLASHES, BRANCH_COMBINATIONS, BRANCH_DESTRUCTIONS, BRANCH_HARMS, BRANCH_PUNISHMENTS, STEM_CLASHES, STEM_COMBINATIONS } from '../data.js';

function pairHits(items, rules, type) {
  const ids = new Set(items.filter(Boolean));
  return rules.filter(r => r.every(id => ids.has(id))).map(r => ({
    type,
    members: r.slice(0, r.length - (typeof r[r.length - 1] === 'string' && r.length === 3 ? 1 : 0)),
    resultElement: r.length === 3 ? r[2] : null,
    established: true,
    strength: ids.size >= 4 ? 'normal' : 'weak',
    evidence: [`${type}-phase1`]
  }));
}

export function evaluateStemRelations(chartResult, schoolConfig = {}) {
  const stems = Object.values(chartResult.chart?.pillars || {}).filter(Boolean).map(p => p.stem.id);
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    combinations: pairHits(stems, STEM_COMBINATIONS, 'stem-combination'),
    clashes: pairHits(stems, STEM_CLASHES, 'stem-clash'),
    competingRelations: [],
    evidence: ['stem-relations-seed']
  };
}

export function evaluateBranchRelations(chartResult, schoolConfig = {}) {
  const branches = Object.values(chartResult.chart?.pillars || {}).filter(Boolean).map(p => p.branch.id);
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    combinations: pairHits(branches, BRANCH_COMBINATIONS, 'branch-six-combination'),
    clashes: pairHits(branches, BRANCH_CLASHES, 'branch-clash'),
    punishments: BRANCH_PUNISHMENTS.filter(r => r.every(id => branches.includes(id))).map(r => ({ type: 'punishment', members: r, established: true, evidence: ['branch-punishment-phase1'] })),
    harms: pairHits(branches, BRANCH_HARMS, 'branch-harm'),
    destructions: pairHits(branches, BRANCH_DESTRUCTIONS, 'branch-destruction'),
    darkCombinations: [],
    storageOpening: [],
    evidence: ['branch-relations-seed']
  };
}
