import { readFile, writeFile } from 'node:fs/promises';

const [mappingsPath, irgSourcesPath, outputPath] = process.argv.slice(2);
if (!mappingsPath || !irgSourcesPath || !outputPath) {
  throw new Error('Usage: node scripts/generate-name-strokes.mjs Unihan_OtherMappings.txt Unihan_IRGSources.txt output.js');
}

const [mappings, irgSources] = await Promise.all([
  readFile(mappingsPath, 'utf8'),
  readFile(irgSourcesPath, 'utf8')
]);
const eligible = new Set();
for (const line of mappings.split(/\r?\n/)) {
  const match = line.match(/^U\+([0-9A-F]+)\t(?:k(?:Joyo|Jinmeiyo)Kanji|kJis0)\t/);
  if (match) eligible.add(match[1]);
}
const strokes = new Map();
for (const line of irgSources.split(/\r?\n/)) {
  const match = line.match(/^U\+([0-9A-F]+)\tkTotalStrokes\t(\d+)/);
  if (match && eligible.has(match[1])) strokes.set(match[1], Number(match[2]));
}
const entries = [...strokes]
  .map(([hex, count]) => [String.fromCodePoint(Number.parseInt(hex, 16)), count])
  .sort((a, b) => a[0].codePointAt(0) - b[0].codePointAt(0));
if (entries.length < 6000) throw new Error(`Expected at least 6000 Japanese name kanji, got ${entries.length}`);
const body = entries.map(([character, count]) => `${JSON.stringify(character)}:${count}`).join(',');
const output = `/* Generated from Unicode UCD latest Unihan kJoyoKanji, kJinmeiyoKanji, kJis0 and kTotalStrokes. */\n` +
  `(function(root){root.KOYOMI_NAME_STROKES=Object.freeze({${body}})})(globalThis);\n`;
await writeFile(outputPath, output, 'utf8');
console.log(`Generated ${entries.length} name-stroke entries`);
