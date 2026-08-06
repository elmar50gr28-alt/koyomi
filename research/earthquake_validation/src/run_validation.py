from __future__ import annotations

import json
import traceback
from datetime import timedelta
from pathlib import Path

from .controls import scan_control_periods
from .fetch_catalog import fetch_usgs_geojson, query_aftershock_catalog, query_mainshock_candidates
from .mundane_score import score_for_datetime
from .normalize_events import choose_mainshock, iso, parse_time
from .outcome_metrics import metrics_for_window
from .parse_catalog import parse_usgs_geojson
from .report import write_csv, write_json, write_markdown_report, write_xlsx
from .rupture_scaling import rupture_windows
from .statistics import sensitivity_summary, summarize_score_relationship

BASE_DIR = Path(__file__).resolve().parents[1]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def append_log(message: str) -> None:
    log_dir = BASE_DIR / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    with (log_dir / "run.log").open("a", encoding="utf-8") as handle:
        handle.write(message.rstrip() + "\n")


def mainshock_windows(mainshock: dict, config: dict) -> list[dict]:
    fixed = [
        {"windowId": f"r{radius}km", "windowType": "radius", "radiusKm": radius, "basis": "fixed_radius"}
        for radius in config["radiusWindowsKm"]
    ]
    rupture = [
        {"windowType": "rupture_length", **item}
        for item in rupture_windows(mainshock["magnitude"], mainshock.get("tectonicType", "unknown"), config["ruptureLengthMultipliers"])
    ]
    return fixed + rupture


def evaluate_event(seed: dict, config: dict, weights: dict) -> tuple[dict, list[dict], list[dict]]:
    candidates_payload = query_mainshock_candidates(seed, config, BASE_DIR)
    candidates = parse_usgs_geojson(candidates_payload)
    mainshock = choose_mainshock(candidates, seed)
    score = score_for_datetime(mainshock["originTime"], mainshock["latitude"], mainshock["longitude"], weights)
    event_row = {
        "cohortId": seed["id"],
        "nameJa": seed["nameJa"],
        "catalogEventId": mainshock.get("eventId", ""),
        "confirmationStatus": mainshock.get("confirmationStatus", ""),
        "originTime": mainshock["originTime"],
        "latitude": mainshock["latitude"],
        "longitude": mainshock["longitude"],
        "depthKm": mainshock.get("depthKm"),
        "magnitude": mainshock.get("magnitude"),
        "magnitudeType": mainshock.get("magnitudeType", ""),
        "tectonicType": mainshock.get("tectonicType", seed.get("tectonicType", "unknown")),
        "combinedScore": score["scores"]["combined"],
        "tidalLunarScore": score["scores"]["tidal_lunar_only"],
        "mundaneSymbolicScore": score["scores"]["mundane_symbolic_only"],
        "randomScore": score["scores"]["random_seeded"],
        "source": mainshock.get("source", ""),
        "sourceUrl": mainshock.get("url", ""),
    }
    catalog_payload = query_aftershock_catalog(mainshock, config, BASE_DIR)
    catalog_events = parse_usgs_geojson(catalog_payload)
    results = []
    for window in mainshock_windows(mainshock, config):
        for days_after in config["primaryTimeWindowsDays"]:
            for threshold in config["magnitudeThresholds"]:
                metrics = metrics_for_window(mainshock, catalog_events, float(window["radiusKm"]), float(days_after), float(threshold))
                results.append(
                    {
                        "cohortId": seed["id"],
                        "nameJa": seed["nameJa"],
                        "catalogEventId": mainshock.get("eventId", ""),
                        "windowId": window["windowId"],
                        "windowType": window["windowType"],
                        "radiusKm": round(float(window["radiusKm"]), 3),
                        "windowBasis": window.get("basis", ""),
                        "daysAfter": days_after,
                        "magnitudeThreshold": threshold,
                        "combinedScore": score["scores"]["combined"],
                        "tidalLunarScore": score["scores"]["tidal_lunar_only"],
                        "mundaneSymbolicScore": score["scores"]["mundane_symbolic_only"],
                        **metrics,
                    }
                )
    return event_row, results, []


def evaluate_controls(config: dict, weights: dict) -> tuple[list[dict], list[dict]]:
    controls = scan_control_periods(config, weights)
    rows = []
    errors = []
    for item in controls:
        try:
            start = parse_time(item["datetime"])
            end = start + timedelta(days=30)
            region = next(r for r in config["falseAlarmScan"]["regions"] if r["id"] == item["regionId"])
            params = {
                "starttime": iso(start),
                "endtime": iso(end),
                "latitude": region["latitude"],
                "longitude": region["longitude"],
                "maxradiuskm": 500,
                "minmagnitude": 4.5,
            }
            payload = fetch_usgs_geojson(
                params,
                BASE_DIR / "data" / "cache",
                BASE_DIR / "data" / "raw",
                BASE_DIR / "data" / "metadata",
                config.get("userAgent", "KOYOMI research"),
            )
            events = parse_usgs_geojson(payload)
            major = [event for event in events if (event.get("magnitude") or 0) >= config["falseAlarmScan"]["minMagnitudeForMajor"]]
            rows.append({**item, "catalogEventCountM45": len(events), "majorEventCount": len(major), "falseAlarmCandidate": item["controlType"] == "high_score_period" and len(major) == 0})
        except Exception as error:
            errors.append({"control": item, "error": str(error)})
            rows.append({**item, "catalogEventCountM45": "", "majorEventCount": "", "falseAlarmCandidate": "", "error": str(error)})
    return rows, errors


