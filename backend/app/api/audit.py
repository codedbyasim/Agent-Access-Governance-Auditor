import io
import csv
import json
import math
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc

from app.store.database import get_db
from app.store.models import UserModel, AuditLogModel
from app.core.schemas import AccessEventRequest, AccessEventResult
from app.core.auditor import evaluate_and_record_access_event
from app.core.auth_core import get_current_user_optional

router = APIRouter(prefix="/audit", tags=["Access Event Auditing Engine & Reporting"])

SAMPLE_SCENARIOS = [
    {
        "agent_name": "CustomerSupportBot",
        "dataset_name": "sales.quarterly_revenue_public",
        "access_type": "read",
        "is_approved": False
    },
    {
        "agent_name": "CustomerSupportBot",
        "dataset_name": "analytics.customer_pii",
        "access_type": "query",
        "is_approved": False
    },
    {
        "agent_name": "FinancialAnalystAgent",
        "dataset_name": "finance.payroll_transactions",
        "access_type": "export",
        "is_approved": False
    },
    {
        "agent_name": "UnknownScraperBot",
        "dataset_name": "healthcare.patient_records",
        "access_type": "read",
        "is_approved": False
    },
    {
        "agent_name": "DataGovernanceCheckerAgent",
        "dataset_name": "healthcare.patient_records",
        "access_type": "read",
        "is_approved": True
    }
]

@router.post("/evaluate", response_model=AccessEventResult, status_code=status.HTTP_201_CREATED)
def evaluate_event(
    payload: AccessEventRequest,
    current_user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Ingest and evaluate an AI agent dataset access event (FR-12 to FR-19).
    Checks DataHub catalog metadata and agent policies, flags violations, records violation reasons, and triggers write-back/notifications.
    """
    audit_log = evaluate_and_record_access_event(db, payload, current_user)
    return audit_log

@router.post("/simulate-batch", response_model=List[AccessEventResult])
def simulate_batch_scenarios(
    current_user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Run 5 pre-configured compliance scenarios to test compliant access, PII violation, approval violation, unknown agent, and public read.
    """
    results = []
    for sc in SAMPLE_SCENARIOS:
        req = AccessEventRequest(
            agent_name=sc["agent_name"],
            dataset_name=sc["dataset_name"],
            access_type=sc["access_type"],
            is_approved=sc["is_approved"]
        )
        res = evaluate_and_record_access_event(db, req, current_user)
        results.append(res)
    return results

def _build_audit_query(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    agent: Optional[str] = None,
    classification: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = db.query(AuditLogModel)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLogModel.agent_name.ilike(term),
                AuditLogModel.dataset_name.ilike(term),
                AuditLogModel.event_id.ilike(term),
                AuditLogModel.violation_reason.ilike(term)
            )
        )

    if status_filter and status_filter.upper() in ["OK", "FLAGGED"]:
        query = query.filter(AuditLogModel.status == status_filter.upper())

    if agent and agent.strip() and agent.lower() != "all":
        query = query.filter(AuditLogModel.agent_name.ilike(agent.strip()))

    if classification and classification.strip() and classification.lower() != "all":
        query = query.filter(AuditLogModel.dataset_classification.ilike(classification.strip()))

    if start_date and start_date.strip():
        try:
            dt = datetime.fromisoformat(start_date.strip())
            query = query.filter(AuditLogModel.timestamp >= dt)
        except Exception:
            pass

    if end_date and end_date.strip():
        try:
            dt = datetime.fromisoformat(end_date.strip())
            query = query.filter(AuditLogModel.timestamp <= dt)
        except Exception:
            pass

    return query.order_by(desc(AuditLogModel.timestamp))

@router.get("/logs")
def get_audit_logs(
    search: Optional[str] = Query(None, description="Search by agent, dataset, or event ID"),
    status: Optional[str] = Query(None, description="Filter by status (OK, FLAGGED, all)"),
    agent: Optional[str] = Query(None, description="Filter by specific agent name"),
    classification: Optional[str] = Query(None, description="Filter by dataset classification"),
    start_date: Optional[str] = Query(None, description="ISO Start Date"),
    end_date: Optional[str] = Query(None, description="ISO End Date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page (FR-32)")
, db: Session = Depends(get_db)):
    """
    Fetch persistent audit logs with multi-field search, filtering, and pagination (FR-28, FR-29, FR-32).
    """
    query = _build_audit_query(db, search, status, agent, classification, start_date, end_date)
    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [AccessEventResult.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/metrics")
def get_audit_metrics(db: Session = Depends(get_db)):
    """
    Calculates compliance summary KPI metrics (FR-31).
    """
    total = db.query(AuditLogModel).count()
    flagged = db.query(AuditLogModel).filter(AuditLogModel.status == "FLAGGED").count()
    compliant = total - flagged
    compliance_rate = round((compliant / total * 100), 1) if total > 0 else 100.0

    # Find top violating agent
    top_violating_agent_res = (
        db.query(AuditLogModel.agent_name, func.count(AuditLogModel.id).label("cnt"))
        .filter(AuditLogModel.status == "FLAGGED")
        .group_by(AuditLogModel.agent_name)
        .order_by(desc("cnt"))
        .first()
    )
    top_violating_agent = top_violating_agent_res[0] if top_violating_agent_res else "None"

    return {
        "total_events": total,
        "compliant_count": compliant,
        "flagged_count": flagged,
        "compliance_rate_percent": compliance_rate,
        "top_violating_agent": top_violating_agent
    }

@router.get("/export/csv")
def export_audit_logs_csv(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    agent: Optional[str] = Query(None),
    classification: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Exports filtered audit records as downloadable CSV (FR-30, FR-34).
    """
    query = _build_audit_query(db, search, status, agent, classification, start_date, end_date)
    logs = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Timestamp (UTC)", "Agent Name", "Dataset Name", "Access Type",
        "Classification", "Dataset Owner", "Is Approved", "Status", "Violation Reason",
        "DataHub Written", "GitHub Issue Created"
    ])

    for log in logs:
        writer.writerow([
            log.event_id,
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "",
            log.agent_name,
            log.dataset_name,
            log.access_type,
            log.dataset_classification,
            log.dataset_owner or "",
            log.is_approved,
            log.status,
            log.violation_reason or "",
            log.datahub_written,
            log.github_issue_created
        ])

    output.seek(0)
    filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/json")
def export_audit_logs_json(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    agent: Optional[str] = Query(None),
    classification: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Exports filtered audit records as downloadable JSON (FR-30, FR-34).
    """
    query = _build_audit_query(db, search, status, agent, classification, start_date, end_date)
    logs = query.all()

    serialized = [AccessEventResult.model_validate(log).model_dump(mode="json") for log in logs]
    json_bytes = json.dumps(serialized, indent=2).encode("utf-8")
    filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
