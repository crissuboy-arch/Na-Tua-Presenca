from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Devotional(Base):
    __tablename__ = "devotionals"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(Integer, unique=True, nullable=False, index=True)
    month = Column(String, nullable=False)
    week = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    verse = Column(Text, default="")
    reference = Column(String, default="")
    reflection = Column(Text, default="")
    prayer = Column(Text, default="")
    challenge = Column(Text, default="")
    journal_prompt = Column(Text, default="")