def run_validation() -> dict:
    config = load_json(BASE_DIR / "config" / "validation_config.json")
    cohort = load_json(BASE_DIR / "config" / "event_cohort.json")["events"]
    weights = load_json(BASE_DIR / "config" / "score_weights.json")
    outputs = BASE_DIR / "outputs"
    processed = BASE_DIR / "data" / "processed"
    outputs.mkdir(parents=True, exist_ok=True)
    processed.mkdir(parents=True, exist_ok=True)
    append_log("KOYOMI earthquake validation started")
    event_rows = []
    window_rows = []
    errors = []
    for seed in cohort:
        try:
            event_row, rows, event_errors = evaluate_event(seed, config, weights)
            event_rows.append(event_row)
            window_rows.extend(rows)
            errors.extend(event_errors)
            append_log(f"processed {seed['id']} rows={len(rows)}")
        except Exception as error:
            errors.append({"cohortId": seed["id"], "error": str(error), "traceback": traceback.format_exc()})
            append_log(f"failed {seed['id']}: {error}")
    control_rows, control_errors = evaluate_controls(config, weights)
    errors.extend(control_errors)
    stats_rows = summarize_score_relationship(window_rows)
    sensitivity_rows = sensitivity_summary(window_rows)
    catalog_rows = [
        {
            "cohortId": row["cohortId"],
            "confirmationStatus": row["confirmationStatus"],
            "source": row["source"],
            "magnitudeType": row["magnitudeType"],
            "catalogCompletenessNote": "Mc not estimated in stdlib baseline; use M4.5 primary and review by region.",
        }
        for row in event_rows
    ]
    missed_rows = [row for row in event_rows if row.get("combinedScore") not in ("", None) and float(row["combinedScore"]) < 40]
    summary = {
        "schemaId": "koyomi-earthquake-validation-summary-v1",
        "sources": ["USGS ComCat FDSN Event API"],
        "fetchedEventCount": sum(int(row.get("eventCount") or 0) for row in window_rows if row.get("daysAfter") == 30 and row.get("windowId") == "r1000km" and row.get("magnitudeThreshold") == 4.0),
        "excludedEventCount": 0,
        "cohortProcessed": len(event_rows),
        "cohortFailed": len(cohort) - len(event_rows),
        "windowResultCount": len(window_rows),
        "controlPeriodCount": len(control_rows),
        "statisticalTestCount": len(stats_rows),
        "effectSummary": stats_rows[0] if stats_rows else "not available",
        "conclusion": "\u7814\u7a76\u7d99\u7d9a\u3002\u63a2\u7d22\u30b3\u30db\u30fc\u30c8\u3068\u6a19\u6e96\u30e9\u30a4\u30d6\u30e9\u30ea\u57fa\u76e4\u3067\u306f\u63a1\u7528\u5224\u65ad\u3092\u884c\u308f\u305a\u3001\u72ec\u7acb\u30db\u30fc\u30eb\u30c9\u30a2\u30a6\u30c8\u3068\u591a\u91cd\u6bd4\u8f03\u88dc\u6b63\u5f8c\u306e\u518d\u73fe\u6027\u78ba\u8a8d\u304c\u5fc5\u8981\u3067\u3059\u3002",
        "koyomiDecision": "\u691c\u8a3c\u304c\u72ec\u7acb\u30c7\u30fc\u30bf\u3067\u5341\u5206\u306b\u78ba\u8a8d\u3055\u308c\u308b\u307e\u3067\u306f\u3001KOYOMI\u672c\u4f53\u3078\u5730\u9707\u4e88\u77e5\u30fb\u8b66\u5831\u30fb\u78ba\u7387\u8868\u793a\u3068\u3057\u3066\u642d\u8f09\u3057\u307e\u305b\u3093\u3002\u7814\u7a76\u8868\u793a\u3092\u884c\u3046\u5834\u5408\u3082\u516c\u7684\u6a5f\u95a2\u60c5\u5831\u3092\u512a\u5148\u3059\u308b\u6ce8\u610f\u66f8\u304d\u3092\u5fc5\u9808\u306b\u3057\u307e\u3059\u3002",
        "openIssues": [
            "ISC/ISC-GEM/JMA fallback ingestion is scaffolded but not yet implemented.",
            "Finite fault polygons and slab-depth classification require external geologic datasets.",
            "Poisson regression, ROC-AUC, PR-AUC, calibration, and FDR correction require the next statistics phase.",
            "Event cohort seed values are re-confirmed by catalog search where USGS returns candidates; remaining not_confirmed cases need human review.",
        ],
        "errors": errors,
    }
    write_csv(outputs / "event_level_results.csv", event_rows)
    write_csv(outputs / "window_level_results.csv", window_rows)
    write_csv(outputs / "high_score_false_alarms.csv", control_rows)
    write_csv(outputs / "missed_events.csv", missed_rows)
    write_csv(outputs / "catalog_completeness.csv", catalog_rows)
    write_csv(outputs / "statistical_tests.csv", stats_rows)
    write_csv(outputs / "sensitivity_analysis.csv", sensitivity_rows)
    write_json(outputs / "validation_summary.json", summary)
    write_json(processed / "event_level_results.json", {"events": event_rows})
    write_markdown_report(outputs / "validation_report.md", summary)
    xlsx_status = write_xlsx(
        outputs / "validation_report.xlsx",
        {
            "Summary": [summary],
            "Events": event_rows,
            "Sources": catalog_rows,
            "Windows": window_rows[:5000],
            "Controls": control_rows,
            "Stats": stats_rows,
            "Sensitivity": sensitivity_rows,
            "Issues": errors,
        },
    )
    summary["xlsxStatus"] = xlsx_status
    write_json(outputs / "validation_summary.json", summary)
    append_log("KOYOMI earthquake validation completed")
    return summary


def main() -> None:
    summary = run_validation()
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
