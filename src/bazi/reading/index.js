const READING_VERSION = 'bazi-japanese-reading-20260717';

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
  const locale = resolveLocale(options);
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
  const reading = {
    schemaId: 'koyomi-bazi-reading',
    version: READING_VERSION,
    locale: 'en',
    sourceCalculationVersion: baziResult?.calculationVersion || null,
    sourceIntegratedDataVersion: options.integratedData?.version || baziResult?.integratedReadingData?.version || null,
    personId: facts.personId,
    executiveSummary,
    timingReading,
    glossary: GLOSSARY,
    uiLabels: buildReadingUiLabels('en'),
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
  return locale === 'ja' ? localizeBaziReadingJa(reading, facts, options) : reading;
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

function resolveLocale(options = {}) {
  const requested = String(options.locale || options.language || '').toLowerCase();
  if (requested.startsWith('en')) return 'en';
  return 'ja';
}

function buildReadingUiLabels(locale) {
  if (locale === 'en') {
    return {
      conclusion: 'Conclusion',
      evidence: 'Evidence',
      opposingFactors: 'Opposing factors',
      timing: 'Timing',
      action: 'Action',
      caution: 'Caution',
      avoidance: 'Recovery path',
      confidence: 'confidence',
      review: 'review',
      sources: 'Sources',
      schoolDifferences: 'School differences',
      expert: 'Evidence and expert view'
    };
  }
  return {
    conclusion: '\u7dcf\u5408\u7d50\u8ad6',
    evidence: '\u6839\u62e0',
    opposingFactors: '\u53cd\u5bfe\u8981\u56e0',
    timing: '\u6642\u671f',
    action: '\u884c\u52d5\u63d0\u6848',
    caution: '\u6ce8\u610f\u70b9',
    avoidance: '\u56de\u907f\u7b56',
    confidence: '\u78ba\u5ea6',
    review: '\u30ec\u30d3\u30e5\u30fc',
    sources: '\u51fa\u5178ID',
    schoolDifferences: '\u6d41\u6d3e\u5dee',
    expert: '\u6839\u62e0\u30fb\u5c02\u9580\u5bb6\u8868\u793a'
  };
}

const JA_TITLES = {
  overall: '\u7dcf\u5408\u9451\u5b9a',
  personality: '\u672c\u8cea\u30fb\u6027\u683c',
  essence: '\u672c\u8cea',
  talent: '\u624d\u80fd',
  weakness: '\u5f31\u70b9\u30fb\u6ce8\u610f\u70b9',
  career: '\u4ed5\u4e8b',
  finance: '\u8ca1\u904b',
  love: '\u604b\u611b',
  marriage: '\u7d50\u5a5a',
  relationship: '\u5bfe\u4eba\u95a2\u4fc2',
  family: '\u5bb6\u5ead',
  health: '\u5065\u5eb7\u50be\u5411',
  learning: '\u5b66\u7fd2',
  creation: '\u5275\u4f5c',
  decadeLuck: '\u5927\u904b',
  annualLuck: '\u6b73\u904b',
  monthlyLuck: '\u6708\u904b',
  importantTiming: '\u91cd\u8981\u6642\u671f',
  advice: '\u958b\u904b\u30a2\u30c9\u30d0\u30a4\u30b9'
};

const JA_ELEMENTS = {
  wood: '\u6728',
  fire: '\u706b',
  earth: '\u571f',
  metal: '\u91d1',
  water: '\u6c34'
};

const JA_STEMS = {
  jia: '\u7532',
  yi: '\u4e59',
  bing: '\u4e19',
  ding: '\u4e01',
  wu: '\u620a',
  ji: '\u5df1',
  geng: '\u5e9a',
  xin: '\u8f9b',
  ren: '\u58ec',
  gui: '\u7678'
};

const JA_ELEMENT_WORDS = {
  wood: '\u6210\u9577\u30fb\u8a08\u753b\u30fb\u767a\u5c55',
  fire: '\u8868\u73fe\u30fb\u660e\u308b\u3055\u30fb\u767a\u4fe1',
  earth: '\u5b89\u5b9a\u30fb\u751f\u6d3b\u57fa\u76e4\u30fb\u4fe1\u983c',
  metal: '\u6574\u7406\u30fb\u5224\u65ad\u30fb\u5883\u754c\u7dda',
  water: '\u5b66\u3073\u30fb\u56de\u5fa9\u30fb\u60c5\u5831\u53ce\u96c6'
};

function localizeBaziReadingJa(reading, facts, options = {}) {
  const sections = Object.fromEntries(Object.entries(reading.sections).map(([id, section]) => [
    id,
    localizeSectionJa(section, facts)
  ]));
  const executiveSummary = buildExecutiveSummaryJa(facts, sections);
  const timingReading = buildTimingReadingJa(facts, sections, reading.timingReading);
  const beginner = Object.values(sections).map(beginnerBlock);
  const professional = Object.values(sections).map(section => ({
    id: section.id,
    title: section.title,
    text: section.professionalSummary,
    sourceIds: section.sourceIds,
    schoolIds: section.schoolIds,
    confidence: section.confidence,
    reviewStatus: section.reviewStatus
  }));
  const beginnerText = renderReadingTextJa(sections, 'beginner', executiveSummary, timingReading);
  const professionalText = renderReadingTextJa(sections, 'professional', executiveSummary, timingReading);
  const mitsunomeInput = buildMitsunomeInputJa(facts, sections, beginnerText, professionalText, executiveSummary, timingReading, options);
  return {
    ...reading,
    locale: 'ja',
    executiveSummary,
    timingReading,
    glossary: buildGlossaryJa(),
    uiLabels: buildReadingUiLabels('ja'),
    uiModel: buildUiModelJa(sections, executiveSummary, timingReading),
    sections,
    beginner,
    professional,
    text: beginnerText,
    beginnerText,
    professionalText,
    mitsunomeInput,
    mitsunome: mitsunomeInput.voiceDrafts,
    quality: {
      ...reading.quality,
      englishDisplayHits: findEnglishDisplayHits(beginnerText + '\n' + professionalText + '\n' + mitsunomeInput.voiceDrafts.normal.text + '\n' + mitsunomeInput.voiceDrafts.zubat.text)
    }
  };
}

function localizeSectionJa(section, facts) {
  const confidence = section.confidence || 0;
  const title = JA_TITLES[section.id] || section.title;
  const tendency = tendencyJa(section.id, facts);
  const conclusion = conclusionJa(section.id, facts, tendency, confidence);
  const action = actionJa(section.id, facts);
  const caution = cautionJa(section.id, facts, confidence);
  const avoidance = avoidanceJa(section.id, facts);
  const evidence = evidenceJa(section, facts, tendency);
  const opposingFactors = opposingJa(section, facts);
  const timing = timingJa(section.id, facts);
  const publicDisplay = buildPublicSectionDisplayJa(section.id, facts, {
    conclusion,
    evidenceSummary: publicEvidenceJa(section.id, facts),
    opposingFactors,
    timing,
    recommendation: action,
    caution,
    mitigation: avoidance,
    confidence
  });
  const beginnerSummary = [
    `\u8981\u70b9\uff1a${publicDisplay.conclusion}`,
    `\u6839\u62e0\uff1a${publicDisplay.evidenceSummary}`,
    `\u884c\u52d5\uff1a${publicDisplay.recommendation}`,
    `\u6ce8\u610f\uff1a${publicDisplay.caution}`,
    `\u56de\u907f\u7b56\uff1a${publicDisplay.mitigation}`
  ].join(' ');
  const professionalSummary = [
    `\u63a1\u7528\u6d41\u6d3eID=${section.schoolIds.join('|')}`,
    `\u51fa\u5178ID=${section.sourceIds.join('|')}`,
    `\u65e5\u4e3b=${facts.dayMaster.id || facts.dayMasterName}`,
    `\u65fa\u8870=${strengthLabelJa(facts.strengthLevel)}`,
    `\u7528\u795e\u5019\u88dc=${elementJa(facts.primaryFavorable)}`,
    `\u5224\u65ad=${tendency}`,
    `\u53cd\u5bfe\u8981\u56e0=${opposingFactors.join('|')}`,
    `\u672a\u89e3\u6c7a=${section.unresolvedFactors.join('|') || 'none'}`,
    `reviewStatus=${section.reviewStatus}`
  ].join('; ');
  return {
    ...section,
    title,
    tendency,
    conclusion,
    evidence,
    publicEvidence: publicDisplay.evidenceSummary,
    evidenceSummary: publicDisplay.evidenceSummary,
    opposingFactors,
    timing,
    action,
    recommendation: publicDisplay.recommendation,
    caution,
    avoidance,
    mitigation: publicDisplay.mitigation,
    publicDisplay,
    beginnerSummary,
    professionalSummary
  };
}

function buildExecutiveSummaryJa(facts, sections) {
  const element = elementWordsJa(facts.primaryFavorable);
  const dayMaster = dayMasterLabelJa(facts);
  const strength = isStrong(facts)
    ? '\u81ea\u5206\u306e\u610f\u5fd7\u3084\u884c\u52d5\u529b\u304c\u524d\u306b\u51fa\u3084\u3059\u3044\u50be\u5411\u3067\u3059\u3002'
    : isWeak(facts)
      ? '\u74b0\u5883\u3084\u5468\u56f2\u306e\u652f\u3048\u3092\u53d7\u3051\u308b\u307b\u3069\u529b\u3092\u767a\u63ee\u3057\u3084\u3059\u3044\u50be\u5411\u3067\u3059\u3002'
      : '\u4e00\u3064\u306e\u5f37\u5f31\u3060\u3051\u3067\u65ad\u5b9a\u305b\u305a\u3001\u72b6\u6cc1\u3054\u3068\u306e\u30d0\u30e9\u30f3\u30b9\u3092\u898b\u308b\u5fc5\u8981\u304c\u3042\u308a\u307e\u3059\u3002';
  return {
    centralTheme: `${dayMaster}\u306e\u65e5\u4e3b\u304c\u6301\u3064\u50be\u5411\u3092\u3001${element}\u306b\u3088\u3063\u3066\u7740\u5b9f\u306a\u6210\u679c\u3078\u3064\u306a\u3052\u308b\u6642\u671f\u3067\u3059\u3002`,
    strength,
    currentIssue: sections.weakness?.conclusion || sections.overall.conclusion,
    currentFlow: '\u73fe\u5728\u306e\u5927\u904b\u304c\u9577\u671f\u7684\u306a\u6d41\u308c\u3092\u4f5c\u308a\u3001\u6b73\u904b\u3068\u6708\u904b\u304c\u884c\u52d5\u306e\u5f37\u5f31\u3092\u8abf\u6574\u3057\u3066\u3044\u307e\u3059\u3002\u65ad\u5b9a\u3067\u306f\u306a\u304f\u3001\u52d5\u304f\u6642\u671f\u3092\u898b\u6975\u3081\u308b\u6750\u6599\u3068\u3057\u3066\u4f7f\u3063\u3066\u304f\u3060\u3055\u3044\u3002',
    doNow: sections.advice.action,
    avoid: sections.weakness.avoidance,
    confidence: round2(Math.min(sections.overall.confidence, sections.advice.confidence)),
    reviewStatus: facts.precision === 'partial-without-hour-pillar' ? 'partial-input-review' : 'practical-reading-rc',
    schoolDifferenceNote: '\u65fa\u8870\u3001\u8abf\u5019\u3001\u683c\u5c40\u3001\u5927\u904b\u306e\u898b\u65b9\u304c\u4e00\u81f4\u3057\u306a\u3044\u5834\u5408\u306f\u3001\u6d41\u6d3e\u5dee\u3068\u3057\u3066\u8868\u793a\u3057\u307e\u3059\u3002'
  };
}

function buildTimingReadingJa(facts, sections, originalTiming) {
  return {
    longTermTheme: sections.decadeLuck.conclusion,
    annualTheme: sections.annualLuck.conclusion,
    monthlyTheme: sections.monthlyLuck.conclusion,
    supportiveAreas: unique([sections.career.tendency, sections.learning.tendency, elementWordsJa(facts.primaryFavorable)]).slice(0, 3),
    cautionAreas: unique([sections.weakness.tendency, sections.health.tendency, elementWordsJa(facts.avoid[0] || facts.dayMasterElement)]).slice(0, 3),
    changeWindow: '\u5927\u904b\u306e\u5207\u308a\u66ff\u308f\u308a\u306f\u4e00\u65e5\u3067\u65ad\u5b9a\u305b\u305a\u3001\u524d\u5f8c\u306e\u671f\u9593\u5e45\u3067\u5909\u5316\u3092\u898b\u307e\u3059\u3002',
    preparationWindow: '\u6708\u904b\u304c\u6df7\u3058\u308b\u6642\u671f\u306f\u3001\u767a\u8868\u3084\u6c7a\u65ad\u3088\u308a\u6e96\u5099\u3001\u8a18\u9332\u3001\u78ba\u8a8d\u306b\u5411\u304d\u307e\u3059\u3002',
    executionWindow: '\u5927\u904b\u3068\u6b73\u904b\u304c\u540c\u3058\u65b9\u5411\u3092\u793a\u3059\u6642\u671f\u306f\u3001\u5c0f\u3055\u3044\u5b9f\u884c\u3092\u91cd\u306d\u3066\u7d50\u679c\u3092\u898b\u307e\u3059\u3002',
    restWindow: '\u6b73\u904b\u3068\u6708\u904b\u304c\u3076\u3064\u304b\u308b\u6642\u671f\u306f\u3001\u8ca0\u8377\u3092\u6e1b\u3089\u3057\u3001\u7761\u7720\u3001\u5bb6\u8a08\u3001\u4eba\u9593\u95a2\u4fc2\u3092\u5b88\u308b\u3053\u3068\u3092\u512a\u5148\u3057\u307e\u3059\u3002',
    schoolDifferences: [
      '\u6276\u6291\u3068\u8abf\u5019\u3067\u7528\u795e\u304c\u5206\u304b\u308c\u308b\u5834\u5408\u304c\u3042\u308a\u307e\u3059\u3002',
      '\u683c\u5c40\u3092\u91cd\u8996\u3059\u308b\u6d41\u6d3e\u3067\u306f\u3001\u901a\u5e38\u306e\u65fa\u8870\u5224\u65ad\u3088\u308a\u547d\u5f0f\u5168\u4f53\u306e\u67a0\u7d44\u307f\u3092\u512a\u5148\u3059\u308b\u3053\u3068\u304c\u3042\u308a\u307e\u3059\u3002',
      facts.precision === 'partial-without-hour-pillar' ? '\u51fa\u751f\u6642\u523b\u304c\u4e0d\u660e\u306a\u305f\u3081\u3001\u6642\u67f1\u306b\u95a2\u308f\u308b\u5224\u65ad\u306e\u78ba\u5ea6\u306f\u4e0b\u304c\u308a\u307e\u3059\u3002' : '\u51fa\u751f\u6642\u523b\u304c\u3042\u308b\u305f\u3081\u3001\u6642\u67f1\u3092\u542b\u3081\u305f\u691c\u8a0e\u304c\u53ef\u80fd\u3067\u3059\u3002'
    ],
    confidence: originalTiming?.confidence || round2((sections.decadeLuck.confidence + sections.annualLuck.confidence + sections.monthlyLuck.confidence) / 3)
  };
}

function buildUiModelJa(sections, executiveSummary, timingReading) {
  return {
    mobileFirst: true,
    firstView: [
      { label: '\u7dcf\u5408\u7d50\u8ad6', value: executiveSummary.centralTheme },
      { label: '\u4eca\u306e\u91cd\u8981\u30c6\u30fc\u30de', value: executiveSummary.currentIssue },
      { label: '\u73fe\u5728\u306e\u904b', value: executiveSummary.currentFlow },
      { label: '\u4eca\u65e5\u304b\u3089\u3067\u304d\u308b\u3053\u3068', value: executiveSummary.doNow },
      { label: '\u78ba\u5ea6', value: String(executiveSummary.confidence) }
    ],
    collapsedDetails: [...Object.keys(sections), 'professional'],
    timingReading,
    sectionOrder: Object.keys(sections)
  };
}

function buildGlossaryJa() {
  return {
    strongDayMaster: { term: '\u8eab\u5f37', beginner: '\u81ea\u5206\u306e\u610f\u5fd7\u3084\u529b\u3092\u62bc\u3057\u51fa\u3057\u3084\u3059\u3044\u50be\u5411', professional: '\u6708\u4ee4\u3001\u6839\u3001\u5e72\u5408\u3001\u751f\u6276\u306a\u3069\u306b\u3088\u308a\u65e5\u4e3b\u306e\u652f\u3048\u304c\u5f37\u3044\u898b\u65b9\u3002\u6d41\u6d3e\u5dee\u306f\u4fdd\u6301\u3057\u307e\u3059\u3002' },
    weakDayMaster: { term: '\u8eab\u5f31', beginner: '\u74b0\u5883\u3084\u5468\u56f2\u306e\u652f\u63f4\u3092\u53d7\u3051\u3066\u529b\u3092\u767a\u63ee\u3057\u3084\u3059\u3044\u50be\u5411', professional: '\u6708\u4ee4\u3001\u6839\u3001\u6f0f\u308c\u3001\u5236\u5316\u306a\u3069\u306b\u3088\u308a\u65e5\u4e3b\u306e\u652f\u3048\u304c\u9650\u5b9a\u3055\u308c\u308b\u898b\u65b9\u3002' },
    yongshen: { term: '\u7528\u795e', beginner: '\u547d\u5f0f\u306e\u504f\u308a\u3092\u6574\u3048\u308b\u9375', professional: '\u6276\u6291\u3001\u8abf\u5019\u3001\u683c\u5c40\u3001\u75c5\u85ac\u3001\u6d41\u6d3e\u5225\u30eb\u30fc\u30eb\u3067\u691c\u8a0e\u3057\u307e\u3059\u3002' },
    climate: { term: '\u8abf\u5019', beginner: '\u5bd2\u6696\u30fb\u4e7e\u6e7f\u306e\u504f\u308a\u3092\u6574\u3048\u308b\u8996\u70b9', professional: '\u5358\u7d14\u306a\u65fa\u8870\u5224\u65ad\u3068\u7570\u306a\u308b\u5834\u5408\u304c\u3042\u308a\u307e\u3059\u3002' },
    pattern: { term: '\u683c\u5c40', beginner: '\u547d\u5f0f\u5168\u4f53\u306e\u50cd\u304d\u65b9\u3092\u6349\u3048\u308b\u67a0\u7d44\u307f', professional: '\u6708\u4ee4\u3001\u900f\u5e72\u3001\u6839\u3001\u5316\u683c\u3001\u6551\u5fdc\u6761\u4ef6\u3092\u78ba\u8a8d\u3057\u3066\u5019\u88dc\u5316\u3057\u307e\u3059\u3002' },
    luckCycle: { term: '\u5927\u904b\u30fb\u6b73\u904b\u30fb\u6708\u904b', beginner: '\u751f\u307e\u308c\u6301\u3063\u305f\u50be\u5411\u306b\u91cd\u306a\u308b\u6642\u671f\u306e\u6d41\u308c', professional: '\u5927\u904b\u3001\u6b73\u904b\u3001\u6708\u904b\u3092\u547d\u5f0f\u6839\u62e0\u3068\u91cd\u306d\u3001\u78ba\u5ea6\u3068\u6d41\u6d3e\u5dee\u3092\u8868\u793a\u3057\u307e\u3059\u3002' }
  };
}

function tendencyJa(id, facts) {
  const primary = elementWordsJa(facts.primaryFavorable);
  const occupation = occupationFocusJa(facts.occupation);
  const dayMaster = dayMasterLabelJa(facts);
  const map = {
    overall: `${dayMaster}\u306e\u65e5\u4e3b\u3068${strengthLabelJa(facts.strengthLevel)}\u3092\u3001${primary}\u3067\u6574\u3048\u308b\u50be\u5411`,
    personality: `${elementJa(facts.dayMasterElement)}\u306e\u6027\u8cea\u3068\u5b63\u7bc0\u611f\u304c\u8868\u306b\u51fa\u3084\u3059\u3044\u50be\u5411`,
    essence: `${elementJa(facts.dayMasterElement)}\u3089\u3057\u3044\u52d5\u304d\u65b9\u304c\u3001\u652f\u3048\u3084\u5727\u529b\u3067\u5909\u5316\u3059\u308b\u50be\u5411`,
    talent: `${primary}\u3092\u7fd2\u6163\u3068\u3057\u3066\u4f7f\u3046\u3068\u624d\u80fd\u304c\u73fe\u308c\u3084\u3059\u3044\u50be\u5411`,
    weakness: '\u9577\u6240\u304c\u4f7f\u3044\u904e\u304e\u306b\u306a\u308b\u3068\u3001\u75b2\u52b4\u3084\u5bfe\u4eba\u306e\u6469\u64e6\u306b\u3064\u306a\u304c\u308b\u50be\u5411',
    career: occupation || '\u8cac\u4efb\u3001\u5b66\u7fd2\u3001\u5f79\u5272\u8abf\u6574\u3092\u6574\u3048\u308b\u50be\u5411',
    finance: '\u8cc7\u6e90\u306e\u6d41\u308c\u3068\u30ea\u30b9\u30af\u7ba1\u7406\u304c\u91cd\u8981\u306b\u306a\u308b\u50be\u5411',
    love: '\u8868\u73fe\u3001\u652f\u3048\u5408\u3044\u3001\u8ddd\u96e2\u611f\u306e\u30ea\u30ba\u30e0\u304c\u5927\u5207\u306b\u306a\u308b\u50be\u5411',
    marriage: '\u5f79\u5272\u3001\u5bb6\u8a08\u3001\u56de\u5fa9\u6642\u9593\u3092\u660e\u78ba\u306b\u3059\u308b\u3068\u5b89\u5b9a\u3057\u3084\u3059\u3044\u50be\u5411',
    relationship: '\u5bfe\u4eba\u306e\u8abf\u548c\u3068\u81ea\u5206\u306e\u5883\u754c\u7dda\u306e\u4e21\u7acb\u304c\u8ab2\u984c\u306b\u306a\u308b\u50be\u5411',
    family: '\u6839\u3068\u652f\u3048\u306e\u69cb\u9020\u3092\u6574\u3048\u308b\u3068\u5bb6\u5ead\u304c\u5b89\u5b9a\u3057\u3084\u3059\u3044\u50be\u5411',
    health: '\u751f\u6d3b\u30ea\u30ba\u30e0\u306e\u6574\u3048\u65b9\u306b\u6ce8\u610f\u304c\u5fc5\u8981\u306a\u50be\u5411',
    learning: '\u5165\u529b\u3001\u4f11\u606f\u3001\u51fa\u529b\u3092\u5c0f\u3055\u304f\u5206\u3051\u308b\u3068\u5b66\u3073\u304c\u9032\u3080\u50be\u5411',
    creation: `${primary}\u3092\u7e70\u308a\u8fd4\u305b\u308b\u5f62\u306b\u3059\u308b\u3068\u5275\u4f5c\u304c\u5e83\u304c\u308b\u50be\u5411`,
    decadeLuck: '\u9577\u671f\u306e\u74b0\u5883\u6761\u4ef6\u304c\u4eba\u751f\u306e\u5927\u304d\u306a\u30c6\u30fc\u30de\u3092\u4f5c\u308b\u50be\u5411',
    annualLuck: '\u4eca\u5e74\u306e\u6761\u4ef6\u304c\u3001\u884c\u52d5\u306e\u5f37\u5f31\u3092\u8abf\u6574\u3059\u308b\u50be\u5411',
    monthlyLuck: '\u4eca\u6708\u306e\u6761\u4ef6\u304c\u3001\u6e96\u5099\u30fb\u5b9f\u884c\u30fb\u4f11\u606f\u306e\u914d\u5206\u3092\u793a\u3059\u50be\u5411',
    importantTiming: '\u5927\u904b\u3001\u6b73\u904b\u3001\u6708\u904b\u3092\u91cd\u306d\u3066\u884c\u52d5\u6642\u671f\u3092\u898b\u308b\u50be\u5411',
    advice: `${elementJa(facts.primaryFavorable)}\u3092\u65e5\u3005\u306e\u5c0f\u3055\u306a\u884c\u52d5\u306b\u843d\u3068\u3057\u8fbc\u3080\u50be\u5411`
  };
  return map[id] || '\u6761\u4ef6\u3064\u304d\u3067\u8868\u308c\u308b\u50be\u5411';
}

function conclusionJa(id, facts, tendency, confidence) {
  const prefix = confidence < 0.55 ? '\u78ba\u5ea6\u306f\u9650\u5b9a\u7684\u3067\u3059\u304c\u3001' : '';
  const map = {
    overall: `${prefix}\u547d\u5f0f\u5168\u4f53\u306f\u3001${tendency}\u3092\u793a\u3057\u3066\u3044\u307e\u3059\u3002`,
    weakness: `${prefix}\u901a\u5e38\u306f\u9577\u6240\u3068\u306a\u308b\u529b\u3092\u4f7f\u3044\u904e\u304e\u308b\u3053\u3068\u304c\u6ce8\u610f\u70b9\u3067\u3059\u3002`,
    health: `${prefix}\u751f\u6d3b\u30da\u30fc\u30b9\u306e\u50be\u5411\u3092\u793a\u3059\u3082\u306e\u3067\u3001\u533b\u5b66\u7684\u306a\u8a3a\u65ad\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
    importantTiming: `${prefix}\u6642\u671f\u306f\u7279\u5b9a\u65e5\u306e\u65ad\u5b9a\u3067\u306f\u306a\u304f\u3001\u671f\u9593\u306e\u5e45\u3068\u3057\u3066\u898b\u308b\u306e\u304c\u73fe\u5b9f\u7684\u3067\u3059\u3002`,
    advice: `${prefix}\u4eca\u306f\u3001${actionJa('advice', facts)}\u3053\u3068\u304c\u5b9f\u7528\u7684\u306a\u4e00\u6b69\u3067\u3059\u3002`
  };
  return map[id] || `${prefix}${tendency}\u304c\u4e3b\u306a\u30c6\u30fc\u30de\u3067\u3059\u3002`;
}

function actionJa(id, facts) {
  const base = actionByElementJa(facts.primaryFavorable);
  const occupation = occupationFocusJa(facts.occupation);
  const map = {
    career: occupation ? `${base}\u3002\u4ed5\u4e8b\u3067\u306f${occupation}\u306b\u843d\u3068\u3057\u8fbc\u3093\u3067\u304f\u3060\u3055\u3044\u3002` : `${base}\u3002\u5f79\u5272\u3001\u9023\u7d61\u3001\u7e70\u308a\u8fd4\u305b\u308b\u4ed5\u4e8b\u306e\u30ea\u30ba\u30e0\u306b\u843d\u3068\u3057\u8fbc\u3093\u3067\u304f\u3060\u3055\u3044\u3002`,
    finance: '\u652f\u51fa\u306e\u30eb\u30fc\u30eb\u3092\u5148\u306b\u66f8\u304d\u3001\u5e83\u3052\u308b\u524d\u306b\u30ea\u30b9\u30af\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    love: '\u76f8\u624b\u306b\u5bdf\u3057\u3066\u3082\u3089\u3046\u524d\u306b\u3001\u671b\u3080\u8ddd\u96e2\u3001\u30da\u30fc\u30b9\u3001\u5883\u754c\u7dda\u3092\u8a00\u8449\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    marriage: '\u5bb6\u8a08\u3001\u6642\u9593\u3001\u5bb6\u65cf\u5185\u306e\u5f79\u5272\u3001\u4f11\u3080\u6642\u9593\u3092\u660e\u78ba\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    health: '\u7761\u7720\u3001\u4ed5\u4e8b\u91cf\u3001\u98df\u4e8b\u3001\u904b\u52d5\u3001\u5fc5\u8981\u306a\u3068\u304d\u306e\u5c02\u9580\u5bb6\u3078\u306e\u76f8\u8ac7\u3092\u751f\u6d3b\u70b9\u691c\u3068\u3057\u3066\u6271\u3063\u3066\u304f\u3060\u3055\u3044\u3002',
    decadeLuck: '\u4e09\u5e74\u7a0b\u5ea6\u306e\u65b9\u5411\u3092\u7acb\u3066\u3001\u5e74\u3054\u3068\u306b\u898b\u76f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    annualLuck: '\u4eca\u5e74\u306e\u30c6\u30fc\u30de\u3092\u4e00\u3064\u9078\u3073\u3001\u540c\u6642\u306b\u6e1b\u3089\u3059\u3053\u3068\u3082\u4e00\u3064\u6c7a\u3081\u3066\u304f\u3060\u3055\u3044\u3002',
    monthlyLuck: '\u4eca\u6708\u306f\u6e96\u5099\u3001\u5b9f\u884c\u3001\u4f11\u606f\u306e\u3069\u308c\u306b\u91cd\u5fc3\u3092\u7f6e\u304f\u304b\u6c7a\u3081\u3066\u304f\u3060\u3055\u3044\u3002',
    importantTiming: '\u6df7\u3058\u308b\u6642\u671f\u306f\u6e96\u5099\u3001\u63c3\u3046\u6642\u671f\u306f\u5b9f\u884c\u3001\u3076\u3064\u304b\u308b\u6642\u671f\u306f\u4f11\u606f\u306b\u5bc4\u305b\u3066\u304f\u3060\u3055\u3044\u3002'
  };
  return map[id] || base;
}

function cautionJa(id, facts, confidence) {
  const hedge = confidence < 0.55 ? '\u78ba\u5ea6\u304c\u9650\u5b9a\u7684\u306a\u305f\u3081\u3001' : '';
  const map = {
    finance: `${hedge}\u8ca1\u904b\u3092\u78ba\u5b9a\u7684\u306a\u5229\u76ca\u3068\u3057\u3066\u8aad\u307e\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002`,
    love: `${hedge}\u6c88\u9ed9\u3084\u30d7\u30ec\u30c3\u30b7\u30e3\u30fc\u3067\u611b\u60c5\u3092\u8a66\u3055\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002`,
    health: `${hedge}\u3053\u308c\u3092\u8a3a\u65ad\u3001\u75c5\u6c17\u306e\u4e88\u6e2c\u3001\u533b\u7642\u6307\u793a\u3068\u3057\u3066\u6271\u308f\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002`,
    annualLuck: `${hedge}\u4e00\u5e74\u306e\u30b5\u30a4\u30f3\u3092\u547d\u5f0f\u5168\u4f53\u3088\u308a\u5f37\u304f\u6271\u3044\u904e\u304e\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002`,
    monthlyLuck: `${hedge}\u6708\u904b\u304b\u3089\u7279\u5b9a\u65e5\u306e\u65ad\u5b9a\u307e\u3067\u9032\u3081\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002`,
    importantTiming: `${hedge}\u4e00\u65e5\u5358\u4f4d\u3067\u65ad\u5b9a\u305b\u305a\u3001\u671f\u9593\u5e45\u3067\u898b\u3066\u304f\u3060\u3055\u3044\u3002`
  };
  return map[id] || `${hedge}\u4e00\u3064\u306e\u6839\u62e0\u3060\u3051\u3067\u5224\u65ad\u305b\u305a\u3001\u4f7f\u3044\u904e\u304e\u3001\u5b64\u7acb\u3001\u6025\u306a\u6c7a\u65ad\u306b\u6ce8\u610f\u3057\u3066\u304f\u3060\u3055\u3044\u3002`;
}

function avoidanceJa(id, facts) {
  if (id === 'health') return '\u4e0d\u8abf\u3084\u4e0d\u5b89\u304c\u3042\u308b\u5834\u5408\u306f\u3001\u9451\u5b9a\u3092\u4e00\u5ea6\u6b62\u3081\u3001\u533b\u7642\u3084\u5c02\u9580\u5bb6\u306e\u652f\u63f4\u3092\u512a\u5148\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  if (id === 'finance') return '\u884c\u52d5\u524d\u306b\u640d\u5207\u308a\u30e9\u30a4\u30f3\u3092\u6c7a\u3081\u3001\u4fe1\u983c\u3067\u304d\u308b\u4eba\u306b\u524d\u63d0\u3092\u78ba\u8a8d\u3057\u3066\u3082\u3089\u3063\u3066\u304f\u3060\u3055\u3044\u3002';
  if (id === 'love' || id === 'relationship' || id === 'marriage') return '\u300c\u5fc5\u8981\u306a\u3053\u3068\u300d\u300c\u63d0\u4f9b\u3067\u304d\u308b\u3053\u3068\u300d\u300c\u73fe\u5b9f\u7684\u306a\u30da\u30fc\u30b9\u300d\u3092\u76f4\u63a5\u306e\u8a00\u8449\u306b\u623b\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  if (PROFESSIONAL_CATEGORIES.has(id)) return '\u6642\u671f\u306f\u5e83\u3081\u306b\u53d6\u308a\u3001\u6708\u3084\u5e74\u306e\u60c5\u5831\u304c\u66f4\u65b0\u3055\u308c\u305f\u3089\u518d\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  return `${elementWordsJa(facts.primaryFavorable)}\u306b\u623b\u308b\u5c0f\u3055\u306a\u884c\u52d5\u3092\u4e00\u3064\u884c\u3044\u3001\u7d50\u679c\u3092\u898b\u3066\u304b\u3089\u6b21\u306b\u9032\u3093\u3067\u304f\u3060\u3055\u3044\u3002`;
}

function evidenceJa(section, facts, tendency) {
  return [
    `\u65e5\u4e3b\u306f${dayMasterLabelJa(facts)}\u3067\u3059\u3002`,
    `\u547d\u5f0f\u5168\u4f53\u3067\u306f${strengthLabelJa(facts.strengthLevel)}\u306e\u50be\u5411\u304c\u3042\u308a\u307e\u3059\u3002`,
    `\u30d0\u30e9\u30f3\u30b9\u3092\u6574\u3048\u308b\u5019\u88dc\u3068\u3057\u3066${elementJa(facts.primaryFavorable)}\u304c\u91cd\u8996\u3055\u308c\u307e\u3059\u3002`,
    `\u3053\u306e\u9805\u76ee\u3067\u306f\u3001${tendency}\u3092\u4e3b\u306a\u7406\u7531\u3068\u3057\u3066\u8aad\u307f\u307e\u3059\u3002`,
    PROFESSIONAL_CATEGORIES.has(section.id) ? '\u904b\u52e2\u306e\u91cd\u306d\u8aad\u307f\u304c\u5fc5\u8981' : '\u547d\u5f0f\u5168\u4f53\u306e\u6587\u8108\u304c\u5fc5\u8981'
  ];
}

function publicEvidenceJa(id, facts) {
  const dayMaster = dayMasterLabelJa(facts);
  const strength = strengthLabelJa(facts.strengthLevel);
  const yongshen = elementJa(facts.primaryFavorable);
  const element = elementJa(facts.dayMasterElement);
  const common = `\u65e5\u4e3b\u306f${dayMaster}\u3067\u3059\u3002\u547d\u5f0f\u5168\u4f53\u3067\u306f${strength}\u306e\u50be\u5411\u304c\u3042\u308a\u3001\u30d0\u30e9\u30f3\u30b9\u3092\u6574\u3048\u308b\u5019\u88dc\u3068\u3057\u3066${yongshen}\u304c\u91cd\u8996\u3055\u308c\u307e\u3059\u3002`;
  const map = {
    overall: `${common}\u683c\u5c40\u3068\u6276\u6291\u306e\u5224\u65ad\u304c\u5206\u304b\u308c\u308b\u53ef\u80fd\u6027\u3082\u3042\u308b\u305f\u3081\u3001\u547d\u5f0f\u5168\u4f53\u306e\u6d41\u308c\u3092\u5408\u308f\u305b\u3066\u78ba\u8a8d\u3057\u307e\u3059\u3002`,
    personality: `${dayMaster}\u306e\u65e5\u4e3b\u3068${element}\u306e\u6027\u8cea\u304b\u3089\u3001\u672c\u8cea\u3068\u6027\u683c\u306e\u8868\u308c\u65b9\u3092\u8aad\u307f\u307e\u3059\u3002${strength}\u306e\u50be\u5411\u304c\u3042\u308b\u305f\u3081\u3001\u529b\u306e\u51fa\u3057\u65b9\u3068\u6291\u3048\u65b9\u306e\u4e21\u65b9\u3092\u78ba\u8a8d\u3057\u307e\u3059\u3002`,
    essence: `${dayMaster}\u306e\u65e5\u4e3b\u304c\u6301\u3064\u6027\u8cea\u3068\u5b63\u7bc0\u306e\u5f71\u97ff\u304c\u8868\u308c\u3084\u3059\u3044\u50be\u5411\u3067\u3059\u3002${yongshen}\u306e\u50cd\u304d\u3092\u88dc\u3046\u3068\u3001\u672c\u6765\u306e\u529b\u304c\u6271\u3044\u3084\u3059\u304f\u306a\u308a\u307e\u3059\u3002`,
    talent: `${dayMaster}\u306e\u65e5\u4e3b\u3068${strength}\u306e\u50be\u5411\u304b\u3089\u3001\u5224\u65ad\u306e\u901f\u3055\u3084\u5468\u56f2\u3092\u52d5\u304b\u3059\u529b\u304c\u5f37\u307f\u3068\u3057\u3066\u8868\u308c\u3084\u3059\u3044\u3068\u8aad\u307f\u307e\u3059\u3002`,
    weakness: `${strength}\u306e\u50be\u5411\u306f\u9577\u6240\u306b\u3082\u306a\u308a\u307e\u3059\u304c\u3001\u4f7f\u3044\u904e\u304e\u308b\u3068\u6025\u304e\u904e\u304e\u3084\u62b1\u3048\u8fbc\u307f\u306b\u5909\u308f\u308b\u305f\u3081\u3001${yongshen}\u306e\u50cd\u304d\u3067\u8abf\u6574\u3057\u307e\u3059\u3002`,
    career: `${dayMaster}\u306e\u65e5\u4e3b\u306f\u4e3b\u4f53\u6027\u3092\u767a\u63ee\u3067\u304d\u308b\u74b0\u5883\u3067\u529b\u3092\u51fa\u3057\u3084\u3059\u3044\u50be\u5411\u3067\u3059\u3002\u4e00\u65b9\u3067\u6025\u304e\u904e\u304e\u306b\u306f\u6ce8\u610f\u3057\u3001${yongshen}\u306e\u50cd\u304d\u3067\u57fa\u76e4\u3092\u6574\u3048\u307e\u3059\u3002`,
    finance: `${yongshen}\u304c\u91cd\u8996\u3055\u308c\u308b\u305f\u3081\u3001\u62e1\u5927\u3092\u6025\u3050\u3088\u308a\u5bb6\u8a08\u3084\u57fa\u76e4\u3092\u6574\u3048\u3066\u304b\u3089\u52d5\u304f\u65b9\u304c\u5b89\u5b9a\u306b\u3064\u306a\u304c\u308a\u307e\u3059\u3002`,
    love: `${dayMaster}\u306e\u65e5\u4e3b\u306f\u71b1\u610f\u304c\u4f1d\u308f\u308a\u3084\u3059\u3044\u4e00\u65b9\u3001\u76f8\u624b\u306e\u901f\u5ea6\u3092\u5c0a\u91cd\u3059\u308b\u3068\u95a2\u4fc2\u304c\u5b89\u5b9a\u3057\u307e\u3059\u3002`,
    marriage: `${strength}\u306e\u50be\u5411\u304c\u3042\u308b\u305f\u3081\u3001\u7d50\u5a5a\u3084\u9577\u671f\u7684\u306a\u95a2\u4fc2\u3067\u306f\u5f79\u5272\u5206\u62c5\u3068\u4f11\u3080\u6642\u9593\u3092\u660e\u78ba\u306b\u3059\u308b\u3053\u3068\u304c\u5b89\u5b9a\u306b\u3064\u306a\u304c\u308a\u307e\u3059\u3002`,
    relationship: `${dayMaster}\u306e\u65e5\u4e3b\u3068${strength}\u306e\u50be\u5411\u304b\u3089\u3001\u5bfe\u4eba\u95a2\u4fc2\u3067\u306f\u4e3b\u4f53\u6027\u3068\u8abf\u548c\u306e\u30d0\u30e9\u30f3\u30b9\u3092\u78ba\u8a8d\u3057\u307e\u3059\u3002`,
    family: `${yongshen}\u306e\u50cd\u304d\u304c\u91cd\u8981\u306b\u306a\u308b\u305f\u3081\u3001\u5bb6\u5ead\u3067\u306f\u5f79\u5272\u3084\u751f\u6d3b\u306e\u571f\u53f0\u3092\u6574\u3048\u308b\u3053\u3068\u304c\u652f\u3048\u306b\u306a\u308a\u307e\u3059\u3002`,
    health: `\u4f1d\u7d71\u7684\u306a\u4e94\u884c\u89e3\u91c8\u3067\u306f\u3001${dayMaster}\u306e\u65e5\u4e3b\u3068${strength}\u306e\u50be\u5411\u304b\u3089\u6d3b\u52d5\u3068\u4f11\u990a\u306e\u30d0\u30e9\u30f3\u30b9\u3092\u610f\u8b58\u3059\u308b\u6642\u671f\u3068\u8aad\u307f\u307e\u3059\u3002\u75c5\u540d\u3084\u8a3a\u65ad\u306f\u884c\u3044\u307e\u305b\u3093\u3002`,
    learning: `${yongshen}\u306e\u50cd\u304d\u3092\u88dc\u3046\u3068\u3001\u5b66\u3076\u91cf\u3068\u4f11\u3080\u91cf\u306e\u30d0\u30e9\u30f3\u30b9\u304c\u53d6\u308a\u3084\u3059\u304f\u306a\u308a\u307e\u3059\u3002`,
    creation: `${dayMaster}\u306e\u65e5\u4e3b\u304c\u6301\u3064\u8868\u73fe\u529b\u3092\u3001${yongshen}\u306e\u50cd\u304d\u3067\u7d99\u7d9a\u3067\u304d\u308b\u5f62\u306b\u6574\u3048\u307e\u3059\u3002`,
    decadeLuck: `\u5927\u904b\u306f\u9577\u671f\u7684\u306a\u6d41\u308c\u3092\u793a\u3057\u307e\u3059\u3002${dayMaster}\u306e\u65e5\u4e3b\u3068${yongshen}\u306e\u50cd\u304d\u3092\u91cd\u306d\u3066\u3001\u6570\u5e74\u5358\u4f4d\u306e\u65b9\u5411\u3092\u78ba\u8a8d\u3057\u307e\u3059\u3002`,
    annualLuck: `\u6b73\u904b\u306f\u4eca\u5e74\u306e\u30c6\u30fc\u30de\u3092\u793a\u3057\u307e\u3059\u3002${strength}\u306e\u50be\u5411\u3092\u8e0f\u307e\u3048\u3001\u52d5\u304f\u5206\u91ce\u3068\u6574\u3048\u308b\u5206\u91ce\u3092\u5206\u3051\u307e\u3059\u3002`,
    monthlyLuck: `\u6708\u904b\u306f\u4eca\u6708\u306e\u30da\u30fc\u30b9\u3092\u793a\u3057\u307e\u3059\u3002${yongshen}\u306e\u50cd\u304d\u3092\u610f\u8b58\u3057\u3001\u6e96\u5099\u30fb\u5b9f\u884c\u30fb\u4f11\u606f\u3092\u5207\u308a\u66ff\u3048\u307e\u3059\u3002`,
    importantTiming: `\u91cd\u8981\u6642\u671f\u306f\u3001\u5927\u904b\u30fb\u6b73\u904b\u30fb\u6708\u904b\u3092\u91cd\u306d\u3066\u8aad\u307f\u307e\u3059\u3002${dayMaster}\u306e\u65e5\u4e3b\u3068${yongshen}\u306e\u50cd\u304d\u3092\u5408\u308f\u305b\u3001\u671f\u9593\u5e45\u3067\u78ba\u8a8d\u3057\u307e\u3059\u3002`,
    advice: `${dayMaster}\u306e\u65e5\u4e3b\u306b\u3068\u3063\u3066\u3001${yongshen}\u306e\u50cd\u304d\u3092\u65e5\u3005\u306e\u5c0f\u3055\u306a\u884c\u52d5\u306b\u843d\u3068\u3057\u8fbc\u3080\u3053\u3068\u304c\u958b\u904b\u884c\u52d5\u306b\u306a\u308a\u307e\u3059\u3002`
  };
  if (id === 'health') {
    return map.health;
  }
  if (PROFESSIONAL_CATEGORIES.has(id)) {
    return map[id] || common;
  }
  return map[id] || common;
}

function buildPublicSectionDisplayJa(id, facts, content) {
  return {
    conclusion: sanitizePublicJa(content.conclusion),
    evidenceSummary: sanitizePublicJa(content.evidenceSummary || publicEvidenceJa(id, facts)),
    opposingFactors: content.opposingFactors.map(sanitizePublicJa),
    timing: sanitizePublicJa(content.timing),
    recommendation: sanitizePublicJa(content.recommendation),
    caution: sanitizePublicJa(content.caution),
    mitigation: sanitizePublicJa(content.mitigation),
    confidence: `${Math.round((content.confidence || 0) * 100)}%`
  };
}

function sanitizePublicJa(value) {
  const text = String(value || '');
  if (/[A-Za-z0-9_-]+=[A-Za-z0-9_-]+|sourceId|ruleId|schoolId|evidenceId|[a-z]+_[a-z]+|[a-z]+-[a-z]+/.test(text)) {
    return '\u8a73\u7d30\u306a\u6280\u8853\u60c5\u5831\u306f\u5c02\u9580\u5bb6\u8868\u793a\u3067\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002';
  }
  return text.replace(/\s*\/\s*/g, '\u3002');
}

function opposingJa(section, facts) {
  const factors = [];
  if (facts.precision === 'partial-without-hour-pillar') factors.push('\u51fa\u751f\u6642\u523b\u4e0d\u660e\u306e\u305f\u3081\u3001\u6642\u67f1\u3068\u6642\u671f\u5224\u65ad\u306e\u78ba\u5ea6\u304c\u4e0b\u304c\u308a\u307e\u3059');
  if (facts.avoid.length) factors.push(`\u6ce8\u610f\u5143\u7d20\u304c${elementJa(facts.primaryFavorable)}\u3068\u62ee\u6297\u3059\u308b\u53ef\u80fd\u6027\uff1a${facts.avoid.map(elementJa).join(', ')}`);
  if (section.id === 'annualLuck' || section.id === 'monthlyLuck') factors.push('\u77ed\u671f\u306e\u904b\u52e2\u3060\u3051\u3067\u547d\u5f0f\u5168\u4f53\u3092\u8986\u3055\u306a\u3044\u3053\u3068');
  if (section.id === 'health') factors.push('\u751f\u6d3b\u7fd2\u6163\u3001\u5e74\u9f62\u3001\u30b9\u30c8\u30ec\u30b9\u3001\u533b\u5b66\u7684\u6587\u8108\u306f\u547d\u5f0f\u306e\u5916\u306b\u3042\u308a\u307e\u3059');
  if (!factors.length) factors.push('\u683c\u5c40\u3068\u6276\u6291\u304c\u5206\u304b\u308c\u308b\u5834\u5408\u306f\u53cd\u5bfe\u8aac\u3092\u78ba\u8a8d\u3057\u307e\u3059');
  return factors;
}

function timingJa(id, facts) {
  if (id === 'decadeLuck') return '\u9577\u671f\uff1a\u5927\u904b\u306e\u30c6\u30fc\u30de\u3092\u6570\u5e74\u5358\u4f4d\u3067\u8aad\u307f\u307e\u3059';
  if (id === 'annualLuck') return '\u4e2d\u671f\uff1a\u6b73\u904b\u3092\u5927\u904b\u306e\u652f\u3048\u3068\u91cd\u306d\u3066\u8aad\u307f\u307e\u3059';
  if (id === 'monthlyLuck') return '\u77ed\u671f\uff1a\u6708\u904b\u3092\u8abf\u6574\u3068\u8ca0\u8377\u7ba1\u7406\u306b\u4f7f\u3044\u307e\u3059';
  if (id === 'importantTiming') return '\u7d71\u5408\uff1a\u5927\u904b\u304c\u5929\u5019\u3001\u6b73\u904b\u304c\u8ab2\u984c\u3001\u6708\u904b\u304c\u30da\u30fc\u30b9\u3092\u793a\u3057\u307e\u3059';
  return facts.precision === 'partial-without-hour-pillar'
    ? '\u547d\u5f0f\u50be\u5411\u306f\u8aad\u3081\u307e\u3059\u304c\u3001\u6642\u67f1\u306b\u95a2\u308f\u308b\u6642\u671f\u5224\u65ad\u306f\u9650\u5b9a\u7684\u3067\u3059'
    : '\u547d\u5f0f\u50be\u5411\u306f\u5b89\u5b9a\u3057\u3066\u304a\u308a\u3001\u6642\u671f\u306f\u904b\u52e2\u306e\u91cd\u306d\u3067\u78ba\u8a8d\u3057\u307e\u3059';
}

function renderReadingTextJa(sections, mode, executiveSummary, timingReading) {
  const lines = [
    '\u3010\u7dcf\u5408\u7d50\u8ad6\u3011',
    executiveSummary.centralTheme,
    `\u547d\u5f0f\u306e\u529b\u306e\u4f7f\u3044\u65b9\uff1a${executiveSummary.strength}`,
    `\u73fe\u5728\u306e\u904b\uff1a${executiveSummary.currentFlow}`,
    `\u4eca\u65e5\u304b\u3089\u3067\u304d\u308b\u3053\u3068\uff1a${executiveSummary.doNow}`,
    `\u907f\u3051\u305f\u65b9\u304c\u3088\u3044\u3053\u3068\uff1a${executiveSummary.avoid}`,
    `\u78ba\u5ea6\uff1a${Math.round((executiveSummary.confidence || 0) * 100)}%`,
    '',
    '\u3010\u6642\u671f\u306e\u91cd\u306d\u8aad\u307f\u3011',
    `\u5927\u904b\uff1a${timingReading.longTermTheme}`,
    `\u6b73\u904b\uff1a${timingReading.annualTheme}`,
    `\u6708\u904b\uff1a${timingReading.monthlyTheme}`,
    `\u6d41\u6d3e\u5dee\uff1a${timingReading.schoolDifferences.join('\u3002')}`,
    ''
  ];
  for (const [id] of CATEGORY_DEFS) {
    const section = sections[id];
    const display = section.publicDisplay;
    lines.push(`\u3010${section.title}\u3011`);
    lines.push(mode === 'professional' ? section.professionalSummary : section.beginnerSummary);
    if (mode !== 'professional') lines.push(`\u6839\u62e0\uff1a${display.evidenceSummary}`);
    lines.push(`\u884c\u52d5\u63d0\u6848\uff1a${mode === 'professional' ? section.action : display.recommendation}`);
    lines.push(`\u6ce8\u610f\u70b9\uff1a${mode === 'professional' ? section.caution : display.caution}`);
    lines.push(`\u56de\u907f\u7b56\uff1a${mode === 'professional' ? section.avoidance : display.mitigation}`);
    lines.push(mode === 'professional'
      ? `\u78ba\u5ea6\uff1a${section.confidence}\uff0freviewStatus\uff1a${section.reviewStatus}`
      : `\u78ba\u5ea6\uff1a${display.confidence}`);
    if (section.warnings.length && mode === 'professional') lines.push(`\u6ce8\u610f\u30d5\u30e9\u30b0\uff1a${section.warnings.join(', ')}`);
    if (mode === 'professional') lines.push(`\u51fa\u5178ID\uff1a${section.sourceIds.join(', ')}\uff0f\u6d41\u6d3eID\uff1a${section.schoolIds.join(', ')}`);
    lines.push('');
  }
  return dedupeAdjacent(lines).join('\n').trim();
}

function buildMitsunomeInputJa(facts, sections, beginnerText, professionalText, executiveSummary, timingReading, options) {
  const normalText = `\u3042\u306a\u305f\u306e\u4eca\u306e\u4e2d\u5fc3\u30c6\u30fc\u30de\u306f\u3001${executiveSummary.centralTheme}\u3002\u7126\u3089\u306a\u304f\u3066\u3044\u3044\u306e\u3002\u305f\u3060\u3057\u3001${sections.weakness.caution}\u3002\u4eca\u65e5\u306f${executiveSummary.doNow}\u304b\u3089\u59cb\u3081\u3066\u307f\u3066\u3002`;
  const zubatText = `\u7d50\u8ad6\u3002${executiveSummary.centralTheme}\u3002\u4eca\u3084\u308b\u3053\u3068\u306f${executiveSummary.doNow}\u3002\u4f46\u3057\u3001${executiveSummary.avoid}\u306f\u907f\u3051\u3066\u3002\u9003\u3052\u9053\u306f\u3042\u308b\u308f\u3002${sections.weakness.avoidance}`;
  return {
    schemaId: 'koyomi-mitsunome-bazi-reading-input',
    locale: 'ja',
    personId: facts.personId,
    modeHints: {
      normal: '\u81ea\u7136\u3067\u611b\u60c5\u306e\u3042\u308b\u53e3\u8abf\u3002\u5c02\u9580\u7528\u8a9e\u306f\u304b\u307f\u7815\u304f\u3002',
      zubat: '\u77ed\u304f\u7387\u76f4\u3002\u6539\u5584\u7b56\u3068\u9003\u3052\u9053\u3092\u5fc5\u305a\u6b8b\u3059\u3002'
    },
    executiveSummary,
    timingReading,
    sections,
    beginnerText,
    professionalText,
    voiceDrafts: {
      normal: {
        style: 'mitsunome-normal-ja',
        text: normalText,
        guardrails: ['no-fatalism', 'no-medical-diagnosis', 'no-unsupported-claims']
      },
      zubat: {
        style: 'mitsunome-zubat-ja',
        text: zubatText,
        escapeRoute: sections.weakness.avoidance,
        guardrails: ['no-personality-attack', 'no-fearmongering', 'always-add-recovery-path']
      }
    },
    sourcePolicy: {
      aiGeneratedTextIsNotSource: true,
      noNewCalculationByAi: true,
      sourceIdsRequiredForClaims: true,
      classicalOriginalMustRemainSeparate: true,
      requestedTone: options.tone || 'normal'
    }
  };
}

function elementJa(element) {
  return JA_ELEMENTS[normalizeElement(element)] || '\u8a73\u7d30\u306a\u6280\u8853\u60c5\u5831\u306f\u5c02\u9580\u5bb6\u8868\u793a\u3067\u78ba\u8a8d\u3067\u304d\u307e\u3059';
}

function elementWordsJa(element) {
  return JA_ELEMENT_WORDS[normalizeElement(element)] || '\u30d0\u30e9\u30f3\u30b9';
}

function actionByElementJa(element) {
  const map = {
    wood: '\u6b21\u306b\u80b2\u3066\u308b\u3053\u3068\u3092\u4e00\u3064\u9078\u3073\u3001\u4e88\u5b9a\u8868\u306b\u66f8\u3044\u3066\u898b\u3048\u308b\u5f62\u306b\u3057\u3066\u304f\u3060\u3055\u3044',
    fire: '\u4f1d\u3048\u305f\u3044\u3053\u3068\u3092\u4e00\u3064\u660e\u78ba\u306b\u3057\u3001\u7d9a\u3051\u3089\u308c\u308b\u5c0f\u3055\u306a\u7d04\u675f\u3068\u3057\u3066\u51fa\u3057\u3066\u304f\u3060\u3055\u3044',
    earth: '\u4e88\u5b9a\u3001\u5bb6\u8a08\u3001\u7761\u7720\u3001\u5468\u56f2\u3068\u306e\u5f79\u5272\u5206\u62c5\u3092\u6574\u3048\u3066\u304b\u3089\u5e83\u3052\u3066\u304f\u3060\u3055\u3044',
    metal: '\u66d6\u6627\u306a\u7fa9\u52d9\u3092\u4e00\u3064\u6e1b\u3089\u3057\u3001\u30eb\u30fc\u30eb\u3084\u5883\u754c\u7dda\u3092\u8a00\u8449\u306b\u3057\u3066\u304f\u3060\u3055\u3044',
    water: '\u60c5\u5831\u3092\u96c6\u3081\u3001\u982d\u3092\u4f11\u3081\u3001\u51b7\u9759\u3055\u304c\u5fc5\u8981\u306a\u6c7a\u65ad\u306f\u5c11\u3057\u9045\u3089\u305b\u3066\u304f\u3060\u3055\u3044'
  };
  return map[normalizeElement(element)] || map.earth;
}

function strengthLabelJa(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('strong') || raw.includes('旺') || raw.includes('身強')) return '\u8eab\u5f37';
  if (raw.includes('weak') || raw.includes('弱') || raw.includes('身弱')) return '\u8eab\u5f31';
  return '\u5224\u65ad\u4fdd\u7559';
}

function dayMasterLabelJa(facts) {
  const id = String(facts.dayMaster?.id || facts.dayMasterName || '').toLowerCase();
  return facts.dayMaster?.kanji || JA_STEMS[id] || (/[^\x00-\x7F]/.test(String(facts.dayMasterName || '')) ? facts.dayMasterName : '\u8a73\u7d30\u306a\u6280\u8853\u60c5\u5831\u306f\u5c02\u9580\u5bb6\u8868\u793a\u3067\u78ba\u8a8d\u3067\u304d\u307e\u3059');
}

function occupationFocusJa(occupation) {
  if (!occupation) return '';
  const id = String(occupation.id || occupation.label || occupation.focus || '').toLowerCase();
  const map = {
    emergency: '\u73fe\u5834\u5224\u65ad\u3001\u5371\u967a\u56de\u907f\u3001\u9023\u643a\u3001\u75b2\u52b4\u7ba1\u7406',
    management: '\u610f\u601d\u6c7a\u5b9a\u3001\u8cac\u4efb\u3001\u90e8\u4e0b\u5bfe\u5fdc\u3001\u4ea4\u6e09',
    student: '\u5b66\u7fd2\u65b9\u6cd5\u3001\u8a66\u9a13\u3001\u96c6\u4e2d\u3001\u9032\u8def',
    technical: '\u7cbe\u5ea6\u3001\u6539\u5584\u3001\u96c6\u4e2d\u3001\u5c02\u9580\u6027',
    service: '\u5bfe\u4eba\u53cd\u5fdc\u3001\u8a00\u8449\u3001\u30bf\u30a4\u30df\u30f3\u30b0'
  };
  if (/emergency|rescue|field judgement|risk avoidance/.test(id)) return map.emergency;
  if (/management|leader|executive|staff care/.test(id)) return map.management;
  if (/student|school|study/.test(id)) return map.student;
  if (/technical|engineer|precision/.test(id)) return map.technical;
  if (/service|sales|retail|hospitality|customer/.test(id)) return map.service;
  return '';
}

function findEnglishDisplayHits(text) {
  const patterns = [/day[- ]master/i, /Overall Conclusion/, /Current flow/, /Do now/, /Plain meaning/, /Recovery path/];
  return patterns.filter(pattern => pattern.test(text)).map(pattern => pattern.source);
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
  return /\bmay\b|\bpartial\b|\blimited\b|\bconditional\b|\breview\b|\btendency\b|\u78ba\u5ea6|\u9650\u5b9a\u7684|\u50be\u5411|\u53ef\u80fd\u6027|\u30ec\u30d3\u30e5\u30fc/i.test(text);
}
