import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [index,app,today,updater,worker]=await Promise.all(['index.html','app.html','today.html','src/shared/service-worker-update.js','service-worker.js'].map(path=>readFile(path,'utf8')));
for(const html of [index,app,today])assert.ok(html.includes('./src/shared/service-worker-update.js'),'every direct entry page must request service-worker updates');
for(const token of ["updateViaCache:'none'",'registration.update()','controllerchange','RELOAD_GUARD_MS','location.reload()'])assert.ok(updater.includes(token),token);
assert.ok(worker.includes('./src/shared/service-worker-update.js'));assert.ok(worker.includes('live-earthquake-v16-theme-restore'));
console.log('direct page service-worker update passed');
