import { createSpatialGrid, MundaneEarthquakeAdapter } from './index.js';

const MAPLIBRE_JS='https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js';
const MAPLIBRE_CSS='https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css';
const MAP_STYLE='https://demotiles.maplibre.org/globe.json';
const EVENTS=Object.freeze([
  {id:'tohoku-2011',label:'2011年 東北地方太平洋沖地震',datetime:'2011-03-11T05:46:24.000Z',latitude:38.297,longitude:142.373,magnitude:9.1,depthKm:29},
  {id:'kumamoto-2016',label:'2016年 熊本地震',datetime:'2016-04-15T16:25:06.000Z',latitude:32.755,longitude:130.762,magnitude:7.0,depthKm:10},
  {id:'noto-2024',label:'2024年 能登半島地震',datetime:'2024-01-01T07:10:09.000Z',latitude:37.498,longitude:137.242,magnitude:7.5,depthKm:10}
]);

function loadMapLibre(){
  if(window.maplibregl)return Promise.resolve(window.maplibregl);
  if(!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=MAPLIBRE_CSS;document.head.append(link)}
  return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=MAPLIBRE_JS;script.onload=()=>resolve(window.maplibregl);script.onerror=()=>reject(new Error('map library unavailable'));document.head.append(script)});
}
const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const level=score=>score>=80?'高反応':score>=70?'やや高い':score>=40?'中程度':'低い';
const color=score=>score>=80?'#b42318':score>=70?'#e46f19':score>=40?'#d9a514':'#1e7f68';
const localInputValue=date=>{const d=new Date(date),offset=d.getTimezoneOffset()*60000;return new Date(d-offset).toISOString().slice(0,16)};

function shell(){return `<section class="world-map-shell" id="worldMapShell" aria-labelledby="worldMapTitle"><header class="world-map-head"><div><span class="world-map-kicker">こよみ世情</span><h2 id="worldMapTitle">世界の世情地図</h2></div><div class="world-mode" role="group" aria-label="表示モード"><button class="active" data-world-mode="forecast">未来を見る</button><button data-world-mode="validation">過去検証</button></div></header><div class="world-controls"><label>日時<input id="worldDateTime" type="datetime-local" value="${localInputValue(new Date())}"></label><label>テーマ<select id="worldTheme"><option value="earthquake">地震</option><option disabled>火山（準備中）</option><option disabled>気象（準備中）</option><option disabled>戦争・紛争（準備中）</option></select></label><label id="worldEventField" hidden>過去事象<select id="worldEvent">${EVENTS.map(item=>`<option value="${item.id}">${item.label}</option>`).join('')}</select></label></div><div class="world-map-stage"><div id="worldMap" role="application" aria-label="世界の世情傾向地図"></div><div id="worldMapStatus" class="world-map-status">詳細地図を読み込んでいます…</div></div><p class="world-disclaimer">占術・暦等を用いた実験的指標であり、科学的な地震予知ではありません。防災判断では公的機関の情報を優先してください。</p><div class="world-sheet" id="worldSheet" aria-live="polite"><div class="world-sheet-grip"></div><div id="worldSheetBody"><b>地図上の地域をタップ</b><p>同じセル・日時・テーマで、各占術の反応を比較できます。</p></div></div></section>`}

function viewportCells(map,grid,resolution){
  const bounds=map.getBounds(),cells=new Set(),steps=resolution<=1?8:12;
  for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++){
    const lat=bounds.getSouth()+(bounds.getNorth()-bounds.getSouth())*y/steps;
    const lon=bounds.getWest()+(bounds.getEast()-bounds.getWest())*x/steps;
    cells.add(grid.cellForLatLng(lat,lon,resolution));
  }
  return [...cells];
}

