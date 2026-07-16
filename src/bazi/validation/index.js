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
