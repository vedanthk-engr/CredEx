import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class MSME(Base):
    __tablename__ = "msmes"

    id = Column(String, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    nic_code = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district_tier = Column(String, nullable=False)
    vintage_years = Column(Float, nullable=False)
    employee_count = Column(Integer, nullable=False)
    onboarding_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    aa_consent_granted = Column(Boolean, default=False)
    aa_consent_timestamp = Column(DateTime, nullable=True)
    
    cohort_id = Column(Integer, nullable=True, index=True)
    last_assessment_date = Column(DateTime, nullable=True)
    
    committed_borrower_flag = Column(Boolean, default=False)
    committed_to_improve_flag = Column(Boolean, default=False)

    # Ingested series & alternate data
    monthly_revenue_series = Column(String, nullable=True)
    upi_inflow_series = Column(String, nullable=True)
    epfo_contribution_series = Column(String, nullable=True)
    electricity_consumption_series = Column(String, nullable=True)
    skill_certificates = Column(String, nullable=True)
    whatsapp_active = Column(Boolean, default=False)
    ondc_seller = Column(Boolean, default=False)

    # Relationships
    assessments = relationship("Assessment", back_populates="msme", cascade="all, delete-orphan")
    voice_diary_entries = relationship("VoiceDiaryEntry", back_populates="msme", cascade="all, delete-orphan")
    roadmap_actions = relationship("RoadmapAction", back_populates="msme", cascade="all, delete-orphan")
    network_snapshots = relationship("NetworkSnapshot", back_populates="msme", cascade="all, delete-orphan")
