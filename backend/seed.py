import asyncio
import datetime
import random
import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.config import settings
from backend.database import Base, engine
from backend.models.msme import MSME
from backend.models.assessment import Assessment, VoiceDiaryEntry, RoadmapAction, NetworkSnapshot
from backend.services.cohort_engine import cohort_engine
from backend.services.zk_proof import zk_proof_service

async def seed_data():
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Force create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database tables recreated.")
    
    # 10 MSMEs definitions
    msme_defs = [
        {
            "id": "DEMO_01",
            "name": "Priya's Fresh Kitchen",
            "nic": "56", # Food Services & QSR
            "district": "coimbatore",
            "state": "Tamil Nadu",
            "tier": "Tier 2",
            "vintage": 3.2,
            "employees": 8,
            "percentile": 72.0,
            "limit": 420000.0,
            "risk": "Low",
            "flags": {},
            "signals": {"whatsapp": True}
        },
        {
            "id": "DEMO_02",
            "name": "Ram Auto Parts",
            "nic": "29", # Auto Components
            "district": "surat",
            "state": "Gujarat",
            "tier": "Tier 2",
            "vintage": 5.0,
            "employees": 12,
            "percentile": 58.0,
            "limit": 280000.0,
            "risk": "Medium",
            "flags": {},
            "signals": {}
        },
        {
            "id": "DEMO_03",
            "name": "Meena Textiles",
            "nic": "13", # Textile Manufacturing
            "district": "tirupur",
            "state": "Tamil Nadu",
            "tier": "Tier 2",
            "vintage": 8.5,
            "employees": 45,
            "percentile": 81.0,
            "limit": 650000.0,
            "risk": "Low",
            "flags": {},
            "signals": {"skills": "NSDC Textile Weaver:NSDC"}
        },
        {
            "id": "DEMO_04",
            "name": "Singh Cold Chain",
            "nic": "52", # Cold Storage
            "district": "ludhiana",
            "state": "Punjab",
            "tier": "Tier 2",
            "vintage": 1.5,
            "employees": 16,
            "percentile": 34.0,
            "limit": 120000.0,
            "risk": "High",
            "flags": {"payroll_stress": True},
            "signals": {}
        },
        {
            "id": "DEMO_05",
            "name": "Kavya Diagnostics",
            "nic": "86", # Health Services
            "district": "bangalore",
            "state": "Karnataka",
            "tier": "Tier 1",
            "vintage": 4.1,
            "employees": 9,
            "percentile": 65.0,
            "limit": 310000.0,
            "risk": "Low",
            "signals": {}
        },
        {
            "id": "DEMO_06",
            "name": "Arjun Agro Inputs",
            "nic": "01", # Agri Retail
            "district": "nashik",
            "state": "Maharashtra",
            "tier": "Tier 2",
            "vintage": 2.8,
            "employees": 4,
            "percentile": 44.0,
            "limit": 150000.0,
            "risk": "Medium",
            "flags": {"antifragility_bonus": True},
            "signals": {}
        },
        {
            "id": "DEMO_07",
            "name": "Ravi Electronics Hub",
            "nic": "47", # Electronics Retail
            "district": "chennai",
            "state": "Tamil Nadu",
            "tier": "Tier 1",
            "vintage": 6.0,
            "employees": 11,
            "percentile": 76.0,
            "limit": 520000.0,
            "risk": "Low",
            "signals": {"ondc": True}
        },
        {
            "id": "DEMO_08",
            "name": "Fatima Garments",
            "nic": "14", # Apparel Manufacturing
            "district": "hyderabad",
            "state": "Telangana",
            "tier": "Tier 1",
            "vintage": 3.5,
            "employees": 22,
            "percentile": 61.0,
            "limit": 380000.0,
            "risk": "Medium",
            "signals": {"skills": "NSDC Apparel Design:NSDC"}
        },
        {
            "id": "DEMO_09",
            "name": "Kiran Pharma Depot",
            "nic": "46", # Pharma Wholesale
            "district": "pune",
            "state": "Maharashtra",
            "tier": "Tier 1",
            "vintage": 11.2,
            "employees": 14,
            "percentile": 88.0,
            "limit": 850000.0,
            "risk": "Low",
            "flags": {"committed_borrower": True},
            "signals": {}
        },
        {
            "id": "DEMO_10",
            "name": "Suresh Bricks & Tiles",
            "nic": "23", # Construction Materials
            "district": "jaipur",
            "state": "Rajasthan",
            "tier": "Tier 2",
            "vintage": 5.4,
            "employees": 32,
            "percentile": 28.0,
            "limit": 150000.0,
            "risk": "High",
            "flags": {"electricity_drop": True},
            "signals": {}
        }
    ]
    
    async with async_session() as db:
        for d in msme_defs:
            # Generate financial series
            random.seed(d["id"])
            base_rev = d["limit"] * 0.8
            revs = [round(base_rev * random.uniform(0.85, 1.15), 2) for _ in range(24)]
            
            # For Suresh Bricks, show a drop in electricity
            has_elec = d.get("flags", {}).get("electricity_drop", False)
            if has_elec:
                elec_series = [1500, 1450, 1400, 1380, 1390, 1420, 1410, 1380, 1350, 950, 920, 910] # drop by >35%
            else:
                elec_series = [round(d["employees"] * 100 * random.uniform(0.9, 1.1), 1) for _ in range(12)]
                
            # For Arjun Agro Inputs, show a climate shock dip (month 12) and recovery
            if d.get("flags", {}).get("antifragility_bonus", False):
                revs = [round(base_rev * random.uniform(0.9, 1.1), 2) for _ in range(12)] + \
                       [round(base_rev * 0.45, 2)] + \
                       [round(base_rev * (0.5 + i * 0.1), 2) for i in range(5)] + \
                       [round(base_rev * random.uniform(0.9, 1.1), 2) for _ in range(6)]

            # Formulate EPFO ECR
            if d["employees"] > 10:
                epfo_series = [round(d["employees"] * 1800 * random.uniform(0.9, 1.1), 2) for _ in range(12)]
                if d.get("flags", {}).get("payroll_stress", False):
                    # missed consecutive 2 months
                    epfo_series[-3] = 0.0
                    epfo_series[-2] = 0.0
            else:
                epfo_series = [0.0] * 12
                
            # Build MSME entity
            msme = MSME(
                id=d["id"],
                business_name=d["name"],
                nic_code=d["nic"],
                district=d["district"],
                state=d["state"],
                district_tier=d["tier"],
                vintage_years=d["vintage"],
                employee_count=d["employees"],
                onboarding_date=datetime.datetime.utcnow() - datetime.timedelta(days=45),
                aa_consent_granted=True,
                aa_consent_timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=45),
                cohort_id=None, # will resolve below
                last_assessment_date=datetime.datetime.utcnow() - datetime.timedelta(days=5),
                committed_borrower_flag=d.get("flags", {}).get("committed_borrower", False),
                committed_to_improve_flag=False,
                monthly_revenue_series=",".join(map(str, revs)),
                upi_inflow_series=",".join(map(str, [round(r * 0.88, 2) for r in revs])),
                epfo_contribution_series=",".join(map(str, epfo_series)),
                electricity_consumption_series=",".join(map(str, elec_series)),
                skill_certificates=d["signals"].get("skills"),
                whatsapp_active=d["signals"].get("whatsapp", False),
                ondc_seller=d["signals"].get("ondc", False)
            )
            
            # Resolve cohort
            c_info = cohort_engine.assign_cohort(
                msme.nic_code, msme.district, msme.district_tier, msme.vintage_years, msme.employee_count, 3
            )
            msme.cohort_id = c_info["cohort_id"]
            db.add(msme)
            
            # Generate ZK proof
            zk_data = zk_proof_service.generate_proof_token(d["id"], d["percentile"], c_info["cohort_label"])
            
            # Build Assessment
            # Map dimensions around the overall percentile
            p = d["percentile"]
            assessment = Assessment(
                msme_id=d["id"],
                assessment_date=datetime.datetime.utcnow() - datetime.timedelta(days=5),
                cohort_percentile=p,
                momentum_score=14.0 if d["id"] != "DEMO_04" else -6.0,
                risk_level=d["risk"],
                dim_revenue_consistency=round(max(10, min(99, p + random.uniform(-8, 8))), 1),
                dim_cashflow_resilience=round(max(10, min(99, p + random.uniform(-8, 8))), 1),
                dim_epfo_discipline=round(max(10, min(99, p + random.uniform(-8, 8))), 1),
                dim_gst_regularity=round(max(10, min(99, p + random.uniform(-8, 8))), 1),
                dim_collection_velocity=round(max(10, min(99, p + random.uniform(-8, 8))), 1),
                dim_aa_consent=90.0,
                cash_buffer_days=48.0 if d["id"] != "DEMO_04" else 8.0,
                collection_velocity_days=24.0 if d["id"] != "DEMO_10" else 72.0,
                phantom_revenue_flag=False,
                recommended_limit=d["limit"],
                shap_values={
                    "Revenue Consistency": 0.12 if p > 50 else -0.08,
                    "Cashflow Resilience": 0.15 if p > 50 else -0.15,
                    "EPFO Discipline": 0.08 if d["id"] != "DEMO_04" else -0.22,
                    "GST Filing Regularity": 0.10,
                    "Collection Velocity": 0.09 if d["id"] != "DEMO_10" else -0.18,
                    "AA Consent Completeness": 0.05
                },
                zk_proof_token=zk_data["proof_token"],
                drift_status="NORMAL",
                drift_type=None
            )
            db.add(assessment)
            
            # If rejected/low score, pre-generate roadmap
            if p < 50.0:
                roadmaps = {
                    "DEMO_04": [
                        {"action": "Regularize EPFO filings and clear outstanding payroll dues.", "why": "Lenders need consistency in payroll disbursements to verify corporate stability.", "s_delta": "+12 points", "l_delta": "+₹40K"},
                        {"action": "Increase cash buffer days above 15 days by routing more collections to current account.", "why": "High cash runaways protect the business from insolvency.", "s_delta": "+10 points", "l_delta": "+₹30K"},
                        {"action": "Connect secondary bank statements via Account Aggregator.", "why": "Broadening data disclosure reduces perceived risk premiums.", "s_delta": "+6 points", "l_delta": "+₹15K"}
                    ],
                    "DEMO_10": [
                        {"action": "Automate invoice collections via UPI reminders to reduce collection velocity under 30 days.", "why": "High collection velocity prevents working capital blocks.", "s_delta": "+15 points", "l_delta": "+₹50K"},
                        {"action": "Investigate and resolve drop in factory power utilization.", "why": "DISCOM proxies show under-utilized assets which raises operational risks.", "s_delta": "+10 points", "l_delta": "+₹35K"},
                        {"action": "Maintain positive sentiment in weekly voice diary logs.", "why": "Engaged operations are treated favorably by scoring models.", "s_delta": "+5 points", "l_delta": "+₹15K"}
                    ]
                }
                
                actions = roadmaps.get(d["id"], [])
                for idx, act in enumerate(actions):
                    db_act = RoadmapAction(
                        msme_id=d["id"],
                        action_text=act["action"],
                        why_it_matters=act["why"],
                        projected_score_delta=act["s_delta"],
                        projected_limit_delta=act["l_delta"],
                        timeline_days=30 if idx == 0 else (60 if idx == 1 else 90),
                        completed=False
                    )
                    db.add(db_act)
                    
            # Build network snapshot
            net_nodes = [
                {"id": f"cp_{d['id']}_0", "label": "Self", "group": "center", "size": 30}
            ]
            net_links = []
            for i in range(12):
                cp_id = f"cp_{d['id']}_{i+1}"
                direction = "OUT" if i < 4 else "IN"
                grp = "supplier" if direction == "OUT" else "customer"
                net_nodes.append({
                    "id": cp_id,
                    "label": f"Vendor {chr(65+i)}" if direction == "OUT" else f"Retailer {100+i}",
                    "group": grp,
                    "size": random.randint(10, 22)
                })
                net_links.append({
                    "source": cp_id if direction == "IN" else f"cp_{d['id']}_0",
                    "target": f"cp_{d['id']}_0" if direction == "IN" else cp_id,
                    "weight": round(random.uniform(5000, 35000), 2),
                    "frequency": random.randint(1, 10)
                })
                
            snapshot = NetworkSnapshot(
                msme_id=d["id"],
                snapshot_date=datetime.datetime.utcnow() - datetime.timedelta(days=5),
                node_count=len(net_nodes),
                edge_count=len(net_links),
                in_degree_centrality=0.67,
                out_degree_centrality=0.33,
                customer_concentration=0.35,
                supplier_concentration=0.45,
                network_resilience_score=0.55,
                graph_data={"nodes": net_nodes, "links": net_links}
            )
            db.add(snapshot)
            
            # Kiran Pharma (Committed Borrower) - seed 8 weekly checkins
            if d["id"] == "DEMO_09":
                for i in range(8):
                    week_entry = VoiceDiaryEntry(
                        msme_id="DEMO_09",
                        entry_date=datetime.datetime.utcnow() - datetime.timedelta(weeks=8-i),
                        transcript=f"Week {i+1} summary. We served around {20 + i*5} customers. No unexpected expenses. Collections are smooth.",
                        customer_count=20 + i*5,
                        unexpected_expense=False,
                        pending_payments=False,
                        sentiment_score=0.45 + i*0.05,
                        sentiment_label="Positive"
                    )
                    db.add(week_entry)

        await db.commit()
    print("Database successfully seeded with 10 demo MSMEs!")

if __name__ == "__main__":
    asyncio.run(seed_data())
