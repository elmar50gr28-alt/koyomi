from __future__ import annotations

from datetime import datetime, timezone
from math import pow


def parse_time(value: str) -> datetime:
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value).astimezone(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def seismic_moment(magnitude: float | None) -> float:
    if magnitude is None:
        return 0.0
    return pow(10.0, 1.5 * float(magnitude) + 9.1)


def normalize_usgs_feature(feature: dict) -> dict:
    props = feature.get("properties") or {}
    geom = feature.get("geometry") or {}
    coords = geom.get("coordinates") or [None, None, None]
    millis = props.get("time")
    origin = datetime.fromtimestamp(millis / 1000, timezone.utc) if millis else None
    mag = props.get("mag")
    return {
        "eventId": feature.get("id") or props.get("code") or "",
        "source": "USGS ComCat",
        "originTime": iso(origin) if origin else "",
        "latitude": float(coords[1]) if coords[1] is not None else None,
        "longitude": float(coords[0]) if coords[0] is not None else None,
        "depthKm": float(coords[2]) if coords[2] is not None else None,
        "magnitude": float(mag) if mag is not None else None,
        "magnitudeType": props.get("magType") or "unknown",
        "place": props.get("place") or "",
        "url": props.get("url") or "",
        "status": props.get("status") or "",
        "seismicMomentNm": seismic_moment(float(mag)) if mag is not None else 0.0,
        "raw": feature,
    }


def choose_mainshock(candidates: list[dict], expected: dict) -> dict:
    if not candidates:
        return {**expected, "source": "cohort_seed", "eventId": expected.get("id", ""), "confirmationStatus": "not_confirmed"}
    expected_time = parse_time(expected["originTime"])
    expected_mag = float(expected.get("magnitude", 0))

    def score(event: dict) -> tuple[float, float]:
        dt_hours = abs((parse_time(event["originTime"]) - expected_time).total_seconds()) / 3600
        mag_delta = abs((event.get("magnitude") or 0) - expected_mag)
        return (mag_delta, dt_hours)

    selected = sorted(candidates, key=score)[0]
    selected["confirmationStatus"] = "confirmed_by_catalog"
    selected["cohortId"] = expected["id"]
    selected["nameJa"] = expected["nameJa"]
    selected["tectonicType"] = expected.get("tectonicType", "unknown")
    return selected
