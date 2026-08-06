from __future__ import annotations

from datetime import timedelta
from statistics import median

from .declustering import decluster_gardner_knopoff_like
from .normalize_events import parse_time, seismic_moment
from .spatial_windows import events_within


def _b_value(events: list[dict], min_mag: float) -> float | None:
    mags = [e["magnitude"] for e in events if e.get("magnitude") is not None and e["magnitude"] >= min_mag]
    if len(mags) < 3:
        return None
    mean_mag = sum(mags) / len(mags)
    delta = 0.1
    denom = mean_mag - (min_mag - delta / 2)
    return round(0.4342944819 / denom, 4) if denom > 0 else None


def metrics_for_window(mainshock: dict, events: list[dict], radius_km: float, days_after: float, threshold: float) -> dict:
    origin = parse_time(mainshock["originTime"])
    end = origin + timedelta(days=days_after)
    temporal = [event for event in events if origin < parse_time(event["originTime"]) <= end]
    spatial = events_within(mainshock, temporal, radius_km)
    mags = [event["magnitude"] for event in spatial if event.get("magnitude") is not None]
    thresholded = [event for event in spatial if (event.get("magnitude") or 0) >= threshold]
    declustered = decluster_gardner_knopoff_like(spatial)
    depths = [event["depthKm"] for event in spatial if event.get("depthKm") is not None]
    distances = [event.get("distanceKm", 0.0) for event in spatial]
    intervals = []
    sorted_events = sorted(spatial, key=lambda item: item.get("originTime") or "")
    for prev, current in zip(sorted_events, sorted_events[1:]):
        intervals.append((parse_time(current["originTime"]) - parse_time(prev["originTime"])).total_seconds() / 3600)
    return {
        "eventCount": len(spatial),
        "m4Count": sum(1 for mag in mags if mag >= 4.0),
        "m45Count": sum(1 for mag in mags if mag >= 4.5),
        "m5Count": sum(1 for mag in mags if mag >= 5.0),
        "m6Count": sum(1 for mag in mags if mag >= 6.0),
        "thresholdCount": len(thresholded),
        "maxMagnitude": max(mags) if mags else None,
        "medianMagnitude": median(mags) if mags else None,
        "totalSeismicMomentNm": sum(seismic_moment(mag) for mag in mags),
        "bValue": _b_value(spatial, 4.5),
        "medianIntereventHours": median(intervals) if intervals else None,
        "spatialConcentrationKmMedian": median(distances) if distances else None,
        "meanDepthKm": sum(depths) / len(depths) if depths else None,
        "medianDepthKm": median(depths) if depths else None,
        "declusteredEventCount": len(declustered),
        "declusteringMethod": "gardner_knopoff_like_lightweight",
    }
