// Reading voice follows the calculated tone; it never invents a personal event.
const PROFILES={
 self:{titles:['望む役割に、あなたの声を','自分の望みも席につかせて','期待の重さを、ひとりで持たない','引き受ける前に、本音を聞いて','誰かの役より、自分の輪郭','望むことと、背負うことの間で'],invite:'今日は、任されるのを待つだけでなく、自分の望む役割へ声をかけたい日。',heart:'頼られるとうれしくて、自分の希望を言いそびれることはありませんか。',shelter:'期待に応えたいときほど、できないと言う勇気も自分の味方です。',quiet:'役に立つことをしていない時間にも、あなたらしさは残っています。',question:'誰にも褒められなくても、続けたいことは何でしょう。',warm:'あなたの望みも、誰かの期待と同じくらい大切にしていいのです。'},
 sharing:{titles:['一緒に、を持ちかける日','頼ることから始まる協力','優しさのために、背負いすぎない','その分担に、あなたの声も','助け合いの形を見つけ直す','一緒に進む、全部は背負わずに'],invite:'誰かと分け合いたい計画があるなら、今日は「一緒に」を口にしてみたい日。',heart:'自分で済ませた方が早いと思って、頼みたい気持ちをしまっていませんか。',shelter:'助けたい気持ちがあっても、自分だけが苦しくなる形には立ち止まって。',quiet:'誰が多く頑張ったかより、どうすれば気持ちよく助け合えるかに目を向けたい日。',question:'あなたが本当に分け合いたいのは、仕事でしょうか、それとも気持ちでしょうか。',warm:'頼ることも、相手を信じて差し出すもののひとつです。'},
 expression:{titles:['好きなものを、外の世界へ','楽しみの芽に、水をあげる','喜ばせる前に、自分の楽しさを','その工夫は、誰のため？','好きだけで、十分な理由','楽しむ心と、頑張りすぎる心'],invite:'今日は、好きで続けてきたことを、しまっておくだけでは惜しいと読む日。',heart:'上手に見せようとするほど、最初の「好き」が遠くなることはありませんか。',shelter:'誰かを喜ばせるためでも、自分の楽しむ気持ちまで削らないで。',quiet:'懐かしい味や、何度も見たくなる色。理由を説明できない「好き」にも居場所を。',question:'誰にも見せなくても、作ってみたいものはありますか。',warm:'好きだと思えた気持ちは、評価がつく前からあなたのものです。'},
 words:{titles:['しまっていた言葉に、出番を','うまさより、伝えたいこと','言葉で、自分まで傷つけない','正しさの奥にある願い','まだ言葉にならない思いへ','言いたいこと、届いてほしいこと'],invite:'今日は、胸の中で繰り返すだけだった言葉を、外へ届ける後押しのある日。',heart:'本当は分かってほしいのに、正しさで押し切りたくなることはありませんか。',shelter:'強く言えることと、思いが届くことは同じではありません。今日は言葉を武器にしすぎないで。',quiet:'すぐに答えを出せない思いにも、まだ言葉になる途中の大切さがあります。',question:'その言葉の奥で、いちばん分かってほしいのは何でしょう。',warm:'あなたの意見も、対話の席に置いていいのです。'},
 exchange:{titles:['会いたい気持ちに、遠慮はいらない','また話したい、その気持ちから','好かれるために、無理をしない','その返事に、本音はありますか','会いたい人を思い浮かべる','会話は楽しんで、約束は選んで'],invite:'今日は、待つ側から声をかける側へ。話してみたい人がいるなら、気の利いた用事を探さなくてもいいのです。',heart:'嫌われたくなくて、気の進まない誘いにも明るく返事をしていませんか。',shelter:'気持ちよく付き合うために、自分の時間まで差し出す必要はありません。',quiet:'連絡の数より、話したあとにどんな気持ちが残るかを大切にしたい日。',question:'好かれるための返事より、あなたが本当に聞きたいことは何でしょう。',warm:'大切なのは、好かれるための返事より、あなたが本当に聞きたいこと。'},
 daily:{titles:['積み重ねてきたものに、出番を','いつもの工夫が、次の味方に','続けるために、守るものがある','欲しいものと、必要なものの間','当たり前の中の、あなたの工夫','手応えはあっても、安売りしない'],invite:'今日は、派手な勝負より、積み重ねてきた工夫を外へ生かしたい日。',heart:'きちんとやることが当たり前になって、自分の手間を安く見積もっていませんか。',shelter:'続けたいものを守るために、今日すべてを引き受けなくてもいいのです。',quiet:'いつもの支度や、気づかれない工夫。暮らしを支えているものは、派手なことばかりではありません。',question:'安いからでも義務だからでもなく、大切に残したいものは何でしょう。',warm:'見えにくい積み重ねまで、なかったことにしないでください。'},
 pressure:{titles:['挑むなら、あなたの意思で','勇気は、助けを呼ぶ声にも','頼られることと、抱え込むこと','急がされる前に、自分へ戻る','急ぐ声から、少し離れて','動く勇気と、断る勇気'],invite:'動かしたかった用事があるなら、今日は自分の意思で向き合う後押しのある日。',heart:'頼まれると断れなくて、自分の予定を後ろへ押していませんか。',shelter:'誰かの急ぎを、すべてあなたの責任にしなくて大丈夫。',quiet:'急ぐ声が聞こえても、同じ速さで走らなければいけないとは限りません。',question:'急がされていることと、あなたが大切に進めたいことは同じでしょうか。',warm:'助けを求めることも、責任から逃げずに向き合う方法です。'},
 promise:{titles:['守りたい約束を、言葉にする','誠実さに、無理はいらない','いい返事より、守れる約束を','期待に応える、その前に','まだ増やさなくていい約束','進めたい話にも、譲れない線を'],invite:'今日は、大切にしている役割や約束を、黙って抱えるより言葉にして進めたい日。',heart:'がっかりさせたくなくて、守れるか分からない約束をしそうになっていませんか。',shelter:'誠実でいるために、無理な約束まで背負う必要はありません。',quiet:'新しい約束を増やさなくても、すでに大切にしているものに心を向けられる日。',question:'期待されているからではなく、あなたが守りたい約束は何でしょう。',warm:'できることを正直に伝える誠実さも、忘れないでいてください。'},
 view:{titles:['知らない見方に、扉を開く','答えより、問いが動き出す','新しさに、自分を預けすぎない','その答えは、あなたに合いますか','いつもの問いを、違う角度から','ひらめきと、見極めの間で'],invite:'今日は、いつもの答えの外にある見方へ、扉を開いてみたい日。',heart:'早く答えが欲しくて、分かりやすい話に気持ちが傾くことはありませんか。',shelter:'答えを急いで、自分の疑問まで置き去りにしないで。',quiet:'答えが変わらなくても、問い方を変えると見えるものがあります。',question:'その方法を選びたいのは、新しいからでしょうか、今のあなたに合うからでしょうか。',warm:'すぐに答えにならない問いも、あなたの見方を育ててくれます。'},
 learning:{titles:['知りたい気持ちが、入口になる','分からない、から始めていい','誰かの答えに、自分を消さない','教わることと、従うことの間','知っていることを、味わい直す','頼りながら、自分でも選ぶ'],invite:'今日は、知りたい気持ちを遠慮で閉じ込めず、誰かの知恵を訪ねたい日。',heart:'分からないと言うのが恥ずかしくて、聞きたいことを飲み込んでいませんか。',shelter:'頼れる人の言葉でも、あなたの事情を置き去りにする答えには立ち止まって。',quiet:'新しく覚えることだけが学びではありません。知っていることを使う時間にも、発見があります。',question:'正解をもらうことより、あなたが本当に分かりたいのは何でしょう。',warm:'知らないと伝えるところから始まる対話もあります。'}
};
// [growth, expression, foundation, choice, curiosity] retain the five-element meanings.
const WISHES={
 self:['これから担ってみたい役割','自分から担いたいという思い','自分を使い切らずにいられる役割','何を引き受け、何を任せたいのか','やってみたい役割の実際の姿'],
 sharing:['誰かと一緒に育てたい計画','助けてほしいという思い','お互いの得意を持ち寄れる分担','どこを手伝い、どこで頼りたいのか','一緒に進めるために必要なこと'],
 expression:['これから育てたい楽しみ','自分の好きだと思うところ','好きなことを暮らしに置く時間','作品にどんな味わいを残したいのか','興味のある作品や作り方'],
 words:['言葉にして育てたい提案','伝えたかった意見','意見を実際の暮らしにつなぐ工夫','何を伝え、どこを相談したいのか','意見の根拠'],
 exchange:['これから育てたいつながり','話してみたかったこと','無理なく会える距離感','誰と、どんな話をしたいのか','相手に聞いてみたかったこと'],
 daily:['これから続けたい仕事や暮らしの工夫','積み重ねてきた工夫','いつもの暮らしを支える習慣','何に時間やお金を使いたいのか','仕事や買い物で迷っている点'],
 pressure:['自分の意思で取り組みたい課題','助けが必要だという思い','助けを呼べる段取り','どこまでを自分で担いたいのか','依頼の本当の目的'],
 promise:['これから果たしたい約束','大切にしている約束への思い','約束を守り続けるための余裕','どの約束を大切に守りたいのか','約束の中でまだ分からないこと'],
 view:['これから試してみたい方法','気になっていた見方','今の暮らしに合うやり方','今の自分にはどの見方が合うのか','気になっていた方法の理由や背景'],
 learning:['これから深めたい学び','自分の言葉になりかけている学び','無理なく学べる自分のペース','いま本当に知りたいことは何か','教わってみたかったこと']
};
function elementThought(theme,elements){
 const wishes=WISHES[theme];if(!wishes||!elements?.length)return '';
 const [growth,voice,foundation,choice,curiosity]=wishes,key=elements.join('/');
 if(elements.length===2){const pairs={
  'wood/fire':`${growth}があるなら、${voice}を誰かに届けることも、その芽を育てる方法です。`,
  'wood/earth':`${growth}を大切にするためにも、${foundation}を味方につけたい日です。`,
  'wood/metal':`${growth}を思い描くことと、「${choice}」を考えることは、どちらもあなたの未来のためにできます。`,
  'wood/water':`${curiosity}を知ることから、${growth}の輪郭を探してみて。`,
  'fire/earth':`${foundation}があれば、${voice}も無理なく伝えていけます。`,
  'fire/metal':`「${choice}」を自分の中に持ちながら、${voice}を届けてみて。`,
  'fire/water':`${curiosity}を知ることが、${voice}をあなたらしい言葉にする支えになります。`,
  'earth/metal':`「${choice}」を考えるとき、${foundation}も大切な判断の軸になります。`,
  'earth/water':`${curiosity}に触れながら、${foundation}も忘れずにいたい日です。`,
  'metal/water':`${curiosity}を知ることから、「${choice}」の答えを探してみて。`
 };return pairs[key]||'';}
 return {wood:`${growth}があるなら、まだ形になっていなくても、その可能性を大切に。`,fire:`${voice}を、きれいな言い方が見つかるまでしまい込まなくてもいいのです。`,earth:`${foundation}も、願いを長く大切にするための土台です。`,metal:`「${choice}」を、誰かに合わせる前に自分へ問いかけてみて。`,water:`${curiosity}を尋ねることは、できない自分を見せるより、知りたい気持ちを差し出すこと。`}[elements[0]]||'';
}
const TONES=['opportunity','rising','caution','careful','steady','mixed'];
export function composeStory({theme,tone,advice,guard='',background='',uncertain=false,cause='neutral',elements=[]}){
 const p=PROFILES[theme],index=TONES.indexOf(tone);if(!p||index<0)return null;
 const thought=(tone==='opportunity'||tone==='rising')&&elementThought(theme,elements);
 const practical=[thought||advice,guard,background].filter(Boolean).join(' ');
 let paragraphs,kind={opportunity:'invitation',rising:'permission',caution:'shelter',careful:'discernment',mixed:'crossroads',steady:'discovery'}[tone];
 if(tone==='steady'&&cause==='clash'){kind='dialogue';paragraphs=[p.heart,practical,p.warm];}
 else if(tone==='steady'&&cause==='friction'){kind='unburden';paragraphs=[p.quiet,practical,p.warm];}
 else if(tone==='steady')paragraphs=practical?[p.quiet,practical+' '+p.question]:[p.quiet,p.question];
 else if(tone==='rising')paragraphs=[p.heart+' '+practical,p.warm];
 else if(tone==='opportunity')paragraphs=[p.invite,practical,p.warm];
 else if(tone==='caution')paragraphs=[p.shelter,practical,p.warm];
 else if(tone==='careful')paragraphs=[p.heart,practical,p.question];
 else paragraphs=[p.heart,practical,p.question];
 paragraphs=paragraphs.filter(Boolean);
 return {kind,title:p.titles[index]+(uncertain?'（参考）':''),paragraphs,body:paragraphs.join(' ')};
}
