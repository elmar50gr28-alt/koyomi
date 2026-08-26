import assert from 'node:assert/strict';
import { createSpatialGrid } from '../src/world/index.js';
import { spatialCellMatches } from '../src/world/world-map-ui.js';

const grid=createSpatialGrid(),tokyo3=grid.cellForLatLng(35.6812,139.7671,3),tokyo4=grid.cellForLatLng(35.6812,139.7671,4),tokyo2=grid.parent(tokyo3,2),osaka3=grid.cellForLatLng(34.6937,135.5023,3);

assert.equal(spatialCellMatches(grid,tokyo3,tokyo3,3),true,'resolution 3 forecast rows must match resolution 3 display cells directly');
assert.equal(spatialCellMatches(grid,tokyo4,tokyo4,4),true,'resolution 4 forecast rows must match resolution 4 display cells directly');
assert.equal(spatialCellMatches(grid,tokyo4,tokyo3,3),true,'a finer display cell must inherit its forecast source parent');
assert.equal(spatialCellMatches(grid,tokyo2,tokyo3,3),true,'a coarser display cell must collect forecast source children');
assert.equal(spatialCellMatches(grid,tokyo3,osaka3,3),false,'different cells at the same resolution must not match');
assert.equal(spatialCellMatches(grid,tokyo2,osaka3,3),grid.parent(osaka3,2)===tokyo2,'coarse aggregation must follow the H3 hierarchy');

console.log('World forecast adaptive-resolution matching passed');
