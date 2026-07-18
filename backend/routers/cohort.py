from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import Assessment
from backend.services.cohort_engine import cohort_engine

router = APIRouter(prefix="/api", tags=["cohort"])

@router.get("/cohort/{msme_id}")
async def get_msme_cohort(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the cohort assignment and peer archetype details for an MSME."""
    result = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = result.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME profile not found")

    if msme.cohort_id is None:
        # Assign dynamically on the fly if not set yet
        cohort_info = cohort_engine.assign_cohort(
            nic_code=msme.nic_code,
            district=msme.district,
            tier=msme.district_tier,
            vintage_years=msme.vintage_years,
            employee_count=msme.employee_count,
            revenue_quartile=3 # default quartile
        )
        msme.cohort_id = cohort_info["cohort_id"]
        await db.commit()
    else:
        # Build the label
        cohort_info = cohort_engine.assign_cohort(
            nic_code=msme.nic_code,
            district=msme.district,
            tier=msme.district_tier,
            vintage_years=msme.vintage_years,
            employee_count=msme.employee_count,
            revenue_quartile=3
        )

    # Mock peer size
    import random
    random.seed(msme.cohort_id)
    peer_size = random.randint(15, 85)

    return {
        "msme_id": msme_id,
        "cohort_id": msme.cohort_id,
        "cohort_label": cohort_info["cohort_label"],
        "sector_group": cohort_info["sector_group"],
        "peer_size": peer_size,
        "parameters": {
            "nic": msme.nic_code,
            "district": msme.district,
            "vintage_years": msme.vintage_years,
            "employee_count": msme.employee_count
        }
    }

@router.get("/drift/{msme_id}")
async def get_cohort_drift(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the genetic cohort drift status and history."""
    # Find latest assessment
    result = await db.execute(
        select(Assessment)
        .where(Assessment.msme_id == msme_id)
        .order_by(Assessment.assessment_date.desc())
    )
    assessment = result.scalars().first()
    if not assessment:
        return {
            "drift_status": "NORMAL",
            "drift_type": None,
            "message": "No assessments completed yet.",
            "history": []
        }

    # Simulate 3 months of drift history for dashboard display
    history = [
        {"date": "2026-04-18", "status": "NORMAL", "nearest_cohort": None},
        {"date": "2026-05-18", "status": "NORMAL", "nearest_cohort": None},
        {"date": "2026-06-18", "status": "NORMAL", "nearest_cohort": None},
        {
            "date": assessment.assessment_date.date().isoformat(),
            "status": assessment.drift_status or "NORMAL",
            "drift_type": assessment.drift_type,
            "nearest_cohort": "Mumbai Retail Hub · 4-7yr" if assessment.drift_status == "DRIFT_ALERT" else None
        }
    ]

    return {
        "msme_id": msme_id,
        "current_drift_status": assessment.drift_status or "NORMAL",
        "drift_type": assessment.drift_type,
        "history": history
    }
