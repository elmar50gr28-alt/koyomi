(function exposeCalendarTimeCore(global) {
  'use strict';

  const pad = value => String(value).padStart(2, '0');

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatLocalDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseLocalDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T12:00:00`);
    return isNaN(date) ? null : date;
  }

  function formatCalendarDate(date, calendar, locale = 'ja-JP') {
    try {
      return new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return 'この環境では未対応';
    }
  }

  global.KOYOMI_CALENDAR_TIME_CORE = Object.freeze({
    formatLocalDate,
    parseLocalDate,
    startOfLocalDay,
    formatCalendarDate
  });
})(window);
