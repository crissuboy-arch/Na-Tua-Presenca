from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DevotionalResponse(BaseModel):
    id: int
    day: int
    month: str
    week: int
    title: str
    verse: str
    reference: str
    reflection: str
    prayer: str
    challenge: str
    journal_prompt: str

    model_config = {"from_attributes": True}

class DevotionalListResponse(BaseModel):
    total: int
    items: list[DevotionalResponse]

class JournalCreate(BaseModel):
    day: int
    content: str
    is_public: bool = False

class JournalUpdate(BaseModel):
    content: Optional[str] = None
    is_public: Optional[bool] = None

class JournalResponse(BaseModel):
    id: int
    user_id: int
    day: int
    content: str
    is_public: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class PrayerCreate(BaseModel):
    title: str
    content: str
    is_anonymous: bool = False

class PrayerUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_anonymous: Optional[bool] = None
    is_answered: Optional[bool] = None

class PrayerResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    is_anonymous: bool
    is_answered: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class ProgressUpdate(BaseModel):
    day: int
    date: date
    completed: bool = True

class ProgressResponse(BaseModel):
    id: int
    user_id: int
    day: int
    date: date
    completed: bool

    model_config = {"from_attributes": True}

class ProgressStats(BaseModel):
    total_read: int
    current_streak: int
    longest_streak: int
    percentage: float
    today_day: int
