import { createWorldContext, validateWorldResult } from './world-core.js';
import { calculateAngles } from '../mundane/western/seasonal-ingress-core.js';

export const MUNDANE_EARTHQUAKE_VERSION = 'mundane-earthquake-v0.2-experimental';
const REQUIRED_BODIES=Object.freeze(['Sun','Moon','Mars','Saturn','Uranus','Pluto']);
const BODY_ALIASES=Object.freeze({Sun:['Sun','太陽'],Moon:['Moon','月'],Mars:['Mars','火星'],Saturn:['Saturn','土星'],Uranus:['Uranus','天王星'],Pluto:['Pluto','冥王星']});
const BODY_LABELS=Object.freeze({Sun:'太陽',Moon:'月',Mars:'火星',Saturn:'土星',Uranus:'天王星',Pluto:'冥王星'});
const ANGLE_LABELS=Object.freeze({ascendant:'ASC',midheaven:'MC',descendant:'DSC',imumCoeli:'IC'});
const distance=(a,b)=>Math.abs((((a-b)+540)%360)-180);
const signedDistance=(a,b)=>(((a-b)+540)%360)-180;

export function normalizeMundanePositions(input={}) {
  return Object.fromEntries(Object.entries(BODY_ALIASES).map(([canonical,aliases])=>{
    const value=aliases.map(name=>input?.[name]).find(Number.isFinite);
    return[canonical,Number.isFinite(value)?((Number(value)%360)+360)%360:undefined];
  }));
}

function applyingState(before,current,after,target) {
  if(![before,current,after].every(Number.isFinite))return'unknown';
  const prior=Math.abs(signedDistance(before,target)),next=Math.abs(signedDistance(after,target));
  return next<prior?'applying':next>prior?'separating':'stationary';
}

