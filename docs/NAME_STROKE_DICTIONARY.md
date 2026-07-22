# 姓名判断の画数辞書

`src/data/name-strokes.js` は、Unicode Character Database の最新 Unihan データから生成する。

対象は次のいずれかに該当し、`kTotalStrokes` を持つ文字とする。

- `kJoyoKanji`
- `kJinmeiyoKanji`
- `kJis0`（姓で使われるJIS漢字を補うため）

再生成には公式 `Unihan.zip` 内の `Unihan_OtherMappings.txt` と
`Unihan_IRGSources.txt` を使用し、次を実行する。

```text
node scripts/generate-name-strokes.mjs Unihan_OtherMappings.txt Unihan_IRGSources.txt src/data/name-strokes.js
```

辞書にない文字は推測画数へ置き換えず、姓名判断を判定保留にする。
Unicodeの総画数と姓名判断流派の画数が一致しない場合があるため、画面には採用した文字別画数を表示する。
