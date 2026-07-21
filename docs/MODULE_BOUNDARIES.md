# KOYOMI 共通モジュール境界

## 依存方向

`pages/UI → application services → domain → ports` とし、browser実装は `adapters/browser` に置く。domainからDOM、IndexedDB、Cache API、`window` を参照しない。

## 目標構成

```text
src/
  shared/
    architecture-contracts.js  # 移行中の不変条件（追加済み）
    profile/                    # schema、normalize、readiness
    crypto/                     # byte変換、encrypt/decrypt package
    storage/                    # repository portとmigration
  adapters/browser/
    indexeddb-ledger.js
    web-crypto.js
    service-worker-registration.js
  app/
    ledger-service.js
    reading-service.js
  today/
    model.js
    renderer.js
    controller.js
  bazi/                         # 既存の決定論的engine境界を維持
```

## 境界契約

### profile

入力はplain object、出力は新しいplain objectとvalidation結果。DOM idやIndexedDB record wrapperを知らない。`id` / `personId`、未知フィールド、createdAtを保存する。

### storage

`list/get/put/delete/clear/transaction` のportを公開し、暗号化済みrecord形式はadapter内に閉じる。DB名・store名は `architecture-contracts.js` とmigration testで固定する。

### crypto

Web Cryptoを注入し、鍵導出、object暗号化、verifier、backup packageを分ける。PINや鍵を永続化しない。旧形式を復号できる限り、新形式追加はversion付きにする。

### application services

人物削除と履歴匿名化、プロフィール変更時の再計算フラグ、鑑定スナップショットなど複数repositoryにまたがる規則を担当する。confirm/prompt/toastはUI callbackとして注入する。

### today

表示データの検証・日送りをmodel、SVG/DOM更新をrenderer、gesture/viewportをcontrollerに分離する。四柱推命engineへの統合は表示同等性fixtureが揃うまで行わない。

### bazi

`src/bazi/index.js` を唯一の公開入口として保つ。profileを読み取り専用入力として扱い、人物保存やDOMを参照しない。流派差、sourceIds、confidence、reviewStatusを潰さない。

## 最初の抽出単位

1. side-effectなしの文字列処理・profile schemaを抽出。
2. crypto primitivesを既存parameterのまま抽出し、既存暗号fixtureで二重実行比較。
3. IndexedDB adapterを抽出し、旧DBをそのまま開く統合テストを追加。
4. 台帳application serviceを抽出。
5. 最後にDOM controllerを分割する。

この監査変更では境界定義と契約testのみを追加し、ランタイム呼出先は切り替えない。
