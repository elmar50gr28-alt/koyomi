from __future__ import annotations

import csv
import json
from pathlib import Path


def cell_value(value):
    if isinstance(value, (dict, list, tuple)):
        return json.dumps(value, ensure_ascii=False)
    return value


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fields = sorted({key for row in rows for key in row.keys()})
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_markdown_report(path: Path, summary: dict) -> None:
    lines = [
        "# KOYOMI \u5730\u9707\u6d3b\u52d5\u30fb\u30de\u30f3\u30c7\u30f3\u4eee\u8aac \u904e\u53bb\u691c\u8a3c\u30ec\u30dd\u30fc\u30c8",
        "",
        "\u3053\u306e\u30ec\u30dd\u30fc\u30c8\u306f\u7814\u7a76\u7528\u3067\u3059\u3002\u5730\u9707\u4e88\u77e5\u3001\u767a\u751f\u78ba\u7387\u3001\u65e5\u6642\u6307\u5b9a\u306e\u8b66\u5831\u3001\u5b89\u5168\u5ba3\u8a00\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
        "",
        "## \u7d50\u8ad6",
        "",
        summary.get("conclusion", "\u7814\u7a76\u7d99\u7d9a"),
        "",
        "## \u30c7\u30fc\u30bf\u53d6\u5f97",
        "",
        f"- \u4f7f\u7528\u30c7\u30fc\u30bf\u6e90: {', '.join(summary.get('sources', []))}",
        f"- \u53d6\u5f97\u30a4\u30d9\u30f3\u30c8\u4ef6\u6570: {summary.get('fetchedEventCount', 0)}",
        f"- \u9664\u5916\u4ef6\u6570: {summary.get('excludedEventCount', 0)}",
        "",
        "## \u4e3b\u8a55\u4fa1",
        "",
        f"- 20\u5730\u9707\u30b3\u30db\u30fc\u30c8\u51e6\u7406\u4ef6\u6570: {summary.get('cohortProcessed', 0)}",
        f"- \u7a93\u5225\u7d50\u679c\u4ef6\u6570: {summary.get('windowResultCount', 0)}",
        f"- \u7a7a\u632f\u308a\u30fb\u5bfe\u7167\u5019\u88dc\u4ef6\u6570: {summary.get('controlPeriodCount', 0)}",
        "",
        "## \u7d71\u8a08",
        "",
        f"- \u7d71\u8a08\u691c\u5b9a\u4ef6\u6570: {summary.get('statisticalTestCount', 0)}",
        f"- \u52b9\u679c\u91cf\u8981\u7d04: {summary.get('effectSummary', 'not available')}",
        "",
        "## KOYOMI\u642d\u8f09\u5224\u65ad",
        "",
        summary.get("koyomiDecision", "\u691c\u8a3c\u304c\u72ec\u7acb\u30c7\u30fc\u30bf\u3067\u5341\u5206\u306b\u78ba\u8a8d\u3055\u308c\u308b\u307e\u3067\u306f\u3001\u30a2\u30d7\u30ea\u672c\u4f53\u3078\u4e88\u6e2c\u30fb\u8b66\u5831\u3068\u3057\u3066\u642d\u8f09\u3057\u306a\u3044\u3002"),
        "",
        "## \u672a\u89e3\u6c7a",
        "",
    ]
    for item in summary.get("openIssues", []):
        lines.append(f"- {item}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_xlsx(path: Path, sheets: dict[str, list[dict]]) -> str:
    try:
        from openpyxl import Workbook
    except Exception as error:
        return f"skipped: openpyxl unavailable ({error})"
    wb = Workbook()
    first = True
    for name, rows in sheets.items():
        ws = wb.active if first else wb.create_sheet()
        first = False
        ws.title = name[:31]
        if not rows:
            ws.append(["no data"])
            continue
        fields = sorted({key for row in rows for key in row.keys()})
        ws.append(fields)
        for row in rows:
            ws.append([cell_value(row.get(field, "")) for field in fields])
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)
    return "written"