export class MundaneEarthquakeAdapter {
  constructor(ephemeris){this.systemId='mundane-western';this.systemName='マンデン';this.version=MUNDANE_EARTHQUAKE_VERSION;this.ephemeris=ephemeris;this.positionCache=new Map()}
  positionsAt(date){const key=date.toISOString();if(this.positionCache.has(key))return this.positionCache.get(key);const positions=normalizeMundanePositions(this.ephemeris.planetLongitudes(date));this.positionCache.set(key,positions);if(this.positionCache.size>12)this.positionCache.delete(this.positionCache.keys().next().value);return positions}
  evaluate(input) {
    const context=createWorldContext(input);
    if(context.themeId!=='earthquake')throw new RangeError('this adapter supports the earthquake theme only');
    if(!this.ephemeris?.planetLongitudes)throw new TypeError('planetLongitudes ephemeris is required');
    const date=new Date(context.datetimeUtc),location={latitude:context.latitude??0,longitude:context.longitude??0};
    const positions=this.positionsAt(date),before=this.positionsAt(new Date(date.getTime()-12*3600000)),after=this.positionsAt(new Date(date.getTime()+12*3600000));
    const missingBodies=REQUIRED_BODIES.filter(body=>!Number.isFinite(positions[body]));
    const angles=calculateAngles(date,location),regionalAngles={ascendant:angles.ascendant,midheaven:angles.midheaven,descendant:(angles.ascendant+180)%360,imumCoeli:(angles.midheaven+180)%360};
    const pairs=[['Mars','Saturn'],['Mars','Uranus'],['Saturn','Uranus'],['Saturn','Pluto'],['Uranus','Pluto']],availablePairs=pairs.filter(pair=>pair.every(body=>Number.isFinite(positions[body])));
    const hardOuter=availablePairs.map(pair=>{const separation=distance(positions[pair[0]],positions[pair[1]]),aspect=[0,90,180].map(target=>({target,orb:Math.abs(separation-target)})).sort((a,b)=>a.orb-b.orb)[0],beforeSeparation=distance(before[pair[0]],before[pair[1]]),afterSeparation=distance(after[pair[0]],after[pair[1]]);return{pair,separation,target:aspect.target,orb:aspect.orb,motion:applyingState(beforeSeparation,separation,afterSeparation,aspect.target)}}).filter(item=>item.orb<=6);
    const angularCandidates=['Mars','Saturn','Uranus','Pluto'].filter(body=>Number.isFinite(positions[body])).map(body=>{const nearest=Object.entries(regionalAngles).map(([angleName,longitude])=>({angleName,longitude,orb:distance(positions[body],longitude)})).sort((a,b)=>a.orb-b.orb)[0];return{body,...nearest,motion:applyingState(before[body],positions[body],after[body],nearest.longitude)}}),angularBodies=angularCandidates.filter(item=>item.orb<=6);
    const lunarAvailable=Number.isFinite(positions.Moon)&&Number.isFinite(positions.Sun),lunarSeparation=lunarAvailable?distance(positions.Moon,positions.Sun):null,lunarTarget=lunarAvailable&&lunarSeparation>90?180:0,moonPhaseOrb=lunarAvailable?Math.abs(lunarSeparation-lunarTarget):null,phaseMotion=lunarAvailable?applyingState(distance(before.Moon,before.Sun),lunarSeparation,distance(after.Moon,after.Sun),lunarTarget):'unknown';
    const outerAvailable=availablePairs.length===pairs.length,angleQuality=Math.abs(location.latitude)>=89?'unavailable':Math.abs(location.latitude)>=66?'high-latitude':'standard',regionalAvailable=angularCandidates.length===4&&angleQuality!=='unavailable';
    const contributors=[
      {id:'outer-hard-aspects',label:'外惑星・火星の主要角',status:outerAvailable?(hardOuter.length?'active':'inactive'):'unavailable',score:hardOuter.length?80:25,active:outerAvailable&&hardOuter.length>0,reason:!outerAvailable?'必要な天体位置が不足':hardOuter.length?`${hardOuter.length}組が主要ハード角の許容範囲`:'主要ハード角の許容範囲外',details:hardOuter.map(item=>({bodies:item.pair.map(body=>BODY_LABELS[body]),aspectAngle:item.target,separation:item.separation,orb:item.orb,motion:item.motion}))},
      {id:'regional-angles',label:'地域の四大角',status:regionalAvailable?(angularBodies.length?'active':'inactive'):'unavailable',score:angularBodies.length?80:20,active:regionalAvailable&&angularBodies.length>0,reason:angleQuality==='unavailable'?'極域のため地域角を安定計算できません':!regionalAvailable?'必要な天体位置が不足':angularBodies.length?`${angularBodies.map(item=>BODY_LABELS[item.body]).join('・')}が地域角付近`:'対象天体は地域角から離れています',details:regionalAvailable?angularBodies.map(item=>({body:BODY_LABELS[item.body],angle:ANGLE_LABELS[item.angleName],orb:item.orb,motion:item.motion})):[]},
      {id:'lunar-phase',label:'新月・満月付近',status:lunarAvailable?(moonPhaseOrb<=8?'active':'inactive'):'unavailable',score:lunarAvailable&&moonPhaseOrb<=8?75:20,active:lunarAvailable&&moonPhaseOrb<=8,reason:!lunarAvailable?'太陽または月の位置が不足':moonPhaseOrb<=8?'新月または満月の8度以内':'新月・満月の8度外',details:lunarAvailable?[{phase:lunarTarget===0?'新月':'満月',separation:lunarSeparation,orb:moonPhaseOrb,motion:phaseMotion}]:[]}
    ];
    const matched=contributors.filter(item=>item.active).length,available=contributors.filter(item=>item.status!=='unavailable').length,score=[15,45,72,88][matched];
    return validateWorldResult({systemId:this.systemId,systemName:this.systemName,version:this.version,themeId:context.themeId,cellId:context.spatialCellId,gridSystemId:context.gridSystemId,gridVersion:context.gridVersion,resolution:context.resolution,score,consensus:{matched,total:contributors.length,available},contributors,confidence:'experimental',metadata:{mode:context.mode,angles,angleQuality,ephemerisId:this.ephemeris.id||'unspecified',ephemerisPrecision:this.ephemeris.precision||'unspecified',calculationQuality:available===3?'complete':available?'partial':'unavailable',missingBodies,warnings:angleQuality==='high-latitude'?['high-latitude-angles']:angleQuality==='unavailable'?['polar-angles-unavailable']:[],reviewStatus:'research-only'}});
  }
}
