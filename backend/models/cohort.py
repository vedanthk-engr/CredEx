from sqlalchemy import Column, Integer, String, JSON
from backend.database import Base

class CohortArchetype(Base):
    __tablename__ = "cohort_archetypes"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    nic_sector_group = Column(String, nullable=False)
    district_tier = Column(String, nullable=False)
    vintage_band = Column(String, nullable=False)
    workforce_band = Column(String, nullable=False)
    revenue_quartile = Column(Integer, nullable=False)
    member_count = Column(Integer, default=0)
    centroid_features = Column(JSON, nullable=True)
    model_path = Column(String, nullable=True)
