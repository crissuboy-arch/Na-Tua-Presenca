from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.progress import UserProgress
from app.models.devotional import Devotional
from app.models.user import User
from app.schemas.schemas import ProgressUpdate, ProgressResponse, ProgressStats
from app.auth import get_current_user
from datetime import date, timedelta

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.post("", response_model=ProgressResponse)
def update_progress(data: ProgressUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.day == data.day,
        UserProgress.date == data.date
    ).first()
    if existing:
        existing.completed = int(data.completed)
        db.commit()
        db.refresh(existing)
        return ProgressResponse.model_validate(existing)
    entry = UserProgress(
        user_id=current_user.id,
        day=data.day,
        date=data.date,
        completed=int(data.completed)
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return ProgressResponse.model_validate(entry)

@router.get("/stats", response_model=ProgressStats)
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.completed == 1
    ).order_by(UserProgress.day.asc()).all()

    total_read = len(entries)
    total_devotionals = db.query(Devotional).count()
    percentage = round((total_read / total_devotionals * 100), 1) if total_devotionals else 0

    today = date.today()
    day_of_year = today.timetuple().tm_yday

    completed_days = set(e.day for e in entries)

    # current streak
    current_streak = 0
    check = today
    for _ in range(365):
        doy = check.timetuple().tm_yday
        if doy in completed_days:
            current_streak += 1
            check -= timedelta(days=1)
        else:
            break

    # longest streak
    longest = 0
    streak = 0
    for d in range(1, 366):
        if d in completed_days:
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 0

    return ProgressStats(
        total_read=total_read,
        current_streak=current_streak,
        longest_streak=longest,
        percentage=percentage,
        today_day=day_of_year
    )

@router.get("/calendar")
def get_calendar(year: int = None, month: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    entries = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).all()

    calendar_data = {}
    for e in entries:
        key = f"{e.date.year}-{e.date.month:02d}-{e.date.day:02d}"
        calendar_data[key] = {"day": e.day, "completed": bool(e.completed)}

    return calendar_data
