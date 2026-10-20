(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KOYOMI_READING_DATES=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const pad=n=>String(n).padStart(2,'0');
 const format=d=>`${String(d.getFullYear()).padStart(4,'0')}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
 function parse(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.slice(0,4)==='0000')return null;
  const [y,m,d]=value.split('-').map(Number),date=new Date(0);date.setFullYear(y,m-1,d);date.setHours(12,0,0,0);
  return format(date)===value?date:null;
 }
 function shift(value,days){const date=parse(value);if(!date||!Number.isInteger(days))return null;date.setDate(date.getDate()+days);return parse(format(date))?format(date):null;}
 function describe(value,today=format(new Date())){
  const date=parse(value),now=parse(today);if(!date||!now)return null;
  const ordinal=d=>Date.parse(format(d)+'T00:00:00Z'),distance=Math.round((ordinal(date)-ordinal(now))/86400000);
  const relative=({'-1':'昨日',0:'今日',1:'明日',2:'明後日'})[distance]||'',word=relative||'この日';
  return {date:value,relative,word,label:`${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日（${'日月火水木金土'[date.getDay()]}）${relative?'・'+relative:''}`};
 }
 // Date words belong to the displayed date. Canonical/cached readings stay unchanged.
 function text(value,date,today=format(new Date())){
  const info=describe(date,today);if(!info||info.relative==='今日')return String(value||'');
  const words={今日:info.word,昨日:'前日',明日:'翌日',明後日:'2日後',今夜:info.word+'の夜'};
  return String(value||'').replace(/明後日|明日|昨日|今日|今夜/g,word=>words[word]);
 }
 function createController({getDate,generate,onState=()=>{},capture=()=>null,restore=()=>{},now=()=>format(new Date())}){
  let desired=getDate(),rendered=null,running=null,revision=0,anchor=null,phase='idle';
  const publish=(error='')=>onState({date:desired,rendered,phase,error,description:describe(desired,now())});
  async function drain(){
   let completed=-1;
   while(completed!==revision){
    const current=revision,date=desired;phase='loading';publish();
    try{
     const ok=await generate(date);completed=current;
     if(current!==revision)continue;
     if(!ok)throw new Error('読みの更新を確認できませんでした。');
     rendered=date;phase='ready';publish();restore(anchor);
    }catch(error){
     completed=current;if(current!==revision)continue;
     phase='error';publish('鑑定を更新できませんでした。もう一度お試しください。');
    }
   }
   running=null;return phase==='ready';
  }
  function request(value){
   if(!parse(value)){publish('有効な日付を選んでください。');return Promise.resolve(false);}
   desired=value;revision++;if(!running)anchor=capture();phase='loading';publish();
   if(!running)running=Promise.resolve().then(drain);
   return running;
  }
  function renderedAt(value){if(running||!parse(value))return;desired=value;rendered=value;phase='ready';publish();}
  return Object.freeze({request,step:days=>{const value=shift(desired,days);return value?request(value):Promise.resolve(false);},today:()=>request(now()),retry:()=>request(desired),renderedAt,state:()=>({date:desired,rendered,phase})});
 }
 function mount({target,content,getDate,generate,now,onReady=()=>{},view=target?.ownerDocument?.defaultView}){
  if(!target||!content)return null;
  const doc=target.ownerDocument,nav=doc.createElement('nav');nav.className='reading-date-nav';nav.hidden=true;nav.setAttribute('aria-label','鑑定日を変更');
  nav.innerHTML='<div class="reading-date-row"><button type="button" data-reading-date="prev" aria-label="前日の鑑定を見る">‹ 前日</button><button type="button" class="reading-date-label" data-reading-date="choose" aria-expanded="false"></button><button type="button" data-reading-date="next" aria-label="翌日の鑑定を見る">翌日 ›</button></div><div class="reading-date-tools"><button type="button" data-reading-date="today">今日に戻る</button><span data-reading-date="status" role="status" aria-live="polite"></span><button type="button" data-reading-date="retry" hidden>再試行</button></div><div class="reading-date-picker" data-reading-date="picker" hidden><label>鑑定する日 <input type="date" data-reading-date="input" min="0001-01-01" max="9999-12-31"></label><button type="button" data-reading-date="apply">この日を見る</button></div>';
  target.insertBefore(nav,content);const el=key=>nav.querySelector(`[data-reading-date="${key}"]`),originals=new WeakMap();
  function applyDate(date){
   const walker=doc.createTreeWalker(content,4);let node;
   while((node=walker.nextNode())){
    if(node.parentElement?.closest('script,style,textarea,input,select,[data-no-reading-date]'))continue;
    const previous=originals.get(node),raw=previous&&node.nodeValue===previous.rendered?previous.raw:node.nodeValue;
    const rendered=text(raw,date,now?.());node.nodeValue=rendered;originals.set(node,{raw,rendered});
   }
  }
  function capture(){
   const top=nav.getBoundingClientRect().bottom+12;
   const candidates=[...content.querySelectorAll('.divination-box[open],#overallReading')];
   const node=candidates.find(n=>{const box=n.getBoundingClientRect();return box.top<=top&&box.bottom>top;})||candidates.find(n=>n.getBoundingClientRect().top>=top);
   const details=[...content.querySelectorAll('details')].map(n=>({id:n.id,parent:n.parentElement?.closest('details[id]')?.id||'',summary:n.querySelector('summary')?.textContent,open:n.open}));
   return {id:node?.id,top:node?.getBoundingClientRect().top,y:view?.scrollY||0,details};
  }
  function restore(anchor){
   if(!anchor)return;
   const details=[...content.querySelectorAll('details')];
   for(const saved of anchor.details){const node=saved.id?doc.getElementById(saved.id):details.find(n=>!n.id&&(n.parentElement?.closest('details[id]')?.id||'')===saved.parent&&n.querySelector('summary')?.textContent===saved.summary);if(node)node.open=saved.open;}
   view?.requestAnimationFrame(()=>{const node=anchor.id?doc.getElementById(anchor.id):null;if(node&&Number.isFinite(anchor.top))view.scrollBy({top:node.getBoundingClientRect().top-anchor.top,behavior:'instant'});else view.scrollTo({top:anchor.y,behavior:'instant'});});
  }
  const controller=createController({getDate,generate,now,capture,restore,onState:state=>{
   if(state.phase!=='idle')nav.hidden=false;
   el('choose').textContent=state.description?.label||state.date;
   if(!state.error)el('input').value=state.date;
   const loading=state.phase==='loading',available=state.phase==='ready';
   content.classList.toggle('reading-date-pending',!available);content.inert=!available;content.setAttribute('aria-busy',String(loading));content.setAttribute('aria-hidden',String(!available));
   el('status').textContent=state.error||(loading?'この日の鑑定を更新しています…':available?'':'');
   el('retry').hidden=state.phase!=='error';
   el('prev').disabled=!shift(state.date,-1);el('next').disabled=!shift(state.date,1);el('today').disabled=available&&state.description?.relative==='今日';
   if(available&&!state.error){el('picker').hidden=true;el('choose').setAttribute('aria-expanded','false');for(const node of content.querySelectorAll('[data-lucky-date]'))node.textContent='鑑定日：'+state.date;applyDate(state.date);onReady(state.date);}
  }});
  el('prev').addEventListener('click',()=>controller.step(-1));el('next').addEventListener('click',()=>controller.step(1));el('today').addEventListener('click',()=>controller.today());el('retry').addEventListener('click',()=>controller.retry());
  el('choose').addEventListener('click',()=>{const picker=el('picker');picker.hidden=!picker.hidden;el('choose').setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden)el('input').focus();});
  el('apply').addEventListener('click',()=>controller.request(el('input').value));el('input').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();controller.request(el('input').value);}});
  return Object.freeze({rendered:controller.renderedAt,request:controller.request,state:controller.state,refresh:()=>{const state=controller.state();if(state.phase==='ready')applyDate(state.rendered);}});
 }
 return Object.freeze({parse,format,shift,describe,text,createController,mount});
});
