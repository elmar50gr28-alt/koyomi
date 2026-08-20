const range=(start,end,step)=>Array.from({length:Math.floor((end-start)/step)+1},(_,index)=>start+(index*step));

export function createWorldGraticule(){
  const features=[];
  for(const latitude of range(-60,60,30))features.push({
    type:'Feature',
    properties:{axis:latitude===0?'equator':'latitude'},
    geometry:{type:'LineString',coordinates:range(-180,180,5).map(longitude=>[longitude,latitude])}
  });
  for(const longitude of range(-150,180,30))features.push({
    type:'Feature',
    properties:{axis:longitude===0?'prime-meridian':longitude===180?'date-line':'longitude'},
    geometry:{type:'LineString',coordinates:range(-85,85,5).map(latitude=>[longitude,latitude])}
  });
  return {type:'FeatureCollection',features};
}
