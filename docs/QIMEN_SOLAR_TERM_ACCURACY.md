# 奇門遁甲・2026年節入り時刻の実測比較

確認日: 2026-10-03  
対象main: bc73cc72d2a4dee36a1f475366d6d18aa8b6aebb

## 比較資料・方法

[国立天文台「令和8年(2026)暦要項 二十四節気および雑節」](https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html)の二十四節気のみ24件を、出典・発表日・確認日・中央標準時UTC+9とともに `data/qimen/naoj-solar-terms-2026.json` へ登録した。雑節は対象外。公表は分単位なので、秒を0として比較するが秒精度の公式値とは扱わない。

時刻が[太陽の視黄経の指定値への到達を表す](https://eco.mtk.nao.ac.jp/koyomi/yoko/)ことを確認した。内蔵フォールバックの近似太陽黄経と `qmdjTermStart` を変更せず、各公表時刻の1日後から直前の節入りを探索した。節気名の一致を確認し、計算時刻−公表時刻を分で記録する。時刻補正・日境界・流派・盤配置を混ぜず、UTC瞬間の天文計算のみを比較する。

再現: `node scripts/audit-qimen-solar-terms.mjs`。機械可読形式: `node scripts/audit-qimen-solar-terms.mjs --json`。終了コード0は測定の完了を表し、精度基準への合格を意味しない。

## 実行時モデルの区別と候補比較

実画面の `solarLongitude` は後段で再定義され、`v191zEphemerisActive()` が成立し `Astronomy.SunPosition` を利用できる場合はAstronomy Engineの結果を使う。前回の監査スクリプトは先頭の関数定義のみを抽出しており、6.061分／11.767分は内蔵フォールバックの測定だった。オンラインの実行時モデル全体の誤差として報告しない。本補足が前回のモデル表現を訂正する。

スクリプトの出力には測定モデルを付けた。既定は `legacy-offline-fallback`。`--bazi-candidate` は既存の四柱推命用 `solarApparentLongitude` を同じ節入り探索へ渡す未採用の候補比較である。共通関数や実画面の計算は変更しない。

| 測定対象 | 24件の平均絶対差（分） | 最大絶対差（分） | 最大差の節気 |
| --- | --- | --- | --- |
| 奇門の内蔵フォールバック | 6.061 | 11.767 | 秋分 |
| 四柱推命用内蔵視黄経の比較候補 | 5.055 | 12.636 | 立夏 |

候補は平均差が小さくなる一方、最大差が大きくなるため、この比較だけで精度改善と扱わず採用しない。Astronomy Engine経路の測定は以下の追加検証に記録する。

候補再現: `node scripts/audit-qimen-solar-terms.mjs --bazi-candidate --json`。

## Astronomy Engine 2.1.19経路の追加検証

アプリと同じ版のブラウザー配布物を公式npmパッケージから取得し、パッケージのSHA-512が配布メタデータと一致することを確認した。ブラウザーJSファイルのSHA-256も固定し、異なるファイルは測定スクリプトで拒否する。スクリプトはNode VM内で配布物と実画面の後段再定義を実行する。これは同じ実行経路の再現であり、CDN接続・ブラウザー通信障害を含む実機試験ではない。

2026年24件では平均絶対差0.350分（約21秒）、最大絶対差0.991分（約59秒、芒種）。近似式へのフォールバック呼出は0件。完全な測定結果は `data/qimen/astronomy-engine-audit-2026.json` に保存する。

公式表は分単位なので、この結果を秒単位の精度保証や全年度の誤差上限と扱わない。24件が1分以内だったことは今回の測定結果であり、採用基準の認定ではない。

検証用の取得・再現手順（リポジトリの作業コピーで実行）:

```powershell
npm pack astronomy-engine@2.1.19 --ignore-scripts --pack-destination .
New-Item -ItemType Directory -Path .qimen-audit-engine -Force
tar -xf astronomy-engine-2.1.19.tgz -C .qimen-audit-engine --strip-components=1 package/astronomy.browser.min.js package/package.json
node scripts/audit-qimen-solar-terms.mjs --astronomy-browser .qimen-audit-engine/astronomy.browser.min.js --json
```

配布元: https://registry.npmjs.org/astronomy-engine/-/astronomy-engine-2.1.19.tgz  
npm SHA-512: `8yWKNf7UeNbH458h3sAJ6ZgAjE5jTXp/mNNRFoC20j2SHwZIjAQeEsBB2Q3uCFRaTCCJRv33K2XhkhZQMXoX6w==`  
ブラウザーJS SHA-256: `f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6`

東京の既定端末時区とニューヨーク端末時区で測定結果が一致した。パス未指定、誤ったファイル、候補オプションとの併用、近似式へのフォールバックは失敗として扱う。第三者配布物は検証用ローカルファイルであり、このPRではアプリに同梱しない。

## 結果

内蔵フォールバックについて、2026年24件の平均絶対差は6.061分、最大絶対差は11.767分（秋分）。早く切り替わる場合と遅く切り替わる場合の両方がある。

| 節気 | 公表時刻（中央標準時） | 計算との差（分） |
| --- | --- | --- |
| 立春 | 2月4日05:02 | -4.000 |
| 春分 | 3月20日23:46 | -7.703 |
| 夏至 | 6月21日17:25 | -0.838 |
| 秋分 | 9月23日09:05 | +11.767 |
| 冬至 | 12月22日05:50 | +4.148 |

完全な測定結果はスクリプトから出力する。これらの小数桁は内部計算との差の表示であり、公式値や近似モデルの精度を示す桁数ではない。

## 影響と限界

切替時刻の間では公式暦と内蔵フォールバックの節気選択が異なる可能性がある。夏至・冬至は陰陽遁、他の節気も局数表や固定式三元の起点に関係する。すべての不一致時間帯で全盤が変わることや、全盤の占術的正否は今回確認していない。

分単位の公表値に対する測定であり、公式時刻の丸め方・秒値は確定していない。2026年だけの測定を他年の最大誤差保証にしない。許容誤差の合格基準は設定していない。

公式天文時刻は古典の流派・日時付き参照盤の承認を代替しない。既存の資料・候補・規則の審査状態は保持する。

## 2025〜2027年の複数年比較と同梱後の回帰検証

PR #422で同じ版の配布物を `vendor/astronomy-engine/2.1.19/astronomy.browser.min.js` に同梱した。上記の「検証用ローカルファイル」はPR #421時点の取得方法を表す。以後の再現では同梱ファイルを指定できる。

[2025年の公式表](https://eco.mtk.nao.ac.jp/koyomi/yoko/2025/rekiyou252.html)（発表2024-02-01）と[2027年の公式表](https://eco.mtk.nao.ac.jp/koyomi/yoko/2027/rekiyou272.html)（発表2026-02-02）から二十四節気のみを追加した。出典・発表日・確認日・UTC+9・分単位の解像度を各年のJSONに記録する。2027年の値は公表された暦計算値であり、観測による事後検証ではない。

| 年 | 件数 | 平均絶対差（分） | 最大絶対差（分） | 最大差の節気 | フォールバック |
| --- | --- | --- | --- | --- | --- |
| 2025 | 24 | 0.303 | 0.720 | 立秋 | 0 |
| 2026 | 24 | 0.350 | 0.991 | 芒種 | 0 |
| 2027 | 24 | 0.342 | 0.703 | 雨水 | 0 |

全72件の明細は `data/qimen/astronomy-engine-audit-2025-2027.json` に保存する。3年の標本内では最大約59秒だったが、秒精度の保証や他年度の上限ではない。近似モデルや実画面の計算式は変更しない。

再現例:

```powershell
node scripts/audit-qimen-solar-terms.mjs --year 2025 --astronomy-browser vendor/astronomy-engine/2.1.19/astronomy.browser.min.js --json
node scripts/audit-qimen-solar-terms.mjs --year 2026 --astronomy-browser vendor/astronomy-engine/2.1.19/astronomy.browser.min.js --json
node scripts/audit-qimen-solar-terms.mjs --year 2027 --astronomy-browser vendor/astronomy-engine/2.1.19/astronomy.browser.min.js --json
npm run test:qimen
```

`--year` の既定値は2026。未収録年や値なしは拒否する。オフライン回帰テストは実Service Worker処理と模擬CacheStorage・通信失敗を使い、キャッシュで得た同梱エンジンにより72件を照合する。90秒のしきい値は標本年の回帰検出用であり、占術の採用基準ではない。実ブラウザーの機内モード試験は含まない。

## 次工程

標準時UTC+9・23時日境界の2方式について72節気の盤切替を確認し、結果と限界を [QIMEN_TERM_CHART_BOUNDARIES.md](QIMEN_TERM_CHART_BOUNDARIES.md) に記録した。次は地方平均時・真太陽時への補正と天文時刻の組合せを監査する。共有の太陽黄経を一括変更して他占術へ影響を広げない。採用する節気の時刻基準は流派資料の確認と分けて記録する。
