import { createSpatialGrid } from '../spatial-grid.js';
import { DEFAULT_FORECAST,WORLD_PREDICTION_ENGINE_VERSION } from './config.js';
import { forecastSeismicCell } from './seismic.js';
import { createPredictionSnapshot } from './snapshot.js';

const DAY=86_400_000;
export function buildProspectiveSnapshot(catalog,{asOf,horizonDays=DEFAULT_FORECAST.horizonDays,magnitudeThreshold=DEFAULT_FORECAST.magnitudeThreshold,grid=createSpatialGrid()}={}){
  const cutoff=new Date(asOf);if(Number.isNaN(cutoff.getTime()))throw new TypeError('valid asOf is required');if(!catalog?.inputSha256||!catalog?.eventsByCell)throw new TypeError('versioned catalog is required');
  const cells=Object.entries(catalog.eventsByCell).map(([cellId,events])=>{const center=grid.center(cellId),result=forecastSeismicCell({cellId,center,events,asOf:cutoff.toISOString(),horizonDays,magnitudeThreshold});return Object.freeze({cellId,center:result.center,forecast:result.forecast,explanation:result.explanation})});
  return createPredictionSnapshot({generatedAt:cutoff.toISOString(),forecastStart:cutoff.toISOString(),forecastEnd:new Date(cutoff.getTime()+horizonDays*DAY).toISOString(),modelVersion:WORLD_PREDICTION_ENGINE_VERSION,datasetVersion:catalog.inputSha256,cells});
}
