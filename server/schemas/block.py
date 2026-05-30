from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional

class BlockIn(BaseModel):
    planned_for: date
    task: str = Field(..., max_length=160, min_length=1)
    target_minutes: int = Field(..., ge=15, le=240)

class BlockUpdate(BaseModel):
    actual_minutes: Optional[int] = Field(None, ge=0, le=1440)
    completed: bool

class BlockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    planned_for: date
    task: str
    target_minutes: int
    actual_minutes: Optional[int] = None
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
