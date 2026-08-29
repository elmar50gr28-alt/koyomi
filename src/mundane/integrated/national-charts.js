export const NATIONAL_CHARTS=Object.freeze([
  {id:'jp-constitution',countryJa:'日本',eventJa:'日本国憲法施行',date:'1947-05-03',time:null,latitude:35.6762,longitude:139.6503,sourceUrl:'https://www.ndl.go.jp/constitution/e/etc/c01.html'},
  {id:'us-independence',countryJa:'アメリカ合衆国',eventJa:'独立宣言採択',date:'1776-07-04',time:null,latitude:39.9526,longitude:-75.1652,sourceUrl:'https://www.archives.gov/founding-docs/declaration'},
  {id:'de-basic-law',countryJa:'ドイツ',eventJa:'基本法公布',date:'1949-05-23',time:null,latitude:50.7374,longitude:7.0982,sourceUrl:'https://www.bundestag.de/en/parliament/function/legal/german_basic_law'},
  {id:'in-constitution',countryJa:'インド',eventJa:'憲法施行',date:'1950-01-26',time:null,latitude:28.6139,longitude:77.209,sourceUrl:'https://knowindia.india.gov.in/profile/the-union/constitution.php'},
  {id:'fr-fifth-republic',countryJa:'フランス',eventJa:'第五共和政憲法公布',date:'1958-10-04',time:null,latitude:48.8566,longitude:2.3522,sourceUrl:'https://www.elysee.fr/en/french-presidency/constitution-of-4-october-1958'}
].map(item=>Object.freeze({...item,timeQuality:item.time?'known':'unknown',chartPolicy:item.time?'houses-enabled':'no-houses-no-angles'})));
export const nationalChartById=id=>NATIONAL_CHARTS.find(item=>item.id===id)||null;
