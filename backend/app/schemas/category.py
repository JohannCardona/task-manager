from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    owner_id: int

    model_config = {"from_attributes": True}
