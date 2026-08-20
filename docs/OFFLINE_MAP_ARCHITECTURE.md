# KOYOMI Offline Map Architecture v1

## 採用範囲

MapLibre GL JS 5.24.0の公式npm配布物を`vendor/maplibre-gl/5.24.0/`へ固定し、JavaScriptとCSSのCDN依存を廃止する。基本世界地図はNatural Earth 1:50mの国土・国境・湖をローカルGeoJSONとして保持する。styleは文字、glyph、sprite、外部画像、外部tileを参照しない。

Natural EarthはPublic Domainだが、KOYOMIでは出典をattributionへ表示する。国境・係争地域・地名は法的または政治的な正本ではなく、オフライン基本図としてのみ利用する。詳細道路、建物、行政区画はこの工程に含めない。

## キャッシュ分離

- `SHELL_CACHE`: KOYOMI本体、占術・暦・H3計算。必須資産なのでinstall失敗を通知する。
- `MAP_CORE_CACHE`: MapLibre、CSS、最小style、Natural Earth基本図、ライセンス。各資産を個別取得し、地図取得失敗でshell installを失敗させない。
- `MAP_REGION_CACHE`: 次工程の地域別vector tile保存用。現時点では空で確保する。
- `RUNTIME_CACHE`: HTMLと通常データの再検証キャッシュ。

地図基本資産はcache-firstとし、未保存時だけnetworkから同一originの固定資産を取得する。世界全域の詳細tileを`APP_SHELL`へ追加しない。

## オフライン時の機能

一度Map Coreの保存が成功すれば、通信なしで以下を表示できる。

- Natural Earth 50m基本世界地図
- H3セルとマンデン実験指標
- 保存済みValidation事象と震源マーカー
- 同一セル、近傍ring、セル中心距離

Map Coreが未保存または破損していても、マンデン四季図、H3計算、研究結果を止めない。

## 未実装

- 地域別vector tileの選択保存
- 容量見積もり、保存進捗、キャンセル、削除
- 詳細道路、建物、地名glyph
- 世界全域の詳細オフライン地図
- 実機iPhoneでのStorage quotaとキャッシュ消去耐性検証
