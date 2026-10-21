(function(root){
 'use strict';
 function assess(method,input={}){
  const checks=[],limits=[];let score=35;
  const add=(condition,weight,yes,no)=>{checks.push({condition:Boolean(condition),description:condition?yes:no});if(condition)score+=weight;else limits.push(no)};
  add(input.validDate,20,'生年月日を確認','生年月日を確認できません');
  if(method==='sukuyo'){
   add(input.lunarAvailable,25,'日本時間の朔・中気から旧暦月日を算出','旧暦換算を確認できません');
   add(input.lunarAvailable&&!input.calendarDifference,10,'採用方式の月配当に二至二分との不一致なし','旧暦の月配当には方式差があります');
   limits.push('閏月は同名の本月と同じ宿の起点を採用');
  }else if(method==='kyusei'){
   add(input.nineStarAvailable,25,'冬至・夏至と甲子から日盤を算出','日盤の転遁を確認できません');
   limits.push('至近甲子・分割置閏方式。別の置閏方式とは一致しない場合があります');
  }else if(['shichu','astrology','timing'].includes(method)){
   add(input.timeAccuracy==='exact',20,'出生時刻は正確','出生時刻の誤差が結果へ影響します');
   add(input.hasCoordinates,10,'出生地座標あり','出生地座標が不足しています');
   if(method==='astrology')add(input.astronomyAvailable,10,'端末内の天文エンジンを使用','天体位置は近似式です');
   limits.push('流派や解釈による差は入力条件の充足とは別です');
  }else if(method==='name'){
   add(input.nameComplete,25,'使用文字の画数が辞書登録済み','画数未登録文字があり判定保留');
   add(input.nameSeparated,10,'姓と名を分けて入力','姓名の区切りを確認してください');
   limits.push('字体と流派によって画数が異なります');
  }else if(['tarot','runes'].includes(method)){
   score=50;checks.push({condition:true,description:'決定論的な展開を使用'});limits.push('象徴解釈です。質問の文字数から的中率は推定しません');
  }else if(method==='numerology'){
   score=input.validDate?80:15;limits.push('数の算術と、性格・未来の解釈の妥当性は別です');
  }else if(method==='kabbalah'){
   score=input.hasRomanName?55:15;limits.push(input.hasRomanName?'ローマ字表記に依存する象徴補助':'ローマ字名がなく判定保留');
  }else if(method==='rokusei'){
   score=35;limits.push('公式判定ではない独自周期です');
  }
  if(!input.validDate||method==='sukuyo'&&!input.lunarAvailable||method==='kyusei'&&!input.nineStarAvailable||method==='name'&&!input.nameComplete)score=15;
  const label=input.validDate&&['tarot','runes'].includes(method)?'象徴補助':input.validDate&&method==='rokusei'?'独自参考':score>=80?'充足':score>=55?'一部制約':'要確認';
  return{score,label,kind:'calculation-readiness',predictiveAccuracy:null,notes:[...checks.map(c=>c.description),...limits,'この指標は的中率ではありません'],checks};
 }
 function formatEvidence(value,english=false){return String(value??'').replace(/^(\d+(?:\.\d+)?)%$/,'$1/100')+(english?' (not predictive accuracy)':'（的中率ではありません）')}
 root.KOYOMI_CALCULATION_READINESS=Object.freeze({assess,formatEvidence});
})(typeof globalThis!=='undefined'?globalThis:this);
