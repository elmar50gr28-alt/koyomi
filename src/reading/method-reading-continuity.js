(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.KOYOMI_METHOD_CONTINUITY=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const VERSION='1.1.0',KEY='koyomi.method-continuity.v1';
const ANGLES={
 overall:[['優先順位','急ぐ理由と、後日に回せる条件を分けて考えます。'],['事実と推測','確認できたことと、まだ想像していることを分けて読みます。'],['続ける負担','続けたい理由と、続けるために必要な余力を見ます。'],['見直す条件','何が変われば判断を変えるかを先に考えます。'],['使える支援','自分で動かせることと、人の助けが必要なことを分けます。']],
 work:[['担当と合意','引き受ける範囲と、相手が期待している範囲を照らし合わせます。'],['期限と区切り','作業量より、どこで完了とできるかを扱います。'],['準備と障害','進める前に足りない物や手順を見つける論点です。'],['任せる範囲','自分で担う部分と、人に頼める部分を分けて考えます。'],['優先する仕事','忙しさと重要性を分け、今の余力をどこに使うかを見ます。']],
 money:[['支出の必要性','魅力的な条件と、実際に使う理由を分けます。'],['続ける費用','最初の価格だけでなく、維持費ややめる費用を扱います。'],['請求の照合','把握している支払いと、実際の請求内容を照らし合わせます。'],['支払いの時期','金額だけでなく、いつ資金が必要になるかを見ます。'],['購入以外の方法','買う以外の選択肢と、その利用条件を比較します。']],
 relationship:[['言葉と行動','相手の言葉と、確認できた行動を分けて読みます。'],['伝える内容','自分の希望と、相手に答えてほしいことを整理します。'],['距離と余力','相手への配慮と、自分が続けられる範囲を分けます。'],['合意していること','期待していることと、実際に約束したことを照らし合わせます。'],['関わる時期','返事を急ぐ必要があることと、待てることを分けます。']],
 health:[['休息の確保','用事を終えた後の余りではなく、休む時間をどう残すかを見ます。'],['予定の負担','こなす量より、無理なく続けられる予定かを扱います。'],['睡眠の段取り','寝る準備が後回しにならないよう、切り上げ方を見ます。'],['食事と水分','生活の基本が予定に押し出されていないかを確かめます。'],['調子の記録','症状を占いで判断せず、気になる変化と相談先を整理します。']],
 growth:[['分からない点','知識を増やす前に、今どこで困っているかを具体的にします。'],['使う場面','学んだことを使う場面と、まだ準備が必要なことを分けます。'],['伝わる形','完成度より、何を伝えたいかが分かる形を考えます。'],['続ける方法','教材や課題を増やす前に、今の方法の負担を見ます。'],['振り返る材料','結果と取り組み方を分け、次に変える点を考えます。']],
 timing:[['準備の状態','日取りの良さだけでなく、実行に必要な準備を見ます。'],['待てる範囲','今決める必要があることと、材料を待てることを分けます。'],['期限の意味','焦りと、実際に守る必要がある期限を区別します。'],['見直す時点','保留したままにせず、何が分かれば判断を見直すかを考えます。'],['長期と目前','長期の方針と、目前の予定を分けて読みます。']]
};
const PROTECT=['rest','organize','prepare','observe','health','money','boundary','review','negotiate','relationship','family','learn','release'];
const METHOD_FOCI={shichu:['prepare','negotiate','cooperate','focus','complete','rest','health'],sukuyo:['contact','relationship','boundary','family'],kyusei:['organize','move','prepare','focus'],astrology:['prepare','observe','review','decide','rest','health'],tarot:['observe','prepare','decide','review','release'],runes:['contact','prepare','decide','observe'],name:['negotiate','cooperate','relationship','boundary','learn'],numerology:['complete','prepare','review','focus','learn'],kabbalah:['boundary','relationship','rest','review','negotiate'],rokusei:['complete','prepare','rest','review','release','health'],timing:['prepare','decide','observe','review','rest']};
const PATTERNS={overall:[/優先|予定|期限/,/事実|推測|観察|記録/,/続け|手放|負担|休/,/選択|比較|条件|見直/,/依頼|相談|支援/],work:[/担当|役割|合意/,/期限|完了|提出|仕上|修正/,/準備|段取り|資料|揃/,/任せ|依頼|分担|人に/,/優先|集中|通知/],money:[/必要|使う|数量|割引|ポイント/,/維持|費用|手数料|サービス|解約/,/明細|領収|請求|注文|届いた|名義|支払先/,/支払日|残高|資金|年間|出費|支出予定/,/購入以外|借り|利用条件/],relationship:[/行動|言葉|記録/,/伝え|連絡|会話|返信/,/距離|断|都合|休/,/約束|役割|分担|合意/,/日時|期限|時期/],health:[/休む|休息|休憩|空き時間/,/予定|負担|用事/,/眠|睡眠|寝|画面/,/食事|水分/,/症状|記録|医療|受診|相談/],growth:[/分から|教材|課題|学び直/,/使う|学んだ/,/試作|案|作り|見せ/,/続け|負担|用事/,/結果|振り返|比べ/],timing:[/準備|実行/,/待|保留/,/期限/,/見直|判断/,/長期|方針/ ]};
function hash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(16)}
function domain(value){const aliases={career:'work',changejob:'work',love:'relationship',family:'relationship',marriage:'relationship',reconcile:'relationship',income:'money',purchase:'money',healthrhythm:'health',study:'growth',identity:'growth',decision:'overall',choice:'overall',life:'overall',future:'overall'};return Object.hasOwn(ANGLES,value)?value:Object.hasOwn(aliases,value)?aliases[value]:'overall'}
function age(date,past){return(Date.parse(date)-Date.parse(past))/86400000}
function choose(pool,records,field,date,seed){return pool.map((item,index)=>({item,index,count:records.filter(r=>r[field]===item.id).length,age:Math.min(Infinity,...records.filter(r=>r[field]===item.id).map(r=>age(date,r.date)))})).sort((a,b)=>a.count-b.count||b.age-a.age||((a.index+parseInt(hash(seed),16))%pool.length)-((b.index+parseInt(hash(seed),16))%pool.length))[0]?.item}
function plan(input,options={}){
 if(!Object.hasOwn(METHOD_FOCI,input.methodId)||!/^\d{4}-\d{2}-\d{2}$/.test(input.date||'')||!Number.isFinite(Date.parse(input.date)))return null;
 const d=domain(input.domain),score=input.score!=null&&Number.isFinite(Number(input.score))?Number(input.score):50,serious=Number(input.psychRisk)>=70||Number(input.risk)>=70;
 const state=serious?'protect':['forward','test','protect'].includes(input.state)?input.state:score>=68?'forward':score<45?'protect':'test';
 const scope=hash(JSON.stringify([input.profileId||'anonymous',input.methodId,d,String(input.question||'').normalize('NFKC').trim()])),inputSignature=hash(JSON.stringify([VERSION,score,state,input.confidence,input.evidence,input.action,input.generatedAction,input.psychRisk,input.risk,input.keepsakeCandidates]));
 let storage=options.storage;try{storage=storage||root.localStorage}catch{}let records=[];try{const data=JSON.parse(storage?.getItem(KEY)||'[]');if(Array.isArray(data))records=data.filter(r=>r&&typeof r.scope==='string'&&typeof r.date==='string')}catch{}
 const recent=records.filter(r=>r.scope===scope&&age(input.date,r.date)>0&&age(input.date,r.date)<=30).sort((a,b)=>b.date.localeCompare(a.date)),yesterday=recent.find(r=>age(input.date,r.date)===1);
 const signature=hash(JSON.stringify([inputSignature,recent.map(r=>[r.date,r.score,r.state,r.angleId,r.actionId,r.evidenceKey])]));
 const cached=records.find(r=>r.scope===scope&&r.date===input.date&&r.signature===signature);if(cached?.plan?.angle&&typeof cached.plan.action==='string')return cached.plan;
 const angles=ANGLES[d].map(([label,text],i)=>({id:d+'-'+i,label,text,index:i}));let angle=choose(angles,recent,'angleId',input.date,scope+input.date);
 const raw=Array.isArray(input.evidence)?input.evidence:[input.evidence],missing=raw.some(v=>/判定保留|未入力|未登録|未算出/.test(String(v||''))),care=/受診|医療機関/.test(input.action||'')||(d==='health'&&/専門家/.test(input.action||''));
 let action=input.action||'',actionId='original';
 if(input.generatedAction&&missing&&!serious&&!care)action='不足している入力や算出結果を確認し、補える情報があるか確かめる';
 if(input.generatedAction&&!missing&&!serious&&!care){
  const core=root.KOYOMI_DAILY_READING_CORE,pool=(core?.FOCI||[]).filter(f=>((f.domain==='life'?'overall':f.domain)===d||(d==='work'&&['sukuyo','name','kabbalah'].includes(input.methodId)&&['contact','relationship','boundary'].includes(f.id)))&&(d==='money'||METHOD_FOCI[input.methodId].includes(f.id))&&(state!=='protect'||PROTECT.includes(f.id))).flatMap(f=>f.actions.map((text,i)=>({id:f.id+'-'+i,text}))).filter(a=>state!=='protect'||!/会う日時|会う予定|提出|試作/.test(a.text));
  const selected=choose(pool,recent,'actionId',input.date,scope+input.date+'action');if(selected){action=selected.text;actionId=selected.id}
 }
 const matching=angles.filter(a=>PATTERNS[d][a.index].test(action));if(matching.length)angle=choose(matching,recent,'angleId',input.date,scope+input.date);
 if(missing&&!serious&&!care)angle={id:d+'-input',label:'不足している情報',text:'入力や算出結果が揃うまで、鑑定だけで実行を決めないようにします。'};
 if(care)angle={id:d+'-care',label:'必要な受診や相談',text:'鑑定の点数や日付を理由に、必要な対応を先延ばしにしない読み方です。'};
 if(serious)angle={id:d+'-safety',label:'安全と必要な支援',text:'安全確保と必要な支援を優先します。'};
 const step=yesterday?.angleId===angle.id?((yesterday.step||0)+1)%3:0;
 const stages=['','昨日の提案を扱ったなら、想定した条件と実際の条件に違いがないか見て。まだなら、確認する先を絞ってください。','対応を始めているなら、続けるために残っている条件を見ます。まだなら、今の負担で取り組める範囲を確かめて。'];
 const angleText=angle.text+(!missing&&!care&&!serious?stages[step]:'');
 const visible=raw.map(v=>root.KOYOMI_APP_NARRATIVE?.publicEvidence(v)||'').filter(Boolean),differenceIndex=visible.findIndex((v,i)=>yesterday?.evidence?.[i]&&yesterday.evidence[i]!==v),specific=differenceIndex>=0&&visible[differenceIndex].length<=45&&yesterday.evidence[differenceIndex].length<=45?`「${yesterday.evidence[differenceIndex]}」から「${visible[differenceIndex]}」へ変わっています。`:'';
 const evidenceKey=hash(JSON.stringify(input.evidence)),changed=Boolean(yesterday&&Number.isFinite(yesterday.score)&&yesterday.score!==score),note=!yesterday?'':changed?`昨日は${yesterday.score}点、今日は${score}点です。数値の変化と現実の条件を合わせて読みます。`:yesterday.state!==state?'点数は同じでも、今回は安全や慎重さを優先する条件が変わっています。':yesterday.evidenceKey&&yesterday.evidenceKey!==evidenceKey?`点数は同じでも、判断材料は昨日と異なります。${specific}今日の材料と現実の条件を照らし合わせて読みます。`:yesterday.angleId!==angle.id?`点数は昨日と同じですが、今日は「${angle.label}」を扱います。結果を変えたのではなく、確かめる論点を切り替えています。`:'同じ論点を続けます。昨日の提案を扱ったなら未確認の条件を、まだなら取り組むうえでの障害を確かめてください。';
 const candidates=Array.isArray(input.keepsakeCandidates)?input.keepsakeCandidates.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.line==='string'):[],keepsake=choose(candidates,recent,'keepsakeId',input.date,scope+input.date+'keepsake'),alternative=candidates.find(x=>x.id!==keepsake?.id);const result={action,keepsake,alternative,angle:{id:angle.id,label:angle.label,text:angleText},note,history:recent.map(r=>({date:r.date,action:r.plan?.action,structure:r.structure})),signature,scope};
 if(input.profileId){const row={scope,date:input.date,signature,score,state,evidence:visible,evidenceKey,step,angleId:angle.id,actionId,keepsakeId:keepsake?.id,plan:result},counts=new Map();const kept=[row,...records.filter(r=>!(r.scope===scope&&r.date===input.date))].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>{const n=(counts.get(r.scope)||0)+1;counts.set(r.scope,n);return n<=30}).slice(0,2000);try{storage?.setItem(KEY,JSON.stringify(kept))}catch{}}
 return result;
}
return Object.freeze({VERSION,KEY,plan});
});
