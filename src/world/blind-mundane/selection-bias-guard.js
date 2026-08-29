const FORBIDDEN_INPUTS=['events','observations','alerts','fatalities','news','conflictRegions','currentHotspots'];
export function inspectBlindScanInput(input){const keys=Object.keys(input||{}),forbidden=keys.filter(key=>FORBIDDEN_INPUTS.includes(key));return Object.freeze({ok:forbidden.length===0,forbidden:Object.freeze(forbidden)})}
