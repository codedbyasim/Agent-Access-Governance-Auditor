from typing import List, Tuple, Optional
from app.core.schemas import ClassificationLevel, AuditStatus

VALID_CLASSIFICATIONS = {c.value for c in ClassificationLevel}

def validate_agent_policy(allowed_classifications: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Validates that an agent policy references at least one valid classification value (FR-10).
    Returns (is_valid, error_message).
    """
    if not allowed_classifications:
        return False, "Agent policy must specify at least one allowed classification level (pii, confidential, public)."
    
    invalid = [c for c in allowed_classifications if c.lower() not in VALID_CLASSIFICATIONS]
    if invalid:
        return False, f"Invalid classification level(s): {', '.join(invalid)}. Must be one of: pii, confidential, public."
    
    return True, None

def evaluate_access_policy(
    agent_name: str,
    agent_allowed_classifications: List[str],
    agent_requires_approval: bool,
    dataset_name: str,
    dataset_classification: str,
    is_approved: bool
) -> Tuple[AuditStatus, Optional[str]]:
    """
    Framework-independent core audit policy check engine (SRS §3.3, NFR-8).
    Evaluates whether an agent access event complies with governance policy.
    
    Returns (status, violation_reason).
    """
    target_class = dataset_classification.lower().strip()
    allowed_set = {c.lower() for c in agent_allowed_classifications}

    # Policy Check 1: Allowed classification level check
    if target_class not in allowed_set:
        reason = (
            f"Agent '{agent_name}' policy permits access to [{', '.join(sorted(allowed_set))}], "
            f"but attempted to access dataset '{dataset_name}' classified as [{target_class.upper()}]."
        )
        return AuditStatus.FLAGGED, reason

    # Policy Check 2: Mandatory approval check if flag is set on agent policy
    if agent_requires_approval and not is_approved:
        reason = (
            f"Agent '{agent_name}' policy mandates prior approval for data access, "
            f"but access to dataset '{dataset_name}' was unapproved."
        )
        return AuditStatus.FLAGGED, reason

    return AuditStatus.OK, None
