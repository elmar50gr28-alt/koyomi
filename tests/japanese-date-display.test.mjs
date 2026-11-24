import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatJapaneseDate as fmt} from '../src/shared/japanese-date-display.js';
for(const [date,expected] of [
 ['1900-01-01','明治33年1月1日'], ['1912-07-29','明治45年7月29日'],
 ['1912-07-30','大正元年7月30日'], ['1926-12-24','大正15年12月24日'],
 ['1926-12-25','昭和元年12月25日'], ['1989-01-07','昭和64年1月7日'],
 ['1989-01-08','平成元年1月8日'], ['2019-04-30','平成31年4月30日'],
 ['2019-05-01','令和元年5月1日'], ['2000-02-29','平成12年2月29日']
])assert.equal(fmt(date),date+'（'+expected+'）');
for(const value of ['',null,'2019-02-29','1900-02-29','2024-04-31','2024-2-01','garbage'])assert.equal(fmt(value),'');
assert.equal(fmt('1868-10-23'),'1868-10-23','no false conversion of pre-Gregorian historical dates');
const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
assert.ok(sw.includes("'./src/shared/japanese-date-display.js'"),'formatter is available in offline app shell');
assert.ok(sw.includes('stock-wareki-v1-'),'existing installs receive the new shell');
console.log('Japanese date display: era boundaries, invalid dates, leap years and offline shell passed');
