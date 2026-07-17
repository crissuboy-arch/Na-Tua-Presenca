from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.devotional import Devotional
from app.models.user import User
from app.schemas.schemas import DevotionalResponse, DevotionalListResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/devotionals", tags=["devotionals"])

@router.get("/today", response_model=DevotionalResponse)
def get_today(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date
    today = date.today()
    day_of_year = today.timetuple().tm_yday
    devo = db.query(Devotional).filter(Devotional.day == day_of_year).first()
    if not devo:
        raise HTTPException(status_code=404, detail="Devocional nao encontrado")
    return DevotionalResponse.model_validate(devo)

@router.get("/day/{day}", response_model=DevotionalResponse)
def get_by_day(day: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if day < 1 or day > 365:
        raise HTTPException(status_code=400, detail="Dia invalido (1-365)")
    devo = db.query(Devotional).filter(Devotional.day == day).first()
    if not devo:
        raise HTTPException(status_code=404, detail="Devocional nao encontrado")
    return DevotionalResponse.model_validate(devo)

@router.get("", response_model=DevotionalListResponse)
def list_devotionals(
    month: str = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Devotional)
    if month:
        query = query.filter(Devotional.month.ilike(f"%{month}%"))
    total = query.count()
    items = query.order_by(Devotional.day.asc()).offset((page - 1) * per_page).limit(per_page).all()
    return DevotionalListResponse(total=total, items=[DevotionalResponse.model_validate(d) for d in items])
