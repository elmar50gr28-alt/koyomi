(function (root, factory) {
  const api = factory(root.KOYOMI_DAILY_READING_CORE);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_DAILY_READING = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  const STORAGE_KEY = 'koyomi.daily-reading.v2';
  const MAX_HISTORY = 90;
  function hash(value) { let h = 2166136261; for (const char of String(value || '')) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return (h >>> 0).toString(16); }
  function read(storage) { try { const value = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}'); return { cache: value?.cache && typeof value.cache === 'object' && !Array.isArray(value.cache) ? value.cache : {}, history: Array.isArray(value?.history) ? value.history.filter(item => item && typeof item.date === 'string') : [] }; } catch { return { cache: {}, history: [] }; } }
  function write(storage, value) { try { storage?.setItem(STORAGE_KEY, JSON.stringify(value)); return true; } catch { return false; } }
  function cacheKey(input) { return [input.profileId, input.profileRevision || 0, input.date, core?.VERSION || '0', hash(JSON.stringify([input.settingsHash || 'default', input.dayKey, input.dailyScore, input.themeCategory, input.themeIds, input.longTermDomain, input.longTermScore, input.confidence, input.contradiction, input.recommendedTime, input.evidence]))].join('|'); }
  function getOrCreate(input, options = {}) {
    if (!core) throw new Error('daily-reading-core-unavailable');
    const storage = options.storage || globalThis.localStorage;
    const state = read(storage), key = cacheKey(input);
    if (!options.force && state.cache[key]) return { reading: state.cache[key], source: 'cache' };
    const history = core.recentHistory(input, state.history);
    const reading = core.generate(input, history);
    state.cache[key] = reading;
    state.history = [{ cacheKey: key, profileId: reading.profileId, date: reading.date, focusId: reading.focusId, focusLabel: reading.focusLabel, actionId: reading.actionId, cautionId: reading.cautionId, structureId: reading.structureId, sceneId: reading.sceneId, intensity: reading.intensity, conclusionPatternId: reading.conclusionPatternId, fingerprint: reading.fingerprint }, ...state.history.filter(item => !(item.profileId === reading.profileId && item.date === reading.date))];
    // Retain up to 90 records per profile, so another person's use cannot erase the 30-day window.
    const counts = new Map();
    state.history.sort((a, b) => b.date.localeCompare(a.date));
    state.history = state.history.filter(item => { const count = (counts.get(item.profileId) || 0) + 1; counts.set(item.profileId, count); return count <= MAX_HISTORY; });
    const validKeys = new Set(state.history.map(item => item.cacheKey || Object.keys(state.cache).find(candidate => candidate.startsWith(`${item.profileId}|`) && candidate.includes(`|${item.date}|`))).filter(Boolean));
    for (const candidate of Object.keys(state.cache)) if (!validKeys.has(candidate)) delete state.cache[candidate];
    write(storage, state);
    return { reading, source: 'generated' };
  }
  function recent(profileId, options = {}) { return read(options.storage || globalThis.localStorage).history.filter(item => item.profileId === profileId); }
  return Object.freeze({ STORAGE_KEY, getOrCreate, recent, cacheKey });
});
