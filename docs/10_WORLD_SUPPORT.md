# World Support Specification

## Global Requirements

- Non-Japanese names
- Multiple scripts
- Original spelling and transliteration
- Overseas birthplaces
- IANA time zones
- Historical UTC offsets
- Daylight saving time
- Locale and language awareness

## Smartphone-Derived Information

Available without permission:

- Current date/time
- IANA time zone
- Language
- Locale
- Screen orientation
- Online status

Requires explicit action and permission:

- Current location
- Latitude/longitude
- Location accuracy
- Current heading
- DeviceOrientation
- DeviceMotion

Forbidden:

- Permission request on startup
- Automatically setting current location as birthplace
- Treating current time zone as birth time zone
- Blocking the app when permission is denied

Store source metadata:

- `source`
- `acquiredAt`
- `accuracy`
- `manuallyEdited`
- `permissionState`

