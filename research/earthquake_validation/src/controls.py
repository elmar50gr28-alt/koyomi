from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .mundane_score import score_for_datetime


def scan_control_periods(config: dict, weights: dict) -> list[dict]:
    scan = config.get("falseAlarmScan", {})
    if not scan.get("enabled", True):
        return []
    rows = []
    for region in scan.get("regions", []):
        candidates = []
        for year in scan.get("years", []):
            for day in range(1, 366, 7):
                dt = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=day - 1)
                score = score_for_datetime(dt, region["latitude"], region["longitude"], weights)
                candidates.append(
                    {
                        "regionId": region["id"],
                        "regionLabel": region["label"],
                        "datetime": score["datetime"],
                        "combinedScore": score["scores"]["combined"],
                        "controlType": "candidate",
                    }
                )
        top = sorted(candidates, key=lambda item: item["combinedScore"], reverse=True)[: scan.get("topPeriodsPerRegion", 4)]
        low = sorted(candidates, key=lambda item: item["combinedScore"])[: scan.get("lowPeriodsPerRegion", 2)]
        for item in top:
            rows.append({**item, "controlType": "high_score_period"})
        for item in low:
            rows.append({**item, "controlType": "low_score_period"})
    return rows
