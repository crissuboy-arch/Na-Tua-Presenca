from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    completed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
