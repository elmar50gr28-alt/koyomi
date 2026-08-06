(function (root) {
  'use strict';
  function parseIsoDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return { year, month, day, iso: `${match[1]}-${match[2]}-${match[3]}` };
  }
  function todayIso(now) {
    const date = now instanceof Date ? now : new Date();
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function normalizeIsoDate(value, options) {
    const parsed = parseIsoDate(value);
    if (!parsed) return '';
    const maximum = parseIsoDate(options && options.max ? options.max : todayIso());
    return maximum && parsed.iso <= maximum.iso ? parsed.iso : '';
  }
  function formatJapaneseDate(value) {
    const parsed = parseIsoDate(value);
    return parsed ? `${parsed.year}年${parsed.month}月${parsed.day}日` : '';
  }
  root.KOYOMI_NATIVE_DATE_PICKER_CORE = Object.freeze({ parseIsoDate, todayIso, normalizeIsoDate, formatJapaneseDate });
})(typeof window !== 'undefined' ? window : globalThis);
