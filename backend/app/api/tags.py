from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagOut

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=list[TagOut])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Tag]:
    return db.query(Tag).filter(Tag.owner_id == current_user.id).order_by(Tag.name).all()
