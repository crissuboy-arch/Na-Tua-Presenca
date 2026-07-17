from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.journal import JournalEntry
from app.models.user import User
from app.schemas.schemas import JournalCreate, JournalUpdate, JournalResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.post("", response_model=JournalResponse)
def create_entry(data: JournalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.day == data.day
    ).first()
    if existing:
        existing.content = data.content
        existing.is_public = int(data.is_public)
        db.commit()
        db.refresh(existing)
        return JournalResponse.model_validate(existing)
    entry = JournalEntry(
        user_id=current_user.id,
        day=data.day,
        content=data.content,
        is_public=int(data.is_public)
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return JournalResponse.model_validate(entry)

@router.get("/day/{day}", response_model=JournalResponse)
def get_entry(day: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.day == day
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada nao encontrada")
    return JournalResponse.model_validate(entry)

@router.get("")
def list_entries(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id)
    total = query.count()
    items = query.order_by(JournalEntry.day.asc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"total": total, "items": [JournalResponse.model_validate(e) for e in items]}

@router.put("/{entry_id}", response_model=JournalResponse)
def update_entry(entry_id: int, data: JournalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada nao encontrada")
    if data.content is not None:
        entry.content = data.content
    if data.is_public is not None:
        entry.is_public = int(data.is_public)
    db.commit()
    db.refresh(entry)
    return JournalResponse.model_validate(entry)

@router.delete("/{entry_id}")
def delete_entry(entry_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada nao encontrada")
    db.delete(entry)
    db.commit()
    return {"ok": True}
