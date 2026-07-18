import json
import asyncio
import datetime
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import Assessment, RoadmapAction, NetworkSnapshot

# Import services
from backend.services.stl_decomposer import stl_decomposer
from backend.services.cohort_engine import cohort_engine
from backend.services.scorer import credit_scorer
from backend.services.epfo_parser import epfo_parser
from backend.services.cashflow_engine import cashflow_engine
from backend.services.network_graph import network_graph
from backend.services.drift_detector import drift_detector
from backend.services.climate_scorer import climate_scorer
from backend.services.ondc_parser import ondc_parser
from backend.services.electricity_scorer import electricity_scorer
from backend.services.skill_scorer import skill_scorer
from backend.services.whatsapp_scorer import whatsapp_scorer
from backend.services.zk_proof import zk_proof_service
from backend.services.roadmap_generator import roadmap_generator

router = APIRouter(prefix="/api", tags=["streaming"])

ASSESSMENT_STEPS = [
    ("validating", "Validating business identity...", 5),
    ("gst_pull", "Extracting GST filing patterns...", 15),
    ("upi_analysis", "Analyzing UPI transaction flows...", 25),
    ("epfo_parse", "Processing EPFO payroll data...", 35),
    ("stl_decompose", "Decomposing revenue time-series...", 45),
    ("cashflow", "Computing cashflow resilience metrics...", 55),
    ("network_build", "Mapping payment network graph...", 65),
    ("cohort_assign", "Assigning to peer cohort...", 75),
    ("scoring", "Computing cohort-relative scores...", 85),
    ("shap_explain", "Generating score explanations...", 90),
    ("zk_proof", "Generating ZK proof certificate...", 95),
    ("roadmap", "Preparing improvement roadmap...", 98),
    ("complete", "Health card ready!", 100)
]

