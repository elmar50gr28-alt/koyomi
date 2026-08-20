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
      {id:'ocean',type:'background',paint:{'background-color':'#08131c'}},
      {id:'land',type:'fill',source:'countries',maxzoom:5,paint:{'fill-color':'#263238','fill-opacity':1}},
      {id:'borders',type:'line',source:'countries',maxzoom:5,paint:{'line-color':'#718087','line-width':['interpolate',['linear'],['zoom'],0,0.35,4,1.1],'line-opacity':0.68}},
      {id:'lakes',type:'fill',source:'lakes',maxzoom:5,paint:{'fill-color':'#10232e','fill-opacity':1}},
      {id:'lake-lines',type:'line',source:'lakes',maxzoom:5,paint:{'line-color':'#5e747d','line-width':0.6,'line-opacity':0.65}}
    ]
  };
}
