import os
import pickle
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

# Fallback import for lightgbm
try:
    import lightgbm as lgb
    USE_LGB = True
except ImportError:
    USE_LGB = False
    print("LightGBM not installed. Using RandomForestClassifier as fallback.")

# Feature bands mapping
def get_vintage_band(years):
    if years <= 1.0: return 1
    elif years <= 2.0: return 2
    elif years <= 4.0: return 3
    elif years <= 7.0: return 4
    else: return 5

def get_workforce_band(count):
    if count <= 5: return 1
    elif count <= 15: return 2
    elif count <= 50: return 3
    else: return 4

def get_tier_level(tier):
    tier_map = {"Tier 1": 4, "Tier 2": 3, "Tier 3": 2, "Rural": 1}
    return tier_map.get(tier, 2)

def extract_features(df):
    X = []
    
    for idx, row in df.iterrows():
        # Parse series
        rev_series = [float(x) for x in row["monthly_revenue_series"].split(",")]
        gst_series = [int(x) for x in row["gst_filing_dates"].split(",")]
        upi_series = [float(x) for x in row["upi_inflow_series"].split(",")]
        
        epfo_str = row["epfo_contribution_series"]
        epfo_series = [float(x) for x in epfo_str.split(",")] if epfo_str else [0.0] * 12
        
        # 1. STL Trend & Anomaly mock-like computation
        # (This acts as feature engineering. Actual service will use statsmodels)
        rev_mean = np.mean(rev_series)
        rev_std = np.std(rev_series) if np.std(rev_series) > 0 else 1.0
        
        # Simple trend slope
        x_vals = np.arange(len(rev_series))
        slope, _ = np.polyfit(x_vals, rev_series, 1)
        stl_trend_score = slope / rev_mean if rev_mean > 0 else 0
        
        # Residual anomalies (deviation from trend line)
        trend_line = slope * x_vals + np.mean(rev_series) - slope * np.mean(x_vals)
        residuals = np.array(rev_series) - trend_line
        res_std = np.std(residuals) if np.std(residuals) > 0 else 1.0
        stl_anomaly_count = sum(1 for r in residuals if abs(r) > 2 * res_std)
        
        # 2. GST regularity rate
        gst_regularity_rate = np.mean(gst_series)
        
        # 3. UPI Inflow Stability
        upi_mean = np.mean(upi_series)
        upi_std = np.std(upi_series) if np.std(upi_series) > 0 else 1.0
        upi_inflow_stability = 1.0 - (upi_std / upi_mean) if upi_mean > 0 else 0.0
        
        # 4. EPFO regularity score
        has_epfo = any(x > 0 for x in epfo_series)
        if has_epfo:
            epfo_regularity_score = sum(1 for x in epfo_series if x > 0) / len(epfo_series)
        else:
            epfo_regularity_score = 1.0  # exempt
            
        # 5. Cash buffer days
        avg_monthly_rev = np.mean(rev_series[-3:])
        avg_daily_burn = (avg_monthly_rev * 0.8) / 30.0
        cash_balance = float(row["cash_balance"])
        projected_inflow_30d = avg_monthly_rev * 0.9
        cash_buffer_days = (cash_balance + projected_inflow_30d) / avg_daily_burn if avg_daily_burn > 0 else 30.0
        
        # 6. Collection velocity (in days)
        # outstanding / avg_monthly_rev * 30
        receivables = float(row["receivables_outstanding"])
        collection_velocity = (receivables / avg_monthly_rev * 30.0) if avg_monthly_rev > 0 else 30.0
        
        # 7. AA consent score
        aa_consent_score = 1.0 if int(row["ondc_seller"]) == 1 else 0.8
        
        # 8. Phantom revenue flag
        phantom_revenue_flag = 1 if (np.sum(rev_series) > 2.5 * np.sum(upi_series)) else 0
        
        # 9. Momentum score
        # Last 90 days vs same 90 days last year
        last_90d = np.sum(rev_series[-3:])
        prev_90d = np.sum(rev_series[9:12]) # Month 10,11,12 of previous year (approximate same period)
        momentum_score = (last_90d - prev_90d) / prev_90d if prev_90d > 0 else 0.0
        
        # 10. Workforce trend
        # current employees vs 6 months ago (approximate)
        workforce_trend = random_workforce_trend = random_workforce_trend = 0.05  # placeholder or from employee count
        # In synthetic data we can mock workforce trend:
        workforce_trend = 0.1 if int(row["employee_count"]) > 20 else 0.0
        
        X.append([
            stl_trend_score, stl_anomaly_count, gst_regularity_rate, upi_inflow_stability,
            epfo_regularity_score, cash_buffer_days, collection_velocity, aa_consent_score,
            phantom_revenue_flag, momentum_score, workforce_trend
        ])
        
    cols = [
        "stl_trend_score", "stl_anomaly_count", "gst_regularity_rate", "upi_inflow_stability",
        "epfo_regularity_score", "cash_buffer_days", "collection_velocity", "aa_consent_score",
        "phantom_revenue_flag", "momentum_score", "workforce_trend"
    ]
    return pd.DataFrame(X, columns=cols)

