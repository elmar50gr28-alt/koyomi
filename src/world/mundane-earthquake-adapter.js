import { createWorldContext, validateWorldResult } from './world-core.js';
import { calculateAngles } from '../mundane/western/seasonal-ingress-core.js';

export const MUNDANE_EARTHQUAKE_VERSION = 'mundane-earthquake-v0.1-experimental';
const distance = (a,b) => Math.abs((((a-b)+540)%360)-180);

export class MundaneEarthquakeAdapter {
  constructor(ephemeris) { this.systemId='mundane-western'; this.systemName='マンデン'; this.version=MUNDANE_EARTHQUAKE_VERSION; this.ephemeris=ephemeris; }
  evaluate(input) {
    const context=createWorldContext(input);
    if(context.themeId!=='earthquake') throw new RangeError('this adapter supports the earthquake theme only');
    if(!this.ephemeris?.planetLongitudes) throw new TypeError('planetLongitudes ephemeris is required');
    const location={latitude:context.latitude??0,longitude:context.longitude??0};
    const positions=this.ephemeris.planetLongitudes(new Date(context.datetimeUtc));
    const angles=calculateAngles(new Date(context.datetimeUtc),location);
    const hardOuter=[['Mars','Saturn'],['Mars','Uranus'],['Saturn','Uranus'],['Saturn','Pluto'],['Uranus','Pluto']]
      .filter(pair=>Number.isFinite(positions[pair[0]])&&Number.isFinite(positions[pair[1]]))
      .map(pair=>({pair,separation:distance(positions[pair[0]],positions[pair[1]])}))
      .filter(item=>[0,90,180].some(angle=>Math.abs(item.separation-angle)<=6));
    const angularBodies=['Mars','Saturn','Uranus','Pluto'].filter(body=>Number.isFinite(positions[body])&&[angles.ascendant,angles.midheaven,(angles.ascendant+180)%360,(angles.midheaven+180)%360].some(angle=>distance(positions[body],angle)<=6));
    const moonPhase=Number.isFinite(positions.Moon)&&Number.isFinite(positions.Sun)?Math.min(distance(positions.Moon,positions.Sun),distance(positions.Moon,positions.Sun+180)):180;
    const contributors=[
      {id:'outer-hard-aspects',label:'外惑星・火星の主要角',score:hardOuter.length?80:25,active:hardOuter.length>0,reason:hardOuter.length?`${hardOuter.length}組が主要ハード角の許容範囲`:'主要ハード角の許容範囲外'},
      {id:'regional-angles',label:'地域の四大角',score:angularBodies.length?80:20,active:angularBodies.length>0,reason:angularBodies.length?`${angularBodies.join('・')}が地域角付近`:'対象天体は地域角から離れています'},
      {id:'lunar-phase',label:'新月・満月付近',score:moonPhase<=8?75:20,active:moonPhase<=8,reason:moonPhase<=8?'新月または満月の8度以内':'新月・満月の8度外'}
    ];
    const matched=contributors.filter(item=>item.active).length;
    // This ordinal display score is derived from consensus count, not a sum of unlike systems.
    const score=[15,45,72,88][matched];
    return validateWorldResult({systemId:this.systemId,systemName:this.systemName,version:this.version,themeId:context.themeId,cellId:context.spatialCellId,score,consensus:{matched,total:contributors.length},contributors,confidence:'experimental',metadata:{mode:context.mode,angles,ephemerisId:this.ephemeris.id||'unspecified',reviewStatus:'research-only'}});
  }
}
