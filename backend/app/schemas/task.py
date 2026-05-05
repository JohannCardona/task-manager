from datetime import datetime

from pydantic import BaseModel

from app.models.task import Priority, Recurrence
from app.schemas.subtask import SubtaskOut


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    deadline: datetime | None = None
    priority: Priority = Priority.medium
    recurrence: Recurrence = Recurrence.none
    category_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    is_completed: bool | None = None
    priority: Priority | None = None
    recurrence: Recurrence | None = None
    category_id: int | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None
    deadline: datetime | None
    is_completed: bool
    priority: Priority
    recurrence: Recurrence
    owner_id: int
    category_id: int | None
    position: int | None
    created_at: datetime
    updated_at: datetime
    subtasks: list[SubtaskOut] = []

    model_config = {"from_attributes": True}
