from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class PrayerRequest(Base):
    __tablename__ = "prayer_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Integer, default=0)
    is_answered = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
