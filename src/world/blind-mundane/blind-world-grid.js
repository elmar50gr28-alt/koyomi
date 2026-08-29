import { createSpatialGrid } from '../spatial-grid.js';
export const BLIND_GRID_RESOLUTION=1;
export function generateBlindWorldCells({grid=createSpatialGrid(),resolution=BLIND_GRID_RESOLUTION,maxLatitude=70}={}){return grid.viewportCells({south:-89.999,north:89.999,west:-180,east:180},resolution,2000).map(cellId=>({cellId,...grid.center(cellId)})).filter(item=>Math.abs(item.latitude)<=maxLatitude).sort((a,b)=>a.cellId.localeCompare(b.cellId))}
