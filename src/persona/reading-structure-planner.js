(function(root,factory){root.KOYOMI_READING_STRUCTURE_PLANNER=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const LAYOUTS={
  前進:[['opening','result','action','evidence','closing'],['opening','scenario','result','action','evidence','closing'],['opening','result','evidence','action','review','closing'],['opening','result','action','stop','evidence','closing']],
  試行:[['opening','result','scenario','action','review','evidence','closing'],['opening','result','action','evidence','review','closing'],['opening','scenario','action','stop','evidence','closing'],['opening','result','action','evidence','closing']],
  防御:[['opening','result','stop','action','evidence','closing'],['opening','scenario','stop','action','evidence','closing'],['opening','result','evidence','stop','review','closing'],['opening','result','stop','evidence','closing']]
 };
 const HEADINGS={
  scenario:['いま表れやすいこと','現実ではこう出るわ','今日の流れを読むと','見逃さないでほしい兆し'],
  action:['今日、動かすなら','姐さんならこうするわ','今のあなたに効く一手','ここから始めて'],
  stop:['無理をしない境目','この兆しが出たら待って','今日は越えない線','引き返す目印'],
  review:['答え合わせの時','変化を見る頃','次に見直すところ','あとで見るのはここ'],
  evidence:['こう読んだ理由','占いに出ている印','姐さんが見た手がかり','結論を支えるもの']
 };
 function hash(text){let value=2166136261;for(const ch of String(text||''))value=Math.imul(value^ch.charCodeAt(0),16777619);return value>>>0}
 function pick(list,seed,offset=0){return list[((hash(seed)+offset*2654435761)>>>0)%list.length]}
 function plan(input,scenario){const seed=[input.system,input.score,input.variant||0,(input.evidence||[]).join('|'),scenario.state].join('|'),layouts=LAYOUTS[scenario.state]||LAYOUTS.試行,order=pick(layouts,seed);return{order,headings:Object.fromEntries(Object.entries(HEADINGS).map(([key,list],index)=>[key,pick(list,seed,index+1)])),structureId:`${scenario.state}-${layouts.indexOf(order)+1}`}}
 return{LAYOUTS,HEADINGS,plan};
});
