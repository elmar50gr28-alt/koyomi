import { access,mkdir,readFile,writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { buildProspectiveSnapshot } from '../src/world/prediction-engine/index.js';

const requested=process.env.KOYOMI_FORECAST_AS_OF||new Date().toISOString(),day=new Date(requested).toISOString().slice(0,10),asOf=`${day}T00:00:00.000Z`,catalog=JSON.parse(await readFile(new URL('../data/world/earthquake-research-catalog-v2.json',import.meta.url),'utf8')),snapshot=buildProspectiveSnapshot(catalog,{asOf,horizonDays:7,magnitudeThreshold:5.5}),directory=new URL('../data/predictions/world-v1/',import.meta.url),target=new URL(`${day}.json`,directory);
await mkdir(directory,{recursive:true});
try{await access(target,constants.F_OK);throw new Error(`append-only snapshot already exists: ${day}`)}catch(error){if(error?.code!=='ENOENT')throw error}
await writeFile(target,`${JSON.stringify(snapshot)}\n`,{flag:'wx'});console.log(`Prospective snapshot created: ${day}, cells=${snapshot.cells.length}, dataset=${snapshot.datasetVersion}`);
