import * as h3 from '../../vendor/h3-js/4.5.0/h3-js.es.js';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const normalizeLon = value => ((Number(value) + 180) % 360 + 360) % 360 - 180;
const samePoint=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
const closeRing=points=>{const ring=points.map(point=>[point[0],point[1]]);if(ring.length&&!samePoint(ring[0],ring.at(-1)))ring.push([...ring[0]]);return ring};
const clipLongitude=(points,limit,keepLess)=>{
  const output=[],inside=point=>keepLess?point[0]<=limit:point[0]>=limit,intersection=(start,end)=>{const ratio=(limit-start[0])/(end[0]-start[0]);return[limit,start[1]+((end[1]-start[1])*ratio)]};
  for(let index=0;index<points.length;index++){const end=points[index],start=points[(index+points.length-1)%points.length],startInside=inside(start),endInside=inside(end);if(endInside){if(!startInside)output.push(intersection(start,end));output.push(end)}else if(startInside)output.push(intersection(start,end))}
  return output;
};

export function boundaryGeometry(boundary){
  const raw=boundary.map(([latitude,longitude])=>[Number(longitude),Number(latitude)]);let points=samePoint(raw[0],raw.at(-1))?raw.slice(0,-1):raw;
  let cursor=points[0][0];
  for(let index=1;index<=points.length;index++){let longitude=points[index%points.length][0];while(longitude-cursor>180)longitude-=360;while(longitude-cursor< -180)longitude+=360;cursor=longitude}
  if(Math.abs(cursor-points[0][0])>180){
    const poleLatitude=points.reduce((sum,point)=>sum+point[1],0)>=0?90:-90,polygons=[];
    for(let index=0;index<points.length;index++){const start=points[index],end=points[(index+1)%points.length];let endLongitude=end[0];while(endLongitude-start[0]>180)endLongitude-=360;while(endLongitude-start[0]< -180)endLongitude+=360;const poleLongitude=normalizeLon((start[0]+endLongitude)/2),triangle=boundaryGeometry([[start[1],start[0]],[end[1],end[0]],[poleLatitude,poleLongitude]]);polygons.push(...(triangle.type==='Polygon'?[triangle.coordinates]:triangle.coordinates))}
    return{type:'MultiPolygon',coordinates:polygons};
  }
  let crossing=-1;
  for(let index=0;index<points.length;index++){if(Math.abs(points[(index+1)%points.length][0]-points[index][0])>180){crossing=index;break}}
  if(crossing>=0)points=[...points.slice(crossing),...points.slice(0,crossing)];
  for(let index=1;index<points.length;index++){while(points[index][0]-points[index-1][0]>180)points[index][0]-=360;while(points[index][0]-points[index-1][0]<-180)points[index][0]+=360}
  const longitudes=points.map(point=>point[0]),minimum=Math.min(...longitudes),maximum=Math.max(...longitudes);
  if(maximum>180){const west=clipLongitude(points,180,true),east=clipLongitude(points,180,false).map(([longitude,latitude])=>[longitude-360,latitude]);return{type:'MultiPolygon',coordinates:[[closeRing(west)],[closeRing(east)]]}}
  if(minimum< -180){const west=clipLongitude(points,-180,true).map(([longitude,latitude])=>[longitude+360,latitude]),east=clipLongitude(points,-180,false);return{type:'MultiPolygon',coordinates:[[closeRing(west)],[closeRing(east)]]}}
  return{type:'Polygon',coordinates:[closeRing(points)]};
}

