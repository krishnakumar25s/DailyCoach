from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import date, datetime
from typing import Literal

MetricType = Literal['focus_minutes', 'sessions', 'energy_avg', 'mit_streak']

class GoalIn(BaseModel):
    metric: MetricType
    target: float = Field(..., ge=0.0)
    week: date

class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    metric: str
    target: float
    week: date
    created_at: datetime
