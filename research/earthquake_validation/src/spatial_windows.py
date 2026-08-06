from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = radians(lat1), radians(lat2)
    d_phi = radians(lat2 - lat1)
    d_lam = radians(lon2 - lon1)
    a = sin(d_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(d_lam / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(min(1.0, sqrt(a)))


def hypocentral_distance_km(mainshock: dict, event: dict) -> float:
    surface = haversine_km(mainshock["latitude"], mainshock["longitude"], event["latitude"], event["longitude"])
    depth_delta = (event.get("depthKm") or 0.0) - (mainshock.get("depthKm") or 0.0)
    return sqrt(surface * surface + depth_delta * depth_delta)


def distance_for_event(mainshock: dict, event: dict) -> float:
    if (mainshock.get("depthKm") or 0.0) >= 300:
        return hypocentral_distance_km(mainshock, event)
    return haversine_km(mainshock["latitude"], mainshock["longitude"], event["latitude"], event["longitude"])


def events_within(mainshock: dict, events: list[dict], radius_km: float) -> list[dict]:
    out = []
    for event in events:
        if event.get("latitude") is None or event.get("longitude") is None:
            continue
        distance = distance_for_event(mainshock, event)
        if distance <= radius_km:
            copied = dict(event)
            copied["distanceKm"] = distance
            out.append(copied)
    return out
