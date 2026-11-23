// KOYOMI financial tarot: offline, non-predictive interpretive module.
const majors=[
["愚者","新しい可能性","見通しのない飛び込み"],["魔術師","手持ちの技能","能力の過信"],["女教皇","静かな観察","情報の抱え込み"],["女帝","豊かさを育てる","過剰な消費"],["皇帝","計画と管理","頑固な統制"],["法王","信頼できる助言","慣習への依存"],["恋人","価値観に沿う選択","迷いと迎合"],["戦車","目的へ進む力","焦りと暴走"],["力","忍耐と節度","無理な強行"],["隠者","調査と熟考","孤立と先延ばし"],["運命の輪","状況の変化","偶然への依存"],["正義","公平な判断","偏った評価"],["吊るされた男","視点の切替","停滞への固執"],["死神","手放しと転換","変化への抵抗"],["節制","調整と配分","バランスの欠如"],["悪魔","執着に気づく","誘惑と依存"],["塔","前提を見直す","衝動的な破壊"],["星","長期の希望","根拠のない期待"],["月","不確実性の認識","不安と錯覚"],["太陽","成果の共有","楽観しすぎ"],["審判","再評価と再出発","過去への拘束"],["世界","一区切りと完成","達成後の停滞"]
];
const suits=[
{name:"ワンド",symbol:"♜",theme:"行動・挑戦",positive:"意欲を具体的な一歩につなげる",caution:"勢いに任せて資金を動かさない"},
{name:"カップ",symbol:"♡",theme:"感情・人間関係",positive:"気持ちと人との縁を丁寧に扱う",caution:"気分だけでお金を使わない"},
{name:"ソード",symbol:"⚔",theme:"情報・判断",positive:"条件と数字を確かめる",caution:"考え過ぎや早合点に注意する"},
{name:"ペンタクル",symbol:"◈",theme:"資産・実務",positive:"収支や資源を着実に整える",caution:"目先の損得だけに縛られない"}];
const ranks=["エース","2","3","4","5","6","7","8","9","10","ペイジ","ナイト","クイーン","キング"];
const rankThemes=["始まり","二つの選択","協力と発展","安定と保持","不足と摩擦","分配と調和","再検討","継続と鍛錬","積み重ね","節目と負荷","学びと知らせ","行動と推進","成熟した配慮","責任ある管理"];
export const DECK=[
...majors.map(([name,positive,caution],number)=>({id:"major-"+number,name,group:"大アルカナ",symbol:"✦",positive,caution,theme:"人生の節目と選択"})),
...suits.flatMap((s,si)=>ranks.map((rank,ri)=>({id:"minor-"+si+"-"+ri,name:s.name+" "+rank,group:"小アルカナ",symbol:s.symbol,theme:s.theme+"／"+rankThemes[ri],positive:s.positive,caution:s.caution})))
];
if(DECK.length!==78||new Set(DECK.map(x=>x.id)).size!==78)throw new Error("Invalid tarot deck");
export const SPREADS={
daily:{title:"今日の金運",positions:["今日のメッセージ"],description:"1枚引き。今日のお金との付き合い方を象徴的に読み解きます。"},
personal:{title:"個人財運の流れ",positions:["いまの状況","向き合う課題","今日の一手"],description:"3枚引き。状況・課題・行動を整理するための鑑定です。"},
world:{title:"世界経済の象徴",positions:["現状","成長の象徴","注意点","転換の象徴","長期の視点"],description:"5枚引き。経済についての象徴的な内省で、実際の景気予測ではありません。"}
};
function randomInt(max){const limit=Math.floor(4294967296/max)*max;const sample=new Uint32Array(1);do{crypto.getRandomValues(sample)}while(sample[0]>=limit);return sample[0]%max}
export function drawCards(count){if(!Number.isInteger(count)||count<1||count>78)throw new RangeError("Invalid count");const pool=DECK.map((_,i)=>i),out=[];for(let i=0;i<count;i++){const j=i+randomInt(pool.length-i);[pool[i],pool[j]]=[pool[j],pool[i]];out.push({id:DECK[pool[i]].id,reversed:randomInt(2)===1})}return out}
function localDay(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
let dailyMemory;
export function getDaily(){
const key="koyomi-financial-tarot-v1-"+localDay();
if(dailyMemory?.key===key)return dailyMemory.cards.map(c=>({...c}));
let cards;
try{const old=JSON.parse(localStorage.getItem(key)||"null");if(Array.isArray(old)&&old.length===1&&old[0]&&DECK.some(c=>c.id===old[0].id)&&typeof old[0].reversed==="boolean")cards=[{id:old[0].id,reversed:old[0].reversed}]}catch{}
if(!cards){cards=drawCards(1);try{localStorage.setItem(key,JSON.stringify(cards))}catch{}}
dailyMemory={key,cards};
return cards.map(c=>({...c}));
}
export function interpret(item,position){const c=DECK.find(x=>x.id===item.id);if(!c)throw new Error("Unknown card");return {card:c,position,orientation:item.reversed?"逆位置":"正位置",message:item.reversed?c.caution:c.positive}}
// A tarot verdict is computed only from drawn cards and their spread positions.
const BRIGHT_MAJORS = new Set([1,3,4,6,7,8,11,14,17,19,20,21]);
const CHALLENGE_MAJORS = new Set([12,13,15,16,18]);
function cardDirection(item){
  const major=Number(item.id.startsWith('major-')?item.id.slice(6):NaN);
  if(item.reversed)return -1;
  if(Number.isInteger(major)){
    if(BRIGHT_MAJORS.has(major))return 1;
    if(CHALLENGE_MAJORS.has(major))return -1;
    return 0;
  }
  const [,suitId,rankId]=item.id.split('-');
  const suit=Number(suitId), rank=Number(rankId);
  // All Fives are difficult in the selected interpretive school. Ten of Cups and
  // Ten of Pentacles remain auspicious; Ten of Wands is a burden.
  const difficult=rank===4 || (suit===0&&rank===9) ||
    (suit===2&&[6,7,8,9].includes(rank));
  return difficult?-1:1;
}
export function tarotVerdict(type,items){
  if(!Object.hasOwn(SPREADS,type)||!Array.isArray(items)||items.length!==SPREADS[type].positions.length)throw new Error('Invalid tarot spread');
  const weights={daily:[2],personal:[2,0,1],world:[2,0,0,1,1]}[type];
  const total=items.reduce((sum,item,index)=>{
    if(!DECK.some(card=>card.id===item.id)||typeof item.reversed!=='boolean')throw new Error('Invalid tarot card');
    return sum+cardDirection(item)*weights[index];
  },0);
  const mode=total>=2?'good':total<=-2?'caution':'mixed';
  const subject=type==='world'?'世界経済運':type==='personal'?'個人財運':'今日の金運';
  const phrases={
    good:['吉',subject+'は吉。前進の流れが勝る。','良い兆しが強い。準備を整え、次の一歩を具体化して。'],
    caution:['凶',subject+'は凶。無理な拡大は禁物。','警戒のカードが優勢。衝動を止め、守るべき条件を確認して。'],
    mixed:['半吉半凶',subject+'は半吉半凶。勝負を急ぐな。','好機と注意が混じる流れ。まず状況を整理し、条件を比べて。']
  };
  const [label,headline,action]=phrases[mode];
  const card=DECK.find(x=>x.id===items[0].id);
  return {mode,label,headline,action,reason:'主な象徴：'+card.name+'（'+(items[0].reversed?'逆位置':'正位置')+'）。'+
    (items.length>1?'ほかの展開も含めて総合しました。':'このカードの意味を中心に鑑定しました。')};
}
function node(tag,content,className){const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(className)e.className=className;return e}
function render(type,items){const spread=SPREADS[type],readings=items.map((item,i)=>interpret(item,spread.positions[i]));
document.getElementById("results").hidden=false;document.getElementById("resultTitle").textContent=spread.title;
const cards=document.getElementById("cards");cards.replaceChildren();
readings.forEach(r=>{const el=node("div",undefined,"card");el.append(node("span",r.card.symbol,"glyph"),node("small",r.position),node("strong",r.card.name),node("em",r.orientation));cards.append(el)});
const verdict=tarotVerdict(type,items);
document.getElementById("tarotVerdict").textContent=verdict.headline;
document.getElementById("tarotVerdict").dataset.mode=verdict.mode;
document.getElementById("reading").textContent=verdict.action+"\n"+verdict.reason+"\n\n"+
  readings.map(r=>r.position+"：「"+r.card.name+"」"+r.orientation+"。"+r.message+"。").join("\n")+
  "\n\nカードが示す占術上の吉凶です。実際の売買や家計の判断は、数字と契約条件で確かめてください。";
const evidence=document.getElementById("evidence");evidence.replaceChildren();readings.forEach(r=>evidence.append(node("p",r.position+"："+r.card.name+"／"+r.orientation+"／"+r.card.theme+"。採用した象意："+r.message)));
document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});
}
if(typeof document!=="undefined"){
if('serviceWorker'in navigator)navigator.serviceWorker.register(new URL('../../service-worker.js',import.meta.url)).catch(()=>{});
let chosen="daily";const buttons=[...document.querySelectorAll("[data-spread]")];
function select(type){chosen=type;buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.spread===type)));document.getElementById("description").textContent=SPREADS[type].description;document.getElementById("results").hidden=true}
buttons.forEach(b=>b.addEventListener("click",()=>select(b.dataset.spread)));document.getElementById("draw").addEventListener("click",()=>render(chosen,chosen==="daily"?getDaily():drawCards(SPREADS[chosen].positions.length)));select(chosen)}
