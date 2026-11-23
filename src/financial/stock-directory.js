// JPX security code/name lookup: on-device first, no stock-related user data sent.
// Narrow built-in seed covers selected equities when offline on a first installation.
// The full catalog is an OPTIONAL direct browser download, not shipped/re-published.
const SEED=[["130A","Ｖｅｒｉｔａｓ　Ｉｎ　Ｓｉｌｉｃｏ","医薬品"],["1375","ユキグニファクトリー","水産・農林業"],["1911","住友林業","建設業"],["1925","大和ハウス工業","建設業"],["2413","エムスリー","サービス業"],["2432","ディー・エヌ・エー","情報・通信業"],["2768","双日","卸売業"],["2914","日本たばこ産業","食料品"],["3038","神戸物産","卸売業"],["3382","セブン＆アイ・ホールディングス","小売業"],["3659","ネクソン","情報・通信業"],["4063","信越化学工業","化学"],["4188","三菱ケミカルグループ","化学"],["4502","武田薬品工業","医薬品"],["4568","第一三共","医薬品"],["4661","オリエンタルランド","サービス業"],["4755","楽天グループ","サービス業"],["4901","富士フイルムホールディングス","化学"],["4980","デクセリアルズ","化学"],["4994","大成ラミックグループ","化学"],["5020","ＥＮＥＯＳホールディングス","石油・石炭製品"],["5401","日本製鉄","鉄鋼"],["5713","住友金属鉱山","非鉄金属"],["6098","リクルートホールディングス","サービス業"],["6146","ディスコ","機械"],["6201","豊田自動織機","輸送用機器"],["6273","ＳＭＣ","機械"],["6301","小松製作所","機械"],["6326","クボタ","機械"],["6472","ＮＴＮ","機械"],["6480","日本トムソン","機械"],["6501","日立製作所","電気機器"],["6503","三菱電機","電気機器"],["6594","ニデック","電気機器"],["6701","日本電気","電気機器"],["6723","ルネサスエレクトロニクス","電気機器"],["6758","ソニーグループ","電気機器"],["6762","ＴＤＫ","電気機器"],["6857","アドバンテスト","電気機器"],["6861","キーエンス","電気機器"],["6920","レーザーテック","電気機器"],["6954","ファナック","電気機器"],["6963","ローム","電気機器"],["6981","村田製作所","電気機器"],["7011","三菱重工業","機械"],["7012","川崎重工業","輸送用機器"],["7201","日産自動車","輸送用機器"],["7203","トヨタ自動車","輸送用機器"],["7267","本田技研工業","輸送用機器"],["7270","ＳＵＢＡＲＵ","輸送用機器"],["7733","オリンパス","精密機器"],["7751","キヤノン","電気機器"],["7832","バンダイナムコホールディングス","その他製品"],["7974","任天堂","その他製品"],["8001","伊藤忠商事","卸売業"],["8031","三井物産","卸売業"],["8035","東京エレクトロン","電気機器"],["8058","三菱商事","卸売業"],["8306","三菱ＵＦＪフィナンシャル・グループ","銀行業"],["8316","三井住友フィナンシャルグループ","銀行業"],["8411","みずほフィナンシャルグループ","銀行業"],["8591","オリックス","その他金融業"],["8725","ＭＳ＆ＡＤインシュアランスグループホールディングス","保険業"],["8750","第一ライフグループ","保険業"],["8766","東京海上ホールディングス","保険業"],["8801","三井不動産","不動産業"],["8830","住友不動産","不動産業"],["9020","東日本旅客鉄道","陸運業"],["9021","西日本旅客鉄道","陸運業"],["9101","日本郵船","海運業"],["9104","商船三井","海運業"],["9202","ＡＮＡホールディングス","空運業"],["9432","ＮＴＴ","情報・通信業"],["9433","ＫＤＤＩ","情報・通信業"],["9434","ソフトバンク","情報・通信業"],["9501","東京電力ホールディングス","電気・ガス業"],["9503","関西電力","電気・ガス業"],["9602","東宝","情報・通信業"],["9663","ナガワ","サービス業"],["9735","セコム","サービス業"],["9766","コナミグループ","情報・通信業"],["9983","ファーストリテイリング","小売業"],["9984","ソフトバンクグループ","情報・通信業"]];
export const STOCK_CATALOG_META=Object.freeze({
  source:'skr-works/ticker-master-japan 公開銘柄一覧（JPXの公表資料由来、第三者加工）',
  snapshotDate:'2026-05-31',
  url:'https://raw.githubusercontent.com/skr-works/ticker-master-japan/main/data/master.csv',
  officialVerification:'https://www.jpx.co.jp/markets/statistics-equities/misc/01.html',
  limitations:'元資料に上場廃止・社名変更の遅れがあり、現在の上場状況を保証しません。'
});
export const BUILTIN_STOCKS=Object.freeze(SEED.map(([code,name,sector])=>
  Object.freeze({code,name,sector,source:'builtin-snapshot'})));
