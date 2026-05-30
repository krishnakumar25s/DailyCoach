from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from typing import List
from datetime import date
from auth import require_user
from db.supabase_client import user_client
from schemas.log import LogIn, LogOut
from limiter import limiter

router = APIRouter()

def get_token(authorization: str = Header(...)) -> str:
    """Helper to extract token from Header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid token format"
        )
    return authorization.split(" ")[1]

@router.get("/", response_model=List[LogOut])
@limiter.limit("120/minute")
def get_logs(
    request: Request,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Retrieve the last 30 days of logs for the current user."""
    try:
        client = user_client(token)
        response = client.table("focus_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("date", desc=True) \
            .limit(30) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch logs: {str(e)}"
        )

@router.get("/{log_date}", response_model=LogOut)
@limiter.limit("120/minute")
def get_log_by_date(
    request: Request,
    log_date: date,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Retrieve a single log entry by date."""
    try:
        client = user_client(token)
        response = client.table("focus_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("date", str(log_date)) \
            .execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Focus log not found for this date"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch log: {str(e)}"
        )

@router.post("/", response_model=LogOut)
@limiter.limit("120/minute")
def upsert_log(
    request: Request,
    log_in: LogIn,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Create or update a log entry for a specific date."""
    try:
        client = user_client(token)
        log_data = log_in.model_dump()
        log_data["user_id"] = user_id
        log_data["date"] = str(log_in.date)

        response = client.table("focus_logs") \
            .upsert(log_data, on_conflict="user_id,date") \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save log entry: empty response"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save log entry: {str(e)}"
        )

@router.delete("/{id}")
@limiter.limit("120/minute")
def delete_log(
    request: Request,
    id: str,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Delete a log entry by ID."""
    try:
        client = user_client(token)
        response = client.table("focus_logs") \
            .delete() \
            .eq("id", id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Log entry deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete log entry: {str(e)}"
        )
