(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KOYOMI_APP_NARRATIVE=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='2.4.0';
const SURFACES={personal:{length:'long',review:'7日後'},compatibility:{length:'long',review:'14日後'},timeline:{length:'medium',review:'3か月後'},oracle:{length:'medium',review:'7日後'},qimen:{length:'medium',review:'行動後'},mundane:{length:'medium',review:'翌月'},today:{length:'short',review:'今夜'},method:{length:'medium',review:'7日後'}};
const CONCEPTS=['advance','test','protect','complete','organize','contact','negotiate','rest','learn','create','budget','boundary','repair','prepare','release','review','decide','focus','cooperate','observe','recover','communicate','compare','pause','delegate','simplify','verify','schedule','maintain','reframe','prioritize','withdraw'];
const DOMAINS={
 overall:{subject:'今のテーマ',scenes:['いま抱えている予定の優先順位','今日中に動かせる一件','続けることと手放すことの境目'],actions:['今日の予定を見渡し、優先する用事を決める','急がない予定を後日に回し、余裕を確保する','判断に必要な情報を、分かっていることと不明なことに分ける'],stops:['一度に全部を変えようとすること','不安を消すためだけに予定を増やすこと','材料がないまま結論を固定すること']},
 work:{subject:'仕事や役割',scenes:['頼まれた仕事の範囲と期限','自分だけが抱えている役割','提案を見せる最初の場面'],actions:['担当・期限・終わりの状態を確認する','優先したい仕事に取りかかり、区切りのよいところまで進める','任せられる仕事について、内容と期限を伝えて依頼する'],stops:['責任範囲が曖昧なまま引き受けること','複数の重要案件を同時に始めること','口約束だけで大きな変更を進めること']},
 money:{subject:'お金の判断',scenes:['支払う金額と使う回数','維持費や解約条件','今月の残高に残る負担'],actions:['総額・維持費・やめる費用を書き出す','購入を一晩置いて比較する','定期支出を見直し、使っていないサービスがないか確認する'],stops:['限定感や焦りだけで支払うこと','損を取り返すために追加で賭けること','占いだけで投資や契約を決めること']},
 relationship:{subject:'人との関係',scenes:['言葉と実際の行動の違い','連絡頻度と守りたい距離感','一度の会話で扱う論点'],actions:['起きたこと、自分の気持ち、相手へのお願いを分けて伝える','次に話す日時を具体的に決める','相手の約束が続いたかを確認する'],stops:['相手の内心を推測だけで決めること','過去の不満を一度に持ち出すこと','罪悪感だけで境界線を下げること']},
 health:{subject:'心身の調子',scenes:['睡眠と疲れの残り方','無理なく続けられる予定量','不調が強くなる時間帯'],actions:['水分・食事・睡眠のうち、後回しになっているものを優先する','急がない用事を後日に回し、休む時間を確保する','続く症状を記録して専門家へ相談する'],stops:['不調を根性で押し切ること','疲れた状態で重大な判断をすること','占いを診断や治療の代わりにすること']},
 growth:{subject:'学びや成長',scenes:['いま身につけたい一つの力','試作品を人に見せる段階','集めた知識を使う場面'],actions:['今の課題で分からないところを、教材で確かめる','案が伝わる試作を作り、見てもらえる形にする','学んだ内容を、自分の言葉で説明してみる'],stops:['資料を集めるだけで終わること','完璧になるまで試さないこと','複数の教材を同時に始めること']},
 timing:{subject:'動く時期',scenes:['準備できている部分と未確認の部分','今すぐ動かす範囲','次に判断を見直す時点'],actions:['実行する前に、見直せる条件を確かめる','実行日と確認日を別々に決める','実行に必要な条件が揃っているか確認する'],stops:['良い日という理由だけで急ぐこと','短期の勢いを長期の保証と考えること','見直す日を決めずに保留し続けること']}
};
const DIRECTIONS={
 forward:{open:['準備してきたことを、現実の一歩へ移しやすい流れです。','用意してきたものを見せて、反応を確かめる機会です。','整えてきた条件が、行動につながり始めています。'],verb:'進める',reason:['準備と状況がかみ合っているためです。','動いた結果を確かめられる余地があるためです。','前へ進む材料が、慎重材料より少し上回っているためです。']},
 test:{open:['結論を急ぐ前に、まだ不明な条件を確かめたいところです。','進める余地はありますが、確認してから広げたい状態です。','答えは見え始めていますが、まだ調整できる余白を残しましょう。'],verb:'試す',reason:['前進材料と慎重材料が混ざっているためです。','実際の反応が、次の判断材料になるためです。','条件の一部にまだ確認の余地があるためです。']},
 protect:{open:['いまは広げるより、守りながら整えることが大切です。','無理に答えを出さず、負担を減らすほうが流れを守れます。','前進を急ぐより、安全と回復を優先したい状態です。'],verb:'整える',reason:['急ぐほど負担や見落としが増えやすいためです。','選択肢を残すことが、次の機会を守るためです。','いまは成果より土台の安定が重要なためです。']}
};
const DECISION_COPY={
 forward:{overall:'条件が揃っている予定を実行へ移してみましょう。',work:'仕上げや提案へ進むなら、担当と期限を確認しておきましょう。',money:'購入や契約の条件に納得できるか、支払い前に確認しましょう。',relationship:'伝えたい内容がまとまったら、相手と話す機会を作りましょう。',health:'調子がよくても、休息を抜いて予定を詰めないようにしましょう。',growth:'学んだことや作ったものを使い、次に必要な工夫を見つけましょう。',timing:'準備が揃っているかを確認し、実行する日と見直す日を決めましょう。'},
 test:{overall:'まだ分からない条件を整理してから、方針を決めましょう。',work:'仕事の範囲や仕上がりを確認し、必要な修正を話し合いましょう。',money:'価格だけでなく、継続費や解約条件も確認してから判断しましょう。',relationship:'相手の気持ちを推測するより、話し合って認識を確かめましょう。',health:'体調に合わせて予定を組み直し、食事や休息の時間を確保しましょう。',growth:'理解できているところと、学び直したいところを分けてみましょう。',timing:'いま決める必要があることと、材料を待てることを分けましょう。'},
 protect:{overall:'答えを急がず、負担になっている予定を見直しましょう。',work:'新しい仕事を引き受ける前に、今の担当と負担を確かめましょう。',money:'支払いを急がず、分からない費用や条件を確認しましょう。',relationship:'返事や約束を急がず、自分の都合も大事にしましょう。',health:'成果を急ぐより、休める時間を確保しましょう。',growth:'成果を急がず、理解しにくい点や負担になっている進め方を見直しましょう。',timing:'実行を急ぐより、延期できるかと必要な準備を確認しましょう。'}
};
const BRIDGES=['ここで大切なのは、運の強さより現実の条件です。','そのため、気分ではなく確認できる事実を基準にします。','変えたいことと、今のまま残したいことを分けて考えましょう。','迷いがあるなら、どの情報があれば判断できるか考えてみましょう。','良し悪しを決めつけず、動いた後の変化まで見てください。'];
const CLOSES=['実際に分かったことを、次に判断するときの材料にしてください。','あとから自分に説明できる選択を大切にしてください。','運は判決ではありません。現実を確かめながら選び直せます。','急がなくても大丈夫です。条件を言葉にできれば迷いは整理できます。','急ぐことと待てることを分け、今の都合に合う進め方を選んでください。'];
const METRICS={overall:'進み具合・負担・続けやすさ',work:'進み具合・作業量・期限',money:'残高・総額・継続費',relationship:'約束した行動・負担・安心感',health:'睡眠・症状・疲れ',growth:'理解できたこと・作れたもの・続けやすさ',timing:'進み具合・負担・条件の変化'};
const STRUCTURES={long:[['conclusion','scene','reason','action','stop','review'],['scene','conclusion','action','reason','stop','review'],['conclusion','reason','contrast','action','stop','review'],['action','conclusion','scene','reason','stop','review']],medium:[['conclusion','reason','action','stop','review'],['action','conclusion','reason','stop','review'],['conclusion','contrast','action','review','stop']],short:[['conclusion','action','stop'],['action','conclusion','stop'],['conclusion','contrast','action']]};
const HEADINGS={conclusion:'結論',scene:'現実で確かめること',reason:'そう読む理由',contrast:'判断の分け方',action:'今できること',stop:'控えること',review:'見直す時'};
const FORBIDDEN=/(四柱推命|宿曜|九星(?:気学)?|西洋占星術|タロット|ルーン|姓名判断|数秘(?:術)?|カバラ|六星|大運|流年|日主|用神|喜神|忌神|五行|空亡|命式|トランジット|アスペクト|正位置|逆位置|第(?:1[0-2]|[1-9])室|\b(?:ASC|MC)\b)/;
const CERTAINTY=/(必ず|絶対|確実に|間違いなく).{0,15}(成功|失敗|起きる|治る|別れる|結婚)/;
function clean(v,fallback=''){const value=String(v??'').replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim();return value||fallback}
function list(v){return(Array.isArray(v)?v:[v]).filter(x=>x!==undefined&&x!==null)}
function hash(v){let h=2166136261;for(const c of String(v||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function pick(a,seed,offset=0){return a[((hash(seed)+offset*2654435761)>>>0)%a.length]}
function domain(v){const x=clean(v).toLowerCase(),map={career:'work',changejob:'work',income:'money',purchase:'money',love:'relationship',marriage:'relationship',reconcile:'relationship',family:'relationship',healthrhythm:'health',identity:'growth',study:'growth',life:'overall',choice:'overall'};return Object.hasOwn(DOMAINS,x)?x:(Object.hasOwn(map,x)?map[x]:'overall')}
function direction(v,score){if(['forward','test','protect'].includes(v))return v;return Number(score)>=72?'forward':Number(score)<42?'protect':'test'}
function confidence(v){const n=Number(typeof v==='object'?v.score:v);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):65}
const BOUNDARIES={
 overall:'予定や約束に無理が出たら、負担と優先順位を見直してください。',
 work:'担当や期限の合意が崩れたら、引き受ける範囲を確認し直してください。',
 money:'総額や継続費が想定を超える、契約条件が違う場合は、支払い前に確認してください。',
 relationship:'約束と実際の行動が違う、自分の都合を尊重されない場合は、距離と合意を見直してください。',
 health:'不調が強い、急に悪化する、長く続く場合は、占いより医療機関への相談を優先してください。',
 growth:'理解が追いつかない、負担で続けられない場合は、教材や進め方を見直してください。',
 timing:'実行に必要な準備や合意が揃わない場合は、日取りの良さだけで進めないでください。'
};
function boundary(input={}){return BOUNDARIES[domain(input.domain)]}
function publicEvidence(value){
 let text=clean(value);
 if (/^天文計算|^入力条件を確認済み$/.test(text)) return '';
 const score=text.match(/^(大運|流年|選択日)(\d+(?:\.\d+)?)$/);
 if(score&&Number(score[2])<=100)return `${{大運:'長期',流年:'年ごと',選択日:'選択日'}[score[1]]}の判定は${score[2]}点`;
 // Translate only known computed labels; do not invent an interpretation or event.
 const labels=[['調和トランジット強度','調和を示す配置の強さ'],['緊張トランジット強度','緊張を示す配置の強さ'],['主要トランジット','参照した配置'],['日五行→用神補正','選択日の相性補正'],['大運','長期の指標'],['流年','年ごとの指標'],['ライフパス','生年月日からの基礎数'],['個人年','今年の周期数'],['本命','出生年の分類'],['日盤','選択日の分類'],['星差','二つの分類の差'],['生年月日核','生年月日からの基礎数'],['名前核','名前からの基礎数'],['橋数','二つの基礎数の差']];
 for(const [label,replacement] of labels)text=text.split(label).join(replacement);
 text=text.replace(/逆位置/g,'（反転）').replace(/正位置/g,'（通常）');
 return FORBIDDEN.test(text)?'':text;
}
function grounding(f){
 if(f.serious)return '安全上の懸念があるため、鑑定の強さより保護を優先して読みます。';
 if(f.evidence.some(value=>/判定保留|未入力|未登録|未算出/.test(value)))return '必要な入力や算出結果が揃っていないため、結論は参考として扱います。';
 if(f.contradiction)return '判断材料に異なる傾向があるため、進める部分と保留する部分を分けて読みます。';
 if(f.confidence<50)return '判断材料が限られるため、確定した見通しではなく確認の手掛かりとして読みます。';
 const evidence=f.evidence.find(value=>value.length<=42&&!/入力条件を確認済み|総合信号|信号\s*\d|^\d+点$/.test(value));
 const reading={forward:'準備済みのことを進める',test:'条件を確かめて判断する',protect:'負担を増やさない'}[f.direction];
 return evidence?`「${evidence.replace(/[。]+$/,'')}」を判断材料に、${reading}読み方です。`:`今回の判定に合わせ、${reading}読み方です。`;
}
function reasonFor(f){
 if(!f.evidence.length)return '具体的な根拠の説明が渡されていないため、判定に沿った一般的な助言です。';
 const material=f.evidence.map(value=>value.replace(/[。]+$/,'')).join('。')+'。';
 const limit=f.evidence.some(value=>/判定保留|未入力|未登録|未算出/.test(value))?'不足している情報は、入力や算出を確認してから読み直してください。':f.contradiction?'異なる傾向を一つの見通しにまとめず、条件を分けて考えます。':f.confidence<50?'材料が限られるため、現実の状況と照らし合わせてください。':'これらは鑑定に使った材料で、現実に起きる出来事を確定するものではありません。';
 return material+limit;
}
function frame(input={}){const surface=SURFACES[input.surface||input.type]?input.surface||input.type:'personal',score=Math.max(0,Math.min(100,Math.round(input.score!=null&&Number.isFinite(Number(input.score))?Number(input.score):50))),risk=Math.max(0,Math.min(100,Number(input.risk)||0)),d=domain(input.domain),dir=Boolean(input.serious)||risk>=70?'protect':direction(input.direction||input.state,score),conf=confidence(input.confidence),serious=Boolean(input.serious)||risk>=70;return{surface,score,risk,domain:d,direction:dir,confidence:conf,serious,contradiction:Boolean(input.contradiction),question:clean(input.question),subject:clean(input.subject,DOMAINS[d].subject),evidence:list(input.evidence||input.reasons).map(publicEvidence).filter(Boolean).slice(0,3),actions:list(input.actions||input.action).map(clean).filter(Boolean),caution:clean(input.caution||input.stop),review:clean(input.review,SURFACES[surface].review),seed:clean(input.seed)||[surface,d,dir,score,input.variant||0].join('|')}}
function buildParts(f,attempt){const d=DOMAINS[f.domain],flow=DIRECTIONS[f.direction],seed=`${f.seed}|${attempt}`;let action=f.actions[0]||pick(d.actions,seed,4),stop=f.caution||boundary(f);if(f.serious&&f.domain==='relationship'){action='一人で抱えず、信頼できる人や相談窓口へ状況を共有する';stop='暴言・脅し・監視・金銭支配・強要を我慢すること'}if(f.serious&&f.domain==='health'){action='安全を確保し、急な悪化や強い症状は医療機関へ相談する';stop='占いの結果を理由に受診や休息を遅らせること'}const reason=reasonFor(f),scene=`現実の状況と照らし合わせるなら、${pick(d.scenes,seed,1)}を確かめてください。`,contrast=f.contradiction?'進められる部分と、まだ約束しない部分を分けて考えましょう。':pick(BRIDGES,seed,3),conclusion=`今回の焦点は「${f.subject}」です。${grounding(f)}\n${DECISION_COPY[f.direction][f.domain]}`,review=`${/^\d+日$/.test(f.review)?f.review+'後':f.review}を目安に、${METRICS[f.domain]}を確認し、前回との違いを比べてください。`,close=pick(CLOSES,seed,6);return{conclusion,scene,reason,contrast,action,stop,review,close}}
function structure(f,attempt){let pool=STRUCTURES[SURFACES[f.surface].length];if(f.contradiction)pool=pool.filter(order=>order.includes('contrast'));const recent=(f.history||[]).map(x=>x?.structure).filter(Boolean).slice(0,2),ordered=pool.map((x,i)=>pool[(i+hash(`${f.seed}|${attempt}`))%pool.length]),fresh=ordered.find(x=>!recent.includes(x.join('-')));return fresh||ordered[0]}
function render(f,parts,order){const blocks=order.map(role=>({role,label:HEADINGS[role],text:parts[role]}));if(SURFACES[f.surface].length!=='short')blocks.push({role:'close',label:'最後に',text:parts.close});return{blocks,text:blocks.map(b=>`【${b.label}】\n${b.text}`).join('\n\n')}}
function audit(text,f={}){const issues=[],source=clean(text),sentences=source.split(/[。！？\n]+/).map(clean).filter(x=>x.length>6),seen=new Set();if(FORBIDDEN.test(source))issues.push('technical-term');if(CERTAINTY.test(source))issues.push('unsupported-certainty');if(!/【(?:今できること|結論|判断の分け方)】/.test(source))issues.push('missing-action');if(!/控える|止|守|約束しない|増や/.test(source))issues.push('missing-boundary');for(const sentence of sentences){const key=sentence.replace(/[、， ]/g,'').slice(0,22);if(seen.has(key))issues.push('repetition');seen.add(key)}if(source.length>(f.surface==='today'?420:1400))issues.push('too-long');if(f.serious&&/(冗談|笑って|景気よく)/.test(source))issues.push('unsafe-tone');return{pass:issues.length===0,issues:[...new Set(issues)],score:Math.max(0,100-[...new Set(issues)].length*18)}}
function compose(input={}){const f=frame(input);f.history=input.history||[];let best=null;for(let attempt=0;attempt<9;attempt++){const order=structure(f,attempt),out=render(f,buildParts(f,attempt),order),quality=audit(out.text,f),candidate={text:out.text,blocks:out.blocks,frame:f,meta:{version:VERSION,structure:order.join('-'),attempt,quality,vocabulary:{concepts:CONCEPTS.length,domain:f.domain,direction:f.direction}}};if(!best||quality.score>best.meta.quality.score)best=candidate;if(quality.pass)return candidate}return best}
return Object.freeze({VERSION,SURFACES,CONCEPTS,DOMAINS,DIRECTIONS,FORBIDDEN,frame,compose,audit,boundary,publicEvidence});
});
