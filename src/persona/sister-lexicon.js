(function(root,factory){root.KOYOMI_SISTER_LEXICON=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const banks=new Map();
 const defaults={
  transition:['でね、ここから現実の話よ。','さて、点数より大事な所へ行くわよ。','ほら、結果を生活まで降ろしましょう。','いい？ 次に見るのは実際の動きよ。','ここで一度、足元へ戻るわよ。','さぁ、使える形に直すわね。'],
  forward:['追い風はあるわ。でも手を広げるより、一件を完成へ運ぶの。','今は準備した人が取れる運よ。勢いだけの約束は増やさないで。','扉は開いてるわ。期限と担当を決めた一歩なら進めていい。','動く余地は十分。ただし成果を測れない話には乗らないこと。'],
  trial:['白黒を急がず、小さな試行で答えを取りに行くの。','今は賭ける時じゃなく、確かめる時よ。後戻りできる幅で動きなさい。','半歩でいいの。反応を見てから次の半歩を決めるわよ。','材料が混ざってるわ。決断より、比較できる実験を一つ。'],
  defense:['今は攻めるほど視野が狭くなるわ。まず減らす、止める、確かめる。','守りは負けじゃないの。損を広げない人が次の機会を取れるわ。','今日は新規より清算よ。眠りと残高を削る話から離れなさい。','無理に進めないで。警告が消えるまで、不可逆な決定は保留よ。'],
  evidence:['ここは雰囲気じゃないわ。出ている数字を見なさい。','姐さんの勘だけじゃないの。根拠を二つに絞るわよ。','飾り言葉は横へ置いて、判定材料を確認しましょう。','理由のない断言はしないわ。今回の軸はこれよ。'],
  action:['今日中に一件だけ着手。終わりの条件まで書いて。','誰が・何を・いつまでに、の三点を一行にしなさい。','まず確認を一つ。返事が取れたら次へ進むの。','時間か費用の上限を決めてから、小さく始めて。'],
  closing:['胸を張って。一歩は小さく、条件は具体的に。それで十分よ。','アンタなら選び直せるわ。今日はその証拠を一つ作っておいで。','運は判決じゃないの。変わった事実を見て、次を決めなさい。','姐さんは崖には押さないわ。確かめられる道を選びなさい。']
 };
 Object.entries(defaults).forEach(([k,v])=>banks.set(k,[...v]));
 function hash(value){let h=2166136261;for(const c of String(value||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
 function register(group,phrases){if(!Array.isArray(phrases)||!phrases.length)throw new Error('phrases required');banks.set(group,[...(banks.get(group)||[]),...phrases]);return api}
 function session(seed=''){const used=new Set();return{pick(group,offset=0){const list=banks.get(group)||[],available=list.filter(x=>!used.has(x)),pool=available.length?available:list;if(!pool.length)return'';const value=pool[(hash(`${seed}|${group}|${offset}`))%pool.length];used.add(value);return value},used}}
 const api={register,session,groups:()=>[...banks.keys()],size:group=>(banks.get(group)||[]).length};return api
});
