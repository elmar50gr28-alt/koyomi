(function(root){
  'use strict';
  const FOCUSES=Object.freeze({income:'収入・貯蓄・固定費',purchase:'大きな買い物・契約'});
  function withInputs({document,getDate,setDate,calculate},focus,date){
    if(!Object.hasOwn(FOCUSES,focus))throw new Error('財運のテーマを選んでください。');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('鑑定日を確認してください。');
    const parsed=new Date(date+'T12:00:00');
    if(!Number.isFinite(parsed.getTime())||localDate(parsed)!==date)throw new Error('鑑定日を確認してください。');
    const values={theme:'money',qFocus:focus,question:'',memo:'',consultation:'',qMethodPriority:'shichu'};
    const fields=Object.keys(values).map(id=>document.getElementById(id)).filter(Boolean),previous=fields.map(el=>el.value),previousDate=getDate();
    try{fields.forEach(el=>el.value=values[el.id]);setDate(parsed);return calculate();}
    finally{fields.forEach((el,i)=>el.value=previous[i]);setDate(previousDate);}
  }
  function localDate(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
  function directVerdict(judgment,focus){
    if (judgment.scoreAvailable===false || judgment.status==='insufficient') return {
      label:'保留',title:'鑑定材料が不足。吉凶を捏造しません。',
      reason:'計算できた占術が不足しています。',action:'入力条件を確認してください。'
    };
    const mode=['forward','test','protect'].includes(judgment.state)?judgment.state:
      (judgment.score>=72?'forward':judgment.score<42?'protect':'test');
    const phrases={
      income:{
        forward:['吉','金運は吉。収入と貯蓄を前進させる時。','収入を増やす方法を一つ具体化する。'],
        test:['半吉半凶','金運は半吉半凶。増収より収支の整理が先。','固定費か貯蓄の条件を一つ見直す。'],
        protect:['凶','金運は凶。今日は守りに徹せよ。','支出を増やさず、固定費を一つ点検する。']
      },
      purchase:{
        forward:['吉','買い物運は吉。ただし条件を揃えて進め。','総額と契約条件を確認してから決める。'],
        test:['半吉半凶','買い物運は半吉半凶。即決は凶。','複数の候補と維持費を比較する。'],
        protect:['凶','買い物運は凶。大きな契約は見送れ。','購入の必要性と解約費用を見直す。']
      }
    };
    const [label,title,action]=phrases[focus]?.[mode]||phrases.income.test;
    const disagree=judgment.contradiction?'占術同士の判断は割れていますが、':'';
    const reason=disagree+'利用可能な占術を統合した結果、'+label+'と判定しました。';
    return {label,title,reason,action:'今日の一手：'+action};
  }
  function createReading({legacy,methods,judgment,profile},bazi,focus,date){
    if(!legacy||!profile||!judgment)throw new Error('鑑定に必要なデータを取得できませんでした。');
    const structured=bazi.calculateBazi(profile,profile.baziSettings||root.KOYOMI_BAZI_SETTINGS?.()||{},{referenceDate:new Date(date+'T12:00:00')});
    const finance=bazi.buildBaziReading(structured,{locale:'ja'}).sections.finance;
    if(!finance)throw new Error('四柱推命の財運を取得できませんでした。');
    const views=methods.filter(method=>method.key!=='shichu').map(method=>{
      const available=method.available!==false&&method.conf?.available!==false;
      if(!available)return {label:method.label,available:false,text:'入力・計算条件が不足しているため、今回は判定を保留します。',evidence:method.factors||[]};
      const key=method.key;
      const adapted=root.KOYOMI_PERSONA_ADAPTER.applyDivination(legacy.divinations[key]||'',{
        methodId:key,system:method.label,domain:focus,date,score:method.score,confidence:method.conf?.score,
        evidence:method.factors,profileId:profile.personId||profile.id||profile.displayName,
        symbols:key==='tarot'?legacy.tarot:key==='runes'?legacy.runes:undefined,
        transitAssets:key==='astrology'&&legacy.astro?{transits:legacy.astro.transits}:undefined,
        level:'beginner',mode:'sister',generatedAction:true
      });
      return {label:method.label,available:true,text:adapted.text,evidence:method.factors||[]};
    });
    return {name:profile.displayName||'本人',date,focusLabel:FOCUSES[focus],judgment,finance,views,timeUnknown:!profile.birthData?.time||profile.birthData?.timeUnknown};
  }
  function mount({document,prepare,calculate,loadBazi=()=>import('../bazi/index.js')}){
    const form=document.getElementById('financialReadingForm');if(!form||form.dataset.bound)return;
    form.dataset.bound='1';
    const get=id=>document.getElementById(id),output=get('financialReadingResult'),status=get('financialReadingStatus'),button=get('financialReadingSubmit');
    get('financialReadingDate').value=localDate(new Date());
    const clear=()=>{output.hidden=true;output.replaceChildren();status.textContent='';};
    form.addEventListener('input',clear);
    function element(tag,text,className){const node=document.createElement(tag);if(text!=null)node.textContent=text;if(className)node.className=className;return node;}
    function block(title,text){const section=element('section',null,'financial-block');section.append(element('h3',title),element('p',text));return section;}
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(button.disabled)return;
      clear();button.disabled=true;button.textContent='財運を鑑定中…';
      const focus=get('financialReadingFocus').value,date=get('financialReadingDate').value;
      try{
        const ready=await prepare();
        if(!ready){status.textContent='先に本人プロフィールを登録してください。登録後、このページで鑑定できます。';return;}
        const bazi=await loadBazi();
        const pack=calculate(focus,date),reading=createReading(pack,bazi,focus,date);
        if(focus!==get('financialReadingFocus').value||date!==get('financialReadingDate').value)return;
        output.append(element('h2',reading.name+'さんの財運'),element('p',date+' ／ '+reading.focusLabel,'financial-meta'));
        const j=reading.judgment,verdict=directVerdict(j,focus);
        const verdictBox=element('section',null,'financial-verdict');
        verdictBox.append(element('span','占術上の判定：'+verdict.label,'financial-verdict-label'),
          element('h3',verdict.title),element('p',verdict.action,'financial-verdict-action'),
          element('p',verdict.reason,'financial-meta'));
        output.append(verdictBox);
        const summary=j.scoreAvailable===false?'判定保留：利用できる計算結果がありません。':root.KOYOMI_MEANING_EVIDENCE.translate(j).join('\n');
        output.append(block('詳しい鑑定',summary));
        const finance=reading.finance;
        output.append(block('四柱推命から見る財運',[finance.beginnerSummary,finance.action,finance.caution].filter(Boolean).join('\n\n')));
        if(reading.timeUnknown)output.append(element('p','出生時刻が不明のため、四柱推命・西洋占星術の一部は限定した条件で読んでいます。','financial-meta'));
        for(const view of reading.views){const details=element('details');details.append(element('summary',view.label+(view.available?'':'（判定保留）')),element('p',view.text));if(view.evidence.length)details.append(element('p','根拠：'+view.evidence.join(' ／ '),'financial-meta'));output.append(details);}
        if(j.withheldSystems?.length)output.append(element('p','総合判定から除外：'+j.withheldSystems.join('・'),'financial-meta'));
        output.hidden=false;status.textContent='財運の鑑定ができました。';
      }catch(error){clear();status.textContent=error.message||'鑑定できませんでした。時間をおいてもう一度お試しください。';}
      finally{button.disabled=false;button.textContent='財運を総合鑑定する';}
    });
  }
  root.KOYOMI_FINANCIAL_PAGE=Object.freeze({FOCUSES,withInputs,createReading,directVerdict,mount});
})(typeof window==='undefined'?globalThis:window);
