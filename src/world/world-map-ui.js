import { createSpatialGrid, MundaneEarthquakeAdapter, WorldEvaluationCache, relateEventToCell, validateWorldEvent } from './index.js';
import { createOfflineWorldStyle } from './offline-map-style.js';

const MAPLIBRE_JS='./vendor/maplibre-gl/5.24.0/maplibre-gl.js';
const MAPLIBRE_CSS='./vendor/maplibre-gl/5.24.0/maplibre-gl.css';
const MAX_VISIBLE_CELLS=500;

function loadMapLibre(){
  if(window.maplibregl)return Promise.resolve(window.maplibregl);
  if(!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=MAPLIBRE_CSS;document.head.append(link)}
  return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=MAPLIBRE_JS;script.onload=()=>resolve(window.maplibregl);script.onerror=()=>reject(new Error('map library unavailable'));document.head.append(script)});
}

async function loadEvents(){
  const response=await fetch('./data/world/validation-events.json');if(!response.ok)throw new Error('validation events unavailable');
  const data=await response.json();return data.events.map(validateWorldEvent);
}

const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const level=score=>score>=80?'高反応':score>=70?'やや高い':score>=40?'中程度':'低い';
const color=score=>score>=80?'#b42318':score>=70?'#e46f19':score>=40?'#d9a514':'#1e7f68';
const localInputValue=date=>{const d=new Date(date),offset=d.getTimezoneOffset()*60000;return new Date(d-offset).toISOString().slice(0,16)};

function shell(events){return `<section class="world-map-shell" id="worldMapShell" aria-labelledby="worldMapTitle"><header class="world-map-head"><div><span class="world-map-kicker">こよみ世情</span><h2 id="worldMapTitle">世界の世情地図</h2></div><div class="world-mode" role="group" aria-label="表示モード"><button class="active" data-world-mode="forecast">未来を見る</button><button data-world-mode="validation">過去検証</button></div></header><div class="world-controls"><label>日時<input id="worldDateTime" type="datetime-local" value="${localInputValue(new Date())}"></label><label>テーマ<select id="worldTheme"><option value="earthquake">地震</option><option disabled>火山（準備中）</option><option disabled>気象（準備中）</option><option disabled>戦争・紛争（準備中）</option></select></label><label id="worldEventField" hidden>過去事象<select id="worldEvent">${events.map(item=>`<option value="${item.id}">${esc(item.label)}</option>`).join('')}</select></label></div><div class="world-map-stage"><div id="worldMap" role="application" aria-label="世界の世情傾向地図"></div><div id="worldMapStatus" class="world-map-status">詳細地図を読み込んでいます…</div></div><p class="world-disclaimer">占術・暦等を用いた実験的指標であり、科学的な地震予知ではありません。防災判断では公的機関の情報を優先してください。</p><div class="world-sheet" id="worldSheet" aria-live="polite"><div class="world-sheet-grip"></div><div id="worldSheetBody"><b>地図上の地域をタップ</b><p>同じH3セル・日時・テーマで、各占術の反応を比較できます。</p></div></div></section>`}

function visibleCells(map,grid){
  const bounds=map.getBounds(),box={south:bounds.getSouth(),north:bounds.getNorth(),west:bounds.getWest(),east:bounds.getEast()};let resolution=grid.resolutionForZoom(map.getZoom()),ids=grid.viewportCells(box,resolution,MAX_VISIBLE_CELLS);
  while(ids.length>=MAX_VISIBLE_CELLS&&resolution>0){resolution-=1;ids=grid.viewportCells(box,resolution,MAX_VISIBLE_CELLS)}
  return {ids,resolution};
}