def train_pipeline():
    df = pd.read_csv("backend/ml/data/synthetic_msmes.csv")
    print(f"Loaded synthetic dataset. Shape: {df.shape}")
    
    # 1. Feature Engineering
    X_features = extract_features(df)
    
    # Add sector and tier for cohort clustering features
    # revenue quartile within sector
    df["rev_mean"] = df["monthly_revenue_series"].apply(lambda s: np.mean([float(x) for x in s.split(",")]))
    df["rev_quartile"] = df.groupby("nic_code")["rev_mean"].transform(lambda x: pd.qcut(x, 4, labels=False, duplicates='drop') + 1)
    
    # Construct clustering vector
    # Features: nic_code (encoded), district_tier, vintage_years, employee_count, revenue_quartile
    nic_unique = sorted(df["nic_code"].unique())
    nic_map = {n: i for i, n in enumerate(nic_unique)}
    
    cluster_features = []
    for idx, row in df.iterrows():
        vintage_b = get_vintage_band(row["vintage_years"])
        workforce_b = get_workforce_band(row["employee_count"])
        tier_l = get_tier_level(row["district_tier"])
        rev_q = row["rev_quartile"]
        nic_enc = nic_map.get(row["nic_code"], 0)
        cluster_features.append([nic_enc, tier_l, vintage_b, workforce_b, rev_q])
        
    cluster_df = pd.DataFrame(cluster_features, columns=["nic", "tier", "vintage", "workforce", "rev_q"])
    
    # Scale clustering features
    scaler = StandardScaler()
    scaled_cluster_features = scaler.fit_transform(cluster_df)
    
    # Cluster using K-Means (k=800)
    # If samples = 5000, 800 clusters means ~6 samples per cluster.
    # Let's adjust k to 500 or keep 800. The prompt specifies exactly k=800. Let's use 800.
    k_clusters = 800
    kmeans = KMeans(n_clusters=k_clusters, random_state=42, n_init=10)
    df["cohort_id"] = kmeans.fit_predict(scaled_cluster_features)
    
    # Save the clustering model and scaler
    with open("backend/ml/models/cluster_model.pkl", "wb") as f:
        pickle.dump(kmeans, f)
    with open("backend/ml/models/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open("backend/ml/models/nic_map.pkl", "wb") as f:
        pickle.dump(nic_map, f)
        
    # Scale scoring features
    scoring_scaler = StandardScaler()
    scaled_scoring_features = scoring_scaler.fit_transform(X_features)
    
    with open("backend/ml/models/scoring_scaler.pkl", "wb") as f:
        pickle.dump(scoring_scaler, f)
        
    # Train scoring model for each cohort
    # Save models in a directory
    os.makedirs("backend/ml/models/cohort_models", exist_ok=True)
    
    # Train a global parent-cohort model first
    if USE_LGB:
        parent_model = lgb.LGBMClassifier(random_state=42, n_estimators=50, verbose=-1)
    else:
        parent_model = RandomForestClassifier(random_state=42, n_estimators=50)
        
    parent_model.fit(scaled_scoring_features, df["good_borrower"])
    
    with open("backend/ml/models/parent_model.pkl", "wb") as f:
        pickle.dump(parent_model, f)
        
    cohort_sizes = df["cohort_id"].value_counts()
    print(f"Cohort size distribution: mean={cohort_sizes.mean():.1f}, min={cohort_sizes.min()}, max={cohort_sizes.max()}")
    
    trained_count = 0
    fallback_count = 0
    
    for c in range(k_clusters):
        cohort_mask = df["cohort_id"] == c
        cohort_size = sum(cohort_mask)
        
        # If size >= 10, train specific model
        if cohort_size >= 10:
            X_c = scaled_scoring_features[cohort_mask]
            y_c = df.loc[cohort_mask, "good_borrower"]
            
            # Check class balance
            if len(y_c.unique()) > 1:
                if USE_LGB:
                    clf = lgb.LGBMClassifier(random_state=42, n_estimators=20, verbose=-1)
                else:
                    clf = RandomForestClassifier(random_state=42, n_estimators=20)
                clf.fit(X_c, y_c)
                
                with open(f"backend/ml/models/cohort_models/cohort_{c}.pkl", "wb") as f:
                    pickle.dump(clf, f)
                trained_count += 1
                continue
                
        # If less than 10 or single-class, map to parent
        fallback_count += 1
        # Save a reference to parent model for simplicity
        with open(f"backend/ml/models/cohort_models/cohort_{c}.pkl", "wb") as f:
            pickle.dump(parent_model, f)
            
    print(f"Clustering and training pipeline finished.")
    print(f"Trained {trained_count} cohort-specific models and set {fallback_count} to fallback (parent) model.")

if __name__ == "__main__":
    train_pipeline()
