(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KOYOMI_PERSONA_ADAPTER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BANK = {
    warm: ['まぁ、よくここまで一人で抱えてきたわね。まず深呼吸なさい。','あら、話してくれてよかった。気持ちも現実も、両方置いていかないわよ。','そうなのね。アンタが頑張った分まで、なかったことにはしないわ。','うん、迷うのも無理ないわ。今日は絡まった糸を一本ずつほどきましょう。','いらっしゃい。格好つけなくていいの、今の本音から見ていくわよ。','大丈夫、甘やかしはしないけど一人にもさせないわ。順番に見ましょう。'],
    bright: ['あら、悪くないじゃない。追い風を雑に使わなければ、ちゃんと伸びるわよ。','まぁ素敵。扉は開いてるわ、あとはハイヒールで駆け込まないことね。','いい顔して。今回は遠慮より、準備した一歩がものを言うわ。','あらやだ、運がせっかく合図してるのに見ないふりは野暮よ。','今回は希望だけじゃないわ。現実にも動かせる余白があるの。','そうそう、その調子。ただし景気よく約束まで増やしちゃ駄目よ。'],
    firm: ['アンタね、ここは曖昧な笑顔で通り過ぎちゃ駄目。結論から言うわ。','ちょっと耳が痛いわよ。でも、傷を広げないために言うの。','今日は綺麗事を脱いで。見るのは願望じゃなく、条件と行動よ。','いい？ 運命のせいにする前に、止めるべきものを止めるわよ。','あら、そこを誤魔化したら姐さんの三つ目が黙ってないわ。','はっきり言うわ。今必要なのは勇気より、確認と境界線よ。'],
    bridge: ['でね、ここからが大事。','さて、気持ちは分かった。次は現実を見ましょう。','ほら、点数よりこっちを見て。','つまりね、話を難しくしなくていいの。','ここで一度、足元へ戻るわよ。','じゃあ、アンタが今日動かせる所まで降ろしましょう。'],
    address: [
      focus=>`今日いちばん強く出ているのは「${focus}」。ここから現実の動きを読んでいくわね。`,
      focus=>`鑑定で目立つのは「${focus}」よ。暮らしの中でどう表れるか、はっきりさせましょう。`,
      focus=>`結果の中では「${focus}」を見逃せないわ。次に、実際の行動へ落とし込むわよ。`,
      focus=>`今日の流れをよく表しているのが「${focus}」。大事なのは、これをどう使うかよ。`,
      focus=>`今のアンタに強く関わるのは「${focus}」ね。言葉だけで終わらせず、現実まで見ていくわ。`,
      focus=>`「${focus}」が今回の結果にはっきり出ているわ。じゃあ、何を変えられるか見ましょう。`
    ],
    aside: ['運は便利だけど、丸投げされたら運だって困るのよ。','愛も仕事も、察して大会を始めたらだいたい迷子よ。','勢いは口紅と同じ。効くけど、塗りすぎると話が入ってこないの。','「いつか」は予定表に載らないの。日付を決めてちょうだい。','全部やるは、だいたい全部ぼやけるのよ。一つに絞りなさい。','奇跡待ちも悪くないけど、その間に確認の電話一本くらいできるわ。'],
    close: ['アンタなら選び直せるわ。今日はその証拠を一つ作っておいで。','泣いても迷ってもいい。でも、自分を雑に扱う選択だけはしないで。','運は判決じゃないの。使い方を決めるのは、最後までアンタよ。','ほら、胸を張って。自分が納得できる理由を持って選びなさい。','姐さんは背中を押すけど、崖には押さないわ。確かめてから進みなさい。','また迷ったら、気分じゃなく変わった事実を持っていらっしゃい。'],
    safeClose: ['今は一人で結論を背負わないで。安全を確保し、信頼できる人や専門窓口へつないで。','占いより安全が先よ。距離を取り、記録を残し、第三者の力を借りなさい。','無理に強くならなくていい。危険から離れることが、今日の正解よ。']
  };
  const METHOD_DOMAINS={四柱推命:'work',宿曜:'relationship',九星気学:'timing',西洋占星術:'timing',タロット:'overall',ルーン:'overall',姓名判断:'growth',数秘術:'growth',カバラ:'growth',六星周期:'timing','大運・暦':'timing'};
  const STOPS={
    overall:'予定や約束に無理が出たら、負担と優先順位を見直してください。',
    work:'担当や期限の合意が崩れたら、引き受ける範囲を確認し直してください。',
    money:'総額や継続費が想定を超える、契約条件が違う場合は、支払い前に確認してください。',
    relationship:'約束と実際の行動が違う、自分の都合を尊重されない場合は、距離と合意を見直してください。',
    health:'不調が強い、急に悪化する、長く続く場合は、占いより医療機関への相談を優先してください。',
    growth:'理解が追いつかない、負担で続けられない場合は、教材や進め方を見直してください。',
    timing:'実行に必要な準備や合意が揃わない場合は、日取りの良さだけで進めないでください。'
  };
  function scenarioDomain(input){
    const aliases={career:'work',changejob:'work',income:'money',purchase:'money',love:'relationship',marriage:'relationship',reconcile:'relationship',family:'relationship',healthrhythm:'health',identity:'growth',study:'growth',life:'overall',choice:'overall'};
    const key=String(input.domain||METHOD_DOMAINS[input.system]||'overall').toLowerCase();
    return Object.hasOwn(STOPS,key)?key:Object.hasOwn(aliases,key)?aliases[key]:'overall';
  }
  const CONDITIONS={
    overall:{subject:'生活の優先順位',check:'予定の優先順位と今の負担を確認する',go:'必要な条件が分かり、無理のない予定で続けられること',observable:'進み具合・負担・条件の変化'},
    work:{subject:'仕事や役割',check:'担当する範囲と期限を相手と確認する',go:'担当と期限が合意され、今の作業量で続けられること',observable:'作業量・期限・担当の合意'},
    money:{subject:'お金の判断',check:'総額と継続費、やめる場合の費用を確認する',go:'費用と契約条件が分かり、無理のない支払いであること',observable:'総額・残高・継続費'},
    relationship:{subject:'人との関係',check:'相手と合意していることと、自分が守りたい距離を分ける',go:'双方の都合が尊重され、無理のない距離で関われること',observable:'約束した行動・負担・安心感'},
    health:{subject:'心身の調子',check:'体調と予定の負担を見て、休息を確保できるか確かめる',go:'体調に無理がなく、食事や休息の時間を確保できること',observable:'睡眠・疲れ・症状の変化'},
    growth:{subject:'学びや成長',check:'今分からない点と、続けるうえでの負担を確認する',go:'理解したい課題が明確で、無理なく学びを続けられること',observable:'理解できた点・負担・続けやすさ'},
    timing:{subject:'動く時期',check:'実行に必要な準備と、見直す場合の条件を確認する',go:'実行の準備と合意が揃い、条件が変われば見直せること',observable:'準備・合意・条件の変化'}
  };
  function hash(text){let value=2166136261;for(const ch of String(text||''))value=Math.imul(value^ch.charCodeAt(0),16777619);return value>>>0}
  function pick(list,seed,offset){return list[((hash(seed)+offset*2654435761)>>>0)%list.length]}
  function topic(question){const cleaned=String(question||'').replace(/[\n\r。、！？!?「」『』（）()]/g,' ').replace(/\s+/g,' ').trim();if(!cleaned)return'';const words=cleaned.match(/[一-龠ぁ-んァ-ヶーA-Za-z0-9]{2,18}/g)||[];const ignored=/^(について|どうしたら|でしょうか|したいです|知りたい|お願いします|できる|こと|もの|ため)$/;return words.find(word=>!ignored.test(word))||words[0]||''}
  function build(input){const score=input.score!=null&&Number.isFinite(Number(input.score))?Number(input.score):50,risk=Math.max(Number(input.risk)||0,Number(input.psychRisk)||0),mode=input.mode==='zubat'?'zubat':'sister',evidence=(input.evidence||input.reasons||[]).filter(Boolean),focus=evidence[0]||`${input.system||'総合鑑定'} ${score}点`,policy=globalThis.KOYOMI_PERSONA_POLICY?.plan({...input,score,risk}),seed=[input.system,score,mode,policy?.mode,evidence.join('|'),input.action,input.variant||0].join('|'),serious=policy?.serious||risk>=70,openingBank=policy?.opening||(serious||mode==='zubat'||score<42?BANK.firm:score>=68?BANK.bright:BANK.warm),bridgeBank=policy?.bridge||BANK.bridge,asideBank=policy?.aside||BANK.aside,closingBank=policy?.closing||(serious?BANK.safeClose:BANK.close),address=policy?.address?pick(policy.address,seed,5).replace('{focus}',focus):pick(BANK.address,seed,5)(focus);return{opening:pick(openingBank,seed,1),address,bridge:pick(bridgeBank,seed,2),aside:serious||!asideBank.length?'':pick(asideBank,seed,3),closing:pick(closingBank,seed,4),tone:policy?.mode||(serious?'safety':mode==='zubat'?'direct':score>=68?'bright':'warm'),personaMode:policy?.mode||'',domain:policy?.domain||input.domain||'overall',state:policy?.state||input.state||'',focus,serious}}
  function apply(text,input){const layer=build(input);let output=String(text||'');output=output.replace('【結論】\n',`【結論】\n${layer.opening}\n${layer.address}\n`);output=output.replace('【何が起こりそうか】\n',`【何が起こりそうか】\n${layer.bridge}\n`);if(layer.aside)output=output.replace('【避ける行動】\n',`【姐さんのひと言】\n${layer.aside}\n\n【避ける行動】\n`);output=output.replace(/【最後の一言】\n[\s\S]*$/,`【最後の一言】\n${layer.closing}`);return{text:output,persona:layer}}
  function conversationalize(text){return String(text||'').replace(/してください。/g,'してちょうだい。').replace(/してください/g,'してちょうだい').replace(/必要があります。/g,'必要があるわ。').replace(/優先します。/g,'優先するの。').replace(/扱います。/g,'扱うわ。').replace(/使います。/g,'使うの。').replace(/保証しません。/g,'保証しないわ。').replace(/決めません。/g,'決めないわ。').replace(/でしょう。/g,'でしょうね。').replace(/です。/g,'よ。')}
  const DOMAINS={四柱推命:['役割と責任','仕事量・体調・対人反応','30日'],宿曜:['距離感と連絡','返信頻度・会う約束・境界線','14日'],九星気学:['環境と段取り','予定の遅れ・片付け・移動負担','9日'],西洋占星術:['心理と時期','感情の波・注目される領域・予定変更','14日'],タロット:['目前の選択','相手の反応・障害の再発・結果へ向かう変化','7日'],ルーン:['今必要な判断と対応','連絡・決断・中断した作業の動き','3日'],姓名判断:['社会での役割','呼ばれ方・任され方・対人印象','30日'],数秘術:['繰り返す行動','着手数・完了数・生活リズム','14日'],カバラ:['名前と約束','名乗った役割と実際の行動の一致','30日'],六星周期:['実行量と休止','新規件数・未完了件数・疲労','12日'],大運・暦:['長期方針と実行日','進捗・負担・残高・予定変更','30日']};
  const PLAYBOOKS={"四柱推命":["今日の依頼を、自分で担当することと人に頼むことに分ける","担当者・期限・完了条件を確認する"],"宿曜":["相手との約束と、まだ確認できていないことを整理する","次に連絡する時期と、返事を待つ期限を相談する"],"九星気学":["移動前に経路・所要時間・遅れる場合の連絡先を確認する","移動や準備の余裕を予定に入れる"],"西洋占星術":["起きたこと、感じたこと、必要な対応を分けて記録する","事実と解釈を比べ、次に必要な対応を決める"],"タロット":["カードの示唆と、現実に確認できた条件を照らし合わせる","判断に必要な情報や確認する相手を決める"],"ルーン":["中断している用事について、連絡・再開・中止の条件を整理する","対応した結果と、次に確認する時期を記録する"],"姓名判断":["署名・肩書き・自己紹介を見直し、伝えたい役割をはっきりさせる","名前の表記と、相手に伝える役割を揃える"],"数秘術":["始めたこと、終えたこと、残っていることを整理する","次に優先する用事と、見直す時期を決める"],"カバラ":["名前を使って引き受けている役割と、実際の対応を比べる","続ける約束と、見直したい役割を分ける"],"六星周期":["新しく始める前に、途中の用事をどう扱うか決める","必要な担当や段取りを確認してから予定を増やす"],"大運・暦":["長期の方針と、いま実行するための条件を分けて考える","期限・費用上限・予定を見直す場合の条件を確認する"],"総合鑑定":["今の予定を見渡し、優先する用事と必要な対応を決める","担当と期限を確かめ、実行か保留かを判断する"]};
  function concreteScenario(input){
    const system=input.system||'総合鑑定',model=Object.hasOwn(DOMAINS,system)?DOMAINS[system]:['生活の優先順位','進み具合・負担・条件の変化','14日'],key=scenarioDomain(input),area=CONDITIONS[key],playbook=Object.hasOwn(PLAYBOOKS,system)?PLAYBOOKS[system]:PLAYBOOKS.総合鑑定;
    const score=input.score!=null&&Number.isFinite(Number(input.score))?Number(input.score):50,evidence=(input.evidence||input.reasons||[]).filter(Boolean).slice(0,2),layer=build(input);
    const direction=layer.serious?'protect':['forward','test','protect'].includes(input.state)?input.state:score>=68?'forward':score<45?'protect':'test';
    const state={forward:'前進',test:'試行',protect:'防御'}[direction],requested=String(input.action||'').trim();
    const action=requested||globalThis.KOYOMI_APP_NARRATIVE?.defaultActionFor({domain:key,score,direction,evidence,risk:input.psychRisk,serious:layer.serious})||(direction==='protect'?'今の負担と必要な条件を確かめ、実行を急がずに判断する':playbook[0]);
    const subject=input.domain?area.subject:model[0],scene=state==='前進'?`今回の${subject}では、準備が揃っている内容から進める。続ける前に、${area.check}`:state==='防御'?`今回の${subject}では、判断を急がず、${area.check}。新しい負担を増やさず、今の条件を守る`:`今回の${subject}では、結論を急がず、${area.check}。分かったことをもとに、次の対応を決める`;
    return{state,scene,why:evidence.length?evidence.join('／'):`${system}の信号${score}`,action,observable:input.domain?area.observable:model[1],go:key==='health'&&(layer.serious||/受診|医療機関|専門家.{0,6}相談/.test(action))?'受診や相談は、鑑定の条件が揃うのを待たずに優先すること':layer.serious&&key==='relationship'?'相手との合意を待たず、安全な距離と支援を確保すること':area.go,stop:globalThis.KOYOMI_APP_NARRATIVE?.boundary({domain:key})||STOPS[key],review:model[2]};
  }
  function scenarioText(s){return`【現実に出やすい形】\n${s.scene}わ。見る数字は「${s.observable}」。\n\n【進める条件】\n${s.go}。最初にするのは「${s.action}」よ。\n\n【止める条件】\n${s.stop}運の点数より、この条件を優先なさい。\n\n【再確認】\n${s.review}後に「始めた数・終えた数・負担・相手の行動」から二項目を比べるの。変化がなければ、根性ではなく方法を変えなさい。`}
  function applyDivination(text,input){const interpretation=globalThis.KOYOMI_METHOD_INTERPRETATION?.interpret(input),story=globalThis.KOYOMI_READING_KEEPSAKE?.decorate(input,interpretation)||interpretation?.story;const storyEligible=story&&Number(input.confidence)>=50&&Math.max(Number(input.psychRisk)||0,Number(input.risk)||0)<70&&!/受診|医療機関|専門家/.test(input.action||'');if(storyEligible)input={...input,keepsakeCandidates:story.keepsakeCandidates,...(input.generatedAction?{action:story.invitation,generatedAction:false}:{})};const continuity=globalThis.KOYOMI_METHOD_CONTINUITY?.plan(input);if(continuity){const symbolic=input.generatedAction&&['tarot','runes'].includes(input.methodId)?String(input.action||'').match(/「([^」]+)」/)?.[1]:'';input={...input,evidence:symbolic?[`鑑定で読むテーマ：${symbolic}`,...(input.evidence||[])]:input.evidence,action:continuity.action,readingAngle:continuity.angle,continuity:continuity.note,history:continuity.history}};const layer=build(input),scenario=concreteScenario(input),renderer=globalThis.KOYOMI_PERSONA_RENDERER,evidence=(input.evidence||[]).filter(Boolean).slice(0,4),level=input.level||globalThis.document?.getElementById('readingModeSetting')?.value||'standard',planner=globalThis.KOYOMI_READING_STRUCTURE_PLANNER,structure=planner?.plan(input,scenario),legacy=String(text||'').replace(/相談「[^」]*」を、?/g,'').replace(/相談「[^」]*」/g,'').replace(/【相談と([^】]+)】/g,'【$1の鑑定結果】').replace(/【相談への回答】/g,'【鑑定結果からの結論】'),appEngine=globalThis.KOYOMI_APP_NARRATIVE;if(appEngine){const narrative=appEngine.compose({surface:'method',story:story?{...story,keepsake:continuity?.keepsake||story.keepsakeCandidates?.[0],alternative:continuity?.alternative||story.keepsakeCandidates?.[1]}:null,interpretation,readingAngle:input.readingAngle,continuity:input.continuity,history:input.history,domain:scenarioDomain(input),question:input.question,subject:input.subject||DOMAINS[input.system]?.[0]||'今回の鑑定結果',score:input.score,direction:({前進:'forward',試行:'test',防御:'protect'})[scenario.state],confidence:input.confidence,risk:Math.max(Number(input.psychRisk)||0,Number(input.risk)||0),serious:layer.serious,contradiction:input.contradiction,evidence,actions:[input.action,scenario.action].filter(Boolean),caution:scenario.stop,review:scenario.review,seed:[input.methodId||input.system,input.question,input.date,input.score,input.variant].join('|'),variant:input.variant});return{keepsake:storyEligible&&narrative.meta.structure==='symbolic-story'?narrative.frame.story.keepsake:null,keepsakeAlternative:storyEligible&&narrative.meta.structure==='symbolic-story'?narrative.frame.story.alternative:null,text:level==='detailed'?`${narrative.text}\n\n【詳しい鑑定資料】\n${legacy}`:narrative.text,persona:layer,scenario,structure,level,narrative:narrative.meta}}if(renderer){const rendered=renderer.render({system:input.system||'この占術',serious:layer.serious,opening:level==='beginner'?'難しい言葉は抜きで、先に使い方を話すわね。':layer.opening,axis:layer.address,result:scenario.scene,scenario,evidence,closing:layer.closing,order:level==='beginner'?undefined:structure?.order,headings:structure?.headings},{voice:input.mode==='zubat'?'zubat':'sister',level,date:input.date});return{text:level==='beginner'?rendered:`${rendered}\n\n【詳しい鑑定資料】\n${legacy}`,persona:layer,scenario,structure,level}}return{text:`${layer.opening}\n\n${scenarioText(scenario)}\n\n${legacy}\n\n${layer.closing}`,persona:layer,scenario,structure,level}}
  return{BANK,DOMAINS,PLAYBOOKS,build,apply,applyDivination,concreteScenario,scenarioText,conversationalize,topic};
});
