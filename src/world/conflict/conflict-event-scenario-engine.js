import { ANGULAR_EVENTS, ASPECT_EVENTS, CONFLICT_EVENT_LEXICON_VERSION } from './conflict-event-lexicon.js';

export const CONFLICT_EVENT_SCENARIO_VERSION='conflict-event-scenario-v1.0';
const stableIndex=(text,length)=>{let hash=0;for(const char of String(text))hash=(hash*31+char.codePointAt(0))>>>0;return length?hash%length:0};
const confidence=score=>score>=22?'強い':score>=15?'中程度':'補助的';
const eventFor=contributor=>contributor.id.startsWith('angular-')?ANGULAR_EVENTS[contributor.body]:ASPECT_EVENTS[contributor.id];

export function buildConflictEventCandidates(contributors=[]){
  const byEvent=new Map();
  for(const contributor of contributors){const event=eventFor(contributor);if(!event)continue;const score=Math.max(1,Math.round(contributor.weight-contributor.orb*1.5)),existing=byEvent.get(event.eventId),evidence=Object.freeze({contributorId:contributor.id,label:contributor.label,score});if(existing){existing.score+=score;existing.evidence.push(evidence)}else byEvent.set(event.eventId,{event,score,evidence:[evidence]})}
  return Object.freeze([...byEvent.values()].sort((a,b)=>b.score-a.score||a.event.eventId.localeCompare(b.event.eventId)).slice(0,3).map(({event,score,evidence})=>{const manifestation=event.manifestations[stableIndex(evidence.map(item=>item.contributorId).join('|'),event.manifestations.length)];return Object.freeze({eventId:event.eventId,title:event.title,tags:event.tags,manifestation,focus:event.focus,direction:event.direction,fitScore:Math.min(100,score*3),confidence:confidence(score),evidence:Object.freeze(evidence),lexiconVersion:CONFLICT_EVENT_LEXICON_VERSION})}))
}

export function composeConflictScenarioReading({windowStartLabel,windowEndLabel,placeNameJa,label,candidates=[]}={}){
  const primary=candidates[0],secondary=candidates[1];if(!primary)return`${windowStartLabel}から${windowEndLabel}、${placeNameJa}では${label}が表面化しやすいでしょう。外交面の牽制や警戒姿勢の変化に注目する巡りです。大きな動きより、声明と交渉の応酬として現れやすいでしょう。`;
  const second=secondary?`次に考えられるのは${secondary.title}で、${secondary.manifestation}として現れる余地があります。`:'';
  return`${windowStartLabel}から${windowEndLabel}、${placeNameJa}では${label}が表面化しやすいでしょう。最も現れやすいのは${primary.title}で、${primary.manifestation}として動きが見えやすくなります。焦点は${primary.focus.join('と')}です。${second}${primary.direction}流れです。`;
}
