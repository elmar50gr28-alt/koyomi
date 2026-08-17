(function(root){
'use strict';
const mod=x=>root.WesternCoreV1.mod(x);
function meanNode(date){const T=(new Date(date).getTime()/86400000+2440587.5-2451545)/36525;return mod(125.04452-1934.136261*T)}
function build(core,input={}){const known=core?.calculationMeta?.birthTimeKnown!==false,p=core?.natal?.placements||{},angles=core?.natal?.angles||{},node=Number.isFinite(input.ドラゴンヘッド)?input.ドラゴンヘッド:(input.birthMoment?meanNode(input.birthMoment):null),items=[];if(node!==null){items.push({name:'ドラゴンヘッド',lon:node,sign:root.WesternCoreV1.signOf(node),calculation:'mean-node'},{name:'ドラゴンテイル',lon:mod(node+180),sign:root.WesternCoreV1.signOf(node+180),calculation:'mean-node'})}['キロン','セレス','パラス','ジュノー','ベスタ'].forEach(name=>{if(Number.isFinite(input[name]))items.push({name,lon:mod(input[name]),sign:root.WesternCoreV1.signOf(input[name]),calculation:'ephemeris'})});if(known&&Number.isFinite(angles.asc)&&p.太陽&&p.月){const day=mod(p.太陽.lon-p.月.lon)<180,fortune=day?mod(angles.asc+p.月.lon-p.太陽.lon):mod(angles.asc+p.太陽.lon-p.月.lon);items.push({name:'Part of Fortune',lon:fortune,sign:root.WesternCoreV1.signOf(fortune),calculation:day?'day-formula':'night-formula'})}return{items,suppressed:known?[]:['Part of Fortune'],note:known?'未計算の小惑星は推測値を表示しない':'出生時刻不明のため時刻依存感受点は表示しない'}}
root.WesternPointsV1={build,meanNode};
})(globalThis);
