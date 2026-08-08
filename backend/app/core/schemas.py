from enum import Enum
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class ClassificationLevel(str, Enum):
    PII = "pii"
    CONFIDENTIAL = "confidential"
    PUBLIC = "public"

class AuditStatus(str, Enum):
    OK = "OK"
    FLAGGED = "FLAGGED"

# Health Check Schemas
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    datahub_connected: bool
    datahub_url: str
    database_connected: bool

# User Schemas (Auth)
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    github_username: Optional[str] = None
    has_github_connected: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GitHubOAuthUrlResponse(BaseModel):
    url: str

class GitHubOAuthCallbackRequest(BaseModel):
    code: str

# Dataset Schemas
class DatasetSummary(BaseModel):
    urn: str
    name: str
    description: Optional[str] = None
    classification: ClassificationLevel = ClassificationLevel.PUBLIC
    owner: Optional[str] = None
    tags: List[str] = []
    has_governance_violation: bool = False

class DatasetDetailResponse(DatasetSummary):
    domain: Optional[str] = "Corporate Data Platform"
    platform: Optional[str] = "Snowflake / MySQL"
    last_modified: Optional[datetime] = None
    audit_notes: List[str] = []

class ClassificationUpdate(BaseModel):
    classification: ClassificationLevel

# Agent Schemas
class AgentBase(BaseModel):
    name: str
    declared_purpose: str
    allowed_classifications: List[ClassificationLevel]
    requires_approval: bool = False

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Access Event Schemas
class AccessEventRequest(BaseModel):
    agent_name: str
    dataset_name: str
    access_type: str = "read"
    is_approved: bool = False
    timestamp: Optional[datetime] = None

class AccessEventResult(BaseModel):
    id: int
    event_id: str
    timestamp: datetime
    agent_name: str
    dataset_name: str
    access_type: str
    dataset_classification: str
    dataset_owner: Optional[str] = None
    is_approved: bool
    status: AuditStatus
    violation_reason: Optional[str] = None
    datahub_written: bool = False
    github_issue_created: bool = False
    github_issue_url: Optional[str] = None
    github_notification_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
