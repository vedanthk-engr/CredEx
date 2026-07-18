from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.assessment import Assessment
from backend.services.zk_proof import zk_proof_service

router = APIRouter(prefix="/api/zk", tags=["zero-knowledge"])

@router.get("/proof/{msme_id}")
async def get_zk_proof(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the latest Zero-Knowledge proof token for an MSME."""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.msme_id == msme_id)
        .order_by(Assessment.assessment_date.desc())
    )
    assessment = result.scalars().first()
    if not assessment or not assessment.zk_proof_token:
        raise HTTPException(status_code=404, detail="ZK Proof not generated. Run assessment first.")

    # Parse details
    verification_url = f"http://localhost:8000/api/zk/verify/{assessment.zk_proof_token}"

    return {
        "msme_id": msme_id,
        "zk_proof_token": assessment.zk_proof_token,
        "public_verification_url": verification_url,
        "cohort_percentile_band": "top-25" if assessment.cohort_percentile >= 75.0 else ("25-50" if assessment.cohort_percentile >= 50.0 else ("50-75" if assessment.cohort_percentile >= 25.0 else "75-100")),
        "validity_period_days": 30
    }

@router.get("/verify/{token}")
async def verify_zk_token(token: str):
    """Verifies a proof token signature and payload without exposing raw business details."""
    result = zk_proof_service.verify_proof_token(token)
    if not result.get("valid", False):
        raise HTTPException(status_code=400, detail=result.get("error", "Invalid verification token"))
    return result
