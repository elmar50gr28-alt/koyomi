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
const DAY=86400000;
const adjacent=(a,b)=>a&&b&&Date.parse(b.date)-Date.parse(a.date)===DAY;
export function readingContext(rows,index,meta={}){return {previous:rows[index-1],next:rows[index+1],nearby:rows.slice(Math.max(0,index-3),index+4),meta};}
export function flowFacts(point,context={}){
 const previous=adjacent(context.previous,point)?context.previous:null,next=adjacent(point,context.next)?context.next:null;
 const facts=[];
 if(previous&&point.score-previous.score>=8){facts.push({kind:'recovering',date:previous.date,text:point.risk>=70?'昨日より点数は上向いていますが、今日はまだ警戒の材料が強い日です。':'昨日より点数は上向いています。'+(point.risk>previous.risk?'ただし警戒度も上がっているため、条件の確認は省かないで。':'今日は、昨日と同じ結論に縛られず条件を見直してみて。')});}
 if(previous&&previous.score-point.score>=8)facts.push({kind:'falling',date:previous.date,text:'昨日より点数が下がっています。昨日うまくいった進め方でも、今日の条件は改めて確かめてください。'});
 if(next&&next.tone==='opportunity'&&point.tone!=='opportunity')facts.push({kind:'opening',date:next.date,text:`翌日（${next.date}）は好機として読む組合せです。急がない用事は、今日条件を確認し、明日の流れも比べてみて。`});
 else if(next&&point.risk-next.risk>=8&&next.score-point.score>=8)facts.push({kind:'easing',date:next.date,text:`翌日（${next.date}）は点数が上向き、警戒度も下がります。${next.risk>=70?'ただし翌日も警戒の材料は強く残ります。':'待てる用事なら、明日の条件も見てから決めて。'}`});
 else if(next&&next.risk-point.risk>=15)facts.push({kind:'tightening',date:next.date,text:`翌日（${next.date}）は警戒度が上がります。今日の手応えだけで、明日の予定まで詰め込まないで。`});
 return facts;
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
 const cause=d.clashes>0?'clash':d.other>0?'friction':d.caution>=45?'element':d.support>=55?'support':'neutral';
 const titles={caution:`${scene.name}ほど、結論を急がない日。`,careful:`${scene.name}は、条件を確かめてから。`,opportunity:`今日は、${scene.name}に自分から働きかけて。`,rising:`${scene.name}へ、手を伸ばしてみたい日。`,mixed:`${scene.name}は進めても、約束は慎重に。`,steady:`今日は、${scene.name}を見渡して。`};
 const causes={neutral:'その日の五行には、今回の判定で強い後押し・注意のどちらにも置かない材料があります。',clash:'その日の干支と命式に冲があり、予定や意見をすり合わせる場面を読む材料があります。',friction:'その日の干支と命式に害・刑・破などがあり、負担や行き違いを点検する材料があります。',element:'その日の五行に、今回の判定で注意側に置いた要素が多く含まれます。',support:'その日の五行と今回の用神候補との適合を、後押しの材料として読んでいます。'};
 let action=tone==='mixed'?scene.good+' '+scene.care:caution?scene.care:positive?scene.good:scene.quiet;
 const protection={neutral:'周囲の勢いだけで判断せず、自分の余力も確かめてください。',clash:'相手の返事が違っても、すぐに押し返さなくて大丈夫。聞く時間を置いてください。',friction:'頼まれたことを全部抱える必要はありません。担える範囲を先に伝えて。',element:'期待より、続けるための余力を先に見てください。保留する判断も自分を守ります。',support:'まだ確認できていない条件まで、見切りで決めなくて大丈夫です。'};
 if(caution||tone==='mixed')action+=' '+protection[cause];
 else if(positive&&['clash','friction'].includes(cause))action+=' 後押しがあっても、'+(cause==='clash'?'予定と相手の意見はすり合わせてから。':'無理な負担がないかは確かめて。');
 if(tone==='steady')action+=' '+({clash:'意見が違う用事は、先に相手の事情を聞いて。',friction:'続けている用事に、知らずに背負った負担がないか確かめて。',element:'今日は、増やすより今ある負担を見渡して。',support:'使える準備がある用事は、条件を確かめながら続けて。',neutral:'急ぐ必要がなければ、いつもの段取りを大切にして。'}[cause]);
 const closings={caution:'返事を待ってもらうことを、遠慮しないで。',careful:'気になる条件を尋ねるだけでも、進め方は変えられます。',opportunity:'遠慮だけを理由に、温めてきた思いをしまい込まなくて大丈夫。',rising:'まず話を聞くところからでも、一歩になります。',mixed:'返事の良さだけで、条件まで決めないで。'};
 if(closings[tone])action+=' '+closings[tone];
 const flow=flowFacts(point,context);
 const names={decade:'長期',annual:'その年',monthly:'その月',daily:'その日'};
 const notes=[`その日（${d.label}）の${d.tenGod||'干支'}を「${scene.name}」の象徴として読みます。`,causes[cause],`後押し${d.support}・注意${d.caution}を主役に、年・月${point.preLuck?'':'・長期'}の背景を合わせています。`];
 if(point.agreement?.support)notes.push('後押しが背景にも重なっています。');if(point.agreement?.caution)notes.push('注意の材料が背景にも重なっています。');
 if(point.preLuck)notes.push('大運が始まる前のため、背景は年・月で計算しています。');
 let title=titles[tone];
 if(uncertain){const reference={caution:'慎重に確認したい日',careful:'条件を確かめたい日',opportunity:'後押しを参考にしたい日',rising:'取り組む余地を考えたい日',mixed:'進める条件を見極めたい日',steady:'いつもの状況を見渡したい日'};title=`${scene.name}について、${reference[tone]}（参考）`;}
 if(point.age<13){title='この日の環境と見守りの目安';action='本人への行動指示ではなく、周囲の見守りや生活環境を考える参考にしてください。安心して過ごせる余裕を、周囲の大人が用意してあげて。';}
 return {title,body:action,theme:scene.id,cause,uncertain,flow:point.age<13?[]:flow,evidence:Object.entries(point.parts).filter(([,p])=>p).map(([key,p])=>({scope:names[key],...p})),note:notes.join(' ')};
}
