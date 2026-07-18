import os
import json
import random
import pandas as pd
import numpy as np

# Ensure target directories exist
os.makedirs("backend/ml/data", exist_ok=True)
os.makedirs("backend/ml/models", exist_ok=True)

# Load helper assets if available, or define fallbacks
NIC_CODES = [
    "01", "10", "13", "14", "15", "16", "17", "20", "21", "22", "23", "24",
    "25", "28", "29", "31", "45", "46", "47", "49", "52", "56", "62", "86"
]

DISTRICTS = {
    "bangalore": ("Karnataka", "Tier 1"),
    "bengaluru": ("Karnataka", "Tier 1"),
    "chennai": ("Tamil Nadu", "Tier 1"),
    "delhi": ("Delhi", "Tier 1"),
    "mumbai": ("Maharashtra", "Tier 1"),
    "hyderabad": ("Telangana", "Tier 1"),
    "pune": ("Maharashtra", "Tier 1"),
    "kolkata": ("West Bengal", "Tier 1"),
    "coimbatore": ("Tamil Nadu", "Tier 2"),
    "surat": ("Gujarat", "Tier 2"),
    "tirupur": ("Tamil Nadu", "Tier 2"),
    "ludhiana": ("Punjab", "Tier 2"),
    "nashik": ("Maharashtra", "Tier 2"),
    "jaipur": ("Rajasthan", "Tier 2"),
    "trichy": ("Tamil Nadu", "Tier 3"),
    "jodhpur": ("Rajasthan", "Tier 3"),
    "wayanad": ("Kerala", "Rural"),
    "bastar": ("Chhattisgarh", "Rural")
}

CLIMATE_RISKS = {
    "chennai": "VERY_HIGH",
    "mumbai": "VERY_HIGH",
    "delhi": "HIGH",
    "jaipur": "HIGH",
    "surat": "HIGH",
    "nashik": "VERY_HIGH",
    "pune": "MEDIUM",
    "coimbatore": "MEDIUM",
    "ludhiana": "MEDIUM",
    "bangalore": "LOW",
    "bengaluru": "LOW",
    "hyderabad": "LOW",
    "tirupur": "LOW",
    "trichy": "LOW",
    "jodhpur": "HIGH",
    "wayanad": "VERY_HIGH",
    "bastar": "MEDIUM"
}

