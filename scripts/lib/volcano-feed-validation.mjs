import { writeFile, rename, rm } from 'node:fs/promises';

// HTTP 200 can still contain an API error instead of observations.
export function parseFirmsCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const keys = header?.split(',') || [];
  const required = ['latitude', 'longitude', 'acq_date', 'acq_time', 'frp'];
  if (!required.every(key => keys.includes(key)) || !keys.some(key => ['bright_ti4', 'brightness'].includes(key))) {
    throw new Error('Invalid FIRMS CSV schema');
  }
  return lines.filter(line => line.trim()).map(line => {
    const values = line.split(',');
    if (values.length !== keys.length) throw new Error('Invalid FIRMS CSV row');
    const row = Object.fromEntries(keys.map((key, index) => [key, values[index]]));
    const time = String(row.acq_time).padStart(4, '0');
    if (!['latitude', 'longitude', 'frp', keys.includes('bright_ti4') ? 'bright_ti4' : 'brightness'].every(key => row[key].trim() !== '' && Number.isFinite(Number(row[key]))) ||
        Math.abs(Number(row.latitude)) > 90 || Math.abs(Number(row.longitude)) > 180 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(row.acq_date) || !/^(?:[01]\d|2[0-3])[0-5]\d$/.test(time) ||
        !Number.isFinite(Date.parse(`${row.acq_date}T${time.slice(0, 2)}:${time.slice(2)}:00Z`))) {
      throw new Error('Invalid FIRMS observation');
    }
    return row;
  });
}

export function validateUsgsPayload(payload) {
  if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) throw new Error('Invalid USGS GeoJSON schema');
  for (const feature of payload.features) {
    const coordinates = feature?.geometry?.coordinates;
    if (feature?.geometry?.type !== 'Point' || !Array.isArray(coordinates) || coordinates.length < 3 ||
        !coordinates.slice(0, 3).every(Number.isFinite) || Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90 ||
        !Number.isFinite(feature?.properties?.time) || !Number.isFinite(feature?.properties?.mag)) throw new Error('Invalid USGS observation');
  }
  return payload;
}

export async function publishObservations(path, payload) {
  if (payload?.freshness?.publishable !== true) throw new Error('Volcano observation refresh failed publication safety checks');
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}
