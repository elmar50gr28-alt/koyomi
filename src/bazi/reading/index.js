const READING_VERSION = 'bazi-reading-engine-20260717';

const CATEGORY_DEFS = [
  ['overall', 'Overall Reading', 'The chart is read as a conditional map, not a fixed verdict.'],
  ['personality', 'Personality', 'Day master, season, and balance show the default operating style.'],
  ['talent', 'Talent', 'Talents are described as usable tendencies that need context and practice.'],
  ['career', 'Work', 'Career reading uses strength, output, officer, resource, and luck context.'],
  ['finance', 'Finance', 'Finance is read as resource flow and risk control, not guaranteed gain.'],
  ['relationship', 'Love and Relationships', 'Relationship tendency is read from balance and branch relations.'],
  ['family', 'Family', 'Family tendency is read from roots, pillar positions, and support structure.'],
  ['health', 'Health Tendency', 'This is lifestyle tendency only and never medical advice.'],
  ['decadeLuck', 'Decade Luck', 'Decade luck is a long-range condition overlay.'],
  ['annualLuck', 'Annual Luck', 'Annual luck is partial until precise annual pillars are expanded.'],
  ['monthlyLuck', 'Monthly Luck', 'Monthly luck is a short-range tendency and remains review-sensitive.'],
  ['advice', 'Good Fortune Advice', 'Advice translates favorable elements into small daily actions.']
];

const ELEMENT_ACTIONS = {
  wood: 'start one small growth task and write down the next branch of the plan',
  fire: 'make the message visible, but avoid promising more than you can sustain',
  earth: 'stabilize the ground: budget, calendar, sleep, and shared expectations',
  metal: 'cut one unclear obligation and define the rule or boundary in writing',
  water: 'collect information, rest the mind, and delay decisions that require calm'
};

const ELEMENT_WORDS = {
  wood: 'growth and planning',
  fire: 'visibility and expression',
  earth: 'stability and care',
  metal: 'structure and judgement',
  water: 'learning and adaptation'
};

export function buildBaziReading(baziResult, options = {}) {
  const facts = extractFacts(baziResult);
  const sections = Object.fromEntries(CATEGORY_DEFS.map(([id, title, policy]) => [
    id,
    buildSection(id, title, policy, facts, options)
  ]));
  const beginner = CATEGORY_DEFS.map(([id]) => beginnerBlock(sections[id]));
  const professional = CATEGORY_DEFS.map(([id]) => professionalBlock(sections[id], facts));
  const mitsunomeInput = buildReadingMitsunomeInput(facts, sections, beginner, professional, options);
  return {
    schemaId: 'koyomi-bazi-reading',
    version: READING_VERSION,
    sourceCalculationVersion: baziResult?.calculationVersion || null,
    personId: facts.personId,
    sections,
    beginner,
    professional,
    text: renderReadingText(sections, 'beginner'),
    beginnerText: renderReadingText(sections, 'beginner'),
    professionalText: renderReadingText(sections, 'professional'),
    mitsunomeInput,
    sourcePolicy: {
      noNewCalculation: true,
      usesExistingBaziResult: true,
      aiGeneratedTextIsNotSource: true,
      requiresReviewStatusForUnverifiedRules: true
    }
  };
}

export function buildBaziBeginnerReading(baziResult, options = {}) {
  return buildBaziReading(baziResult, { ...options, audience: 'beginner' }).beginnerText;
}

export function buildBaziProfessionalReading(baziResult, options = {}) {
  return buildBaziReading(baziResult, { ...options, audience: 'professional' }).professionalText;
}

export function buildBaziMitsunomeReadingInput(baziResult, options = {}) {
  return buildBaziReading(baziResult, options).mitsunomeInput;
}

export function validateBaziReading(reading) {
  const errors = [];
  if (!reading) errors.push('reading-missing');
  if (reading?.version !== READING_VERSION) errors.push('reading-version-mismatch');
  for (const [id] of CATEGORY_DEFS) {
    if (!reading?.sections?.[id]) errors.push(`section-missing-${id}`);
    if (!reading?.sections?.[id]?.sourceIds?.length) errors.push(`section-sourceIds-missing-${id}`);
    if (!reading?.sections?.[id]?.reviewStatus) errors.push(`section-reviewStatus-missing-${id}`);
  }
  if (!reading?.mitsunomeInput?.sourcePolicy?.aiGeneratedTextIsNotSource) errors.push('mitsunome-source-policy-missing');
  if (!reading?.sourcePolicy?.noNewCalculation) errors.push('new-calculation-policy-missing');
  return { ok: errors.length === 0, errors };
}

