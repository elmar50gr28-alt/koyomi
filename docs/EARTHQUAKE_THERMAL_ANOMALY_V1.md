# 地震・地表熱異常候補 v1

## 位置づけ

`earthquake-thermal-anomaly-v1` は、夜間地表面温度の異常が既存の地震活動モデルへ増分情報を与えるかを検証する研究候補です。地下からの熱移送や地震前兆を確定するものではありません。火山用 `volcano/heat-transfer.js` とは入力、評価、公開判定を共有しません。

- `reviewStatus`: `research-only`
- 初期状態: 無効
- 公開確率への寄与: 常に0
- 実ホールドアウト: 未実施

## 固定する入力契約

各観測は `cellId`, `timeUtc`, `nighttimeLSTK`, `localSolarHour`, `weatherAdjustmentK`, `sensorId` を持ちます。品質情報として雲、LST誤差、観測角、放射率誤差を必須とし、火災、火山、工業熱源、積雪の交絡フラグを保持します。FIRMS熱源は温度入力ではなく火災・熱源除外にのみ使用します。

## 計算

1. 計算時刻以降の観測を遮断する。
2. 夜間、雲なし、LST誤差2 K以下、観測角40度以下、放射率誤差0.02以下に限定する。
3. 火災、火山、工業熱源、積雪を除外する。
4. 気象寄与を差し引いたLSTについて、同一センサー、季節窓、現地時刻窓の過去30件以上から中央値とMADを作る。
5. robust z-scoreが正負それぞれ2.5以上の観測を分離する。
6. 7日内に2観測以上継続し、比較可能な隣接2セル以上で同方向・±36時間以内の異常が確認された場合だけ候補強度を生成する。
7. 候補強度は既存地震モデルのコピーへだけ適用し、公開モデルを変更しない。

係数は開発期間内の時系列分割でのみ学習し、実ホールドアウト前に固定します。M4.5以上とM6.5以上、1/3/7/14/30日は別々に評価します。

## 採用条件

既存地震モデルと `既存地震モデル + 熱異常` を比較します。information gainとBrier scoreの両方が改善し、最低5時系列fold中4foldで改善し、information gainの95%下限が正、対象地震50件以上、space-time alarm fractionが10%以下、事前固定した負の対照試験をすべて通過した場合に限り採用候補になります。最終的には式固定後の実ホールドアウトが必要です。

負の対照には日付ずらし、場所ずらし、気象のみ、雲・欠測、火災マスク除去、余震除去を含めます。閾値を結果確認後に変更した場合は別バージョンとし、同じホールドアウトを再利用しません。

## 根拠と限界

- NASA MODIS LST User Guide: https://www.earthdata.nasa.gov/s3fs-public/2025-04/MOD11_User_Guide_V4.pdf
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/active_fire/
- Genzano et al. (2021): https://doi.org/10.1029/2020JB020108
- Blackett et al. (2011): https://doi.org/10.1029/2011GL048282

既往研究には肯定・否定の両方があり、後ろ向き一致だけでは予測能力を示せません。このため、KOYOMIでは熱異常を単独の危険度、地震確率、避難判断として表示しません。

## NASA直接衛星データ取得経路

取得経路はNASA AppEEARS APIに固定し、次のCollection 6.1製品を使用します。

- Terra/Aqua夜間LST: `MOD11A1.061`, `MYD11A1.061`
- 積雪除外: `MOD10A1.061`
- Terra/Aqua火災除外: `MOD14A2.061`, `MYD14A2.061`

日本周辺（北緯20〜48度、東経122〜154度）の全H3 resolution 2セルを母集団とし、地震発生セルだけを選びません。取得点はresolution 3の中心点、評価単位はresolution 2です。これにより地震発生の有無を使った観測地点選択を避けます。World表示がresolution 3以上の場合も、対応するresolution 2親セルの熱観測を表示します。

`npm run update:earthquake-thermal -- --preflight` は製品・レイヤーの存在、対象座標数、タスク数だけを検証します。取得タスクの送信は `APPEEARS_TOKEN`、またはローカル環境に設定した `EARTHDATA_USERNAME` と `EARTHDATA_PASSWORD` がある場合に限り `--submit` で行います。送信後は `--status` で各タスクを一度だけ確認し、完了後に `--download` で成果物を取得します。各ファイルはAppEEARS bundle記載のSHA-256と一致した場合だけ保存します。認証情報はリポジトリへ保存しません。タスクIDのローカル状態ファイルとダウンロード物もGit対象外です。

認証・取得・変換・整合性検証が完了するまでは、`earthquake-thermal-research-v1.json` を `awaiting-authentication` とし、観測値を空に保ちます。この状態を「取得済み」や「精度向上」とは扱いません。

AppEEARSの生CSVを公開用JSONへ変換する工程は、全球で一貫した気象補正値と、火山・工業熱源の固定マスクを用意してから実装します。欠けた補正値を0、未確認の交絡要因をfalseとして埋めることは禁止します。そのため、現バージョンは認証済みでも `--download` の後に自動で予測表示を有効化しません。

## 認証不要の日次解析値経路

直接衛星LST経路とは別に、NASA POWER Daily APIの `TS`（地表面温度解析値）と `T2M`（2m気温）の差を使う `earthquake-power-surface-residual-v1` を研究表示へ接続します。湿度 `RH2M` と補正降水量 `PRECTOTCORR` は、比較する過去日の気象条件をそろえるために使います。NASA POWERの値はMERRA-2/GEOSIT系の解析・同化値であり、直接衛星LSTとは表示しません。

- 対象範囲: 日本周辺（北緯20〜48度、東経122〜154度）の全H3 resolution 2セル
- 保存開始: 2024-01-01
- 比較: 同季節±45日、湿度差20ポイント以内、降水有無が同じ過去30件以上
- 候補条件: robust z-score 2.5以上、直近7日で2日以上、隣接2セル以上で±2日以内に同方向
- 公開確率への寄与: 常に0
- 地図の予測色への寄与: なし
- 更新失敗時: 既存JSONを上書きせず、最後に検証済みのデータを保持

`npm run preflight:earthquake-thermal-public` は認証なしでPOWER点データとNOAA Open Data上のJMAひまわり9号オブジェクトへの到達を確認します。`npm run update:earthquake-thermal-public` はPOWER履歴を増分更新し、欠損、日時順、重複、SHA-256、出典を検証します。

ひまわり9号HSDについては公開S3の最新時刻とバンド一覧だけを記録し、`usedInSignal: false` を固定します。HSDバイナリの較正・雲判定・地理投影を実装していないため、ひまわりの値が数値計算へ入ったとは扱いません。火災・火山・工業熱源マスクも未適用であり、実ホールドアウト前に予測精度向上を主張しません。
