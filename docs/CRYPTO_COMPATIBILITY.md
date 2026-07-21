# KOYOMI 暗号化互換ラッパー契約

## 目的

人物台帳の既存暗号化形式を一切変更せず、鍵導出・暗号化・復号処理へ安定したmodule境界を設ける。wrapperは既存関数を移植・再実装せず、引数、Promiseの解決値、reject理由をそのまま転送する。

## 公開API

`window.KOYOMI_CRYPTO` は次の3操作だけを公開する。

|操作|既存実装|契約|
|---|---|---|
|`deriveKey(secret, salt, iterations)`|`ledgerDeriveKey`|既存のCryptoKey Promiseをそのまま返す|
|`encryptObject(value, key)`|`ledgerEncryptObject`|既存の `{iv,data}` Promiseをそのまま返す|
|`decryptObject(record, key)`|`ledgerDecryptObject`|既存の復号結果Promiseをそのまま返す|

## 固定する既存形式

- KDF: PBKDF2 / SHA-256
- 鍵長: AES-GCM 256bit
- IV: 12byte
- 台帳KDF反復回数: 250,000
- 暗号backup反復回数: 300,000
- backup format: `MITSUNOME_ENCRYPTED_BACKUP`

これらは監査対象の既存契約であり、wrapper自身は値を保持・上書き・補完しない。

## 非対象

- PIN入力、verifier、auto-lock、鍵のメモリ保持
- IndexedDB record wrapperと全件暗号移行
- Base64 encoding、salt/IV生成、backup/import/export
- 暗号方式や反復回数の更新
- 人物プロフィール、UI、四柱推命、Service Worker戦略

## 互換性規則

1. wrapper内で暗号計算、乱数生成、encodingを行わない。
2. key、salt、record、復号結果をcloneまたは変形しない。
3. 既存Promiseの解決値とreject理由を保持する。
4. 既存の暗号化・復号呼出元は今回切り替えない。
5. 暗号形式更新は旧fixtureから復号できるversioned migrationを備えた別変更で扱う。

## オフライン契約

`app.html` がmoduleをimportするため、`./src/shared/crypto-compat.js` をapplication shellへ追加する。キャッシュ戦略は変更しない。
