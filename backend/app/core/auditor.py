import uuid
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.store.models import AgentModel, AuditLogModel, UserModel
from app.core.schemas import AccessEventRequest, AuditStatus
from app.core.policy import evaluate_access_policy
from app.integrations.datahub_client import datahub_client
from app.integrations.github_client import github_client

logger = logging.getLogger(__name__)

def evaluate_and_record_access_event(
    db: Session,
    event: AccessEventRequest,
    current_user: Optional[UserModel] = None
) -> AuditLogModel:
    """
    Evaluates an AI agent access event against DataHub catalog metadata and agent policies (FR-12 to FR-19).
    Persists evaluation audit log and executes write-back / notification triggers (FR-20 to FR-27).
    """
    event_timestamp = event.timestamp or datetime.utcnow()
    event_id = f"evt_{uuid.uuid4().hex[:10]}"

    # Step 1: Agent Registry Lookup (FR-19)
    agent = db.query(AgentModel).filter(AgentModel.name.ilike(event.agent_name.strip())).first()

    # Step 2: DataHub Dataset Metadata Lookup (FR-13)
    dataset = datahub_client.get_dataset_detail(event.dataset_name.strip())

    status = AuditStatus.OK
    violation_reason = None
    dataset_classification = "public"
    dataset_owner = None

    if dataset:
        dataset_classification = dataset.classification.value
        dataset_owner = dataset.owner

    # Policy Evaluation Logic
    if not agent:
        # Unknown Agent Violation (FR-19)
        status = AuditStatus.FLAGGED
        violation_reason = (
            f"Unknown Agent Violation (FR-19): AI Agent '{event.agent_name}' is not registered in the governance policy store. "
            f"Unregistered bots are forbidden from accessing cataloged data assets."
        )
    elif not dataset:
        # Uncataloged Dataset Violation
        status = AuditStatus.FLAGGED
        violation_reason = (
            f"Uncataloged Asset Violation: Target dataset '{event.dataset_name}' was not found in DataHub catalog."
        )
    else:
        # Policy Evaluation against DataHub metadata (FR-14, FR-15, FR-16, FR-17)
        status, violation_reason = evaluate_access_policy(
            agent_name=agent.name,
            agent_allowed_classifications=agent.allowed_classifications,
            agent_requires_approval=agent.requires_approval,
            dataset_name=dataset.name,
            dataset_classification=dataset.classification.value,
            is_approved=event.is_approved
        )

    datahub_written = False
    github_issue_created = False

    # Trigger Write-Back (Feature 5) and Notification (Feature 6) for FLAGGED events (FR-18, FR-24 to FR-27)
    if status == AuditStatus.FLAGGED and violation_reason:
        # 1. DataHub Write-Back (FR-20, FR-21)
        try:
            target_ds_identifier = dataset.name if dataset else event.dataset_name
            datahub_written = datahub_client.tag_governance_violation(
                identifier=target_ds_identifier,
                reason=violation_reason,
                agent_name=event.agent_name
            )
        except Exception as e:
            logger.warning(f"Failed to execute DataHub write-back for {event.dataset_name}: {e}")

        # 2. Automated GitHub Issue Notification (FR-24 to FR-27)
        try:
            event_payload = {
                "event_id": event_id,
                "agent_name": event.agent_name,
                "dataset_name": event.dataset_name,
                "access_type": event.access_type,
                "timestamp": event_timestamp.strftime("%Y-%m-%d %H:%M UTC"),
                "violation_reason": violation_reason
            }
            gh_res = github_client.create_governance_violation_issue(current_user, event_payload)
            if gh_res.get("status") == "posted":
                github_issue_created = True
        except Exception as e:
            logger.warning(f"Failed to create GitHub Issue notification: {e}")

    # Persist Audit Log Entry in SQLite DB
    audit_log = AuditLogModel(
        event_id=event_id,
        timestamp=event_timestamp,
        agent_name=event.agent_name,
        dataset_name=event.dataset_name,
        access_type=event.access_type,
        dataset_classification=dataset_classification,
        dataset_owner=dataset_owner,
        is_approved=event.is_approved,
        status=status,
        violation_reason=violation_reason,
        datahub_written=datahub_written,
        github_issue_created=github_issue_created
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log
