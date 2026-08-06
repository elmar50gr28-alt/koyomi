import { CLASSICAL_SOURCES, RULE_CATALOG } from '../data.js';

export const PHASE3_CLASSICAL_INDEX = [
  { sourceId: 'src-yuanhai-ziping-biblio', title: 'Yuanhai Ziping', reviewStatus: 'reviewed-index' },
  { sourceId: 'src-sanming-tonghui-biblio', title: 'Sanming Tonghui', reviewStatus: 'reviewed-index' },
  { sourceId: 'src-ditian-sui-biblio', title: 'Ditian Sui', reviewStatus: 'reviewed-index' },
  { sourceId: 'src-ziping-zhenquan-biblio', title: 'Ziping Zhenquan', reviewStatus: 'reviewed-index' },
  { sourceId: 'src-qiongtong-baojian-biblio', title: 'Qiongtong Baojian', reviewStatus: 'reviewed-index' }
];

export function explainRule(ruleId) {
  const rule = RULE_CATALOG.find(r => r.ruleId === ruleId);
  if (!rule) return null;
  return { ...rule, sources: rule.sourceIds.map(getEvidence).filter(Boolean) };
}

export function getEvidence(entityId) {
  return CLASSICAL_SOURCES.find(s => s.sourceId === entityId) || PHASE3_CLASSICAL_INDEX.find(s => s.sourceId === entityId) || RULE_CATALOG.find(r => r.ruleId === entityId) || null;
}

export function explainBaziDecision(entityId) {
  return explainRule(entityId) || getEvidence(entityId);
}
