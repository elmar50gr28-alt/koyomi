# KOYOMI 回帰テスト方針

## 目的

モジュール化は構造変更であり、占術結果、保存データ、URL、DOM契約、オフライン動作を同時に変更しない。各抽出PRは「同じ入力に同じ出力」を基本条件とする。

## テスト層

1. **静的契約**: 必須ファイル、Service Worker戦略、公開window/API、重要DOM id、DB名・store名、暗号パラメータを固定する。
2. **純粋関数単体**: 四柱推命、プロフィール正規化、暗号package変換、今日データ変換をfixtureで比較する。
3. **保存統合**: fake IndexedDBまたは実ブラウザで、旧平文、暗号済み、未知フィールド、部分移行、ロック解除、削除匿名化を検証する。
4. **ブラウザE2E**: 初回プロフィール、再起動復元、本人鑑定、相性二人物、today日送り、オフライン再起動、更新後キャッシュをiPhone相当viewportで確認する。
5. **目視確認**: iPhone SafariとAndroid Chromeでsafe-area、ソフトキーボード、44px操作領域、横スクロールなしを確認する。

## 必須fixture

- 出生時刻既知 / 不明、23時・0時、立春・月境界、海外timezone/DST。
- 本人、家族、第三者、画像・メモ・未知フィールドを含む旧プロフィール。
- 平文台帳、PIN暗号台帳、暗号バックアップ、重複import。
- 人物削除時の履歴匿名化と同時削除。
- Service Worker更新前後のshell/runtime cache。

## 抽出ごとの合格条件

- `npm test`、`npm run test:static`、`npm run test:mobile` が成功。
- 新旧実装のfixture JSONが一致する（時刻など非決定値は正規化して比較）。
- DB名、version、store、keyPath、indexを変更しない。変更が必要なら別PRでversioned migrationを用意する。
- 暗号方式・反復回数・backup formatを変更しない。変更時は旧データ復号fixtureを残す。
- `app.html` / `today.html` / `index.html` の相対URLと既存公開hookを維持する。
- 新moduleを配信対象へ追加した場合、Service Worker cache versionとオフラインテストを同じ変更に含める。

## 実施順

`architecture-contract` → 純粋関数抽出 → adapter二重実行比較 → 呼出元切替 → 旧inline削除、の順で進める。保存・暗号化は最後に切り替え、UI抽出と同じPRに混ぜない。
