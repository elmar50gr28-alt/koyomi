const EARTH_RADIUS_KM=6371;
const radians=value=>value*Math.PI/180;
export function distanceKm(a,b){const dLat=radians(b.latitude-a.latitude),dLon=radians(b.longitude-a.longitude),x=Math.sin(dLat/2)**2+Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(dLon/2)**2;return 2*EARTH_RADIUS_KM*Math.asin(Math.sqrt(x))}

export function evaluateVolcanoSeismicCoupling(volcano,earthquakes,{asOf=new Date(),radiusKm=30,maxAgeHours=24}={}){
  const cutoff=new Date(asOf).getTime();if(!Number.isFinite(cutoff))throw new TypeError('asOf must be a valid date');
  const nearby=(Array.isArray(earthquakes)?earthquakes:[]).filter(item=>Number.isFinite(Date.parse(item?.timeUtc))&&Date.parse(item.timeUtc)<=cutoff&&cutoff-Date.parse(item.timeUtc)<=maxAgeHours*36e5&&distanceKm(volcano,item)<=radiusKm);
  if(!nearby.length)return Object.freeze({status:'data-unavailable',classification:null,count:null,maximumMagnitude:null,radiusKm,reason:'更新済みの周辺地震データがありません'});
  const maximumMagnitude=Math.max(...nearby.map(item=>Number(item.magnitude)||0));
  return Object.freeze({status:'available',classification:nearby.length>=5?'clustered-change':'observed',count:nearby.length,maximumMagnitude,radiusKm,reason:nearby.length>=5?'周辺で地震のまとまりが観測されています':'周辺地震が観測されています'});
}

export function combineIndependentVolcanoSignals({thermal,seismic}){
  return Object.freeze({status:thermal?.status==='available'&&seismic?.status==='available'?'comparable':'insufficient-data',thermal,volcanicSeismic:seismic,tectonicEarthquakeForecast:null,eruptionProbability:null,actionLevel:null});
}
