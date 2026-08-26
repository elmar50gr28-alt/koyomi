# Japan prefecture boundaries

- Asset: `japan-prefectures-2026.geojson`
- Coverage date: 2026-01-01
- Original source: 国土交通省「国土数値情報（行政区域データ）N03」2026年版
- Original source page: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html
- License stated by the source: CC BY 4.0
- Attribution: 「国土数値情報（行政区域データ）」（国土交通省）を加工して作成
- Intermediate reproducible dataset: https://github.com/ricewin/simplify-japan-geojson (`GeoJson/prefecture.json`)
- Processing: dissolve by `N03_001`, Mapshaper weighted-area simplify 8% with keep-shapes, remove islands below 2 km²
- Output feature count: 47
- Output SHA-256: `6d31ec2b2f6e29bfabac5da6badca3067556922538c948d5d1c0d6795ecb6d94`

The boundary is a lightweight visual reference, not a legal boundary survey. Some original administrative boundaries are provisional. Small islands below the display threshold are intentionally omitted. Redistribution and further processing must follow the source terms, including any applicable Survey Act requirements described by the source provider.
