import os
import shutil
import tempfile
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.database import get_db
from backend.models.msme import MSME
from backend.models.assessment import VoiceDiaryEntry
from backend.services.voice_diary import voice_diary_service

router = APIRouter(prefix="/api", tags=["voice-diary"])

@router.post("/voice-diary/{msme_id}")
async def submit_voice_diary(
    msme_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a weekly voice check-in.
    Transcribes audio and extracts customer count, expenses, pending invoices, and sentiment.
    """
    # Verify MSME
    msme_res = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = msme_res.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    # Save UploadFile to a temporary file for Whisper
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        shutil.copyfileobj(file.file, temp)
        temp_path = temp.name

    try:
        # Run Whisper Transcription
        transcript = voice_diary_service.transcribe_audio(temp_path)
        
        # Analyze Sentiment
        sentiment_score, sentiment_label = voice_diary_service.analyze_sentiment(transcript)
        
        # Extract structured details
        extracted = voice_diary_service.extract_structured_data(transcript)
        
        # Save entry
        entry = VoiceDiaryEntry(
            msme_id=msme_id,
            entry_date=datetime.datetime.utcnow(),
            transcript=transcript,
            customer_count=extracted["customer_count"],
            unexpected_expense=extracted["unexpected_expense"],
            pending_payments=extracted["pending_payments"],
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label
        )
        db.add(entry)
        await db.commit()
        
        # Update committed_borrower_flag if they reach 8 entries
        all_res = await db.execute(
            select(VoiceDiaryEntry).where(VoiceDiaryEntry.msme_id == msme_id)
        )
        total_entries = len(all_res.scalars().all())
        if total_entries >= 8:
            msme.committed_borrower_flag = True
            db.add(msme)
            await db.commit()

        return {
            "status": "success",
            "msme_id": msme_id,
            "transcript": transcript,
            "sentiment": {
                "score": sentiment_score,
                "label": sentiment_label
            },
            "extracted": extracted,
            "total_weekly_entries": total_entries,
            "committed_borrower": msme.committed_borrower_flag
        }
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/voice-diary/{msme_id}")
async def get_diary_history(msme_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves the history of weekly voice check-ins for the MSME."""
    # Verify MSME
    msme_res = await db.execute(select(MSME).where(MSME.id == msme_id))
    msme = msme_res.scalars().first()
    if not msme:
        raise HTTPException(status_code=404, detail="MSME not found")

    result = await db.execute(
        select(VoiceDiaryEntry)
        .where(VoiceDiaryEntry.msme_id == msme_id)
        .order_by(VoiceDiaryEntry.entry_date.desc())
    )
    entries = result.scalars().all()

    history = []
    for e in entries:
        history.append({
            "id": e.id,
            "date": e.entry_date.date().isoformat(),
            "transcript": e.transcript,
            "customer_count": e.customer_count,
            "unexpected_expense": e.unexpected_expense,
            "pending_payments": e.pending_payments,
            "sentiment_score": e.sentiment_score,
            "sentiment_label": e.sentiment_label
        })

    return {
        "msme_id": msme_id,
        "committed_borrower": msme.committed_borrower_flag,
        "total_checkins": len(history),
        "history": history
    }
