from fastapi import APIRouter, Depends, HTTPException, status, Header, Query, Request
from typing import List, Optional
from datetime import date, datetime, timezone
from auth import require_user
from db.supabase_client import user_client
from schemas.block import BlockIn, BlockOut, BlockUpdate
from routers.logs import get_token
from limiter import limiter

router = APIRouter()

@router.get("/", response_model=List[BlockOut])
@limiter.limit("120/minute")
def get_blocks(
    request: Request,
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Retrieve deep work blocks, optionally filtered by a planned_for date range."""
    try:
        client = user_client(token)
        query = client.table("deep_blocks") \
            .select("*") \
            .eq("user_id", user_id)
            
        if from_date:
            query = query.gte("planned_for", str(from_date))
        if to_date:
            query = query.lte("planned_for", str(to_date))
            
        response = query.order("planned_for", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch blocks: {str(e)}"
        )

@router.post("/", response_model=BlockOut)
@limiter.limit("120/minute")
def create_block(
    request: Request,
    block_in: BlockIn,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Create a new deep work block."""
    try:
        client = user_client(token)
        block_data = block_in.model_dump()
        block_data["user_id"] = user_id
        block_data["planned_for"] = str(block_in.planned_for)
        block_data["completed"] = False
        block_data["completed_at"] = None
        
        response = client.table("deep_blocks") \
            .insert(block_data) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create block: empty response"
            )
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create block: {str(e)}"
        )

@router.put("/{id}", response_model=BlockOut)
@limiter.limit("120/minute")
def update_block(
    request: Request,
    id: str,
    block_update: BlockUpdate,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Update progress and completion of a deep work block."""
    try:
        client = user_client(token)
        update_data = block_update.model_dump()
        
        # Set completion timestamp when completed state changes
        if block_update.completed:
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            update_data["completed_at"] = None
            
        response = client.table("deep_blocks") \
            .update(update_data) \
            .eq("id", id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Deep block not found or unauthorized"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update block: {str(e)}"
        )

@router.delete("/{id}")
@limiter.limit("120/minute")
def delete_block(
    request: Request,
    id: str,
    user_id: str = Depends(require_user),
    token: str = Depends(get_token)
):
    """Delete a deep work block by ID."""
    try:
        client = user_client(token)
        response = client.table("deep_blocks") \
            .delete() \
            .eq("id", id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Deep block deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete block: {str(e)}"
        )
