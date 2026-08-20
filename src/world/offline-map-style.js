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
      graticule:{type:'geojson',data:createWorldGraticule(),maxzoom:4}
    },
    layers:[
      {id:'ocean',type:'background',paint:{'background-color':'#0b3550'}},
      {id:'graticule',type:'line',source:'graticule',maxzoom:5,paint:{'line-color':['match',['get','axis'],['equator','prime-meridian'],'#8ec7df','#5590aa'],'line-width':['match',['get','axis'],['equator','prime-meridian'],1.15,0.65],'line-opacity':['match',['get','axis'],['equator','prime-meridian'],0.58,0.36]}},
      {id:'land',type:'fill',source:'countries',maxzoom:5,paint:{'fill-color':'#425653','fill-opacity':1}},
      {id:'land-outline-halo',type:'line',source:'countries',maxzoom:5,paint:{'line-color':'#b8e0e7','line-width':['interpolate',['linear'],['zoom'],0,1.15,4,2.1],'line-opacity':0.52,'line-blur':0.35}},
      {id:'borders',type:'line',source:'countries',maxzoom:5,paint:{'line-color':'#a9bbb7','line-width':['interpolate',['linear'],['zoom'],0,0.45,4,1.1],'line-opacity':0.78}},
      {id:'lakes',type:'fill',source:'lakes',maxzoom:5,paint:{'fill-color':'#0b2537','fill-opacity':1}},
      {id:'lake-lines',type:'line',source:'lakes',maxzoom:5,paint:{'line-color':'#54798b','line-width':0.6,'line-opacity':0.75}}
    ]
  };
}
