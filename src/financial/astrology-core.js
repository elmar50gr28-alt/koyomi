// Financial astrology: deterministic astronomical observations, symbolic interpretation only.
// Reuses the MIT-licensed Astronomy Engine already bundled with KOYOMI.
const LABELS = Object.freeze({
  Sun: '太陽', Moon: '月', Mercury: '水星', Venus: '金星', Mars: '火星',
  Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星'
});
const FINANCE_THEMES = Object.freeze({
  Sun: '社会の中心的な動き', Moon: '生活者の気分', Mercury: '商取引と情報',
  Venus: '価値と消費', Mars: '競争と行動', Jupiter: '拡大への期待',
  Saturn: '制約と規律', Uranus: '技術と変化', Neptune: '期待と不透明さ', Pluto: '構造の組み替え'
});
const ASPECTS = Object.freeze([
  { id: 'conjunction', label: '合', degrees: 0, orb: 4, reading: '二つのテーマが重なる' },
  { id: 'sextile', label: 'セクスタイル', degrees: 60, orb: 3, reading: '異なる要素の連携を意識する' },
  { id: 'square', label: 'スクエア', degrees: 90, orb: 4, reading: '異なる要求を調整する' },
  { id: 'trine', label: 'トライン', degrees: 120, orb: 4, reading: '組み合わせと活用を考える' },
  { id: 'opposition', label: 'オポジション', degrees: 180, orb: 4, reading: '両極の立場を比べる' }
]);
const BODY_ORDER = Object.keys(LABELS);
const PLANETS = BODY_ORDER.filter(name => !['Sun', 'Moon'].includes(name));
const DAY_MS = 86400000;
export const FINANCIAL_ASTROLOGY_META = Object.freeze({
  schemaId: 'koyomi-financial-astrology-v1',
  ephemerisId: 'astronomy-engine-2.1.19',
  ruleId: 'koyomi-financial-aspect-rules-v1',
  reviewStatus: 'traditional-symbolism-not-market-validated',
  disclaimer: '占星術上の象徴を示す娯楽・内省機能です。株価・景気・為替の予測精度を実証したものではありません。投資判断には使用しないでください。'
});
export const BODY_LABELS = LABELS;
export const ASPECT_DEFINITIONS = ASPECTS;
const normalize = value => (value % 360 + 360) % 360;
const signedAngle = value => normalize(value + 180) - 180;
const distance = (left, right) => Math.abs(signedAngle(left - right));