function extractFacts(result = {}) {
  const tendencies = result.interpretation?.tendencies || {};
  const luck = result.interpretation?.luck || {};
  const dayMaster = result.chart?.dayMaster || result.chart?.pillars?.day?.stem || {};
  const strength = result.strength?.dayMasterStrength || result.strength?.result || {};
  const yongshen = result.yongshen || {};
  const favorable = result.favorableElements?.favorable || yongshen.favorable || [];
  const avoid = result.favorableElements?.unfavorable || yongshen.unfavorable || [];
  const patterns = result.patterns?.candidates || [];
  const cycles = result.luckCycles?.cycles || [];
  const evidence = [
    ...(result.evidence || []),
    ...(result.strength?.evidence || []),
    ...(result.patterns?.evidence || []),
    ...(result.yongshen?.evidence || []),
    ...(result.professionalEvidence || []).flatMap(item => item.sourceIds || [])
  ].filter(Boolean);
  return {
    personId: result.normalizedInput?.personId || null,
    name: result.normalizedInput?.name || result.input?.displayName || '',
    precision: result.normalizedInput?.timeUnknown ? 'partial-without-hour-pillar' : 'known-birth-time',
    dayMaster,
    dayMasterName: dayMaster.kanji || dayMaster.name || dayMaster.id || 'unknown',
    dayMasterElement: dayMaster.element || 'unknown',
    strengthLevel: strength.level || strength.result || result.strength?.result || 'indeterminate',
    strengthConfidence: strength.confidence || result.strength?.confidence || result.confidence || 0.4,
    favorable,
    avoid,
    primaryFavorable: favorable[0] || yongshen.primary?.element || dayMaster.element || 'earth',
    patterns,
    cycles,
    currentCycle: cycles[0] || null,
    tendencies,
    luck,
    evidence: [...new Set(evidence)],
    warnings: result.warnings || [],
    confidence: result.confidence || 0.4,
    schoolId: result.chart?.schoolId || 'koyomi-integrated',
    validation: result.validation
  };
}

function buildSection(id, title, policy, facts) {
  const tendency = tendencyFor(id, facts);
  const confidence = confidenceFor(id, facts);
  const sourceIds = sourceIdsFor(id, facts);
  const reviewStatus = reviewStatusFor(id, facts);
  const beginnerSummary = beginnerSummaryFor(id, facts, tendency, policy);
  const professionalSummary = professionalSummaryFor(id, facts, tendency);
  return {
    id,
    title,
    tendency,
    beginnerSummary,
    professionalSummary,
    advice: adviceFor(id, facts),
    confidence,
    certainty: 'conditional',
    sourceIds,
    reviewStatus,
    warnings: warningsFor(id, facts),
    conditions: conditionsFor(id, facts)
  };
}

function tendencyFor(id, facts) {
  const t = facts.tendencies;
  const primary = ELEMENT_WORDS[facts.primaryFavorable] || 'balance';
  const map = {
    overall: `${facts.dayMasterName} day master with ${facts.strengthLevel} strength; use ${primary} as the first adjustment.`,
    personality: `The default style is shaped by ${facts.dayMasterElement} and the season/strength balance.`,
    talent: `Talent appears when ${primary} is used as a repeatable habit rather than a one-time push.`,
    career: t.career?.tendency || 'responsibility-and-learning',
    finance: t.finance?.tendency || 'resource-exchange-style',
    relationship: t.relationship?.tendency || 'relationship-rhythm',
    family: t.family?.tendency || 'support-structure',
    health: t.health?.tendency || 'lifestyle-attention',
    decadeLuck: facts.luck.decade?.[0]?.tendency || 'long-range-condition',
    annualLuck: facts.luck.annual?.[0]?.tendency || 'annual-condition-review-required',
    monthlyLuck: facts.luck.monthly?.[0]?.tendency || 'monthly-condition-review-required',
    advice: `Bring in ${facts.primaryFavorable} through one concrete action.`
  };
  return map[id] || 'conditional-tendency';
}

function beginnerSummaryFor(id, facts, tendency, policy) {
  if (id === 'health') return `${policy} Use this as a prompt for sleep, food, pacing, and consultation with professionals when needed.`;
  if (id === 'advice') return `Today's usable step: ${ELEMENT_ACTIONS[facts.primaryFavorable] || ELEMENT_ACTIONS.earth}.`;
  return `${policy} In plain terms: ${tendency}`;
}

function professionalSummaryFor(id, facts, tendency) {
  const patternIds = facts.patterns.slice(0, 3).map(p => p.patternId || p.id || p.name).filter(Boolean);
  const cycle = facts.currentCycle ? `cycle-${facts.currentCycle.index}` : 'cycle-unavailable';
  return [
    `school=${facts.schoolId}`,
    `dayMaster=${facts.dayMaster.id || facts.dayMasterName}`,
    `strength=${facts.strengthLevel}`,
    `yongshen=${facts.primaryFavorable}`,
    `patterns=${patternIds.join('|') || 'candidate-only'}`,
    `luck=${cycle}`,
    `reading=${tendency}`
  ].join('; ');
}

