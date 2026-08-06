# Sources

## Primary

- USGS ComCat FDSN Event API: https://earthquake.usgs.gov/fdsnws/event/1/

## Planned Fallbacks

- ISC Bulletin Web Service
- ISC-GEM Global Instrumental Earthquake Catalogue
- Japan Meteorological Agency earthquake catalogs
- National public earthquake agencies
- Academic mirrors with source metadata

## Data Policy

Raw responses, query URLs, retrieval time, and query parameters are preserved in `data/raw/` and `data/metadata/`. Magnitude types such as Mw, Ms, mb, and Mj are recorded as provided. Unknown magnitude types are not silently converted to Mw.
