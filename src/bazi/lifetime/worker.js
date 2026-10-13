import {buildSeries} from './core.js';
self.onmessage=async event=>{const {profile,settings}=event.data;try{const series=await buildSeries(profile,settings,{progress:value=>self.postMessage({progress:value})});self.postMessage({series});}catch(error){self.postMessage({error:error.message});}};
