import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base
from backend.routers import onboarding, stream, cohort, scoring, roadmap, voice, network, zk, signals, bank

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Automatically build tables in Postgres if they do not exist
    async with engine.begin() as conn:
        # Import all models to ensure they are registered with Base.metadata
        from backend.models.msme import MSME
        from backend.models.cohort import CohortArchetype
        from backend.models.assessment import Assessment, VoiceDiaryEntry, RoadmapAction, NetworkSnapshot
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully.")
    yield
    # Shutdown: Close connections if needed
    await engine.dispose()

app = FastAPI(
    title="CREDEX Credit Intelligence Platform API",
    description="Backend API for the CREDEX MSME credit assessment health card.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(onboarding.router)
app.include_router(stream.router)
app.include_router(cohort.router)
app.include_router(scoring.router)
app.include_router(roadmap.router)
app.include_router(voice.router)
app.include_router(network.router)
app.include_router(zk.router)
app.include_router(signals.router)
app.include_router(bank.router)

@app.get("/api/health")
async def health_check():
    """Simple application health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": os.popen("date /t").read().strip() or "2026-07-18" # simple cmd fallback
    }
