# Unified Profile Specification

## Principle

- Every divination system shares one person profile by `personId`.
- Required information must not be deleted.
- Remove duplicate entry, not data.
- Generate derived values from base input when possible.
- Support global names, birthplaces, and time systems.
- Preserve saved person data.

## Basic Inputs on Normal Screen

1. Name
2. Birth date
3. Birth time
4. Birth time unknown
5. Birthplace
6. Gender only when a selected system or school needs it
7. Relationship or short memo, optional

## Detailed Settings

Name-related fields:

- Family name
- Given name
- Middle name
- Prefix and suffix
- Original spelling
- Local script
- Reading
- Romanization
- Old glyphs and variants
- Glyphs used for name divination
- Display name and nickname, optional

Birth-related fields:

- Country
- Region
- City
- Latitude
- Longitude
- IANA time zone
- UTC offset at birth
- Daylight saving time
- Time accuracy
- Standard time
- Local mean time
- True solar time
- Zi hour 23:00/00:00 setting
- School-specific correction

## Duplication Rules

- Do not require name, display name, and nickname all at once.
- Do not ask for the same name again for name divination and numerology.
- Do not require both hiragana and katakana.
- Do not require birthplace, address, coordinates, and time zone all manually.
- Editing an existing person must not create a new person.
- Do not ask for birth date again per divination system.

## Autosave

- Debounce 500-800ms.
- Update by `personId`.
- One person has one record.
- Restore after reload and app restart.
- Preserve unknown fields where possible.
- Migrations are idempotent.
- Do not redraw the whole form during save.
- Saving must not change scroll position.

## Birthplace

Normal screen shows one search field. After selection, save internally:

- `countryCode`
- `countryName`
- `region`
- `locality`
- `displayName`
- `latitude`
- `longitude`
- `ianaTimeZone`
- `utcOffsetAtBirth`
- `daylightSavingAtBirth`
- `source`
- `accuracy`
- `manuallyEdited`

Move these out of the normal screen:

- Postal code
- Town block
- Street number
- Building name
- Kana address
- Manual latitude/longitude
- Manual UTC offset
- Manual daylight saving time

Input methods:

- World city/region search
- Map selection
- Current location
- Manual entry
- Unknown

Never save current location as birthplace automatically. Require explicit "use as birthplace" confirmation.

Birthplace accuracy:

- `exact`
- `city`
- `region`
- `country`
- `unknown`

## Family and Important People

General UI must use "家族・大切な人", not "人物台帳".

Card display:

- Display name
- Birth date
- Relationship or memo

Tap the whole card to edit. The main visible action is "＋ 人物を追加". Do not line up duplicate/delete on cards. Delete belongs at the bottom of edit screen with confirmation.

