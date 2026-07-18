from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import Assessment, RoadmapAction
from backend.services.roadmap_generator import roadmap_generator
import datetime

router = APIRouter(prefix="/api", tags=["roadmap"])

@router.get("/roadmap/{msme_id}")
async def get_msme_roadmap(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches the roadmap actions and completion statuses."""
    # Check MSME
    msme_res = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = msme_res.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    # Fetch actions
    actions_res = await db.execute(
        select(RoadmapAction).where(RoadmapAction.msme_id == msme_id)
    )
    actions = actions_res.scalars().all()
    
    # If no actions found, generate one using local fallback
    if not actions:
        # Fetch latest assessment
        ass_res = await db.execute(
            select(Assessment)
            .where(Assessment.msme_id == msme_id)
            .order_by(Assessment.assessment_date.desc())
        )
        assessment = ass_res.scalars().first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Please score the MSME before fetching the roadmap.")
            
        c_info = {"cohort_label": "Local peer group", "sector_group": "General"}
        
        roadmap_data = await roadmap_generator.generate_roadmap(
            msme_profile={
                "business_name": msme.business_name,
                "nic_sector_group": c_info["sector_group"],
                "district": msme.district,
                "state": msme.state,
                "cohort_label": c_info["cohort_label"]
            },
            assessment_data={
                "cohort_percentile": assessment.cohort_percentile,
                "dimensions": {
                    "Revenue Consistency": assessment.dim_revenue_consistency,
                    "Cashflow Resilience": assessment.dim_cashflow_resilience,
                    "EPFO Discipline": assessment.dim_epfo_discipline,
                    "GST Filing Regularity": assessment.dim_gst_regularity,
                    "Collection Velocity": assessment.dim_collection_velocity,
                    "AA Consent Completeness": assessment.dim_aa_consent
                },
                "recommended_limit": assessment.recommended_limit
            }
        )
        
        # Populate and save
        actions = []
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
            actions.append(action_row)
        await db.commit()

    actions_list = []
    completed_count = 0
    
    for act in actions:
        if act.completed:
            completed_count += 1
        actions_list.append({
            "id": act.id,
            "action": act.action_text,
            "why_it_matters": act.why_it_matters,
            "projected_score_delta": act.projected_score_delta,
            "projected_limit_delta": act.projected_limit_delta,
            "timeline_days": act.timeline_days,
            "completed": act.completed,
            "completed_date": act.completed_date.isoformat() + "Z" if act.completed_date else None
        })

    # Side-by-side projected comparison
    # Calculate target percentile based on deltas
    total_delta = 0
    for act in actions_list:
        try:
            val = int(act["projected_score_delta"].replace(" percentile points", "").replace("+", ""))
            total_delta += val
        except Exception:
            pass

    return {
        "msme_id": msme_id,
        "actions": actions_list,
        "actions_completed": completed_count,
        "total_actions": len(actions_list),
        "committed_to_improve": msme.committed_to_improve_flag,
        "projected_percentile_uplift": f"+{total_delta} points"
    }

@router.post("/roadmap/{msme_id}")
async def generate_new_roadmap(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Regenerates the roadmap using the Claude service and saves it."""
    # Delete existing roadmap
    result = await db.execute(
        select(RoadmapAction).where(RoadmapAction.msme_id == msme_id)
    )
    for act in result.scalars().all():
        await db.delete(act)
    await db.commit()
    
    # Trigger fetch which auto-generates
    return await get_msme_roadmap(msme_id, db)

@router.patch("/roadmap/{msme_id}/complete/{action_id}")
async def complete_roadmap_action(msme_id: str, action_id: int, db: AsyncSession = Depends(get_db)):
    """Marks a roadmap action as complete and updates compliance flags."""
    # Find action
    res = await db.execute(
        select(RoadmapAction)
        .where(RoadmapAction.msme_id == msme_id)
        .where(RoadmapAction.id == action_id)
    )
    action = res.scalars().first()
    if not action:
        raise HTTPException(status_code=404, detail="Roadmap action not found")

    action.completed = True
    action.completed_date = datetime.datetime.utcnow()
    
    # Check how many are completed now
    msme_res = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = msme_res.scalars().first()
    
    actions_res = await db.execute(
        select(RoadmapAction).where(RoadmapAction.msme_id == msme_id)
    )
    all_actions = actions_res.scalars().all()
    completed_count = sum(1 for a in all_actions if a.completed)
    
    # Flag: if MSME completes 2+ roadmap actions -> committed_to_improve = True
    if completed_count >= 2:
        msme.committed_to_improve_flag = True
        db.add(msme)

    await db.commit()

    return {
        "status": "success",
        "action_id": action_id,
        "completed": True,
        "completed_count": completed_count,
        "committed_to_improve": msme.committed_to_improve_flag
    }
