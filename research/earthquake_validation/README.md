# KOYOMI 地震活動・マンデン仮説 過去検証

このディレクトリは、KOYOMIの研究用地震活動検証をアプリ本体から分離して実行するための独立モジュールです。

この検証は地震予知、発生確率、日時指定の警報、安全宣言を目的にしません。マンデン占星術・天文条件・潮汐近似などから作る研究用スコアが、その後の地震活動指標と統計的に関係するかを、公式カタログで検証します。

## 実行

```powershell
python -m research.earthquake_validation.src.run_validation
```

ネットワーク取得はUSGS ComCat FDSN Event APIを第一候補にします。取得結果は `data/cache/` と `data/raw/` に保存され、同じ条件では再取得しません。

## 出力

主な成果物は `outputs/` に生成されます。

- `event_level_results.csv`
- `window_level_results.csv`
- `high_score_false_alarms.csv`
- `missed_events.csv`
- `catalog_completeness.csv`
- `statistical_tests.csv`
- `sensitivity_analysis.csv`
- `validation_summary.json`
- `validation_report.md`
- `validation_report.xlsx`

Excel出力は `openpyxl` が利用できる場合のみ作成します。利用できない場合もCSV、JSON、Markdownは生成されます。

## KOYOMIへの搭載判断

検証で有効性が確認されるまでは、アプリ利用者向けに地震発生確率、地震予知、独自警報として表示してはいけません。研究表示を行う場合も、公的機関の防災情報を常に優先する注意書きを必須にします。
