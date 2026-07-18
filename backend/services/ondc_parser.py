import numpy as np

class ONDCParserService:
    def parse_dashboard_data(self, ondc_data: dict) -> dict:
        """
        Parses ONDC dashboard metadata.
        Expected keys:
            - monthly_order_counts: list of integers [last 6 months]
            - avg_order_value: float
            - return_rate: float (between 0.0 and 1.0)
            - seller_rating: float (between 1.0 and 5.0)
            - repeat_customer_rate: float (between 0.0 and 1.0)
        """
        counts = ondc_data.get("monthly_order_counts", [])
        avg_value = float(ondc_data.get("avg_order_value", 0.0))
        return_rate = float(ondc_data.get("return_rate", 0.05))
        seller_rating = float(ondc_data.get("seller_rating", 4.0))
        repeat_rate = float(ondc_data.get("repeat_customer_rate", 0.15))

        if not counts:
            return {
                "has_ondc": False,
                "ondc_composite_score": 0.0,
                "order_growth_trend": 0.0,
                "quality_score": 0.0,
                "loyalty_score": 0.0
            }

        # 1. Order growth trend (MoM slope over 6 months)
        n = len(counts)
        x = np.arange(n)
        slope, _ = np.polyfit(x, counts, 1)
        mean_counts = np.mean(counts)
        order_growth_trend = slope / mean_counts if mean_counts > 0 else 0.0

        # 2. Quality Score
        # quality_score = (1 - return_rate) * seller_rating / 5
        quality_score = (1.0 - return_rate) * (seller_rating / 5.0)
        quality_score = max(0.0, min(1.0, quality_score))

        # 3. Loyalty Score
        loyalty_score = repeat_rate

        # 4. Composite ONDC score (weighted average)
        # Convert trend to 0-1 range (cap at +50% or -50%)
        trend_score = (order_growth_trend + 0.5) / 1.0 # map [-0.5, 0.5] to [0, 1]
        trend_score = max(0.0, min(1.0, trend_score))

        composite = (0.4 * trend_score) + (0.4 * quality_score) + (0.2 * loyalty_score)
        ondc_composite_score = composite * 100.0

        return {
            "has_ondc": True,
            "ondc_composite_score": round(ondc_composite_score, 1),
            "order_growth_trend": round(order_growth_trend * 100, 1), # as percentage MoM
            "quality_score": round(quality_score * 100, 1),
            "loyalty_score": round(loyalty_score * 100, 1),
            "avg_order_value": avg_value,
            "recent_orders_sum": sum(counts)
        }

ondc_parser = ONDCParserService()
