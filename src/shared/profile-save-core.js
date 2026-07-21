(function exposeProfileSaveCore(global) {
  'use strict';

  function normalizeIdentity(value) {
    return String(value || '').replace(/[\s　]/g, '').toLowerCase();
  }

  function findDuplicateProfiles(profiles, candidate) {
    return (profiles || []).filter(profile => (
      profile.id !== candidate.id &&
      normalizeIdentity(profile.displayName) === normalizeIdentity(candidate.displayName) &&
      (!candidate.birthData.date || profile.birthData?.date === candidate.birthData.date) &&
      (!candidate.birthData.place?.city || profile.birthData?.place?.city === candidate.birthData.place.city)
    ));
  }

  function getPath(object, path) {
    return path.split('.').reduce((value, key) => value?.[key], object);
  }

  function collectProfileChanges(previous, next, importantFields) {
    if (!previous) return [];
    const changes = [];
    for (const [field, label] of Object.entries(importantFields || {})) {
      const before = getPath(previous, field);
      const after = getPath(next, field);
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push({ field, label, before: before ?? '', after: after ?? '' });
      }
    }
    return changes;
  }

  global.KOYOMI_PROFILE_SAVE_CORE = Object.freeze({
    findDuplicateProfiles,
    collectProfileChanges
  });
})(window);
