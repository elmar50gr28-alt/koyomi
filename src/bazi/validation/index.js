export function validateChartResult(result) {
  const errors = [];
  if (!result) errors.push('result-missing');
  if (!result?.normalizedInput) errors.push('normalized-input-missing');
  if (!result?.chart?.pillars?.year) errors.push('year-pillar-missing');
  if (!result?.chart?.pillars?.month) errors.push('month-pillar-missing');
  if (!result?.chart?.pillars?.day) errors.push('day-pillar-missing');
  if (result?.normalizedInput?.timeUnknown && result?.chart?.pillars?.hour) errors.push('hour-pillar-should-be-null-when-time-unknown');
  if (!Array.isArray(result?.chart?.elementBalance)) errors.push('element-balance-missing');
  return { ok: errors.length === 0, errors, warnings: result?.warnings || [] };
}

export function validateBaziResult(result) {
  return validateChartResult(result);
}

export function validateBaziPhase2Result(result) {
  const base = validateChartResult(result);
  const errors = [...base.errors];
  if (!result?.strength?.dayMasterStrength) errors.push('phase2-day-master-strength-missing');
  if (!result?.patterns?.candidates) errors.push('phase2-pattern-candidates-missing');
  if (!result?.yongshen?.methods) errors.push('phase2-yongshen-methods-missing');
  if (!result?.luckCycles?.cycles) errors.push('phase2-luck-cycles-missing');
  return { ok: errors.length === 0, errors, warnings: result?.warnings || [] };
}
