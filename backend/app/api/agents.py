from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.store.database import get_db
from app.store.models import AgentModel, UserModel
from app.core.schemas import AgentCreate, AgentResponse, ClassificationLevel
from app.core.policy import validate_agent_policy
from app.core.auth_core import get_current_user

router = APIRouter(prefix="/agents", tags=["Agent Registry & Policies"])

DEFAULT_AGENTS = [
    {
        "name": "CustomerSupportBot",
        "declared_purpose": "Resolves customer billing inquiries and support tickets.",
        "allowed_classifications": ["public", "confidential"],
        "requires_approval": False
    },
    {
        "name": "FinancialAnalystAgent",
        "declared_purpose": "Generates quarterly financial forecasting reports and ledger metrics.",
        "allowed_classifications": ["public", "confidential"],
        "requires_approval": True
    },
    {
        "name": "ResearchAssistantAgent",
        "declared_purpose": "Queries public research data and anonymized website telemetry.",
        "allowed_classifications": ["public"],
        "requires_approval": False
    },
    {
        "name": "MarketingOptimizerAgent",
        "declared_purpose": "Analyzes ad campaign attribution and customer conversion rates.",
        "allowed_classifications": ["public"],
        "requires_approval": False
    },
    {
        "name": "DataGovernanceCheckerAgent",
        "declared_purpose": "Scans data catalog for regulatory compliance compliance tags and PII exposure.",
        "allowed_classifications": ["public", "confidential", "pii"],
        "requires_approval": False
    }
]

def _seed_default_agents_if_empty(db: Session):
    count = db.query(AgentModel).count()
    if count == 0:
        for agent_data in DEFAULT_AGENTS:
            agent = AgentModel(
                name=agent_data["name"],
                declared_purpose=agent_data["declared_purpose"],
                allowed_classifications=agent_data["allowed_classifications"],
                requires_approval=agent_data["requires_approval"]
            )
            db.add(agent)
        db.commit()

@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    """
    List all registered AI agents and their governance policies (FR-7, FR-8).
    """
    _seed_default_agents_if_empty(db)
    agents = db.query(AgentModel).order_by(AgentModel.name.asc()).all()
    return agents

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def register_agent(
    payload: AgentCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a new AI agent and declare allowed classification policies (FR-7, FR-9). Protected route.
    Validates that at least one valid classification is specified (FR-10).
    """
    # Policy validation (FR-10)
    is_valid, err_msg = validate_agent_policy([c.value for c in payload.allowed_classifications])
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )
    
    # Check duplicate agent name
    existing = db.query(AgentModel).filter(AgentModel.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An AI agent named '{payload.name}' is already registered in the policy store"
        )
    
    agent = AgentModel(
        name=payload.name.strip(),
        declared_purpose=payload.declared_purpose.strip(),
        allowed_classifications=[c.value for c in payload.allowed_classifications],
        requires_approval=payload.requires_approval
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent_detail(agent_id: int, db: Session = Depends(get_db)):
    """
    Fetch single agent policy details by ID.
    """
    agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent ID {agent_id} not found in policy registry"
        )
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent_policy(
    agent_id: int,
    payload: AgentCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Edit an existing agent policy (FR-9). Protected route.
    """
    agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent ID {agent_id} not found in policy registry"
        )
    
    # Policy validation (FR-10)
    is_valid, err_msg = validate_agent_policy([c.value for c in payload.allowed_classifications])
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )

    # Name uniqueness check if changed
    if payload.name.strip().lower() != agent.name.lower():
        existing = db.query(AgentModel).filter(AgentModel.name.ilike(payload.name.strip())).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An AI agent named '{payload.name}' already exists"
            )
    
    agent.name = payload.name.strip()
    agent.declared_purpose = payload.declared_purpose.strip()
    agent.allowed_classifications = [c.value for c in payload.allowed_classifications]
    agent.requires_approval = payload.requires_approval

    db.commit()
    db.refresh(agent)
    return agent

@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an agent policy entry from the registry (FR-9). Protected route.
    """
    agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent ID {agent_id} not found in policy registry"
        )
    db.delete(agent)
    db.commit()
    return None
