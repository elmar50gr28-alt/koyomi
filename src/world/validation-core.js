const EARTH_RADIUS_KM=6371.0088;
const radians=value=>Number(value)*Math.PI/180;

export function validateWorldEvent(event){
  if(!event?.id||!event?.label||!event?.source?.url)throw new TypeError('event identity and source are required');
  if(Number.isNaN(new Date(event.datetimeUtc).getTime()))throw new TypeError('event datetimeUtc is invalid');
  if(!Number.isFinite(event.latitude)||event.latitude < -90||event.latitude > 90)throw new RangeError('event latitude is invalid');
  if(!Number.isFinite(event.longitude)||event.longitude < -180||event.longitude > 180)throw new RangeError('event longitude is invalid');
  if(!Number.isFinite(event.magnitude)||!Number.isFinite(event.depthKm))throw new TypeError('event magnitude and depth are required');
  return event;
}

export function haversineKm(left,right){const lat1=radians(left.latitude),lat2=radians(right.latitude),deltaLat=lat2-lat1,deltaLon=radians(right.longitude-left.longitude),a=Math.sin(deltaLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(deltaLon/2)**2;return 2*EARTH_RADIUS_KM*Math.asin(Math.min(1,Math.sqrt(a)))}

export function relateEventToCell(event,cellId,grid){
  validateWorldEvent(event);const center=grid.center(cellId),eventCellId=grid.cellForLatLng(event.latitude,event.longitude,grid.resolution(cellId));let ring=null;
  for(let distance=0;distance<=5;distance+=1){if(grid.neighbors(cellId,distance).includes(eventCellId)){ring=distance;break}}
  return Object.freeze({eventCellId,selectedCellId:cellId,sameCell:eventCellId===cellId,ring,centerDistanceKm:haversineKm(event,center)});
}
