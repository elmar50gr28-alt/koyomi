import { VOLCANO_LAYER_DEFAULTS } from './config.js';
import { evaluateVolcanoReleaseGate } from './release-gate.js';
import { volcanoPublicView } from './display-policy.js';
import { distanceKm } from './seismic-coupling.js';

const SOURCE_ID='world-volcanoes',LAYER_IDS=['world-volcano-clusters','world-volcano-cluster-count','world-volcano-points'],EARTHQUAKE_LAYERS=['world-grid-fill','world-grid-quiescence','world-grid-geomagnetic','world-grid-line','forecast-outcome-clusters','forecast-outcome-cluster-count','forecast-outcome-dots'];
const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const emptySignal=Object.freeze({status:'data-unavailable',classification:null,reason:'観測データはまだ接続されていません'});

export async function loadVolcanoCatalog(){const response=await fetch('./data/world/volcano-catalog-v1.json');if(!response.ok)throw new Error('volcano catalog unavailable');const data=await response.json();if(data.schemaId!=='koyomi-volcano-catalog-v1'||data.officialStatusIncluded!==false||!Array.isArray(data.volcanoes))throw new Error('invalid volcano catalog');return data;}

export function volcanoGeoJson(catalog){return{type:'FeatureCollection',features:catalog.volcanoes.map(volcano=>({type:'Feature',id:volcano.id,properties:{id:volcano.id,name:volcano.name,region:volcano.region,officialStatus:'data-unavailable'},geometry:{type:'Point',coordinates:[volcano.longitude,volcano.latitude]}}))}}

export function createVolcanoMapController({page,map,sheet,catalog}){
  let active=false,state={...VOLCANO_LAYER_DEFAULTS};
  const gate=evaluateVolcanoReleaseGate({futureLeakageBlocked:true});
  const control=page.querySelector('#volcanoLayerControl');
  const setVisibility=visible=>LAYER_IDS.forEach(id=>map.getLayer(id)&&map.setLayoutProperty(id,'visibility',visible?'visible':'none'));
  const renderVolcano=volcano=>{const view=volcanoPublicView({volcano,official:null,thermal:emptySignal,seismic:emptySignal,gate});sheet.innerHTML=`<section class="world-volcano-card"><header><div><small>公式情報・観測研究を分離表示</small><h3>${esc(view.name)}</h3></div><b>火山</b></header><p class="world-card-location">${volcano.latitude.toFixed(3)}°, ${volcano.longitude.toFixed(3)}°／${esc(volcano.region)}</p><div class="world-volcano-official"><h4>最優先：公式状態</h4><strong>公式情報を取得できません</strong><p>未取得は「安全」を意味しません。気象庁などの最新情報を直接確認してください。</p><a href="https://www.data.jma.go.jp/vois/data/filing/volcano.html" target="_blank" rel="noopener">気象庁の火山情報を確認</a></div><details ${state.observations?'open':''}><summary>観測変化</summary><p>熱移送：データ未接続</p><p>周辺地震：データ未接続</p><p>熱変化と周辺地震は別々に評価し、一致しても噴火予測とは扱いません。</p></details><div class="world-volcano-research"><b>${esc(view.research.label)}</b><p>研究レイヤーは初期OFFです。将来情報の遮断、前向き検証、誤警報率・見逃し率の公開、熱・地震それぞれの除外試験を通るまで、噴火確率や時期を表示しません。</p></div><details ${state.mundane?'open':''}><summary>マンデン占術（独立表示）</summary><p>科学・観測モデルには一切加算しません。</p></details></section>`};
  const nearest=lngLat=>catalog.volcanoes.map(volcano=>({volcano,distance:distanceKm({latitude:lngLat.lat,longitude:lngLat.lng},volcano)})).sort((a,b)=>a.distance-b.distance)[0];
  if(!map.getSource(SOURCE_ID)){map.addSource(SOURCE_ID,{type:'geojson',data:volcanoGeoJson(catalog),cluster:true,clusterRadius:38,clusterMaxZoom:5});map.addLayer({id:'world-volcano-clusters',type:'circle',source:SOURCE_ID,filter:['has','point_count'],layout:{visibility:'none'},paint:{'circle-radius':['step',['get','point_count'],14,8,20],'circle-color':'#8f2f18','circle-stroke-color':'#ffe0a3','circle-stroke-width':2}});map.addLayer({id:'world-volcano-cluster-count',type:'symbol',source:SOURCE_ID,filter:['has','point_count'],layout:{visibility:'none','text-field':['get','point_count_abbreviated'],'text-size':11},paint:{'text-color':'#fff'}});map.addLayer({id:'world-volcano-points',type:'circle',source:SOURCE_ID,filter:['!', ['has','point_count']],layout:{visibility:'none'},paint:{'circle-radius':['interpolate',['linear'],['zoom'],0,4,6,9],'circle-color':'#df5b2d','circle-stroke-color':'#fff1c7','circle-stroke-width':2}})}
  map.on('click','world-volcano-points',event=>{if(active&&event.features?.[0]){const volcano=catalog.volcanoes.find(item=>item.id===event.features[0].properties.id);if(volcano)renderVolcano(volcano)}});
  map.on('click',event=>{if(!active||event.defaultPrevented)return;const item=nearest(event.lngLat);if(item?.distance<=150)renderVolcano(item.volcano)});
  control.querySelectorAll('input[data-volcano-layer]').forEach(input=>input.onchange=()=>{state={...state,[input.dataset.volcanoLayer]:input.checked};if(input.dataset.volcanoLayer==='research'&&!gate.released){input.checked=false;state.research=false;control.querySelector('#volcanoReleaseState').textContent='公開条件未達のためOFF'}});
  return Object.freeze({setActive(value){active=Boolean(value);control.hidden=!active;state.enabled=active;setVisibility(active);EARTHQUAKE_LAYERS.forEach(id=>map.getLayer(id)&&map.setLayoutProperty(id,'visibility',active?'none':'visible'));if(active)sheet.innerHTML='<b>火山を選択</b><p>地図上の火山点をタップすると、公式状態を最優先にした詳細を表示します。</p>';},get state(){return Object.freeze({...state})},gate});
}
