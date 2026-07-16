export const STEMS = [
  { id: 'jia', kanji: '\u7532', name: 'Jia', element: 'wood', yinYang: 'yang', order: 1 },
  { id: 'yi', kanji: '\u4e59', name: 'Yi', element: 'wood', yinYang: 'yin', order: 2 },
  { id: 'bing', kanji: '\u4e19', name: 'Bing', element: 'fire', yinYang: 'yang', order: 3 },
  { id: 'ding', kanji: '\u4e01', name: 'Ding', element: 'fire', yinYang: 'yin', order: 4 },
  { id: 'wu', kanji: '\u620a', name: 'Wu', element: 'earth', yinYang: 'yang', order: 5 },
  { id: 'ji', kanji: '\u5df1', name: 'Ji', element: 'earth', yinYang: 'yin', order: 6 },
  { id: 'geng', kanji: '\u5e9a', name: 'Geng', element: 'metal', yinYang: 'yang', order: 7 },
  { id: 'xin', kanji: '\u8f9b', name: 'Xin', element: 'metal', yinYang: 'yin', order: 8 },
  { id: 'ren', kanji: '\u58ec', name: 'Ren', element: 'water', yinYang: 'yang', order: 9 },
  { id: 'gui', kanji: '\u7678', name: 'Gui', element: 'water', yinYang: 'yin', order: 10 }
];

export const BRANCHES = [
  { id: 'zi', kanji: '\u5b50', name: 'Zi', element: 'water', order: 1, monthNumber: 11, startHour: 23, endHour: 1 },
  { id: 'chou', kanji: '\u4e11', name: 'Chou', element: 'earth', order: 2, monthNumber: 12, startHour: 1, endHour: 3 },
  { id: 'yin', kanji: '\u5bc5', name: 'Yin', element: 'wood', order: 3, monthNumber: 1, startHour: 3, endHour: 5 },
  { id: 'mao', kanji: '\u536f', name: 'Mao', element: 'wood', order: 4, monthNumber: 2, startHour: 5, endHour: 7 },
  { id: 'chen', kanji: '\u8fb0', name: 'Chen', element: 'earth', order: 5, monthNumber: 3, startHour: 7, endHour: 9 },
  { id: 'si', kanji: '\u5df3', name: 'Si', element: 'fire', order: 6, monthNumber: 4, startHour: 9, endHour: 11 },
  { id: 'wu', kanji: '\u5348', name: 'Wu', element: 'fire', order: 7, monthNumber: 5, startHour: 11, endHour: 13 },
  { id: 'wei', kanji: '\u672a', name: 'Wei', element: 'earth', order: 8, monthNumber: 6, startHour: 13, endHour: 15 },
  { id: 'shen', kanji: '\u7533', name: 'Shen', element: 'metal', order: 9, monthNumber: 7, startHour: 15, endHour: 17 },
  { id: 'you', kanji: '\u9149', name: 'You', element: 'metal', order: 10, monthNumber: 8, startHour: 17, endHour: 19 },
  { id: 'xu', kanji: '\u620c', name: 'Xu', element: 'earth', order: 11, monthNumber: 9, startHour: 19, endHour: 21 },
  { id: 'hai', kanji: '\u4ea5', name: 'Hai', element: 'water', order: 12, monthNumber: 10, startHour: 21, endHour: 23 }
];

export const ELEMENTS = {
  wood: { kanji: '\u6728', generates: 'fire', controls: 'earth' },
  fire: { kanji: '\u706b', generates: 'earth', controls: 'metal' },
  earth: { kanji: '\u571f', generates: 'metal', controls: 'water' },
  metal: { kanji: '\u91d1', generates: 'water', controls: 'wood' },
  water: { kanji: '\u6c34', generates: 'wood', controls: 'fire' }
};

export const HIDDEN_STEMS = {
  zi: [{ hiddenStemId: 'gui', role: 'main', weight: 1 }],
  chou: [{ hiddenStemId: 'ji', role: 'main', weight: 0.6 }, { hiddenStemId: 'gui', role: 'middle', weight: 0.3 }, { hiddenStemId: 'xin', role: 'residual', weight: 0.1 }],
  yin: [{ hiddenStemId: 'jia', role: 'main', weight: 0.6 }, { hiddenStemId: 'bing', role: 'middle', weight: 0.3 }, { hiddenStemId: 'wu', role: 'residual', weight: 0.1 }],
  mao: [{ hiddenStemId: 'yi', role: 'main', weight: 1 }],
  chen: [{ hiddenStemId: 'wu', role: 'main', weight: 0.6 }, { hiddenStemId: 'yi', role: 'middle', weight: 0.3 }, { hiddenStemId: 'gui', role: 'residual', weight: 0.1 }],
  si: [{ hiddenStemId: 'bing', role: 'main', weight: 0.6 }, { hiddenStemId: 'wu', role: 'middle', weight: 0.3 }, { hiddenStemId: 'geng', role: 'residual', weight: 0.1 }],
  wu: [{ hiddenStemId: 'ding', role: 'main', weight: 0.7 }, { hiddenStemId: 'ji', role: 'middle', weight: 0.3 }],
  wei: [{ hiddenStemId: 'ji', role: 'main', weight: 0.6 }, { hiddenStemId: 'ding', role: 'middle', weight: 0.3 }, { hiddenStemId: 'yi', role: 'residual', weight: 0.1 }],
  shen: [{ hiddenStemId: 'geng', role: 'main', weight: 0.6 }, { hiddenStemId: 'ren', role: 'middle', weight: 0.3 }, { hiddenStemId: 'wu', role: 'residual', weight: 0.1 }],
  you: [{ hiddenStemId: 'xin', role: 'main', weight: 1 }],
  xu: [{ hiddenStemId: 'wu', role: 'main', weight: 0.6 }, { hiddenStemId: 'xin', role: 'middle', weight: 0.3 }, { hiddenStemId: 'ding', role: 'residual', weight: 0.1 }],
  hai: [{ hiddenStemId: 'ren', role: 'main', weight: 0.7 }, { hiddenStemId: 'jia', role: 'middle', weight: 0.3 }]
};

