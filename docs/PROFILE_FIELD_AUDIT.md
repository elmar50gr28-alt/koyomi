# KOYOMI Profile Field Audit

Date: 2026-07-16  
Branch: `feature/mobile-profile-redesign`  
Source files audited: `app.html`, `docs/*.md`

This audit was created before implementation. No field is deleted based on appearance alone; each field below is preserved, moved, or hidden according to current references and the master specification.

## Summary

- Primary persistent profile storage is the IndexedDB `profiles` store handled by `ledgerCollectProfile()`, `ledgerNormalizeProfile()`, `ledgerFillProfile()`, and `ledgerPut('profiles', ...)`.
- `personalForm` is the current reading input surface and still contains duplicated person fields.
- `ledgerProfileForm` is the shared profile edit surface and is the correct target for unified person data.
- Compatibility and Qimen screens can already consume a saved profile through `ledgerApplyCompat()` and `ledgerUseProfile()`.
- The safest implementation path is DOM reorganization and wrapper functions that preserve all current IDs and storage keys.

## Field Audit Table

| fieldId | UIラベル | 保存キー | データ型 | 使用占術 | 必須度 | 重複候補 | 自動生成可能 | スマホ取得可能 | 通常画面 | 詳しい設定 | 内部専用 | 旧データ移行 | 備考 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| lpId | hidden id | profile.id/personId | string | all | required internal | none | yes once | no | no | no | yes | keep | Must not change during edit. |
| lpCreatedAt | hidden createdAt | profile.createdAt | ISO string | all | internal | none | yes | no | no | no | yes | keep | Preserve legacy timestamp. |
| lpDisplayName | 表示名 | profile.displayName | string | all, numerology/name fallback | required | name/legalName/nickname | yes from name parts | no | yes as 氏名 | no | no | map from name/legalName | Current required display name becomes normal name input. |
| lpLegalName | 本名 | profile.legalName | string | name divination, numerology | optional | displayName | partially | no | no | yes | no | keep | World original/legal name. |
| lpReading | ふりがな | profile.reading | string | name divination, onkan | conditional | lpNameReading/hiragana/katakana | partially | no | no | yes | no | keep | Do not require on normal screen. |
| lpNickname | ニックネーム | profile.nickname | string | display only | optional | displayName | no | no | no | yes | no | keep | Remove from normal screen. |
| lpGender | 性別 | profile.gender | enum | Bazi luck direction when school requires, compatibility | conditional | none | no | no | yes optional | no | no | keep | Explain why optional. |
| lpIcon | アイコン | profile.icon | string | UI only | optional | image | yes default | no | no | yes | no | keep | UI preference. |
| lpRelationships | 関係性 | profile.relationshipTags[] | array | compatibility/context | optional | memo | no | no | yes as 続柄 | no | no | keep | Should remain lightweight. |
| lpImage | プロフィール画像 | profile.imageData | file/data URL | UI only | optional | icon | no | camera/photo with explicit action | no | yes | no | keep | Sensitive data; detailed settings. |
| lpImageData | hidden image data | profile.imageData | data URL | UI only | internal | lpImage | yes from file | no | no | no | yes | keep | Device storage only. |
| lpFavorite | お気に入り | profile.favorite | boolean | UI sorting | optional | none | no | no | no | yes | no | keep | Admin/list preference. |
| lpMain | メインプロフィール | profile.isMain | boolean | startup/profile selection | optional | settings.mainProfileId | no | no | no | yes | no | keep | Not normal input. |
| lpTemporary | 一時プロフィール | profile.temporary | boolean | privacy/retention | optional | lpRetention | no | no | no | yes | no | keep | Privacy detail. |
| lpMemo | 基本メモ | profile.memo | string | context/compatibility | optional | optionalData.memo | no | no | yes | no | no | keep | Used as relationship/short memo. |
| lpBirthDate | 生年月日 | profile.birthData.date | date string | Bazi, Sukuyo, Nine Star, Western, numerology, compatibility | required/conditional | personal birthDate | no | no | yes | no | no | map from old birthDate | Core field. |
| lpTimeUnknown | 出生時刻は不明 | profile.birthData.timeUnknown | boolean | Bazi, Western confidence | conditional | timeAccuracy unknown | yes from missing time | no | yes | no | no | infer from missing time | Must not force noon visually. |
| lpBirthTime | 出生時刻 | profile.birthData.time | HH:mm | Bazi, Western, day-boundary systems | conditional | personal birthTime | no | no | yes | no | no | map from old birthTime | Disabled when unknown. |
| lpTimeFrom | 推定時刻・開始 | profile.birthData.timeRange.from | HH:mm | Bazi/Western confidence | optional | lpBirthTime | no | no | no | yes | no | keep | Expert precision. |
| lpTimeTo | 推定時刻・終了 | profile.birthData.timeRange.to | HH:mm | Bazi/Western confidence | optional | lpBirthTime | no | no | no | yes | no | keep | Expert precision. |
| lpTimeAccuracy | 出生情報の確度 | profile.birthData.timeAccuracy | enum | Bazi, Western, Sukuyo confidence | conditional | lpTimeUnknown | yes | no | no | yes | no | map from birthTimeAccuracy | Expert/readiness field. |
| lpBirthPlaceLabel | 出生地 | profile.birthData.place.label | string | Bazi, Western, Sukuyo conditional | required/conditional | country/pref/city/postal | partially from search | location only with explicit action | yes | no | no | map from birthPlace/postalPlace | Normal screen single birthplace field. |
| lpCountry | 国 | profile.birthData.place.country | string | world support/time zone | conditional | place label | yes from search | no | no | yes | no | keep | Detailed setting. |
| lpPrefecture | 地域 | profile.birthData.place.prefecture | string | location/time zone | conditional | place label | yes from search | no | no | yes | no | keep | Region, not Japan-only. |
| lpCity | 都市 | profile.birthData.place.city | string | location/time zone | conditional | place label | yes from search | no | no | yes | no | keep | Locality. |
| lpPostal | 郵便番号 | profile.birthData.place.postalCode | string | Japan lookup helper | optional | place search | yes from lookup | no | no | yes | no | keep | Remove from normal screen. |
| lpLatitude | 緯度 | profile.birthData.place.latitude | number | Bazi solar time, Western, Qimen location overlap | precision | place label | yes from search/location | with permission | no | yes | no | keep | Detailed/manual override. |
| lpLongitude | 経度 | profile.birthData.place.longitude | number | Bazi solar time, Western | precision | place label | yes from search/location | with permission | no | yes | no | keep | Detailed/manual override. |
| lpTimezone | 出生時UTC時差 | profile.birthData.place.utcOffset | number | Bazi, Western, day boundary | precision | timezoneName/current tz | yes from location/date | current tz only | no | yes | no | keep | Do not assume current zone. |
| lpTimezoneName | タイムゾーン名 | profile.birthData.place.timezone | string | world support, Western | precision | utcOffset | yes from search | current IANA only | no | yes | no | keep | IANA target. |
| lpDst | 夏時間適用 | profile.birthData.daylightSavingTime | boolean | Western/time conversion | precision | utcOffset | yes from timezone DB later | no | no | yes | no | keep | Detailed. |
| lpLocalCorrection | 地方時補正 | profile.birthData.localTimeCorrection | boolean | Bazi | expert | solarTime | no | no | no | yes | no | keep | Expert setting. |
| lpSolarTime | 真太陽時 | profile.birthData.trueSolarTime | boolean | Bazi | expert | schoolSolar | no | no | no | yes | no | keep | Expert setting. |
| lpBirthConfidenceNote | 確度・出典メモ | profile.birthData.confidenceNote | string | evidence | optional | timeAccuracy | no | no | no | yes | no | keep | Evidence note. |
| lpSurname | 姓 | profile.nameData.surname | string | name divination, Bazi display mapping | conditional | displayName/legalName | parse if possible | no | no | yes | no | keep | World name detail, not normal. |
| lpGivenName | 名 | profile.nameData.givenName | string | name divination | conditional | displayName/legalName | parse if possible | no | no | yes | no | keep | World name detail. |
| lpMaidenName | 旧姓 | profile.nameData.maidenName | string | name divination/compat context | optional | surname | no | no | no | yes | no | keep | Detailed. |
| lpAlias | 通称 | profile.nameData.alias | string | name/numerology context | optional | nickname/stageName | no | no | no | yes | no | keep | Detailed. |
| lpStageName | 芸名 | profile.nameData.stageName | string | name/numerology | optional | alias | no | no | no | yes | no | keep | Detailed. |
| lpNameReading | 読み方 | profile.nameData.reading | string | name divination/onkan | conditional | lpReading | partially | no | no | yes | no | keep | Detailed. |
| lpHiragana | ひらがな表記 | profile.nameData.hiragana | string | name divination | optional | reading/katakana | convert partially | no | no | yes | no | keep | Do not require. |
| lpKatakana | カタカナ表記 | profile.nameData.katakana | string | name divination/onkan | optional | reading/hiragana | convert partially | no | no | yes | no | keep | Do not require. |
| lpKanji | 漢字表記 | profile.nameData.kanji | string | name divination | conditional | displayName/legalName | from name | no | no | yes | no | keep | Detailed. |
| lpOldGlyph | 旧字体表記 | profile.nameData.oldGlyph | string | name divination | conditional | kanji/newGlyph | no | no | no | yes | no | keep | Preserve. |
| lpNewGlyph | 新字体表記 | profile.nameData.newGlyph | string | name divination | conditional | kanji/oldGlyph | no | no | no | yes | no | keep | Preserve. |
| lpGlyphMode | 使用字体 | profile.nameData.glyphMode | enum | name divination | conditional | strokeMethod | default | no | no | yes | no | keep | Expert/name setting. |
| lpDivinationName | 姓名判断で使用する名前 | profile.nameData.divinationName | string | name divination | conditional | displayName/kanji | yes from name | no | no | yes | no | keep | Detailed. |
| lpStrokeMethod | 画数計算方式 | profile.nameData.strokeMethod | enum | name divination | conditional | glyphMode | default | no | no | yes | no | keep | Expert setting. |
| lpStrokeOverrides | 画数の手動修正 | profile.nameData.strokeOverrides | string/JSON | name divination | optional | strokeMethod | no | no | no | yes | no | keep | Expert override. |
| lpBloodType | 血液型 | profile.optionalData.bloodType | enum | compatibility auxiliary | optional | none | no | no | no | yes | no | keep | Not core. |
| lpOccupation | 職業 | profile.optionalData.occupation | string | context | optional | memo | no | no | no | yes | no | keep | Detailed. |
| lpMarriageStatus | 婚姻状況 | profile.optionalData.marriageStatus | enum | compatibility/context | optional | relationship | no | no | no | yes | no | keep | Detailed. |
| lpMainTheme | 主な相談テーマ | profile.optionalData.mainTheme | string | context | optional | memo | no | no | no | yes | no | keep | Detailed. |
| lpMetDate | 知り合った日 | profile.optionalData.importantDates.met | date | compatibility/timeline | optional | other dates | no | no | no | yes | no | keep | Detailed. |
| lpDatingDate | 交際開始日 | profile.optionalData.importantDates.dating | date | compatibility/timeline | optional | other dates | no | no | no | yes | no | keep | Detailed. |
| lpMarriageDate | 結婚日 | profile.optionalData.importantDates.marriage | date | compatibility/timeline | optional | other dates | no | no | no | yes | no | keep | Detailed. |
| lpCareerDate | 転職日 | profile.optionalData.importantDates.career | date | timeline/context | optional | other dates | no | no | no | yes | no | keep | Detailed. |
| lpMoveDate | 引越日 | profile.optionalData.importantDates.move | date | timeline/location context | optional | other dates | no | no | no | yes | no | keep | Detailed. |
| lpImportantDate | その他の重要日 | profile.optionalData.importantDates.other | date | timeline/context | optional | other dates | no | no | no | yes | no | keep | Detailed. |
| lpOptionalMemo | 自由メモ | profile.optionalData.memo | string | context | optional | lpMemo | no | no | no | yes | no | keep | Detailed. |
| lpUsePseudonym | 仮名で保存 | profile.privacySettings.usePseudonym | boolean | privacy | optional | none | no | no | no | yes | no | keep | Privacy. |
| lpHideBirthYear | 生年を一覧で隠す | profile.privacySettings.hideBirthYear | boolean | UI privacy | optional | none | no | no | no | yes | no | keep | Privacy. |
| lpLockMemo | メモをロック対象にする | profile.privacySettings.lockMemo | boolean | privacy | optional | none | no | no | no | yes | no | keep | Privacy. |
| lpRetention | 保存期間 | profile.privacySettings.retention | enum | privacy/cleanup | optional | temporary | default | no | no | yes | no | keep | Privacy. |
| surname | 姓 | localStorage personal input | string | name divination, personal reading | conditional | lpSurname | from profile | no | no | yes/profile source | no | map into profile | Current duplicated reading input. |
| givenName | 名 | localStorage personal input | string | name divination, personal reading | conditional | lpGivenName | from profile | no | no | yes/profile source | no | map into profile | Duplicated. |
| name | 表示名 | localStorage personal input | string | all reading display | required fallback | lpDisplayName | from profile | no | no | no | yes | map into profile | Should be fed from selected profile. |
| birthDate | 生年月日 | localStorage personal input | date | Bazi, Sukuyo, Nine Star, Western, numerology | required | lpBirthDate | from profile | no | no | no | yes | map into profile | Reading surface duplicate. |
| birthTime | 出生時刻 | localStorage personal input | time | Bazi, Western | conditional | lpBirthTime | from profile | no | no | no | yes | map into profile | Reading surface duplicate. |
| birthTimeAccuracy | 出生時刻の確度 | localStorage personal input | enum | confidence | conditional | lpTimeAccuracy/lpTimeUnknown | from profile | no | no | no | yes | map into profile | Reading surface duplicate. |
| birthPlace | 出生地 | localStorage personal input | string | Bazi, Western | conditional | lpBirthPlaceLabel | from profile | no | no | no | yes | map into profile | Reading surface duplicate. |
| postalCode/postalCandidates/postalPrefecture/postalCity/postalTown/postalKana | 住所補助 | localStorage personal input | string/select | birthplace helper | optional | lp place fields | lookup | no | no | yes | no | map into profile | Not normal screen. |
| latitude/longitude/timezoneOffset | 座標・UTC | localStorage personal input | number | Bazi solar time, Western | precision | lpLatitude/lpLongitude/lpTimezone | lookup | current location with permission | no | yes | no | map into profile | Detailed. |
| personA/personB | 相性人物名 | compatibility input | string | compatibility | required if no profile | ledger profiles | from selected profile | no | no | no | yes | no migration | Prefer personId selection. |
| birthA/birthB | 相性生年月日 | compatibility input | date | compatibility systems | required if no profile | lpBirthDate | from selected profile | no | no | no | yes | no migration | Duplicate per-person fields. |
| birthTimeA/birthTimeB | 相性出生時刻 | compatibility input | time | compatibility precision | optional | lpBirthTime | from selected profile | no | no | no | yes | no migration | Duplicate. |
| birthPlaceA/birthPlaceB | 相性出生地 | compatibility input | string | compatibility precision | optional | lpBirthPlaceLabel | from selected profile | no | no | no | yes | no migration | Duplicate. |
| latA/lonA/tzA/latB/lonB/tzB | 相性座標・時差 | compatibility input | number | compatibility precision | optional | profile place fields | from selected profile | with permission only | no | no | yes | no migration | Internal/manual compatibility fields. |
| qmDateTime | 盤を立てる標準時 | qimen settings | datetime | Qimen | required | current date | default now | current date/time | no | separate Qimen | no | existing settings | Not person profile. |
| qmLocation/qmLat/qmLon/qmTimezone | 奇門基準地点 | qimen settings | string/number | Qimen | required | saved locations | from saved location/current location | with permission | no | Qimen location | no | existing settings | Do not treat as birthplace. |
| qmPurpose/qmQuestion/qmSituation/qmMode | 奇門相談 | qimen settings | enum/string | Qimen | required/optional | none | no | no | no | Qimen screen | no | existing settings | Not person profile. |

