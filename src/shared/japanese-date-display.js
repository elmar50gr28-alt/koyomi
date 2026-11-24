// Calendar-date display only: no timezone conversion, network, or Intl dependency.
const ERAS = [
  ['2019-05-01','令和',2018], ['1989-01-08','平成',1988],
  ['1926-12-25','昭和',1925], ['1912-07-30','大正',1911],
  ['1868-01-25','明治',1867]
];
export function formatJapaneseDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
  const date=new Date(value+'T12:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return '';
  // Before the Gregorian calendar adoption, retain the original date without
  // implying that Gregorian month/day is a historical Japanese calendar date.
  if(value<'1873-01-01')return value;
  const era=ERAS.find(([start])=>value>=start);
  if(!era)return value;
  const year=Number(value.slice(0,4))-era[2];
  return value+'（'+era[1]+(year===1?'元':year)+'年'+Number(value.slice(5,7))+'月'+Number(value.slice(8,10))+'日）';
}
export function formatDatesInText(text){
  return text.replace(/\b\d{4}-\d{2}-\d{2}\b/g,date=>formatJapaneseDate(date)||date);
}