export const TWELVE_STAGES = {
  jia: ['muyu', 'guandai', 'jianlu', 'diwang', 'shuai', 'bing', 'si', 'mu', 'jue', 'tai', 'yang', 'changsheng'],
  yi: ['bing', 'shuai', 'diwang', 'jianlu', 'guandai', 'muyu', 'changsheng', 'yang', 'tai', 'jue', 'mu', 'si'],
  bing: ['tai', 'yang', 'changsheng', 'muyu', 'guandai', 'jianlu', 'diwang', 'shuai', 'bing', 'si', 'mu', 'jue'],
  ding: ['jue', 'mu', 'si', 'bing', 'shuai', 'diwang', 'jianlu', 'guandai', 'muyu', 'changsheng', 'yang', 'tai'],
  wu: ['tai', 'yang', 'changsheng', 'muyu', 'guandai', 'jianlu', 'diwang', 'shuai', 'bing', 'si', 'mu', 'jue'],
  ji: ['jue', 'mu', 'si', 'bing', 'shuai', 'diwang', 'jianlu', 'guandai', 'muyu', 'changsheng', 'yang', 'tai'],
  geng: ['si', 'mu', 'jue', 'tai', 'yang', 'changsheng', 'muyu', 'guandai', 'jianlu', 'diwang', 'shuai', 'bing'],
  xin: ['changsheng', 'yang', 'tai', 'jue', 'mu', 'si', 'bing', 'shuai', 'diwang', 'jianlu', 'guandai', 'muyu'],
  ren: ['diwang', 'shuai', 'bing', 'si', 'mu', 'jue', 'tai', 'yang', 'changsheng', 'muyu', 'guandai', 'jianlu'],
  gui: ['jianlu', 'guandai', 'muyu', 'changsheng', 'yang', 'tai', 'jue', 'mu', 'si', 'bing', 'shuai', 'diwang']
};

export const TEN_GODS = [
  { id: 'bijian', kanji: '\u6bd4\u80a9', elementRelation: 'same', polarity: 'same' },
  { id: 'jie_cai', kanji: '\u52ab\u8ca1', elementRelation: 'same', polarity: 'opposite' },
  { id: 'shi_shen', kanji: '\u98df\u795e', elementRelation: 'output', polarity: 'same' },
  { id: 'shang_guan', kanji: '\u50b7\u5b98', elementRelation: 'output', polarity: 'opposite' },
  { id: 'pian_cai', kanji: '\u504f\u8ca1', elementRelation: 'wealth', polarity: 'same' },
  { id: 'zheng_cai', kanji: '\u6b63\u8ca1', elementRelation: 'wealth', polarity: 'opposite' },
  { id: 'qi_sha', kanji: '\u4e03\u6bba', elementRelation: 'officer', polarity: 'same' },
  { id: 'zheng_guan', kanji: '\u6b63\u5b98', elementRelation: 'officer', polarity: 'opposite' },
  { id: 'pian_yin', kanji: '\u504f\u5370', elementRelation: 'resource', polarity: 'same' },
  { id: 'zheng_yin', kanji: '\u6b63\u5370', elementRelation: 'resource', polarity: 'opposite' }
];

