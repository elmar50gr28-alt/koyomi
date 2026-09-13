// Presentation only: fixed research criteria never alter earthquake probabilities.
export const RESEARCH_ANOMALY_STYLES=Object.freeze({
  change:Object.freeze({label:'平常比の大きな上昇',color:'#ffffff'}),
  quiescence:Object.freeze({label:'急静穏化',color:'#ffe600'}),
  heat:Object.freeze({label:'温度上昇の熱異常候補',color:'#ff52df'}),
  cold:Object.freeze({label:'温度低下の熱異常候補',color:'#50eaff'})
});

export function researchAnomalies(row){
  const anomalies=[];
  if(row?.status==='available'&&Number.isFinite(row.change_percentile)&&row.change_percentile>=95&&row.change_percentile<=100)
    anomalies.push({kind:'change',value:row.change_percentile});
  const q=row?.quiescenceSignal;
  if(q?.status==='available'&&Number.isFinite(q.signal0To100)&&q.signal0To100>0&&q.signal0To100<=100)
    anomalies.push({kind:'quiescence',value:q.signal0To100});
  const thermal=row?.thermalSignal;
  if(thermal?.status==='candidate-active'){
    if(Number.isFinite(thermal.positiveEvidence)&&thermal.positiveEvidence>0&&thermal.positiveEvidence<=1)
      anomalies.push({kind:'heat',value:thermal.positiveEvidence*100});
    if(Number.isFinite(thermal.negativeEvidence)&&thermal.negativeEvidence>0&&thermal.negativeEvidence<=1)
      anomalies.push({kind:'cold',value:thermal.negativeEvidence*100});
  }
  return anomalies.map(item=>({...item,...RESEARCH_ANOMALY_STYLES[item.kind]}));
}

export function buildResearchAnomalyGeoJson(grid,rows,{active=false}={}){
  const byId=new Map();
  if(active)for(const row of rows){
    const anomalies=researchAnomalies(row);
    for(const anomaly of anomalies){
      const thermal=anomaly.kind==='heat'||anomaly.kind==='cold',id=String(thermal?(row.thermalSignal.observationCellId||row.cell_id):row.cell_id);
      const items=byId.get(id)||[];
      if(!items.some(item=>item.kind===anomaly.kind))items.push(anomaly);
      byId.set(id,items);
    }
  }
  // Keep seismic calculation cells and thermal observation cells at their true resolution.
  return grid.geoJson([...byId.keys()],id=>{
    const anomalies=byId.get(String(id));
    const primary=anomalies.find(item=>item.kind==='heat'||item.kind==='cold')||anomalies.find(item=>item.kind==='quiescence')||anomalies[0];
    return {anomalyColor:primary.color,anomalyKind:primary.kind,anomalyCount:anomalies.length};
  });
}

export const RESEARCH_ANOMALY_LAYER_IDS=Object.freeze(['earthquake-research-anomaly-halo','earthquake-research-anomaly-line']);

export function updateResearchAnomalyLayers(map,data){
  const source=map.getSource('earthquake-research-anomalies');
  if(source)source.setData(data);
  else map.addSource('earthquake-research-anomalies',{type:'geojson',data,maxzoom:14});
  if(!map.getLayer(RESEARCH_ANOMALY_LAYER_IDS[0]))map.addLayer({
    id:RESEARCH_ANOMALY_LAYER_IDS[0],type:'line',source:'earthquake-research-anomalies',
    paint:{'line-color':'#07111c','line-width':7,'line-opacity':.95}
  });
  if(!map.getLayer(RESEARCH_ANOMALY_LAYER_IDS[1]))map.addLayer({
    id:RESEARCH_ANOMALY_LAYER_IDS[1],type:'line',source:'earthquake-research-anomalies',
    paint:{'line-color':['get','anomalyColor'],'line-width':3.5,'line-opacity':1}
  });
}
