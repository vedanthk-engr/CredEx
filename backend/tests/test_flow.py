import sys
import os

# Append project root to path to allow absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import unittest
from backend.services.stl_decomposer import stl_decomposer
from backend.services.cohort_engine import cohort_engine
from backend.services.scorer import credit_scorer
from backend.services.zk_proof import zk_proof_service
from backend.services.voice_diary import voice_diary_service
from backend.services.climate_scorer import climate_scorer
from backend.services.ondc_parser import ondc_parser
from backend.services.electricity_scorer import electricity_scorer
from backend.services.skill_scorer import skill_scorer
from backend.services.whatsapp_scorer import whatsapp_scorer

class TestCredexFlows(unittest.TestCase):
    def test_stl_decomposer(self):
        # Generate 24-month trend + seasonal revenue
        rev_series = [100000.0 * (1.0 + (i/24.0)*0.8) for i in range(24)]
        res = stl_decomposer.decompose(rev_series)
        self.assertIn("trend_direction", res)
        self.assertIn("revenue_consistency_score", res)
        self.assertEqual(res["trend_direction"], "upward")
        self.assertGreaterEqual(res["revenue_consistency_score"], 50)

    def test_cohort_engine(self):
        res = cohort_engine.assign_cohort(
            nic_code="56102", # QSR Restaurant
            district="coimbatore",
            tier="Tier 2",
            vintage_years=2.5,
            employee_count=8,
            revenue_quartile=3
        )
        self.assertIn("cohort_id", res)
        self.assertIn("cohort_label", res)
        self.assertTrue(0 <= res["cohort_id"] < 800)
        self.assertIn("Coimbatore", res["cohort_label"])

    def test_credit_scorer(self):
        features = {
            "stl_trend_score": 0.05,
            "stl_anomaly_count": 0.0,
            "gst_regularity_rate": 0.95,
            "upi_inflow_stability": 0.85,
            "epfo_regularity_score": 0.90,
            "cash_buffer_days": 35.0,
            "collection_velocity": 24.0,
            "aa_consent_score": 1.0,
            "phantom_revenue_flag": 0,
            "momentum_score": 0.14,
            "workforce_trend": 0.05
        }
        res = credit_scorer.score_msme(cohort_id=142, features=features)
        self.assertIn("cohort_percentile", res)
        self.assertIn("risk_level", res)
        self.assertIn("dimensions", res)
        self.assertGreaterEqual(res["cohort_percentile"], 1.0)
        self.assertLessEqual(res["cohort_percentile"], 100.0)

    def test_zk_proof(self):
        proof = zk_proof_service.generate_proof_token(
            msme_id="DEMO_01",
            cohort_percentile=78.5,
            cohort_label="Coimbatore QSR · 2-4yr"
        )
        self.assertIn("proof_token", proof)
        self.assertIn("public_verification_url", proof)
        self.assertEqual(proof["percentile_band"], "top-25")

        verify_res = zk_proof_service.verify_proof_token(proof["proof_token"])
        self.assertTrue(verify_res["valid"])
        self.assertEqual(verify_res["percentile_band"], "top-25")
        self.assertEqual(verify_res["msme_id"], "DEMO_01")

    def test_voice_nlp(self):
        text = "We served around fifty-five customers this week. We did not have any unexpected expenses, but we have two pending invoices."
        extracted = voice_diary_service.extract_structured_data(text)
        self.assertEqual(extracted["customer_count"], 50) # Fallback / word-match
        self.assertFalse(extracted["unexpected_expense"])
        self.assertTrue(extracted["pending_payments"])
        
        score, label = voice_diary_service.analyze_sentiment(text)
        self.assertIn(label, ["Positive", "Negative", "Neutral"])

    def test_climate_scorer_recovery(self):
        # surviving drought dip + recovery
        revs = [100000.0] * 12 + [40000.0] + [50000.0, 70000.0, 95000.0] + [100000.0] * 7
        res = climate_scorer.evaluate_resilience("nashik", revs)
        self.assertTrue(res["dip_detected"])
        self.assertTrue(res["recovery_detected"])
        self.assertTrue(res["earned_antifragility_bonus"])
        self.assertEqual(res["risk_zone"], "VERY_HIGH")

    def test_alternate_signals(self):
        # ONDC
        ondc_res = ondc_parser.parse_dashboard_data({
            "monthly_order_counts": [10, 12, 14, 16, 18, 20],
            "avg_order_value": 350.0,
            "return_rate": 0.05,
            "seller_rating": 4.5,
            "repeat_customer_rate": 0.20
        })
        self.assertTrue(ondc_res["has_ondc"])
        self.assertGreater(ondc_res["ondc_composite_score"], 40.0)

        # Electricity
        elec_res = electricity_scorer.evaluate_consumption(
            nic_code="13110", # Textile
            kwh_series=[100, 105, 110, 108, 112, 115, 118, 120, 122, 70, 68, 65], # drop
            gst_series=[100000] * 12 # stable
        )
        self.assertTrue(elec_res["phantom_production_flag"])

        # Skills
        skill_res = skill_scorer.evaluate_skills("01110", [
            {"name": "NSDC Agri Crop Management", "issuer": "NSDC", "issue_date": "2025-06-01"}
        ])
        self.assertTrue(skill_res["has_skills"])
        self.assertGreater(skill_res["score_modifier"], 0.0)

        # WhatsApp
        wa_res = whatsapp_scorer.score_metadata({
            "total_messages": 500,
            "unique_contacts": 110,
            "avg_response_time_minutes": 15.0,
            "active_hours_per_day": 8.0,
            "monthly_volumes": [400, 450, 500]
        })
        self.assertTrue(wa_res["has_whatsapp"])
        self.assertGreater(wa_res["whatsapp_vitality_score"], 50.0)

if __name__ == "__main__":
    unittest.main()
