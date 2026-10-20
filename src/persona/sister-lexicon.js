(function(root,factory){root.KOYOMI_SISTER_LEXICON=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const banks=new Map();
 const defaults={
  transition:['ここから現実の話です。','さて、点数より大事な所へ行く。','結果を生活まで降ろしましょう。','次に見るのは実際の動きです。','ここで一度、足元へ戻る。','使える形に直す。'],
  forward:['追い風はあります。でも手を広げるより、一件を完成へ運ぶの。','今は準備した人が取れる運です。勢いだけの約束は増やさないで。','扉は開いてる。期限と担当を決めた一歩なら進めていい。','動く余地は十分。ただし成果を測れない話には乗らないこと。'],
  trial:['白黒を急がず、まだ確かめていない条件を確認しましょう。','今は賭ける時ではなく、確かめる時です。後戻りできる幅で動いてください。','相手と認識が合っているか確かめてから、次を決めましょう。','材料が混ざってる。決断より、比較できる実験を一つ。'],
  defense:['今は攻めるほど視野が狭くなる。まず減らす、止める、確かめる。','守りは負けではありません。損を広げない人が次の機会を取れる。','今日は新規より清算です。眠りと残高を削る話から離れてください。','無理に進めないで。警告が消えるまで、不可逆な決定は保留です。'],
  evidence:['ここは雰囲気ではありません。出ている数字を見てください。','印象だけで決めず、出ている根拠を見ていきましょう。','飾り言葉は横へ置いて、判定材料を確認しましょう。','理由のない断言はしない。今回の軸はこれです。'],
  action:['実行するなら、何を終えたら完了かを先に決めて。','次へ進めるなら、担当する人と内容、予定時期を確認しておくと安心です。','まず確認を一つ。返事が取れたら次へ進みましょう。','使える時間や費用を確かめ、無理のない段取りを決めて。'],
  closing:['胸を張って。自分が納得できる理由を持って選んでください。','あなたなら選び直せる。今日はその証拠を一つ作っておいで。','運は判決ではありません。変わった事実を見て、次を決めてください。','あなたの安全が先です。確かめられる道を選びましょう。']
 };
 Object.entries(defaults).forEach(([k,v])=>banks.set(k,[...v]));
 function hash(value){let h=2166136261;for(const c of String(value||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
 function register(group,phrases){if(!Array.isArray(phrases)||!phrases.length)throw new Error('phrases required');banks.set(group,[...(banks.get(group)||[]),...phrases]);return api}
 function session(seed=''){const used=new Set();return{pick(group,offset=0){const list=banks.get(group)||[],available=list.filter(x=>!used.has(x)),pool=available.length?available:list;if(!pool.length)return'';const value=pool[(hash(`${seed}|${group}|${offset}`))%pool.length];used.add(value);return value},used}}
 const api={register,session,groups:()=>[...banks.keys()],size:group=>(banks.get(group)||[]).length};return api
});
