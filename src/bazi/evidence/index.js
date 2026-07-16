import { CLASSICAL_SOURCES, RULE_CATALOG } from '../data.js';

export function explainRule(ruleId) {
  const rule = RULE_CATALOG.find(r => r.ruleId === ruleId);
  if (!rule) return null;
  return { ...rule, sources: rule.sourceIds.map(getEvidence).filter(Boolean) };
}

export function getEvidence(entityId) {
  return CLASSICAL_SOURCES.find(s => s.sourceId === entityId) || RULE_CATALOG.find(r => r.ruleId === entityId) || null;
}
