const PILLARS={year:['年柱','家系・幼少期・社会から最初に見える顔'],month:['月柱','仕事・社会での役割・育った環境'],day:['日柱','本人の中心・親密な関係での反応'],hour:['時柱','内面・晩年・育てていく未来']};
const GODS={
 bijian:['比肩','自立心と対等な関係','今週引き受けた用事を三つ書き、一つを「自分以外でもできる仕事」として頼む'],jie_cai:['劫財','競争心と仲間を動かす力','新しい約束をする前に、使える時間と費用の上限を数字で決める'],
 shi_shen:['食神','自然な表現、余裕、育てる力','七日以内に、好きで続けたいことを30分だけ予定へ入れ、終わったら続けるか決める'],shang_guan:['傷官','観察力、改善力、率直な表現','指摘する前に「何を良くしたいか」を一文で伝え、改善案を一つだけ出す'],
 pian_cai:['偏財','人脈、機転、流動的な資源運用','誘いや買い物はその場で決めず、期限・総額・断る条件をメモして翌日に返事する'],zheng_cai:['正財','堅実さ、管理、積み重ね','今週増やす仕事は一件まで。始める前に担当者・期限・完了条件を一行で書く'],
 qi_sha:['七殺','決断力、危機対応、突破力','緊急対応は15分で一次判断し、急がない案件は翌朝まで保留して情報を三点確認する'],zheng_guan:['正官','責任感、規律、信用','今日頼まれた仕事の担当範囲と締切を相手へ一文で確認し、曖昧なら着手しない'],
 pian_yin:['偏印','独自の視点、専門性、発想転換','考えている案を一人に説明し、七日以内に10分で試せる形へ小さくする'],zheng_yin:['正印','学習、保護、理解、支援','調べる時間を30分で区切り、最後に学んだことを一つ実際の作業へ使う']
};
const STAGES={changsheng:['長生','新しい力を育て始める'],muyu:['沐浴','経験を通じて感受性が揺れ動く'],guandai:['冠帯','形を整え、社会へ示す'],jianlu:['建禄','自分の力を実務で使う'],diwang:['帝旺','力が前面に出るため使い過ぎにも注意する'],shuai:['衰','量より経験と配分を生かす'],bing:['病','力を一点へ集中し消耗を管理する'],si:['死','古い形を終わらせ次へ切り替える'],mu:['墓','力を内側へ蓄える'],jue:['絶','既存の流れを離れ作り直す'],tai:['胎','まだ見えない可能性を準備する'],yang:['養','守りながら力を育てる']};
const ELEMENTS={wood:'木は成長・計画・発展',fire:'火は表現・情熱・発信',earth:'土は安定・生活基盤・調整',metal:'金は整理・判断・境界線',water:'水は学習・回復・情報'};
const unique=values=>[...new Set(values.filter(Boolean))];
const god=entry=>entry&&(GODS[entry.id]||[entry.kanji||entry.id,'日主との関係から現れる役割','長所と使い過ぎの両方を見る']);

function readPillar(role,pillar){
 const [name,meaning]=PILLARS[role];
 if(!pillar)return{id:`pillar-${role}`,title:name,reading:'出生時刻が不明なため、この柱は断定しません。',meaning,evidence:['時刻情報なし'],confidence:.35};
 const visible=role==='day'?null:god(pillar.stem?.tenGod);
 const hidden=(pillar.branch?.hiddenStems||[]).map(stem=>god(stem.tenGod)).filter(Boolean);
 const hiddenNames=unique(hidden.map(entry=>entry[0]));
 const stage=STAGES[pillar.branch?.twelveStage?.stageId];
 const surface=visible?`${name}は${pillar.label}で、表に${visible[0]}が出てるわ。人からは「${visible[1]}を持つ人」と見られやすいの。`:`${name}は${pillar.label}。ここはアンタ自身の判断と、近い相手に見せる反応の中心よ。`;
 const inside=hiddenNames.length?`でも内側には${hiddenNames.join('・')}もあるから、外から見える顔だけで決めつけちゃ駄目。`:'内側は他の柱と重ねて見る場所よ。';
 const example=role==='year'?'初対面や親族の集まりで、場を和ませる役と自分の意見を通す役が同時に出やすい':role==='month'?'職場では「自分でやった方が早い」と引き受け、後から負担が増えやすい':role==='day'?'親しい相手ほど説明を省き、自分の中では決まっていることを相手も分かっていると思いやすい':'将来のために貯める・整える意識が強く、予定やお金を管理できない状態に不安を感じやすい';
 return{id:`pillar-${role}`,title:`${name}（${pillar.label}）`,reading:`${surface}${inside}${stage?`十二運は${stage[0]}。今は「${stage[1]}」力として使うのがコツよ。`:''}`,meaning,evidence:unique([role==='day'?'日主':pillar.stem?.tenGod?.kanji,...hiddenNames,stage?.[0]]),example,action:visible?.[2]||hidden[0]?.[2]||'この柱だけで決めつけず、実際に繰り返している場面を一つ確認する',confidence:.72};
}