export class H3SpatialGrid {
  constructor() { this.systemId = 'h3'; this.version = '4.5.0'; }
  resolutionForZoom(zoom) { const value=Number(zoom); return value<2.5?1:value<4.5?2:value<6.5?3:value<8.5?4:5; }
  cellForLatLng(latitude, longitude, resolution = 2) { const lat=Number(latitude),lon=normalizeLon(longitude),res=clamp(Math.trunc(resolution),0,15); if(!Number.isFinite(lat)||lat < -90||lat > 90)throw new RangeError('latitude must be between -90 and 90'); return h3.latLngToCell(lat,lon,res); }
  boundary(cellId) { return h3.cellToBoundary(String(cellId)).map(([latitude,longitude])=>[latitude,longitude]); }
  center(cellId) { const [latitude,longitude]=h3.cellToLatLng(String(cellId)); return {latitude,longitude}; }
  resolution(cellId) { return h3.getResolution(String(cellId)); }
  parent(cellId,resolution) { return h3.cellToParent(String(cellId),resolution); }
  children(cellId,resolution) { return h3.cellToChildren(String(cellId),resolution); }
  neighbors(cellId,distance=1) { return h3.gridDisk(String(cellId),clamp(Math.trunc(distance),0,20)); }
  cellAreaKm2(cellId) { return h3.cellArea(String(cellId),h3.UNITS.km2); }
  isPentagon(cellId) { return h3.isPentagon(String(cellId)); }
  viewportCells(bounds,resolution,maxCells=500) {
    const south=clamp(Number(bounds.south),-89.999999,89.999999),north=clamp(Number(bounds.north),-89.999999,89.999999),rawWest=Number(bounds.west),rawEast=Number(bounds.east),west=normalizeLon(rawWest),east=normalizeLon(rawEast),fullWorld=rawEast-rawWest>=359.999,polygons=west<=east?[[west,east]]:[[west,180],[-180,east]],cells=new Set();
    if(fullWorld){for(const baseCell of h3.getRes0Cells()){const candidates=resolution===0?[baseCell]:h3.cellToChildren(baseCell,resolution);for(const cell of candidates){const {latitude}=this.center(cell);if(latitude>=south&&latitude<=north)cells.add(cell);if(cells.size>=maxCells)return [...cells]}}return [...cells]}
    for(const [left,right] of polygons){const polygon=[[south,left],[south,right],[north,right],[north,left],[south,left]];for(const cell of h3.polygonToCells(polygon,resolution)){cells.add(cell);if(cells.size>=maxCells)return [...cells]}}
    return [...cells];
  }
  geoJson(cellIds,properties=()=>({})) { return {type:'FeatureCollection',features:cellIds.map(id=>({type:'Feature',id,properties:{cellId:id,gridSystemId:this.systemId,gridVersion:this.version,...properties(id)},geometry:boundaryGeometry(this.boundary(id))}))}; }
}

// Offline fallback retained for migration and fault isolation. It is not H3 and not perfectly
// equal-area. Bands are uniform in sin(latitude); polar caps and column rounding are exceptions.
export class EqualAreaBandGrid {
  constructor() { this.systemId='koyomi-equal-area-band';this.version='1'; }
  resolutionForZoom(zoom) { return clamp(Math.floor(Number(zoom)/2),0,5); }
  dimensions(resolution) { const rows=6*(2**clamp(resolution,0,5));return {rows,columns:rows*2}; }
  cellForLatLng(latitude,longitude,resolution=2) { const lat=clamp(Number(latitude),-90,90),lon=normalizeLon(longitude),{rows,columns}=this.dimensions(resolution),row=clamp(Math.floor(((Math.sin(lat*Math.PI/180)+1)/2)*rows),0,rows-1),column=clamp(Math.floor(((lon+180)/360)*columns),0,columns-1);return `kea1:${resolution}:${row}:${column}`; }
  boundary(cellId) { const [prefix,resolutionText,rowText,columnText]=String(cellId).split(':');if(prefix!=='kea1')throw new TypeError('unsupported cell id');const resolution=Number(resolutionText),row=Number(rowText),column=Number(columnText),{rows,columns}=this.dimensions(resolution);if(![row,column].every(Number.isInteger)||row<0||row>=rows||column<0||column>=columns)throw new RangeError('invalid cell id');const lat=value=>Math.asin(clamp(value,-1,1))*180/Math.PI,south=lat((row/rows)*2-1),north=lat(((row+1)/rows)*2-1),west=column/columns*360-180,east=(column+1)/columns*360-180;return [[south,west],[south,east],[north,east],[north,west],[south,west]]; }
  center(cellId) { const b=this.boundary(cellId);return {latitude:(b[0][0]+b[2][0])/2,longitude:(b[0][1]+b[1][1])/2}; }
  geoJson(cellIds,properties=()=>({})) { return {type:'FeatureCollection',features:cellIds.map(id=>({type:'Feature',id,properties:{cellId:id,gridSystemId:this.systemId,gridVersion:this.version,...properties(id)},geometry:boundaryGeometry(this.boundary(id))}))}; }
}

export function createSpatialGrid(options={}) { return options.fallback?new EqualAreaBandGrid():new H3SpatialGrid(); }