def generate_synthetic_data(num_samples=5000):
    np.random.seed(42)
    random.seed(42)
    
    records = []
    
    # Business names generator helpers
    prefixes = ["Raja", "Sri", "Meena", "Arjun", "Kiran", "Singh", "Suresh", "Priya", "Ram", "Bharat", "Apex", "Jaya"]
    suffixes = ["Textiles", "Agro Industries", "Foods", "Auto Parts", "Logistics", "Diagnostics", "Pharma", "Kitchen", "Hub", "Enterprises"]
    
    for i in range(num_samples):
        msme_id = f"MSME_{100000 + i}"
        name = f"{random.choice(prefixes)} {random.choice(suffixes)} {random.randint(10, 99)}"
        
        nic = random.choice(NIC_CODES)
        district = random.choice(list(DISTRICTS.keys()))
        state, tier = DISTRICTS[district]
        climate_zone = CLIMATE_RISKS.get(district, "LOW")
        
        vintage_years = round(random.uniform(0.5, 15.0), 1)
        employee_count = random.randint(1, 100)
        
        # Monthly revenue series (24 months)
        # Seasonality, trend, noise
        base_revenue = random.uniform(50000, 1500000)
        trend = random.uniform(0.9, 1.25)  # YoY growth trend factor
        seasonality = np.sin(np.linspace(0, 4 * np.pi, 24)) * 0.15 + 1.0  # 15% variation
        noise = np.random.normal(0, 0.05, 24)
        
        revenue_series = []
        for m in range(24):
            trend_factor = 1.0 + (trend - 1.0) * (m / 24.0)
            rev = base_revenue * trend_factor * seasonality[m] * (1.0 + noise[m])
            rev = max(rev, 10000.0) # floor
            revenue_series.append(round(rev, 2))
            
        # GST filing dates (24 months) - represent as boolean on-time filing rates
        # Let's say high-quality borrowers file on time >85% of time
        is_regular_gst = random.random() > 0.35
        gst_on_time_rate = random.uniform(0.85, 1.0) if is_regular_gst else random.uniform(0.3, 0.8)
        gst_filing_status = [1 if random.random() < gst_on_time_rate else 0 for _ in range(24)]
        
        # UPI inflows: highly correlated with revenue but 10-15% lower (some cash transactions)
        upi_inflow_series = []
        for rev in revenue_series:
            inflow = rev * random.uniform(0.8, 0.95)
            upi_inflow_series.append(round(inflow, 2))
            
        # EPFO summary (12 months)
        has_epfo = employee_count > 10 and random.random() > 0.15
        if has_epfo:
            epfo_contrib_base = employee_count * random.uniform(1500, 2500)
            epfo_stability = random.uniform(0.7, 1.0)
            epfo_series = [round(epfo_contrib_base * (1.0 + np.random.normal(0, 0.05)), 2) if random.random() < epfo_stability else 0.0 for _ in range(12)]
        else:
            epfo_series = [0.0] * 12
            
        # Cash balance & receivables
        avg_monthly_rev = sum(revenue_series[-3:]) / 3.0
        avg_daily_burn = (avg_monthly_rev * random.uniform(0.7, 0.9)) / 30.0
        # Expected inflows in next 30d
        projected_inflow_30d = avg_monthly_rev * random.uniform(0.8, 1.1)
        cash_balance = avg_daily_burn * random.uniform(5, 75)  # between 5 and 75 days of cash
        receivables_outstanding = avg_monthly_rev * random.uniform(0.1, 1.2)
        top_customer_concentration = random.uniform(0.05, 0.75)
        
        network_node_count = random.randint(5, 120)
        
        # Climate features
        past_climate_event = climate_zone in ["HIGH", "VERY_HIGH"] and random.random() > 0.4
        climate_recovery = past_climate_event and random.random() > 0.2
        
        # Alternate features
        ondc_seller = random.random() < 0.30
        
        # Electricity consumption (12 months) - available for 40%
        has_electricity = random.random() < 0.40
        if has_electricity:
            # correlated with revenue
            elec_base = (avg_monthly_rev / 1000.0) * random.uniform(2.0, 5.0)
            electricity_series = [round(elec_base * (rev / avg_monthly_rev) * random.uniform(0.9, 1.1), 1) for rev in revenue_series[-12:]]
        else:
            electricity_series = []
            
        # Skill certificates - 25% have them
        has_skills = random.random() < 0.25
        skill_certs = []
        if has_skills:
            certs = ["NSDC Digital Literacy", "PMKVY Retail Associate", "UDYAM Registration Cert", "SIDBI Financial Management", "NABARD Agri-Business Cert"]
            skill_certs = random.sample(certs, random.randint(1, 3))
            
        whatsapp_active = random.random() < 0.35
        
        # Derived values for labeling 'good_borrower'
        # Compute features
        gst_regularity_rate = sum(gst_filing_status) / 24.0
        cash_buffer_days = (cash_balance + projected_inflow_30d) / avg_daily_burn if avg_daily_burn > 0 else 30
        
        if has_epfo:
            months_filed_epfo = sum(1 for x in epfo_series if x > 0)
            epfo_regularity_rate = months_filed_epfo / 12.0
        else:
            epfo_regularity_rate = 1.0  # not penalized if exempt
            
        # Phantom revenue condition: GST turnover is > 2.5x actual UPI + AA inflows
        # In synthetic data, let's flag 5% of MSMEs
        phantom_revenue = random.random() < 0.05
        if phantom_revenue:
            # Inflate revenue series to be much higher than UPI series
            revenue_series = [round(upi * random.uniform(2.6, 3.2), 2) for upi in upi_inflow_series]
            
        # Define good borrower rules
        # good_borrower = gst_regularity > 0.8 AND cash_buffer > 20 AND epfo_regularity > 0.75 AND phantom_revenue = False, with 15% noise
        is_good = (
            gst_regularity_rate > 0.8 and
            cash_buffer_days > 20 and
            epfo_regularity_rate > 0.75 and
            not phantom_revenue
        )
        
        # Add 15% noise to make ML model non-trivial
        if random.random() < 0.15:
            is_good = not is_good
            
        records.append({
            "msme_id": msme_id,
            "business_name": name,
            "nic_code": nic,
            "district": district,
            "state": state,
            "district_tier": tier,
            "vintage_years": vintage_years,
            "employee_count": employee_count,
            "monthly_revenue_series": ",".join(map(str, revenue_series)),
            "gst_filing_dates": ",".join(map(str, gst_filing_status)),
            "upi_inflow_series": ",".join(map(str, upi_inflow_series)),
            "epfo_contribution_series": ",".join(map(str, epfo_series)),
            "cash_balance": cash_balance,
            "receivables_outstanding": receivables_outstanding,
            "top_customer_concentration": top_customer_concentration,
            "network_node_count": network_node_count,
            "climate_zone": climate_zone,
            "past_climate_event": 1 if past_climate_event else 0,
            "climate_recovery": 1 if climate_recovery else 0,
            "ondc_seller": 1 if ondc_seller else 0,
            "electricity_consumption_series": ",".join(map(str, electricity_series)) if has_electricity else "",
            "skill_certificates": "|".join(skill_certs),
            "whatsapp_active": 1 if whatsapp_active else 0,
            "good_borrower": 1 if is_good else 0
        })
        
    df = pd.DataFrame(records)
    df.to_csv("backend/ml/data/synthetic_msmes.csv", index=False)
    print(f"Generated {num_samples} MSME profiles successfully!")
    print(f"Good borrower distribution: {df['good_borrower'].mean() * 100:.2f}%")

if __name__ == "__main__":
    generate_synthetic_data()
