export const EARTHQUAKE_DEPTH_LABEL_MIN_ZOOM=3.5;

const finiteDepth=value=>value===null||value===''||typeof value==='undefined'?null:Number.isFinite(Number(value))?Math.max(0,Number(value)):null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function earthquakeDepthBand(depthKm){
  const depth=finiteDepth(depthKm);
  if(depth===null)return'unknown';
  if(depth<70)return'shallow';
  if(depth<300)return'intermediate';
  if(depth<500)return'deep';
  return'very-deep';
}

export function earthquakeDepthBandLabel(depthKm){
  return({
    shallow:'浅い地震',
    intermediate:'やや深い地震',
    deep:'深発地震',
    'very-deep':'非常に深い地震',
    unknown:'深さ不明'
  })[earthquakeDepthBand(depthKm)];
}

export function earthquakeDepthMapLabel(depthKm){
  const depth=finiteDepth(depthKm);
  if(depth===null)return'深さ不明';
  return`${Math.round(depth)} km`;
}

export function earthquakeDepthPositionPercent(depthKm){
  const depth=finiteDepth(depthKm);
  return depth===null?0:Math.round(clamp(depth,0,700)/7*10)/10;
}

export const earthquakeDepthIsDeep=depthKm=>['deep','very-deep'].includes(earthquakeDepthBand(depthKm));
export const earthquakeDepthLabelsVisible=(enabled,zoom)=>Boolean(enabled)&&Number(zoom)>=EARTHQUAKE_DEPTH_LABEL_MIN_ZOOM;
