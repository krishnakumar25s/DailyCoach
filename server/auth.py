from fastapi import Header, HTTPException, status
from db.supabase_client import get_supabase

def require_user(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency to enforce authentication.
    Validates Bearer token against Supabase auth and returns the user's UUID string.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing or invalid token scheme"
        )
    
    token = authorization.split(" ")[1]
    try:
        supabase = get_supabase()
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid session"
            )
        return str(response.user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unauthorized: {str(e)}"
        )
