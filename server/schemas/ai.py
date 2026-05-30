from pydantic import BaseModel
from datetime import datetime

class CoachResponse(BaseModel):
    insight: str
    generated_at: datetime
