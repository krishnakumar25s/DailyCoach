from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import date, datetime
from typing import Optional

class LogIn(BaseModel):
    date: date
    sessions_count: int = Field(..., ge=0, le=20)
    focus_minutes: int = Field(..., ge=0, le=1440)
    energy: int = Field(..., ge=1, le=5)
    mit_done: bool = False
    top_distraction: Optional[str] = Field(None, max_length=80)
    notes: Optional[str] = None

    @field_validator('top_distraction')
    @classmethod
    def clean_distraction(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v

class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    date: date
    sessions_count: int
    focus_minutes: int
    energy: int
    mit_done: bool
    top_distraction: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
