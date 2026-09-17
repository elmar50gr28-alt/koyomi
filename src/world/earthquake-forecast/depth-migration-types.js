export const DEPTH_MIGRATION_SCHEMA='koyomi-depth-migration-v1';
export const DEPTH_MIGRATION_ENGINE_VERSION='depth-migration-v1';
export const DEPTH_BANDS=Object.freeze({shallow:Object.freeze([0,70]),intermediate:Object.freeze([70,300]),deep:Object.freeze([300,500]),ultraDeep:Object.freeze([500,Infinity])});
export const DEPTH_MIGRATION_STATUS=Object.freeze({AVAILABLE:'available',INSUFFICIENT:'insufficient-data'});

export function depthBand(depthKm){const depth=Number(depthKm);if(!Number.isFinite(depth)||depth<0)return null;if(depth<70)return'shallow';if(depth<300)return'intermediate';if(depth<500)return'deep';return'ultraDeep'}