export async function initWorldMap({page,ephemeris}){
  if(!page||page.querySelector('#worldMapShell'))return;
  page.insertAdjacentHTML('afterbegin',shell());
  const grid=createSpatialGrid(),adapter=new MundaneEarthquakeAdapter(ephemeris),status=page.querySelector('#worldMapStatus'),sheet=page.querySelector('#worldSheetBody');
  let mode='forecast',map;
  const contextAt=(lat,lon)=>{const date=new Date(page.querySelector('#worldDateTime').value);return{datetimeUtc:date.toISOString(),latitude:lat,longitude:lon,spatialCellId:grid.cellForLatLng(lat,lon,grid.resolutionForZoom(map?.getZoom()??2)),themeId:'earthquake',mode}};
  const evaluate=(lat,lon)=>{const result=adapter.evaluate(contextAt(lat,lon));sheet.innerHTML=`<div class="world-sheet-title"><div><small>地震テーマ・マンデン</small><h3>${lat.toFixed(2)}°, ${lon.toFixed(2)}°</h3></div><strong style="color:${color(result.score)}">${level(result.score)}</strong></div><p><b>${result.consensus.matched} / ${result.consensus.total} 系統一致</b></p><div class="world-contributors">${result.contributors.map(item=>`<div><span>${esc(item.label)}</span><b>${item.active?'高反応':'低反応'}</b><small>${esc(item.reason)}</small></div>`).join('')}</div><details><summary>詳しい根拠</summary><p>ルール ${esc(result.version)}／確度: 実験段階</p><p>異なる占術のスコアは加算していません。</p></details>`;return result};
  page.querySelectorAll('[data-world-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.worldMode;page.querySelectorAll('[data-world-mode]').forEach(item=>item.classList.toggle('active',item===button));page.querySelector('#worldEventField').hidden=mode!=='validation';if(mode==='validation'){const event=EVENTS.find(item=>item.id===page.querySelector('#worldEvent').value);page.querySelector('#worldDateTime').value=localInputValue(event.datetime);map?.flyTo({center:[event.longitude,event.latitude],zoom:5});evaluate(event.latitude,event.longitude)}else page.querySelector('#worldDateTime').value=localInputValue(new Date())});
  page.querySelector('#worldEvent').onchange=event=>{const item=EVENTS.find(entry=>entry.id===event.target.value);page.querySelector('#worldDateTime').value=localInputValue(item.datetime);map?.flyTo({center:[item.longitude,item.latitude],zoom:5});evaluate(item.latitude,item.longitude)};
  try{
    const maplibre=await loadMapLibre();map=new maplibre.Map({container:'worldMap',style:MAP_STYLE,center:[135,30],zoom:1.5,attributionControl:true});map.addControl(new maplibre.NavigationControl({showCompass:false}),'top-right');
    const update=()=>{if(!map.isStyleLoaded())return;const resolution=grid.resolutionForZoom(map.getZoom()),ids=viewportCells(map,grid,resolution),data=grid.geoJson(ids,id=>{const center=grid.center(id),result=adapter.evaluate(contextAt(center.latitude,center.longitude));return{score:result.score,matched:result.consensus.matched}});const source=map.getSource('world-grid');if(source)source.setData(data);else{map.addSource('world-grid',{type:'geojson',data});map.addLayer({id:'world-grid-fill',type:'fill',source:'world-grid',paint:{'fill-color':['step',['get','score'],'#1e7f68',40,'#d9a514',70,'#e46f19',80,'#b42318'],'fill-opacity':.3}});map.addLayer({id:'world-grid-line',type:'line',source:'world-grid',paint:{'line-color':'#fff','line-opacity':.48,'line-width':1}})}status.textContent=`表示セル ${ids.length}・計算解像度 ${resolution}（画面内のみ）`};
    map.on('load',update);map.on('moveend',update);map.on('click',event=>evaluate(event.lngLat.lat,event.lngLat.lng));page.querySelector('#worldDateTime').onchange=update;
  }catch(error){status.textContent='詳細地図はオンライン時に表示されます。基本計算と過去事象はオフラインでも利用できます。';sheet.innerHTML='<b>地図を読み込めませんでした</b><p>通信状態を確認してください。既存の世情鑑定と研究結果はこの下で利用できます。</p>'}
}
