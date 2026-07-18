import numpy as np

class ElectricityScorerService:
    def __init__(self):
        # Heavy power-use sectors based on 2-digit NIC prefixes
        self.heavy_power_prefixes = {
            "10", "13", "14", "15", "16", "17", "20", "21", "22", "23", "24", "25", "28", "29", "31", "52"
        }

    def evaluate_consumption(self, nic_code: str, kwh_series: list[float], gst_series: list[float]) -> dict:
        """
        Evaluates electricity bills against GST revenue.
        kwh_series and gst_series should represent the same 12-month period.
        """
        nic_prefix = nic_code[:2] if len(nic_code) >= 2 else ""
        is_heavy_sector = nic_prefix in self.heavy_power_prefixes

        if not kwh_series or not gst_series or len(kwh_series) < 3 or len(gst_series) < 3:
            return {
                "has_electricity_data": False,
                "is_heavy_power_sector": is_heavy_sector,
                "power_utilization_trend": 0.0,
                "phantom_production_flag": False,
                "under_reporting_signal": False
            }

        # Align lengths if mismatched
        min_len = min(len(kwh_series), len(gst_series))
        kwh_aligned = kwh_series[-min_len:]
        gst_aligned = gst_series[-min_len:]

        # 1. Power utilization trend (MoM slope over the period)
        x = np.arange(min_len)
        slope_kwh, _ = np.polyfit(x, kwh_aligned, 1)
        mean_kwh = np.mean(kwh_aligned)
        power_utilization_trend = slope_kwh / mean_kwh if mean_kwh > 0 else 0.0

        # 2. Phantom Production Flag
        # If GST shows stable turnover but power consumption dropped > 30%
        # Compare average of last 3 months to average of first 9 months (or preceding period)
        recent_kwh = np.mean(kwh_aligned[-3:])
        prev_kwh = np.mean(kwh_aligned[:-3]) if min_len > 3 else kwh_aligned[0]
        
        recent_gst = np.mean(gst_aligned[-3:])
        prev_gst = np.mean(gst_aligned[:-3]) if min_len > 3 else gst_aligned[0]
        
        kwh_drop_pct = (prev_kwh - recent_kwh) / prev_kwh if prev_kwh > 0 else 0.0
        gst_drop_pct = (prev_gst - recent_gst) / prev_gst if prev_gst > 0 else 0.0

        # Flag triggers if power dropped >30% but GST revenue dropped <10% (i.e. revenue is stable or rising)
        phantom_production_flag = (kwh_drop_pct > 0.30) and (gst_drop_pct < 0.10) and is_heavy_sector

        # 3. Under-reporting signal (Growth proxy)
        # Power consumption is rising faster than GST (power growth > 15%, revenue growth < 5%)
        # Approximate growth rates: (recent - prev) / prev
        kwh_growth = -kwh_drop_pct
        gst_growth = -gst_drop_pct
        
        under_reporting_signal = (kwh_growth > 0.15) and (gst_growth < 0.05)

        return {
            "has_electricity_data": True,
            "is_heavy_power_sector": is_heavy_sector,
            "power_utilization_trend": round(power_utilization_trend * 100, 1), # as MoM %
            "phantom_production_flag": phantom_production_flag,
            "under_reporting_signal": under_reporting_signal,
            "avg_monthly_kwh": round(mean_kwh, 1)
        }

electricity_scorer = ElectricityScorerService()