function adviceFor(id, facts) {
  if (id === 'decadeLuck') return 'Use decade luck for long-range planning; do not reverse life decisions from one signal.';
  if (id === 'annualLuck') return 'Use annual luck as a review calendar and keep reviewStatus visible.';
  if (id === 'monthlyLuck') return 'Use monthly luck for pacing, not final judgement.';
  if (id === 'health') return 'If symptoms or distress exist, prioritize licensed medical support.';
  return ELEMENT_ACTIONS[facts.primaryFavorable] || ELEMENT_ACTIONS.earth;
}

function confidenceFor(id, facts) {
  const base = Number(facts.confidence || 0.4);
  const penalty = ['annualLuck', 'monthlyLuck', 'health'].includes(id) ? 0.12 : 0;
  const bonus = ['overall', 'personality'].includes(id) ? 0.08 : 0;
  return Math.max(0.1, Math.min(0.88, Math.round((base + bonus - penalty) * 100) / 100));
}

function sourceIdsFor(id, facts) {
  const fromTendency = {
    career: facts.tendencies.career?.sourceIds,
    finance: facts.tendencies.finance?.sourceIds,
    relationship: facts.tendencies.relationship?.sourceIds,
    family: facts.tendencies.family?.sourceIds,
    health: facts.tendencies.health?.sourceIds,
    decadeLuck: facts.luck.decade?.[0]?.sourceIds,
    annualLuck: facts.luck.annual?.[0]?.sourceIds,
    monthlyLuck: facts.luck.monthly?.[0]?.sourceIds
  }[id] || [];
  const merged = [...fromTendency, ...facts.evidence].filter(Boolean);
  return [...new Set(merged.length ? merged : ['src-yuanhai-ziping-biblio'])];
}

function reviewStatusFor(id, facts) {
  if (['annualLuck', 'monthlyLuck', 'health'].includes(id)) return 'human-review-required';
  if (facts.precision === 'partial-without-hour-pillar') return 'partial-input-review';
  return 'reading-engine-rc';
}

function warningsFor(id, facts) {
  const warnings = [];
  if (facts.precision === 'partial-without-hour-pillar') warnings.push('birth-time-unknown-hour-pillar-partial');
  if (id === 'health') warnings.push('not-medical-advice');
  if (['annualLuck', 'monthlyLuck'].includes(id)) warnings.push('luck-interpretation-review-required');
  return [...new Set(warnings)];
}

function conditionsFor(id, facts) {
  const base = ['natal-chart-context', 'school-difference-visible', 'not-fixed-fate'];
  if (facts.precision === 'partial-without-hour-pillar') base.push('hour-pillar-limited');
  if (['decadeLuck', 'annualLuck', 'monthlyLuck'].includes(id)) base.push('luck-cycle-context-required');
  return base;
}

function beginnerBlock(section) {
  return {
    id: section.id,
    title: section.title,
    text: section.beginnerSummary,
    advice: section.advice,
    confidence: section.confidence,
    warnings: section.warnings
  };
}

function professionalBlock(section, facts) {
  return {
    id: section.id,
    title: section.title,
    text: section.professionalSummary,
    sourceIds: section.sourceIds,
    reviewStatus: section.reviewStatus,
    confidence: section.confidence,
    conditions: section.conditions,
    sourceSeparation: {
      originalTextStored: false,
      summaryStored: true,
      modernInterpretationStored: true,
      aiGeneratedProseStoredAsSource: false
    },
    validation: facts.validation || null
  };
}

function renderReadingText(sections, mode) {
  const lines = [];
  for (const [id, title] of CATEGORY_DEFS) {
    const section = sections[id];
    lines.push(`[${title}]`);
    lines.push(mode === 'professional' ? section.professionalSummary : section.beginnerSummary);
    lines.push(`Advice: ${section.advice}`);
    lines.push(`Confidence: ${section.confidence}; reviewStatus: ${section.reviewStatus}`);
    if (section.warnings.length) lines.push(`Warnings: ${section.warnings.join(', ')}`);
    if (mode === 'professional') lines.push(`Sources: ${section.sourceIds.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

function buildReadingMitsunomeInput(facts, sections, beginner, professional, options) {
  return {
    schemaId: 'mitsunome-bazi-reading-input',
    version: '1.0.0',
    audience: options.audience || 'both',
    personContext: {
      personId: facts.personId,
      name: facts.name,
      precision: facts.precision
    },
    readingSections: sections,
    beginner,
    professional,
    sourcePolicy: {
      aiGeneratedTextIsNotSource: true,
      calculationAlreadyCompleted: true,
      noNewCalculationByAi: true,
      preserveSchoolDifferences: true,
      keepReviewStatus: true
    }
  };
}
