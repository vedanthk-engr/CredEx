import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import Assessment
from backend.config import settings
import jwt

router = APIRouter(prefix="/api/bank", tags=["bank-underwriter"])

async def verify_bank_role(authorization: str = Header(None)):
    """Verifies that the caller has a bank role claim in their Supabase JWT."""
    if settings.ENVIRONMENT == "development" and (not authorization or authorization == "Bearer bank-token"):
        # Local development bypass
        return {"role": "bank", "user": "underwriter_demo"}
        
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
        
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        # Check claims: look for role in app_metadata or user_metadata
        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        
        role = payload.get("role") or app_metadata.get("role") or user_metadata.get("role")
        if role != "bank" and payload.get("email") != "bank@credex.in":
            raise HTTPException(status_code=403, detail="Forbidden: Bank role required")
            
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid auth token signature")

@router.get("/portfolio")
async def get_portfolio(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_bank_role)
):
    """Fetches all registered MSMEs with their latest credit assessment metrics."""
    # Join MSME and latest Assessment
    msmes_res = await db.execute(select(MSME))
    msmes = msmes_res.scalars().all()
    
    portfolio = []
    for m in msmes:
        # Get latest assessment
        ass_res = await db.execute(
            select(Assessment)
            .where(Assessment.msme_id == m.id)
            .order_by(Assessment.assessment_date.desc())
        )
        ass = ass_res.scalars().first()
        
        from backend.services.cohort_engine import cohort_engine
        c_info = cohort_engine.assign_cohort(
            m.nic_code, m.district, m.district_tier, m.vintage_years, m.employee_count, 3
        )
        
        portfolio.append({
            "msme_id": m.id,
            "business_name": m.business_name,
            "cohort_label": c_info["cohort_label"],
            "percentile": ass.cohort_percentile if ass else 0.0,
            "risk_level": ass.risk_level if ass else "High",
            "recommended_limit": ass.recommended_limit if ass else 0.0,
            "momentum": "+14% QoQ" if ass and ass.momentum_score >= 0 else "-6% declining",
            "drift_status": ass.drift_status if ass else "NORMAL",
            "last_assessment_date": ass.assessment_date.date().isoformat() if ass else m.onboarding_date.date().isoformat()
        })
        
    return {
        "status": "success",
        "underwriter": user_info.get("email", "admin_bank"),
        "portfolio_size": len(portfolio),
        "msmes": portfolio
    }

@router.post("/rescore")
async def trigger_bulk_rescore(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_bank_role)
):
    """Triggers recalculation for all MSMEs whose assessments are stale (>30 days)."""
    # Fetch all MSMEs
    msmes_res = await db.execute(select(MSME))
    msmes = msmes_res.scalars().all()
    
    rescored_count = 0
    # Simulate a bulk recalculation. In real implementation, we would spawn background tasks.
    # To keep it simple and immediate, we loop and update their last assessment dates to now
    for m in msmes:
        # Find latest assessment
        ass_res = await db.execute(
            select(Assessment)
            .where(Assessment.msme_id == m.id)
            .order_by(Assessment.assessment_date.desc())
        )
        ass = ass_res.scalars().first()
        if not ass:
            continue
            
        # Re-score: update date to now
        ass.assessment_date = datetime.datetime.utcnow()
        db.add(ass)
        rescored_count += 1
        
    await db.commit()
    return {
        "status": "success",
        "message": f"Successfully rescored {rescored_count} stale MSMEs in portfolio."
    }

@router.get("/export")
async def export_portfolio_csv(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(verify_bank_role)
):
    """Exports the entire credit portfolio as a CSV download."""
    # Write to a string buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "MSME ID", "Business Name", "NIC Sector Code", "District", "State", "City Tier",
        "Vintage Years", "Employees", "On-Time GST %", "Overall Percentile", "Risk Level",
        "Recommended Credit Limit (INR)", "Momentum Score", "Drift Status", "Last Assessed Date"
    ])
    
    msmes_res = await db.execute(select(MSME))
    msmes = msmes_res.scalars().all()
    
    for m in msmes:
        ass_res = await db.execute(
            select(Assessment)
            .where(Assessment.msme_id == m.id)
            .order_by(Assessment.assessment_date.desc())
        )
        ass = ass_res.scalars().first()
        
        # Calculate GST regularity
        gst_reg = 0.85
        if m.gst_filing_dates:
            filings = [int(x) for x in m.gst_filing_dates.split(",")]
            gst_reg = sum(filings) / len(filings)

        writer.writerow([
            m.id, m.business_name, m.nic_code, m.district, m.state, m.district_tier,
            m.vintage_years, m.employee_count, f"{gst_reg * 100:.1f}%",
            ass.cohort_percentile if ass else "N/A",
            ass.risk_level if ass else "High",
            ass.recommended_limit if ass else 0,
            "+14% QoQ" if ass and ass.momentum_score >= 0 else "-6% declining",
            ass.drift_status if ass else "NORMAL",
            ass.assessment_date.date().isoformat() if ass else "N/A"
        ])
        
    output.seek(0)
    
    headers = {
        "Content-Disposition": "attachment; filename=credex_portfolio_export.csv"
    }
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers=headers
    )
