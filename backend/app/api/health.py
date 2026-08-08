from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.core.schemas import HealthCheckResponse
from app.integrations.datahub_client import datahub_client
from app.store.database import get_db

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    """
    System Health Check endpoint (FR-39).
    Returns backend status, database status, and live DataHub connectivity.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    dh_ok = datahub_client.test_connection()

    return HealthCheckResponse(
        status="healthy" if (db_ok and dh_ok) else "degraded",
        version=settings.VERSION,
        timestamp=datetime.utcnow(),
        datahub_connected=dh_ok,
        datahub_url=settings.DATAHUB_GMS_URL,
        database_connected=db_ok
    )