function validDate(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new RangeError('有効な日付を指定してください。');
  if (date.getFullYear() < 1900 || date.getFullYear() > 2099) throw new RangeError('1900年から2099年までの日付を指定してください。');
  return date;
}
function apiCheck(astronomy) {
  if (!astronomy || typeof astronomy.SunPosition !== 'function' ||
      typeof astronomy.EclipticGeoMoon !== 'function' ||
      typeof astronomy.GeoVector !== 'function' ||
      typeof astronomy.Ecliptic !== 'function') {
    throw new Error('天文計算データが利用できません。再度読み込んでください。');
  }
  return astronomy;
}
function longitudeOf(name, date, astronomy) {
  let result;
  if (name === 'Sun') result = astronomy.SunPosition(date).elon;
  else if (name === 'Moon') result = astronomy.EclipticGeoMoon(date).lon;
  else {
    const vector = astronomy.GeoVector(astronomy.Body?.[name] || name, date, true);
    const ecliptic = astronomy.Ecliptic(vector);
    result = ecliptic.elon ?? ecliptic.lon;
  }
  if (!Number.isFinite(result)) throw new Error('天体位置を取得できませんでした：' + LABELS[name]);
  return normalize(result);
}
export function positionsAt(date, astronomy) {
  validDate(date);
  const api = apiCheck(astronomy);
  return Object.fromEntries(BODY_ORDER.map(name => [name, longitudeOf(name, date, api)]));
}
export function lunarPhase(longitudes) {
  const elongation = normalize(longitudes.Moon - longitudes.Sun);
  if (!Number.isFinite(elongation)) throw new Error('月相を計算できませんでした。');
  const stages = [
    [22.5, '新月付近', '準備と見直し'],
    [67.5, '満ちゆく月', '小さな試行'],
    [112.5, '上弦付近', '選択と調整'],
    [157.5, '満ちゆく月', '進め方の整理'],
    [202.5, '満月付近', '成果の点検'],
    [247.5, '欠けゆく月', '優先順位の整理'],
    [292.5, '下弦付近', '不要な負担の整理'],
    [337.5, '欠けゆく月', '次の準備'],
    [360, '新月付近', '準備と見直し']
  ];
  const stage = stages.find(item => elongation < item[0]);
  return { angle: elongation, label: stage[1], theme: stage[2], waxing: elongation < 180 };
}
export function findAspects(positions) {
  const list = [];
  for (let i = 0; i < BODY_ORDER.length; i++) {
    for (let j = i + 1; j < BODY_ORDER.length; j++) {
      const left = BODY_ORDER[i], right = BODY_ORDER[j];
      if (!Number.isFinite(positions[left]) || !Number.isFinite(positions[right])) continue;
      const separation = distance(positions[left], positions[right]);
      for (const aspect of ASPECTS) {
        const orb = Math.abs(separation - aspect.degrees);
        if (orb <= aspect.orb) {
          list.push({
            bodies: [left, right], label: LABELS[left] + ' × ' + LABELS[right],
            type: aspect.id, aspect: aspect.label, orb: Number(orb.toFixed(2)),
            angle: separation, meaning: aspect.reading,
            topic: FINANCE_THEMES[left] + '・' + FINANCE_THEMES[right]
          });
          break;
        }
      }
    }
  }
  return list.sort((a,b) => a.orb - b.orb || a.label.localeCompare(b.label));
}
export function retrogradesAt(date, astronomy) {
  validDate(date);
  const api = apiCheck(astronomy);
  const prev = new Date(date.getTime() - DAY_MS), next = new Date(date.getTime() + DAY_MS);
  return PLANETS.filter(name =>
    signedAngle(longitudeOf(name, next, api) - longitudeOf(name, prev, api)) < 0
  ).map(name => ({ body: name, label: LABELS[name], theme: FINANCE_THEMES[name] }));
}
function addCalendarDays(base, amount) {
  const copy = new Date(base.getTime());
  copy.setDate(copy.getDate() + amount);
  return copy;
}
export function localDateKey(date) {
  validDate(date);
  return String(date.getFullYear()).padStart(4,'0') + '-' +
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0');
}
export function readFinancialSky(date, astronomy) {
  const positions = positionsAt(date, astronomy);
  const phase = lunarPhase(positions);
  const aspects = findAspects(positions);
  const retrogrades = retrogradesAt(date, astronomy);
  const lead = aspects[0];
  const headline = lead
    ? lead.label + 'の' + lead.aspect + 'に注目'
    : phase.label + 'の節目を読む';
  const overview = lead
    ? lead.topic + 'という象徴が重なります。' + lead.meaning + 'という読み方を参考に、実際の数字と条件を確かめましょう。'
    : phase.label + 'を手掛かりに、収支や情報の整理に目を向けましょう。';
  return {
    date: localDateKey(date), phase, aspects, retrogrades, headline, overview,
    // This is an astronomical event count, NOT a price or bullish/bearish index.
    tightAspectCount: aspects.filter(item => item.orb <= 2).length,
    meta: FINANCIAL_ASTROLOGY_META
  };
}
export function readFinancialWindow(start, astronomy, days=14) {
  validDate(start);
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new RangeError('表示期間は1〜31日です。');
  const output=[];
  for (let index=0; index<days; index++) {
    const current=addCalendarDays(start,index);
    if (current.getFullYear() > 2099) break;
    output.push(readFinancialSky(current,astronomy));
  }
  return output;
}
