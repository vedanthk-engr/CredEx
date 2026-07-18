from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME

router = APIRouter(prefix="/api/signals", tags=["alternate-signals"])

@router.post("/skills")
async def connect_skills(
    msme_id: str = Form(...),
    skills_string: str = Form(...), # e.g. "NSDC Digital Literacy:NSDC|PMKVY Retail:PMKVY"
    db: AsyncSession = Depends(get_db)
):
    """Links DigiLocker skills credentials to the MSME."""
    result = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = result.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    msme.skill_certificates = skills_string
    await db.commit()
    return {"status": "success", "message": "DigiLocker skills credentials connected successfully."}

@router.post("/electricity")
async def connect_electricity(
    msme_id: str = Form(...),
    consumption_series: str = Form(...), # e.g. "120,135,140,110..."
    db: AsyncSession = Depends(get_db)
):
    """Links monthly electricity consumption metrics to the MSME."""
    result = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = result.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    msme.electricity_consumption_series = consumption_series
    await db.commit()
    return {"status": "success", "message": "DISCOM meter linked successfully."}

@router.post("/whatsapp")
async def connect_whatsapp(
    msme_id: str = Form(...),
    active: bool = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Links WhatsApp Business API metadata to the MSME."""
    result = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = result.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    msme.whatsapp_active = active
    await db.commit()
    return {"status": "success", "message": f"WhatsApp Business metadata link: {active}"}

@router.post("/ondc")
async def connect_ondc(
    msme_id: str = Form(...),
    active: bool = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Links ONDC seller dashboard velocity signals to the MSME."""
    result = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = result.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    msme.ondc_seller = active
    await db.commit()
    return {"status": "success", "message": f"ONDC seller account link: {active}"}
