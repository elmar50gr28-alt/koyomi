(function(root){
 'use strict';
 const CONDITIONS={work:'担当・期限・完了条件',money:'総額・継続費・解約条件',relationship:'相手の意思・連絡の負担・合意',health:'症状・休息・必要な受診',growth:'学ぶ目的・使う場面・続けられる負担',timing:'期限・準備の状況・変更できる範囲',overall:'必要な情報・負担・見直せる条件'};
 function storyOf(input,items){
  const kind=id=>items.find(x=>x.id===id)?.kind;
  const symbols=Array.isArray(input.symbols)?input.symbols:[];
  let title='',body='',invitation='';
  if(['shichu','timing'].includes(input.methodId)){
   if(kind('大運')==='support'&&kind('流年')==='caution'){
    title='先へ行く力を、急がせないで';body='長期の流れには、準備してきたことを前へ運ぶ力が出ています。ただ、今年の流れは、その力を一度に使い切らない読みです。遠くへ向かう気持ちと、今の歩幅が違っていても、矛盾ではありません。もし進みたいのに足が止まる感覚があるなら、夢を小さくするより、今年背負う荷物を選ぶことに目を向けてみてください。';invitation='続けたいことを守るために、今は引き受けないものも選んでみて。';
   }else if(kind('大運')==='caution'&&kind('流年')==='support'){
    title='今の追い風を、長く続く力に';body='長期の流れには慎重さが残る一方、今年は前へ進む力が出ています。ずっと重かった扉が、今だけ少し軽くなるような組合せです。ここで大切なのは、長い約束を増やすことより、今ある余地をどう使うか。動ける時期を、背負うものを増やす時期と同じにしなくてもよさそうです。';invitation='今年できることと、長く続けられることを分けて考えてみて。';
   }else if(kind('流年')==='support'&&kind('選択日')==='caution'){
    title='今日は立ち止まっても、道は続いている';body='今年の流れは取り組みを後押ししていますが、今日の流れには慎重さが出ています。目指す方向を変えるというより、途中で足元を見直すような読みです。もし今日うまく進まないことがあっても、それだけで計画全体の答えを出さなくてかまいません。';invitation='今日のためらいと、長く大切にしたい方向を分けてみて。';
   }else if(kind('流年')==='caution'&&kind('選択日')==='support'){
    title='今日の明るさを、無理のない一歩に';body='今年の流れには負担への注意がありますが、今日は前へ進む力が出ています。重たい季節の途中で、少し光が差すような組合せです。その光を、全部を取り戻すために使わなくてもかまいません。今の自分が続けられる範囲で、動かしたいことへ向けてみてください。';invitation='今日動かせることを、明日も背負える大きさで選んでみて。';
   }else{
    const focus=items.find(x=>x.id==='選択日')||items.find(x=>x.id==='流年')||items[0];
    title=focus.kind==='support'?'育ててきたものを、外へ':focus.kind==='caution'?'進まない時間にも、意味を持たせて':'答えを決める前に、手応えを';
    body=focus.kind==='support'?'今回の流れは、準備してきたことを表に出す読みです。完成するまで隠しておくより、今ある形を見せることで次の方向を考えられそうです。うまく見せることだけを目指さず、何を伝えたいのかを大切にしてみてください。':focus.kind==='caution'?'今回の流れは、広げることより今ある負担を見直す読みです。立ち止まると、置いていかれるように感じることもあります。でも、この判定からは、進む量だけで自分を測らない時間として読めます。続けるために残したいものへ目を向けてみてください。':'今回の流れは、勢いだけで結論に飛ぶより、実際の手応えを見ながら選ぶ読みです。まだ答えにならない感覚も、考える途中の材料として扱ってかまいません。';
    invitation=focus.kind==='support'?'今の形で伝えたいことを、言葉にしてみて。':focus.kind==='caution'?'手放すものより、残したいものから考えてみて。':'今分かることから、自分の答えを育ててみて。';
   }
  }else if(input.methodId==='astrology'){
   title=kind('harmony')&&kind('tension')?'進む力と、引っかかる感覚のあいだ':kind('harmony')?'力まずに進める道を探して':'引っかかるところに、目を向けて';
   body=kind('harmony')&&kind('tension')?'調和と緊張の配置が、同時に出ています。進みやすい部分がある一方、力を入れるほど食い違う部分もあるという読みです。すべてを一つの勢いで押すより、自然に動くところと、話し直したいところを分けてみてください。引っかかりは、計画を全部否定するためでなく、進め方を変える手掛かりとして読めます。':kind('harmony')?'調和の配置は、すでに整っている条件を使う読みです。もっと頑張ることだけを探さず、今あるつながりや準備をどう生かせるかに目を向けてみてください。':'緊張の配置は、負担や食い違いを見直す読みです。引っかかるところを力で通すより、何が噛み合っていないかを見つける時間として使えそうです。';invitation='自然に進む部分と、力を入れすぎている部分を見比べてみて。';
  }else if(['tarot','runes'].includes(input.methodId)){
   const roles=input.methodId==='tarot'?['自分の立場','障害','最終結果']:['現在の核','越える課題','次の一手'];
   const picked=roles.map(role=>symbols.find(x=>x?.pos===role&&x.name&&x.meaning)).filter(Boolean);
   if(!picked.length)return null;
   const lead=picked[0];title=`「${lead.name}」が照らす、今の立ち位置`;
   body=picked.map(x=>`${x.pos}に出た「${x.name}」${x.reversed?'（反転）':''}は、「${x.meaning}」という象徴です。`).join('');
   const self=picked.find(x=>x.pos==='自分の立場'),obstacle=picked.find(x=>x.pos==='障害');
   if(self?.name==='月'&&!self.reversed&&/不安/.test(self.meaning)&&obstacle?.name==='皇帝'&&!obstacle.reversed&&/統率/.test(obstacle.meaning)){
    title='はっきり決めたいのに、輪郭が見えない';body+='月の揺れる感覚と、障害に出た皇帝の決める力を重ねると、「まだ見えないものまで、形を決めようとする」という葛藤として読めます。もし重なる思いがあるなら、答えを急ぐ前に、言葉になっていない違和感へ目を向けてみてください。';invitation='まだ決められない理由を、責めずに言葉にしてみて。';
   }else{
    const theme=String(lead.meaning).split(/の停滞|を素直/)[0];
    const voices={'感情・関係':['気持ちに、先に答えを出さなくていい','気持ちをすぐに好き嫌いの答えへ変えず、どの言葉や出来事に心が動くのかを眺める読みです。','最近心が動いた場面を思い出し、何を大切にしたかったのか言葉にしてみて。'],'現実・お金':['思いを、暮らしの中の形に','望むものを思い描くだけでなく、暮らしの中でどう形にするかへ目を向ける読みです。夢と現実を対立させるより、両方が重なる場所を探してみてください。','望んでいることが暮らしの中で実現したら、何が変わるか思い描いてみて。'],'行動・情熱':['その熱を、どこへ向けたい？','動きたい思いを、何へ向けたいのかを眺める読みです。勢いの強さだけでなく、それを使った先に何を残したいかに目を向けてみてください。','動いた先に残したいものを、言葉にしてみて。'],'思考・決断':['正しい答えと、自分の答え','考える力を、結論を急ぐためでなく、自分にとって何が大切かを見つけるために使う読みです。人に説明できる理由と、自分が納得できる理由を見比べてみてください。','この選択で大切にしたいことを、誰かの正解ではなく自分の言葉にしてみて。']};
    if(voices[theme]){const voice=voices[theme];title=`${voice[0]} — ${lead.name}`;body+=voice[1];invitation=voice[2]}
    else body+='もし心に残る言葉があるなら、今の相談のどこに重なるのか、そこから眺めてみてください。';
    if(self&&obstacle&&String(self.meaning).split(/の停滞|を素直/)[0]===String(obstacle.meaning).split(/の停滞|を素直/)[0])body+='同じテーマが自分の立場と障害の両方に出ています。その力を失くすより、どこまで使うかを考える並びです。';
   }
   invitation=invitation||'いちばん心に残った象徴を、自分の言葉で言い直してみて。';
  }else{
   title={numerology:'今年のテーマを、自分の歩き方に',sukuyo:'人との距離を、もう一度眺めて',kyusei:'自分を変える前に、いる場所を見て',name:'名前に託すものと、今の自分',kabbalah:'人前の役割と、内側の声',rokusei:'今の季節に合う、力の使い方'}[input.methodId];
   if(!title)return null;
   body=items.map(x=>x.reading.replace('既存の解釈では','この占術では')).join('');
   body+={numerology:'そのテーマを、そのまま自分に当てはめる必要はありません。今の暮らしの中で、どこならその力を使いたいと思えるか。そこから一年の歩き方を考えてみてください。',sukuyo:'近づけばすべてがよくなる、と読まなくてもかまいません。支え合うこと、役割を分けること、一人に戻ること。その距離の言葉が今の相談に重なるなら、関わり方を見つめる入口にしてみてください。',kyusei:'うまく力が出ない時、自分を変えようとする前に、いる場所や動き方へ目を向ける読みです。象意の強みが、どんな場面なら自然に出せるかを思い描いてみてください。',name:'名前の言葉に合わせて、別人になろうとしなくてもかまいません。呼ばれた時に求められる役割と、自分が引き受けたい役割。その間に違いがあるなら、どちらも見つめてみてください。',kabbalah:'人前で果たす役割と、一人に戻った時の願いは、いつも同じでなくてもかまいません。二つの数を、どちらかが正しいと決めるためでなく、両方の自分に言葉を与える鏡として読んでみてください。',rokusei:'季節ごとに力の使い方が違うように、この周期も、いつも同じ速さで進むためのものではありません。今の周期の言葉から、育てたいものや区切りを付けたいものを思い浮かべてみてください。'}[input.methodId];
   invitation={numerology:'今年のテーマに、今の自分が重なるところを探してみて。',sukuyo:'近さだけでなく、心地よく関われる距離を考えてみて。',kyusei:'力を出しやすい場所や段取りを、思い描いてみて。',name:'名前で期待される役割と、自分が望む役割を見比べてみて。',kabbalah:'人に見せる自分と、休ませたい自分を両方言葉にしてみて。',rokusei:'この周期の言葉を、今の暮らしのどこに使うか考えてみて。'}[input.methodId];
  }
  if(['shichu','timing'].includes(input.methodId)&&kind('day-fit')==='caution')body+='選択日の相性には慎重さが残るため、勢いだけで押し切る読みにはしません。';
  return {title,body,invitation,evidence:items.map(x=>root.KOYOMI_APP_NARRATIVE?.publicEvidence(x.basis)||x.basis).join('／')};
 }
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
  const story=storyOf(input,items);
  return {items,mixed,connection,story,check:`相談では、${condition}を現実の情報と照らし合わせます。`,key:JSON.stringify(items.map(x=>[x.id,x.basis,x.reading])),text:(connection?connection+'\n':'')+items.map(x=>`「${root.KOYOMI_APP_NARRATIVE?.publicEvidence(x.basis)||x.basis}」から、${x.reading}`).join('\n')+ (mixed&&!connection?'\n後押しと注意の両方があります。進められる部分と、調整が必要な部分を分けます。':'')+(limit?'\n'+limit:''),application:`相談では、${condition}を現実の情報と照らし合わせます。${mixed?'準備済みの部分は進め、未合意や負担の大きい部分は確認してから判断してください。':'条件が揃う部分から判断し、未確認の部分は保留してください。'}`};
 }
 root.KOYOMI_METHOD_INTERPRETATION=Object.freeze({interpret});
})(typeof globalThis!=='undefined'?globalThis:this);