## Implementation Classification

Normal profile screen should keep:

- `lpDisplayName`
- `lpBirthDate`
- `lpBirthTime`
- `lpTimeUnknown`
- `lpBirthPlaceLabel`
- `lpGender`
- `lpRelationships`
- `lpMemo`

Detailed settings should contain:

- `lpLegalName`, `lpReading`, `lpNickname`, `lpIcon`, `lpImage`, `lpFavorite`, `lpMain`, `lpTemporary`
- `lpTimeFrom`, `lpTimeTo`, `lpTimeAccuracy`
- `lpCountry`, `lpPrefecture`, `lpCity`, `lpPostal`, `lpLatitude`, `lpLongitude`, `lpTimezone`, `lpTimezoneName`, `lpDst`, `lpLocalCorrection`, `lpSolarTime`, `lpBirthConfidenceNote`
- All `lpSurname` through `lpStrokeOverrides`
- All optional dates and privacy settings

Internal/profile-source fields:

- `personalForm` person fields should be populated from the selected `personId` and not treated as a separate profile.
- Compatibility person fields should be populated from selected profiles when available.
- Qimen location is not birthplace and must remain separate.

## Risks Found

- `personalForm` and `ledgerProfileForm` duplicate core person fields.
- Current `ledgerSaveProfile()` displays a success notification on every autosave.
- `ledgerScheduleProfileAutoSave()` waits 1200ms, outside the 500-800ms target.
- Current focus handling uses automatic scroll correction; it must only move when the active control is hidden.
- Card actions currently include multiple management buttons and need to be hidden from general UI without deleting code.

