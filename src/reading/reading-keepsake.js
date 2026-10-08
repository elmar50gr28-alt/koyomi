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
 root.KOYOMI_READING_KEEPSAKE=Object.freeze({BANK,decorate});
})(typeof globalThis!=='undefined'?globalThis:this);
