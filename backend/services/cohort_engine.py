import os
import pickle
import numpy as np
import pandas as pd

class CohortEngine:
    def __init__(self):
        self.model_dir = "backend/ml/models"
        self.kmeans = None
        self.scaler = None
        self.nic_map = {}
        
        # Load real models if available
        self.load_models()

    def load_models(self):
        try:
            kmeans_path = os.path.join(self.model_dir, "cluster_model.pkl")
            scaler_path = os.path.join(self.model_dir, "scaler.pkl")
            nic_map_path = os.path.join(self.model_dir, "nic_map.pkl")
            
            if os.path.exists(kmeans_path) and os.path.exists(scaler_path):
                with open(kmeans_path, "rb") as f:
                    self.kmeans = pickle.load(f)
                with open(scaler_path, "rb") as f:
                    self.scaler = pickle.load(f)
                if os.path.exists(nic_map_path):
                    with open(nic_map_path, "rb") as f:
                        self.nic_map = pickle.load(f)
                print("Cohort engine models loaded successfully!")
            else:
                print("Clustering models not found. Cohort engine running in heuristic fallback mode.")
        except Exception as e:
            print(f"Error loading cohort models: {e}. Running in fallback mode.")

    def get_vintage_band(self, years: float) -> int:
        if years <= 1.0: return 1
        elif years <= 2.0: return 2
        elif years <= 4.0: return 3
        elif years <= 7.0: return 4
        else: return 5

    def get_workforce_band(self, count: int) -> int:
        if count <= 5: return 1
        elif count <= 15: return 2
        elif count <= 50: return 3
        else: return 4

    def get_tier_level(self, tier: str) -> int:
        tier_map = {"Tier 1": 4, "Tier 2": 3, "Tier 3": 2, "Rural": 1}
        return tier_map.get(tier, 2)

    def assign_cohort(self, nic_code: str, district: str, tier: str, vintage_years: float, employee_count: int, revenue_quartile: int) -> dict:
        """Assigns an MSME to a micro-cohort (0-799) and returns details."""
        vintage_b = self.get_vintage_band(vintage_years)
        workforce_b = self.get_workforce_band(employee_count)
        tier_l = self.get_tier_level(tier)
        rev_q = revenue_quartile
        
        # Sector grouping label
        # Get NIC 2 digit prefix
        nic_prefix = nic_code[:2] if len(nic_code) >= 2 else "47"
        
        # Human readable cohort label builder
        sectors_labels = {
            "01": "Agri Retail", "10": "Food Proc.", "13": "Textiles", "14": "Apparel", 
            "20": "Chemicals", "23": "Ceramics", "29": "Auto Comp.", "46": "Pharma Wholesale", 
            "47": "Retail Hub", "52": "Cold Chain", "56": "QSR Food", "62": "IT Services", 
            "86": "Healthcare"
        }
        sector_name = sectors_labels.get(nic_prefix, "Retail/Mfg")
        vintage_labels = {1: "0-1yr", 2: "1-2yr", 3: "2-4yr", 4: "4-7yr", 5: "7yr+"}
        v_lbl = vintage_labels.get(vintage_b, "2-4yr")
        
        cohort_label = f"{district.capitalize()} {sector_name} · {v_lbl} · {tier} · {employee_count} emp"

        if self.kmeans is not None and self.scaler is not None:
            try:
                # Prepare features
                nic_enc = self.nic_map.get(nic_prefix, 0)
                feat = [[nic_enc, tier_l, vintage_b, workforce_b, rev_q]]
                scaled_feat = self.scaler.transform(feat)
                cohort_id = int(self.kmeans.predict(scaled_feat)[0])
                
                return {
                    "cohort_id": cohort_id,
                    "cohort_label": cohort_label,
                    "sector_group": sector_name,
                    "tier": tier,
                    "vintage_band": v_lbl,
                    "workforce_band": f"band-{workforce_b}"
                }
            except Exception as e:
                print(f"Cohort assignment error: {e}. Falling back to hash.")
                
        # Deterministic hash-based fallback if model is missing or fails
        hash_val = hash((nic_prefix, tier_l, vintage_b, workforce_b, rev_q)) % 800
        cohort_id = abs(hash_val)
        return {
            "cohort_id": cohort_id,
            "cohort_label": cohort_label,
            "sector_group": sector_name,
            "tier": tier,
            "vintage_band": v_lbl,
            "workforce_band": f"band-{workforce_b}"
        }

cohort_engine = CohortEngine()
