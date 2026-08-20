const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const normalizeLon = value => ((Number(value) + 180) % 360 + 360) % 360 - 180;

// KOYOMI Equal-area Band Grid v1 is an offline fallback, not H3 and not perfectly equal-area.
// Bands are uniform in sin(latitude), so spherical cell areas are approximately equal. Polar
// caps and integer column rounding are exceptions. The provider API is intentionally H3-ready.
export class EqualAreaBandGrid {
  constructor() { this.systemId = 'koyomi-equal-area-band-v1'; }
  resolutionForZoom(zoom) { return clamp(Math.floor(Number(zoom) / 2), 0, 5); }
  dimensions(resolution) { const rows = 6 * (2 ** clamp(resolution, 0, 5)); return { rows, columns: rows * 2 }; }
  cellForLatLng(latitude, longitude, resolution = 2) {
    const lat = clamp(Number(latitude), -90, 90), lon = normalizeLon(longitude);
    const { rows, columns } = this.dimensions(resolution);
    const row = clamp(Math.floor(((Math.sin(lat * Math.PI / 180) + 1) / 2) * rows), 0, rows - 1);
    const column = clamp(Math.floor(((lon + 180) / 360) * columns), 0, columns - 1);
    return `kea1:${resolution}:${row}:${column}`;
  }
  boundary(cellId) {
    const [prefix, resolutionText, rowText, columnText] = String(cellId).split(':');
    if (prefix !== 'kea1') throw new TypeError('unsupported cell id');
    const resolution = Number(resolutionText), row = Number(rowText), column = Number(columnText);
    const { rows, columns } = this.dimensions(resolution);
    if (![row,column].every(Number.isInteger) || row < 0 || row >= rows || column < 0 || column >= columns) throw new RangeError('invalid cell id');
    const lat = value => Math.asin(clamp(value, -1, 1)) * 180 / Math.PI;
    const south = lat((row / rows) * 2 - 1), north = lat(((row + 1) / rows) * 2 - 1);
    const west = column / columns * 360 - 180, east = (column + 1) / columns * 360 - 180;
    return [[south,west],[south,east],[north,east],[north,west],[south,west]];
  }
  center(cellId) { const b = this.boundary(cellId); return { latitude:(b[0][0]+b[2][0])/2, longitude:(b[0][1]+b[1][1])/2 }; }
  geoJson(cellIds, properties = () => ({})) {
    return { type:'FeatureCollection', features:cellIds.map(id => ({ type:'Feature', id, properties:{ cellId:id, ...properties(id) }, geometry:{ type:'Polygon', coordinates:[this.boundary(id).map(([lat,lon]) => [lon,lat])] } })) };
  }
}

export function createSpatialGrid(options = {}) { return options.h3Provider || new EqualAreaBandGrid(); }
