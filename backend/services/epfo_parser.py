import numpy as np

class EPFOParserService:
    def parse_ecr_summary(self, ecr_data: dict) -> dict:
        """
        Parses EPFO ECR summary.
        Expected keys in ecr_data:
            - filings: list of dicts [{"month": "2024-01", "filed_on_time": bool, "contribution": float, "employee_count": int}]
        """
        filings = ecr_data.get("filings", [])
        if not filings:
            return {
                "epfo_regularity_score": 100.0,  # default if not registered/exempt
                "workforce_trend": 0.0,
                "payroll_stability": 1.0,
                "payroll_stress_flag": False,
                "current_employees": 0,
                "new_joinees_last_q": 0,
                "exits_last_q": 0
            }

        total_months = len(filings)
        months_filed_on_time = sum(1 for f in filings if f.get("filed_on_time", False))
        
        epfo_regularity_score = (months_filed_on_time / total_months) * 100.0 if total_months > 0 else 100.0

        # Workforce trend (current vs 6 months ago, or oldest available)
        employee_counts = [f.get("employee_count", 0) for f in filings]
        current_employees = employee_counts[-1] if employee_counts else 0
        
        # Look back 6 months, or as far back as possible
        lookback_index = max(0, len(filings) - 7)
        employees_6mo_ago = employee_counts[lookback_index] if len(filings) > lookback_index else current_employees
        
        if employees_6mo_ago > 0:
            workforce_trend = (current_employees - employees_6mo_ago) / employees_6mo_ago
        else:
            workforce_trend = 0.0

        # Payroll stability
        contributions = [f.get("contribution", 0.0) for f in filings]
        mean_contribution = np.mean(contributions) if contributions else 0.0
        std_dev = np.std(contributions) if contributions else 0.0
        
        if mean_contribution > 0:
            payroll_stability = 1.0 - (std_dev / mean_contribution)
            payroll_stability = max(0.0, min(1.0, payroll_stability))
        else:
            payroll_stability = 1.0

        # Flag consecutive missed months
        consecutive_missed = 0
        max_consecutive_missed = 0
        for f in filings:
            # If contribution is 0 or not filed, count as missed
            if f.get("contribution", 0) == 0:
                consecutive_missed += 1
                max_consecutive_missed = max(max_consecutive_missed, consecutive_missed)
            else:
                consecutive_missed = 0
                
        payroll_stress_flag = max_consecutive_missed >= 2

        # Mock quarterly join/exit estimates from differences
        new_joinees = 0
        exits = 0
        # Check last 3 months
        last_3_months = filings[-3:] if len(filings) >= 3 else filings
        for idx in range(1, len(last_3_months)):
            diff = last_3_months[idx].get("employee_count", 0) - last_3_months[idx-1].get("employee_count", 0)
            if diff > 0:
                new_joinees += diff
            elif diff < 0:
                exits += abs(diff)

        return {
            "epfo_regularity_score": round(epfo_regularity_score, 1),
            "workforce_trend": round(workforce_trend, 2),
            "payroll_stability": round(payroll_stability, 2),
            "payroll_stress_flag": payroll_stress_flag,
            "current_employees": current_employees,
            "new_joinees_last_q": new_joinees,
            "exits_last_q": exits
        }

epfo_parser = EPFOParserService()