@router.get("/stream/{msme_id}")
async def stream_assessment(msme_id: str):
    """
    Server-Sent Events endpoint streaming progress for the MSME credit health card assessment.
    """
    async def event_generator():
        # Step-by-step pipeline state holder
        pipeline_data = {}
        
        # We need a db session inside the generator
        from backend.database import async_session_maker
        async with async_session_maker() as db:
            try:
                for step_key, message, progress in ASSESSMENT_STEPS:
                    # Animate latency for frontend immersion (300ms to 500ms)
                    await asyncio.sleep(0.4)
                    
                    if step_key == "validating":
                        result = await db.execute(select(MSME).where(MSME.id == msme_id))
                        msme = result.scalars().first()
                        if not msme:
                            yield f"data: {json.dumps({'error': 'MSME profile not found'})}\n\n"
                            return
                        pipeline_data["msme"] = msme
                        
                    elif step_key == "gst_pull":
                        # Validate that GST data is available
                        # If missing, populate default dummy series so scoring doesn't fail
                        if not msme.monthly_revenue_series:
                            msme.monthly_revenue_series = ",".join([str(round(120000.0 * (1.0 + (i/24.0)*0.1), 2)) for i in range(24)])
                            msme.gst_filing_dates = ",".join(["1"] * 24)
                            db.add(msme)
                            await db.commit()
                        pipeline_data["revenue_series"] = [float(x) for x in msme.monthly_revenue_series.split(",")]
                        pipeline_data["gst_filing_dates"] = [int(x) for x in msme.gst_filing_dates.split(",")]
                        
                    elif step_key == "upi_analysis":
                        if not msme.upi_inflow_series:
                            msme.upi_inflow_series = ",".join([str(round(x * 0.88, 2)) for x in pipeline_data["revenue_series"]])
                            db.add(msme)
                            await db.commit()
                        pipeline_data["upi_series"] = [float(x) for x in msme.upi_inflow_series.split(",")]
                        
                    elif step_key == "epfo_parse":
                        if not msme.epfo_contribution_series:
                            msme.epfo_contribution_series = ",".join(["0.0"] * 12)
                            db.add(msme)
                            await db.commit()
                        epfo_contribs = [float(x) for x in msme.epfo_contribution_series.split(",")]
                        # Mock an EPFO filing list
                        filings = [{"month": f"2024-{i+1:02d}", "filed_on_time": True, "contribution": val, "employee_count": msme.employee_count} for i, val in enumerate(epfo_contribs)]
                        pipeline_data["epfo"] = epfo_parser.parse_ecr_summary({"filings": filings})
                        
                    elif step_key == "stl_decompose":
                        pipeline_data["stl"] = stl_decomposer.decompose(pipeline_data["revenue_series"])
                        
                    elif step_key == "cashflow":
                        # Set default cash metrics
                        avg_monthly = sum(pipeline_data["revenue_series"][-3:]) / 3.0
                        cash_balance = avg_monthly * 0.40 # 40% of monthly revenue in cash
                        projected_inflow = avg_monthly * 0.90
                        burn_rate = avg_monthly * 0.80
                        
                        pipeline_data["cashflow"] = cashflow_engine.compute_resilience_metrics(
                            cash_balance=cash_balance,
                            projected_inflow_30d=projected_inflow,
                            monthly_burn_90d=burn_rate,
                            gst_turnover_period=sum(pipeline_data["revenue_series"][-3:]),
                            actual_receipts_period=sum(pipeline_data["upi_series"][-3:]),
                            receivables_outstanding=avg_monthly * 0.60,
                            top_customer_concentration=0.25,
                            monthly_revenue_avg=avg_monthly
                        )
                        
                    elif step_key == "network_build":
                        # Simulate 15 counterparty nodes
                        import random
                        txs = []
                        for i in range(15):
                            cp_name = f"Distributor {chr(65+i)}" if i < 5 else f"Customer {100 + i}"
                            direction = "OUT" if i < 5 else "IN"
                            amt = random.uniform(5000, 50000)
                            txs.append({
                                "counterparty": cp_name,
                                "direction": direction,
                                "amount": amt,
                                "frequency": random.randint(1, 12)
                            })
                        net_profile = network_graph.build_network_profile(msme_id, txs)
                        pipeline_data["network"] = net_profile
                        
                        # Save network snapshot to db
                        snapshot = NetworkSnapshot(
                            msme_id=msme_id,
                            snapshot_date=datetime.datetime.utcnow(),
                            node_count=net_profile["node_count"],
                            edge_count=net_profile["edge_count"],
                            in_degree_centrality=net_profile["in_degree_centrality"],
                            out_degree_centrality=net_profile["out_degree_centrality"],
                            customer_concentration=net_profile["customer_concentration"],
                            supplier_concentration=net_profile["supplier_concentration"],
                            network_resilience_score=net_profile["network_resilience_score"],
                            graph_data=net_profile["graph_data"]
                        )
                        db.add(snapshot)
                        
                    elif step_key == "cohort_assign":
                        # Average revenue quartile
                        avg_monthly = sum(pipeline_data["revenue_series"]) / 24.0
                        # Assign quartile (default 3)
                        quartile = 3
                        
                        cohort_info = cohort_engine.assign_cohort(
                            nic_code=msme.nic_code,
                            district=msme.district,
                            tier=msme.district_tier,
                            vintage_years=msme.vintage_years,
                            employee_count=msme.employee_count,
                            revenue_quartile=quartile
                        )
                        pipeline_data["cohort"] = cohort_info
                        
                        # Update MSME with assigned cohort
                        msme.cohort_id = cohort_info["cohort_id"]
                        msme.last_assessment_date = datetime.datetime.utcnow()
                        db.add(msme)
                        
                    elif step_key == "scoring":
                        # Build full scoring vector
                        # mapping pipeline variables
                        features = {
                            "stl_trend_score": 0.15 if pipeline_data["stl"]["trend_direction"] == "upward" else (-0.1 if pipeline_data["stl"]["trend_direction"] == "declining" else 0.0),
                            "stl_anomaly_count": float(len(pipeline_data["stl"]["anomalies"])),
                            "gst_regularity_rate": float(sum(pipeline_data["gst_filing_dates"]) / 24.0),
                            "upi_inflow_stability": 1.0 - (np_std := float(np.std(pipeline_data["upi_series"])) / float(np.mean(pipeline_data["upi_series"]))) if np.mean(pipeline_data["upi_series"]) > 0 else 0.5,
                            "epfo_regularity_score": pipeline_data["epfo"]["epfo_regularity_score"] / 100.0,
                            "cash_buffer_days": pipeline_data["cashflow"]["cash_buffer_days"],
                            "collection_velocity": pipeline_data["cashflow"]["collection_velocity_days"],
                            "aa_consent_score": 1.0 if msme.aa_consent_granted else 0.5,
                            "phantom_revenue_flag": 1 if pipeline_data["cashflow"]["phantom_revenue_flag"] else 0,
                            "momentum_score": 0.12, # mock momentum
                            "workforce_trend": pipeline_data["epfo"]["workforce_trend"]
                        }
                        
                        score_result = credit_scorer.score_msme(
                            cohort_id=pipeline_data["cohort"]["cohort_id"],
                            features=features
                        )
                        
                        # Apply climate adjustments
                        clim_res = climate_scorer.evaluate_resilience(msme.district, pipeline_data["revenue_series"])
                        pipeline_data["climate"] = clim_res
                        
                        # Award antifragility bonus if earned
                        final_percentile = score_result["cohort_percentile"]
                        if clim_res["earned_antifragility_bonus"]:
                            final_percentile = min(99.0, final_percentile + 5.0)
                            
                        # Apply Skill score positive modifiers
                        # Check DigiLocker skills
                        certs = []
                        if msme.skill_certificates:
                            certs = [{"name": c.split(":")[0], "issuer": c.split(":")[1] if len(c.split(":")) > 1 else "DigiLocker", "issue_date": "2024-01-15"} for c in msme.skill_certificates.split("|")]
                        skills = skill_scorer.evaluate_skills(msme.nic_code, certs)
                        if skills["has_skills"]:
                            final_percentile = min(99.0, final_percentile + skills["score_modifier"])
                            
                        score_result["cohort_percentile"] = round(final_percentile, 1)
                        pipeline_data["score"] = score_result
                        
                    elif step_key == "zk_proof":
                        zk_data = zk_proof_service.generate_proof_token(
                            msme_id=msme_id,
                            cohort_percentile=pipeline_data["score"]["cohort_percentile"],
                            cohort_label=pipeline_data["cohort"]["cohort_label"]
                        )
                        pipeline_data["zk"] = zk_data
                        
                    elif step_key == "roadmap":
                        # Generate dynamic limits
                        # limit = median_limit * percentile ratio * factors
                        cohort_median = 400000.0 # base INR 4L
                        percentile_ratio = pipeline_data["score"]["cohort_percentile"] / 50.0
                        limit = cohort_median * percentile_ratio * 1.15
                        limit = round(limit / 10000) * 10000 # round to nearest 10k
                        pipeline_data["limit"] = limit
                        
                        roadmap_data = await roadmap_generator.generate_roadmap(
                            msme_profile={
                                "business_name": msme.business_name,
                                "nic_sector_group": pipeline_data["cohort"]["sector_group"],
                                "district": msme.district,
                                "state": msme.state,
                                "cohort_label": pipeline_data["cohort"]["cohort_label"]
                            },
                            assessment_data={
                                "cohort_percentile": pipeline_data["score"]["cohort_percentile"],
                                "dimensions": pipeline_data["score"]["dimensions"],
                                "recommended_limit": limit
                            }
                        )
                        pipeline_data["roadmap"] = roadmap_data
                        
                        # Populate and save roadmap actions
                        for act in roadmap_data.get("actions", []):
                            action_row = RoadmapAction(
                                msme_id=msme_id,
                                action_text=act["action"],
                                why_it_matters=act["why_it_matters"],
                                projected_score_delta=act["projected_score_delta"],
                                projected_limit_delta=act["projected_limit_delta"],
                                timeline_days=act["timeline_days"],
                                completed=False
                            )
                            db.add(action_row)

                    elif step_key == "complete":
                        # Save final assessment record
                        assessment = Assessment(
                            msme_id=msme_id,
                            assessment_date=datetime.datetime.utcnow(),
                            cohort_percentile=pipeline_data["score"]["cohort_percentile"],
                            momentum_score=14.0, # default 14% QoQ
                            risk_level=pipeline_data["score"]["risk_level"],
                            dim_revenue_consistency=pipeline_data["score"]["dimensions"]["Revenue Consistency"],
                            dim_cashflow_resilience=pipeline_data["score"]["dimensions"]["Cashflow Resilience"],
                            dim_epfo_discipline=pipeline_data["score"]["dimensions"]["EPFO Discipline"],
                            dim_gst_regularity=pipeline_data["score"]["dimensions"]["GST Filing Regularity"],
                            dim_collection_velocity=pipeline_data["score"]["dimensions"]["Collection Velocity"],
                            dim_aa_consent=pipeline_data["score"]["dimensions"]["AA Consent Completeness"],
                            cash_buffer_days=pipeline_data["cashflow"]["cash_buffer_days"],
                            collection_velocity_days=pipeline_data["cashflow"]["collection_velocity_days"],
                            phantom_revenue_flag=pipeline_data["cashflow"]["phantom_revenue_flag"],
                            recommended_limit=pipeline_data["limit"],
                            shap_values=pipeline_data["score"]["shap_values"],
                            zk_proof_token=pipeline_data["zk"]["proof_token"],
                            drift_status="NORMAL"
                        )
                        
                        # Drift analysis
                        drift_res = drift_detector.detect_drift(
                            current_cohort_id=pipeline_data["cohort"]["cohort_id"],
                            nic_code=msme.nic_code,
                            tier=msme.district_tier,
                            vintage_years=msme.vintage_years,
                            employee_count=msme.employee_count,
                            revenue_quartile=3
                        )
                        assessment.drift_status = drift_res["drift_status"]
                        assessment.drift_type = drift_res["drift_type"]
                        
                        db.add(assessment)
                        await db.commit()

                    # Yield event back to client
                    payload = {
                        "step": step_key,
                        "message": message,
                        "progress": progress
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    
            except Exception as e:
                import traceback
                traceback.print_exc()
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")
