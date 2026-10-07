(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KOYOMI_ADAPTIVE_NARRATIVE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const VERSION='1.2.0',STRUCTURES=['verdict','contrast','practice','conditions','timeline','reflection','protect'];
 const BANNED=/(四柱推命|宿曜|九星(?:気学)?|西洋占星術|タロット|ルーン|姓名判断|数秘(?:術)?|カバラ|六星|大運|流年|日主|用神|喜神|忌神|五行|空亡|命式|トランジット|アスペクト|正位置|逆位置|\d+(?:\.\d+)?\s*(?:点|件|\/100))/;
 const CERTAINTY=/(必ず|絶対|確実に|間違いなく).{0,12}(起きる|なる|成功|失敗|別れる|治る)/;
 const DEFAULTS={
  openings:{forward:['今日は、準備してきたことを現実へ移していい日よ。','動くなら今日。温めてきた話を一つ、外へ出しましょう。','追い風はあるわ。ただし、広げるより狙いを定めること。'],test:['今日は「決める日」ではなく「確かめる日」よ。','前へは進める。でも、答えを固定するにはまだ早いわ。','判断に必要な条件を確かめたい日ね。'],protect:['今日は増やさないことが、いちばん賢い選択よ。','無理に前へ出なくていいわ。守ることで残せるものがある日。','いま必要なのは勢いより整理。今の負担を見直しましょう。']},
  scenes:{work:['頼まれ事や役割の話が出たら、担当と期限を分けて聞いて。','返事を求められたら、引き受ける範囲を一文にしてから答えて。','提案するなら、理想より最初の一手を見せると話が通りやすいわ。'],money:['買うか迷ったら、値段より使う回数と維持費を並べて。','魅力的な条件ほど、解約や追加費用を先に確かめて。','今日は得を探すより、不要な支出を一つ止めるほうが効くわ。'],relationship:['相手の気持ちを読む前に、実際に言われたことと自分の想像を分けて。','話すなら一つの論点だけ。昔の不満まで同じ席に座らせないこと。','返事の速さではなく、約束した行動が続くかを見て。'],health:['予定を詰める前に、睡眠と疲れの残り方を基準にして。','頑張れるかではなく、明日も続けられる量かで決めて。','不調が続くなら、占いで結論を出さず専門家へ相談して。'],overall:['迷ったら、今日中に終わり、元にも戻せるほうを選んで。','新しい予定を増やす前に、いま抱えている一件を終わらせて。','返事を急かされたら、まだ分からない条件を質問して。']},
  closes:['運は命令じゃないわ。最後に選ぶのは、ちゃんと状況を見たあなたよ。','明日の自分が困らないかも考えて、納得できる方を選びなさい。','焦らなくて大丈夫。条件を言葉にできた時点で、もう迷いは半分ほどけているわ。','勢いより納得よ。あとから自分に説明できる選択をして。']
 };
 let catalog=DEFAULTS;
 const ACTIONS={
  overall:{forward:'準備が揃っている用事を進め、終わりの状態を確認する',test:'分かっている条件と、判断に足りない情報を分ける',protect:'急がない予定を後日に回し、余裕を確保する'},
  work:{forward:'準備してきた提案を、相手に判断してほしい点とともに伝える',test:'担当する範囲と期限を相手と確認する',protect:'今の仕事量を確認し、急がない仕事の期限を相談する'},
  money:{forward:'支払い前に、必要性と総額、契約条件に納得できるか確認する',test:'総額・維持費・やめる場合の費用を比較する',protect:'支払いを急がず、不明な費用や条件を確認する'},
  relationship:{forward:'伝えたい内容がまとまったら、相手と話す機会を相談する',test:'相手と合意していることと、自分の想像を分ける',protect:'返事や約束を急がず、自分が引き受けられる範囲を確かめる'},
  health:{forward:'生活の予定を見渡し、食事や休息を後回しにしないよう調整する',test:'体調に合わせて予定を組み直し、休む時間を確保する',protect:'急がない用事を後日に回し、心身を休める時間を確保する'}
 };
 const STOPS={
  overall:'予定や約束に無理が出たら、負担と優先順位を見直して。',
  work:'担当や期限の合意が崩れたら、引き受ける範囲を確認し直して。',
  money:'総額や継続費が想定を超える、契約条件が違う場合は、支払い前に確認して。',
  relationship:'約束と実際の行動が違う、自分の都合が尊重されない場合は、距離と合意を見直して。',
  health:'不調が強い、急に悪化する、長く続く場合は、占いより医療機関への相談を優先して。'
 };
 function reasonValues(input){const value=input.reasons||input.evidence;return(Array.isArray(value)?value:[value]).filter(value=>value!=null)}
 function selectedAction(input,d,s){
  if(input.serious||Number(input.risk)>=70){
   if(d==='relationship')return '一人で抱えず、信頼できる人や相談窓口へ状況を共有する';
   if(d==='health')return '安全を確保し、急な悪化や強い症状は医療機関へ相談する';
  }
  const requested=clean(input.action);if(requested)return requested;
  if(reasonValues(input).some(value=>/判定保留|未入力|未登録|未算出/.test(clean(value))))return '不足している入力や算出結果を確認し、補える情報があるか確かめる';
  return ACTIONS[d][s];
 }
 function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
 function hash(v){let h=2166136261;for(const c of String(v))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
 function pick(list,seed,offset=0){const a=list?.length?list:[''];return a[((hash(seed)+offset*2654435761)>>>0)%a.length]}
 function domain(v){const x=clean(v).toLowerCase(),m={career:'work',changejob:'work',income:'money',purchase:'money',love:'relationship',marriage:'relationship',reconcile:'relationship',healthrhythm:'health',identity:'overall',timing:'overall'};return Object.hasOwn(catalog.scenes,x)?x:(Object.hasOwn(m,x)?m[x]:'overall')}
 function state(v,score){return['forward','test','protect'].includes(v)?v:Number(score)>=72?'forward':Number(score)<42?'protect':'test'}
 function recentStructures(history){return(history||[]).map(x=>x?.narrative?.structure).filter(Boolean).slice(0,4)}
 function eligible(input){if(input.serious||Number(input.risk)>=70)return['protect'];if(input.contradiction)return['contrast','conditions','practice'];if(input.state==='forward')return['verdict','practice','timeline'];if(input.state==='protect')return['protect','conditions','reflection'];return['practice','conditions','contrast','timeline','reflection']}
 function chooseStructure(input,attempt=0){const recent=recentStructures(input.history),pool=eligible(input),fresh=pool.filter(x=>!recent.slice(0,2).includes(x)),use=fresh.length?fresh:pool;return pick(use,input.seed,attempt)}
 function parts(input,attempt){
  const d=domain(input.domain),s=state(input.state,input.score),seed=`${input.seed}|${d}|${s}|${attempt}`,raw=reasonValues(input),missing=raw.some(value=>/判定保留|未入力|未登録|未算出/.test(clean(value))),serious=input.serious||Number(input.risk)>=70;
  const reasons=raw.map(clean).filter(value=>value&&!BANNED.test(value)).slice(0,2);
  const opening=serious?'いまは鑑定の強さより、安全を先に考えてね。':missing?'必要な入力や算出結果が揃っていないため、結果は参考として扱ってね。':pick(catalog.openings[s],seed,1);
  let scene=pick(catalog.scenes[d]||catalog.scenes.overall,seed,2),stop=clean(input.stop||input.caution)||STOPS[d];
  if(serious&&d==='relationship'){scene='危険を感じるなら、相手との距離を取り、信頼できる人や相談窓口につながって。';stop='暴言・脅し・監視・金銭支配・強要を我慢しないで。'}
  if(serious&&d==='health'){scene='強い症状や急な悪化があるなら、受診など現実の対応を優先して。';stop='占いの結果を理由に受診や休息を遅らせないで。'}
  const reason=serious?'安全上の懸念があるため、情報が揃うのを待たず、現実の支援を優先してね。':missing?'不足している情報は、入力や算出を確認してから読み直してね。':reasons.length?reasons.join(' '):'具体的な根拠の説明がないため、判定に沿った一般的な助言として読んでください。';
  const action=selectedAction(input,d,s),close=serious?'一人で判断を背負わず、安全を確保して支援につながってね。':pick(catalog.closes,seed,3);
  return{d,s,opening,scene,reason,action,stop,close};
 }
 function render(structure,p){const blocks={
  verdict:`【結論】\n${p.opening}\n\n【現実で確かめること】\n${p.scene}\n\n【そう読む理由】\n${p.reason}\n\n【今日の一手】\n${p.action}\n\n【ここでは止まって】\n${p.stop}\n\n【最後に】\n${p.close}`,
  contrast:`【二つに分けて考えましょう】\n進めていいのは、${p.action}\nまだ決めないのは、${p.stop}\n\n【なぜなら】\n${p.reason}\n\n【こんな場面で使って】\n${p.scene}\n\n【結論】\n${p.opening}\n${p.close}`,
  practice:`【今日の一手】\n${p.action}\n\n【試すときの目印】\n${p.scene}\n\n【結論】\n${p.opening}\n\n【やめどき】\n${p.stop}\n\n【理由】\n${p.reason}\n\n【最後に】\n${p.close}`,
  conditions:`【先に条件を整えましょう】\n${p.scene}\n\n【整ったら進めること】\n${p.action}\n\n【整わないなら止めること】\n${p.stop}\n\n【結論】\n${p.opening}\n${p.reason}\n\n【最後に】\n${p.close}`,
  timeline:`【いま】\n${p.opening}\n\n【今日すること】\n${p.action}\n\n【動いたあとに見ること】\n${p.scene}\n\n【次へ持ち越す条件】\n${p.stop}\n\n【そう読む理由】\n${p.reason}\n\n【最後に】\n${p.close}`,
  reflection:`【まず自分に聞いて】\n「これは望んで選ぶのか、それとも不安を消すために選ぶのか」\n\n【今日の見立て】\n${p.opening}\n${p.reason}\n\n【現実で確かめること】\n${p.scene}\n\n【今日の一手】\n${p.action}\n\n【手放すこと】\n${p.stop}\n\n【最後に】\n${p.close}`,
  protect:`【今日は守る日】\n${p.opening}\n\n【増やさないもの】\n${p.stop}\n\n【代わりにすること】\n${p.action}\n\n【現実で見る目印】\n${p.scene}\n\n【理由】\n${p.reason}\n\n【最後に】\n${p.close}`};let output=blocks[structure]||blocks.verdict;
  if(p.scene===p.action)for(const label of ['今日、起こりやすいこと','こんな場面で使って','試すときの目印','先に条件を整えましょう','動いたあとに見ること','現実で確かめること','現実で見る目印'])output=output.replace(`【${label}】\n${p.scene}\n\n`,'');
  return output}
 function audit(text,input={}){const issues=[],sentences=clean(text).split(/[。！？\n]+/).map(clean).filter(x=>x.length>5),seen=new Set();if(BANNED.test(text))issues.push('technical-term');if(CERTAINTY.test(text))issues.push('unsupported-certainty');if(!/【(?:今日の一手|今日すること|代わりにすること|整ったら進めること|二つに分けて考えましょう)】/.test(text))issues.push('missing-action');if(!/止|やめ|増やさない|決めない|持ち越/.test(text))issues.push('missing-stop');for(const s of sentences){const key=s.replace(/[、， ]/g,'').slice(0,20);if(seen.has(key))issues.push('repetition');seen.add(key)}const personaHits=(text.match(/あら|アンタ|姐さん|〜よ|なのよ/g)||[]).length;if(personaHits>4)issues.push('persona-overuse');if(input.serious&&/笑|冗談|景気よく|ときめき/.test(text))issues.push('unsafe-humor');return{pass:issues.length===0,issues:[...new Set(issues)],score:Math.max(0,100-issues.length*18)}}
 function finalize(text){return globalThis.KOYOMI_OUTPUT_QUALITY?.process(text)?.text||text}
 function compose(input={}){const appEngine=globalThis.KOYOMI_APP_NARRATIVE;if(appEngine){const next=appEngine.compose({...input,surface:input.surface||'personal',direction:input.state,evidence:input.reasons||input.evidence,actions:input.action?[input.action]:input.actions,caution:input.stop||input.caution});return{text:finalize(next.text),meta:{...next.meta,domain:next.frame.domain,state:next.frame.direction,semanticFrame:next.frame,outputQuality:globalThis.KOYOMI_OUTPUT_QUALITY?.audit(next.text)||null}}}const normalized={...input,domain:domain(input.domain),state:input.serious||Number(input.risk)>=70?'protect':state(input.state,input.score),seed:[input.seed,input.date,input.domain,input.state,input.variant].join('|')};let best=null;for(let attempt=0;attempt<7;attempt++){const structure=chooseStructure(normalized,attempt),content=parts(normalized,attempt),text=finalize(render(structure,content)),quality=audit(text,normalized),candidate={text,meta:{structure,attempt,domain:normalized.domain,state:normalized.state,action:content.action,quality,outputQuality:globalThis.KOYOMI_OUTPUT_QUALITY?.audit(text)||null}};if(!best||quality.score>best.meta.quality.score)best=candidate;if(quality.pass)return candidate}return best}
 function register(next){if(!next||typeof next!=='object')return false;const merge=(base,extra)=>Object.fromEntries(Object.keys(base).map(key=>[key,[...base[key],...(Array.isArray(extra?.[key])?extra[key]:[])]]));catalog={openings:merge(DEFAULTS.openings,next.openings),scenes:merge(DEFAULTS.scenes,next.scenes),closes:[...DEFAULTS.closes,...(Array.isArray(next.closes)?next.closes:[])]};return true}
 async function load(url){try{const res=await fetch(url);if(!res.ok)return false;return register(await res.json())}catch(_){return false}}
 return Object.freeze({VERSION,STRUCTURES,BANNED,compose,audit,register,load});
});
