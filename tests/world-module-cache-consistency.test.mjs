import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app,ui,worker]=await Promise.all(['app.html','src/world/world-map-ui.js','service-worker.js'].map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
assert.match(app,/world-map-ui\.js\?v=earthquake-native-v21-module-cache/,'World entry module must use a new cache generation');
assert.match(ui,/earthquake-forecast\/index\.js\?v=thermal-public-v1/,'the barrel module must not reuse a pre-thermal cache entry');
assert.match(worker,/function isApplicationCodeRequest/);assert.match(worker,/networkFirstApplicationCode/);assert.match(worker,/fetch\(request, \{ cache: 'no-store' \}\)/);assert.match(worker,/caches\.match\(request, \{ ignoreSearch: true \}\)/);
assert.match(worker,/Promise\.allSettled\(APP_SHELL\.map/,'one optional asset must not prevent the new worker from activating');
const shell=worker.slice(worker.indexOf('const APP_SHELL'),worker.indexOf('const MAP_CORE_ASSETS'));
assert.doesNotMatch(shell,/earthquake-thermal-public-v1\.json/,'the 11 MB rolling dataset must not block service-worker installation');
assert.match(worker,/function isThermalResearchDataRequest/);assert.match(worker,/isThermalResearchDataRequest\(request\)/,'the rolling dataset must be cached only after a successful runtime request');
assert.match(app,/world-map-load-error/,'module bootstrap failures must be visible instead of leaving a permanent loading state');
assert.match(ui,/const thermalDatasetPromise=loadThermalDataset\(\)/,'the large thermal dataset must start loading in parallel');
assert.doesNotMatch(ui,/thermalDataset=await loadThermalDataset\(\)/,'the globe shell must not wait for the large thermal dataset');
assert.match(ui,/thermalDataset=dataset;changeCache\.clear\(\);recalculatePreview\(\);scheduleUpdate\(\)/,'thermal results must refresh the change preview after arrival');
assert.match(ui,/map\.on\('idle',completeMapStartup\)/,'a missed load event must be recovered when the rendered map becomes idle');
assert.match(ui,/map\.on\('styledata',completeMapStartup\)/,'partial source progress must retry startup completion');
assert.match(ui,/queueMicrotask\(completeMapStartup\)/,'an already-loaded inline style must complete startup immediately');
assert.match(ui,/mapStartupComplete\|\|!map\.getLayer\('ocean'\)/,'startup completion must wait for the base style and run only once');
assert.match(ui,/!map\?\.getLayer\?\.\('ocean'\)/,'research rendering must not wait for every large reference source to finish');

console.log('World module cache consistency hotfix passed');
