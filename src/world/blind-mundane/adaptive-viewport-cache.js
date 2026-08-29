export const ADAPTIVE_MUNDANE_VERSION='adaptive-mundane-viewport-v1.0';

export const adaptiveMundaneResolution=zoom=>{const value=Number(zoom);return value<2.5?1:value<4.5?2:value<6.5?3:4};
export const adaptiveMundaneCacheKey=({date,horizonDays,resolution,cellIds})=>`${ADAPTIVE_MUNDANE_VERSION}:${new Date(date).toISOString().slice(0,13)}:${Number(horizonDays)}:r${Number(resolution)}:${[...cellIds].map(String).sort().join('.')}`;

export class AdaptiveMundaneCache{
  constructor(maxEntries=24){this.maxEntries=Math.max(1,Number(maxEntries)||24);this.entries=new Map()}
  get(key){const value=this.entries.get(key);if(value===undefined)return null;this.entries.delete(key);this.entries.set(key,value);return value}
  set(key,value){if(this.entries.has(key))this.entries.delete(key);this.entries.set(key,value);while(this.entries.size>this.maxEntries)this.entries.delete(this.entries.keys().next().value);return value}
  clear(){this.entries.clear()}
}
