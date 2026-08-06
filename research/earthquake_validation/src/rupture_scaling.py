from __future__ import annotations

from math import pow


def rupture_length_km(magnitude: float, tectonic_type: str = "unknown") -> dict:
    """Return approximate rupture length using documented empirical forms.

    The coefficients are Wells & Coppersmith-style log10(L) = a + bM
    placeholders for research window construction. They are not used as
    hazard estimates.
    """
    family = tectonic_type or "unknown"
    if family in {"strike_slip"}:
        a, b = -3.55, 0.74
        model = "Wells-Coppersmith-1994 strike-slip form"
    elif family in {"reverse", "megathrust", "subduction"}:
        a, b = -2.86, 0.63
        model = "Wells-Coppersmith-1994 reverse/thrust form"
    elif family in {"normal"}:
        a, b = -2.57, 0.62
        model = "Wells-Coppersmith-1994 normal form"
    else:
        a, b = -3.22, 0.69
        model = "Wells-Coppersmith-1994 all-slip form"
    return {
        "ruptureLengthKm": pow(10.0, a + b * float(magnitude)),
        "model": model,
        "reviewStatus": "needs_geology_review",
    }


def rupture_windows(magnitude: float, tectonic_type: str, multipliers: list[int]) -> list[dict]:
    base = rupture_length_km(magnitude, tectonic_type)
    return [
        {
            "windowId": f"{multiplier}L",
            "radiusKm": base["ruptureLengthKm"] * multiplier,
            "basis": base["model"],
            "reviewStatus": base["reviewStatus"],
        }
        for multiplier in multipliers
    ]
