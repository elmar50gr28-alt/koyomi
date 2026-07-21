# Bazi birth-time preparation extraction

Profile normalization, local birth datetime creation, longitude correction,
solar-term lookup and warning collection are now grouped in
`src/bazi/chart/birth-time.js`.

The implementation preserves the exact former call sequence. It does not add
timezone conversion, daylight-saving rules or a new day-boundary policy.
School settings continue to pass unchanged to the pillar foundation.

Equivalence coverage includes known and unknown birth times, missing
longitude, correction across midnight, and both currently represented
day-boundary settings.
