from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from datetime import datetime, timezone
from auth import require_user
from db.supabase_client import user_client
from schemas.ai import CoachResponse
from routers.logs import get_token
from services.claude_service import get_coach_insights
from limiter import limiter

router = APIRouter()

@router.post("/analyze", response_model=CoachResponse)
@limiter.limit("10/minute")
def analyze_deep_work(
    request: Request,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Retrieve the last 7 daily focus logs and generate coaching insights."""
    try:
        client = user_client(token)
        
        # Fetch last 7 daily focus logs ordered by date descending
        response = client.table("focus_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("date", desc=True) \
            .limit(7) \
            .execute()
            
        logs = response.data or []
        
        # Pass logs in chronological order (oldest first)
        chronological_logs = list(reversed(logs))
        
        # Generate feedback
        insight = get_coach_insights(chronological_logs)
        
        return CoachResponse(
            insight=insight,
            generated_at=datetime.now(timezone.utc)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate coaching feedback: {str(e)}"
        )
