import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { DECK, SPREADS, drawCards, interpret } from '../src/financial/tarot.js';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
assert.equal(DECK.length,78);
assert.equal(new Set(DECK.map(c=>c.id)).size,78);
assert.equal(DECK.filter(c=>c.group==='大アルカナ').length,22);
assert.equal(DECK.filter(c=>c.group==='小アルカナ').length,56);
for (const [key,spread] of Object.entries(SPREADS)) {
  const cards=drawCards(spread.positions.length);
  assert.equal(cards.length,spread.positions.length,key);
  assert.equal(new Set(cards.map(c=>c.id)).size,cards.length,key);
  cards.forEach((card,i)=> {
    assert.equal(typeof card.reversed,'boolean');
    const reading=interpret(card,spread.positions[i]);
    assert.equal(reading.position,spread.positions[i]);
    assert.ok(reading.message.length>0);
  });
}
assert.equal(drawCards(78).length,78);
for (const invalid of [0,79,-1,1.5]) assert.throws(()=>drawCards(invalid),RangeError);
assert.throws(()=>interpret({id:'invalid',reversed:false},'位置'));
console.log('Financial tarot deck and spread checks passed');
