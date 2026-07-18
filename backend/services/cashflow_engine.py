class CashflowEngineService:
    def compute_resilience_metrics(
        self,
        cash_balance: float,
        projected_inflow_30d: float,
        monthly_burn_90d: float,
        gst_turnover_period: float,
        actual_receipts_period: float,
        receivables_outstanding: float,
        top_customer_concentration: float,
        monthly_revenue_avg: float
    ) -> dict:
        """
        Computes cash buffer days, collection velocity, phantom revenue flags,
        and receivable concentrations.
        """
        # 1. Cash Buffer Days
        # Formula: (current cash + expected inflows next 30d) / (average daily burn last 90d)
        avg_daily_burn = (monthly_burn_90d / 30.0) if monthly_burn_90d > 0 else 1.0
        cash_buffer_days = (cash_balance + projected_inflow_30d) / avg_daily_burn
        
        # Risk Flags
        if cash_buffer_days < 15:
            cash_buffer_status = "HIGH_RISK"
        elif cash_buffer_days > 60:
            cash_buffer_status = "STRONG"
        else:
            cash_buffer_status = "MODERATE"

        # 2. Collection Velocity (in days)
        # Formula: (receivables_outstanding / monthly_revenue_avg) * 30 days
        if monthly_revenue_avg > 0:
            collection_velocity = (receivables_outstanding / monthly_revenue_avg) * 30.0
        else:
            collection_velocity = 30.0 # Default fallback
            
        collection_velocity = max(1.0, collection_velocity) # floor of 1 day

        # 3. Phantom Revenue Detection
        # If GST declared turnover is >2.5x UPI + AA inflows for same period -> raise phantom revenue flag
        phantom_revenue_flag = gst_turnover_period > (2.5 * actual_receipts_period) if actual_receipts_period > 0 else False

        # 4. Receivable Concentration
        # If top customer concentration > 40% -> raise flag
        receivable_concentration_flag = top_customer_concentration > 0.40

        # Collection status rating (under 30 days is excellent, above 60 is stressful)
        if collection_velocity > 60:
            collection_status = "STRESSED"
        elif collection_velocity < 30:
            collection_status = "EFFICIENT"
        else:
            collection_status = "NORMAL"

        return {
            "cash_buffer_days": round(cash_buffer_days, 1),
            "cash_buffer_status": cash_buffer_status,
            "collection_velocity_days": round(collection_velocity, 1),
            "collection_status": collection_status,
            "phantom_revenue_flag": phantom_revenue_flag,
            "receivable_concentration": round(top_customer_concentration * 100, 1),
            "receivable_concentration_flag": receivable_concentration_flag
        }

cashflow_engine = CashflowEngineService()
