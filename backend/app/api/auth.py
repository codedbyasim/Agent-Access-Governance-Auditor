from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.store.database import get_db
from app.store.models import UserModel
from app.core.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    GitHubOAuthUrlResponse,
    GitHubOAuthCallbackRequest
)
from app.core.auth_core import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from app.integrations.github_client import github_oauth_client

router = APIRouter(prefix="/auth", tags=["Authentication & GitHub OAuth"])

def _build_user_response(user: UserModel) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        github_username=user.github_username,
        has_github_connected=bool(user.github_access_token),
        created_at=user.created_at
    )

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with hashed password and email validation (AGENTS §3.5).
    """
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    existing_user = db.query(UserModel).filter(UserModel.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    hashed_pwd = hash_password(payload.password)
    new_user = UserModel(
        email=payload.email.lower(),
        hashed_password=hashed_pwd,
        full_name=payload.full_name,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(user_id=new_user.id, email=new_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_response(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate email and password, issuing a JWT access token.
    """
    user = db.query(UserModel).filter(UserModel.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    token = create_access_token(user_id=user.id, email=user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_response(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserModel = Depends(get_current_user)):
    """
    Fetch authenticated user profile details. Protected route.
    """
    return _build_user_response(current_user)

@router.get("/github/url", response_model=GitHubOAuthUrlResponse)
def get_github_url():
    """
    Generates GitHub OAuth authorization redirect URL (AGENTS §3.5).
    """
    url = github_oauth_client.get_authorization_url()
    return GitHubOAuthUrlResponse(url=url)

@router.post("/github/callback", response_model=UserResponse)
def github_callback(
    payload: GitHubOAuthCallbackRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exchanges GitHub OAuth code for access token and links GitHub account to current user.
    """
    try:
        token = github_oauth_client.exchange_code_for_token(payload.code)
        profile = github_oauth_client.get_user_profile(token)
        
        current_user.github_access_token = token
        current_user.github_username = profile.get("login")
        db.commit()
        db.refresh(current_user)

        return _build_user_response(current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GitHub OAuth callback processing error: {e}"
        )

@router.post("/github/disconnect", response_model=UserResponse)
def github_disconnect(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlinks GitHub account from current user profile.
    """
    current_user.github_access_token = None
    current_user.github_username = None
    db.commit()
    db.refresh(current_user)

    return _build_user_response(current_user)
