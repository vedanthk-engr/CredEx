import numpy as np
import pandas as pd

try:
    from statsmodels.tsa.seasonal import STL
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False
    print("statsmodels not installed. STL decomposer will run in fallback moving-average mode.")

class STLDecomposerService:
    def decompose(self, revenue_series: list[float]) -> dict:
        """
        Decomposes a monthly revenue series (ideally 24 months).
        Returns trend, seasonal, residuals, anomalies, and a consistency score.
        """
        n = len(revenue_series)
        # Ensure we have numeric list
        revenue_series = [float(x) for x in revenue_series]
        
        # Initialize default lists
        trend = [0.0] * n
        seasonal = [0.0] * n
        residual = [0.0] * n
        anomalies = []
        
        if n < 6:
            # Too short for any decomposition, return basic statistics
            mean_val = np.mean(revenue_series) if n > 0 else 0
            return {
                "trend_direction": "flat",
                "seasonality_profile": "insufficient_data",
                "anomalies": [],
                "revenue_consistency_score": 80.0, # default average
                "trend": [mean_val] * n,
                "seasonal": [0.0] * n,
                "residual": [0.0] * n
            }

        # Try to run statsmodels STL if available and data length >= 24 (since STL with period=12 needs enough data)
        success = False
        if HAS_STATSMODELS and n >= 24:
            try:
                # Convert to pandas series with monthly index
                series = pd.Series(
                    revenue_series, 
                    index=pd.date_range(start="2024-01-01", periods=n, freq="ME")
                )
                res = STL(series, period=12, robust=True).fit()
                trend = res.trend.tolist()
                seasonal = res.seasonal.tolist()
                residual = res.resid.tolist()
                success = True
            except Exception as e:
                print(f"Statsmodels STL failed: {e}. Falling back to manual moving-average decomposition.")

        if not success:
            # Fallback decomposition: Moving Average and Seasonal Averages
            # 1. Compute Trend (12-month rolling average or rolling mean for shorter data)
            window = 12 if n >= 12 else 3
            series = pd.Series(revenue_series)
            # Center-aligned rolling mean with border backfilling
            trend_series = series.rolling(window=window, center=True).mean()
            trend_series = trend_series.bfill().ffill()
            trend = trend_series.tolist()
            
            # Detrended series
            detrended = series - trend_series
            
            # 2. Compute Seasonality
            # Average detrended values by month index (0 to 11)
            seasonal_map = {}
            for i in range(12):
                seasonal_map[i] = []
            for i, val in enumerate(detrended):
                seasonal_map[i % 12].append(val)
                
            seasonal_avgs = {k: np.mean(v) if v else 0.0 for k, v in seasonal_map.items()}
            
            # De-mean seasonal components to ensure they sum to ~0
            seas_mean = np.mean(list(seasonal_avgs.values()))
            seasonal_avgs = {k: v - seas_mean for k, v in seasonal_avgs.items()}
            
            seasonal = [seasonal_avgs[i % 12] for i in range(n)]
            
            # 3. Residual
            residual = (series - trend_series - pd.Series(seasonal)).tolist()

        # Anomaly detection: residual > 2 standard deviations
        resid_std = np.std(residual) if np.std(residual) > 0 else 1.0
        for i, r in enumerate(residual):
            if abs(r) > 2 * resid_std:
                anomalies.append(i) # month index

        # Trend direction (slope of the trend component)
        x = np.arange(len(trend))
        slope, _ = np.polyfit(x, trend, 1)
        mean_trend = np.mean(trend)
        
        # Express slope as YoY growth rate or scale
        slope_pct = slope / mean_trend if mean_trend > 0 else 0
        if slope_pct > 0.01:
            trend_direction = "upward"
        elif slope_pct < -0.01:
            trend_direction = "declining"
        else:
            trend_direction = "flat"

        # Revenue Consistency Score calculation (percentile rating base)
        # Low residuals relative to overall revenue -> higher consistency
        coef_of_variation = resid_std / mean_trend if mean_trend > 0 else 1.0
        # Penalize anomaly count (10 points per anomaly)
        anomaly_penalty = len(anomalies) * 10
        
        # Scale score between 10 and 100
        raw_consistency = max(10, 100 - (coef_of_variation * 100) - anomaly_penalty)
        revenue_consistency_score = round(raw_consistency, 1)

        # Profile seasonality strength
        seas_std = np.std(seasonal)
        if seas_std / mean_trend > 0.05 if mean_trend > 0 else False:
            seasonality_profile = "highly_seasonal"
        else:
            seasonality_profile = "stable"

        return {
            "trend_direction": trend_direction,
            "seasonality_profile": seasonality_profile,
            "anomalies": anomalies,
            "revenue_consistency_score": revenue_consistency_score,
            "trend": [round(x, 2) for x in trend],
            "seasonal": [round(x, 2) for x in seasonal],
            "residual": [round(x, 2) for x in residual]
        }

stl_decomposer = STLDecomposerService()
