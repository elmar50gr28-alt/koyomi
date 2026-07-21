# KOYOMI 暦・時刻互換ラッパー契約

## 目的

`app.html` の既存暦・時刻関数を移植・再実装せず、後続のモジュール化で参照できる安定した最小APIを提供する。既存関数が唯一の計算元であり、wrapperは引数、戻り値、例外を変更せず転送する。

## 公開API

`window.KOYOMI_CALENDAR_TIME` は次の4操作だけを公開する。

|操作|既存実装|契約|
|---|---|---|
|`formatLocalDate(date)`|`fmtIso`|既存のローカル日付文字列をそのまま返す|
|`parseLocalDate(value)`|`safeDate`|既存の入力解析結果または `null` をそのまま返す|
|`startOfLocalDay(date)`|`startOfDay`|既存のローカル日初めDateをそのまま返す|
|`formatCalendarDate(date, calendar, locale)`|`calendarFormat`|既存のIntl暦表示または未対応文言をそのまま返す|

## 非対象

- 四柱推命の年柱・月柱・日柱・時柱判定
- 節気、太陽黄経、月相、真太陽時、日境界の計算
- `today.html` の表示データ、日送り、描画処理
- timezone/DST補正の新規実装
- IndexedDB、人物台帳、暗号化、UI、Service Worker戦略

## 互換性規則

1. wrapper内に暦・時刻計算を追加しない。
2. Dateのclone、timezone変換、入力補正を行わない。
3. 既存戻り値の参照同一性と既存例外を保持する。
4. API追加は利用箇所と同値fixtureが揃った別変更で行う。
5. `app.html` の既存呼出元は今回切り替えない。

## オフライン契約

`app.html` がmoduleをimportするため、`./src/shared/calendar-time-compat.js` をapplication shellへ追加する。キャッシュ戦略はHTMLのnetwork-first、同一origin資産のstale-while-revalidateを維持する。
