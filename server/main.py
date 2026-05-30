import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables before importing other modules
load_dotenv()

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from routers import logs, goals, blocks, ai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dailycoach.main")

app = FastAPI(title="DailyCoach API")

# Configure slowapi
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[client_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Custom security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response

# Include routers
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(blocks.router, prefix="/api/blocks", tags=["Blocks"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Exception handlers to prevent tracebacks from leaking
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Log validation details but return a clean JSON error response
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "Validation failed", "details": exc.errors()}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Server Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error"}
    )
