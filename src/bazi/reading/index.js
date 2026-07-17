const READING_VERSION = 'bazi-practical-tuning-20260717';

const CATEGORY_DEFS = [
  ['overall', 'Overall Reading', 'Read the whole chart first: theme, strength, caution, action, and confidence.'],
  ['personality', 'Personality', 'Beginner alias for essence; shows how the day master tends to operate.'],
  ['essence', 'Essence', 'The day master, season, and strength show the native operating style.'],
  ['talent', 'Talent', 'Talents are usable tendencies that need context, repetition, and timing.'],
  ['weakness', 'Weakness and Caution', 'Cautions are handled with a recovery path, not fear.'],
  ['career', 'Work', 'Career reading translates chart tendencies into responsibility, role, and working style.'],
  ['finance', 'Finance', 'Finance is read as resource flow and risk control, not certain gain.'],
  ['love', 'Love', 'Love is read from rhythm, expression, support, and branch relations.'],
  ['marriage', 'Marriage', 'Marriage is read as long-term relationship conditions, not as a fixed verdict.'],
  ['relationship', 'Relationships', 'Relationship tendency is read from balance, expression, and branch relations.'],
  ['family', 'Family', 'Family tendency is read from roots, pillar positions, and support structure.'],
  ['health', 'Health Tendency', 'Health reading is lifestyle tendency only and not diagnosis.'],
  ['learning', 'Learning', 'Learning style is read from resource, output, focus, and pacing.'],
  ['creation', 'Creation', 'Creative output is read from expression, fire/wood flow, and repeatability.'],
  ['decadeLuck', 'Decade Luck', 'Decade luck is the long-range condition overlay.'],
  ['annualLuck', 'Annual Luck', 'Annual luck is the yearly weather; it should not override the natal chart alone.'],
  ['monthlyLuck', 'Monthly Luck', 'Monthly luck is a pacing signal and remains review-sensitive.'],
  ['importantTiming', 'Important Timing', 'Timing is read as a range where preparation, action, and rest differ.'],
  ['advice', 'Good Fortune Advice', 'Advice translates favorable elements into small daily actions.']
];

const REQUIRED_SECTION_FIELDS = [
  'conclusion',
  'evidence',
  'opposingFactors',
  'conditions',
  'timing',
  'action',
  'caution',
  'avoidance',
  'confidence',
  'sourceIds',
  'schoolIds',
  'reviewStatus',
  'unresolvedFactors'
];

const ELEMENT_ACTIONS = {
  wood: 'choose one growth task, name the next branch, and make it visible on your calendar',
  fire: 'make one message clear and public, while keeping the promise small enough to sustain',
  earth: 'stabilize budget, calendar, sleep, and shared expectations before expanding',
  metal: 'cut one unclear obligation and write the rule or boundary in plain words',
  water: 'collect information, rest the mind, and delay decisions that need calm'
};

const ELEMENT_WORDS = {
  wood: 'growth, planning, and steady expansion',
  fire: 'visibility, expression, and shared enthusiasm',
  earth: 'stability, care, and practical grounding',
  metal: 'structure, judgement, and boundary setting',
  water: 'learning, recovery, and adaptive strategy'
};

const GLOSSARY = {
  strongDayMaster: {
    term: 'strong day master',
    beginner: 'a tendency to push your own will and energy outward more easily',
    professional: 'supported day master by season, roots, combinations, or resource/output balance; school differences remain visible'
  },
  weakDayMaster: {
    term: 'weak day master',
    beginner: 'a tendency to show strength through environment, support, preparation, and timing',
    professional: 'day master support is limited or contested by season, roots, drains, or controlling elements'
  },
  yongshen: {
    term: 'yongshen',
    beginner: 'the key that helps rebalance the chart tendency',
    professional: 'selected by balancing, climate, pattern, disease-remedy, and school-specific rules'
  },
  climate: {
    term: 'climate adjustment',
    beginner: 'the view that cold, heat, dryness, or dampness changes how the chart should be handled',
    professional: 'tiaohou reading; may disagree with simple strength balancing'
  },
  pattern: {
    term: 'pattern',
    beginner: 'a frame for how the whole chart tends to work',
    professional: 'geju candidate selected with roots, month command, exposed stems, transformations, and rescue rules'
  },
  luckCycle: {
    term: 'luck cycle',
    beginner: 'the outside weather that changes how easy or hard the natal tendency is to use',
    professional: 'decade, annual, and monthly overlays read together with natal evidence and confidence'
  }
};

