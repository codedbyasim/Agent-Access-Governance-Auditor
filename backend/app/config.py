import os
from typing import Any
from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Access Governance Auditor"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Server
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    CORS_ORIGINS: Any = ["http://localhost:3000", "http://localhost:5173"]
    
    # DataHub
    DATAHUB_GMS_URL: str = os.getenv("DATAHUB_GMS_URL", "http://localhost:8080")
    DATAHUB_TOKEN: str = os.getenv("DATAHUB_TOKEN", "")
    
    # Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-governance-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/github/callback")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./auditor.db")
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        if isinstance(v, list):
            return v
        return ["*"]

    model_config = ConfigDict(case_sensitive=True, extra="ignore")

settings = Settings()
