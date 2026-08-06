from __future__ import annotations

from datetime import timedelta

from .normalize_events import parse_time
from .spatial_windows import haversine_km


def decluster_gardner_knopoff_like(events: list[dict]) -> list[dict]:
    """Lightweight Gardner-Knopoff-style aftershock suppression.

    This is a conservative research filter. It records method metadata rather
    than claiming a definitive tectonic classification.
    """
    sorted_events = sorted(events, key=lambda item: (-(item.get("magnitude") or 0), item.get("originTime") or ""))
    kept: list[dict] = []
    suppressed: set[str] = set()
    for candidate in sorted_events:
        eid = candidate.get("eventId") or candidate.get("originTime")
        if eid in suppressed:
            continue
        kept.append({**candidate, "declusteringStatus": "kept"})
        mag = candidate.get("magnitude") or 0.0
        days = max(1.0, min(365.0, 10 ** (0.1238 * mag + 0.983)))
        radius = max(10.0, min(500.0, 10 ** (0.1238 * mag + 0.983)))
        origin = parse_time(candidate["originTime"])
        for other in sorted_events:
            oid = other.get("eventId") or other.get("originTime")
            if oid == eid or oid in suppressed:
                continue
            other_time = parse_time(other["originTime"])
            if other_time < origin or other_time - origin > timedelta(days=days):
                continue
            distance = haversine_km(candidate["latitude"], candidate["longitude"], other["latitude"], other["longitude"])
            if distance <= radius and (other.get("magnitude") or 0) <= mag:
                suppressed.add(oid)
    return sorted(kept, key=lambda item: item.get("originTime") or "")
