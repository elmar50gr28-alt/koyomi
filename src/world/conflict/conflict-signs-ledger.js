import { CONFLICT_SIGNS_VERSION } from './conflict-signs-core.js';
export const CONFLICT_LEDGER_KEY='koyomi:conflict-signs-ledger:v1';
const key=item=>`${item.engineVersion}:${item.placeId}:${item.issuedAt.slice(0,10)}:${item.horizonDays}`;
export function loadConflictLedger(storage=globalThis.localStorage){try{const value=JSON.parse(storage?.getItem(CONFLICT_LEDGER_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
export function saveConflictSnapshot(items,{storage=globalThis.localStorage,maxEntries=400}={}){const entries=loadConflictLedger(storage),known=new Set(entries.map(key)),added=[];for(const item of items){if(item.engineVersion!==CONFLICT_SIGNS_VERSION||known.has(key(item)))continue;const entry={...item,recordedAt:new Date().toISOString(),settlement:{status:'pending'}};entries.push(entry);known.add(key(item));added.push(entry)}const result=entries.slice(-maxEntries);storage?.setItem(CONFLICT_LEDGER_KEY,JSON.stringify(result));return{entries:result,added}}
