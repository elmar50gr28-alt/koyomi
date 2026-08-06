from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .normalize_events import iso, parse_time

BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


class CatalogFetchError(RuntimeError):
    pass


def _cache_key(params: dict) -> str:
    payload = json.dumps(params, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def fetch_usgs_geojson(params: dict, cache_dir: Path, raw_dir: Path, metadata_dir: Path, user_agent: str) -> dict:
    cache_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    query = {"format": "geojson", "orderby": "time-asc", **params}
    key = _cache_key(query)
    cache_path = cache_dir / f"usgs_{key}.json"
    meta_path = metadata_dir / f"usgs_{key}.metadata.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))
    url = f"{BASE_URL}?{urlencode(query)}"
    last_error = None
    for attempt in range(3):
        try:
            req = Request(url, headers={"User-Agent": user_agent})
            with urlopen(req, timeout=60) as response:
                body = response.read().decode("utf-8")
            cache_path.write_text(body, encoding="utf-8")
            raw_dir.joinpath(f"usgs_{key}.raw.json").write_text(body, encoding="utf-8")
            meta_path.write_text(
                json.dumps(
                    {
                        "source": "USGS ComCat FDSN Event API",
                        "url": url,
                        "retrievedAt": iso(datetime.now(timezone.utc)),
                        "params": query,
                    },
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )
            return json.loads(body)
        except (URLError, TimeoutError, OSError) as error:
            last_error = error
            time.sleep(2 * (attempt + 1))
    raise CatalogFetchError(f"USGS fetch failed: {last_error}; url={url}")


def query_aftershock_catalog(mainshock: dict, config: dict, base_dir: Path) -> dict:
    origin = parse_time(mainshock["originTime"])
    params = {
        "starttime": iso(origin),
        "endtime": iso(origin + timedelta(days=config["catalogQuery"]["maxDaysAfter"])),
        "latitude": mainshock["latitude"],
        "longitude": mainshock["longitude"],
        "maxradiuskm": config["catalogQuery"]["maxRadiusKm"],
        "minmagnitude": config["catalogQuery"]["minMagnitude"],
    }
    return fetch_usgs_geojson(
        params,
        base_dir / "data" / "cache",
        base_dir / "data" / "raw",
        base_dir / "data" / "metadata",
        config.get("userAgent", "KOYOMI research"),
    )


def query_mainshock_candidates(seed: dict, config: dict, base_dir: Path) -> dict:
    origin = parse_time(seed["originTime"])
    search = config["mainshockSearch"]
    params = {
        "starttime": iso(origin - timedelta(days=search["daysBefore"])),
        "endtime": iso(origin + timedelta(days=search["daysAfter"])),
        "latitude": seed["latitude"],
        "longitude": seed["longitude"],
        "maxradiuskm": search["radiusKm"],
        "minmagnitude": search["minMagnitude"],
    }
    return fetch_usgs_geojson(
        params,
        base_dir / "data" / "cache",
        base_dir / "data" / "raw",
        base_dir / "data" / "metadata",
        config.get("userAgent", "KOYOMI research"),
    )
