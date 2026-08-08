import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from app.store.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    github_username = Column(String, nullable=True)
    github_access_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentModel(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    declared_purpose = Column(Text, nullable=False)
    allowed_classifications = Column(JSON, nullable=False)  # e.g. ["public", "confidential"]
    requires_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    agent_name = Column(String, index=True, nullable=False)
    dataset_name = Column(String, index=True, nullable=False)
    access_type = Column(String, default="read")
    dataset_classification = Column(String, nullable=False)
    dataset_owner = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    status = Column(String, nullable=False, index=True)  # "OK" or "FLAGGED"
    violation_reason = Column(Text, nullable=True)
    datahub_written = Column(Boolean, default=False)
    github_issue_created = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
