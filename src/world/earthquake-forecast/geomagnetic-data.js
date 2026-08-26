const SCHEMA_ID='koyomi-geomagnetic-research-v1';
const SHA256=/^[a-f0-9]{64}$/i;

export function validateGeomagneticDataset(dataset){
  if(!dataset||dataset.schemaId!==SCHEMA_ID)throw new TypeError('invalid geomagnetic schema');
  if(!dataset.provider?.kp?.sourceName||!dataset.provider.kp.sourceUrl)throw new TypeError('missing Kp provenance');
  if(!Number.isFinite(Date.parse(dataset.retrievedAt))||!Number.isFinite(Date.parse(dataset.coverageStartUtc))||!Number.isFinite(Date.parse(dataset.coverageEndUtc)))throw new TypeError('invalid geomagnetic coverage');
  if(!SHA256.test(dataset.sha256||'')||dataset.recordCount!==dataset.observations?.length||dataset.recordCount<1)throw new TypeError('invalid geomagnetic integrity metadata');
  let previous=-Infinity;
  for(const item of dataset.observations){const time=Date.parse(item.timeUtc);if(!Number.isFinite(time)||time<=previous||!Number.isFinite(item.kp)||item.kp<0||item.kp>9||!(item.dst===null||Number.isFinite(item.dst)))throw new TypeError('invalid geomagnetic observation');previous=time}
  if(dataset.observations[0].timeUtc!==dataset.coverageStartUtc||dataset.observations.at(-1).timeUtc!==dataset.coverageEndUtc)throw new TypeError('geomagnetic coverage mismatch');
  return dataset;
}

export async function loadGeomagneticDataset(url='./data/world/geomagnetic-research-v1.json',fetcher=fetch){
  const response=await fetcher(url);if(!response.ok)throw new Error('geomagnetic dataset unavailable');
  return validateGeomagneticDataset(await response.json());
}
