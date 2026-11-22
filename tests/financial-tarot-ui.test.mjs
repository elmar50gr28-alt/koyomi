import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

class Element {
  constructor(){this.children=[];this.attributes={};this.listeners={};this.textContent='';this.hidden=false;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(name,value){this.attributes[name]=value;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){this.listeners.click();}
  scrollIntoView(){}
}
const ids=Object.fromEntries(['results','resultTitle','cards','reading','evidence','description','draw'].map(id=>[id,new Element()]));
const buttons=['daily','personal','world'].map(spread=>Object.assign(new Element(),{dataset:{spread}}));
const registered=[];
const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
globalThis.document={getElementById:id=>ids[id],querySelectorAll:()=>buttons,createElement:()=>new Element()};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{register:url=>{registered.push(url);return Promise.resolve();}}}});
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
try {
  const {SPREADS}=await import('../src/financial/tarot.js?ui');
  assert.equal(registered.length,1,'direct entry registers the offline worker');
  assert.ok(registered[0].pathname.endsWith('/service-worker.js'));
  assert.equal(ids.results.hidden,true);
  let daily;
  for(const button of buttons){
    button.click();
    const type=button.dataset.spread,spread=SPREADS[type];
    assert.equal(button.attributes['aria-pressed'],'true');
    assert.equal(buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);
    assert.equal(ids.results.hidden,true,'switching spread clears stale results');
    assert.equal(ids.description.textContent,spread.description);
    ids.draw.click();
    assert.equal(ids.results.hidden,false);
    assert.equal(ids.resultTitle.textContent,spread.title);
    assert.equal(ids.cards.children.length,spread.positions.length);
    assert.equal(ids.evidence.children.length,spread.positions.length);
    assert.equal(new Set(ids.cards.children.map(c=>c.children[2].textContent)).size,spread.positions.length);
    for(const position of spread.positions)assert.ok(ids.reading.textContent.includes(position));
    assert.ok(!ids.reading.textContent.includes('undefined'));
    if(type==='daily')daily=ids.reading.textContent;
  }
  buttons[0].click();ids.draw.click();
  assert.equal(ids.reading.textContent,daily,'daily result remains stable across spread changes');
} finally {
  delete globalThis.document;delete globalThis.localStorage;
  if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
}
const html=await readFile(new URL('../financial.html',import.meta.url),'utf8');
const home=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(home,/href="financial.html"/);
assert.match(html,/href="\.\/index.html"/);
assert.match(html,/name="viewport"/);
assert.match(html,/flex-wrap:wrap/);
assert.match(html,/min-height:48px/);
assert.match(html,/aria-live="polite"/);
assert.match(html,/:focus-visible/);
console.log('Financial tarot UI interaction, navigation and mobile contracts passed');
