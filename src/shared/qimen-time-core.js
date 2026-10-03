(function exposeQimenTimeCore(global) {
  'use strict';
  const DAY = 86400000, MINUTE = 60000;
  const mod = (n, m) => ((n % m) + m) % m;
  const pad = n => String(n).padStart(2, '0');

  function offset(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < -12 || n > 14) throw new RangeError('UTC時差は-12〜14で指定してください');
    return n;
  }
  // Legacy renderers use local getters. This Date bridge keeps a real UTC instant
  // while exposing the selected fixed-offset wall clock; it never changes global Date.
  class OffsetDate extends Date {
    constructor(instant, tz) { super(instant); this.utcOffset = offset(tz); }
    wall() { return new Date(this.getTime() + this.utcOffset * 60 * MINUTE); }
    getFullYear() { return this.wall().getUTCFullYear(); }
    getMonth() { return this.wall().getUTCMonth(); }
    getDate() { return this.wall().getUTCDate(); }
    getDay() { return this.wall().getUTCDay(); }
    getHours() { return this.wall().getUTCHours(); }
    getMinutes() { return this.wall().getUTCMinutes(); }
    getSeconds() { return this.wall().getUTCSeconds(); }
    getMilliseconds() { return this.wall().getUTCMilliseconds(); }
    getTimezoneOffset() { return -this.utcOffset * 60; }
  }
  function atOffset(date, tz) { return new OffsetDate(date.getTime(), tz); }
  function fromParts(year, month, day, hour, minute, tz, second = 0) {
    const wall = new Date(0);
    wall.setUTCFullYear(year, month, day);
    wall.setUTCHours(hour, minute, second, 0);
    return new OffsetDate(wall.getTime() - offset(tz) * 60 * MINUTE, tz);
  }
  function parseInput(value, tz, now = new Date()) {
    if (!value) return atOffset(now, tz);
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!m) throw new RangeError('盤を立てる日時を確認してください');
    const [year, month, day, hour, minute, second] = m.slice(1).map(Number);
    const date = fromParts(year, month - 1, day, hour, minute, tz, second || 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ||
        date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== (second || 0))
      throw new RangeError('盤を立てる日時を確認してください');
    return date;
  }
  function inputValue(date, tz) {
    const d = atOffset(date, tz);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function equationOfTime(date, tz) {
    const d = atOffset(date, tz);
    const start = fromParts(d.getFullYear(), 0, 0, 0, 0, tz);
    const n = (d - start) / DAY, B = 2 * Math.PI * (n - 81) / 364;
    return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  }
  function adjustedTime(date, lon, tz, basis) {
    tz = offset(tz);
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new RangeError('経度を確認してください');
    const stdMeridian = tz * 15, localMinutes = (lon - stdMeridian) * 4, eot = equationOfTime(date, tz);
    const correction = basis === 'local' ? localMinutes : basis === 'solar' ? localMinutes + eot : 0;
    return { date: new OffsetDate(date.getTime() + correction * MINUTE, tz), correction, localMinutes, eot, stdMeridian };
  }
  function calculationTimes(date, lon, tz, basis) {
    const astronomicalDate = atOffset(date, tz);
    const adjusted = adjustedTime(astronomicalDate, lon, tz, basis);
    return { astronomicalDate, clockDate: adjusted.date, adjusted };
  }
  function effectiveDayDate(date, boundary, tz) {
    const d = atOffset(date, tz);
    return new OffsetDate(d.getTime() + (Number(boundary) === 23 && d.getHours() >= 23 ? DAY : 0), tz);
  }
  function dayPillar(date, stems, branches) {
    // Civil-day number, independent of both the host timezone and UTC offset.
    const wall = new Date(0);
    wall.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    wall.setUTCHours(0, 0, 0, 0);
    const index = mod(Math.floor(wall.getTime() / DAY) + 2440588 + 49, 60);
    return { index, text: stems[index % 10] + branches[index % 12], stem: stems[index % 10],
      branch: branches[index % 12], stemIndex: index % 10, branchIndex: index % 12 };
  }
  function hourPillar(date, boundary, tz, stems, branches) {
    const d = atOffset(date, tz), dp = dayPillar(effectiveDayDate(d, boundary, tz), stems, branches);
    const h = d.getHours() + d.getMinutes() / 60;
    const branchIndex = Number(boundary) === 0 ? Math.floor(h / 2) % 12 : Math.floor(mod(h + 1, 24) / 2);
    const stemIndex = mod((dp.stemIndex % 5) * 2 + branchIndex, 10);
    let index = 0;
    for (let i = 0; i < 60; i++) if (i % 10 === stemIndex && i % 12 === branchIndex) { index = i; break; }
    return { index, stemIndex, branchIndex, stem: stems[stemIndex], branch: branches[branchIndex],
      text: stems[stemIndex] + branches[branchIndex], dayPillar: dp };
  }
  function fuTou(date, boundary, tz, stems, branches) {
    const day = effectiveDayDate(date, boundary, tz);
    let x = fromParts(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, tz);
    for (let i = 0; i < 6; i++) {
      const p = dayPillar(x, stems, branches);
      if (p.stem === '甲' || p.stem === '己') {
        const upper = ['子','午','卯','酉'].includes(p.branch), middle = ['寅','申','巳','亥'].includes(p.branch);
        return { date: x, pillar: p, yuan: upper ? 0 : middle ? 1 : 2,
          label: upper ? '上元' : middle ? '中元' : '下元', daysBack: i };
      }
      x = new OffsetDate(x.getTime() - DAY, tz);
    }
    return { date: atOffset(date, tz), pillar: dayPillar(atOffset(date, tz), stems, branches), yuan: 0, label: '上元', daysBack: 0 };
  }
  function slotDates(date, tz) {
    const d = atOffset(date, tz);
    return Array.from({ length: 12 }, (_, i) => {
      const start = fromParts(d.getFullYear(), d.getMonth(), d.getDate(), 23 + i * 2, 0, tz);
      return { i, start, end: new OffsetDate(start.getTime() + 2 * 3600000, tz) };
    });
  }
  global.KOYOMI_QIMEN_TIME_CORE = Object.freeze({ atOffset, fromParts, parseInput, inputValue,
    equationOfTime, adjustedTime, calculationTimes, effectiveDayDate, hourPillar, fuTou, slotDates });
})(typeof window === 'undefined' ? globalThis : window);

