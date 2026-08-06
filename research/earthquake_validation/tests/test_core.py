from __future__ import annotations

from datetime import datetime, timezone
import unittest

from research.earthquake_validation.src.mundane_score import score_for_datetime
from research.earthquake_validation.src.outcome_metrics import metrics_for_window
from research.earthquake_validation.src.rupture_scaling import rupture_length_km, rupture_windows
from research.earthquake_validation.src.spatial_windows import haversine_km


class EarthquakeValidationCoreTests(unittest.TestCase):
    def test_distance_core(self) -> None:
        distance = haversine_km(38.297, 142.373, 38.5, 142.5)
        self.assertGreater(distance, 20)
        self.assertLess(distance, 30)

    def test_rupture_windows(self) -> None:
        result = rupture_length_km(9.1, "megathrust")
        self.assertGreater(result["ruptureLengthKm"], 500)
        windows = rupture_windows(7.5, "strike_slip", [1, 2, 3])
        self.assertEqual([item["windowId"] for item in windows], ["1L", "2L", "3L"])

    def test_mundane_score_shape(self) -> None:
        weights = {
            "modelId": "test",
            "weights": {
                "syzygy": 0.22,
                "lunarDistance": 0.18,
                "tidalProxy": 0.2,
                "outerHardAspect": 0.16,
                "lunarTrigger": 0.14,
                "regionalAngle": 0.1,
            },
        }
        score = score_for_datetime(datetime(2011, 3, 11, 5, 46, tzinfo=timezone.utc), 38.297, 142.373, weights)
        self.assertGreaterEqual(score["scores"]["combined"], 0)
        self.assertLessEqual(score["scores"]["combined"], 100)
        self.assertIn("tidalProxy", score["components"])
        self.assertIn("ではありません", score["disclaimer"])

    def test_window_metrics(self) -> None:
        mainshock = {
            "originTime": "2020-01-01T00:00:00Z",
            "latitude": 0.0,
            "longitude": 0.0,
            "depthKm": 10.0,
        }
        events = [
            {"eventId": "a", "originTime": "2020-01-01T12:00:00Z", "latitude": 0.1, "longitude": 0.1, "depthKm": 12.0, "magnitude": 4.6},
            {"eventId": "b", "originTime": "2020-01-02T12:00:00Z", "latitude": 5.0, "longitude": 5.0, "depthKm": 10.0, "magnitude": 5.2},
        ]
        metrics = metrics_for_window(mainshock, events, 100, 3, 4.5)
        self.assertEqual(metrics["eventCount"], 1)
        self.assertEqual(metrics["thresholdCount"], 1)
        self.assertGreater(metrics["totalSeismicMomentNm"], 0)


if __name__ == "__main__":
    unittest.main()
