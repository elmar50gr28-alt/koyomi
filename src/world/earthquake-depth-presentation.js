export const EARTHQUAKE_DEPTH_3D_MIN_ZOOM=3.5;

const finiteDepth=value=>Math.max(0,Number.isFinite(Number(value))?Number(value):0);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function earthquakeDepthBand(depthKm){
  const depth=finiteDepth(depthKm);
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
    'very-deep':'非常に深い地震'
  })[earthquakeDepthBand(depthKm)];
}

export function earthquakeDepthLengthPx(depthKm,zoom){
  const normalized=Math.sqrt(clamp(finiteDepth(depthKm),0,700)/700);
  const zoomScale=.7+.3*clamp((Number(zoom)-EARTHQUAKE_DEPTH_3D_MIN_ZOOM)/3.5,0,1);
  return Math.round((8+68*normalized)*zoomScale);
}

export const earthquakeDepth3dVisible=(enabled,zoom)=>Boolean(enabled)&&Number(zoom)>=EARTHQUAKE_DEPTH_3D_MIN_ZOOM;
