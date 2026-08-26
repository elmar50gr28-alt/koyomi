import { VOLCANO_RELEASE_REQUIREMENTS } from './config.js';
export function evaluateVolcanoReleaseGate(evidence={}){const missing=VOLCANO_RELEASE_REQUIREMENTS.filter(key=>evidence[key]!==true);return Object.freeze({released:missing.length===0,missing:Object.freeze(missing),label:missing.length?'研究公開条件未達':'研究公開条件合格'});}
