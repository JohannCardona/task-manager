from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.subtask import Subtask
from app.models.user import User
from app.schemas.subtask import SubtaskCreate, SubtaskOut, SubtaskUpdate
from app.api._utils import get_owned_task

router = APIRouter(prefix="/tasks/{task_id}/subtasks", tags=["subtasks"])


@router.post("/", response_model=SubtaskOut, status_code=status.HTTP_201_CREATED)
def create_subtask(
    task_id: int,
    payload: SubtaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Subtask:
    get_owned_task(task_id, current_user, db)
    subtask = Subtask(task_id=task_id, title=payload.title)
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


@router.patch("/{subtask_id}", response_model=SubtaskOut)
def update_subtask(
    task_id: int,
    subtask_id: int,
    payload: SubtaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Subtask:
    get_owned_task(task_id, current_user, db)
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task_id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subtask, field, value)

    db.commit()
    db.refresh(subtask)
    return subtask


@router.delete("/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    get_owned_task(task_id, current_user, db)
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task_id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    db.delete(subtask)
    db.commit()
