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
  start:[['memo','手元のメモ用紙','最初の言葉は、きれいにまとまっていなくてもいい。'],['bag','いつものバッグ','出かける先は、自分の願いで選んで。'],['map','手元の地図','まだ歩いていない道にも、目を向けて。'],['calendar','使っているカレンダー','始めたいことのために、時間を空けて。'],['seed','手元の種や木の実','小さな始まりを、すぐに成果で測らないで。'],['envelope','手元の封筒','伝えたい思いに、行き先を与えて。'],['camera','手元のカメラやスマホ','これから残したい景色を、思い描いて。'],['ribbon','手元のリボン','新しい始まりに、自分なりの区切りを。'],['card','手元のカード','人に見せたい自分を、自分の言葉で。']],
  grow:[['plant','身近な鉢植え','育つ速さは、いつも目に見えるとは限りません。'],['bookmark','使っているしおり','途中のページにも、続けてきた時間がある。'],['pencil','手元の鉛筆','書き直せる余地を、残しておいて。'],['photo','大切な写真','ここまで育ててきたつながりを、思い出して。'],['thread','手元の糸','細い積み重ねも、つながれば形になります。'],['folder','使っているファイル','積み上げたものを、急いで捨てなくていい。'],['bottle','いつもの水筒','続けられる形を、暮らしの中に。'],['recipe','手元のレシピ','受け継いだ工夫に、自分の味を加えて。'],['diary','使っている日記','変わらない日にも、残したいものを。']],
  choice:[['coin','手元の硬貨','表と裏を見ても、答えは自分で選んで。'],['mirror','いつもの鏡','人からどう見えるかより、自分が納得できるかを。'],['bookmark','使っているしおり','今は保留にして、戻る場所を残してもいい。'],['map','手元の地図','近い道だけが、自分に合う道とは限りません。'],['memo','手元のメモ用紙','選びたい理由と、選びたくない理由を並べて。'],['calendar','使っているカレンダー','急ぐ期限と、考える時間を分けて。'],['wallet','いつもの財布','選んだ後に残したい余裕も、大切に。'],['glasses','いつもの眼鏡','見えていることと、思い込んでいることを分けて。'],['ruler','手元の定規','誰かの物差しだけで、自分の選択を測らないで。']],
  boundary:[['umbrella','いつもの傘','誰かを気遣っても、自分の雨まで忘れないで。'],['wallet','いつもの財布','差し出せる分と、守っておく分を分けて。'],['case','使っている小物入れ','大切なものには、置き場所を決めて。'],['ring','手元の指輪','約束は、できる範囲まで含めて交わして。'],['belt','いつものベルト','自分に合う幅を、他人任せにしないで。'],['doorstop','手元のドアストッパー','開いておくことも、閉じることも選べます。'],['folder','使っているファイル','預かったものと、自分の責任を分けて。'],['earphones','いつものイヤホン','外の声だけでなく、自分の声も聞いて。'],['gloves','手元の手袋','力を貸す自分の手も、大切にして。']],
  rest:[['towel','手元のタオル','一日の区切りを、自分のために。'],['blanket','いつものひざ掛け','頑張る姿だけが、あなたの全部ではありません。'],['pillow','いつもの枕','今日の答えを、すべて今夜出さなくてもいい。'],['tea','手元のお茶','何もしないひとときも、予定に入れて。'],['cushion','いつものクッション','腰を落ち着ける場所を、自分にも。'],['photo','大切な写真','考え事から離れて、心に残る景色を。'],['timer','手元のタイマー','休む時間を、後回しにしないで。'],['socks','いつもの靴下','外へ向かう前に、今の自分をいたわって。'],['coaster','手元のコースター','置いて休める場所を、思いの中にも。']],
  release:[['envelope','手元の封筒','しまっておくことも、今の選択です。'],['eraser','手元の消しゴム','書き直しても、考えてきた時間は残ります。'],['box','使っている箱','残したいものから、居場所を決めて。'],['bookmark','使っているしおり','閉じるページにも、意味がありました。'],['photo','大切な写真','離れることと、大切だったことは両立します。'],['scissors','手元のはさみ','区切りは、自分が納得できるところで。'],['bag','いつものバッグ','これから持っていきたいものを、選んで。'],['folder','使っているファイル','終えたことにも、自分なりの置き場所を。'],['ribbon','手元のリボン','結び直せるものまで、捨てなくていい。']]
 };
 for(const axis of Object.keys(BANK))BANK[axis].push(...EXTRA[axis]);
 const VOICE={start:['進むなら、自分の願いを置き去りにしないで。','進むなら、自分の願いを置き去りにしないこと。'],grow:['育てたいものに、力を注いで。','あれもこれも増やさない。育てたいものを選んで。'],choice:['迷いはあっていい。でも、大切にしたいことは曖昧にしないで。','迷いがあってもいい。自分の答えを人任せにしないで。'],boundary:['力を貸すことと、全部を背負うことは分けて。','全部背負わない。力を注ぐ先を選んで。'],rest:['立ち止まる自分を、責めなくていい。','今は無理を増やさない。休む時間も守って。'],release:['区切りを付けることと、過去を否定することは違います。','終わらせるものを選んで。過去の自分まで責めないこと。']};
 function decorate(input,interpretation){
  if(!interpretation?.story)return null;
  const self=(Array.isArray(input.symbols)?input.symbols:[]).find(x=>x?.pos==='自分の立場'||x?.pos==='次の一手'),meaning=self?.meaning||interpretation.items.map(x=>x.reading).join(' ');
  const support=interpretation.items.some(x=>x.kind==='support'),caution=interpretation.items.some(x=>x.kind==='caution');
  let axis=support&&caution?'boundary':caution?'rest':support?'start':'grow';
  if(!support&&!caution){if(/終結|手放|清算|刷新/.test(meaning))axis='release';else if(/境界|防御|守護|警戒|統率/.test(meaning))axis='boundary';else if(/停止|休息|保留|内省|忍耐/.test(meaning))axis='rest';else if(/選択|決断|正義|思考|不安/.test(meaning))axis='choice';else if(/始まり|始動|再起|転機/.test(meaning))axis='start';}
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
