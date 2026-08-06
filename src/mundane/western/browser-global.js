(function installMundaneBrowserCore(root) {
  'use strict';

  const DAY_MS = 86400000;
  const DEFINITIONS = [
    { id: 'aries', nameJa: '春分図', targetLongitude: 0, startMonth: 2, startDay: 18 },
    { id: 'cancer', nameJa: '夏至図', targetLongitude: 90, startMonth: 5, startDay: 19 },
    { id: 'libra', nameJa: '秋分図', targetLongitude: 180, startMonth: 8, startDay: 21 },
    { id: 'capricorn', nameJa: '冬至図', targetLongitude: 270, startMonth: 11, startDay: 19 }
  ];
  const MONTH_DEFINITIONS = [
    ['aquarius', '1月図', 300, 0, 18], ['pisces', '2月図', 330, 1, 16], ['aries', '3月図', 0, 2, 18],
    ['taurus', '4月図', 30, 3, 18], ['gemini', '5月図', 60, 4, 19], ['cancer', '6月図', 90, 5, 19],
    ['leo', '7月図', 120, 6, 20], ['virgo', '8月図', 150, 7, 20], ['libra', '9月図', 180, 8, 21],
    ['scorpio', '10月図', 210, 9, 21], ['sagittarius', '11月図', 240, 10, 20], ['capricorn', '12月図', 270, 11, 19]
  ].map((item, index) => ({ id: item[0], nameJa: item[1], targetLongitude: item[2], startMonth: item[3], startDay: item[4], month: index + 1 }));
  const ASPECTS = [{ id: 'conjunction', angle: 0, orb: 6 }, { id: 'sextile', angle: 60, orb: 4 }, { id: 'square', angle: 90, orb: 5 }, { id: 'trine', angle: 120, orb: 5 }, { id: 'opposition', angle: 180, orb: 6 }];
  const HOUSES = {
    1: ['国民生活と社会の空気', '世論調査、生活実感、消費者心理の変化', '数字と街の声を併記し、一部の大きな声だけで全体を判断しない'],
    2: ['財政・物価・国の資源', '物価、賃金、予算、税負担、通貨の動き', '家計や事業への影響額を試算し、支出の優先順位を決める'],
    3: ['報道・交通・教育・通信', '交通障害、通信障害、報道内容、学校制度の変更', '発表元と更新日時を確認し、連絡経路を二つ用意する'],
    4: ['国土・住宅・農業', '住宅、土地、農業、防災、地域基盤の課題', '設備・備蓄・避難経路を点検し、先送りした修繕を洗い出す'],
    5: ['子ども・文化・娯楽・投機', '教育、出生・子育て、文化事業、娯楽市場、投機熱', '話題性と継続可能性を分け、費用と利用者数を確認する'],
    6: ['労働・公衆衛生・行政実務', '雇用条件、人手不足、医療、公衆衛生、行政の現場負担', '現場の人員・待ち時間・欠勤率を確認し、工程と担当を減らす'],
    7: ['外交・条約・対立相手', '外交交渉、条約、訴訟、競争相手との関係', '合意事項を文書にし、譲れる条件と譲れない条件を分ける'],
    8: ['税・共同資産・危機管理', '税、国債、保険、金融機関、共同資産、危機対応', '返済・補償・責任の範囲を確認し、最悪時の資金繰りを用意する'],
    9: ['司法・高等教育・海外', '裁判、法改正、大学、宗教、海外との往来', '国内外の規則差を確認し、専門家の一次情報に当たる'],
    10: ['政府・指導層・国家目標', '政府方針、首脳人事、行政目標、企業トップの決定', '発言より予算・期限・責任者を確認し、実行可能性を見極める'],
    11: ['議会・同盟・社会運動', '議会、同盟、業界団体、市民運動、共同目標', '参加者の目的と負担を揃え、誰が何を実行するか決める'],
    12: ['制度の死角・隔離・慢性的負担', '表に出にくい制度不備、隔離施設、秘密、長期化した問題', '匿名の相談窓口や内部記録も確認し、見えない負担を数える']
  };
  const PLANETS = { Sun: '政府・指導層', Moon: '国民生活・世論', Mercury: '報道・交通・商取引', Venus: '外交・文化・通貨価値', Mars: '事故・対立・実行力', Jupiter: '法律・国際関係・拡大', Saturn: '制度・制約・長期負担', Uranus: '技術革新・急変', Neptune: '理想・混乱・情報の曖昧さ', Pluto: '権力再編・大規模な転換' };
  const normalize = value => ((Number(value) % 360) + 360) % 360;
  const signedDistance = (value, target) => ((normalize(value) - normalize(target) + 540) % 360) - 180;
  const angularDistance = (left, right) => Math.abs(signedDistance(left, right));

  function ingress(year, definition, solarLongitude) {
    let low = new Date(Date.UTC(year, definition.startMonth, definition.startDay));
    let high = new Date(low.getTime() + 8 * DAY_MS);
    if (!(signedDistance(solarLongitude(low), definition.targetLongitude) <= 0 && signedDistance(solarLongitude(high), definition.targetLongitude) >= 0)) throw new RangeError('季節の境界時刻を確定できませんでした');
    for (let index = 0; index < 48; index += 1) {
      const middle = new Date((low.getTime() + high.getTime()) / 2);
      if (signedDistance(solarLongitude(middle), definition.targetLongitude) >= 0) high = middle;
      else low = middle;
    }
    return new Date((low.getTime() + high.getTime()) / 2);
  }

  function angles(date, location) {
    const jd = date.getTime() / DAY_MS + 2440587.5;
    const centuries = (jd - 2451545) / 36525;
    const sidereal = normalize(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * centuries ** 2 - centuries ** 3 / 38710000 + location.longitude);
    const theta = sidereal * Math.PI / 180;
    const obliquity = (23.439291 - 0.0130042 * centuries) * Math.PI / 180;
    const latitude = location.latitude * Math.PI / 180;
    return { ascendant: normalize(Math.atan2(-Math.cos(theta), Math.sin(obliquity) * Math.tan(latitude) + Math.cos(obliquity) * Math.sin(theta)) * 180 / Math.PI), midheaven: normalize(Math.atan2(Math.sin(theta) * Math.cos(obliquity), Math.cos(theta)) * 180 / Math.PI), localSiderealTime: sidereal, precision: 'standard-astronomical-formula' };
  }

  function aspects(positions) {
    const entries = Object.entries(positions), output = [];
    for (let left = 0; left < entries.length; left += 1) for (let right = left + 1; right < entries.length; right += 1) {
      const separation = angularDistance(entries[left][1], entries[right][1]);
      const aspect = ASPECTS.map(item => ({ ...item, delta: Math.abs(separation - item.angle) })).find(item => item.delta <= item.orb);
      if (aspect) output.push({ type: aspect.id, bodies: [entries[left][0], entries[right][0]], separation, orb: aspect.delta });
    }
    return output.sort((left, right) => left.orb - right.orb);
  }

  function buildChart(options, definition) {
    const year = Number(options.year), ephemeris = options.ephemeris;
    const location = { label: String(options.location?.label || '対象地点'), latitude: Number(options.location?.latitude), longitude: Number(options.location?.longitude), timezone: options.location?.timezone || 'UTC' };
    if (!Number.isInteger(year) || year < 1800 || year > 2200 || !Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 || !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) throw new RangeError('年・緯度・経度を確認してください');
    const datetime = ingress(year, definition, ephemeris.solarLongitude), positions = Object.fromEntries(Object.entries(ephemeris.planetLongitudes(datetime)).map(([body, value]) => [body, normalize(value)]));
    const chartAngles = angles(datetime, location), cusps = Array.from({ length: 12 }, (_, index) => normalize(chartAngles.ascendant + index * 30));
    const placements = Object.fromEntries(Object.entries(positions).map(([body, longitude]) => [body, { longitude, house: Math.floor(normalize(longitude - cusps[0]) / 30) + 1 }]));
    const before = ephemeris.planetLongitudes(new Date(datetime.getTime() - 43200000)), after = ephemeris.planetLongitudes(new Date(datetime.getTime() + 43200000));
    return { schemaId: 'koyomi-mundane-seasonal-ingress-v1', chartType: definition.id, nameJa: definition.nameJa, year, datetime: datetime.toISOString(), location, houseSystem: 'equal', angles: chartAngles, cusps, positions, placements, retrogrades: Object.fromEntries(Object.keys(positions).map(body => [body, signedDistance(after[body], before[body]) < 0])), aspects: aspects(positions), calculation: { ephemerisId: ephemeris.id || 'unspecified', precision: ephemeris.precision || 'unspecified', targetSolarLongitude: definition.targetLongitude }, warnings: ephemeris.precision === 'fallback' ? ['fallback-ephemeris'] : [] };
  }

  function buildSeasonalIngressCharts(options) { return DEFINITIONS.map(definition => buildChart(options, definition)); }
  function buildMonthlyIngressCharts(options) { return MONTH_DEFINITIONS.map(definition => ({ ...buildChart(options, definition), month: definition.month })); }

  function interpretSeasonalIngressChart(chart) {
    const focus = new Map();
    for (const [body, placement] of Object.entries(chart.placements || {})) {
      const house = Number(placement.house), current = focus.get(house) || { house, topic: HOUSES[house][0], priority: 0, bodies: [] };
      current.priority += 1 + ([1, 4, 7, 10].includes(house) ? 2 : 0) + (['Sun', 'Moon'].includes(body) ? 1 : 0); current.bodies.push(body); focus.set(house, current);
    }
    const focusAreas = [...focus.values()].sort((a, b) => b.priority - a.priority || a.house - b.house).slice(0, 3);
    const convert = item => ({ bodies: [...item.bodies], aspect: item.type, orb: Number(item.orb), text: `${item.bodies.map(body => PLANETS[body] || body).join('と')}の作用（ずれ${Number(item.orb).toFixed(1)}度）` });
    const supports = chart.aspects.filter(item => ['sextile', 'trine'].includes(item.type)).map(convert), pressures = chart.aspects.filter(item => ['square', 'opposition'].includes(item.type)).map(convert);
    const conclusion = pressures.length > supports.length + 1 ? '調整と危機管理を優先したい季節です。' : supports.length > pressures.length + 1 ? '準備してきた政策や協力を前へ進めやすい季節です。' : '前進できる分野と慎重な調整が必要な分野が混在する季節です。';
    const primary = focusAreas[0], pressure = pressures[0], support = supports[0];
    const direction = pressure ? `${pressure.bodies.map(body => PLANETS[body] || body).join('と')}の要求がぶつかりやすい傾向です。発表や実施の前に、費用・安全・責任分担を確認してください。` : support ? `${support.bodies.map(body => PLANETS[body] || body).join('と')}を結ぶ計画は進めやすい傾向です。担当者・期限・予算を決めてください。` : `${HOUSES[primary.house][2]}ことが現実的な対応です。`;
    return { schemaId: 'koyomi-mundane-seasonal-reading-v1', chartType: chart.chartType, nameJa: chart.nameJa, conclusion, narrative: `${conclusion}特に「${primary.topic}」が表に出やすく、${HOUSES[primary.house][1]}が確認点です。${direction}`, focusAreas, observationPoints: focusAreas.slice(0, 2).map(item => ({ house: item.house, topic: item.topic, text: HOUSES[item.house][1] })), recommendedActions: focusAreas.slice(0, 2).map(item => ({ house: item.house, topic: item.topic, text: HOUSES[item.house][2] })), supports, pressures, evidence: focusAreas.map(item => ({ type: 'house', house: item.house, bodies: item.bodies, text: `${item.house}室の${item.topic}が優先テーマです。` })), uncertainties: [...(chart.warnings || [])], suppressedClaims: ['具体的な事件・災害・市場価格・選挙結果は、この四季図だけでは断定しません。'] };
  }

  function synthesizeSeasonalIngressReadings(readings) {
    const topics = new Map();
    for (const reading of readings) for (const area of reading.focusAreas) { const item = topics.get(area.house) || { house: area.house, topic: area.topic, appearances: 0, priority: 0 }; item.appearances += 1; item.priority += area.priority; topics.set(area.house, item); }
    const focusAreas = [...topics.values()].sort((a, b) => b.appearances - a.appearances || b.priority - a.priority).slice(0, 3), supportCount = readings.reduce((sum, item) => sum + item.supports.length, 0), pressureCount = readings.reduce((sum, item) => sum + item.pressures.length, 0);
    const conclusion = pressureCount > supportCount + 2 ? '年間を通じて、急いで広げるより調整と備えを優先したい流れです。' : supportCount > pressureCount + 2 ? '年間を通じて、協力関係と既存計画を具体化しやすい流れです。' : '年間を通じて、前進と調整を分野ごとに使い分ける流れです。';
    return { schemaId: 'koyomi-mundane-seasonal-summary-v1', conclusion, narrative: `${conclusion}最も繰り返し現れるのは「${focusAreas[0].topic}」です。年間判断では、${HOUSES[focusAreas[0].house][1]}を継続して比べてください。`, focusAreas, observationPoints: focusAreas.map(item => ({ house: item.house, topic: item.topic, text: HOUSES[item.house][1] })), supportCount, pressureCount, uncertainties: [...new Set(readings.flatMap(item => item.uncertainties || []))], disclaimer: '社会全体の傾向を読む材料です。具体的な出来事を断定するものではありません。' };
  }

  function buildMonthlyTrend(charts, readings) {
    const orbLimit = { sextile: 4, trine: 5, square: 5, opposition: 6 };
    const indexOf = items => Math.min(100, Math.round(items.reduce((sum, item) => sum + Math.max(0, 1 - item.orb / (orbLimit[item.aspect] || 6)) * 100, 0) / 3));
    const sign = item => `${[...item.bodies].sort().join('-')}:${item.type}`;
    return charts.map((chart, index) => {
      const reading = readings[index], previous = charts[index - 1]; let changeIndex = null;
      if (previous) {
        const bodies = Object.keys(chart.placements).filter(body => previous.placements[body]), moved = bodies.filter(body => chart.placements[body].house !== previous.placements[body].house).length;
        const current = new Set(chart.aspects.map(sign)), prior = new Set(previous.aspects.map(sign)), union = new Set([...current, ...prior]), changed = [...union].filter(value => current.has(value) !== prior.has(value)).length;
        changeIndex = Math.round(Math.min(1, (bodies.length ? moved / bodies.length : 0) * 0.6 + (union.size ? changed / union.size : 0) * 0.4) * 100);
      }
      const supportIndex = indexOf(reading.supports), pressureIndex = indexOf(reading.pressures);
      return { month: chart.month, nameJa: chart.nameJa, supportIndex, pressureIndex, changeIndex, plainReading: describeMonthlyIndex(supportIndex, pressureIndex, changeIndex), dominantTopic: reading.focusAreas[0]?.topic || '複数分野', narrative: reading.narrative, observationPoints: reading.observationPoints, recommendedActions: reading.recommendedActions, basis: { supportiveAspects: reading.supports.length, pressureAspects: reading.pressures.length, formula: '角度の許容範囲への近さを各100として合計し、3件相当で100に換算。変動は前月からハウスが変わった天体60%と主要角の入れ替わり40%。' } };
    });
  }

  function describeMonthlyIndex(support, pressure, change) {
    const supportLevel = support < 25 ? '小さい' : support < 50 ? 'やや目立つ' : support < 75 ? '強い' : '非常に強い', pressureLevel = pressure < 25 ? '小さい' : pressure < 50 ? 'やや目立つ' : pressure < 75 ? '強い' : '非常に強い', changeLabel = change === null ? '年間比較の起点' : change < 35 ? '前月の流れを引き継ぐ' : change < 65 ? '前月から変化あり' : '流れの切り替わりが大きい';
    let stance = '様子を見る', summary = '追い風と圧力の差が小さいため、条件を確認しながら小さく進める月です。';
    if (support >= 60 && pressure >= 60) { stance = '動く前に条件確認'; summary = '動きは大きい一方で衝突も増えやすいため、進める条件と止める条件を先に決める月です。'; }
    else if (support - pressure >= 20) { stance = '準備済みなら進める'; summary = '圧力より追い風が目立ちます。準備済みの計画を一段進める候補月です。'; }
    else if (pressure - support >= 20) { stance = '確認と調整を優先'; summary = '追い風より圧力が目立ちます。新規拡大より、費用・安全・責任の確認を優先する月です。'; }
    else if (support < 25 && pressure < 25) { stance = '急がず土台を整える'; summary = '強い追い風も圧力も少ないため、準備・整理・情報収集に使いやすい月です。'; }
    return { stance, summary, supportLevel, pressureLevel, changeLabel };
  }

  function summarizeMonthlyTrend(trend) {
    const forward = [...trend].sort((a, b) => (b.supportIndex - b.pressureIndex) - (a.supportIndex - a.pressureIndex))[0], caution = [...trend].sort((a, b) => (b.pressureIndex - b.supportIndex) - (a.pressureIndex - a.supportIndex))[0], change = [...trend].filter(item => item.changeIndex !== null).sort((a, b) => b.changeIndex - a.changeIndex)[0];
    return { headline: `${forward.month}月は準備済みの計画を進める候補、${caution.month}月は確認と調整を優先する候補です。`, forward: { month: forward.month, reason: `追い風${forward.supportIndex}、圧力${forward.pressureIndex}` }, caution: { month: caution.month, reason: `圧力${caution.pressureIndex}、追い風${caution.supportIndex}` }, turningPoint: change ? { month: change.month, reason: `前月からの変動${change.changeIndex}` } : null, note: '候補月は行動の保証ではありません。各月の「確認」と「備え」を現実の判断に使ってください。' };
  }

  root.KOYOMI_MUNDANE_BROWSER_CORE = Object.freeze({ buildSeasonalIngressCharts, buildMonthlyIngressCharts, interpretSeasonalIngressChart, synthesizeSeasonalIngressReadings, buildMonthlyTrend, describeMonthlyIndex, summarizeMonthlyTrend });
})(typeof window === 'undefined' ? globalThis : window);
