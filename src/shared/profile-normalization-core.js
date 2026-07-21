(function exposeProfileNormalizationCore(global) {
  'use strict';

  const REQUIRED_DEPENDENCIES = ['text', 'createId', 'clone', 'autoNameData'];
  const KNOWN_FIELDS = new Set([
    'id', 'personId', 'isPrimaryPerson', 'schemaVersion', 'displayName',
    'legalName', 'reading', 'nickname', 'relationshipTags', 'gender', 'icon',
    'imageData', 'memo', 'favorite', 'isMain', 'temporary', 'birthData',
    'nameData', 'optionalData', 'privacySettings', 'createdAt', 'updatedAt',
    'lastUsedAt', 'unknownFields'
  ]);

  function createProfileNormalizer(options = {}) {
    const { schemaVersion, relations = [], now = () => new Date().toISOString() } = options;
    for (const name of REQUIRED_DEPENDENCIES) {
      if (typeof options[name] !== 'function') throw new TypeError(`profile normalizer requires ${name}`);
    }
    const { text, createId, clone, autoNameData } = options;

    return function normalizeProfile(profile = {}) {
      const raw = clone(profile) || {};
      const birth = raw.birthData || {};
      const place = birth.place || {};
      const name = raw.nameData || {};
      const optional = raw.optionalData || {};
      const privacy = raw.privacySettings || {};
      const timestamp = now();
      const id = text(raw.id, 100) || createId('person');

      const normalized = {
        id,
        schemaVersion,
        displayName: text(raw.displayName, 80),
        legalName: text(raw.legalName, 100),
        reading: text(raw.reading, 100),
        nickname: text(raw.nickname, 80),
        relationshipTags: Array.from(new Set(
          (raw.relationshipTags || []).map(value => text(value, 30)).filter(value => relations.includes(value))
        )),
        gender: ['male', 'female', 'other', ''].includes(raw.gender) ? raw.gender : '',
        icon: text(raw.icon, 10) || '◉',
        imageData: /^data:image\/(png|jpeg|webp);base64,/i.test(raw.imageData || '') ? raw.imageData : '',
        memo: text(raw.memo, 4000),
        favorite: !!raw.favorite,
        isMain: !!raw.isMain,
        temporary: !!raw.temporary,
        birthData: {
          ...birth,
          date: text(birth.date, 10),
          time: text(birth.time, 5),
          timeUnknown: !!birth.timeUnknown,
          timeRange: { from: text(birth.timeRange?.from, 5), to: text(birth.timeRange?.to, 5) },
          timeAccuracy: ['verified', 'family-memory', 'approximate', 'day-period-only', 'unknown'].includes(birth.timeAccuracy) ? birth.timeAccuracy : 'unknown',
          place: {
            ...place,
            label: text(place.label, 160), country: text(place.country, 80),
            prefecture: text(place.prefecture, 80), city: text(place.city, 100),
            postalCode: text(place.postalCode, 12),
            latitude: place.latitude !== null && place.latitude !== '' && Number.isFinite(+place.latitude) ? +place.latitude : null,
            longitude: place.longitude !== null && place.longitude !== '' && Number.isFinite(+place.longitude) ? +place.longitude : null,
            timezone: text(place.timezone, 80),
            utcOffset: Number.isFinite(+place.utcOffset) ? +place.utcOffset : 9,
            precision: text(place.precision, 40), source: text(place.source, 80)
          },
          daylightSavingTime: !!birth.daylightSavingTime,
          localTimeCorrection: !!birth.localTimeCorrection,
          trueSolarTime: !!birth.trueSolarTime,
          confidenceNote: text(birth.confidenceNote, 300)
        },
        nameData: autoNameData(text(raw.displayName, 80), {
          ...name,
          surname: text(name.surname, 80), givenName: text(name.givenName, 80),
          maidenName: text(name.maidenName, 80), alias: text(name.alias, 100),
          stageName: text(name.stageName, 100), hiragana: text(name.hiragana, 120),
          katakana: text(name.katakana, 120), kanji: text(name.kanji, 120),
          oldGlyph: text(name.oldGlyph, 120), newGlyph: text(name.newGlyph, 120),
          glyphMode: ['new', 'old', 'registered', 'manual'].includes(name.glyphMode) ? name.glyphMode : 'new',
          divinationName: text(name.divinationName, 140), reading: text(name.reading, 120),
          strokeOverrides: text(name.strokeOverrides, 1000),
          strokeMethod: ['standard', 'old', 'new', 'manual'].includes(name.strokeMethod) ? name.strokeMethod : 'standard',
          middleName: text(name.middleName, 80), compoundSurname: text(name.compoundSurname, 120),
          romanizedName: text(name.romanizedName, 160), originalSpelling: text(name.originalSpelling, 160),
          variantGlyph: text(name.variantGlyph, 160), divinationGlyph: text(name.divinationGlyph, 160),
          transliterationSystem: text(name.transliterationSystem, 80) || 'auto'
        }),
        optionalData: {
          ...optional,
          bloodType: ['A', 'B', 'O', 'AB', 'unknown'].includes(optional.bloodType) ? optional.bloodType : 'unknown',
          occupation: text(optional.occupation, 120), occupationMajor: text(optional.occupationMajor, 60),
          marriageStatus: text(optional.marriageStatus, 30), mainTheme: text(optional.mainTheme, 200),
          importantDates: {
            met: text(optional.importantDates?.met, 10), dating: text(optional.importantDates?.dating, 10),
            marriage: text(optional.importantDates?.marriage, 10), career: text(optional.importantDates?.career, 10),
            move: text(optional.importantDates?.move, 10), other: text(optional.importantDates?.other, 10)
          },
          memo: text(optional.memo, 5000)
        },
        privacySettings: {
          usePseudonym: !!privacy.usePseudonym, hideBirthYear: !!privacy.hideBirthYear,
          lockMemo: !!privacy.lockMemo,
          retention: ['forever', 'session', '24h', '7d', '30d', '1y'].includes(privacy.retention) ? privacy.retention : 'forever'
        },
        createdAt: raw.createdAt || timestamp,
        updatedAt: timestamp,
        lastUsedAt: raw.lastUsedAt || null
      };

      normalized.personId = text(raw.personId || normalized.id, 100) || normalized.id;
      normalized.isPrimaryPerson = !!(raw.isPrimaryPerson || normalized.isMain);
      const unknownFields = { ...(raw.unknownFields || {}) };
      Object.keys(raw).forEach(key => { if (!KNOWN_FIELDS.has(key)) unknownFields[key] = raw[key]; });
      normalized.unknownFields = unknownFields;
      return normalized;
    };
  }

  global.KOYOMI_PROFILE_NORMALIZATION_CORE = Object.freeze({ createProfileNormalizer });
})(window);
