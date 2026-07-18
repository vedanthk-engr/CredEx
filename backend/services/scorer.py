import os
import pickle
import numpy as np
import pandas as pd

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False
    print("SHAP not installed. Credit scorer will use custom feature impact explainer.")

class CreditScorerService:
    def __init__(self):
        self.model_dir = "backend/ml/models"
        self.parent_model = None
        self.scoring_scaler = None
        self.cohort_scores = {} # Maps cohort_id -> list of synthetic scores
        self.df_synthetic = None
        self.load_models()
        self.precompute_cohort_distributions()

    def load_models(self):
        try:
            parent_path = os.path.join(self.model_dir, "parent_model.pkl")
            scaler_path = os.path.join(self.model_dir, "scoring_scaler.pkl")
            
            if os.path.exists(parent_path):
                with open(parent_path, "rb") as f:
                    self.parent_model = pickle.load(f)
            if os.path.exists(scaler_path):
                with open(scaler_path, "rb") as f:
                    self.scoring_scaler = pickle.load(f)
                    
            synthetic_path = "backend/ml/data/synthetic_msmes.csv"
            if os.path.exists(synthetic_path):
                self.df_synthetic = pd.read_csv(synthetic_path)
        except Exception as e:
            print(f"Error loading scoring models: {e}")

    def precompute_cohort_distributions(self):
        """Precomputes the model score for all synthetic MSMEs to build peer distributions."""
        if self.df_synthetic is None or self.parent_model is None or self.scoring_scaler is None:
            return
        
        try:
            from backend.ml.train_cohort_model import extract_features
            
            # Extract features for all synthetic cases
            X_feats = extract_features(self.df_synthetic)
            scaled_feats = self.scoring_scaler.transform(X_feats)
            
            # Predict probability for all
            # For simplicity, we use the parent model to score all synthetic records to get consistent baselines
            probs = self.parent_model.predict_proba(scaled_feats)[:, 1]
            self.df_synthetic["synthetic_score"] = probs
            
            # Group by cohort_id
            # Wait, cohort_id is in the synthetic dataset.
            # Let's map cohort_id to list of scores
            from backend.services.cohort_engine import cohort_engine
            # If cohort_id is not already in synthetic data (it is added during training), we can compute it
            if "cohort_id" not in self.df_synthetic.columns:
                # Assign cohort dynamically
                cohort_ids = []
                for _, row in self.df_synthetic.iterrows():
                    # Estimate revenue quartile
                    rev = row["rev_mean"] if "rev_mean" in self.df_synthetic.columns else 100000
                    # Let's just assign a cohort id based on hash for baseline if column is missing
                    c_info = cohort_engine.assign_cohort(
                        row["nic_code"], row["district"], row["district_tier"], 
                        row["vintage_years"], row["employee_count"], 2
                    )
                    cohort_ids.append(c_info["cohort_id"])
                self.df_synthetic["cohort_id"] = cohort_ids
                
            for c_id, group in self.df_synthetic.groupby("cohort_id"):
                self.cohort_scores[int(c_id)] = sorted(group["synthetic_score"].tolist())
                
            print("Precomputed cohort score distributions successfully.")
        except Exception as e:
            print(f"Error precomputing cohort distributions: {e}")

    def score_msme(self, cohort_id: int, features: dict) -> dict:
        """
        Scores an MSME and returns the overall cohort percentile and 6-dimension breakdowns.
        Features input dict should contain the 11 feature variables.
        """
        cols = [
            "stl_trend_score", "stl_anomaly_count", "gst_regularity_rate", "upi_inflow_stability",
            "epfo_regularity_score", "cash_buffer_days", "collection_velocity", "aa_consent_score",
            "phantom_revenue_flag", "momentum_score", "workforce_trend"
        ]
        
        # Prepare vector
        vec = [features.get(c, 0.0) for c in cols]
        
        # Default fallback probability
        probability = 0.5
        shap_vals = {}
        
        # Try scoring using model
        model_loaded = False
        if self.scoring_scaler is not None:
            try:
                scaled_vec = self.scoring_scaler.transform([vec])
                
                # Check for cohort-specific model
                cohort_model_path = os.path.join(self.model_dir, "cohort_models", f"cohort_{cohort_id}.pkl")
                model_to_use = self.parent_model
                if os.path.exists(cohort_model_path):
                    with open(cohort_model_path, "rb") as f:
                        model_to_use = pickle.load(f)
                
                if model_to_use is not None:
                    probability = float(model_to_use.predict_proba(scaled_vec)[0][1])
                    model_loaded = True
                    
                    # SHAP explanation
                    if HAS_SHAP and hasattr(model_to_use, "tree_model_"): # works for lightgbm / trees
                        try:
                            explainer = shap.TreeExplainer(model_to_use)
                            shap_val = explainer.shap_values(scaled_vec)[0]
                            # If binary, shap_val might be list [neg_class, pos_class] or single array
                            if isinstance(shap_val, list):
                                shap_val = shap_val[1]
                            shap_vals = {cols[i]: float(shap_val[i]) for i in range(len(cols))}
                        except Exception:
                            pass
            except Exception as e:
                print(f"Model prediction failed: {e}")

        # Fallback SHAP/Importance calculation if SHAP failed
        if not shap_vals:
            # Heuristic explanation: difference from ideal values
            # Define approximate "ideal" or median values for features
            ideals = {
                "stl_trend_score": 0.1, "stl_anomaly_count": 0.0, "gst_regularity_rate": 1.0, 
                "upi_inflow_stability": 0.9, "epfo_regularity_score": 1.0, "cash_buffer_days": 45.0, 
                "collection_velocity": 15.0, "aa_consent_score": 1.0, "phantom_revenue_flag": 0.0, 
                "momentum_score": 0.15, "workforce_trend": 0.05
            }
            for col in cols:
                val = features.get(col, 0.0)
                ideal = ideals[col]
                # High is good for most, low is good for anomaly, collection velocity, phantom flag
                if col in ["stl_anomaly_count", "collection_velocity", "phantom_revenue_flag"]:
                    diff = ideal - val
                else:
                    diff = val - ideal
                shap_vals[col] = diff * 0.1 # scale it

        # Compute cohort-relative percentile
        # Get score distribution for this cohort
        peers = self.cohort_scores.get(cohort_id, [])
        if not peers and self.cohort_scores:
            # fallback to global distribution if cohort is empty
            peers = sorted([x for scores in self.cohort_scores.values() for x in scores])
            
        if peers:
            # Find insertion index to calculate percentile
            idx = np.searchsorted(peers, probability)
            percentile = (idx / len(peers)) * 100.0
        else:
            # absolute fallback if no distributions loaded
            percentile = probability * 100.0
            
        percentile = max(1.0, min(99.0, percentile)) # bounds

        # Risk Level classification
        if percentile >= 65.0:
            risk_level = "Low"
        elif percentile >= 40.0:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # Map features and SHAP values to 6 scoring dimensions
        # Each dimension is a percentile score (0-100) based on specific features
        
        # 1. Revenue Consistency: based on stl_trend_score & stl_anomaly_count
        rev_consistency = (features.get("stl_trend_score", 0.0) * 100.0) + (1.0 - features.get("stl_anomaly_count", 0.0)/6.0)*100.0
        rev_consistency = max(15.0, min(99.0, rev_consistency / 2.0 + 35.0))
        
        # 2. Cashflow Resilience: based on cash_buffer_days & phantom_revenue_flag
        cash_days = features.get("cash_buffer_days", 30.0)
        cash_score = 90.0 if cash_days > 45 else (cash_days / 45.0) * 90.0
        if features.get("phantom_revenue_flag", False):
            cash_score -= 30.0
        cashflow_res = max(10.0, min(99.0, cash_score))
        
        # 3. EPFO Discipline: based on epfo_regularity_score
        epfo_disc = features.get("epfo_regularity_score", 1.0) * 100.0
        epfo_disc = max(20.0, min(99.0, epfo_disc))
        
        # 4. GST Filing Regularity: based on gst_regularity_rate
        gst_reg = features.get("gst_regularity_rate", 0.8) * 100.0
        gst_reg = max(10.0, min(99.0, gst_reg))
        
        # 5. Collection Velocity: based on collection_velocity
        cv = features.get("collection_velocity", 30.0)
        cv_score = 100.0 - (cv / 90.0 * 80.0) if cv < 90 else 20.0
        collection_vel = max(15.0, min(99.0, cv_score))
        
        # 6. AA Consent Completeness: based on aa_consent_score
        aa_consent = features.get("aa_consent_score", 0.8) * 100.0
        aa_consent = max(40.0, min(99.0, aa_consent))

        # Adjust dimensions slightly so they average out close to the overall percentile (for consistency)
        dim_avg = (rev_consistency + cashflow_res + epfo_disc + gst_reg + collection_vel + aa_consent) / 6.0
        adjustment = percentile - dim_avg
        
        # Apply gentle adjustment to make dimensions align with overall percentile
        rev_consistency = max(5.0, min(99.0, rev_consistency + adjustment * 0.4))
        cashflow_res = max(5.0, min(99.0, cashflow_res + adjustment * 0.4))
        epfo_disc = max(5.0, min(99.0, epfo_disc + adjustment * 0.4))
        gst_reg = max(5.0, min(99.0, gst_reg + adjustment * 0.4))
        collection_vel = max(5.0, min(99.0, collection_vel + adjustment * 0.4))
        aa_consent = max(5.0, min(99.0, aa_consent + adjustment * 0.4))

        # Map SHAP values to dimensions
        shap_dimensions = {
            "Revenue Consistency": shap_vals.get("stl_trend_score", 0.0) - shap_vals.get("stl_anomaly_count", 0.0),
            "Cashflow Resilience": shap_vals.get("cash_buffer_days", 0.0) - shap_vals.get("phantom_revenue_flag", 0.0) * 0.5,
            "EPFO Discipline": shap_vals.get("epfo_regularity_score", 0.0) + shap_vals.get("workforce_trend", 0.0),
            "GST Filing Regularity": shap_vals.get("gst_regularity_rate", 0.0),
            "Collection Velocity": -shap_vals.get("collection_velocity", 0.0),
            "AA Consent Completeness": shap_vals.get("aa_consent_score", 0.0)
        }

        return {
            "cohort_percentile": round(percentile, 1),
            "risk_level": risk_level,
            "probability": round(probability, 4),
            "dimensions": {
                "Revenue Consistency": round(rev_consistency, 1),
                "Cashflow Resilience": round(cashflow_res, 1),
                "EPFO Discipline": round(epfo_disc, 1),
                "GST Filing Regularity": round(gst_reg, 1),
                "Collection Velocity": round(collection_vel, 1),
                "AA Consent Completeness": round(aa_consent, 1)
            },
            "shap_values": shap_dimensions
        }

credit_scorer = CreditScorerService()
