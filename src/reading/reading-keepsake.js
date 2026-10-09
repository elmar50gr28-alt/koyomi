(function(root){
 'use strict';
 const BANK={
  start:[['pen','手元のペン','始めたいことを、自分の言葉で書いて。'],['shoes','いつもの靴','踏み出すなら、自分が向かいたい方向へ。'],['notebook','使いかけのノート','余白に、これから始めたいことを残して。']],
  grow:[['cup','いつものマグカップ','続けてきたものを、急いで結果にしなくていい。'],['notebook','使いかけのノート','前と比べて育ったものに、目を向けて。'],['cloth','手元のハンカチ','毎日使うもののように、大切なことをそばに。']],
  choice:[['pen','手元のペン','誰かの正解より、自分が大切にしたいことを書いて。'],['notebook','使いかけのノート','選んだ先に残したいものを、言葉にして。'],['watch','いつもの時計','返事を急ぐ前に、自分の答えを聞いて。']],
  boundary:[['key','いつもの鍵','守りたいものまで、譲らなくていい。'],['pen','手元のペン','返事の前に、自分ができる範囲を書いて。'],['cloth','手元のハンカチ','相手への配慮と、自分の余裕を両方残して。']],
  rest:[['cup','いつものマグカップ','休む時間を、予定の余りにしないで。'],['cloth','手元のハンカチ','力を抜く時間も、自分のために取って。'],['book','読み慣れた本','答えを出すことから、少し離れる時間を。']],
  release:[['notebook','使いかけのノート','残したいものを、先に言葉にして。'],['key','いつもの鍵','区切りを付けても、大切だった時間まで消えません。'],['cloth','手元のハンカチ','手放す速さは、自分で選んでかまいません。']]
 };
 const EXTRA={
  start:[['memo','手元のメモ用紙','最初の言葉は、きれいにまとまっていなくてもいい。'],['bag','いつものバッグ','出かける先は、自分の願いで選んで。'],['map','手元の地図','まだ歩いていない道にも、目を向けて。'],['calendar','使っているカレンダー','始めたいことのために、時間を空けて。'],['seed','手元の種や木の実','小さな始まりを、すぐに成果で測らないで。'],['envelope','手元の封筒','伝えたい思いに、行き先を与えて。'],['camera','手元のカメラやスマホ','これから残したい景色を、思い描いて。'],['ribbon','手元のリボン','新しい始まりに、自分なりの区切りを。'],['card','手元の名刺や紹介カード','人に見せたい自分を、自分の言葉で。']],
  grow:[['plant','身近な鉢植え','育つ速さは、いつも目に見えるとは限りません。'],['bookmark','使っているしおり','途中のページにも、続けてきた時間がある。'],['pencil','手元の鉛筆','書き直せる余地を、残しておいて。'],['photo','大切な写真','ここまで育ててきたつながりを、思い出して。'],['thread','手元の糸','細い積み重ねも、つながれば形になります。'],['folder','使っているファイル','積み上げたものを、急いで捨てなくていい。'],['bottle','いつもの水筒','続けられる形を、暮らしの中に。'],['recipe','手元のレシピ','受け継いだ工夫に、自分の味を加えて。'],['diary','使っている日記','変わらない日にも、残したいものを。']],
  choice:[['coin','手元の硬貨','表と裏を見ても、答えは自分で選んで。'],['mirror','いつもの鏡','人からどう見えるかより、自分が納得できるかを。'],['bookmark','使っているしおり','今は保留にして、戻る場所を残してもいい。'],['map','手元の地図','近い道だけが、自分に合う道とは限りません。'],['memo','手元のメモ用紙','選びたい理由と、選びたくない理由を並べて。'],['calendar','使っているカレンダー','急ぐ期限と、考える時間を分けて。'],['wallet','いつもの財布','選んだ後に残したい余裕も、大切に。'],['glasses','いつもの眼鏡','見えていることと、思い込んでいることを分けて。'],['ruler','手元の定規','誰かの物差しだけで、自分の選択を測らないで。']],
  boundary:[['umbrella','いつもの傘','誰かを気遣っても、自分の雨まで忘れないで。'],['wallet','いつもの財布','差し出せる分と、守っておく分を分けて。'],['case','使っている小物入れ','大切なものには、置き場所を決めて。'],['ring','手元の指輪','約束は、できる範囲まで含めて交わして。'],['belt','いつものベルト','自分に合う幅を、他人任せにしないで。'],['doorstop','手元のドアストッパー','開いておくことも、閉じることも選べます。'],['folder','使っているファイル','預かったものと、自分の責任を分けて。'],['earphones','いつものイヤホン','外の声だけでなく、自分の声も聞いて。'],['gloves','手元の手袋','力を貸す自分の手も、大切にして。']],
  rest:[['towel','手元のタオル','一日の区切りを、自分のために。'],['blanket','いつものひざ掛け','頑張る姿だけが、あなたの全部ではありません。'],['pillow','いつもの枕','今日の答えを、すべて今夜出さなくてもいい。'],['tea','手元のお茶','何もしないひとときも、予定に入れて。'],['cushion','いつものクッション','腰を落ち着ける場所を、自分にも。'],['photo','大切な写真','考え事から離れて、心に残る景色を。'],['timer','手元のタイマー','休む時間を、後回しにしないで。'],['socks','いつもの靴下','外へ向かう前に、今の自分をいたわって。'],['coaster','手元のコースター','置いて休める場所を、思いの中にも。']],
  release:[['envelope','手元の封筒','しまっておくことも、今の選択です。'],['eraser','手元の消しゴム','書き直しても、考えてきた時間は残ります。'],['box','使っている箱','残したいものから、居場所を決めて。'],['bookmark','使っているしおり','閉じるページにも、意味がありました。'],['photo','大切な写真','離れることと、大切だったことは両立します。'],['scissors','手元のはさみ','区切りは、自分が納得できるところで。'],['bag','いつものバッグ','これから持っていきたいものを、選んで。'],['folder','使っているファイル','終えたことにも、自分なりの置き場所を。'],['ribbon','手元のリボン','結び直せるものまで、捨てなくていい。']]
 };
 for(const axis of Object.keys(BANK))BANK[axis].push(...EXTRA[axis]);
 const MONTH={
  start:[
   ['ticket','手元の切符','行き先を決めるのは、今の自分でいい。'],['postcard','手元の絵はがき','会いたい景色に、思いを向けて。'],['stamp','手元の切手','伝えたい気持ちを、しまったままにしないで。'],['charger','いつもの充電器','動き出す力を、使い切る前に残して。'],['bicycle','いつもの自転車','進む速さも、曲がる方向も自分で選んで。'],['cap','手元の帽子','外へ出る自分に、居心地のよい形を。'],['shoehorn','いつもの靴べら','踏み出す前のひと手間を、大切に。'],['brush','手元のブラシ','今の自分を、少し新しい気持ちで迎えて。'],['magnet','手元のマグネット','忘れたくない願いを、見えるところへ。'],['leaf','身近な葉っぱ','新しい芽に、完成した姿を急がせないで。'],['picturebook','手元の絵本','見慣れた世界を、別の目で眺めて。'],['flower','身近な花','咲かせたい思いに、名前を付けて。'],['music','好きな曲','自分が動きたくなるリズムを思い出して。'],['sticker','手元のシール','ここから始める場所に、自分の目印を。'],['keyholder','いつものキーホルダー','出かける時も、自分の願いを連れて。'],['paperclip','手元のクリップ','散らばった思いを、最初の形にまとめて。'],['sketchbook','使いかけのスケッチブック','うまく描く前に、描きたいものを。'],['fruit','手元の果物','今ある実りを、次の始まりへ。']
  ],
  grow:[
   ['wateringcan','いつものじょうろ','育てたいものに、続けられる分だけ力を。'],['sewingneedle','手元の縫い針','一度の大きさより、つないだ時間を大切に。'],['button','手元のボタン','小さな支えが、全体をつないでいます。'],['knit','いつものニット','積み重ねたものの温かさを思い出して。'],['music','好きな曲','何度も戻りたくなるものを大切に。'],['instrument','手元の楽器','上手さだけでなく、続けたい音を聞いて。'],['fruit','手元の果物','実ったものにも、育つまでの時間があります。'],['spice','手元のスパイス','受け継いだものに、自分らしい工夫を。'],['woodspoon','手元の木のスプーン','毎日の手触りの中で、育つものを。'],['measurecup','いつもの計量カップ','無理なく続けられる量を見つけて。'],['bowl','いつもの器','受け取ったものを、自分の中で育てて。'],['tray','手元のトレー','大切に続けたいものの、置き場所を。'],['album','手元のアルバム','変わったところも、変わらない良さも見て。'],['stamp','手元の切手','続いているつながりに、思いを送って。'],['paperclip','手元のクリップ','一つずつ集めたものを、自分の力に。'],['sticker','手元のシール','できたことにも、目印を付けて。'],['seed','手元の種や木の実','芽が見えない時間まで、失敗と決めないで。'],['comb','いつものくし','毎日のひと手間が、自分を支えます。']
  ],
  choice:[
   ['compass','手元の方位磁針','近道より、自分が向かいたい方向を。'],['list','手元の買い物リスト','欲しいものと、今選びたいものを分けて。'],['ticket','手元の切符','行かない道を選ぶことも、自分の答えです。'],['postcard','手元の絵はがき','どの景色に心が向くか、耳を傾けて。'],['bookmarktab','手元の付箋','決めたいことと、保留したいことを分けて。'],['measuretape','手元のメジャー','背伸びした大きさより、自分に合う幅を。'],['scale','手元のはかり','得るものと、背負うものを両方見て。'],['calculator','いつもの電卓','気持ちと数字を、どちらも置き去りにしないで。'],['playingcards','手元のトランプ','見えている手札から、自分の一手を選んで。'],['puzzle','手元のパズル','今はまらない答えを、無理に押し込まないで。'],['stapler','手元のホチキス','決めたことを、今の自分の形にまとめて。'],['spectaclecase','いつもの眼鏡ケース','自分の見方を、休ませる時間も。'],['light','手元のライト','見えていなかったところにも、目を向けて。'],['stationerycase','いつもの筆箱','自分が使える道具から、答えを形に。'],['button','手元のボタン','大きく変える前に、つなぎ直せる所を。'],['music','好きな曲','選ぶ時には、自分の心が動く音も聞いて。'],['photo','大切な写真','選んだ後にも残したいものを思い出して。'],['bottle','いつもの水筒','続けて持てる重さかどうかも、大切に。']
  ],
  boundary:[
   ['pouch','いつものポーチ','何を中に入れるかは、自分で決めて。'],['lunchbox','いつもの弁当箱','自分に必要な分まで、遠慮しなくていい。'],['partition','手元のブックエンド','自分の場所を、きちんと残して。'],['earplug','手元の耳栓','すべての声に、すぐ答えなくていい。'],['sunglasses','手元のサングラス','眩しすぎる期待から、目を休ませて。'],['mask','手元のマスク','人に合わせる時も、自分の余裕を残して。'],['cap','手元の帽子','外へ向かう自分を、自分でも守って。'],['apron','いつものエプロン','引き受ける役割には、区切りがあっていい。'],['placemat','手元のランチョンマット','自分の分の居場所を、曖昧にしないで。'],['lid','手元のふた','開く時と、閉じておく時を選んで。'],['lock','手元の南京錠','大切なものに、境目を作っていい。'],['nameplate','手元のネームタグ','名乗る役割と、実際に担う範囲を揃えて。'],['charger','いつもの充電器','人に力を貸す前に、自分の余力も見て。'],['paperclip','手元のクリップ','引き受けた範囲を、散らばらせないで。'],['bookmarktab','手元の付箋','今できることと、今は断ることを分けて。'],['watch','いつもの時計','自分の時間にも、約束をして。'],['book','読み慣れた本','一人に戻れる場所を、大切に。'],['bottle','いつもの水筒','自分のために持つ分まで、手放さないで。']
  ],
  rest:[
   ['sleepmask','手元のアイマスク','答えを探す目にも、休む時間を。'],['slippers','いつものスリッパ','外の役割を、少し脱いでいい。'],['robe','いつもの部屋着','人に見せない自分も、大切に。'],['bathsalts','手元の入浴剤','今日は、頑張る話から離れる時間を。'],['music','好きな曲','言葉にならない思いを、音に預けてもいい。'],['album','手元のアルバム','力を抜いて眺められる景色を、そばに。'],['picturebook','手元の絵本','考え続ける頭に、違う景色を。'],['light','手元のライト','夜まで、自分を急かさなくていい。'],['tray','手元のトレー','一度置いて休む場所を、自分にも。'],['bowl','いつもの器','空いている余白も、必要なものです。'],['woodspoon','手元の木のスプーン','急がない手触りを、暮らしの中に。'],['plant','身近な鉢植え','静かな時間を、何もない時間と決めないで。'],['flower','身近な花','役に立つこと以外にも、目を向けて。'],['scent','手元の香りの小物','自分がほっとするものを、そばに。'],['hairband','手元のヘアゴム','張りつめた思いまで、結び続けなくていい。'],['hotwaterbottle','手元の湯たんぽ','自分をいたわる時間を、遠慮しないで。'],['footrest','手元の足置き','足を止める時も、自分に居場所を。'],['bookmark','使っているしおり','今日は途中で閉じても、また戻れます。']
  ],
  release:[
   ['recyclebag','手元の紙袋','手放すものにも、区切りを付ける場所を。'],['label','手元のラベル','残すものと、終えるものに名前を。'],['paperclip','手元のクリップ','ほどいても、またまとめ直せるものがあります。'],['postcard','手元の絵はがき','過ぎた景色を、大切だったものとして。'],['ticket','手元の切符','通ってきた道と、これからの道を分けて。'],['album','手元のアルバム','今は戻らない時間にも、居場所を。'],['leaf','身近な葉っぱ','終わる季節まで、否定しなくていい。'],['flower','身近な花','咲いていた時間を、なかったことにしないで。'],['music','好きな曲','思い出の音を、今の自分で聞いてみて。'],['plant','身近な鉢植え','次へ育つ余白を、残しておいて。'],['pencil','手元の鉛筆','書き直すことは、自分を裏切ることではありません。'],['calendar','使っているカレンダー','過ぎた日に、自分なりの区切りを。'],['coin','手元の硬貨','手元に残すものを、選び直していい。'],['comb','いつものくし','絡まった思いは、一度にほどかなくていい。'],['clothespin','手元の洗濯ばさみ','離していいものと、留めたいものを分けて。'],['keyholder','いつものキーホルダー','持ち歩く思いを、今の自分に合わせて。'],['sieve','手元のざる','全部を残さず、大切なものを選んで。'],['bookmarktab','手元の付箋','途中でやめる時にも、戻れる目印を。']
  ]
 };
 for(const axis of Object.keys(BANK))BANK[axis].push(...MONTH[axis]);
 const VOICE={start:['進むなら、自分の願いを置き去りにしないで。','進むなら、自分の願いを置き去りにしないこと。'],grow:['育てたいものに、力を注いで。','あれもこれも増やさない。育てたいものを選んで。'],choice:['迷いはあっていい。でも、大切にしたいことは曖昧にしないで。','迷いがあってもいい。自分の答えを人任せにしないで。'],boundary:['力を貸すことと、全部を背負うことは分けて。','全部背負わない。力を注ぐ先を選んで。'],rest:['立ち止まる自分を、責めなくていい。','今は無理を増やさない。休む時間も守って。'],release:['区切りを付けることと、過去を否定することは違います。','終わらせるものを選んで。過去の自分まで責めないこと。']};
 function decorate(input,interpretation){
  if(!interpretation?.story)return null;
  const self=(Array.isArray(input.symbols)?input.symbols:[]).find(x=>x?.pos==='自分の立場'||x?.pos==='次の一手'),meaning=self?.meaning||interpretation.items.map(x=>x.reading).join(' ');
  const support=interpretation.items.some(x=>x.kind==='support'),caution=interpretation.items.some(x=>x.kind==='caution');
  let axis=support&&caution?'boundary':caution?'rest':support?'start':'grow';
  if(!support&&!caution){if(interpretation.story.symbolicFocus?.intent)axis=interpretation.story.symbolicFocus.intent;else if(/終結|手放|清算|刷新/.test(meaning))axis='release';else if(/境界|防御|守護|警戒|統率/.test(meaning))axis='boundary';else if(/停止|休息|保留|内省|忍耐/.test(meaning))axis='rest';else if(/選択|決断|正義|思考|不安/.test(meaning))axis='choice';else if(/始まり|始動|再起|転機/.test(meaning))axis='start';}
  if(!support&&!caution&&interpretation.story.symbolicFocus?.intent==='start'&&interpretation.story.symbolicFocus.caution)axis='choice';
  const mode=input.mode==='zubat'?'zubat':'sister',candidates=BANK[axis].map(([id,name,line])=>({id,name,line,axis}));
  if(self?.name==='星'&&/希望/.test(self.meaning))candidates.splice(0,1,{id:'blue',name:'手元の青い小物',line:'希望を、目に見えるところへ。',axis});
  return {...interpretation.story,axis,mode,title:mode==='zubat'?VOICE[axis][1]:interpretation.story.title,keepsakeCandidates:candidates};
 }
 function renderSummary(target,entries=[],priority=''){
  const groups={shichu:['shichu','timing'],astrology:['astrology'],sukuyo:['sukuyo','kyusei','timing'],oracle:['tarot','runes'],name:['name','numerology','kabbalah'],timing:['timing','shichu','astrology']};
  const valid=entries.filter(x=>x?.keepsake?.name&&x.keepsake.line),selected=(groups[priority]||[]).map(id=>valid.find(x=>x.methodId===id)).find(Boolean)||valid[0]||null;
  if(target){
   const values={name:selected?.keepsake.name||'',line:selected?.keepsake.line||'',alternative:selected?.alternative?.name?`手元になければ、${selected.alternative.name}でも。`:'',source:selected?`${selected.label||selected.methodId}の鑑定から`:'',date:selected?.date?`鑑定日：${selected.date}`:''};
   for(const [key,value] of Object.entries(values)){const element=target.querySelector(`[data-lucky-${key}]`);if(element)element.textContent=value;}
   target.hidden=!selected;
  }
  return selected;
 }
 function appendSelected(target,selected,methodId){
  if(!target)return;
  target.querySelector('[data-reading-keepsake]')?.remove();
  if(selected?.methodId!==methodId||!selected.keepsake?.name)return;
  const doc=target.ownerDocument||root.document;if(!doc?.createElement)return;
  const card=doc.createElement('section');card.className='result-card';card.setAttribute('data-reading-keepsake',methodId);
  const title=doc.createElement('h4');title.textContent='今日のお守り';card.appendChild(title);
  for(const [key,tag] of [['name','strong'],['line','p'],['alternative','p'],['source','small']]){const child=doc.createElement(tag);child.setAttribute(`data-lucky-${key}`,'');card.appendChild(child);}
  renderSummary(card,[selected]);target.appendChild(card);
 }
 function selectedText(text,selected,methodId){return selected?.methodId===methodId&&selected.keepsake?.name?`${text}\n\n【今日のお守り】\n${selected.keepsake.name}\n${selected.keepsake.line}${selected.alternative?.name?'\n手元になければ、'+selected.alternative.name+'でも。':''}`:text;}
 function selectionKey(values={}){return JSON.stringify({theme:values.theme||'overall',focus:values.focus||'',priority:values.priority||'integrated'});}
 function watchSettings(doc,onChange){doc?.addEventListener?.('change',event=>{if(['theme','qFocus','qMethodPriority'].includes(event.target?.id))onChange();});}
 function isCurrent(reading,current){return Boolean(reading?.luckyContext&&current&&reading.luckyContext.date===current.date&&reading.luckyContext.profileId===current.profileId&&(reading.luckyContext.selectionKey||'')===(current.selectionKey||''));}
 function currentSelection(reading,current){return isCurrent(reading,current)?reading?.luckyItem||null:null;}
 function syncView(target,reading,current,methodTarget){
  const selected=currentSelection(reading,current);
  renderSummary(target,selected?[{...selected,date:reading.luckyContext.date}]:[]);
  if(methodTarget)appendSelected(methodTarget,selected,'shichu');
  return Boolean(selected);
 }
 root.KOYOMI_READING_KEEPSAKE=Object.freeze({BANK,decorate,renderSummary,appendSelected,selectedText,selectionKey,watchSettings,isCurrent,currentSelection,syncView});
})(typeof globalThis!=='undefined'?globalThis:this);
