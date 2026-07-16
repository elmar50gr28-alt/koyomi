import { ELEMENTS } from '../data.js';

export function evaluateYongshen(chartResult, schoolConfig = {}, strengthResult = null) {
  const strength = strengthResult?.result || 'balanced';
  const dayElement = chartResult.chart?.dayMaster?.element;
  const generated = ELEMENTS[dayElement]?.generates;
  const resource = Object.entries(ELEMENTS).find(([, v]) => v.generates === dayElement)?.[0] || null;
  const balancePrimary = strength === 'strong' ? generated : strength === 'weak' ? resource : null;
  const climatePrimary = chartResult.chart?.monthCommand?.element === 'water' ? 'fire' : chartResult.chart?.monthCommand?.element === 'fire' ? 'water' : null;
  const methods = [
    { method: 'balance', primary: balancePrimary, secondary: null, confidence: 0.58 },
    { method: 'climate', primary: climatePrimary, secondary: null, confidence: 0.52 },
    { method: 'passage', primary: null, secondary: null, confidence: 0.25 },
    { method: 'illness-medicine', primary: null, secondary: null, confidence: 0.25 },
    { method: 'pattern', primary: null, secondary: null, confidence: 0.25 },
    { method: 'assistant-god', primary: null, secondary: null, confidence: 0.25 }
  ];
  return {
    schoolId: schoolConfig.schoolId || chartResult.chart?.schoolId,
    primary: balancePrimary || climatePrimary,
    secondary: [balancePrimary, climatePrimary].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(1),
    favorable: [balancePrimary, climatePrimary].filter(Boolean),
    unfavorable: [],
    neutral: [],
    methods,
    conflicts: methods.filter(m => m.primary).length > 1 ? ['method-difference'] : [],
    confidence: Math.max(...methods.map(m => m.confidence)),
    evidence: ['bazi-yongshen-climate-001']
  };
}
