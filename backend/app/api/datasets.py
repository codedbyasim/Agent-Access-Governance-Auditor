from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status, Depends
from app.core.schemas import DatasetSummary, DatasetDetailResponse, ClassificationUpdate
from app.integrations.datahub_client import datahub_client
from app.core.auth_core import get_current_user
from app.store.models import UserModel

router = APIRouter(prefix="/datasets", tags=["Datasets Catalog"])

@router.get("", response_model=List[DatasetSummary])
def list_datasets(
    search: Optional[str] = Query(None, description="Search by name, description, owner, or tags"),
    classification: Optional[str] = Query("all", description="Filter by classification (all, pii, confidential, public)"),
    sort_by: str = Query("name", description="Sort by field (name, classification, owner)")
):
    """
    Fetch all cataloged datasets from DataHub with sorting and filtering (FR-1, FR-2).
    """
    return datahub_client.get_cataloged_datasets(
        search=search,
        classification=classification,
        sort_by=sort_by
    )

@router.post("/refresh", response_model=List[DatasetSummary])
def refresh_datasets():
    """
    On-demand refresh of dataset metadata from DataHub (FR-5).
    """
    datahub_client.test_connection()
    return datahub_client.get_cataloged_datasets()

@router.get("/{identifier}", response_model=DatasetDetailResponse)
def get_dataset_detail(identifier: str):
    """
    Fetch detail for a single dataset by name or DataHub URN (FR-3).
    """
    detail = datahub_client.get_dataset_detail(identifier)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{identifier}' was not found in DataHub catalog"
        )
    return detail

@router.post("/{identifier}/classification", response_model=DatasetDetailResponse)
def update_classification(
    identifier: str,
    payload: ClassificationUpdate,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Edit a dataset's classification tag, writing the change back to DataHub (FR-6). Protected route.
    """
    try:
        updated = datahub_client.update_dataset_classification(identifier, payload.classification)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update dataset classification: {e}"
        )

@router.post("/{identifier}/remediate", response_model=DatasetDetailResponse)
def remediate_dataset(
    identifier: str,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Removes the 'governance-risk' tag from DataHub after remediation (FR-22). Protected route.
    """
    try:
        officer_name = current_user.full_name or current_user.email
        remediated = datahub_client.remove_governance_risk_tag(identifier, resolved_by=officer_name)
        return remediated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remediate dataset risk tag: {e}"
        )
