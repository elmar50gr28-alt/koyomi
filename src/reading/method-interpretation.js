(function(root){
 'use strict';
 const CONDITIONS={work:'担当・期限・完了条件',money:'総額・継続費・解約条件',relationship:'相手の意思・連絡の負担・合意',health:'症状・休息・必要な受診',growth:'学ぶ目的・使う場面・続けられる負担',timing:'期限・準備の状況・変更できる範囲',overall:'必要な情報・負担・見直せる条件'};
 function relationshipOf(items,methodId){
  const kind=id=>items.find(x=>x.id===id)?.kind;
  if(['shichu','timing'].includes(methodId)){
   if(kind('大運')==='support'&&kind('流年')==='caution')return '長期には前へ進む材料がありますが、今年は負担を見直す材料が出ています。長い目で進めたいことと、今年引き受ける量を分けて読む組合せです。';
   if(kind('大運')==='caution'&&kind('流年')==='support')return '今年には前へ進む材料がありますが、長期には負担を見直す材料が残っています。今年の後押しだけで、長く続く約束まで増やさない読み方です。';
   if(kind('流年')==='support'&&kind('選択日')==='caution')return '今年の取り組みには後押しがありますが、今日は条件を見直す材料が出ています。方針を捨てるより、今日実行する部分を確かめて読む組合せです。';
   if(kind('流年')==='caution'&&kind('選択日')==='support')return '今日は前へ進む材料がありますが、今年の負担への注意は残っています。今日の後押しを、負担を増やしてよい理由にしないでください。';
  }
  if(methodId==='astrology'&&kind('harmony')&&kind('tension'))return '調和と緊張の配置が同時にあります。整っている条件を使うことと、食い違いを調整することの両方が必要という読みです。';
  if(methodId==='tarot'&&['障害','自分の立場','最終結果'].every(id=>kind(id)))return '自分の立場は変えられる姿勢、障害は確かめたい条件として読みます。最終結果だけを結論にせず、途中の条件と合わせて考えます。';
  if(methodId==='runes'&&['現在の核','越える課題','次の一手'].every(id=>kind(id)))return '現在の核から状況を眺め、越える課題を確かめてから次の一手へつなぎます。次手の象徴だけで、課題が解消したとは読みません。';
  return '';
 }
 function interpret(input={}){
  const facts=Array.isArray(input.evidence)?input.evidence.map(String):[],items=[];
  if(input.methodId==='timing')for(const x of input.interpretationAssets||[])if(x?.basis)facts.push(String(x.basis));
  const add=(id,basis,reading,kind='neutral')=>items.push({id,basis,reading,kind});
  const number=prefix=>{const s=facts.find(x=>x.startsWith(prefix)&&/^[+-]?\d+(?:\.\d+)?$/.test(x.slice(prefix.length)));if(!s)return null;const v=Number(s.slice(prefix.length));return Number.isFinite(v)?{basis:s,value:v}:null};
  const missing=facts.some(x=>/判定保留|未入力|未登録|未算出/.test(x));
  if(missing)return null;
  if(['shichu','timing'].includes(input.methodId)){
   for(const [prefix,label] of [['大運','長期の方針'],['流年','今年の取り組み'],['選択日','今日の進め方']]){const n=number(prefix);if(n&&n.value>=0&&n.value<=100)add(prefix,n.basis,`${label}は${n.value>=68?'準備したことを進める':n.value<45?'負担を増やす前に条件を見直す':'実行条件を確かめる'}材料です。`,n.value>=68?'support':n.value<45?'caution':'neutral')}
   const n=number('日五行→用神補正');if(n&&n.value!==0)add('day-fit',n.basis,`選択日との相性は${n.value>0?'判定を後押し':'判定を抑える'}補正です。長期の傾向そのものとは分けて扱います。`,n.value>0?'support':'caution');
  }else if(input.methodId==='astrology'){
   const soft=number('調和トランジット強度'),hard=number('緊張トランジット強度');
   if(soft&&soft.value>0)add('harmony',soft.basis,'調和の配置は、すでに整っている条件を使って進める材料として読みます。','support');
   if(hard&&hard.value>0)add('tension',hard.basis,'緊張の配置は、負担や食い違いのある条件を調整する材料として読みます。','caution');
  }else if(['tarot','runes'].includes(input.methodId)){
   const symbols=Array.isArray(input.symbols)?input.symbols:[];
   const relevant=input.methodId==='tarot'?symbols.filter(x=>['障害','自分の立場','最終結果'].includes(x?.pos)):symbols;
   for(const card of relevant.slice(0,3)){if(!card||!card.name||!card.meaning)continue;const role=String(card.pos||'今回の象徴');add(role,`${role}：${card.name}${card.reversed?'（反転）':''}`,`「${card.meaning}」を${role}の観点から読みます。`)}
   if(items.length)items[items.length-1].reading+='象徴は相手の気持ちや将来の出来事を確定するものではありません。';
  }else if(input.methodId==='numerology'){
   const year=number('個人年'),meaning=facts.find(x=>/数$|マスターナンバー$/.test(x));if(year&&meaning)add('year',year.basis,`今年のテーマは「${meaning}」です。一年の取り組み方を考える材料で、今日だけの吉凶ではありません。`);
  }else if(input.methodId==='sukuyo'){
   const rel=facts.find(x=>/^(命|業胎|栄親|友衰|危成|安壊|中間距離)：/.test(x));if(rel)add('distance',rel,`選択日との距離は「${rel.split('：')[1]}」という既存の解釈です。相手との相性や相手の意思を判定した結果ではありません。`);
  }else if(['kyusei','name','rokusei'].includes(input.methodId)){
   for(const x of input.interpretationAssets||[]){if(x?.basis&&x?.meaning)add(String(x.basis),String(x.basis),`既存の解釈では「${x.meaning}」を扱います。`,x.kind||'neutral')}
   if(input.methodId==='name'&&items.length)items[items.length-1].reading+='名前の材料は日付だけでは変わりません。日々の出来事の予測とは分けます。';
   if(input.methodId==='rokusei'&&items.length)items[items.length-1].reading+='本アプリ独自の近似周期による参考読みです。';
  }else if(input.methodId==='kabbalah'){
   const birth=number('生年月日核'),name=number('名前核'),bridge=number('橋数');
   if(birth&&name&&bridge){add('inner',birth.basis,'内側の長期課題を見る象徴値です。');add('role',name.basis,'社会で呼ばれ、役割を担う時の表現を見る象徴値です。');add('bridge',bridge.basis,'内側の課題と人前の役割を比べる補助線です。差の大小だけで性格や日々の吉凶を断定しません。')}
  }
  if(!items.length)return null;
  const mixed=items.some(x=>x.kind==='support')&&items.some(x=>x.kind==='caution');
  const condition=CONDITIONS[input.domain]||CONDITIONS.overall;
  const limit=Number(input.confidence)<50?'入力の確度が低いため、この解釈は確認の手掛かりに留めます。':'';
  const connection=relationshipOf(items,input.methodId);
  return {items,mixed,connection,check:`相談では、${condition}を現実の情報と照らし合わせます。`,key:JSON.stringify(items.map(x=>[x.id,x.basis,x.reading])),text:(connection?connection+'\n':'')+items.map(x=>`「${root.KOYOMI_APP_NARRATIVE?.publicEvidence(x.basis)||x.basis}」から、${x.reading}`).join('\n')+ (mixed&&!connection?'\n後押しと注意の両方があります。進められる部分と、調整が必要な部分を分けます。':'')+(limit?'\n'+limit:''),application:`相談では、${condition}を現実の情報と照らし合わせます。${mixed?'準備済みの部分は進め、未合意や負担の大きい部分は確認してから判断してください。':'条件が揃う部分から判断し、未確認の部分は保留してください。'}`};
 }
 root.KOYOMI_METHOD_INTERPRETATION=Object.freeze({interpret});
})(typeof globalThis!=='undefined'?globalThis:this);
