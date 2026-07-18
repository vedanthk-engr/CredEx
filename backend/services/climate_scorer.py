import os
import json
import numpy as np

class ClimateScorerService:
    def __init__(self):
        self.climate_zones = {}
        self.load_climate_zones()
        
        # Hardcoded historical climate events (last 3 years)
        # Format: {district: {"year": int, "event_type": str, "description": str}}
        self.historical_events = {
            "nashik": {"year": 2023, "event_type": "Drought", "description": "Severe agricultural drought of 2023"},
            "chennai": {"year": 2023, "event_type": "Cyclone/Flood", "description": "Cyclone Michaung and heavy flooding of Dec 2023"},
            "surat": {"year": 2022, "event_type": "Flood", "description": "Tapi River overflow and flooding of Aug 2022"},
            "mumbai": {"year": 2023, "event_type": "Monsoon Flood", "description": "Extreme precipitation flood of July 2023"},
            "visakhapatnam": {"year": 2022, "event_type": "Cyclone", "description": "Cyclone Asani of May 2022"}
        }

    def load_climate_zones(self):
        path = "backend/data/climate_zones.json"
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    self.climate_zones = json.load(f)
            except Exception as e:
                print(f"Error loading climate zones: {e}")

    def evaluate_resilience(self, district: str, revenue_series: list[float]) -> dict:
        """
        Evaluates climate risk and checks for revenue recovery after a climate shock.
        """
        dist_key = district.lower().strip()
        risk_zone = self.climate_zones.get(dist_key, "LOW")
        
        has_event = dist_key in self.historical_events
        event_details = self.historical_events.get(dist_key) if has_event else None
        
        earned_bonus = False
        dip_month_idx = None
        recovery_month_idx = None
        
        # Scan revenue series for dip + recovery if an event occurred
        # Assume the event occurred around the middle of the 24-month series (e.g. months 10-14)
        if has_event and len(revenue_series) >= 12:
            # Let's search for a significant dip (>40% drop compared to average of first 6 months)
            baseline = np.mean(revenue_series[:6]) if len(revenue_series) >= 6 else revenue_series[0]
            
            # Find the lowest point in the middle section (months 6 to 18)
            search_start = 6
            search_end = min(18, len(revenue_series))
            
            lowest_val = baseline
            lowest_idx = None
            
            for idx in range(search_start, search_end):
                val = revenue_series[idx]
                if val < lowest_val:
                    lowest_val = val
                    lowest_idx = idx
            
            if lowest_idx is not None and baseline > 0:
                drop_pct = (baseline - lowest_val) / baseline
                if drop_pct >= 0.40:  # >40% dip
                    dip_month_idx = lowest_idx
                    
                    # Search for recovery in the following 6 months
                    rec_start = lowest_idx + 1
                    rec_end = min(lowest_idx + 7, len(revenue_series))
                    
                    for r_idx in range(rec_start, rec_end):
                        rec_val = revenue_series[r_idx]
                        # Returns to at least 90% of the baseline
                        if rec_val >= (baseline * 0.90):
                            recovery_month_idx = r_idx
                            earned_bonus = True
                            break

        # Confidence intervals (uncertainty adjustment based on climate zone)
        # Wider intervals for higher risk zones
        ci_spreads = {
            "LOW": 5.0,
            "MEDIUM": 8.0,
            "HIGH": 12.0,
            "VERY_HIGH": 18.0
        }
        ci_spread = ci_spreads.get(risk_zone, 8.0)

        return {
            "risk_zone": risk_zone,
            "has_historical_event": has_event,
            "event_details": event_details,
            "dip_detected": dip_month_idx is not None,
            "dip_month_index": dip_month_idx,
            "recovery_detected": earned_bonus,
            "recovery_month_index": recovery_month_idx,
            "earned_antifragility_bonus": earned_bonus,
            "confidence_interval_spread": ci_spread
        }

climate_scorer = ClimateScorerService()
