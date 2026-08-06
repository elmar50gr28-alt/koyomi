from __future__ import annotations

from math import erf, sqrt


def _normal_cdf(z: float) -> float:
    return 0.5 * (1 + erf(z / sqrt(2)))


def summarize_score_relationship(rows: list[dict]) -> list[dict]:
    out = []
    primary = [
        row
        for row in rows
        if row.get("windowType") == "radius"
        and float(row.get("radiusKm", 0)) == 500
        and float(row.get("daysAfter", 0)) == 7
        and float(row.get("magnitudeThreshold", 0)) == 4.5
    ]
    if not primary:
        return out
    scores = [float(row["combinedScore"]) for row in primary]
    counts = [float(row["thresholdCount"]) for row in primary]
    n = len(scores)
    mean_score = sum(scores) / n
    mean_count = sum(counts) / n
    cov = sum((s - mean_score) * (c - mean_count) for s, c in zip(scores, counts))
    var_s = sum((s - mean_score) ** 2 for s in scores)
    var_c = sum((c - mean_count) ** 2 for c in counts)
    corr = cov / sqrt(var_s * var_c) if var_s and var_c else 0.0
    z = corr * sqrt(max(1, n - 3))
    p = 2 * (1 - _normal_cdf(abs(z)))
    out.append(
        {
            "testId": "primary_500km_7d_m45_score_count_correlation",
            "method": "exploratory Pearson-style correlation normal approximation",
            "n": n,
            "effectSize": round(corr, 4),
            "pValueApprox": round(p, 6),
            "multipleComparisonAdjusted": "not_claimed",
            "interpretation": "research_only_no_probability_claim",
        }
    )
    return out


def sensitivity_summary(rows: list[dict]) -> list[dict]:
    groups: dict[tuple[str, float, float], list[dict]] = {}
    for row in rows:
        key = (row.get("windowType", ""), float(row.get("daysAfter", 0)), float(row.get("magnitudeThreshold", 0)))
        groups.setdefault(key, []).append(row)
    out = []
    for (window_type, days, threshold), items in sorted(groups.items()):
        counts = [float(item["thresholdCount"]) for item in items]
        out.append(
            {
                "windowType": window_type,
                "daysAfter": days,
                "magnitudeThreshold": threshold,
                "caseCount": len(items),
                "meanThresholdCount": round(sum(counts) / len(counts), 4) if counts else 0,
                "maxThresholdCount": max(counts) if counts else 0,
            }
        )
    return out
