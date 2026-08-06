from __future__ import annotations

from .normalize_events import normalize_usgs_feature


def parse_usgs_geojson(payload: dict) -> list[dict]:
    return [normalize_usgs_feature(feature) for feature in payload.get("features", [])]
