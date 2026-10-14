// These scenes retain the ten-god associations already used by the lifetime reading.
const SCENES={
 比肩:{id:'self',name:'自分の役割',good:'自分が引き受けたい役割を、遠慮せず伝えてみて。',care:'相手に合わせる前に、自分が担える範囲を伝えてください。',quiet:'自分の役割を見渡して、続けたいことを選んでみて。'},
 劫財:{id:'sharing',name:'分担と負担',good:'協力を頼みたいことがあれば、担当と負担を言葉にして相談してみて。',care:'親しい相手でも、分担とお金の負担は曖昧にしないで。',quiet:'一人で抱えている用事に、分けられるものがないか見てみましょう。'},
 食神:{id:'expression',name:'暮らしと表現',good:'楽しんで続けてきたことを、誰かに見せたり話したりする機会にして。',care:'喜ばせようとして、時間や手間をかけすぎないで。',quiet:'心地よかった時間や、作ってみたいものに目を向けて。'},
 傷官:{id:'words',name:'意見の伝え方',good:'気づいたことを、相手が受け取れる言葉で提案してみて。',care:'言いたいことほど、相手の事情を聞いてから伝えて。',quiet:'伝えたい意見を、相手に求めることと分けて考えてみましょう。'},
 偏財:{id:'exchange',name:'人とのやり取り',good:'会って話したい人や、聞いてみたい話があれば、自分から連絡してみて。',care:'その場の気前の良さだけで、予定や支出を決めないで。',quiet:'人付き合いで大切にしたいことと、使える時間を見渡して。'},
 正財:{id:'daily',name:'仕事と日々の支出',good:'続けてきた仕事や家計の工夫を、次の段取りにつなげてみて。',care:'引き受ける仕事や支出は、後まで続く負担を確認して。',quiet:'いつもの仕事や支出の中で、続けやすい形を考えてみましょう。'},
 偏官:{id:'pressure',name:'依頼と責任',good:'動く必要のある用事は、優先順位と助けを頼める相手を決めて取りかかって。',care:'急がされても、期限と責任の範囲を確かめてから返事を。',quiet:'急ぎの用事と、後日に回せる用事を分けてみて。'},
 正官:{id:'promise',name:'役割と約束',good:'準備してきた話は、手順と役割を確かめたうえで提案してみて。',care:'大きな約束ほど、守るために必要な時間と条件を確認して。',quiet:'守りたい約束と、そのために必要な段取りを見渡して。'},
 偏印:{id:'view',name:'調べ物と新しい見方',good:'気になっていた見方や方法を、今の課題と照らして調べてみて。',care:'新しい情報に飛びつく前に、出どころと使える条件を確かめて。',quiet:'考えが行き詰まったら、別の見方を一つ探してみましょう。'},
 印綬:{id:'learning',name:'学びと支え',good:'教わりたいことや相談したいことを、頼れる相手に聞いてみて。',care:'助言を受けても、最後は自分の事情に合うか確かめて。',quiet:'一人で答えを出そうとせず、学べることや頼れる人に目を向けて。'}
};
SCENES.七殺=SCENES.偏官;SCENES.正印=SCENES.印綬;
const FALLBACK={id:'conditions',name:'今日の条件',good:'準備できていることから、相手の意思を確かめて話を進めて。',care:'返事をする前に、期限と自分の余力を確認してください。',quiet:'今ある用事を見渡し、無理なく取り組める範囲を選んでください。'};
// Associations follow src/bazi/reading/chart-interpretation.js; they are symbolic, not observed circumstances.
const SUPPORT_ELEMENTS={wood:{name:'木',meaning:'成長・計画・発展',action:'これから育てていきたいものを思い描いて。必要な段取りを考えるところから進めてみて。'},fire:{name:'火',meaning:'表現・情熱・発信',action:'思いを言葉にして伝えてみて。相手が受け取りやすい形を選んで。'},earth:{name:'土',meaning:'安定・生活基盤・調整',action:'続けやすい段取りを大切に。今ある時間や役割を確かめて進めてみて。'},metal:{name:'金',meaning:'整理・判断・境界線',action:'決めたい条件と譲れる条件を書き分けてみて。判断の基準が見えれば、話を進めやすくなります。'},water:{name:'水',meaning:'学習・回復・情報',action:'気になっていることを調べたり、誰かに聞いたりしてみて。考え続けて疲れたら、休む時間も取って。'}};
const SUPPORT_PAIRS={'wood/fire':'育てたい話を、相手に届く言葉で提案してみて。','wood/earth':'先の計画と、今の生活の段取りを行き来しながら考えてみて。','wood/metal':'進めたい方向と、決めておきたい条件を照らし合わせてみて。','wood/water':'これから取り組みたいことに必要な情報を集めてみて。','fire/earth':'伝えたい思いを、続けられる時間や役割と結びつけて話してみて。','fire/metal':'思いを伝えるときは、お願いしたい範囲もはっきりさせて。','fire/water':'調べて分かったことを、自分の言葉で誰かに話してみて。','earth/metal':'今の段取りを見直し、担当と期限を確かめてみて。','earth/water':'必要な情報を確かめたら、無理なく続けるための休息も大切に。','metal/water':'判断に迷う条件を調べて、分かったことから選んでみて。'};
// Single-element support is interpreted through the existing ten-god scene.
const SCENE_SUPPORT={
 self:{wood:'これから担いたい役割を思い描いて。そのために学びたいことや、任せてほしいことを考えてみて。',fire:'引き受けたい役割があるなら、自分の言葉で伝えてみて。待っているだけでは届かない希望もあります。',earth:'自分の役割を続けやすい段取りにしてみて。使える時間と、助けを頼めるところを確かめて。',metal:'自分で担いたいことと、任せたいことを書き分けてみて。役割の境目が見えれば、希望も伝えやすくなります。',water:'やってみたい役割について、経験のある人に話を聞いてみて。知らなかった選択肢に気づくかもしれません。'},
 sharing:{wood:'誰かと一緒に育てたい計画があるなら、それぞれの得意なことを持ち寄ってみて。',fire:'助けてほしいことを、相手に分かる言葉で伝えてみて。何を頼みたいのかが見えれば、相談を始めやすくなります。',earth:'協力する用事は、担当と順番を一緒に決めてみて。無理なく続く分担を大切に。',metal:'手伝える範囲と、相手に頼みたい範囲を書き分けてみて。お金が関わるなら、負担の境目も言葉にして。',water:'分担に迷う用事は、必要な作業を確かめてから相談してみて。抱えていることを話すだけでも、頼み方が見えてきます。'},
 expression:{wood:'作ってみたいものや、育てたい楽しみに目を向けて。続けるために欲しい材料や時間を考えてみて。',fire:'楽しんできたことを、誰かに見せたり話したりしてみて。上手に見せることより、自分の好きなところを伝えて。',earth:'好きなことを暮らしに置く時間を考えてみて。続けやすい場所や道具も、楽しみを支えてくれます。',metal:'作ってみたいものに、何を残し、何を省くか考えてみて。大切にしたい味わいが見えてきます。',water:'興味のある作品や作り方に触れてみて。楽しみのために知る時間も、自分への贈り物になります。'},
 words:{wood:'提案したいことがあるなら、その先でどう変わってほしいか考えてみて。望む方向が見えれば、言葉を選びやすくなります。',fire:'伝えたかった意見を、自分の言葉で話してみて。相手に何を受け取ってほしいのかを大切に。',earth:'意見を伝えるときは、実際にできる手順も添えてみて。暮らしや仕事に合う提案へつなげて。',metal:'伝えたい結論と、相談したい条件を書き分けてみて。話の焦点が見えれば、相手も返事をしやすくなります。',water:'意見の根拠にしたいことを調べてみて。分からない点は尋ね、確かなことから伝えて。'},
 exchange:{wood:'これからも話してみたい相手を思い浮かべて。共通の関心や、一緒に取り組みたいことから声をかけてみて。',fire:'聞いてほしかった話があるなら、自分から連絡してみて。相手が話せる時間も尋ねて。',earth:'人と会う予定は、普段の生活に合う日時や場所を選んでみて。無理なく話せる余裕を大切に。',metal:'人とのやり取りで、決めたい条件と譲れる条件を書き分けてみて。会える時間や予算が分かれば、相談を進めやすくなります。',water:'話してみたい相手に、気になっていたことを聞いてみて。こちらの話だけでなく、相手の話にも耳を傾けて。'},
 daily:{wood:'これから続けたい仕事や家計の工夫を考えてみて。先の目標と、今できる準備をつなげて。',fire:'仕事で工夫してきたことを、関わる人に伝えてみて。何が役立ったのかを言葉にして。',earth:'いつもの仕事や支出を、続けやすい段取りへつなげて。時間と費用の見通しを立ててみて。',metal:'仕事や買い物では、必要な条件と譲れる条件を書き分けてみて。何に時間やお金を使いたいかが見えてきます。',water:'仕事や買い物で迷う点を調べてみて。分かったことを比べ、自分の暮らしに合うものを選んで。'},
 pressure:{wood:'取り組みたい課題に、どんな準備が必要か考えてみて。先の目標から、今の優先順位を選んで。',fire:'必要な助けや、自分が取り組みたいことを言葉にしてみて。周囲に伝えることも、用事を動かす力になります。',earth:'急ぎの用事は、使える時間と助けを頼める相手を確かめて。休む時間も含めた段取りを考えてみて。',metal:'依頼を受けるなら、担当と期限をはっきりさせてみて。どこまで判断を任されるのかも尋ねて。',water:'取りかかる前に、依頼の目的や必要な情報を聞いてみて。見通しがつけば、力を使うところも選べます。'},
 promise:{wood:'これから果たしたい役割や約束に目を向けて。そのために用意したいことを考えてみて。',fire:'準備してきた話を、相手に伝えてみて。お願いしたい役割も、言葉にして相談して。',earth:'守りたい約束に、必要な時間と手順を用意してみて。続けられる段取りを大切に。',metal:'約束を決めるなら、担当と期限を言葉にしてみて。お互いの責任の範囲が分かれば、安心して話を進められます。',water:'約束の内容で分からない点を尋ねてみて。確認してから返事をすることも、誠実な関わり方です。'},
 view:{wood:'試してみたい方法があるなら、今の課題にどう役立つか考えてみて。先の目的と結びつくものを選んで。',fire:'気になっていた見方を、誰かと話してみて。自分の言葉にすることで、問いがはっきりすることもあります。',earth:'新しい方法を使うなら、いつもの段取りにどう組み込めるか考えてみて。今の生活に合う形を探して。',metal:'気になる方法の、使える条件と使えない条件を比べてみて。新しさだけでなく、選ぶ基準も大切に。',water:'気になっていた見方や方法を調べてみて。出どころを確かめ、今の疑問に合う情報を選んで。'},
 learning:{wood:'これから学んでみたいことを思い描いて。知りたいことと、それを使ってみたい場面をつなげて。',fire:'教わったことを、自分の言葉で誰かに話してみて。説明してみると、さらに聞きたいことも見えてきます。',earth:'学ぶ時間を、今の暮らしに合う形で用意してみて。続けられるペースを大切に。',metal:'学びたい内容と、今は必要のない内容を分けてみて。何を知りたいかが見えれば、質問も選べます。',water:'教わりたいことを、頼れる相手に尋ねてみて。分からないところから話しても大丈夫です。'}
};
// These scenes use metal as selection or editing, rather than negotiated concessions.
const METAL_RISING_CLOSINGS={expression:'大切にしたい味わいを、作るときの目印にして。',view:'選ぶ基準が見えたら、今の課題に合う方法を比べて。',learning:'知りたいことが見えたら、そこから質問してみて。'};
const QUIET_CLOSINGS={self:'引き受けなくてもよい役割まで、自分のものにしなくて大丈夫。',sharing:'手伝ってほしいことも、分担を考える席に置いてください。',expression:'人に見せるためだけでなく、自分が楽しむ時間も持って。',words:'まだ言葉にならない思いは、書き留めてから考えても大丈夫。',exchange:'連絡を返す時間にも、自分の暮らしに合うペースがあっていいのです。',daily:'いつもの手順で助かっているところも、見落とさずにいて。',pressure:'急ぐ理由がはっきりしない用事は、期限を尋ねてから順番を決めて。',promise:'約束を増やす前に、すでに大切にしているものに時間を残して。',view:'すぐに答えを選ばず、問いを持ったまま考える時間も大切に。',learning:'知っていることを使ってみる時間も、学びのうちです。'};
// Practical reading order: gather information before choosing or communicating;
// establish scope/routine before presenting a proposal. This does not alter astrological weights.
const PAIR_ORDER={'wood/fire':['wood','fire'],'wood/earth':['wood','earth'],'wood/metal':['wood','metal'],'wood/water':['water','wood'],'fire/earth':['earth','fire'],'fire/metal':['metal','fire'],'fire/water':['water','fire'],'earth/metal':['metal','earth'],'earth/water':['water','earth'],'metal/water':['water','metal']};
function pairedSceneAction(elements,scene){
 const sequence=PAIR_ORDER[elements.join('/')],parts=SCENE_SUPPORT[scene?.id];
 if(!sequence||!parts)return null;
 // Complete sentences avoid cutting a conditional or its requested action in half.
 const first=parts[sequence[0]].match(/^[^。]+。/u)?.[0];
 let second=parts[sequence[1]].match(/^[^。]+。/u)?.[0];
 // The first sentence already establishes this scene; retain the condition and action.
 if(scene.id==='daily'&&/仕事|買い物/u.test(first||''))second=second?.replace(/^仕事や買い物では、/u,'');
 return first&&second?`${first} そのうえで、${second}`:null;
}
export function supportReading(d,sceneName){
 if(d.support<55)return null;
 const order=Object.keys(SUPPORT_ELEMENTS),totals=new Map();
 for(const p of d.supportElements||[])if(SUPPORT_ELEMENTS[p.element]&&Number.isFinite(p.share)&&p.share>0)totals.set(p.element,(totals.get(p.element)||0)+p.share);
 const ranked=[...totals].sort((a,b)=>b[1]-a[1]||order.indexOf(a[0])-order.indexOf(b[0]));if(!ranked.length)return null;
 const ids=[ranked[0][0]];if(ranked[1]&&ranked[1][1]>=ranked[0][1]*.75)ids.push(ranked[1][0]);
 const canonical=ids.slice().sort((a,b)=>order.indexOf(a)-order.indexOf(b)),materials=canonical.map(id=>SUPPORT_ELEMENTS[id]);
 const label=materials.map(x=>x.name).join('と'),meaning=materials.map(x=>x.meaning).join('／');
 const scene=Object.values(SCENES).find(x=>x.name===sceneName);
 const action=(ids.length===2?pairedSceneAction(canonical,scene):SCENE_SUPPORT[scene?.id]?.[ids[0]])||`${sceneName}では、${ids.length===2?SUPPORT_PAIRS[canonical.join('/')]:materials[0].action}`;
 return {elements:canonical,label,meaning,action,note:`後押し側の寄与が大きい${label}を、${meaning}の象徴として読みます。`};
}
// Specific situations are ten-god symbols, not claims about events that actually happened.
const SCENE_PROTECTION={
 self:{clash:'役割の希望が違うなら、どこを自分で決め、どこを相談するか分けて話して。',friction:'任せられた範囲を越えてまで、一人で責任を背負わないで。',element:'人に認めてもらうために、担えない役割まで引き受けなくて大丈夫。'},
 sharing:{clash:'分担の考えが違うなら、誰が何を受け持つかを一緒に確かめて。',friction:'手伝いのつもりが、自分だけの仕事になっていないか見直して。',element:'協力を続けるには、お互いに無理のない配分が必要です。'},
 expression:{clash:'作品や好みへの反応が違っても、相手の評価だけで楽しみを手放さないで。',friction:'誰かを喜ばせるための準備で、自分の楽しむ時間まで失わないで。',element:'もっと良くしようと手をかける前に、今の出来を味わう時間も持って。'},
 words:{clash:'意見がぶつかるときは、賛成できない点を一つに絞って話して。',friction:'言葉の行き違いが気になるなら、相手がどう受け取ったか尋ねてみて。',element:'言い切る前に、分かっている事実と自分の推測を分けて。'},
 exchange:{clash:'誘いの希望が合わないなら、会える日時や予算を具体的に伝えて。',friction:'付き合いのために増えた用事には、断れるものがないか目を向けて。',element:'会いたい気持ちがあっても、予定を埋め尽くす必要はありません。'},
 daily:{clash:'仕事の進め方が違うなら、仕上がりと期限の認識を合わせて。',friction:'いつもの手順に隠れた手間や出費を、当然のものとして抱え込まないで。',element:'買い足す前に、今あるものと今月使える金額を確かめて。'},
 pressure:{clash:'急な依頼で優先順位がぶつかるなら、何を後に回すか依頼した人と相談して。',friction:'頼まれていない後始末まで、自分の責任にしなくて大丈夫。',element:'急いで成果を出そうとして、休む時間まで削らないで。'},
 promise:{clash:'約束の認識が違うなら、期限と担当を言葉にして確かめ直して。',friction:'責任の所在が曖昧な用事は、引き受ける前に確認して。',element:'期待に応えるためでも、守る見通しのない約束は増やさないで。'},
 view:{clash:'違う見方を示されたら、結論より先に、その考えの前提を聞いてみて。',friction:'情報を追うほど迷うなら、今の疑問に関係するものへ絞って。',element:'新しい方法を選ぶなら、魅力だけでなく自分の状況で使えるかも見て。'},
 learning:{clash:'助言が自分の事情と合わないなら、何が難しいのかを具体的に伝えて。',friction:'人に教わる場でも、分からないまま合わせる必要はありません。',element:'学ぶ量を増やす前に、すでに教わったことを使う時間を持って。'}
};
const CAREFUL_CLOSINGS={self:'希望を伝えることと、何でも引き受けることを分けて。',sharing:'気持ちよく助け合える分担を、言葉にしておきましょう。',expression:'誰かのための工夫にも、自分の好きな気持ちを残して。',words:'率直さは、強く言うことだけで伝わるものではありません。',exchange:'一つの誘いを断っても、大切なつながりまで諦めなくて大丈夫。',daily:'仕事も支出も、続けられる形を選ぶことが支えになります。',pressure:'断る理由を長く並べなくても、今できる範囲は伝えていいのです。',promise:'誠実さは、無理な約束をすることより、守れる条件を示すことに宿ります。',view:'新しさだけで答えを選ばず、自分に必要なものを見極めて。',learning:'納得できないところを質問することも、学びの一部です。'};
// The same daily/background contrast has different practical implications in each scene.
const BACKGROUND_CAUTION={
 self:'続けて担う役割は、途中で見直せる条件まで話しておきましょう。',
 sharing:'協力を続けるための費用と担当は、お互いが見直せる形で決めて。',
 expression:'これからも作り続けたいものは、材料や時間を無理なく用意できるか見て。',
 words:'提案を続けるなら、返事の良さだけでなく実行する人の意向も聞いて。',
 exchange:'先々の付き合いまで決めるなら、会う頻度や予算に余裕を残して。',
 daily:'仕事や購入の話は、継続する費用と手間まで見てから選んで。',
 pressure:'続けて頼まれる仕事は、助けが必要になったときの相談先も確かめて。',
 promise:'長く守る約束には、事情が変わったときに相談し直せる余地を残して。',
 view:'新しい方法を続けて使うなら、合わなかったときに戻せるかも確かめて。',
 learning:'学びを続ける予定は、通う時間や費用を生活に無理なく組み込めるか見て。'
};
const DAY=86400000;
const adjacent=(a,b)=>a&&b&&Date.parse(b.date)-Date.parse(a.date)===DAY;
export function readingContext(rows,index,meta={}){return {previous:rows[index-1],next:rows[index+1],nearby:rows.slice(Math.max(0,index-3),index+4),meta};}
export function dominantCause(d){
 if(d.attentionBreakdown){const causes=['clash','friction','element'].map(kind=>[kind,d.attentionBreakdown[kind]||0]).sort((a,b)=>b[1]-a[1]);if(causes[0][1]>0)return causes[0][0];}
 else{if(d.clashes>0)return 'clash';if(d.other>0)return 'friction';if(d.caution>=45)return 'element';}
 return d.support>=55?'support':'neutral';
}
export function continuousFlow(point,nearby=[]){
 const rows=nearby.filter(r=>Math.abs(Date.parse(r.date)-Date.parse(point.date))<=3*DAY).slice().sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 const index=rows.findIndex(r=>r.date===point.date&&r.score===point.score&&r.risk===point.risk);
 if(index<0||new Set(rows.map(r=>r.date)).size!==rows.length)return [];
 const warning=point.risk>=70,predicate=warning?r=>r.risk>=70:r=>r.tone==='opportunity';
 if(!predicate(point))return [];
 let start=index,end=index;
 while(start>0&&adjacent(rows[start-1],rows[start])&&predicate(rows[start-1]))start--;
 while(end<rows.length-1&&adjacent(rows[end],rows[end+1])&&predicate(rows[end+1]))end++;
 if(end===start)return [];
 const startDate=rows[start].date,endDate=rows[end].date,days=end-start+1;
 return [{kind:warning?'caution-streak':'opportunity-streak',date:point.date,startDate,endDate,days,text:`${startDate}〜${endDate}の${days}日間、${warning?'警戒度の高い状態が続きます。一日だけ我慢して全部引き受けるより、数日分の負担を見渡してください。':'好機として読む材料が続きます。今日だけで全部を動かさず、相手の返事を聞きながら進め方を選んで。'}確認した前後の日程の範囲での読みです。`}];
}
export function periodContrast(point){
 const d=point.parts.daily,dayScore=Math.round(50+(d.support-d.caution)/2),background=point.longTermScore;
 if(!Number.isFinite(background))return null;
 if(dayScore>=70&&background<=35)return {kind:'day-open-background-caution',dayScore,background,text:`日運だけの指標は${dayScore}点、背景は${background}点。その日は後押し、長期の背景は慎重さを示す組合せです。`};
 if(dayScore<=30&&background>=65)return {kind:'day-caution-background-open',dayScore,background,text:`日運だけの指標は${dayScore}点、背景は${background}点。その日は慎重さ、長期の背景は後押しを示す組合せです。`};
 return null;
}
export function turningPoint(point,previous,next){
 if(!adjacent(previous,point)||!adjacent(point,next))return null;
 if(point.score-previous.score>=8&&point.score-next.score>=8)return {kind:'local-peak',date:point.date,text:'前日と翌日を比べると、今日は点数の山に当たります。'+(point.risk>=70?'点数が高くても警戒度は強く残るため、大きな約束は急がないで。':point.tone==='opportunity'?'準備のある話は今日持ちかけ、相手の返事を聞いてから次を決めて。':'点数の高さだけで決めず、相手の意思と実際の条件も確かめて。')};
 if(previous.score-point.score>=8&&next.score-point.score>=8)return {kind:'local-trough',date:point.date,text:'前日と翌日を比べると、今日は点数の谷に当たります。'+(next.risk>=70?'翌日に点数が戻っても、警戒の材料は強く残ります。数日分の負担を見渡して。':next.risk>point.risk?'翌日に点数が戻っても、警戒度も上がる組合せです。待つだけで条件が良くなると決めず、実際の負担も確かめて。':next.tone==='opportunity'?'翌日は好機として読む材料があります。今日の低い点数だけで先を決めつけず、待てる用事は翌日の条件も比べて。':'今日の低い点数だけで、先の見通しまで決めつけなくて大丈夫。待てる用事は、翌日の条件も比べてみて。')};
 return null;
}
export function flowFacts(point,context={}){
 const previous=adjacent(context.previous,point)?context.previous:null,next=adjacent(point,context.next)?context.next:null;
 const turn=turningPoint(point,previous,next),facts=turn?[turn]:[];
 if(!turn&&previous&&point.score-previous.score>=8){facts.push({kind:'recovering',date:previous.date,text:point.risk>=70?'昨日より点数は上向いていますが、今日はまだ警戒の材料が強い日です。':'昨日より点数は上向いています。'+(point.risk>previous.risk?'ただし警戒度も上がっているため、条件の確認は省かないで。':'今日は、昨日と同じ結論に縛られず条件を見直してみて。')});}
 if(!turn&&previous&&previous.score-point.score>=8)facts.push({kind:'falling',date:previous.date,text:'昨日より点数が下がっています。昨日の読みをそのまま当てはめず、今日の条件を改めて確かめてください。'});
 if(turn?.kind!=='local-trough'){
  if(next&&next.tone==='opportunity'&&point.tone!=='opportunity')facts.push({kind:'opening',date:next.date,text:`翌日（${next.date}）は好機として読む組合せです。急がない用事は、今日条件を確認し、明日の流れも比べてみて。`});
  else if(next&&point.risk-next.risk>=8&&next.score-point.score>=8)facts.push({kind:'easing',date:next.date,text:`翌日（${next.date}）は点数が上向き、警戒度も下がります。${next.risk>=70?'ただし翌日も警戒の材料は強く残ります。':'待てる用事なら、明日の条件も見てから決めて。'}`});
  else if(next&&next.risk-point.risk>=15)facts.push({kind:'tightening',date:next.date,text:`翌日（${next.date}）は警戒度が上がります。今日の手応えだけで、明日の予定まで詰め込まないで。`});
 }
 return [...facts,...continuousFlow(point,context.nearby)];
}
export function findMilestones(rows){
 const events=[];
 for(const [kind,label,predicate]of [['opportunity','好機が続く期間',r=>r.tone==='opportunity'],['caution','警戒度が高い期間',r=>r.risk>=70]]){
  let start=null;for(let i=0;i<=rows.length;i++){if(i<rows.length&&predicate(rows[i])){if(start===null)start=i;}else if(start!==null){if(i-start>=2)events.push({kind,label,start,end:i-1,date:rows[start].date,lastDate:rows[i-1].date});start=null;}}
 }
 for(let i=1;i<rows.length;i++)if(rows[i].parts.decade&&rows[i].parts.decade.label!==rows[i-1].parts.decade?.label)events.push({kind:'decade',label:rows[i-1].parts.decade?'大運の切替':'大運の始まり',start:i,end:i,date:rows[i].date,lastDate:rows[i].date});
 return events.sort((a,b)=>a.start-b.start||a.kind.localeCompare(b.kind));
}
export function describePoint(point,context={}){
 const d=point.parts.daily,tone=point.tone||'steady',scene=SCENES[d.tenGod]||FALLBACK;
 const uncertain=!!(context.meta?.birthTimeUnknown||context.meta?.directionDefault||context.meta?.elementProvisional||context.meta?.elementConflicts?.length||context.meta?.elementConfidence!=null&&context.meta.elementConfidence<.5);
 const caution=tone==='caution'||tone==='careful',positive=tone==='opportunity'||tone==='rising';
 const cause=dominantCause(d);
 const titles={caution:`${scene.name}ほど、結論を急がない日。`,careful:`${scene.name}は、条件を確かめてから。`,opportunity:`今日は、${scene.name}に自分から働きかけて。`,rising:`${scene.name}へ、手を伸ばしてみたい日。`,mixed:`${scene.name}は進めても、約束は慎重に。`,steady:`今日は、${scene.name}を見渡して。`};
 const causes={neutral:'その日の五行には、今回の判定で強い後押し・注意のどちらにも置かない材料があります。',clash:'その日の干支と命式に冲があり、予定や意見をすり合わせる場面を読む材料があります。',friction:'その日の干支と命式に害・刑・破などがあり、負担や行き違いを点検する材料があります。',element:'その日の五行に、今回の判定で注意側に置いた要素が含まれ、その寄与が注意の主な材料です。',support:'その日の五行と今回の用神候補との適合を、後押しの材料として読んでいます。'};
 let action=tone==='mixed'?scene.good+' '+scene.care:caution?scene.care:positive?scene.good:scene.quiet;
 const supported=point.age>=13?supportReading(d,scene.name):null;
 if(positive&&supported)action=supported.action;
 const protection={neutral:'周囲の勢いだけで判断せず、自分の余力も確かめてください。',clash:'相手の返事が違っても、すぐに押し返さなくて大丈夫。聞く時間を置いてください。',friction:'頼まれたことを全部抱える必要はありません。担える範囲を先に伝えて。',element:'期待より、続けるための余力を先に見てください。保留する判断も自分を守ります。',support:'まだ確認できていない条件まで、見切りで決めなくて大丈夫です。'};
 if(caution||tone==='mixed')action+=' '+(SCENE_PROTECTION[scene.id]?.[cause]||protection[cause]);
 else if(positive&&['clash','friction'].includes(cause))action+=' '+(SCENE_PROTECTION[scene.id]?.[cause]||(cause==='clash'?'予定と相手の意見はすり合わせてから。':'無理な負担がないかは確かめて。'));
 if(tone==='steady')action+=' '+(SCENE_PROTECTION[scene.id]?.[cause]||{clash:'意見が違う用事は、先に相手の事情を聞いて。',friction:'続けている用事に、知らずに背負った負担がないか確かめて。',element:'今日は、増やすより今ある負担を見渡して。',support:'使える準備がある用事は、条件を確かめながら続けて。',neutral:QUIET_CLOSINGS[scene.id]||'急ぐ必要がなければ、いつもの段取りを大切にして。'}[cause]);
 if(cause!=='clash'&&d.clashes>0)action+=' '+(SCENE_PROTECTION[scene.id]?.clash||'意見が食い違う用事には、すり合わせる時間を置いて。');
 const contrast=point.age<13?null:periodContrast(point);
 if(contrast)action+=' '+(contrast.kind==='day-open-background-caution'?'日運に後押しがあっても、'+(BACKGROUND_CAUTION[scene.id]||'長く続く約束は内容と負担を確かめて。'):'今日は慎重な読みでも、長期の方針まで諦める必要はありません。');
 const closings={caution:'返事を待ってもらうことを、遠慮しないで。',careful:'気になる条件を尋ねるだけでも、進め方は変えられます。',opportunity:'遠慮だけを理由に、温めてきた思いをしまい込まなくて大丈夫。',rising:'まず話を聞くところからでも、一歩になります。',mixed:'返事の良さだけで、条件まで決めないで。'};
 const cautionClosings={self:'誰かの期待と同じくらい、自分の希望にも耳を傾けて。',sharing:'協力する気持ちと、背負える量は分けて考えて。',expression:'楽しみを負担に変えないために、自分の余力も大切に。',words:'相手に届く形を選ぶことも、自分の意見を大切にする方法です。',exchange:'気持ちよく付き合うためにも、時間と支出の境目を大切に。',daily:'続けるために、今日は守る範囲を決めて。',pressure:'頼られることと、全部を担うことは別です。',promise:'守れない約束を増やすより、守れる範囲を誠実に伝えて。',view:'今すぐ答えを出せなくても、確かめる時間は持っていて大丈夫。',learning:'頼れる人の言葉も、自分の事情と照らして選んでください。'};
 const supportClosings={opportunity:{wood:'温めてきた方向を、遠慮だけでしまい込まなくて大丈夫。',fire:'伝える機会を待つだけでなく、自分から声をかけてみて。',earth:'いま積み重ねていることも、前へ進む力になります。',metal:'大切にしたいことを伝えるのに、遠慮しすぎなくて大丈夫。',water:'知りたいことを尋ねるのに、完璧な準備はいりません。'},rising:{wood:'考えている計画を、今の暮らしに合う形へつなげて。',fire:'うまく言おうとするより、伝えたいことを大切に。',earth:'続けるための余裕も、段取りに含めてください。',metal:'譲れるところが分かれば、大切な条件も守りやすくなります。',water:'分からないところが見えれば、次に確かめることも選べます。'}};
 const supportClosing=positive&&supported?(supported.elements.length===1?(tone==='rising'&&supported.elements[0]==='metal'&&METAL_RISING_CLOSINGS[scene.id]||supportClosings[tone][supported.elements[0]]):tone==='opportunity'?'選んだ進め方を、相手の意思や生活の条件と照らして。':'今の用事に合う形で、使える準備を生かして。'):null;
 if(closings[tone])action+=' '+(supportClosing||tone==='caution'&&cautionClosings[scene.id]||tone==='careful'&&CAREFUL_CLOSINGS[scene.id]||closings[tone]);
 const flow=flowFacts(point,context);
 const names={decade:'長期',annual:'その年',monthly:'その月',daily:'その日'};
 const notes=[`その日（${d.label}）の${d.tenGod||'干支'}を「${scene.name}」の象徴として読みます。`,causes[cause],`後押し${d.support}・注意${d.caution}を主役に、年・月${point.preLuck?'':'・長期'}の背景を合わせています。`];
 if(supported)notes.push(supported.note);
 if(d.attentionBreakdown){const a=d.attentionBreakdown;notes.push(`注意の内訳（上限処理前）：五行${Math.round(a.element)}・冲${a.clash}・害刑破${a.friction}。主な材料は${{element:'注意側の五行',clash:'冲',friction:'害・刑・破',support:'後押し',neutral:'通常の材料'}[cause]}です。`);if(cause!=='clash'&&d.clashes>0)notes.push('冲もありますが、より大きい注意材料を中心に読みます。');}
 if(point.agreement?.support)notes.push('後押しが背景にも重なっています。');if(point.agreement?.caution)notes.push('注意の材料が背景にも重なっています。');
 if(point.preLuck)notes.push('大運が始まる前のため、背景は年・月で計算しています。');
 let title=titles[tone];
 if(uncertain){const reference={caution:'慎重に確認したい日',careful:'条件を確かめたい日',opportunity:'後押しを参考にしたい日',rising:'取り組む余地を考えたい日',mixed:'進める条件を見極めたい日',steady:'いつもの状況を見渡したい日'};title=`${scene.name}について、${reference[tone]}（参考）`;}
 if(point.age<13){title='この日の環境と見守りの目安';action='本人への行動指示ではなく、周囲の見守りや生活環境を考える参考にしてください。安心して過ごせる余裕を、周囲の大人が用意してあげて。';}
 const sentences=action.match(/[^。]+。?/gu)||[action],paragraphs=[];for(let i=0;i<sentences.length;i+=2)paragraphs.push(sentences.slice(i,i+2).join('').trim());
 return {title,body:action,paragraphs,theme:scene.id,cause,uncertain,contrast,supportReading:supported,flow:point.age<13?[]:flow,evidence:Object.entries(point.parts).filter(([,p])=>p).map(([key,p])=>({scope:names[key],...p})),note:notes.join(' ')};
}