const PROFESSIONAL_CATEGORIES = new Set(['decadeLuck', 'annualLuck', 'monthlyLuck', 'importantTiming']);

export function buildBaziReading(baziResult, options = {}) {
  const facts = extractFacts(baziResult, options);
  const sections = Object.fromEntries(CATEGORY_DEFS.map(([id, title, policy]) => [
    id,
    buildSection(id, title, policy, facts, options)
  ]));
  const executiveSummary = buildExecutiveSummary(facts, sections);
  const timingReading = buildTimingReading(facts, sections);
  const beginner = CATEGORY_DEFS.map(([id]) => beginnerBlock(sections[id]));
  const professional = CATEGORY_DEFS.map(([id]) => professionalBlock(sections[id], facts));
  const text = renderReadingText(sections, 'beginner', executiveSummary, timingReading);
  const professionalText = renderReadingText(sections, 'professional', executiveSummary, timingReading);
  const mitsunomeInput = buildReadingMitsunomeInput(facts, sections, beginner, professional, executiveSummary, timingReading, options);
  return {
    schemaId: 'koyomi-bazi-reading',
    version: READING_VERSION,
    sourceCalculationVersion: baziResult?.calculationVersion || null,
    personId: facts.personId,
    executiveSummary,
    timingReading,
    glossary: GLOSSARY,
    uiModel: buildUiModel(sections, executiveSummary, timingReading),
    sections,
    beginner,
    professional,
    text,
    beginnerText: text,
    professionalText,
    mitsunomeInput,
    mitsunome: mitsunomeInput.voiceDrafts,
    quality: inspectReadingQuality(sections, text, professionalText),
    sourcePolicy: {
      noNewCalculation: true,
      usesExistingBaziResult: true,
      aiGeneratedTextIsNotSource: true,
      requiresReviewStatusForUnverifiedRules: true,
      weakEvidenceRequiresSoftLanguage: true
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
  if (!reading?.executiveSummary?.centralTheme) errors.push('executive-summary-missing');
  if (!reading?.timingReading?.longTermTheme) errors.push('timing-reading-missing');
  for (const [id] of CATEGORY_DEFS) {
    const section = reading?.sections?.[id];
    if (!section) {
      errors.push(`section-missing-${id}`);
      continue;
    }
    for (const field of REQUIRED_SECTION_FIELDS) {
      if (section[field] == null) errors.push(`section-field-missing-${id}-${field}`);
    }
    if (!section.sourceIds?.length) errors.push(`section-sourceIds-missing-${id}`);
    if (!section.schoolIds?.length) errors.push(`section-schoolIds-missing-${id}`);
    if (!section.reviewStatus) errors.push(`section-reviewStatus-missing-${id}`);
    if (section.confidence < 0.55 && !usesSoftLanguage(section.conclusion + ' ' + section.caution)) {
      errors.push(`low-confidence-soft-language-missing-${id}`);
    }
  }
  if (!reading?.glossary?.yongshen?.beginner) errors.push('beginner-glossary-missing');
  if (!reading?.mitsunomeInput?.sourcePolicy?.aiGeneratedTextIsNotSource) errors.push('mitsunome-source-policy-missing');
  if (!reading?.mitsunomeInput?.voiceDrafts?.zubat?.escapeRoute) errors.push('mitsunome-zubat-escape-missing');
  if (!reading?.sourcePolicy?.noNewCalculation) errors.push('new-calculation-policy-missing');
  if (reading?.quality?.bannedExpressionHits?.length) errors.push('banned-expression-hit');
  return { ok: errors.length === 0, errors };
}

function extractFacts(result = {}, options = {}) {
  const tendencies = result.interpretation?.tendencies || {};
  const luck = result.interpretation?.luck || {};
  const dayMaster = result.chart?.dayMaster || result.chart?.pillars?.day?.stem || {};
  const strength = result.strength?.dayMasterStrength || result.strength?.result || {};
  const yongshen = result.yongshen || {};
  const favorable = result.favorableElements?.favorable || yongshen.favorable || yongshen.favorableElements?.favorable || [];
  const avoid = result.favorableElements?.unfavorable || yongshen.unfavorable || yongshen.favorableElements?.unfavorable || [];
  const patterns = result.patterns?.candidates || result.patterns?.primaryCandidates || [];
  const cycles = result.luckCycles?.cycles || [];
  const evidence = [
    ...(result.evidence || []),
    ...(result.strength?.evidence || []),
    ...(result.patterns?.evidence || []),
    ...(result.yongshen?.evidence || []),
    ...(result.professionalEvidence || []).flatMap(item => item.sourceIds || [])
  ].filter(Boolean);
  const confidence = clamp01(result.confidence || strength.confidence || result.strength?.confidence || 0.46);
  const occupation = normalizeOccupation(options.occupation || result.normalizedInput?.occupation || result.input?.occupation || '');
  return {
    personId: result.normalizedInput?.personId || null,
    name: result.normalizedInput?.name || result.input?.displayName || '',
    occupation,
    precision: result.normalizedInput?.timeUnknown || result.input?.birthData?.timeUnknown ? 'partial-without-hour-pillar' : 'known-birth-time',
    dayMaster,
    dayMasterName: dayMaster.kanji || dayMaster.name || dayMaster.id || 'unknown',
    dayMasterElement: normalizeElement(dayMaster.element) || 'earth',
    strengthLevel: strength.level || strength.result || result.strength?.result || 'indeterminate',
    strengthConfidence: clamp01(strength.confidence || result.strength?.confidence || confidence),
    favorable: asArray(favorable).map(normalizeElement).filter(Boolean),
    avoid: asArray(avoid).map(normalizeElement).filter(Boolean),
    primaryFavorable: normalizeElement(asArray(favorable)[0] || yongshen.primary?.element || dayMaster.element) || 'earth',
    patterns,
    cycles,
    currentCycle: cycles[0] || null,
    tendencies,
    luck,
    evidence: [...new Set(evidence)],
    warnings: result.warnings || [],
    confidence,
    schoolId: result.chart?.schoolId || result.schoolId || 'koyomi-integrated',
    schoolIds: [...new Set(['koyomi-integrated', result.chart?.schoolId, result.schoolId].filter(Boolean))],
    validation: result.validation
  };
}

function buildSection(id, title, policy, facts) {
  const confidence = confidenceFor(id, facts);
  const tendency = tendencyFor(id, facts);
  const sourceIds = sourceIdsFor(id, facts);
  const reviewStatus = reviewStatusFor(id, facts, confidence);
  const conclusion = conclusionFor(id, facts, tendency, confidence);
  const action = actionFor(id, facts);
  const caution = cautionFor(id, facts, confidence);
  const avoidance = avoidanceFor(id, facts);
  const evidence = evidenceFor(id, facts, tendency);
  const opposingFactors = opposingFactorsFor(id, facts);
  const conditions = conditionsFor(id, facts);
  const timing = timingFor(id, facts);
  const unresolvedFactors = unresolvedFactorsFor(id, facts, confidence);
  const beginnerSummary = [
    policy,
    `Plain meaning: ${conclusion}`,
    `Action: ${action}`,
    `Caution: ${caution}`,
    `Recovery path: ${avoidance}`
  ].join(' ');
  const professionalSummary = professionalSummaryFor(id, facts, tendency, sourceIds, opposingFactors, unresolvedFactors);
  return {
    id,
    title,
    tendency,
    conclusion,
    evidence,
    opposingFactors,
    conditions,
    timing,
    action,
    caution,
    avoidance,
    confidence,
    certainty: confidence >= 0.72 ? 'moderate-high' : confidence >= 0.55 ? 'moderate' : 'conditional-low',
    sourceIds,
    schoolIds: facts.schoolIds,
    reviewStatus,
    warnings: warningsFor(id, facts),
    unresolvedFactors,
    beginnerSummary,
    professionalSummary,
    advice: action
  };
}

function buildExecutiveSummary(facts, sections) {
  const strengthMeaning = isStrong(facts)
    ? 'your will and momentum can become the engine'
    : isWeak(facts)
      ? 'support, timing, and environment make your strength easier to use'
      : 'balance and situation reading matter more than one label';
  return {
    centralTheme: `Use ${ELEMENT_WORDS[facts.primaryFavorable] || 'balance'} to turn ${facts.dayMasterName} day-master tendencies into steady action.`,
    strength: `Core strength: ${strengthMeaning}.`,
    currentIssue: sections.weakness?.conclusion || sections.overall.conclusion,
    currentFlow: buildCurrentFlow(facts),
    doNow: sections.advice.action,
    avoid: sections.weakness.avoidance,
    confidence: round2(Math.min(sections.overall.confidence, sections.advice.confidence)),
    reviewStatus: facts.precision === 'partial-without-hour-pillar' ? 'partial-input-review' : 'practical-reading-rc',
    schoolDifferenceNote: 'School differences are preserved when strength, climate, pattern, or luck rules do not point in the same direction.'
  };
}

function buildTimingReading(facts, sections) {
  return {
    longTermTheme: sections.decadeLuck.conclusion,
    annualTheme: sections.annualLuck.conclusion,
    monthlyTheme: sections.monthlyLuck.conclusion,
    supportiveAreas: unique([sections.career.tendency, sections.learning.tendency, elementPhrase(facts.primaryFavorable)]).slice(0, 3),
    cautionAreas: unique([sections.weakness.tendency, sections.health.tendency, elementPhrase(facts.avoid[0] || facts.dayMasterElement)]).slice(0, 3),
    changeWindow: 'Use a range around luck-cycle transitions rather than one exact day.',
    preparationWindow: 'When monthly signals are mixed, prepare, document, and test before announcing.',
    executionWindow: 'When decade and annual signals support the same element, move in small visible steps.',
    restWindow: 'When annual and monthly signals conflict, reduce load and protect sleep, money, and relationships.',
    schoolDifferences: [
      'Strength balancing and climate adjustment may select different helpful elements.',
      'Pattern-first schools may emphasize the chart frame before ordinary balancing.',
      'Unknown birth time lowers confidence for hour-pillar-sensitive timing.'
    ],
    confidence: round2((sections.decadeLuck.confidence + sections.annualLuck.confidence + sections.monthlyLuck.confidence) / 3)
  };
}

function buildUiModel(sections, executiveSummary, timingReading) {
  return {
    mobileFirst: true,
    firstView: [
      { label: 'Overall conclusion', value: executiveSummary.centralTheme },
      { label: 'Important theme', value: executiveSummary.currentIssue },
      { label: 'Current flow', value: executiveSummary.currentFlow },
      { label: 'Do today', value: executiveSummary.doNow },
      { label: 'Confidence', value: String(executiveSummary.confidence) }
    ],
    collapsedDetails: [
      'personality', 'talent', 'weakness', 'career', 'finance', 'love', 'family', 'health',
      'decadeLuck', 'annualLuck', 'monthlyLuck', 'importantTiming', 'evidence', 'professional'
    ],
    timingReading,
    sectionOrder: Object.keys(sections)
  };
}

function tendencyFor(id, facts) {
  const t = facts.tendencies;
  const primary = ELEMENT_WORDS[facts.primaryFavorable] || 'balance';
  const careerBase = t.career?.tendency || 'responsibility-and-learning';
  const map = {
    overall: `${facts.dayMasterName} day master with ${facts.strengthLevel} strength; ${primary} is the first practical adjustment.`,
    personality: `The default style is shaped by ${facts.dayMasterElement}, season, support, and strength balance.`,
    essence: `The native operating style is ${facts.dayMasterElement}-colored and changes with support or pressure.`,
    talent: `Talent appears when ${primary} is repeated as a habit rather than used as a one-time push.`,
    weakness: `The same strength can become overuse when timing, rest, or boundaries are ignored.`,
    career: occupationTranslation(facts.occupation, careerBase),
    finance: t.finance?.tendency || 'resource-exchange-style',
    love: t.relationship?.tendency || 'relationship-rhythm',
    marriage: 'long-term relationship works best when pace, money, role, and recovery rules are explicit',
    relationship: t.relationship?.tendency || 'relationship-rhythm',
    family: t.family?.tendency || 'support-structure',
    health: t.health?.tendency || 'lifestyle-attention',
    learning: 'learning improves when input, rest, and output are separated into small cycles',
    creation: `creative output grows when ${primary} is turned into a repeatable format`,
    decadeLuck: facts.luck.decade?.[0]?.tendency || 'long-range-condition',
    annualLuck: facts.luck.annual?.[0]?.tendency || 'annual-condition-review-required',
    monthlyLuck: facts.luck.monthly?.[0]?.tendency || 'monthly-condition-review-required',
    importantTiming: 'read decade, annual, and monthly signals together before acting',
    advice: `Bring in ${facts.primaryFavorable} through one concrete action.`
  };
  return map[id] || 'conditional-tendency';
}

function conclusionFor(id, facts, tendency, confidence) {
  const soft = confidence < 0.55 ? 'may ' : '';
  const prefix = confidence < 0.55 ? 'With limited confidence, this ' : 'This ';
  const map = {
    overall: `${prefix}chart points to ${tendency}`,
    weakness: `${prefix}caution is overusing the same tendency that usually helps you.`,
    health: `${prefix}suggests lifestyle pacing attention, not a medical conclusion.`,
    importantTiming: `${prefix}timing works best as a period range, not a single fixed date.`,
    advice: `${prefix}next step is practical: ${ELEMENT_ACTIONS[facts.primaryFavorable] || ELEMENT_ACTIONS.earth}.`
  };
  return map[id] || `${prefix}${soft}theme is ${tendency}.`;
}

function evidenceFor(id, facts, tendency) {
  return [
    `dayMaster=${facts.dayMaster.id || facts.dayMasterName}`,
    `strength=${facts.strengthLevel}`,
    `favorable=${facts.primaryFavorable}`,
    `tendency=${tendency}`,
    PROFESSIONAL_CATEGORIES.has(id) ? 'luck-overlay-required' : 'natal-context-required'
  ];
}

function opposingFactorsFor(id, facts) {
  const factors = [];
  if (facts.precision === 'partial-without-hour-pillar') factors.push('hour-pillar is unavailable, so timing and late-life signals are lower confidence');
  if (facts.avoid.length) factors.push(`unfavorable elements may pull against ${facts.primaryFavorable}: ${facts.avoid.join(', ')}`);
  if (id === 'annualLuck' || id === 'monthlyLuck') factors.push('short-term luck must not override the natal structure alone');
  if (id === 'health') factors.push('life habits, age, stress, and medical context are outside the chart');
  if (!factors.length) factors.push('opposite school readings should be checked when pattern and balancing rules disagree');
  return factors;
}

function actionFor(id, facts) {
  const base = ELEMENT_ACTIONS[facts.primaryFavorable] || ELEMENT_ACTIONS.earth;
  const occupation = facts.occupation ? ` In ${facts.occupation.label}, translate this into ${facts.occupation.focus}.` : '';
  const map = {
    career: `${base}.${occupation || ' Apply it to role clarity, communication, and repeatable work rhythm.'}`,
    finance: 'Keep decisions reversible, write the spending rule first, and review risk before expansion.',
    love: 'Name the pace, need, and boundary before expecting the other person to read it.',
    marriage: 'Make recovery routines explicit: money, time, family duties, and quiet time.',
    health: 'Use this as a lifestyle check: sleep, workload, meals, movement, and professional care when symptoms exist.',
    decadeLuck: 'Set a three-year direction, then review it yearly rather than reacting to every month.',
    annualLuck: 'Pick one yearly theme and one thing to reduce.',
    monthlyLuck: 'Use the month for pacing: prepare, act, or rest according to signal strength.',
    importantTiming: 'Prepare in mixed periods, execute in aligned periods, and rest when signals conflict.'
  };
  return map[id] || base;
}

function cautionFor(id, facts, confidence) {
  const hedge = confidence < 0.55 ? 'This may be only a partial signal, so ' : '';
  const map = {
    finance: `${hedge}avoid reading finance as certain profit.`,
    love: `${hedge}avoid testing affection through silence or pressure.`,
    health: `${hedge}do not treat this as diagnosis, prediction, or medical instruction.`,
    annualLuck: `${hedge}do not make one-year signals stronger than the natal chart.`,
    monthlyLuck: `${hedge}do not force exact-date prediction from monthly tendency.`,
    importantTiming: `${hedge}avoid one-day certainty; use a period range.`
  };
  return map[id] || `${hedge}watch for overuse, isolation, and decisions made only from one signal.`;
}

function avoidanceFor(id, facts) {
  if (id === 'health') return 'If discomfort or anxiety appears, pause the reading and use licensed support or emergency care as appropriate.';
  if (id === 'finance') return 'Set a stop line before acting and ask one trusted person to review the assumption.';
  if (id === 'love' || id === 'relationship' || id === 'marriage') return 'Return to direct language: what you need, what you can offer, and what pace is realistic.';
  if (PROFESSIONAL_CATEGORIES.has(id)) return 'Use wider timing windows and review again when new month or year data is available.';
  return `Return to ${ELEMENT_WORDS[facts.primaryFavorable] || 'balance'} through one small action, then review the result.`;
}

function timingFor(id, facts) {
  if (id === 'decadeLuck') return 'long range: decade-cycle theme, best read across several years';
  if (id === 'annualLuck') return 'medium range: yearly tendency, best read with decade support';
  if (id === 'monthlyLuck') return 'short range: monthly pacing, best used for scheduling and load control';
  if (id === 'importantTiming') return 'combined range: decade sets weather, year sets task, month sets pace';
  return facts.precision === 'partial-without-hour-pillar'
    ? 'natal tendency is available, hour-sensitive timing is limited'
    : 'natal tendency is stable; timing should be checked with luck-cycle overlays';
}

function conditionsFor(id, facts) {
  const base = ['natal-chart-context', 'school-difference-visible', 'not-fixed-fate'];
  if (facts.precision === 'partial-without-hour-pillar') base.push('hour-pillar-limited');
  if (PROFESSIONAL_CATEGORIES.has(id)) base.push('luck-cycle-context-required');
  if (id === 'health') base.push('not-medical-advice');
  if (facts.occupation) base.push('occupation-used-for-wording-only');
  return base;
}

function unresolvedFactorsFor(id, facts, confidence) {
  const items = [];
  if (confidence < 0.55) items.push('confidence-below-practical-threshold');
  if (facts.precision === 'partial-without-hour-pillar') items.push('birth-time-unknown');
  if (PROFESSIONAL_CATEGORIES.has(id)) items.push('luck-overlay-school-review');
  if (facts.patterns.length > 1) items.push('pattern-candidate-competition');
  return unique(items);
}

function professionalSummaryFor(id, facts, tendency, sourceIds, opposingFactors, unresolvedFactors) {
  const patternIds = facts.patterns.slice(0, 3).map(p => p.patternId || p.id || p.name).filter(Boolean);
  const cycle = facts.currentCycle ? `cycle-${facts.currentCycle.index}` : 'cycle-unavailable';
  return [
    `schoolIds=${facts.schoolIds.join('|')}`,
    `sourceIds=${sourceIds.join('|')}`,
    `dayMaster=${facts.dayMaster.id || facts.dayMasterName}`,
    `strength=${facts.strengthLevel}`,
    `yongshen=${facts.primaryFavorable}`,
    `patterns=${patternIds.join('|') || 'candidate-only'}`,
    `luck=${cycle}`,
    `opposing=${opposingFactors.join('|')}`,
    `unresolved=${unresolvedFactors.join('|') || 'none'}`,
    `reading=${tendency}`
  ].join('; ');
}

function confidenceFor(id, facts) {
  const base = Number(facts.confidence || 0.46);
  const precisionPenalty = facts.precision === 'partial-without-hour-pillar' ? 0.08 : 0;
  const sectionPenalty = ['annualLuck', 'monthlyLuck', 'health', 'importantTiming'].includes(id) ? 0.12 : 0;
  const bonus = ['overall', 'personality', 'essence'].includes(id) ? 0.08 : 0;
  return round2(Math.max(0.2, Math.min(0.9, base + bonus - precisionPenalty - sectionPenalty)));
}

function sourceIdsFor(id, facts) {
  const fromTendency = {
    career: facts.tendencies.career?.sourceIds,
    finance: facts.tendencies.finance?.sourceIds,
    relationship: facts.tendencies.relationship?.sourceIds,
    love: facts.tendencies.relationship?.sourceIds,
    marriage: facts.tendencies.relationship?.sourceIds,
    family: facts.tendencies.family?.sourceIds,
    health: facts.tendencies.health?.sourceIds,
    decadeLuck: facts.luck.decade?.[0]?.sourceIds,
    annualLuck: facts.luck.annual?.[0]?.sourceIds,
    monthlyLuck: facts.luck.monthly?.[0]?.sourceIds
  }[id] || [];
  const merged = [...fromTendency, ...facts.evidence].filter(Boolean);
  return [...new Set(merged.length ? merged : ['src-yuanhai-ziping-biblio'])];
}

function reviewStatusFor(id, facts, confidence) {
  if (confidence < 0.55 || ['annualLuck', 'monthlyLuck', 'health', 'importantTiming'].includes(id)) return 'human-review-required';
  if (facts.precision === 'partial-without-hour-pillar') return 'partial-input-review';
  return 'practical-reading-rc';
}

function warningsFor(id, facts) {
  const warnings = [];
  if (facts.precision === 'partial-without-hour-pillar') warnings.push('birth-time-unknown-hour-pillar-partial');
  if (id === 'health') warnings.push('not-medical-advice');
  if (['annualLuck', 'monthlyLuck', 'importantTiming'].includes(id)) warnings.push('luck-interpretation-review-required');
  if (facts.occupation) warnings.push('occupation-used-for-wording-only');
  return unique(warnings);
}

function beginnerBlock(section) {
  return {
    id: section.id,
    title: section.title,
    text: section.beginnerSummary,
    conclusion: section.conclusion,
    action: section.action,
    caution: section.caution,
    avoidance: section.avoidance,
    confidence: section.confidence,
    warnings: section.warnings
  };
}

function professionalBlock(section, facts) {
  return {
    id: section.id,
    title: section.title,
    text: section.professionalSummary,
    conclusion: section.conclusion,
    evidence: section.evidence,
    opposingFactors: section.opposingFactors,
    sourceIds: section.sourceIds,
    schoolIds: section.schoolIds,
    reviewStatus: section.reviewStatus,
    confidence: section.confidence,
    conditions: section.conditions,
    unresolvedFactors: section.unresolvedFactors,
    sourceSeparation: {
      originalTextStored: false,
      summaryStored: true,
      modernInterpretationStored: true,
      aiGeneratedProseStoredAsSource: false
    },
    validation: facts.validation || null
  };
}

function renderReadingText(sections, mode, executiveSummary, timingReading) {
  const lines = [
    '[Overall Conclusion]',
    executiveSummary.centralTheme,
    `Strength: ${executiveSummary.strength}`,
    `Current flow: ${executiveSummary.currentFlow}`,
    `Do now: ${executiveSummary.doNow}`,
    `Avoid: ${executiveSummary.avoid}`,
    `Confidence: ${executiveSummary.confidence}`,
    '',
    '[Integrated Timing]',
    `Long term: ${timingReading.longTermTheme}`,
    `This year: ${timingReading.annualTheme}`,
    `This month: ${timingReading.monthlyTheme}`,
    `School differences: ${timingReading.schoolDifferences.join(' / ')}`,
    ''
  ];
  for (const [id, title] of CATEGORY_DEFS) {
    const section = sections[id];
    lines.push(`[${title}]`);
    lines.push(mode === 'professional' ? section.professionalSummary : section.beginnerSummary);
    lines.push(`Action: ${section.action}`);
    lines.push(`Caution: ${section.caution}`);
    lines.push(`Avoidance: ${section.avoidance}`);
    lines.push(`Confidence: ${section.confidence}; reviewStatus: ${section.reviewStatus}`);
    if (section.warnings.length) lines.push(`Warnings: ${section.warnings.join(', ')}`);
    if (mode === 'professional') lines.push(`sourceIds: ${section.sourceIds.join(', ')}; schoolIds: ${section.schoolIds.join(', ')}`);
    lines.push('');
  }
  return dedupeAdjacent(lines).join('\n').trim();
}

function buildReadingMitsunomeInput(facts, sections, beginner, professional, executiveSummary, timingReading, options) {
  const normalText = [
    `まず結論ね。${executiveSummary.centralTheme}`,
    `今やることはこれよ: ${executiveSummary.doNow}`,
    `注意点もあるわ。${sections.weakness.caution}`,
    `でも逃げ道はあるの。${sections.weakness.avoidance}`
  ].join(' ');
  const zubatText = [
    `結論: ${executiveSummary.centralTheme}`,
    `やること: ${executiveSummary.doNow}`,
    `避けること: ${executiveSummary.avoid}`
  ].join(' ');
  return {
    schemaId: 'mitsunome-bazi-reading-input',
    version: '1.1.0',
    audience: options.audience || 'both',
    personContext: {
      personId: facts.personId,
      name: facts.name,
      precision: facts.precision,
      occupation: facts.occupation?.label || ''
    },
    executiveSummary,
    timingReading,
    glossary: GLOSSARY,
    readingSections: sections,
    beginner,
    professional,
    voiceDrafts: {
      normal: {
        style: 'warm-clear-natural',
        text: normalText,
        guardrails: ['no-fear', 'no-absolute', 'explain-jargon', 'offer-recovery-path']
      },
      zubat: {
        style: 'direct-caring-short',
        text: zubatText,
        escapeRoute: sections.weakness.avoidance,
        guardrails: ['no-personality-denial', 'no-health-certainty', 'no-death-accident-pregnancy-prediction']
      }
    },
    sourcePolicy: {
      aiGeneratedTextIsNotSource: true,
      calculationAlreadyCompleted: true,
      noNewCalculationByAi: true,
      preserveSchoolDifferences: true,
      keepReviewStatus: true
    }
  };
}

function inspectReadingQuality(sections, beginnerText, professionalText) {
  const allText = `${beginnerText}\n${professionalText}`;
  const banned = ['guaranteed', 'always ', 'never ', 'diagnose', 'death', 'pregnancy', 'fatal'];
  return {
    duplicateLineCount: countDuplicateLines(allText),
    emptySectionIds: Object.values(sections).filter(section => !section.conclusion || !section.action).map(section => section.id),
    bannedExpressionHits: banned.filter(word => allText.toLowerCase().includes(word)),
    allSectionsHaveEvidence: Object.values(sections).every(section => section.sourceIds.length && section.evidence.length),
    lowConfidenceSections: Object.values(sections).filter(section => section.confidence < 0.55).map(section => section.id)
  };
}

function buildCurrentFlow(facts) {
  const cycle = facts.currentCycle?.text || facts.currentCycle?.pillar?.text || 'current decade luck';
  return `${cycle} sets the long weather; annual and monthly signals should be used for pacing, not fate.`;
}

function occupationTranslation(occupation, fallback) {
  if (!occupation) return fallback;
  return `${fallback}; for ${occupation.label}, emphasize ${occupation.focus}`;
}

function normalizeOccupation(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  if (/(fire|rescue|ems|emergency|paramedic)/.test(text)) return { label: 'emergency work', focus: 'field judgement, risk avoidance, team communication, and fatigue control' };
  if (/(manager|management|leader|executive)/.test(text)) return { label: 'management', focus: 'decision rhythm, responsibility, negotiation, and staff care' };
  if (/(student|school|university)/.test(text)) return { label: 'student life', focus: 'study method, test pacing, concentration, and career direction' };
  if (/(engineer|developer|technical|craft|design)/.test(text)) return { label: 'technical work', focus: 'precision, improvement, deep focus, and specialty building' };
  if (/(sales|service|retail|hospitality|customer)/.test(text)) return { label: 'service work', focus: 'response timing, language, trust, and emotional pacing' };
  return { label: value, focus: 'daily role, responsibility, communication, and recovery rhythm' };
}

function elementPhrase(element) {
  return ELEMENT_WORDS[normalizeElement(element)] || 'balanced use of the chart';
}

function normalizeElement(value) {
  const text = String(value || '').toLowerCase();
  if (['wood', 'fire', 'earth', 'metal', 'water'].includes(text)) return text;
  const map = { mok: 'wood', ka: 'fire', do: 'earth', kin: 'metal', sui: 'water' };
  return map[text] || '';
}

function isStrong(facts) {
  return /strong|excess|旺|身強/i.test(String(facts.strengthLevel));
}

function isWeak(facts) {
  return /weak|deficient|衰|身弱/i.test(String(facts.strengthLevel));
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.46;
  return Math.max(0.1, Math.min(0.95, number));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeAdjacent(lines) {
  const out = [];
  for (const line of lines) {
    if (line && line === out[out.length - 1]) continue;
    out.push(line);
  }
  return out;
}

function countDuplicateLines(text) {
  const seen = new Set();
  let duplicates = 0;
  for (const line of text.split(/\n+/).map(x => x.trim()).filter(Boolean)) {
    if (seen.has(line)) duplicates += 1;
    seen.add(line);
  }
  return duplicates;
}

function usesSoftLanguage(text) {
  return /\bmay\b|\bpartial\b|\blimited\b|\bconditional\b|\breview\b|\btendency\b/i.test(text);
}
