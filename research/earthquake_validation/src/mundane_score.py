from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from math import cos, pi, sin

from .normalize_events import parse_time

SYNODIC_MONTH_DAYS = 29.53058867
ANOMALISTIC_MONTH_DAYS = 27.55455
J2000 = datetime(2000, 1, 1, 12, tzinfo=timezone.utc)


def _days(dt: datetime) -> float:
    return (dt.astimezone(timezone.utc) - J2000).total_seconds() / 86400.0


def _cycle_distance(value: float) -> float:
    x = abs((value % 1.0) - 0.5) * 2
    return 1.0 - x


def _seeded_random(dt: datetime, lat: float, lon: float) -> float:
    key = f"{dt.date()}:{round(lat, 2)}:{round(lon, 2)}".encode("utf-8")
    return int(hashlib.sha256(key).hexdigest()[:8], 16) / 0xFFFFFFFF


def score_for_datetime(dt_or_iso: str | datetime, latitude: float, longitude: float, weights: dict) -> dict:
    dt = parse_time(dt_or_iso) if isinstance(dt_or_iso, str) else dt_or_iso.astimezone(timezone.utc)
    days = _days(dt)
    lunar_phase = (days / SYNODIC_MONTH_DAYS) % 1.0
    lunar_anomaly = (days / ANOMALISTIC_MONTH_DAYS) % 1.0
    syzygy = max(_cycle_distance(lunar_phase), _cycle_distance((lunar_phase + 0.5) % 1.0))
    lunar_distance = 1.0 - abs(lunar_anomaly - 0.0)
    tidal_proxy = min(1.0, 0.55 * syzygy + 0.45 * lunar_distance)
    mars_saturn = abs(sin(days / 687.0 * 2 * pi) - sin(days / 10759.0 * 2 * pi))
    outer_hard = 1.0 - abs((mars_saturn % 0.5) - 0.25) * 4
    lunar_trigger = max(0.0, cos((lunar_phase - 0.25) * 2 * pi))
    regional_angle = 0.5 + 0.5 * sin((longitude / 180.0 * pi) + days / 365.2422 * 2 * pi)
    components = {
        "syzygy": max(0.0, min(1.0, syzygy)),
        "lunarDistance": max(0.0, min(1.0, lunar_distance)),
        "tidalProxy": max(0.0, min(1.0, tidal_proxy)),
        "outerHardAspect": max(0.0, min(1.0, outer_hard)),
        "lunarTrigger": max(0.0, min(1.0, lunar_trigger)),
        "regionalAngle": max(0.0, min(1.0, regional_angle)),
    }
    w = weights["weights"]
    combined = sum(components[key] * float(w[key]) for key in w)
    tidal_only = (components["lunarDistance"] + components["tidalProxy"]) / 2
    symbolic_only = (components["syzygy"] + components["outerHardAspect"] + components["regionalAngle"]) / 3
    return {
        "modelId": weights.get("modelId", "unspecified"),
        "datetime": dt.isoformat().replace("+00:00", "Z"),
        "components": components,
        "scores": {
            "combined": round(combined * 100, 3),
            "tidal_lunar_only": round(tidal_only * 100, 3),
            "mundane_symbolic_only": round(symbolic_only * 100, 3),
            "random_seeded": round(_seeded_random(dt, latitude, longitude) * 100, 3),
            "season_region_baseline": round((0.5 + 0.5 * sin(days / 365.2422 * 2 * pi + latitude / 90.0)) * 100, 3),
        },
        "disclaimer": "研究用地震活動指標であり、地震予知や警報ではありません。",
    }
