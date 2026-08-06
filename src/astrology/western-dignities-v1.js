(function(root){
'use strict';
const rulers={牡羊座:'火星',牡牛座:'金星',双子座:'水星',蟹座:'月',獅子座:'太陽',乙女座:'水星',天秤座:'金星',蠍座:'冥王星',射手座:'木星',山羊座:'土星',水瓶座:'天王星',魚座:'海王星'};
const traditional={...rulers,蠍座:'火星',水瓶座:'土星',魚座:'木星'};
const domicile={太陽:['獅子座'],月:['蟹座'],水星:['双子座','乙女座'],金星:['牡牛座','天秤座'],火星:['牡羊座','蠍座'],木星:['射手座','魚座'],土星:['山羊座','水瓶座'],天王星:['水瓶座'],海王星:['魚座'],冥王星:['蠍座']};
const exaltation={太陽:'牡羊座',月:'牡牛座',水星:'乙女座',金星:'魚座',火星:'山羊座',木星:'蟹座',土星:'天秤座'};
const opposite={牡羊座:'天秤座',牡牛座:'蠍座',双子座:'射手座',蟹座:'山羊座',獅子座:'水瓶座',乙女座:'魚座',天秤座:'牡羊座',蠍座:'牡牛座',射手座:'双子座',山羊座:'蟹座',水瓶座:'獅子座',魚座:'乙女座'};
function status(planet,sign){if((domicile[planet]||[]).includes(sign))return{kind:'domicile',label:'本来の座',score:5};if(exaltation[planet]===sign)return{kind:'exaltation',label:'高揚',score:4};if((domicile[planet]||[]).some(x=>opposite[x]===sign))return{kind:'detriment',label:'障害',score:-5};if(exaltation[planet]&&opposite[exaltation[planet]]===sign)return{kind:'fall',label:'下降',score:-4};return{kind:'neutral',label:'中立',score:0}}
function build(core,input={}){const p=core?.natal?.placements||{},asc=core?.natal?.angles?.asc,ascSign=Number.isFinite(asc)?root.WesternCoreV1.signOf(asc):null,system=input.rulership==='traditional'?traditional:rulers,placements={};Object.entries(p).forEach(([k,v])=>placements[k]={sign:v.sign,ruler:system[v.sign]||null,...status(k,v.sign)});const chains={};Object.keys(p).forEach(start=>{const chain=[],seen=new Set();let planet=start;while(p[planet]&&!seen.has(planet)&&chain.length<12){seen.add(planet);chain.push(planet);planet=system[p[planet].sign]}if(planet)chain.push(planet);chains[start]=chain});return{chartRuler:ascSign?system[ascSign]:null,ascSign,rulership:input.rulership||'modern',placements,dispositorChains:chains,finalDispositors:[...new Set(Object.values(chains).filter(x=>x.at(-1)===x.at(-2)).map(x=>x.at(-1)))]}}
root.WesternDignitiesV1={build,rulers,traditional,status};
})(globalThis);
