import { createWorldGraticule } from './world-graticule.js';

const assetUrl=path=>new URL(path,document.baseURI).href;

export function createOfflineWorldStyle(){
  return {
    version:8,
    name:'KOYOMI Offline Globe v2',
    metadata:{'koyomi:offline':true,'koyomi:data':'Natural Earth 1:50m'},
    projection:{type:'globe'},
    sources:{
      countries:{type:'geojson',data:assetUrl('./data/map/natural-earth-50m-countries.geojson'),attribution:'Made with Natural Earth · Public Domain',maxzoom:4},
      lakes:{type:'geojson',data:assetUrl('./data/map/natural-earth-50m-lakes.geojson'),attribution:'Made with Natural Earth · Public Domain',maxzoom:4},
      japanPrefectures:{type:'geojson',data:assetUrl('./data/map/japan-prefectures-2026.geojson'),attribution:'「国土数値情報（行政区域データ）」（国土交通省）を加工して作成'},
      graticule:{type:'geojson',data:createWorldGraticule(),maxzoom:4}
    },
    layers:[
      {id:'ocean',type:'background',paint:{'background-color':'#0b3550'}},
      {id:'graticule',type:'line',source:'graticule',maxzoom:5,paint:{'line-color':['match',['get','axis'],['equator','prime-meridian'],'#8ec7df','#5590aa'],'line-width':['match',['get','axis'],['equator','prime-meridian'],1.15,0.65],'line-opacity':['match',['get','axis'],['equator','prime-meridian'],0.58,0.36]}},
      {id:'land',type:'fill',source:'countries',maxzoom:15,paint:{'fill-color':'#425653','fill-opacity':1}},
      {id:'land-outline-halo',type:'line',source:'countries',maxzoom:15,paint:{'line-color':'#b8e0e7','line-width':['interpolate',['linear'],['zoom'],0,1.15,4,2.1,10,2.5],'line-opacity':0.52,'line-blur':0.35}},
      {id:'borders',type:'line',source:'countries',maxzoom:15,paint:{'line-color':'#a9bbb7','line-width':['interpolate',['linear'],['zoom'],0,0.45,4,1.1,10,1.35],'line-opacity':0.78}},
      {id:'lakes',type:'fill',source:'lakes',maxzoom:15,paint:{'fill-color':'#0b2537','fill-opacity':1}},
      {id:'lake-lines',type:'line',source:'lakes',maxzoom:15,paint:{'line-color':'#54798b','line-width':0.6,'line-opacity':0.75}},
      {id:'japan-prefecture-border-halo',type:'line',source:'japanPrefectures',minzoom:3.5,paint:{'line-color':'#102d3b','line-width':['interpolate',['linear'],['zoom'],3.5,1.8,7,3.2,12,4.2],'line-opacity':0.82}},
      {id:'japan-prefecture-borders',type:'line',source:'japanPrefectures',minzoom:3.5,paint:{'line-color':'#e7f7f5','line-width':['interpolate',['linear'],['zoom'],3.5,.7,7,1.35,12,1.8],'line-opacity':0.96}}
    ]
  };
}
