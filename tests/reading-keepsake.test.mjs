import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const storage=new Map(),context={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};vm.createContext(context);
for(const path of ['src/reading/daily/daily-reading-core.js','src/reading/method-reading-continuity.js','src/reading/app-narrative-engine.js','src/reading/method-interpretation.js','src/reading/reading-keepsake.js','src/persona/conversation-adapter.js'])vm.runInContext(await readFile(path,'utf8'),context);
const engine=context.KOYOMI_READING_KEEPSAKE,interpret=context.KOYOMI_METHOD_INTERPRETATION.interpret,adapter=context.KOYOMI_PERSONA_ADAPTER,planner=context.KOYOMI_METHOD_CONTINUITY;
const base={profileId:'keepsake',domain:'work',methodId:'shichu',confidence:80,score:55,evidence:['大運85','流年30','選択日70'],generatedAction:true,action:'元の行動'};
const fixtures=[['start',{...base,evidence:['大運85','流年85','選択日85']}],['boundary',base],['rest',{...base,evidence:['大運30','流年30','選択日30']}],['choice',{...base,methodId:'tarot',evidence:[],symbols:[{pos:'自分の立場',name:'正義',meaning:'思考・決断を素直に使う'}]}],['release',{...base,methodId:'runes',evidence:[],symbols:[{pos:'次の一手',name:'ハガラズ',meaning:'崩壊・刷新'}]}],['grow',{...base,methodId:'numerology',evidence:['個人年4','秩序を作り、積み上げる数']}]];
const allIds=new Set(Object.values(engine.BANK).flat().map(row=>row[0]));assert.ok(allIds.size>=32,'expand real item categories, not just repeat the same objects across axes');
for(const pool of Object.values(engine.BANK)){assert.equal(pool.length,12);assert.equal(new Set(pool.map(row=>row[0])).size,12);for(const row of pool)assert.ok(row.length===3&&row.every(x=>typeof x==='string'&&x.length>0));}
let cases=0;const metrics=[],samples=[];
for(const [axis,input] of fixtures){storage.clear();const ids=new Set(),alternatives=new Set();let last='',repeated=0,lastAlternative='',repeatedAlternative=0;
 for(let day=1;day<=30;day++){
  const date=new Date(Date.UTC(2026,4,day)).toISOString().slice(0,10),current={...input,profileId:axis,date,mode:'sister'},before=JSON.stringify(current),parsed=interpret(current),story=engine.decorate(current,parsed),out=adapter.applyDivination('元資料',current);
  assert.equal(story.axis,axis);assert.equal(JSON.stringify(current),before);assert.equal(out.narrative.quality.pass,true,out.narrative.quality.issues.join(','));assert.match(out.text,/今日のお守り/);assert.match(out.text,/手元になければ/);assert.doesNotMatch(out.text,/買って|購入して|必ず|絶対/);
  const plan=planner.plan({...current,action:story.invitation,generatedAction:false,keepsakeCandidates:story.keepsakeCandidates});assert.equal(plan.keepsake.axis,axis);assert.ok(out.text.includes(plan.keepsake.name));ids.add(plan.keepsake.id);if(last===plan.keepsake.id)repeated++;last=plan.keepsake.id;
  assert.equal(plan.alternative.axis,axis);assert.notEqual(plan.alternative.id,plan.keepsake.id);alternatives.add(plan.alternative.id);if(lastAlternative===plan.alternative.id)repeatedAlternative++;lastAlternative=plan.alternative.id;assert.ok(out.text.includes(plan.alternative.name));
  assert.equal(out.text,adapter.applyDivination('元資料',current).text);
  const sharp={...current,mode:'zubat'},sharpStory=engine.decorate(sharp,parsed),sharpOut=adapter.applyDivination('元資料',sharp);
  assert.equal(sharpStory.axis,axis);assert.equal(sharpStory.body,story.body);assert.equal(sharpStory.evidence,story.evidence);assert.notEqual(sharpStory.title,story.title);assert.equal(sharpOut.narrative.quality.pass,true,sharpOut.narrative.quality.issues.join(','));assert.ok(sharpOut.text.includes(plan.keepsake.name),'changing voice must not reroll the keepsake');
  if(day<=2&&axis==='boundary')samples.push({date,sister:out.text,zubat:sharpOut.text});cases+=2;
 }
 assert.equal(ids.size,12);assert.equal(repeated,0);assert.equal(alternatives.size,12);assert.equal(repeatedAlternative,0);metrics.push({axis,days:30,distinctKeepsakes:ids.size,adjacentRepeated:repeated,distinctAlternatives:alternatives.size,adjacentRepeatedAlternative:repeatedAlternative});
}
for(const special of [{confidence:20},{psychRisk:95},{risk:95},{evidence:['判定保留']},{domain:'healthrhythm',action:'必要な受診を優先する'}]){
 const out=adapter.applyDivination('元資料',{...base,date:'2026-06-01',...special});assert.doesNotMatch(out.text,/今日のお守り/);assert.notEqual(out.narrative.structure,'symbolic-story');
}
const explicit=adapter.applyDivination('元資料',{...base,date:'2026-06-02',generatedAction:false,action:'依頼者の指定行動'});assert.match(explicit.text,/依頼者の指定行動/);
assert.equal(engine.decorate({},null),null);
const starInput={...base,methodId:'tarot',evidence:[],symbols:[{pos:'自分の立場',name:'星',meaning:'希望を素直に使う'}]};assert.equal(engine.decorate(starInput,interpret(starInput)).keepsakeCandidates[0].name,'手元の青い小物');
const otherInput={...starInput,symbols:[{pos:'自分の立場',name:'月',meaning:'不安を素直に使う'}]};assert.ok(!engine.decorate(otherInput,interpret(otherInput)).keepsakeCandidates.some(x=>x.id==='blue'),'a Star-specific keepsake must not leak into another symbol');
assert.doesNotThrow(()=>planner.plan({...base,date:'2026-06-03',keepsakeCandidates:[]},{storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}}));
const app=await readFile('app.html','utf8'),worker=await readFile('service-worker.js','utf8');assert.ok(app.includes('src/reading/reading-keepsake.js'));assert.ok(worker.includes('./src/reading/reading-keepsake.js'));
const fields=Object.fromEntries(['name','line','alternative','source'].map(key=>[key,{textContent:''}])),target={hidden:true,querySelector:selector=>fields[selector.match(/data-lucky-(\w+)/)?.[1]]};
const input={...base,date:'2026-07-01',mode:'sister'},out=adapter.applyDivination('元資料',input);
assert.ok(out.keepsake);assert.ok(out.text.includes(out.keepsake.name));
const selected=engine.renderSummary(target,[{methodId:'shichu',label:'四柱推命',keepsake:out.keepsake,alternative:out.keepsakeAlternative}]);assert.equal(selected.keepsake,out.keepsake);assert.equal(target.hidden,false);assert.equal(fields.name.textContent,out.keepsake.name);assert.equal(fields.line.textContent,out.keepsake.line);assert.match(fields.source.textContent,/四柱推命/);
const astroEntry={methodId:'astrology',label:'西洋占星術',keepsake:{id:'other',name:'別の物',line:'別の読み'}};assert.equal(engine.renderSummary(target,[selected,astroEntry],'astrology'),astroEntry);assert.equal(fields.name.textContent,'別の物');assert.equal(engine.renderSummary(target,[selected],'astrology'),selected);
engine.renderSummary(target,[]);assert.equal(target.hidden,true);for(const field of Object.values(fields))assert.equal(field.textContent,'','old lucky item must disappear when there is no eligible reading');
assert.ok(app.includes('id="personalLuckyItem"'));assert.ok(app.includes('今日のラッキーアイテム'));assert.ok(app.includes('luckyEntries.push'));assert.ok(app.includes('r.i?.qMethodPriority'));
function element(tag){return {tag,children:[],attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v},appendChild(child){child.parent=this;this.children.push(child)},remove(){this.parent.children=this.parent.children.filter(x=>x!==this)},querySelector(selector){const key=selector.match(/\[([^\]]+)\]/)?.[1];return this.children.find(x=>Object.hasOwn(x.attrs,key))||null}}}
const doc={createElement:element},readingTarget=element('div');readingTarget.ownerDocument=doc;
engine.appendSelected(readingTarget,selected,'shichu');assert.equal(readingTarget.children.length,1);assert.equal(readingTarget.children[0].querySelector('[data-lucky-name]').textContent,out.keepsake.name);
engine.appendSelected(readingTarget,selected,'shichu');assert.equal(readingTarget.children.length,1,'rerender must replace, not duplicate the attachment');
engine.appendSelected(readingTarget,astroEntry,'shichu');assert.equal(readingTarget.children.length,0,'a different method must not borrow the selected item');
assert.ok(engine.selectedText('新しい精密鑑定',selected,'shichu').includes(out.keepsake.name));assert.equal(engine.selectedText('新しい精密鑑定',astroEntry,'shichu'),'新しい精密鑑定');
assert.ok(app.includes('appendSelected(shichu'));assert.ok(app.includes('selectedText(reading.beginnerText'));
// Execute the real profile invalidation path with local data stubs.
context.LedgerState={settings:{}};context.lastPersonal={luckyItem:selected};context.ledgerList=async()=>[];context.ledgerSaveAppSettings=async()=>{};const overall={textContent:'前の鑑定'};
context.$=id=>id==='personalLuckyItem'?target:id==='shichuReading'?readingTarget:id==='overallReading'?overall:null;
engine.renderSummary(target,[selected]);engine.appendSelected(readingTarget,selected,'shichu');
for(const prefix of ['function koyomiProfileCoreChanged(','async function koyomiInvalidateProfileReadings('])vm.runInContext(app.split(/\r?\n/).find(line=>line.startsWith(prefix)),context);
context.window={KOYOMI_READING_KEEPSAKE:engine};
assert.equal(await context.koyomiInvalidateProfileReadings('profile',{displayName:'同じ'},{displayName:'同じ'}),false);assert.equal(target.hidden,false);
await context.koyomiInvalidateProfileReadings('profile',{displayName:'前'},{displayName:'後'});assert.equal(context.lastPersonal,null);assert.equal(target.hidden,true);assert.equal(fields.name.textContent,'');assert.equal(readingTarget.children.length,0);assert.match(overall.textContent,/再計算/);
fields.date={textContent:''};context.selectedDate='2026-07-01';context.fmtIso=value=>value;context.LedgerState.selectedPrimary='person-a';context.v191zOracleMode='sister';
context.lastPersonal={reading:'鑑定本文',divinations:{shichu:'四柱推命の文章'},luckyItem:selected,luckyContext:{date:'2026-07-01',profileId:'person-a',selectionKey:engine.selectionKey()}};
const saved=[],notices=[];context.ledgerSaveReadingRecord=async(...args)=>saved.push(args);context.ledgerNotify=text=>notices.push(text);
for(const prefix of ['function koyomiLuckyItemContext(','function koyomiSyncLuckyItemView(','function ledgerPersonalInputSnapshot(','async function ledgerCapturePersonal('])vm.runInContext(app.split(/\r?\n/).find(line=>line.startsWith(prefix)),context);
context.koyomiSyncLuckyItemView();assert.equal(target.hidden,false);assert.equal(fields.date.textContent,'鑑定日：2026-07-01');assert.equal(readingTarget.children.length,1);
context.selectedDate='2026-07-02';context.koyomiSyncLuckyItemView();assert.equal(target.hidden,true);assert.equal(fields.name.textContent,'');assert.equal(readingTarget.children.length,0);await context.ledgerCapturePersonal();assert.equal(saved.length,0);
context.selectedDate='2026-07-01';context.LedgerState.selectedPrimary='person-b';context.koyomiSyncLuckyItemView();assert.equal(target.hidden,true);await context.ledgerCapturePersonal();assert.equal(saved.length,0);assert.equal(notices.length,2);
context.LedgerState.selectedPrimary='person-a';context.koyomiSyncLuckyItemView();assert.equal(target.hidden,false);assert.equal(fields.name.textContent,out.keepsake.name);await context.ledgerCapturePersonal();assert.equal(saved.length,1);assert.equal(saved[0][1][0],'person-a');assert.match(saved[0][2],/【鑑定日】\n2026-07-01/);assert.equal(saved[0][3].readingDate,'2026-07-01');assert.equal(saved[0][3].luckyItem.keepsake.id,out.keepsake.id);
assert.ok(app.includes('renderCalendar(){koyomiSyncLuckyItemView()'));assert.ok(app.includes('v197LedgerApplyPersonalBase(p);koyomiSyncLuckyItemView(p.id)'));
const attachLine=app.split(/\r?\n/).find(line=>line.includes('appendSelected(shichu,')),recordLine=app.split(/\r?\n/).find(line=>line.includes('personalResult.divinations.shichu='));
context.shichu=readingTarget;context.personalResult=context.lastPersonal;context.reading={beginnerText:'更新された精密鑑定'};
for(const change of ['date','profile']){
 context.selectedDate=change==='date'?'2026-07-02':'2026-07-01';context.LedgerState.selectedPrimary=change==='profile'?'person-b':'person-a';context.koyomiSyncLuckyItemView();assert.equal(readingTarget.children.length,0);
 vm.runInContext(attachLine,context);assert.equal(readingTarget.children.length,0,'a later precision render must not resurrect a hidden, mismatched item');
 vm.runInContext(recordLine,context);assert.equal(context.personalResult.divinations.shichu,context.reading.beginnerText,'the precision text must not mix an old item into the current result');
}
context.selectedDate='2026-07-01';context.LedgerState.selectedPrimary='person-a';vm.runInContext(attachLine,context);assert.equal(readingTarget.children.length,1);vm.runInContext(recordLine,context);assert.ok(context.personalResult.divinations.shichu.includes(out.keepsake.name));
// The existing asynchronous request guard must also survive these changes.
const precisionStart=app.indexOf('async function koyomiRenderBaziReading(){'),precisionEnd=app.indexOf('\nwindow.KOYOMI_READING_KEEPSAKE?.watchSettings(',precisionStart);assert.ok(precisionStart>=0&&precisionEnd>precisionStart);
vm.runInContext(app.slice(precisionStart,precisionEnd),context);
let release,calculations=0;context.koyomiBaziReadingProfile=()=>({id:'person-a'});context.koyomiPersonalReadingKey=()=>context.selectedDate+'|'+context.LedgerState.selectedPrimary;
context.KOYOMI_BAZI={prepareCommonReadingThemes:()=>new Promise(resolve=>{release=resolve}),calculateBazi:()=>{calculations++;return {}}};
for(const change of ['date','profile']){context.selectedDate='2026-07-01';context.LedgerState.selectedPrimary='person-a';const pending=context.koyomiRenderBaziReading();if(change==='date')context.selectedDate='2026-07-02';else context.LedgerState.selectedPrimary='person-b';release();await pending;assert.equal(calculations,0,'a pending precision request must stop after its date or profile changes');}
const settingFields={theme:{value:'overall'},qFocus:{value:''},qMethodPriority:{value:'integrated'}};
context.$=id=>settingFields[id]|| (id==='personalLuckyItem'?target:id==='shichuReading'?readingTarget:id==='overallReading'?overall:null);
context.selectedDate='2026-07-01';context.LedgerState.selectedPrimary='person-a';context.koyomiSyncLuckyItemView();assert.equal(target.hidden,false);
let onChange;engine.watchSettings({addEventListener:(type,handler)=>{assert.equal(type,'change');onChange=handler}},()=>context.koyomiSyncLuckyItemView());
for(const [id,value] of [['theme','money'],['qFocus','purchase'],['qMethodPriority','oracle']]){
 const before=settingFields[id].value;settingFields[id].value=value;onChange({target:{id}});assert.equal(target.hidden,true);assert.equal(readingTarget.children.length,0);const count=saved.length;await context.ledgerCapturePersonal();assert.equal(saved.length,count,'changed consultation settings must not be saved against an old reading');
 vm.runInContext(attachLine,context);assert.equal(readingTarget.children.length,0);settingFields[id].value=before;onChange({target:{id}});assert.equal(target.hidden,false);assert.equal(fields.name.textContent,out.keepsake.name);
}
await context.ledgerCapturePersonal();assert.equal(saved.at(-1)[3].readingSelection.priority,'integrated');assert.equal(saved.at(-1)[3].readingSelection.theme,'overall');
assert.ok(app.includes('saveState(false);koyomiSyncLuckyItemView();const panel='));
context.saveState=()=>{};context.setPage=()=>{};context.ledgerSetPanel=()=>{};context.toast=()=>{};context.ledgerList=async()=>[];
vm.runInContext(app.split(/\r?\n/).find(line=>line.startsWith('async function koyomiSelectTheme(')),context);
await context.koyomiSelectTheme('purchase','money');assert.equal(settingFields.qFocus.value,'purchase');assert.equal(settingFields.theme.value,'money');assert.equal(target.hidden,true,'the shortcut theme picker must synchronize even without a native change event');
settingFields.qFocus.value='';settingFields.theme.value='overall';onChange({target:{id:'theme'}});assert.equal(target.hidden,false);onChange({target:{id:'oracleModeSetting'}});assert.equal(target.hidden,false,'voice changes alone must not invalidate the lucky item');
if(process.env.KOYOMI_KEEPSAKE_REPORT)await writeFile(process.env.KOYOMI_KEEPSAKE_REPORT,JSON.stringify({cases,itemCategories:allIds.size,themeEntries:Object.values(engine.BANK).flat().length,metrics,samples},null,2));
console.log(`Reading voice/keepsake passed: ${cases} cases / ${allIds.size} item categories / six axes / 30 days / both voices`);
