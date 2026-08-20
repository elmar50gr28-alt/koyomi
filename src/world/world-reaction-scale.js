export const WORLD_REACTION_LEVELS = Object.freeze([
  Object.freeze({min:80,max:100,id:'very-high',label:'非常に強い反応',range:'80–100',color:'#cc3366',opacity:0.52}),
  Object.freeze({min:70,max:79,id:'high',label:'強い反応',range:'70–79',color:'#e67e22',opacity:0.40}),
  Object.freeze({min:55,max:69,id:'medium',label:'中反応',range:'55–69',color:'#f2cf5b',opacity:0.30}),
  Object.freeze({min:40,max:54,id:'low',label:'やや反応',range:'40–54',color:'#56b4e9',opacity:0.20}),
  Object.freeze({min:0,max:39,id:'quiet',label:'静穏',range:'0–39',color:'#2a9d8f',opacity:0.12})
]);

export function worldReactionLevel(score){
  const value=Math.max(0,Math.min(100,Number(score)||0));
  return WORLD_REACTION_LEVELS.find(level=>value>=level.min);
}

export function worldReactionColorExpression(){
  return ['step',['get','score'],'#2a9d8f',40,'#56b4e9',55,'#f2cf5b',70,'#e67e22',80,'#cc3366'];
}

export function worldReactionOpacityExpression(){
  return ['step',['get','score'],0.12,40,0.20,55,0.30,70,0.40,80,0.52];
}
