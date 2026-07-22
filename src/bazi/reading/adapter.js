const INTEGRATED_SCHEMA_ID = 'koyomi-bazi-integrated-reading-data';

const array = value => Array.isArray(value) ? value : [];
const unique = values => [...new Set(values.filter(Boolean))];

/**
 * Present integrated reading data through the legacy result shape consumed by
 * the existing prose generator. Missing or invalid integrated data falls back
 * to the original result, so saved results remain readable.
 */
export function adaptIntegratedBaziReadingSource(result = {}, options = {}) {
  const integratedData = options.integratedData || result.integratedReadingData;
  if (!isIntegratedReadingData(integratedData)) {
    return {
      result,
      audit: { mode: 'legacy-fallback', schemaId: integratedData?.schemaId || null, version: integratedData?.version || null }
    };
  }

  const analysis = integratedData.analysis;
  const summary = integratedData.summary;
  const summaryWarnings = array(summary?.uncertainties).map(entry => entry?.value);
  const readingGuardrails = {
    conflicts: array(summary?.conflicts).map(entry => entry?.id).filter(Boolean),
    uncertainties: summaryWarnings.filter(Boolean),
    suppressedClaims: array(summary?.suppressedClaims).map(entry => entry?.id).filter(Boolean),
    priorities: array(summary?.priorities).map(entry => entry?.id).filter(Boolean),
    evidence: array(summary?.evidence).map(entry => entry?.id).filter(Boolean)
  };
  const chart = {
    ...(result.chart || {}),
    pillars: integratedData.basic.chart,
    dayMaster: analysis.dayMaster,
    elementBalance: analysis.elementBalance,
    emptyVoid: analysis.emptyVoid
  };
  const luckCycles = {
    ...(result.luckCycles || {}),
    direction: integratedData.luck?.direction,
    startAge: integratedData.luck?.start?.age,
    startDate: integratedData.luck?.start?.date,
    startBoundary: integratedData.luck?.start?.boundary,
    cycles: integratedData.luck?.decades,
    annual: integratedData.luck?.annual,
    monthly: integratedData.luck?.monthly
  };

  return {
    result: {
      ...result,
      chart,
      relations: analysis.relations,
      strength: analysis.strength,
      patterns: analysis.patterns,
      yongshen: analysis.yongshen,
      favorableElements: {
        ...(result.favorableElements || {}),
        favorable: analysis.favorableElements,
        unfavorable: analysis.unfavorableElements
      },
      luckCycles,
      warnings: unique([...array(result.warnings), ...summaryWarnings]),
      readingGuardrails,
      integratedReadingData: integratedData
    },
    audit: {
      mode: 'integrated',
      schemaId: integratedData.schemaId,
      version: integratedData.version,
      preservesLegacyInterpretation: true,
      newCalculation: false
    }
  };
}

function isIntegratedReadingData(data) {
  return data?.schemaId === INTEGRATED_SCHEMA_ID
    && Boolean(data?.basic?.chart)
    && Boolean(data?.analysis?.dayMaster)
    && Boolean(data?.analysis?.strength)
    && Boolean(data?.analysis?.patterns)
    && Boolean(data?.analysis?.yongshen)
    && Array.isArray(data?.summary?.uncertainties);
}
