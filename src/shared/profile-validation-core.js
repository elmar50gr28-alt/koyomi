(function exposeProfileValidationCore(global) {
  'use strict';

  function validateProfile(profile) {
    const errors = [];

    if (!profile.displayName || !profile.displayName.trim()) {
      errors.push('表示名を入力してください');
    }

    if (profile.birthData.date) {
      const date = new Date(`${profile.birthData.date}T12:00:00`);
      if (Number.isNaN(date.getTime())) {
        errors.push('存在しない生年月日です');
      } else if (date > new Date()) {
        errors.push('未来の生年月日は保存できません');
      }
    }

    if (profile.birthData.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(profile.birthData.time)) {
      errors.push('出生時刻が不正です');
    }

    const latitude = profile.birthData.place.latitude;
    const longitude = profile.birthData.place.longitude;
    if (latitude != null && (latitude < -90 || latitude > 90)) {
      errors.push('緯度は-90〜90で入力してください');
    }
    if (longitude != null && (longitude < -180 || longitude > 180)) {
      errors.push('経度は-180〜180で入力してください');
    }

    return errors;
  }

  global.KOYOMI_PROFILE_VALIDATION_CORE = Object.freeze({ validateProfile });
})(window);
