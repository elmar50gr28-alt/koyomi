const OFFICIAL_JA=Object.freeze({
  282030:'諏訪之瀬島',282050:'口永良部島',282090:'霧島山',282100:'雲仙岳',282110:'阿蘇山',
  283020:'箱根山',283030:'富士山',283040:'御嶽山',283050:'白山',283070:'焼岳',283110:'浅間山',
  283120:'草津白根山',283160:'磐梯山',283170:'安達太良山',283180:'吾妻山',283190:'蔵王山',
  283220:'鳥海山',283230:'秋田駒ヶ岳',283240:'岩手山',283250:'八幡平',283260:'秋田焼山',
  283270:'岩木山',283271:'十和田',283280:'八甲田山',284010:'伊豆大島',284040:'三宅島',
  284050:'八丈島',284060:'青ヶ島',284070:'明神礁',284096:'西之島',284120:'硫黄島',
  285011:'恵山',285020:'北海道駒ヶ岳',285030:'洞爺',285034:'倶多楽',285040:'支笏',
  285050:'十勝岳',285060:'大雪山',285070:'阿寒',285080:'屈斜路',285081:'摩周',
  332010:'キラウエア',332020:'マウナ・ロア',321050:'セント・ヘレンズ山',211060:'ヴェスヴィオ山',
  263310:'クラカタウ',264020:'メラピ山',290360:'カムチャツカのクリュチェフスカヤ山'
});

const ROMAJI=[['sch','シュ'],['tch','チ'],['sh','シ'],['ch','チ'],['ts','ツ'],['th','ス'],['ph','フ'],['kh','ハ'],['zh','ジ'],['qu','ク'],['ck','ック'],['ng','ン'],['ai','アイ'],['au','アウ'],['ei','エイ'],['oi','オイ'],['ou','オウ'],['ia','イア'],['io','イオ'],['ua','ウア'],['ue','ウエ'],['ya','ヤ'],['yu','ユ'],['yo','ヨ']];
const LETTER=Object.freeze({a:'ア',b:'ブ',c:'ク',d:'ド',e:'エ',f:'フ',g:'グ',h:'ハ',i:'イ',j:'ジ',k:'ク',l:'ル',m:'ム',n:'ン',o:'オ',p:'プ',q:'ク',r:'ル',s:'ス',t:'ト',u:'ウ',v:'ヴ',w:'ウ',x:'クス',y:'イ',z:'ズ'});

export function katakanaFallback(value){let text=String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),result='';while(text){const separator=text.match(/^[\s/_-]+/);if(separator){result+='・';text=text.slice(separator[0].length);continue}const punctuation=text.match(/^[()[\],.]+/);if(punctuation){result+=punctuation[0].replace(/[()[\]]/g,'');text=text.slice(punctuation[0].length);continue}const pair=ROMAJI.find(([token])=>text.startsWith(token));if(pair){result+=pair[1];text=text.slice(pair[0].length);continue}const char=text[0];result+=LETTER[char]||char;text=text.slice(1)}return result.replace(/・+/g,'・').replace(/^・|・$/g,'')||'名称未確認'}

export function localizedVolcanoName(volcano){const official=OFFICIAL_JA[Number(volcano?.gvpNumber)];if(official)return Object.freeze({nameJa:official,nameEn:String(volcano.name||''),status:'official-or-established'});return Object.freeze({nameJa:katakanaFallback(volcano?.name),nameEn:String(volcano?.name||''),status:'auto-katakana'})}

export function volcanoSearchText(volcano){const localized=localizedVolcanoName(volcano);return [localized.nameJa,localized.nameEn,volcano?.gvpNumber,volcano?.country,volcano?.region].filter(Boolean).join(' ').toLowerCase()}
