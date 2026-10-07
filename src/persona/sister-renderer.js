(function(root,factory){root.KOYOMI_PERSONA_RENDERER=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const voices=new Map(),sections=new Map();
 function registerVoice(name,voice){if(!name||!voice)throw new Error('voice is required');voices.set(name,Object.freeze({...voice}));return api}
 function registerSection(name,renderer){if(!name||typeof renderer!=='function')throw new Error('section renderer is required');sections.set(name,renderer);return api}
 function line(value,fallback=''){return String(value||fallback).trim()}
 function sentence(value,fallback=''){const text=line(value,fallback);return text&&!/[。！？!?]$/.test(text)?text+'。':text}
 const PLAIN=[[/日主/g,'自分の基本性質'],[/用神/g,'バランスを整える要素'],[/忌神/g,'偏りを強める要素'],[/格局/g,'命式の中心的な型'],[/大運/g,'約10年間の流れ'],[/流年/g,'今年の流れ'],[/月運/g,'今月の流れ'],[/空亡/g,'慎重に判断する期間'],[/逆位置/g,'力が出にくい状態'],[/正位置/g,'力が出やすい状態'],[/冲/g,'ぶつかりや変化'],[/刑/g,'こじれやすさ'],[/六合/g,'協力しやすい結びつき']];
 function plain(value){return PLAIN.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),String(value||''))}
 function render(model,{voice='sister',level='standard',date}={}){const selected=level==='beginner'?'beginner':voice,v=voices.get(selected)||voices.get('sister');if(!v)throw new Error(`unknown voice: ${selected}`);const lex=globalThis.KOYOMI_SISTER_LEXICON?.session([model.system,model.scenario?.state,(model.evidence||[]).join('|'),selected].join('|')),phrase=(group,offset)=>lex?.pick(group,offset)||'',beginner=level==='beginner'?globalThis.KOYOMI_BEGINNER_EXPLAINER?.explain(model,{date}):null,context={...model,voice:v,phrase,level,plain,beginner};const order=model.order||(level==='beginner'?['opening','result','beginner','action','stop','review','evidence','closing']:['opening','result','scenario','action','stop','review','evidence','closing']);context.hasResult=order.includes('result');context.primaryInExample=Boolean(beginner?.primaryAction&&order.includes('beginner')&&beginner.primaryAction===line(model.scenario?.action));return order.map(name=>sections.get(name)?.(context)).filter(Boolean).join('\n\n')}
 const api={registerVoice,registerSection,render,plain,listVoices:()=>[...voices.keys()],listSections:()=>[...sections.keys()]};
 registerVoice('sister',{address:'アンタ',result:'姐さんの見立て',evidence:'根拠はここよ',action:'まず、これをおやりなさい',stop:'ここで止まりなさい',review:'あとで確かめること',closing:'最後に姐さんから'});
 registerVoice('zubat',{address:'アンタ',result:'ズバッと結論',evidence:'言い切る根拠',action:'今すぐやること',stop:'絶対にやめること',review:'合否判定',closing:'覚えておきなさい'});
 registerVoice('beginner',{address:'あなた',result:'まず結論',evidence:'そう判断した理由',action:'今日すること',stop:'やめておくこと',review:'あとで確認すること',closing:'覚えておいてほしいこと'});
 registerSection('opening',c=>`【${c.system}を姐さんが読むわ】\n${line(c.opening)}\n${line(c.axis)}`);
 registerSection('result',c=>`【${c.voice.result}】\n${c.phrase(c.scenario?.state==='前進'?'forward':c.scenario?.state==='防御'?'defense':'trial')}\n${sentence(c.result,c.scenario?.scene)}`);
 registerSection('scenario',c=>{const scene=line(c.scenario?.scene),repeated=c.hasResult&&scene===line(c.result,c.scenario?.scene);return`【${line(c.headings?.scenario,'現実で確かめること')}】\n${repeated?'':sentence(scene)+'\n'}確認する目安：${sentence(c.scenario?.observable,'進み具合や負担')}`});
 registerSection('beginner',c=>c.beginner?`【簡単にいうと】\n${c.beginner.meaning}\n\n【今日の具体例】\n${c.beginner.example}\n\n${c.beginner.alternative}`:'');
 registerSection('action',c=>c.primaryInExample?'':`【${line(c.headings?.action,c.voice.action)}】\n${c.phrase('transition')} ${sentence(c.scenario?.action)}\n続ける条件：${sentence(c.scenario?.go)}\n条件が変わったら、進め方も見直して。`);
 registerSection('stop',c=>`【${line(c.headings?.stop,c.voice.stop)}】\n${sentence(c.scenario?.stop)}`);
 registerSection('review',c=>`【${line(c.headings?.review,c.voice.review)}】\n${line(c.scenario?.review,'14日')}ほど経った頃に、負担が減ったか、相手や状況が実際に動いたかを見てちょうだい。`);
 registerSection('evidence',c=>{const raw=(c.evidence||[]).filter(Boolean).join('／')||'算出結果を確認済み',glossary=globalThis.KOYOMI_DIVINATION_GLOSSARY;if(c.level==='beginner'){if(glossary){const g=glossary.beginner(raw);return`【${c.voice.evidence}】\n占いの結果を普通の言葉に直すと、${g.plain}。${g.notes.length?`\n\n【専門用語と読み】\n${g.notes.join('\n')}`:''}`}return`【${c.voice.evidence}】\n占いの結果を普通の言葉に直すと、${c.plain(raw)}。`}return`【${line(c.headings?.evidence,c.voice.evidence)}】\n${c.phrase('evidence')}\n${glossary?glossary.annotate(raw):raw}。`});
 registerSection('analysis',c=>{const items=Array.isArray(c.analysis)?c.analysis:[];if(!items.length)return'';return items.map((item,index)=>`【${line(item.title,'命式の読み')}】\n${index?'次はここよ。':'まず、ここを見なさい。'}${line(item.reading)}\nつまり、${line(item.meaning)}ってこと。${item.example?`\n現実ではね、${line(item.example)}`:''}${item.action?`\n姐さんからの宿題：${line(item.action)}`:''}`).join('\n\n')});
 registerSection('closing',c=>`【${c.voice.closing}】\n${line(c.closing)}`);
 return api
});
