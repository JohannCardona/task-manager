from datetime import datetime

from pydantic import BaseModel


class SubtaskCreate(BaseModel):
    title: str


class SubtaskUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None


class SubtaskOut(BaseModel):
    id: int
    task_id: int
    title: str
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