const MAX_CATALOG_SIZE=250000;
const CODE=/^[0-9][0-9A-Z]{3}$/;
const normal=s=>String(s??'').normalize('NFKC').toUpperCase().replace(/[\s\u3000・（）()_\-]/g,'');
export function normalizeStockCode(input){
  const code=normal(input).replace(/\.T$/,'');
  return CODE.test(code)?code:null;
}
export function parseStockCatalogCSV(text){
  if(typeof text!=='string'||text.length>MAX_CATALOG_SIZE)throw new RangeError('銘柄一覧データの容量が上限を超えています。');
  // Minimal RFC4180 parser including doubled quotes, commas within quoted names.
  const rows=[];let row=[],field='',quoted=false;
  const input=text.replace(/^\uFEFF/,'');
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(ch==='"'){
      if(quoted&&input[i+1]==='"'){field+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){row.push(field);field='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){
      row.push(field);if(row.some(c=>c.trim()))rows.push(row);
      row=[];field='';
      if(ch==='\r'&&input[i+1]==='\n')i++;
    }else field+=ch;
  }
  if(quoted)throw new Error('銘柄一覧CSVの引用符が不正です。');
  row.push(field);if(row.some(c=>c.trim()))rows.push(row);
  const head=rows.shift()?.map(s=>s.trim())||[];
  const codeCol=head.findIndex(s=>s==='コード'||s.toLowerCase()==='code');
  const nameCol=head.findIndex(s=>s==='銘柄名'||s.toLowerCase()==='name');
  const sectorCol=head.findIndex(s=>s==='33業種区分'||s.toLowerCase()==='sector');
  if(codeCol<0||nameCol<0)throw new Error('銘柄一覧CSVのコード・銘柄名列がありません。');
  const items=new Map();
  for(const cells of rows){
    const code=normalizeStockCode(cells[codeCol]),name=(cells[nameCol]||'').trim();
    if(!code||name.length<2||name.length>110)continue;
    const sector=sectorCol>=0?(cells[sectorCol]||'').trim():'';
    items.set(code,{code,name,sector:sector.slice(0,50),source:'online-catalog'});
  }
  if(items.size<2||items.size>6000)throw new Error('銘柄一覧に有効な情報がありません。');
  return [...items.values()].sort((a,b)=>a.code.localeCompare(b.code));
}
export function stockSearch(query,list=BUILTIN_STOCKS,limit=12){
  const q=normal(query);
  if(!q||q.length>110)return [];
  if(!Array.isArray(list))throw new TypeError('銘柄一覧がありません。');
  const matches=list.filter(item=>{
    const code=normalizeStockCode(item?.code);
    return code && (code.includes(q)||normal(item.name).includes(q));
  }).map(item=>({...item,matchRank:item.code===q?0:item.code.startsWith(q)?1:
    normal(item.name).startsWith(q)?2:3}));
  matches.sort((a,b)=>a.matchRank-b.matchRank||a.code.localeCompare(b.code));
  return matches.slice(0,Math.min(limit,20)).map(({matchRank,...item})=>item);
}
export function lookupStock(query,list=BUILTIN_STOCKS){
  const code=normalizeStockCode(query);
  if(code){
    return list.find(item=>item.code===code)??null;
  }
  const q=normal(query);
  if(!q)return null;
  const exact=list.filter(item=>normal(item.name)===q);
  return exact.length===1?exact[0]:null;
}
export function makeManualStock(code,name){
  const normalized=normalizeStockCode(code);
  const clean=String(name||'').trim().slice(0,100);
  if(!normalized||clean.length<2)throw new Error('証券コード4桁と正式な銘柄名を入力してください。');
  return {code:normalized,name:clean,sector:'未確認',source:'user-entered'};
}
// Pure state and tests: no direct fetch in a module initializer.
export async function updateStockCatalog({fetcher=fetch,store,now=new Date(),timeoutMs=9000}={}){
  let existing=BUILTIN_STOCKS,updatedAt=null;
  try{
    const saved=JSON.parse(store?.getItem('koyomi-stock-catalog-v1')||'null');
    if(saved && typeof saved.updatedAt==='string' && Array.isArray(saved.items)
      && saved.items.length>1000&&saved.items.length<6000){
      const valid=saved.items.every(row=>normalizeStockCode(row.code) && typeof row.name==='string'&&row.name.length>1);
      if(valid){existing=saved.items;updatedAt=saved.updatedAt;}
    }
  }catch{}
  const shouldRefresh=!updatedAt||(now.getTime()-Date.parse(updatedAt)>7*86400000);
  if(!shouldRefresh||typeof fetcher!=='function')
    return {items:existing,cached:existing!==BUILTIN_STOCKS,updatedAt,refreshAttempted:false};
  const ac=typeof AbortController==='function'?new AbortController():null;
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{ac?.abort();reject(new Error('通信時間切れ'));},timeoutMs);});
  try{
    const response=await Promise.race([
      fetcher(STOCK_CATALOG_META.url,{cache:'no-store',credentials:'omit',mode:'cors',signal:ac?.signal}),
      timeout
    ]);
    if(!response?.ok)throw new Error('銘柄一覧の取得先 HTTP '+response?.status);
    const length=Number(response.headers?.get?.('content-length'));
    if(Number.isFinite(length)&&length>MAX_CATALOG_SIZE)throw new Error('銘柄一覧が大きすぎます。');
    const raw=await Promise.race([response.text(),timeout]);
    const items=parseStockCatalogCSV(raw);
    if(items.length<1000)throw new Error('銘柄一覧が欠けています。');
    const next={items,updatedAt:now.toISOString()};
    try{store?.setItem('koyomi-stock-catalog-v1',JSON.stringify(next));}catch{}
    return {items,cached:true,updatedAt:next.updatedAt,refreshAttempted:true};
  }catch(e){
    return {items:existing,cached:existing!==BUILTIN_STOCKS,
      updatedAt,refreshAttempted:true,error:String(e?.message||e)};
  }finally{clearTimeout(timer);}
}