function readBalance(result){
 const balance=result.chart?.elementBalance||[],sorted=[...balance].sort((a,b)=>b.value-a.value),high=sorted[0],low=sorted.at(-1);
 if(!high||!low)return null;
 return{id:'element-balance',title:'五行の配分',reading:`いちばん多いのは${high.kanji}、少ないのは${low.kanji}よ。多い${high.kanji}は得意だから放っておいても使う。でも使い過ぎると、判断や予定を固めすぎるの。少ない${low.kanji}は欠点じゃなく、意識して補う余白よ。`,meaning:`${ELEMENTS[high.element]}。${ELEMENTS[low.element]}。`,example:`整理や判断ばかり続けて息が詰まった時は、${ELEMENTS[low.element]}を使う行動へ切り替えると偏りを戻しやすい`,evidence:balance.map(x=>`${x.kanji}${x.value}`),action:low.element==='fire'?'明日の午前中に10分だけ日光を浴び、伝えたいことを一文にして一人へ送る':low.element==='water'?'今夜は調べ物を30分で切り上げ、就寝時刻を決めて記録する':low.element==='wood'?'明日育てたい計画を一つ選び、最初の15分を予定表へ入れる':low.element==='metal'?'今日中に曖昧な約束を一つ選び、期限か担当者を決める':'今夜、机か予定表の一か所を10分だけ整え、終わった状態を写真かメモで残す',confidence:.78};
}

function readRelations(result){
 const r=result.relations||{},groups=[['干合',r.stems?.combinations],['支合',r.branches?.combinations],['冲',r.branches?.clashes],['刑',r.branches?.punishments],['害',r.branches?.harms],['破',r.branches?.destructions]].filter(([,x])=>x?.length);
 if(!groups.length)return{id:'relations',title:'柱同士の関係',reading:'強く優先すべき合・冲・刑・害・破は目立ちません。単独の記号を探すより、五行配分と運の重なりを優先します。',meaning:'柱同士の結びつきや緊張から、協力しやすい部分と調整が必要な部分を読みます。',evidence:['顕著な関係なし'],action:'一つの関係だけで吉凶を決めない',confidence:.68};
 const labels=groups.map(([name,x])=>`${name}${x.length}件`),support=groups.filter(([x])=>['干合','支合'].includes(x)).map(([x])=>x),tense=groups.filter(([x])=>['冲','刑','害','破'].includes(x)).map(([x])=>x);
 return{id:'relations',title:'柱同士の関係',reading:`${labels.join('、')}が出てるわ。${support.length?`${support.join('・')}は、別々の役割を一つの成果へ結びつける力。`:''}${tense.length?`${tense.join('・')}は不幸の印じゃないの。予定変更や意見の衝突が起きた時、組み直す必要がある場所よ。`:''}`,meaning:'結びつく力とぶつかる力を、仕事・家庭・本人・将来のどこで使うかを見る',example:tense.length?'家族と仕事の予定が重なった時や、自分の希望と周囲の役割が食い違った時に出やすい':'一人で完結させるより、役割の違う人と組んだ時に形になりやすい',evidence:labels,action:tense.length?'次に予定がぶつかったら、事実・担当者・期限を三行に分け、どれを変更するか相手と決める':'今週、役割の違う相手一人へ依頼内容と締切を一文で伝える',confidence:.72};
}

export function buildBaziChartInterpretation(result={}){
 const pillars=result.chart?.pillars||{},items=['year','month','day','hour'].map(role=>readPillar(role,pillars[role])),balance=readBalance(result);
 if(balance)items.push(balance);
 items.push(readRelations(result));
 return{schemaId:'koyomi-bazi-chart-interpretation',version:'1.0.0',title:'姐さんが命式を一段ずつ読むわ',introduction:'命式表は記号の一覧じゃないの。どの場所に、どんな力が、表と内側のどちらへ出ているかを重ねて読むのよ。',conclusion:'日柱を中心に、月柱の社会的な役割、年柱の背景、時柱の未来像を順番に確認します。',items,evidence:unique(items.flatMap(x=>x.evidence||[])),closing:'一つの星だけでアンタを決めつけないこと。重なっている特徴を現実の経験と照らして使いなさい。',sourcePolicy:{usesCalculatedChartOnly:true,noNewDivinationCalculation:true,noSingleSymbolVerdict:true}};
}
