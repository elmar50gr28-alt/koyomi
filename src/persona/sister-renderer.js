(function(root,factory){root.KOYOMI_PERSONA_RENDERER=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const voices=new Map(),sections=new Map();
 function registerVoice(name,voice){if(!name||!voice)throw new Error('voice is required');voices.set(name,Object.freeze({...voice}));return api}
 function registerSection(name,renderer){if(!name||typeof renderer!=='function')throw new Error('section renderer is required');sections.set(name,renderer);return api}
 function line(value,fallback=''){return String(value||fallback).trim()}
 function render(model,{voice='sister'}={}){const v=voices.get(voice)||voices.get('sister');if(!v)throw new Error(`unknown voice: ${voice}`);const context={...model,voice:v};return(model.order||['opening','result','scenario','action','stop','review','evidence','closing']).map(name=>sections.get(name)?.(context)).filter(Boolean).join('\n\n')}
 const api={registerVoice,registerSection,render,listVoices:()=>[...voices.keys()],listSections:()=>[...sections.keys()]};
 registerVoice('sister',{address:'アンタ',result:'姐さんの見立て',evidence:'根拠はここよ',action:'まず、これをおやりなさい',stop:'ここで止まりなさい',review:'あとで確かめること',closing:'最後に姐さんから'});
 registerVoice('zubat',{address:'アンタ',result:'ズバッと結論',evidence:'言い切る根拠',action:'今すぐやること',stop:'絶対にやめること',review:'合否判定',closing:'覚えておきなさい'});
 registerSection('opening',c=>`【${c.system}を姐さんが読むわ】\n${line(c.opening)}\n${line(c.axis)}`);
 registerSection('result',c=>`【${c.voice.result}】\n${line(c.result,c.scenario?.scene)}`);
 registerSection('scenario',c=>`【現実に出やすい形】\n${line(c.scenario?.scene)}わ。見るのは「${line(c.scenario?.observable,'進捗と負担')}」よ。`);
 registerSection('action',c=>`【${c.voice.action}】\n${line(c.scenario?.action)}。進める条件は、${line(c.scenario?.go)}。`);
 registerSection('stop',c=>`【${c.voice.stop}】\n${line(c.scenario?.stop)}。一つでも出たら、運の点数より現実を優先するの。`);
 registerSection('review',c=>`【${c.voice.review}】\n${line(c.scenario?.review,'14日')}後に、始めた数・終えた数・負担・相手の行動から二つを比べてちょうだい。`);
 registerSection('evidence',c=>`【${c.voice.evidence}】\n${(c.evidence||[]).filter(Boolean).join('／')||'算出結果を確認済み'}。ここは口調でごまかさない計算資料よ。`);
 registerSection('closing',c=>`【${c.voice.closing}】\n${line(c.closing)}`);
 return api
});
