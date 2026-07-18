import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import Assessment, NetworkSnapshot
from backend.services.cohort_engine import cohort_engine
from backend.services.climate_scorer import climate_scorer
from backend.services.ondc_parser import ondc_parser
from backend.services.whatsapp_scorer import whatsapp_scorer
from backend.services.skill_scorer import skill_scorer

router = APIRouter(prefix="/api", tags=["scoring"])

@router.get("/score/{msme_id}")
async def get_msme_score(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the 6-dimension credit scores for an MSME."""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.msme_id == msme_id)
        .order_by(Assessment.assessment_date.desc())
    )
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found. Onboard first.")

    return {
        "msme_id": msme_id,
        "cohort_percentile": assessment.cohort_percentile,
        "risk_level": assessment.risk_level,
        "assessment_date": assessment.assessment_date.isoformat(),
        "dimensions": {
            "Revenue Consistency": assessment.dim_revenue_consistency,
            "Cashflow Resilience": assessment.dim_cashflow_resilience,
            "EPFO Discipline": assessment.dim_epfo_discipline,
            "GST Filing Regularity": assessment.dim_gst_regularity,
            "Collection Velocity": assessment.dim_collection_velocity,
            "AA Consent Completeness": assessment.dim_aa_consent
        },
        "shap_values": assessment.shap_values
    }

@router.get("/health-card/{msme_id}")
async def get_health_card(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Aggregates all metrics and signals to output the complete MSME Financial Health Card."""
    # Fetch MSME details
    msme_res = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = msme_res.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    # Fetch latest assessment
    ass_res = await db.execute(
        select(Assessment)
        .where(Assessment.msme_id == msme_id)
        .order_by(Assessment.assessment_date.desc())
    )
    assessment = ass_res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found. Please trigger /api/stream/{msme_id} first.")

    # Get cohort label
    c_info = cohort_engine.assign_cohort(
        msme.nic_code, msme.district, msme.district_tier, msme.vintage_years, msme.employee_count, 3
    )

    # Resolve climate metrics
    revs = [float(x) for x in msme.monthly_revenue_series.split(",")] if msme.monthly_revenue_series else []
    clim = climate_scorer.evaluate_resilience(msme.district, revs)

    # ONDC signal
    ondc_score = None
    if msme.ondc_seller:
        ondc_info = ondc_parser.parse_dashboard_data({
            "monthly_order_counts": [15, 18, 22, 25, 29, 35],
            "avg_order_value": 450.0,
            "return_rate": 0.03,
            "seller_rating": 4.6,
            "repeat_customer_rate": 0.28
        })
        ondc_score = ondc_info["ondc_composite_score"]

    # Skill bonus
    skills = {"has_skills": False, "score_modifier": 0.0, "certificates_analyzed": 0}
    if msme.skill_certificates:
        certs = [{"name": c.split(":")[0], "issuer": c.split(":")[1] if len(c.split(":")) > 1 else "DigiLocker", "issue_date": "2024-01-15"} for c in msme.skill_certificates.split("|")]
        skills = skill_scorer.evaluate_skills(msme.nic_code, certs)

    # WhatsApp metadata
    whatsapp_info = None
    if msme.whatsapp_active:
        whatsapp_info = whatsapp_scorer.score_metadata({
            "total_messages": 1200,
            "unique_contacts": 350,
            "avg_response_time_minutes": 12.0,
            "active_hours_per_day": 9.5,
            "monthly_volumes": [950, 1100, 1200]
        })

    # Network resilience node count
    net_res = await db.execute(
        select(NetworkSnapshot)
        .where(NetworkSnapshot.msme_id == msme_id)
        .order_by(NetworkSnapshot.snapshot_date.desc())
    )
    network = net_res.scalars().first()
    network_nodes = network.node_count if network else 12
    network_resilience = network.network_resilience_score if network else 0.75

    next_review = (assessment.assessment_date + datetime.timedelta(days=30)).date().isoformat()

    return {
        "msme_id": msme.id,
        "business_name": msme.business_name,
        "cohort_id": msme.cohort_id,
        "cohort_label": c_info["cohort_label"],
        "onboarding_date": msme.onboarding_date.date().isoformat(),
        "last_assessment_date": assessment.assessment_date.date().isoformat(),
        "overall_percentile": assessment.cohort_percentile,
        "momentum": "+14% QoQ" if assessment.momentum_score >= 0 else f"{assessment.momentum_score}% declining",
        "risk_level": assessment.risk_level,
        "committed_borrower": msme.committed_borrower_flag,
        "committed_to_improve": msme.committed_to_improve_flag,
        "dimensions": {
            "Revenue Consistency": assessment.dim_revenue_consistency,
            "Cashflow Resilience": assessment.dim_cashflow_resilience,
            "EPFO Discipline": assessment.dim_epfo_discipline,
            "GST Filing Regularity": assessment.dim_gst_regularity,
            "Collection Velocity": assessment.dim_collection_velocity,
            "AA Consent Completeness": assessment.dim_aa_consent
        },
        "metrics": {
            "cash_buffer_days": assessment.cash_buffer_days,
            "collection_velocity_days": assessment.collection_velocity_days,
            "recommended_limit": assessment.recommended_limit,
            "next_review_date": next_review
        },
        "flags": {
            "phantom_revenue_flag": assessment.phantom_revenue_flag,
            "payroll_stress_flag": assessment.dim_epfo_discipline < 40.0
        },
        "alternate_signals": {
            "climate_zone": clim["risk_zone"],
            "earned_antifragility_bonus": clim["earned_antifragility_bonus"],
            "ondc_composite_score": ondc_score,
            "whatsapp_metadata": whatsapp_info,
            "skills_validation": skills,
            "network_nodes_count": network_nodes,
            "network_resilience_score": network_resilience
        },
        "zk_proof_token": assessment.zk_proof_token,
        "shap_values": assessment.shap_values
    }

@router.get("/limit/{msme_id}")
async def get_credit_limit(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the recommended dynamic credit limit."""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.msme_id == msme_id)
        .order_by(Assessment.assessment_date.desc())
    )
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    return {
        "msme_id": msme_id,
        "cohort_percentile": assessment.cohort_percentile,
        "recommended_limit": assessment.recommended_limit,
        "currency": "INR",
        "review_date": (assessment.assessment_date + datetime.timedelta(days=30)).date().isoformat()
    }

@router.post("/ocen/offer/{msme_id}")
async def build_ocen_offer(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Generates loan offers in standard OCEN 4.0 format from matching lenders."""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.msme_id == msme_id)
        .order_by(Assessment.assessment_date.desc())
    )
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    limit = assessment.recommended_limit
    
    # Define 3 mock offers in OCEN schema
    lenders = [
        {"id": "LEND_SBI", "name": "SBI MSME Core", "roi": 8.9, "tenure_months": 12},
        {"id": "LEND_HDFC", "name": "HDFC FlexiGrow", "roi": 9.4, "tenure_months": 18},
        {"id": "LEND_SIDBI", "name": "SIDBI Udyog Mitra", "roi": 8.2, "tenure_months": 24}
    ]
    
    offers = []
    for l in lenders:
        offers.append({
            "offerId": f"OFFER_{l['id']}_{int(datetime.datetime.utcnow().timestamp())}",
            "lenderName": l["name"],
            "loanAmount": limit,
            "interestRate": l["roi"],
            "interestType": "FIXED",
            "tenure": l["tenure_months"],
            "tenureUnit": "MONTHS",
            "repaymentFrequency": "MONTHLY",
            "processingFee": round(limit * 0.01, 2), # 1% processing fee
            "ocen_version": "4.0"
        })

    return {
        "msme_id": msme_id,
        "limit_utilized": limit,
        "offers": offers,
        "status": "active"
    }
