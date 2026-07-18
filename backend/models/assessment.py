import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(String, ForeignKey("msmes.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    cohort_percentile = Column(Float, nullable=False)
    momentum_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    
    dim_revenue_consistency = Column(Float, nullable=False)
    dim_cashflow_resilience = Column(Float, nullable=False)
    dim_epfo_discipline = Column(Float, nullable=False)
    dim_gst_regularity = Column(Float, nullable=False)
    dim_collection_velocity = Column(Float, nullable=False)
    dim_aa_consent = Column(Float, nullable=False)
    
    cash_buffer_days = Column(Float, nullable=False)
    collection_velocity_days = Column(Float, nullable=False)
    phantom_revenue_flag = Column(Boolean, default=False)
    recommended_limit = Column(Float, nullable=False)
    
    shap_values = Column(JSON, nullable=True)
    zk_proof_token = Column(String, nullable=True, index=True)
    
    drift_status = Column(String, nullable=True) # e.g. DRIFT_ALERT, NORMAL
    drift_type = Column(String, nullable=True)   # e.g. UPGRADE, STRESS, DIVERSIFICATION

    # Relationships
    msme = relationship("MSME", back_populates="assessments")

class VoiceDiaryEntry(Base):
    __tablename__ = "voice_diary_entries"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(String, ForeignKey("msmes.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_date = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = Column(String, nullable=False)
    customer_count = Column(Integer, nullable=True)
    unexpected_expense = Column(Boolean, default=False)
    pending_payments = Column(Boolean, default=False)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)

    # Relationships
    msme = relationship("MSME", back_populates="voice_diary_entries")

class RoadmapAction(Base):
    __tablename__ = "roadmap_actions"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(String, ForeignKey("msmes.id", ondelete="CASCADE"), nullable=False, index=True)
    action_text = Column(String, nullable=False)
    why_it_matters = Column(String, nullable=False)
    projected_score_delta = Column(String, nullable=False)
    projected_limit_delta = Column(String, nullable=False)
    timeline_days = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False)
    completed_date = Column(DateTime, nullable=True)

    # Relationships
    msme = relationship("MSME", back_populates="roadmap_actions")

class NetworkSnapshot(Base):
    __tablename__ = "network_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    msme_id = Column(String, ForeignKey("msmes.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    node_count = Column(Integer, nullable=False)
    edge_count = Column(Integer, nullable=False)
    in_degree_centrality = Column(Float, nullable=False)
    out_degree_centrality = Column(Float, nullable=False)
    customer_concentration = Column(Float, nullable=False)
    supplier_concentration = Column(Float, nullable=False)
    network_resilience_score = Column(Float, nullable=False)
    graph_data = Column(JSON, nullable=False)

    # Relationships
    msme = relationship("MSME", back_populates="network_snapshots")