export async function initWorldMap({page,ephemeris}){
  if(!page||page.querySelector('#worldMapShell'))return;
  let events=[];try{events=await loadEvents()}catch(error){console.error('[WORLD MAP] validation data failed',error)}
  page.insertAdjacentHTML('afterbegin',shell(events));
  const grid=createSpatialGrid(),adapter=new MundaneEarthquakeAdapter(ephemeris),cache=new WorldEvaluationCache(),status=page.querySelector('#worldMapStatus'),sheet=page.querySelector('#worldSheetBody');
  let mode='forecast',map,renderToken=0,updateTimer;
  const selectedEvent=()=>events.find(item=>item.id===page.querySelector('#worldEvent')?.value);
  const contextForCell=(cellId)=>{const date=new Date(page.querySelector('#worldDateTime').value);return{datetimeUtc:date.toISOString(),...grid.center(cellId),spatialCellId:cellId,gridSystemId:grid.systemId,gridVersion:grid.version,resolution:grid.resolution(cellId),themeId:'earthquake',mode}};
  const resultForCell=cellId=>cache.evaluate(contextForCell(cellId),adapter);
  const evaluateCell=cellId=>{
    const center=grid.center(cellId),result=resultForCell(cellId),event=mode==='validation'?selectedEvent():null,relation=event?relateEventToCell(event,cellId,grid):null;
    sheet.innerHTML=`<div class="world-sheet-title"><div><small>地震テーマ・マンデン</small><h3>${center.latitude.toFixed(2)}°, ${center.longitude.toFixed(2)}°</h3></div><strong style="color:${color(result.score)}">${level(result.score)}</strong></div><p><b>${result.consensus.matched} / ${result.consensus.total} 系統一致</b></p>${event?`<div class="world-event-detail"><b>${esc(event.label)} M${event.magnitude.toFixed(1)}</b><span>深さ ${event.depthKm}km</span><span>セル中心まで ${relation.centerDistanceKm.toFixed(1)}km</span><span>${relation.sameCell?'震源と同じセル':relation.ring===null?'5近傍より外側':`${relation.ring}近傍セル`}</span><a href="${esc(event.source.url)}" target="_blank" rel="noopener">${esc(event.source.name)}で確認</a></div>`:''}<div class="world-contributors">${result.contributors.map(item=>`<div><span>${esc(item.label)}</span><b>${item.active?'高反応':'低反応'}</b><small>${esc(item.reason)}</small></div>`).join('')}</div><details><summary>詳しい根拠</summary><p>ルール ${esc(result.version)}／H3 ${esc(grid.version)}／解像度 ${result.resolution}／確度: 実験段階</p><p>異なる占術のスコアは加算していません。セル関係は的中判定ではありません。</p></details>`;
    return result;
  };
  const updateEventMarker=()=>{if(!map?.isStyleLoaded())return;const event=mode==='validation'?selectedEvent():null,data={type:'FeatureCollection',features:event?[{type:'Feature',properties:{label:event.label,magnitude:event.magnitude},geometry:{type:'Point',coordinates:[event.longitude,event.latitude]}}]:[]};const source=map.getSource('validation-event');if(source)source.setData(data);else{map.addSource('validation-event',{type:'geojson',data});map.addLayer({id:'validation-event-dot',type:'circle',source:'validation-event',paint:{'circle-radius':8,'circle-color':'#fff','circle-stroke-width':4,'circle-stroke-color':'#b42318'}})}};
  const update=()=>{
    if(!map?.isStyleLoaded())return;const token=++renderToken,{ids,resolution}=visibleCells(map,grid),started=performance.now(),features=[];
    for(const id of ids){if(token!==renderToken)return;const result=resultForCell(id);features.push({id,result})}
    const featureMap=new Map(features.map(item=>[item.id,item.result])),data=grid.geoJson(features.map(item=>item.id),id=>{const result=featureMap.get(id);return{score:result.score,matched:result.consensus.matched}}),source=map.getSource('world-grid');
    if(source)source.setData(data);else{map.addSource('world-grid',{type:'geojson',data,maxzoom:10});map.addLayer({id:'world-grid-fill',type:'fill',source:'world-grid',paint:{'fill-color':['step',['get','score'],'#1e7f68',40,'#d9a514',70,'#e46f19',80,'#b42318'],'fill-opacity':.3}});map.addLayer({id:'world-grid-line',type:'line',source:'world-grid',paint:{'line-color':'#fff','line-opacity':.48,'line-width':1}})}
    updateEventMarker();status.textContent=`H3 解像度 ${resolution}・表示セル ${ids.length}・${Math.round(performance.now()-started)}ms`;
  };
  const scheduleUpdate=()=>{clearTimeout(updateTimer);updateTimer=setTimeout(update,180)};
  page.querySelectorAll('[data-world-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.worldMode;cache.clear();page.querySelectorAll('[data-world-mode]').forEach(item=>item.classList.toggle('active',item===button));page.querySelector('#worldEventField').hidden=mode!=='validation';if(mode==='validation'&&events.length){const event=selectedEvent();page.querySelector('#worldDateTime').value=localInputValue(event.datetimeUtc);map?.flyTo({center:[event.longitude,event.latitude],zoom:5});evaluateCell(grid.cellForLatLng(event.latitude,event.longitude,grid.resolutionForZoom(5)))}else page.querySelector('#worldDateTime').value=localInputValue(new Date());scheduleUpdate()});
  const eventSelect=page.querySelector('#worldEvent');if(eventSelect)eventSelect.onchange=()=>{const event=selectedEvent();page.querySelector('#worldDateTime').value=localInputValue(event.datetimeUtc);map?.flyTo({center:[event.longitude,event.latitude],zoom:5});evaluateCell(grid.cellForLatLng(event.latitude,event.longitude,grid.resolutionForZoom(5)));scheduleUpdate()};
  try{
    const maplibre=await loadMapLibre();map=new maplibre.Map({container:'worldMap',style:createOfflineWorldStyle(),center:[135,30],zoom:1.5,attributionControl:true,maxZoom:10});map.addControl(new maplibre.NavigationControl({showCompass:false}),'top-right');
    map.on('load',update);map.on('moveend',scheduleUpdate);map.on('click',event=>evaluateCell(grid.cellForLatLng(event.lngLat.lat,event.lngLat.lng,grid.resolutionForZoom(map.getZoom()))));page.querySelector('#worldDateTime').onchange=()=>{cache.clear();scheduleUpdate()};
  }catch(error){status.textContent='基本世界地図を読み込めませんでした。H3計算と保存済み過去事象は利用できます。';sheet.innerHTML='<b>地図を読み込めませんでした</b><p>アプリをオンラインで一度開いて基本地図を保存してください。既存の世情鑑定と研究結果はこの下で利用できます。</p>'}
}
