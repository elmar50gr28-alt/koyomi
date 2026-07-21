# KOYOMI プロフィールスキーマ互換ラッパー契約

## 目的

人物台帳の保存形式や既存データを変更せず、`app.html` のプロフィール正規化・検証処理へ安定したmodule境界を設ける。wrapperは既存関数を移植・再実装せず、引数、戻り値、例外をそのまま転送する。

## 公開API

`window.KOYOMI_PROFILE_SCHEMA` は次の2操作だけを公開する。

|操作|既存実装|契約|
|---|---|---|
|`normalizeProfile(profile)`|`ledgerNormalizeProfile`|既存の正規化結果を参照も含めてそのまま返す|
|`validateProfile(profile)`|`ledgerValidateProfile`|既存のvalidation配列をそのまま返す|

## 非対象

- IndexedDBのDB名、version、store、index、record wrapper
- `id` / `personId` の移行や採番規則の変更
- 未知フィールド保持方式の改善
- 暗号化、PIN、backup、import/export
- 人物削除、履歴匿名化、保持期間、自動保存
- UIフォーム、人物選択、四柱推命その他の判定ロジック

## 互換性規則

1. wrapper内に正規化・validation規則を追加しない。
2. 入力をclone、merge、削除、補完しない。
3. 戻り値の参照同一性と既存例外を保持する。
4. 既存の保存・読込呼出元は今回切り替えない。
5. 未知フィールド保持やschema migrationは、旧データfixtureとversioned migrationを備えた別変更で扱う。

## オフライン契約

`app.html` がmoduleをimportするため、`./src/shared/profile-schema-compat.js` をapplication shellへ追加する。既存のHTML network-first、同一origin資産 stale-while-revalidate戦略は変更しない。
