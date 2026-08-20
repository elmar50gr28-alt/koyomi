const assetUrl=path=>new URL(path,document.baseURI).href;

export function createOfflineWorldStyle(){
  return {
    version:8,
    name:'KOYOMI Offline World v1',
    metadata:{'koyomi:offline':true,'koyomi:data':'Natural Earth 1:50m'},
    sources:{
      countries:{type:'geojson',data:assetUrl('./data/map/natural-earth-50m-countries.geojson'),attribution:'Made with Natural Earth · Public Domain',maxzoom:4},
      lakes:{type:'geojson',data:assetUrl('./data/map/natural-earth-50m-lakes.geojson'),attribution:'Made with Natural Earth · Public Domain',maxzoom:4}
    },
    layers:[
      {id:'ocean',type:'background',paint:{'background-color':'#071826'}},
      {id:'land',type:'fill',source:'countries',maxzoom:5,paint:{'fill-color':'#253f43','fill-opacity':1}},
      {id:'borders',type:'line',source:'countries',maxzoom:5,paint:{'line-color':'#819594','line-width':['interpolate',['linear'],['zoom'],0,0.35,4,1.1],'line-opacity':0.72}},
      {id:'lakes',type:'fill',source:'lakes',maxzoom:5,paint:{'fill-color':'#0b2537','fill-opacity':1}},
      {id:'lake-lines',type:'line',source:'lakes',maxzoom:5,paint:{'line-color':'#54798b','line-width':0.6,'line-opacity':0.75}}
    ]
  };
}
