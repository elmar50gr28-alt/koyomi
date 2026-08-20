(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.KOYOMI_MEANING_EVIDENCE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSION='1.0.0';
  const FORBIDDEN=/(四柱推命|宿曜|九星(?:気学)?|西洋占星術|タロット|ルーン|姓名判断|数秘(?:術)?|カバラ|六星|大運|流年|日主|用神|喜神|忌神|五行|空亡|命式|トランジット|アスペクト|正位置|逆位置|天干|地支|十二支|ハウス|惑星|チャート|[0-9]+(?:\.[0-9]+)?\s*(?:点|件|\/100))/;
  const DOMAIN={
    work:{subject:'仕事や役割',forward:'準備してきた提案や相談を、相手に見せられる段階です',test:'仕事の話は進められますが、担当と期限を曖昧にすると負担だけが増えます',protect:'新しい責任を増やすより、いま抱えている仕事の範囲を整える日です',action:'返事の前に、担当・期限・負担の三つを確認してください'},
    money:{subject:'お金の判断',forward:'必要性と総額が見えている買い物なら、前へ進められます',test:'魅力はありますが、維持費や解約条件に見落としが残りやすい状態です',protect:'今日は増やす判断より、出ていくお金を止める判断が向いています',action:'総額、毎月の負担、やめる場合の費用を一度書き出してください'},
    relationship:{subject:'人との関係',forward:'率直に話すことで、止まっていた関係を動かせる時です',test:'関係を進める余地はありますが、期待と事実を混ぜるとすれ違います',protect:'相手の答えを追うより、まず自分が守りたい境界線をはっきりさせる日です',action:'一度の会話では論点を一つに絞り、望む行動を具体的に伝えてください'},
    health:{subject:'心身の調子',forward:'生活の立て直しを始めるにはよいタイミングです',test:'無理は利きますが、後から疲れが出やすい状態です',protect:'今日は成果より回復を優先し、負担をこれ以上増やさないでください',action:'今夜の就寝時刻を決め、続く不調は占いで判断せず医療機関へ相談してください'},
    timing:{subject:'動く時期',forward:'準備済みのことは、今日から動かして構いません',test:'小さく試すところまでは進めますが、最終決定は反応を見てからです',protect:'いまは結論を急ぐより、条件がそろうまで待つほうが損を防げます',action:'元に戻せる最小の一手だけ実行し、結果を見て次を決めてください'},
    identity:{subject:'これからの自分の役割',forward:'自分が引き受けたい役割を、言葉と行動で示せる時です',test:'方向は見えていますが、周囲に合わせすぎると本音が置き去りになります',protect:'新しい肩書きを増やすより、もう担わなくてよい役割を減らす時です',action:'今後も続けたい約束と、やめたい役割を一つずつ書いてください'},
    overall:{subject:'今日の流れ',forward:'準備してきたことを、現実の一歩へ移しやすい日です',test:'前へ進む余地はありますが、一気に決めると見落としが出やすい日です',protect:'今日は広げるより、減らす・休む・整えることで流れを守れます',action:'今日中に終えられ、元にも戻せることを一つだけ選んでください'}
  };
  function clean(value){return String(value??'').replace(/\s+/g,' ').trim()}
  function domain(value){const key=clean(value).toLowerCase(),map={career:'work',changejob:'work',income:'money',purchase:'money',love:'relationship',marriage:'relationship',reconcile:'relationship',healthrhythm:'health',choice:'overall'};return DOMAIN[key]?key:(map[key]||'overall')}
  function state(value,score){if(['forward','test','protect'].includes(value))return value;return Number(score)>=72?'forward':Number(score)<42?'protect':'test'}
  function translate(judgment={}){const key=domain(judgment.domain),copy=DOMAIN[key],mode=state(judgment.state,judgment.score),lines=[copy[mode]];
    if(judgment.contradiction)lines.push(`ただ、${copy.subject}には追い風と慎重さが同時に出ています。進める部分と、まだ約束しない部分を分けましょう。`);
    else if(mode==='forward')lines.push('すべてを変える必要はありません。すでに準備できていることから始めるほど、手応えにつながります。');
    else if(mode==='test')lines.push('良し悪しを頭の中だけで決めず、小さく試したときの相手の反応や自分の負担を見てください。');
    else lines.push('止まることは後退ではありません。余計な約束や出費を増やさないことが、次の選択肢を守ります。');
    lines.push(copy.action);
    return lines.filter(line=>line&&!FORBIDDEN.test(line));
  }
  function containsForbidden(value){return FORBIDDEN.test(clean(value))}
  function assertPublic(lines){return(Array.isArray(lines)?lines:[lines]).every(line=>!containsForbidden(line))}
  return Object.freeze({VERSION,FORBIDDEN,translate,containsForbidden,assertPublic});
});
