from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.prayer import PrayerRequest
from app.models.user import User
from app.schemas.schemas import PrayerCreate, PrayerUpdate, PrayerResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/prayers", tags=["prayers"])

@router.post("", response_model=PrayerResponse)
def create_prayer(data: PrayerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prayer = PrayerRequest(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        is_anonymous=int(data.is_anonymous)
    )
    db.add(prayer)
    db.commit()
    db.refresh(prayer)
    return PrayerResponse.model_validate(prayer)

@router.get("")
def list_prayers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    include_community: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if include_community:
        query = db.query(PrayerRequest).filter(PrayerRequest.is_anonymous == 1).order_by(PrayerRequest.created_at.desc())
    else:
        query = db.query(PrayerRequest).filter(PrayerRequest.user_id == current_user.id).order_by(PrayerRequest.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {"total": total, "items": [PrayerResponse.model_validate(p) for p in items]}

@router.get("/{prayer_id}", response_model=PrayerResponse)
def get_prayer(prayer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    if prayer.user_id != current_user.id and not prayer.is_anonymous:
        raise HTTPException(status_code=403, detail="Sem permissao")
    return PrayerResponse.model_validate(prayer)

@router.put("/{prayer_id}", response_model=PrayerResponse)
def update_prayer(prayer_id: int, data: PrayerUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id, PrayerRequest.user_id == current_user.id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    if data.title is not None:
        prayer.title = data.title
    if data.content is not None:
        prayer.content = data.content
    if data.is_anonymous is not None:
        prayer.is_anonymous = int(data.is_anonymous)
    if data.is_answered is not None:
        prayer.is_answered = int(data.is_answered)
    db.commit()
    db.refresh(prayer)
    return PrayerResponse.model_validate(prayer)

@router.delete("/{prayer_id}")
def delete_prayer(prayer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id, PrayerRequest.user_id == current_user.id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Pedido nao encontrado")
    db.delete(prayer)
    db.commit()
    return {"ok": True}
