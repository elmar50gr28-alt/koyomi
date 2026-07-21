# KOYOMI 機能台帳

監査日: 2026-07-21
対象: `main` から作成した `agent/architecture-audit`

## 起動・画面

|領域|実装場所|現行契約|モジュール化時の保護点|
|---|---|---|---|
|入口|`index.html`|`today.html` / `app.html` へ遷移できる|既存URLとGitHub Pages相対パスを維持|
|今日の暦|`today.html`|暦機構、日送り、レイヤー切替、JSON表示データ適用、モバイルviewport対応|`applyData`、`changeDay`、表示初期化順をcharacterization testで固定|
|統合アプリ|`app.html`|暦、本人鑑定、相性、奇門遁甲、人物台帳、設定を単一HTMLで提供|既存DOM id、`window.V191/V192/V193`、`window.KOYOMI_V300`を互換層として維持|
|PWA|`service-worker.js` / `manifest.webmanifest`|オフライン起動、バージョンキャッシュ、旧キャッシュ削除|HTMLはnetwork-first、資産はstale-while-revalidate、同一origin限定|

## 人物台帳・保存

|項目|現状|
|---|---|
|論理ID|プロフィールの主キーは `id`。後段UIで `personId = personId || id` を補完|
|DB|`mitsunome_v194_destiny_ledger`、DB version 1、schema version 19401|
|ストア|`profiles`、`locations`、`readings`、`drafts`、`changes`、`settings`|
|プロフィールindex|`updatedAt`、`lastUsedAt`|
|鑑定index|`createdAt`|
|互換性|正規化時に既知フィールドを整形。既存監査文書は未知フィールド保持を要求するため、抽出前に実データ移行テストが必要|
|鑑定履歴|鑑定時点の人物スナップショット、入力、計算設定を保存。人物削除時は匿名化または関連履歴削除|
|保持期間|session / 24h / 7d / 30d / 1y / forever|
|別DB|個人史 `mitsunome_v191_history/events`、世界史 `MitsunomeWorldHistoryV191R/onthisday` も存在|

## 暗号化・バックアップ

|項目|現状|
|---|---|
|端末内暗号|Web Crypto、PBKDF2-SHA256（250,000回）、AES-GCM 256bit、salt 16byte、IV 12byte|
|暗号対象|`LEDGER_STORES` のレコード。`settings` 内のlock config/verifierは鍵導出・検証用|
|鍵保持|復号鍵は `LedgerState.key` のメモリ内のみ。ロック時に破棄|
|暗号移行|有効化・解除時に各ストアを読み直して全件再保存|
|暗号バックアップ|PBKDF2-SHA256（300,000回）、AES-GCM、`MITSUNOME_ENCRYPTED_BACKUP`|
|平文出力|JSON / CSV / 印刷 / 個別JSON。確認表示はあるが個人情報を含む|

注意点: 全件再暗号化は途中失敗時の原子性がなく、暗号化済みレコードのindex値は外側に十分保持されない。今回は挙動を変えず、移行・復旧テスト追加後に改善する。

## 四柱推命

四柱推命は `src/bazi/index.js` を公開入口として既に分離されている。暦境界、命式、干支関係、身強弱、格局、用神、大運、流派比較、根拠、解釈、読み、検証の各層が存在する。`app.html` はES moduleとして読み込み `window.KOYOMI_BAZI` に公開する。

現行の重要APIは `calculateBazi`、`calculateBaziChart`、`calculateFourPillars`、`calculateTenGod`、`calculateTwelveStage`、各validation API。既知の未完了項目は正確な24節気時刻、大運開始時期、流年・月運・日運の精密化であり、現行結果を無断で「精密化」しない。

## 監査上の主要リスク

1. `app.html` が約60万byteのインライン実装で、関数上書きによる拡張もある。
2. 台帳正規化と保存、DOM、通知、暗号化が相互依存している。
3. `today.html` の暦表示は独自の表示データと計算を持ち、四柱推命moduleと完全には統合されていない。
4. Service Workerのキャッシュバージョン更新漏れは、分離後のmodule配信を古い資産と混在させる。
5. 未知プロフィール項目保持の方針と、現行 `ledgerNormalizeProfile` の再構築方式を移行fixtureで確認する必要がある。
