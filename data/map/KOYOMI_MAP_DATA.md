# KOYOMI offline base map data

- Dataset: Natural Earth Vector
- Scale: 1:50m
- Upstream commit: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source files: `ne_50m_admin_0_countries.geojson`, `ne_50m_lakes.geojson`
- License: Public Domain（`NATURAL_EARTH_LICENSE.md`参照）
- Transformation: GeoJSONの座標は変更せず、KOYOMI基本図で不要な属性を除去してminifyした。

この基本図はzoom 0〜2を中心とするオフライン表示用であり、国境・係争地域・地名の法的または政治的な正本ではない。詳細道路、建物、行政区画、最新の地理変更は含まない。
