const BODY_MAP = Object.freeze({
  Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars',
  Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto'
});

const normalize = value => ((Number(value) % 360) + 360) % 360;

export function createAstronomyEngineAdapter(astronomy = globalThis.Astronomy) {
  if (!astronomy?.SunPosition || !astronomy?.EclipticGeoMoon || !astronomy?.GeoVector || !astronomy?.Ecliptic) {
    throw new TypeError('Astronomy Engine browser API is unavailable');
  }
  return Object.freeze({
    id: 'astronomy-engine',
    precision: 'high',
    solarLongitude(date) { return normalize(astronomy.SunPosition(date).elon); },
    planetLongitudes(date) {
      return Object.fromEntries(Object.entries(BODY_MAP).map(([name, bodyName]) => {
        if (name === 'Sun') return [name, normalize(astronomy.SunPosition(date).elon)];
        if (name === 'Moon') return [name, normalize(astronomy.EclipticGeoMoon(date).lon)];
        const body = astronomy.Body?.[bodyName] || bodyName;
        const ecliptic = astronomy.Ecliptic(astronomy.GeoVector(body, date, true));
        return [name, normalize(ecliptic.elon ?? ecliptic.lon)];
      }));
    }
  });
}
