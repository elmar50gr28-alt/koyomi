# KOYOMI 地震活動・マンデン仮説 過去検証レポート

このレポートは研究用です。地震予知、発生確率、日時指定の警報、安全宣言ではありません。

## 結論

研究継続。探索コホートと標準ライブラリ基盤では採用判断を行わず、独立ホールドアウトと多重比較補正後の再現性確認が必要です。

## データ取得

- 使用データ源: USGS ComCat FDSN Event API
- 取得イベント件数: 11651
- 除外件数: 0

## 主評価

- 20地震コホート処理件数: 20
- 窓別結果件数: 2800
- 空振り・対照候補件数: 18

## 統計

- 統計検定件数: 1
- 効果量要約: {'testId': 'primary_500km_7d_m45_score_count_correlation', 'method': 'exploratory Pearson-style correlation normal approximation', 'n': 20, 'effectSize': -0.0237, 'pValueApprox': 0.922173, 'multipleComparisonAdjusted': 'not_claimed', 'interpretation': 'research_only_no_probability_claim'}

## KOYOMI搭載判断

検証が独立データで十分に確認されるまでは、KOYOMI本体へ地震予知・警報・確率表示として搭載しません。研究表示を行う場合も公的機関情報を優先する注意書きを必須にします。

## 未解決

- ISC/ISC-GEM/JMA fallback ingestion is scaffolded but not yet implemented.
- Finite fault polygons and slab-depth classification require external geologic datasets.
- Poisson regression, ROC-AUC, PR-AUC, calibration, and FDR correction require the next statistics phase.
- Event cohort seed values are re-confirmed by catalog search where USGS returns candidates; remaining not_confirmed cases need human review.