export const STEM_COMBINATIONS = [
  ['jia', 'ji', 'earth'], ['yi', 'geng', 'metal'], ['bing', 'xin', 'water'], ['ding', 'ren', 'wood'], ['wu', 'gui', 'fire']
];
export const STEM_CLASHES = [['jia', 'geng'], ['yi', 'xin'], ['bing', 'ren'], ['ding', 'gui']];
export const BRANCH_COMBINATIONS = [
  ['zi', 'chou', 'earth'], ['yin', 'hai', 'wood'], ['mao', 'xu', 'fire'], ['chen', 'you', 'metal'], ['si', 'shen', 'water'], ['wu', 'wei', 'earth']
];
export const BRANCH_CLASHES = [['zi', 'wu'], ['chou', 'wei'], ['yin', 'shen'], ['mao', 'you'], ['chen', 'xu'], ['si', 'hai']];
export const BRANCH_HARMS = [['zi', 'wei'], ['chou', 'wu'], ['yin', 'si'], ['mao', 'chen'], ['shen', 'hai'], ['you', 'xu']];
export const BRANCH_PUNISHMENTS = [['zi', 'mao'], ['yin', 'si', 'shen'], ['chou', 'wei', 'xu'], ['chen'], ['wu'], ['you'], ['hai']];
export const BRANCH_DESTRUCTIONS = [['zi', 'you'], ['chou', 'chen'], ['yin', 'hai'], ['mao', 'wu'], ['si', 'shen'], ['wei', 'xu']];
export const SEASON_STRENGTH = {
  spring: { branches: ['yin', 'mao', 'chen'], dominant: 'wood' },
  summer: { branches: ['si', 'wu', 'wei'], dominant: 'fire' },
  autumn: { branches: ['shen', 'you', 'xu'], dominant: 'metal' },
  winter: { branches: ['hai', 'zi', 'chou'], dominant: 'water' }
};

export const SCHOOL_PROFILES = {
  'traditional-ziping': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'dimensional', luckStart: 'solar-term-distance' },
  'yuanhai-ziping': { dayBoundary: 'midnight', ziHour: 'late-zi-next-day', strengthMethod: 'month-command-first', luckStart: 'solar-term-distance' },
  'sanming-tonghui': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'relations-heavy', luckStart: 'solar-term-distance' },
  'ziping-zhenquan': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'pattern-first', luckStart: 'solar-term-distance' },
  'ditian-sui': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'qi-flow', luckStart: 'solar-term-distance' },
  'qiongtong-baojian': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'climate-first', luckStart: 'solar-term-distance' },
  'taiwan-modern': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'dimensional', luckStart: 'solar-term-distance' },
  'hongkong-modern': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'dimensional', luckStart: 'solar-term-distance' },
  'japan-taizan': { dayBoundary: 'midnight', ziHour: 'early-zi-same-day', strengthMethod: 'season-score', luckStart: 'solar-term-distance' },
  'modern-score': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'score', luckStart: 'solar-term-distance' },
  'koyomi-integrated': { dayBoundary: 'midnight', ziHour: 'split', strengthMethod: 'integrated', luckStart: 'solar-term-distance' }
};

export const CLASSICAL_SOURCES = [
  {
    sourceId: 'src-yuanhai-ziping-biblio',
    title: 'Yuanhai Ziping',
    author: 'Xu Dasheng attributed',
    era: 'Song/Yuan tradition',
    chapter: '',
    section: '',
    originalText: '',
    normalizedText: '',
    japaneseSummary: 'Classical bibliographic seed for Ziping rules.',
    conceptIds: ['pattern', 'ten-gods', 'strength'],
    schoolIds: ['yuanhai-ziping', 'traditional-ziping'],
    sourceType: 'bibliographic',
    copyrightStatus: 'public-domain-bibliographic',
    reviewStatus: 'seeded'
  },
  {
    sourceId: 'src-qiongtong-baojian-biblio',
    title: 'Qiongtong Baojian',
    author: 'classical compilation',
    era: 'Ming/Qing tradition',
    chapter: '',
    section: '',
    originalText: '',
    normalizedText: '',
    japaneseSummary: 'Classical bibliographic seed for climate yongshen rules.',
    conceptIds: ['climate', 'yongshen'],
    schoolIds: ['qiongtong-baojian', 'koyomi-integrated'],
    sourceType: 'bibliographic',
    copyrightStatus: 'public-domain-bibliographic',
    reviewStatus: 'seeded'
  }
];

export const RULE_CATALOG = [
  {
    ruleId: 'bazi-strength-month-command-001',
    name: 'Month command first strength rule',
    category: 'strength',
    conditions: [{ field: 'monthBranch.seasonDominantElement', relation: 'equals-day-master-element' }],
    exclusions: [],
    priority: 80,
    result: { dimension: 'monthCommand', effect: 'support-day-master' },
    schoolIds: ['traditional-ziping', 'koyomi-integrated', 'modern-score'],
    sourceIds: ['src-yuanhai-ziping-biblio'],
    confidence: 0.72,
    reviewStatus: 'phase1-seed',
    version: '1.0.0',
    notes: 'Phase 1 returns deterministic facts only.'
  },
  {
    ruleId: 'bazi-yongshen-climate-001',
    name: 'Separate climate yongshen candidate',
    category: 'yongshen',
    conditions: [{ field: 'season', relation: 'winter-or-summer' }],
    exclusions: [],
    priority: 70,
    result: { method: 'climate', output: 'secondary-yongshen-candidate' },
    schoolIds: ['qiongtong-baojian', 'koyomi-integrated'],
    sourceIds: ['src-qiongtong-baojian-biblio'],
    confidence: 0.66,
    reviewStatus: 'phase1-seed',
    version: '1.0.0',
    notes: 'Climate method is returned separately from balance method.'
  }
];
