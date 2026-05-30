from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from typing import List
from auth import require_user
from db.supabase_client import user_client
from schemas.goal import GoalIn, GoalOut
from routers.logs import get_token
from limiter import limiter

router = APIRouter()

@router.get("/", response_model=List[GoalOut])
@limiter.limit("120/minute")
def get_goals(
    request: Request,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Retrieve all weekly goals for the current user, ordered by week descending."""
    try:
        client = user_client(token)
        response = client.table("focus_goals") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("week", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch goals: {str(e)}"
        )

@router.post("/", response_model=GoalOut)
@limiter.limit("120/minute")
def create_goal(
    request: Request,
    goal_in: GoalIn,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Create a new weekly focus goal."""
    try:
        client = user_client(token)
        goal_data = goal_in.model_dump()
        goal_data["user_id"] = user_id
        goal_data["week"] = str(goal_in.week)
        
        response = client.table("focus_goals") \
            .insert(goal_data) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create goal: empty response"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create goal: {str(e)}"
        )

@router.put("/{id}", response_model=GoalOut)
@limiter.limit("120/minute")
def update_goal(
    request: Request,
    id: str,
    goal_in: GoalIn,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Update an existing weekly focus goal."""
    try:
        client = user_client(token)
        goal_data = goal_in.model_dump()
        goal_data["user_id"] = user_id
        goal_data["week"] = str(goal_in.week)
        
        response = client.table("focus_goals") \
            .update(goal_data) \
            .eq("id", id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found or unauthorized"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update goal: {str(e)}"
        )

@router.delete("/{id}")
@limiter.limit("120/minute")
def delete_goal(
    request: Request,
    id: str,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Delete a focus goal by ID."""
    try:
        client = user_client(token)
        response = client.table("focus_goals") \
            .delete() \
            .eq("id", id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Goal deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete goal: {str(e)}"
        )
